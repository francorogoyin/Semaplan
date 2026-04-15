function setStorageByDefault() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? null;

    if (!runtimeSnapshot) {
      setToStorage(
        getConst.runtimeSnapshot,
        {
          css: {
            youtube: "",
            twitch: "",
            facebook: "",
            instagram: "",
            linkedin: "",
            reddit: "",
            twitter: "",
            gmail: "",
            "hacker-news": "",
            pinterest: "",
            netflix: "",
            tikTok: "",
            blueSky: "",
          },
          flags: {},
        },
        function () {
          migrationFromOldToNewStoreScript();
        },
      );
    } else {
      migrationFromOldToNewStoreScript();
    }
  });
}

function isValueValidForMigration(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value);
}

function migrationFromOldToNewStoreScript() {
  browser.storage.local.get(null, (storeObject) => {
    let shouldUpdate = false;

    const storagePatch = {};
    const storagePatchWithoutSync = {};
    let systemConfigPatch = null;

    const storeArray = Object.entries(storeObject).map(([id, value]) => ({
      id,
      value,
    }));

    const storageSystemState = storeObject[getConst.system] ?? {};
    const storageState = storeObject[getConst.optionsState] ?? {};
    const storageNotSyncing =
      storeObject[getConstNotSyncing.notSyncingState] ?? {};

    const storageSharedState = storageSystemState[getConst.sharedState] ?? {};
    const storageMetaState = storageSystemState[getConst.meta] ?? {};
    const storageExtensionUIState =
      storageSystemState[getConst.extensionUiState] ?? {};
    const storageDailyLimitState =
      storageSystemState[getConst.dailyLimitData] ?? {};

    const storageMetaInitDateState = storageMetaState[getConst.init] ?? {};
    const storageMetaScheduleState =
      storageMetaState[getConst.updateSchedule] ?? {};

    const optionState = {
      youtube: {},
      twitch: {},
      facebook: {},
      instagram: {},
      linkedin: {},
      reddit: {},
      twitter: {},
      gmail: {},
      "hacker-news": {},
      pinterest: {},
      netflix: {},
      tikTok: {},
      blueSky: {},
    };
    const notSyncingState = {};
    const sharedState = {};
    const metaState = {};
    const initDateMetaState = {};
    const scheduleUpdateMetaState = {};
    const extensionUiState = {};
    const dailyLimitState = {};

    const removeKeys = (keys) => {
      if (!keys || !keys.length) return;
      keys.forEach((key) => browser.storage.local.remove(key));
    };

    storeArray.forEach(({ id, value }) => {
      if (storageEntityKeysList.includes(id)) return;

      if (
        (isValueValidForMigration(value) === false &&
          id !== getConstNotSyncing.isUserPro) ||
        id === getConst.settingsStylesArray ||
        id === getConst.settingsStylesArrayMobile
      ) {
        browser.storage.local.remove(id);
        return;
      }

      const { option: optionFromList = null, parentId = "" } =
        findOptionById(id) ?? {};
      const isOption = Boolean(optionFromList);

      switch (true) {
        case Object.values(getConstNotSyncing).includes(id): {
          notSyncingState[id] = value;
          break;
        }

        case sharedStateSettingsList.includes(id): {
          sharedState[id] = value;
          break;
        }

        case metaStateSettingsList.includes(id): {
          metaState[id] = value;
          break;
        }

        case initDateSettingsList.includes(id): {
          initDateMetaState[id] = value;
          break;
        }

        case scheduleDateSettingsList.includes(id): {
          scheduleUpdateMetaState[id] = value;
          break;
        }

        case dailyLimitKeys.includes(id): {
          dailyLimitState[id] = value;
          break;
        }

        case extensionStateSettingsList.includes(id): {
          extensionUiState[id] = value;
          break;
        }

        default:
          break;
      }

      if (isOption) {
        optionState[`${parentId.toLowerCase()}`][id] = value;
      }
    });

    // optionsState
    const hasAnyOptionUpdates = Object.values(optionState).some(
      (platformState) => platformState && Object.keys(platformState).length > 0,
    );

    if (hasAnyOptionUpdates) {
      storagePatch[getConst.optionsState] = {
        ...storageState,
        ...optionState,
      };

      shouldUpdate = true;
    }

    // notSyncingState
    if (Object.keys(notSyncingState).length) {
      storagePatchWithoutSync[getConstNotSyncing.notSyncingState] = {
        ...storageNotSyncing,
        ...notSyncingState,
      };

      shouldUpdate = true;

      handleUserAuthSession();
    }

    // system state buckets
    const hasSystemUpdates =
      Object.keys(sharedState).length ||
      Object.keys(metaState).length ||
      Object.keys(extensionUiState).length ||
      Object.keys(initDateMetaState).length ||
      Object.keys(scheduleUpdateMetaState).length ||
      Object.keys(dailyLimitState).length;

    if (hasSystemUpdates) {
      const nextSharedState = Object.keys(sharedState).length
        ? { ...storageSharedState, ...sharedState }
        : storageSharedState;

      const dailyLimitDataState = Object.keys(dailyLimitState).length
        ? { ...storageDailyLimitState, ...dailyLimitState }
        : storageDailyLimitState;

      const nextMetaState = Object.keys(metaState).length
        ? {
            ...storageMetaState,
            ...metaState,
            [getConst.init]: Object.keys(initDateMetaState).length
              ? { ...storageMetaInitDateState, ...initDateMetaState }
              : storageMetaInitDateState,
            [getConst.updateSchedule]: Object.keys(scheduleUpdateMetaState)
              .length
              ? { ...storageMetaScheduleState, ...scheduleUpdateMetaState }
              : storageMetaScheduleState,
          }
        : storageMetaState;

      const nextExtensionUiState = Object.keys(extensionUiState).length
        ? { ...storageExtensionUIState, ...extensionUiState }
        : storageExtensionUIState;

      systemConfigPatch = {
        systemState: storageSystemState,
        newState: {
          [getConst.sharedState]: nextSharedState,
          [getConst.meta]: nextMetaState,
          [getConst.extensionUiState]: nextExtensionUiState,
          [getConst.dailyLimitData]: dailyLimitDataState,
        },
      };

      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const nonEmptyKeys = Object.keys(optionState).filter((key) => {
        const value = optionState[key];
        return (
          value && typeof value === "object" && Object.keys(value).length > 0
        );
      });

      const storagePromises = [];

      Object.entries(storagePatch).forEach(([key, value]) => {
        storagePromises.push(
          new Promise((resolve) => setToStorage(key, value, resolve)),
        );
      });

      Object.entries(storagePatchWithoutSync).forEach(([key, value]) => {
        storagePromises.push(
          new Promise((resolve) =>
            setToStorageWithoutSync(key, value, resolve),
          ),
        );
      });

      if (systemConfigPatch) {
        storagePromises.push(
          new Promise((resolve) =>
            setSystemConfigStorage({ ...systemConfigPatch, callback: resolve }),
          ),
        );
      }

      Promise.all(storagePromises).finally(() => {
        removeKeys([
          ...Object.keys(optionState).flatMap((key) =>
            Object.keys(optionState[key]),
          ),
          ...Object.keys(notSyncingState),
          ...Object.keys(sharedState),
          ...Object.keys(metaState),
          ...Object.keys(extensionUiState),
          ...Object.keys(initDateMetaState),
          ...Object.keys(scheduleUpdateMetaState),
          ...Object.keys(dailyLimitState),
        ]);

        reSnapshotRuntimeConfig({
          isNeedReload: true,
          categoryIdArray: nonEmptyKeys,
        });
      });
    }
  });
}

