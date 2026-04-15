(function () {
  generateSettingsController(ACTUAL_CATEGORIES, false).then(() => {
    checkUpdates().finally(() => {
      setStorageByDefault();
    });
  });

  browser.storage.onChanged.addListener(blockExtensionListener);

  if (!isBrowserSafari()) {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
        const isPro = notSyncingState[getConstNotSyncing.isUserPro] ?? false;

        if (isPro) {
          document.documentElement.setAttribute("isPRO", "true");
        } else {
          document.documentElement.setAttribute("isPRO", "false");
        }
      },
    );
  }

  browser.storage.onChanged.addListener(changeUserAccountListener);

  function changeUserAccountListener(changes) {
    const values = getChangedValues(
      changes,
      getConst.system,
      getConst.sharedState,
      "userUniqueIdentifier",
    );

    if (!values) return;

    const { newValue, oldValue } = values;
    if (!newValue || newValue === oldValue) return;

    browser.storage.local.get(getConstNotSyncing.notSyncingState, (obj) => {
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
      const userName =
        notSyncingState?.[getConstNotSyncing.pro_usernameData] ?? "";

      checkForSpecialUsers(userName);
      summarizeRequestCountDisplayHandler(newValue);
    });
  }

  // MARK: - Power Button

  queryById("showAllButton").onclick = function () {
    generateSettingsController(ACTUAL_CATEGORIES, false);
    showScreen("optionsScreen");
  };

  // Set State

  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const status =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    document.documentElement.setAttribute("disabled", status != true);
  });

  function blockExtensionListener(changes) {
    if (changes[getConstNotSyncing.notSyncingState]) {
      const {
        newValue: {
          [getConstNotSyncing.extensionIsEnabledData]: value = true,
        } = {},
      } = changes[getConstNotSyncing.notSyncingState];

      document.documentElement.setAttribute("disabled", !value);
    }
  }

  function onOffClickHandler(turnType, element) {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        browser.storage.onChanged.removeListener(blockExtensionListener);

        const blockTimeInMinutes = +element.dataset.value;

        const popUp = document.querySelector(
          `#mainScreen .turn${turnType}PickerPopup`,
        );

        popUp.removeAttribute("active");

        if (blockTimeInMinutes !== 0) {
          browser.storage.onChanged.addListener(blockExtensionListener);
        }

        if (turnType === "Off") {
          setToStorageWithoutSync(
            getConstNotSyncing.notSyncingState,
            {
              ...notSyncingState,
              [getConstNotSyncing.extensionBlockTime]: blockTimeInMinutes,
            },
            function () {
              extensionBlockTimerHandler(blockTimeInMinutes, turnType);
            },
          );
        }

        if (turnType === "On") {
          setToStorageWithoutSync(
            getConstNotSyncing.notSyncingState,
            {
              ...notSyncingState,
              [getConstNotSyncing.extensionEnableTime]: blockTimeInMinutes,
            },
            function () {
              extensionBlockTimerHandler(blockTimeInMinutes, turnType);
            },
          );
        }
      },
    );
  }

  // Click

  queryById("powerButton").onclick = function () {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      async function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
        const status =
          notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

        if (status) {
          const turnOffPopUp = document.querySelector(
            "#mainScreen .turnOffPickerPopup",
          );
          const isVisible = turnOffPopUp.hasAttribute("active");

          if (isVisible) {
            turnOffPopUp.removeAttribute("active");
          } else {
            turnOffPopUp.setAttribute("active", "");
          }
        } else {
          const turnOnPopUp = document.querySelector(
            "#mainScreen .turnOnPickerPopup",
          );
          const isVisible = turnOnPopUp.hasAttribute("active");

          if (isVisible) {
            turnOnPopUp.removeAttribute("active");
          } else {
            turnOnPopUp.setAttribute("active", "");
          }
        }
      },
    );
  };

  // Select time for block or enable extension

  const turnOffElements = document
    .querySelector(".turnOffPickerPopup")
    .querySelectorAll(".turnOffElement");

  for (const element of turnOffElements) {
    element.onclick = () => onOffClickHandler("Off", element);
  }

  const turnOnElements = document
    .querySelector(".turnOnPickerPopup")
    .querySelectorAll(".turnOnElement");

  for (const element of turnOnElements) {
    element.onclick = () => onOffClickHandler("On", element);
  }

  // Hide All Shorts

  document
    .getElementById(getConst.hideAllShorts)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;

      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          generateSettingsController(ACTUAL_CATEGORIES, false).then(() => {
            reSnapshotRuntimeConfig();
          });
        },
      );
    });

  // Hide All Banner Ads

  document
    .getElementById(getConst.hideAllAds)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          generateSettingsController(ACTUAL_CATEGORIES, false).then(() => {
            reSnapshotRuntimeConfig();
          });
        },
      );
    });

  // Choose Video Quality

  document
    .getElementById(getConst.videoQuality)
    .addEventListener("change", async function () {
      const id = this.id;
      const selectedQuality = this.value;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: selectedQuality },
        function () {
          reSnapshotRuntimeConfig();

          setVideoQuality(selectedQuality);
        },
      );
    });

  const videoQualityItems = querySelectorAll(
    "#mainScreen .optionWrapper:has(select)",
  );

  for (const index in videoQualityItems) {
    const item = videoQualityItems[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }

  // Show Native Player

  document
    .getElementById(getConst.showNativePlayer)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          reSnapshotRuntimeConfig();

          setNativeVideoPlayer(newValue);
        },
      );
    });

  // Disable Video Autoplay

  document
    .getElementById(getConst.disableAutoplay)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          reSnapshotRuntimeConfig();

          setVideoAutoPlay(newValue);
        },
      );
    });

  // Skip Video Ads

  document
    .getElementById(getConst.skipVideoAds)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          reSnapshotRuntimeConfig();

          skipYoutubeVideoAds(newValue);
        },
      );
    });

  // Add Summarize Button

  document
    .getElementById(getConst.addSummarizeButtonState)
    .addEventListener("change", async function () {
      const id = this.id;
      const newValue = this.checked;
      const { untrap_options_state: options_state } =
        await browser.storage.local.get(getConst.optionsState);

      setToStorage(
        getConst.optionsState,
        { ...options_state, [id]: newValue },
        function () {
          reSnapshotRuntimeConfig();

          addSummarizeButton(newValue);
        },
      );
    });

  // Get testers release
})();

