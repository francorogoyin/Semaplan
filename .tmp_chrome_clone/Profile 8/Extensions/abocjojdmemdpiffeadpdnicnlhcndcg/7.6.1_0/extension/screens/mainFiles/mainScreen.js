(function () {
  // MARK: - Category Picker

  queryById("activeCategoryButton").onclick = function () {
    var isShowing = queryById("mainScreen").getAttribute(
      "categoryPickerIsShowing",
    );
    queryById("mainScreen").setAttribute(
      "categoryPickerIsShowing",
      isShowing == "false",
    );
  };

  // MARK: - Router

  function showUnlockScreen() {
    queryById("unlockPasswordTextField").classList.remove("error");
    queryById("unlockPasswordTextField").value = "";
    queryById("wrongProtectionPasswordError").style.display = "none";
    showScreen("unlockScreen");
  }

  // MARK: - Power Button

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

  function environmentValidationListener(changes) {
    const values = getChangedValues(
      changes,
      getConstNotSyncing.notSyncingState,
      getConstNotSyncing.pro_usernameData,
    );

    if (!values) return;

    const { newValue, oldValue } = values;
    if (newValue === oldValue) return;

    checkForSpecialUsers(newValue);
  }

  // Set State

  const plusButtons = document.querySelectorAll(".proButton");
  const mainScreenPlusButton = document.querySelector("#mainScreen .proButton");

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
      }
      plusButtons.forEach((item) => {
        item.setAttribute("gradient", `${gradientIndex}`);
      });
    });
  }

  validateGradientColor();

  mainScreenPlusButton.addEventListener("click", () => {
    showScreen("plusPromoScreen");
  });

  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const status =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    document.documentElement.setAttribute("disabled", status != true);
  });

  browser.storage.onChanged.addListener(blockExtensionListener);

  browser.storage.onChanged.addListener(environmentValidationListener);

  // Click

  queryById("powerButton").onclick = function () {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
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
})();
