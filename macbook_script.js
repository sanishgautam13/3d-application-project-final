/* MACBOOK PAGE*/
let scene, camera, renderer, clock, controls;
let loadedModel, mixer, lidAction;
let isWireframe = false, isRotating = false;
let isMacOpen = false;
let screenPanel, lidLogo, keyboardKeys = [];
let studioLight, ambientLight, screenGlowLight;
let startupSound;

init();

function init() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);

    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    camera.position.set(0.6, 0.45, 0.6);

    const container = document.getElementById('threeContainer');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.05, 0);
    controls.update();

    ambientLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(0.5, 1, 0.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.25);
    fillLight.position.set(-0.5, 0.4, -0.3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 0.3, -0.8);
    scene.add(rimLight);

    studioLight = new THREE.SpotLight(0xffffff, 0);
    studioLight.position.set(0, 1.2, 0.4);
    studioLight.angle = Math.PI / 5;
    studioLight.penumbra = 0.4;
    studioLight.target.position.set(0, 0, 0);
    scene.add(studioLight);
    scene.add(studioLight.target);

    screenGlowLight = new THREE.PointLight(0x4080ff, 0, 0.6);
    screenGlowLight.position.set(0, 0.15, 0.05);
    scene.add(screenGlowLight);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    startupSound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/audio/mac_startup.m4a', function (buffer) {
        startupSound.setBuffer(buffer);
        startupSound.setVolume(0.7);
    }, undefined, function (err) {
        console.warn('Could not load startup sound:', err);
    });

    loadModel();

    setupEventListeners();

    window.addEventListener('resize', onResize);
    onResize();

    animate();
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/macbook.glb', function (gltf) {
        loadedModel = gltf.scene;
        loadedModel.position.set(0, 0, 0);
        scene.add(loadedModel);

        loadedModel.traverse(function (child) {
            if (!child.isMesh) return;

            if (child.name === 'ScreenPanel') {
                screenPanel = child;
                if (!child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
                child.material.emissiveIntensity = 0;
            }

            if (child.name === 'LidLogo') {
                lidLogo = child;
                if (!child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
                child.material.emissiveIntensity = 0;
            }

            // Collect all the keyboard keys for backlight control
            if (child.name && child.name.startsWith('Key_')) {
                keyboardKeys.push(child);
                if (!child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
                child.material.emissiveIntensity = 0;
            }
        });

        // Set up the lid open animation
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(loadedModel);
            lidAction = mixer.clipAction(gltf.animations[0]);
            lidAction.setLoop(THREE.LoopOnce);
            lidAction.clampWhenFinished = true;
            // Stay closed at frame 0
            lidAction.play();
            lidAction.paused = true;
            lidAction.time = 0;
        }

        console.log('MacBook loaded. Keys found:', keyboardKeys.length);
    }, undefined, function (error) {
        console.error('Error loading MacBook:', error);
    });
}


function openMacBookSequence() {
    if (isMacOpen) return;
    isMacOpen = true;

    //play the lid animation 
    if (lidAction) {
        lidAction.reset();
        lidAction.timeScale = 1;
        lidAction.paused = false;
        lidAction.play();
    }

    setTimeout(function () {
        if (startupSound && startupSound.buffer) {
            if (startupSound.isPlaying) startupSound.stop();
            startupSound.play();
        }
    }, 1500);

    setTimeout(function () {
        fadeScreenOn();
    }, 1800);

    setTimeout(function () {
        fadeKeyboardOn();
    }, 2400);
}

function closeMacBookSequence() {
    if (!isMacOpen) return;
    isMacOpen = false;

    // Turn the screen and keyboard off immediately
    if (screenPanel) {
        screenPanel.material.emissiveIntensity = 0;
        screenPanel.material.needsUpdate = true;
    }
    if (lidLogo) {
        lidLogo.material.emissiveIntensity = 0;
        lidLogo.material.needsUpdate = true;
    }
    keyboardKeys.forEach(function (key) {
        key.material.emissiveIntensity = 0;
        key.material.needsUpdate = true;
    });
    if (screenGlowLight) screenGlowLight.intensity = 0;

    // Stop the startup sound if it's still playing
    if (startupSound && startupSound.isPlaying) {
        startupSound.stop();
    }

    // Reverse the lid animation
    if (lidAction) {
        lidAction.timeScale = -1;
        lidAction.paused = false;
        if (lidAction.time === 0) lidAction.time = lidAction.getClip().duration;
        lidAction.play();
    }
}

