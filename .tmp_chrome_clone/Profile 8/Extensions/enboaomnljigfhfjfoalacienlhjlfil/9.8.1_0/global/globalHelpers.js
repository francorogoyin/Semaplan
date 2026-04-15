// MARK: - Specify Browser

var browser = browser || chrome;

// MARK: - System Design Methods

function queryById(name) {
  return document.getElementById(name);
}

function querySelector(selector) {
  return document.querySelector(selector);
}

function querySelectorAll(selector) {
  return document.querySelectorAll(selector);
}

// MARK: - Popup helpers

function addZeroPrefix(number) {
  return ("0" + number).slice(-2);
}

function addSeconds(date, seconds) {
  date.setTime(date.getTime() + seconds * 1000);

  return date;
}

// Extract content links

function extractChannelId(url) {
  if (url.includes("@")) {
    // Case 1 @username
    const match = url.match(/@([^/?]+)/);
    return match ? match[1] : null;
  } else if (url.includes("/channel/")) {
    // Case 2 channel/UC6rwiIxv0w2fbmmr66wl1rA
    const match = url.match(/channel\/([^/?]+)/);
    return match ? match[1] : null;
  } else {
    // Not a valid YouTube channel link
    return null;
  }
}

function extractVideoId(url) {
  if (url.includes("/watch?v=")) {
    // Case 1 watch?v=-CoIUNSsl04
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  } else if (url.includes("/shorts/")) {
    // Case 2 shorts/dol2GgVE5Vs
    const match = url.match(/shorts\/([^/?]+)/);
    return match ? match[1] : null;
  } else {
    // Not a valid YouTube video link
    return null;
  }
}

function extractCommentID(link) {
  const match = link.match(/[?&]lc=([^&]+)/);
  return match ? match[1] : null;
}

function extractPostID(link) {
  const match = link.match(/\/post\/([^\/]+)/);
  return match ? match[1] : null;
}

function getSecondsFromMinutes(seconds) {
  const SECONDS_IN_MINUTE = 1;

  return Number(seconds * SECONDS_IN_MINUTE);
}

function inputBlocksClear() {
  const inputs = document.querySelectorAll(".verification-input");

  inputs.forEach((input) => {
    input.value = "";
  });
}

function inputsBlocksHandler(verifyEmailButton, verificationCode) {
  const inputs = document.querySelectorAll(".verification-input");

  function updateVerificationCode() {
    verificationCode.value = Array.from(inputs)
      .map((input) => input.value)
      .join("");

    if (verifyEmailButton) {
      if (verificationCode.value.length == 6) {
        verifyEmailButton.removeAttribute("disabled");
      } else {
        verifyEmailButton.setAttribute("disabled", "");
      }
    }
  }

  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value;

      // Allow only single digit
      if (value.length > 1) {
        e.target.value = value.slice(0, 1);
      }

      // Move to next input if current is filled, or blur if last input
      if (value.length === 1) {
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          input.blur(); // Remove focus from last input
        }
      }

      // Validate input
      if (value && !/^[0-9]$/.test(value)) {
        e.target.value = "";
      }

      updateVerificationCode();
    });

    input.addEventListener("keydown", (e) => {
      // Move to previous input on backspace if empty
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }

      // If the input has a value and a digit key is pressed, clear the input first
      if (input.value && /^[0-9]$/.test(e.key)) {
        input.value = ""; // Clear the existing value before new input
      }

      if (e.key === "Backspace") {
        setTimeout(updateVerificationCode, 0);
      }
    });

    // Handle paste event
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
      if (pastedData.length) {
        for (let i = 0; i < inputs.length && i < pastedData.length; i++) {
          inputs[i].value = pastedData[i];
          if (i < inputs.length - 1 && i < pastedData.length - 1) {
            inputs[i + 1].focus();
          } else {
            inputs[i].blur();
          }
        }
      }

      updateVerificationCode();
    });
  });
}

