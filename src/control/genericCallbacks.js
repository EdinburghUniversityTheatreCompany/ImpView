import { $ } from "../lib/dom.js";

const control = window.control;

control.callbackHandlers.push((message) => {
  switch (message.type) {
    case "query-visible":
      $('#' + message.target + '-state').val(message.value);
      $('#' + message.target + '-state').change();
      break;
  }
});
