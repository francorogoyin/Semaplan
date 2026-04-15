(function () {
  // MARK: - Actions

  // Password Reset Activate Tapped

  queryById("passwordResetActivateButton").onclick = function () {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const extensionUiState = systemState[getConst.extensionUiState] ?? {};

      const passwordLockingResetPeriod =
        extensionUiState[getConst.passwordLockingResetPeriodData] ?? 9;

      if (passwordLockingResetPeriod != 0) {
        const foundObject = resetDurationVariants.find(
          (obj) => obj.id == passwordLockingResetPeriod,
        );

        if (foundObject) {
          // Get the current date
          const currentDate = new Date();

          // Amount of time to add in minutes
          const minutesToAdd = foundObject.amountInMin;

          // Calculate the new date by adding minutes
          const newDate = new Date(
            currentDate.getTime() + minutesToAdd * 60000,
          );

          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.extensionUiState]: {
                ...extensionUiState,
                [getConst.passwordLockingResetIsActiveData]: true,
                [getConst.passwordLockingResetFinalDateData]:
                  newDate.toISOString(),
              },
            },
          });

          showScreen("passwordUnlockingScreen");

          // Hide Reset Button and show Reset Date

          queryById("passwordUnlockingResetPasswordButton").style.display =
            "none";

          queryById("passwordUnlockingResetDateDisplaying").style.display =
            "block";
          queryById("passwordUnlockingResetDateDisplaying").innerHTML =
            "Password Reset Date: " + newDate.toLocaleString();
        }
      }
    });
  };
})();
