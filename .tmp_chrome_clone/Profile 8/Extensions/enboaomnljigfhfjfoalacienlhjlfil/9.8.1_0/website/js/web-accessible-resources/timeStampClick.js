(function () {
  const player = document.getElementById("movie_player");

  if (player && typeof player.seekTo === "function") {
    const contentContainer =
      videoSummarizeWindowContainer.querySelector("#contentContainer");

    if (contentContainer) {
      const observer = new MutationObserver((mutations) => {
        const timeStampItems = contentContainer.querySelectorAll(
          "#timeStampFormattedTime"
        );

        if (timeStampItems.length > 0) {
          timeStampItems.forEach((item) => {
            const currentTimeCode = item.getAttribute("data-time");
            item.onclick = function () {
              player.seekTo(Number(currentTimeCode), true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            };
          });
        }
      });

      observer.observe(contentContainer, {
        childList: true,
        subtree: true,
      });
    }
  }
})();
