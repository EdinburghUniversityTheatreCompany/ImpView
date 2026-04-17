import { $ } from "../lib/dom.js";

const control = window.control;

const callbackHandlers = control.callbackHandlers;
const clickHandlers = control.clickHandlers;
const stateHandlers = control.stateHandlers;
const onReadys = control.onReadys;

callbackHandlers.push((message) => {
  if (message.target !== "video") return;

  if (message.type === "control") {
    switch (message.action) {
      case "setSource":
        $('#controls-video-loader').text("Loaded");
        break;
      case "playing":
      case "paused":
        $('#' + message.target + '-play-state').val(message.action);
        $('#' + message.target + '-play-state').change();
        break;
    }
  } else if (message.type === "error") {
    $('#controls-video-loader').text(message.value);
  }
});

clickHandlers.push(() => {
  $('#controls-show-hide-video').click(() => {
    if ($('#video-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "video", action: "show" });
    } else {
      control.sendMessage({ type: "control", target: "video", action: "hide" });
    }
  });

  $('#controls-fade-video').click(() => {
    if ($('#video-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "video", action: "fadeIn" });
    } else {
      control.sendMessage({ type: "control", target: "video", action: "fadeOut" });
    }
  });

  $('#controls-play-video').click(() => {
    if ($('#video-play-state').val() === "playing") {
      control.sendMessage({ type: "control", target: "video", action: "pause" });
    } else {
      control.sendMessage({ type: "control", target: "video", action: "play" });
    }
  });

  $('#controls-restart-video').click(() => {
    control.sendMessage({ type: "control", target: "video", action: "restart" });
  });

  $('#controls-show-play-video').click(() => {
    control.sendMessage({ type: "control", target: "video", action: "show" });
    control.sendMessage({ type: "control", target: "video", action: "play" });
  });

  $('#controls-hide-restart-video').click(() => {
    control.sendMessage({ type: "control", target: "video", action: "hide" });
    control.sendMessage({ type: "control", target: "video", action: "pause" });
    control.sendMessage({ type: "control", target: "video", action: "restart" });
  });

  $('.preset-videos a').click((e) => {
    const video = $(e.currentTarget).find('video').get(0);
    $('#video-input').val(video.src);
    $('#video-input').keyup();
  });

  $('.preset-videos video').each((i, item) => {
    setTimeout(() => {
      item.currentTime = 2;
    }, 1000);
  });
});

function setVideoButtonStates() {
  const show_hide = $('#controls-show-hide-video');
  const fade = $('#controls-fade-video');
  if ($('#video-state').val() === "hidden") {
    show_hide.text("Show Video");
    fade.text("Fade Video In");
  } else {
    show_hide.text("Hide Video");
    fade.text("Fade Video Out");
  }

  if ($('#video-play-state').val() === "playing") {
    $('#controls-play-video').text("Pause Video");
  } else {
    $('#controls-play-video').text("Play Video");
  }
}

stateHandlers.push(() => {
  $('#video-state').change(setVideoButtonStates);
  $('#video-play-state').change(setVideoButtonStates);
});

onReadys.push(() => {
  let video_src = "";
  $('#video-input').keyup(() => {
    if (video_src === $('#video-input').val()) return;

    video_src = $('#video-input').val();
    $('#controls-video-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "video", action: "setSource", value: video_src });
  });

  $('#video-file').change(() => {
    const input = $('#video-file').get(0);
    const url = URL.createObjectURL(input.files[0]);

    $('#video-input').val(url);
    $('#controls-video-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "video", action: "setSource", value: url });
  });
});
