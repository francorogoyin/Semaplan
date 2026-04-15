// MARK: - Main Screen

// Set General Options Values

function setGeneralOptionsValueFromStorage() {
  browser.storage.local.get(getConst.optionsState, function (obj) {
    const optionState = obj[getConst.optionsState] ?? {};

    const hideAllShortsValue = optionState[getConst.hideAllShorts] ?? false;
    const hideAllAdsValue = optionState[getConst.hideAllAds] ?? false;
    const youtubeVideoQuality = optionState[getConst.videoQuality] ?? "auto";
    const showNativeVideoPlayer =
      optionState[getConst.showNativePlayer] ?? false;
    const disableVideoAutoPlay = optionState[getConst.disableAutoplay] ?? false;
    const skipVideoAds = optionState[getConst.skipVideoAds] ?? false;
    const summarizeButton =
      optionState[getConst.addSummarizeButtonState] ?? false;

    queryById(getConst.hideAllShorts).checked = hideAllShortsValue;
    queryById(getConst.hideAllAds).checked = hideAllAdsValue;
    queryById(getConst.videoQuality).value = youtubeVideoQuality;
    queryById(getConst.showNativePlayer).checked = showNativeVideoPlayer;
    queryById(getConst.disableAutoplay).checked = disableVideoAutoPlay;
    queryById(getConst.skipVideoAds).checked = skipVideoAds;
    queryById(getConst.addSummarizeButtonState).checked = summarizeButton;
  });
}

setGeneralOptionsValueFromStorage();

// MARK: - Account Manage Screen

// Set email and password

function setEmailPasswordFromStorage() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const username = notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

    queryById("accountManageEmail").value = username;
  });
}

setEmailPasswordFromStorage();

// MARK: - More Screen

// Set extension theme

function setExtensionTheme() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const data =
      notSyncingState[getConstNotSyncing.extensionThemeData] ?? "auto";

    queryById("extensionThemeSelect").value = data;
    document.documentElement.setAttribute("theme", data);
  });
}

setExtensionTheme();

// Set iCloud Syncing

function setIcloudSyncing() {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const sharedState = systemState[getConst.sharedState] ?? {};
      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

      const data =
        notSyncingState[getConstNotSyncing.isCloudSyncingData] ?? "off";

      if (uuid) {
        queryById("iCloudSyncingSelect").value = data;
      } else {
        queryById("iCloudSyncingSelect").value = "off";
      }
    },
  );
}

setIcloudSyncing();

// Set My Other Apps Block showing

function setMyOtherAppsShowing() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const sharedState = systemState[getConst.sharedState] ?? {};

    const data = sharedState[getConst.myOtherAppsData] ?? "showing";

    document.documentElement.setAttribute("myOtherApps", data);

    queryById("moreScreen").setAttribute(
      "isShowMyApp",
      data === "hide" ? false : true,
    );
  });
}

setMyOtherAppsShowing();

// Set Login State

function setLoginState() {
  browser.storage.local.get(
    [getConstNotSyncing.notSyncingState, getConst.system],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const userName =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

      if (uuid != "" && !isBrowserSafari()) {
        queryById("userLoginEmail").innerHTML = userName;
        document.documentElement.setAttribute("isLogin", "true");
        app_isLogin = "true";
      }
    },
  );
}

setLoginState();

// MARK: - Password Locking Screen

// Set buttons states

function setButtonStates() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const passwordLockingIsActive =
      extensionUiState[getConst.passwordLockingIsActiveData];
    const passwordLockingPassword =
      extensionUiState[getConst.passwordLockingPasswordData];
    const passwordLockingPrompt =
      extensionUiState[getConst.passwordLockingPromptData];

    if (passwordLockingIsActive == true) {
      queryById("passwordProtectionStatusInfo").setAttribute("active", "");

      queryById("protectPasswordTextField").value = passwordLockingPassword;
      queryById("protectPassword2TextField").value = passwordLockingPassword;
      queryById("passwordPromptTextField").value = passwordLockingPrompt;

      queryById("passwordLocking-bottomButtons").setAttribute("active", "");
    }
  });
}

setButtonStates();

