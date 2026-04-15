// Redirect Shorts

function safe_redirectShorts() {
  const newUrl = location.href.replace("shorts", "watch");
  window.location.replace(newUrl);
}

// MARK: - Entry Point

function shortsPageIsOpened() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    // Redirect Shorts
    if (flags["untrap_redirect_shorts_to_exclude_player"] == true) {
      safe_redirectShorts();
    }
  });
}
