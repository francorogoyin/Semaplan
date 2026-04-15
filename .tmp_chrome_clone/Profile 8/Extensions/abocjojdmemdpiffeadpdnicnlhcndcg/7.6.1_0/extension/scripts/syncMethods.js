// MARK: - Fetch From Server

// Sync from server if outdated

function setOptionsFromString(options, callback) {
  const optionsObjectsArray = JSON.parse(options);

  const payload = {};

  for (const object of optionsObjectsArray) {
    payload[object.id] = object.value;
  }

  browser.storage.local.set(payload, callback);
}

function tryToSyncFromServer() {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const isCloudSyncing =
        notSyncingState[getConstNotSyncing.isCloudSyncingData] ?? "off";

      const sharedState = systemState[getConst.sharedState] ?? {};
      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

      const password =
        notSyncingState[getConstNotSyncing.pro_passwordData] ?? "";

      if (
        app_isPRO == "true" &&
        app_isLogin == "true" &&
        isCloudSyncing == "on" &&
        uuid
      ) {
        var fields = [];

        fields = [
          "socialfocus_LastSettingsModified",
          "socialfocus_FeaturesSettings",
        ];

        // Fetch neccessary data from server

        serverFetchSettings(uuid, password, fields)
          .then((result) => {
            browser.storage.local.get(
              getConstNotSyncing.notSyncingState,
              function (stateAfterRequest) {
                const notSyncingStateAfterReq =
                  stateAfterRequest[getConstNotSyncing.notSyncingState] ?? {};
                // Check by last synced data
                const lastSyncAfterReq =
                  notSyncingStateAfterReq[
                    getConstNotSyncing.lastSyncingDateData
                  ] ?? "0";

                if (
                  Number(result.socialfocus_LastSettingsModified) >
                  Number(lastSyncAfterReq)
                ) {
                  // Set data from storage to current

                  if (result.socialfocus_FeaturesSettings != null) {
                    setOptionsFromString(
                      result.socialfocus_FeaturesSettings,
                      function () {
                        browser.storage.local.get(
                          getConstNotSyncing.notSyncingState,
                          function (newObj) {
                            const newNotSyncingState =
                              newObj[getConstNotSyncing.notSyncingState] ?? {};

                            const lastSync = String(Date.now());

                            setToStorageWithoutSync(
                              getConstNotSyncing.notSyncingState,
                              {
                                ...newNotSyncingState,
                                [getConstNotSyncing.lastSyncingDateData]:
                                  lastSync,
                              },
                              function () {
                                const categoryId = queryById(
                                  "mainScreen",
                                ).getAttribute("displayingCategoryId");

                                reSnapshotRuntimeConfig({
                                  isNeedReload: true,
                                  categoryIdArray: [categoryId],
                                });
                              },
                            );
                          },
                        );
                      },
                    );
                  }
                }
              },
            );
          })
          .catch((error) => {
            // Handle errors here
          });
      }
    },
  );
}

// MARK: - Update on Server

function updateSettingsStringInCloud() {
  if (app_isPRO == "true") {
    var featuresSettings = "";

    let date = Date.now();
    let lastModified = date.toString();

    var featuresArrayOfObjectIds = storageEntityKeysList;

    browser.storage.local.get(featuresArrayOfObjectIds, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const sharedState = systemState[getConst.sharedState] ?? {};

      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";
      const password =
        notSyncingState[getConstNotSyncing.pro_passwordData] ?? "";

      const isCloudSyncing =
        notSyncingState[getConstNotSyncing.isCloudSyncingData] ?? "off";

      if (isCloudSyncing == "on" && uuid) {
        // Collect features list

        let featuresArrayOfObjects = [];
        const objectIdsListForMapping = featuresArrayOfObjectIds.filter(
          (key) => key !== "socialFocus_not_syncing_state",
        );

        for (additionalObject of objectIdsListForMapping) {
          const id = additionalObject;
          const value = obj[additionalObject];

          if (value !== undefined) {
            let filteredValue;

            if (id === getConst.remoteOptionsData) {
              filteredValue = notEqualDefaultValue(value) ? value : undefined;
            } else {
              filteredValue = filterObjectRecursively(value);
            }

            if (filteredValue !== undefined) {
              featuresArrayOfObjects.push({ id, value: filteredValue });
            }
          }
        }

        featuresSettings = JSON.stringify(featuresArrayOfObjects);

        serverUpdateSettings(uuid, password, featuresSettings, lastModified)
          .then((result) => {
            if (result == "Updated") {
              setToStorageWithoutSync(
                getConstNotSyncing.notSyncingState,
                {
                  ...notSyncingState,
                  [getConstNotSyncing.lastSyncingDateData]: lastModified,
                },
                function () {},
              );
            }
          })
          .catch((error) => {
            // Handle errors here
          });
      }
    });
  }
}
