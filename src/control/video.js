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
  $('#controls-fade-video').click(() => {
    if ($('#video-state').val() === "hidden") {
      control.sendMessage({ type: "control", target: "video", action: "fadeIn" });
    } else {
      control.sendMessage({ type: "control", target: "video", action: "fadeOut" });
    }
  });

  // Play toggles play/pause. If the video is hidden, also fade it in —
  // the old "Show and Play" button was just this.
  $('#controls-play-video').click(() => {
    if ($('#video-play-state').val() === "playing") {
      control.sendMessage({ type: "control", target: "video", action: "pause" });
    } else {
      if ($('#video-state').val() === "hidden") {
        control.sendMessage({ type: "control", target: "video", action: "fadeIn" });
      }
      control.sendMessage({ type: "control", target: "video", action: "play" });
    }
  });

  $('#controls-restart-video').click(() => {
    control.sendMessage({ type: "control", target: "video", action: "restart" });
  });

  $('.preset-videos a').click((e) => {
    const link = e.currentTarget;
    document.querySelectorAll('.preset-videos a.active').forEach((a) => a.classList.remove('active'));
    link.classList.add('active');
    const video = $(link).find('video').get(0);
    $('#video-input').val(video.src);
    $('#video-input').keyup();
  });

  $('input[name="video-on-end"]').each((_i, el) => {
    el.addEventListener('change', () => {
      if (!el.checked) return;
      control.sendMessage({ type: "control", target: "video", action: "setOnEnd", value: el.value });
    });
  });

  $('.preset-videos video').each((i, item) => {
    setTimeout(() => {
      item.currentTime = 2;
    }, 1000);
  });
});

function setVideoButtonStates() {
  const fade = $('#controls-fade-video');
  if ($('#video-state').val() === "hidden") {
    fade.text("Fade In Video");
  } else {
    fade.text("Fade Out Video");
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
  // Sync initial on-end selection to the display.
  const selected = document.querySelector('input[name="video-on-end"]:checked');
  if (selected) control.sendMessage({ type: "control", target: "video", action: "setOnEnd", value: selected.value });

  let video_src = "";
  $('#video-input').keyup(() => {
    if (video_src === $('#video-input').val()) return;

    video_src = $('#video-input').val();
    // Clear any preset highlight unless the URL came from a preset click (which
    // sets .active before triggering keyup).
    const activePreset = document.querySelector('.preset-videos a.active video');
    if (!activePreset || activePreset.src !== video_src) {
      document.querySelectorAll('.preset-videos a.active').forEach((a) => a.classList.remove('active'));
    }
    $('#controls-video-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "video", action: "setSource", value: video_src });
  });

  $('#video-file').change(() => {
    const input = $('#video-file').get(0);
    const url = URL.createObjectURL(input.files[0]);

    document.querySelectorAll('.preset-videos a.active').forEach((a) => a.classList.remove('active'));
    $('#video-input').val(url);
    $('#controls-video-loader').text("Loading...");
    control.sendMessage({ type: "control", target: "video", action: "setSource", value: url });
  });
});
