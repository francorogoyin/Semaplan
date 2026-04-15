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

      const mainWrapper = document.querySelector("#settingsContainerDefault");

      const testerToogleOption = document.createElement("div");
      testerToogleOption.className = "settingsGroup";
      testerToogleOption.innerHTML = `
          <div class="settingsGroupBody">
            <div class="optionWrapper">
              <label class="label" for="socialFocus_get_testers_release">
                <span class="labelSpan">Get Testers Release</span>
                <label class="switchLabel switch">
                  <input class="formCheckbox" id="socialFocus_get_testers_release" type="checkbox" ${
                    isChecked ? "checked" : ""
                  }>
                  <span class="slider round"></span>
                </label>
              </label>
           </div>
          </div>     
              `;

      mainWrapper.prepend(testerToogleOption);

      document
        .getElementById("socialFocus_get_testers_release")
        .addEventListener("change", function () {
          browser.storage.local.get(getConst.optionsState, (obj) => {
            const id = this.id;
            const newValue = this.checked;
            const newOptionsState = obj[getConst.optionsState] ?? {};

            setToStorage(
              getConst.optionsState,
              { ...newOptionsState, [id]: newValue },
              function () {
                if (newValue) {
                  getTestersStyles(
                    desktopOptionStylesFromServer,
                    mobileOptionStylesFromServer,
                  );
                }

                const categoryId = queryById("mainScreen").getAttribute(
                  "displayingCategoryId",
                );

                reSnapshotRuntimeConfig({ categoryIdArray: [categoryId] });
              },
            );
          });
        });
    },
  );
}

function removeGetTestersReleaseButtons() {
  browser.storage.local.get(getConst.optionsState, function (obj) {
    const optionsState = obj[getConst.optionsState] ?? {};

    const getTestersReleaseButtonWrapper = document.querySelector(
      "#settingsContainerDefault .settingsGroup:has(.optionWrapper input#socialFocus_get_testers_release)",
    );

    if (getTestersReleaseButtonWrapper) {
      getTestersReleaseButtonWrapper.remove();

      setToStorage(
        getConst.optionsState,
        { ...optionsState, [getConst.isTesterRelease]: false },
        function () {
          const categoryId = queryById("mainScreen").getAttribute(
            "displayingCategoryId",
          );

          reSnapshotRuntimeConfig({ categoryIdArray: [categoryId] });
        },
      );
    }
  });
}