async function checkUpdates() {
  const { untrap_remote_options_data } = await browser.storage.local.get(
    getConst.remoteOptionsData,
  );

  const {
    desktop: settingsStylesArrayDesktop,
    mobile: settingsStylesArrayMobile,
  } = untrap_remote_options_data ?? {
    desktop: [],
    mobile: [],
  };

  if (!settingsStylesArrayDesktop.length || !settingsStylesArrayMobile.length) {
    await fillRemoteOptionsFromJson();
  }

  handleUserAuthSession();
}

async function fillRemoteOptionsFromJson() {
  const categories = await loadSettingsFromJson();
  const { untrap_system_config: systemState } = await browser.storage.local.get(
    getConst.system,
  );

  const metaState = systemState[getConst.meta] ?? {};

  const { desktopOptions, mobileOptions, current_version } =
    getOptionsFromJson(categories);

  setToStorageWithoutSync(getConst.remoteOptionsData, {
    desktop: desktopOptions,
    mobile: mobileOptions,
  });

  setWithoutSyncSystemConfigStorage({
    systemState,
    newState: {
      [getConst.meta]: {
        ...metaState,
        [getConst.currentVersionOnSettingsRelease]: current_version,
      },
    },
  });
}

function summarizeRequestCountDisplayHandler(uuid) {
  const summarizeReqCount = document.querySelector(".summarize-req-count");

  checkRequestLimit(uuid)
    .then((response) => {
      if (response.message === "User available summarize request count") {
        summarizeReqCount.textContent = `${response.currentRequestCount} / ${response.maxRequests}`;
      }
    })
    .catch((error) => {
      console.error(error);
      summarizeReqCount.textContent = `0 / 3`;
    });
}

