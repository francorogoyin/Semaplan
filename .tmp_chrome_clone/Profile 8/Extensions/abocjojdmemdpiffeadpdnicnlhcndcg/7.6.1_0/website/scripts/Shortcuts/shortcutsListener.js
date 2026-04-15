var shouldListen = false;
var pressedKeys = [];

function arraysAreEqualIgnoreCase(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const lowerCaseArr1 = arr1.map((item) => item.toLowerCase()).sort();
  const lowerCaseArr2 = arr2.map((item) => item.toLowerCase()).sort();

  for (let i = 0; i < lowerCaseArr1.length; i++) {
    if (lowerCaseArr1[i] !== lowerCaseArr2[i]) {
      return false;
    }
  }

  return true;
}

// MARK: - Actions

document.addEventListener("keydown", function (event) {
  // Add the pressed key to the array if it's not already present

  shouldListen = true;

  if (!pressedKeys.includes(event.key)) {
    pressedKeys.push(event.key);
  }
});

document.addEventListener("keyup", function (event) {
  if (shouldListen) {
    browser.storage.local.get(
      [getConst.system, getConstNotSyncing.notSyncingState],
      function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const sharedState = systemState[getConst.sharedState] ?? {};

        const data = sharedState[getConst.shortcuts[0]] ?? null;

        if (arraysAreEqualIgnoreCase(data, pressedKeys)) {
          const currentAttribute = document.documentElement.getAttribute(
            "socialFocus_global_enable",
          );

          if (currentAttribute == "true") {
            document.documentElement.setAttribute(
              "socialFocus_global_enable",
              false,
            );
          } else {
            document.documentElement.setAttribute(
              "socialFocus_global_enable",
              true,
            );
          }
        }

        setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
          ...notSyncingState,
          [getConstNotSyncing.extensionIsEnabledData]:
            currentAttribute === "true" ? true : false,
        });

        pressedKeys = [];
      },
    );

    shouldListen = false;
  }
});
