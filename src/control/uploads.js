import { $ } from "../lib/dom.js";
import { confirmModal } from "../lib/modal.js";
import { escapeHtml } from "../lib/escape.js";
import * as mediaStore from "../lib/mediaStore.js";
import { VIDEO_THUMB_SEEK_MS } from "../lib/timings.js";

const control = window.control;
const onReadys = control.onReadys;

async function renderRow(kind) {
  const containerSel = kind === "image" ? ".uploaded-images" : ".uploaded-videos";
  const container = document.querySelector(containerSel);
  if (!container) return;

  container.innerHTML = "";
  const records = await mediaStore.list(kind);

  for (const record of records) {
    const url = await mediaStore.objectUrlFor(record.id);
    const a = document.createElement("a");
    a.className = "uploaded-tile";
    a.dataset.mediaId = record.id;
    a.dataset.mediaUrl = url;
    a.title = record.name;

    if (kind === "image") {
      const img = document.createElement("img");
      img.src = url;
      img.alt = record.name;
      a.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.preload = "metadata";
      a.appendChild(video);
      setTimeout(() => {
        try {
          video.currentTime = 2;
        } catch {
          /* metadata not loaded yet */
        }
      }, VIDEO_THUMB_SEEK_MS);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-upload";
    del.setAttribute("aria-label", "Delete");
    del.title = "Delete";
    del.textContent = "×";
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = await confirmModal({
        title: "Delete media",
        bodyHtml: `Delete <strong>${escapeHtml(record.name)}</strong> from your library?`,
        confirmText: "Delete",
        cancelText: "Cancel",
        danger: true,
      });
      if (!confirmed) return;
      await mediaStore.remove(record.id);
    });
    a.appendChild(del);

    a.addEventListener("click", (e) => {
      e.preventDefault();
      const inputSel = kind === "image" ? "#image-input" : "#video-input";
      const input = document.querySelector(inputSel);
      if (!input) return;

      // Highlight selection — clear any previous active tile in the same row,
      // then mark this one. Also clear preset highlights for videos.
      container.querySelectorAll("a.active").forEach((t) => t.classList.remove("active"));
      a.classList.add("active");
      if (kind === "video") {
        document
          .querySelectorAll(".preset-videos a.active")
          .forEach((t) => t.classList.remove("active"));
      }

      input.dataset.mediaId = record.id;
      input.value = url;
      const loaderSel = kind === "image" ? "#controls-image-loader" : "#controls-video-loader";
      const loader = document.querySelector(loaderSel);
      if (loader) loader.textContent = "Loading...";
      $(inputSel).keyup();
    });

    container.appendChild(a);
  }
}

async function renderAll() {
  await renderRow("image");
  await renderRow("video");
}

function setupUploadButton(kind) {
  const btnId = kind === "image" ? "#upload-image" : "#upload-video";
  const fileId = kind === "image" ? "#upload-image-file" : "#upload-video-file";
  const loaderSel = kind === "image" ? "#controls-image-loader" : "#controls-video-loader";

  const btn = document.querySelector(btnId);
  const fileInput = document.querySelector(fileId);
  const loader = document.querySelector(loaderSel);
  if (!btn || !fileInput) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";
    if (!files.length) return;

    let added = 0;
    let dupes = 0;
    const errors = [];
    for (const file of files) {
      try {
        const result = await mediaStore.addFile(file);
        if (result.added) added++;
        else dupes++;
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    let msg = `Added ${added}`;
    if (dupes) msg += `, ${dupes} duplicate${dupes === 1 ? "" : "s"}`;
    if (errors.length) msg += `, ${errors.length} error${errors.length === 1 ? "" : "s"}`;
    if (loader) loader.textContent = msg;
    if (errors.length) console.error("[uploads]", errors);
  });
}

onReadys.push(() => {
  setupUploadButton("image");
  setupUploadButton("video");
  renderAll();
  mediaStore.onChange(() => renderAll());
});
