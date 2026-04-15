function getSiteInfo() {
  outerLoop: for (const website of WEBSITES) {
    for (const domain of website.domain) {
      if (location.href.includes(domain)) {
        return website;
      }
    }
  }
  return null;
}

function isMobileVersion() {
  const mobileSelectors = getSiteInfo().mobileSelectorCheck;

  if (mobileSelectors) {
    var found = false;

    for (const mobileSelector of mobileSelectors) {
      if (mobileSelector != "") {
        const checkSelect = document.querySelector(mobileSelector);
        if (checkSelect) {
          found = true;
          break;
        }
      }
    }

    return found;
  } else {
    return false;
  }
}

// Return both desktop and mobile to dont spend ms on launch to detect which is correct
function getWebsiteCategoriesFromWebsite() {
  const returnCategories = [];

  const currentHref = window.location.href;

  if (currentHref.includes("news.ycombinator.com")) {
    const relevantCategory = CATEGORIES_STATIC.find(
      (category) => category.categoryId == getSiteInfo().name
    );

    if (!relevantCategory) {
      return returnCategories;
    }

    const desktopCategories = {
      categoryId: relevantCategory.categoryId,
      categoryName: relevantCategory.categoryDesktopName,
      categoryGroups: relevantCategory.categoryDesktopGroups,
    };

    returnCategories.push(desktopCategories);

    if (relevantCategory.categoryMobileGroups.length > 0) {
      const mobileCategories = {
        categoryId: relevantCategory.categoryId,
        categoryName: relevantCategory.categoryMobileName,
        categoryGroups: relevantCategory.categoryMobileGroups,
      };

      returnCategories.push(mobileCategories);
    }

    return returnCategories;
  } else {
    return loadSettingsFromJson()
      .then((CATEGORIES) => {
        const validCategories = CATEGORIES.data.filter(
          (category) => category.categoryId !== undefined
        );

        const relevantCategory = validCategories.find(
          (category) => category.categoryId === getSiteInfo().name
        );

        if (!relevantCategory) {
          return returnCategories;
        }

        // Desktop
        const desktopCategories = {
          categoryId: relevantCategory.categoryId,
          categoryName: relevantCategory.categoryDesktopName,
          categoryGroups: relevantCategory.categoryDesktopGroups,
        };
        returnCategories.push(desktopCategories);

        // Mobile
        if (relevantCategory.categoryMobileGroups?.length > 0) {
          const mobileCategories = {
            categoryId: relevantCategory.categoryId,
            categoryName: relevantCategory.categoryMobileName,
            categoryGroups: relevantCategory.categoryMobileGroups,
          };
          returnCategories.push(mobileCategories);
        }

        return returnCategories;
      })
      .catch((error) => {
        console.error("Error in getWebsiteCategoriesFromWebsite:", error);
        return [];
      });
  }
}
