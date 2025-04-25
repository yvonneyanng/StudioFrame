// =============================== RANGE SLIDERS ===============================
function initRangeSliders() {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    input.style.setProperty("--value", input.value + "%");
    input.addEventListener("input", (e) => {
      e.target.style.setProperty("--value", e.target.value + "%");
    });
  });
}

document.addEventListener("DOMContentLoaded", initRangeSliders);
