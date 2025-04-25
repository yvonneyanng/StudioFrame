import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

// =============================== TEXTURES ===============================
const textureLoader = new THREE.TextureLoader();
const brickTexture = textureLoader.load(
  "./assets/textures/red_brick_diff_4k.jpg"
);
const floorTexture = textureLoader.load(
  "./assets/textures/gravel_concrete_03_diff_4k.jpg"
);

// =============================== TEXTURE SETUP ===============================
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(2, 2);

floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(4, 4);

// =============================== SCENE SETUP ===============================
function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // =============================== CAMERA ===============================
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 30, 20);
  camera.lookAt(0, 0, 0);

  // =============================== CONTROLS ===============================
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // =============================== LIGHTS ===============================
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(5, 5, 5);
  scene.add(light);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
  light2.position.set(-10, -10, -10);
  scene.add(light2);

  // =============================== FLOOR ===============================
  const floorGeometry = new THREE.BoxGeometry(26.66, 0.5, 26.66);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.25;
  floor.position.z = -0.25;
  floor.receiveShadow = true;
  scene.add(floor);

  // =============================== WALLS ===============================
  function createWall(
    width,
    height,
    position,
    rotation,
    useDebugColor = false
  ) {
    const thickness = 0.5;
    const geometry = new THREE.BoxGeometry(width, height + 0.5, thickness);

    let material;
    if (useDebugColor) {
      material = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
      });
    } else {
      const texture = new THREE.TextureLoader().load(
        "./assets/textures/red_brick_diff_4k.jpg"
      );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);

      material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
    }

    const wall = new THREE.Mesh(geometry, material);
    const [x, y, z] = position;
    wall.position.set(x, y - 0.25, z);
    wall.rotation.set(...rotation);
    wall.receiveShadow = true;

    return wall;
  }

  // =============================== BACK WALL ===============================
  const backWall = createWall(26.66, 16, [0, 8, -13.33], [0, 0, 0]);
  scene.add(backWall);

  // =============================== LEFT WALL ===============================
  const leftWall = createWall(
    26.66,
    16,
    [-13.33, 8, -0.25],
    [0, Math.PI / 2, 0]
  );
  scene.add(leftWall);

  // =============================== RIGHT WALL ===============================
  const rightWall = createWall(
    26.66,
    16,
    [13.33, 8, -0.25],
    [0, -Math.PI / 2, 0]
  );
  scene.add(rightWall);

  return { scene, camera, controls };
}

export { createScene };
