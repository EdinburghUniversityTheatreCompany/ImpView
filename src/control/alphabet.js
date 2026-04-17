import { $ } from "../lib/dom.js";

const control = window.control;

const clickHandlers = control.clickHandlers;
const onReadys      = control.onReadys;
const stateHandlers = control.stateHandlers;

clickHandlers.push(() => {
  $('#controls-show-hide-alphabet').click(() => {
    if ($('#alphabet-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "alphabet", action: "show" });
    } else {
      control.sendMessage({ type: "control", target: "alphabet", action: "hide" });
    }
  });
  $('#controls-next-alphabet').click(() => {
    control.sendMessage({ type: "control", target: "alphabet", action: "next" });
  });
});

stateHandlers.push(() => {
  $('#alphabet-state').change(() => {
    const show_hide = $('#controls-show-hide-alphabet');
    if ($('#alphabet-state').val() === "hidden") {
      show_hide.text("Show Alphabet");
    } else {
      show_hide.text("Hide Alphabet");
    }
  });
});

onReadys.push(() => {
  $('#set-start-alphabet').keyup(() => {
    const start = $('#set-start-alphabet').val();

    if (start === "") return;

    control.sendMessage({ type: "control", target: "alphabet", action: "setStart", value: start });
  });
});
