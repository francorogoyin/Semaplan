let keyInsightAbortController;

function getBulletHtml(bulletPoint, emoji, index) {
  let bulletHtml = "";
  switch (bulletPoint) {
    case "Emoji":
      bulletHtml = emoji
        ? `<span id="key-insight-bullet-point">${emoji}</span>`
        : "";
      break;
    case "Disc":
      bulletHtml = `<span id="key-insight-bullet-point" disc>•</span>`;
      break;
    case "Number":
      bulletHtml = `<span id="key-insight-bullet-point">${index}.</span>`;
      break;
    case "None":
      bulletHtml = "";
      break;
    default:
      bulletHtml = "";
  }
  return bulletHtml;
}

function extractBulletValue(bulletHtml) {
  const regex = /<span id="key-insight-bullet-point"(?: disc)?>(.*?)<\/span>/;
  const match = bulletHtml.match(regex);
  return match ? match[1] : "";
}

function parseAndGenerateKeyInsightsHTML(
  inputText,
  bulletPoint,
  isGrouped,
  isNeedWriteCopyText = true,
) {
  const emojiRegex = /%\*%(.+?)%\*%/g;
  const sectionRegex = /###\s*([^\n]+)\n([\s\S]*?)(?=###|$)/g;
  let currentNumber = 0;

  const insightsArray = Array.from(inputText.matchAll(sectionRegex)).map(
    (match) => {
      const title = match[1].trim();
      const titleToPresent = isGrouped ? title : "";

      if (isNeedWriteCopyText) {
        copiedSummaryText.keyInsights += `${
          titleToPresent ? `${titleToPresent}\n\n` : ""
        }`;
      }

      const body = match[2].trim();
      const lines = body
        .split("\n")
        .filter((line) => line.trim().startsWith("-"))
        .map((line, index) => {
          const parts = line
            .split("|")
            .map((p) => p.trim())
            .filter(Boolean);
          if (!parts.length) return "";

          const emojiMatch = parts[0].match(emojiRegex);
          const emoji = emojiMatch ? emojiMatch[0].replace(/%\*%/g, "") : "";

          const sentence = parts
            .slice(1)
            .map((p) => p.trim())
            .join(" ")
            .trim();

          currentNumber++;

          const bulletHtml = getBulletHtml(bulletPoint, emoji, currentNumber);

          const bulletPointToPresent = extractBulletValue(bulletHtml);

          if (isNeedWriteCopyText) {
            copiedSummaryText.keyInsights += `${
              bulletPointToPresent
                ? `${bulletPointToPresent} ${sentence}`
                : `${sentence}`
            }\n\n`;
          }

          return `<span style='margin-bottom: 12px; display:inline-flex; align-items: flex-start'>
                    <div>${bulletHtml}</div>
                    <div>${sentence}</div>
                  </span>`;
        });
      return {
        title: titleToPresent,
        description: lines.join("\n"),
      };
    },
  );

  if (!insightsArray.length) {
    console.warn("No insights found");
    return `<div>
      <h2>No Key Insights Found</h2>
    </div>`;
  }

  const htmlContent = `
   <div id="key-insight-summary-container">
     <h2>Key Insights</h2>
     <ul>
       ${insightsArray
         .map(
           ({ title, description }) => `
             <li ${isGrouped ? "grouped" : ""}>
               ${title ? `<h3 style="margin-bottom: 10px;">${title}</h3>` : ""}
               ${description}
             </li>
           `,
         )
         .join("")}
     </ul>
   </div>
 `;

  return htmlContent;
}

function generateKeyInsightSummary(tabItem) {
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
      const bulletPoint =
        summarizeWindowState[getConst.pickedBulletPoint] ?? "Emoji";
      const isGrouped =
        summarizeWindowState[getConst.keyInsightSectionGrouped] ?? true;

      const userIdentifier = sharedState[getConst.userUniqueIdentifier] ?? "";

      const currentDate = getRequestDate();

      setState("firstKeyInsightRequest", true);

      const currentHref = window.location.href;
      const videoSummarizeWindowContainer = document.getElementById(
        "videoSummarizeWindowContainer",
      );

      if (videoSummarizeWindowContainer) {
        const videoSummarizeContainer =
          videoSummarizeWindowContainer.querySelector("#contentContainer");

        keyInsightAbortController = new AbortController();

        try {
          const keyInsight = await summarizeFetchFunction(
            {
              url: currentHref,
              language: languageToTranslate,
              user_identifier: userIdentifier,
              request_date: currentDate,
              isAddEmojis: bulletPoint === "Emoji" ? true : false,
            },
            keyInsightAbortController,
            "https://untrap.app/api/summarize/insight",
          );

          if (videoSummarizeContainer) {
            copiedSummaryText.keyInsights = "";

            setState("firstKeyInsightRequest", false);

            summaryResponse.keyInsights = "";

            copiedSummaryText.keyInsights += `${getVideoName()}\n\n`;

            if (tabItem && tabItem.hasAttribute("select")) {
              videoSummarizeContainer.innerHTML = "";

              const parsedKeyInsightHtml = parseAndGenerateKeyInsightsHTML(
                keyInsight.insight,
                bulletPoint,
                isGrouped,
                false,
              );

              const purifyParsedKeyInsightHtml =
                DOMPurify.sanitize(parsedKeyInsightHtml);

              videoSummarizeContainer.innerHTML = purifyParsedKeyInsightHtml;
            }

            htmlContentState.keyInsights = parseAndGenerateKeyInsightsHTML(
              keyInsight.insight,
              bulletPoint,
              isGrouped,
              true,
            );

            summaryResponse.keyInsights = keyInsight.insight;

            copyButtonDisabledHandler();
          }
        } catch (error) {
          console.error("Error:", error);
          setState("firstKeyInsightRequest", false);

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
                  () => generateKeyInsightSummary(tabItem),
                );
              } else {
                getCustomErrorHtml(
                  videoSummarizeContainer,
                  "Something went wrong.",
                  () => generateKeyInsightSummary(tabItem),
                );
              }
          }
        }
      }
    },
  );
}
