import { $ } from "../lib/dom.js";
import { reply } from "../lib/messages.ts";
import { FADE_MS, EMOROCO_SETTLE_MS } from "../lib/timings.js";

const display = window.display;

const emoroco_texts = [];

display.registerTarget("emo", (message) => {
  switch (message.action) {
    case "add": {
      const text$ = $('<div class="emoroco-text"></div>');
      text$.text(message.value);
      text$.data("id", message.id);

      $("body").append(text$);
      emoroco_texts[message.id] = text$;

      center(text$);

      setTimeout(() => {
        text$.addClass("transition");

        const h = window.innerHeight - text$.get(0).offsetHeight;
        const w = window.innerWidth - text$.get(0).offsetWidth;

        const nh = Math.floor(Math.random() * h);
        const nw = Math.floor(Math.random() * w);

        text$.css("top", `${nh}px`);
        text$.css("left", `${nw}px`);
        text$.css("opacity", "0.5");
        text$.css("font-size", "60px");
      }, EMOROCO_SETTLE_MS);
      break;
    }
    case "focus": {
      const current$ = $(".emo-focused");
      current$.removeClass("transition");
      current$.fadeOut(FADE_MS, () => {
        // Reply with a synthetic remove for the previously-focused entry so
        // the control side cleans up its own row mirror.
        reply({ type: "control", target: "emo", action: "remove", id: current$.data("id") });
        delete emoroco_texts[current$.data("id")];
        current$.remove();
      });

      const text$ = emoroco_texts[message.id];
      if (!text$) return;
      text$.addClass("emo-focused");
      center(text$, 2);
      text$.css("opacity", "");
      text$.css("font-size", "");
      break;
    }
    case "remove": {
      const text$ = emoroco_texts[message.id];
      if (text$ == null) return;
      delete emoroco_texts[message.id];
      text$.removeClass("transition");
      text$.fadeOut(FADE_MS, () => {
        reply(message);
        text$.remove();
      });
      break;
    }
    case "change": {
      const text$ = emoroco_texts[message.id];
      if (!text$) return;
      text$.text(message.value);
      break;
    }
  }
});

// Center an element on screen (optionally with a size multiplier).
function center(el$, multiplier = 1) {
  const el = el$.get(0);
  if (!el) return;
  el.style.position = "absolute";
  el.style.top =
    Math.max(0, (window.innerHeight - el.offsetHeight * multiplier) / 2 + window.scrollY) + "px";
  el.style.left =
    Math.max(0, (window.innerWidth - el.offsetWidth * multiplier) / 2 + window.scrollX) + "px";
}
