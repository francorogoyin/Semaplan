document.getElementById('continueBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "continue" });
    window.close(); // Đóng popup sau khi người dùng nhấn nút
  });
  