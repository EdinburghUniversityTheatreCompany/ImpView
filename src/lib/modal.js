/**
 * showModal({ title, bodyHtml })
 * Vanilla modal helper — no Bootstrap, no jQuery.
 * Creates a backdrop + modal, auto-dismisses on Close / backdrop click / ESC.
 */
export function showModal({ title, bodyHtml, size }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "modal" + (size === "wide" ? " modal-wide" : "");
  modal.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button type="button" class="close" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">
      <a href="#" class="btn close-modal">Close</a>
    </div>
  `;

  function dismiss() {
    backdrop.remove();
    modal.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") dismiss();
  }

  backdrop.addEventListener("click", dismiss);
  modal.querySelector(".close").addEventListener("click", dismiss);
  modal.querySelector(".close-modal").addEventListener("click", (e) => {
    e.preventDefault();
    dismiss();
  });
  document.addEventListener("keydown", onKeyDown);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

/**
 * confirmModal({ title, bodyHtml, confirmText, cancelText, danger })
 * Promise-based confirm. Resolves true on confirm, false on cancel/dismiss.
 */
export function confirmModal({
  title,
  bodyHtml,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button type="button" class="close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-footer">
        <a href="#" class="btn cancel-modal">${cancelText}</a>
        <a href="#" class="btn confirm-modal${danger ? " danger" : ""}">${confirmText}</a>
      </div>
    `;

    let settled = false;
    function finish(result) {
      if (settled) return;
      settled = true;
      backdrop.remove();
      modal.remove();
      document.removeEventListener("keydown", onKeyDown);
      resolve(result);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") finish(false);
      if (e.key === "Enter") finish(true);
    }

    backdrop.addEventListener("click", () => finish(false));
    modal.querySelector(".close").addEventListener("click", () => finish(false));
    modal.querySelector(".cancel-modal").addEventListener("click", (e) => {
      e.preventDefault();
      finish(false);
    });
    modal.querySelector(".confirm-modal").addEventListener("click", (e) => {
      e.preventDefault();
      finish(true);
    });
    document.addEventListener("keydown", onKeyDown);

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  });
}
