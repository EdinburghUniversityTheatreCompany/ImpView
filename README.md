ImpView
=======

A static-site visuals-control tool for improv theatre shows. The operator drives
a **control** window (`index.html`) that pushes commands via `postMessage` to a
separate **display** window (`display.html`) projected for the audience —
images, videos, text, EmoRoCo (Emotional Rollercoaster), alphabet, credits, etc.

Originally built on Middleman/Ruby/CoffeeScript (2013). Modernized in 2026 to
Vite + vanilla ES2022 + hand-rolled SCSS with a PWA shell. The two-window
`postMessage` architecture is preserved verbatim.

Requirements
------------

- Node.js 20 (see [.nvmrc](.nvmrc))

Commands
--------

```bash
npm install        # install JS deps
npm run dev        # dev server at http://localhost:5173
npm run build      # build to ./dist/
npm run preview    # serve ./dist/ locally
npm test           # run Playwright integration tests
```

Docker
------

Multi-stage build: Node builds the static site, nginx serves `dist/`.

```bash
docker build -t impview .
docker run --rm -p 8080:80 impview
# open http://localhost:8080/
```

Usage
-----

Open the control page (`index.html`) in a modern browser. Click **Start Display**
to open `display.html` as a popup — the browser may need to allow popups for
the origin. On the display window, click once to dismiss the activation overlay
(browsers require a user gesture before audio/video can autoplay). Spacebar in
the display window toggles fullscreen.

Shortcuts: number keys `1`–`7` switch between control groups on the control
window; sub-shortcuts within a group are shown as `data-shortcut` hints.
Press `?` on the control window for the full cheatsheet.

Tests
-----

Playwright integration tests under [tests/](tests/) exercise the two-window
handshake, image preset loading, EmoRoCo commit/focus, and the shortcut
cheatsheet. `npm test` auto-starts `npm run dev` on port 4567 (see
[playwright.config.js](playwright.config.js)).

History
-------

The original project was built by Hayden Ball. This fork modernizes the build
stack while keeping the runtime behaviour — see [CLAUDE.md](CLAUDE.md) for
architecture notes.
