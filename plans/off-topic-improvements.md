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

## src/control/spellCheck.js — AfterTheDeadline service
The spellcheck uses `http://service.afterthedeadline.com/` which may have CORS
restrictions from a Vite dev server origin. In production (served from a real domain)
it should work, but in dev (localhost:5173) it will likely be blocked unless the
service supports the local origin. Low priority since spellcheck is an optional UX.
