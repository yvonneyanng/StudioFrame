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
