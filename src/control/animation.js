import { $ } from "../lib/dom.js";

const control = window.control;
const clickHandlers = control.clickHandlers;

clickHandlers.push(() => {
  $('.animate-control').click((e) => {
    const btn$ = $(e.target);
    control.sendMessage({
      type: "control",
      target: btn$.data('target'),
      action: "animate",
      value: btn$.data('animation'),
      before: btn$.data('before'),
      after: btn$.data('after'),
      byLetter: btn$.data('by-letter'),
    });
  });

  $('.toggle-class').click((e) => {
    const btn$ = $(e.target);
    control.sendMessage({
      type: "control",
      target: btn$.data('target'),
      action: "toggle-class",
      value: btn$.data("animation"),
    });
  });
});
