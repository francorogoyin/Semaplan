// MARK: - Launch Blocking

function scheduleBlockExtension(days, times) {
  var stringToDisplay = days.join(", ");

  if (times.length > 1) {
    stringToDisplay += "<br>" + times[0].from + " - " + times[0].to;
    stringToDisplay += "<br>" + times[1].from + " - " + times[1].to;
  } else {
    stringToDisplay += "<br>" + times[0].from + " - " + times[0].to;
  }

  queryById("scheduleBlockingDaysSpan").innerHTML = stringToDisplay;
  showScreen("scheduleLockedScreen");
}

function temporaryBlockExtension(finishDate) {
  const day = addZeroPrefix(finishDate.getDate());
  const month = addZeroPrefix(finishDate.getMonth() + 1);
  const year = finishDate.getFullYear();
  const hours = addZeroPrefix(finishDate.getHours());
  const minutes = addZeroPrefix(finishDate.getMinutes());

  var stringToDisplay =
    hours + ":" + minutes + " " + day + "." + month + "." + year;

  queryById("tempBlockingSpan").innerHTML = stringToDisplay;
  showScreen("temporaryLockedScreen");
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
        },
      },
      callback: () => {
        queryById("youtubeBlockingTemporary-bottomButtons").removeAttribute(
          "active",
        );
      },
    });
  });
}

// MARK: - Check if Need to Block

function checkIfBlockedScheduled() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const scheduleBlockingActive =
      youtubePageState[getConst.youtubeBlockingScheduleIsActiveData] ?? false;
    const shouldBlockExtension =
      youtubePageState[getConst.youtubeBlockingScheduleBlockExtensionData] ??
      false;

    if (scheduleBlockingActive && shouldBlockExtension) {
      // Check by blocking days

      const currentTime = new Date();
      const blockingDays =
        youtubePageState[getConst.youtubeBlockingScheduleDaysData];
      const currentDayOfWeek = DAYS[currentTime.getDay()];

      if (blockingDays.includes(currentDayOfWeek)) {
        // Check by time intervals

        const blockedIntervals =
          youtubePageState[getConst.youtubeBlockingScheduleTimeIntervalsData] ??
          [];

        blockedIntervals.some((interval) => {
          const fromTimeString =
            currentTime.toDateString() + " " + interval.from;
          const toTimeString = currentTime.toDateString() + " " + interval.to;

          let fromTime = new Date(fromTimeString);
          let toTime = new Date(toTimeString);

          if (toTime < fromTime) {
            // Another Day like 23:00 to 13:00
            if (currentTime <= toTime) {
              scheduleBlockExtension(blockingDays, blockedIntervals);
            }
          } else {
            if (currentTime >= fromTime && currentTime <= toTime) {
              scheduleBlockExtension(blockingDays, blockedIntervals);
            }
          }
        });
      }
    }
  });
}

function checkIfBlockedTemporary() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const youtubePageState = systemState[getConst.youtubePageState] ?? {};

    const temporaryBlockingIsActive =
      youtubePageState[getConst.youtubeBlockingTemporaryIsActiveData];
    const shouldBlockExtension =
      youtubePageState[getConst.youtubeBlockingTemporaryBlockExtensionData];

    if (temporaryBlockingIsActive == true && shouldBlockExtension == true) {
      const currentDate = new Date();
      const startDate = new Date(
        youtubePageState[getConst.youtubeBlockingTemporaryStartDateData],
      );
      const duration =
        youtubePageState[getConst.youtubeBlockingTemporaryDurationData];

      const finishDate = addSeconds(startDate, duration);

      if (currentDate < finishDate) {
        temporaryBlockExtension(finishDate);
      } else {
        stopTemporaryBlocking();
      }
    }
  });
}

function checkIfBlockedByPassword() {
  browser.storage.local.get(
    [getConstNotSyncing.notSyncingState, getConst.system],
    function (obj) {
      const currentDate = new Date();

      const systemState = obj[getConst.system] ?? {};
      const extensionUiState = systemState[getConst.extensionUiState] ?? {};

      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const lockingIsActive =
        extensionUiState[getConst.passwordLockingIsActiveData] ?? false;

      const passwordLockingResetFinalDate =
        extensionUiState[getConst.passwordLockingResetFinalDateData] ??
        currentDate;
      const passwordLockingResetIsActive =
        extensionUiState[getConst.passwordLockingResetIsActiveData] ?? false;

      const isShowVerificationScreen =
        notSyncingState[getConstNotSyncing.isShowVerificationScreen] ?? false;

      if (lockingIsActive == false) {
        if (isShowVerificationScreen) {
          showScreen("emailVerification");
        } else {
          showScreen("mainScreen");
        }
      } else {
        if (passwordLockingResetIsActive) {
          const normalPasswordLockingResetFinalDate = new Date(
            passwordLockingResetFinalDate,
          );

          if (currentDate < normalPasswordLockingResetFinalDate) {
            showScreen("passwordUnlockingScreen");
          } else {
            // Reset Password

            clearPasswordStateFull();

            showScreen("mainScreen");
          }
        } else {
          showScreen("passwordUnlockingScreen");
        }
      }
    },
  );
}

function startTimer(totalSeconds, actionCallback) {
  let secondsElapsed = 0;

  const timerInterval = setInterval(function () {
    if (secondsElapsed >= totalSeconds) {
      clearInterval(timerInterval); // Stop the timer when N seconds have elapsed
    } else {
      secondsElapsed++;
      actionCallback(secondsElapsed);
    }
  }, 1000);
}

function checkIfBlockedByOpeningTimer() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const openingTimerIsActive =
      extensionUiState[getConst.openingTimerIsActiveData] ?? false;
    const openingTimerValue =
      extensionUiState[getConst.openingTimerValueData] ?? 1;
    const openingTimerMessage =
      extensionUiState[getConst.openingTimerMessageData] ?? "";

    if (openingTimerIsActive == true) {
      if (openingTimerMessage == "") {
        queryById("openingTimerMessageDisplay").style.display = "none";
        queryById("openingTimerMessageDisplay").innerHTML = "";
      } else {
        queryById("openingTimerMessageDisplay").style.display = "block";
        queryById("openingTimerMessageDisplay").innerHTML = openingTimerMessage;
      }

      queryById("openingTimerLeftSeconds").innerHTML = openingTimerValue;

      showScreen("openingTimerWaitScreen");

      startTimer(openingTimerValue, function (secondsElapsed) {
        const leftSeconds = openingTimerValue - secondsElapsed;

        if (leftSeconds == 0) {
          otherChecks();
        } else {
          queryById("openingTimerLeftSeconds").innerHTML = leftSeconds;
        }
      });
    }
  });
}

// MARK: - Life Cycle

function otherChecks() {
  checkIfBlockedByPassword();
  checkIfBlockedTemporary();
  checkIfBlockedScheduled();
}

function checkIfNeedToBlockExtension() {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const extensionUiState = systemState[getConst.extensionUiState] ?? {};

    const openingTimerIsActive =
      extensionUiState[getConst.openingTimerIsActiveData] ?? false;

    if (openingTimerIsActive == true) {
      checkIfBlockedByOpeningTimer();
    } else {
      otherChecks();
    }
  });
}

checkIfNeedToBlockExtension();
