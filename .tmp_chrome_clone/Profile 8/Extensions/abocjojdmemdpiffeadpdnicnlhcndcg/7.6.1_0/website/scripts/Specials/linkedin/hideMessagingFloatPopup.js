function hideMessagingFloatPopup(value) {
  const interopOutlet = document.querySelector(
    'div[data-testid="interop-shadowdom"]',
  );
  if (!interopOutlet) return;

  const shadowRoot = interopOutlet.shadowRoot;
  if (!shadowRoot) return;

  const msgOverlay = shadowRoot.querySelector("aside#msg-overlay");
  if (msgOverlay) {
    if (value) {
      msgOverlay.style.display = "none";
    } else {
      msgOverlay.style.display = "flex";
    }
  }
}
