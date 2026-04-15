let currentUrl = "";

function videoSummaryChangeTabsHandler(
  videoSummarizeWindowContainer,
  videoSummarizeContainer,
) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const isShowSummarizeWindow =
      summarizeWindowState[getConst.isShowSummarizeWindow] ?? false;

    const currentHref = window.location.href;

    if (isShowSummarizeWindow && currentHref.includes("watch?v=")) {
      const tabsElements =
        videoSummarizeWindowContainer.querySelectorAll(".tabs-element");

      const insightTab = videoSummarizeWindowContainer.querySelector(
        `.tabs-element[id="keyInsights"]`,
      );
      const timestampsTab = videoSummarizeWindowContainer.querySelector(
        `.tabs-element[id="timeStampsSummary"]`,
      );

      timestampsClickScriptHandler({ isAddScript: true });

      tabsElements.forEach((item) => {
        const currentTab =
          summarizeWindowState[getConst.pickedTab] ?? "keyInsights";
        const isSelected = currentTab === item.id;

        if (isSelected) {
          item.setAttribute("select", "");
        }

        videoSummarizeWindowContainer
          .querySelectorAll(".tabs-element:not([select])")
          .forEach((tab) => {
            tab.dataset.clickDisabled = "false";
          });

        if (isSelected) {
          switch (item.id) {
            case "timeStampsSummary":
              onLoadGenerateSummarizeData(videoSummarizeContainer, () => {
                generateTimestampVideoSummary(timestampsTab);
                generateKeyInsightSummary(insightTab);
              });
              break;

            case "keyInsights":
              onLoadGenerateSummarizeData(videoSummarizeContainer, () => {
                generateKeyInsightSummary(insightTab);
                generateTimestampVideoSummary(timestampsTab);
              });
              break;

            case "transcripts":
              onLoadGenerateSummarizeData(videoSummarizeContainer, () =>
                generateTranslateVideoSummary(item),
              );
              break;

            case "topComments":
              onLoadGenerateSummarizeData(videoSummarizeContainer, () =>
                generateTopCommentsSummary(item),
              );
              break;

            default:
              break;
          }
        }

        if (!item.dataset.hasClickHandler) {
          item.addEventListener("click", function () {
            browser.storage.local.get(getConst.system, function (obj) {
              const systemState = obj[getConst.system] ?? {};
              const summarizeWindowState =
                systemState[getConst.summarizeWindowState] ?? {};

              const isAddEmojis =
                summarizeWindowState[getConst.isAddEmojis] ?? false;
              const timestampsLinkAdd =
                summarizeWindowState[getConst.timestampsLinkAdd] ?? true;
              const expandCollapseAddButton =
                summarizeWindowState[getConst.expandCollapseAddButton] ?? false;
              const bulletPoint =
                summarizeWindowState[getConst.pickedBulletPoint] ?? "Emoji";
              const isGrouped =
                summarizeWindowState[getConst.keyInsightSectionGrouped] ?? true;

              videoSummarizeWindowContainer
                .querySelectorAll(".tabs-element:not([select])")
                .forEach((tab) => {
                  tab.dataset.clickDisabled = "false";
                });

              const { abortControllerList, generateFunction } =
                getFetchData(item);

              if (item.dataset.clickDisabled === "false") {
                item.dataset.clickDisabled = "true";

                if (
                  htmlContentState[item.id] &&
                  item.id === "timeStampsSummary"
                ) {
                  if (
                    summaryResponse.timeStampsSummary.summary &&
                    summaryResponse.timeStampsSummary.topics
                  ) {
                    htmlContentState.timeStampsSummary =
                      parseAndGenerateVideoTimestampsHTML(
                        summaryResponse.timeStampsSummary.summary,
                        summaryResponse.timeStampsSummary.topics,
                        isAddEmojis,
                        timestampsLinkAdd,
                        expandCollapseAddButton,
                        true,
                      );
                  }
                }

                if (htmlContentState[item.id] && item.id === "keyInsights") {
                  if (summaryResponse.keyInsights) {
                    htmlContentState.keyInsights =
                      parseAndGenerateKeyInsightsHTML(
                        summaryResponse.keyInsights,
                        bulletPoint,
                        isGrouped,
                        true,
                      );
                  }
                }

                const htmlContent = htmlContentState[item.id];
                const purifyHtmlContent = DOMPurify.sanitize(htmlContent);

                if (htmlContent && htmlContent !== "") {
                  allControllersAbort(abortControllerList);

                  videoSummarizeContainer.innerHTML = purifyHtmlContent;

                  if (item.id === "timeStampsSummary") {
                    expandAndCollapseHandler(videoSummarizeContainer);
                  }

                  if (item.id === "transcripts") {
                    loadMoreTranslate(videoSummarizeContainer, currentHref);
                  }
                  item.dataset.clickDisabled = "false";
                } else {
                  startLoader();

                  if (abortControllerList && generateFunction) {
                    onClickGenerateSummarizeData(
                      abortControllerList,
                      generateFunction,
                    );
                  }
                }
              }
            });
          });

          item.dataset.hasClickHandler = true;
        }
      });
    }
  });
}

