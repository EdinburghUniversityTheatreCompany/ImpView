import { $ } from "../lib/dom.js";
import { FADE_MS } from "../lib/timings.js";
import type { AnyMessage, ControlMessage, Target } from "../lib/messages.ts";

const display = window.display;
const messageHandlers = display.messageHandlers;
const callbackHandlers = display.callbackHandlers;

display.onReadys.push(() => {
  window.addEventListener(
    "message",
    (event) => {
      // Only accept messages from our own origin, and only from the controller
      // window that opened this popup. Guards against stray postMessage calls.
      if (event.origin !== window.location.origin) return;
      if (event.source !== display.controller) return;
      handleMessage(event.data);
    },
    false
  );
});

display.sendMessage = (messageData) => {
  // If this page was opened directly (no window.opener), or the controller
  // was closed, there is nowhere to send. Swallow silently — the display
  // is designed to keep running for the audience even if control goes away.
  if (!display.controller || display.controller.closed) return;
  const msg = JSON.stringify(messageData);
  display.controller.postMessage(msg, window.location.origin);
};

// Target-based dispatch table. Feature modules register one handler per
// target via `display.registerTarget(...)`; the handler runs ONLY for
// messages whose `target` matches. Cross-cutting traffic (hello, errors,
// visibility, anything without a target) still flows through messageHandlers.
const targetHandlers = new Map<Target, (m: ControlMessage) => void>();

display.registerTarget = (target, handler) => {
  // The cast widens the per-target signature back to the union — the Map
  // erases the per-target narrowing, but the public API preserves it for
  // callers via the generic `T extends Target`.
  targetHandlers.set(target, handler as (m: ControlMessage) => void);
};

messageHandlers.push((message) => {
  if (message.type !== "control") return;
  // EmoRoCo (and anything else without a `target`) won't hit the Map; those
  // modules still register their own handler on messageHandlers directly.
  if (!("target" in message) || !message.target) return;
  // The dispatcher above already routes callback:true to callbackHandlers,
  // so anything reaching here is a request, not a reply (playing/paused).
  // The cast acknowledges that runtime guarantee — the union widens to
  // include the reply branch but it's unreachable here.
  const handler = targetHandlers.get(message.target as Target);
  if (handler) handler(message as ControlMessage);
});

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
    display.sendError(err.message, "", "", err.stack ?? "");
  }
}

callbackHandlers.push((message) => {
  if (message.type !== "hello") return;
  $("#loader").fadeOut(FADE_MS, () => $("#loader").remove());
});
