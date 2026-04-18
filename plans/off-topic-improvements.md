# Off-topic improvements noted during Batch 2

## src/display/credits.js — `$.animate` replaced with CSS transition

The original used jQuery's `.animate({ top: ... })` with a `progress` callback to
trigger per-child animations as they enter view. The port uses a setInterval + CSS
transition, which is less precise. A better replacement would be an
`IntersectionObserver`-based approach on the credits container to fire `animateIn`
as each child crosses the trigger threshold — avoids polling and works correctly when
the transition duration changes.
