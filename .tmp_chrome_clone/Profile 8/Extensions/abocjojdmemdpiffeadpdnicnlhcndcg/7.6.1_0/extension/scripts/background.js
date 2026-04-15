const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

if (isFirefox) {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      browser.tabs.create({
        url: "social-privacy-policy.html",
      });
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "uninstall_extension") {
      if (browser.management && browser.management.uninstallSelf) {
        browser.management
          .uninstallSelf({
            showConfirmDialog: true,
          })
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
      } else {
        console.error("API management.uninstallSelf not allowed");
        sendResponse({
          success: false,
          error: "API management.uninstallSelf not allowed",
        });
      }
      return true;
    }
  });
}
