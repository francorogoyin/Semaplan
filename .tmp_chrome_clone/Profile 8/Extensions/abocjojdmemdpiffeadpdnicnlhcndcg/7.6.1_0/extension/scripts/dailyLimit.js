function createDailyLimitOptions(categoryId, isInit) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};
    const selected = dailyLimitState[getConst.dailyLimitDuration[categoryId]];

    const dailyLimitSelects = document.querySelectorAll(
      "#socialFocus_daily_limit",
    );

    const currentSelect = document.querySelector(
      `#mainScreen .collapsibleSection[categoryId=${categoryId}] .optionWrapper select`,
    );

    if (isInit) {
      for (const select of dailyLimitSelects) {
        for (let i = 5; i <= 500; i += 5) {
          const option = document.createElement("option");

          option.value = i;

          option.innerHTML = i;

          select.appendChild(option);
        }
      }
    }

    for (const option of currentSelect.options) {
      if (option.value == selected) {
        option.selected = true;
      }
    }
  });
}

function setBlockingSiteTimer(pickedTimeLimit, categoryId) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};

    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};
    const dailyLimitLastedTime =
      dailyLimitState[getConst.dailyLimitLastedTime[categoryId]];

    if (pickedTimeLimit === "noLimit") {
      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.dailyLimitData]: {
            ...dailyLimitState,
            [getConst.dailyLimitDuration[categoryId]]: pickedTimeLimit,
          },
        },
      });
    } else if (
      getSecondsFromMinutes(pickedTimeLimit) < Number(dailyLimitLastedTime)
    ) {
      browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          action: "startBlockingSite",
        });
      });
    } else {
      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.dailyLimitData]: {
            ...dailyLimitState,
            [getConst.dailyLimitDuration[categoryId]]: pickedTimeLimit,
          },
        },
        callback: () => {
          browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            browser.tabs.sendMessage(tabs[0].id, {
              action: "startBlockingSiteTimer",
            });
          });
        },
      });
    }
  });
}
