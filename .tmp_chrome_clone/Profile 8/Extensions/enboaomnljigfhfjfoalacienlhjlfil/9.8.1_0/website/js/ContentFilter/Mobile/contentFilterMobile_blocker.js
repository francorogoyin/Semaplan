function includesStringOrRegex(element, longString) {
  if (longString.includes(element)) {
    return true;
  }

  const regex = new RegExp(
    element.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  );
  return regex.test(longString);
}

function filterElement(element, rules) {
  const itemTextContent = element.textContent;

  for (const rule of rules) {
    const escapedRule = rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (escapedRule.length < 2) {
      return;
    }

    if (includesStringOrRegex(escapedRule, itemTextContent)) {
      element.style.display = "none";
      return;
    }

    const includesAttr = element.querySelectorAll(
      `a[href*="${escapedRule}" i], [aria-label*="${escapedRule}" i]`,
    );

    if (includesAttr.length > 0) {
      element.style.display = "none";
    }
  }
}

function filterYouTubeContent() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};
    // Get filter lists
    const channelsRules =
      youtubePageState[getConst.filterChannelsRulesData] ?? [];
    const videosRules = youtubePageState[getConst.filterVideosRulesData] ?? [];
    const commentsRules =
      youtubePageState[getConst.filterCommentsRulesData] ?? [];
    const postsRules = youtubePageState[getConst.filterPostsRulesData] ?? [];

    const mergedCardRules = [...videosRules, ...channelsRules];
    const mergedCommentRules = [...commentsRules, ...channelsRules];
    const mergedPostRules = [...postsRules, ...channelsRules];

    // Select content elements
    const selector = contentTags
      .map((tag) => `${tag}:not([filterChecked])`)
      .join(", ");
    const contentElements = document.querySelectorAll(selector);

    for (const element of contentElements) {
      if (
        element.querySelector("a[href*='watch?v']") ||
        element.querySelector("a[href*='shorts/']") ||
        element.querySelector("a[href*='playlist?list']") ||
        element.tagName.toLowerCase() === "ytm-compact-channel-renderer"
      ) {
        if (mergedCardRules.length > 0) {
          filterElement(element, mergedCardRules);
          element.setAttribute("filterChecked", "");
        }
      } else if (element.querySelector(".comment-content")) {
        if (mergedCommentRules.length > 0) {
          filterElement(element, mergedCommentRules);
          element.setAttribute("filterChecked", "");
        }
      }
    }
  });
}

// MARK: - Content Changes Observer
// It need to trigger when specific elements is appearing or loading new to recheck if need block them

browser.storage.local.get(
  [getConstNotSyncing.notSyncingState, getConst.system],
  function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const extensionIsEnabled =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    const filterIsEnabled =
      youtubePageState[getConst.filterIsEnabledData] ?? false;

    if (extensionIsEnabled == true && filterIsEnabled == true) {
      const queries = contentTags.map((tag) => ({
        element: `${tag}`,
      }));

      var filterObserver = new MutationSummary({
        callback: filterYouTubeContent,
        queries: queries,
      });
    }
  },
);
