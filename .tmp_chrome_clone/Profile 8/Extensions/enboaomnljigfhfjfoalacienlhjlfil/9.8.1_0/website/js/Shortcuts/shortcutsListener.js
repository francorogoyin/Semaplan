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
        const sharedState = systemState[getConst.sharedState] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const data = sharedState[getConst.shortcuts[0]] ?? null;

        const isEnableExtensionData =
          notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

        if (arraysAreEqualIgnoreCase(data, pressedKeys)) {
          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.extensionIsEnabledData]: !isEnableExtensionData,
          });
        }

        pressedKeys = [];
      },
    );

    shouldListen = false;
  }
});
