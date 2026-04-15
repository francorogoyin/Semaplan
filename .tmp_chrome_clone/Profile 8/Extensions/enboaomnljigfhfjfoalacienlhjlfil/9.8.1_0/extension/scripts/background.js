const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
const isSafari =
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome");

if (isFirefox) {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      browser.tabs.create({
        url: "untrap-privacy-policy.html",
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

// Check pro things
if (isSafari) {
  function getProStatus() {
    // Send Message to app
    browser.runtime.sendNativeMessage(
      "application.id",
      { message: "getProStatus" },
      function (appResponse) {
        // Send Response back to popup

        browser.runtime
          .sendMessage({
            command: "getProStatusResponse",
            isPRO: appResponse.isPRO,
            uuid: appResponse.uuid,
          })
          .then((response) => {});
      }
    );
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "getProStatus") {
      getProStatus();
    }
  });
}

// Listen messages from popup