function fadeScreenOn() {
    if (!screenPanel) return;

    screenPanel.material.emissive = new THREE.Color(0x4080ff);
    lidLogo && (lidLogo.material.emissive = new THREE.Color(0xffffff));

    let intensity = 0;
    const target = 1.5;
    const fade = setInterval(function () {
        intensity += 0.1;
        screenPanel.material.emissiveIntensity = intensity;
        screenPanel.material.needsUpdate = true;

        if (lidLogo) {
            lidLogo.material.emissiveIntensity = intensity * 0.5;
            lidLogo.material.needsUpdate = true;
        }

        // Fade in the room glow too
        screenGlowLight.intensity = intensity * 1.2;

        if (intensity >= target) clearInterval(fade);
    }, 30);
}

function fadeKeyboardOn() {
    if (keyboardKeys.length === 0) return;

    // Soft cool-white glow — matches the screen tone
    keyboardKeys.forEach(function (key) {
        key.material.emissive = new THREE.Color(0xc8d8ff);
    });

    let intensity = 0;
    const target = 0.12;
    const fade = setInterval(function () {
        intensity += 0.01;
        keyboardKeys.forEach(function (key) {
            key.material.emissiveIntensity = intensity;
            key.material.needsUpdate = true;
        });
        if (intensity >= target) clearInterval(fade);
    }, 40);
}


// EVENT LISTENERS

function setupEventListeners() {

    document.getElementById('openMacBook').addEventListener('click', function () {
        this.classList.add('active');
        document.getElementById('closeMacBook').classList.remove('active');
        openMacBookSequence();
    });

    document.getElementById('closeMacBook').addEventListener('click', function () {
        this.classList.add('active');
        document.getElementById('openMacBook').classList.remove('active');
        closeMacBookSequence();
    });

    document.getElementById('toggleRotate').addEventListener('click', function () {
        isRotating = !isRotating;
        this.classList.toggle('active');
    });

    document.getElementById('toggleWireframe').addEventListener('click', function () {
        isWireframe = !isWireframe;
        this.classList.toggle('active');
        if (loadedModel) {
            loadedModel.traverse(function (child) {
                if (child.isMesh) child.material.wireframe = isWireframe;
            });
        }
    });

    document.getElementById('resetModel').addEventListener('click', function () {
        // Close the lid
        closeMacBookSequence();

        // Reset rotation
        if (loadedModel) loadedModel.rotation.y = 0;
        isRotating = false;
        document.getElementById('toggleRotate').classList.remove('active');

        // Reset wireframe
        isWireframe = false;
        document.getElementById('toggleWireframe').classList.remove('active');
        if (loadedModel) {
            loadedModel.traverse(function (child) {
                if (child.isMesh) child.material.wireframe = false;
            });
        }

        // Reset camera
        camera.position.set(0.6, 0.45, 0.6);
        controls.target.set(0, 0.05, 0);
        controls.update();

        // Reset body colour to silver
        setBodyColour(0xc8c8cd);
    });

    // CAMERA ANGLES
    document.getElementById('cameraHero').addEventListener('click', function () {
        camera.position.set(0.6, 0.45, 0.6);
        controls.target.set(0, 0.05, 0);
        controls.update();
    });

    document.getElementById('cameraFront').addEventListener('click', function () {
        camera.position.set(0, 0.15, 0.7);
        controls.target.set(0, 0.05, 0);
        controls.update();
    });

    document.getElementById('cameraTop').addEventListener('click', function () {
        camera.position.set(0, 0.8, 0.001);
        controls.target.set(0, 0, 0);
        controls.update();
    });

    document.getElementById('cameraSide').addEventListener('click', function () {
        camera.position.set(0.7, 0.15, 0);
        controls.target.set(0, 0.05, 0);
        controls.update();
    });

    // BODY COLOUR
    document.getElementById('colourSilver').addEventListener('click', function () {
        this.classList.add('active');
        document.getElementById('colourSpaceGrey').classList.remove('active');
        setBodyColour(0xc8c8cd);
    });

    document.getElementById('colourSpaceGrey').addEventListener('click', function () {
        this.classList.add('active');
        document.getElementById('colourSilver').classList.remove('active');
        setBodyColour(0x4a4a4d);
    });

    // LIGHTING
    document.getElementById('toggleStudioLight').addEventListener('click', function () {
        this.classList.toggle('active');
        studioLight.intensity = studioLight.intensity > 0 ? 0 : 8;
    });

    document.getElementById('toggleAmbient').addEventListener('click', function () {
        this.classList.toggle('active');
        ambientLight.visible = !ambientLight.visible;
    });
}

function setBodyColour(hex) {
    if (!loadedModel) return;
    loadedModel.traverse(function (child) {
        if (child.isMesh && child.material && child.material.name === 'BaseMaterial') {
            child.material.color.setHex(hex);
            child.material.needsUpdate = true;
        }
    });
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
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);
    if (isRotating && loadedModel) loadedModel.rotation.y += 0.005;
    if (controls) controls.update();

    renderer.render(scene, camera);
}