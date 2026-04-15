function getLocalizedOptionName(optionObjectName) {
  if (optionObjectName.hasOwnProperty(app_language)) {
    return optionObjectName[app_language];
  } else if (optionObjectName.hasOwnProperty("en")) {
    return optionObjectName.en;
  } else {
    return optionObjectName;
  }
}

function getLocalizedGroupName(groupObjectName) {
  if (groupObjectName.hasOwnProperty(app_language)) {
    return groupObjectName[app_language];
  } else if (groupObjectName.hasOwnProperty("en")) {
    return groupObjectName.en;
  } else {
    return groupObjectName;
  }
}

function getLocalizedCategoryName(categoryObjectName) {
  if (categoryObjectName.hasOwnProperty(app_language)) {
    return categoryObjectName[app_language];
  } else if (categoryObjectName.hasOwnProperty("en")) {
    return categoryObjectName.en;
  } else {
    return categoryObjectName;
  }
}

async function loadSettingsFromJson() {
  try {
    const url =
      window.location.protocol === "chrome-extension:"
        ? "./global/options/social_options.json"
        : browser.runtime.getURL("global/options/social_options.json");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const CATEGORIES = await response.json();
    return CATEGORIES;
  } catch (error) {
    console.error("Json retrieving error", error);
    return [];
  }
}

function findOptionById(id) {
  // Loop through the categories
  for (const category of ACTUAL_CATEGORIES) {
    for (const group of category.categoryGroups) {
      // Check if the group has "options"
      if (group.options) {
        for (const option of group.options) {
          // Check if the option has the given ID
          if (option.id === id) {
            return { option, parentId: group.parentCategoryId };
          }
        }
      }
    }
  }

  return null; // Return null if no element with the given ID is found
}

function getAllOptions(categories) {
  const allOptions = [];

  for (const category of categories) {
    for (const group of category.categoryGroups) {
      // Check if the group has "options"
      if (group.options) {
        allOptions.push(...group.options);
      }
    }
  }

  allOptions.push(OTHER_SETTINGS[0]);

  return allOptions;
  // Loop through the categories
}

function isBrowserSafari() {
  let userAgent = window.navigator.userAgent;

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return true;
  } else {
    return false;
  }
}

function isDesktop(href) {
  const desktopUrlParts = ["www.youtube.com"];
  const mobileUrlParts = ["m.youtube.com"];

  if (href.includes(desktopUrlParts) && !href.includes(mobileUrlParts)) {
    return true;
  } else if (!href.includes(desktopUrlParts) && href.includes(mobileUrlParts)) {
    return false;
  } else {
    return true;
  }
}

function getOptionsFromJson(categories) {
  const desktopOptions = [];
  const mobileOptions = [];
  let current_version = categories.currentVersion ?? "1.0.0";

  // Helper function to recursively collect options
  function collectOptions(options, optionsArray, categoryId, is_mobile) {
    for (const option of options) {
      if (option.hasOwnProperty("styles") && option.styles.length) {
        optionsArray.push({
          category_id: categoryId,
          styles: option.styles,
          type: option.type,
          settings_id: option.id ?? option.settings_id,
          is_mobile,
        });
      }

      // Check if the option has childOnOptions
      if (option.childOnOptions) {
        collectOptions(option.childOnOptions, options, categoryId, is_mobile);
      }

      // Check if the option has childOffOptions
      if (option.childOffOptions) {
        collectOptions(option.childOffOptions, options, categoryId, is_mobile);
      }
    }
  }

  // Loop through the categories
  for (const category of categories.data) {
    if (category.hasOwnProperty("categoryDesktopGroups")) {
      for (const group of category.categoryDesktopGroups) {
        // Check if the group has "options"
        if (group.options) {
          collectOptions(group.options, desktopOptions, category.categoryId, 0);
        }
      }
    }

    if (category.hasOwnProperty("categoryMobileGroups")) {
      for (const group of category.categoryMobileGroups) {
        // Check if the group has "options"
        if (group.options) {
          collectOptions(group.options, mobileOptions, category.categoryId, 1);
        }
      }
    }

    if (category.hasOwnProperty("id") && category.id.includes("global")) {
      if (
        category.hasOwnProperty("stylesDesktop") &&
        category.stylesDesktop.length
      ) {
        desktopOptions.push({
          category_id: "global",
          styles: category.stylesDesktop,
          type: category.type,
          settings_id: category.id,
          is_mobile: 0,
        });
      }

      if (
        category.hasOwnProperty("stylesMobile") &&
        category.stylesMobile.length
      ) {
        mobileOptions.push({
          category_id: "global",
          styles: category.stylesMobile,
          type: category.type,
          settings_id: category.id,
          is_mobile: 1,
        });
      }
    }
  }

  return { mobileOptions, desktopOptions, current_version };
}
