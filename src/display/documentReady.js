import { $, ready } from "../lib/dom.js";

const display = window.display;

ready(() => {
  try {
    display.controller = window.opener;

    $('#loader').text("Waiting for controller...");

    display.sendMessage({ type: "hello" });

    display.onReadys.forEach((onReady) => onReady());

    // Fullscreen toggle on Space bar (unprefixed API, webkit fallback)
    $('body').on('keypress', (e) => {
      if (e.keyCode !== 32) return;

      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
      const result = isFullscreen
        ? (document.exitFullscreen || document.webkitCancelFullScreen).call(document)
        : (document.body.requestFullscreen || document.body.webkitRequestFullscreen).call(document.body);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    });
  } catch (e) {
    display.sendError(e.message, "", "", e.stack);
  }
});
