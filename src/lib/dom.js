// Minimal jQuery-compatible DOM shim — implements only the subset used by ImpView.
function wrap(nodes) {
  if (!nodes) nodes = [];
  if (nodes instanceof Element || nodes instanceof Document || nodes instanceof Window) nodes = [nodes];
  if (nodes instanceof NodeList || nodes instanceof HTMLCollection) nodes = Array.from(nodes);
  if (!Array.isArray(nodes)) nodes = [nodes];

  const w = {
    _nodes: nodes,

    show() {
      nodes.forEach(n => { n.style.removeProperty('display'); });
      return w;
    },
    hide() {
      nodes.forEach(n => { n.style.display = 'none'; });
      return w;
    },
    fadeIn(duration = 400, callback) {
      nodes.forEach(n => {
        n.style.opacity = '0';
        n.style.removeProperty('display');
        n.style.transition = `opacity ${duration}ms`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            n.style.opacity = '1';
            if (callback) {
              const done = () => { n.removeEventListener('transitionend', done); callback(); };
              n.addEventListener('transitionend', done);
            }
          });
        });
      });
      return w;
    },
    fadeOut(duration = 400, callback) {
      nodes.forEach(n => {
        n.style.transition = `opacity ${duration}ms`;
        n.style.opacity = '0';
        const done = () => {
          n.removeEventListener('transitionend', done);
          n.style.display = 'none';
          n.style.removeProperty('transition');
          n.style.opacity = '';
          if (callback) callback();
        };
        n.addEventListener('transitionend', done);
      });
      return w;
    },
    text(value) {
      if (value === undefined) return nodes[0] ? nodes[0].textContent : '';
      nodes.forEach(n => { n.textContent = value; });
      return w;
    },
    html(value) {
      if (value === undefined) return nodes[0] ? nodes[0].innerHTML : '';
      nodes.forEach(n => { n.innerHTML = value; });
      return w;
    },
    val(value) {
      if (value === undefined) return nodes[0] ? nodes[0].value : '';
      nodes.forEach(n => { n.value = value; });
      return w;
    },
    attr(name, value) {
      if (value === undefined) return nodes[0] ? nodes[0].getAttribute(name) : null;
      nodes.forEach(n => { n.setAttribute(name, value); });
      return w;
    },
    addClass(name) {
      nodes.forEach(n => n.classList.add(name));
      return w;
    },
    removeClass(name) {
      if (name === undefined) {
        nodes.forEach(n => { n.className = ''; });
      } else {
        nodes.forEach(n => n.classList.remove(name));
      }
      return w;
    },
    toggleClass(name) {
      nodes.forEach(n => n.classList.toggle(name));
      return w;
    },
    css(prop, value) {
      if (value === undefined) return nodes[0] ? getComputedStyle(nodes[0]).getPropertyValue(prop) : '';
      nodes.forEach(n => { n.style[prop] = value; });
      return w;
    },
    on(event, handler) {
      nodes.forEach(n => n.addEventListener(event, handler));
      return w;
    },
    off(event, handler) {
      nodes.forEach(n => n.removeEventListener(event, handler));
      return w;
    },
    click(handler) { return w.on('click', handler); },
    keydown(handler) { return w.on('keydown', handler); },
    keyup(handler) { return w.on('keyup', handler); },
    change(handler) {
      if (handler === undefined) {
        nodes.forEach(n => n.dispatchEvent(new Event('change')));
        return w;
      }
      return w.on('change', handler);
    },
    focus() {
      if (nodes[0]) nodes[0].focus();
      return w;
    },
    blur(handler) {
      if (handler === undefined) { if (nodes[0]) nodes[0].blur(); return w; }
      return w.on('blur', handler);
    },
    each(fn) {
      nodes.forEach((n, i) => fn(i, n));
      return w;
    },
    find(selector) {
      const results = [];
      nodes.forEach(n => results.push(...n.querySelectorAll(selector)));
      return wrap(results);
    },
    append(htmlOrNode) {
      if (typeof htmlOrNode === 'string') {
        nodes.forEach(n => { n.insertAdjacentHTML('beforeend', htmlOrNode); });
      } else {
        const node = htmlOrNode._nodes ? htmlOrNode._nodes[0] : htmlOrNode;
        if (node) nodes.forEach(n => n.appendChild(node));
      }
      return w;
    },
    remove() {
      nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
      return w;
    },
    data(key, value) {
      if (value === undefined) {
        if (!nodes[0]) return undefined;
        const v = nodes[0].dataset[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
        // coerce numeric strings
        return v !== undefined && !isNaN(v) ? Number(v) : v;
      }
      nodes.forEach(n => { n.dataset[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; });
      return w;
    },
    closest(selector) {
      const results = nodes.map(n => n.closest(selector)).filter(Boolean);
      return wrap(results);
    },
    is(selector) {
      return nodes.some(n => n.matches(selector));
    },
    get(index) {
      return nodes[index];
    },
    get length() { return nodes.length; },
  };
  return w;
}

export function $(selector) {
  if (typeof selector === 'string') {
    if (selector.trim().startsWith('<')) {
      const tpl = document.createElement('template');
      tpl.innerHTML = selector.trim();
      return wrap([...tpl.content.children]);
    }
    return wrap(document.querySelectorAll(selector));
  }
  return wrap(selector);
}

export function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}
