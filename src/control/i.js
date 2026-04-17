import { $ } from "../lib/dom.js";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;

clickHandlers.push(() => {
  $('#controls-show-hide-i').click(() => {
    if ($('#i-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "i", action: "show" });
    } else {
      control.sendMessage({ type: "control", target: "i", action: "hide" });
    }
  });

  $('#controls-fade-i').click(() => {
    if ($('#i-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "i", action: "fadeIn" });
    } else {
      control.sendMessage({ type: "control", target: "i", action: "fadeOut" });
    }
  });
});

stateHandlers.push(() => {
  $('#i-state').change(() => {
    const show_hide = $('#controls-show-hide-i');
    const fade = $('#controls-fade-i');
    if ($('#i-state').val() === "hidden") {
      show_hide.text("Show i");
      fade.text("Fade i In");
    } else {
      show_hide.text("Hide i");
      fade.text("Fade i Out");
    }
  });
});
