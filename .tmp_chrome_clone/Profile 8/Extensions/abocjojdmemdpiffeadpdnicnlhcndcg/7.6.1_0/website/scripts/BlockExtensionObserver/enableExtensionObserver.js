(function () {
  let intervalId;
  const currentLocation = window.location.href;

  const extensionEnableTimeKey = getConstNotSyncing.extensionEnableTime;
  const extensionEnableLastedTimeKey =
    getConstNotSyncing.extensionEnableLastedTime;

  document.addEventListener("DOMContentLoaded", () => {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const extensionEnableLimitDuration =
          notSyncingState[extensionEnableTimeKey];
        let extensionEnableLimitLastedTime =
          notSyncingState[extensionEnableLastedTimeKey];

        if (
          extensionEnableLimitDuration !== undefined &&
          extensionEnableLimitLastedTime !== undefined &&
          extensionEnableLimitDuration !== 0
        ) {
          if (
            extensionEnableLimitLastedTime <=
            getSecondsFromMinutes(extensionEnableLimitDuration)
          ) {
            stopTimer();
            startExtensionEnableTimer();
          }
        }
      },
    );
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "startEnableExtension") {
      stopTimer();
      startExtensionEnableTimer();
    }
  });

  function stopTimer() {
    clearInterval(intervalId);
  }

  function startExtensionEnableTimer() {
    if (currentLocation.includes("news.ycombinator.com")) {
      document.documentElement.setAttribute("socialFocus_global_enable", true);
    }

    intervalId = setInterval(() => {
      browser.storage.local.get(
        [getConstNotSyncing.notSyncingState, extensionEnableLastedTimeKey],
        function (obj) {
          const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

          const extensionEnableLimitDuration =
            notSyncingState[extensionEnableTimeKey] ?? null;
          let extensionEnableLimitLastedTime =
            notSyncingState[extensionEnableLastedTimeKey] ?? null;

          if (
            extensionEnableLimitDuration === 0 ||
            typeof extensionEnableLimitDuration !== "number" ||
            typeof extensionEnableLimitLastedTime !== "number"
          ) {
            stopTimer();
          } else {
            extensionEnableLimitLastedTime++;

            setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
              ...notSyncingState,
              [getConstNotSyncing.extensionEnableLastedTime]:
                extensionEnableLimitLastedTime,
            });

            if (
              extensionEnableLimitLastedTime >=
              getSecondsFromMinutes(extensionEnableLimitDuration)
            ) {
              blockingExtension();
            }
          }
        },
      );
    }, 1000);
  }

  function blockingExtension() {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        stopTimer();

        setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
          ...notSyncingState,
          [getConstNotSyncing.extensionIsEnabledData]: false,
          [extensionEnableTimeKey]: 0,
          [extensionEnableLastedTimeKey]: 0,
        });

        if (currentLocation.includes("news.ycombinator.com")) {
          document.documentElement.setAttribute(
            "socialFocus_global_enable",
            false,
          );
        }
      },
    );
  }
})();
