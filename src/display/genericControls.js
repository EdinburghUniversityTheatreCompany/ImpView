import { $ } from "../lib/dom.js";
import { FADE_MS } from "../lib/timings.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

// Returns the element that bears a given continuous class on target "i".
// spin-y-continuous lives on #i-outer; everything else is on the target element.
function elementForClass(target, className) {
  if (className === "spin-y-continuous") {
    return document.getElementById(target + "-outer") ?? null;
  }
  return document.getElementById(target);
}

// Find all speed-controlled CSS animations for a target element (may be on
// both #i and #i-outer simultaneously).
function speedControlledAnims(target, el) {
  const anims = [];

  // Active loop animation on the main element.
  if (display.activeLoop && display.activeLoop.target === target) {
    const name = display.activeLoop.className;
    const a = el.getAnimations().find((a) => a.animationName === name);
    if (a) anims.push(a);
  }

  // Z-spin on the main element.
  if (el.classList.contains("spin-continuous")) {
    const a = el.getAnimations().find((a) => a.animationName === "spin");
    if (a) anims.push(a);
  }

  // Y-spin on #i-outer.
  const outerEl = document.getElementById(target + "-outer");
  if (outerEl && outerEl.classList.contains("spin-y-continuous")) {
    const a = outerEl.getAnimations().find((a) => a.animationName === "spinY");
    if (a) anims.push(a);
  }

  return anims;
}

// After a speed-controlled animation stops, sync --anim-duration to the latest
// desired value so the next animation start uses the correct speed.
display.syncSpeedCssVar = function (target) {
  const desired = display.desiredDurationS[target];
  if (desired === undefined) return;
  const el = document.getElementById(target);
  if (el) el.style.setProperty("--anim-duration", desired + "s");
  const outerEl = document.getElementById(target + "-outer");
  if (outerEl) outerEl.style.setProperty("--anim-duration", desired + "s");
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
    case "toggle-class": {
      const cls = message.value;
      // spin-y-continuous lives on #i-outer, not on #i.
      const el =
        cls === "spin-y-continuous" ? document.getElementById(target + "-outer") : target$.get(0);
      if (!el) break;
      el.classList.toggle(cls);
      // After removing a spin class, sync --anim-duration for the next spin start.
      if (
        (cls === "spin-continuous" || cls === "spin-y-continuous") &&
        !el.classList.contains(cls)
      ) {
        display.syncSpeedCssVar(target);
      }
      break;
    }
    case "stop-loop": {
      const loop = display.activeLoop;
      if (loop && loop.target === target) {
        const el = target$.get(0);
        let wasReverse = false;
        if (loop.boomerang && el) {
          const anim = el.getAnimations().find((a) => a.animationName === loop.className);
          if (anim) {
            const duration = anim.effect?.getTiming?.()?.duration ?? 1000;
            // Position within one boomerang cycle (forward + reverse = 2*duration).
            // elapsed >= duration means we're in the reverse half-cycle.
            const elapsed = anim.currentTime % (2 * duration);
            wasReverse = elapsed >= duration;
          }
        }
        stopActiveLoop(target, target$);
        const shouldHide = (loop.after === "hide") !== wasReverse;
        if (shouldHide) target$.hide();
        display.sendVisibility(target);
      } else {
        stopActiveLoop(target, target$);
      }
      break;
    }
    case "graceful-stop-loop": {
      const loop = display.activeLoop;
      if (!loop || loop.target !== target) break;
      const el = target$.get(0);
      if (!el) break;
      el.addEventListener(
        "animationiteration",
        () => {
          if (!display.activeLoop || display.activeLoop.target !== target) return;
          let wasReverse = false;
          if (loop.boomerang) {
            const anim = el.getAnimations().find((a) => a.animationName === loop.className);
            if (anim) {
              const duration = anim.effect?.getTiming?.()?.duration ?? 1000;
              const n = Math.round(anim.currentTime / duration);
              wasReverse = n % 2 === 0;
            }
          }
          stopActiveLoop(target, target$);
          // Determine final visibility: for boomerang, the last half-cycle direction
          // inverts the intended after="hide" behaviour (XOR).
          const shouldHide = (loop.after === "hide") !== wasReverse;
          if (shouldHide) target$.hide();
          display.sendVisibility(target);
        },
        { once: true }
      );
      break;
    }
    case "graceful-stop-class": {
      const cls = message.value;
      const el = elementForClass(target, cls);
      if (!el) break;
      el.addEventListener(
        "animationiteration",
        () => {
          el.classList.remove(cls);
          display.syncSpeedCssVar(target);
        },
        { once: true }
      );
      break;
    }
    case "set-speed": {
      const el = target$.get(0);
      if (!el) break;
      const newDuration = message.value;
      display.desiredDurationS[target] = newDuration;

      const anims = speedControlledAnims(target, el);
      if (anims.length > 0) {
        // Smooth speed change: adjust playback rate without restarting animations.
        const naturalDuration = display.naturalDurationS[target] ?? 1;
        for (const anim of anims) {
          anim.updatePlaybackRate(naturalDuration / newDuration);
        }
        // Also update #i-outer CSS var if no Y-spin animation is running there
        // (handles the case where outer exists but spin-y isn't active).
        const outerEl = document.getElementById(target + "-outer");
        if (outerEl && !outerEl.classList.contains("spin-y-continuous")) {
          outerEl.style.setProperty("--anim-duration", newDuration + "s");
        }
      } else {
        // No relevant animation running — safe to update CSS vars directly.
        el.style.setProperty("--anim-duration", newDuration + "s");
        const outerEl = document.getElementById(target + "-outer");
        if (outerEl) outerEl.style.setProperty("--anim-duration", newDuration + "s");
        display.naturalDurationS[target] = newDuration;
      }
      break;
    }
  }
});
