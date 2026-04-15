(function () {
  let intervalId;
  const currentLocation = window.location.href;

  const extensionBlockTimeKey = getConstNotSyncing.extensionBlockTime;
  const extensionBlockLastedTimeKey =
    getConstNotSyncing.extensionBlockLastedTime;

  document.addEventListener("DOMContentLoaded", () => {
    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const extensionBlockLimitDuration =
          notSyncingState[extensionBlockTimeKey];
        let extensionBlockLimitLastedTime =
          notSyncingState[extensionBlockLastedTimeKey];

        if (
          extensionBlockLimitDuration !== undefined &&
          extensionBlockLimitLastedTime !== undefined &&
          extensionBlockLimitDuration !== 0
        ) {
          if (
            extensionBlockLimitLastedTime <=
            getSecondsFromMinutes(extensionBlockLimitDuration)
          ) {
            stopTimer();
            startExtensionBlockingTimer();
          }
        }
      },
    );
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "startBlockingExtension") {
      stopTimer();
      startExtensionBlockingTimer();
    }
  });

  function stopTimer() {
    clearInterval(intervalId);
  }

  function startExtensionBlockingTimer() {
    if (currentLocation.includes("news.ycombinator.com")) {
      document.documentElement.setAttribute("socialFocus_global_enable", false);
    }

    intervalId = setInterval(() => {
      browser.storage.local.get(
        getConstNotSyncing.notSyncingState,
        function (obj) {
          const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

          const extensionBlockLimitDuration =
            notSyncingState[extensionBlockTimeKey] ?? null;
          let extensionBlockLimitLastedTime =
            notSyncingState[extensionBlockLastedTimeKey] ?? null;

          if (
            extensionBlockLimitDuration === 0 ||
            typeof extensionBlockLimitDuration !== "number" ||
            typeof extensionBlockLimitLastedTime !== "number"
          ) {
            stopTimer();
          } else {
            extensionBlockLimitLastedTime++;

            setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
              ...notSyncingState,
              [getConstNotSyncing.extensionBlockLastedTime]:
                extensionBlockLimitLastedTime,
            });

            if (
              extensionBlockLimitLastedTime >=
              getSecondsFromMinutes(extensionBlockLimitDuration)
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
          [getConstNotSyncing.extensionIsEnabledData]: true,
          [extensionBlockTimeKey]: 0,
          [extensionBlockLastedTimeKey]: 0,
        });

        if (currentLocation.includes("news.ycombinator.com")) {
          document.documentElement.setAttribute(
            "socialFocus_global_enable",
            true,
          );
        }
      },
    );
  }
})();
