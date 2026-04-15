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

function setStorageByDefault() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const runtimeSnapshot = obj[getConst.runtimeSnapshot] ?? null;

    if (!runtimeSnapshot) {
      const cssStyleArray = [];
      const optionState = {};

      defaultValuesArray.forEach((item) => {
        optionState[item.id] = true;

        if (item.styles.length) {
          item.styles.forEach((style) => {
            cssStyleArray.push(style);
          });
        }
      });

      const cssNormalizingArray = processStyles(cssStyleArray);

      setToStorage(
        getConst.runtimeSnapshot,
        {
          css: cssNormalizingArray,
          flags: {},
        },
        function () {
          setToStorage(getConst.optionsState, optionState, function () {
            migrationFromOldToNewStoreScript();
          });
        },
      );
    } else {
      migrationFromOldToNewStoreScript();
    }
  });
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
    const storageYoutubePageState =
      storageSystemState[getConst.youtubePageState] ?? {};
    const storageSummarizeState =
      storageSystemState[getConst.summarizeWindowState] ?? {};

    const storageMetaInitDateState = storageMetaState[getConst.init] ?? {};
    const storageMetaScheduleState =
      storageMetaState[getConst.updateSchedule] ?? {};

    const optionState = {};
    const notSyncingState = {};
    const sharedState = {};
    const metaState = {};
    const initDateMetaState = {};
    const scheduleUpdateMetaState = {};
    const extensionUiState = {};
    const youtubePageState = {};
    const summarizeWindowState = {};

    const removeKeys = (keys) => {
      if (!keys || !keys.length) return;
      keys.forEach((key) => browser.storage.local.remove(key));
    };

    storeArray.forEach(({ id, value }) => {
      // skip entities that belong to the new storage structure
      if (storageEntityKeysList.includes(id)) return;

      // remove invalid values from old root keys
      if (
        (isValueValidForMigration(value) === false &&
          id !== getConstNotSyncing.isUserPro) ||
        id === getConst.settingsStylesArray ||
        id === getConst.settingsStylesArrayMobile
      ) {
        browser.storage.local.remove(id);
        return;
      }

      const optionFromList = findOptionById(id);
      const isOption = Boolean(
        optionFromList || globalOptionsList.includes(id),
      );

      switch (true) {
        // backward compatibility: undefined theme key
        case id === "undefined": {
          removeKeys(Object.keys({ [id]: value }));
          notSyncingState[getConstNotSyncing.extensionThemeData] = value;
          break;
        }

        // not syncing -> notSyncingState (by value presence in getConstNotSyncing)
        case Object.values(getConstNotSyncing).includes(id): {
          notSyncingState[id] = value;
          break;
        }

        // shared state
        case sharedStateSettingsList.includes(id): {
          sharedState[id] = value;
          break;
        }

        // meta state
        case metaStateSettingsList.includes(id): {
          metaState[id] = value;
          break;
        }

        // meta:init
        case initDateSettingsList.includes(id): {
          initDateMetaState[id] = value;
          break;
        }

        // meta:updateSchedule
        case scheduleDateSettingsList.includes(id): {
          scheduleUpdateMetaState[id] = value;
          break;
        }

        // extension ui state
        case extensionStateSettingsList.includes(id): {
          extensionUiState[id] = value;
          break;
        }

        // youtube page state
        case youtubePageStateSettingsList.includes(id): {
          youtubePageState[id] = value;
          break;
        }

        // summarize window state
        case summarizeStateSettingsList.includes(id): {
          summarizeWindowState[id] = value;
          break;
        }

        default:
          break;
      }

      // optionsState migration (kept outside switch so it can co-exist with other buckets if needed)
      if (isOption) {
        optionState[id] = value;
      }
    });

    // optionsState
    if (Object.keys(optionState).length) {
      removeKeys(Object.keys(optionState));

      storagePatch[getConst.optionsState] = {
        ...storageState,
        ...optionState,
      };

      shouldUpdate = true;
    }

    // notSyncingState
    if (Object.keys(notSyncingState).length) {
      removeKeys(Object.keys(notSyncingState));

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
      Object.keys(youtubePageState).length ||
      Object.keys(summarizeWindowState).length ||
      Object.keys(initDateMetaState).length ||
      Object.keys(scheduleUpdateMetaState).length;

    if (hasSystemUpdates) {
      removeKeys([
        ...Object.keys(sharedState),
        ...Object.keys(metaState),
        ...Object.keys(extensionUiState),
        ...Object.keys(youtubePageState),
        ...Object.keys(summarizeWindowState),
        ...Object.keys(initDateMetaState),
        ...Object.keys(scheduleUpdateMetaState),
      ]);

      const nextSharedState = Object.keys(sharedState).length
        ? { ...storageSharedState, ...sharedState }
        : storageSharedState;

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

      const nextYoutubePageState = Object.keys(youtubePageState).length
        ? { ...storageYoutubePageState, ...youtubePageState }
        : storageYoutubePageState;

      const nextSummarizeWindowState = Object.keys(summarizeWindowState).length
        ? { ...storageSummarizeState, ...summarizeWindowState }
        : storageSummarizeState;

      systemConfigPatch = {
        systemState: storageSystemState,
        newState: {
          [getConst.sharedState]: nextSharedState,
          [getConst.meta]: nextMetaState,
          [getConst.extensionUiState]: nextExtensionUiState,
          [getConst.youtubePageState]: nextYoutubePageState,
          [getConst.summarizeWindowState]: nextSummarizeWindowState,
        },
      };

      shouldUpdate = true;
    }

    if (shouldUpdate) {
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
        reSnapshotRuntimeConfig({ isNeedReload: true });
      });
    }
  });
}

