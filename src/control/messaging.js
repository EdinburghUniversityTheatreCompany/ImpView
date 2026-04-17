import { $ } from "../lib/dom.js";

const control = window.control;

const messageHandlers = control.messageHandlers;
const callbackHandlers = control.callbackHandlers;

control.onReadys.push(() => {
  window.addEventListener("message", (event) => {
    handleMessage(event.data, event.source);
  }, false);
});

control.sendMessage = (messageData) => {
  const msg = JSON.stringify(messageData);
  control.display.postMessage(msg, "*");
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
    control.showError(e.message, "", "", e.stack);
  }
}

messageHandlers.push((message) => {
  switch (message.type) {
    case "hello":
      $("#loader").fadeOut(1000, () => {
        $("#loader").remove();
        $("#controls").fadeIn();
      });
      control.sendMessage({ type: "hello", callback: true });
      break;
  }
});
