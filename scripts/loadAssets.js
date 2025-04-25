import { GLTFLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
import { StudioLight, UmbrellaLight, VistaBeamLight } from "./light.js";

const gltfLoader = new GLTFLoader();
let isDragging = false;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
const intersectionPoint = new THREE.Vector3();

const BASE_MODEL_URL =
  "https://studio-frame.s3.us-east-1.amazonaws.com/models/";

const DRAGGABLE_OBJECTS = [
  "KBabyLight",
  "VistaBeam",
  "UmbrellaLight",
  "Clapperboard",
  "Camera1",
  "Camera2",
  "Astronaut",
  "BackdropScreen",
];

let selectedLight = null;
let backdropScreen = null;
let previewCamera = null;
let previewRenderer = null;
let activeCamera = "Camera1";
const DEFAULT_BACKDROP_SCALE = 3;

// =============================== BACKDROP CONTROLS ===============================
function setupBackdropControls(backdrop) {
  const controls = document.getElementById("backdrop-controls");
  const scaleSlider = document.getElementById("backdrop-scale");
  const resetButton = document.getElementById("reset-backdrop");

  if (selectedObject && selectedObject.name === "BackdropScreen") {
    controls.classList.add("enabled");
  } else {
    controls.classList.remove("enabled");
  }

  const progress =
    ((scaleSlider.value - scaleSlider.min) /
      (scaleSlider.max - scaleSlider.min)) *
    100;
  scaleSlider.style.setProperty("--value", `${progress}%`);
  scaleSlider.addEventListener("input", (e) => {
    if (backdrop) {
      const scale = parseFloat(e.target.value);
      backdrop.scale.set(scale, scale, scale);
      const progress =
        ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
      e.target.style.setProperty("--value", `${progress}%`);
    }
  });

  resetButton.addEventListener("click", () => {
    if (backdrop) {
      backdrop.scale.set(
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE
      );
      scaleSlider.value = DEFAULT_BACKDROP_SCALE;
      const progress =
        ((DEFAULT_BACKDROP_SCALE - scaleSlider.min) /
          (scaleSlider.max - scaleSlider.min)) *
        100;
      scaleSlider.style.setProperty("--value", `${progress}%`);
    }
  });
}

// =============================== CAMERA PREVIEW WINDOW ===============================
function setupCameraPreview() {
  previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setSize(320, 180);
  previewRenderer.shadowMap.enabled = true;

  const container = document.getElementById("camera-preview");
  container.appendChild(previewRenderer.domElement);

  previewCamera = new THREE.PerspectiveCamera(45, 320 / 180, 0.1, 1000);

  const tabs = document.querySelectorAll(".camera-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeCamera = tab.dataset.camera;
    });
  });
}

function updatePreviewCamera(scene) {
  if (!previewCamera) return;

  const cameraModel = scene.getObjectByName(activeCamera);
  if (!cameraModel) return;

  const modelPosition = cameraModel.position;
  let localOffset, targetOffset;

  if (activeCamera === "Camera1") {
    localOffset = new THREE.Vector3(2, 4.5, 0);
    targetOffset = {
      x: 10,
      y: -2,
      z: -10,
    };
  } else {
    localOffset = new THREE.Vector3(0, 4.5, 0.5);
    targetOffset = {
      x: 0,
      y: -2,
      z: -15,
    };
  }

  previewCamera.position.copy(modelPosition).add(localOffset);

  const target = new THREE.Vector3();
  target.copy(previewCamera.position);
  target.x += targetOffset.x;
  target.y += targetOffset.y;
  target.z += targetOffset.z;

  previewCamera.lookAt(target);
  previewCamera.updateProjectionMatrix();
}

