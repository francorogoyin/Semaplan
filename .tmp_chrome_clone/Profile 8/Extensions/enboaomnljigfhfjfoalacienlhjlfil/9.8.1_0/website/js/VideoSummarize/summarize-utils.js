const videoSummarizeWindowConfig = {
  childList: true,
  subtree: true,
};

const buttonSvgInnerHtml = `<svg width="24px" viewBox="0 0 512 512" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg "smartCard-inline") " fill="#000000"><g id="SVGRepo\_bgCarrier" stroke-width="0"></g><g id="SVGRepo\_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>ionicons-v5-m</title><path d="M315.27,33,96,304H224L192.49,477.23a2.36,2.36,0,0,0,2.33,2.77h0a2.36,2.36,0,0,0,1.89-.95L416,208H288L319.66,34.75A2.45,2.45,0,0,0,317.22,32h0A2.42,2.42,0,0,0,315.27,33Z" style="fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:24px"></path></g></svg>`;

const tabsSvgList = {
  keyInsights: `<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="23" height="22" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true"><path d="M 11.618053,4.90726 C 9.8107941,1.70161 4.5099876,1 4.5099876,1 c 0,0 2.4459678,2.67097 -0.6798387,4.78306 C 1.853536,7.11613 1.0720844,8.84839 1.9188586,10.74032 2.5672457,12.18952 3.9390199,12.77984 5.4172457,13 4.7107941,11.66694 5.2575683,10.03871 5.3180517,9.86452 c 1.3814516,2.09032 3.9919354,0 2.6806451,-2.27178 1.717742,0.37258 1.9741936,3.35323 0.6556452,5.21371 1.947581,-0.6121 3.244356,-2.1508 3.600001,-3.52258 0.375,-1.43468 0.08952,-3.09435 -0.636291,-4.37661 z"/></svg>`,
  timeStampsSummary: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" id="timestamps-icon"><path d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  topComments: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" id="Layer_1" width="18" height="18" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><g>	<path fill-rule="evenodd" clip-rule="evenodd" fill="#231F20" d="M48,12H4c-2.211,0-4,1.789-4,4v28c0,2.211,1.789,4,4,4h8v12   c0,1.617,0.973,3.078,2.469,3.695C14.965,63.902,15.484,64,16,64c1.039,0,2.062-0.406,2.828-1.172L33.656,48H48   c2.211,0,4-1.789,4-4V16C52,13.789,50.211,12,48,12z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M60,0H16c-2.211,0-4,1.789-4,4v4h40c2.211,0,4,1.789,4,4v24h4   c2.211,0,4-1.789,4-4V4C64,1.789,62.211,0,60,0z"/></g></svg>`,
  transcripts: `<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="22" height="22" viewBox="0 0 24 24"><path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm-9 6H8v4h3v2H8c-1.103 0-2-.897-2-2v-4c0-1.103.897-2 2-2h3v2zm7 0h-3v4h3v2h-3c-1.103 0-2-.897-2-2v-4c0-1.103.897-2 2-2h3v2z"/><script xmlns=""/></svg>`,
};

const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true">
          <path d="M20 12h-8v8h-1v-8H3v-1h8V3h1v8h8v1z"></path>
        </svg>`;

const selectedTranslateLanguageItemSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6663 5L7.49967 14.1667L3.33301 10" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"></path>
         </svg>`;
const transcriptMenuSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.991,10H19.42a1.039,1.039,0,0,1-.951-.674l-.005-.013a1.04,1.04,0,0,1,.2-1.146l1.11-1.11a1.01,1.01,0,0,0,0-1.428l-1.4-1.4a1.01,1.01,0,0,0-1.428,0l-1.11,1.11a1.04,1.04,0,0,1-1.146.2l-.013,0A1.04,1.04,0,0,1,14,4.579V3.009A1.009,1.009,0,0,0,12.991,2H11.009A1.009,1.009,0,0,0,10,3.009v1.57a1.04,1.04,0,0,1-.674.952l-.013,0a1.04,1.04,0,0,1-1.146-.2l-1.11-1.11a1.01,1.01,0,0,0-1.428,0l-1.4,1.4a1.01,1.01,0,0,0,0,1.428l1.11,1.11a1.04,1.04,0,0,1,.2,1.146l0,.013A1.039,1.039,0,0,1,4.58,10H3.009A1.009,1.009,0,0,0,2,11.009v1.982A1.009,1.009,0,0,0,3.009,14H4.58a1.039,1.039,0,0,1,.951.674l0,.013a1.04,1.04,0,0,1-.2,1.146l-1.11,1.11a1.01,1.01,0,0,0,0,1.428l1.4,1.4a1.01,1.01,0,0,0,1.428,0l1.11-1.11a1.04,1.04,0,0,1,1.146-.2l.013.005A1.039,1.039,0,0,1,10,19.42v1.571A1.009,1.009,0,0,0,11.009,22h1.982A1.009,1.009,0,0,0,14,20.991V19.42a1.039,1.039,0,0,1,.674-.951l.013-.005a1.04,1.04,0,0,1,1.146.2l1.11,1.11a1.01,1.01,0,0,0,1.428,0l1.4-1.4a1.01,1.01,0,0,0,0-1.428l-1.11-1.11a1.04,1.04,0,0,1-.2-1.146l.005-.013A1.039,1.039,0,0,1,19.42,14h1.571A1.009,1.009,0,0,0,22,12.991V11.009A1.009,1.009,0,0,0,20.991,10ZM12,15a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z"/></svg>`;

const transcriptCloseMenuSvg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="20" viewBox="0 0 24 24" width="20" focusable="false" aria-hidden="true"><path d="M20 12h-8v8h-1v-8H3v-1h8V3h1v8h8v1z"></path></svg>`;

const topCommentsLikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.0501 7.04419C15.4673 5.79254 14.5357 4.5 13.2163 4.5C12.5921 4.5 12.0062 4.80147 11.6434 5.30944L8.47155 9.75H5.85748L5.10748 10.5V18L5.85748 18.75H16.8211L19.1247 14.1428C19.8088 12.7747 19.5406 11.1224 18.4591 10.0408C17.7926 9.37439 16.8888 9 15.9463 9H14.3981L15.0501 7.04419ZM9.60751 10.7404L12.864 6.1813C12.9453 6.06753 13.0765 6 13.2163 6C13.5118 6 13.7205 6.28951 13.627 6.56984L12.317 10.5H15.9463C16.491 10.5 17.0133 10.7164 17.3984 11.1015C18.0235 11.7265 18.1784 12.6814 17.7831 13.472L15.8941 17.25H9.60751V10.7404ZM8.10751 17.25H6.60748V11.25H8.10751V17.25Z"/></svg>`;

const chevronIcon = `<i class="toggle-hint__icon"><svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.96967 6.46967C4.26256 6.17678 4.73744 6.17678 5.03033 6.46967L10.5 11.9393L15.9697 6.46967C16.2626 6.17678 16.7374 6.17678 17.0303 6.46967C17.3232 6.76256 17.3232 7.23744 17.0303 7.53033L11.0303 13.5303C10.7374 13.8232 10.2626 13.8232 9.96967 13.5303L3.96967 7.53033C3.67678 7.23744 3.67678 6.76256 3.96967 6.46967Z"></path></svg></i>`;

