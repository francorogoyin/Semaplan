let videoTimestampAbortController;

function waitForVideoDuration(video, timeout = 2000) {
  return new Promise((resolve) => {
    if (video.duration && video.duration > 0) {
      resolve(Math.floor(video.duration));
      return;
    }

    let timeoutId;

    const handleLoadedMetadata = () => {
      if (video.duration && video.duration > 0) {
        clearTimeout(timeoutId);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        resolve(Math.floor(video.duration));
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    timeoutId = setTimeout(() => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      resolve(0);
    }, timeout);
  });
}

function convertTimeToSeconds(timeString) {
  const parts = timeString.split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  return null;
}

function formatSummaryLine(emojiIcon, formattedTime, title, timestampsLinkAdd) {
  const parts = [];

  if (emojiIcon) {
    parts.push(emojiIcon);
  }

  if (timestampsLinkAdd) {
    parts.push(formattedTime);
  }

  parts.push(title);

  return parts.join(" ");
}

function expandAndCollapseHandler(videoSummarizeContainer) {
  const expandContainers = videoSummarizeContainer.querySelectorAll(
    ".timestamp-description-expand",
  );

  expandContainers.forEach((expand) => {
    expand.onclick = function () {
      const expandWord = expand.querySelector("span");
      const parentDiv = expand.parentElement;
      const descriptionBlock =
        parentDiv.parentElement.parentElement.querySelector(
          ".timestamp-description-block",
        );

      if (expand.hasAttribute("expand")) {
        expand.removeAttribute("expand");
        expandWord.innerHTML = "Expand";

        if (descriptionBlock.hasAttribute("expand")) {
          descriptionBlock.removeAttribute("expand");
        }
      } else {
        expand.setAttribute("expand", "");
        expandWord.innerHTML = "Collapse";

        if (descriptionBlock) {
          descriptionBlock.setAttribute("expand", "");
        }
      }
    };
  });
}

function parseAndGenerateVideoTimestampsHTML(
  summary,
  topics,
  isAddEmojis,
  timestampsLinkAdd,
  expandCollapseAddButton,
  isNeedWriteCopyText = true,
) {
  const summarySection = summary
    .replace("### Summary of Topics Discussed in the Video:", "")
    .trim();

  if (isNeedWriteCopyText) {
    copiedSummaryText.timeStampsSummary += `${summarySection}\n\n`;
  }

  const topicsSection = topics.trim();

  const topicsArray = topicsSection
    .split("\n\n")
    .map((topicBlock) => {
      if (topicBlock.length) {
        let [timeString, rest] = topicBlock
          .split("] ")
          .map((part, index) => (index === 0 ? part + "]" : part));

        if (!rest || !timeString) return null;

        const [title, ...descriptionParts] = rest.split("|");
        const descriptionPart = descriptionParts.join("|").trim();

        if (!title) return null;

        const [emojiIconRaw, timestampPartRaw] = timeString.split("|");

        const emojiIcon = emojiIconRaw.replace(/%\*%/g, "").trim();
        const formattedTime = timestampPartRaw.replace(/[\[\]]/g, "").trim();

        const fullSeconds = convertTimeToSeconds(formattedTime);

        if (fullSeconds === null) return null;

        if (isNeedWriteCopyText) {
          copiedSummaryText.timeStampsSummary +=
            formatSummaryLine(
              isAddEmojis ? emojiIcon : "",
              formattedTime,
              title.trim(),
              timestampsLinkAdd,
            ) + "\n\n";
        }

        let descriptionList = "";
        if (descriptionPart) {
          const listItems = descriptionPart
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item && item.startsWith("*"))
            .map((item) => {
              const cleanItem = item
                .replace(/^\*\s*/, "")
                .replace(/^\s+|\s+$/g, "")
                .trim();

              if (isNeedWriteCopyText) {
                copiedSummaryText.timeStampsSummary += `${
                  cleanItem ? `• ${cleanItem}\n` : ""
                }`;
              }

              if (cleanItem) {
                return `<li><span class="timestamps-description-dot">•</span><span>${cleanItem}</span></li>`;
              }
            })
            .filter(Boolean)
            .join("");

          if (listItems) {
            if (isNeedWriteCopyText) {
              copiedSummaryText.timeStampsSummary += `\n`;
            }

            descriptionList = `<ul class="timestamp-description-list" ${
              isAddEmojis ? "emojiList" : ""
            }>${listItems}</ul>`;
          }
        }

        return {
          title: title.trim(),
          fullSeconds,
          formattedTime,
          emoji: isAddEmojis ? emojiIcon : "",
          description: descriptionList,
        };
      }
    })
    .filter(Boolean);

  const htmlContent = `
    <div id="timestamp-summary-container">
        <h2>Timestamped Summary</h2>
        <h3>${summarySection}</h3>
        <ul>
            ${topicsArray
              .map((topic) => {
                if (!topic) return "";

                const {
                  fullSeconds,
                  formattedTime,
                  title,
                  emoji,
                  description,
                } = topic;

                return `
                    <li>
                        <div ${emoji ? 'style="display: flex; gap: 4px;"' : ""}>
                            ${emoji ? `<div><span>${emoji}</span></div>` : ""}
                            <div>
                                ${
                                  timestampsLinkAdd
                                    ? `<span id="timeStampFormattedTime" data-time="${fullSeconds}">${formattedTime}</span>`
                                    : ""
                                }
                                <span>${title}</span>
                                ${
                                  description && expandCollapseAddButton
                                    ? `<p class="timestamp-description-expand"><span>Expand</span> ${chevronIcon}</p>`
                                    : ""
                                }
                            </div>
                        </div>
                        <div class="timestamp-description-block ${
                          expandCollapseAddButton ? "" : "expand"
                        }">${description}</div>
                       
                    </li>
                `;
              })
              .join("")}
        </ul>
    </div>
`;

  return htmlContent;
}

