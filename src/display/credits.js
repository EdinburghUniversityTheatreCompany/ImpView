import { $ } from "../lib/dom.js";

// We originally rendered credits through PageDown / Showdown (full Markdown),
// but the credits CSS only ever styles <h1> and <p>. Everything else rendered
// unstyled anyway. This mini-parser handles the two features that matter:
// lines starting with `#`..`######` become headings, paragraphs are
// blank-line-separated. If you ever need full Markdown back (lists, bold,
// links, etc.), `npm i showdown` (or `marked`) and swap renderCredits for its
// converter.
function renderCredits(markdown) {
  // Ensure each line becomes its own block, so every `name` is its own <p>.
  const normalized = markdown.replace(/\n(\w)/g, "\n\n$1");
  return normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${heading[2]}</h${level}>`;
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

const display = window.display;
const messageHandlers = display.messageHandlers;

messageHandlers.push((message) => {
  if (message.type !== "control" || message.target !== "credits") return;

  const target = message.target;
  const target$ = $('#' + target);

  switch (message.action) {
    case "setValue": {
      target$.html(renderCredits(message.value));
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
