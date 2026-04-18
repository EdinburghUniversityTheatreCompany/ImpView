const display = window.display;

window.onerror = (msg, url, line) => {
  display.sendError(msg, url, line, "Unknown");
};

display.sendError = (msg, url, line, trace) => {
  display.sendMessage({
    type: "error",
    target: "window",
    msg,
    url,
    line,
    trace,
    callback: true,
  });
};