function optionsUpdatesSchedule(isPro) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const metaState = systemState[getConst.meta] ?? {};
    const metaInitDateState = metaState[getConst.init] ?? {};
    const metaScheduleState = metaState[getConst.updateSchedule] ?? {};

    const now = new Date();
    const formattedDate = now.toLocaleDateString("uk-UA");

    let scheduledDay = metaScheduleState[getConst.weekDay] ?? null;
    let scheduledHour = metaScheduleState[getConst.hour] ?? null;

    const storedInitDate = metaInitDateState[getConst.date] ?? formattedDate;

    let newMetaState = {
      ...metaState,
      [getConst.init]: { ...metaInitDateState },
      [getConst.updateSchedule]: { ...metaScheduleState },
    };

    if (scheduledDay === null || scheduledHour === null) {
      const formattedTime = now.toTimeString().slice(0, 5);

      const randomDay = Math.floor(Math.random() * 7);
      const currentHour = now.getHours();

      scheduledDay = randomDay;
      scheduledHour = currentHour;

      newMetaState = {
        ...newMetaState,
        [getConst.init]: {
          ...newMetaState[getConst.init],
          [getConst.date]: storedInitDate,
          [getConst.time]: formattedTime,
        },
        [getConst.updateSchedule]: {
          ...newMetaState[getConst.updateSchedule],
          [getConst.weekDay]: randomDay,
          [getConst.hour]: currentHour,
        },
      };
    }

    const [day, month, year] = storedInitDate.split(".");
    const baseDate = new Date(`${year}-${month}-${day}`);

    let nextScheduledDate;

    if (isPro) {
      nextScheduledDate = new Date(baseDate);
      nextScheduledDate.setDate(baseDate.getDate() + 1);
    } else {
      const baseDayOfWeek = baseDate.getDay();
      let daysToAdd = (scheduledDay - baseDayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;

      nextScheduledDate = new Date(baseDate);
      nextScheduledDate.setDate(baseDate.getDate() + daysToAdd);
    }

    const formattedNextDate = nextScheduledDate.toLocaleDateString("uk-UA");

    newMetaState = {
      ...newMetaState,
      [getConst.nextDateForUpdate]: formattedNextDate,
    };

    setWithoutSyncSystemConfigStorage({
      systemState,
      newState: {
        [getConst.meta]: newMetaState,
      },
      callback: () => {
        checkUpdatesOnServer();
      },
    });
  });
}

function checkUpdatesOnServer() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const metaState = systemState[getConst.meta] ?? {};
    const metaInitDateState = metaState[getConst.init] ?? {};
    const metaScheduleState = metaState[getConst.updateSchedule] ?? {};

    const nextDateToUpdateStr = metaState[getConst.nextDateForUpdate] ?? null;
    const scheduleHour = metaScheduleState[getConst.hour] ?? null;

    if (nextDateToUpdateStr === null || scheduleHour === null) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const currentDate = now.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const [currDay, currMonth, currYear] = currentDate.split(".");
    const currentDateObj = new Date(
      Number(currYear),
      Number(currMonth) - 1,
      Number(currDay),
    );

    const [nextDay, nextMonth, nextYear] = nextDateToUpdateStr.split(".");
    const nextUpdateDateObj = new Date(
      Number(nextYear),
      Number(nextMonth) - 1,
      Number(nextDay),
    );

    if (
      currentDateObj.getTime() > nextUpdateDateObj.getTime() ||
      (currentDateObj.getTime() == nextUpdateDateObj.getTime() &&
        currentHour >= scheduleHour)
    ) {
      requestForNewOptionsForDb().then(() => {
        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.meta]: {
              ...metaState,
              [getConst.init]: {
                ...metaInitDateState,
                [getConst.date]: currentDate,
              },
            },
          },
        });
      });
    }
  });
}

function applyOptionsUpdates({
  releases,
  version_release,
  header,
  title,
  desktopOptionStylesFromServer,
  mobileOptionStylesFromServer,
}) {
  if (!releases || !releases.length) return;

  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const metaState = systemState[getConst.meta] ?? {};

    const updatedDesktop = [...desktopOptionStylesFromServer];
    const updatedMobile = [...mobileOptionStylesFromServer];

    header.classList.remove("has-updates");
    void header.offsetHeight;
    header.classList.add("has-updates");

    const countEl = header.querySelector(".updated-count");
    if (countEl) {
      const countOfChangedSelectors = releases.reduce((sum, item) => {
        const { styles } = item;

        if (!Array.isArray(styles)) return sum;

        let localCount = 0;

        styles.forEach((entry, i) => {
          if (Array.isArray(entry)) {
            localCount += entry.length;
            return;
          }

          if (entry && typeof entry === "object" && entry.styles) {
            const inner = entry.styles;

            Object.values(inner).forEach((arr) => {
              if (Array.isArray(arr)) {
                localCount += arr.length;
              }
            });

            return;
          }

          localCount += 1;
        });

        return sum + localCount;
      }, 0);

      countEl.textContent = countOfChangedSelectors;
    }

    title.addEventListener(
      "animationend",
      (e) => {
        if (e.animationName === "titleAnim") {
          header.classList.remove("has-updates");
        }
      },
      { once: true },
    );

    releases.forEach((item) => {
      if (item.is_mobile) {
        const index = updatedMobile.findIndex(
          (opt) => opt.settings_id === item.id,
        );

        if (index !== -1) {
          updatedMobile[index] = {
            ...updatedMobile[index],
            styles: item.styles,
          };
        }
      } else {
        const index = updatedDesktop.findIndex(
          (opt) => opt.settings_id === item.id,
        );

        if (index !== -1) {
          updatedDesktop[index] = {
            ...updatedDesktop[index],
            styles: item.styles,
          };
        }
      }
    });

    setToStorageWithoutSync(
      getConst.remoteOptionsData,
      {
        desktop: updatedDesktop,
        mobile: updatedMobile,
      },
      () => {},
    );

    setWithoutSyncSystemConfigStorage({
      systemState,
      newState: {
        [getConst.meta]: {
          ...metaState,
          [getConst.currentVersionOnSettingsRelease]: version_release,
        },
      },
    });
  });
}

