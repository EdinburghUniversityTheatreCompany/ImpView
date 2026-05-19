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
    const loop = !!message.loop;
    const boomerang = !!message.boomerang;

    // Stop any existing loop on this target before starting a new one.
    if (display.activeLoop && display.activeLoop.target === target) {
      target$.removeClass("animated");
      target$.removeClass(display.activeLoop.className);
      const el = target$.get(0);
      if (el) {
        el.style.animationIterationCount = "";
        el.style.animationDirection = "";
      }
      display.activeLoop = null;
    }

    // Reset
    target$.off("animationend");
    target$.off("webkitAnimationEnd");
    target$.removeClass();

    // Apply loop/boomerang modifiers as inline styles before adding classes.
    const el = target$.get(0);
    if (el) {
      if (loop && boomerang) {
        el.style.animationIterationCount = "infinite";
        el.style.animationDirection = "alternate";
      } else if (loop) {
        el.style.animationIterationCount = "infinite";
        el.style.animationDirection = "normal";
      } else if (boomerang) {
        el.style.animationIterationCount = "2";
        el.style.animationDirection = "alternate";
      } else {
        el.style.animationIterationCount = "";
        el.style.animationDirection = "";
      }
    }

    const cleanup = () => {
      target$.off("animationend", cleanup);
      target$.off("webkitAnimationEnd", cleanup);
      target$.removeClass();
      if (el) {
        el.style.animationIterationCount = "";
        el.style.animationDirection = "";
      }

      // With boomerang the last half-cycle plays in the reverse direction, so the
      // final visible state is the opposite of what after="hide" would normally imply.
      // XOR: hide iff exactly one of (after="hide", boomerang) is true.
      const shouldHide = boomerang ? message.after !== "hide" : message.after === "hide";
      if (shouldHide) {
        target$.hide();
      }

      if (display.activeLoop && display.activeLoop.target === target) {
        display.activeLoop = null;
      }
      display.syncSpeedCssVar?.(target);
      display.sendVisibility(target);
    };

    if (loop) {
      // No cleanup on animationend — runs until stop-loop / graceful-stop-loop.
      // Store after and boomerang so the graceful-stop handler can compute visibility.
      display.activeLoop = { target, className: value, after: message.after, boomerang };
    } else {
      target$.on("animationend", cleanup);
      target$.on("webkitAnimationEnd", cleanup);
    }

    target$.addClass("animated");
    target$.addClass(value);
    target$.show();
  }
};
