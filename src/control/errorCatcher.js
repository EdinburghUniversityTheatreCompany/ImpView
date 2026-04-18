import { showModal } from "../lib/modal.js";

const control = window.control;

window.onerror = (msg, url, line) => {
  control.showError(msg, url, line, "Unknown", "window");
};

control.callbackHandlers.push((message) => {
  if (message.type !== "error") return;
  control.showError(message.msg, message.url, message.line, message.trace, message.target);
});

control.showError = (msg, url, line, trace, target) => {
  const where =
    target && target !== "window"
      ? `An error occurred in the display (${target})`
      : url
        ? `An error has occurred in ${url} on line ${line}`
        : "An error has occurred";

  showModal({
    title: "Well... this is embarrassing",
    bodyHtml: `
      <p>
        *Please* report this
        <a href="https://github.com/EdinburghUniversityTheatreCompany/ImpView/issues">here</a>.
        Don't forget to include your browser version and all of the details below. Thanks.
      </p>
      <hr />
      <p>${where}</p>
      <pre>${msg}</pre>
      ${trace ? `Trace:\n      <pre>${trace}</pre>` : ""}
      <p>Sorry.</p>
    `,
  });
};
