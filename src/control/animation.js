import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

const control = window.control;
const clickHandlers = control.clickHandlers;

// Per-target tracking of which button is currently looping.
const activeLoopBtns = {};

function stopLoop(target) {
  const btn$ = activeLoopBtns[target];
  if (btn$) {
    btn$.removeClass("active");
    delete activeLoopBtns[target];
  }
  send(target, "stop-loop");
}

clickHandlers.push(() => {
  $(".animate-control").click((e) => {
    const btn$ = $(e.target);
    const target = btn$.data("target");
    const loop = !!$("#" + target + "-loop").get(0)?.checked;
    const boomerang = !!$("#" + target + "-boomerang").get(0)?.checked;

    // Re-clicking the active looping button stops the loop.
    if (activeLoopBtns[target] && activeLoopBtns[target].get(0) === btn$.get(0)) {
      stopLoop(target);
      return;
    }

    // If a different button was looping, stop it first.
    if (activeLoopBtns[target]) {
      activeLoopBtns[target].removeClass("active");
      delete activeLoopBtns[target];
    }

    send(target, "animate", {
      value: btn$.data("animation"),
      after: btn$.data("after"),
      byLetter: btn$.data("by-letter"),
      loop,
      boomerang,
    });

    if (loop) {
      btn$.addClass("active");
      activeLoopBtns[target] = btn$;
    }
  });

  $(".toggle-class").click((e) => {
    const btn$ = $(e.target);
    send(btn$.data("target"), "toggle-class", {
      value: btn$.data("animation"),
    });
  });

  // Stop button: always send stop-loop and clear any tracked active button.
  // (Spin toggle state is handled in i.js.)
  $(".i-stop-btn").click((e) => {
    const target = $(e.target).data("target");
    stopLoop(target);
  });

  // Unchecking Loop while a loop is running: finish the current cycle then stop.
  $("#i-loop").on("change", () => {
    if (!$("#i-loop").get(0)?.checked && activeLoopBtns["i"]) {
      activeLoopBtns["i"].removeClass("active");
      delete activeLoopBtns["i"];
      send("i", "graceful-stop-loop");
    }
  });
});
