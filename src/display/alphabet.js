import { $ } from "../lib/dom.js";

const display = window.display;

const LETTER_OFFSET = 13.85;

let currentLetter = "a";

const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "alphabet") return;

  const target = message.target;
  // `initial` now lives on the wrapper (so fading the wrapper doesn't drag
  // the 3D subtree into a flattened compositor layer). Everything that used
  // to toggle .initial on #alphabet now toggles it on #alphabet-wrap.
  const wrap$ = $('#alphabet-wrap');

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
  const aIndex = 97;
  const index  = currentLetter.charCodeAt(0) - aIndex;
  const rotation = LETTER_OFFSET * index;
  setRotation(rotation);

  $('#alphabet li').removeClass("current");
  document.querySelector(`#alphabet li:nth-child(${index + 1})`)
    ?.classList.add("current");
}

function nextLetter() {
  let letter;
  if (currentLetter !== "z") {
    letter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
  } else {
    letter = "a";
  }
  setLetter(letter);
}

function setRotation(rotation) {
  const el = document.getElementById('alphabet');
  if (el) {
    el.style.transform = `rotateX(13deg) rotateY(${rotation}deg)`;
  }
}