// Reset
function password_generateDurationsList() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const selected =
      extensionUiState[getConst.passwordLockingResetPeriodData] ?? 9;

    const durationSelect = queryById("passwordResetPeriodSelect");

    // Clear old

    durationSelect.innerHTML = "";

    for (resetVariant of resetDurationVariants) {
      const option = document.createElement("option");
      option.value = resetVariant.id;
      option.innerHTML = resetVariant.label[app_language];

      if (resetVariant.id == selected) {
        option.selected = true;
      }

      durationSelect.appendChild(option);
    }
  });
}

// MARK: - Password Reset Screen

browser.storage.local.get(
  [getConst.system, getConstNotSyncing.notSyncingState],
  function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const languageFromStorage =
      notSyncingState[getConstNotSyncing.extensionLanguage] ?? "auto";

    const passwordLockingResetPeriod =
      extensionUiState[getConst.passwordLockingResetPeriodData] ?? 9;

    let currentExtensionLanguage;

    if (languageFromStorage == "auto") {
      const userLocale = getLangCodeByBrowser();

      if (langSelectHasValue(userLocale)) {
        currentExtensionLanguage = userLocale;
      } else {
        currentExtensionLanguage = "en";
      }
    } else {
      currentExtensionLanguage = languageFromStorage;
    }

    const foundObject = resetDurationVariants.find(
      (obj) => obj.id == passwordLockingResetPeriod,
    );

    if (foundObject) {
      queryById("resetPeriodDisplayLabel").innerHTML =
        foundObject.label[currentExtensionLanguage];

      // Get the current date
      const currentDate = new Date();

      // Amount of time to add in minutes
      const minutesToAdd = foundObject.amountInMin;

      // Calculate the new date by adding minutes
      const newDate = new Date(currentDate.getTime() + minutesToAdd * 60000);

      // Format the new date
      const formattedDate = newDate.toLocaleString();

      // Set Formatted Date
      queryById("resetDateDisplayLabel").innerHTML = formattedDate;
    }
  },
);

// MARK: - Password Unlocking Screen

// Show buttons if can

browser.storage.local.get(getConst.system, function (obj) {
  const systemState = obj[getConst.system] ?? {};
  const extensionUiState = systemState[getConst.extensionUiState] ?? {};

  const currentDate = new Date();

  const passwordLockingPrompt =
    extensionUiState[getConst.passwordLockingPromptData] ?? "";
  const passwordLockingResetPeriod =
    extensionUiState[getConst.passwordLockingResetPeriodData] ?? 9;
  const passwordLockingResetFinalDate =
    extensionUiState[getConst.passwordLockingResetFinalDateData] ?? currentDate;
  const passwordLockingResetIsActive =
    extensionUiState[getConst.passwordLockingResetIsActiveData] ?? false;

  if (passwordLockingPrompt != "") {
    queryById("passwordUnlockingShowPromptButton").style.display = "block";
  }

  if (passwordLockingResetPeriod != 0) {
    const normalPasswordLockingResetFinalDate = new Date(
      passwordLockingResetFinalDate,
    );

    if (passwordLockingResetIsActive) {
      if (currentDate < normalPasswordLockingResetFinalDate) {
        queryById("passwordUnlockingResetDateDisplaying").style.display =
          "block";
        queryById("passwordUnlockingResetDateDisplaying").innerHTML =
          "Password Reset Date: " +
          normalPasswordLockingResetFinalDate.toLocaleString();
      }
    } else {
      queryById("passwordUnlockingResetPasswordButton").style.display = "block";
    }
  }
});

// MARK: - Shortcuts Screen

// Set shortcut

function setShortcut() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const sharedState = systemState[getConst.sharedState] ?? {};

    const data = sharedState[getConst.shortcuts[0]] ?? null;

    if (data != null) {
      queryById("setHotkeyButton").innerHTML = data.join("+").toUpperCase();
      querySelector(".hotKeyWrapper").classList.add("setted");
    }
  });
}

// MARK: - YouTube Blocking Schedule Screen

// Generate Time Select Options

