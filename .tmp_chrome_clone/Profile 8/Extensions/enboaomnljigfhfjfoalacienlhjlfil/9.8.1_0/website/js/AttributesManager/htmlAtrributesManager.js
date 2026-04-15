let lastTitle = document.title;

const videoContentCenterObserver = new MutationObserver(() => {
  const currentTitle = document.title;

  if (currentTitle !== lastTitle) {
    lastTitle = currentTitle;

    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

      const centeredOption = flags["untrap_video_page_center_content"] ?? false;

      validateCenterPageOption(centeredOption);
    });
  }
});

function applyAllSettings() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? null;

    if (isDesktop(window.location.href)) {
      let interval = setInterval(() => {
        if (document.querySelector("title")) {
          videoContentCenterObserver.observe(document.querySelector("title"), {
            childList: true,
          });
          clearInterval(interval);
        }
      }, 500);
    }

    if (runtimeSnapshot) {
      applyRuntime(runtimeSnapshot);
    } else {
      defaultValuesArray.forEach((item) => {
        if (item.styles.length) {
          applyStyles(item.styles);
        }
      });
    }

    setSecondaryBGColor();
    setPrimaryBGColor();
    setAccentColor();
    setFont();
  });
}

function applyRuntime(runtime) {
  if (runtime) {
    const { flags, css } = runtime;

    applyStyles(css);

    if (flags && typeof flags === "object") {
      Object.entries(flags).forEach(([settingId, attribute]) => {
        applyFlags({ settingId, attribute, flags, css });
      });
    }
  }
}

function setInitialExtensionState() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const isExtensionEnable =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    if (isExtensionEnable) {
      applyAllSettings();
    }
  });
}

setInitialExtensionState();

// MARK: - Update in html

function applyFlags({ settingId, attribute, flags, css }) {
  // Update Thumbnail Filters
  if (getConst.thumbnailFilterIds.includes(settingId)) {
    setThumbnailFilters();
  }

  // If thumbnail clickbait replacer
  if (settingId == "untrap_video_card_replace_thumbnail") {
    thumbType = attribute;
    startThumbnailReplacing(thumbType);
    triggerThumbnailUpdate(thumbType);
  }

  if (settingId == "untrap_appearance_font") {
    setFont();
  }

  if (settingId == "untrap_appearance_color") {
    setAccentColor();
  }

  if (settingId == "untrap_appearance_primary_bg_color") {
    setPrimaryBGColor();
  }

  if (settingId == "untrap_video_page_center_content") {
    validateCenterPageOption(attribute);
  }

  if (settingId == "untrap_video_page_hide_related_videos") {
    summarizeWindowCenteringContentHandler();
  }

  if (settingId === "untrap_shorts_page_disable_exclude_scrolling") {
    isolateCurrentShort();
    disableInfinityScrollOnShortsPage();
  }

  if (
    window.location.href.includes(channelPageUrlPart1) ||
    window.location.href.includes(channelPageUrlPart2)
  ) {
    hideMenuTabs();
  }

  if (attribute == false) {
    clearRuntimeFlags(settingId, flags, css);
  }
}

function clearRuntimeFlags(settingId, flags, css) {
  if (settingId in flags) {
    delete flags[settingId];

    setToStorage(getConst.runtimeSnapshot, { css, flags });
  }
}

// MARK: - Receive Requests from popup

browser.storage.onChanged.addListener((changes) => {
  const values = getChangedValues(
    changes,
    getConstNotSyncing.notSyncingState,
    getConstNotSyncing.extensionIsEnabledData,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  const newEnabled = newValue ?? true;
  const oldEnabled = oldValue ?? true;

  if (newEnabled === oldEnabled) return;

  if (newEnabled) {
    applyAllSettings();
    activateAdditionalOptions();
  } else {
    removeStyles();
    videoContentCenterObserver.disconnect();
  }
});

browser.storage.onChanged.addListener((changes) => {
  const values = getChangedValues(
    changes,
    getConst.optionsState,
    getConst.isTesterRelease,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  applyAllSettings();
});

// Here I will check for special ids

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "applyRuntime") {
    browser.storage.local.get(
      [getConst.runtimeSnapshot, getConstNotSyncing.notSyncingState],
      function (obj) {
        const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? null;

        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
        const extensionIsEnabledData =
          notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

        if (extensionIsEnabledData) {
          applyRuntime(runtimeSnapshot);
        }
      },
    );
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "removeStyles") {
    removeStyles();
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "autoTheatherMode") {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const auto_theater =
        flags["untrap_video_page_auto_theater_mode"] ?? false;

      autoTheatherModeHandler(auto_theater);
    });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "autoShowChapters") {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const auto_shows_chapters_in_sidebar =
        flags["untrap_video_page_auto_shows_chapters_in_sidebar"] ?? false;

      if (auto_shows_chapters_in_sidebar) {
        const chaptersContainer = document.querySelector(
          `ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-macro-markers-auto-chapters"][hide],
       ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-macro-markers-description-chapters"][hide]`,
        );

        if (chaptersContainer) {
          chaptersContainer.removeAttribute("hide");
        }
      }
    });
  }
});
