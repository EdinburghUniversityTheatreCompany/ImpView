import { $ } from "../lib/dom.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "video") return;

  const target = message.target;
  const target$ = $('#' + target);

  switch (message.action) {
    case "setSource": {
      const error = (status) => {
        let msg;
        switch (status) {
          case 404:   msg = "Video not found"; break;
          case 500:   msg = "Server-side error loading video"; break;
          default:    msg = "Unknown error loading video"; break;
        }
        display.sendMessage({ type: "error", target: "video", value: msg, callback: true });
      };

      const xhr = new XMLHttpRequest();
      xhr.open("GET", message.value, true);
      xhr.responseType = "blob";
      xhr.onload = (e) => {
        if (e.target.status === 200) {
          const url = URL.createObjectURL(xhr.response);
          target$.attr("src", url);
          display.sendMessage({ type: "control", target: "video", action: "setSource", callback: true });
        } else {
          error(e.target.status);
        }
      };
      xhr.onerror = (e) => {
        error(e.target.status);
      };
      xhr.send();
      break;
    }
    case "play": {
      const videoEl = target$.get(0);
      target$.off('ended');
      target$.on('ended', () => {
        display.sendMessage({ type: "control", target: target, action: "paused", callback: true });
      });
      videoEl.play();
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
