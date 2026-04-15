function showSignUpError(text) {
  queryById("signUpError").textContent = text;
  queryById("signUpError").style.display = "block";
}

function signUpAfterEmailVerified(email, uuid, password) {
  requestUserFromDb(uuid).then((result) => {
    browser.storage.local.get(
      [getConst.system, getConstNotSyncing.notSyncingState],
      function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const sharedState = systemState[getConst.sharedState] ?? {};

        const isNeedRedirect =
          notSyncingState[getConstNotSyncing.isGetUnlimitedProPlanNonAuth] ??
          false;

        const encodedEmail = encodeURIComponent(email);
        const encodeUUID = encodeURIComponent(uuid);

        if (isNeedRedirect) {
          const redirectUrl = `https://untrap.app/offer?email=${encodedEmail}&uuid=${encodeUUID}`;

          window.open(redirectUrl, "_blank");
        }

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.sharedState]: {
              ...sharedState,
              [getConst.userUniqueIdentifier]: uuid,
            },
          },
        });

        // Update isLogin state
        document.documentElement.setAttribute("isLogin", "true");
        app_isLogin = "true";
        // Update isPRO state
        if (result.user.isPRO === 1) {
          document.documentElement.setAttribute("isPRO", "true");
          app_isPRO = "true";
        } else {
          document.documentElement.setAttribute("isPRO", "false");
          app_isPRO = "false";
        }
        // Set to Log Out Info
        queryById("userLoginEmail").innerHTML = email;
        // Back to More Screen
        showScreen("moreScreen");
        // Clean
        queryById("proSignUpEmail").value = "";
        queryById("proSignUpPassword").value = "";
        queryById("signUpError").style.display = "none";

        setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
          ...notSyncingState,
          [getConstNotSyncing.pro_usernameData]: email,
          [getConstNotSyncing.pro_passwordData]: password,
          [getConstNotSyncing.temporary_username]: "",
          [getConstNotSyncing.temporary_password]: "",
          [getConstNotSyncing.temporary_uuid]: "",
          [getConstNotSyncing.isShowVerificationScreen]: false,
          [getConstNotSyncing.emailVerificationType]: "",
          [getConstNotSyncing.isGetUnlimitedProPlanNonAuth]: false,
        });
        // Set fields
        setEmailPasswordFromStorage();
        // Try to sync
        tryToSyncFromServer();
      },
    );
  });
}

document
  .querySelector(".signUpForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    browser.storage.local.get(
      getConstNotSyncing.notSyncingState,
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        if (isBrowserSafari()) {
          return;
        } else {
          const signUpSubmitButtonElement = queryById("signUpButton");

          const email = queryById("proSignUpEmail").value;

          const password = queryById("proSignUpPassword").value;
          const confirmPassword = queryById("proSignUpConfirmPassword").value;

          signUpSubmitButtonElement.setAttribute("disabled", "");

          if (password === confirmPassword) {
            serverSignUp(email, password)
              .then((signUpResult) => {
                if (signUpResult.message === "Created") {
                  sendVerificationCode(signUpResult.uuid)
                    .then((result) => {
                      if (result.message === "Verification code sent") {
                        setToStorageWithoutSync(
                          getConstNotSyncing.notSyncingState,
                          {
                            ...notSyncingState,
                            [getConstNotSyncing.temporary_username]: email,
                            [getConstNotSyncing.temporary_password]: password,
                            [getConstNotSyncing.temporary_uuid]:
                              signUpResult.uuid,
                            [getConstNotSyncing.isShowVerificationScreen]: true,
                            [getConstNotSyncing.emailVerificationType]:
                              "signUp",
                          },
                        );

                        showScreen("emailVerification");

                        signUpSubmitButtonElement.removeAttribute("disabled");

                        queryById("emailVerification").setAttribute(
                          "typeOfVerification",
                          "signUp",
                        );

                        document.querySelector(
                          ".verification-text",
                        ).textContent = email;
                      } else {
                        showSignUpError(result.error);
                        signUpSubmitButtonElement.removeAttribute("disabled");
                      }
                    })
                    .catch((error) => {
                      showSignUpError("Error: " + error.message);
                      signUpSubmitButtonElement.removeAttribute("disabled");
                    });
                } else {
                  showSignUpError(signUpResult.message);
                  signUpSubmitButtonElement.removeAttribute("disabled");
                }
              })
              .catch((error) => {
                signUpSubmitButtonElement.removeAttribute("disabled");
              });
          } else {
            showSignUpError(
              "Error: Password does not match the confirm password",
            );
            signUpSubmitButtonElement.removeAttribute("disabled");
          }
        }
      },
    );
  });