function isSafari() {
  const ua = navigator.userAgent;
  const isSafariBrowser = ua.includes("Safari") && !ua.includes("Chrome");

  // Дополнительная проверка для WebKit
  const isWebKit = ua.includes("AppleWebKit");

  return isSafariBrowser && isWebKit;
}

// MARK: - Page Constants

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const homePageUrlPartDesktop = "https://www.youtube.com/";
const homePageUrlPartMobile = "https://m.youtube.com/";

const searchPageUrlPart = "youtube.com/results";
const videoPageUrlPart = "youtube.com/watch";
const subscriptionsPageUrlPart = "youtube.com/feed/subscriptions";

const channelPageUrlPart1 = "youtube.com/@";
const channelPageUrlPart2 = "youtube.com/channel";

const shortsPageUrlPart = "youtube.com/shorts/";

const youPageUrlPart1 = "youtube.com/feed/you";
const youPageUrlPart2 = "youtube.com/feed/library";

const defaultValuesArray = [
  {
    id: "untrap_search_hide_ads_promoted_websites",
    styles: [
      "#container.ytd-search ytd-promoted-sparkles-web-renderer",
      "#container.ytd-search ytd-promoted-sparkles-text-search-renderer",
      "#container.ytd-search ytd-ad-slot-renderer:not(:has(ytd-carousel-ad-renderer))",
    ],
  },
  {
    id: "untrap_search_hide_ads_promoted_videos",
    styles: ["#container.ytd-search ytd-search-pyv-renderer"],
  },
  {
    id: "untrap_search_hide_ads_suggested_products",
    styles: ["#container.ytd-search ytd-carousel-ad-renderer"],
  },
  {
    id: "untrap_home_hide_ads_first_slot",
    styles: [
      `ytd-browse[page-subtype="home"] ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer:has(ytd-ad-slot-renderer)`,
    ],
  },
  {
    id: "untrap_video_page_hide_suggestions_ads",
    styles: [`#related #player-ads`, `#related ytd-in-feed-ad-layout-renderer`],
  },
  {
    id: "untrap_video_page_center_content",
    styles: [],
  },
];

const flagsIdArray = [
  "untrap_sidebar_auto_expand_playlists",
  "untrap_sidebar_auto_expand_subscriptions",
  "untrap_sidebar_auto_collapse_sidebar",
  "untrap_video_page_disable_autoplay",
  "untrap_video_page_auto_theater_mode",
  "untrap_video_page_auto_expand_description",
  "untrap_video_card_replace_thumbnail",
  "untrap_video_card_blur_thumbnail",
  "untrap_video_card_grayscale_thumbnail",
  "untrap_video_card_opacity_thumbnail",
  "untrap_search_page_sort_by",
  "untrap_redirect_channel_to",
  "untrap_channel_hide_channel_menu_button_home",
  "untrap_channel_hide_channel_menu_button_videos",
  "untrap_channel_hide_channel_menu_button_shorts",
  "untrap_channel_hide_channel_menu_button_live",
  "untrap_channel_hide_channel_menu_button_releases",
  "untrap_channel_hide_channel_menu_button_podcasts",
  "untrap_channel_hide_channel_menu_button_playlists",
  "untrap_channel_hide_channel_menu_button_community",
  "untrap_channel_hide_channel_menu_button_store",
  "untrap_channel_hide_channel_menu_button_channels",
  "untrap_redirect_shorts_to_exclude_player",
  "untrap_appearance_font",
  "untrap_appearance_color",
  "untrap_appearance_primary_bg_color",
  "untrap_video_page_auto_shows_chapters_in_sidebar",
  "untrap_video_page_center_content",
  "untrap_video_page_hide_related_videos",
  "untrap_shorts_page_disable_exclude_scrolling",
  "untrap_global_video_quality",
  "untrap_global_skip_video_ads",
  "untrap_redirect_home_to",
  "untrap_global_disable_video_autoplay",
  "untrap_global_show_native_video_player",
  "untrap_global_add_summarize_button",
];

