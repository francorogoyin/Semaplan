const STYLE_ATTR = `social-${websiteObject.name}-data-runtime-styles`;

let _linkedInStyles = null;

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (
        node.nodeName === "IFRAME" &&
        node.dataset?.testid === "interop-iframe"
      ) {
        if (_linkedInStyles) {
          node.addEventListener(
            "load",
            () => {
              injectIntoLinkedInIframe(_linkedInStyles);
            },
            { once: true },
          );
        }
      }
    }
  }
});

function injectIntoLinkedInIframe(styles) {
  const iframe = document.querySelector('iframe[data-testid="interop-iframe"]');
  if (!iframe) return;

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.head) return;

    const runtimeStyles = iframeDoc.querySelector(`style[${STYLE_ATTR}]`);

    if (!runtimeStyles) {
      const style = iframeDoc.createElement("style");
      style.setAttribute(STYLE_ATTR, "");
      style.textContent = styles;
      iframeDoc.head.appendChild(style);
    } else {
      runtimeStyles.textContent = styles;
    }
  } catch (e) {}
}

function observeLinkedInIframe() {}

function waitForBodyAndObserve() {
  const interval = setInterval(() => {
    if (document.body) {
      clearInterval(interval);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }, 100);
}

function applyStyles(styles) {
  if (websiteObject.name === "linkedin" && !isMobile) {
    _linkedInStyles = styles;
    injectIntoLinkedInIframe(styles);
  }

  const runtimeStyles = document.querySelector(`style[${STYLE_ATTR}]`);

  if (!runtimeStyles) {
    const style = document.createElement("style");
    style.setAttribute(STYLE_ATTR, "");
    style.textContent = styles;
    document.head.appendChild(style);
  } else {
    runtimeStyles.textContent = styles;
  }
}

function removeStyles() {
  if (websiteObject.name === "linkedin" && !isMobile) {
    _linkedInStyles = null;
    try {
      const iframe = document.querySelector(
        'iframe[data-testid="interop-iframe"]',
      );
      const iframeDoc =
        iframe?.contentDocument || iframe?.contentWindow?.document;
      iframeDoc?.querySelector(`style[${STYLE_ATTR}]`)?.remove();
    } catch (e) {}
  }

  const runtimeStyles = document.querySelector(`style[${STYLE_ATTR}]`);
  if (runtimeStyles) {
    runtimeStyles.remove();
  }

  removeTimerModal();
}

if (websiteObject.name === "linkedin" && !isMobile) {
  waitForBodyAndObserve();
}
