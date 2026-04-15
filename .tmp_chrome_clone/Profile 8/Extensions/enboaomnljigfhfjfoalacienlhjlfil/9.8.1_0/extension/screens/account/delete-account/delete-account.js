function showDeleteAccountError(text) {
  queryById("deleteAccountError").innerHTML = text;
  queryById("deleteAccountError").style.display = "block";
}

document
  .querySelector("#submitDeleteAccountButton")
  .addEventListener("click", function () {
    if (isBrowserSafari()) {
      return;
    } else {
      browser.storage.local.get(
        [getConst.system, getConstNotSyncing.notSyncingState],
        function (obj) {
          const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

          const systemState = obj[getConst.system] ?? {};
          const sharedState = systemState[getConst.sharedState] ?? {};

          const deleteSubmitAccount = queryById("submitDeleteAccountButton");

          const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

          deleteSubmitAccount.setAttribute("disabled", "");
          if (uuid) {
            deleteUserFromDb(uuid)
              .then((result) => {
                if (result.message === "User deleted successfully") {
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

                  setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
                    ...notSyncingState,
                    [getConstNotSyncing.isUserPro]: false,
                    [getConstNotSyncing.isCloudSyncingData]: "off",
                    [getConstNotSyncing.pro_usernameData]: "",
                    [getConstNotSyncing.pro_passwordData]: "",
                  });

                  showScreen("moreScreen");
                  deleteSubmitAccount.removeAttribute("disabled");
                } else {
                  showDeleteAccountError(result.error);
                  deleteSubmitAccount.removeAttribute("disabled");
                }
              })
              .catch((error) => {
                // Handle errors here
                showDeleteAccountError(error);
                deleteSubmitAccount.removeAttribute("disabled");
              });
          }
        },
      );
    }
  });
