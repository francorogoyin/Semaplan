function getVideoSummarizeContent() {
  return `
      <div class="video-summarize-container">
        <div class="tabs-content-container">
          <div class="tabs-container">
            <div class="tabs-element" id="keyInsights">${
              tabsSvgList.keyInsights
            }</div>
            <div class="tabs-element" id="timeStampsSummary">${
              tabsSvgList.timeStampsSummary
            }</div>
            <div class="tabs-element" id="topComments">${
              tabsSvgList.topComments
            }</div>
            <div class="tabs-element" id="transcripts">${
              tabsSvgList.transcripts
            }</div>
          </div>
          
          <div style="display: flex; align-items: center;">
            <div class="transcript-language-selector-container">
              <button class="outline-button transcript-language-button">
                ${transcriptMenuSvg}
              </button>
            </div>

            <button class="outline-button copy-summarize-button" disabled>
              ${copySvg}
            </button>
          </div>
        </div>
        

        <div class="close-container">
          ${closeSvg}
        </div>
      </div>
      

      <div id="contentContainer" class="content-container" active>
        <div class="untrap-spinner"></div>
      </div>

      <div id="settingsContainer" class="settings-container">
        <div class="feature-settings">
          <h4>Features</h4>

          <ul class="features-list">
            <li class="features-item">
              <label class="switchLabel switch">
                <input class="formCheckbox" type="checkbox" id="untrap_generate_automatically"/>
                <span class="slider round"></span>
              </label>

              <span>Generate Automatically</span>
            </li>
          </ul>
        </div>

        <div class="feature-settings key-insight-section">
          <h4>Key insight</h4>

          <ul class="features-list key-insight-section">
            <li class="features-item key-insight-section column">
              <div class="features-item">
                <span>Bullet-Point Mark</span>

                <div class="selector bullet-point-selector">
                  <span id="bullet-point-text"></span>
                </div> 
              </div>
                
              <div class="selector-menu" id="bullet-point-menu">
                  ${bulletPointMarkList
                    .map((item) => {
                      const { id, name } = item;
                      return `
                      <div id="${id}" class="selector-menu-item bullet-points-item">
                        <div>
                          <span class="bullet-points-item-name">${name}</span>
                        </div>
                      </div>`;
                    })
                    .join("")}
              </div>             
            </li>

            <li class="features-item key-insight-section">
              <label class="switchLabel switch">
                <input class="formCheckbox" type="checkbox" id="untrap_grouped"/>
                <span class="slider round"></span>
              </label>

              <span>Grouped</span>
            </li>
          </ul>
        </div>

        <div class="feature-settings timestamp-section">
          <h4>Timestamp Summary</h4>

          <ul class="features-list">
            <li class="features-item">
              <label class="switchLabel switch">
                <input class="formCheckbox" type="checkbox" id="untrap_expand_collapse"/>
                <span class="slider round"></span>
              </label>

              <span>Add Expand / Collapse Button</span>
            </li>

            <li class="features-item">
              <label class="switchLabel switch">
                <input class="formCheckbox" type="checkbox" id="untrap_add_emojis"/>
                <span class="slider round"></span>
              </label>

              <span>Add Emojis</span>
            </li>

            <li class="features-item">
              <label class="switchLabel switch">
                <input class="formCheckbox" type="checkbox" id="untrap_timestamps_link"/>
                <span class="slider round"></span>
              </label>

              <span>Timestamp Links</span>
            </li>
          </ul>
        </div>

        <div class="language-settings">
          <h4>Language</h4>

          <div class="selector language-selector">
            <span id="languageAbbreviation" class="language-abbreviation">EN</span>

            <span id="languageText" class="language-text">English</span>
          </div>

          <div class="selector-menu" id="transcript-language-menu">
              ${translateLanguageArray
                .map((item) => {
                  const { id, name } = item;
                  return `<div
                    id="${id}"
                    class="selector-menu-item transcript-language-item"
                  >
                    <div>
                      <label class="transcript-language-item-abbreviation">
                        ${id}
                      </label>

                      <span class="transcript-language-item-name">${name}</span>
                    </div>
                  </div>`;
                })
                .join("")}
          </div>
        </div>
        
      </div>
      `;
}

