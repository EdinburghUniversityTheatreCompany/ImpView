import { showModal } from "../lib/modal.js";

const control = window.control;

control.onReadys.push(() => {
  // Attempt to get i.png to detect broken file:// access.
  fetch("content/i.png").catch(() => {
    showModal({
      title: "Warning",
      bodyHtml: `
        <p>ImpView files cannot be loaded by javascript.</p>
        <p>This prevents most things from working correctly (but feel free to try anyway).</p>
        <p>
          If you are running this from a file rather than a server, this may be
          because your browser prevents access to files from files (!).
          <br />
          In Chrome, this can be corrected by adding the <code>--allow-file-access-from-files</code>
          flag.
        </p>
        <p>Don't shoot the messenger (blame CSP).</p>
      `
    });
  });
});