function generateTimeSelectOptions() {
  function getTimeRanges(interval, language = window.navigator.language) {
    const ranges = [];
    const date = new Date();
    const format = {
      hour: "numeric",
      minute: "numeric",
    };

    for (let minutes = 0; minutes < 24 * 60; minutes = minutes + interval) {
      date.setHours(0);
      date.setMinutes(minutes);
      ranges.push(date.toLocaleTimeString(language, format));
    }

    return ranges;
  }

  const timeRange = getTimeRanges(10, "ru");
  const timeRangeLength = timeRange.length;

  const appSelects = document.querySelectorAll(
    "#youtubeBlockingScheduleScreen .timeSelectField",
  );

  for (const select of appSelects) {
    for (var i = 0; i < timeRangeLength; i++) {
      const option = document.createElement("option");
      option.innerHTML = timeRange[i];
      option.value = timeRange[i];
      select.appendChild(option);
    }
  }
}

generateTimeSelectOptions();

// Generate Days

function generateDays() {
  const WEEKDAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  function translateWeekday(weekdayString) {
    const weekdayIndex = WEEKDAYS.indexOf(weekdayString.toLowerCase());
    if (weekdayIndex < 0) throw new Error(`Unknown weekday "${weekdayString}"`);

    const dummyDate = new Date(2001, 0, weekdayIndex);

    return dummyDate.toLocaleDateString(app_language, { weekday: "short" });
  }

  // Clear old

  queryById("scheduleDaysWrapper").innerHTML = "";

  // Set Days

  for (const day in WEEKDAYS) {
    const dayName = translateWeekday(WEEKDAYS[day]);
    const dayID = DAYS[day];

    const dayDiv = document.createElement("div");
    dayDiv.classList.add("scheduleDay", "active");
    dayDiv.setAttribute("day-id", dayID);
    dayDiv.innerHTML = dayName;
    queryById("scheduleDaysWrapper").appendChild(dayDiv);

    dayDiv.onclick = function () {
      if (this.classList.contains("active")) {
        this.classList.remove("active");
      } else {
        this.classList.add("active");
      }
    };
  }
}

// Set block the extension checkbox

function scheduledBlocking_getExtensionBlockStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingScheduleBlockExtensionData] ??
      false;

    const button = queryById("youtubeBlockingScheduleBlockExtensionCheckbox");

    if (button) {
      button.checked = data;
    }
  });
}

scheduledBlocking_getExtensionBlockStatus();

// Set second interval status

function getSecondIntervalStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingScheduleTimeIntervalsData] ?? [];

    if (data.length > 1) {
      queryById("additionalIntervalRow").style.display = "flex";
      queryById("addAdditionalInterval").style.display = "none";
    }
  });
}

getSecondIntervalStatus();

// Set intervals times

function getIntervalsTimes() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingScheduleTimeIntervalsData] ?? [];

    if (data.length > 0) {
      queryById("scheduleTimesFirstSelectFrom").value = data[0].from;
      queryById("scheduleTimesFirstSelectTo").value = data[0].to;

      if (data.length > 1) {
        queryById("scheduleTimesSecondSelectFrom").value = data[1].from;
        queryById("scheduleTimesSecondSelectTo").value = data[1].to;
      }
    }
  });
}

getIntervalsTimes();

// Set days

function getDays() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingScheduleDaysData] ?? [];
    if (data.length > 0) {
      const daysButtons = document.querySelectorAll(
        "#scheduleDaysWrapper .scheduleDay",
      );

      for (var i = 0; i < daysButtons.length; i++) {
        const dayButton = daysButtons[i];
        if (data.includes(dayButton.getAttribute("day-id"))) {
          dayButton.classList.add("active");
        } else {
          dayButton.classList.remove("active");
        }
      }
    }
  });
}

getDays();

// Set schedule buttons states

function getScheduleButtonsStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingScheduleIsActiveData] ?? false;

    if (data) {
      queryById("youtubeBlockingSchedule-bottomButtons").setAttribute(
        "active",
        "",
      );
    }
  });
}

getScheduleButtonsStatus();

// MARK: - YouTube Blocking Temporary Screen

// Set block the extension checkbox

function temporaryBlocking_getExtensionBlockStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingTemporaryBlockExtensionData] ??
      false;

    const button = queryById("youtubeBlockingTemporaryBlockExtensionCheckbox");

    if (button) {
      button.checked = data;
    }
  });
}

temporaryBlocking_getExtensionBlockStatus();

// Generate durations

