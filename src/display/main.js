// Entry point for the display window.
// Load order mirrors the old Sprockets manifest (display.js):
//   globals first (creates window.display), messaging second, rest alphabetically.

import "./globals.js";
import "./messaging.ts";

// Remaining modules alphabetically:
import "./activation.js";
import "./alphabet.js";
import "./animate.js";
import "./credits.js";
import "./documentReady.js";
import "./EmoRoCo.js";
import "./errorCatcher.js";
import "./genericControls.js";
import "./image.js";
import "./video.js";
import "./visibility.js";
