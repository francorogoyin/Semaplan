let transcriptionAbortController;

function parseAndGenerateTranscriptionHTML(
  translatedChunks,
  chunkLimitExceed,
  isNeedWriteCopyText = true,
) {
  const translateTextToPresent = translatedChunks
    .map((chunk) => `${chunk.transcript}`)
    .join("");

  if (isNeedWriteCopyText) {
    copiedSummaryText.transcripts += `${translateTextToPresent}\n\n`;
  }

  return `
    <div id="transcription-summary-container">
      <h2>Transcript</h2>

      <ul class="translate-text-container">
        ${translatedChunks
          .map((chunk) => `<li><span>${chunk.transcript}</span></li>`)
          .join("")}
      </ul>

      <div class="load-more-translate-container">
        ${
          chunkLimitExceed
            ? ""
            : `
            <div class="untrap-spinner"></div>  
            <button class="centered-button full-width">Load more</button>`
        }
      </div>
    </div>`;
}

function generateTranslateWithNewChunk(
  loadMoreButtonElement,
  translateTextContainer,
  loadSpinner,
  currentHref,
  videoSummarizeContainer,
) {
  browser.storage.local.get(getConst.system, async function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const sharedState = systemState[getConst.sharedState] ?? {};
    const userIdentifier = sharedState[getConst.userUniqueIdentifier] ?? "";
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const languageToTranslate =
      summarizeWindowState[getConst.transcriptTranslateLanguage] ?? "English";

    const currentDate = getRequestDate();

    loadMoreButtonElement.setAttribute("disabled", "");
    loadSpinner.setAttribute("show", "");

    transcriptionAbortController = new AbortController();

    const translateListItem = document.createElement("li");

    try {
      const translate = await summarizeFetchFunction(
        {
          url: currentHref,
          language: languageToTranslate,
          user_identifier: userIdentifier,
          request_date: currentDate,
          is_initial: false,
        },
        transcriptionAbortController,
        "https://untrap.app/api/summarize/transcription",
      );

      if (translate) {
        transcriptionAbortController = undefined;
        loadSpinner.removeAttribute("show");

        const translateChunkToPresent = translate.translated_chunk
          .map((chunk) => chunk.transcript)
          .join("");

        const parsedTranslatedChunks = translate.translated_chunk
          .map((chunk) => `<li><span>${chunk.transcript}</span></li>`)
          .join("");

        const purifyParsedTranslatedChunks = DOMPurify.sanitize(
          parsedTranslatedChunks,
        );

        translateTextContainer.innerHTML = purifyParsedTranslatedChunks;

        copiedSummaryText.transcripts += `${translateChunkToPresent}\n\n`;

        if (translate.chunk_limit_exceed) {
          translateListItem.innerHTML = `<span>Its all!</span>`;
          translateTextContainer.append(translateListItem);
          loadMoreButtonElement.remove();
        }

        loadMoreButtonElement.removeAttribute("disabled");

        htmlContentState.transcripts = videoSummarizeContainer.innerHTML;
      }
    } catch (error) {
      console.error("error: ", error.message);

      if (error.message !== "signal is aborted without reason") {
        transcriptionAbortController = undefined;
        loadSpinner.removeAttribute("show");
        translateListItem.innerHTML = `<span>Error retrieve translate for this part of video</span>`;
        translateTextContainer.append(translateListItem);
        loadMoreButtonElement.removeAttribute("disabled");
      }
    }
  });
}

function loadMoreTranslate(videoSummarizeContainer, currentHref) {
  const loadMoreButtonElement = videoSummarizeContainer.querySelector(
    "button.centered-button",
  );

  const translateTextContainer = videoSummarizeContainer.querySelector(
    "ul.translate-text-container",
  );

  const loadSpinner = videoSummarizeContainer.querySelector(
    ".load-more-translate-container .untrap-spinner",
  );

  if (loadMoreButtonElement && translateTextContainer) {
    loadMoreButtonElement.onclick = function () {
      generateTranslateWithNewChunk(
        loadMoreButtonElement,
        translateTextContainer,
        loadSpinner,
        currentHref,
        videoSummarizeContainer,
      );
    };
  }
}

