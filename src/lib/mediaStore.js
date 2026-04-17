// IndexedDB-backed media library. Shared by control and display windows via
// the same database on the same origin — each window keeps its own object-URL
// cache so blobs don't cross the window boundary.

const DB_NAME = "impview-media";
const DB_VERSION = 1;
const STORE = "media";
export const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB

let dbPromise = null;
const urlCache = new Map(); // id → objectURL
const listeners = new Set();

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("kind", "kind");
        store.createIndex("addedAt", "addedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function kindFromMime(mime) {
  if (typeof mime !== "string") return null;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

const EXT_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  m4v: "video/mp4",
  ogv: "video/ogg",
};

export function mimeFromName(name) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? EXT_MIME[m[1]] || null : null;
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function notify(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error("[mediaStore] listener error:", e);
    }
  });
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function addFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max ${MAX_FILE_BYTES / 1024 / 1024} MB)`
    );
  }
  let mime = file.type || mimeFromName(file.name);
  const kind = kindFromMime(mime);
  if (!kind) {
    throw new Error(`Unsupported file type: ${file.name} (${file.type || "unknown"})`);
  }

  const buffer = await file.arrayBuffer();
  const id = await sha256Hex(buffer);
  const blob = new Blob([buffer], { type: mime });

  const existing = await get(id);
  if (existing) {
    return { id, added: false, record: existing };
  }

  const record = {
    id,
    kind,
    name: file.name,
    mime,
    size: file.size,
    addedAt: Date.now(),
    blob,
  };

  const store = await tx("readwrite");
  await new Promise((resolve, reject) => {
    const req = store.add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  notify({ type: "add", id, kind });
  return { id, added: true, record };
}

export async function get(id) {
  const store = await tx("readonly");
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function list(kind) {
  const store = await tx("readonly");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      let results = req.result;
      if (kind) results = results.filter((r) => r.kind === kind);
      results.sort((a, b) => a.addedAt - b.addedAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function remove(id) {
  const store = await tx("readwrite");
  await new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  const cached = urlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    urlCache.delete(id);
  }
  notify({ type: "remove", id });
}

export async function clear() {
  const store = await tx("readwrite");
  await new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
  notify({ type: "clear" });
}

export async function objectUrlFor(id) {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const record = await get(id);
  if (!record) throw new Error(`No media record for id ${id}`);
  const url = URL.createObjectURL(record.blob);
  urlCache.set(id, url);
  return url;
}
