// Send Message to background.js
browser.runtime.sendMessage({ command: "getProStatus" }).then((response) => {});

// Listen Messages from background.js

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      if (request.command == "getProStatusResponse") {
        // Set PRO status to html
        const { isPRO, uuid } = request;

        const systemState = obj[getConst.system] ?? {};
        const sharedState = systemState[getConst.sharedState] ?? {};

        const notSyncingState = obj[getConstNotSyncing.notSyncingState];

        if (isPRO) {
          document.documentElement.setAttribute("isPRO", "true");
          app_isPRO = "true";

          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.isUserPro]: true,
          });
        } else {
          document.documentElement.setAttribute("isPRO", "false");
          app_isPRO = "false";

          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.isUserPro]: false,
          });
        }

        if (uuid) {
          document.documentElement.setAttribute("isLogin", "true");
          app_isLogin = "true";

          setWithoutSyncSystemConfigStorage({
            systemState,
            newState: {
              [getConst.sharedState]: {
                ...sharedState,
                [getConst.userUniqueIdentifier]: uuid,
              },
            },
          });
        } else {
          document.documentElement.setAttribute("isLogin", "false");
          app_isLogin = "false";

          setWithoutSyncSystemConfigStorage({
            systemState,
            newState: {
              [getConst.sharedState]: {
                ...sharedState,
                [getConst.userUniqueIdentifier]: "",
              },
            },
          });
        }

        // const el = document.getElementById("proBadge");

        // el.innerHTML = request.isPRO;
      }
    },
  );
});
