import { $ } from "../lib/dom.js";

const display = window.display;
const messageHandlers = display.messageHandlers;
const callbackHandlers = display.callbackHandlers;

display.onReadys.push(() => {
  window.addEventListener("message", (event) => {
    handleMessage(event.data, event.source);
  }, false);
});

display.sendMessage = (messageData) => {
  const msg = JSON.stringify(messageData);
  display.controller.postMessage(msg, window.location.origin);
};

function handleMessage(data) {
  try {
    let message;
    if (typeof data === "string") {
      message = JSON.parse(data);
    } else {
      message = data;
    }

    console.log("received message: ", data);

    if (message.callback) {
      callbackHandlers.forEach((item) => item(message));
      return;
    } else {
      messageHandlers.forEach((item) => item(message));
      return;
    }
  } catch (e) {
    display.sendError(e.message, "", "", e.stack);
  }
}

callbackHandlers.push((message) => {
  switch (message.type) {
    case "hello":
      $("#loader").fadeOut(1000, () => $("#loader").remove());
      break;
  }
});
