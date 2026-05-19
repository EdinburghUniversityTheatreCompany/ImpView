import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;

// CSS classes that are currently toggled on via the Continuous section.
const activeContinuous = new Set();

// Map from CSS class name → button jQuery wrapper (for clearing .active on stop).
const continuousBtns = {};

clickHandlers.push(() => {
  $("#controls-show-hide-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "show" : "hide");
  });

  $("#controls-fade-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "fadeIn" : "fadeOut");
  });

  // All continuous-section buttons share the same toggle logic.
  // animation.js's .toggle-class handler is NOT wired to these buttons
  // (they don't have the toggle-class CSS class), so i.js owns the full flow.
  $("#i-spin-btn, #i-spin-y-btn, #i-colour-chase-btn, #i-3d-motion-btn").click((e) => {
    const btn$ = $(e.target);
    const cls = btn$.data("animation");

    // Register the button reference the first time we see it.
    if (!continuousBtns[cls]) continuousBtns[cls] = btn$;

    if (activeContinuous.has(cls)) {
      // Already active → request graceful stop at next iteration boundary.
      activeContinuous.delete(cls);
      btn$.removeClass("active");
      send("i", "graceful-stop-class", { value: cls });
    } else {
      // Not active → start.
      activeContinuous.add(cls);
      btn$.addClass("active");
      // Set speed before adding the class so the CSS var is in place.
      if (cls === "spin-continuous" || cls === "spin-y-continuous") {
        const raw = parseFloat($("#i-speed").val());
        send("i", "set-speed", { value: 5.3 - raw });
      }
      send("i", "toggle-class", { value: cls });
    }
  });

  // Speed slider — right = fast (short duration), left = slow (long duration).
  // Inversion: slider value is raw 0.3–5; duration = 5.3 - raw.
  // At value=4.3 (default) → 5.3-4.3 = 1.0s. At value=5 (far right) → 0.3s (fast).
  $("#i-speed").on("input", () => {
    const raw = parseFloat($("#i-speed").val());
    send("i", "set-speed", { value: 5.3 - raw });
  });

  // Stop button — gracefully stops all active continuous effects; the loop
  // part (animate-control loops) is handled by animation.js's .i-stop-btn handler.
  $("#i-stop").click(() => {
    activeContinuous.forEach((cls) => {
      const btn$ = continuousBtns[cls];
      if (btn$) btn$.removeClass("active");
      send("i", "graceful-stop-class", { value: cls });
    });
    activeContinuous.clear();
  });
});

stateHandlers.push(() => {
  $("#i-state").change(() => {
    const show_hide = $("#controls-show-hide-i");
    const fade = $("#controls-fade-i");
    if ($("#i-state").val() === "hidden") {
      show_hide.text("Show i");
      fade.text("Fade i In");
    } else {
      show_hide.text("Hide i");
      fade.text("Fade i Out");
    }
  });
});
