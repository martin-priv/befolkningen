/**
 * ViewportCanvas: Fullskärms Ocean av Människor med Mjuka Ringvågor (Ripples) & Individinspektion
 */
class ViewportCanvas {
    constructor(containerId, onPersonClick) {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.onPersonClick = onPersonClick;

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Viewport Världsmått
        this.worldWidth = 36.0;
        this.worldHeight = 36.0 * (this.height / this.width);

        // Pärlsystemet (10,6 miljoner representerade genom mikropartiklar: 1 pärla = 100 personer)
        this.maxBeads = 130000;
        this.activeBeadCount = 0;
        this.beadsMesh = null;
        this.beadsGeometry = null;
        this.beadsMaterial = null;

        // Arrayer för positioner och hempositioner (för mjuk fjäderfysik)
        this.positions = null;
        this.homePositions = null;
        this.velocities = null;
        this.colors = null;
        this.ages = null;
        this.sexes = null;
        this.origins = null; // 0 = inrikes född (Sverige), 1 = utrikes född

        // Ringvågor (Ripples) - Inga tomma hål, bara mjuka vågor!
        this.ripples = [];
        this.lastRippleX = -9999;
        this.lastRippleY = -9999;

        // Vald person (markörring) & dragbar probe
        this.selectionRing = null;
        this.selectedBeadIndex = -1;
        this.isDraggingProbe = false;

        // Fallande pärlor (födslar & invandrare)
        this.fallingBeads = [];
        // Lämnande pärlor (dödsfall & utvandrare)
        this.departingBeads = [];

        // Visningsläge / Formation: 'sea' (standard) | 'pyramid' | 'urban_rural' | 'origin'
        this.currentViewMode = 'sea';
        this.isFirstInit = true;
        this.previousActiveBeadCount = 0;
        this.getYearStats = null;
        this.getOriginStats = null;
        this.getForeignRatioForAge = null;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();

        const aspect = this.width / this.height;
        if (aspect >= 1.0) {
            this.worldHeight = 34.0;
            this.worldWidth = 34.0 * aspect;
        } else {
            // Porträttläge (mobil): garantera minst 28.0 bredd så pärlorna inte klumpas ihop
            this.worldWidth = 28.0;
            this.worldHeight = this.worldWidth / aspect;
        }

        this.camera = new THREE.OrthographicCamera(
            -this.worldWidth / 2, this.worldWidth / 2,
            this.worldHeight / 2, -this.worldHeight / 2,
            0.1, 100
        );
        this.camera.position.set(0, 0, 20);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.initBeadSystem();
        this.updatePointSize();
        this.initSelectionRing();
        this.setupEventListeners();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.70);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(10, 15, 25);
        this.scene.add(dirLight);
    }

    initSelectionRing() {
        // High-Contrast Precision Reticle: Skarp, färgstark sökare med mörk kontrastskugga som syns mot ALLA pärlor
        this.selectionReticle = new THREE.Group();
        this.selectionReticle.position.z = 1.2;
        this.selectionReticle.visible = false;

        // 1. Mjuk mörk fokus-vignette bakom pärlan (dämpar visuellt brus från intilliggande pärlor och lyfter fram vald individ)
        const darkDiscGeo = new THREE.CircleGeometry(0.50, 32);
        const darkDiscMat = new THREE.MeshBasicMaterial({
            color: 0x050811,
            transparent: true,
            opacity: 0.55,
            depthWrite: false
        });
        this.reticleBackdrop = new THREE.Mesh(darkDiscGeo, darkDiscMat);
        this.reticleBackdrop.position.z = -0.05;
        this.selectionReticle.add(this.reticleBackdrop);

        // 2. Varm gyllene ljusaura (Glow Halo)
        if (!this.glowTexture) {
            this.glowTexture = this.createGlowTexture();
        }
        const haloMat = new THREE.SpriteMaterial({
            map: this.glowTexture,
            color: 0xffaa00, // Varm bärnstensglöd
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.70,
            depthWrite: false
        });
        this.reticleAura = new THREE.Sprite(haloMat);
        this.reticleAura.scale.set(1.40, 1.40, 1.0);
        this.reticleAura.position.z = -0.02;
        this.selectionReticle.add(this.reticleAura);

        // 3. Mörk kontrastring under huvudringen (Drop shadow outline för 100% kontrast mot ljusa pärlor)
        const shadowRingGeo = new THREE.RingGeometry(0.205, 0.325, 48);
        const shadowRingMat = new THREE.MeshBasicMaterial({
            color: 0x03060a,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            depthWrite: false
        });
        this.reticleShadow = new THREE.Mesh(shadowRingGeo, shadowRingMat);
        this.reticleShadow.position.z = 0.0;
        this.selectionReticle.add(this.reticleShadow);

        // 4. Skarp, färgstark precisionsring (Stark Elektrisk Solgul / Guld)
        const ringGeo = new THREE.RingGeometry(0.235, 0.295, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffd000, // Stark intensiv guldgul
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        this.reticleRing = new THREE.Mesh(ringGeo, ringMat);
        this.reticleRing.position.z = 0.02;
        this.selectionReticle.add(this.reticleRing);

        // 5. Krispig inre vit highlight-kärna
        const innerGeo = new THREE.RingGeometry(0.255, 0.275, 48);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        this.reticleCore = new THREE.Mesh(innerGeo, innerMat);
        this.reticleCore.position.z = 0.03;
        this.selectionReticle.add(this.reticleCore);

        // 6. Fasta, tydliga hårkors-hakar (Crosshair ticks) med mörk skuggkontur
        this.reticleTicks = new THREE.Group();
        this.reticleTicks.position.z = 0.04;

        const tickConfigs = [
            { x: 0, y: 0.38, rot: 0 },          // Topp
            { x: 0, y: -0.38, rot: 0 },         // Botten
            { x: -0.38, y: 0, rot: Math.PI / 2 },// Vänster
            { x: 0.38, y: 0, rot: Math.PI / 2 }  // Höger
        ];

        const tickShadowGeo = new THREE.PlaneGeometry(0.075, 0.17);
        const tickShadowMat = new THREE.MeshBasicMaterial({ color: 0x03060a, transparent: true, opacity: 0.88, depthWrite: false });

        const tickBrightGeo = new THREE.PlaneGeometry(0.04, 0.14);
        const tickBrightMat = new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 1.0, depthWrite: false });

        const tickCoreGeo = new THREE.PlaneGeometry(0.018, 0.11);
        const tickCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });

        for (const cfg of tickConfigs) {
            const tGroup = new THREE.Group();
            tGroup.position.set(cfg.x, cfg.y, 0);
            tGroup.rotation.z = cfg.rot;

            const sMesh = new THREE.Mesh(tickShadowGeo, tickShadowMat);
            sMesh.position.z = -0.01;
            tGroup.add(sMesh);

            const bMesh = new THREE.Mesh(tickBrightGeo, tickBrightMat);
            bMesh.position.z = 0.0;
            tGroup.add(bMesh);

            const cMesh = new THREE.Mesh(tickCoreGeo, tickCoreMat);
            cMesh.position.z = 0.01;
            tGroup.add(cMesh);

            this.reticleTicks.add(tGroup);
        }
        this.selectionReticle.add(this.reticleTicks);

        this.selectionRing = this.selectionReticle;
        this.scene.add(this.selectionReticle);
    }

    setSelectedBead(index) {
        this.selectedBeadIndex = index;
        if (index >= 0 && index < this.activeBeadCount) {
            const x = this.positions[index * 3];
            const y = this.positions[index * 3 + 1];
            this.selectionReticle.position.set(x, y, 1.2);
            this.selectionReticle.visible = true;
        } else {
            this.selectionReticle.visible = false;
        }
    }

    initBeadSystem() {
        const count = this.maxBeads;
        this.positions = new Float32Array(count * 3);
        this.homePositions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        this.colors = new Float32Array(count * 3);
        this.ages = new Float32Array(count);
        this.sexes = new Uint8Array(count);
        this.origins = new Uint8Array(count);

        this.beadsGeometry = new THREE.BufferGeometry();
        this.beadsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.beadsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.beadsGeometry.setAttribute('age', new THREE.BufferAttribute(this.ages, 1));

        const vertexShader = `
            attribute float age;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAge;
            uniform float uHighlightAge;
            uniform float uPointSize;
            uniform float uTime;

            void main() {
                vColor = color;
                vAge = age;

                float baseSize = uPointSize;
                if (uHighlightAge >= 0.0) {
                    if (abs(age - uHighlightAge) <= 0.8) {
                        baseSize = uPointSize * 1.7;
                    }
                }
                gl_PointSize = baseSize;

                // Levande organisk mikroandning på GPU (myllret andas och rör sig mjukt)
                vec3 pos = position;
                float t = uTime * 0.75;
                float driftX = sin(t + position.y * 1.3 + position.x * 0.6) * 0.046;
                float driftY = cos(t * 0.6 + position.x * 1.1 + position.y * 0.8) * 0.034;
                pos.x += driftX;
                pos.y += driftY;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vAge;
            uniform float uHighlightAge;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float distSq = dot(coord, coord);
                if (distSq > 0.25) discard;

                float z = sqrt(0.25 - distSq);
                vec3 normal = normalize(vec3(coord.x, -coord.y, z));

                vec3 lightDir = normalize(vec3(0.4, 0.7, 0.6));
                float diff = max(dot(normal, lightDir), 0.0);

                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                vec3 halfVector = normalize(lightDir + viewDir);
                float spec = pow(max(dot(normal, halfVector), 0.0), 32.0);

                // Mjuk kantglans (rim) som definierar pärlans runda kontur mot bakgrunden
                float rim = pow(1.0 - z * 2.0, 1.8);
                
                // Diffus och ambient belysning: säkerställ att sfärens kropp ALLTID syns med samma storlek!
                vec3 ambient = vColor * 0.50 + vec3(0.04, 0.045, 0.06);
                vec3 diffuse = vColor * diff * 0.65;
                vec3 specular = vec3(1.0) * spec * 0.70;
                vec3 rimLight = mix(vColor, vec3(0.35, 0.45, 0.55), 0.4) * rim * 0.45;

                vec3 finalColor = ambient + diffuse + specular + rimLight;

                if (uHighlightAge >= 0.0) {
                    if (abs(vAge - uHighlightAge) <= 0.8) {
                        finalColor = mix(vColor, vec3(1.0), 0.4) * 1.8 + vec3(0.9) * spec;
                    } else {
                        finalColor *= 0.22;
                    }
                }

                gl_FragColor = vec4(finalColor, 0.98);
            }
        `;

        const isMobileInit = this.width < 640 || (this.width / this.height) < 0.8;
        this.beadsMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uHighlightAge: { value: -1.0 },
                uPointSize: { value: isMobileInit ? 5.8 : 8.8 },
                uTime: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false
        });

        this.beadsMesh = new THREE.Points(this.beadsGeometry, this.beadsMaterial);
        this.scene.add(this.beadsMesh);
    }

    getBeadColor(age, index) {
        const candyPalette = [
            [1.00, 0.22, 0.56], // Neon Korallrosa
            [0.00, 0.96, 0.88], // Elektrisk Cyan
            [1.00, 0.88, 0.15], // Solgul
            [0.72, 0.35, 1.00], // Neonviolett
            [0.12, 0.95, 0.45], // Limegrön
            [1.00, 0.50, 0.18], // Clementin
            [0.08, 0.68, 1.00], // Himmelsblå
            [0.98, 0.26, 0.36]  // Hallonröd
        ];

        const base = candyPalette[index % candyPalette.length];
        const a = Math.max(0, Math.min(105, age));

        // KONTINUERLIG LUMINISCENS & FÄRGSKALA
        // Alla pärlor behåller exakt samma fysiska och visuella storlek!
        // 0-12 år: 100% luminiscens, maximal godislyster
        // 13-28 år: 85% luminiscens, klara krispiga ädelstenar
        // 29-55 år: 65% luminiscens, djup bärnsten och juveler
        // 56-75 år: 48% luminiscens, rökig kvarts och mörk brons
        // 76-105+ år: 32% luminiscens, skimrande mörk pärla / hematit / obsidian
        let brightness, saturation;
        if (a <= 12) {
            brightness = 1.0;
            saturation = 1.0;
        } else if (a <= 28) {
            const t = (a - 12) / 16.0;
            brightness = 1.0 - t * 0.15; // 1.0 -> 0.85
            saturation = 1.0 - t * 0.10;
        } else if (a <= 55) {
            const t = (a - 28) / 27.0;
            brightness = 0.85 - t * 0.22; // 0.85 -> 0.63
            saturation = 0.90 - t * 0.25; // 0.90 -> 0.65
        } else if (a <= 78) {
            const t = (a - 55) / 23.0;
            brightness = 0.63 - t * 0.18; // 0.63 -> 0.45
            saturation = 0.65 - t * 0.35; // 0.65 -> 0.30
        } else {
            const t = (a - 78) / 27.0;
            brightness = 0.45 - t * 0.15; // 0.45 -> 0.30 (Alltid synlig pärlkropp!)
            saturation = 0.30 - t * 0.20; // 0.30 -> 0.10
        }

        // Basfärg för den äldsta mörka pärlan: elegant sval skiffer/grafit/tahitisk pärla
        const slatePearl = [0.24, 0.26, 0.32];
        const r = (base[0] * saturation + slatePearl[0] * (1.0 - saturation)) * brightness;
        const g = (base[1] * saturation + slatePearl[1] * (1.0 - saturation)) * brightness;
        const b = (base[2] * saturation + slatePearl[2] * (1.0 - saturation)) * brightness;

        return [r, g, b];
    }

    /**
     * VÄXLA FORMATION / VISNINGSLÄGE
     * Skapar en svepande expansionsvåg som låter pärlorna svärma till sin nya form
     */
    setViewMode(mode) {
        if (this.currentViewMode === mode) return;
        this.currentViewMode = mode;
        this.createRipple(0, 0, 0.70, 0.42, 28.0);
        if (this.lastPopData) {
            this.updateFromPopulation(this.lastPopData);
        }
    }

    /**
     * TILLDELA MÅLPOSITION FÖR PÄRLA
     * Mjuka övergångar: befintliga pärlor flyter, nya pärlor glider in från toppen
     */
    setBeadTarget(beadIndex, x, y, age, sex, origin = 0) {
        const i3 = beadIndex * 3;

        this.homePositions[i3] = x;
        this.homePositions[i3 + 1] = y;
        this.homePositions[i3 + 2] = 0;

        if (this.isFirstInit) {
            this.positions[i3] = x;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = 0;
            this.velocities[i3] = 0;
            this.velocities[i3 + 1] = 0;
            this.velocities[i3 + 2] = 0;
        } else if (beadIndex >= this.previousActiveBeadCount) {
            // Nya pärlor som tillkommer vid befolkningstillväxt
            this.positions[i3] = x + (Math.random() - 0.5) * 2.0;
            this.positions[i3 + 1] = this.currentSurfaceY + Math.random() * 3.5;
            this.positions[i3 + 2] = 0;
            this.velocities[i3] = 0;
            this.velocities[i3 + 1] = -0.12;
            this.velocities[i3 + 2] = 0;
        }

        const col = this.getBeadColor(age, beadIndex);
        this.colors[i3] = col[0];
        this.colors[i3 + 1] = col[1];
        this.colors[i3 + 2] = col[2];

        this.ages[beadIndex] = age;
        this.sexes[beadIndex] = sex;
        if (this.origins) {
            this.origins[beadIndex] = origin;
        }
    }

    /**
     * FORMATION 1: HAVET / BURKEN (Standard)
     * Samlad befolkning fyller skärmen från botten till ytan med åldersgradient
     */
    layoutSea(popData, halfW, fillHeight) {
        const total = popData.total;
        let beadIndex = 0;
        let currentY = this.botY;

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const menCount = cohort[0];
            const womenCount = cohort[1];
            const cohortTotal = menCount + womenCount;
            if (cohortTotal <= 0) continue;

            const cohortFraction = cohortTotal / total;
            const countForAge = Math.max(1, Math.round(cohortTotal / 100));
            const bandHeight = cohortFraction * fillHeight;
            const centerBandY = currentY + (bandHeight * 0.5);

            for (let i = 0; i < countForAge && beadIndex < this.maxBeads; i++) {
                const x = (Math.random() - 0.5) * 2.0 * halfW;
                const disp = (Math.random() - 0.5) * Math.max(0.25, bandHeight * 0.95);
                const y = Math.max(this.botY, Math.min(this.currentSurfaceY, centerBandY + disp));

                this.setBeadTarget(beadIndex, x, y, age, (Math.random() < (menCount / cohortTotal)) ? 1 : 2);
                beadIndex++;
            }

            currentY += bandHeight;
        }

        this.activeBeadCount = beadIndex;
    }

    /**
     * FORMATION 2: BEFOLKNINGSPYRAMIDEN (Demografins klassiker)
     * Män till vänster, kvinnor till höger, ålder 0-100 vertikalt
     */
    layoutPyramid(popData, halfW, fillHeight) {
        let beadIndex = 0;
        const pyramidH = this.worldHeight * 0.74;
        const yBottom = this.botY + 0.5;

        // Max storlek per sida (en årskull män eller kvinnor har som mest ca 75 000 = 750 pärlor)
        const maxCohortSide = 720;
        const widthScale = (halfW * 0.82) / maxCohortSide;

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const menCount = cohort[0];
            const womenCount = cohort[1];
            const cohortTotal = menCount + womenCount;
            if (cohortTotal <= 0) continue;

            const menBeads = Math.round(menCount / 100);
            const womenBeads = Math.round(womenCount / 100);

            const yBase = yBottom + (Math.min(100, age) / 100.0) * pyramidH;

            // Män: Horisontell spridning åt vänster från mittlinjen (x < 0)
            for (let i = 0; i < menBeads && beadIndex < this.maxBeads; i++) {
                const dist = 0.28 + i * widthScale;
                const jitter = (Math.sin(i * 3.7 + age * 1.3) * 0.08);
                const x = -dist;
                const y = yBase + jitter;

                this.setBeadTarget(beadIndex, x, y, age, 1);
                beadIndex++;
            }

            // Kvinnor: Horisontell spridning åt höger från mittlinjen (x > 0)
            for (let i = 0; i < womenBeads && beadIndex < this.maxBeads; i++) {
                const dist = 0.28 + i * widthScale;
                const jitter = (Math.sin(i * 4.1 + age * 1.7) * 0.08);
                const x = +dist;
                const y = yBase + jitter;

                this.setBeadTarget(beadIndex, x, y, age, 2);
                beadIndex++;
            }
        }

        this.activeBeadCount = beadIndex;
    }

    /**
     * FORMATION 3: STAD VS LANDSBYGD (2 pelare - SCB TAB5328)
     * Vänster: Landsbygd, Höger: Tätort
     */
    layoutUrbanRural(popData, halfW, fillHeight) {
        const total = popData.total;
        let beadIndex = 0;

        // Andel tätort enligt SCB TAB5328
        let urbanRatio = 0.88;
        if (typeof this.getYearStats === 'function') {
            const stats = this.getYearStats();
            if (stats && stats.urbanRaw !== undefined) {
                urbanRatio = stats.urbanRaw / 100.0;
            }
        }
        const ruralRatio = 1.0 - urbanRatio;

        const colHalfW = halfW * 0.38;
        const leftCenterX = -halfW * 0.50;  // Landsbygd
        const rightCenterX = +halfW * 0.50; // Tätort

        const maxColHeight = this.worldHeight * 0.72;
        const ruralHeight = maxColHeight * (ruralRatio * (total / 12200000));
        const urbanHeight = maxColHeight * (urbanRatio * (total / 12200000));

        let currentYRural = this.botY;
        let currentYUrban = this.botY;

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const menCount = cohort[0];
            const womenCount = cohort[1];
            const cohortTotal = menCount + womenCount;
            if (cohortTotal <= 0) continue;

            const cohortFraction = cohortTotal / total;
            const countForAge = Math.max(1, Math.round(cohortTotal / 100));

            const ruralCount = Math.round(countForAge * ruralRatio);
            const urbanCount = countForAge - ruralCount;

            const ruralBandH = cohortFraction * ruralHeight;
            const urbanBandH = cohortFraction * urbanHeight;

            // Landsbygds-pärlor (vänster pelare)
            for (let i = 0; i < ruralCount && beadIndex < this.maxBeads; i++) {
                const x = leftCenterX + (Math.random() - 0.5) * 2.0 * colHalfW;
                const disp = (Math.random() - 0.5) * Math.max(0.18, ruralBandH * 0.95);
                const y = Math.max(this.botY, currentYRural + disp + ruralBandH * 0.5);

                this.setBeadTarget(beadIndex, x, y, age, (Math.random() < (menCount / cohortTotal)) ? 1 : 2);
                beadIndex++;
            }

            // Tätorts-pärlor (höger pelare)
            for (let i = 0; i < urbanCount && beadIndex < this.maxBeads; i++) {
                const x = rightCenterX + (Math.random() - 0.5) * 2.0 * colHalfW;
                const disp = (Math.random() - 0.5) * Math.max(0.18, urbanBandH * 0.95);
                const y = Math.max(this.botY, currentYUrban + disp + urbanBandH * 0.5);

                this.setBeadTarget(beadIndex, x, y, age, (Math.random() < (menCount / cohortTotal)) ? 1 : 2);
                beadIndex++;
            }

            currentYRural += ruralBandH;
            currentYUrban += urbanBandH;
        }

        this.activeBeadCount = beadIndex;
    }

    /**
     * FORMATION 4: INRIKES VS UTRIKES FÖDDA (2 pelare - SCB TAB4822)
     * Vänster: Födda i Sverige, Höger: Utrikes födda
     */
    layoutOrigin(popData, halfW, fillHeight) {
        const total = popData.total;
        let beadIndex = 0;
        const year = popData.year || 2026;

        let foreignRatio = 0.202;
        if (typeof this.getOriginStats === 'function') {
            const stats = this.getOriginStats(year);
            if (stats && stats.foreignRatio !== undefined) {
                foreignRatio = stats.foreignRatio;
            }
        } else {
            if (year < 1945) foreignRatio = 0.01;
            else if (year < 1970) foreignRatio = 0.01 + ((year - 1945) / 25.0) * 0.057;
            else if (year < 2000) foreignRatio = 0.067 + ((year - 1970) / 30.0) * 0.046;
            else if (year < 2026) foreignRatio = 0.113 + ((year - 2000) / 26.0) * 0.087;
            else foreignRatio = 0.202 + ((year - 2026) / 44.0) * 0.025;
        }

        const nativeRatio = 1.0 - foreignRatio;
        const colHalfW = halfW * 0.38;
        const leftCenterX = -halfW * 0.50;  // Inrikes födda
        const rightCenterX = +halfW * 0.50; // Utrikes födda

        const maxColHeight = this.worldHeight * 0.72;
        const nativeHeight = maxColHeight * (nativeRatio * (total / 12200000));
        const foreignHeight = maxColHeight * (foreignRatio * (total / 12200000));

        // Pass 1: Beräkna exakta pärlkvoter per årskull baserat på SCB:s åldersspecifika härkomst
        let totalForeignBeads = 0;
        let totalNativeBeads = 0;
        const cohortData = [];

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const menCount = cohort[0];
            const womenCount = cohort[1];
            const cohortTotal = menCount + womenCount;
            if (cohortTotal <= 0) {
                cohortData[age] = null;
                continue;
            }

            const countForAge = Math.max(1, Math.round(cohortTotal / 100));
            const cohortForeignRatio = typeof this.getForeignRatioForAge === 'function'
                ? this.getForeignRatioForAge(age, foreignRatio)
                : foreignRatio;

            let foreignCount = Math.round(countForAge * cohortForeignRatio);
            if (foreignCount > countForAge) foreignCount = countForAge;
            if (foreignCount < 0) foreignCount = 0;
            const nativeCount = countForAge - foreignCount;

            totalForeignBeads += foreignCount;
            totalNativeBeads += nativeCount;

            cohortData[age] = {
                menCount,
                womenCount,
                cohortTotal,
                foreignCount,
                nativeCount
            };
        }

        let currentYNative = this.botY;
        let currentYForeign = this.botY;

        // Pass 2: Placera pärlorna snyggt i respektive pelare
        for (let age = 105; age >= 0; age--) {
            const d = cohortData[age];
            if (!d) continue;

            const nativeBandH = totalNativeBeads > 0 ? (d.nativeCount / totalNativeBeads) * nativeHeight : 0;
            const foreignBandH = totalForeignBeads > 0 ? (d.foreignCount / totalForeignBeads) * foreignHeight : 0;

            // Inrikes födda (vänster pelare, origin = 0)
            for (let i = 0; i < d.nativeCount && beadIndex < this.maxBeads; i++) {
                const x = leftCenterX + (Math.random() - 0.5) * 2.0 * colHalfW;
                const disp = (Math.random() - 0.5) * Math.max(0.18, nativeBandH * 0.95);
                const y = Math.max(this.botY, currentYNative + disp + nativeBandH * 0.5);

                const sex = (Math.random() < (d.menCount / d.cohortTotal)) ? 1 : 2;
                this.setBeadTarget(beadIndex, x, y, age, sex, 0);
                beadIndex++;
            }

            // Utrikes födda (höger pelare, origin = 1)
            for (let i = 0; i < d.foreignCount && beadIndex < this.maxBeads; i++) {
                const x = rightCenterX + (Math.random() - 0.5) * 2.0 * colHalfW;
                const disp = (Math.random() - 0.5) * Math.max(0.18, foreignBandH * 0.95);
                const y = Math.max(this.botY, currentYForeign + disp + foreignBandH * 0.5);

                const sex = (Math.random() < (d.menCount / d.cohortTotal)) ? 1 : 2;
                this.setBeadTarget(beadIndex, x, y, age, sex, 1);
                beadIndex++;
            }

            currentYNative += nativeBandH;
            currentYForeign += foreignBandH;
        }

        this.activeBeadCount = beadIndex;
    }

    /**
     * UPPDATERA FRÅN BEFOLKNINGSDATA MED VALD FORMATION
     */
    updateFromPopulation(popData) {
        if (!popData) return;
        this.lastPopData = popData;
        this.previousActiveBeadCount = this.activeBeadCount;

        const total = popData.total;

        // 1:1 skala & takhöjd
        const maxCapacity = 12200000;
        const maxFillRatio = 0.78;
        const fillFraction = Math.min(maxFillRatio, (total / maxCapacity) * maxFillRatio);

        const halfW = (this.worldWidth / 2) * 0.94;
        this.botY = (-this.worldHeight / 2) + 1.2;
        const fillHeight = this.worldHeight * fillFraction;
        this.currentSurfaceY = this.botY + fillHeight;

        if (this.currentViewMode === 'pyramid') {
            this.layoutPyramid(popData, halfW, fillHeight);
        } else if (this.currentViewMode === 'urban_rural') {
            this.layoutUrbanRural(popData, halfW, fillHeight);
        } else if (this.currentViewMode === 'origin') {
            this.layoutOrigin(popData, halfW, fillHeight);
        } else {
            this.layoutSea(popData, halfW, fillHeight);
        }

        this.isFirstInit = false;

        this.beadsGeometry.setDrawRange(0, this.activeBeadCount);
        this.beadsGeometry.attributes.position.needsUpdate = true;
        this.beadsGeometry.attributes.color.needsUpdate = true;
        this.beadsGeometry.attributes.age.needsUpdate = true;
    }

    setHighlightAge(age) {
        if (this.beadsMaterial) {
            this.beadsMaterial.uniforms.uHighlightAge.value = age;
        }
    }

    /**
     * Skapa en mjuk ringvåg (ripple) från musrörelse, klick eller demografiska händelser
     */
    createRipple(x, y, strength = 0.45, speed = 0.26, maxRadius = 9.0) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 0.1,
            maxRadius: maxRadius,
            strength: strength,
            speed: speed,
            waveWidth: 1.8
        });

        if (this.ripples.length > 45) {
            this.ripples.shift();
        }
    }

    /**
     * Taktil Ripple-Fysik: Inga hål! Mjuka vågor som fortplantar sig genom folkhavet
     */
    updateFluidPhysics() {
        if (this.activeBeadCount === 0) return;

        // Uppdatera alla aktiva ringvågor (stödjer även implosions-vågor med negativ strength)
        for (let rIdx = this.ripples.length - 1; rIdx >= 0; rIdx--) {
            const rip = this.ripples[rIdx];
            rip.radius += rip.speed;
            rip.strength *= 0.94; // Mjuk dämpning

            if (rip.radius > rip.maxRadius || Math.abs(rip.strength) < 0.006) {
                this.ripples.splice(rIdx, 1);
            }
        }

        const numRipples = this.ripples.length;
        // Kritiskt dämpad fysik: mjuk och viskös rörelse med absolut NOLL bounce eller fjäder-rekyl
        const returnSpring = 0.08;
        const damping = 0.50;

        for (let i = 0; i < this.activeBeadCount; i++) {
            const i3 = i * 3;
            let px = this.positions[i3];
            let py = this.positions[i3 + 1];

            let vx = this.velocities[i3];
            let vy = this.velocities[i3 + 1];

            // Vågpåverkan från ringvågorna
            for (let rIdx = 0; rIdx < numRipples; rIdx++) {
                const rip = this.ripples[rIdx];
                const dx = px - rip.x;
                const dy = py - rip.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const waveDist = Math.abs(dist - rip.radius);
                if (waveDist < rip.waveWidth && dist > 0.001) {
                    // Sinusvåg: mjuk knuff ut/in beroende på tecken
                    const phase = (dist - rip.radius) / rip.waveWidth;
                    const waveForce = Math.sin(phase * Math.PI) * rip.strength;
                    
                    vx += (dx / dist) * waveForce * 0.16;
                    vy += (dy / dist) * waveForce * 0.16;
                }
            }

            // Fjäderåtergång till hemposition (så myllret förblir tätt och jämnt)
            const hx = this.homePositions[i3];
            const hy = this.homePositions[i3 + 1];

            vx += (hx - px) * returnSpring;
            vy += (hy - py) * returnSpring;

            vx *= damping;
            vy *= damping;

            this.velocities[i3] = vx;
            this.velocities[i3 + 1] = vy;

            this.positions[i3] = px + vx;
            this.positions[i3 + 1] = py + vy;
        }

        this.beadsGeometry.attributes.position.needsUpdate = true;
    }

    /**
     * Skapa en mjuk radial glödtextur för ljusaura / halo runt händelse-pärlor
     */
    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.48, 'rgba(255, 255, 255, 0.35)');
        grad.addColorStop(0.76, 'rgba(255, 255, 255, 0.08)');
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Skapa en tredimensionell, glansig pärla med halverad storlek och mjuk ljusaura (halo)
     */
    createLuminousBead(colorHex, radius = 0.22, haloScale = 1.30) {
        const group = new THREE.Group();

        // 1. Själva 3D-pärlan (halverad storlek, krispig 3D-lyster med högdagertopp)
        const beadGeo = new THREE.SphereGeometry(radius, 24, 24);
        const beadMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.12,
            metalness: 0.20,
            emissive: colorHex,
            emissiveIntensity: 0.42,
            transparent: true,
            opacity: 1.0
        });
        const sphere = new THREE.Mesh(beadGeo, beadMat);
        group.add(sphere);

        // 2. Mjuk, lysande ljus-aura (Glow Halo) runt kulan så den verkligen lyser
        if (!this.glowTexture) {
            this.glowTexture = this.createGlowTexture();
        }
        const spriteMat = new THREE.SpriteMaterial({
            map: this.glowTexture,
            color: colorHex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.75,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(haloScale, haloScale, 1.0);
        group.add(sprite);

        return { group, sphere, sprite };
    }

    /**
     * FÖDELSE OCH INVANDRING:
     * - Födelse: Trillar ner från toppen, slår ner i ytan (spädbarnen) och sprider en cirkulär ringvåg!
     * - Invandring: Trillar ner, bryter ytan med en skvätt och dyker djupt ner genom generationerna
     *   till sin vuxna ålder, precis som ett vertikalt drag med musen, och lämnar kölvatten (wake ripples)!
     */
    spawnDroppingBead(type = 'birth') {
        const topY = (this.worldHeight / 2) + 2.0;
        const surfaceY = (this.currentSurfaceY !== undefined) ? this.currentSurfaceY : (this.worldHeight * 0.25);
        const botY = (this.botY !== undefined) ? this.botY : (-this.worldHeight / 2 + 1.2);
        const popHeight = Math.max(1.0, surfaceY - botY);

        let targetY;
        let colorHex;
        if (type === 'birth') {
            // Födelse landar precis på ytan där de yngsta ligger
            targetY = surfaceY;
            const birthColors = [0xff2a7a, 0xfee440, 0x00f5d4, 0xff7b00, 0xa855f7];
            colorHex = birthColors[Math.floor(Math.random() * birthColors.length)];
        } else {
            // Invandring: Typisk ålder ca 20-45 år -> 20%-48% ned från ytan mot botten
            const depthFraction = 0.20 + Math.random() * 0.28;
            targetY = Math.max(botY + 0.6, surfaceY - popHeight * depthFraction);
            colorHex = 0x00f5a0; // Ljusstark smaragd/mint
        }

        const spawnX = (Math.random() - 0.5) * this.worldWidth * 0.78;
        const colObj = new THREE.Color(colorHex);
        const rgb = [colObj.r, colObj.g, colObj.b];

        // Halverad storlek (radie 0.22) med tredimensionell pärllyster och lysande ljusaura!
        const { group, sphere, sprite } = this.createLuminousBead(colorHex, 0.22, 1.30);
        group.position.set(spawnX, topY, 0.5);
        this.scene.add(group);

        this.fallingBeads.push({
            group: group,
            sphere: sphere,
            sprite: sprite,
            type: type,
            vy: -0.26,
            targetY: targetY,
            surfaceY: surfaceY,
            enteredSurface: false,
            lastWakeY: topY,
            bounces: 0,
            life: 0,
            rgb: rgb,
            age: (type === 'birth') ? 0 : Math.round(20 + Math.random() * 25)
        });
    }

    updateFallingBeads() {
        for (let i = this.fallingBeads.length - 1; i >= 0; i--) {
            const b = this.fallingBeads[i];
            b.life++;

            if (!b.enteredSurface) {
                // I luften: faller med acceleration mot ytan
                b.vy -= 0.014;
                b.group.position.y += b.vy;

                if (b.group.position.y <= b.surfaceY) {
                    b.enteredSurface = true;
                    b.lastWakeY = b.surfaceY;

                    if (b.type === 'birth') {
                        // FÖDELSE: Landar på ytan med ett tydligt nedslag och sprider en stor ringvåg!
                        b.group.position.y = b.surfaceY;
                        b.vy = -b.vy * 0.35;
                        b.bounces = 1;
                        this.createRipple(b.group.position.x, b.surfaceY, 0.54, 0.24, 7.5);
                    } else {
                        // INVANDRING: Bryter ytan med en skvätt och dyker vidare nedåt genom generationerna!
                        this.createRipple(b.group.position.x, b.surfaceY, 0.38, 0.22, 5.5);
                        b.vy = Math.max(-0.20, b.vy * 0.65);
                    }
                }
            } else if (b.type === 'immigrate' && b.group.position.y > b.targetY) {
                // INVANDRING PLÖJER NEDÅT GENOM FOLKHAVET:
                // Glider mjukt nedåt med viskös dämpning
                b.vy = Math.max(-0.22, b.vy * 0.95 - 0.008);
                b.group.position.y += b.vy;

                // KÖLVATTEN (Wake trail): Som ett vertikalt musdrag som knuffar kulorna åt sidan!
                const dropDist = b.lastWakeY - b.group.position.y;
                if (dropDist >= 0.95) {
                    this.createRipple(b.group.position.x, b.group.position.y, 0.26, 0.20, 4.0);
                    b.lastWakeY = b.group.position.y;
                }

                if (b.group.position.y <= b.targetY) {
                    b.group.position.y = b.targetY;
                    b.vy = -b.vy * 0.30;
                    b.bounces = 1;
                    // Sättnings-ripple när invandraren slår rot i sin generation!
                    this.createRipple(b.group.position.x, b.targetY, 0.44, 0.22, 6.2);
                }
            } else {
                // Studs och integrering vid målnivån (både födelse på ytan och invandring i vuxen ålder)
                b.vy -= 0.012;
                b.group.position.y += b.vy;

                if (b.group.position.y <= b.targetY) {
                    b.group.position.y = b.targetY;
                    b.vy = -b.vy * 0.28;
                    b.bounces++;
                }

                // När kulan har nått målnivån: krymp mjukt och ta en permanent plats bland pärlorna
                if (b.bounces >= 2) {
                    b.shrinkProgress = (b.shrinkProgress || 0) + 0.034;
                    const p = Math.min(1.0, b.shrinkProgress);

                    // Målskala: Från 1.0 (radie 0.22) ner till 0.386 (motsvarande pärldiameter 0.170 enheter)
                    const targetScale = 0.386;
                    const s = 1.0 - p * (1.0 - targetScale);
                    b.group.scale.set(s, s, s);

                    // Ljusauran (sprite) tonas ut så att bara den solida pärlan återstår
                    b.sprite.material.opacity = Math.max(0, (1.0 - p * 1.25) * 0.75);

                    // Skapa ett litet mjukt mikroripple i mitten av krympningen så grannarna gör plats
                    if (!b.roomMade && p > 0.45) {
                        b.roomMade = true;
                        this.createRipple(b.group.position.x, b.targetY, 0.045, 0.12, 1.8);
                    }

                    // När den krympt till exakt rätt pärlstorlek:
                    // Överlämna sömlöst till en permanent pärla i partikelmolnet!
                    if (p >= 1.0) {
                        if (this.activeBeadCount < this.maxBeads) {
                            const newIdx = this.activeBeadCount;
                            this.activeBeadCount++;
                            const i3 = newIdx * 3;

                            this.positions[i3] = b.group.position.x;
                            this.positions[i3 + 1] = b.targetY;
                            this.positions[i3 + 2] = 0;

                            this.homePositions[i3] = b.group.position.x;
                            this.homePositions[i3 + 1] = b.targetY;
                            this.homePositions[i3 + 2] = 0;

                            this.velocities[i3] = 0;
                            this.velocities[i3 + 1] = 0;
                            this.velocities[i3 + 2] = 0;

                            this.colors[i3] = b.rgb[0];
                            this.colors[i3 + 1] = b.rgb[1];
                            this.colors[i3 + 2] = b.rgb[2];

                            this.ages[newIdx] = (b.type === 'birth') ? 0 : b.age;
                            this.sexes[newIdx] = (Math.random() < 0.514) ? 1 : 2;

                            this.beadsGeometry.setDrawRange(0, this.activeBeadCount);
                            this.beadsGeometry.attributes.position.needsUpdate = true;
                            this.beadsGeometry.attributes.color.needsUpdate = true;
                            this.beadsGeometry.attributes.age.needsUpdate = true;
                        }

                        this.scene.remove(b.group);
                        b.sphere.geometry.dispose();
                        b.sphere.material.dispose();
                        b.sprite.material.dispose();
                        this.fallingBeads.splice(i, 1);
                    }
                }
            }
        }
    }

    /**
     * DÖDSFALL OCH UTVANDRING:
     * - Dödsfall: I de äldsta kullarna i botten skapas en stilla implosionsvåg (suck) där kulan slocknar!
     * - Utvandring: Startar i vuxen ålder, seglar mjukt uppåt genom generationerna,
     *   skapar uppåtriktade kölvattensvågor, bryter igenom ytan och försvinner ut i rymden!
     */
    spawnDepartingBead(type = 'death') {
        const botY = (this.botY !== undefined) ? this.botY : (-this.worldHeight / 2 + 1.2);
        const surfaceY = (this.currentSurfaceY !== undefined) ? this.currentSurfaceY : (this.worldHeight * 0.25);
        const popHeight = Math.max(1.0, surfaceY - botY);

        let x, y, colorHex, vy, maxLife;
        const halfW = (this.worldWidth / 2) * 0.85;

        if (type === 'death') {
            // Dödsfall sker bland de äldre i botten
            x = (Math.random() - 0.5) * 2.0 * halfW;
            y = botY + Math.random() * (popHeight * 0.18);
            colorHex = 0xfffbeb; // Ljus varm vit/champagne-gnista
            vy = 0.004;
            maxLife = 85;
            // Implosion / mjuk suck: negativ strength drar omgivningen mjukt inåt för att fylla tomrummet!
            this.createRipple(x, y, -0.32, 0.18, 4.6);
        } else {
            // Utvandring sker bland unga vuxna (ca 20-35 år)
            x = (Math.random() - 0.5) * 2.0 * halfW;
            y = botY + (popHeight * 0.45) + (Math.random() - 0.5) * (popHeight * 0.25);
            colorHex = 0x38bdf8; // Himmelsblå som stiger mot rymden
            vy = 0.105; // Stiger mjukt och stadigt uppåt
            maxLife = 600; // Hinner segla hela vägen upp och ut ur viewporten
            // Avtågs-ripple i hemgenerationen när utvandraren lättar
            this.createRipple(x, y, 0.28, 0.18, 4.2);
        }

        // Halverad storlek (radie 0.21) med mjuk ljusaura
        const { group, sphere, sprite } = this.createLuminousBead(colorHex, 0.21, 1.35);
        group.position.set(x, y, 0.5);
        this.scene.add(group);

        this.departingBeads.push({
            group: group,
            sphere: sphere,
            sprite: sprite,
            type: type,
            vy: vy,
            surfaceY: surfaceY,
            breachedSurface: false,
            lastWakeY: y,
            life: 0,
            maxLife: maxLife
        });
    }

    updateDepartingBeads() {
        for (let i = this.departingBeads.length - 1; i >= 0; i--) {
            const d = this.departingBeads[i];
            d.life++;
            d.group.position.y += d.vy;

            if (d.type === 'death') {
                const progress = d.life / d.maxLife;
                // Gnistan pulserar mjukt och tonar stillsamt bort
                const pulse = 1.0 + Math.sin(progress * Math.PI) * 0.45;
                d.sphere.scale.setScalar(pulse);
                d.sprite.scale.setScalar(1.35 * pulse * 1.2);
                
                const op = Math.max(0, 1.0 - Math.pow(progress, 1.4));
                d.sphere.material.opacity = op;
                d.sprite.material.opacity = op * 0.85;

                // Vid halva livslängden släpps en andra mjuk utjämningsvåg
                if (d.life === Math.floor(d.maxLife * 0.45)) {
                    this.createRipple(d.group.position.x, d.group.position.y, 0.18, 0.14, 3.6);
                }
            } else {
                // UTVANDRING SEGLAR UPPÅT:
                if (d.group.position.y < d.surfaceY) {
                    // Under ytan: lämna uppåtgående kölvatten (wake ripples) genom generationerna
                    const riseDist = d.group.position.y - d.lastWakeY;
                    if (riseDist >= 0.95) {
                        this.createRipple(d.group.position.x, d.group.position.y, 0.22, 0.18, 3.8);
                        d.lastWakeY = d.group.position.y;
                    }
                } else if (!d.breachedSurface) {
                    // Bryter igenom ytan ut mot världen!
                    d.breachedSurface = true;
                    this.createRipple(d.group.position.x, d.surfaceY, 0.36, 0.22, 5.8);
                } else {
                    // Ovanför ytan seglar den vidare mot skyn och accelererar lätt uppåt
                    d.vy += 0.0025;
                }

                // Fortsätt vara fullt synlig hela vägen tills den lämnar viewportens överkant!
                const topViewportY = this.worldHeight / 2;
                let op = 1.0;
                if (d.group.position.y > topViewportY) {
                    // Först när den passerar skärmens överkant fasas den ut
                    const exitDist = d.group.position.y - topViewportY;
                    op = Math.max(0, 1.0 - (exitDist / 1.5));
                }
                d.sphere.material.opacity = op;
                d.sprite.material.opacity = op * 0.85;
            }

            const topLimit = (this.worldHeight / 2) + 2.0;
            const shouldRemove = (d.type === 'death')
                ? (d.life >= d.maxLife)
                : (d.group.position.y > topLimit || d.life >= d.maxLife);

            if (shouldRemove) {
                this.scene.remove(d.group);
                d.sphere.geometry.dispose();
                d.sphere.material.dispose();
                d.sprite.material.dispose();
                this.departingBeads.splice(i, 1);
            }
        }
    }

    setupEventListeners() {
        const screenToWorld = (clientX, clientY) => {
            const nx = (clientX / this.width) * 2 - 1;
            const ny = -(clientY / this.height) * 2 + 1;
            const wx = nx * (this.worldWidth / 2);
            const wy = ny * (this.worldHeight / 2);
            return { x: wx, y: wy };
        };

        const handlePointerDown = (e) => {
            // Endast primärt klick (vänsterklick på mus eller touch-tryck)
            if (e.button !== undefined && e.button !== 0) return;
            this.isDraggingProbe = true;
            this.container.classList.add('dragging');

            if (e.pointerId !== undefined) {
                try { this.container.setPointerCapture(e.pointerId); } catch (_) {}
            }

            const w = screenToWorld(e.clientX, e.clientY);
            const nearest = this.findNearestBead(w.x, w.y);
            this.createRipple(w.x, w.y, 0.50, 0.26, 11.0);

            if (nearest && this.onPersonClick) {
                this.setSelectedBead(nearest.index);
                this.onPersonClick(nearest, e.clientX, e.clientY);
            }
        };

        const handlePointerMove = (clientX, clientY) => {
            const w = screenToWorld(clientX, clientY);
            const dx = w.x - this.lastRippleX;
            const dy = w.y - this.lastRippleY;
            const dist = Math.hypot(dx, dy);

            // Om användaren håller nedtryckt: dra proben i realtid och scanna av befolkningen
            if (this.isDraggingProbe) {
                const nearest = this.findNearestBead(w.x, w.y);
                if (nearest && nearest.index !== this.selectedBeadIndex) {
                    this.setSelectedBead(nearest.index);
                    if (this.onPersonClick) {
                        this.onPersonClick(nearest, clientX, clientY);
                    }
                    if (dist > 0.8) {
                        this.createRipple(w.x, w.y, 0.22, 0.16, 5.0);
                        this.lastRippleX = w.x;
                        this.lastRippleY = w.y;
                    }
                }
            } else {
                // Mjuk ringvåg i musens spår när man hovrar (wake ripple)
                if (dist > 1.4) {
                    this.createRipple(w.x, w.y, 0.18, 0.20, 3.8);
                    this.lastRippleX = w.x;
                    this.lastRippleY = w.y;
                }
            }
        };

        const handlePointerUp = (e) => {
            if (this.isDraggingProbe) {
                this.isDraggingProbe = false;
                this.container.classList.remove('dragging');
                if (e && e.pointerId !== undefined) {
                    try { this.container.releasePointerCapture(e.pointerId); } catch (_) {}
                }
            }
        };

        // Pointer Events ger 100% responsivt stöd för mus, trackpad och touch-skärmar
        this.container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', (e) => {
            handlePointerMove(e.clientX, e.clientY);
        });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        window.addEventListener('resize', () => this.onResize());

        // Lyssna på när fönstret flyttas mellan skärmar med olika upplösning/pixeltäthet (t.ex. Retina <-> 1080p)
        const bindPixelRatioListener = () => {
            const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            mq.addEventListener('change', () => {
                this.onResize();
                bindPixelRatioListener();
            }, { once: true });
        };
        bindPixelRatioListener();
    }

    updatePointSize() {
        if (!this.beadsMaterial || !this.beadsMaterial.uniforms.uPointSize) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (this.renderer) {
            this.renderer.setPixelRatio(dpr);
        }

        // Faktisk renderbuffer-höjd i fysiska hårdvarupixlar
        const bufferHeight = this.height * dpr;

        // FYSISK PÄRLDIAMETER I 3D-VÄRLDEN (0.170 enheter):
        // Balanserad storlek: tillräckligt fin för att 106 200 pärlor ska synas som krispiga,
        // distinkta juveler utan att klumpas ihop, med exakt samma skala på alla skärmar.
        const beadWorldDiameter = 0.170;
        const pixelsPerWorldUnit = bufferHeight / this.worldHeight;
        const calculatedPointSize = beadWorldDiameter * pixelsPerWorldUnit;

        // Säkra gränser för WebGL point size
        const finalSize = Math.max(3.0, Math.min(24.0, calculatedPointSize));
        this.beadsMaterial.uniforms.uPointSize.value = finalSize;
    }

    findNearestBead(wx, wy) {
        if (this.activeBeadCount === 0) return null;

        let closestDistSq = Infinity;
        let closestIndex = -1;

        // Eftersom det inte finns något tomt hål ligger en pärla precis intill klicket!
        for (let i = 0; i < this.activeBeadCount; i++) {
            const i3 = i * 3;
            const dx = this.positions[i3] - wx;
            const dy = this.positions[i3 + 1] - wy;
            const dsq = dx * dx + dy * dy;
            if (dsq < closestDistSq) {
                closestDistSq = dsq;
                closestIndex = i;
            }
        }

        if (closestIndex >= 0 && closestDistSq < 6.0) {
            return {
                index: closestIndex,
                age: Math.round(this.ages[closestIndex]),
                sex: this.sexes[closestIndex] === 1 ? 'män' : 'kvinnor',
                x: this.positions[closestIndex * 3],
                y: this.positions[closestIndex * 3 + 1],
                origin: this.origins ? this.origins[closestIndex] : (this.positions[closestIndex * 3] > 0 ? 1 : 0)
            };
        }
        return null;
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const aspect = this.width / this.height;

        if (aspect >= 1.0) {
            this.worldHeight = 34.0;
            this.worldWidth = 34.0 * aspect;
        } else {
            // Porträttläge (mobil): garantera minst 28.0 bredd
            this.worldWidth = 28.0;
            this.worldHeight = this.worldWidth / aspect;
        }

        this.camera.left = -this.worldWidth / 2;
        this.camera.right = this.worldWidth / 2;
        this.camera.top = this.worldHeight / 2;
        this.camera.bottom = -this.worldHeight / 2;
        this.camera.updateProjectionMatrix();

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(this.width, this.height);

        // Beräkna om pärlstorlek så den är 100% konstant i förhållande till burken och upplösningen
        this.updatePointSize();

        // Re-layouta pärlorna så de fyller den aktuella skärmens dimensioner harmoniskt
        if (this.lastPopData) {
            this.updateFromPopulation(this.lastPopData);
        }
    }

    /**
     * LEVANDE MYLLER: SUBTILA ORGANISKA PLATSBYTEN & MIKROKRUSNINGAR
     * Två fysiskt intilliggande pärlor byter lugnt och sansat plats med varandra
     * och skapar ett mycket litet mikroripple då omgivande pärlor mjukt flyttar på sig.
     */
    updateOrganicDrift(now) {
        if (this.activeBeadCount < 10) return;

        if (!this.lastOrganicSwapTime) this.lastOrganicSwapTime = now;

        // Ett enstaka intilliggande par byter lugnt och sansat plats var ~1.8 sekund
        if (now - this.lastOrganicSwapTime > 1.8) {
            this.lastOrganicSwapTime = now;

            const idxA = Math.floor(Math.random() * this.activeBeadCount);
            if (idxA === this.selectedBeadIndex) return;

            const a3 = idxA * 3;
            const xa = this.homePositions[a3];
            const ya = this.homePositions[a3 + 1];

            // Hitta en granne som är fysiskt alldeles intill (avstånd ca 0.08 till 0.35 enheter, dvs 1-2 pärldiametrar)
            let bestB = -1;
            let bestDistSq = Infinity;
            const maxRadiusSq = 0.35 * 0.35;

            // Sök bland närliggande pärlor i samma ålderskull
            const searchMin = Math.max(0, idxA - 120);
            const searchMax = Math.min(this.activeBeadCount - 1, idxA + 120);

            for (let b = searchMin; b <= searchMax; b++) {
                if (b === idxA || b === this.selectedBeadIndex) continue;
                const b3 = b * 3;
                const dx = this.homePositions[b3] - xa;
                const dy = this.homePositions[b3 + 1] - ya;
                const distSq = dx * dx + dy * dy;

                if (distSq > 0.005 && distSq < maxRadiusSq && distSq < bestDistSq) {
                    bestDistSq = distSq;
                    bestB = b;
                }
            }

            if (bestB >= 0) {
                const b3 = bestB * 3;
                const xb = this.homePositions[b3];
                const yb = this.homePositions[b3 + 1];

                // Byt hempositioner: de rullar lugnt och sansat förbi varandra (~0.2 enheters förflyttning)
                this.homePositions[a3] = xb;
                this.homePositions[a3 + 1] = yb;
                this.homePositions[b3] = xa;
                this.homePositions[b3 + 1] = ya;

                // Litet lokalt mikroripple i mitten så intilliggande pärlor mjukt flyttar på sig
                const midX = (xa + xb) * 0.5;
                const midY = (ya + yb) * 0.5;
                this.createRipple(midX, midY, 0.035, 0.10, 1.4);
            }
        }

        // 2. Mjuk och sällan förekommande mikrokrusning i folkmassan var ~4:e sekund
        if (!this.lastOrganicRippleTime) this.lastOrganicRippleTime = now;
        if (now - this.lastOrganicRippleTime > 3.8) {
            this.lastOrganicRippleTime = now;
            const halfW = (this.worldWidth / 2) * 0.75;
            const botY = this.botY || (-this.worldHeight / 2 + 1.2);
            const surfY = this.currentSurfaceY || (botY + 8);
            const rx = (Math.random() - 0.5) * 2.0 * halfW;
            const ry = botY + Math.random() * Math.max(2.0, surfY - botY);

            this.createRipple(rx, ry, 0.045, 0.12, 3.2);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        const now = performance.now() * 0.001;
        if (this.beadsMaterial && this.beadsMaterial.uniforms.uTime) {
            this.beadsMaterial.uniforms.uTime.value = now;
        }

        this.updateOrganicDrift(now);
        this.updateFluidPhysics();
        this.updateFallingBeads();
        this.updateDepartingBeads();

        // Mjuk andning och positionsföljning för precisions-siktet runt den valda personen
        if (this.selectionReticle && this.selectionReticle.visible && this.selectedBeadIndex !== null) {
            if (this.selectedBeadIndex >= 0 && this.selectedBeadIndex < this.activeBeadCount) {
                const i3 = this.selectedBeadIndex * 3;
                this.selectionReticle.position.x = this.positions[i3];
                this.selectionReticle.position.y = this.positions[i3 + 1];
            }
            const t = Date.now() * 0.005;
            const pulse = this.isDraggingProbe ? 1.08 : (1.0 + 0.035 * Math.sin(t));
            if (this.reticleRing) this.reticleRing.scale.set(pulse, pulse, 1.0);
            if (this.reticleShadow) this.reticleShadow.scale.set(pulse, pulse, 1.0);
            if (this.reticleCore) this.reticleCore.scale.set(pulse, pulse, 1.0);
            if (this.reticleTicks) this.reticleTicks.scale.set(pulse, pulse, 1.0);
            if (this.reticleAura) {
                const auraOpacity = this.isDraggingProbe ? 0.85 : (0.50 + 0.20 * Math.sin(t));
                this.reticleAura.material.opacity = auraOpacity;
                const auraScale = this.isDraggingProbe ? 1.60 : 1.40;
                this.reticleAura.scale.set(auraScale, auraScale, 1.0);
            }
            if (this.reticleBackdrop) {
                const bgScale = this.isDraggingProbe ? 1.15 : (1.0 + 0.02 * Math.sin(t));
                this.reticleBackdrop.scale.set(bgScale, bgScale, 1.0);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
