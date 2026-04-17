# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ImpView ("The Improverts Visuals Software") is a static-site visuals-control tool for improv theatre shows. The operator drives a **control** window (`index.html`) which pushes commands to a separate **display** window (`display.html`) projected to the audience — images, videos, text, EmoRoCo (Emotional Rollercoaster), alphabet, credits, etc.

Originally Middleman 3.0.11 + Ruby 2.5 + CoffeeScript + jQuery 1.9 + Bootstrap-sass 2.3. Modernized in 2026 to Vite + vanilla ES2022 + hand-rolled SCSS. The two-window `postMessage` architecture is preserved verbatim — the modernization is a port, not a rewrite.

## Commands

```bash
npm install         # install JS deps (Node 20, see .nvmrc)
npm run dev         # Vite dev server at http://localhost:5173
npm run build       # build to ./dist/
npm run preview     # serve ./dist/ locally
npm test            # run Playwright integration tests
```

Docker (multi-stage Node build → nginx):

```bash
docker build -t impview .
docker run --rm -p 8080:80 impview
```

No linter is configured. Playwright covers the two-window critical path; no unit tests exist.

## Running the app

`npm run dev`, then open [http://localhost:5173/](http://localhost:5173/) (control). Click **Start Display** to open `display.html` as a popup. On first focus of the display, click once to dismiss the activation overlay — browsers require a user gesture in the display window before audio/video can autoplay. Spacebar in the display toggles fullscreen.

Number keys `1`–`7` switch control groups; `?` opens a shortcut cheatsheet modal. Within a group, sub-shortcuts are wired via `data-shortcut` attributes ([src/control/keyboard.js](src/control/keyboard.js)).

## Architecture

### Source layout

```
index.html, display.html         # two Vite entry points at project root
src/
  control/
    main.js                      # entry — imports globals, then messaging, then each feature
    globals.js                   # creates window.control + handler arrays
    messaging.js                 # postMessage transport, hello handshake
    documentReady.js             # runs clickHandlers / stateHandlers / onReadys
    <feature>.js                 # per-feature modules (image, video, text, EmoRoCo, ...)
  display/
    main.js, globals.js, messaging.js, ...   # same pattern for the display side
  data/
    emotions.js                  # baked from ../../emotions.csv (pre-built at edit time, not runtime)
    games.js                     # baked from ../../games.txt
  lib/
    dom.js                       # the jQuery-compat shim (see quirks below)
    modal.js                     # tiny vanilla modal helper
  styles/
    control.scss, display.scss   # hand-rolled, no Bootstrap
    animations.scss              # animate.css-derived keyframes (trimmed to what's used)
public/
  content/                       # static media (images, videos) copied as-is
tests/
  two-window.spec.js             # Playwright covering handshake + image + EmoRoCo + help
```

Pairing convention: most features exist as a pair — `src/control/foo.js` handles operator UI, `src/display/foo.js` renders on the display. They communicate only through the message bus.

### The two-window message bus

The central architectural fact: **the control and display windows share no state — they communicate by JSON messages over `window.postMessage`**. See [src/control/messaging.js](src/control/messaging.js) and [src/display/messaging.js](src/display/messaging.js).

Control opens Display via `window.open('display.html', 'ImpView Display', 'popup=yes,width=1280,height=720')` and holds the reference on `control.display`. Message shape: `{ type, target, action, value, callback }`. Display sends `callback: true` replies after acting. Messages without `callback` run through `messageHandlers`; messages with `callback: true` run through `callbackHandlers`. The "hello" handshake (display → control) is what dismisses the "Waiting for display..." loader.

`handleMessage` normalises inbound data with `typeof data === "string"` before parsing — preserve this when touching messaging code.

### The global namespace pattern

Both windows expose a single global (`window.control` / `window.display`) holding arrays that every module pushes handlers into:

- `onReadys` — functions invoked once after the DOM is ready and the display is connected
- `messageHandlers` — receive inbound non-callback messages
- `callbackHandlers` — receive inbound callback replies
- `clickHandlers`, `stateHandlers` (control only) — bind UI wiring

Initialised in [src/control/globals.js](src/control/globals.js) / [src/display/globals.js](src/display/globals.js), then iterated in [src/control/documentReady.js](src/control/documentReady.js).

**New features follow this pattern**: create a new `.js` module that pushes its own handlers onto these arrays, then add one line to the relevant `main.js` to import it. Do NOT add new bootstrap code to the globals or documentReady files. Do NOT migrate to direct imports or a framework — the handler-array pattern is deliberate.

### main.js load order

`./globals.js` first (creates the window global), then `./messaging.js`, then every other module. Never reorder.

## The dom.js shim quirks

[src/lib/dom.js](src/lib/dom.js) is a tiny jQuery-compat shim that ports the 2013 jQuery call sites without pulling in jQuery. Non-obvious behaviour that is load-bearing:

- `.data()` coerces numeric strings to `Number` — EmoRoCo's per-entry `data-id` and the keyboard module rely on this.
- `.off(event)` with no handler arg clears ALL tracked handlers for that event (via the `n.__domReg` bookkeeping map).
- Synthesized `keydown`/`keyup` events have no `keyCode` — handlers that read it must tolerate `undefined`.
- `fadeIn` / `fadeOut` use a reflow + `setTimeout` safety-net so `transitionend` reliability doesn't matter.

## Other architectural notes

- **Data files** (`emotions.csv`, `games.txt`) are now baked into [src/data/emotions.js](src/data/emotions.js) / [src/data/games.js](src/data/games.js) at edit time — they are not read at runtime. Re-bake by hand when you change them.
- **PWA shell** via `vite-plugin-pwa` — Workbox precaches the two HTML entries and all media in `public/content/`. Large videos bump `maximumFileSizeToCacheInBytes` to 50 MB in [vite.config.js](vite.config.js).
- **Alphabet 3D transition** — the `<div id="alphabet-wrap">` wrapper around `<ul id="alphabet">` is load-bearing: Firefox flattens 3D subtrees during transitions on the transitioning element, so the fade must run on the wrapper. Do not "simplify" this away. See [src/display/alphabet.js](src/display/alphabet.js) and the comment in [display.html](display.html).
- **Display activation overlay** — [src/display/activation.js](src/display/activation.js) dismisses on first click/keydown/touch because the opener's gesture does NOT propagate to the new window; video `play()` would otherwise reject.
- **No Markdown library** — credits markup is parsed by a tiny hand-rolled paragraph splitter in [src/display/credits.js](src/display/credits.js). Full Markdown is intentionally out of scope — do not re-add Showdown unless asked.
- **No Bootstrap** — the styles in [src/styles/](src/styles/) are hand-rolled. Modals go through [src/lib/modal.js](src/lib/modal.js). Do not re-add Bootstrap unless asked.

## Working on this codebase

- Vanilla ES2022 + hand-rolled SCSS + the dom.js shim. Do NOT introduce TypeScript, React, or any framework.
- When adding a new control group: add markup to [index.html](index.html) inside `#controls` with a `data-shortcut` attribute, add matching DOM to [display.html](display.html), then create paired `src/control/<name>.js` + `src/display/<name>.js` that push handlers onto their window globals. Import each from the relevant `main.js`.
- Before claiming a change works, run `npm run build` AND `npm test` — both should pass green.
- The `screenshot` / `playwright-cli` tools in the user's global CLAUDE.md target a Rails dev server on port 3000 and don't fit this project (the control window only functions when paired with a display opened via `window.opener`). Use `npm test` for integration verification.
