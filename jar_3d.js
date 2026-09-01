/**
 * Jar3D: 3D-Scen, Optisk Glasburk och 1:1 Pärl-Shader
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

        // Pärlor
        this.beadsMesh = null;
        this.beadsGeometry = null;
        this.beadsMaterial = null;
        this.maxBeads = 120000; // Representativa mikropärlor med 1:1 proportionell densitet
        this.activeBeadCount = 0;

        // Fallande pärlor (födslar / invandring)
        this.fallingBeads = [];

        // Kohort-markering
        this.highlightAge = -1; // -1 = ingen markering

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
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Förhindra att kameran går under bordet
        this.controls.target.set(0, 2.0, 0);

        // Ljussättning (Studiomiljö för optiskt glas och pärlglans)
        this.setupLighting();

        // 3D Objekten: Pedestal, Glasburk, Lock
        this.createPedestal();
        this.createGlassJar();

        // Skapa Pärlsystemet
        this.initBeadSystem();

        // Resize Listener
        window.addEventListener('resize', () => this.onResize());

        // Animationsloop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        // Mjukt omgivningsljus
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        // Huvudljus uppifrån/framifrån
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(12, 28, 20);
        this.scene.add(keyLight);

        // Sval cyan/turkos kantbelysning bakifrån vänster
        const rimLightLeft = new THREE.PointLight(0x00f5d4, 2.5, 45);
        rimLightLeft.position.set(-18, 12, -10);
        this.scene.add(rimLightLeft);

        // Varm korall/bärnsten kantbelysning bakifrån höger
        const rimLightRight = new THREE.PointLight(0xff5e7e, 2.0, 45);
        rimLightRight.position.set(18, 10, -10);
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

    createGlassJar() {
        // Optisk cylindrisk glasburk
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
            transmission: 0.94,
            opacity: 1,
            transparent: true,
            roughness: 0.05,
            ior: 1.52,
            thickness: 0.9,
            specularIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            depthWrite: false, // Mycket viktigt för att pärlor inuti ska synas knivskarpt!
            side: THREE.DoubleSide
        });

        const jarMesh = new THREE.Mesh(jarGeo, glassMaterial);
        jarMesh.position.y = this.jarBaseY + (this.jarHeight / 2);
        this.scene.add(jarMesh);

        // Tjock glasbotten
        const bottomGeo = new THREE.CylinderGeometry(this.jarRadius, this.jarRadius, 0.6, 64);
        const bottomMesh = new THREE.Mesh(bottomGeo, glassMaterial);
        bottomMesh.position.y = this.jarBaseY + 0.3;
        this.scene.add(bottomMesh);

        // Mässingskant och trälock överst på burken
        const topY = this.jarBaseY + this.jarHeight;

        // Glasläpp/ring upptill
        const lipGeo = new THREE.TorusGeometry(this.jarRadius, 0.22, 16, 64);
        const lipMesh = new THREE.Mesh(lipGeo, glassMaterial);
        lipMesh.rotation.x = Math.PI / 2;
        lipMesh.position.y = topY;
        this.scene.add(lipMesh);

        // Minimalistiskt lock i mörkt valnötsträ och borstad mässing
        const lidGeo = new THREE.CylinderGeometry(this.jarRadius + 0.3, this.jarRadius + 0.3, 0.8, 64);
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0x1e1b18,
            roughness: 0.6,
            metalness: 0.2
        });
        const lidMesh = new THREE.Mesh(lidGeo, lidMat);
        lidMesh.position.y = topY + 0.6;
        this.scene.add(lidMesh);

        const handleGeo = new THREE.SphereGeometry(0.7, 32, 16);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.3,
            metalness: 0.85
        });
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.y = topY + 1.4;
        this.scene.add(handleMesh);
    }

    initBeadSystem() {
        // Skapa instanced / point particle-system för de 10.5 miljoner individerna
        const count = this.maxBeads;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const ages = new Float32Array(count); // Ålder 0-110

        this.beadsGeometry = new THREE.BufferGeometry();
        this.beadsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.beadsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.beadsGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));

        // Anpassad WebGL2 Shader som renderar varje punkt som en äkta ljusbrytande 3D-gelékula!
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

                // Storlek på pärlorna med perspektivskalning
                float baseSize = 8.5;
                if (uHighlightAge >= 0.0) {
                    if (abs(age - uHighlightAge) <= 0.5) {
                        baseSize = 13.0; // Förstora den valda årskullen!
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
                // Skapa en rund sfär från gl_PointCoord
                vec2 coord = gl_PointCoord - vec2(0.5);
                float distSq = dot(coord, coord);
                if (distSq > 0.25) discard;

                // Beräkna 3D-normal för sfären
                float z = sqrt(0.25 - distSq);
                vec3 normal = normalize(vec3(coord.x, -coord.y, z));

                // Studiomiljö ljussättning på varje pärla
                vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
                float diff = max(dot(normal, lightDir), 0.0);

                // Spegelglans (Specular highlight som på glaspärlor/orbeez)
                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                vec3 halfVector = normalize(lightDir + viewDir);
                float spec = pow(max(dot(normal, halfVector), 0.0), 32.0);

                // Translucens / Inre glöd
                float rim = 1.0 - z * 2.0;
                vec3 finalColor = vColor * (0.35 + 0.65 * diff) + vec3(1.0) * spec * 0.75 + vColor * rim * 0.25;

                // Hantera kohort-markering
                if (uHighlightAge >= 0.0) {
                    if (abs(vAge - uHighlightAge) <= 0.5) {
                        // Den markerade generationen lyser kraftfullt neon!
                        finalColor = mix(vColor, vec3(1.0), 0.3) * 1.6 + vec3(0.8) * spec;
                    } else {
                        // Övriga generationer tonas ner diskret
                        finalColor *= 0.25;
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

    // Färgpalett för livscykeln (Orbeez-godisfärger för unga -> djupa ädelstenar -> obsidian)
    getBeadColor(age, index) {
        // En rik palett av sprudlande karamellfärger för de unga (0-15 år)
        const candyPalette = [
            [1.0, 0.16, 0.48],  // Neonrosa
            [0.0, 0.96, 0.83],  // Klar Cyan
            [1.0, 0.90, 0.25],  // Solgul
            [0.65, 0.33, 0.97], // Lysande Lila
            [0.13, 0.85, 0.45], // Friskt Grön
            [1.0, 0.42, 0.20],  // Korallorange
            [0.10, 0.60, 0.98]  // Himmelblå
        ];

        if (age <= 14) {
            // Välj en glad karamellfärg
            const choice = candyPalette[index % candyPalette.length];
            return choice;
        } else if (age <= 28) {
            // Friska ädelstenstoner (ung vuxen)
            const youngPal = [
                [0.0, 0.55, 0.85],
                [0.06, 0.72, 0.50],
                [0.90, 0.22, 0.27],
                [0.96, 0.62, 0.05]
            ];
            return youngPal[index % youngPal.length];
        } else if (age <= 58) {
            // Djupa, rika juveltoner (vuxen)
            const adultPal = [
                [0.12, 0.23, 0.54],
                [0.02, 0.37, 0.27],
                [0.51, 0.09, 0.26],
                [0.57, 0.25, 0.05]
            ];
            return adultPal[index % adultPal.length];
        } else if (age <= 82) {
            // Mörknande rökig kvarts och grafit (senior)
            const t = (age - 59) / (82 - 59);
            const r = 0.35 * (1.0 - t) + 0.18 * t;
            const g = 0.25 * (1.0 - t) + 0.18 * t;
            const b = 0.20 * (1.0 - t) + 0.20 * t;
            return [r, g, b];
        } else {
            // Djup obsidian-svart med subtilt skimmer (83 - 105+ år)
            const sparkle = ((index % 7) === 0) ? 0.22 : 0.08;
            return [sparkle, sparkle, sparkle * 1.1];
        }
    }

    // Uppdatera burkens innehåll utifrån SCB-år och ålderskohorter
    updateFromPopulation(popData) {
        if (!popData) return;

        const maxExpected = 12500000;
        const total = popData.total;
        const fillFraction = Math.min(1.0, total / maxExpected);
        const fillHeight = this.jarHeight * 0.88 * fillFraction;

        const positions = this.beadsGeometry.attributes.position.array;
        const colors = this.beadsGeometry.attributes.color.array;
        const ages = this.beadsGeometry.attributes.age.array;

        let beadIndex = 0;
        const totalBeadsToDraw = this.maxBeads;

        // Beräkna hur många pärlor varje ettårsklass ska få
        // Sortera från äldst (botten) till yngst (toppen)
        let currentY = this.jarBaseY + 0.5;

        for (let age = 105; age >= 0; age--) {
            const cohort = popData.ages[age] || [0, 0];
            const cohortTotal = cohort[0] + cohort[1];
            if (cohortTotal <= 0) continue;

            const cohortFraction = cohortTotal / total;
            const countForAge = Math.max(1, Math.round(cohortFraction * totalBeadsToDraw));
            const slabHeight = (cohortFraction * fillHeight);

            for (let i = 0; i < countForAge && beadIndex < totalBeadsToDraw; i++) {
                // Cylindrisk packning
                const u = Math.random() * 0.93; // Lämna 7% marginal till glasväggen
                const r = (this.jarRadius - 0.25) * Math.sqrt(u);
                const theta = Math.random() * Math.PI * 2;

                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = currentY + (Math.random() * Math.max(0.2, slabHeight));

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

            currentY += slabHeight;
        }

        this.activeBeadCount = beadIndex;
        this.beadsGeometry.setDrawRange(0, this.activeBeadCount);
        this.beadsGeometry.attributes.position.needsUpdate = true;
        this.beadsGeometry.attributes.color.needsUpdate = true;
        this.beadsGeometry.attributes.age.needsUpdate = true;
    }

    // Belys en viss generation
    setHighlightAge(age) {
        this.highlightAge = age;
        if (this.beadsMaterial) {
            this.beadsMaterial.uniforms.uHighlightAge.value = age;
        }
    }

    // Animera en nyfödd pärla eller invandrare som faller ner i burken!
    spawnDroppingBead(type = 'birth') {
        const topY = this.jarBaseY + this.jarHeight + 3.0;
        const targetY = this.jarBaseY + (this.jarHeight * 0.75);

        // Skapa en liten fysisk 3D-kula som faller ner och studsar mjukt
        const beadGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const color = type === 'birth' ? 0xff2a7a : 0x00f5d4;
        const beadMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.1,
            metalness: 0.1,
            emissive: color,
            emissiveIntensity: 0.6
        });

        const mesh = new THREE.Mesh(beadGeo, beadMat);
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * (this.jarRadius - 1.5);
        mesh.position.set(r * Math.cos(theta), topY, r * Math.sin(theta));

        this.scene.add(mesh);

        this.fallingBeads.push({
            mesh: mesh,
            vy: -0.15,
            targetY: targetY,
            bounces: 0
        });
    }

    updatePhysics() {
        // Uppdatera fallande pärlor
        for (let i = this.fallingBeads.length - 1; i >= 0; i--) {
            const b = this.fallingBeads[i];
            b.vy -= 0.015; // Gravitation
            b.mesh.position.y += b.vy;

            if (b.mesh.position.y <= b.targetY) {
                b.mesh.position.y = b.targetY;
                b.vy = -b.vy * 0.45; // Studs
                b.bounces++;

                if (b.bounces >= 3) {
                    // Försvinn mjukt in i massan
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

        // Subtil långsam rotation av scenen när användaren inte drar
        if (!this.controls.state || this.controls.state === -1) {
            this.beadsMesh.rotation.y += 0.0008;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
