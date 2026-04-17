import { $ } from "../lib/dom.js";

const control = window.control;
const onReadys = control.onReadys;

let activeElement = null;
let activeHandlers = [];

function addKeyboardHandlers() {
  const body$ = $("body");

  // Escape Handler
  body$.on("keydown", (e) => {
    if (e.keyCode === 27) {
      $("#quick-hide-all").click();
    } else if (e.keyCode === 192) {
      $("#quick-fade-all").click();
    }
  });

  $(".control-group[data-shortcut]").each((i, item) => {
    const item$ = $(item);
    const shortcut = item$.data("shortcut");
    const keycode = shortcut.toString().charCodeAt(0);

    body$.on("keydown", (e) => {
      if (e.keyCode !== keycode) return;

      // Remove the old active element
      if (activeElement !== null) activeElement.removeClass("active");

      activeElement = item$;
      activeElement.addClass("active");
      const oldHandlers = activeHandlers;
      activeHandlers = [];

      // Scroll to the element
      const scrollTop = item$.get(0).getBoundingClientRect().top + window.scrollY - 30;
      window.scrollTo({ top: scrollTop, behavior: "smooth" });

      const children = item$.find("*[data-shortcut]");
      children.each((i, child) => {
        const child$ = $(child);
        const cshortcut = child$.data("shortcut");
        let ckeycode = cshortcut.toString().toUpperCase().charCodeAt(0);

        // Key code corrections (Chrome oddities from original code)
        if (ckeycode === 92) ckeycode = 220; // Backslash
        if (ckeycode === 47) ckeycode = 191; // Forward Slash
        if (ckeycode === 44) ckeycode = 188; // Comma
        if (ckeycode === 46) ckeycode = 190; // Period

        const handler = (e) => {
          if (e.keyCode !== ckeycode) return;
          child$.click();
        };

        body$.on("keydown", handler);
        activeHandlers.push(handler);
      });

      oldHandlers.forEach((handler) => {
        body$.off("keydown", handler);
      });
    });
  });
}

onReadys.push(() => {
  const body$ = $("body");

  addKeyboardHandlers();

  $(".disable-shortcuts").each((i, item) => {
    const item$ = $(item);

    item$.on("focus", () => {
      body$.off("keydown");
    });

    item$.on("blur", () => {
      addKeyboardHandlers();

      activeHandlers.forEach((handler) => {
        body$.on("keydown", handler);
      });
    });
  });
});
