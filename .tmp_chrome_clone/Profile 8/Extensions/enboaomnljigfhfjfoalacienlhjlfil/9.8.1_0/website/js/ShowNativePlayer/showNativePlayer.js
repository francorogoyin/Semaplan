(function () {
  let videoPlayer = null;

  const videoControlsConfig = {
    attributes: true,
    attributeFilter: ["controls"],
  };

  const videoRenderConfig = {
    childList: true,
    subtree: true,
  };

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "setNativeVideoPlayer") {
      const isShowNativeVideoPlayer = message.isShowNativeVideoPlayer;

      validateShowNativePlayer(isShowNativeVideoPlayer);
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data.action === "setNativeVideoPlayer") {
      const isShowNativeVideoPlayer = event.data.isShowNativeVideoPlayer;

      validateShowNativePlayer(isShowNativeVideoPlayer);
    }
  });

  function validateShowNativePlayer(isShowNativeVideoPlayer) {
    if (isShowNativeVideoPlayer) {
      showNativePlayerWatcher();
      videoRenderObserver.observe(document.body, videoRenderConfig);
    } else {
      if (videoPlayer) {
        videoPlayer.controls = false;
      }

      videoRenderObserver.disconnect();
      videoControlsObserver.disconnect();
    }
  }

  function showNativePlayerWatcher() {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const isShowNativeVideoPlayer = flags[getConst.showNativePlayer] ?? false;

      const youtubeVideoPlayer = document.querySelector("video");

      if (youtubeVideoPlayer) {
        videoPlayer = youtubeVideoPlayer;

        if (isShowNativeVideoPlayer && youtubeVideoPlayer) {
          videoPlayer.controls = true;
          videoControlsObserver.observe(videoPlayer, videoControlsConfig);
        }
      }
    });
  }

  const videoRenderObserver = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      showNativePlayerWatcher();
    });
  });

  const videoControlsObserver = new MutationObserver((records) => {
    records.forEach((mutation) => {
      const video = mutation.target;

      if (video.controls !== true) {
        video.controls = true;
      }
    });
  });

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const showNativeVideoPlayer = flags[getConst.showNativePlayer] ?? false;

    if (showNativeVideoPlayer) {
      const nativePlayerObserverInterval = setInterval(() => {
        if (!document.body) return;

        videoRenderObserver.observe(document.body, videoRenderConfig);

        showNativePlayerWatcher();

        clearInterval(nativePlayerObserverInterval);
      }, 100);
    }
  });
})();