// =============================== ASSETS ===============================
function loadStudioAssets(scene, camera, renderer, controls) {
  setupCameraPreview();

  const studioLights = new Map();

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mouseup", onMouseUp);

  function animate() {
    requestAnimationFrame(animate);

    if (previewCamera && previewRenderer) {
      updatePreviewCamera(scene);
      previewRenderer.render(scene, previewCamera);
    }
  }
  animate();

  // =============================== KEYBOARD & MOUSE CONTROLS ===============================
  window.addEventListener("keydown", (event) => {
    if (!selectedLight) return;

    const rotationSpeed = Math.PI / 32;

    switch (event.key) {
      case "ArrowLeft":
        selectedLight.rotation.y -= rotationSpeed;
        if (studioLights.has(selectedLight.name)) {
          studioLights
            .get(selectedLight.name)
            .updatePosition(selectedLight.position, selectedLight.rotation);
        }
        break;
      case "ArrowRight":
        selectedLight.rotation.y += rotationSpeed;
        if (studioLights.has(selectedLight.name)) {
          studioLights
            .get(selectedLight.name)
            .updatePosition(selectedLight.position, selectedLight.rotation);
        }
        break;
    }
  });

  function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const draggableIntersect = intersects.find((intersect) => {
      let parent = intersect.object.parent;
      while (parent) {
        if (DRAGGABLE_OBJECTS.includes(parent.name)) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    });

    if (draggableIntersect) {
      isDragging = true;
      let parent = draggableIntersect.object.parent;
      while (parent && !DRAGGABLE_OBJECTS.includes(parent.name)) {
        parent = parent.parent;
      }
      selectedObject = parent;
      selectedLight =
        parent.name === "KBabyLight" ||
        parent.name === "UmbrellaLight" ||
        parent.name === "VistaBeam"
          ? parent
          : null;

      setupBackdropControls(backdropScreen);

      document.body.style.cursor = "grab";
      controls.enabled = false;
    } else {
      selectedLight = null;
      selectedObject = null;
      setupBackdropControls(backdropScreen);
    }
  }

  function onMouseMove(event) {
    if (isDragging && selectedObject) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      selectedObject.position.x = intersectionPoint.x;
      selectedObject.position.z = intersectionPoint.z;
      document.body.style.cursor = "grabbing";

      if (studioLights.has(selectedObject.name)) {
        studioLights
          .get(selectedObject.name)
          .updatePosition(selectedObject.position, selectedObject.rotation);
      }
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "default";
      controls.enabled = true;
    }
  }

  // =============================== LOAD MODELS ===============================
  function loadModel(url, name, onLoad, position, rotation, scale) {
    gltfLoader.load(
      url,
      (gltf) => {
        console.log(`Successfully loaded: ${name}`);
        const model = gltf.scene;
        model.position.copy(position);
        if (rotation) model.rotation.copy(rotation);
        model.scale.set(scale, scale, scale);
        model.name = name;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
        if (onLoad) onLoad(model);
      },
      (xhr) => {
        console.log(
          `Loading ${name}: ${(xhr.loaded / xhr.total) * 100}% loaded`
        );
      },
      (error) => {
        console.error(`Failed to load ${name}:`, error);
        console.error(`Error:`, {
          message: error.message,
          url: url,
          name: name,
        });
      }
    );
  }

  // =============================== BACKDROP SCREEN ===============================
  loadModel(
    `${BASE_MODEL_URL}BackdropScreen.glb`,
    "BackdropScreen",
    (screen) => {
      backdropScreen = screen;
      setupBackdropControls(backdropScreen);
    },
    new THREE.Vector3(0, 0, -6),
    null,
    DEFAULT_BACKDROP_SCALE
  );

  // =============================== ASTRONAUT ===============================
  loadModel(
    `${BASE_MODEL_URL}Astronaut.glb`,
    "Astronaut",
    null,
    new THREE.Vector3(0, 0, -4),
    null,
    2
  );

  // =============================== K BABY LIGHT ===============================
  loadModel(
    `${BASE_MODEL_URL}KBabyLight.glb`,
    "KBabyLight",
    (KBLight) => {
      const kbSpotlight = new StudioLight(scene);
      kbSpotlight.setOffset(0, 6, 0);
      kbSpotlight.updatePosition(KBLight.position, KBLight.rotation);
      studioLights.set("KBabyLight", kbSpotlight);

      const intensitySlider = document.getElementById("key-light-intensity");
      const colorPicker = document.getElementById("key-light-color");
      const toggleSwitch = document.getElementById("key-light-toggle");

      if (intensitySlider) {
        intensitySlider.addEventListener("input", (e) => {
          kbSpotlight.setIntensity(e.target.value / 100);
        });
      }

      if (colorPicker) {
        colorPicker.addEventListener("input", (e) => {
          kbSpotlight.setColor(e.target.value);
        });
      }

      if (toggleSwitch) {
        toggleSwitch.addEventListener("change", (e) => {
          kbSpotlight.toggle(e.target.checked);
        });
      }
    },
    new THREE.Vector3(8, 0, -5),
    null,
    3.5
  );

  // =============================== VISTA BEAM LIGHT ===============================
  loadModel(
    `${BASE_MODEL_URL}VistaBeamLight.glb`,
    "VistaBeam",
    (VBlight) => {
      const vistaBeamLight = new VistaBeamLight(scene);
      vistaBeamLight.setOffset(0, 7, 0);
      vistaBeamLight.updatePosition(VBlight.position, VBlight.rotation);
      studioLights.set("VistaBeam", vistaBeamLight);

      const intensitySlider = document.getElementById("back-light-intensity");
      const colorPicker = document.getElementById("back-light-color");
      const toggleSwitch = document.getElementById("back-light-toggle");

      if (intensitySlider) {
        intensitySlider.addEventListener("input", (e) => {
          vistaBeamLight.setIntensity(e.target.value / 100);
        });
      }

      if (colorPicker) {
        colorPicker.addEventListener("input", (e) => {
          vistaBeamLight.setColor(e.target.value);
        });
      }

      if (toggleSwitch) {
        toggleSwitch.addEventListener("change", (e) => {
          vistaBeamLight.toggle(e.target.checked);
        });
      }
    },
    new THREE.Vector3(-8, 0, -5),
    new THREE.Euler(0, -Math.PI / 4 + (40 * Math.PI) / 180, 0),
    4
  );

  // =============================== UMBRELLA LIGHT ===============================
  loadModel(
    `${BASE_MODEL_URL}UmbrellaLight.glb`,
    "UmbrellaLight",
    (Ulight) => {
      const umbrellaSpotlight = new UmbrellaLight(scene);
      umbrellaSpotlight.setOffset(0, 6, 0);
      umbrellaSpotlight.updatePosition(Ulight.position, Ulight.rotation);
      studioLights.set("UmbrellaLight", umbrellaSpotlight);

      const intensitySlider = document.getElementById("fill-light-intensity");
      const colorPicker = document.getElementById("fill-light-color");
      const toggleSwitch = document.getElementById("fill-light-toggle");

      if (intensitySlider) {
        intensitySlider.addEventListener("input", (e) => {
          umbrellaSpotlight.setIntensity(e.target.value / 100);
        });
      }

      if (colorPicker) {
        colorPicker.addEventListener("input", (e) => {
          umbrellaSpotlight.setColor(e.target.value);
        });
      }

      if (toggleSwitch) {
        toggleSwitch.addEventListener("change", (e) => {
          umbrellaSpotlight.toggle(e.target.checked);
        });
      }
    },
    new THREE.Vector3(7, 0, 5),
    new THREE.Euler(0, -Math.PI / 4, 0),
    4
  );

  // =============================== CLAPPERBOARD ===============================
  loadModel(
    `${BASE_MODEL_URL}Clapperboard.glb`,
    "Clapperboard",
    null,
    new THREE.Vector3(-3, 0.25, -2),
    new THREE.Euler(0, Math.PI / 4, 0),
    4
  );

  // =============================== CAMERA 1 ===============================
  loadModel(
    `${BASE_MODEL_URL}Camera1.glb`,
    "Camera1",
    null,
    new THREE.Vector3(-7, 0, 4),
    new THREE.Euler(0, -Math.PI * 0.75, 0),
    3
  );

  // =============================== CAMERA 2 ===============================
  loadModel(
    `${BASE_MODEL_URL}Camera2.glb`,
    "Camera2",
    null,
    new THREE.Vector3(0, 0, 5),
    new THREE.Euler(0, -Math.PI / 2, 0),
    3
  );
}

export { loadStudioAssets };