function temporaryBlocking_generateDurationsList() {
  // Set block duration
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const selected =
      youtubePageState[getConst.youtubeBlockingTemporaryDurationData] ?? 300;

    const durationSelect = queryById("temporaryBlockingDuration");

    const countBy5Min = 288;
    var currentSeconds = 300; // 5 min

    for (var i = 0; i < countBy5Min; i++) {
      const option = document.createElement("option");
      option.value = currentSeconds;

      const minValue = currentSeconds / 60;

      const objectToDisplay = minValue;

      var displayString = minValue;

      if (currentSeconds == selected) {
        option.selected = true;
      }

      option.innerHTML = displayString;

      durationSelect.appendChild(option);
      currentSeconds += 300;
    }
  });
}

temporaryBlocking_generateDurationsList();

// Set schedule buttons states

function getTemporaryButtonsStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.youtubeBlockingTemporaryIsActiveData] ?? false;

    if (data) {
      queryById("youtubeBlockingTemporary-bottomButtons").setAttribute(
        "active",
        "",
      );
    }
  });
}

getTemporaryButtonsStatus();

// MARK: - Opening Timer Screen

// Generate
function generateDurationsList() {
  browser.storage.local.get([getConst.system], function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const openingTimerIsActive =
      extensionUiState[getConst.openingTimerIsActiveData];

    const selected = extensionUiState[getConst.openingTimerValueData] ?? 1;

    const durationSelect = queryById("openingTimerDurationSelect");

    const max = 601;

    for (var i = 1; i < max; i++) {
      const option = document.createElement("option");
      option.value = i;

      var displayString = "";

      displayString += i;

      if (i == selected) {
        option.selected = true;

        if (openingTimerIsActive == true) {
          queryById("launchDelayState").setAttribute("active", "");
        }
      }

      option.innerHTML = displayString;

      durationSelect.appendChild(option);
    }

    if (openingTimerIsActive == true) {
      queryById("openingTimer-bottomButtons").setAttribute("active", "");
    }
  });
}

generateDurationsList();

// Set Message

function getMessage() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const message = extensionUiState[getConst.openingTimerMessageData] ?? "";

    if (message != "") {
      queryById("openingTimerMessage").value = message;
    }
  });
}

getMessage();

// MARK: - Browser Specific Things

function setBrowserBasedLinks() {
  // Rate Link

  const rateLink = document.querySelector(".dynamic-rate-link");

  if (rateLink) {
    if (app_browser == "safari") {
      rateLink.setAttribute(
        "href",
        "https://apps.apple.com/app/untrap-for-youtube/id1637438059?action=write-review",
      );
    } else if (app_browser == "firefox") {
      rateLink.setAttribute(
        "href",
        "https://addons.mozilla.org/firefox/addon/untrap-for-youtube/",
      );
    } else if (app_browser == "edge") {
      rateLink.setAttribute(
        "href",
        "https://microsoftedge.microsoft.com/addons/detail/untrap-for-youtube/ngnefladcohhmmibccafkdbcijjoppdo",
      );
    } else {
      rateLink.setAttribute(
        "href",
        "https://chromewebstore.google.com/detail/enboaomnljigfhfjfoalacienlhjlfil",
      );
    }
  }

  // SocialFocus Link

  const socialFocusLink = document.querySelector(".dynamic-socialfocus-link");

  if (socialFocusLink) {
    if (app_browser == "safari") {
      socialFocusLink.setAttribute(
        "href",
        "https://apps.apple.com/us/app/socialfocus-hide-distractions/id1661093205",
      );
    } else if (app_browser == "firefox") {
      socialFocusLink.setAttribute(
        "href",
        "https://addons.mozilla.org/en-US/firefox/addon/socialfocus/",
      );
    } else if (app_browser == "edge") {
      socialFocusLink.setAttribute(
        "href",
        "https://microsoftedge.microsoft.com/addons/detail/socialfocus-hide-distrac/dkkbdagpdnmdakbbchbicnfcoifbdlfc",
      );
    } else {
      socialFocusLink.setAttribute(
        "href",
        "https://chromewebstore.google.com/detail/socialfocus-hide-distract/abocjojdmemdpiffeadpdnicnlhcndcg",
      );
    }
  }
}

// MARK: - More Screen

// Set Scheduled Info

