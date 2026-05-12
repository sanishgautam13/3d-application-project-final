/*ROOM PAGE*/

let scene, camera, renderer, clock, isWireframe = false, lights;
let loadedModel;
let isRotating = false;
let controls;
let lampLight;
let isLampOn = false;
let switchSound;
let studioLight, ambientLight;

init();

function init() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(12, 10, 12);

    const container = document.getElementById('threeContainer');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controls.update();

    // controlled lighting
    lights = {};

    // Ambient 
    ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(ambientLight);
    lights.hemi = ambientLight;

    // Directional fill light 
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(8, 15, 8);
    scene.add(dirLight);

 // Studio light 
    studioLight = new THREE.SpotLight(0xfff8e7, 0);
    studioLight.position.set(10, 10, 10);
    studioLight.angle = Math.PI / 6;
    studioLight.penumbra = 0.7;
    studioLight.distance = 20;
    studioLight.decay = 1.5;
    studioLight.target.position.set(0, 0, 0);
    scene.add(studioLight);
    scene.add(studioLight.target);

    // AUDIO 
    const listener = new THREE.AudioListener();
    camera.add(listener);

    switchSound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/audio/lamp_switch.m4a', function (buffer) {
        switchSound.setBuffer(buffer);
        switchSound.setVolume(0.8);
    }, undefined, function (err) {
        console.warn('Could not load lamp switch sound:', err);
    });

    loadModel('assets/models/room.glb');
    setupEventListeners();
    window.addEventListener('resize', onResize);
    onResize();
    animate();
}

function loadModel(modelPath) {
    if (loadedModel) {
        scene.remove(loadedModel);
        loadedModel = null;
    }

    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, function (gltf) {
        const model = gltf.scene;

        // Find and disable all lights from the GLB
        const lightsToDisable = [];
        let floorLampPosition = null;

        model.traverse(function (child) {
            if (child.isLight) {
                console.log('Found light in GLB:', child.name, 'Position:', child.position);
                lightsToDisable.push(child);
            }
            if (child.name && child.name.toLowerCase().includes('lamp') && !child.isLight) {
                console.log('Found lamp object:', child.name, 'Position:', child.position);
                if (!floorLampPosition) {
                    floorLampPosition = new THREE.Vector3();
                    child.getWorldPosition(floorLampPosition);
                }
            }
        });

        lightsToDisable.forEach(light => {
            light.visible = false;
            light.intensity = 0;
        });

        model.position.set(0, 0, 0);
        scene.add(model);
        loadedModel = model;

        // Create lamp light
        lampLight = new THREE.PointLight(0xffaa55, 0, 4, 3);
        if (floorLampPosition) {
            lampLight.position.set(floorLampPosition.x, floorLampPosition.y + 3, floorLampPosition.z);
            console.log('Lamp light positioned at:', lampLight.position);
        } else {
            lampLight.position.set(4, 3.5, -2);
            console.log('Using default lamp position');
        }
        scene.add(lampLight);

        // Aim the studio spotlight at the model centre
        studioLight.target = loadedModel;

        console.log('Room loaded successfully');
    }, undefined, function (error) {
        console.error('Error loading model:', error);
    });
}

