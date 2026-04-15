function showVideoSummarizeWindow(contentToRender, callback) {
  browser.storage.local.get(
    [getConst.system, getConst.runtimeSnapshot],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};

      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

      const pageContentCenter =
        flags["untrap_video_page_center_content"] ?? false;
      const hideRelatedVideos =
        flags["untrap_video_page_hide_related_videos"] ?? false;
      const isShowSummarizeWindow =
        summarizeWindowState[getConst.isShowSummarizeWindow] ?? false;

      const currentHref = window.location.href;
      const videoSummarizeWindowContainer = document.querySelector(
        `${
          isDesktop(currentHref)
            ? `ytd-watch-flexy div#columns ${
                pageContentCenter && hideRelatedVideos
                  ? "div#primary div#below ytd-watch-metadata"
                  : "div#secondary"
              }`
            : "ytm-slim-video-metadata-section-renderer"
        }`,
      );

      const videoSummarizeWindowInnerContainer = document.createElement("div");

      videoSummarizeWindowInnerContainer.id = "videoSummarizeWindowContainer";

      videoSummarizeWindowInnerContainer.innerHTML = `<div id="videoSummarizeContainer">${contentToRender}</div>`;

      if (videoSummarizeWindowContainer) {
        videoSummarizeWindowContainer.prepend(
          videoSummarizeWindowInnerContainer,
        );

        const verifyEmailButton =
          videoSummarizeWindowContainer.querySelector("#verifyEmail");
        const verificationCode = { value: "" };

        if (
          videoSummarizeWindowContainer.querySelector(".tabs-content-container")
        ) {
          featuresSettingsHandler();
          tabsSwitchClickHandler();
          copySummarizeClick();
          setupMenuSelectHandlers(functionConfig.translateLanguageConfig);
          setupMenuSelectHandlers(functionConfig.bulletPointConfig);
          closeModalHandler();
        } else {
          if (isBrowserSafari()) {
            safariLoginFormHandler();
          } else {
            changeScreenClick();
            summarizeLoginWindowClearAllErrors();
            inputsBlocksHandler(verifyEmailButton, verificationCode);
            setEmailToDescriptionInSummarize();
            loginHandler();
            signUpHandler();
            verificationScreenButtonsHandler(verificationCode);
          }
          closeModalHandler();
        }

        videoSummarizeDisplayHandle(isShowSummarizeWindow);
      }

      if (callback && typeof callback === "function") {
        callback();
      }
    },
  );
}

function featuresSettingsHandler() {
  browser.storage.local.get(getConst.system, (obj) => {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const videoSummarizeWindowContainer = document.getElementById(
      "videoSummarizeWindowContainer",
    );
    if (!videoSummarizeWindowContainer) return;

    const inputs = settingsConfig.map((config) => {
      const input = videoSummarizeWindowContainer.querySelector(
        `#${config.id}`,
      );
      input.addEventListener(
        "change",
        config.onChange || createDefaultChangeHandler(config.storageKey),
      );
      return { input, ...config };
    });

    loadSettings();

    function loadSettings() {
      settingsConfig.forEach(({ id, storageKey, defaultValue }) => {
        const value = summarizeWindowState[storageKey] ?? defaultValue;
        updateSummarizeSetting(id, storageKey, value);
      });
    }

    function updateSummarizeSetting(id, storageKey, value) {
      const input = inputs.find((input) => input.id === id);
      if (input) {
        input.input.checked = value;

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.summarizeWindowState]: {
              ...summarizeWindowState,
              [storageKey]: value,
            },
          },
        });
      }
    }

    function createDefaultChangeHandler(storageKey) {
      return function () {
        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.summarizeWindowState]: {
              ...summarizeWindowState,
              [storageKey]: this.checked,
            },
          },
        });
      };
    }
  });
}

