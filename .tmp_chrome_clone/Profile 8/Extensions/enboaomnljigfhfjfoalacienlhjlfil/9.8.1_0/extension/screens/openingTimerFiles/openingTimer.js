(function () {
  // MARK: - Actions

  // Click on Activate Button

  document
    .querySelectorAll("#openingTimerSetButton, #openingTimerUpdateButton")
    .forEach((element) => {
      element.onclick = function () {
        browser.storage.local.get(getConst.system, function (obj) {
          const systemState = obj[getConst.system] ?? {};
          const extensionUiState = systemState[getConst.extensionUiState] ?? {};

          // Opening Timer Value

          const openingTimerValue = queryById(
            "openingTimerDurationSelect",
          ).value;

          // Opening Timer Message

          const openingTimerMessage = queryById("openingTimerMessage").value;

          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.extensionUiState]: {
                ...extensionUiState,
                [getConst.openingTimerIsActiveData]: true,
                [getConst.openingTimerValueData]: openingTimerValue,
                [getConst.openingTimerMessageData]: openingTimerMessage,
              },
            },
          });

          queryById("openingTimer-bottomButtons").setAttribute("active", "");

          queryById("launchDelayState").setAttribute("active", "");
        });
      };
    });

  // Deactivate Button

  queryById("openingTimerDestructButton").onclick = function () {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const extensionUiState = systemState[getConst.extensionUiState] ?? {};

      queryById("launchDelayState").removeAttribute("active");

      queryById("openingTimer-bottomButtons").removeAttribute("active", "");

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.extensionUiState]: {
            ...extensionUiState,
            [getConst.openingTimerIsActiveData]: false,
          },
        },
      });
    });
  };

  // Click on row with select

  const intervalItems = querySelectorAll(
    "#openingTimerScreen .modernFormBlockItemsWrapper:has(select)",
  );

  for (const index in intervalItems) {
    const item = intervalItems[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }
})();
