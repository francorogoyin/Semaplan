function accountOptionClick() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const sharedState = systemState[getConst.sharedState] ?? {};
    const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

    if (uuid) {
      showScreen("accountManageScreen");
    } else {
      showScreen("proLoginScreen");
    }
  });
}

(function () {
  const plusButtons = document.querySelectorAll(".proButton");
  const mainScreenPlusButton = document.querySelector("#moreScreen .proButton");

  //MARK: - Get Unlimited Plus Plan

  function validateGradientColor() {
    const maxNumberOfGradient = 16;
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      let gradientIndex = sharedState[getConst.gradientIndex] ?? 0;
      const gradientCurrentDate =
        sharedState[getConst.gradientCurrentDate] ?? "";

      const currentDate = new Date();
      const currentDateString = currentDate.toISOString().split("T")[0];

      if (gradientCurrentDate !== currentDateString) {
        gradientIndex++;

        if (gradientIndex > maxNumberOfGradient) {
          gradientIndex = 1;
        }

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.sharedState]: {
              ...sharedState,
              [getConst.gradientCurrentDate]: currentDateString,
              [getConst.gradientIndex]: gradientIndex,
            },
          },
        });

        plusButtons.forEach((item) => {
          item.setAttribute("gradient", `${gradientIndex}`);
        });
      } else {
        plusButtons.forEach((item) => {
          item.setAttribute("gradient", `${gradientIndex}`);
        });
        return;
      }
    });
  }

  validateGradientColor();

  mainScreenPlusButton.addEventListener("click", () => {
    showScreen("plusPromoScreen");
  });

  queryById("fromMoreToImportExport").addEventListener("click", function () {
    createStringWithSettings();
  });

  queryById("fromMoreToContentFilter").addEventListener("click", function () {
    setLabelAndPlaceholder();
    presentTabRules();
  });

  queryById("extraLinksButton").onclick = function () {
    if (queryById("appLinksWrapper").classList.contains("clicked")) {
      queryById("appLinksWrapper").classList.remove("clicked");
    } else {
      queryById("appLinksWrapper").classList.add("clicked");
    }
  };

  // MARK: - Actions

  // Click on links button

  queryById("appLinksWrapper").addEventListener("click", function (event) {
    // if (event.target.closest(".rate-app-modal-overlay")) {
    //   return;
    // }

    const popUp = document.querySelector("#moreScreen .linksPickerPopup");
    const isVisible = popUp.hasAttribute("active");

    if (isVisible) {
      popUp.removeAttribute("active");
    } else {
      popUp.setAttribute("active", "");
    }
  });

  // Click on row with select

  const itemsWithSelect = querySelectorAll(
    "#moreScreen .popUpMenuList:has(select)",
  );

  for (const index in itemsWithSelect) {
    const item = itemsWithSelect[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }

  // Change theme select

  queryById("extensionThemeSelect").onchange = function () {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const newSelectValue = queryById("extensionThemeSelect").value;

        // Update HTML attribute

        document.documentElement.setAttribute("theme", newSelectValue);

        // Update in storage

        setToStorageWithoutSync(
          getConstNotSyncing.notSyncingState,
          {
            ...notSyncingState,
            [getConstNotSyncing.extensionThemeData]: newSelectValue,
          },
          function () {
            setLanguage();
          },
        );
      },
    );
  };

  // Change lang select

  queryById("extensionLanguageSelect").onchange = function () {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const newSelectValue = queryById("extensionLanguageSelect").value;

        // Update Var

        app_language = newSelectValue;

        // Update in storage

        setToStorageWithoutSync(
          getConstNotSyncing.notSyncingState,
          {
            ...notSyncingState,
            [getConstNotSyncing.extensionLanguage]: newSelectValue,
          },
          function () {
            setLanguage();
          },
        );
      },
    );
  };

  document.querySelector(".profileInfo").onclick = function () {
    if (isBrowserSafari()) {
      return;
    } else {
      accountOptionClick();
    }
  };

  // Change iCloud Syncing select

  queryById("iCloudSyncingSelect").onchange = function () {
    const newSelectValue = queryById("iCloudSyncingSelect").value;

    browser.storage.local.get(
      [getConst.system, getConstNotSyncing.notSyncingState],
      function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const sharedState = systemState[getConst.sharedState] ?? {};
        const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

        if (uuid) {
          if (app_isPRO == "true") {
            notSyncingState[getConstNotSyncing.isCloudSyncingData] =
              newSelectValue;

            setToStorageWithoutSync(
              getConstNotSyncing.notSyncingState,
              notSyncingState,
              function () {
                if (newSelectValue == "on") {
                  setToStorageWithoutSync(
                    getConstNotSyncing.notSyncingState,
                    {
                      ...notSyncingState,
                      [getConstNotSyncing.lastSyncingDateData]: "0",
                    },
                    function () {
                      tryToSyncFromServer();
                    },
                  );
                }
              },
            );
          } else {
            queryById("iCloudSyncingSelect").value = "off";
            setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
              ...notSyncingState,
              [getConstNotSyncing.isCloudSyncingData]: "off",
            });
            showScreen("plusPromoScreen");
          }
        } else {
          queryById("iCloudSyncingSelect").value = "off";
          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.isCloudSyncingData]: "off",
          });
          if (isBrowserSafari()) {
            window.open("untrapforyt://");
          } else {
            showScreen("proLoginScreen");
          }
        }
      },
    );
  };

  // Change My Other Apps view

  document.querySelector(".popUpMenuListGroupHeaderContainer").onclick =
    function () {
      browser.storage.local.get(getConst.system, function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const sharedState = systemState[getConst.sharedState] ?? {};

        var isShowing = queryById("moreScreen").getAttribute("isShowMyApp");

        queryById("moreScreen").setAttribute(
          "isShowMyApp",
          isShowing == "false",
        );

        document.documentElement.setAttribute(
          "myOtherApps",
          isShowing === "true" ? "hide" : "showing",
        );

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.sharedState]: {
              ...sharedState,
              [getConst.myOtherAppsData]:
                isShowing === "true" ? "hide" : "showing",
            },
          },
        });
      });
    };

  function setVersionToIdeasBugsLink() {
    browser.storage.local.get(getConst.system, function (obj) {
      const ideasBugsButton = document.querySelector("#ideas-bugs-link");
      const systemState = obj[getConst.system] ?? {};
      const metaState = systemState[getConst.meta] ?? {};

      const releaseVersion =
        metaState[getConst.currentVersionOnSettingsRelease] ?? "";

      const app_version = browser.runtime.getManifest().version;

      if (releaseVersion) {
        ideasBugsButton.href = `https://untrap.app/support?version=${releaseVersion}&app_version=${app_version}`;
      }
    });
  }

  setVersionToIdeasBugsLink();
})();
