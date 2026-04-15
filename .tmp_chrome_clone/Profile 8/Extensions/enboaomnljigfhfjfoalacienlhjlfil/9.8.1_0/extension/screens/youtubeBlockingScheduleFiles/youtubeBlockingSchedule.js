(function () {
  // MARK: - Actions

  // Click on row with select

  const intervalItems = querySelectorAll(
    "#youtubeBlockingScheduleScreen .intervalItem",
  );

  for (const index in intervalItems) {
    const item = intervalItems[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }

  // Click add additional interval

  queryById("addAdditionalInterval").onclick = function () {
    queryById("additionalIntervalRow").style.display = "flex";
    queryById("addAdditionalInterval").style.display = "none";
  };

  // Click remove additional interval

  queryById("deleteAdditionalInterval").onclick = function () {
    queryById("additionalIntervalRow").style.display = "none";
    queryById("addAdditionalInterval").style.display = "flex";
  };

  // Change interval time select

  const intervalSelects = querySelectorAll(
    "#youtubeBlockingScheduleScreen .intervalItem select",
  );

  for (var i = 0; i < intervalSelects.length; i++) {
    const select = intervalSelects[i];
    select.onchange = function () {
      const firstFrom = queryById("scheduleTimesFirstSelectFrom").value;
      const firstTo = queryById("scheduleTimesFirstSelectTo").value;
      const secondFrom = queryById("scheduleTimesSecondSelectFrom").value;
      const secondTo = queryById("scheduleTimesSecondSelectTo").value;
    };
  }

  // Click on set schedule

  function collectAllDataToStorage() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      // Time Intervals

      const timeIntervals = [];

      const firstIntervalFrom = queryById("scheduleTimesFirstSelectFrom").value;
      const firstIntervalTo = queryById("scheduleTimesFirstSelectTo").value;

      timeIntervals.push({ from: firstIntervalFrom, to: firstIntervalTo });

      // Second Time Interval Data

      if (queryById("additionalIntervalRow").style.display == "flex") {
        const secondIntervalFrom = queryById(
          "scheduleTimesSecondSelectFrom",
        ).value;
        const secondIntervalTo = queryById("scheduleTimesSecondSelectTo").value;

        timeIntervals.push({ from: secondIntervalFrom, to: secondIntervalTo });
      }
      // Days

      var daysArray = [];

      const daysButtons = document.querySelectorAll(
        "#scheduleDaysWrapper .scheduleDay",
      );

      for (var i = 0; i < daysButtons.length; i++) {
        const dayButt = daysButtons[i];

        if (dayButt.classList.contains("active")) {
          daysArray.push(dayButt.getAttribute("day-id"));
        }
      }

      // Block Extension Checkbox

      const blockExtensionCheckbox = queryById(
        "youtubeBlockingScheduleBlockExtensionCheckbox",
      ).checked;

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.youtubePageState]: {
            ...youtubePageState,
            [getConst.youtubeBlockingScheduleDaysData]: daysArray,
            [getConst.youtubeBlockingScheduleBlockExtensionData]:
              blockExtensionCheckbox,
            [getConst.youtubeBlockingScheduleTimeIntervalsData]: timeIntervals,
          },
        },
      });
    });
  }

  document
    .querySelectorAll(
      "#youtubeBlockingScheduleSetBlocking, #youtubeBlockingScheduleUpdateButton",
    )
    .forEach((element) => {
      element.onclick = function () {
        browser.storage.local.get(getConst.system, function (obj) {
          const systemState = obj[getConst.system] ?? {};
          const youtubePageState = systemState[getConst.youtubePageState] ?? {};

          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.youtubePageState]: {
                ...youtubePageState,
                [getConst.youtubeBlockingScheduleIsActiveData]: true,
              },
            },
            callback: () => {
              collectAllDataToStorage();
              checkIfBlockedScheduled();

              queryById("youtubeBlockingSchedule-bottomButtons").setAttribute(
                "active",
                "",
              );

              queryById("youtubeScheduleBlockingStatusInfo").setAttribute(
                "active",
                "",
              );
            },
          });
        });
      };
    });

  // Click on remove schedule

  queryById("youtubeBlockingScheduleDestructButton").onclick = function () {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.youtubePageState]: {
            ...youtubePageState,
            [getConst.youtubeBlockingScheduleIsActiveData]: false,
          },
        },
        callback: () => {
          queryById("youtubeBlockingSchedule-bottomButtons").removeAttribute(
            "active",
            "",
          );

          queryById("youtubeScheduleBlockingStatusInfo").removeAttribute(
            "active",
            "",
          );
        },
      });
    });
  };
})();
