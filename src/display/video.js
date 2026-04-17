import { $ } from "../lib/dom.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

// "fade" (default): stop where it is. "fade": stop and fade out. "loop": restart from 0.
let onEnd = "fade";

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "video") return;

  const target = message.target;
  const target$ = $('#' + target);

  switch (message.action) {
    case "setOnEnd": {
      onEnd = message.value;
      break;
    }
    case "setSource": {
      const error = (status, detail) => {
        let msg;
        switch (status) {
          case 404:   msg = "Video not found (404)"; break;
          case 500:   msg = "Server-side error loading video (500)"; break;
          case 0:     msg = `Network / CORS error loading video${detail ? ` (${detail})` : ''}`; break;
          default:    msg = `Error loading video (status ${status}${detail ? `, ${detail}` : ''})`; break;
        }
        console.error('[video] setSource failed:', { url: message.value, status, detail });
        display.sendMessage({ type: "error", target: "video", value: msg, callback: true });
      };

      const xhr = new XMLHttpRequest();
      xhr.open("GET", message.value, true);
      xhr.responseType = "blob";
      xhr.onload = (e) => {
        // 206 Partial Content is valid — some dev servers (vite) always send
        // it for media files even on non-range requests.
        if (e.target.status === 200 || e.target.status === 206) {
          const url = URL.createObjectURL(xhr.response);
          target$.attr("src", url);
          display.sendMessage({ type: "control", target: "video", action: "setSource", callback: true });
        } else {
          error(e.target.status, e.target.statusText);
        }
      };
      xhr.onerror = (e) => {
        error(e.target.status || 0, 'network error');
      };
      xhr.send();
      break;
    }
    case "play": {
      const videoEl = target$.get(0);
      target$.off('ended');
      target$.on('ended', () => {
        if (onEnd === "loop") {
          videoEl.currentTime = 0;
          videoEl.play().catch(() => {});
          return;
        }
        display.sendMessage({ type: "control", target: target, action: "paused", callback: true });
        if (onEnd === "fade") {
          target$.fadeOut(1000, () => display.sendVisibility(target));
        }
      });
      // Browsers block autoplay unless the display window itself has had a
      // user gesture — clicking "Start Display" happens in the CONTROL window,
      // which doesn't count. Catch the rejection and tell the operator what
      // to do instead of leaving an unhandled promise.
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.error('[video] play() rejected:', err);
          display.sendMessage({
            type: "error",
            target: "video",
            value: "Click the display window once to enable playback (browser autoplay policy)",
            callback: true
          });
          display.sendMessage({ type: "control", target: target, action: "paused", callback: true });
        });
      }
      display.sendMessage({ type: "control", target: target, action: "playing", callback: true });
      break;
    }
    case "pause": {
      target$.get(0).pause();
      display.sendMessage({ type: "control", target: target, action: "paused", callback: true });
      break;
    }
    case "restart": {
      target$.get(0).currentTime = 0;
      break;
    }
  }
});

display.onReadys.push(() => {
  const video = document.getElementById('video');
  if (!video) return;

  video.onerror = () => {
    const e = video.error;
    let nice_error;

    switch (e.code) {
      case MediaError.MEDIA_ERR_DECODE:
        nice_error = "Video couldn't be decoded. Codec may not be supported";
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        nice_error = "This video format isn't supported";
        break;
      default:
        nice_error = "An unknown error occurred";
        break;
    }

    display.sendMessage({ type: "error", target: "video", value: nice_error, callback: true });
  };
});
