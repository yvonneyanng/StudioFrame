// Initialize and update range sliders
function initRangeSliders() {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    // Set initial value
    input.style.setProperty("--value", input.value + "%");

    // Update on input change
    input.addEventListener("input", (e) => {
      e.target.style.setProperty("--value", e.target.value + "%");
    });
  });
}

// Call when DOM is loaded
document.addEventListener("DOMContentLoaded", initRangeSliders);
