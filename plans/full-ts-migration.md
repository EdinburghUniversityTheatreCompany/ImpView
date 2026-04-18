# Full TypeScript migration (deferred)

## Status

**Not scheduled.** Captured here so the option is documented and ready to pick
up if/when the cost feels worth it.

## Background

The April 2026 messaging migration introduced TypeScript for the protocol
layer only — `src/lib/messages.ts` plus `src/control/messaging.ts` and
`src/display/messaging.ts`. Feature modules stay `.js` and call `send()` from
the typed helper.

The plan claimed "JS callers benefit from the same checking thanks to
`allowJs` at the import boundary." **That is wrong.** `allowJs` lets `.ts`
files import `.js` files; it does NOT type-check the JS callers' arguments.
For that we'd need `checkJs: true`.

Concretely: writing `send("video", "foobar")` in a `.js` file produces
**zero** errors from `tsc` today. The same line in a `.ts` file errors
correctly. The protocol types currently serve as documentation and an opt-in
contract for any future `.ts` file — not as enforcement on existing JS.

## What "flipping the switch" looks like

Setting `"checkJs": true` in `tsconfig.json` causes `tsc --noEmit` to surface
**~301 errors** across the codebase (snapshot taken 2026-04-18). Breakdown:

| Code    | Count | Meaning                                                                          |
| ------- | ----- | -------------------------------------------------------------------------------- |
| TS7006  | 159   | Implicit `any` parameter                                                         |
| TS2339  | 31    | Property access on `unknown` (mostly `window.control[...]`)                      |
| TS7005  | 30    | Implicit-any variable                                                            |
| TS18047 | 21    | Possibly-null value                                                              |
| TS2345  | 12    | Wrong argument type (mostly `modal({title, bodyHtml})` because `size` lacks `?`) |
| TS7034  | 11    | Variable's type can't be inferred                                                |
| TS2531  | 10    | Object possibly null                                                             |
| TS18046 | 9     | `unknown` access                                                                 |
| TS7031  | 5     | Implicit-any destructured binding                                                |
| Other   | 13    | Misc strict-mode issues                                                          |

Notably **none of the existing TS2345 hits are in `send()` calls** — the
migration's `send()` usage is correct everywhere. The errors are all in
adjacent code that simply hasn't been annotated.

## Hot spots (where the bulk of fixes would go)

- **`src/lib/dom.js`** — the jQuery shim. Every method takes untyped
  `value`/`name`/`handler` params. Adding `@param` JSDoc (or migrating the
  file to `.ts`) eliminates the largest single chunk of errors and unlocks
  better inference everywhere `$()` is used.
- **`src/lib/mediaStore.js`** — IndexedDB wrapper with untyped callbacks.
- **`src/lib/modal.js`** — the un-`?`'d `size` parameter is a real bug
  surfaced by `checkJs`; `modal({title, bodyHtml})` should work and currently
  passes `undefined` for `size`. Fix this regardless.
- **`src/control/zipIo.js`** — six modal-call sites and an `AsyncZippable`
  shape mismatch.
- **`src/control/errorCatcher.js` + `src/display/errorCatcher.js`** —
  `window.onerror`'s first arg is `string | Event`, not `string`. Real bug.

## Recommended order if/when we do this

1. **Annotate the lib layer first** (`dom.js`, `mediaStore.js`, `modal.js`).
   Either via JSDoc `@param`/`@returns` or by renaming to `.ts`. This alone
   should kill the majority of downstream errors via inference.
2. **Fix the genuine bugs** (`modal` size optionality, `window.onerror`
   signature, any null checks that flag real issues).
3. **Flip `checkJs: true`** and resolve whatever remains, file by file.
4. **Tighten lint-staged** so the typecheck on commit covers `.js` too (it
   currently only fires on `.ts` via the `*.ts` glob in `package.json`).
5. **Update the scope-note comment in `src/lib/messages.ts`** to reflect that
   JS callers are now enforced.

## Alternative: per-file `// @ts-check`

If a full migration feels too big, we can add `// @ts-check` to individual
files as we touch them. This gives the same enforcement file-by-file without
the all-or-nothing flag flip. Each file will surface its own implicit-any
errors that need annotations, but the blast radius is contained.

This is the right move if we want the messaging-protocol enforcement on the
existing migrated callers (i.js, text.js, image.js, video.js, animation.js,
EmoRoCo.js, etc.) without touching the rest of the codebase.

## Why this isn't urgent

- Runtime works — all 7 Playwright tests pass.
- The `send()` types catch mistakes during development for anyone with a
  TypeScript-aware editor (VS Code, IntelliJ): the language server checks JS
  via the same compiler the CLI uses, and inline errors show up regardless of
  `checkJs`. The gap is only in the CLI/`tsc --noEmit` step.
- New code that wants enforcement can be written as `.ts` and gets it for
  free.

The cost is an honest one: silent bad calls in JS won't fail the build, and
the lint-staged hook won't catch them. If we ever ship a regression caused by
a typo in a `send()` call from a JS file, that's the moment to schedule this.
