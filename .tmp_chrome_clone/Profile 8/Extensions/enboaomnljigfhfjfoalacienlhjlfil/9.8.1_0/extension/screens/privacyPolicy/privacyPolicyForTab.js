function setToStorage(name, value) {
  browser.storage.local.set({ [name]: value });
}

const agreeButton = document.querySelector(
  "#privacyPolicyScreen #consent-agree",
);
const uninstallButton = document.querySelector(
  "#privacyPolicyScreen #uninstall-extension-button",
);

agreeButton.addEventListener("click", function () {
  setToStorage("untrap_is_agree_privacy_policy", true);

  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs.remove(tabs[0].id);
    browser.tabs.create({ url: "https://www.youtube.com" });
  });
});

uninstallButton.addEventListener("click", function () {
  if (browser.management && browser.management.uninstallSelf) {
    browser.management.uninstallSelf({
      showConfirmDialog: true,
    });
  } else {
    console.error("API management.uninstallSelf not allowed");
  }
});
