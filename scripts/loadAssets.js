import { GLTFLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
// import { TransformControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/TransformControls.js";
import { StudioLight, UmbrellaStudioLight, VistaBeamLight } from "./light.js";

const gltfLoader = new GLTFLoader();
let isDragging = false;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
const intersectionPoint = new THREE.Vector3();

// List of draggable objects names
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
let activeCamera = "Camera1"; // Track which camera view is active
const DEFAULT_BACKDROP_SCALE = 3;

function setupBackdropControls(backdrop) {
  const controls = document.getElementById("backdrop-controls");
  const scaleSlider = document.getElementById("backdrop-scale");
  const resetButton = document.getElementById("reset-backdrop");

  // Enable controls when backdrop is selected
  if (selectedObject && selectedObject.name === "BackdropScreen") {
    controls.classList.add("enabled");
  } else {
    controls.classList.remove("enabled");
  }

  // Update progress bar on load
  const progress =
    ((scaleSlider.value - scaleSlider.min) /
      (scaleSlider.max - scaleSlider.min)) *
    100;
  scaleSlider.style.setProperty("--value", `${progress}%`);

  // Update scale and progress bar when slider changes
  scaleSlider.addEventListener("input", (e) => {
    if (backdrop) {
      const scale = parseFloat(e.target.value);
      backdrop.scale.set(scale, scale, scale);

      // Update progress bar
      const progress =
        ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
      e.target.style.setProperty("--value", `${progress}%`);
    }
  });

  // Reset scale to default
  resetButton.addEventListener("click", () => {
    if (backdrop) {
      backdrop.scale.set(
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE
      );
      scaleSlider.value = DEFAULT_BACKDROP_SCALE;
      // Update progress bar after reset
      const progress =
        ((DEFAULT_BACKDROP_SCALE - scaleSlider.min) /
          (scaleSlider.max - scaleSlider.min)) *
        100;
      scaleSlider.style.setProperty("--value", `${progress}%`);
    }
  });
}

function setupCameraPreview() {
  // Create preview renderer
  previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setSize(320, 180); // 16:9 aspect ratio
  previewRenderer.shadowMap.enabled = true;

  // Add renderer to preview container
  const container = document.getElementById("camera-preview");
  container.appendChild(previewRenderer.domElement);

  // Create preview camera
  previewCamera = new THREE.PerspectiveCamera(
    45, // FOV
    320 / 180, // Aspect ratio
    0.1, // Near
    1000 // Far
  );

  // Setup camera tabs
  const tabs = document.querySelectorAll(".camera-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");
      // Update active camera
      activeCamera = tab.dataset.camera;
    });
  });
}

function updatePreviewCamera(scene) {
  if (!previewCamera) return;

  const cameraModel = scene.getObjectByName(activeCamera);
  if (!cameraModel) return;

  // Get the camera model's world position
  const modelPosition = cameraModel.position;

  let localOffset, targetOffset;

  if (activeCamera === "Camera1") {
    // Camera1 settings - offset to the right and looking 45 degrees right
    localOffset = new THREE.Vector3(2, 4.5, 0);
    targetOffset = {
      x: 10, // Look right
      y: -2, // Look down
      z: -10, // Look forward
    };
  } else {
    // Camera2 settings - offset to the left and looking straight ahead
    localOffset = new THREE.Vector3(0, 4.5, 0.5);
    targetOffset = {
      x: 0, // Don't look right/left
      y: -2, // Look down
      z: -15, // Look further forward
    };
  }

  previewCamera.position.copy(modelPosition).add(localOffset);

  // Set look target based on active camera
  const target = new THREE.Vector3();
  target.copy(previewCamera.position);
  target.x += targetOffset.x;
  target.y += targetOffset.y;
  target.z += targetOffset.z;

  previewCamera.lookAt(target);
  previewCamera.updateProjectionMatrix();
}

