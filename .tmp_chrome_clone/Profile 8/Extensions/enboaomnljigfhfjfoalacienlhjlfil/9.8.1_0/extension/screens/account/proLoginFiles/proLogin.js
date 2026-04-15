function showLogInError(text) {
  queryById("logInError").textContent = text;
  queryById("logInError").style.display = "block";
}

// const signUpButtton = document.querySelector(
//   "#proLoginScreen .signUPtext span[routeto]"
// );

const loginSubmitButtonElement = queryById("logInButton");

function signInHandler(email, password) {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      serverLogIn(email, password)
        .then((signInResult) => {
          // Handle result
          if (signInResult.message == "Login") {
            // Set to storage
            setSystemConfigStorage({
              systemState,
              newState: {
                [getConst.sharedState]: {
                  ...sharedState,
                  [getConst.userUniqueIdentifier]: signInResult.uuid,
                },
              },
            });

            // Update isLogin state
            document.documentElement.setAttribute("isLogin", "true");
            app_isLogin = "true";

            // Update isPRO state

            if (signInResult.isPRO === 1) {
              document.documentElement.setAttribute("isPRO", "true");
              app_isPRO = "true";
            } else {
              document.documentElement.setAttribute("isPRO", "false");
              app_isPRO = "false";

              setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                ...notSyncingState,
                [getConstNotSyncing.isUserPro]: false,
              });
            }

            // Set to Log Out Info
            queryById("userLoginEmail").innerHTML = email;

            // Back to More Screen
            showScreen("moreScreen");

            // Clean
            queryById("proLoginEmail").value = "";
            queryById("proLoginPassword").value = "";
            queryById("logInError").style.display = "none";

            setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
              ...notSyncingState,
              [getConstNotSyncing.isUserPro]:
                signInResult.isPRO === 1 ? true : false,
              [getConstNotSyncing.pro_usernameData]: email,
              [getConstNotSyncing.pro_passwordData]: password,
              [getConstNotSyncing.temporary_username]: "",
              [getConstNotSyncing.temporary_password]: "",
              [getConstNotSyncing.temporary_uuid]: "",
              [getConstNotSyncing.isShowVerificationScreen]: false,
              [getConstNotSyncing.emailVerificationType]: "",
            });

            // Set fields
            setEmailPasswordFromStorage();

            // Try to sync
            tryToSyncFromServer();
          } else if (signInResult.message === "Your email not verified") {
            sendVerificationCode(signInResult.uuid)
              .then((result) => {
                if (result.message === "Verification code sent") {
                  setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                    ...notSyncingState,
                    [getConstNotSyncing.temporary_username]: email,
                    [getConstNotSyncing.temporary_password]: password,
                    [getConstNotSyncing.temporary_uuid]: signInResult.uuid,
                    [getConstNotSyncing.isShowVerificationScreen]: true,
                    [getConstNotSyncing.emailVerificationType]: "login",
                  });

                  showScreen("emailVerification");

                  loginSubmitButtonElement.removeAttribute("disabled");

                  queryById("emailVerification").setAttribute(
                    "typeOfVerification",
                    "login",
                  );

                  document.querySelector(".verification-text").textContent =
                    email;
                } else {
                  showLogInError(result.error);
                  loginSubmitButtonElement.removeAttribute("disabled");
                }
              })
              .catch((error) => {
                showLogInError("Error: " + error.message);
                loginSubmitButtonElement.removeAttribute("disabled");
              });
          } else {
            showLogInError(signInResult.message);
            loginSubmitButtonElement.removeAttribute("disabled");
          }
        })
        .catch((error) => {
          console.error(error);
          // Handle errors here
          showLogInError("Error: " + error.message);
        })
        .finally(() => {
          loginSubmitButtonElement.removeAttribute("disabled");
        });
    },
  );
}

document
  .querySelector(".logInForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    if (isBrowserSafari()) {
      return;
    } else {
      loginSubmitButtonElement.setAttribute("disabled", "");

      const email = queryById("proLoginEmail").value;
      const password = queryById("proLoginPassword").value;

      signInHandler(email, password);
    }
  });
