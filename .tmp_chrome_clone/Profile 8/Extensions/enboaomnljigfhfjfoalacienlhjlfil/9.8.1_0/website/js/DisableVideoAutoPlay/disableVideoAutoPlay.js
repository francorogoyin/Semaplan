(function () {
  let autoPlayVideoPlayer = null;
  let autoPlayChannelVideoPlayer = null;

  const videoAutoPlayRenderConfig = {
    childList: true,
    subtree: true,
  };

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "setVideoAutoPlay") {
      const isDisableAutoPlay = message.isDisableAutoPlay;

      validateDisableAutoPlay(isDisableAutoPlay);
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data.action === "setVideoAutoPlay") {
      const isDisableAutoPlay = event.data.isDisableAutoPlay;

      validateDisableAutoPlay(isDisableAutoPlay);
    }
  });

  function validateDisableAutoPlay(isDisableAutoPlay) {
    if (isDisableAutoPlay) {
      // Pause current Video which user stop scrolling and on autoplay disable options
      if (autoPlayVideoPlayer) {
        autoPlayVideoPlayer.pause();
      }

      if (autoPlayChannelVideoPlayer) {
        autoPlayChannelVideoPlayer.pause();
      }

      // Start observer else videos logic
      videoAutoPlayRenderObserver.observe(
        document.body,
        videoAutoPlayRenderConfig,
      );
    } else {
      // Play current Video which user stop scrolling and off autoplay disable options
      if (autoPlayVideoPlayer) {
        autoPlayVideoPlayer.play();
      }

      // Stop observer else videos logic
      videoAutoPlayRenderObserver.disconnect();
      channelVideoAutoPlayRenderObserver.disconnect();
    }
  }

  function videoPlayRenderWatcher() {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const isDisableAutoPlay = flags[getConst.disableAutoplay] ?? false;

      const currentHref = window.location.href;

      const youtubeAutoPlayVideoPlayer = document.querySelector(
        `${
          isDesktop(currentHref) ? "ytd-video-preview" : "ytm-video-preview"
        } video`,
      );

      if (youtubeAutoPlayVideoPlayer) {
        autoPlayVideoPlayer = youtubeAutoPlayVideoPlayer;

        if (isDisableAutoPlay) {
          youtubeAutoPlayVideoPlayer.pause();
          youtubeAutoPlayVideoPlayer.muted = true;
        } else {
          youtubeAutoPlayVideoPlayer.play();
          youtubeAutoPlayVideoPlayer.muted = false;
          videoAutoPlayRenderObserver.disconnect();
        }
      }
    });
  }

  function channelVideoRenderWatcher() {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const isDisableAutoPlay = flags[getConst.disableAutoplay] ?? false;

      const channelVideoVideoPlayer = document.querySelector(
        "ytd-channel-video-player-renderer video",
      );

      const currentHref = window.location.href;

      if (channelVideoVideoPlayer && isDesktop(currentHref)) {
        autoPlayChannelVideoPlayer = channelVideoVideoPlayer;

        if (isDisableAutoPlay) {
          channelVideoVideoPlayer.pause();
          channelVideoVideoPlayer.muted = true;

          const timeout = setTimeout(() => {
            channelVideoAutoPlayRenderObserver.disconnect();
          }, 2000);

          clearTimeout(timeout);
        } else {
          channelVideoVideoPlayer.play();
          channelVideoVideoPlayer.muted = false;
          channelVideoAutoPlayRenderObserver.disconnect();
        }
      }
    });
  }

  const videoAutoPlayRenderObserver = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      videoPlayRenderWatcher();
    });
  });

  const channelVideoAutoPlayRenderObserver = new MutationObserver(
    (mutations) => {
      mutations.forEach(() => {
        channelVideoRenderWatcher();
      });
    },
  );

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const autoPlayEnable = flags[getConst.disableAutoplay] ?? false;

    if (autoPlayEnable) {
      const autoPlayObserverInterval = setInterval(() => {
        if (!document.body) return;

        videoAutoPlayRenderObserver.observe(
          document.body,
          videoAutoPlayRenderConfig,
        );
        channelVideoAutoPlayRenderObserver.observe(
          document.body,
          videoAutoPlayRenderConfig,
        );

        videoPlayRenderWatcher();
        channelVideoRenderWatcher();

        clearInterval(autoPlayObserverInterval);
      }, 100);
    } else {
      videoAutoPlayRenderObserver.disconnect();
      channelVideoAutoPlayRenderObserver.disconnect();
    }
  });
})();
