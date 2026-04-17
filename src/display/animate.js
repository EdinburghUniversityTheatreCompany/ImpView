import { $ } from "../lib/dom.js";

const display = window.display;

display.animate = (message, target, target$) => {
  const value = message.value;

  if (message.byLetter) {
    let text = target$.text();

    // Replace &nbsp; with whitespace
    text = text.replace(/\u00a0/g, " ");
    // Trim trailing whitespace
    text = text.replace(/[ \t]+$/g, "");

    let words = text.match(/[\S]*/g);

    words = words.map((word) => {
      word = word.replace(/./g, "<div>$&</div>");
      if (word === "") word = "&nbsp;";
      return word;
    });

    const wordsHtml = "<div class='word'>" + words.join("</div><div class='word'>") + "</div>";
    target$.html(wordsHtml);

    if (!target$.get(0) || getComputedStyle(target$.get(0)).display === "none") {
      target$.find(".word > div").css("visibility", "hidden");
      target$.show();
    }

    target$.find(".word > div").each((i, item) => {
      const item$ = $(item);

      // Reset
      item$.off("animationend");
      item$.off("webkitAnimationEnd");
      item$.removeClass();

      const onAnimEnd = () => {
        item$.off("animationend", onAnimEnd);
        item$.off("webkitAnimationEnd", onAnimEnd);
        item$.removeClass();

        if (message.after === "hide") {
          item$.css("visibility", "hidden");
        }

        const allDivs = target$.find(".word > div")._nodes;
        if (i === allDivs.length - 1) {
          if (message.after === "hide") {
            target$.hide();
            target$.find(".word > div").css("visibility", "visible");
          }
          display.sendVisibility(target);
        }
      };

      item$.on("animationend", onAnimEnd);
      item$.on("webkitAnimationEnd", onAnimEnd);

      setTimeout(() => {
        item$.addClass("animated");
        item$.addClass(value);
        item$.css("visibility", "visible");
        item$.show();
      }, i * 100);
    });
  } else {
    // Reset
    target$.off("animationend");
    target$.off("webkitAnimationEnd");
    target$.removeClass();

    const onAnimEnd = () => {
      target$.off("animationend", onAnimEnd);
      target$.off("webkitAnimationEnd", onAnimEnd);
      target$.removeClass();

      if (message.after === "hide") {
        target$.hide();
      }

      display.sendVisibility(target);
    };

    target$.on("animationend", onAnimEnd);
    target$.on("webkitAnimationEnd", onAnimEnd);

    target$.addClass("animated");
    target$.addClass(value);
    target$.show();
  }
};
