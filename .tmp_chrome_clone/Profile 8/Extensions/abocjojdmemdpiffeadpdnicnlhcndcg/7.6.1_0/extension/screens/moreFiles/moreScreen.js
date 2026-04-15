(function () {
  // MARK: - Router

  function setHrefToSubmitButton() {
    browser.storage.local.get(
      [getConstNotSyncing.notSyncingState, getConst.system],
      function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const sharedState = systemState[getConst.sharedState] ?? {};
        const userEmail =
          notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

        const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

        const submitButton = document.querySelector(
          ".subScreenInfo .submitButton",
        );

        const encodedEmail = encodeURIComponent(userEmail);
        const encodeUUID = encodeURIComponent(uuid);

        const href = isBrowserSafari()
          ? `socialfocus://`
          : `https://socialfocus.app/offer/?email=${encodedEmail}&uuid=${encodeUUID}`;

        submitButton.setAttribute("href", href);
      },
    );
  }

  setHrefToSubmitButton();

  queryById("fromMoreToImportExport").addEventListener("click", function () {
    createStringWithSettings();
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

  queryById("appLinksWrapper").addEventListener("click", function () {
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
        setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
          ...notSyncingState,
          [getConstNotSyncing.extensionThemeData]: newSelectValue,
        });
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

  document.querySelector(".profileInfo").onclick = function () {
    if (isBrowserSafari()) {
      return;
    } else {
      accountOptionClick();
    }
  };

  queryById("iCloudSyncingSelect").onchange = function () {
    const newSelectValue = queryById("iCloudSyncingSelect").value;

    browser.storage.local.get(
      [getConstNotSyncing.notSyncingState, getConst.system],
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
            window.open("socialfocus://");
          } else {
            showScreen("proLoginScreen");
          }
        }
      },
    );
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
        ideasBugsButton.href = `https://socialfocus.app/support?version=${releaseVersion}&app_version=${app_version}`;
      }
    });
  }

  setVersionToIdeasBugsLink();

  // Remove active state from all tabs

  // function makeUnactiveAllTabs() {
  //   const filterTabs = document.querySelectorAll(
  //     "#moreScreen .segmentedPicker .option"
  //   );

  //   for (const tab of filterTabs) {
  //     tab.removeAttribute("active");
  //   }
  // }

  // Tabs click: Basic, PRO

  // const versionTabs = document.querySelectorAll(
  //   "#moreScreen .segmentedPicker .option"
  // );

  // for (const tab of versionTabs) {
  //   tab.onclick = function () {
  //     makeUnactiveAllTabs();
  //     this.setAttribute("active", "");
  //     const activeTabId = this.getAttribute("data-id");

  //     const allContainers = document.querySelectorAll(
  //       "#moreScreen .feauturesContainer"
  //     );

  //     for (const container of allContainers) {
  //       container.removeAttribute("active");
  //     }

  //     const activeContainer = document.querySelector(
  //       "#moreScreen .feauturesContainer[data-id='" + activeTabId + "']"
  //     );
  //     activeContainer.setAttribute("active", "");
  //   };
  // }
})();
