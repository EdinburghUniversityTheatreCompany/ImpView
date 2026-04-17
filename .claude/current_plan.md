# ImpView modernization — handoff

You (the next agent instance) are resuming a multi-session task. The user's global `CLAUDE.md` specifies that this file at `.claude/current_plan.md` is the canonical resume point — read it, summarize current status back to the user, then continue.

## The plan

Full plan: **`/home/mick/.claude/plans/can-you-make-a-dreamy-sundae.md`**

Read it before doing anything. It has the context, the diagnosis of what was broken, the recommended modern stack, and the ordered migration steps with verification hooks.

Goal in one sentence: modernize a 13-year-old Middleman/Ruby/CoffeeScript/jQuery/Bootstrap-2 static site into a Vite + vanilla-ES2022 + PWA static site, preserving the two-window postMessage architecture verbatim.

## Where we are

- Branch: `2026-modernisation` (already checked out; do not switch to `master`)
- Working tree: dirty with batch 1 + batch 2 + batch 3 changes (not committed — user hasn't asked for commits)
- Batches 1, 2, and 3 are **complete**. Batch 4 is next.
- `npm run build` → exit 0, 43 modules transformed, ~540ms. Sass `[legacy-js-api]` deprecation warnings (harmless). PWA output: dist/sw.js + dist/manifest.webmanifest.

## How the user wants this executed

Non-negotiable preferences learned during batches 1–2:

1. **Use the `superpowers:executing-plans` skill** to drive execution. The flow is: review plan → batch 3 tasks → execute → report → checkpoint for feedback → next batch.
2. **Spawn Sonnet subagents** for both implementation (`general-purpose`) and review (`superpowers:code-reviewer`). Pass `model: "sonnet"` explicitly on every Agent call. The main model is Opus, but user explicitly wants sonnet for subagents.
3. **If sonnet hits its rate limit**, do NOT silently fall back to opus. Ask the user first. (Hit this once during batch 2 review; user corrected the fallback.)
4. **Offer deletions proactively after each batch.** User prefers to keep the working tree tidy. After batch N copies/ports files, audit what's safe to delete and ask. Users said "yes" both times so far, so offering pre-emptively is welcomed.
5. **Trust but verify subagent reports.** Both execution and review agents have embellished slightly. After each subagent returns, run quick verification (Bash ls, Grep) to confirm claims — don't rely solely on the agent's summary.
6. **Keep text between tool calls brief.** User's CLAUDE.md + this harness push terse updates; do not write paragraphs.

## Current todo list (copy verbatim into TodoWrite on resume)

```
[completed] Batch 1: Scaffold Vite + Node project (package.json, vite.config.js, .nvmrc, stub entries)
[completed] Batch 1: Port index.html.erb → index.html (inline control/ partials)
[completed] Batch 1: Port display.html.erb → display.html
[completed] Batch 1: Code review by sonnet code-reviewer agent
[completed] Batch 2: Bake emotions.csv + games.txt into src/data/*.js; delete Ruby data builders
[completed] Batch 2: Port control/ CoffeeScript files to ES modules
[completed] Batch 2: Port display/ CoffeeScript files to ES modules
[completed] Batch 2: Code review + must-fix/should-fix follow-ups applied
[completed] Batch 3: Replace Bootstrap 2.3 + old animate.css with minimal SCSS (custom hand-rolled)
[completed] Batch 3: Wire up Showdown for display/credits markdown rendering
[completed] Batch 3: Replace inline modal overlays with custom vanilla modal helper
[completed] Batch 3: Add PWA shell via vite-plugin-pwa
[completed] Batch 3: Delete Chrome-app artefacts (manifest.json, chrome.js, MakeCRX.rb, source/ tree)
[pending]   Batch 4: Update Dockerfile (Ruby build stage → Node build stage)
[pending]   Batch 4: Add Playwright integration tests + playwright.config.js
[pending]   Batch 4: Refresh README.md + CLAUDE.md for new stack
```

## Batch 3 — explicit entry conditions (from the batch 2 code review)

Two items from the batch 2 review are **required** in batch 3, not optional:

1. **Wire up Showdown.** [src/display/credits.js](src/display/credits.js) calls `new window.Markdown.Converter()` with a fallback to plain text. That global was provided by the Middleman build and no longer exists. Install `showdown` via npm, `import { Converter } from "showdown"`, and delete the fallback.
2. **Replace inline CSS modal overlays with Bootstrap 5 modals** in [src/control/errorCatcher.js](src/control/errorCatcher.js) and [src/control/fileAccessTester.js](src/control/fileAccessTester.js). Batch 2 had to inline these because Bootstrap 2 `.modal()` JS plugin depends on jQuery (which is gone). Batch 3 is the right place to do this properly.

Nice-to-have cleanup flagged by the reviewer (do if time, skip if not — not blockers):

- Convert emotions input in [src/control/EmoRoCo.js](src/control/EmoRoCo.js) to use a `<datalist>` (matches the pattern already used by [src/control/text.js](src/control/text.js) for games).
- Add `.catch(() => {})` to the `document.exitFullscreen()` promise call in [src/display/documentReady.js](src/display/documentReady.js:21,24).

## What's where

New structure (Vite-based, the keeper):

- `package.json`, `vite.config.js`, `.nvmrc` (node 20)
- `index.html`, `display.html` at project root (both are Vite entries)
- [src/control/](src/control/) — 17 `.js` modules + `main.js` entry
- [src/display/](src/display/) — 12 `.js` modules + `main.js` entry
- [src/data/emotions.js](src/data/emotions.js) (413 entries), [src/data/games.js](src/data/games.js) (31 entries)
- [src/lib/dom.js](src/lib/dom.js) — ~29-method jQuery-compat shim (~165 lines), plus named `ready` export
- [src/styles/control.scss](src/styles/control.scss), [src/styles/display.scss](src/styles/display.scss) — **EMPTY STUBS**, batch 3 fills these
- [public/content/](public/content/) — 12 media files (images + videos)

Old Middleman source — only what batch 3 still needs:

- [source/stylesheets/](source/stylesheets/) — source of truth for the SCSS port in batch 3. Contains Bootstrap 2.3 SCSS, custom control/display SCSS, and 48k `animate.min.css`.
- [source/manifest.json](source/manifest.json) — Chrome packaged-app manifest. Batch 3 step 8 explicitly deletes.
- [source/javascripts/chrome.js](source/javascripts/chrome.js) — Chrome-app background script. Batch 3 step 8 explicitly deletes.
- [lib/MakeCRX.rb](lib/MakeCRX.rb) — packages a `.crx`. Batch 3 step 8 explicitly deletes.

Already deleted over batches 1–2: `emotions.csv`, `games.txt`, `Gemfile`, `Gemfile.lock`, `config.rb`, `lib/EmotionBuilder.rb`, `lib/GamesBuilder.rb`, all CoffeeScript files, all ERB partials, `source/content/`, `source/javascripts/lib/jquery-1.9.1.min.js`, Sprockets manifests (`source/javascripts/control.js`, `source/javascripts/display.js`).

[Dockerfile](Dockerfile) still references Ruby 2.5 — batch 4 rewrites to node:20 → nginx.

## Architectural invariants (do not touch)

These are verbatim from the plan but worth repeating — any refactor that breaks them should be rejected:

- **Two-window postMessage bus.** Control opens Display via `window.open('display.html', 'ImpView Display')`; they communicate via JSON-stringified messages of shape `{ type, target, action, value, callback }`. The "hello" handshake (display → control) is what dismisses the "Waiting for display…" loader.
- **Global namespace + handler arrays.** Every feature module pushes onto `window.control.onReadys` / `messageHandlers` / `callbackHandlers` / `clickHandlers` / `stateHandlers` (or `window.display` equivalents). Do NOT migrate to direct imports or a framework.
- **Pairing.** `src/control/foo.js` ↔ `src/display/foo.js` when both sides are needed. Keep.
- **main.js load order.** `./globals.js` first (creates the window global), then `./messaging.js`, then every other module. Never reorder.

## First actions on resume

1. Read `/home/mick/.claude/plans/can-you-make-a-dreamy-sundae.md` for full context.
2. Read this file (you're doing that now).
3. Restore the todo list by copying the block above into TodoWrite.
4. `git status` to confirm working tree state.
5. `npm run build` to confirm green baseline before starting batch 3.
6. Announce: "I'm resuming the ImpView modernization. Batches 1–2 done, starting batch 3 (styles + PWA + Chrome-app removal + Showdown + Bootstrap 5 modals)."
7. Wait for user to confirm proceed — do NOT start batch 3 without explicit user go-ahead.

## Batch 3 plan of attack (suggested)

One sonnet subagent can handle the whole batch — tasks are tightly interleaved (Bootstrap 5 affects HTML, SCSS, AND the modal JS). Sequence:

1. `npm install bootstrap showdown` (and `vite-plugin-pwa` + `workbox-window` if the plugin wants it).
2. Port [source/stylesheets/control/control.scss](source/stylesheets/control/control.scss) and [source/stylesheets/display/display.scss](source/stylesheets/display/display.scss) + the alphabet/animate sub-stylesheets into [src/styles/](src/styles/), swapping Bootstrap 2 imports for Bootstrap 5 SCSS entry points (`@import "bootstrap/scss/bootstrap"`). Check that selectors used by the ported HTML still match (`.btn`, `.container`, `.control-group`, etc. — some changed between BS2 and BS5).
3. Wire up Showdown in [src/display/credits.js](src/display/credits.js).
4. Rewrite the modal path in [src/control/errorCatcher.js](src/control/errorCatcher.js) and [src/control/fileAccessTester.js](src/control/fileAccessTester.js) using `bootstrap.Modal` (https://getbootstrap.com/docs/5.3/components/modal/) — the HTML already has modal-like markup somewhere; verify.
5. Add PWA: `vite-plugin-pwa` in [vite.config.js](vite.config.js), create `public/manifest.webmanifest` with icons derived from [public/content/i.png](public/content/i.png).
6. Delete [source/manifest.json](source/manifest.json), [source/javascripts/chrome.js](source/javascripts/chrome.js), [lib/MakeCRX.rb](lib/MakeCRX.rb). Also delete empty `source/javascripts/` and `lib/` dirs if everything's gone.
7. Verification: `npm run build` green; visual check via `npm run dev` that Start Display handshake still works; grep that no `window.Markdown` or inline modal CSS remains.

Then run a sonnet code-reviewer on the batch before continuing to batch 4.

## Things to NOT do

- Do NOT commit without explicit user request.
- Do NOT run `git reset`, `git push`, or any destructive git command.
- Do NOT switch branches.
- Do NOT introduce TypeScript, React, or any framework. Plan is vanilla ESM.
- Do NOT add test framework yet — Playwright comes in batch 4.
- Do NOT "improve" the handler-array pattern. It's the deliberate architecture.
- Do NOT fall back to opus for subagents if sonnet is rate-limited — ask the user.

Good luck. The hard part is done.
