import { $ } from "../lib/dom.js";

const display = window.display;

function getVisibility(target) {
  if (target === "alphabet") {
    return document.getElementById("alphabet")?.classList.contains("initial") ? "hidden" : "visible";
  }

  const el = document.getElementById(target);
  if (!el) return "hidden";
  return getComputedStyle(el).display !== "none" ? "visible" : "hidden";
}

display.sendVisibility = (target) => {
  display.sendMessage({ type: "query-visible", target: target, value: getVisibility(target), callback: true });
};
