# ImpView modernization — handoff

You (the next agent instance) are resuming a multi-session task. The user's global `CLAUDE.md` specifies that this file at `.claude/current_plan.md` is the canonical resume point — read it, summarize current status back to the user, then continue.

## Goal

Modernize a 13-year-old Middleman/Ruby/CoffeeScript/jQuery/Bootstrap-2 static site into a Vite + vanilla-ES2022 + PWA static site, preserving the two-window postMessage architecture verbatim. Full original plan: `/home/mick/.claude/plans/can-you-make-a-dreamy-sundae.md`.

## Where we are

- Branch: `2026-modernisation` (do not switch to `master`)
- Working tree: dirty with batches 1–3 + UX follow-ups (not committed — user hasn't asked for commits)
- Batches 1, 2, 3 are **complete**. Batch 3 sonnet code review is done, should-fix items addressed.
- Three UX follow-ups from the todo list (outside batch 4) are also done: keyboard-shortcut cheatsheet, EmoRoCo improvements, video-controls rework + on-end toggle + active-preset ring.
- **Batch 4 is next.**
- `npm run build` → exit 0, clean, PWA output emitted.

## How the user wants this executed

Non-negotiable preferences learned during batches 1–3:

1. **Use the `superpowers:executing-plans` skill** to drive execution. The flow is: review plan → batch tasks → execute → report → checkpoint for feedback → next batch.
2. **Spawn sonnet subagents** for both implementation (`general-purpose`) and review (`superpowers:code-reviewer`). Pass `model: "sonnet"` explicitly on every Agent call. The main model is Opus, but user explicitly wants sonnet for subagents.
3. **If sonnet hits its rate limit**, do NOT silently fall back to opus. Ask the user first.
4. **Offer deletions proactively after each batch.** User prefers to keep the working tree tidy. After batch N copies/ports files, audit what's safe to delete and ask.
5. **Trust but verify subagent reports.** Both execution and review agents have embellished slightly. After each subagent returns, run quick verification (Bash ls, Grep) to confirm claims — don't rely solely on the agent's summary.
6. **Keep text between tool calls brief.** User's CLAUDE.md + this harness push terse updates; do not write paragraphs.
7. **The `screenshot` / playwright-cli post-tool hooks don't apply here.** They target a Rails dev server on port 3000; ImpView is a Vite project and the control window only functions when paired with a display opened via `window.opener`, so a cold `screenshot /path` or `playwright-cli goto` would show only the "Waiting for display…" loader. State this once when skipping — don't re-explain every time.

## Current todo list (copy verbatim into TodoWrite on resume)

```
[completed] Batch 1: Scaffold Vite + Node project
[completed] Batch 1: Port index.html.erb → index.html
[completed] Batch 1: Port display.html.erb → display.html
[completed] Batch 1: Code review
[completed] Batch 2: Bake emotions + games data; delete Ruby builders
[completed] Batch 2: Port control/ CoffeeScript to ES modules
[completed] Batch 2: Port display/ CoffeeScript to ES modules
[completed] Batch 2: Code review + follow-ups
[completed] Batch 3: Write custom SCSS (no Bootstrap) for control + display
[completed] Batch 3: Modernize animations (drop webkit-only, trim to what's used)
[completed] Batch 3: Inline mini markdown parser (replaced Showdown)
[completed] Batch 3: Replace inline-CSS modals with small vanilla modal helper
[completed] Batch 3: Add PWA shell via vite-plugin-pwa
[completed] Batch 3: Delete Chrome-app artefacts
[completed] Batch 3: Fix Sass legacy-js-api deprecation warning
[completed] Investigate alphabet "line → ring" transition regression deeply
[completed] Batch 3: Sonnet code review
[completed] Review keyboard shortcuts and add in-app discoverability (cheat-sheet/overlay)
[completed] Improve EmoRoCo: explicit Add button, highlight focused entry's Focus button, restore typeahead/autocomplete from baked emotions list
[completed] Rework video play controls — Show/Play/Restart/combined confusion; unify into clearer, fewer-button UX
[pending]   Batch 4: Update Dockerfile (Ruby → Node build stage)
[pending]   Batch 4: Add Playwright integration tests
[pending]   Batch 4: Refresh README.md + CLAUDE.md
```

## Decisions taken that diverge from the original plan

- **Showdown was NOT installed.** Batch 3 replaced `new window.Markdown.Converter()` in [src/display/credits.js](src/display/credits.js) with a hand-rolled mini-parser that supports paragraphs + blank-line separation. Full Markdown (lists, bold, links) is intentionally out of scope. Do not "fix" this by adding Showdown unless the user asks.
- **Bootstrap 5 was NOT installed.** Batch 3 replaced Bootstrap 2 with hand-rolled SCSS in [src/styles/control.scss](src/styles/control.scss) + [src/styles/display.scss](src/styles/display.scss), and Bootstrap modals with a tiny vanilla helper at [src/lib/modal.js](src/lib/modal.js). The earlier plan said "Bootstrap 5" — that's stale.
- **Alphabet 3D transition** required deep investigation. Final fix: wrapper `<div id="alphabet-wrap">` around `<ul id="alphabet">` so the fade transition runs on the wrapper, leaving the 3D subtree untouched. Firefox flattens 3D subtrees during transitions on the transitioning element itself, which was the "snap after fade" symptom. See [display.html:59](display.html#L59), [src/display/alphabet.js](src/display/alphabet.js), [src/display/visibility.js](src/display/visibility.js), [src/styles/display.scss](src/styles/display.scss).
- **Video autoplay policy** — the display window now has a click-to-activate overlay ([src/display/activation.js](src/display/activation.js)) because the opener's gesture doesn't propagate to the new window. Video's `play()` promise rejection is also caught and surfaces an actionable error.

## What's where (current state)

Vite-based structure (the keeper):

- `package.json`, `vite.config.js`, `.nvmrc` (node 20)
- `index.html`, `display.html` at project root (both are Vite entries)
- [src/control/](src/control/) — per-feature ES modules + `main.js` entry
- [src/display/](src/display/) — per-feature ES modules + `main.js` entry
- [src/data/emotions.js](src/data/emotions.js), [src/data/games.js](src/data/games.js)
- [src/lib/dom.js](src/lib/dom.js) — jQuery-compat shim. Non-obvious quirks:
  - `.data()` coerces numeric strings to Number (load-bearing — EmoRoCo + keyboard rely on it).
  - `.off(event)` with no handler arg clears ALL tracked handlers for that event (uses `n.__domReg` bookkeeping).
  - Synthesized `keydown`/`keyup` events have no `keyCode` — handlers that read it must tolerate undefined.
  - `fadeIn` / `fadeOut` use a reflow + setTimeout safety-net so `transitionend` reliability doesn't matter.
- [src/lib/modal.js](src/lib/modal.js) — `showModal({ title, bodyHtml, size })` where `size: 'wide'` gives a 960px variant used by the shortcut cheatsheet.
- [src/styles/control.scss](src/styles/control.scss), [src/styles/display.scss](src/styles/display.scss) — hand-rolled, no framework.
- [public/content/](public/content/) — media files.

Still pending deletion (batch 4 may remove): [Dockerfile](Dockerfile) still references Ruby 2.5 — batch 4 rewrites to `node:20` → nginx.

## Architectural invariants (do not touch)

- **Two-window postMessage bus.** Control opens Display via `window.open('display.html', 'ImpView Display', 'popup=yes,width=1280,height=720')`; they communicate via JSON-stringified messages of shape `{ type, target, action, value, callback }`. The "hello" handshake (display → control) is what dismisses the "Waiting for display…" loader.
- **Global namespace + handler arrays.** Every feature module pushes onto `window.control.onReadys` / `messageHandlers` / `callbackHandlers` / `clickHandlers` / `stateHandlers` (or `window.display` equivalents). Do NOT migrate to direct imports or a framework.
- **Pairing.** `src/control/foo.js` ↔ `src/display/foo.js` when both sides are needed.
- **main.js load order.** `./globals.js` first (creates the window global), then `./messaging.js`, then every other module. Never reorder.

## Batch 4 plan of attack

The three remaining tasks are mostly independent; any order works. Suggested:

### 1. Dockerfile (smallest, proves deployability)

Current [Dockerfile](Dockerfile) is Ruby 2.5 + Middleman build → nginx. Rewrite as multi-stage: `node:20-alpine` runs `npm ci && npm run build`, nginx stage serves `dist/`. The nginx config needs to serve `index.html` for `/` and `display.html` for `/display.html` — PWA service worker already handled by vite-plugin-pwa output in `dist/`.

### 2. Playwright integration tests

Two-window flow is the critical path to cover. Minimum viable suite:

- **Handshake test**: open `index.html`, click "Start Display", expect display window to load and control's "Waiting for display…" loader to disappear.
- **Show Image**: load a preset image URL, click Fade In Image, expect `#image` on display to have background-image set and `display: block`.
- **EmoRoCo commit**: type text in emoroco-text input, hit Enter, expect a new draft to appear and `.emoroco-text` text node on display. Click Focus, verify button gets `.active` class on control and text becomes `.emo-focused` on display.
- **Shortcut cheatsheet**: press `?`, expect `.shortcut-help` modal.

Playwright's `context.waitForEvent('page')` handles the `window.open` popup. Put tests under `tests/`; add `playwright.config.js` and an `npm run test` script.

### 3. README + CLAUDE.md refresh

Both currently document the Middleman/Ruby flow. Rewrite README to cover `npm install`, `npm run dev`, `npm run build`, Docker usage, and how the two-window flow works. Update [CLAUDE.md](CLAUDE.md) to drop the "CoffeeScript, jQuery 1.9, Bootstrap-sass 2.3" guidance (the codebase is now vanilla ES2022 + hand-rolled SCSS + the dom.js shim) and add the quirks listed above so future agents don't get tripped up.

Then run a sonnet code-reviewer on batch 4 before declaring done.

## First actions on resume

1. Read this file (you're doing that now).
2. Restore the todo list by copying the block above into TodoWrite.
3. `git status` to confirm working tree state.
4. `npm run build` to confirm green baseline.
5. Announce current state briefly and ask which batch 4 task to start with.

## Things to NOT do

- Do NOT commit without explicit user request.
- Do NOT run `git reset`, `git push`, or any destructive git command.
- Do NOT switch branches.
- Do NOT introduce TypeScript, React, or any framework.
- Do NOT "improve" the handler-array pattern. It's the deliberate architecture.
- Do NOT fall back to opus for subagents if sonnet is rate-limited — ask the user.
- Do NOT re-add Showdown or Bootstrap unless the user explicitly asks.
- Do NOT attempt `screenshot` / `playwright-cli` against this project via the post-tool hooks — they assume a Rails dev server and don't fit the two-window architecture.