function generateTranslateVideoSummary(tabItem) {
  browser.storage.local.get(
    [getConstNotSyncing.notSyncingState, getConst.system],
    async function (obj) {
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};

      const languageToTranslate =
        summarizeWindowState[getConst.transcriptTranslateLanguage] ?? "English";
      const userEmail =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

      const userIdentifier = sharedState[getConst.userUniqueIdentifier] ?? "";

      const currentDate = getRequestDate();

      const currentHref = window.location.href;
      const videoSummarizeWindowContainer = document.getElementById(
        "videoSummarizeWindowContainer",
      );

      if (videoSummarizeWindowContainer) {
        const videoSummarizeContainer =
          videoSummarizeWindowContainer.querySelector("#contentContainer");

        transcriptionAbortController = new AbortController();

        try {
          const translate = await summarizeFetchFunction(
            {
              url: currentHref,
              language: languageToTranslate,
              user_identifier: userIdentifier,
              request_date: currentDate,
              is_initial: true,
            },
            transcriptionAbortController,
            "https://untrap.app/api/summarize/transcription",
          );

          if (videoSummarizeContainer) {
            copiedSummaryText.transcripts += "";

            copiedSummaryText.transcripts += `${getVideoName()}\n\n`;

            if (tabItem && tabItem.hasAttribute("select")) {
              videoSummarizeContainer.innerHTML = "";

              const parsedTranscriptionHtml = parseAndGenerateTranscriptionHTML(
                translate.translated_chunk,
                translate.chunk_limit_exceed,
                false,
              );

              const purifyParsedTranscriptionHtml = DOMPurify.sanitize(
                parsedTranscriptionHtml,
              );

              videoSummarizeContainer.innerHTML = purifyParsedTranscriptionHtml;
            }

            htmlContentState.transcripts = parseAndGenerateTranscriptionHTML(
              translate.translated_chunk,
              translate.chunk_limit_exceed,
              true,
            );

            copyButtonDisabledHandler();

            transcriptionAbortController = undefined;
            loadMoreTranslate(videoSummarizeContainer, currentHref);
          }
        } catch (error) {
          transcriptionAbortController = undefined;
          if (error.message !== "signal is aborted without reason") {
            if (videoSummarizeContainer) {
              if (tabItem && tabItem.hasAttribute("select"))
                if (error.message === `You’ve reached the daily limit`) {
                  videoSummarizeContainer.innerHTML = getFreeQuotaReachedHtml(
                    userEmail,
                    userIdentifier,
                  );
                } else if (
                  error.message ===
                  "You have reached your free request limit. To continue using the summarize feature, please upgrade to Plus plan"
                ) {
                  videoSummarizeContainer.innerHTML = getFreeQuotaReachedHtml(
                    userEmail,
                    userIdentifier,
                    error.message,
                  );
                } else if (error.message === "Transcript not found") {
                  getCustomErrorHtml(videoSummarizeContainer, error.message);
                } else if (error.message === "Too many requests") {
                  getCustomErrorHtml(
                    videoSummarizeContainer,
                    "Too many requests. Please try again later",
                    () => generateTranslateVideoSummary(tabItem),
                  );
                } else {
                  getCustomErrorHtml(
                    videoSummarizeContainer,
                    "Something went wrong.",
                    () => generateTranslateVideoSummary(tabItem),
                  );
                }
            }
          }
        }
      }
    },
  );
}

browser.storage.onChanged.addListener(changeLanguageObserve);

function changeLanguageObserve(changes) {
  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.summarizeWindowState,
    getConst.transcriptTranslateLanguage,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );
  if (!videoSummarizeWindowContainer) return;

  const videoSummarizeContainer =
    videoSummarizeWindowContainer.querySelector("#contentContainer");
  if (!videoSummarizeContainer) return;

  const currentHref = window.location.href;

  if (transcriptionAbortController) {
    transcriptionAbortController.abort();

    const loadMoreButtonElement = videoSummarizeContainer.querySelector(
      "button.centered-button",
    );

    if (loadMoreButtonElement) {
      const translateTextContainer = videoSummarizeContainer.querySelector(
        "ul.translate-text-container",
      );

      const loadSpinner = videoSummarizeContainer.querySelector(
        ".load-more-translate-container .untrap-spinner",
      );

      generateTranslateWithNewChunk(
        loadMoreButtonElement,
        translateTextContainer,
        loadSpinner,
        currentHref,
      );
    } else {
      const translateTabElement =
        videoSummarizeContainer.querySelector("div#transcripts");

      generateTranslateVideoSummary(translateTabElement);
    }
  }
}