const storageEntityKeysList = [
  "untrap_runtime_snapshot",
  "untrap_remote_options_data",
  "untrap_options_state",
  "untrap_shared_state",
  "untrap_system_config",
  "untrap_meta",
  "untrap_extension_ui_state",
  "untrap_youtube_page_state",
  "untrap_summarize_window_state",
  "untrap_not_syncing_state",
];

const globalOptionsList = [
  "untrap_global_hide_all_shorts",
  "untrap_global_hide_all_ads",
  "untrap_global_video_quality",
  "untrap_global_show_native_video_player",
  "untrap_global_disable_video_autoplay",
  "untrap_global_skip_video_ads",
  "untrap_global_add_summarize_button",
];

const sharedStateSettingsList = [
  "userUniqueIdentifier",
  "untrap_gradient_index",
  "untrap_gradient_current_date",
  "untrap_myOtherAppsData",
  "untrap_shortcuts_disable_enable",
];

const metaStateSettingsList = [
  "untrap_current_version_on_settings_release",
  "untrap_next_date_to_update",
];

const initDateSettingsList = [
  "untrap_extension_init_date",
  "untrap_extension_init_time",
];

const scheduleDateSettingsList = [
  "untrap_schedule_update_hour",
  "untrap_schedule_update_week_day",
];

const extensionStateSettingsList = [
  "untrap_openingTimerIsActiveData",
  "untrap_openingTimerValueData",
  "untrap_openingTimerMessageData",
  "untrap_passwordLockingIsActiveData02092023",
  "untrap_passwordLockingPasswordData02092023",
  "untrap_passwordLockingPromptData02092023",
  "untrap_passwordLockingResetIsActiveData02092023",
  "untrap_passwordLockingResetPeriodData02092023",
  "untrap_passwordLockingResetFinalDateData02092023",
];

const youtubePageStateSettingsList = [
  "untrap_filterIsEnabledData",
  "untrap_videosFilterRulesData3",
  "untrap_filterChannelsRulesData3",
  "untrap_filterCommentsRulesData3",
  "untrap_filterPostsRulesData3",
  "untrap_blocklistContextMenuButtonsData",
  "untrap_youtubeBlockingScheduleIsActiveData",
  "untrap_youtubeBlockingScheduleDaysData",
  "untrap_youtubeBlockingScheduleBlockExtensionData",
  "untrap_youtubeBlockingScheduleTimeIntervalsData",
  "untrap_youtubeBlockingTemporaryIsActiveData",
  "untrap_youtubeBlockingTemporaryDurationData",
  "untrap_youtubeBlockingTemporaryBlockExtensionData",
  "untrap_youtubeBlockingTemporaryStartDateData",
  "untrap_blocking_by_untrap",
  "untrap_channel_hide_channel_menu_button_home",
  "untrap_channel_hide_channel_menu_button_videos",
  "untrap_channel_hide_channel_menu_button_releases",
  "untrap_channel_hide_channel_menu_button_podcasts",
  "untrap_channel_hide_channel_menu_button_shorts",
  "untrap_channel_hide_channel_menu_button_live",
  "untrap_channel_hide_channel_menu_button_playlists",
  "untrap_channel_hide_channel_menu_button_community",
  "untrap_channel_hide_channel_menu_button_channels",
  "untrap_channel_hide_channel_menu_button_store",
  "untrap_video_card_blur_thumbnail",
  "untrap_video_card_grayscale_thumbnail",
  "untrap_video_card_opacity_thumbnail",
];

const summarizeStateSettingsList = [
  "untrap_isShowSummarizeWindow",
  "untrap_add_emojis",
  "untrap_generate_automatically",
  "untrap_picked_tab",
  "untrap_picked_bulletPoint",
  "untrap_grouped",
  "untrap_expand_collapse",
  "untrap_timestamps_link",
  "untrap_transcriptTranslateLanguage",
];
