window.app_language = (function getLangCodeByBrowser() {
  const locale = window.navigator.language || window.navigator.userLanguage;
  const primaryCode = locale.split("-")[0];

  if (primaryCode == "zh" && locale.includes("CN")) {
    return "zh-CN";
  } else if (primaryCode == "zh" && locale.includes("TW")) {
    return "zh-TW";
  } else {
    return primaryCode;
  }
})();

const script1 = document.createElement("script");
script1.src = browser.runtime.getURL("extension/scripts/screenTranslation.js");

script1.onload = function () {
  const script2 = document.createElement("script");
  script2.src = browser.runtime.getURL(
    "extension/screens/privacyPolicy/privacyPolicyForTab.js"
  );
  document.head.appendChild(script2);
};

document.head.appendChild(script1);
