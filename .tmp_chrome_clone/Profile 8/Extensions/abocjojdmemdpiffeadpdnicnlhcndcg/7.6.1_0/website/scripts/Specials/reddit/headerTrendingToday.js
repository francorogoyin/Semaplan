function handleRedditTrendingToday(checkedValue, isMobile, id) {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const masterToogle = flags["socialFocus_reddit_master_toggle"] ?? false;

    function getTrendingTodayContainer() {
      const redditSearch = document.querySelector(
        `reddit-search-${isMobile ? "small" : "large"}`,
      );

      if (!redditSearch || !redditSearch.shadowRoot) {
        return null;
      }

      return [
        redditSearch.shadowRoot.querySelector(
          `div[data-faceplate-tracking-context] div #reddit-trending-searches-partial-container`,
        ),
        redditSearch.shadowRoot.querySelector(
          `div[data-faceplate-tracking-context] div.text-neutral-content-weak`,
        ),
      ];
    }

    if (!document.body) {
      const waitForTrendingTodayInterval = setInterval(() => {
        const trendingTodayContainer = getTrendingTodayContainer();

        if (trendingTodayContainer && trendingTodayContainer[0]) {
          clearInterval(waitForTrendingTodayInterval);
          hideCheckRedditTrendingToday(
            masterToogle ? false : checkedValue,
            trendingTodayContainer,
          );
        }
      }, 100);
    } else {
      const trendingTodayContainer = getTrendingTodayContainer();

      if (trendingTodayContainer && trendingTodayContainer[0]) {
        hideCheckRedditTrendingToday(
          masterToogle ? false : checkedValue,
          trendingTodayContainer,
        );
      }
    }
  });
}

function hideCheckRedditTrendingToday(checkedValue, trendingTodayContainer) {
  for (const sectionToHide of trendingTodayContainer) {
    sectionToHide.style.cssText = checkedValue
      ? "display: none !important;"
      : "display: block !important;";
  }
}

browser.storage.onChanged.addListener((changes) => {
  const values = getChangedValues(
    changes,
    getConst.optionsState,
    "socialFocus_reddit_master_toggle",
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? {
      css: {},
      flags: {},
    };

    const headerTrendingValue =
      flags["socialFocus_reddit_header_hide_trending_today"] ?? false;

    handleRedditTrendingToday(
      false,
      newValue ? false : headerTrendingValue,
      isMobileVersion(),
      "socialFocus_reddit_header_hide_trending_today",
    );
  });
});
