import { $ } from "../lib/dom.js";
import { FADE_MS } from "../lib/timings.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control") return;

  const target = message.target;
  const target$ = $("#" + target);

  // Alphabet handles show/hide itself.
  if (target === "alphabet") return;

  switch (message.action) {
    case "hide":
      target$.hide();
      display.sendVisibility(message.target);
      break;
    case "show":
      target$.show();
      display.sendVisibility(message.target);
      break;
    case "setValue":
      if (target !== "credits") {
        target$.text(message.value);
      }
      break;
    case "setColor":
      target$.css("color", message.value);
      break;
    case "fadeIn":
      target$.fadeIn(FADE_MS, () => display.sendVisibility(message.target));
      break;
    case "fadeOut":
      target$.fadeOut(FADE_MS, () => display.sendVisibility(message.target));
      break;
    case "animate":
      display.animate(message, target, target$);
      break;
    case "toggle-class":
      target$.toggleClass(message.value);
      break;
  }
});
