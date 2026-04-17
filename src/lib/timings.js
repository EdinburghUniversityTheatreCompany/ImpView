// Shared animation durations (ms). Values are what they already were — this
// module just gives them names so the control and display sides stay in sync.
// The EmoRoCo control-side remove fade is intentionally faster than FADE_MS
// so the operator's UI reacts before the display has finished fading out.

export const FADE_MS = 1000;
export const FADE_FAST_MS = 500;

// Delay before the EmoRoCo display element picks its random destination.
// Mounting sets an initial position + opacity; this gap lets the browser
// commit that first frame before the transition class kicks in so the
// transition actually runs (instead of snapping instantly to the end state).
export const EMOROCO_SETTLE_MS = 500;

// Time to wait after assigning a preset video's src before seeking to 2s for
// the thumbnail frame — metadata has to load before currentTime is honored.
export const VIDEO_THUMB_SEEK_MS = 1000;
