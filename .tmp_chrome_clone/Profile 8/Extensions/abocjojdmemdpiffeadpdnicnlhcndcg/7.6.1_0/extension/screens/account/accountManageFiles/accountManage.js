(function () {
  // MARK: - Actions

  // Click on Log Out

  queryById("proLogOutButton").onclick = function () {
    browser.storage.local.get(
      [getConstNotSyncing.notSyncingState, getConst.system],
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const systemState = obj[getConst.system] ?? {};
        const sharedState = systemState[getConst.sharedState] ?? {};

        if (isBrowserSafari()) {
          return;
        } else {
          // Set to storage

          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.isUserPro]: false,
            [getConstNotSyncing.isCloudSyncingData]: "off",
            [getConstNotSyncing.pro_usernameData]: "",
            [getConstNotSyncing.pro_passwordData]: "",
          });

          // Update isLogin state

          setSystemConfigStorage({
            systemState,
            newState: {
              [getConst.sharedState]: {
                ...sharedState,
                [getConst.userUniqueIdentifier]: "",
              },
            },
          });

          document.documentElement.setAttribute("isLogin", "false");
          document.documentElement.setAttribute("isPRO", "false");
          queryById("userLoginEmail").innerHTML = "";
          app_isLogin = "false";
          app_isPRO = "false";

          // Back to More screen

          showScreen("moreScreen");
        }
      },
    );
  };

  // Update Login

  // function hideUpdateLoginMessages() {
  //   queryById("updateLoginError").style.display = "none";
  //   queryById("updateLoginSuccess").style.display = "none";
  // }

  // function showUpdateLoginError(text) {
  //   hideUpdateLoginMessages();

  //   queryById("updateLoginError").innerHTML = text;
  //   queryById("updateLoginError").style.display = "block";
  // }

  // function showUpdateLoginSucess(text) {
  //   hideUpdateLoginMessages();

  //   queryById("updateLoginSuccess").innerHTML = text;
  //   queryById("updateLoginSuccess").style.display = "block";
  // }

  // document
  //   .querySelector(".updateEmailForm")
  //   .addEventListener("submit", function (event) {
  //     // Prevent the default form submission behavior

  //     event.preventDefault();

  //     const newEmail = queryById("accountManageEmail").value;

  //     browser.storage.local.get(
  //       [
  //         getConstNotSyncing.pro_usernameData,
  //         getConstNotSyncing.pro_passwordData,
  //       ],
  //       function (obj) {
  //         const oldEmail = obj[getConstNotSyncing.pro_usernameData] ?? "";
  //         const password = obj[getConstNotSyncing.pro_passwordData] ?? "";

  //         serverUpdateLogin(newEmail, oldEmail, password)
  //           .then((result) => {
  //             // Handle result
  //             if (result == "Updated") {
  //               // Set to storage
  //               setToStorage(
  //                 getConstNotSyncing.pro_usernameData,
  //                 newEmail,
  //                 function () {}
  //               );

  //               // Set to Log Out Info
  //               queryById("userLoginEmail").innerHTML = newEmail;

  //               // Show Success
  //               showUpdateLoginSucess(result);
  //             } else {
  //               showUpdateLoginError(result);
  //             }
  //           })
  //           .catch((error) => {
  //             // Handle errors here
  //             showUpdateLoginError("Error: " + error);
  //           });
  //       }
  //     );
  //   });

  // Update Password

  function hideUpdatePasswordMessages() {
    queryById("updatePasswordError").style.display = "none";
    queryById("updatePasswordSuccess").style.display = "none";
  }

  function showUpdatePasswordError(text) {
    hideUpdatePasswordMessages();

    queryById("updatePasswordError").innerHTML = text;
    queryById("updatePasswordError").style.display = "block";
  }

  function showUpdatePasswordSucess(text) {
    hideUpdatePasswordMessages();

    queryById("updatePasswordSuccess").innerHTML = text;
    queryById("updatePasswordSuccess").style.display = "block";
  }

  document
    .querySelector(".updatePasswordForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      if (isBrowserSafari()) {
        return;
      } else {
        // Prevent the default form submission behavior

        const newPassword = queryById("accountManagePassword").value;
        const confirmPassword = queryById("accountManageConfirmPassword").value;

        browser.storage.local.get(
          [getConst.system, getConstNotSyncing.notSyncingState],
          function (obj) {
            const systemState = obj[getConst.system] ?? {};

            const notSyncingState =
              obj[getConstNotSyncing.notSyncingState] ?? {};

            const sharedState = systemState[getConst.sharedState] ?? {};

            const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";
            const password =
              notSyncingState[getConstNotSyncing.pro_passwordData] ?? "";

            if (newPassword === confirmPassword) {
              serverUpdatePassword(newPassword, uuid, password)
                .then((result) => {
                  // Handle result
                  if (result == "Updated") {
                    // Set to storage

                    setToStorageWithoutSync(
                      getConstNotSyncing.notSyncingState,
                      {
                        ...notSyncingState,
                        [getConstNotSyncing.pro_passwordData]: newPassword,
                      },
                    );

                    // Show Success
                    showUpdatePasswordSucess(result);
                  } else {
                    showUpdatePasswordError(result);
                  }
                })
                .catch((error) => {
                  // Handle errors here
                  showUpdatePasswordError("Error: " + error);
                });
            } else {
              showUpdatePasswordError(
                "Error: The new password does not match the confirm password",
              );
            }
          },
        );
      }
    });
})();
