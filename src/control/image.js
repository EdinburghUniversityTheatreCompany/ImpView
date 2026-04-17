import { $ } from "../lib/dom.js";

const control = window.control;

const onReadys = control.onReadys;
const callbackHandlers = control.callbackHandlers;
const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;

callbackHandlers.push((message) => {
  if (message.target !== "image") return;

  if (message.type === "control") {
    switch (message.action) {
      case "setSource":
        $('#controls-image-loader').text("Loaded");
        break;
    }
  } else if (message.type === "error") {
    $('#controls-image-loader').text(message.value);
  }
});

clickHandlers.push(() => {
  $('#controls-show-hide-image').click(() => {
    if ($('#image-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "image", action: "show" });
    } else {
      control.sendMessage({ type: "control", target: "image", action: "hide" });
    }
  });

  $('#controls-fade-image').click(() => {
    if ($('#image-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "image", action: "fadeIn" });
    } else {
      control.sendMessage({ type: "control", target: "image", action: "fadeOut" });
    }
  });

  $('.preset-images a').click((e) => {
    const img = $(e.currentTarget).find("img").get(0);
    $('#image-input').val(img.src);
    $('#image-input').keyup();
  });
});

stateHandlers.push(() => {
  $('#image-state').change(() => {
    const show_hide = $('#controls-show-hide-image');
    const fade = $('#controls-fade-image');
    if ($('#image-state').val() === "hidden") {
      show_hide.text("Show Image");
      fade.text("Fade Image In");
    } else {
      show_hide.text("Hide Image");
      fade.text("Fade Image Out");
    }
  });
});

onReadys.push(() => {
  let img_src = "";
  $('#image-input').keyup(() => {
    if (img_src === $('#image-input').val()) return;

    img_src = $('#image-input').val();
    $('#controls-image-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "image", action: "setSource", value: img_src });
  });

  $('#image-file').change(() => {
    const input = $('#image-file').get(0);
    const url = URL.createObjectURL(input.files[0]);

    $('#image-input').val(url);
    $('#controls-image-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "image", action: "setSource", value: url });
  });
});