function requestForNewOptionsForDb() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(
      [getConst.remoteOptionsData, getConst.system],
      async function (obj) {
        try {
          const {
            desktop: desktopOptionStylesFromStorage,
            mobile: mobileOptionStylesFromStorage,
          } = obj[getConst.remoteOptionsData] ?? {
            desktop: [],
            mobile: [],
          };

          const systemState = obj[getConst.system] ?? {};
          const metaState = systemState[getConst.meta] ?? {};

          const currentVersionOfRelease =
            metaState[getConst.currentVersionOnSettingsRelease] ?? "";

          const optionStylesFromServer = [
            ...desktopOptionStylesFromStorage,
            ...mobileOptionStylesFromStorage,
          ];

          const header = document.querySelector(".topHeaderCenter");
          const title = header.querySelector(".title");

          if (optionStylesFromServer.length) {
            const options = await getPartialOptionsSettings(
              currentVersionOfRelease,
            );

            const { releases, version_release } = options;

            if (releases?.length) {
              applyOptionsUpdates({
                releases,
                version_release,
                header,
                title,
                desktopOptionStylesFromServer: desktopOptionStylesFromStorage,
                mobileOptionStylesFromServer: mobileOptionStylesFromStorage,
              });
            }

            resolve();
          }
          // } else {
          //   const deskTopSettingsFromServer = [];
          //   const mobileSettingsFromServer = [];

          //   const options = await getOptionsSettings(false);

          //   const { settings, current_version } = options;

          //   if (settings && settings.length) {
          //     settings.forEach((item) => {
          //       if (item.is_mobile) {
          //         mobileSettingsFromServer.push(item);
          //       } else {
          //         deskTopSettingsFromServer.push(item);
          //       }
          //     });

          //     applyOptionsUpdates({
          //       releases: settings,
          //       version_release: current_version,
          //       header,
          //       title,
          //       desktopOptionStylesFromServer: deskTopSettingsFromServer,
          //       mobileOptionStylesFromServer: mobileSettingsFromServer,
          //     });
          //   }

          //   resolve();
          // }
        } catch (error) {
          console.error("Error:", error);
          reject(error);
        }
      },
    );
  });
}

function handleUserAuthSession() {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

      const userName =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";
      if (uuid) {
        summarizeRequestCountDisplayHandler(uuid);
        checkForSpecialUsers(userName);

        if (!isBrowserSafari()) {
          requestUserFromDb(uuid)
            .then((result) => {
              browser.storage.local.get(
                getConstNotSyncing.notSyncingState,
                function (obj) {
                  const newNotSyncingState =
                    obj[getConstNotSyncing.notSyncingState] ?? {};
                  if (
                    result.user.isPaddlePro === 1 ||
                    result.user.isApplePro === 1
                  ) {
                    app_isPRO = "true";

                    setToStorageWithoutSync(
                      getConstNotSyncing.notSyncingState,
                      {
                        ...newNotSyncingState,
                        [getConstNotSyncing.isUserPro]: true,
                      },
                    );

                    optionsUpdatesSchedule(true);
                  } else {
                    app_isPRO = "false";

                    setToStorageWithoutSync(
                      getConstNotSyncing.notSyncingState,
                      {
                        ...notSyncingState,
                        [getConstNotSyncing.isUserPro]: false,
                      },
                    );

                    optionsUpdatesSchedule(false);
                  }
                },
              );
            })
            .catch((error) => {
              browser.storage.local.get(
                getConstNotSyncing.notSyncingState,
                function (obj) {
                  const newNotSyncingState =
                    obj[getConstNotSyncing.notSyncingState] ?? {};

                  console.error(error);
                  app_isPRO = "false";

                  setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                    ...newNotSyncingState,
                    [getConstNotSyncing.isUserPro]: false,
                  });

                  optionsUpdatesSchedule(false);
                },
              );
            })
            .finally(() => {
              tryToSyncFromServer();
            });
        } else {
          tryToSyncFromServer();
        }
      } else {
        optionsUpdatesSchedule(false);
      }
    },
  );
}

// Generate Settings

