import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";
import emotions from "../data/emotions.js";
import { FADE_MS, FADE_FAST_MS } from "../lib/timings.js";

const control = window.control;

// Index of committed entries by id (blank/draft entry is NOT in here).
const emo_entries = [];
let focusedId = null;
let nextId = 1;
let templateHtml = null;

control.callbackHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "emo") return;

  switch (message.action) {
    case "remove": {
      const entry$ = emo_entries[message.id];
      if (entry$) {
        entry$.fadeOut(FADE_FAST_MS, () => entry$.remove());
        delete emo_entries[message.id];
      }
      if (focusedId === message.id) setFocusedId(null);
      break;
    }
  }
});

function setFocusedId(id) {
  focusedId = id;
  document
    .querySelectorAll(".emoroco-entry .emoroco-focus.active")
    .forEach((b) => b.classList.remove("active"));
  if (id !== null && emo_entries[id]) {
    const entry = emo_entries[id]._nodes[0];
    const focusBtn = entry && entry.querySelector(".emoroco-focus");
    if (focusBtn) focusBtn.classList.add("active");
  }
}

function createEntry(id) {
  const wrap = document.createElement("div");
  wrap.innerHTML = templateHtml;
  const entry = wrap.firstElementChild;
  entry.dataset.id = id;
  entry.classList.remove("committed");
  entry.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));
  const input = entry.querySelector("input");
  if (input) input.value = "";
  return entry;
}

function commitEntry(entry$) {
  const entry = entry$._nodes[0];
  // Ignore commits on already-committed entries (double-click Add, Enter-after-Enter).
  if (entry.classList.contains("committed")) return;

  const input$ = entry$.find(".emoroco-text");
  const value = input$.val();
  if (!value) return;

  const id = Number(entry.dataset.id);
  entry.classList.add("committed");
  emo_entries[id] = entry$;

  // Switch the input's keyup from "commit on Enter" to "live update on change"
  input$.off("keyup");
  input$.on("keyup", (e) => {
    if (e.keyCode === 13) e.preventDefault();
    send("emo", "change", { id, value: input$.val() });
  });

  send("emo", "add", { id, value });

  // Append a fresh draft entry below
  const draft = createEntry(nextId++);
  document.querySelector(".emoroco-group").appendChild(draft);
  addEmorocoHandlers($(draft));
  const draftInput = draft.querySelector("input");
  if (draftInput) draftInput.focus();
}

function addEmorocoHandlers(selector) {
  const container =
    typeof selector === "string" ? document.querySelector(selector) : selector._nodes[0];
  if (!container) return;

  // Block implicit form submission on Enter — the .emoroco-entry is a <form>
  // with a single text input, so Enter would otherwise reload the page before
  // our keyup handler fires.
  const form =
    container.matches && container.matches("form") ? container : container.querySelector("form");
  if (form) form.addEventListener("submit", (e) => e.preventDefault());

  const entry$ = $(container);
  const input$ = entry$.find(".emoroco-text");

  input$.on("keyup", (e) => {
    if (e.keyCode !== 13) return;
    e.preventDefault();
    commitEntry(entry$);
  });

  entry$.find(".emoroco-add").click((e) => {
    e.preventDefault();
    commitEntry(entry$);
  });

  entry$.find(".emoroco-focus").click((e) => {
    e.preventDefault();
    const id = Number(container.dataset.id);
    if (emo_entries[id] == null) return;

    // Fade out the previously-focused row immediately — the display takes ~1s
    // to fade out its text, but the operator shouldn't have to wait.
    if (focusedId !== null && focusedId !== id) {
      const prev$ = emo_entries[focusedId];
      const prevId = focusedId;
      if (prev$) {
        delete emo_entries[prevId];
        prev$.fadeOut(FADE_MS, () => prev$.remove());
      }
    }

    setFocusedId(id);
    send("emo", "focus", { id });
  });

  entry$.find(".emoroco-remove").click((e) => {
    e.preventDefault();
    const id = Number(container.dataset.id);
    if (emo_entries[id] == null) return;
    send("emo", "remove", { id });
  });
}

function populateEmotionsList() {
  const list = document.getElementById("emotions-list");
  if (!list) return;
  const frag = document.createDocumentFragment();
  emotions.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e;
    frag.appendChild(opt);
  });
  list.appendChild(frag);
}

control.onReadys.push(() => {
  populateEmotionsList();

  // Snapshot the initial entry as the template before any state changes.
  const initial = document.querySelector(".emoroco-entry");
  if (initial) {
    templateHtml = initial.outerHTML;
    initial.dataset.id = "0";
    nextId = 1;
    addEmorocoHandlers($(initial));
  }

  $("#emoroco-remove-all").click(() => {
    // Only remove committed entries — never the live draft at the bottom.
    emo_entries.forEach((entry$, id) => {
      if (entry$) send("emo", "remove", { id });
    });
    setFocusedId(null);
  });
});