function isValueValidForMigration(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value);
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

async function getUrl() {
  const tabs = await getCurrentTab();
  const currentUrl = tabs[0]?.url
    ? tabs[0]?.url
    : app_device === "phone"
      ? "https://m.youtube.com/"
      : "https://www.youtube.com/";

  return currentUrl;
}

function reSnapshotRuntimeConfig({ isNeedReload = false, optionId = "" } = {}) {
  browser.storage.local.get(
    [getConst.optionsState, getConst.remoteOptionsData],
    function (obj) {
      const optionsState = obj[getConst.optionsState];

      const isTesterStyles = optionsState[getConst.isTesterRelease] ?? false;

      const {
        desktop: settingsStylesArrayDesktop,
        mobile: settingsStylesArrayMobile,
      } = obj[getConst.remoteOptionsData] ?? {
        desktop: [],
        mobile: [],
      };

      const settingsStylesArray = [
        ...settingsStylesArrayDesktop,
        ...settingsStylesArrayMobile,
      ];

      const newCssSet = new Set();
      const newFlagsObject = {};

      flagsIdArray.forEach((item) => {
        if (item in optionsState) {
          newFlagsObject[item] = optionsState[item];
        }
      });

      settingsStylesArray.map((item) => {
        if (
          item.settings_id in optionsState &&
          optionsState[item.settings_id]
        ) {
          const styles = isTesterStyles ? item.tester_styles : item.styles;

          if (styles && styles.length) {
            styles.map((style) => {
              if (typeof style === "string") {
                if (item.settings_id === "untrap_video_page_center_content") {
                  return;
                } else {
                  if (style) {
                    newCssSet.add(style);
                  }
                }
              }

              if (isObject(style)) {
                if (style.id === optionsState[item.settings_id]) {
                  if (isObject(style.styles)) {
                    const currentSelect =
                      findOptionById(item.settings_id) ?? {};

                    if (currentSelect) {
                      if (currentSelect.dependsWithOption) {
                        const optionOnWhichDepend = findOptionById(
                          currentSelect.dependsWithOption,
                        );

                        const optionOnWhichDependValue =
                          optionsState[optionOnWhichDepend.id] ?? "default";

                        const dependOption = settingsStylesArray.find(
                          (item) => item.settings_id === optionOnWhichDepend.id,
                        );

                        const dependOptionStyle = dependOption.styles.find(
                          (item) => item.id === optionOnWhichDependValue,
                        );

                        const dependOptionStylesArray =
                          dependOptionStyle?.styles?.[style.id] ?? [];

                        const stylesArray = [
                          ...dependOptionStylesArray,
                          ...style.styles[optionOnWhichDependValue],
                        ];

                        stylesArray.map((innerStyles) => {
                          if (innerStyles) {
                            newCssSet.add(innerStyles);
                          }
                        });
                      } else {
                        const stylesArray = style.styles[style.id] ?? [];

                        stylesArray.map((innerStyles) => {
                          if (innerStyles) {
                            newCssSet.add(innerStyles);
                          }
                        });
                      }
                    }
                  } else {
                    style.styles.map((innerStyles) => {
                      if (innerStyles) {
                        if (innerStyles) {
                          newCssSet.add(innerStyles);
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        }
      });

      const cssNormalizingArray = processStyles(Array.from(newCssSet));

      setToStorage(
        getConst.runtimeSnapshot,
        {
          css: cssNormalizingArray,
          flags: newFlagsObject,
        },
        function () {
          sendApplyRuntimeSignal(isNeedReload);

          if (optionId) {
            if (optionId === "untrap_video_page_auto_theater_mode") {
              autoTheatherModeSignal();
            } else if (
              optionId === "untrap_video_page_auto_shows_chapters_in_sidebar"
            ) {
              autoShowChaptersSignal();
            }
          }
        },
      );
    },
  );
}

function getFeaturesArrayOfObjectIds() {
  const obj = getConst;
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

function unescapeString(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\\"/g, '"');
}

function processStylesObject(obj) {
  if (typeof obj === "string") {
    return unescapeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(processStylesObject);
  } else if (obj && typeof obj === "object") {
    const processed = {};
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = processStylesObject(value);
    }
    return processed;
  }
  return obj;
}

function getClearCategories(categories) {
  return categories.filter(
    (item) => item.hasOwnProperty("categoryGroups") && item.categoryGroups,
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
    return key === "untrap_is_user_pro" || notEqualDefaultValue(obj)
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
