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

        // Ringvågor (Ripples) - Inga tomma hål, bara mjuka vågor!
        this.ripples = [];
        this.lastRippleX = -9999;
        this.lastRippleY = -9999;

        // Vald person (markörring)
        this.selectionRing = null;
        this.selectedBeadIndex = -1;

        // Fallande pärlor (födslar & invandrare)
        this.fallingBeads = [];

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();

        const aspect = this.width / this.height;
        const viewSize = 34.0;
        this.worldHeight = viewSize;
        this.worldWidth = viewSize * aspect;

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
        // En pulserande neon-aura som markerar den person man klickat på!
        const ringGeo = new THREE.RingGeometry(0.38, 0.65, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
        this.selectionRing.position.z = 1.0;
        this.scene.add(this.selectionRing);
    }

    setSelectedBead(index) {
        this.selectedBeadIndex = index;
        if (index >= 0 && index < this.activeBeadCount) {
            const x = this.positions[index * 3];
            const y = this.positions[index * 3 + 1];
            this.selectionRing.position.set(x, y, 1.0);
            this.selectionRing.material.opacity = 0.95;
        } else {
            this.selectionRing.material.opacity = 0;
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

            void main() {
                vColor = color;
                vAge = age;

                float baseSize = 8.8;
                if (uHighlightAge >= 0.0) {
                    if (abs(age - uHighlightAge) <= 0.8) {
                        baseSize = 15.0;
                    }
                }
                gl_PointSize = baseSize;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

        this.beadsMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uHighlightAge: { value: -1.0 }
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

    updateFromPopulation(popData) {
        if (!popData) return;

        const total = popData.total;
        let beadIndex = 0;

        // 1:1 SKALA & NATURLIG FYLLNADSHÖJD:
        // Varje pärla har konstant storlek och volym (1 pärla = 100 invånare).
        // Befolkningen fyller skärmen från botten och uppåt som ett hav:
        // 1860 (3,85 miljoner): Fyller ca 31% av skärmen (lägre höjd i äldre tid)
        // 1900 (5,14 miljoner): Fyller ca 42% av skärmen
        // 1969 (8,00 miljoner): Fyller ca 65% av skärmen
        // 2026 (10,62 miljoner): Fyller ca 86% av skärmen
        // 2070 (11,80 miljoner): Fyller ca 95% av skärmen
        const maxCapacity = 12200000;
        const fillFraction = Math.min(0.94, (total / maxCapacity) * 0.94);

        const halfW = (this.worldWidth / 2) * 0.94;
        this.botY = (-this.worldHeight / 2) + 1.2;
        const fillHeight = this.worldHeight * fillFraction;
        this.currentSurfaceY = this.botY + fillHeight;

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

                const i3 = beadIndex * 3;
                this.positions[i3] = x;
                this.positions[i3 + 1] = y;
                this.positions[i3 + 2] = 0;

                this.homePositions[i3] = x;
                this.homePositions[i3 + 1] = y;
                this.homePositions[i3 + 2] = 0;

                this.velocities[i3] = 0;
                this.velocities[i3 + 1] = 0;
                this.velocities[i3 + 2] = 0;

                const col = this.getBeadColor(age, beadIndex);
                this.colors[i3] = col[0];
                this.colors[i3 + 1] = col[1];
                this.colors[i3 + 2] = col[2];

                this.ages[beadIndex] = age;
                this.sexes[beadIndex] = (Math.random() < (menCount / cohortTotal)) ? 1 : 2;

                beadIndex++;
            }

            currentY += bandHeight;
        }

        this.activeBeadCount = beadIndex;
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
     * Skapa en mjuk ringvåg (ripple) från musrörelse eller klick
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

        if (this.ripples.length > 7) {
            this.ripples.shift();
        }
    }

    /**
     * Taktil Ripple-Fysik: Inga hål! Bara mjuka vågor som fortplantar sig genom folkhavet
     */
    updateFluidPhysics() {
        if (this.activeBeadCount === 0) return;

        // Uppdatera alla aktiva ringvågor
        for (let rIdx = this.ripples.length - 1; rIdx >= 0; rIdx--) {
            const rip = this.ripples[rIdx];
            rip.radius += rip.speed;
            rip.strength *= 0.94; // Mjuk dämpning

            if (rip.radius > rip.maxRadius || rip.strength < 0.008) {
                this.ripples.splice(rIdx, 1);
            }
        }

        const numRipples = this.ripples.length;
        const returnSpring = 0.12;
        const damping = 0.82;

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
                    // Sinusvåg: mjuk knuff ut och sedan in
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

    spawnDroppingBead(type = 'birth') {
        const topY = (this.worldHeight / 2) + 2.0;
        const surfaceY = (this.currentSurfaceY !== undefined) ? this.currentSurfaceY : (this.worldHeight * 0.25);
        const botY = (this.botY !== undefined) ? this.botY : (-this.worldHeight / 2 + 1.2);
        const targetY = (type === 'birth') 
            ? surfaceY 
            : Math.max(botY + 0.5, surfaceY - (surfaceY - botY) * 0.42);

        const spawnX = (Math.random() - 0.5) * this.worldWidth * 0.8;

        const beadGeo = new THREE.SphereGeometry(0.42, 16, 16);
        const colorHex = (type === 'birth') ? 0xff2a7a : 0x00f5a0;
        const beadMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.15,
            emissive: colorHex,
            emissiveIntensity: 0.8
        });

        const mesh = new THREE.Mesh(beadGeo, beadMat);
        mesh.position.set(spawnX, topY, 0.5);
        this.scene.add(mesh);

        this.fallingBeads.push({
            mesh: mesh,
            type: type,
            vy: -0.22,
            targetY: targetY,
            bounces: 0,
            life: 0
        });
    }

    updateFallingBeads() {
        for (let i = this.fallingBeads.length - 1; i >= 0; i--) {
            const b = this.fallingBeads[i];
            b.life++;
            b.vy -= 0.012;
            b.mesh.position.y += b.vy;

            if (b.mesh.position.y <= b.targetY) {
                b.mesh.position.y = b.targetY;
                b.vy = -b.vy * 0.40;
                b.bounces++;

                if (b.bounces === 1) {
                    // Skapa en ringvåg vid nedslaget!
                    this.createRipple(b.mesh.position.x, b.mesh.position.y, 0.35, 0.20, 6.0);
                }

                if (b.bounces >= 3) {
                    b.mesh.material.opacity = Math.max(0, 1.0 - (b.life - 90) * 0.03);
                    b.mesh.material.transparent = true;
                    if (b.life > 130) {
                        this.scene.remove(b.mesh);
                        b.mesh.geometry.dispose();
                        b.mesh.material.dispose();
                        this.fallingBeads.splice(i, 1);
                    }
                }
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

        window.addEventListener('mousemove', (e) => {
            const w = screenToWorld(e.clientX, e.clientY);
            const dx = w.x - this.lastRippleX;
            const dy = w.y - this.lastRippleY;
            const dist = Math.hypot(dx, dy);

            // Mjuk ringvåg i musens spår (wake ripple) utan att göra något tomt hål!
            if (dist > 1.4) {
                this.createRipple(w.x, w.y, 0.18, 0.20, 3.8);
                this.lastRippleX = w.x;
                this.lastRippleY = w.y;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                const w = screenToWorld(t.clientX, t.clientY);
                const dx = w.x - this.lastRippleX;
                const dy = w.y - this.lastRippleY;
                const dist = Math.hypot(dx, dy);

                if (dist > 1.4) {
                    this.createRipple(w.x, w.y, 0.22, 0.22, 4.0);
                    this.lastRippleX = w.x;
                    this.lastRippleY = w.y;
                }
            }
        }, { passive: true });

        // KLICK PÅ EN PÄRLA: Direkt respons & markering precis där man klickar!
        this.container.addEventListener('click', (e) => {
            const w = screenToWorld(e.clientX, e.clientY);
            const nearest = this.findNearestBead(w.x, w.y);
            
            // Starta en tydlig, expanderande ringvåg från klickpunkten
            this.createRipple(w.x, w.y, 0.55, 0.28, 12.0);

            if (nearest && this.onPersonClick) {
                this.setSelectedBead(nearest.index);
                this.onPersonClick(nearest, e.clientX, e.clientY);
            }
        });

        window.addEventListener('resize', () => this.onResize());
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
                y: this.positions[closestIndex * 3 + 1]
            };
        }
        return null;
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const aspect = this.width / this.height;
        const viewSize = 34.0;
        this.worldHeight = viewSize;
        this.worldWidth = viewSize * aspect;

        this.camera.left = -this.worldWidth / 2;
        this.camera.right = this.worldWidth / 2;
        this.camera.top = this.worldHeight / 2;
        this.camera.bottom = -this.worldHeight / 2;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.updateFluidPhysics();
        this.updateFallingBeads();

        // Pulsera markörringen runt den klickade personen mjukt
        if (this.selectionRing && this.selectionRing.material.opacity > 0) {
            const pulse = 1.0 + 0.15 * Math.sin(Date.now() * 0.008);
            this.selectionRing.scale.set(pulse, pulse, 1.0);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
