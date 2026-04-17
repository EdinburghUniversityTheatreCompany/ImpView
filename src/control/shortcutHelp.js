import { $ } from "../lib/dom.js";
import { showModal } from "../lib/modal.js";
import { escapeHtml } from "../lib/escape.js";

const control = window.control;

function buildHelpHtml() {
  const sections = [];

  sections.push(`
    <section class="shortcut-section">
      <h4>Global</h4>
      <ul>
        <li><kbd>?</kbd> Show this cheat-sheet</li>
        <li><kbd>Esc</kbd> Hide all outputs</li>
        <li><kbd>\`</kbd> Fade out all outputs</li>
        <li><kbd>1</kbd>–<kbd>7</kbd> Switch control group</li>
      </ul>
    </section>
  `);

  document.querySelectorAll(".control-group[data-shortcut]").forEach((group) => {
    const groupKey = group.getAttribute("data-shortcut");
    const header = group.querySelector(".group-header");
    const title = header ? header.textContent.trim() : `Group ${groupKey}`;

    const items = [];
    group.querySelectorAll("*[data-shortcut]").forEach((el) => {
      const key = el.getAttribute("data-shortcut");
      let label = el.textContent.trim();
      if (!label) {
        const img = el.querySelector("img");
        const video = el.querySelector("video");
        const src = (img && img.getAttribute("src")) || (video && video.getAttribute("src"));
        if (src) label = src.replace(/^.*\//, "");
      }
      if (!label) label = "(unlabelled)";
      items.push(
        `<li><kbd>${escapeHtml(groupKey)}</kbd> + <kbd>${escapeHtml(key)}</kbd> ${escapeHtml(label)}</li>`
      );
    });

    if (items.length === 0) return;
    sections.push(`
      <section class="shortcut-section">
        <h4>${escapeHtml(title)} (<kbd>${escapeHtml(groupKey)}</kbd>)</h4>
        <ul>${items.join("")}</ul>
      </section>
    `);
  });

  return `<div class="shortcut-help">${sections.join("")}</div>`;
}

function openHelp() {
  if (document.querySelector(".shortcut-help")) return;
  showModal({ title: "Keyboard shortcuts", bodyHtml: buildHelpHtml(), size: "wide" });
}

control.onReadys.push(() => {
  $("body").on("keydown", (e) => {
    if (e.key !== "?") return;
    if (e.target && e.target.matches && e.target.matches("input, textarea")) return;
    e.preventDefault();
    openHelp();
  });

  const btn = document.getElementById("quick-shortcuts");
  if (btn)
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openHelp();
    });
});
