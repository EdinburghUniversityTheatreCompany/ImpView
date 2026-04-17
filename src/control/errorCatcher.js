import { $ } from "../lib/dom.js";

const control = window.control;

window.onerror = (msg, url, line) => {
  control.showError(msg, url, line, "Unknown");
};

control.callbackHandlers.push((message) => {
  if (message.target !== "window" || message.type !== "error") return;
  control.showError(message.msg, message.url, message.line, message.trace);
});

control.showError = (msg, url, line, trace) => {
  const errorModal = document.createElement('div');
  errorModal.className = 'modal hide fade';
  errorModal.innerHTML = `
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
      <h3>Well... this is embarrassing</h3>
    </div>
    <div class="modal-body">
      <p>
        *Please* report this
        <a href="http://redmine.haydenball.me.uk/projects/impview/issues/new">here</a>.
        Don't forget to include your browser version and all of the details below. Thanks.
      </p>
      <hr />
      <p>An error has occurred in ${url} on line ${line}</p>
      <pre>${msg}</pre>
      Trace:
      <pre>${trace}</pre>
      <p>Sorry.</p>
    </div>
    <div class="modal-footer">
      <a href="#" class="btn" data-dismiss="modal" aria-hidden="true">Close</a>
    </div>
  `;

  document.body.appendChild(errorModal);
  // Show as a simple visible div (Bootstrap modal JS no longer available).
  errorModal.style.display = 'block';
  errorModal.style.position = 'fixed';
  errorModal.style.top = '10%';
  errorModal.style.left = '50%';
  errorModal.style.transform = 'translateX(-50%)';
  errorModal.style.zIndex = '9999';
  errorModal.style.background = '#fff';
  errorModal.style.padding = '20px';
  errorModal.style.border = '1px solid #999';
  errorModal.style.maxWidth = '600px';

  const closeBtn = errorModal.querySelector('[data-dismiss="modal"]');
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); errorModal.remove(); });
};