function expandNecessarySection() {
  getCurrentTab().then((tabs) => {
    const currentUrl = tabs[0]?.url
      ? tabs[0]?.url
      : app_device === "phone"
        ? "https://m.youtube.com/"
        : "https://www.youtube.com/";

    if (currentUrl.includes(shortsPageUrlPart)) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "shortsPage",
      );
    } else if (currentUrl.includes(searchPageUrlPart)) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "searchPage",
      );
    } else if (currentUrl.includes(videoPageUrlPart)) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "videoPage",
      );
    } else if (currentUrl.includes(subscriptionsPageUrlPart)) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "subscriptionsPage",
      );
    } else if (
      currentUrl.includes(channelPageUrlPart1) ||
      currentUrl.includes(channelPageUrlPart2)
    ) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "channelPage",
      );
    } else if (
      currentUrl.includes(youPageUrlPart1) ||
      currentUrl.includes(youPageUrlPart2)
    ) {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "youPage",
      );
    } else {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        "homePage",
      );
    }
  });
}

function createOption(optionObject) {
  const optionName = getLocalizedOptionName(optionObject.name);
  const optionId = optionObject.id;
  const optionDefaultValue = optionObject.defaultValue;

  const optionParentWrapper = document.createElement("div");
  optionParentWrapper.classList.add("optionParentWrapper");

  const optionWrapper = document.createElement("div");
  optionWrapper.classList.add("optionWrapper");

  // Wrap with label so can activate by click on name

  var label;

  if (optionObject.type === "color") {
    label = document.createElement("div");
  } else {
    label = document.createElement("label");
  }

  label.className = "label";
  label.setAttribute("for", optionId);

  // Create option name

  const labelSpan = document.createElement("span");
  labelSpan.className = "labelSpan";
  labelSpan.innerHTML = optionName;

  // Control Element

  let controlElement;

  if (optionObject.type === "checkbox") {
    const switchLabel = document.createElement("label");
    switchLabel.classList.add("switchLabel");
    switchLabel.classList.add("switch");

    const checkboxInput = document.createElement("input");
    checkboxInput.className = "formCheckbox";
    checkboxInput.id = optionId;
    checkboxInput.setAttribute("type", "checkbox");
    browser.storage.local.get(getConst.optionsState, function (obj) {
      const optionState = obj[getConst.optionsState] ?? {};
      const value = optionState[optionId] ?? optionDefaultValue;

      checkboxInput.checked = value;
    });

    const slider = document.createElement("span");
    slider.classList.add("slider", "round");

    switchLabel.appendChild(checkboxInput);
    switchLabel.appendChild(slider);

    controlElement = switchLabel;
  } else if (optionObject.type === "select") {
    const selectContainer = document.createElement("div");
    selectContainer.classList.add("selectContainer");

    const chevron = document.createElement("i");
    chevron.classList.add("fa-solid");
    chevron.classList.add("fa-caret-down");

    const select = document.createElement("select");
    select.classList.add("selectSelect");
    select.id = optionObject.id;

    browser.storage.local.get(getConst.optionsState, function (obj) {
      const optionState = obj[getConst.optionsState] ?? {};
      const selectValue = optionState[optionId] ?? optionDefaultValue;

      for (const selectOption of optionObject.selects) {
        var opt = document.createElement("option");
        opt.value = selectOption.id;
        opt.innerHTML = getLocalizedOptionName(selectOption.name);
        if (selectOption.id == selectValue) {
          opt.setAttribute("selected", "");
        }
        select.appendChild(opt);
      }
    });

    selectContainer.appendChild(select);
    selectContainer.appendChild(chevron);

    controlElement = selectContainer;
  } else if (optionObject.type === "color") {
    const colorPickerWrapper = document.createElement("div");
    colorPickerWrapper.className = "colorPickerWrapper";

    const colorPickerInput = document.createElement("input");
    colorPickerInput.setAttribute("type", "color");
    colorPickerInput.id = optionId;

    const clearButton = document.createElement("i");
    clearButton.classList.add("fa-solid", "fa-xmark", "resetColorInput");

    browser.storage.local.get(getConst.optionsState, function (obj) {
      const optionState = obj[getConst.optionsState] ?? {};
      const selectValue = optionState[optionId] ?? "default";

      if (selectValue != "default") {
        colorPickerInput.setAttribute("value", selectValue);
      }
    });

    colorPickerWrapper.appendChild(colorPickerInput);
    colorPickerWrapper.appendChild(clearButton);

    controlElement = colorPickerWrapper;
  } else {
    controlElement = document.createElement("div");
  }

  label.appendChild(labelSpan);
  label.appendChild(controlElement);

  optionWrapper.appendChild(label);

  optionParentWrapper.appendChild(optionWrapper);

  // Recursively handle childOffOptions

  if (optionObject.hasOwnProperty("childOffOptions")) {
    const childOptionsWrapper = document.createElement("div");
    childOptionsWrapper.classList.add("childOptionsWrapper");
    childOptionsWrapper.classList.add("childOffOptions");

    for (const childOption of optionObject.childOffOptions) {
      const { optionEntity: childOptionWrapper } = createOption(childOption);

      childOptionsWrapper.appendChild(childOptionWrapper);
    }

    optionParentWrapper.appendChild(childOptionsWrapper);
  }

  if (optionObject.hasOwnProperty("childOnOptions")) {
    const childOptionsWrapper = document.createElement("div");
    childOptionsWrapper.classList.add("childOptionsWrapper");
    childOptionsWrapper.classList.add("childOnOptions");

    for (const childOption of optionObject.childOnOptions) {
      const { optionEntity: childOptionWrapper } = createOption(childOption);

      childOptionsWrapper.appendChild(childOptionWrapper);
    }

    optionParentWrapper.appendChild(childOptionsWrapper);
  }

  return { optionEntity: optionParentWrapper };
}

