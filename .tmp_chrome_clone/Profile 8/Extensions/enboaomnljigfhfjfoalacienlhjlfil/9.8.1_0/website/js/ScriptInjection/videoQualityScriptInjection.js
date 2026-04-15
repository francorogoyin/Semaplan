browser.runtime.onMessage.addListener((message) => {
  if (message.action === "setYoutubeVideoQuality") {
    const videoQuality = message.videoQuality;

    window.postMessage({ type: "SET_VIDEO_QUALITY", videoQuality }, "*");
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data.type === "REQUEST_VIDEO_QUALITY") {
    browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
      const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
      const videoQualityValue = flags[getConst.videoQuality] ?? "auto";

      if (typeof videoQualityValue === "string") {
        window.postMessage(
          { type: "SET_VIDEO_QUALITY", videoQuality: videoQualityValue },
          "*",
        );
      }
    });
  }
});

function injectionChooseVideoQualityScript() {
  removeChooseVideoQualityScript();
  const script = document.createElement("script");

  const scriptSrc = browser.runtime.getURL(
    "website/js/web-accessible-resources/setVideoQuality.js",
  );

  if (isSafari()) {
    fetch(scriptSrc)
      .then((response) => response.text())
      .then((scriptText) => {
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

function removeChooseVideoQualityScript() {
  const script = document.querySelector(`script[src*="setVideoQuality.js"]`);

  if (script) {
    script.remove();
  }
}

function injectionChooseVideoQualityScriptListener(changes) {
  const values = getChangedValues(
    changes,
    getConst.optionsState,
    getConst.videoQuality,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  const newQuality = newValue ?? "auto";
  const oldQuality = oldValue ?? "auto";

  if (newQuality === oldQuality) return;

  if (newQuality !== "auto") {
    injectionChooseVideoQualityScript();
  } else {
    removeChooseVideoQualityScript();
  }
}

browser.storage.onChanged.addListener(
  injectionChooseVideoQualityScriptListener,
);

browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
  const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
  const videoQualityValue = flags[getConst.videoQuality] ?? "auto";

  if (videoQualityValue !== "auto") {
    window.addEventListener(
      "loadeddata",
      injectionChooseVideoQualityScript,
      true,
    );
  }
});