const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M7.024 3.75c0-.966.784-1.75 1.75-1.75H20.25c.966 0 1.75.784 1.75 1.75v11.498a1.75 1.75 0 01-1.75 1.75H8.774a1.75 1.75 0 01-1.75-1.75V3.75zm1.75-.25a.25.25 0 00-.25.25v11.498c0 .139.112.25.25.25H20.25a.25.25 0 00.25-.25V3.75a.25.25 0 00-.25-.25H8.774z"/><path d="M1.995 10.749a1.75 1.75 0 011.75-1.751H5.25a.75.75 0 110 1.5H3.745a.25.25 0 00-.25.25L3.5 20.25c0 .138.111.25.25.25h9.5a.25.25 0 00.25-.25v-1.51a.75.75 0 111.5 0v1.51A1.75 1.75 0 0113.25 22h-9.5A1.75 1.75 0 012 20.25l-.005-9.501z"/></svg>`;

const successCopySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 1024 1024" id="successCopySvg" class="icon" version="1.1"><path d="M866.133333 258.133333L362.666667 761.6l-204.8-204.8L98.133333 618.666667 362.666667 881.066667l563.2-563.2z"/></svg>`;

const translateLanguageArray = [
  { id: "en", name: "English" },
  { id: "ar", name: "العربية" },
  { id: "ca", name: "Català" },
  { id: "zh-CN", name: "简体中文" },
  { id: "zh-TW", name: "繁體中文" },
  { id: "hr", name: "Hrvatski" },
  { id: "cs", name: "Čeština" },
  { id: "da", name: "Dansk" },
  { id: "nl", name: "Nederlands" },
  { id: "fi", name: "Suomi" },
  { id: "fr", name: "Français" },
  { id: "de", name: "Deutsch" },
  { id: "el", name: "Ελληνικά" },
  { id: "he", name: "עִברִית" },
  { id: "hi", name: "हिंदी" },
  { id: "hu", name: "Magyar" },
  { id: "id", name: "Bahasa Indonesia" },
  { id: "it", name: "Italiano" },
  { id: "ja", name: "日本語" },
  { id: "ko", name: "한국어" },
  { id: "ms", name: "Melayu" },
  { id: "nb", name: "Norsk" },
  { id: "pl", name: "Polski" },
  { id: "pt", name: "Português" },
  { id: "ro", name: "Română" },
  { id: "ru", name: "Русский" },
  { id: "sk", name: "Slovenčina" },
  { id: "es", name: "Español" },
  { id: "sv", name: "Svenska" },
  { id: "th", name: "ไทย" },
  { id: "tr", name: "Türkçe" },
  { id: "uk", name: "Українська" },
  { id: "vi", name: "Tiếng Việt" },
];

const bulletPointMarkList = [
  { id: "emoji", name: "Emoji" },
  { id: "disc", name: "Disc" },
  { id: "number", name: "Number" },
  { id: "none", name: "None" },
];

let htmlContentState = {
  keyInsights: "",
  timeStampsSummary: "",
  topComments: "",
  transcripts: "",
};

let copiedSummaryText = {
  keyInsights: "",
  timeStampsSummary: "",
  transcripts: "",
};

let copiedForSummaryText = {
  keyInsights: "Key Insights",
  timeStampsSummary: "Timestamped Summary",
  transcripts: "Transcript",
};

let summaryResponse = {
  keyInsights: "",
  timeStampsSummary: {
    summary: "",
    topics: "",
  },
};

const state = {
  isSummarizeWindowRender: false,
  firstKeyInsightRequest: false,
  firstTimestampsRequest: false,
};

function setState(key, value) {
  if (key in state) {
    state[key] = value;
  } else {
    console.warn(`Unknown state key: ${key}`);
  }
}

function getState(key) {
  return state[key];
}

