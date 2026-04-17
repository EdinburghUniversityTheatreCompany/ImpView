import { zip, unzip } from "fflate";
import * as mediaStore from "../lib/mediaStore.js";
import { showModal, confirmModal } from "../lib/modal.js";

const control = window.control;
const onReadys = control.onReadys;

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Given a desired ZIP-entry path, return one that doesn't collide with any
// already-used entry (suffix " (2)", " (3)", etc. before the extension).
function uniquePath(used, folder, name) {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = `${folder}/${name}`;
  let counter = 2;
  while (used.has(candidate)) {
    candidate = `${folder}/${stem} (${counter})${ext}`;
    counter++;
  }
  used.add(candidate);
  return candidate;
}

async function exportZip() {
  const records = await mediaStore.list();
  if (!records.length) {
    showModal({
      title: "Export ZIP",
      bodyHtml: "<p>Your library is empty — nothing to export.</p>",
    });
    return;
  }

  const entries = {};
  const used = new Set();
  for (const record of records) {
    const folder = record.kind === "image" ? "images" : "videos";
    const path = uniquePath(used, folder, record.name);
    const buffer = await record.blob.arrayBuffer();
    entries[path] = new Uint8Array(buffer);
  }

  const data = await new Promise((resolve, reject) => {
    // level 0 = store only. Media is already compressed; level 0 is ~10x faster
    // and gives essentially the same output size for jpeg/png/mp4/webm.
    zip(entries, { level: 0 }, (err, out) => {
      if (err) reject(err);
      else resolve(out);
    });
  });

  const blob = new Blob([data], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `impview-media-${todayStamp()}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function importZip(file) {
  const buffer = await file.arrayBuffer();
  const entries = await new Promise((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, out) => {
      if (err) reject(err);
      else resolve(out);
    });
  });

  let added = 0;
  let duplicates = 0;
  let ignored = 0;
  const errors = [];

  for (const [path, bytes] of Object.entries(entries)) {
    // Skip directory entries.
    if (path.endsWith("/")) continue;

    let kind = null;
    let name = null;
    if (path.startsWith("images/")) {
      kind = "image";
      name = path.slice("images/".length);
    } else if (path.startsWith("videos/")) {
      kind = "video";
      name = path.slice("videos/".length);
    }

    if (!kind || !name || name.includes("/")) {
      // Nested subfolder or outside our folder convention — skip.
      ignored++;
      continue;
    }

    const mime = mediaStore.mimeFromName(name) || (kind === "image" ? "image/*" : "video/*");
    const blob = new Blob([bytes], { type: mime });
    const file = new File([blob], name, { type: mime });

    try {
      const result = await mediaStore.addFile(file);
      if (result.added) added++;
      else duplicates++;
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  const parts = [
    `<p><strong>Added ${added}</strong> new item${added === 1 ? "" : "s"}.</p>`,
    `<p>Skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.</p>`,
    `<p>Ignored ${ignored} unsupported entr${ignored === 1 ? "y" : "ies"}.</p>`,
  ];
  if (errors.length) {
    parts.push(
      `<p><strong>Errors:</strong></p><pre>${errors.map((e) => e.replace(/</g, "&lt;")).join("\n")}</pre>`
    );
  }
  showModal({ title: "Import ZIP", bodyHtml: parts.join("") });
}

async function clearLibrary() {
  const records = await mediaStore.list();
  if (!records.length) {
    showModal({ title: "Clear Library", bodyHtml: "<p>Your library is already empty.</p>" });
    return;
  }

  const confirmed = await confirmModal({
    title: "Clear Library",
    bodyHtml: `<p>Delete all <strong>${records.length}</strong> uploaded item${records.length === 1 ? "" : "s"}? This cannot be undone.</p>`,
    confirmText: "Delete All",
    cancelText: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  await mediaStore.clear();
}

onReadys.push(() => {
  const exportBtn = document.getElementById("quick-export-zip");
  const importBtn = document.getElementById("quick-import-zip");
  const importInput = document.getElementById("import-zip-file");
  const clearBtn = document.getElementById("quick-clear-library");

  if (exportBtn)
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      exportZip().catch((err) => {
        console.error("[zipIo] export failed:", err);
        showModal({ title: "Export failed", bodyHtml: `<pre>${String(err.message || err)}</pre>` });
      });
    });

  if (importBtn && importInput) {
    importBtn.addEventListener("click", (e) => {
      e.preventDefault();
      importInput.click();
    });
    importInput.addEventListener("change", async () => {
      const file = importInput.files && importInput.files[0];
      importInput.value = "";
      if (!file) return;
      try {
        await importZip(file);
      } catch (err) {
        console.error("[zipIo] import failed:", err);
        showModal({ title: "Import failed", bodyHtml: `<pre>${String(err.message || err)}</pre>` });
      }
    });
  }

  if (clearBtn)
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearLibrary().catch((err) => console.error("[zipIo] clear failed:", err));
    });
});