function tabItemOnClick(item) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const parent = item.parentElement;
    const siblings = Array.from(parent.children);

    siblings.forEach((sibling) => sibling.removeAttribute("select"));

    item.setAttribute("select", "");

    setSystemConfigStorage({
      systemState,
      newState: {
        [getConst.summarizeWindowState]: {
          ...summarizeWindowState,
          [getConst.pickedTab]: item.id,
        },
      },
    });
  });
}

function tabsSwitchClickHandler() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const videoSummarizeWindowContainer = document.getElementById(
      "videoSummarizeWindowContainer",
    );

    if (videoSummarizeWindowContainer) {
      const tabsElements =
        videoSummarizeWindowContainer.querySelectorAll(".tabs-element");

      const currentTab =
        summarizeWindowState[getConst.pickedTab] ?? "keyInsights";

      tabsElements.forEach((item) => {
        if (item.id === currentTab) {
          item.setAttribute("select", "");
          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.summarizeWindowState]: {
                ...summarizeWindowState,
                [getConst.pickedTab]: item.id,
              },
            },
          });
        }

        item.onclick = function () {
          tabItemOnClick(item);
        };
      });
    }
  });
}

function closeModalHandler() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const videoSummarizeWindowContainer = document.getElementById(
      "videoSummarizeWindowContainer",
    );

    if (videoSummarizeWindowContainer) {
      const closeContainer =
        videoSummarizeWindowContainer.querySelector(".close-container");

      closeContainer.onclick = function () {
        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.summarizeWindowState]: {
              ...summarizeWindowState,
              [getConst.isShowSummarizeWindow]: false,
            },
          },
        });
      };
    }
  });
}

function copySummarizeClick() {
  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );

  const tabsElements =
    videoSummarizeWindowContainer.querySelectorAll(".tabs-element");

  const copyButton = videoSummarizeWindowContainer.querySelector(
    ".copy-summarize-button",
  );

  if (copyButton) {
    copyButton.onclick = function () {
      const currentTab = videoSummarizeWindowContainer.querySelector(
        ".tabs-element[select]",
      );

      const currentHref = window.location.href.replace(/&t=\d+s?/, "");

      const videoId = currentHref.split("watch?v=")[1];

      const videoLink = `https://youtu.be/${videoId}`;

      if (currentTab.id !== "topComments") {
        copyButton.innerHTML = successCopySvg;

        setTimeout(() => {
          copyButton.innerHTML = copySvg;
        }, 3000);

        let copiedSummary = copiedSummaryText[currentTab.id];

        let copiedSummaryFor = copiedForSummaryText[currentTab.id];

        if (copiedSummary && copiedSummary !== "") {
          const linkText = "UnTrap for YouTube";

          const linkUrl = "https://untrap.app/";
          const creditPart = `${copiedSummaryFor} for ${videoLink} by ${linkText}`;

          copiedSummary += creditPart;

          const plainText = copiedSummary.replace(
            creditPart,
            `__${copiedSummaryFor} for ${videoLink} by ${linkText} - ${linkUrl}__`,
          );

          const htmlText = copiedSummary
            .replace(/\n/g, "<br>")
            .replace(
              creditPart,
              `<i>${copiedSummaryFor} for <a href="${videoLink}">${videoLink}</a> by <a href="${linkUrl}">${linkText}</a></i>`,
            );

          const plainBlob = new Blob([plainText], { type: "text/plain" });
          const htmlBlob = new Blob([htmlText], { type: "text/html" });

          const clipboardItem = new ClipboardItem({
            "text/plain": plainBlob,
            "text/html": htmlBlob,
          });
          navigator.clipboard.write([clipboardItem]);
        }
      }
    };

    tabsElements.forEach((tab) => {
      tab.addEventListener("click", function () {
        const htmlContent = htmlContentState[tab.id];

        copyButton.innerHTML = copySvg;

        if (htmlContent && htmlContent !== "") {
          copyButton.removeAttribute("disabled");
        } else {
          copyButton.setAttribute("disabled", "");
        }
      });
    });
  }
}

