// Creates window.display and its handler arrays.
// Packaged App APIs removed — this file only creates the window.display namespace.
window.display = {};

window.display.onReadys = [];
window.display.messageHandlers = [];
window.display.callbackHandlers = [];

window.display.controller = null;
window.display.activeLoop = null;
// Per-target animation speed tracking for smooth slider changes.
window.display.naturalDurationS = {}; // duration (s) when last animation started
window.display.desiredDurationS = {}; // latest slider value, even while loop runs
