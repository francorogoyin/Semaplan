let timerModalListener;

function createTimerModal({ isDesktop }) {
  browser.storage.local.get(
    getConst.system,

    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const currentDailyLimitDuration =
        dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];
      const currentDailyLimitLastedTime =
        dailyLimitState[getConst.dailyLimitLastedTime[websiteObject.name]];
      const currentTopCoordinate =
        dailyLimitState[
          getConst.dailyLimitModalCoordinate[websiteObject.name].top
        ] ?? "20px";
      const currentLeftCoordinate =
        dailyLimitState[
          getConst.dailyLimitModalCoordinate[websiteObject.name].left
        ] ?? "20px";

      const hasModal = document.querySelector("#timeModal");

      if (
        currentDailyLimitDuration !== "noLimit" &&
        currentDailyLimitDuration !== undefined &&
        currentDailyLimitLastedTime !== undefined &&
        !hasModal
      ) {
        const modalPositionDependOnDevice = isDesktop
          ? `top: ${currentTopCoordinate}; left: ${currentLeftCoordinate};`
          : "bottom: 10px; right: 10px";

        const remainingTime =
          +currentDailyLimitDuration * 60 - currentDailyLimitLastedTime;

        const modal = document.createElement("div");
        modal.id = "timeModal";

        const shadowRoot = modal.attachShadow({ mode: "open" });

        shadowRoot.innerHTML = `
          <div id="timeModalHeader" style="position: fixed; z-index: 2147483647; color: white; background-color: gray; border: 1px solid rgb(0, 0, 0); text-align: center; border-radius: 5px; cursor: move; opacity: 0.9; ${modalPositionDependOnDevice}">
            <svg
              viewport="0 0 12 12"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              style="position: absolute; top: 8px; right: 8px; cursor: pointer; width: 12px; height: 12px;"
              id="closeButton"
            >
              <line
                x1="1"
                y1="11"
                x2="11"
                y2="1"
                stroke="white"
                stroke-width="2"
              ></line>
              <line
                  x1="1"
                  y1="1"
                  x2="11"
                  y2="11"
                  stroke="white"
                  stroke-width="2"
              ></line>
            </svg>
            <div style="width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; padding: 10px 20px;">
              <h2 id="timeModalTitle" style="font-weight: bold; font-size: 16px; color: white;">Time left on</h2>
              <p id="websiteName" style="font-size: 14px; color: white; margin: 0;">${
                websiteObject.displayName
              }</p>
              <p id="timeLeft" style="font-weight: bold; font-size: ${
                isDesktop ? "20px" : "14px"
              }; padding-top: ${
                isDesktop ? "5px" : "0px"
              }; flex-grow: 1; color: white; margin: 4px;"></p>
            </div>
          </div>
        `;

        const timeLeft = shadowRoot.querySelector("#timeLeft");
        timeLeft.innerHTML = formatForRemainingTime(remainingTime);

        const closeButton = shadowRoot.querySelector("#closeButton");
        closeButton.onclick = function () {
          removeTimerModal();
        };

        const setModalInDOM = () => {
          document.body.appendChild(modal);

          if (isDesktop) {
            dragElement(modal);
          }

          timerModalListenerStart();
        };

        const observer = new MutationObserver(() => {
          if (document.body) {
            setModalInDOM();
            observer.disconnect();
          }
        });

        if (!document.body) {
          observer.observe(document, { childList: true, subtree: true });
        } else {
          setModalInDOM();
        }
      }
    },
  );
}

function removeTimerModal() {
  const modals = document.querySelectorAll("#timeModal");

  timerModalListenerRemove();
  modals.forEach((modal) => {
    if (modal) {
      modal.remove();
    }
  });
}

function timerModalListenerStart() {
  const modal = document.getElementById("timeModal");

  if (modal) {
    timerModalListener = (changes, area) => {
      const timeLeftElement = modal.shadowRoot.querySelector("#timeLeft");
      timerObserver(changes, area, timeLeftElement);
    };

    browser.storage.onChanged.addListener(timerModalListener);
  }
}

function timerModalListenerRemove() {
  if (timerModalListener) {
    browser.storage.onChanged.removeListener(timerModalListener);
    timerModalListener = null;
  }
}

function timerObserver(changes, area, timeLeftElement) {
  if (area !== "local") return;

  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.dailyLimitData,
    getConst.dailyLimitLastedTime[websiteObject.name],
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue || newValue === undefined) return;

  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

    const currentDailyLimitDuration =
      dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];

    if (
      currentDailyLimitDuration !== "noLimit" &&
      currentDailyLimitDuration !== undefined
    ) {
      const remainingTime = +currentDailyLimitDuration * 60 - newValue;

      timeLeftElement.innerHTML = formatForRemainingTime(remainingTime);
    } else {
      removeTimerModal();
    }
  });
}

function formatForRemainingTime(remainingSeconds) {
  const minutes = Math.floor(remainingSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours} h ${remainingMinutes} min`;
  } else {
    return `${minutes < 0 ? 0 : minutes} min`;
  }
}

function dragElement(modal) {
  const header = modal.shadowRoot.querySelector("#timeModalHeader");

  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", startDragging);

  function startDragging(e) {
    e.preventDefault();

    const rect = header.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDragging);
  }

  function drag(e) {
    e.preventDefault();

    header.style.left = e.clientX - offsetX + "px";
    header.style.top = e.clientY - offsetY + "px";
  }

  function stopDragging() {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      setSystemConfigStorage({
        systemState,
        newState: {
          [getConst.dailyLimitData]: {
            ...dailyLimitState,
            [getConst.dailyLimitModalCoordinate[websiteObject.name].top]:
              header.style.top,
            [getConst.dailyLimitModalCoordinate[websiteObject.name].left]:
              header.style.left,
          },
        },
      });

      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDragging);
    });
  }
}
