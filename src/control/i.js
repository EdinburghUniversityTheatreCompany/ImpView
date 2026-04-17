import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;

clickHandlers.push(() => {
  $("#controls-show-hide-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "show" : "hide");
  });

  $("#controls-fade-i").click(() => {
    send("i", $("#i-state").val() === "hidden" ? "fadeIn" : "fadeOut");
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
