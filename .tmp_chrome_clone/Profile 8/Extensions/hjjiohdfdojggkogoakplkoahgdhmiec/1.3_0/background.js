chrome.action.onClicked.addListener((tab) => {
  const mediumDomain = "medium.com";
  const prefix = "https://freedium-mirror.cfd/";

  try {
    // Phân tích URL của tab hiện tại
    const urlObj = new URL(tab.url);
    const domain = urlObj.hostname;

    // Kiểm tra nếu domain là medium.com hoặc subdomain của nó
    if (domain === mediumDomain || domain.endsWith("." + mediumDomain)) {
      // Kiểm tra xem đoạn text đã có trong URL chưa để tránh thêm hai lần
      if (!tab.url.startsWith(prefix)) {
        const newUrl = `${prefix}${tab.url}`;
        chrome.tabs.update(tab.id, { url: newUrl });
      }
    } else {
      // Hiển thị popup khi không phải trang medium.com
      chrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
});

// Lắng nghe thông điệp từ popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "continue") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const prefix = "https://freedium-mirror.cfd/";

      // Xử lý chèn prefix cho URL bất kể có phải medium hay không
      if (!tab.url.startsWith(prefix)) {
        const newUrl = `${prefix}${tab.url}`;
        chrome.tabs.update(tab.id, { url: newUrl });
      }
    });
  }
});