function makeRequestWhenVideoSummarizeWindowOpen(changes) {
  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.summarizeWindowState,
    getConst.isShowSummarizeWindow,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  const abortControllers = [
    videoTimestampAbortController,
    keyInsightAbortController,
    topCommentsAbortController,
    transcriptionAbortController,
  ];

  if (newValue) {
    getVideoSummarizeContainer();
  } else {
    allControllersAbort(abortControllers);
  }
}

function getVideoSummarizeContainer() {
  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );
  if (videoSummarizeWindowContainer) {
    const videoSummarizeContainer =
      videoSummarizeWindowContainer.querySelector("#contentContainer");

    if (videoSummarizeContainer) {
      videoSummaryChangeTabsHandler(
        videoSummarizeWindowContainer,
        videoSummarizeContainer,
      );
    }
  }
}

const handleMobileUrlChange = () => {
  resetState(htmlContentState);

  resetState(copiedSummaryText, () => {
    copyButtonDisabledHandler(true);
  });
  resetState(summaryResponse);
  setState("firstKeyInsightRequest", false);
  setState("firstTimestampsRequest", false);

  const hydrationObserver = new MutationObserver(() => {
    const target = document.querySelector(
      "ytm-slim-video-metadata-section-renderer h2.slim-video-information-title",
    );

    if (target) {
      hydrationObserver.disconnect();

      setTimeout(() => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }, 700);
    }
  });

  hydrationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

const handleDesktopUrlChange = () => {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const sharedState = systemState[getConst.sharedState] ?? {};
    const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

    if (uuid) {
      startLoader();
    }
    resetState(copiedSummaryText, () => {
      copyButtonDisabledHandler(true);
    });
    resetState(htmlContentState);
    resetState(summaryResponse);
    setState("firstKeyInsightRequest", false);
    setState("firstTimestampsRequest", false);
    getVideoSummarizeContainer();
  });
};

const handleUrlChange = () => {
  const newUrl = window.location.href;
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;

    if (isDesktop(currentUrl)) {
      handleDesktopUrlChange();
    } else {
      handleMobileUrlChange();
    }
  }
};

const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function (...args) {
  originalPushState.apply(this, args);
  setTimeout(handleUrlChange, 0);
};

history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  setTimeout(handleUrlChange, 0);
};

window.addEventListener("popstate", handleUrlChange);

let urlCheckInterval;

const startUrlTracking = () => {
  urlCheckInterval = setInterval(handleUrlChange, 500);
};

const stopUrlTracking = () => {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval);
    urlCheckInterval = null;
  }
};

const observer = new MutationObserver(() => {
  const videoSummarizeWindowContainer = document.querySelector(
    `${
      isDesktop(window.location.href)
        ? `ytd-watch-flexy div#columns div#secondary`
        : "ytm-slim-video-metadata-section-renderer h2.slim-video-information-title"
    }`,
  );

  const summarizeWrapper = document.querySelector(
    "#videoSummarizeWindowContainer",
  );

  if (videoSummarizeWindowContainer && !summarizeWrapper) {
    observer.disconnect();

    renderSummarizeWindow();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  currentUrl = window.location.href;

  browser.storage.onChanged.addListener(
    makeRequestWhenVideoSummarizeWindowOpen,
  );

  startUrlTracking();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});

window.addEventListener("beforeunload", () => {
  stopUrlTracking();
});