function showScreen(name) {
  const allAppScreens = document.querySelectorAll(".appScreen");

  for (const screen of allAppScreens) {
    screen.removeAttribute("active");
    if (screen.getAttribute("id") == name) {
      screen.setAttribute("active", "");
    }
  }
}

function showDropdown(element) {
  var event;
  event = document.createEvent("MouseEvents");
  event.initMouseEvent("mousedown", true, true, window);
  element.dispatchEvent(event);
}

function getTabs() {
  return browser.tabs.query({});
}

function getCurrentTab() {
  return browser.tabs.query({ currentWindow: true, active: true });
}

function isDesktopDeepCheck() {
  return getCurrentTab().then((tabs) => {
    const currentTabId = tabs[0].id;
    const currentTabURL = tabs[0].url;

    if (currentTabURL != "") {
      return browser.tabs
        .sendMessage(currentTabId, {
          action: "checkSelectors",
        })
        .then((result) => {
          return result.isDesktop;
        })
        .catch((error) => {
          return !isUserAgentMobile();
        });
    } else {
      return !isUserAgentMobile();
    }
  });
}

function mapCategory(category, isDesktop) {
  ACTUAL_CATEGORIES.push({
    categoryId: category.categoryId,
    categoryName: isDesktop
      ? category.categoryDesktopName
      : category.categoryMobileName,
    categoryGroups: isDesktop
      ? category.categoryDesktopGroups
      : category.categoryMobileGroups,
  });
}

