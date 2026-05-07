/*REDBULL PAGE*/
let scene, camera, renderer, clock, mixer, actions = [], isWireframe = false, lights;
let loadedModel;
let secondModelMixer, secondModelActions = [];
let sound, secondSound;
let isRotating = false;
let controls;
let ambientLight, hemiLight;

init();

function init() {
    clock = new THREE.Clock();

    //SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);

    //CAMERA
    camera = new THREE.PerspectiveCamera(60, 1, 0.001, 1000);
    camera.position.set(0.15, 0.12, 0.3);

    // --- RENDERER ---
    const container = document.getElementById('threeContainer');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    container.appendChild(renderer.domElement);

    // --- ORBIT CONTROLS ---
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.07, 0);
    controls.update();

    // --- LIGHTING ---
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemiLight);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    lights = {};

    // Studio spotlight (off by default — togglable)
    lights.spot = new THREE.SpotLight(0xfff8e7, 0);
    lights.spot.position.set(0.2, 0.5, 0.2);
    lights.spot.angle = Math.PI / 6;
    lights.spot.penumbra = 0.5;
    lights.spot.distance = 2;
    lights.spot.decay = 1.5;
    lights.spot.castShadow = true;
    lights.spot.target.position.set(0, 0.07, 0);
    scene.add(lights.spot);
    scene.add(lights.spot.target);

    // Key light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0.2, 0.3, 0.2);
    scene.add(dirLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    fillLight.position.set(-0.2, 0.15, -0.15);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 0.2, -0.3);
    scene.add(rimLight);

    // --- AUDIO ---
    const listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener);
    secondSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('assets/audio/can_opening.m4a', function (buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(0.8);
    }, undefined, function (err) {
        console.warn('Could not load can opening sound:', err);
    });

    audioLoader.load('assets/audio/can_crush.m4a', function (buffer) {
        secondSound.setBuffer(buffer);
        secondSound.setVolume(0.8);
    }, undefined, function (err) {
        console.warn('Could not load crush sound:', err);
    });

    // --- LOAD MODEL ---
    loadModel('assets/models/redbull_can.glb');

    // --- WIRE BUTTONS ---
    setupEventListeners();

    // --- RESIZE ---
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
        model.position.set(0, 0, 0);
        model.rotation.y = Math.PI;
        scene.add(model);
        loadedModel = model;

        if (gltf.animations && gltf.animations.length > 0) {
            if (modelPath.includes('crushed')) {
                secondModelMixer = new THREE.AnimationMixer(model);
                secondModelActions = [];
                gltf.animations.forEach(clip => {
                    const action = secondModelMixer.clipAction(clip);
                    secondModelActions.push(action);
                });
            } else {
                mixer = new THREE.AnimationMixer(model);
                actions = [];
                gltf.animations.forEach(clip => {
                    const action = mixer.clipAction(clip);
                    actions.push(action);
                });
            }
        }

        console.log('Model loaded:', modelPath);
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

    // OPEN CAN
    const openBtn = document.getElementById('openCan');
    if (openBtn) {
        openBtn.addEventListener('click', function () {
            if (sound.buffer) {
                if (sound.isPlaying) sound.stop();
                sound.play();
            }
            setTimeout(function () {
                if (actions.length > 0) {
                    actions.forEach(action => {
                        action.reset();
                        action.setLoop(THREE.LoopOnce);
                        action.clampWhenFinished = true;
                        action.timeScale = 0.5;
                        action.play();
                    });
                } else {
                    console.warn('No open animation available. Loading open model...');
                    loadModel('assets/models/redbull_can_open.glb');
                }
            }, 300);
        });
    }

    // CRUSH MODEL
    const switchBtn = document.getElementById('switchModel');
    if (switchBtn) {
        switchBtn.addEventListener('click', function () {
            if (secondSound.buffer) {
                if (secondSound.isPlaying) secondSound.stop();
                secondSound.play();
            }
            const loader = new THREE.GLTFLoader();
            if (loadedModel) {
                scene.remove(loadedModel);
                loadedModel = null;
            }
            loader.load('assets/models/redbull_can_crushed.glb', function (gltf) {
                const model = gltf.scene;
                model.position.set(0, 0.11, 0);
                model.rotation.y = Math.PI;
                scene.add(model);
                loadedModel = model;
                if (gltf.animations && gltf.animations.length > 0) {
                    secondModelMixer = new THREE.AnimationMixer(model);
                    gltf.animations.forEach(clip => {
                        const action = secondModelMixer.clipAction(clip);
                        action.reset();
                        action.setLoop(THREE.LoopOnce);
                        action.clampWhenFinished = true;
                        action.play();
                    });
                }
                console.log('Crushed model loaded, animations:', gltf.animations.length);
            });
        });
    }

    // RESET
    const resetBtn = document.getElementById('resetModel');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            loadModel('assets/models/redbull_can.glb');

            isRotating = false;
            const rotBtn = document.getElementById('toggleRotate');
            if (rotBtn) rotBtn.classList.remove('active');

            isWireframe = false;
            const wfBtn = document.getElementById('toggleWireframe');
            if (wfBtn) wfBtn.classList.remove('active');

            // Reset camera to hero
            camera.position.set(0.15, 0.12, 0.3);
            controls.target.set(0, 0.07, 0);
            controls.update();

            // Reset lights
            lights.spot.intensity = 0;
            const stBtn = document.getElementById('toggleSpotLight');
            if (stBtn) stBtn.classList.remove('active');

            hemiLight.visible = true;
            ambientLight.visible = true;
            const amBtn = document.getElementById('toggleAmbient');
            if (amBtn) amBtn.classList.remove('active');
        });
    }

    // SOUND BUTTONS
    const openSoundBtn = document.getElementById('playOpenSound');
    if (openSoundBtn) {
        openSoundBtn.addEventListener('click', function () {
            if (sound.buffer) {
                if (sound.isPlaying) sound.stop();
                sound.play();
            }
        });
    }

    const crushSoundBtn = document.getElementById('playCrushSound');
    if (crushSoundBtn) {
        crushSoundBtn.addEventListener('click', function () {
            if (secondSound.buffer) {
                if (secondSound.isPlaying) secondSound.stop();
                secondSound.play();
            }
        });
    }

    // CAMERA: HERO
    const heroBtn = document.getElementById('cameraHero');
    if (heroBtn) {
        heroBtn.addEventListener('click', function () {
            camera.position.set(0.15, 0.12, 0.3);
            controls.target.set(0, 0.07, 0);
            controls.update();
        });
    }

    // CAMERA: FRONT
    const frontBtn = document.getElementById('cameraFront');
    if (frontBtn) {
        frontBtn.addEventListener('click', function () {
            camera.position.set(0, 0.07, 0.35);
            controls.target.set(0, 0.07, 0);
            controls.update();
        });
    }

    // CAMERA: TOP
    const topBtn = document.getElementById('cameraTop');
    if (topBtn) {
        topBtn.addEventListener('click', function () {
            camera.position.set(0, 0.35, 0.001);
            controls.target.set(0, 0.07, 0);
            controls.update();
        });
    }

    // CAMERA: SIDE
    const sideBtn = document.getElementById('cameraSide');
    if (sideBtn) {
        sideBtn.addEventListener('click', function () {
            camera.position.set(0.35, 0.07, 0);
            controls.target.set(0, 0.07, 0);
            controls.update();
        });
    }

    // STUDIO SPOTLIGHT TOGGLE
    const spotToggle = document.getElementById('toggleSpotLight');
    if (spotToggle) {
        spotToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            const isOn = lights.spot.intensity > 0;
            lights.spot.intensity = isOn ? 0 : 8;
        });
    }

    // AMBIENT LIGHT TOGGLE
    const ambientToggle = document.getElementById('toggleAmbient');
    if (ambientToggle) {
        ambientToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            hemiLight.visible = !hemiLight.visible;
            ambientLight.visible = !ambientLight.visible;
        });
    }
}

function onResize() {
    const container = document.getElementById('threeContainer');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);
    if (secondModelMixer) secondModelMixer.update(delta);

    if (isRotating && loadedModel) {
        loadedModel.rotation.y += 0.01;
    }

    if (controls) controls.update();

    renderer.render(scene, camera);
}