const settingsConfig = [
  {
    id: "untrap_add_emojis",
    storageKey: getConst.isAddEmojis,
    defaultValue: false,
    onChange: (value) =>
      handleSettingToggleChange({
        tabId: "timeStampsSummary",
        storageKey: getConst.isAddEmojis,
        checked: value.target.checked,
      }),
  },
  {
    id: "untrap_generate_automatically",
    storageKey: getConst.isGenerateAutomatically,
    defaultValue: true,
  },
  {
    id: "untrap_grouped",
    storageKey: getConst.keyInsightSectionGrouped,
    defaultValue: true,
    onChange: (value) =>
      handleSettingToggleChange({
        tabId: "keyInsights",
        storageKey: getConst.keyInsightSectionGrouped,
        checked: value.target.checked,
      }),
  },
  {
    id: "untrap_expand_collapse",
    storageKey: getConst.expandCollapseAddButton,
    defaultValue: false,
    onChange: (value) =>
      handleSettingToggleChange({
        tabId: "timeStampsSummary",
        storageKey: getConst.expandCollapseAddButton,
        checked: value.target.checked,
      }),
  },
  {
    id: "untrap_timestamps_link",
    storageKey: getConst.timestampsLinkAdd,
    defaultValue: true,
    onChange: (value) =>
      handleSettingToggleChange({
        tabId: "timeStampsSummary",
        storageKey: getConst.timestampsLinkAdd,
        checked: value.target.checked,
      }),
  },
];

const functionConfig = {
  translateLanguageConfig: {
    storageKey: getConst.transcriptTranslateLanguage,
    defaultValue: "English",
    itemsArray: translateLanguageArray,
    selectorClass: ".language-selector",
    menuId: "#transcript-language-menu",
    textSelector: "#languageText",
    abbreviationSelector: "#languageAbbreviation",
    itemClass: "transcript-language-item",
    itemNameClass: ".transcript-language-item-name",
  },
  bulletPointConfig: {
    storageKey: getConst.pickedBulletPoint,
    defaultValue: "Emoji",
    itemsArray: bulletPointMarkList,
    selectorClass: ".bullet-point-selector",
    menuId: "#bullet-point-menu",
    textSelector: "#bullet-point-text",
    abbreviationSelector: undefined,
    itemClass: "bullet-points-item",
    itemNameClass: ".bullet-points-item-name",
  },
};

function getFetchData(currentTabElement) {
  const generateFunctions = {
    timeStampsSummary: () => generateTimestampVideoSummary(currentTabElement),
    keyInsights: () => generateKeyInsightSummary(currentTabElement),
    transcripts: () => generateTranslateVideoSummary(currentTabElement),
    topComments: () => generateTopCommentsSummary(currentTabElement),
  };

  const generateFunctionsDoubleRequest = {
    timeStampsSummary: () => {},
    keyInsights: () => {},
    transcripts: () => generateTranslateVideoSummary(currentTabElement),
    topComments: () => generateTopCommentsSummary(currentTabElement),
  };

  const abortControllers = {
    timeStampsSummary: [
      keyInsightAbortController,
      transcriptionAbortController,
      topCommentsAbortController,
    ],
    keyInsights: [
      videoTimestampAbortController,
      transcriptionAbortController,
      topCommentsAbortController,
    ],
    transcripts: [
      videoTimestampAbortController,
      keyInsightAbortController,
      topCommentsAbortController,
    ],
    topComments: [
      videoTimestampAbortController,
      keyInsightAbortController,
      transcriptionAbortController,
    ],
  };

  const abortControllersDoubleRequest = {
    timeStampsSummary: [
      transcriptionAbortController,
      topCommentsAbortController,
    ],
    keyInsights: [transcriptionAbortController, topCommentsAbortController],
    transcripts: [topCommentsAbortController],
    topComments: [transcriptionAbortController],
  };

  const abortControllerList =
    getState("firstKeyInsightRequest") && getState("firstTimestampsRequest")
      ? abortControllersDoubleRequest[currentTabElement.id]
      : abortControllers[currentTabElement.id];
  const generateFunction =
    getState("firstKeyInsightRequest") && getState("firstTimestampsRequest")
      ? generateFunctionsDoubleRequest[currentTabElement.id]
      : generateFunctions[currentTabElement.id];

  return { abortControllerList, generateFunction };
}