function setYoutubeScheduledBlockingStatusInfo() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const scheduleIsActive =
      youtubePageState[getConst.youtubeBlockingScheduleIsActiveData];

    if (scheduleIsActive) {
      queryById("youtubeScheduleBlockingStatusInfo").setAttribute("active", "");
    } else {
      queryById("youtubeScheduleBlockingStatusInfo").removeAttribute(
        "active",
        "",
      );
    }
  });
}

setYoutubeScheduledBlockingStatusInfo();

// Set Temporary Info

function setYoutubeTemporaryBlockingStatusInfo() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const temporaryIsActive =
      youtubePageState[getConst.youtubeBlockingTemporaryIsActiveData] ?? false;

    if (temporaryIsActive) {
      queryById("youtubeFocusBlockingStatusInfo").setAttribute("active", "");
    } else {
      queryById("youtubeFocusBlockingStatusInfo").removeAttribute("active", "");
    }
  });
}

setYoutubeTemporaryBlockingStatusInfo();

// MARK: - Content Filter Screen

// Set channels & videos filter status

function getFiltersStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data = youtubePageState[getConst.filterIsEnabledData] ?? false;

    if (data) {
      queryById("channelsVideosFilterCounter").setAttribute("active", "");
    } else {
      queryById("channelsVideosFilterCounter").removeAttribute("active", "");
    }
  });
}

getFiltersStatus();

// Set add filter buttons to context menu

function getContentFilterBlockStatus() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data =
      youtubePageState[getConst.blocklistContextMenuButtonsData] ?? false;

    const button = queryById("blocklistFilterContextButtons");

    button.checked = data;
  });
}

getContentFilterBlockStatus();

// Set enable filtration checkbox

function getIsFiltrationEnabled() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const data = youtubePageState[getConst.filterIsEnabledData] ?? false;

    const button = queryById("blocklistFilterEnableFilter");

    button.checked = data;
  });
}

getIsFiltrationEnabled();

// Set placeholder

function contentFilter_setPlaceholderOnLaunch() {
  const firstTab = document.querySelector(".firstContenFilterTab");

  if (firstTab) {
    document
      .getElementById("contentFilterField")
      .setAttribute("placeholder", firstTab.getAttribute("data-input"));
  }
}

// Clear all errors when click on submit or back button

function clearAllErrors() {
  const backButtons = document.querySelectorAll(".backButton");
  const submitButtons = document.querySelectorAll(".submitButton");
  const routerButtons = document.querySelectorAll(".routerButton");
  const outlinedButtons = document.querySelectorAll(".outlinedButton");
  const errorsElements = document.querySelectorAll(".subScreenError");

  backButtons.forEach((backButton) => {
    backButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });

  submitButtons.forEach((submitButton) => {
    submitButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });

  routerButtons.forEach((routerButton) => {
    routerButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });

  outlinedButtons.forEach((outlinedButton) => {
    outlinedButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });
}

clearAllErrors();

// function generateStars() {
//   const ratingContainer = document.querySelector(".rate-app-rating");

//   if (!ratingContainer) return;

//   const starSVG = `
//     <svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" viewBox="0 0 24 24" class="rate-app-star">
//       <path d="M12 17.3l6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
//     </svg>
//   `;

//   ratingContainer.innerHTML = starSVG.repeat(5);
// }
// generateStars();

// const rateAppLink = document.querySelector(".dynamic-rate-link");

// const rateAppModalOverlay = document.querySelector(".rate-app-modal-overlay");

// const linksPickerPopup = document.querySelector(".linksPickerPopup");

// const stars = document.querySelectorAll(".rate-app-star");

// const notNowBlock = document.querySelector(".rate-app-modal-not-now");

// const modalActionBlock = document.querySelector(".rate-app-modal-actions");

// const rateWithStarBlock = document.querySelector(".rate-app-with-star");

// const rateReviewPromtBlock = document.querySelector(".rate-app-review-prompt");

// const rateAppWithStarCancel = document.querySelectorAll(
//   ".rate-app-with-star-cancel"
// );

// const rateAppWithStarSubmit = document.querySelector(
//   ".rate-app-with-star-submit"
// );

// const withStartHeaderSection = document.querySelector(
//   ".rate-app-modal-with-star-header-section"
// );

// const feedBackHeaderSection = document.querySelector(
//   ".rate-app-modal-feedback-header-section"
// );

