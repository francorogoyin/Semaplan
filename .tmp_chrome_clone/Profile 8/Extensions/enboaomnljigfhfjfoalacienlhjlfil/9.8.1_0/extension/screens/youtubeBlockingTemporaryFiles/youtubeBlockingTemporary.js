(function () {
  // MARK: - Actions

  // Click on row with select

  const intervalItems = querySelectorAll(
    "#youtubeBlockingTemporaryScreen .modernFormBlockItemsWrapper:has(select)",
  );

  for (const index in intervalItems) {
    const item = intervalItems[index];
    item.onclick = function () {
      showDropdown(item.querySelector("select"));
    };
  }

  // Click on set temporary blocking

  function collectAllDataToStorage() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const youtubePageState = systemState[getConst.youtubePageState] ?? {};

      // Start Date and Time

      const currentDate = new Date();

      // Duration

      const duration = queryById("temporaryBlockingDuration").value;

      // Block Extension Checkbox

      const blockExtensionCheckbox = queryById(
        "youtubeBlockingTemporaryBlockExtensionCheckbox",
      ).checked;

      // Set active status

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.youtubePageState]: {
            ...youtubePageState,
            [getConst.youtubeBlockingTemporaryIsActiveData]: true,
            [getConst.youtubeBlockingTemporaryDurationData]: duration,
            [getConst.youtubeBlockingTemporaryBlockExtensionData]:
              blockExtensionCheckbox,
            [getConst.youtubeBlockingTemporaryStartDateData]:
              currentDate.toISOString(),
          },
        },
      });
    });
  }

  // Click on start temporary blocking

  document
    .querySelectorAll(
      "#youtubeBlockingTemporaryUpdateButton, #startTemporaryBlockSession",
    )
    .forEach((element) => {
      element.onclick = function () {
        collectAllDataToStorage();
        checkIfBlockedTemporary();

        queryById("youtubeBlockingTemporary-bottomButtons").setAttribute(
          "active",
          "",
        );

        queryById("youtubeFocusBlockingStatusInfo").setAttribute("active", "");
      };
    });

  // Click on deactivate blocking

  queryById("youtubeBlockingTemporaryDestructButton").onclick = function () {
    stopTemporaryBlocking();

    queryById("youtubeBlockingTemporary-bottomButtons").removeAttribute(
      "active",
      "",
    );

    queryById("youtubeFocusBlockingStatusInfo").removeAttribute("active", "");
  };
})();
