// import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
// import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

function animate(renderer, scene, camera, controls) {
  console.log("🔄 Animation started");

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    controls.update();
    renderer.render(scene, camera);
  }

  renderLoop();
}

export { animate };
