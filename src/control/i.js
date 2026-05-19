import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;

// Track which continuous spin classes are currently active.
const activeSpin = new Set();

clickHandlers.push(() => {
  $("#controls-show-hide-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "show" : "hide");
  });

  $("#controls-fade-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "fadeIn" : "fadeOut");
  });

  // Spin toggle buttons: track active state and button highlight.
  // The toggle-class message is sent by animation.js's .toggle-class handler.
  $("#i-spin-btn, #i-spin-y-btn").click((e) => {
    const btn$ = $(e.target);
    const cls = btn$.data("animation");
    if (activeSpin.has(cls)) {
      activeSpin.delete(cls);
      btn$.removeClass("active");
    } else {
      activeSpin.add(cls);
      btn$.addClass("active");
      // Set speed so the CSS var is in place before the class is toggled on.
      send("i", "set-speed", { value: parseFloat($("#i-speed").val()) });
    }
  });

  // Speed slider — update the CSS var on the i element in real time.
  $("#i-speed").on("input", () => {
    send("i", "set-speed", { value: parseFloat($("#i-speed").val()) });
  });

  // Stop button — clear active spin toggles.
  // The animate-control loop part is handled by animation.js's .i-stop-btn handler.
  $("#i-stop").click(() => {
    activeSpin.forEach((cls) => {
      send("i", "toggle-class", { value: cls });
    });
    activeSpin.clear();
    $("#i-spin-btn").removeClass("active");
    $("#i-spin-y-btn").removeClass("active");
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
