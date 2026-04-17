import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;

const clickHandlers = control.clickHandlers;
const onReadys = control.onReadys;
const stateHandlers = control.stateHandlers;

clickHandlers.push(() => {
  $("#controls-show-hide-alphabet").click(() => {
    send("alphabet", $("#alphabet-state").val() === "hidden" ? "show" : "hide");
  });
  $("#controls-next-alphabet").click(() => {
    send("alphabet", "next");
  });
});

stateHandlers.push(() => {
  $("#alphabet-state").change(() => {
    const show_hide = $("#controls-show-hide-alphabet");
    if ($("#alphabet-state").val() === "hidden") {
      show_hide.text("Show Alphabet");
    } else {
      show_hide.text("Hide Alphabet");
    }
  });
});

onReadys.push(() => {
  $("#set-start-alphabet").keyup(() => {
    const start = $("#set-start-alphabet").val();

    if (start === "") return;

    send("alphabet", "setStart", { value: start });
  });
});
