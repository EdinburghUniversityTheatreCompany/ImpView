const control = window.control;

const client_id = Math.floor(Math.random() * 1000000);
const key = `impview-${client_id}`;

control.spellcheck = (text, callback) => {
  const atd_url = `http://service.afterthedeadline.com/checkDocument?data=${encodeURIComponent(text)}&key=${key}`;

  fetch(atd_url)
    .then((res) => res.text())
    .then((xmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, "text/xml");
      const errors = doc.querySelectorAll("error");

      if (errors.length === 0) {
        callback([text]);
        return;
      }

      const replacements = [];
      errors.forEach((item) => {
        const old = item.querySelector("string") ? item.querySelector("string").textContent : "";
        const option = item.querySelector("option") ? item.querySelector("option").textContent : "";
        replacements.push({ old, option });
      });

      let result = text;
      replacements.forEach((item) => {
        result = result.replace(item.old, item.option);
      });

      callback([result]);
    })
    .catch(() => {
      callback([text]);
    });
};
