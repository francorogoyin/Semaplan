(function () {
  let autoPlayVideoPlayer = null;
  let autoPlayChannelVideoPlayer = null;

  const videoAutoPlayRenderConfig = {
    childList: true,
    subtree: true,
  };

  browser.runtime.onMessage.addListener((message) => {
    if (
      message.id === "socialFocus_youtube_hide_thumbnails" &&
      message.type === "toggle"
    ) {
      browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
        const { flags } = obj[getConst.runtimeSnapshot] ?? {
          css: {},
          flags: {},
        };

        const isDisableAutoPlay =
          flags["socialFocus_youtube_hide_thumbnails"] ?? false;

        if (!autoPlayVideoPlayer) {
          const youtubeAutoPlayVideoPlayer = document.querySelector(
            `${
              isUserAgentMobile() ? "ytm-video-preview" : "ytd-video-preview"
            } video`,
          );

          if (youtubeAutoPlayVideoPlayer) {
            autoPlayVideoPlayer = youtubeAutoPlayVideoPlayer;
          }
        }

        if (isDisableAutoPlay) {
          if (!autoPlayChannelVideoPlayer) {
            const channelVideoVideoPlayer = document.querySelector(
              "ytd-channel-video-player-renderer video",
            );

            if (channelVideoVideoPlayer && !isUserAgentMobile()) {
              autoPlayChannelVideoPlayer = channelVideoVideoPlayer;
            }
          }

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
      });
    }
  });

  const videoAutoPlayRenderObserver = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
        const { flags } = obj[getConst.runtimeSnapshot] ?? {
          css: {},
          flags: {},
        };

        const isDisableAutoPlay =
          flags["socialFocus_youtube_hide_thumbnails"] ?? false;

        const youtubeAutoPlayVideoPlayer = document.querySelector(
          `${
            isUserAgentMobile() ? "ytm-video-preview" : "ytd-video-preview"
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
    });
  });

  const channelVideoAutoPlayRenderObserver = new MutationObserver(
    (mutations) => {
      mutations.forEach(() => {
        browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
          const { flags } = obj[getConst.runtimeSnapshot] ?? {
            css: {},
            flags: {},
          };

          const isDisableAutoPlay =
            flags["socialFocus_youtube_hide_thumbnails"] ?? false;

          const channelVideoVideoPlayer = document.querySelector(
            "ytd-channel-video-player-renderer video",
          );

          if (channelVideoVideoPlayer && !isUserAgentMobile()) {
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
      });
    },
  );

  document.addEventListener("DOMContentLoaded", () => {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? {
        css: {},
        flags: {},
      };

      const autoPlayEnabledAttribute =
        flags["socialFocus_youtube_hide_thumbnails"] ?? false;

      if (autoPlayEnabledAttribute) {
        videoAutoPlayRenderObserver.observe(
          document.body,
          videoAutoPlayRenderConfig,
        );

        channelVideoAutoPlayRenderObserver.observe(
          document.body,
          videoAutoPlayRenderConfig,
        );
      } else {
        videoAutoPlayRenderObserver.disconnect();
        channelVideoAutoPlayRenderObserver.disconnect();
      }
    });
  });
})();
