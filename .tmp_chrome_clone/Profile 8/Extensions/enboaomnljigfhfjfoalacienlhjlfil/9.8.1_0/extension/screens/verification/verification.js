const verificationCode = { value: "" };

const verifyEmailButton = queryById("verifyEmail");
const resendCodeButton = queryById("resendCode");
const backButton = document.querySelector("#emailVerification .backButton");

function setVerificationType() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const emailVerificationType =
      notSyncingState[getConstNotSyncing.emailVerificationType] ?? "";

    queryById("emailVerification").setAttribute(
      "typeOfVerification",
      emailVerificationType,
    );
  });
}

function setEmailToDescription() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const email = notSyncingState[getConstNotSyncing.temporary_username] ?? "";

    document.querySelector(".verification-text").textContent = email;
  });
}

function clearVerificationStore() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    if (isBrowserSafari()) {
      return;
    } else {
      const verificationType =
        queryById("emailVerification").getAttribute("typeOfVerification");

      setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
        ...notSyncingState,
        [getConstNotSyncing.temporary_username]: "",
        [getConstNotSyncing.temporary_password]: "",
        [getConstNotSyncing.temporary_uuid]: "",
        [getConstNotSyncing.isShowVerificationScreen]: false,
        [getConstNotSyncing.emailVerificationType]: "",
      });

      if (verificationType === "login") {
        showScreen("proLoginScreen");
      }

      if (verificationType === "signUp") {
        showScreen("proSignUpScreen");
      }

      inputBlocksClear();

      verificationCode.value = "";

      document.querySelector(".verification-text").textContent = "";
    }
  });
}

function showVerificationError({ text, isSuccess = false }) {
  if (!isSuccess) {
    queryById("verificationError").textContent = text;
    queryById("verificationError").style.display = "block";
  } else {
    queryById("verificationError").textContent = "";
    queryById("verificationError").style.display = "none";
  }
}

inputsBlocksHandler(verifyEmailButton, verificationCode);

setVerificationType();
setEmailToDescription();

backButton.addEventListener("click", clearVerificationStore);

verifyEmailButton.addEventListener("click", function () {
  if (isBrowserSafari()) {
    return;
  } else {
    verifyEmailButton.setAttribute("disabled", "");
    browser.storage.local.get(
      [getConstNotSyncing.notSyncingState],
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const email =
          notSyncingState[getConstNotSyncing.temporary_username] ?? "";

        const password =
          notSyncingState[getConstNotSyncing.temporary_password] ?? "";

        const uuid = notSyncingState[getConstNotSyncing.temporary_uuid] ?? "";

        const verificationType =
          queryById("emailVerification").getAttribute("typeOfVerification");

        verifyOTPCode(uuid, verificationCode.value)
          .then((result) => {
            if (result.message === "Code verified") {
              showVerificationError({ text: "", isSuccess: true });

              if (verificationType === "signUp") {
                signUpAfterEmailVerified(email, uuid, password);
              }

              if (verificationType === "login") {
                signInHandler(email, password);
              }
            } else {
              if (
                result.error === "Something went wrong" ||
                result.error === "Code expired"
              ) {
                setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                  ...notSyncingState,
                  [getConstNotSyncing.temporary_username]: "",
                  [getConstNotSyncing.temporary_password]: "",
                  [getConstNotSyncing.temporary_uuid]: "",
                  [getConstNotSyncing.isShowVerificationScreen]: false,
                  [getConstNotSyncing.emailVerificationType]: "",
                });
              }
              showVerificationError({ text: result.error, isSuccess: false });
            }
          })
          .catch((error) => {
            showVerificationError({
              text: "Error: " + error.message,
              isSuccess: false,
            });
          })
          .finally(() => {
            verifyEmailButton.removeAttribute("disabled");
          });
      },
    );
  }
});

resendCodeButton.addEventListener("click", function () {
  if (isBrowserSafari()) {
    return;
  } else {
    resendCodeButton.setAttribute("disabled", "");

    browser.storage.local.get(
      [getConstNotSyncing.notSyncingState],
      function (obj) {
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const uuid = notSyncingState[getConstNotSyncing.temporary_uuid] ?? "";

        sendVerificationCode(uuid)
          .then((result) => {
            if (result.message === "Verification code sent") {
              showVerificationError({ text: "", isSuccess: true });
            } else {
              showVerificationError({ text: result.error, isSuccess: false });
            }
          })
          .catch((error) => {
            showVerificationError({
              text: "Error: " + error.message,
              isSuccess: false,
            });
          })
          .finally(() => {
            resendCodeButton.removeAttribute("disabled");
          });
      },
    );
  }
});
