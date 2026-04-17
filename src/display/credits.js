import { $ } from "../lib/dom.js";

const display = window.display;
const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "credits") return;

  const target = message.target;
  const target$ = $('#' + target);

  switch (message.action) {
    case "setValue": {
      let markdown = message.value;
      // For sanity: ensure blank line before new paragraphs
      markdown = markdown.replace(/\n(\w)/g, "\n\n$1");
      // Use showdown or simple converter if available; fall back to plain text.
      if (window.Markdown && window.Markdown.Converter) {
        const converter = new window.Markdown.Converter();
        target$.html(converter.makeHtml(markdown));
      } else {
        // Simple line-break fallback
        target$.html(markdown.replace(/\n/g, '<br>'));
      }
      break;
    }
    case "roll": {
      const windowHeight = document.body.scrollHeight;
      const windowWidth  = document.body.scrollWidth;

      const height = target$.get(0).offsetHeight;
      const triggerHeight = windowHeight / 4;

      const time = (height < windowHeight) ? 20 : 20 * (height / windowHeight);

      const children = Array.from(target$.get(0).children);
      // Don't use hide as we need the spacing
      children.forEach((child) => { child.style.opacity = '0'; });

      target$.show();

      const el = target$.get(0);
      el.style.top = `${windowHeight - (triggerHeight - 10)}px`;

      // Animate using CSS transition
      el.style.transition = `top ${time}s linear`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.top = `${-1 * height}px`;
        });
      });

      let progressInterval = setInterval(() => {
        const currentTop = parseFloat(el.style.top);
        children.forEach((child, i) => {
          const childTop = child.getBoundingClientRect().top;
          if (childTop < windowHeight - triggerHeight && child.style.opacity === '0') {
            animateIn($(child), windowHeight, windowWidth);
          }
        });
      }, 100);

      el.addEventListener('transitionend', () => {
        clearInterval(progressInterval);
        target$.hide();
        el.style.transition = '';
      }, { once: true });

      break;
    }
  }
});

function animateIn(item$, windowHeight, windowWidth) {
  item$.css("opacity", "1");

  const animations = [
    "bounceInLeft", "bounceInRight", "bounceInUp", "flipUp",
    "rotateInUpLeft", "rotateInUpRight", "growIn"
  ];

  const animation = animations[Math.floor(Math.random() * animations.length * 0.99)];

  item$.addClass("animated");
  item$.addClass(animation);

  const onEnd = () => {
    item$.off('animationend', onEnd);
    item$.off('webkitAnimationEnd', onEnd);
    item$.removeClass("animated");
    item$.removeClass(animation);
  };
  item$.on('animationend', onEnd);
  item$.on('webkitAnimationEnd', onEnd);
}
