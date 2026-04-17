// Entry point for the control window.
// Load order mirrors the old Sprockets manifest (control.js):
//   globals first (creates window.control), messaging second, rest alphabetically.

import "./globals.js";
import "./messaging.js";

// Remaining modules alphabetically:
import "./alphabet.js";
import "./animation.js";
import "./credits.js";
import "./documentReady.js";
import "./EmoRoCo.js";
import "./errorCatcher.js";
import "./fileAccessTester.js";
import "./genericCallbacks.js";
import "./i.js";
import "./image.js";
import "./keyboard.js";
import "./quickControls.js";
import "./shortcutHelp.js";
import "./spellCheck.js";
import "./text.js";
import "./video.js";
