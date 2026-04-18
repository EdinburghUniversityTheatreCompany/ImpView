import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;
const clickHandlers = control.clickHandlers;

clickHandlers.push(() => {
  $(".animate-control").click((e) => {
    const btn$ = $(e.target);
    send(btn$.data("target"), "animate", {
      value: btn$.data("animation"),
      after: btn$.data("after"),
      byLetter: btn$.data("by-letter"),
    });
  });

  $(".toggle-class").click((e) => {
    const btn$ = $(e.target);
    send(btn$.data("target"), "toggle-class", {
      value: btn$.data("animation"),
    });
  });
});
