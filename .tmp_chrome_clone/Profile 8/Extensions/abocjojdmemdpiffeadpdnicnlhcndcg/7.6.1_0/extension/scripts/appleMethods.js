// Send Message to background.js
browser.runtime.sendMessage({ command: "getProStatus" }).then((response) => {});

// Listen Messages from background.js

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command == "getProStatusResponse") {
    // Set PRO status to html
    const { isPRO, uuid } = request;

    if (isPRO) {
      document.documentElement.setAttribute("isPRO", "true");
      app_isPRO = "true";
    } else {
      document.documentElement.setAttribute("isPRO", "false");
      app_isPRO = "false";
    }

    if (uuid) {
      document.documentElement.setAttribute("isLogin", "true");
      app_isLogin = "true";
    } else {
      document.documentElement.setAttribute("isLogin", "false");
      app_isLogin = "false";
    }

    setSystemConfigStorage({
      systemState,
      newState: {
        [getConst.sharedState]: {
          ...sharedState,
          [getConst.userUniqueIdentifier]: uuid ? uuid : "",
        },
      },
    });

    setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
      ...notSyncingState,
      [getConstNotSyncing.isUserPro]: !!isPRO,
    });

    // const el = document.getElementById("proBadge");

    // el.innerHTML = request.isPRO;
  }
});
