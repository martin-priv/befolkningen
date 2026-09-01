/**
 * Jar3D: 3D-Scen, Öppen Optisk Glasburk, Kontinuerlig Granulär Pärl-Shader & Fallande Partiklar
 */
class Jar3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Geometri & Dimensioner
        this.jarRadius = 6.2;
        this.jarHeight = 22.0;
        this.jarBaseY = -9.0;
        this.currentSurfaceY = -9.0 + (22.0 * 0.85); // Håller koll på pärlytan

        // Pärlor (Mikro-partiklar för 10.5 miljoner individer)
        this.beadsMesh = null;
        this.beadsGeometry = null;
        this.beadsMaterial = null;
        this.maxBeads = 120000;
        this.activeBeadCount = 0;

        // Fallande och sjunkande pärlor (födslar & invandring)
        this.fallingBeads = [];

        // Kohort-markering
        this.highlightAge = -1;

        this.init();
    }

    init() {
        // Scen & Bakgrund
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0c1014, 0.015);

        // Kamera
        this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 6.0, 36.0);

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 14;
        this.controls.maxDistance = 65;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        this.controls.target.set(0, 2.0, 0);

        // Ljussättning
        this.setupLighting();

        // Sockel och Helt Öppen Glasburk (Inget lock!)
        this.createPedestal();
        this.createOpenGlassJar();

        // Skapa Pärlsystemet
        this.initBeadSystem();

        // Resize Listener
        window.addEventListener('resize', () => this.onResize());

        // Animationsloop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.50);
        this.scene.add(ambientLight);

        // Huvudljus uppifrån
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
        keyLight.position.set(12, 30, 20);
        this.scene.add(keyLight);

        // Sval cyan/turkos kantbelysning bakifrån vänster
        const rimLightLeft = new THREE.PointLight(0x00f5d4, 2.8, 50);
        rimLightLeft.position.set(-20, 14, -12);
        this.scene.add(rimLightLeft);

        // Varm korall/bärnsten kantbelysning bakifrån höger
        const rimLightRight = new THREE.PointLight(0xff5e7e, 2.2, 50);
        rimLightRight.position.set(20, 12, -12);
        this.scene.add(rimLightRight);
    }

    createPedestal() {
        // Rund utställningssockel i mörk ek / skiffer
        const pedestalGeo = new THREE.CylinderGeometry(9.0, 9.6, 1.4, 64);
        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x11161b,
            roughness: 0.85,
            metalness: 0.1
        });
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.y = this.jarBaseY - 0.7;
        this.scene.add(pedestal);

        // Subtil mässingsring mellan burk och sockel
        const ringGeo = new THREE.TorusGeometry(this.jarRadius + 0.15, 0.18, 16, 64);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.35,
            metalness: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = this.jarBaseY;
        this.scene.add(ring);
    }

    createOpenGlassJar() {
        // Optisk cylindrisk glasburk - HELT ÖPPEN UPPTILL (INGET LOCK!)
        const jarGeo = new THREE.CylinderGeometry(
            this.jarRadius,
            this.jarRadius,
            this.jarHeight,
            64,
            1,
            true
        );

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.95,
            opacity: 1,
            transparent: true,
            roughness: 0.04,
            ior: 1.52,
            thickness: 0.9,
            specularIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const jarMesh = new THREE.Mesh(jarGeo, glassMaterial);
        jarMesh.position.y = this.jarBaseY + (this.jarHeight / 2);
        this.scene.add(jarMesh);

        // Tjock bottenplatta i glas
        const bottomGeo = new THREE.CylinderGeometry(this.jarRadius, this.jarRadius, 0.6, 64);
        const bottomMesh = new THREE.Mesh(bottomGeo, glassMaterial);
        bottomMesh.position.y = this.jarBaseY + 0.3;
        this.scene.add(bottomMesh);

        // Rundad glasläpp (öppen mynning) överst på burken
        const topY = this.jarBaseY + this.jarHeight;
        const lipGeo = new THREE.TorusGeometry(this.jarRadius, 0.22, 16, 64);
        const lipMesh = new THREE.Mesh(lipGeo, glassMaterial);
        lipMesh.rotation.x = Math.PI / 2;
        lipMesh.position.y = topY;
        this.scene.add(lipMesh);
    }

    initBeadSystem() {
        const count = this.maxBeads;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const ages = new Float32Array(count);

        this.beadsGeometry = new THREE.BufferGeometry();
        this.beadsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.beadsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.beadsGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));

        // Anpassad WebGL2 Shader som renderar varje punkt som en äkta 3D-gelékula med ljusbrytning
        const vertexShader = `
            attribute float age;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAge;
            varying vec3 vViewPos;
            uniform float uHighlightAge;

            void main() {
                vColor = color;
                vAge = age;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPos = -mvPosition.xyz;

                float baseSize = 8.5;
                if (uHighlightAge >= 0.0) {
                    if (abs(age - uHighlightAge) <= 0.8) {
                        baseSize = 14.0; // Förstora och belys den valda årskullen!
                    }
                }
                gl_PointSize = baseSize * (24.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vAge;
            varying vec3 vViewPos;
            uniform float uHighlightAge;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float distSq = dot(coord, coord);
                if (distSq > 0.25) discard;

                float z = sqrt(0.25 - distSq);
                vec3 normal = normalize(vec3(coord.x, -coord.y, z));

                vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
                float diff = max(dot(normal, lightDir), 0.0);

                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                vec3 halfVector = normalize(lightDir + viewDir);
                float spec = pow(max(dot(normal, halfVector), 0.0), 32.0);

                float rim = 1.0 - z * 2.0;
                vec3 finalColor = vColor * (0.35 + 0.65 * diff) + vec3(1.0) * spec * 0.75 + vColor * rim * 0.25;

                if (uHighlightAge >= 0.0) {
                    if (abs(vAge - uHighlightAge) <= 0.8) {
                        finalColor = mix(vColor, vec3(1.0), 0.35) * 1.7 + vec3(0.85) * spec;
                    } else {
                        finalColor *= 0.20; // Mjuka ner övriga årskullar
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
            depthWrite: true
        });

        this.beadsMesh = new THREE.Points(this.beadsGeometry, this.beadsMaterial);
        this.scene.add(this.beadsMesh);
    }

    /**
     * KONTINUERLIG, MJUK ÅLDERSFÄRG (HELT UTAN SKARPA SKIKT!)
     * Varje person föds med en klar, vacker godisfärg (rosa, cyan, solgul, violett, etc.)
     * Med åldern mörknar personens färg kontinuerligt år för år från 0 till 105+:
     * 0-15: 100% klara Orbeez-godisfärger
     * 15-45: Mjuk övergång till rika, djupa ädelstenar (safir, rubin, smaragd)
     * 45-75: Mjuk övergång till varm bärnsten, brons och rökig kvarts
     * 75-105+: Mjuk övergång till djup obsidian och grafit
     */
    getBeadColor(age, index) {
        const baseHues = [
            [1.00, 0.18, 0.52], // Neon Korallrosa
            [0.00, 0.96, 0.84], // Elektrisk Cyan
            [1.00, 0.88, 0.12], // Solgul
            [0.70, 0.32, 1.00], // Neonviolett
            [0.10, 0.92, 0.45], // Friskt Smaragd/Lime
            [1.00, 0.46, 0.14], // Varm Mandarin
            [0.06, 0.62, 1.00], // Himmelsblå
            [0.98, 0.28, 0.28]  // Hallonröd
        ];

        const base = baseHues[index % baseHues.length];
        const a = Math.max(0, Math.min(105, age));

        // DRAMATISK & TYDLIG ÅLDRANDEMÖRKNING:
        // Ålder 0-12: 100% lyster, max mättnad (Sprudlande Orbeez-godis i toppen)
        // Ålder 13-28: 82% lyster, friska klara ädelstenstoner (ung vuxen)
        // Ålder 29-50: 52% lyster, djupa juveler och mörk bärnsten (medelålder)
        // Ålder 51-72: 26% lyster, mörk brons, rökig kvarts och skogsgrön (seniorer)
        // Ålder 73-90: 14% lyster, mörk grafit och sot
        // Ålder 91-105+: 7% lyster, kolsvart obsidian i botten
        let brightness, saturation;

        if (a <= 12) {
            brightness = 1.0;
            saturation = 1.0;
        } else if (a <= 28) {
            const t = (a - 12) / 16.0;
            brightness = 1.0 - t * 0.22; // 1.0 -> 0.78
            saturation = 1.0 - t * 0.12; // 1.0 -> 0.88
        } else if (a <= 50) {
            const t = (a - 28) / 22.0;
            brightness = 0.78 - t * 0.32; // 0.78 -> 0.46
            saturation = 0.88 - t * 0.30; // 0.88 -> 0.58
        } else if (a <= 72) {
            const t = (a - 50) / 22.0;
            brightness = 0.46 - t * 0.26; // 0.46 -> 0.20
            saturation = 0.58 - t * 0.35; // 0.58 -> 0.23
        } else if (a <= 90) {
            const t = (a - 72) / 18.0;
            brightness = 0.20 - t * 0.12; // 0.20 -> 0.08
            saturation = 0.23 - t * 0.15; // 0.23 -> 0.08
        } else {
            const t = (a - 90) / 15.0;
            brightness = 0.08 - t * 0.03; // 0.08 -> 0.05 (kolsvart!)
            saturation = 0.08 - t * 0.05;
        }

        const neutral = 0.10;
        const r = (base[0] * saturation + neutral * (1.0 - saturation)) * brightness;
        const g = (base[1] * saturation + neutral * (1.0 - saturation)) * brightness;
        const b = (base[2] * saturation + neutral * (1.0 - saturation)) * brightness;

        // Subtilt diamantglitter på de allra äldsta pärlorna (95+ år)
        if (a >= 95 && (index % 5 === 0)) {
            return [0.22, 0.22, 0.25];
        }

        return [r, g, b];
    }

    // Uppdatera burkens innehåll utifrån SCB-år och ålderskohorter med organisk vertikal blandning
    updateFromPopulation(popData) {
        if (!popData) return;

        const maxExpected = 12500000;
        const total = popData.total;
        const fillFraction = Math.min(1.0, total / maxExpected);
        const fillHeight = this.jarHeight * 0.86 * fillFraction;

        this.currentSurfaceY = this.jarBaseY + 0.4 + fillHeight;

        const positions = this.beadsGeometry.attributes.position.array;
        const colors = this.beadsGeometry.attributes.color.array;
        const ages = this.beadsGeometry.attributes.age.array;

        let beadIndex = 0;
        const totalBeadsToDraw = this.maxBeads;

        // Beräkna kumulativ fördelning (CDF) för kontinuerlig vertikal placering
        let cumSum = 0;
        const ageCDF = [];
        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const cTot = cohort[0] + cohort[1];
            cumSum += cTot;
            ageCDF[age] = cumSum / total;
        }

        let currentY = this.jarBaseY + 0.4;

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const cohortTotal = cohort[0] + cohort[1];
            if (cohortTotal <= 0) continue;

            const cohortFraction = cohortTotal / total;
            const countForAge = Math.max(1, Math.round(cohortFraction * totalBeadsToDraw));
            const targetCenterY = currentY + (cohortFraction * fillHeight * 0.5);

            for (let i = 0; i < countForAge && beadIndex < totalBeadsToDraw; i++) {
                const u = Math.random() * 0.93;
                const r = (this.jarRadius - 0.25) * Math.sqrt(u);
                const theta = Math.random() * Math.PI * 2;

                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);

                // Organisk dispersion (mjuk överlappning mellan årskullar så inga hårda ränder bildas)
                const dispersion = (Math.random() - 0.5) * (fillHeight * 0.025);
                const y = Math.max(this.jarBaseY + 0.3, Math.min(this.currentSurfaceY, targetCenterY + dispersion));

                const i3 = beadIndex * 3;
                positions[i3] = x;
                positions[i3 + 1] = y;
                positions[i3 + 2] = z;

                const col = this.getBeadColor(age, beadIndex);
                colors[i3] = col[0];
                colors[i3 + 1] = col[1];
                colors[i3 + 2] = col[2];

                ages[beadIndex] = age;

                beadIndex++;
            }

            currentY += (cohortFraction * fillHeight);
        }

        this.activeBeadCount = beadIndex;
        this.beadsGeometry.setDrawRange(0, this.activeBeadCount);
        this.beadsGeometry.attributes.position.needsUpdate = true;
        this.beadsGeometry.attributes.color.needsUpdate = true;
        this.beadsGeometry.attributes.age.needsUpdate = true;
    }

    setHighlightAge(age) {
        this.highlightAge = age;
        if (this.beadsMaterial) {
            this.beadsMaterial.uniforms.uHighlightAge.value = age;
        }
    }

    /**
     * FÖDSLAR & INVANDRING: TRILLAR NER UPPIFRÅN GENOM DEN ÖPPNA BURKMUNNEN!
     * - Födda: Klar neonrosa/cyan pärla faller ner uppifrån, studsar och lägger sig på toppen.
     * - Invandring: Ljus smaragd/safir faller ner uppifrån, studsar och sjunker sedan sakta
     *   genom massan ner till sin faktiska åldersnivå (~28 år)!
     */
    spawnDroppingBead(type = 'birth') {
        const topY = this.jarBaseY + this.jarHeight + 4.5;
        const surfaceY = this.currentSurfaceY;

        const beadGeo = new THREE.SphereGeometry(0.36, 16, 16);

        let colorHex, emissiveHex;
        if (type === 'birth') {
            const birthColors = [0xff2a7a, 0x00f5d4, 0xfee440, 0xa855f7, 0x00f080, 0xff7b00];
            colorHex = birthColors[Math.floor(Math.random() * birthColors.length)];
            emissiveHex = colorHex;
        } else {
            // Invandring: Strålande smaragdgrön med guldglimt
            colorHex = 0x00f5a0;
            emissiveHex = 0x00d480;
        }

        const beadMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.15,
            metalness: 0.1,
            emissive: emissiveHex,
            emissiveIntensity: 0.8
        });

        const mesh = new THREE.Mesh(beadGeo, beadMat);
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * (this.jarRadius - 1.2);
        mesh.position.set(r * Math.cos(theta), topY, r * Math.sin(theta));

        this.scene.add(mesh);

        // Måldjup för invandrare (medianålder ca 28 år)
        let finalDepthY = surfaceY;
        if (type === 'immigrate') {
            const ageFraction = 28.0 / 85.0;
            finalDepthY = surfaceY - (surfaceY - this.jarBaseY) * ageFraction * 0.55;
        }

        this.fallingBeads.push({
            mesh: mesh,
            type: type,
            vy: -0.25,
            surfaceY: surfaceY,
            finalDepthY: finalDepthY,
            state: 'falling',
            bounces: 0,
            life: 0
        });
    }

    updatePhysics() {
        for (let i = this.fallingBeads.length - 1; i >= 0; i--) {
            const b = this.fallingBeads[i];
            b.life += 1;

            if (b.state === 'falling' || b.state === 'bouncing') {
                b.vy -= 0.018; // Gravitation
                b.mesh.position.y += b.vy;

                // Träffa pärlytan i burken
                if (b.mesh.position.y <= b.surfaceY) {
                    b.mesh.position.y = b.surfaceY;
                    b.vy = -b.vy * 0.42; // Mjuk elastisk studs
                    b.bounces++;

                    if (b.bounces >= 3) {
                        if (b.type === 'immigrate') {
                            b.state = 'sinking'; // Invandraren börjar sakta sjunka till sin ålder!
                            b.vy = -0.04;
                        } else {
                            b.state = 'settled';
                        }
                    }
                }
            } else if (b.state === 'sinking') {
                // Invandraren rör sig långsamt nedåt genom pärlmassan mot sin målnivå
                b.mesh.position.y += b.vy;
                b.mesh.rotation.y += 0.05;

                if (b.mesh.position.y <= b.finalDepthY) {
                    b.state = 'settled';
                }
            } else if (b.state === 'settled') {
                // Tona mjukt in i massan
                b.mesh.material.opacity = Math.max(0, 1.0 - (b.life - 120) * 0.02);
                b.mesh.material.transparent = true;

                if (b.life > 170) {
                    this.scene.remove(b.mesh);
                    b.mesh.geometry.dispose();
                    b.mesh.material.dispose();
                    this.fallingBeads.splice(i, 1);
                }
            }
        }
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.updatePhysics();

        if (!this.controls.state || this.controls.state === -1) {
            this.beadsMesh.rotation.y += 0.0008;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