function setupEventListeners() {
    // SPIN
    const rotateBtn = document.getElementById('toggleRotate');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', function () {
            isRotating = !isRotating;
            this.classList.toggle('active');
        });
    }

    // WIREFRAME
    const wireframeBtn = document.getElementById('toggleWireframe');
    if (wireframeBtn) {
        wireframeBtn.addEventListener('click', function () {
            isWireframe = !isWireframe;
            this.classList.toggle('active');
            if (loadedModel) {
                loadedModel.traverse(function (child) {
                    if (child.isMesh) child.material.wireframe = isWireframe;
                });
            }
        });
    }

    // LAMP ON/OFF
    const lampBtn = document.getElementById('toggleLamp');
    if (lampBtn) {
        lampBtn.addEventListener('click', function () {
            isLampOn = !isLampOn;
            this.classList.toggle('active');

            if (switchSound && switchSound.buffer) {
                if (switchSound.isPlaying) switchSound.stop();
                switchSound.play();
            }

            if (lampLight) {
                lampLight.intensity = isLampOn ? 40 : 0;
            }

            if (loadedModel) {
                loadedModel.traverse(function (child) {
                    if (child.isMesh && child.name &&
                        (child.name.toLowerCase().includes('shade') ||
                         child.name.toLowerCase().includes('lamp'))) {
                        if (isLampOn) {
                            child.material.emissive = new THREE.Color(0xffaa55);
                            child.material.emissiveIntensity = 1.5;
                        } else {
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;
                        }
                        child.material.needsUpdate = true;
                    }
                });
            }
        });
    }

    // STUDIO LIGHT TOGGLE
    const studioBtn = document.getElementById('toggleStudioLight');
    if (studioBtn) {
        studioBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            studioLight.intensity = studioLight.intensity > 0 ? 0 : 25;
        });
    }

    // AMBIENT LIGHT TOGGLE
    const ambientBtn = document.getElementById('toggleAmbient');
    if (ambientBtn) {
        ambientBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            ambientLight.visible = !ambientLight.visible;
        });
    }

    // CAMERA: HERO VIEW
    const heroBtn = document.getElementById('cameraHero');
    if (heroBtn) {
        heroBtn.addEventListener('click', function () {
            camera.position.set(12, 10, 12);
            controls.target.set(0, 2, 0);
            controls.update();
        });
    }

    // CAMERA: FRONT
    const frontBtn = document.getElementById('cameraFront');
    if (frontBtn) {
        frontBtn.addEventListener('click', function () {
            camera.position.set(0, 4, 18);
            controls.target.set(0, 2, 0);
            controls.update();
        });
    }

    // CAMERA: TOP
    const topBtn = document.getElementById('cameraTop');
    if (topBtn) {
        topBtn.addEventListener('click', function () {
            camera.position.set(0, 22, 0.01);
            controls.target.set(0, 0, 0);
            controls.update();
        });
    }

    // CAMERA: SIDE
    const sideBtn = document.getElementById('cameraSide');
    if (sideBtn) {
        sideBtn.addEventListener('click', function () {
            camera.position.set(18, 4, 0);
            controls.target.set(0, 2, 0);
            controls.update();
        });
    }

    // RESET
    const resetBtn = document.getElementById('resetModel');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            if (loadedModel) loadedModel.rotation.y = 0;

            // Reset spin
            isRotating = false;
            const rotBtn = document.getElementById('toggleRotate');
            if (rotBtn) rotBtn.classList.remove('active');

            // Reset wireframe
            isWireframe = false;
            const wfBtn = document.getElementById('toggleWireframe');
            if (wfBtn) wfBtn.classList.remove('active');
            if (loadedModel) {
                loadedModel.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.wireframe = false;
                        if (child.material.emissive) {
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;
                            child.material.needsUpdate = true;
                        }
                    }
                });
            }

            // Reset lamp
            isLampOn = false;
            if (lampLight) lampLight.intensity = 0;
            const lpBtn = document.getElementById('toggleLamp');
            if (lpBtn) lpBtn.classList.remove('active');

            // Reset studio light
            studioLight.intensity = 0;
            const stBtn = document.getElementById('toggleStudioLight');
            if (stBtn) stBtn.classList.remove('active');

            // Reset ambient light (back on)
            ambientLight.visible = true;
            const amBtn = document.getElementById('toggleAmbient');
            if (amBtn) amBtn.classList.remove('active');

            // Reset camera to hero
            camera.position.set(12, 10, 12);
            controls.target.set(0, 2, 0);
            controls.update();
        });
    }
}

function onResize() {
    const container = document.getElementById('threeContainer');
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (isRotating && loadedModel) loadedModel.rotation.y += 0.005;
    if (controls) controls.update();
    renderer.render(scene, camera);
}