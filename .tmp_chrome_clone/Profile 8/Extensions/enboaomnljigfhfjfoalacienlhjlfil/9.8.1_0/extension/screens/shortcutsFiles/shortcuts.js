(function () {
  var shouldListen = false;
  var pressedKeys = [];

  // MARK: - Router

  queryById("setHotkeyButton").onclick = function () {
    shouldListen = true;
    queryById("shortcutsModal").style.display = "block";
  };

  queryById("clearHotKey").onclick = function () {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      delete sharedState[getConst.shortcuts[0]];

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.sharedState]: sharedState,
        },
      });

      queryById("setHotkeyButton").innerHTML = "Set Hotkey";
      querySelector(".hotKeyWrapper").classList.remove("setted");
    });
  };

  // MARK: - Actions

  document.addEventListener("keydown", function (event) {
    if (shouldListen) {
      // Add the pressed key to the array if it's not already present
      if (!pressedKeys.includes(event.key)) {
        pressedKeys.push(event.key);
      }
    }
  });

  document.addEventListener("keyup", function (event) {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};

      if (shouldListen) {
        shouldListen = false;

        setSystemConfigStorage({
          systemState,
          newState: {
            [getConst.sharedState]: {
              ...sharedState,
              [getConst.shortcuts[0]]: pressedKeys,
            },
          },
        });

        queryById("shortcutsModal").style.display = "none";

        // Set to HTML
        queryById("setHotkeyButton").innerHTML = pressedKeys
          .join("+")
          .toUpperCase();

        querySelector(".hotKeyWrapper").classList.add("setted");

        pressedKeys = [];
      }
    });
  });
})();