function getLoginFormContent() {
  return `
   <div class="video-summarize-container">  
     <div class="close-container">
       <p class="close-container-title">UnTrap for YouTube</p>

       ${closeSvg}
     </div>
   </div>

   <div id="contentContainer" class="content-container loginFormContainer">
      
      <div class="subScreenContent" id="proLoginScreen" active>
        <h3>Log In</h3>

        <p class="instructionSubLabel">Summary feature requires an account.</p> 

        <form class="logInForm">
         <div class="modernFormBlockItemsWrapper">
            <div class="modernFormBlockItem">
               <div class="formBlockContent">
                  <input type="email" class="textField underlayBackground" id="proLoginEmail" placeholder="Email" required />
               </div>
            </div>
         </div>

         <div class="modernFormBlockItemsWrapper">
            <div class="modernFormBlockItem">
               <div class="formBlockContent">
                  <input type="password" class="textField underlayBackground" id="proLoginPassword" placeholder="Password" required />
               </div>
            </div>
         </div>

         <p class="subScreenError" id="logInError"></p>

         <div class="bottomButtonsWrapper">
            <button type="submit" class="submitButton underlayBackground" id="logInButton">Log In</button>
         </div>
        </form>

        <div class="signUPtext">
          <p>Don't have an account?</p>
          <span class="routerButton" routeto="proSignUpScreen">Sign Up</span>
        </div>
      </div>

      <div class="subScreenContent" id="proSignUpScreen">
         <h3>Sign Up</h3>

         <p class="instructionSubLabel">Summary feature requires an account.</p> 

         <form class="signUpForm">
            <div class="modernFormBlockItemsWrapper">
               <div class="modernFormBlockItem">
                  <div class="formBlockContent">
                     <input type="email" class="textField underlayBackground" id="proSignUpEmail" required="" placeholder="Email">
                  </div>
               </div>
            </div>

            <div class="modernFormBlockItemsWrapper">
               <div class="modernFormBlockItem">
                  <div class="formBlockContent">
                     <input type="password" class="textField underlayBackground" id="proSignUpPassword" required="" placeholder="Password">
                  </div>
               </div>
            </div>

            <div class="modernFormBlockItemsWrapper">
               <div class="modernFormBlockItem">
                  <div class="formBlockContent">
                     <input type="password" class="textField underlayBackground" id="proSignUpConfirmPassword" required="" placeholder="Confirm password">
                  </div>
               </div>
            </div>

            <p class="subScreenError" id="signUpError"></p>

            <div class="bottomButtonsWrapper">
               <button type="submit" class="submitButton underlayBackground proSignUpScreen-translate-5" id="signUpButton">Sign Up</button>
            </div>
         </form>

         <div class="signUPtext">
            <p>Already have an account?</p>
            <span class="routerButton" routeto="proLoginScreen">Log In</span>
         </div>
      </div>

      <div class="subScreenContent" id="emailVerification">
        <div class="verification-content-container">
          <h3 class="emailVerification-translate-title">Email Verification</h3>

          <span class="verification-description-text">Enter the 6-digit code sent to</span>

          <div class="verification-input-container" id="verificationContainer">
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
            <input type="number" class="verification-input" maxlength="1" pattern="[0-9]" required>
          </div>

          <p class="subScreenError" id="verificationError"></p>

          <button type="button" class="submitButton underlayBackground" id="verifyEmail"
            disabled>Verify</button>

          <p class="instructionSubLabel">Didn’t receive the email? Check your spam folder.</p>  

          <button type="button" class="outlinedButton underlayBackground" id="resendCode">Resend Verification Email</button>
          
          <button type="button" class="outlinedButton underlayBackground" id="changeEmail">Change Your Email</button>
        </div>
      </div>

    </div>  `;
}

function getSafariLoginForm() {
  return `
  <div>
    <div class="video-summarize-container">  
      <div class="close-container">
        <p class="close-container-title">UnTrap for YouTube</p>

        ${closeSvg}
      </div>
    </div>
    
    <div id="contentContainer" class="content-container loginFormContainer">
      <button type="submit" class="submitButton underlayBackground" id="plusPlan">Get Plus Plan</button> 
    </div>
  </div> 
   `;
}

