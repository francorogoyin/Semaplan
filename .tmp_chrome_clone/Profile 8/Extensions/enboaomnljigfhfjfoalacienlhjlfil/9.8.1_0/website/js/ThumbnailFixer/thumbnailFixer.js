let thumbType = "hqdefault";

function replaceThumb(img, thumbType) {
  if (
    img?.src &&
    img.src.match(
      "https://i.ytimg.com/(vi|vi_webp)/.*/(hq1|hq2|hq3|hqdefault|mqdefault|sddefault|hq720)(_custom_[0-9]+)?\\.(jpg|webp)(\\?.*)?",
    )
  ) {
    const oldSRC = img.src;

    img.src = "";

    const imgExtensionMatch = oldSRC.match(/\.(jpg|webp)/i);
    const imgExt = imgExtensionMatch ? imgExtensionMatch[1] : "jpg";

    let url = oldSRC.replace(
      /(hq1|hq2|hq3|hqdefault|mqdefault|sddefault|hq720)(_custom_[0-9]+)?\.(jpg|webp)/i,
      `${thumbType}.${imgExt}`,
    );

    if (!url.includes("cachestring")) {
      url = url.split("?")[0] + "?cachestring";
    }

    img.classList.add("thumbReplaced");
    img.src = url;
  }
}

const lazySrcObserver = new MutationObserver((mutations) => {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const replaceType =
      flags["untrap_video_card_replace_thumbnail"] ?? "hqdefault";

    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "src") {
        const img = mutation.target;

        if (img.tagName === "IMG" && !img.classList.contains("thumbReplaced")) {
          replaceThumb(img, replaceType);
        }
      }
    }
  });
});

const thumbnailObserver = new MutationObserver(() => {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const replaceType =
      flags["untrap_video_card_replace_thumbnail"] ?? "hqdefault";

    const targetElements = document.querySelectorAll(
      "#thumbnail , yt-thumbnail-view-model, img.video-thumbnail-img",
    );

    if (targetElements.length > 0) {
      startThumbnailReplacing(replaceType);
      triggerThumbnailUpdate(replaceType);
    }
  });
});

function startThumbnailReplacingDesktop() {
  document.addEventListener("image-loaded", (e) => {
    if (!e.target.classList.contains("thumbReplaced")) {
      replaceThumb(e.target, thumbType);
    }
  });
}

function startThumbnailReplacingMobile() {
  function replaceMobileThumbnails(summaries) {
    for (const img of summaries[0].added) {
      if (!img.classList.contains("thumbReplaced")) {
        replaceThumb(img, thumbType);
      }
    }
  }

  var imgObserver = new MutationSummary({
    callback: replaceMobileThumbnails,
    queries: [
      {
        element: "img.video-thumbnail-img[src]",
      },
    ],
  });
}

function startThumbnailReplacing(attribute) {
  const currentHref = window.location.href;

  if (attribute === "hqdefault") {
    lazySrcObserver.disconnect();
    thumbnailObserver.disconnect();
  } else {
    const observerInterval = setInterval(() => {
      if (document.body) {
        lazySrcObserver.observe(document.body, {
          subtree: true,
          attributes: true,
          attributeFilter: ["src"],
        });
        thumbnailObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });

        clearInterval(observerInterval);
      }
    }, 500);
  }

  if (isDesktop(currentHref)) {
    startThumbnailReplacingDesktop();
  } else {
    startThumbnailReplacingMobile();
  }
}

function triggerThumbnailUpdate(thumbType) {
  const allThumbImages = document.querySelectorAll(
    "#thumbnail, yt-thumbnail-view-model, img.video-thumbnail-img",
  );

  for (const thumbnail of allThumbImages) {
    const img = thumbnail.querySelector("img");

    if (img) {
      replaceThumb(img, thumbType);
    } else if (thumbnail.hasAttribute("src")) {
      replaceThumb(thumbnail, thumbType);
    }
  }
}

browser.storage.local.get(
  [getConstNotSyncing.notSyncingState, getConst.runtimeSnapshot],
  function (obj) {
    const currentHref = window.location.href;

    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

    const extensionIsEnabled =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    const replaceType =
      flags["untrap_video_card_replace_thumbnail"] ?? "hqdefault";

    thumbType = replaceType;

    if (extensionIsEnabled && replaceType != "hqdefault") {
      const targetFinder = new MutationObserver((mutations, observer) => {
        const target = document.querySelector(
          isDesktop(currentHref)
            ? "#primary > ytd-rich-grid-renderer > #contents"
            : ".page-container ytm-browse .tab-content",
        );

        if (target) {
          observer.disconnect();

          thumbnailObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });

          lazySrcObserver.observe(target, {
            subtree: true,
            attributes: true,
            attributeFilter: ["src"],
          });
        }
      });

      const targetFinderObserverInterval = setInterval(() => {
        if (!document.body) return;

        targetFinder.observe(document.body, {
          childList: true,
          subtree: true,
        });

        clearInterval(targetFinderObserverInterval);
      }, 100);
    }
  },
);
