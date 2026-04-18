import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";
import games from "../data/games.js";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;
const onReadys = control.onReadys;

clickHandlers.push(() => {
  $("#controls-show-hide-text").click(() => {
    send("text", $("#text-state").val() === "hidden" ? "show" : "hide");
  });

  $("#controls-fade-text").click(() => {
    send("text", $("#text-state").val() === "hidden" ? "fadeIn" : "fadeOut");
  });
});

stateHandlers.push(() => {
  $("#text-state").change(() => {
    const show_hide = $("#controls-show-hide-text");
    const fade = $("#controls-fade-text");
    if ($("#text-state").val() === "hidden") {
      show_hide.text("Show Text");
      fade.text("Fade Text In");
    } else {
      show_hide.text("Hide Text");
      fade.text("Fade Text Out");
    }
  });
});

onReadys.push(() => {
  $("#text-input").keyup(() => {
    send("text", "setValue", { value: $("#text-input").val() });
  });

  $("#text-color").change(() => {
    send("text", "setColor", { value: $("#text-color").val() });
  });

  // Games list is now baked — no fetch needed. (imported from ../data/games.js)
  // Typeahead: if a datalist element exists with id "games-list", populate it.
  const datalist = document.getElementById("games-list");
  if (datalist) {
    games.forEach((game) => {
      const option = document.createElement("option");
      option.value = game;
      datalist.appendChild(option);
    });
  }
});
