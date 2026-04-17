import { $ } from "../lib/dom.js";

const control = window.control;

const onReadys = control.onReadys;
const clickHandlers = control.clickHandlers;

clickHandlers.push(() => {
  $('#controls-roll-credits').click(() => {
    control.sendMessage({ type: "control", target: "credits", action: "roll" });
  });

  $('#controls-hide-credits').click(() => {
    control.sendMessage({ type: "control", target: "credits", action: "hide" });
  });
});

onReadys.push(() => {
  $('#credits-editor').keyup(() => {
    control.sendMessage({ type: "control", target: "credits", action: "setValue", value: $('#credits-editor').val() });
  });
});
