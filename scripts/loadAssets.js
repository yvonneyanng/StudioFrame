import { GLTFLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
// import { TransformControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/TransformControls.js";

const gltfLoader = new GLTFLoader();
let isDragging = false;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
const intersectionPoint = new THREE.Vector3();

// List of draggable object names
const DRAGGABLE_OBJECTS = ["Chair", "KBabyLight", "VistaBeam", "UmbrellaLight"];

function loadStudioAssets(scene, camera, renderer, controls) {
  // Create transform controls
  // const transformControls = new TransformControls(camera, renderer.domElement);
  // scene.add(transformControls);

  // Setup mouse event listeners
  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mouseup", onMouseUp);

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
      document.body.style.cursor = "grab";
      // Disable orbit controls
      controls.enabled = false;
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
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      selectedObject = null;
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
      screen.scale.set(3, 3, 3);
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
    },
    undefined,
    (error) => {
      console.error("Failed to load backdrop screen:", error);
    }
  );

  // Load Camera1
  gltfLoader.load(
    "./assets/models/Chair.glb",
    (gltf) => {
      const chair = gltf.scene;
      chair.position.set(0, 0, -3);
      chair.scale.set(3, 3, 3);
      chair.name = "Chair"; // Add name for identification
      chair.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(chair);
    },
    undefined,
    (error) => {
      console.error("Failed to load Chair.glb:", error);
    }
  );

  gltfLoader.load(
    "./assets/models/KBabyLight.glb",
    (gltf) => {
      const KBLight = gltf.scene;
      KBLight.position.set(8, 0, -5); // Position it near the green screen
      KBLight.scale.set(3.5, 3.5, 3.5);
      KBLight.name = "KBabyLight";
      KBLight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(KBLight);
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
      VBlight.position.set(-8, 0, -5); // Position it near the green screen
      VBlight.scale.set(4, 4, 4);
      VBlight.name = "VistaBeam";
      VBlight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(VBlight);
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
      Ulight.position.set(7, 0, 5); // Position it near the green screen
      Ulight.scale.set(4, 4, 4);
      Ulight.name = "UmbrellaLight";
      Ulight.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(Ulight);
    },
    undefined,
    (error) => {
      console.error("Failed to load UmbrellaLight.glb:", error);
    }
  );

  // Load Camera1
  gltfLoader.load(
    "./assets/models/Camera1.glb",
    (gltf) => {
      const camera1 = gltf.scene;
      camera1.position.set(-20, 0, 18);
      camera1.scale.set(3, 3, 3);
      camera1.rotation.set(0, -Math.PI * 0.75, 0); // Rotate 135 degrees right
      camera1.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(camera1);
    },
    undefined,
    (error) => {
      console.error("Failed to load Camera1.glb:", error);
    }
  );

  // Load Camera2 with transform controls
  gltfLoader.load(
    "./assets/models/Camera2.glb",
    (gltf) => {
      const camera2 = gltf.scene;
      camera2.position.set(5, 0, 30);
      camera2.scale.set(4, 4, 4);
      camera2.rotation.set(0, -Math.PI / 2, 0);
      camera2.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(camera2);

      // // Attach transform controls to camera2
      // transformControls.attach(camera2);
      // transformControls.setMode("translate"); // Start with translation mode

      // // Add keyboard controls for transform modes
      // window.addEventListener("keydown", (event) => {
      //   switch (event.key.toLowerCase()) {
      //     case "g":
      //       transformControls.setMode("translate");
      //       break;
      //     case "r":
      //       transformControls.setMode("rotate");
      //       break;
      //     case "s":
      //       transformControls.setMode("scale");
      //       break;
      //   }
      // });
    },
    undefined,
    (error) => {
      console.error("❌ Failed to load Camera2.glb:", error);
    }
  );
}

export { loadStudioAssets };
