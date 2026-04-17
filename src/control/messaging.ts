import { $ } from "../lib/dom.js";
import { FADE_MS } from "../lib/timings.js";
import type { AnyMessage } from "../lib/messages.ts";

const control = window.control;

const messageHandlers = control.messageHandlers;
const callbackHandlers = control.callbackHandlers;

control.onReadys.push(() => {
  window.addEventListener(
    "message",
    (event) => {
      // Only accept messages from our own origin, and only from the display
      // popup we opened. Guards against a stray window.postMessage from another
      // tab or extension reaching the control window.
      if (event.origin !== window.location.origin) return;
      if (event.source !== control.display) return;
      handleMessage(event.data);
    },
    false
  );
});

let displayDisconnectedReported = false;

control.sendMessage = (messageData) => {
  // Display popup was never opened, or the operator closed it.
  // Report once and bail — every subsequent send would otherwise throw.
  if (!control.display || control.display.closed) {
    if (!displayDisconnectedReported) {
      displayDisconnectedReported = true;
      control.showError(
        "Display window is not connected. Reopen it via Start Display.",
        "",
        "",
        "control.display is " + (control.display ? "closed" : "null")
      );
    }
    return;
  }

  const msg = JSON.stringify(messageData);
  control.display.postMessage(msg, window.location.origin);
};

function handleMessage(data: unknown) {
  try {
    let message: AnyMessage;
    if (typeof data === "string") {
      message = JSON.parse(data) as AnyMessage;
    } else {
      message = data as AnyMessage;
    }

    console.log("received message: ", data);

    if ("callback" in message && message.callback) {
      callbackHandlers.forEach((item) => item(message));
      return;
    } else {
      messageHandlers.forEach((item) => item(message));
      return;
    }
  } catch (e) {
    const err = e as Error;
    control.showError(err.message, "", "", err.stack ?? "");
  }
}

messageHandlers.push((message) => {
  if (message.type !== "hello") return;
  displayDisconnectedReported = false;
  $("#loader").fadeOut(FADE_MS, () => {
    $("#loader").remove();
    $("#controls").fadeIn();
  });
  control.sendMessage({ type: "hello", callback: true });
});