function getFreeQuotaReachedHtml(email, uuid, errorText) {
  const encodedEmail = encodeURIComponent(email);
  const encodeUUID = encodeURIComponent(uuid);

  const href = isBrowserSafari()
    ? `untrapforyt://`
    : `https://untrap.app/offer?email=${encodedEmail}&uuid=${encodeUUID}`;
  return `
  <div class="free-quota-container">
    <h3 style="text-align:center;">${
      errorText ? errorText : "You’ve reached the daily limit"
    }</h3>

    <a class="centered-button" target="_blank" href="${href}">Get Unlimited</a>
  </div>`;
}

function startLoader() {
  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );

  if (videoSummarizeWindowContainer) {
    const videoSummarizeContainer =
      videoSummarizeWindowContainer.querySelector("#contentContainer");

    const spinner = document.createElement("div");
    spinner.className = "untrap-spinner";
    videoSummarizeContainer.innerHTML = "";
    videoSummarizeContainer.appendChild(spinner);
  }
}

function getCustomErrorHtml(
  videoSummarizeContainer,
  errorText,
  retryClickHandler,
) {
  const freeQuotaHtml = `
                  <div class="free-quota-container">
                    <h3 style="text-align:center;">${errorText}</h3>

                    ${
                      retryClickHandler
                        ? `<a class="centered-button" id="retryButton">Try again</a>`
                        : ""
                    }
                  </div>`;

  const purifyFreeQuotaHtml = DOMPurify.sanitize(freeQuotaHtml);

  videoSummarizeContainer.innerHTML = purifyFreeQuotaHtml;

  if (retryClickHandler) {
    document.getElementById("retryButton").onclick = function () {
      startLoader();

      retryClickHandler();
    };
  }
}

function getRequestDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function onLoadGenerateSummarizeData(
  videoSummarizeContainer,
  onLoadGenerateDataFunction,
) {
  const currentHref = window.location.href;

  if (!isDesktop(currentHref)) {
    startLoader();
  }

  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const isGenerateAutomatically =
      summarizeWindowState[getConst.isGenerateAutomatically] ?? true;

    if (isGenerateAutomatically) {
      onLoadGenerateDataFunction();
    } else {
      videoSummarizeContainer.innerHTML = `
          <div class="summarize-on-click-button-container">
            <a class="centered-button summarize-centered-action-button">Summarize Video</a>
          </div>
        `;

      videoSummarizeContainer
        .querySelector(".summarize-on-click-button-container .centered-button")
        .addEventListener("click", function () {
          videoSummarizeContainer.innerHTML = "";
          startLoader();
          onLoadGenerateDataFunction();
        });
    }
  });
}

function onClickGenerateSummarizeData(
  abortControllers,
  onClickGenerateDataFunction,
) {
  allControllersAbort(abortControllers);

  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );
  const videoSummarizeContainer =
    videoSummarizeWindowContainer.querySelector("#contentContainer");

  setTimeout(() => {
    browser.storage.local.get(getConst.system, function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};

      const isGenerateAutomatically =
        summarizeWindowState[getConst.isGenerateAutomatically] ?? true;

      if (isGenerateAutomatically) {
        onClickGenerateDataFunction();
      } else {
        videoSummarizeContainer.innerHTML = `
            <div class="summarize-on-click-button-container">
              <a class="centered-button summarize-centered-action-button">Summarize Video</a>
            </div>
          `;

        videoSummarizeContainer
          .querySelector(
            ".summarize-on-click-button-container .centered-button",
          )
          .addEventListener("click", function () {
            videoSummarizeContainer.innerHTML = "";
            startLoader();
            onClickGenerateDataFunction();
          });
      }
    });
  }, 500);
}

async function summarizeFetchFunction(
  body,
  controller,
  fetchUrl,
  timeoutMs = 60_000,
) {
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(fetchUrl, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.json();

    clearTimeout(id);

    throw new Error(`${errorText.error}`);
  }

  const data = await response.json();

  clearTimeout(id);

  return data;
}

