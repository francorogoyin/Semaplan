// MARK: - Acent Color

function removeOldAccentColor() {
  // Remove old styles

  if (queryById("accentColorStyles")) {
    queryById("accentColorStyles").remove();
  }
}

function validateAccentColor(colorToSet) {
  if (colorToSet != "default") {
    // Create a style element

    const styleElement = document.createElement("style");
    styleElement.id = "accentColorStyles";

    // Set the style content with dynamic CSS rules

    styleElement.textContent = `
                
                html {
                    --yt-spec-static-brand-red: ${colorToSet}!important;
                }

                [fill="#FF0000" i], [fill="#F00" i], [fill="red" i]  {
                    fill: ${colorToSet}!important;
                }

                .ytp-swatch-background-color {
                    background: ${colorToSet}!important;
                }
                
                .ytp-settings-button.ytp-hd-quality-badge:after, .ytp-settings-button.ytp-hdr-quality-badge:after, .ytp-settings-button.ytp-4k-quality-badge:after, .ytp-settings-button.ytp-5k-quality-badge:after, .ytp-settings-button.ytp-8k-quality-badge:after, .ytp-settings-button.ytp-3d-badge-grey:after, .ytp-settings-button.ytp-3d-badge:after, .ytp-chrome-controls .ytp-button[aria-pressed]:after, .yt-spec-avatar-shape--live-ring::after, .badge-style-type-live-now-alternate {
                    background: ${colorToSet}!important;
                }

                .ytp-settings-button.ytp-hd-quality-badge:after, .ytp-settings-button.ytp-hdr-quality-badge:after, .ytp-settings-button.ytp-4k-quality-badge:after, .ytp-settings-button.ytp-5k-quality-badge:after, .ytp-settings-button.ytp-8k-quality-badge:after, .ytp-settings-button.ytp-3d-badge-grey:after, .ytp-settings-button.ytp-3d-badge:after, .ytp-chrome-controls .ytp-button[aria-pressed]:after, .yt-spec-avatar-shape--live-ring::after, .yt-spec-avatar-shape__live-badge, .yt-spec-icon-badge-shape__badge {
                    background-color: ${colorToSet}!important;
                }
               
                .ytProgressBarPlayheadProgressBarPlayheadDot, .ytProgressBarLineProgressBarPlayed, ytd-thumbnail-overlay-resume-playback-renderer #progress {
                    background: ${colorToSet}!important;
                }
               
               .ytmProgressBarProgressBarPlayheadDot, .ytmProgressBarProgressBarPlayed {
                    background: ${colorToSet}!important;
               }
               
               .mobile-topbar-logo svg g:first-child path:nth-child(1) {
                   fill: ${colorToSet} !important;
               }
               
               .ytmChapteredProgressBarChapteredPlayerBarFill, .ytmChapteredProgressBarChapteredPlayerBarChapter[style*="background-color: red;"] {
                    background: ${colorToSet}!important;
               }
               
               yt-icon svg g:first-child path:nth-child(1) {
                   fill: ${colorToSet} !important;
               }
              
               `;

    // Remove old styles

    removeOldAccentColor();

    // Append the style element to the document's head

    document.head.appendChild(styleElement);
  } else {
    removeOldAccentColor();
  }
}

function setAccentColor() {
  // Generate new filter styles

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const colorToSet = flags["untrap_appearance_color"] ?? "default";

    validateAccentColor(colorToSet);
  });
}

// MARK: - Primary Background Color

function removeOlPrimaryAccentColor() {
  // Remove old styles

  if (queryById("primaryBGColorStyles")) {
    queryById("primaryBGColorStyles").remove();
  }
}

