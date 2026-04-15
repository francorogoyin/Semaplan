var ACTUAL_CATEGORIES = [];

// MARK: - Specify Browser

var browser = browser || chrome;

// MARK: - Special variable

const channelPageUrlPart1 = "youtube.com/@";
const channelPageUrlPart2 = "youtube.com/channel";

// MARK: - System Design Methods

function setToStorage(name, value, callback) {
  browser.storage.local.set({ [name]: value }, function (obj) {
    if (typeof callback === "function") {
      callback();
    }

    updateSettingsStringInCloud();
  });
}

function setToStorageWithoutSync(name, value, callback) {
  browser.storage.local.set({ [name]: value }, callback);
}

function setSystemConfigStorage({ systemState, newState, callback }) {
  setToStorage(
    getConst.system,
    {
      ...systemState,
      ...newState,
    },
    typeof callback === "function" ? callback : function () {},
  );
}

function setWithoutSyncSystemConfigStorage({
  systemState,
  newState,
  callback,
}) {
  setToStorageWithoutSync(
    getConst.system,
    {
      ...systemState,
      ...newState,
    },
    typeof callback === "function" ? callback : function () {},
  );
}

function getChangedValues(changes, storageKey, ...path) {
  const change = changes[storageKey];
  if (!change) return null;

  const newValue = change.newValue ?? {};
  const oldValue = change.oldValue ?? {};

  const getNestedValue = (obj, pathArray) => {
    return pathArray.reduce((current, key) => current?.[key], obj);
  };

  return {
    newValue: getNestedValue(newValue, path),
    oldValue: getNestedValue(oldValue, path),
  };
}

function queryById(name) {
  return document.getElementById(name);
}

function querySelector(selector) {
  return document.querySelector(selector);
}

function querySelectorAll(selector) {
  return document.querySelectorAll(selector);
}

function isUserAgentMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function getSecondsFromMinutes(seconds) {
  const SECONDS_IN_MINUTE = 60;

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

const flagsIdArray = [
  "socialFocus_facebook_feed_hide_posts_from_people_to_follow",
  "socialFocus_youtube_daily_limit_show_timer_draggable",
  "socialFocus_facebook_daily_limit_show_timer_draggable",
  "socialFocus_instagram_daily_limit_show_timer_draggable",
  "socialFocus_linkedin_daily_limit_show_timer_draggable",
  "socialFocus_reddit_daily_limit_show_timer_draggable",
  "socialFocus_twitter_daily_limit_show_timer_draggable",
  "socialFocus_gmail_daily_limit_show_timer_draggable",
  "socialFocus_hacker-news_daily_limit_show_timer_draggable",
  "socialFocus_twitch_daily_limit_show_timer_draggable",
  "socialFocus_pinterest_daily_limit_show_timer_draggable",
  "socialFocus_netflix_daily_limit_show_timer_draggable",
  "socialFocus_tikTok_daily_limit_show_timer_draggable",
  "socialFocus_blueSky_daily_limit_show_timer_draggable",
  "socialFocus_youtube_daily_limit_show_timer",
  "socialFocus_facebook_daily_limit_show_timer",
  "socialFocus_instagram_daily_limit_show_timer",
  "socialFocus_linkedin_daily_limit_show_timer",
  "socialFocus_reddit_daily_limit_show_timer",
  "socialFocus_twitter_daily_limit_show_timer",
  "socialFocus_gmail_daily_limit_show_timer",
  "socialFocus_hacker-news_daily_limit_show_timer",
  "socialFocus_twitch_daily_limit_show_timer",
  "socialFocus_pinterest_daily_limit_show_timer",
  "socialFocus_netflix_daily_limit_show_timer",
  "socialFocus_tikTok_daily_limit_show_timer",
  "socialFocus_blueSky_daily_limit_show_timer",
  "socialFocus_reddit_header_hide_trending_today",
  "socialFocus_youtube_master_toggle",
  "socialFocus_facebook_master_toggle",
  "socialFocus_instagram_master_toggle",
  "socialFocus_linkedin_master_toggle",
  "socialFocus_reddit_master_toggle",
  "socialFocus_twitter_master_toggle",
  "socialFocus_gmail_master_toggle",
  "socialFocus_hacker-news_master_toggle",
  "socialFocus_twitch_master_toggle",
  "socialFocus_pinterest_master_toggle",
  "socialFocus_netflix_master_toggle",
  "socialFocus_tikTok_master_toggle",
  "socialFocus_blueSky_master_toggle",
  "socialFocus_instagram_feed_hide_suggested_posts",
  "socialFocus_twitch_hide_following",
  "socialFocus_twitch_hide_subscribe_button",
  "socialFocus_youtube_hide_shorts",
  "socialFocus_hacker-news_navigation_hide_new",
  "socialFocus_hacker-news_navigation_hide_submit",
  "socialFocus_hacker-news_navigation_hide_past",
  "socialFocus_hacker-news_navigation_hide_comments",
  "socialFocus_hacker-news_navigation_hide_ask",
  "socialFocus_hacker-news_navigation_hide_show",
  "socialFocus_hacker-news_navigation_hide_jobs",
  "socialFocus_hacker-news_post_hide_hide_button",
  "socialFocus_hacker-news_block_hacker-news",
  "socialFocus_hacker-news_gray_mode",
  "socialFocus_hacker-news_post_hide_domain",
  "socialFocus_hacker-news_post_hide_vote_button",
  "socialFocus_hacker-news_post_hide_hide_button",
  "socialFocus_hacker-news_post_hide_points_count",
  "socialFocus_hacker-news_post_hide_time",
  "socialFocus_hacker-news_post_hide_comments_button",
  "socialFocus_hacker-news_comments_hide_comments",
  "socialFocus_hacker-news_comments_hide_reply_buttons",
  "socialFocus_daily_limit",
  "socialFocus_youtube_hide_thumbnails",
  "socialFocus_linkedin_other_hide_messaging_popup",
  "socialFocus_reddit_post_hide_comments",
  "socialFocus_reddit_post_hide_up_down_vote_buttons",
  "socialFocus_reddit_post_hide_votes_count",
  "socialFocus_reddit_post_hide_shares_button",
  "socialFocus_reddit_post_hide_award_button",
  "socialFocus_reddit_master_toggle",
];

const storageEntityKeysList = [
  "socialFocus_runtime_snapshot",
  "socialFocus_remote_options_data",
  "socialFocus_options_state",
  "socialFocus_shared_state",
  "socialFocus_system_config",
  "socialFocus_meta",
  "socialFocus_extension_ui_state",
  "socialFocus_daily_limit_data",
  "socialFocus_not_syncing_state",
];

const sharedStateSettingsList = [
  "socialFocus_userUniqueIdentifier",
  "socialFocus_gradient_index",
  "socialFocus_gradient_current_date",
  "socialFocus_myOtherAppsData",
  "socialFocus_shortcuts_disable_enable",
];

const metaStateSettingsList = [
  "socialFocus_next_date_to_update",
  "socialFocus_current_version_on_settings_release",
];

const scheduleDateSettingsList = [
  "socialFocus_schedule_update_hour",
  "socialFocus_schedule_update_week_day",
];

const initDateSettingsList = [
  "socialFocus_extension_init_date",
  "socialFocus_extension_init_time",
];

const extensionStateSettingsList = [
  "socialFocus_openingTimerIsActiveData",
  "socialFocus_openingTimerValueData",
  "socialFocus_openingTimerMessageData",
  "socialFocus_passwordLockingIsActiveData",
  "socialFocus_passwordLockingPasswordData",
  "socialFocus_passwordLockingPromptData",
  "socialFocus_passwordLockingResetIsActiveData",
  "socialFocus_passwordLockingResetPeriodData",
  "socialFocus_passwordLockingResetFinalDateData",
];

const dailyLimitKeys = [
  "socialFocus_youtube_dailyLimitDuration",
  "socialFocus_facebook_dailyLimitDuration",
  "socialFocus_instagram_dailyLimitDuration",
  "socialFocus_linkedin_dailyLimitDuration",
  "socialFocus_reddit_dailyLimitDuration",
  "socialFocus_twitter_dailyLimitDuration",
  "socialFocus_gmail_dailyLimitDuration",
  "socialFocus_hacker-news_dailyLimitDuration",
  "socialFocus_twitch_dailyLimitDuration",
  "socialFocus_pinterest_dailyLimitDuration",
  "socialFocus_netflix_dailyLimitDuration",
  "socialFocus_tikTok_dailyLimitDuration",
  "socialFocus_blueSky_dailyLimitDuration",
  "socialFocus_youtube_dailyLimitLastedTime",
  "socialFocus_facebook_dailyLimitLastedTime",
  "socialFocus_instagram_dailyLimitLastedTime",
  "socialFocus_linkedin_dailyLimitLastedTime",
  "socialFocus_reddit_dailyLimitLastedTime",
  "socialFocus_twitter_dailyLimitLastedTime",
  "socialFocus_gmail_dailyLimitLastedTime",
  "socialFocus_hacker-news_dailyLimitLastedTime",
  "socialFocus_twitch_dailyLimitLastedTime",
  "socialFocus_pinterest_dailyLimitLastedTime",
  "socialFocus_netflix_dailyLimitLastedTime",
  "socialFocus_tikTok_dailyLimitLastedTime",
  "socialFocus_blueSky_dailyLimitLastedTime",
  "socialFocus_youtube_dailyCurrentDate",
  "socialFocus_facebook_dailyCurrentDate",
  "socialFocus_instagram_dailyCurrentDate",
  "socialFocus_linkedin_dailyCurrentDate",
  "socialFocus_reddit_dailyCurrentDate",
  "socialFocus_twitter_dailyCurrentDate",
  "socialFocus_gmail_dailyCurrentDate",
  "socialFocus_hacker-news_dailyCurrentDate",
  "socialFocus_twitch_dailyCurrentDate",
  "socialFocus_pinterest_dailyCurrentDate",
  "socialFocus_netflix_dailyCurrentDate",
  "socialFocus_tikTok_dailyCurrentDate",
  "socialFocus_blueSky_dailyCurrentDate",
  "socialFocus_youtube_dailyLimitModalCoordinate_top",
  "socialFocus_youtube_dailyLimitModalCoordinate_left",
  "socialFocus_facebook_dailyLimitModalCoordinate_top",
  "socialFocus_facebook_dailyLimitModalCoordinate_left",
  "socialFocus_instagram_dailyLimitModalCoordinate_top",
  "socialFocus_instagram_dailyLimitModalCoordinate_left",
  "socialFocus_linkedin_dailyLimitModalCoordinate_top",
  "socialFocus_linkedin_dailyLimitModalCoordinate_left",
  "socialFocus_reddit_dailyLimitModalCoordinate_top",
  "socialFocus_reddit_dailyLimitModalCoordinate_left",
  "socialFocus_twitter_dailyLimitModalCoordinate_top",
  "socialFocus_twitter_dailyLimitModalCoordinate_left",
  "socialFocus_gmail_dailyLimitModalCoordinate_top",
  "socialFocus_gmail_dailyLimitModalCoordinate_left",
  "socialFocus_hacker-news_dailyLimitModalCoordinate_top",
  "socialFocus_hacker-news_dailyLimitModalCoordinate_left",
  "socialFocus_twitch_dailyLimitModalCoordinate_top",
  "socialFocus_twitch_dailyLimitModalCoordinate_left",
  "socialFocus_pinterest_dailyLimitModalCoordinate_top",
  "socialFocus_pinterest_dailyLimitModalCoordinate_left",
  "socialFocus_netflix_dailyLimitModalCoordinate_top",
  "socialFocus_netflix_dailyLimitModalCoordinate_left",
  "socialFocus_tikTok_dailyLimitModalCoordinate_top",
  "socialFocus_tikTok_dailyLimitModalCoordinate_left",
  "socialFocus_blueSky_dailyLimitModalCoordinate_top",
  "socialFocus_blueSky_dailyLimitModalCoordinate_left",
];
