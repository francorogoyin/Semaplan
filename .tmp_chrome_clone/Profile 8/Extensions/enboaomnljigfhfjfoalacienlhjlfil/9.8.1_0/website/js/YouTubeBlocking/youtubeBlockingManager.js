(function () {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const blockedByUnTrap = youtubePageState[getConst.blockedByUnTrap] ?? false;

    if (blockedByUnTrap) {
      document.documentElement.style.setProperty(
        "overflow",
        "hidden",
        "!important",
      );
    } else {
      document.documentElement.style.setProperty(
        "overflow",
        "initial",
        "!important",
      );
    }
  });
  // MARK: - Methods

  // Show Temporary Block Youtube Message

  function blockTemporaryYoutube(finishDate) {
    const day = addZeroPrefix(finishDate.getDate());
    const month = addZeroPrefix(finishDate.getMonth() + 1);
    const year = finishDate.getFullYear();
    const hours = addZeroPrefix(finishDate.getHours());
    const minutes = addZeroPrefix(finishDate.getMinutes());

    var stringToDisplay =
      "You will be able to use the website from " +
      hours +
      ":" +
      minutes +
      " " +
      day +
      "." +
      month +
      "." +
      year;

    document.documentElement.innerHTML =
      "<div id='youtubeBlockedBox'><div class='temporaryLockedIcon'></div><p class='temporaryLockedHeadline'>Access Denied</p><p class='temporaryLockedSubhedline'>" +
      stringToDisplay +
      "</p></div>";
  }

  function stopTemporaryBlocking() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.youtubePageState]: {
            ...youtubePageState,
            [getConst.youtubeBlockingTemporaryIsActiveData]: false,
            [getConst.blockedByUnTrap]: false,
          },
        },
      });
    });
  }

  // Show Schedule Block Youtube Message

  function blockScheduleYoutube(days, times) {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      var stringToDisplay = days.join(", ");

      if (times.length > 1) {
        stringToDisplay += "<br>" + times[0].from + " - " + times[0].to;
        stringToDisplay += "<br>" + times[1].from + " - " + times[1].to;
      } else {
        stringToDisplay += "<br>" + times[0].from + " - " + times[0].to;
      }

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.youtubePageState]: {
            ...youtubePageState,
            [getConst.blockedByUnTrap]: true,
          },
        },
      });

      document.documentElement.innerHTML =
        "<div id='youtubeBlockedBox'><div class='temporaryLockedIcon'></div><p class='temporaryLockedHeadline'>Access Denied</p><p class='temporaryLockedSubhedline'>" +
        stringToDisplay +
        "</p></div>";
    });
  }

  // Check IF Blocked by Focus Session

  function checkIfNeedToBlockWebsiteTemporary() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      const temporaryBlockingIsActive =
        youtubePageState[getConst.youtubeBlockingTemporaryIsActiveData];

      if (temporaryBlockingIsActive == true) {
        const currentDate = new Date();
        const startDate = new Date(
          youtubePageState[getConst.youtubeBlockingTemporaryStartDateData],
        );
        const duration =
          youtubePageState[getConst.youtubeBlockingTemporaryDurationData];

        const finishDate = addSeconds(startDate, duration);

        if (currentDate < finishDate) {
          blockTemporaryYoutube(finishDate);
        } else {
          stopTemporaryBlocking();
        }
      }
    });
  }

  // Check IF Blocked by Schedule Session

  function checkIfNeedToBlockWebsiteBySchedule() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      const scheduleBlockingActive =
        youtubePageState[getConst.youtubeBlockingScheduleIsActiveData];

      if (scheduleBlockingActive == true) {
        // Check by blocking days

        const currentTime = new Date();

        const blockingDays =
          youtubePageState[getConst.youtubeBlockingScheduleDaysData];
        const currentDayOfWeek = DAYS[currentTime.getDay()];

        if (blockingDays.includes(currentDayOfWeek)) {
          // Check by time intervals

          const blockedIntervals =
            youtubePageState[
              getConst.youtubeBlockingScheduleTimeIntervalsData
            ] ?? [];

          blockedIntervals.some((interval) => {
            const fromTimeString =
              currentTime.toDateString() + " " + interval.from;
            const toTimeString = currentTime.toDateString() + " " + interval.to;

            let fromTime = new Date(fromTimeString);
            let toTime = new Date(toTimeString);

            if (toTime < fromTime) {
              // Another Day like 23:00 to 13:00
              if (currentTime <= toTime) {
                blockScheduleYoutube(blockingDays, blockedIntervals);
              }
            } else {
              if (currentTime >= fromTime && currentTime <= toTime) {
                blockScheduleYoutube(blockingDays, blockedIntervals);
              }
            }
          });
        }
      }
    });
  }

  function checkIfNeedToBlockWebsite() {
    checkIfNeedToBlockWebsiteBySchedule();
    checkIfNeedToBlockWebsiteTemporary();
  }

  checkIfNeedToBlockWebsite();

  // Recurrently check if blocked by schedule

  setInterval(function () {
    // checkIfNeedToBlockWebsite();
  }, 30000);
})();