function validatePrimaryColor(colorToSet) {
  if (colorToSet != "default") {
    // Create a style element

    const styleElement = document.createElement("style");
    styleElement.id = "primaryBGColorStyles";

    // Set the style content with dynamic CSS rules

    styleElement.textContent = `
                
                html, html[dark], [dark] {
                    --yt-spec-base-background: ${colorToSet}!important;
                    --yt-spec-frosted-glass-desktop: ${colorToSet}!important;
                }
                
                ytm-app, ytm-pivot-bar-renderer, ytm-mobile-topbar-renderer, ytm-feed-filter-chip-bar-renderer {
                    background-color: ${colorToSet}!important;
                }
               `;

    // Remove old styles

    removeOlPrimaryAccentColor();

    // Append the style element to the document's head

    document.head.appendChild(styleElement);
  } else {
    removeOlPrimaryAccentColor();
  }
}

function setPrimaryBGColor() {
  // Generate new filter styles

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const colorToSet = flags["untrap_appearance_primary_bg_color"] ?? "default";

    validatePrimaryColor(colorToSet);
  });
}

function validateSecondColor(colorToSet) {
  if (colorToSet != "default") {
    // Create a style element

    const styleElement = document.createElement("style");
    styleElement.id = "accentColorStyles";

    // Set the style content with dynamic CSS rules

    styleElement.textContent = `
                
                html {
                    --yt-spec-static-brand-red: ${colorToSet}!important;
                }

                [fill="#FF0000" i], [fill="#F00" i], [fill="red" i]  {
                    fill: ${colorToSet}!important;
                }

                .ytp-swatch-background-color {
                    background: ${colorToSet}!important;
                }
                
                .ytp-settings-button.ytp-hd-quality-badge:after, .ytp-settings-button.ytp-hdr-quality-badge:after, .ytp-settings-button.ytp-4k-quality-badge:after, .ytp-settings-button.ytp-5k-quality-badge:after, .ytp-settings-button.ytp-8k-quality-badge:after, .ytp-settings-button.ytp-3d-badge-grey:after, .ytp-settings-button.ytp-3d-badge:after, .ytp-chrome-controls .ytp-button[aria-pressed]:after, .yt-spec-avatar-shape--live-ring::after, .badge-style-type-live-now-alternate {
                    background: ${colorToSet}!important;
                }

                .ytp-settings-button.ytp-hd-quality-badge:after, .ytp-settings-button.ytp-hdr-quality-badge:after, .ytp-settings-button.ytp-4k-quality-badge:after, .ytp-settings-button.ytp-5k-quality-badge:after, .ytp-settings-button.ytp-8k-quality-badge:after, .ytp-settings-button.ytp-3d-badge-grey:after, .ytp-settings-button.ytp-3d-badge:after, .ytp-chrome-controls .ytp-button[aria-pressed]:after, .yt-spec-avatar-shape--live-ring::after, .yt-spec-avatar-shape__live-badge, .yt-spec-icon-badge-shape__badge {
                    background-color: ${colorToSet}!important;
                }

                .mobile-topbar-logo svg g:first-child path:nth-child(1) {
                   fill: ${colorToSet}!important;
               }
               
                .ytProgressBarPlayheadProgressBarPlayheadDot, .ytProgressBarLineProgressBarPlayed, ytd-thumbnail-overlay-resume-playback-renderer #progress {
                    background: ${colorToSet}!important;
                }
               
               .ytmProgressBarProgressBarPlayheadDot, .ytmProgressBarProgressBarPlayed {
                    background: ${colorToSet}!important;
               }
               
               .ytmChapteredProgressBarChapteredPlayerBarFill, .ytmChapteredProgressBarChapteredPlayerBarChapter[style*="background-color: red;"] {
                    background: ${colorToSet}!important;
               }
                    
               yt-icon svg g:first-child path:nth-child(1) {
                   fill: ${colorToSet} !important;
               }
               `;

    // Remove old styles

    removeOldAccentColor();

    // Append the style element to the document's head

    document.head.appendChild(styleElement);
  } else {
    removeOldAccentColor();
  }
}

// MARK: - Secondary Background Color

function setSecondaryBGColor() {
  // Generate new filter styles

  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };
    const colorToSet = flags["untrap_appearance_color"] ?? "default";

    validateSecondColor(colorToSet);
  });
}
