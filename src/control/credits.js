import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;

const onReadys = control.onReadys;
const clickHandlers = control.clickHandlers;

clickHandlers.push(() => {
  $("#controls-roll-credits").click(() => {
    send("credits", "roll");
  });

  $("#controls-hide-credits").click(() => {
    send("credits", "hide");
  });
});

onReadys.push(() => {
  $("#credits-editor").keyup(() => {
    send("credits", "setValue", { value: $("#credits-editor").val() });
  });
});