async function generateSettingsController(inputCategories, isSearch) {
  const keywords = await getMergedKeywords();
  const currentUrl = await getUrl();

  const { untrap_options_state: options_state } =
    await browser.storage.local.get(getConst.optionsState);

  if (!isSearch) {
    if (ACTUAL_CATEGORIES.length == 0) {
      await prepareActualSetting(currentUrl);
    }
  }

  // Clean for case when user changing lang
  queryById("activeCategoryButtonList").innerHTML = "";
  queryById("categoryPickerList").innerHTML = "";
  queryById("settingsContainerSearch").innerHTML = "";
  queryById("settingsContainerDefault").innerHTML = "";

  const filteredCategories = filterCategories(
    inputCategories,
    keywords,
    options_state,
  );

  setToStorageWithoutSync(getConst.optionsState, options_state);

  const categoriesWithoutEmptySection = filteredCategories
    .map((category) => {
      const filteredCategoryGroups = category.categoryGroups.filter(
        (group) => Array.isArray(group.options) && group.options.length > 0,
      );

      return {
        ...category,
        categoryGroups: filteredCategoryGroups,
      };
    })
    .filter((category) => category.categoryGroups.length > 0);

  for (const category of categoriesWithoutEmptySection) {
    const categoryName = getLocalizedCategoryName(category.categoryName);

    if (!isSearch) {
      // Category Picker List
      const newCategory = document.createElement("div");
      newCategory.innerHTML = categoryName;
      newCategory.classList.add("category");
      newCategory.setAttribute("categoryId", category.categoryId);
      queryById("categoryPickerList").appendChild(newCategory);

      // Category Picked
      const newCategory2 = document.createElement("div");
      newCategory2.innerHTML = categoryName;
      newCategory2.classList.add("pickedCategory");
      newCategory2.setAttribute("categoryId", category.categoryId);
      queryById("activeCategoryButtonList").appendChild(newCategory2);
    }

    // Fill Options
    const categoryGroups = category.categoryGroups;
    const categoryId = category.categoryId;

    if (categoryGroups.length == 0) {
      continue;
    }

    // Create Section
    const collapsibleSection = document.createElement("div");
    collapsibleSection.className = "collapsibleSection";
    collapsibleSection.setAttribute("categoryId", categoryId);

    if (isSearch) {
      const collapsibleSectionTitle = document.createElement("div");
      collapsibleSectionTitle.className = "collapsibleSectionTitle";
      collapsibleSectionTitle.innerHTML = categoryName;
      collapsibleSection.appendChild(collapsibleSectionTitle);
    }

    for (const group of categoryGroups) {
      const groupObject = group;
      const groupOptions = groupObject.options;
      if (groupOptions.length == 0) {
        continue;
      }

      // Create Group
      const collapsibleSectionBody = document.createElement("div");
      collapsibleSectionBody.className = "settingsGroup";

      if (isSearch || categoryGroups.length > 1) {
        // Add Label for group
        const groupTitleWrapper = document.createElement("div");
        groupTitleWrapper.classList.add("optionsGroupTitle");
        groupTitleWrapper.innerHTML = getLocalizedGroupName(
          groupObject.groupName,
        );

        collapsibleSectionBody.appendChild(groupTitleWrapper);
      }

      // Create Group Body
      const settingsGroupBody = document.createElement("div");
      settingsGroupBody.className = "settingsGroupBody underlayBackground";

      collapsibleSectionBody.appendChild(settingsGroupBody);

      for (const option in groupOptions) {
        // Create Option Parent Wrapper
        const { optionEntity: optionWrapper } = createOption(
          groupOptions[option],
        );

        settingsGroupBody.appendChild(optionWrapper);
      }

      collapsibleSection.appendChild(collapsibleSectionBody);
    }

    if (isSearch) {
      queryById("settingsContainerSearch").appendChild(collapsibleSection);
    } else {
      queryById("settingsContainerDefault").appendChild(collapsibleSection);
    }
  }

  if (!isSearch) {
    expandNecessarySection();
  }

  // MARK: - Change Category
  const categoriesButtons = querySelectorAll("#categoryPickerList .category");

  for (const category of categoriesButtons) {
    category.onclick = function () {
      queryById("optionsScreen").setAttribute(
        "displayingCategoryId",
        category.getAttribute("categoryId"),
      );
      queryById("optionsScreen").setAttribute("categorypickerisshowing", false);

      // Trigger a scroll to the top to remove the previously scrolled content from the old category.
      var scrollableDiv = document.getElementById("settingsContainer");
      scrollableDiv.scrollTop = 0;
    };
  }

  // MARK: - Checkbox Click
  const checkboxes = document.querySelectorAll(
    "#optionsScreen .optionWrapper:not(:has(.colorPickerWrapper))",
  );

  for (const checkbox of checkboxes) {
    checkbox.onclick = function () {
      event.preventDefault();

      const hiddenInput = checkbox.querySelector(".formCheckbox");
      const checkboxId = hiddenInput.id;

      browser.storage.local.get(getConst.optionsState, function (obj) {
        const options_state = obj[getConst.optionsState] ?? {};

        const currentCheckbox = findOptionById(checkboxId);
        const defaultValue = currentCheckbox.defaultValue;

        if (defaultValue != null) {
          const status = options_state[checkboxId] ?? defaultValue;
          hiddenInput.checked = status ? false : true;

          setToStorage(
            getConst.optionsState,
            { ...options_state, [checkboxId]: !status },
            function () {
              reSnapshotRuntimeConfig({ optionId: checkboxId });
            },
          );
        }
      });
    };
  }

  // MARK: - Select Option Change
  const selects = document.querySelectorAll("#optionsScreen .selectSelect");

  for (const select of selects) {
    select.onchange = function () {
      browser.storage.local.get(
        [getConst.remoteOptionsData, getConst.optionsState],
        function (obj) {
          const options_state = obj[getConst.optionsState];

          const {
            desktop: settingsStylesArrayDesktop,
            mobile: settingsStylesArrayMobile,
          } = obj[getConst.remoteOptionsData] ?? {
            desktop: [],
            mobile: [],
          };

          const settingsStylesArray = isDesktop(currentUrl)
            ? settingsStylesArrayDesktop
            : settingsStylesArrayMobile;

          if (settingsStylesArray.length) {
            selectsOptions = settingsStylesArray.find(
              (item) => item.settings_id === select.id,
            );
          }

          setToStorage(
            getConst.optionsState,
            { ...options_state, [select.id]: select.value },
            function () {
              reSnapshotRuntimeConfig();
            },
          );
        },
      );
    };
  }

  // Click on row with select
  const itemsWithSelect = querySelectorAll(
    "#optionsScreen .optionWrapper:has(select)",
  );

  for (const index in itemsWithSelect) {
    const item = itemsWithSelect[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }

  // MARK: - Color Picker Changed
  const itemsWithColorPicker = querySelectorAll(
    "#optionsScreen .optionWrapper input[type='color']",
  );

  for (const colorPicker of itemsWithColorPicker) {
    colorPicker.oninput = function () {
      browser.storage.local.get(getConst.optionsState, function (obj) {
        const options_state = obj[getConst.optionsState];

        colorPicker.setAttribute("value", colorPicker.value);

        setToStorage(
          getConst.optionsState,
          { ...options_state, [colorPicker.id]: colorPicker.value },
          function () {
            reSnapshotRuntimeConfig();
          },
        );
      });
    };
  }

  // Click on reset button
  const clearColorPickerArray = querySelectorAll(
    "#optionsScreen .optionWrapper .resetColorInput",
  );

  for (const clearColorPicker of clearColorPickerArray) {
    clearColorPicker.onclick = function () {
      browser.storage.local.get(getConst.optionsState, function (obj) {
        const options_state = obj[getConst.optionsState];

        const colorPicker = clearColorPicker.parentNode.querySelector("input");
        colorPicker.value = "#000";
        colorPicker.removeAttribute("value");
        setToStorage(
          getConst.optionsState,
          { ...options_state, [colorPicker.id]: "default" },
          function () {
            reSnapshotRuntimeConfig();
          },
        );
      });
    };
  }
}

//MARK: - Select video quality

function setVideoQuality(videoQuality) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    //We add the id because event listener in htmlAtrributesManager.js, listens all messages in content scripts
    browser.tabs.sendMessage(tabsId, {
      id: getConst.videoQuality,
      action: "setYoutubeVideoQuality",
      videoQuality,
    });
  });
}

