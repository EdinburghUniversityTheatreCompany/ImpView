# Off-topic improvements noted during Batch 2

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

## src/control/errorCatcher.js — feature-level errors are unhandled

The control-side error handler only matches `target === "window"`. Display
modules (video, image) send `{ type: "error", target: "video" / "image",
value: msg, callback: true }` which the control silently drops. Either:
(a) widen the handler to surface feature errors via the same modal, or
(b) display them inline beside the relevant control. The typed protocol
unifies the field name to `msg` (was `value`), which makes (a) trivial.