function safariLoginFormHandler() {
  const plusPlanButton = document.querySelector(
    "#videoSummarizeContainer #plusPlan",
  );

  plusPlanButton.addEventListener("click", function (event) {
    event.preventDefault();

    window.open("untrapforyt://");
  });
}

function setEmailToDescriptionInSummarize() {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const email = notSyncingState[getConstNotSyncing.temporary_username] ?? "";

    const emailVerificationDescription = document.querySelector(
      "#videoSummarizeContainer #emailVerification .verification-description-text",
    );

    if (emailVerificationDescription) {
      emailVerificationDescription.textContent =
        "Enter the 6-digit code sent to" + " " + email;
    }
  });
}

function summarizeLoginWindowClearAllErrors() {
  const outlinedButtons = document.querySelectorAll(
    "#videoSummarizeContainer .outlinedButton",
  );

  const submitButtons = document.querySelectorAll(
    "#videoSummarizeContainer .submitButton",
  );

  const errorsElements = document.querySelectorAll(
    "#videoSummarizeContainer .subScreenError",
  );

  const routerButtons = document.querySelectorAll(
    "#videoSummarizeContainer .routerButton",
  );

  outlinedButtons.forEach((outlinedButton) => {
    outlinedButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });

  submitButtons.forEach((submitButton) => {
    submitButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });

  routerButtons.forEach((routerButton) => {
    routerButton.onclick = function () {
      errorsElements.forEach((error) => {
        error.innerHTML = "";
      });
    };
  });
}

function changeScreenClick(toScreenName) {
  if (toScreenName) {
    const allScreens = document.querySelectorAll(
      "#videoSummarizeContainer .subScreenContent",
    );

    allScreens.forEach((screen) => {
      screen.removeAttribute("active");

      if (screen.getAttribute("id") === toScreenName) {
        screen.setAttribute("active", "");
      }
    });
  } else {
    document
      .querySelectorAll(
        "#videoSummarizeContainer .subScreenContent span[routeto]",
      )
      .forEach((span) => {
        span.addEventListener("click", function () {
          const targetId = this.getAttribute("routeto");
          const targetDiv = document.getElementById(targetId);
          const activeDiv = document.querySelector(
            "#videoSummarizeContainer .subScreenContent[active]",
          );

          if (targetDiv && activeDiv !== targetDiv) {
            if (activeDiv) activeDiv.removeAttribute("active");
            targetDiv.setAttribute("active", "");
          }
        });
      });
  }
}

function showError(text, errorSection) {
  document.querySelector(errorSection).textContent = text;
  document.querySelector(errorSection).style.display = "block";
}

function loginHandler() {
  document
    .querySelector("#videoSummarizeContainer .logInForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.querySelector(
        "#videoSummarizeContainer #proLoginEmail",
      ).value;
      const password = document.querySelector(
        "#videoSummarizeContainer #proLoginPassword",
      ).value;

      signInHandler(email, password);
    });
}

function signInHandler(email, password) {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const loginSubmitButton = document.querySelector(
        "#videoSummarizeContainer #logInButton",
      );

      loginSubmitButton.setAttribute("disabled", "");

      serverLogIn(email, password)
        .then((logInResult) => {
          if (logInResult.message == "Login") {
            setSystemConfigStorage({
              systemState,
              newState: {
                [getConst.sharedState]: {
                  ...sharedState,
                  [getConst.userUniqueIdentifier]: logInResult.uuid,
                },
              },
            });

            setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
              ...notSyncingState,
              [getConstNotSyncing.isUserPro]: !!logInResult.isPRO,
              [getConstNotSyncing.pro_usernameData]: email,
              [getConstNotSyncing.pro_passwordData]: password,
              [getConstNotSyncing.temporary_username]: "",
              [getConstNotSyncing.temporary_password]: "",
              [getConstNotSyncing.temporary_uuid]: "",
            });

            document.querySelector(
              "#videoSummarizeContainer #proLoginEmail",
            ).value = "";

            document.querySelector(
              "#videoSummarizeContainer #proLoginPassword",
            ).value = "";

            document.querySelector(
              "#videoSummarizeContainer #logInError",
            ).style.display = "none";

            loginSubmitButton.removeAttribute("disabled");
          } else if (logInResult.message === "Your email not verified") {
            sendVerificationCode(logInResult.uuid)
              .then((result) => {
                if (result.message === "Verification code sent") {
                  setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                    ...notSyncingState,
                    [getConstNotSyncing.temporary_username]: email,
                    [getConstNotSyncing.temporary_password]: password,
                    [getConstNotSyncing.temporary_uuid]: logInResult.uuid,
                    [getConstNotSyncing.isShowVerificationScreen]: false,
                  });

                  changeScreenClick("emailVerification");

                  loginSubmitButton.removeAttribute("disabled");

                  queryById("emailVerification").setAttribute(
                    "typeOfVerification",
                    "login",
                  );
                } else {
                  showError(
                    result.error,
                    "#videoSummarizeContainer #logInError",
                  );
                  loginSubmitButton.removeAttribute("disabled");
                }
              })
              .catch((error) => {
                showError(
                  "Error: " + error.message,
                  "#videoSummarizeContainer #logInError",
                );
                loginSubmitButton.removeAttribute("disabled");
              });
          } else {
            showError(
              logInResult.message,
              "#videoSummarizeContainer #logInError",
            );
            loginSubmitButton.removeAttribute("disabled");
          }
        })
        .catch((error) => {
          showError(
            "Error: " + error.message,
            "#videoSummarizeContainer #logInError",
          );
          loginSubmitButton.removeAttribute("disabled");
        });
    },
  );
}

