function extensionBlockTimerHandler(blockTime, turnType) {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    if (turnType === "Off") {
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] = false;

      setToStorageWithoutSync(
        getConstNotSyncing.notSyncingState,
        notSyncingState,
        function () {
          if (blockTime === 0) {
            document.documentElement.setAttribute("disabled", true);
          } else {
            setToStorageWithoutSync(
              getConstNotSyncing.notSyncingState,
              {
                ...notSyncingState,
                [getConstNotSyncing.extensionBlockLastedTime]: 0,
              },
              function () {
                document.documentElement.setAttribute("disabled", true);

                browser.tabs.query(
                  { active: true, currentWindow: true },
                  (tabs) => {
                    browser.tabs.sendMessage(tabs[0].id, {
                      id: "socialFocus_extension_blockTime",
                      action: "startBlockingExtension",
                    });
                  },
                );
              },
            );
          }
        },
      );
    }

    if (turnType === "On") {
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] = true;

      setToStorageWithoutSync(
        getConstNotSyncing.notSyncingState,
        notSyncingState,
        function () {
          if (blockTime === 0) {
            document.documentElement.setAttribute("disabled", false);
          } else {
            setToStorageWithoutSync(
              getConstNotSyncing.notSyncingState,
              {
                ...notSyncingState,
                [getConstNotSyncing.extensionEnableLastedTime]: 0,
              },
              function () {
                document.documentElement.setAttribute("disabled", false);

                browser.tabs.query(
                  { active: true, currentWindow: true },
                  (tabs) => {
                    browser.tabs.sendMessage(tabs[0].id, {
                      id: "socialFocus_extension_enableTime",
                      action: "startEnableExtension",
                    });
                  },
                );
              },
            );
          }
        },
      );
    }
  });
}
