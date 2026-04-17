import { $, ready } from "../lib/dom.js";

const control = window.control;
const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;
const onReadys = control.onReadys;

ready(() => {
  try {
    const finish_setup = () => {
      $("#loader").text("Waiting for display...");

      $("form").keydown((e) => {
        if (e.keyCode === 13) {
          e.preventDefault();
          return false;
        }
      });

      clickHandlers.forEach((handler) => handler());
      stateHandlers.forEach((handler) => handler());
      onReadys.forEach((onReady) => onReady());

      window.onbeforeunload = () => {
        return "Please confirm. This will close the display window.";
      };

      window.onunload = () => {
        if (control.display) control.display.close();
      };
    };

    // Open a new window normally (Chrome App path deleted).
    $("#start_display_button").click(() => {
      // `popup=yes` forces a new window rather than a tab. Size is a sensible
      // starting default; the operator usually spacebars to fullscreen anyway.
      control.display = window.open(
        "display.html",
        "ImpView Display",
        "popup=yes,width=1280,height=720"
      );
      finish_setup();
    });
  } catch (e) {
    control.showError(e.message, "", "", e.stack);
  }
});
