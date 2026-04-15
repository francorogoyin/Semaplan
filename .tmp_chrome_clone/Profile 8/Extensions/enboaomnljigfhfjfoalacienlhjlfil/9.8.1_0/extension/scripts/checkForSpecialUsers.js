const regexForTestUsers = /^[\w.+-]+\.tester@[\w.-]+$/;

function checkForSpecialUsers(userName) {
  if (regexForTestUsers.test(userName)) {
    addButtonToActivateTestersRelease();
  } else {
    removeGetTestersReleaseButtons();
  }
}

function getTestersStyles(
  desktopOptionStylesFromServer,
  mobileOptionStylesFromServer,
) {
  getOptionsSettings(true)
    .then((options) => {
      if (options.settings.length) {
        const updatedDesktop = [...desktopOptionStylesFromServer];
        const updatedMobile = [...mobileOptionStylesFromServer];

        options.settings.forEach((item) => {
          if (item.is_mobile) {
            const index = updatedMobile.findIndex(
              (opt) => opt.settings_id === item.settings_id,
            );

            if (index !== -1) {
              updatedMobile[index] = {
                ...updatedMobile[index],
                tester_styles: item.tester_styles,
              };
            }
          } else {
            const index = updatedDesktop.findIndex(
              (opt) => opt.settings_id === item.settings_id,
            );

            if (index !== -1) {
              updatedDesktop[index] = {
                ...updatedDesktop[index],
                tester_styles: item.tester_styles,
              };
            }
          }
        });

        setToStorage(
          getConst.remoteOptionsData,
          {
            desktop: updatedDesktop,
            mobile: updatedMobile,
          },
          () => {},
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function addButtonToActivateTestersRelease() {
  browser.storage.local.get(
    [getConst.remoteOptionsData, getConst.optionsState],
    function (obj) {
      const optionsState = obj[getConst.optionsState] ?? {};
      const isChecked = optionsState[getConst.isTesterRelease] ?? false;

      const {
        desktop: desktopOptionStylesFromServer,
        mobile: mobileOptionStylesFromServer,
      } = obj[getConst.remoteOptionsData] ?? {
        desktop: [],
        mobile: [],
      };

      if (isChecked) {
        getTestersStyles(
          desktopOptionStylesFromServer,
          mobileOptionStylesFromServer,
        );
      }

      const mainWrapper = document.querySelector(
        "#mainGlobalOptions .settingsGroupBody",
      );

      const testerToogleOption = document.createElement("div");
      testerToogleOption.className = "optionWrapper";
      testerToogleOption.innerHTML = `
              <div class="switchWrapper">
                <label class="label" for="untrap_global_get_testers_release">
                  <span class="labelSpan">Get testers release</span>
                  <label class="switchLabel switch">
                    <input class="formCheckbox" type="checkbox" id="untrap_global_get_testers_release" ${
                      isChecked ? "checked" : ""
                    }>
                    <span class="slider round"></span>
                  </label>
                </label>
              </div>`;

      mainWrapper.append(testerToogleOption);

      document
        .getElementById(getConst.isTesterRelease)
        .addEventListener("change", function () {
          const id = this.id;
          const newValue = this.checked;

          setToStorage(
            getConst.optionsState,
            { ...optionsState, [id]: newValue },
            function () {
              if (newValue) {
                getTestersStyles(
                  desktopOptionStylesFromServer,
                  mobileOptionStylesFromServer,
                );
              }

              reSnapshotRuntimeConfig();
            },
          );
        });
    },
  );
}

function removeGetTestersReleaseButtons() {
  browser.storage.local.get(getConst.optionsState, function (obj) {
    const options_state = obj[getConst.optionsState] ?? {};

    const getTestersReleaseButtonWrapper = document.querySelector(
      "#mainGlobalOptions .settingsGroupBody .optionWrapper:has(input#untrap_global_get_testers_release)",
    );

    if (getTestersReleaseButtonWrapper) {
      getTestersReleaseButtonWrapper.remove();

      setToStorage(
        getConst.optionsState,
        { ...options_state, untrap_global_get_testers_release: false },
        function () {
          reSnapshotRuntimeConfig();
        },
      );
    }
  });
}