function signUpAfterVerification(email, uuid, password) {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      requestUserFromDb(uuid).then(() => {
        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.sharedState]: {
              ...sharedState,
              [getConst.userUniqueIdentifier]: uuid,
            },
          },
        });

        document.querySelector(
          "#videoSummarizeContainer #proSignUpEmail",
        ).value = "";

        document.querySelector(
          "#videoSummarizeContainer #proSignUpPassword",
        ).value = "";

        document.querySelector(
          "#videoSummarizeContainer #signUpError",
        ).style.display = "none";

        setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
          ...notSyncingState,
          [getConstNotSyncing.pro_usernameData]: email,
          [getConstNotSyncing.pro_passwordData]: password,
          [getConstNotSyncing.temporary_username]: "",
          [getConstNotSyncing.temporary_password]: "",
          [getConstNotSyncing.temporary_uuid]: "",
          [getConstNotSyncing.isShowVerificationScreen]: false,
        });
      });
    },
  );
}

function signUpHandler() {
  document
    .querySelector("#videoSummarizeContainer .signUpForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      browser.storage.local.get(
        getConstNotSyncing.notSyncingState,
        function (obj) {
          const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

          const signUpSubmitButton = document.querySelector(
            "#videoSummarizeContainer #signUpButton",
          );

          const email = document.querySelector(
            "#videoSummarizeContainer #proSignUpEmail",
          ).value;

          const password = document.querySelector(
            "#videoSummarizeContainer #proSignUpPassword",
          ).value;

          const confirmPassword = document.querySelector(
            "#videoSummarizeContainer #proSignUpConfirmPassword",
          ).value;

          signUpSubmitButton.setAttribute("disabled", "");

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
                          },
                        );

                        changeScreenClick("emailVerification");

                        signUpSubmitButton.removeAttribute("disabled");

                        queryById("emailVerification").setAttribute(
                          "typeOfVerification",
                          "signUp",
                        );
                      } else {
                        showError(
                          result.error,
                          "#videoSummarizeContainer #signUpError",
                        );

                        signUpSubmitButton.removeAttribute("disabled");
                      }
                    })
                    .catch((error) => {
                      showError(
                        "Error: " + error.message,
                        "#videoSummarizeContainer #signUpError",
                      );

                      signUpSubmitButton.removeAttribute("disabled");
                    });
                } else {
                  showError(
                    signUpResult.message,
                    "#videoSummarizeContainer #signUpError",
                  );

                  signUpSubmitButton.removeAttribute("disabled");
                }
              })
              .catch((error) => {
                showError(
                  "Error: " + error.message,
                  "#videoSummarizeContainer #signUpError",
                );

                signUpSubmitButton.removeAttribute("disabled");
              });
          } else {
            showError(
              "Error: Password does not match the confirm password",
              "#videoSummarizeContainer #signUpError",
            );
            signUpSubmitButton.removeAttribute("disabled");
          }
        },
      );
    });
}

