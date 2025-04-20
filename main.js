import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

import { createScene } from "./scripts/sceneSetup.js";
import { animate } from "./scripts/animationLoop.js";
import { loadStudioAssets } from "./scripts/loadAssets.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const { scene, camera, controls } = createScene(renderer);
loadStudioAssets(scene, camera, renderer, controls);

animate(renderer, scene, camera, controls);
