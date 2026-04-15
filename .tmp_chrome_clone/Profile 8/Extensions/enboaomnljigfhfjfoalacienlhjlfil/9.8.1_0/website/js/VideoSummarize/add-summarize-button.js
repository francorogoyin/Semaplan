(function () {
  const adsSummarizeButtonConfig = {
    childList: true,
    subtree: true,
  };

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "addSummarizeButton") {
      const isAddSummarizeButton = message.isAddSummarizeButton;

      validateAddSummarizeButton(isAddSummarizeButton);
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data.action === "addSummarizeButton") {
      const isAddSummarizeButton = event.data.isAddSummarizeButton;

      validateAddSummarizeButton(isAddSummarizeButton);
    }
  });

  function validateAddSummarizeButton(isAddSummarizeButton) {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};

      const currentHref = window.location.href;

      const summarizeButtonContainer = document.querySelector(
        `${
          isDesktop(currentHref)
            ? "ytd-watch-metadata div #top-level-buttons-computed"
            : "ytm-slim-video-action-bar-renderer"
        } `,
      );

      if (isAddSummarizeButton) {
        addSummarizeButtonObserver.observe(
          document.querySelector("title"),
          adsSummarizeButtonConfig,
        );

        createSummarizeButton(summarizeButtonContainer);
      } else {
        addSummarizeButtonObserver.disconnect();
        removeSummarizeButton(summarizeButtonContainer);

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.summarizeWindowState]: {
              ...summarizeWindowState,
              [getConst.isShowSummarizeWindow]: false,
            },
          },
        });
      }
    });
  }

  const addSummarizeButtonObserver = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      browser.storage.local.get(
        [getConstNotSyncing.notSyncingState, getConst.runtimeSnapshot],

        function (obj) {
          const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
          const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

          const addSummarizeButton =
            flags[getConst.addSummarizeButtonState] ?? false;

          const isExtensionEnable =
            notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

          const currentHref = window.location.href;

          const summarizeButtonContainer = document.querySelector(
            `${
              isDesktop(currentHref)
                ? "ytd-watch-metadata div #top-level-buttons-computed"
                : "ytm-slim-video-action-bar-renderer"
            } `,
          );

          if (summarizeButtonContainer && isExtensionEnable) {
            if (
              !summarizeButtonContainer.querySelector(
                "#summarizeButtonContainer",
              )
            ) {
              if (addSummarizeButton) {
                createSummarizeButton(summarizeButtonContainer);
              } else {
                removeSummarizeButton(summarizeButtonContainer);
              }
            }
          }
        },
      );
    });
  });

  function createSummarizeButton(summarizeButtonContainer) {
    if (summarizeButtonContainer) {
      const buttonLikeDislikeSegment = summarizeButtonContainer.querySelector(
        "segmented-like-dislike-button-view-model",
      );
      if (buttonLikeDislikeSegment) {
        const summarizeButtonInnerContainer = document.createElement("div");
        summarizeButtonInnerContainer.id = "summarizeButtonContainer";

        summarizeButtonInnerContainer.innerHTML = `<button>${buttonSvgInnerHtml}<span>Summary</span></button>`;
        const summarizeButton =
          summarizeButtonInnerContainer.querySelector("button");

        summarizeButton.onclick = function () {
          browser.storage.local.get(getConst.system, function (obj) {
            const systemState = obj[getConst.system] ?? {};
            const summarizeWindowState =
              systemState[getConst.summarizeWindowState] ?? {};

            const isShowSummarizeWindow =
              summarizeWindowState[getConst.isShowSummarizeWindow] ?? false;

            setTimeout(() => {
              setSystemConfigStorage({
                systemState,
                newState: {
                  [getConst.summarizeWindowState]: {
                    ...summarizeWindowState,
                    [getConst.isShowSummarizeWindow]: !isShowSummarizeWindow,
                  },
                },
              });
            }, 5);
          });
        };

        buttonLikeDislikeSegment.insertAdjacentElement(
          "afterend",
          summarizeButtonInnerContainer,
        );
      }
    }
  }

  function removeSummarizeButton(summarizeButtonContainer) {
    if (summarizeButtonContainer) {
      const summarizeButtonContainerToRemove =
        summarizeButtonContainer.querySelector("#summarizeButtonContainer");

      if (summarizeButtonContainerToRemove) {
        summarizeButtonContainerToRemove.remove();
      }
    }
  }

  function setThemeAttributeToHtml() {
    const isDark =
      window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("background-color") === "rgb(15, 15, 15)";
    if (isDark) {
      document.documentElement.setAttribute("yt-dark-theme", "");
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    addSummarizeButtonObserver.observe(
      document.querySelector("title"),
      adsSummarizeButtonConfig,
    );

    setThemeAttributeToHtml();
  });
})();
