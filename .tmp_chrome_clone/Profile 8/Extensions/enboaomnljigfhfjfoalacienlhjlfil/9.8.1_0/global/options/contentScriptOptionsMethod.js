function isDesktop(href) {
  const desktopUrlParts = ["www.youtube.com"];
  const mobileUrlParts = ["m.youtube.com"];

  if (href.includes(desktopUrlParts) && !href.includes(mobileUrlParts)) {
    return true;
  } else if (!href.includes(desktopUrlParts) && href.includes(mobileUrlParts)) {
    return false;
  } else {
    return true;
  }
}

function isBrowserSafari() {
  let userAgent = window.navigator.userAgent;

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return true;
  } else {
    return false;
  }
}

function isFirefox() {
  let userAgent = window.navigator.userAgent;

  if (userAgent.match(/firefox|fxios/i)) {
    return true;
  } else {
    return false;
  }
}

function checkCenteringConditions(storageData) {
  const isLiveChat = storageData["untrap_video_page_hide_live_chat"] ?? false;
  const isFundRaiser =
    storageData["untrap_video_page_hide_fundraiser"] ?? false;
  const isHidePlayList =
    storageData["untrap_video_page_hide_playlist_panel"] ?? false;
  const isShowsChaptersInSidebar =
    storageData["untrap_video_page_auto_shows_chapters_in_sidebar"] ?? false;
  const centeredOptionValue =
    storageData["untrap_video_page_center_content"] ?? false;
  const hideRelativeValue =
    storageData["untrap_video_page_hide_related_videos"] ?? false;

  const conditions = [];

  if (hideRelativeValue && centeredOptionValue) {
    if (!isLiveChat && document.querySelector("#chat")) {
      conditions.push({ key: "isLiveChat", value: false });
    } else {
      conditions.push({ key: "isLiveChat", value: true });
    }

    if (
      !isFundRaiser &&
      document.querySelector("ytd-donation-shelf-renderer")
    ) {
      conditions.push({ key: "isFundRaiser", value: false });
    } else {
      conditions.push({ key: "isFundRaiser", value: true });
    }

    if (
      !isHidePlayList &&
      document.querySelector("#playlist[has-playlist-buttons]")
    ) {
      conditions.push({ key: "isHidePlayList", value: false });
    } else {
      conditions.push({ key: "isHidePlayList", value: true });
    }

    if (
      document.querySelector(
        `ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-macro-markers-auto-chapters"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"],
         ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"][target-id="engagement-panel-macro-markers-description-chapters"]`,
      )
    ) {
      conditions.push({ key: "description-chapters", value: false });
    }

    if (
      isShowsChaptersInSidebar &&
      document.querySelector(
        `[visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"][target-id="engagement-panel-macro-markers-auto-chapters"],
         [visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"][target-id="engagement-panel-macro-markers-description-chapters"]`,
      )
    ) {
      conditions.push({ key: "description-chapters", value: false });
    }

    if (
      document.querySelector(
        'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]',
      )
    ) {
      conditions.push({ key: "description-chapters", value: false });
    }

    return conditions.every((condition) => condition.value === true);
  } else {
    conditions.map((condition) => condition.value === false);
    return false;
  }
}

function applyCenteringStyles(shouldCenter) {
  browser.storage.local.get(
    [
      getConst.remoteOptionsData,
      getConst.optionsState,
      getConst.runtimeSnapshot,
    ],
    function (obj) {
      const { css, flags } = obj[getConst.runtimeSnapshot] ?? {
        flags: {},
        css: "",
      };

      const { desktop: settingsStylesArrayDesktop } = obj[
        getConst.remoteOptionsData
      ] ?? {
        desktop: [],
      };

      const centeredOptionValue =
        flags["untrap_video_page_center_content"] ?? false;
      const isHideRelatedVideos =
        flags["untrap_video_page_hide_related_videos"] ?? false;

      const centeredOption = settingsStylesArrayDesktop.find(
        (item) => item.settings_id === "untrap_video_page_center_content",
      );

      const centeredOptionStyles = centeredOption?.styles ?? [];

      const isNeedCenterCondition =
        shouldCenter && centeredOptionValue && isHideRelatedVideos;

      if (isNeedCenterCondition) {
        const cssNormalizingArray = processStyles(centeredOptionStyles);

        const newCss = `${css}\n${cssNormalizingArray}`;

        applyStyles(newCss);
      } else {
        applyStyles(css);
      }
    },
  );
}

function validateCenterPageOption(attribute) {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

    const isHideRelatedVideos =
      flags["untrap_video_page_hide_related_videos"] ?? false;

    if (!isHideRelatedVideos) {
      applyCenteringStyles(false);
    } else {
      const conditionsMet = checkCenteringConditions(flags);

      const shouldCenter = attribute && conditionsMet;

      applyCenteringStyles(shouldCenter);
    }
  });
}
