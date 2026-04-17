import { $ } from "../lib/dom.js";

const control = window.control;
const clickHandlers = control.clickHandlers;

clickHandlers.push(() => {
  $('#quick-hide-all').click(() => {
    hideAll();
  });

  $('#quick-fade-all').click(() => {
    fadeOutAll();
  });
});

function hideAll() {
  $('.states input').each((i, item) => {
    if ($(item).val() === "visible") {
      const name = item.id.replace("-state", "");
      $('#controls-show-hide-' + name).click();
    }
  });
}

function fadeOutAll() {
  $('.states input').each((i, item) => {
    if ($(item).val() === "visible") {
      const name = item.id.replace("-state", "");
      $('#controls-fade-' + name).click();
    }
  });
}
