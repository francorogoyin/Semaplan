const shortsObserver = new MutationObserver(() => {
  const shortsPage = document.querySelector("shorts-page");
  if (!shortsPage) return;

  isolateCurrentShort();
});

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const isNeedDisableInfinityScroll =
      flags["untrap_shorts_page_disable_exclude_scrolling"] ?? false;

    if (isNeedDisableInfinityScroll) {
      shortsObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  });
});

function disableInfinityScrollOnShortsPage() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

    const value =
      flags["untrap_shorts_page_disable_exclude_scrolling"] ?? false;

    if (value) {
      const firstItem = document.querySelector(
        ".ytShortsCarouselCarouselItem:has(.html5-video-player)",
      );
      const wrapper = document.querySelector(
        ".ytShortsCarouselCarouselWrapper",
      );
      const host = document.querySelector("shorts-carousel");

      if (!firstItem || !wrapper || !host) return;

      wrapper.remove();

      host.prepend(firstItem);
    }
  });
}

function isolateCurrentShort() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

    const value =
      flags["untrap_shorts_page_disable_exclude_scrolling"] ?? false;

    const carouselObserver = new MutationObserver(() => {
      disableInfinityScrollOnShortsPage();
    });

    if (value) {
      carouselObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      carouselObserver.disconnect();
    }
  });
}