function setNativeVideoPlayer(checkedValue) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      id: getConst.showNativePlayer,
      action: "setNativeVideoPlayer",
      isShowNativeVideoPlayer: checkedValue,
    });
  });
}

function setVideoAutoPlay(checkedValue) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      id: getConst.disableAutoplay,
      action: "setVideoAutoPlay",
      isDisableAutoPlay: checkedValue,
    });
  });
}

function skipYoutubeVideoAds(checkedValue) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      id: getConst.skipVideoAds,
      action: "skipYoutubeVideoAds",
      isSkipVideoAds: checkedValue,
    });
  });
}

function addSummarizeButton(checkedValue) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      id: getConst.addSummarizeButtonState,
      action: "addSummarizeButton",
      isAddSummarizeButton: checkedValue,
    });
  });
}

function sendApplyRuntimeSignal(isNeedReload) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs
      .sendMessage(tabsId, {
        action: "applyRuntime",
      })
      .finally(() => {
        if (isNeedReload) {
          location.reload();
        }
      });
  });
}

function autoTheatherModeSignal() {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      action: "autoTheatherMode",
    });
  });
}

function autoShowChaptersSignal() {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      action: "autoShowChapters",
    });
  });
}

// MARK: - Filter Categories

let previousTerms = [];

function filterCategories(providedCategories, searchTerms, optionsState) {
  function getUniqueTerms(previousTerms, currentTerms) {
    return previousTerms.filter((term) => !currentTerms.includes(term));
  }

  function shouldExclude(obj, excludeTerm = null) {
    const isCheckbox =
      obj.type === "checkbox" &&
      typeof obj.name === "object" &&
      obj.id !== undefined &&
      !obj.id.includes("exclude") &&
      typeof obj.defaultValue === "boolean";

    const isSelect =
      obj.type === "select" &&
      typeof obj.name === "object" &&
      obj.id !== undefined &&
      !obj.id.includes("exclude") &&
      obj.defaultValue === "home" &&
      Array.isArray(obj.selects);

    const hasAnyTermInNameEn =
      obj.name?.en &&
      typeof obj.id === "string" &&
      (excludeTerm
        ? obj.id.toLowerCase().includes(excludeTerm.toLowerCase())
        : searchTerms?.some((term) =>
            obj.id.toLowerCase().includes(term.toLowerCase()),
          ));

    return (isCheckbox || isSelect) && hasAnyTermInNameEn;
  }

  function filterRecursively(obj) {
    if (Array.isArray(obj)) {
      return obj
        .map((item) => filterRecursively(item))
        .filter((item) => item !== undefined);
    } else if (typeof obj === "object" && obj !== null) {
      const filteredObject = {};

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const filteredValue = filterRecursively(obj[key]);
          if (filteredValue !== undefined) {
            filteredObject[key] = filteredValue;
          }
        }
      }

      if (shouldExclude(filteredObject)) {
        optionsState[filteredObject.id] = true;

        return undefined;
      }

      for (excludeTerm in noLongerExcludedTerms) {
        if (shouldExclude(filteredObject, noLongerExcludedTerms[excludeTerm])) {
          optionsState[filteredObject.id] = false;
        }
      }

      return Object.keys(filteredObject).length > 0
        ? filteredObject
        : undefined;
    }

    return obj;
  }

  const noLongerExcludedTerms = getUniqueTerms(previousTerms, searchTerms);

  previousTerms = searchTerms;

  return filterRecursively(providedCategories);
}

// MARK: - Prepare Actual Setting

const listOfFilteringKeyWords = {
  untrap_global_hide_all_shorts: ["short"],
  untrap_global_hide_all_ads: ["_ads"],
};

function getMergedKeywords() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(getConst.optionsState, function (storedData) {
      const optionsState = storedData[getConst.optionsState] || {};
      let mergedKeywords = [];

      for (let key in listOfFilteringKeyWords) {
        if (optionsState[key] === true) {
          mergedKeywords = mergedKeywords.concat(listOfFilteringKeyWords[key]);
        }
      }
      resolve(mergedKeywords);
    });
  });
}
