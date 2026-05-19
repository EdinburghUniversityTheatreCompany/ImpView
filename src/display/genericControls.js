import { $ } from "../lib/dom.js";
import { FADE_MS } from "../lib/timings.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

// Find the speed-controlled CSS animation for a target element.
// Returns the animation object to update via updatePlaybackRate, or null.
function speedControlledAnim(target, el) {
  if (display.activeLoop && display.activeLoop.target === target) {
    const name = display.activeLoop.className;
    return el.getAnimations().find((a) => a.animationName === name) ?? null;
  }
  if (el.classList.contains("spin-continuous"))
    return el.getAnimations().find((a) => a.animationName === "spin") ?? null;
  if (el.classList.contains("spin-y-continuous"))
    return el.getAnimations().find((a) => a.animationName === "spinY") ?? null;
  return null;
}

// After a speed-controlled animation stops, sync --anim-duration to the latest
// desired value so the next animation start uses the correct speed.
display.syncSpeedCssVar = function (target) {
  const desired = display.desiredDurationS[target];
  if (desired === undefined) return;
  const el = document.getElementById(target);
  if (el) el.style.setProperty("--anim-duration", desired + "s");
  display.naturalDurationS[target] = desired;
};

function stopActiveLoop(target, target$) {
  const loop = display.activeLoop;
  if (loop && loop.target === target) {
    target$.removeClass("animated");
    target$.removeClass(loop.className);
    const el = target$.get(0);
    if (el) {
      el.style.animationIterationCount = "";
      el.style.animationDirection = "";
    }
    display.activeLoop = null;
    display.syncSpeedCssVar(target);
  }
}

messageHandlers.push((message) => {
  if (message.type !== "control") return;

  const target = message.target;
  const target$ = $("#" + target);

  // Alphabet handles show/hide itself.
  if (target === "alphabet") return;

  switch (message.action) {
    case "hide":
      stopActiveLoop(target, target$);
      target$.hide();
      display.sendVisibility(message.target);
      break;
    case "show":
      target$.show();
      display.sendVisibility(message.target);
      break;
    case "setValue":
      if (target !== "credits") {
        target$.text(message.value);
      }
      break;
    case "setColor":
      target$.css("color", message.value);
      break;
    case "fadeIn":
      target$.fadeIn(FADE_MS, () => display.sendVisibility(message.target));
      break;
    case "fadeOut":
      stopActiveLoop(target, target$);
      target$.fadeOut(FADE_MS, () => display.sendVisibility(message.target));
      break;
    case "animate":
      display.animate(message, target, target$);
      break;
    case "toggle-class":
      target$.toggleClass(message.value);
      // After removing a spin class, sync --anim-duration for the next spin start.
      if (
        (message.value === "spin-continuous" || message.value === "spin-y-continuous") &&
        !target$.get(0)?.classList.contains(message.value)
      ) {
        display.syncSpeedCssVar(target);
      }
      break;
    case "stop-loop":
      stopActiveLoop(target, target$);
      break;
    case "set-speed": {
      const el = target$.get(0);
      if (!el) break;
      const newDuration = message.value;
      display.desiredDurationS[target] = newDuration;

      const anim = speedControlledAnim(target, el);
      if (anim) {
        // Smooth speed change: adjust playback rate without restarting the animation.
        const naturalDuration = display.naturalDurationS[target] ?? 1;
        anim.updatePlaybackRate(naturalDuration / newDuration);
      } else {
        // No relevant animation running — safe to update the CSS var directly.
        el.style.setProperty("--anim-duration", newDuration + "s");
        display.naturalDurationS[target] = newDuration;
      }
      break;
    }
  }
});
