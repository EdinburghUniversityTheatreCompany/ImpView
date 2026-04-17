# Off-topic improvements noted during Batch 2

## src/control/EmoRoCo.js — typeahead is a no-op

The old code used Bootstrap 2's `.typeahead()` plugin. That plugin is gone. The port
registers emotions for import but never hooks them into any autocomplete UI. Batch 3
or 4 should add a `<datalist>` to the EmoRoCo entry input in `index.html` and wire
it the same way `text.js` does for games (populate options from the imported array).

## src/display/credits.js — `$.animate` replaced with CSS transition

The original used jQuery's `.animate({ top: ... })` with a `progress` callback to
trigger per-child animations as they enter view. The port uses a setInterval + CSS
transition, which is less precise. A better replacement would be an
`IntersectionObserver`-based approach on the credits container to fire `animateIn`
as each child crosses the trigger threshold — avoids polling and works correctly when
the transition duration changes.

## src/display/EmoRoCo.js — `center()` runs before element has layout

`center()` is called immediately after `$('body').append(text$)`. At that point the
element may not yet have a computed size (especially on first paint). Consider
deferring with `requestAnimationFrame` so `offsetHeight`/`offsetWidth` are valid.

## src/control/image.js and src/display/image.js — `webkitURL` → `URL`

The original code used `window.webkitURL.createObjectURL(...)`. Both ports already
use the unprefixed `URL.createObjectURL(...)` — good. Double-check `display/image.js`
does the same (it does).

## src/lib/dom.js — `.keyup()` as zero-arg trigger

The shim's `.keyup()` only registers a handler; calling it with no argument (as a
trigger) doesn't dispatch a KeyboardEvent. The control modules call `.keyup()` as a
trigger on inputs (e.g., after setting a val) to fire the onChange logic. A fix:
mirror jQuery — if called with no argument, dispatch a `new Event('keyup')` on each
node. Same applies to `.click()` (already works via the native `.click()` method on
DOM elements, so may be fine).

## src/control/animation.js — `before` field is dead data

The control sends `before: btn$.data("before")` in `animate` messages, but the
display-side `display/animate.js` never reads `message.before` — only `value`,
`byLetter`, and `after`. The new typed protocol keeps the field optional for
back-compat, but it can be removed from both sides.

## src/control/errorCatcher.js — feature-level errors are unhandled

The control-side error handler only matches `target === "window"`. Display
modules (video, image) send `{ type: "error", target: "video" / "image",
value: msg, callback: true }` which the control silently drops. Either:
(a) widen the handler to surface feature errors via the same modal, or
(b) display them inline beside the relevant control. The typed protocol
unifies the field name to `msg` (was `value`), which makes (a) trivial.

## src/control/spellCheck.js — AfterTheDeadline service

The spellcheck uses `http://service.afterthedeadline.com/` which is no longer used. Need to fix this
