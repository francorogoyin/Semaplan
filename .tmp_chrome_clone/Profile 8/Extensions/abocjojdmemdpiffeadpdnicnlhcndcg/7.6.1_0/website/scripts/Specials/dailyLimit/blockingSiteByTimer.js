let intervalId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (websiteObject) {
    initSiteTimeSpendLimit(websiteObject.name);
  }
});

function initSiteTimeSpendLimit(websiteName) {
  const limitDurationKey = getConst.dailyLimitDuration[websiteName];
  const lastedTimeKey = getConst.dailyLimitLastedTime[websiteName];
  const currentDate = getConst.dailyCurrentDate[websiteName];

  const dateNow = formatDate();

  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

    const dailyLimitDuration = dailyLimitState[limitDurationKey];
    let dailyLimitLastedTime = dailyLimitState[lastedTimeKey];
    const dailyLimitCurrentDate = dailyLimitState[currentDate];

    if (
      typeof dailyLimitCurrentDate === "string" &&
      typeof dateNow === "string" &&
      dailyLimitCurrentDate !== dateNow
    ) {
      dailyLimitLastedTime = 0;
    }

    if (dailyLimitDuration !== undefined) {
      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.dailyLimitData]: {
            ...dailyLimitState,
            [getConst.dailyCurrentDate[websiteName]]: dateNow,
            [getConst.dailyLimitLastedTime[websiteName]]: dailyLimitLastedTime,
          },
        },
      });
    }

    checkIfLastedTimeLessThanLimitDuration(
      dailyLimitLastedTime,
      dailyLimitDuration,
      websiteName,
    );
  });
}

function stopTimer() {
  clearInterval(intervalId);
}

function startSiteBlockingTimer(websiteName) {
  const limitDurationKey = getConst.dailyLimitDuration[websiteName];
  const lastedTimeKey = getConst.dailyLimitLastedTime[websiteName];
  const masterToggleKey = `socialFocus_${websiteName}_master_toggle`;

  intervalId = setInterval(() => {
    browser.storage.local.get(
      [getConst.system, getConst.runtimeSnapshot],
      function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

        const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

        const dailyLimitDuration = dailyLimitState[limitDurationKey];
        let dailyLimitLastedTime = dailyLimitState[lastedTimeKey];
        const masterToggle = flags[masterToggleKey];

        if (
          dailyLimitDuration === "noLimit" ||
          masterToggle ||
          typeof dailyLimitLastedTime !== "number"
        ) {
          stopTimer();
        } else {
          dailyLimitLastedTime++;

          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.dailyLimitData]: {
                ...dailyLimitState,
                [getConst.dailyLimitLastedTime[websiteName]]:
                  dailyLimitLastedTime,
              },
            },
          });
        }

        if (
          dailyLimitLastedTime >= getSecondsFromMinutes(dailyLimitDuration) &&
          !masterToggle
        ) {
          blockingSite();
        }
      },
    );
  }, 1000);
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "startBlockingSite") {
    blockingSite();
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "startBlockingSiteTimer") {
    stopTimer();
    startSiteBlockingTimer(websiteObject.name);
  }
});

function blockingSite() {
  stopTimer();

  const element = document.querySelector("body");

  if (element) {
    (async () => {
      const replaceContent = await getBlockingContent();
      element.innerHTML = replaceContent;
    })();
  }
}

function formatDate() {
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function checkIfLastedTimeLessThanLimitDuration(
  lastedTime,
  limitDuration,
  websiteName,
) {
  if (
    limitDuration !== undefined &&
    lastedTime !== undefined &&
    limitDuration !== "noLimit"
  ) {
    if (lastedTime < getSecondsFromMinutes(limitDuration)) {
      startSiteBlockingTimer(websiteName);
    } else {
      blockingSite();
    }
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const dailyLimitDuration =
        dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];
      const dailyLimitLastedTime =
        dailyLimitState[getConst.dailyLimitLastedTime[websiteObject.name]];

      checkIfLastedTimeLessThanLimitDuration(
        dailyLimitLastedTime,
        dailyLimitDuration,
        websiteObject.name,
      );
    });
  } else {
    stopTimer();
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange);