function videoSummarizeDisplayHandle(isShow) {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const isExtensionEnable =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    const videoSummarizeContainer = document.getElementById(
      "videoSummarizeContainer",
    );

    if (videoSummarizeContainer) {
      if (isShow && isExtensionEnable) {
        videoSummarizeContainer.setAttribute("isShow", "true");
      } else {
        timestampsClickScriptHandler({ isAddScript: false });

        videoSummarizeContainer.removeAttribute("isShow");
      }
    }
  });
}

function showVideoSummarizeWindowListener(changes) {
  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.summarizeWindowState,
    getConst.isShowSummarizeWindow,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  videoSummarizeDisplayHandle(newValue);
}

window.addEventListener("message", (event) => {
  if (event.data.action === "showSummarizeWindow") {
    const isShowSummarizeWindow = event.data.isShowSummarizeWindow;

    videoSummarizeDisplayHandle(isShowSummarizeWindow);
  }
});

function showLoginScreenListener(changes) {
  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.sharedState,
    "userUniqueIdentifier",
  );

  if (!values) return;

  const { newValue: newUuid, oldValue: oldUuid } = values;
  if (newUuid === oldUuid) return;

  browser.storage.local.get(getConst.system, (obj) => {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const isShowSummarizeWindow =
      summarizeWindowState[getConst.isShowSummarizeWindow] ?? false;

    const container = document.getElementById("videoSummarizeWindowContainer");
    if (!container) return;

    container.remove();

    if (newUuid) {
      showVideoSummarizeWindow(getVideoSummarizeContent(), () => {
        getVideoSummarizeContainer();
      });
    } else {
      showVideoSummarizeWindow(
        isBrowserSafari() ? getSafariLoginForm() : getLoginFormContent(),
      );

      allControllersAbort([
        keyInsightAbortController,
        transcriptionAbortController,
        topCommentsAbortController,
        videoTimestampAbortController,
      ]);
    }

    videoSummarizeDisplayHandle(isShowSummarizeWindow);
  });
}

browser.storage.onChanged.addListener(showVideoSummarizeWindowListener);

browser.storage.onChanged.addListener(showLoginScreenListener);

function renderSummarizeWindow() {
  browser.storage.local.get(
    [
      getConst.system,
      getConstNotSyncing.notSyncingState,
      getConst.runtimeSnapshot,
    ],
    function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const pageContentCenter =
        flags["untrap_video_page_center_content"] ?? false;

      const hideRelatedVideos =
        flags["untrap_video_page_hide_related_videos"] ?? false;

      const isExtensionEnable =
        notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

      const parentSummarizeSelector =
        pageContentCenter === "true" && hideRelatedVideos === "true"
          ? "div#primary div#below ytd-watch-metadata"
          : "div#secondary";

      const currentHref = window.location.href;

      const videoSummarizeWindowContainer = document.querySelector(
        `${
          isDesktop(currentHref)
            ? `ytd-watch-flexy div#columns ${parentSummarizeSelector}`
            : "ytm-slim-video-metadata-section-renderer"
        }`,
      );
      if (videoSummarizeWindowContainer) {
        {
          const isAddSummarizeButton =
            flags[getConst.addSummarizeButtonState] ?? false;

          const systemState = obj[getConst.system] ?? {};
          const sharedState = systemState[getConst.sharedState] ?? {};
          const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

          const contentToRender = uuid
            ? getVideoSummarizeContent()
            : isBrowserSafari()
              ? getSafariLoginForm()
              : getLoginFormContent();

          if (
            isExtensionEnable &&
            isAddSummarizeButton &&
            !videoSummarizeWindowContainer.querySelector(
              "#videoSummarizeWindowContainer",
            )
          ) {
            showVideoSummarizeWindow(contentToRender, () => {
              getVideoSummarizeContainer();
            });
          }
        }
      }
    },
  );
}