// const writeReviewButton = document.querySelector(".write-review-button");

// function cancelRateAppHandler() {
//   notNowBlock.setAttribute("active", "");
//   withStartHeaderSection.setAttribute("active", "");
//   modalActionBlock.removeAttribute("active");
//   rateReviewPromtBlock.removeAttribute("active");
//   feedBackHeaderSection.removeAttribute("active");
//   stars.forEach((star) => {
//     if (star.classList.contains("filled")) {
//       star.classList.remove("filled");
//     }
//   });
// }

// function showRateAppHandler() {
//   rateAppModalOverlay.setAttribute("active", "");

//   if (!rateWithStarBlock.hasAttribute("active")) {
//     rateWithStarBlock.setAttribute("active", "");
//   }

//   if (!withStartHeaderSection.hasAttribute("active")) {
//     withStartHeaderSection.setAttribute("active", "");
//   }

//   linksPickerPopup.removeAttribute("active");
// }

// stars.forEach((star, index) => {
//   star.addEventListener("click", () => {
//     if (rateWithStarBlock.hasAttribute("active")) {
//       rating = index + 1;

//       stars.forEach((s, i) => {
//         s.classList.toggle("filled", i < rating);
//       });

//       if (rating > 0) {
//         notNowBlock.removeAttribute("active");
//         modalActionBlock.setAttribute("active", "");
//       }

//       setToStorage(getConst.rating, rating, function () {});
//     }
//   });
// });

// rateAppLink.addEventListener("click", function (event) {
//   event.preventDefault();
//   event.stopPropagation();

//   showRateAppHandler();
// });

// rateAppModalOverlay.addEventListener("click", function (event) {
//   event.stopPropagation();

//   if (event.target === this) {
//     this.removeAttribute("active");
//     cancelRateAppHandler();
//   }
// });

// rateAppWithStarCancel.forEach((item) => {
//   item.onclick = function () {
//     rateAppModalOverlay.removeAttribute("active");
//     cancelRateAppHandler();
//   };
// });

// rateAppWithStarSubmit.onclick = function (event) {
//   event.preventDefault();
//   rateWithStarBlock.removeAttribute("active");
//   withStartHeaderSection.removeAttribute("active");

//   rateReviewPromtBlock.setAttribute("active", "");
//   feedBackHeaderSection.setAttribute("active", "");
// };

// writeReviewButton.onclick = function () {
//   let reviewUrl;

//   if (app_browser == "safari") {
//     reviewUrl =
//       "https://apps.apple.com/app/untrap-for-youtube/id1637438059?action=write-review";
//   } else if (app_browser == "firefox") {
//     reviewUrl =
//       "https://addons.mozilla.org/en-US/firefox/addon/untrap-for-youtube/";
//   } else if (app_browser == "edge") {
//     reviewUrl =
//       "https://microsoftedge.microsoft.com/addons/detail/untrap-for-youtube/ngnefladcohhmmibccafkdbcijjoppdo";
//   } else {
//     reviewUrl =
//       "https://chromewebstore.google.com/detail/untrap-for-youtube/enboaomnljigfhfjfoalacienlhjlfil/reviews";
//   }

//   window.open(reviewUrl, "_blank");
//   setToStorage(getConst.isWriteReview, true);
// };

// function showRateModalAfterSevenUniqueDays() {
//   browser.storage.local.get(
//     [getConst.isWriteReview, getConst.visited_days],
//     function (obj) {
//       const isWriteReview = obj[getConst.isWriteReview] ?? false;
//       const visitedDays = obj[getConst.visited_days] ?? [];
//       const today = new Date().toISOString().split("T")[0];

//       if (isWriteReview) {
//         return;
//       } else {
//         const visitedDaysSet = new Set(visitedDays);

//         const initialSize = visitedDaysSet.size;
//         visitedDaysSet.add(today);

//         if (visitedDaysSet.size > initialSize) {
//           const updatedVisitedDays = Array.from(visitedDaysSet);

//           setToStorage(getConst.visited_days, updatedVisitedDays);
//         }

//         if (visitedDaysSet.size >= 7) {
//           showRateAppHandler();

//           setToStorage(getConst.visited_days, []);
//         }
//       }
//     }
//   );
// }

// showRateModalAfterSevenUniqueDays();
