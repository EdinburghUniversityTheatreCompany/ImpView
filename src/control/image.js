import { $ } from "../lib/dom.js";
import { send } from "../lib/messages.ts";

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
        $("#controls-image-loader").text("Loaded");
        break;
    }
  } else if (message.type === "error") {
    $("#controls-image-loader").text(message.msg);
  }
});

clickHandlers.push(() => {
  $("#controls-show-hide-image").click(() => {
    send("image", $("#image-state").val() === "hidden" ? "show" : "hide");
  });

  $("#controls-fade-image").click(() => {
    send("image", $("#image-state").val() === "hidden" ? "fadeIn" : "fadeOut");
  });

  $(".preset-images a").click((e) => {
    const img = $(e.currentTarget).find("img").get(0);
    delete document.getElementById("image-input").dataset.mediaId;
    $("#image-input").val(img.src);
    $("#image-input").keyup();
  });
});

stateHandlers.push(() => {
  $("#image-state").change(() => {
    const show_hide = $("#controls-show-hide-image");
    const fade = $("#controls-fade-image");
    if ($("#image-state").val() === "hidden") {
      show_hide.text("Show Image");
      fade.text("Fade Image In");
    } else {
      show_hide.text("Hide Image");
      fade.text("Fade Image Out");
    }
  });
});

onReadys.push(() => {
  const imageInput = document.getElementById("image-input");

  // If the user types/edits the URL manually, drop any media-library binding
  // so the next send goes via URL rather than blob-id lookup.
  imageInput.addEventListener("input", (e) => {
    if (e.isTrusted) delete imageInput.dataset.mediaId;
  });

  let img_src = "";
  $("#image-input").keyup(() => {
    if (img_src === $("#image-input").val()) return;

    img_src = $("#image-input").val();
    $("#controls-image-loader").text("Loading...");
    const mediaId = imageInput.dataset.mediaId;
    if (mediaId) {
      send("image", "setSource", { mediaId });
    } else {
      send("image", "setSource", { url: img_src });
    }
  });

  $("#image-file").change(() => {
    const input = $("#image-file").get(0);
    const url = URL.createObjectURL(input.files[0]);

    delete imageInput.dataset.mediaId;
    $("#image-input").val(url);
    $("#controls-image-loader").text("Loading...");
    send("image", "setSource", { url });
  });
});
