const STYLE_ATTR = "data-runtime-styles";

function applyStyles(styles) {
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
  const runtimeStyles = document.querySelector(`style[${STYLE_ATTR}]`);
  const blurStyles = queryById("thumbnailFilterStyles");

  if (runtimeStyles) {
    runtimeStyles.remove();
  }

  if (blurStyles) {
    blurStyles.remove();
  }

  disabledAdditionalOptions();

  removeOlPrimaryAccentColor();
  removeOldAccentColor();
  removeOldFont();
}
