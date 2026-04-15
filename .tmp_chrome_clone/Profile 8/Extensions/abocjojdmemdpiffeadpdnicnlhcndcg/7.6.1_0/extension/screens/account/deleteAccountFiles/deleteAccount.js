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
      browser.storage.local.get(getConst.system, function (obj) {
        const systemState = obj[getConst.system] ?? {};

        const sharedState = systemState[getConst.sharedState] ?? {};

        const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";
        if (uuid) {
          deleteUserFromDb(uuid)
            .then((result) => {
              browser.storage.local.get(
                getConstNotSyncing.notSyncingState,
                function (obj) {
                  const notSyncingState =
                    obj[getConstNotSyncing.notSyncingState] ?? {};

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

                    setToStorageWithoutSync(
                      getConstNotSyncing.notSyncingState,
                      {
                        ...notSyncingState,
                        [getConstNotSyncing.pro_usernameData]: "",
                        [getConstNotSyncing.pro_passwordData]: "",
                        [getConstNotSyncing.isCloudSyncingData]: "off",
                      },
                    );

                    showScreen("moreScreen");
                  } else {
                    showDeleteAccountError(result.error);
                  }
                },
              );
            })
            .catch((error) => {
              // Handle errors here
              showDeleteAccountError(error);
            });
        }
      });
    }
  });