function allControllersAbort(abortControllers) {
  if (abortControllers.length) {
    abortControllers.forEach((controller) => {
      if (controller) {
        controller.abort();
      }
    });
  }
}

function asyncSetStorage(name, value, systemState, summarizeWindowState) {
  return new Promise((resolve, reject) => {
    setSystemConfigStorage({
      systemState,
      newState: {
        [getConst.summarizeWindowState]: {
          ...summarizeWindowState,
          [name]: value,
        },
      },
      callback: () => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve();
        }
      },
    });
  });
}

function handleSettingToggleChange({ tabId, storageKey, checked }) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemStateForAsyncStorage = obj[getConst.system] ?? {};
    const summarizeWindowStateForAsyncStorage =
      systemStateForAsyncStorage[getConst.summarizeWindowState] ?? {};

    const videoSummarizeWindowContainer = document.getElementById(
      "videoSummarizeWindowContainer",
    );

    const videoSummarizeContainer =
      videoSummarizeWindowContainer.querySelector("#contentContainer");

    asyncSetStorage(
      storageKey,
      checked,
      systemStateForAsyncStorage,
      summarizeWindowStateForAsyncStorage,
    )
      .then(() => {
        browser.storage.local.get(getConst.system, function (obj) {
          const systemState = obj[getConst.system] ?? {};
          const summarizeWindowState =
            systemState[getConst.summarizeWindowState] ?? {};

          const bulletPoint = summarizeWindowState[getConst.pickedBulletPoint];
          const isGrouped =
            summarizeWindowState[getConst.keyInsightSectionGrouped];
          const timestampsLinkAdd =
            summarizeWindowState[getConst.timestampsLinkAdd];
          const expandCollapseAddButton =
            summarizeWindowState[getConst.expandCollapseAddButton];
          const isAddEmojis = summarizeWindowState[getConst.isAddEmojis];

          const currentTab = videoSummarizeWindowContainer.querySelector(
            ".tabs-element[select]",
          );

          if (currentTab.id === tabId) {
            if (tabId === "keyInsights") {
              setKeyInsightCachedData(
                videoSummarizeContainer,
                bulletPoint,
                isGrouped,
              );
            }

            if (tabId === "timeStampsSummary") {
              copiedSummaryText.timeStampsSummary = "";
              copiedSummaryText.timeStampsSummary += `${getVideoName()}\n\n`;

              const parsedHtml = parseAndGenerateVideoTimestampsHTML(
                summaryResponse.timeStampsSummary.summary,
                summaryResponse.timeStampsSummary.topics,
                isAddEmojis,
                timestampsLinkAdd,
                expandCollapseAddButton,
              );

              const purifyParsedHtml = DOMPurify.sanitize(parsedHtml);

              videoSummarizeContainer.innerHTML = purifyParsedHtml;

              htmlContentState.timeStampsSummary =
                videoSummarizeContainer.innerHTML;

              expandAndCollapseHandler(videoSummarizeContainer);

              if (timestampsLinkAdd) {
                const script = document.createElement("script");
                const scriptSrc =
                  "website/js/web-accessible-resources/timeStampClick.js";

                if (isSafari()) {
                  fetch(scriptSrc)
                    .then((response) => response.text())
                    .then((scriptText) => {
                      const script = document.createElement("script");
                      script.textContent = `(function(){\n${scriptText}\n})();`;
                      (
                        document.documentElement ||
                        document.head ||
                        document.body
                      ).appendChild(script);
                    });
                } else {
                  script.src = browser.runtime.getURL(scriptSrc);

                  document.body.appendChild(script);
                }
              }
            }
          }
        });
      })
      .catch((error) => {
        console.error("Error", error);
      });
  });
}

