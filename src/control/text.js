import { $ } from "../lib/dom.js";
import games from "../data/games.js";

const control = window.control;

const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;
const onReadys = control.onReadys;

function titleize(string) {
  return string.replace(
    /(\w|')*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

clickHandlers.push(() => {
  $("#controls-show-hide-text").click(() => {
    if ($("#text-state").val() === "hidden") {
      control.sendMessage({ type: "control", target: "text", action: "show" });
    } else {
      control.sendMessage({ type: "control", target: "text", action: "hide" });
    }
  });

  $("#controls-fade-text").click(() => {
    if ($("#text-state").val() === "hidden") {
      control.sendMessage({ type: "control", target: "text", action: "fadeIn" });
    } else {
      control.sendMessage({ type: "control", target: "text", action: "fadeOut" });
    }
  });

  $("#controls-spellcheck-text").click(() => {
    const text$ = $("#text-input");
    control.spellcheck(text$.val(), (responses) => {
      text$.val(titleize(responses[0]));
      text$.focus();
      text$.keyup();
    });
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
    control.sendMessage({
      type: "control",
      target: "text",
      action: "setValue",
      value: $("#text-input").val(),
    });
  });

  $("#text-color").change(() => {
    control.sendMessage({
      type: "control",
      target: "text",
      action: "setColor",
      value: $("#text-color").val(),
    });
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
