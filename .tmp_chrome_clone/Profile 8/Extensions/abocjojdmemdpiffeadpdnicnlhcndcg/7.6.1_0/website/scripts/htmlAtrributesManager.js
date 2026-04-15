// MARK: - Set Site Attribute
const currentHref = window.location.href;
const websiteObject = getSiteInfo();
const hackerNewsOptionsWithVerticalLinesList = [
  "socialFocus_hacker-news_navigation_hide_new",
  "socialFocus_hacker-news_navigation_hide_past",
  "socialFocus_hacker-news_navigation_hide_comments",
  "socialFocus_hacker-news_navigation_hide_ask",
  "socialFocus_hacker-news_navigation_hide_show",
  "socialFocus_hacker-news_navigation_hide_jobs",
  "socialFocus_hacker-news_post_hide_hide_button",
  "socialFocus_hacker-news_navigation_hide_submit",
];

let isMobile = false;

if (isUserAgentMobile()) {
  isMobile = true;
} else {
  isMobile = false;
}

// Start observer by desktop and mobile tags

var detectInterval = setInterval(function () {
  // Check mobile selectors

  for (const selector of websiteObject.mobileSelectorCheck) {
    if (selector != "") {
      const checkSelect = document.querySelector(selector);
      if (checkSelect) {
        isMobile = true;
        clearInterval(detectInterval);
        break;
      }
    }
  }

  // Check desktop selectors

  for (const selector of websiteObject.desktopSelectorCheck) {
    if (selector != "") {
      const checkSelect = document.querySelector(selector);
      if (checkSelect) {
        isMobile = false;
        clearInterval(detectInterval);
        break;
      }
    }
  }
}, 10);

setTimeout(function () {
  clearInterval(detectInterval);
}, 5000);

// MARK: - Set options values to HTML

function applyAllSettings() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? {};

    if (runtimeSnapshot) {
      applyRuntime(runtimeSnapshot);
    }
  });
}

function applyRuntime(runtime) {
  if (runtime) {
    const { flags, css } = runtime;

    if (flags[`socialFocus_${websiteObject.name}_master_toggle`]) {
      removeStyles();
    } else {
      applyStyles(css[websiteObject.name]);
    }

    if (flags && typeof flags === "object") {
      Object.entries(flags).forEach(([settingId, attribute]) => {
        applyFlags(settingId, attribute, flags, css);
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

if (currentHref.includes("news.ycombinator.com")) {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const status =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    document
      .querySelector("html")
      .setAttribute("socialFocus_site_is", websiteObject.name);

    document
      .querySelector("html")
      .setAttribute("socialFocus_global_enable", status);
  });
}

setInitialExtensionState();

// MARK: - Update in html

function applyFlags(settingId, attribute, flags, css) {
  const currentLocation = window.location.href;

  // Set in html

  if (
    currentLocation.includes("news.ycombinator.com") &&
    settingId.includes("hacker-news")
  ) {
    document.documentElement.setAttribute(settingId, attribute);

    if (hackerNewsOptionsWithVerticalLinesList.includes(settingId)) {
      formatHackerNewsNavigationElements(settingId, attribute);
    }
  }

  // Special for facebook feed posts

  if (currentLocation.includes("facebook")) {
    if (
      settingId == "socialFocus_facebook_feed_hide_posts_from_people_to_follow"
    ) {
      triggerFilterFacebookPosts();
    }
  }

  if (currentLocation.includes("linkedin")) {
    if (settingId === "socialFocus_linkedin_other_hide_messaging_popup")
      hideMessagingFloatPopup(attribute);
  }

  if (currentLocation.includes("instagram")) {
    if (settingId === "socialFocus_instagram_feed_hide_suggested_posts") {
      hideSuggestedPostInstagram(attribute);
    }
  }

  if (currentLocation.includes("reddit")) {
    if (settingId === "socialFocus_reddit_header_hide_trending_today") {
      handleRedditTrendingToday(
        attribute,
        isMobile,
        "socialFocus_reddit_header_hide_trending_today",
      );
    }
  }

  if (currentLocation.includes("youtube")) {
    if (settingId === "socialFocus_youtube_hide_shorts") {
      hideMenuTabs();
    }
  }

  if (
    settingId ==
      `socialFocus_${websiteObject.name}_daily_limit_show_timer_draggable` &&
    !isMobile
  ) {
    if (attribute) {
      createTimerModal({ isDesktop: true });
    } else {
      removeTimerModal();
    }
  }

  if (
    settingId == `socialFocus_${websiteObject.name}_daily_limit_show_timer` &&
    isMobile
  ) {
    if (attribute) {
      createTimerModal({ isDesktop: false });
    } else {
      removeTimerModal();
    }
  }

  if (settingId == `socialFocus_${websiteObject.name}_master_toggle`) {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const dailyLimitDuration =
        dailyLimitState[
          `socialfocus_${websiteObject.name}_dailylimitduration`
        ] ?? null;

      const dailyLimitLastedTime =
        dailyLimitState[
          `socialfocus_${websiteObject.name}_dailylimitlastedtime`
        ] ?? null;

      if (!currentLocation.includes("news.ycombinator.com"))
        if (
          !attribute &&
          dailyLimitDuration !== "noLimit" &&
          dailyLimitDuration !== null &&
          dailyLimitLastedTime !== null
        ) {
          stopTimer();
          startSiteBlockingTimer(websiteObject.name);
        }
    });
  }

  if (attribute == false || attribute == "noLimit") {
    clearRuntimeFlags(settingId, flags, css);
  }
}

function clearRuntimeFlags(settingId, flags, css) {
  if (settingId in flags) {
    delete flags[settingId];

    setToStorage(getConst.runtimeSnapshot, { css, flags });
  }
}

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

  if (currentHref.includes("news.ycombinator.com")) {
    document.documentElement.setAttribute(
      "socialFocus_global_enable",
      newEnabled,
    );
  }

  if (newEnabled) {
    applyAllSettings();
  } else {
    removeStyles();
  }
});

// MARK: - Receive Requests from popup

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "applyRuntime") {
    browser.storage.local.get(
      [getConst.runtimeSnapshot, getConstNotSyncing.notSyncingState],
      function (obj) {
        const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? {};

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

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "checkSelectors") {
    sendResponse({ isDesktop: !isMobile });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "removeStyles") {
    removeStyles();
  }
});
