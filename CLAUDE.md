# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ImpView ("The Improverts Visuals Software") is a static-site visuals-control tool for improv theatre shows. It builds to a `build/` folder that can be opened in a browser or packaged as a Chrome app. The operator drives a **control** window (`index.html`) which pushes commands to a separate **display** window (`display.html`) projected to the audience — images, videos, text, EmoRoCo (Emotional Rollercoaster), alphabet, credits, etc.

It is built with [Middleman 3.0.11](https://middlemanapp.com/) and is pinned to Ruby 2.5 (see [Dockerfile](Dockerfile)). The stack is deliberately old — do not upgrade gems casually, as the Middleman 3 → 4 migration and the 2.5 → modern Ruby jump will break things.

## Commands

```bash
bundle install          # install Ruby deps (requires Ruby 2.5 + JS runtime, see Gemfile)
bundle exec middleman           # dev server at http://localhost:4567
bundle exec middleman build     # build to ./build/
```

Docker (multi-stage, produces an nginx image serving the built site):

```bash
docker build -t impview .
docker run --rm -p 8080:80 impview
```

There is no test suite, no linter, and no CI configured.

## Running the app

After `middleman build`, open `build/index.html` ("control" page) in Chrome. Click **Start Display** to open `display.html` in a popup (required since [ba09695](https://github.com/) — avoids popup-blocker races). Spacebar in the display window toggles fullscreen. The control window uses number keys 1–7 to switch between control groups (see [source/javascripts/control/keyboard.coffee](source/javascripts/control/keyboard.coffee)), with sub-shortcuts defined via `data-shortcut` attributes on nested elements.

Packaging as a Chrome app: `source/manifest.json` makes the build loadable as a Chrome packaged app; `lib/MakeCRX.rb` wraps the build into a `.crx`. Note the manifest's `update_url` still points at the upstream project (haydenball.me.uk) — do not enable auto-updates on a fork.

## Architecture

### Middleman custom extensions (`lib/`)

Two after-build hooks generate JSON data consumed by the display at runtime:

- [lib/EmotionBuilder.rb](lib/EmotionBuilder.rb) — reads [emotions.csv](emotions.csv), titleizes + dedupes + sorts, writes `build/content/emotions.json`. Consumed by the EmoRoCo game.
- [lib/GamesBuilder.rb](lib/GamesBuilder.rb) — same transform on [games.txt](games.txt) (one game per line), writes `build/content/games.json`.

Both are registered in [config.rb](config.rb) via `activate :emotion_builder` / `activate :games_builder`. If a new data file is needed, follow this same pattern rather than hand-writing JSON.

### Source layout (`source/`)

```
index.html.erb         # control window (the operator's UI)
display.html.erb       # display window (the audience-facing output)
manifest.json          # Chrome packaged app manifest
content/               # static media (images, videos) copied into build/
control/_*.html.erb    # ERB partials, one per control group (_image, _video, _text, _i, _credits, _emoroco, _alphabet)
javascripts/
  chrome.js            # Chrome-app background script (opens index.html in a panel window)
  control.js           # sprockets manifest for the control window
  display.js           # sprockets manifest for the display window
  control/*.coffee     # per-feature control-window logic (one file per control group)
  display/*.coffee     # per-feature display-window logic (mirrors control/)
stylesheets/           # control.scss + display.scss + Bootstrap + animate.css
```

Pairing convention: most features exist as a pair — `control/foo.coffee` handles operator UI, `display/foo.coffee` renders on the display. They communicate only through the message bus.

### The two-window message bus

The central architectural fact: **the control and display windows share no state — they communicate by JSON messages** over either `chrome.runtime.sendMessage` (Chrome-app mode) or `window.postMessage` (regular-browser mode). See [source/javascripts/control/messaging.coffee](source/javascripts/control/messaging.coffee) and [source/javascripts/display/messaging.coffee](source/javascripts/display/messaging.coffee).

Message shape: `{ type, target, action, value, callback }`. Display sends `callback: true` replies after acting. Messages without `callback` run through `messageHandlers`; messages with `callback: true` run through `callbackHandlers`. The "hello" handshake (display → control) is what dismisses the "Waiting for display..." loader.

### The global namespace pattern

Both windows expose a single global (`window.control` / `window.display`) holding arrays that every CoffeeScript module pushes handlers into:

- `onReadys` — functions invoked once after the DOM is ready and the display is connected
- `messageHandlers` — receive inbound non-callback messages
- `callbackHandlers` — receive inbound callback replies
- `clickHandlers`, `stateHandlers` (control only) — bind UI wiring

Initialised in [control/globals.coffee](source/javascripts/control/globals.coffee) / [display/globals.coffee](source/javascripts/display/globals.coffee), then iterated in [control/documentReady.coffee](source/javascripts/control/documentReady.coffee). **New features follow this pattern**: create a new `.coffee` file that pushes its own handlers onto these arrays — do not add new bootstrap code to the globals or documentReady files. Sprockets' `//= require_tree` picks it up automatically.

`window.control.isChromeApp` / `window.display.isChromeApp` is the environment flag that switches between Chrome-app and browser-popup code paths (message transport, window opening, fullscreen handling). Anything that differs between the two modes must branch on this flag.

### Dual-mode quirks to remember

- In browser mode, `control` opens `display` via `window.open` and holds a reference in `control.display`; in Chrome-app mode it uses `chrome.app.window.create` and messages flow through `chrome.runtime`.
- The control window registers `onbeforeunload` / `onunload` handlers to close the display — **only in browser mode** (see [documentReady.coffee](source/javascripts/control/documentReady.coffee)).
- Message strings are sometimes JSON-stringified, sometimes object-passed — `handleMessage` normalises with `typeof data == "string"` before parsing. Preserve this when touching messaging code.

## Working on this codebase

- CoffeeScript, jQuery 1.9, Bootstrap-sass 2.3 — stay in-style rather than introducing modern JS/CSS frameworks.
- When adding a new control group, mirror the existing pattern: ERB partial in `source/control/`, include it from [index.html.erb](source/index.html.erb) with a `shortcut:` local, then paired `control/<name>.coffee` + `display/<name>.coffee`.
- Data files (`emotions.csv`, `games.txt`) are build-time inputs, not runtime — editing them requires a rebuild.