function loadStudioAssets(scene, camera, renderer, controls) {
  // Setup preview camera
  setupCameraPreview();

  // Create a map to store lights
  const studioLights = new Map();

  // Setup mouse event listeners
  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mouseup", onMouseUp);

  // Add animation to render loop
  function animate() {
    requestAnimationFrame(animate);

    // Update preview camera and render preview
    if (previewCamera && previewRenderer) {
      updatePreviewCamera(scene);
      previewRenderer.render(scene, previewCamera);
    }
  }
  animate();

  // Add keyboard controls for light rotation
  window.addEventListener("keydown", (event) => {
    if (!selectedLight) return;

    const rotationSpeed = Math.PI / 32; // About 5.625 degrees per keypress

    switch (event.key) {
      case "ArrowLeft":
        selectedLight.rotation.y -= rotationSpeed;
        // Update the light position if it's a light object
        if (studioLights.has(selectedLight.name)) {
          studioLights
            .get(selectedLight.name)
            .updatePosition(selectedLight.position, selectedLight.rotation);
        }
        break;
      case "ArrowRight":
        selectedLight.rotation.y += rotationSpeed;
        // Update the light position if it's a light object
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

    // Check if we clicked on any draggable object
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
      // Find the top-level parent that matches our draggable names
      let parent = draggableIntersect.object.parent;
      while (parent && !DRAGGABLE_OBJECTS.includes(parent.name)) {
        parent = parent.parent;
      }
      selectedObject = parent;

      // Set the selected light if it's a light object
      selectedLight =
        parent.name === "KBabyLight" ||
        parent.name === "UmbrellaLight" ||
        parent.name === "VistaBeam"
          ? parent
          : null;

      // Update backdrop controls visibility
      setupBackdropControls(backdropScreen);

      document.body.style.cursor = "grab";
      // Disable orbit controls
      controls.enabled = false;
    } else {
      // Clear selection when clicking elsewhere
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

      // Update object position, keeping its y position constant
      selectedObject.position.x = intersectionPoint.x;
      selectedObject.position.z = intersectionPoint.z;
      document.body.style.cursor = "grabbing";

      // Update light position if this is a light object
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
      // Re-enable orbit controls
      controls.enabled = true;
    }
  }

  gltfLoader.load(
    "./assets/models/BackdropScreen.glb",
    (gltf) => {
      const screen = gltf.scene;
      screen.position.set(0, 0, -6);
      screen.scale.set(
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE,
        DEFAULT_BACKDROP_SCALE
      );
      screen.name = "BackdropScreen";
      screen.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Make the material non-reflective
          if (child.material) {
            child.material.roughness = 1;
            child.material.metalness = 0;
          }
        }
      });
      scene.add(screen);
      backdropScreen = screen;

      // Initialize backdrop controls
      setupBackdropControls(backdropScreen);
    },
    undefined,
    (error) => {
      console.error("Failed to load backdrop screen:", error);
    }
  );

  // Load Astronaut
  gltfLoader.load(
    "./assets/models/Astronaut.glb",
    (gltf) => {
      const astronaut = gltf.scene;
      astronaut.position.set(0, 0, -4); // Position to the right of the chair
      astronaut.scale.set(2, 2, 2);
      astronaut.name = "Astronaut";
      astronaut.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(astronaut);
    },
    undefined,
    (error) => {
      console.error("Failed to load Astronaut.glb:", error);
    }
  );

  // Load KBaby Light
  gltfLoader.load(
    "./assets/models/KBabyLight.glb",
    (gltf) => {
      const KBLight = gltf.scene;
      KBLight.position.set(8, 0, -5);
      KBLight.scale.set(3.5, 3.5, 3.5);
      KBLight.name = "KBabyLight";
      KBLight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(KBLight);

      // Create and setup spotlight for KBabyLight
      const kbSpotlight = new StudioLight(scene);
      // Set the light origin offset based on the model's structure
      kbSpotlight.setOffset(0, 6, 0); // Adjust these values to match the bulb position in the model
      kbSpotlight.updatePosition(KBLight.position, KBLight.rotation);
      studioLights.set("KBabyLight", kbSpotlight);

      // Setup event listeners for the light controls
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
    undefined,
    (error) => {
      console.error("Failed to load KBabyLight.glb:", error);
    }
  );

  gltfLoader.load(
    "./assets/models/VistaBeamLight.glb",
    (gltf) => {
      const VBlight = gltf.scene;
      VBlight.position.set(-8, 0, -5);
      VBlight.scale.set(4, 4, 4);
      VBlight.name = "VistaBeam";
      VBlight.rotation.y = -Math.PI / 4 + (40 * Math.PI) / 180;
      VBlight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(VBlight);

      // Create and setup vista beam light
      const vistaBeamLight = new VistaBeamLight(scene);
      vistaBeamLight.setOffset(0, 7, 0); // Adjust z offset to match the light strips
      vistaBeamLight.updatePosition(VBlight.position, VBlight.rotation);
      studioLights.set("VistaBeam", vistaBeamLight);

      // Setup event listeners for the light controls
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
    undefined,
    (error) => {
      console.error("Failed to load VistaBeamLight.glb:", error);
    }
  );

  gltfLoader.load(
    "./assets/models/UmbrellaLight.glb",
    (gltf) => {
      const Ulight = gltf.scene;
      Ulight.position.set(7, 0, 5);
      Ulight.scale.set(4, 4, 4);
      Ulight.name = "UmbrellaLight";
      Ulight.rotation.y = -Math.PI / 4; // Same initial rotation as KBabyLight
      Ulight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(Ulight);

      // Create and setup umbrella light
      const umbrellaSpotlight = new UmbrellaStudioLight(scene);
      umbrellaSpotlight.setOffset(0, 6, 0); // Set the light origin offset
      umbrellaSpotlight.updatePosition(Ulight.position, Ulight.rotation);
      studioLights.set("UmbrellaLight", umbrellaSpotlight);

      // Setup event listeners for the light controls
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
    undefined,
    (error) => {
      console.error("Failed to load UmbrellaLight.glb:", error);
    }
  );

  // Load Clapperboard
  gltfLoader.load(
    "./assets/models/Clapperboard.glb",
    (gltf) => {
      const clapperboard = gltf.scene;
      clapperboard.position.set(-3, 0.25, -2);
      clapperboard.rotation.y = Math.PI / 4; // 45 degrees in radians
      clapperboard.scale.set(4, 4, 4);
      clapperboard.name = "Clapperboard";
      clapperboard.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(clapperboard);
    },
    undefined,
    (error) => {
      console.error("Failed to load Clapperboard.glb:", error);
    }
  );

  // Load Camera1
  gltfLoader.load(
    "./assets/models/Camera1.glb",
    (gltf) => {
      const camera1 = gltf.scene;
      camera1.position.set(-7, 0, 4);
      camera1.scale.set(3, 3, 3);
      camera1.rotation.set(0, -Math.PI * 0.75, 0); // Rotate 135 degrees right
      camera1.name = "Camera1";
      camera1.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(camera1);

      // Initial preview camera update
      updatePreviewCamera(scene);
    },
    undefined,
    (error) => {
      console.error("Failed to load Camera1.glb:", error);
    }
  );

  // Load Camera2
  gltfLoader.load(
    "./assets/models/Camera2.glb",
    (gltf) => {
      const camera2 = gltf.scene;
      camera2.position.set(0, 0, 5);
      camera2.scale.set(3, 3, 3);
      camera2.rotation.set(0, -Math.PI / 2, 0);
      camera2.name = "Camera2";
      camera2.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(camera2);
    },
    undefined,
    (error) => {
      console.error("Failed to load Camera2.glb:", error);
    }
  );
}

export { loadStudioAssets };
