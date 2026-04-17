import { $ } from "../lib/dom.js";

const control = window.control;

const emo_entries = [];

control.callbackHandlers.push((message) => {
  if (message.type !== "control") return;

  switch (message.action) {
    case "emo-remove": {
      const entry$ = emo_entries[message.id];
      if (entry$) {
        entry$.fadeOut(500, () => entry$.remove());
      }
      break;
    }
  }
});

function addEmorocoHandlers(selector) {
  const container = typeof selector === 'string' ? document.querySelector(selector) : selector._nodes[0];
  if (!container) return;

  // Block implicit form submission on Enter — the .emoroco-entry is a <form>
  // with a single text input, so Enter would otherwise reload the page before
  // our keyup handler fires. (Bootstrap 2's typeahead used to swallow Enter.)
  const form = container.matches && container.matches('form') ? container : container.querySelector('form');
  if (form) form.addEventListener('submit', (e) => e.preventDefault());

  const text$ = $(container).find('.emoroco-text');

  text$.on('keyup', (e) => {
    emorocoEnterHandler(e);
  });

  $(container).find('.emoroco-focus').click((e) => {
    const target$ = $(e.target);
    control.sendMessage({ type: "control", action: "emo-focus", id: target$.closest('.emoroco-entry').data('id') });
  });

  $(container).find('.emoroco-remove').click((e) => {
    const target$ = $(e.target);
    control.sendMessage({ type: "control", action: "emo-remove", id: target$.closest('.emoroco-entry').data('id') });
  });
}

function emorocoCorrectionHandler(e) {
  if (e.keyCode === 13) e.preventDefault();

  const target$ = $(e.target);
  control.sendMessage({ type: "control", action: "emo-change", value: target$.val(), id: target$.closest('.emoroco-entry').data('id') });

  return false;
}

function emorocoEnterHandler(e) {
  if (e.keyCode !== 13) return;

  e.preventDefault();

  const target$ = $(e.target);

  target$.off('keyup');
  target$.on('keyup', (e) => {
    emorocoCorrectionHandler(e);
  });

  const id = target$.closest('.emoroco-entry').data('id');
  emo_entries[id] = target$.closest('.emoroco-entry');

  control.sendMessage({ type: "control", action: "emo-add-text", value: target$.val(), id: id });

  // Create a new entry
  const firstEntry = document.querySelector('.emoroco-entry');
  const newEntry = firstEntry.cloneNode(true);
  newEntry.style.removeProperty('display');
  const input = newEntry.querySelector('input');
  if (input) input.value = '';
  newEntry.dataset.id = emo_entries.length;

  $(newEntry).keydown((e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      return false;
    }
  });

  document.querySelector('.emoroco-group').appendChild(newEntry);

  addEmorocoHandlers($(newEntry));

  const newInput = newEntry.querySelector('input');
  if (newInput) newInput.focus();

  return false;
}

control.onReadys.push(() => {
  addEmorocoHandlers('.emoroco-group');

  $('#emoroco-remove-all').click(() => {
    $('.emoroco-entry').each((_i, target) => {
      const target$ = $(target);
      control.sendMessage({ type: "control", action: "emo-remove", id: target$.data('id') });
    });
  });
});

