import { showModal } from "../lib/modal.js";

const control = window.control;

window.onerror = (msg, url, line) => {
  control.showError(msg, url, line, "Unknown");
};

control.callbackHandlers.push((message) => {
  if (message.target !== "window" || message.type !== "error") return;
  control.showError(message.msg, message.url, message.line, message.trace);
});

control.showError = (msg, url, line, trace) => {
  showModal({
    title: "Well... this is embarrassing",
    bodyHtml: `
      <p>
        *Please* report this
        <a href="https://github.com/EdinburghUniversityTheatreCompany/ImpView/issues">here</a>.
        Don't forget to include your browser version and all of the details below. Thanks.
      </p>
      <hr />
      <p>An error has occurred in ${url} on line ${line}</p>
      <pre>${msg}</pre>
      Trace:
      <pre>${trace}</pre>
      <p>Sorry.</p>
    `,
  });
};
