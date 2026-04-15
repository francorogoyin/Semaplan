let topCommentsAbortController;

function generateTopCommentsHTML(summary, comments) {
  return `
      <div id="top-comments-summary-container">
         <h2>Top Comments</h2>
         <h3 style="margin-bottom: 20px;">${summary}</h3>
         <ul class="top-comments-list">
            ${comments
              .map((comment) => {
                if (!comment) return "";
                const { likes, username, avatar, text } = comment;
                return `
                <li class="top-comments-item-container">
                  <a target="_parent" href="https://www.youtube.com/${username}">
                     <img loading="lazy" src="${avatar}" alt="${username}" class="top-comments-item-author-image" /> 
                  </a>
                  <div class="top-comments-item-content">
                     <div class="top-comments-item-content-header">
                        <a target="_parent" href="https://www.youtube.com/${username}" class="top-comments-item-author-link">${username}</a>
                        <div class="top-comments-item-likes">
                           <div>${topCommentsLikeSvg}</div>
                           <div>
                              <span class="top-comments-item-likes-count">${likes}</span>
                           </div>
                        </div>
                     </div>
                     <div class="top-comments-item-content-text">
                        <span>${text}</span>
                     </div>
                  </div>
                </li>
                `;
              })
              .join("")}
         </ul>
      </div>
  `;
}

function generateTopCommentsSummary(tabItem) {
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

        topCommentsAbortController = new AbortController();

        try {
          const { summary, comments } = await summarizeFetchFunction(
            {
              url: currentHref,
              language: languageToTranslate,
              user_identifier: userIdentifier,
              request_date: currentDate,
            },
            topCommentsAbortController,
            "https://untrap.app/api/summarize/comments",
          );

          if (videoSummarizeContainer) {
            if (tabItem && tabItem.hasAttribute("select")) {
              videoSummarizeContainer.innerHTML = "";

              const parseTopCommentsHtml = generateTopCommentsHTML(
                summary,
                comments,
              );

              const purifyParseTopCommentsHtml =
                DOMPurify.sanitize(parseTopCommentsHtml);

              videoSummarizeContainer.innerHTML = purifyParseTopCommentsHtml;
            }

            htmlContentState.topComments = generateTopCommentsHTML(
              summary,
              comments,
            );
          }
        } catch (error) {
          console.error("Error:", error);

          if (videoSummarizeContainer) {
            if (tabItem && tabItem.hasAttribute("select")) {
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
              } else if (
                error.message === "No comments found or API limit exceeded"
              ) {
                getCustomErrorHtml(
                  videoSummarizeContainer,
                  "No comments found",
                );
              } else if (error.message === "Transcript not found") {
                getCustomErrorHtml(videoSummarizeContainer, error.message);
              } else if (error.message === "Too many requests") {
                getCustomErrorHtml(
                  videoSummarizeContainer,
                  "Too many requests. Please try again later",
                  () => generateTopCommentsSummary(tabItem),
                );
              } else {
                getCustomErrorHtml(
                  videoSummarizeContainer,
                  "Something went wrong.",
                  () => generateTopCommentsSummary(tabItem),
                );
              }
            }
          }
        }
      }
    },
  );
}
