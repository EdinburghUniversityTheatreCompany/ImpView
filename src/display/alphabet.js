import { $ } from "../lib/dom.js";

const display = window.display;

const LETTER_OFFSET = 13.85;

let currentLetter = "a";
// Absolute rotation in degrees. `next` always increments (so z→a advances
// forward one step instead of spinning 346° back). `setStart` snaps to the
// letter's canonical rotation.
let cumulativeRotation = 0;

display.registerTarget("alphabet", (message) => {
  const target = message.target;
  // `initial` now lives on the wrapper (so fading the wrapper doesn't drag
  // the 3D subtree into a flattened compositor layer). Everything that used
  // to toggle .initial on #alphabet now toggles it on #alphabet-wrap.
  const wrap$ = $("#alphabet-wrap");

  switch (message.action) {
    case "show":
      wrap$.removeClass("initial");
      display.sendVisibility(target);
      break;
    case "hide":
      wrap$.addClass("initial");
      display.sendVisibility(target);
      break;
    case "setStart":
      setLetter(message.value);
      break;
    case "next":
      nextLetter();
      break;
  }
});

function setLetter(letter) {
  currentLetter = letter.toLowerCase();
  const index = currentLetter.charCodeAt(0) - 97;
  cumulativeRotation = LETTER_OFFSET * index;
  setRotation(cumulativeRotation);
  highlight(index);
}

function nextLetter() {
  const nextChar =
    currentLetter === "z" ? "a" : String.fromCharCode(currentLetter.charCodeAt(0) + 1);
  currentLetter = nextChar;
  cumulativeRotation += LETTER_OFFSET;
  setRotation(cumulativeRotation);
  highlight(nextChar.charCodeAt(0) - 97);
}

function highlight(index) {
  $("#alphabet li").removeClass("current");
  document.querySelector(`#alphabet li:nth-child(${index + 1})`)?.classList.add("current");
}

function setRotation(rotation) {
  const el = document.getElementById("alphabet");
  if (el) {
    el.style.transform = `rotateX(13deg) rotateY(${rotation}deg)`;
  }
}
