// Dismiss the activation overlay on the first real user gesture — any of
// click, keydown, or touchstart will do. Browsers require a user activation
// in this document before allowing video.play() with sound.
const display = window.display;

display.onReadys.push(() => {
  const overlay = document.getElementById("activation-overlay");
  if (!overlay) return;

  const dismiss = () => {
    overlay.classList.add("dismissed");
    window.removeEventListener("click", dismiss, true);
    window.removeEventListener("keydown", dismiss, true);
    window.removeEventListener("touchstart", dismiss, true);
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
  };

  window.addEventListener("click", dismiss, true);
  window.addEventListener("keydown", dismiss, true);
  window.addEventListener("touchstart", dismiss, true);
});
