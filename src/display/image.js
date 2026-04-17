import { $ } from "../lib/dom.js";
import * as mediaStore from "../lib/mediaStore.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "image") return;

  const target = message.target;
  const target$ = $("#" + target);

  switch (message.action) {
    case "setSource": {
      // Fast path: media library lookup. No network, no XHR — just grab the
      // blob from IndexedDB and turn it into a local object URL.
      if (message.mediaId) {
        mediaStore
          .objectUrlFor(message.mediaId)
          .then((url) => {
            target$.css("background-image", `url("${url}")`);
            display.sendMessage({
              type: "control",
              target: "image",
              action: "setSource",
              callback: true,
            });
          })
          .catch((err) => {
            console.error("[image] mediaStore lookup failed:", err);
            display.sendMessage({
              type: "error",
              target: "image",
              value: "Media not found in library",
              callback: true,
            });
          });
        break;
      }

      const error = (status) => {
        let msg;
        switch (status) {
          case 404:
            msg = "Image not found";
            break;
          case 500:
            msg = "Server-side error loading image";
            break;
          default:
            msg = "Unknown error loading image";
            break;
        }
        display.sendMessage({ type: "error", target: "image", value: msg, callback: true });
      };

      const xhr = new XMLHttpRequest();
      xhr.open("GET", message.value, true);
      xhr.responseType = "blob";
      xhr.onload = (e) => {
        if (e.target.status === 200) {
          const url = URL.createObjectURL(xhr.response);
          target$.css("background-image", `url("${url}")`);
          display.sendMessage({
            type: "control",
            target: "image",
            action: "setSource",
            callback: true,
          });
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
  }
});
