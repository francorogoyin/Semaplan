const theaterModeObserver = new MutationObserver(function (mutations) {
  const theaterButton = document.querySelector(
    "ytd-watch-flexy:not([theater]) .ytp-size-button",
  );

  var clicked = false;

  if (theaterButton) {
    theaterButton.click();
    clicked = true;
  }

  if (clicked) {
    setTimeout(function () {
      theaterModeObserver.disconnect();
    }, 2000);
  }
});

function autoTheatherModeHandler(attribute) {
  const theaterButton = document.querySelector(
    "ytd-watch-flexy .ytp-size-button",
  );

  if (theaterButton) {
    theaterButton.click();
  }

  if (!attribute) {
    theaterModeObserver.disconnect();
  }
}

function safe_autoExpandVideoDescription() {
  const observer = new MutationObserver(function (mutations) {
    const expandButton = document.querySelector(
      "tp-yt-paper-button#expand:not([hidden])",
    );

    var clicked = false;

    if (expandButton) {
      expandButton.click();
      clicked = true;
    }

    if (clicked) {
      setTimeout(function () {
        observer.disconnect();
      }, 2000);
    }
  });

  // Start observing changes in the DOM
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
  });
}

function safe_autoTheaterMode() {
  // Check if already not a Theater Mode
  const theaterIsRun = document.querySelector("ytd-watch-flexy:not([theater])");

  if (theaterIsRun) {
    // Start observing changes in the DOM
    let interval = setInterval(() => {
      if (document.querySelector("title")) {
        clearInterval(interval);
        theaterModeObserver.observe(document.querySelector("title"), {
          subtree: true,
          childList: true,
          attributes: true,
        });
      }
    }, 500);
  }
}

function safe_autoDisableAutoplay() {
  var interval = setInterval(function () {
    const autoplayButton = document.querySelector(
      ".ytp-button[data-tooltip-target-id='ytp-autonav-toggle-button']:has(.ytp-autonav-toggle-button[aria-checked='true'])",
    );

    var clicked = false;

    if (autoplayButton) {
      autoplayButton.click();
    }

    const offedAutoplayButton = document.querySelector(
      ".ytp-button[data-tooltip-target-id='ytp-autonav-toggle-button']:has(.ytp-autonav-toggle-button[aria-checked='false'])",
    );

    if (offedAutoplayButton) {
      clearInterval(interval);
    }
  }, 1000);
}

function safe_autoShowsChaptersInSidebar() {
  setTimeout(chapterCloseButtonHandler, 1000);

  function chapterCloseButtonHandler() {
    const chaptersContainer = document.querySelector(
      `ytd-engagement-panel-section-list-renderer[visibility=\"ENGAGEMENT_PANEL_VISIBILITY_HIDDEN\"][target-id="engagement-panel-macro-markers-auto-chapters"],
       ytd-engagement-panel-section-list-renderer[visibility=\"ENGAGEMENT_PANEL_VISIBILITY_HIDDEN\"][target-id="engagement-panel-macro-markers-description-chapters"]
      `,
    );

    if (chaptersContainer) {
      chaptersContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button");

        if (button && button.closest("#visibility-button")) {
          chaptersContainer.setAttribute("hide", "");
        }
      });
    }
  }
}

// MARK: - Enter Point

function videoPageIsOpened() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    // Auto Theater Mode
    const auto_theater = flags["untrap_video_page_auto_theater_mode"] ?? false;

    const expand_description =
      flags["untrap_video_page_auto_expand_description"] ?? false;

    const show_chapters =
      flags["untrap_video_page_auto_shows_chapters_in_sidebar"] ?? false;

    const disable_autoplay =
      flags["untrap_video_page_disable_autoplay"] ?? false;

    if (auto_theater) {
      safe_autoTheaterMode();
    }

    // Auto Expand Description

    if (expand_description) {
      safe_autoExpandVideoDescription();
    }

    // Observe click in chapters container

    if (show_chapters) {
      safe_autoShowsChaptersInSidebar();
    }

    // Disable Autoplay

    if (disable_autoplay) {
      safe_autoDisableAutoplay();
    }
  });
}