function getCategoriesFromExtension() {
  return loadSettingsFromJson()
    .then((CATEGORIES) =>
      isDesktopDeepCheck().then((isDesktop) => {
        ACTUAL_CATEGORIES.length = 0; // опционально, чтобы не накапливать дубликаты

        CATEGORIES.data
          .filter((category) => category.categoryId !== undefined)
          .forEach((category) => mapCategory(category, isDesktop));

        return ACTUAL_CATEGORIES; // ← ключевой момент
      }),
    )
    .catch((error) => {
      console.error("Error in getCategoriesFromExtension:", error);
      return [];
    });
}

function getFeaturesArrayOfObjectIds() {
  const obj = getConst;
  let result = [];
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      // If the value is an array, add its elements to the result
      result.push(...obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      result.push(
        ...Object.values(obj[key]).flatMap((value) =>
          typeof value === "object" && value !== null
            ? Object.values(value)
            : value,
        ),
      );
    } else {
      // If it's not an array, just add the value
      result.push(obj[key]);
    }
  }
  return result;
}

function getSupportedArrayOfObjectIds() {
  const obj = getConstNotSyncing;
  let result = [];
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      // If the value is an array, add its elements to the result
      result.push(...obj[key]);
    } else {
      // If it's not an array, just add the value
      result.push(obj[key]);
    }
  }
  return result;
}

function isObject(obj) {
  if (
    typeof obj === "object" &&
    obj !== undefined &&
    obj !== null &&
    !Array.isArray(obj)
  ) {
    return true;
  } else {
    return false;
  }
}

function processStyles(styles) {
  const displayNoneSelectors = [];
  const customStyles = [];

  styles.forEach((style) => {
    if (style.includes("!important")) {
      customStyles.push(style);
    } else {
      displayNoneSelectors.push(style);
    }
  });

  let finalCss = "";

  if (displayNoneSelectors.length > 0) {
    finalCss +=
      displayNoneSelectors.join(",\n") + " {\n  display: none !important;\n}\n";
  }

  if (customStyles.length > 0) {
    finalCss += customStyles.join("\n");
  }

  return finalCss;
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

function sendShowTimerModalDraggble(categoryId) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      action: `socialFocus_${categoryId}_daily_limit_show_timer_draggable`,
    });
  });
}

function sendShowTimerModal(categoryId) {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      action: `socialFocus_${categoryId}_daily_limit_show_timer`,
    });
  });
}

