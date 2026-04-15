function injectionSkipAdsScript() {
  removeSkipAdsScript();
  const script = document.createElement("script");

  const scriptSrc = browser.runtime.getURL(
    "website/js/web-accessible-resources/skipAdsOverrideClickEvent.js",
  );

  if (isSafari()) {
    fetch(scriptSrc)
      .then((response) => response.text())
      .then((scriptText) => {
        const script = document.createElement("script");
        script.textContent = `(function(){\n${scriptText}\n})();`;
        (
          document.documentElement ||
          document.head ||
          document.body
        ).appendChild(script);
      });

    return;
  }

  script.src = scriptSrc;
  document.body.appendChild(script);
}

function removeSkipAdsScript() {
  const script = document.querySelector(
    `script[src*="skipAdsOverrideClickEvent.js"]`,
  );

  if (script) {
    script.remove();
  }
}

function injectionSkipAdsScriptListener(changes) {
  const values = getChangedValues(
    changes,
    getConst.optionsState,
    getConst.skipVideoAds,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  const newEnabled = newValue ?? false;
  const oldEnabled = oldValue ?? false;

  if (newEnabled === oldEnabled) return;

  if (newEnabled) {
    injectionSkipAdsScript();
  } else {
    removeSkipAdsScript();
  }
}

browser.storage.onChanged.addListener(injectionSkipAdsScriptListener);

browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
  const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
  const isSkipVideoAds = flags[getConst.skipVideoAds] ?? false;

  if (isSkipVideoAds) {
    window.addEventListener("load", injectionSkipAdsScript, true);
  }
});
