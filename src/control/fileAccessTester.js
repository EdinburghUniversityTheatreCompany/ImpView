const control = window.control;

control.onReadys.push(() => {
  // Attempt to get i.png to detect broken file:// access.
  fetch("content/i.png").catch(() => {
    const errorModal = document.createElement('div');
    errorModal.className = 'modal hide fade';
    errorModal.innerHTML = `
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h3>Warning</h3>
      </div>
      <div class="modal-body">
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
      </div>
      <div class="modal-footer">
        <a href="#" class="btn" data-dismiss="modal" aria-hidden="true">Close</a>
      </div>
    `;

    document.body.appendChild(errorModal);
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
  });
});
