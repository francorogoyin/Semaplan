// MARK: - Check if Need to Block

function checkIfBlockedByPassword() {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const currentDate = new Date();

      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
      const systemState = obj[getConst.system] ?? {};

      const extensionUiState = systemState[getConst.extensionUiState] ?? {};

      const lockingIsActive =
        extensionUiState[getConst.passwordLockingIsActiveData] ?? false;
      const isShowVerificationScreen =
        notSyncingState[getConstNotSyncing.isShowVerificationScreen] ?? false;
      const passwordLockingResetFinalDate =
        notSyncingState[getConst.passwordLockingResetFinalDateData] ??
        currentDate;
      const passwordLockingResetIsActive =
        extensionUiState[getConst.passwordLockingResetIsActiveData] ?? false;

      if (!lockingIsActive) {
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

browser.storage.local.get(null, function(items) {
  console.log('Store:', items);
});
