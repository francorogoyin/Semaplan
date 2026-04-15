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

function getAllOptions(categories) {
  const allOptions = [];

  const globalOptions = categories.filter((item) => item.hasOwnProperty("id"));

  const filterActualCategories = getClearCategories(categories);

  // Helper function to recursively collect options
  function collectOptions(options) {
    for (const option of options) {
      allOptions.push(option);

      // Check if the option has childOnOptions
      if (option.childOnOptions) {
        collectOptions(option.childOnOptions);
      }

      // Check if the option has childOffOptions
      if (option.childOffOptions) {
        collectOptions(option.childOffOptions);
      }
    }
  }

  // Loop through the categories
  for (const category of filterActualCategories) {
    for (const group of category.categoryGroups) {
      // Check if the group has "options"
      if (group.options) {
        collectOptions(group.options);
      }
    }
  }

  allOptions.push(...globalOptions);

  return allOptions;
}

function findOptionById(id) {
  // Helper function to recursively find an option by ID

  const filterActualCategories = getClearCategories(ACTUAL_CATEGORIES);

  function findOption(options) {
    for (const option of options) {
      // Check if the current option has the given ID
      if (option.id === id) {
        return option;
      }

      // Check if the option has childOnOptions
      if (option.childOnOptions) {
        const foundOption = findOption(option.childOnOptions);
        if (foundOption) {
          return foundOption;
        }
      }

      // Check if the option has childOffOptions
      if (option.childOffOptions) {
        const foundOption = findOption(option.childOffOptions);
        if (foundOption) {
          return foundOption;
        }
      }
    }

    // Return null if no element with the given ID is found
    return null;
  }

  // Loop through the categories
  for (const category of filterActualCategories) {
    for (const group of category.categoryGroups) {
      // Check if the group has "options"

      if (group.options) {
        const foundOption = findOption(group.options);
        if (foundOption) {
          return foundOption;
        }
      }
    }
  }

  return null; // Return null if no element with the given ID is found
}

function isDesktop(href) {
  const desktopUrlParts = ["www.youtube.com"];
  const mobileUrlParts = ["m.youtube.com"];

  if (href?.includes(desktopUrlParts) && !href?.includes(mobileUrlParts)) {
    return true;
  } else if (
    !href?.includes(desktopUrlParts) &&
    href?.includes(mobileUrlParts)
  ) {
    return false;
  } else {
    return true;
  }
}

function isBrowserSafari() {
  let userAgent = window.navigator.userAgent;

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return true;
  } else {
    return false;
  }
}

function isFirefox() {
  let userAgent = window.navigator.userAgent;

  if (userAgent.match(/firefox|fxios/i)) {
    return true;
  } else {
    return false;
  }
}

// MARK: - Search Methods

function searchOptions(options, query) {
  // Split the query into words and convert them to lowercase
  const searchWords = query.toLowerCase().split(" ");

  // Filter the options array based on the search query
  const results = options.filter((option) => {
    if (
      option.hasOwnProperty("name") &&
      !option.hasOwnProperty("childOnOptions") &&
      !option.hasOwnProperty("childOffOptions")
    ) {
      const name = getLocalizedOptionName(option.name).toLowerCase(); // Use optional chaining

      // Check if all search words are present in the name
      return searchWords.every((word) => name && name.includes(word)); // Check if name is defined
    }
  });

  return results;
}

function recreateCascadeStructure(options) {
  const recreatedCategories = [];

  const filterActualCategories = getClearCategories(ACTUAL_CATEGORIES);

  for (const category of filterActualCategories) {
    const recreatedCategory = {
      categoryName: category.categoryName,
      categoryId: category.categoryId,
      categoryGroups: [],
    };

    for (const group of category.categoryGroups) {
      const recreatedGroup = {
        groupName: group.groupName,
        groupId: group.groupId,
        parentCategoryId: group.parentCategoryId,
        options: [],
      };

      for (const option of group.options) {
        if (options.some((selectedOption) => selectedOption.id === option.id)) {
          recreatedGroup.options.push(option);
        }

        // Check childOffOptions

        if (option.hasOwnProperty("childOffOptions")) {
          for (const childOption of option.childOffOptions) {
            if (
              options.some(
                (selectedOption) => selectedOption.id === childOption.id,
              )
            ) {
              recreatedGroup.options.push(childOption);
            }
          }
        }

        // Check childOnOptions

        if (option.hasOwnProperty("childOnOptions")) {
          for (const childOption of option.childOnOptions) {
            if (
              options.some(
                (selectedOption) => selectedOption.id === childOption.id,
              )
            ) {
              recreatedGroup.options.push(childOption);
            }
          }
        }
      }

      if (recreatedGroup.options.length > 0) {
        recreatedCategory.categoryGroups.push(recreatedGroup);
      }
    }

    if (recreatedCategory.categoryGroups.length > 0) {
      recreatedCategories.push(recreatedCategory);
    }
  }

  return recreatedCategories;
}

// MARK: - Prepare Options For Popup

var ACTUAL_CATEGORIES = [];

async function loadSettingsFromJson() {
  try {
    const url = "./global/options/options.json";

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

async function prepareActualSetting(href) {
  const SETTINGS_CATEGORIES = await loadSettingsFromJson();

  const FILTERED_CATEGORIES = SETTINGS_CATEGORIES.filter((item) => {
    return !item.hasOwnProperty("id");
  });

  for (const category of FILTERED_CATEGORIES) {
    var actualCategoryGroups = [];

    // Just to dont add embeds on Safari

    if (category.hasOwnProperty("notInBrowser")) {
      if (isBrowserSafari()) {
        continue;
      }
    }

    if (isDesktop(href)) {
      const actualCategory = {
        categoryId: category.categoryId,
        categoryName: category.categoryDesktopName,
        categoryGroups: category.categoryDesktopGroups,
      };

      ACTUAL_CATEGORIES.push(actualCategory);
    } else if (category.hasOwnProperty("categoryMobileGroups")) {
      const actualCategory = {
        categoryId: category.categoryId,
        categoryName: category.categoryMobileName,
        categoryGroups: category.categoryMobileGroups,
      };

      ACTUAL_CATEGORIES.push(actualCategory);
    }
  }
}

function validateStylesArray(options, fallback, isTesterMode = false) {
  if (isTesterMode && options?.tester_styles && options.tester_styles.length) {
    return options.tester_styles;
  }
  return options?.styles || fallback;
}

function getOptionsFromJson(categories) {
  const desktopOptions = [];
  const mobileOptions = [];
  let current_version = "1.0.0";

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
  for (const category of categories) {
    if (category.hasOwnProperty("currentVersion")) {
      current_version = category.currentVersion;
    }

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