function generateTimestampVideoSummary(tabItem) {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    async function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};
      const summarizeWindowState =
        systemState[getConst.summarizeWindowState] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const languageToTranslate =
        summarizeWindowState[getConst.transcriptTranslateLanguage] ?? "English";
      const userEmail =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";
      const isAddEmojis = summarizeWindowState[getConst.isAddEmojis] ?? false;

      const userIdentifier = sharedState[getConst.userUniqueIdentifier] ?? "";

      const timestampsLinkAdd =
        summarizeWindowState[getConst.timestampsLinkAdd] ?? true;
      const expandCollapseAddButton =
        summarizeWindowState[getConst.expandCollapseAddButton] ?? false;

      setState("firstTimestampsRequest", true);

      const currentDate = getRequestDate();

      const currentHref = window.location.href;
      const videoSummarizeWindowContainer = document.getElementById(
        "videoSummarizeWindowContainer",
      );

      if (videoSummarizeWindowContainer) {
        const videoSummarizeContainer =
          videoSummarizeWindowContainer.querySelector("#contentContainer");

        videoTimestampAbortController = new AbortController();

        try {
          const video = document.querySelector(".html5-video-player video");

          const videoDuration = await waitForVideoDuration(video, 2000);

          const summary = await summarizeFetchFunction(
            {
              url: currentHref,
              language: languageToTranslate,
              user_identifier: userIdentifier,
              request_date: currentDate,
              duration: videoDuration,
              isAddEmojis,
            },
            videoTimestampAbortController,
            "https://untrap.app/api/summarize/timestamp",
          );

          if (videoSummarizeContainer) {
            setState("firstTimestampsRequest", false);
            resetState(summaryResponse.timeStampsSummary);

            copiedSummaryText.timeStampsSummary = "";

            copiedSummaryText.timeStampsSummary += `${getVideoName()}\n\n`;

            if (tabItem && tabItem.hasAttribute("select")) {
              videoSummarizeContainer.innerHTML = "";

              const parsedTimestampsHtml = parseAndGenerateVideoTimestampsHTML(
                summary.timestamp.summary,
                summary.timestamp.topics,
                isAddEmojis,
                timestampsLinkAdd,
                expandCollapseAddButton,
                false,
              );

              const purifyParsedTimestampsHtml =
                DOMPurify.sanitize(parsedTimestampsHtml);

              videoSummarizeContainer.innerHTML = purifyParsedTimestampsHtml;
            }

            htmlContentState.timeStampsSummary =
              parseAndGenerateVideoTimestampsHTML(
                summary.timestamp.summary,
                summary.timestamp.topics,
                isAddEmojis,
                timestampsLinkAdd,
                expandCollapseAddButton,
                true,
              );

            summaryResponse.timeStampsSummary.summary =
              summary.timestamp.summary;
            summaryResponse.timeStampsSummary.topics = summary.timestamp.topics;

            expandAndCollapseHandler(videoSummarizeContainer);

            copyButtonDisabledHandler();
          }
        } catch (error) {
          console.error("Error:", error);

          setState("firstTimestampsRequest", false);

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
                  () => generateTimestampVideoSummary(tabItem),
                );
              } else {
                getCustomErrorHtml(
                  videoSummarizeContainer,
                  "Something went wrong.",
                  () => generateTimestampVideoSummary(tabItem),
                );
              }
          }
        }
      }
    },
  );
}
