function encodeString(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function decodeString(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function createStringWithSettings() {
  var featuresArrayOfObjectIds = [...storageEntityKeysList];

  // Iterate Through All Options and Radios and collect ids

  browser.storage.local.get(featuresArrayOfObjectIds, function (obj) {
    const arrayOfObjects = [];

    for (additionalObject of featuresArrayOfObjectIds) {
      const encodedID = additionalObject;
      const encodedValue = obj[additionalObject];

      if (encodedValue !== undefined) {
        let filteredValue;

        if (
          encodedID === "untrap_remote_options_data" ||
          encodedID === "untrap_runtime_snapshot"
        ) {
          continue;
        } else {
          filteredValue = filterObjectRecursively(encodedValue);
        }

        if (filteredValue !== undefined) {
          arrayOfObjects.push({ id: encodedID, value: filteredValue });
        }
      }
    }
    // Convert the array to a JSON string
    const jsonString = JSON.stringify(arrayOfObjects);

    // IMPORTANT: Always store ENCODED string into the hidden div
    const encodedString = encodeString(jsonString);

    if (queryById("exportedSettings")) {
      // IMPORTANT: Use textContent (not innerHTML) and keep it encoded
      queryById("exportedSettings").textContent = encodedString;
    } else {
      // Create div and place info inside it
      const newDiv = document.createElement("div");

      // Optionally, you can set attributes, properties, or add content to the div
      newDiv.id = "exportedSettings"; // Set the id attribute
      newDiv.textContent = encodedString; // Set the text content (ENCODED)
      newDiv.style.display = "none";

      // Append the div to the body of the document (or any other element you want)
      document.body.appendChild(newDiv);
    }
  });
}

function clearStorageRemoveStyles() {
  getCurrentTab().then((tabs) => {
    const tabsId = tabs[0].id;

    browser.tabs.sendMessage(tabsId, {
      action: "removeStyles",
    });
  });
}

(function () {
  // MARK: - Actions

  // Tapped Export

  function exportSettings() {
    // IMPORTANT: Use textContent (not innerHTML) to avoid HTML escaping changes
    const exortedSettingsString = queryById("exportedSettings").textContent;

    navigator.clipboard.writeText(exortedSettingsString).then(() => {
      queryById("exportSettingsButton").innerHTML =
        "Settings Copied to Clipboard!";
      setTimeout(function () {
        queryById("exportSettingsButton").innerHTML = "Export";
      }, 4000);
    });
  }

  queryById("exportSettingsButton").onclick = function () {
    exportSettings();
  };

  // Tapped Import

  function importSettings() {
    const importTextfieldValue = queryById(
      "importSettingsTextField",
    ).value.trim();

    if (importTextfieldValue == "") {
      queryById("importSettingsTextField").classList.add("error");
    } else {
      let parsedSettings;
      try {
        // IMPORTANT: decode base64 -> JSON
        parsedSettings = JSON.parse(decodeString(importTextfieldValue));

        const payload = {};

        for (const object of parsedSettings) {
          const objID = object.id;
          const objValue = object.value;

          if (objID != null && objValue != null) {
            payload[objID] = objValue;
            needToUpdate = true;
          }
        }

        browser.storage.local.set(payload, function () {
          clearStorageRemoveStyles();
          reSnapshotRuntimeConfig({ isNeedReload: needToUpdate });
        });
      } catch (e) {
        queryById("importSettingsTextField").classList.add("error");
        queryById("importSettingsTextField").value = "";
      }
    }
  }

  queryById("importSettingsButton").onclick = function () {
    importSettings();
  };

  // Tapped Reset

  function resetSettings() {
    browser.storage.local.clear();

    location.reload();
  }

  queryById("resetSettingsButton").onclick = function () {
    clearStorageRemoveStyles();
    resetSettings();
  };
})();