function emailVerificationButtonHandler(
  emailVerificationButton,
  verificationCode,
  verificationType,
) {
  browser.storage.local.get(
    [getConstNotSyncing.notSyncingState],
    function (obj) {
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const email =
        notSyncingState[getConstNotSyncing.temporary_username] ?? "";

      const password =
        notSyncingState[getConstNotSyncing.temporary_password] ?? "";

      const uuid = notSyncingState[getConstNotSyncing.temporary_uuid] ?? "";

      emailVerificationButton.setAttribute("disabled", "");

      verifyOTPCode(uuid, verificationCode)
        .then((result) => {
          if (result.message === "Code verified") {
            if (verificationType === "signUp") {
              signUpAfterVerification(email, uuid, password);
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
              });
            }

            showError(
              result.error,
              "#videoSummarizeContainer #verificationError",
            );
          }
        })
        .catch((error) => {
          showError(
            "Error: " + error.message,
            "#videoSummarizeContainer #verificationError",
          );
        })
        .finally(() => {
          emailVerificationButton.removeAttribute("disabled");
        });
    },
  );
}

function resendCodeButtonHandler(resendCodeButton) {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const uuid = notSyncingState[getConstNotSyncing.temporary_uuid] ?? "";

    resendCodeButton.setAttribute("disabled", "");

    sendVerificationCode(uuid)
      .then((result) => {
        if (result.error) {
          showError(
            result.error,
            "#videoSummarizeContainer #verificationError",
          );
        }
      })
      .catch((error) => {
        showError(
          "Error: " + error.message,
          "#videoSummarizeContainer #verificationError",
        );
      })
      .finally(() => {
        resendCodeButton.removeAttribute("disabled");
      });
  });
}

function changeEmailHandler(verificationCode) {
  browser.storage.local.get(getConstNotSyncing.notSyncingState, function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const verificationType =
      queryById("emailVerification").getAttribute("typeOfVerification");

    setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
      ...notSyncingState,
      [getConstNotSyncing.temporary_username]: "",
      [getConstNotSyncing.temporary_password]: "",
      [getConstNotSyncing.temporary_uuid]: "",
      [getConstNotSyncing.isShowVerificationScreen]: false,
    });

    if (verificationType === "signUp") {
      changeScreenClick("proSignUpScreen");
    }

    if (verificationType === "login") {
      changeScreenClick("proLoginScreen");
    }

    inputBlocksClear();

    verificationCode.value = "";
  });
}

function verificationScreenButtonsHandler(verificationCode) {
  const emailVerificationButton = document.querySelector(
    "#videoSummarizeContainer #emailVerification #verifyEmail",
  );

  const resendCodeButton = document.querySelector(
    "#videoSummarizeContainer #emailVerification #resendCode",
  );

  const changeEmail = document.querySelector(
    "#videoSummarizeContainer #emailVerification #changeEmail",
  );

  emailVerificationButton.addEventListener("click", (event) => {
    event.preventDefault();

    const verificationType =
      queryById("emailVerification").getAttribute("typeOfVerification");

    emailVerificationButtonHandler(
      emailVerificationButton,
      verificationCode.value,
      verificationType,
    );
  });

  resendCodeButton.addEventListener("click", (event) => {
    event.preventDefault();

    resendCodeButtonHandler(resendCodeButton);
  });

  changeEmail.addEventListener("click", () =>
    changeEmailHandler(verificationCode),
  );
}

browser.storage.onChanged.addListener(
  listenerOfTemporaryEmailChangeInSummarize,
);

function listenerOfTemporaryEmailChangeInSummarize(changes) {
  const change = changes[getConstNotSyncing.notSyncingState];
  if (!change) return;

  const newState = change.newValue;
  const oldState = change.oldValue;
  if (!newState || !oldState) return;

  const newEmail = newState[getConstNotSyncing.temporary_username] ?? "";
  const oldEmail = oldState[getConstNotSyncing.temporary_username] ?? "";

  if (newEmail === oldEmail) return;

  const emailVerificationDescription = document.querySelector(
    "#videoSummarizeContainer #emailVerification .verification-description-text",
  );
  if (!emailVerificationDescription) return;

  emailVerificationDescription.textContent =
    "Enter the 6-digit code sent to " + newEmail;
}