function resetState(state, callback) {
  Object.keys(state).forEach((key) => {
    if (typeof state[key] === "object" && state[key] !== null) {
      resetState(state[key]);
    } else {
      state[key] = "";
    }
  });

  if (typeof callback === "function") {
    callback();
  }
}

function copyButtonDisabledHandler(isSetDisabled = false) {
  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );

  if (videoSummarizeWindowContainer) {
    const copyButton = videoSummarizeWindowContainer.querySelector(
      ".copy-summarize-button",
    );

    if (isSetDisabled) {
      if (copyButton && !copyButton.hasAttribute("disabled")) {
        copyButton.setAttribute("disabled", "");
      }
    } else {
      if (copyButton && copyButton.hasAttribute("disabled")) {
        copyButton.removeAttribute("disabled");
      }
    }
  }
}

function getVideoName() {
  const currentHref = window.location.href;
  const titleContainer = isDesktop(currentHref)
    ? document
        .getElementById("above-the-fold")
        .querySelector("#title")
        .querySelector("h1")
        .querySelector("yt-formatted-string")
    : document
        .querySelector("h2.slim-video-information-title")
        .querySelector(`span.yt-core-attributed-string[role="text"]`);

  if (titleContainer) {
    return titleContainer.textContent;
  } else {
    return "Title not found";
  }
}

function setKeyInsightCachedData(
  videoSummarizeContainer,
  bulletPoint,
  isGrouped,
) {
  copiedSummaryText.keyInsights = "";
  copiedSummaryText.keyInsights += `${getVideoName()}\n\n`;

  const parsedKeyInsightHtml = parseAndGenerateKeyInsightsHTML(
    summaryResponse.keyInsights,
    bulletPoint,
    isGrouped,
  );

  const purifyParsedKeyInsightHtml = DOMPurify.sanitize(parsedKeyInsightHtml);

  videoSummarizeContainer.innerHTML = purifyParsedKeyInsightHtml;

  htmlContentState.keyInsights = videoSummarizeContainer.innerHTML;
}

function summarizeWindowCenteringContentHandler() {
  browser.storage.local.get(
    [getConst.system, getConst.runtimeSnapshot, getConst.runtimeSnapshot],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};

      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

      const videoPageCentered =
        flags["untrap_video_page_center_content"] ?? false;
      const hideRelatedVideos =
        flags["untrap_video_page_hide_related_videos"] ?? false;

      const isShowSummarizeWindow =
        summarizeWindowState[getConst.isShowSummarizeWindow] ?? false;

      const summarizeParentSelector =
        videoPageCentered && hideRelatedVideos
          ? "ytd-watch-flexy div#columns div#secondary #videoSummarizeWindowContainer"
          : "ytd-watch-flexy div#columns div#primary div#below ytd-watch-metadata #videoSummarizeWindowContainer";

      if (document.querySelector(summarizeParentSelector)) {
        if (isShowSummarizeWindow) {
          document.querySelector(summarizeParentSelector).remove();
          setTimeout(() => {
            renderSummarizeWindow();
          }, 100);
        }
      }
    },
  );
}

function timestampsClickScriptHandler({ isAddScript }) {
  const timeStampClickScript = document.querySelector(`#timeStampClick`);

  if (isAddScript) {
    if (timeStampClickScript) {
      timeStampClickScript.remove();
    }

    const script = document.createElement("script");
    script.id = "timeStampClick";
    const scriptSrc = "website/js/web-accessible-resources/timeStampClick.js";

    if (isSafari()) {
      fetch(scriptSrc)
        .then((response) => response.text())
        .then((scriptText) => {
          const script = document.createElement("script");
          script.textContent = `(function(){\n${scriptText}\n})();`;
          (
            document.documentElement ||
            document.head ||
            document.body
          ).appendChild(script);
        });
    } else {
      script.src = browser.runtime.getURL(scriptSrc);

      document.body.appendChild(script);
    }
  } else {
    if (timeStampClickScript) {
      timeStampClickScript.remove();
    }
  }
}
