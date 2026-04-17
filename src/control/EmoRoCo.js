import { $ } from "../lib/dom.js";
import emotions from "../data/emotions.js";

const control = window.control;

const emo_entries = [];
let focusedId = null;

control.callbackHandlers.push((message) => {
  if (message.type !== "control") return;

  switch (message.action) {
    case "emo-remove": {
      const entry$ = emo_entries[message.id];
      if (entry$) {
        entry$.fadeOut(500, () => entry$.remove());
      }
      if (focusedId === message.id) setFocusedId(null);
      break;
    }
  }
});

function setFocusedId(id) {
  focusedId = id;
  document.querySelectorAll('.emoroco-entry .emoroco-focus.active')
    .forEach((b) => b.classList.remove('active'));
  if (id !== null && emo_entries[id]) {
    const entry = emo_entries[id]._nodes[0];
    const focusBtn = entry && entry.querySelector('.emoroco-focus');
    if (focusBtn) focusBtn.classList.add('active');
  }
}

function commitEntry(entry$) {
  const input$ = entry$.find('.emoroco-text');
  const value = input$.val();
  if (!value) return;

  const id = entry$.data('id');
  emo_entries[id] = entry$;

  // Switch the input's keyup from "commit on Enter" to "live update on change"
  input$.off('keyup');
  input$.on('keyup', (e) => {
    if (e.keyCode === 13) e.preventDefault();
    control.sendMessage({
      type: "control", action: "emo-change",
      value: input$.val(), id: entry$.data('id'),
    });
  });

  control.sendMessage({ type: "control", action: "emo-add-text", value, id });

  // Append a fresh entry after this committed one
  const template = document.querySelector('.emoroco-entry');
  const newEntry = template.cloneNode(true);
  newEntry.style.removeProperty('display');
  const newInput = newEntry.querySelector('input');
  if (newInput) newInput.value = '';
  newEntry.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
  newEntry.dataset.id = emo_entries.length;

  document.querySelector('.emoroco-group').appendChild(newEntry);
  addEmorocoHandlers($(newEntry));

  if (newInput) newInput.focus();
}

function addEmorocoHandlers(selector) {
  const container = typeof selector === 'string' ? document.querySelector(selector) : selector._nodes[0];
  if (!container) return;

  // Block implicit form submission on Enter — the .emoroco-entry is a <form>
  // with a single text input, so Enter would otherwise reload the page before
  // our keyup handler fires.
  const form = container.matches && container.matches('form') ? container : container.querySelector('form');
  if (form) form.addEventListener('submit', (e) => e.preventDefault());

  const entry$ = $(container);
  const input$ = entry$.find('.emoroco-text');

  input$.on('keyup', (e) => {
    if (e.keyCode !== 13) return;
    e.preventDefault();
    commitEntry(entry$);
  });

  entry$.find('.emoroco-add').click((e) => {
    e.preventDefault();
    commitEntry(entry$);
  });

  entry$.find('.emoroco-focus').click((e) => {
    e.preventDefault();
    const id = entry$.data('id');
    if (emo_entries[id] == null) return;
    setFocusedId(id);
    control.sendMessage({ type: "control", action: "emo-focus", id });
  });

  entry$.find('.emoroco-remove').click((e) => {
    e.preventDefault();
    control.sendMessage({ type: "control", action: "emo-remove", id: entry$.data('id') });
  });
}

function populateEmotionsList() {
  const list = document.getElementById('emotions-list');
  if (!list) return;
  const frag = document.createDocumentFragment();
  emotions.forEach((e) => {
    const opt = document.createElement('option');
    opt.value = e;
    frag.appendChild(opt);
  });
  list.appendChild(frag);
}

control.onReadys.push(() => {
  populateEmotionsList();
  addEmorocoHandlers('.emoroco-group');

  $('#emoroco-remove-all').click(() => {
    $('.emoroco-entry').each((_i, target) => {
      const target$ = $(target);
      control.sendMessage({ type: "control", action: "emo-remove", id: target$.data('id') });
    });
    setFocusedId(null);
  });
});