function reSnapshotRuntimeConfig({ categoryIdArray, isNeedReload } = {}) {
  browser.storage.local.get(
    [
      getConst.optionsState,
      getConst.remoteOptionsData,
      getConst.runtimeSnapshot,
    ],
    function (obj) {
      const { css: prevCss = {}, flags: prevFlags = {} } =
        obj[getConst.runtimeSnapshot] ?? {};

      const allOptionsStateByCategory = obj[getConst.optionsState] ?? {};

      const {
        desktop: settingsStylesArrayDesktop = [],
        mobile: settingsStylesArrayMobile = [],
      } = obj[getConst.remoteOptionsData] ?? {};

      const settingsStylesArray = [
        ...settingsStylesArrayDesktop,
        ...settingsStylesArrayMobile,
      ];

      const nextCss = { ...prevCss };
      const mergedFlags = { ...prevFlags };

      function buildFlagsObject(optionsState) {
        const result = {};

        const activeMasterToggleId = flagsIdArray.find(
          (id) => id.includes("master_toggle") && optionsState[id],
        );

        flagsIdArray.forEach((id) => {
          if (!(id in optionsState)) return;

          if (activeMasterToggleId) {
            result[id] = id === activeMasterToggleId ? optionsState[id] : false;
            return;
          }

          result[id] = optionsState[id];
        });

        return result;
      }

      function buildCssArrayForCategory(optionsState) {
        const isTesterStyles =
          allOptionsStateByCategory[getConst.isTesterRelease] ?? false;

        const newCssSet = new Set();

        settingsStylesArray.forEach((settingItem) => {
          const settingId = settingItem.settings_id;

          if (!(settingId in optionsState)) return;
          if (!optionsState[settingId]) return;

          const styles = isTesterStyles
            ? settingItem.tester_styles
            : settingItem.styles;

          if (!Array.isArray(styles) || !styles.length) return;

          styles.forEach((style) => {
            if (typeof style === "string") {
              if (style) newCssSet.add(style);
              return;
            }

            if (isObject(style)) {
              if (style.id !== optionsState[settingId]) return;

              const innerStylesArray = Array.isArray(style.styles)
                ? style.styles
                : [];

              innerStylesArray.forEach((innerStyle) => {
                if (innerStyle) newCssSet.add(innerStyle);
              });
            }
          });
        });

        return processStyles(Array.from(newCssSet));
      }

      categoryIdArray.forEach((oneCategoryId) => {
        const optionsState = allOptionsStateByCategory[oneCategoryId] ?? {};

        const categoryFlags = buildFlagsObject(optionsState);
        const categoryCssArray = buildCssArrayForCategory(optionsState);

        nextCss[oneCategoryId] = categoryCssArray;
        Object.assign(mergedFlags, categoryFlags);
      });

      setToStorage(
        getConst.runtimeSnapshot,
        {
          css: nextCss,
          flags: mergedFlags,
        },
        function () {
          sendApplyRuntimeSignal(isNeedReload);
        },
      );
    },
  );
}

function notEqualDefaultValue(value) {
  return (
    value !== false &&
    value !== "" &&
    value !== "0" &&
    value !== "default" &&
    value !== "hqdefault" &&
    value !== null &&
    value !== undefined &&
    value !== "auto" &&
    value !== "off" &&
    (!Array.isArray(value) || value.length > 0) &&
    (typeof value !== "object" ||
      value === null ||
      Object.keys(value).length > 0)
  );
}

function filterObjectRecursively(obj, key) {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (typeof obj !== "object") {
    return key === getConstNotSyncing.isUserPro || notEqualDefaultValue(obj)
      ? obj
      : undefined;
  }

  if (Array.isArray(obj)) {
    const filtered = obj
      .map((item) => filterObjectRecursively(item))
      .filter((item) => item !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }

  const result = {};
  for (const objKey of Object.keys(obj)) {
    const filteredValue = filterObjectRecursively(obj[objKey], objKey);
    if (filteredValue !== undefined) {
      result[objKey] = filteredValue;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// Set Route Buttons

const allRouteButtons = document.querySelectorAll(".routerButton");

for (const routeButton of allRouteButtons) {
  routeButton.addEventListener("click", function () {
    const destination = routeButton.getAttribute("routeto");

    // Remove all active states

    const allAppScreens = document.querySelectorAll(".appScreen");
    for (const screen of allAppScreens) {
      screen.removeAttribute("active");
    }

    // Remove all info blocks

    const allInfoBlocks = document.querySelectorAll(".subScreenInfo");

    for (const infoBlock of allInfoBlocks) {
      infoBlock.removeAttribute("active");
    }

    // Set active

    queryById(destination).setAttribute("active", "");
  });
}

// Click on question mark button

const allQuestionButtons = document.querySelectorAll(
  ".subScreenNavigation .infoButton",
);

for (const questionButton of allQuestionButtons) {
  const infoBlock = questionButton.parentNode.querySelector(".subScreenInfo");

  questionButton.addEventListener("click", function () {
    if (infoBlock.hasAttribute("active")) {
      infoBlock.removeAttribute("active");
    } else {
      infoBlock.setAttribute("active", "");
    }
  });
}

const allInfoBlocks = document.querySelectorAll(".subScreenInfo");

for (const infoBlock of allInfoBlocks) {
  infoBlock.addEventListener("click", function () {
    infoBlock.removeAttribute("active");
  });
}
