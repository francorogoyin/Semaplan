function activeAttributeObserve(settingsContainer, toggleMenuButton) {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "active"
      ) {
        const isShowPresent = settingsContainer.hasAttribute("active");
        if (isShowPresent) {
          toggleMenuButton.innerHTML = `${transcriptCloseMenuSvg}`;
        } else {
          toggleMenuButton.innerHTML = `${transcriptMenuSvg}`;
        }
      }
    }
  });

  observer.observe(settingsContainer, { attributes: true });
}

function showMenuHandler({
  videoSummarizeWindowContainer,
  selectItemIcon,
  storageKey,
  defaultValueForStorage,
  menuList,
  selectSelectorName,
  menuSelectorName,
  selectorForName,
  selectorForId,
}) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const storageValue =
      summarizeWindowState[storageKey] ?? defaultValueForStorage;
    const currentValue = menuList.find((item) => item.name === storageValue);

    const toggleMenuButton = videoSummarizeWindowContainer.querySelector(
      ".transcript-language-button",
    );
    const contentContainer =
      videoSummarizeWindowContainer.querySelector("#contentContainer");

    const settingsContainer =
      videoSummarizeWindowContainer.querySelector("#settingsContainer");

    const selector =
      videoSummarizeWindowContainer.querySelector(selectSelectorName);

    const selectorMenu =
      videoSummarizeWindowContainer.querySelector(menuSelectorName);

    if (toggleMenuButton) {
      const initialActiveItem = selectorMenu.querySelector(
        `#${currentValue.id}`,
      );
      initialActiveItem.setAttribute("select", "");

      initialActiveItem.append(selectItemIcon);

      if (selectorForId) {
        selector.querySelector(selectorForId).innerHTML = currentValue.id;
      }
      if (selectorForName) {
        selector.querySelector(selectorForName).innerHTML = currentValue.name;
      }

      selector.onclick = function () {
        if (selectorMenu.hasAttribute("show")) {
          selectorMenu.removeAttribute("show");
        } else {
          selectorMenu.setAttribute("show", "");
        }
      };

      toggleMenuButton.onclick = function () {
        if (contentContainer.hasAttribute("active")) {
          contentContainer.removeAttribute("active");
          settingsContainer.setAttribute("active", "");
        } else {
          settingsContainer.removeAttribute("active");
          contentContainer.setAttribute("active", "");
        }
      };

      activeAttributeObserve(settingsContainer, toggleMenuButton);
    }
  });
}

function selectItemClick(
  menuElement,
  selectItemIcon,
  currentSelectItem,
  currentSelectItemNameSelector,
  selectSelectorName,
  menuList,
  storageKey,
  selectorForName,
  selectorForId,
) {
  browser.storage.local.get(getConst.system, function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const parent = currentSelectItem.parentElement;
    const siblings = Array.from(parent.children);
    const id = currentSelectItem.id;
    const name = currentSelectItem.querySelector(currentSelectItemNameSelector);
    const selector =
      videoSummarizeWindowContainer.querySelector(selectSelectorName);

    const currentValue = menuList.find((listItem) => listItem.id === id);

    siblings.forEach((sibling) => {
      sibling.removeAttribute("select");
      selectItemIcon.remove();
    });

    currentSelectItem.setAttribute("select", "");

    currentSelectItem.append(selectItemIcon);

    setSystemConfigStorage({
      systemState,
      newState: {
        [getConst.summarizeWindowState]: {
          ...summarizeWindowState,
          [storageKey]: currentValue.name,
        },
      },
    });

    if (selectorForId) {
      selector.querySelector(selectorForId).innerHTML = id;
    }

    if (selectorForName) {
      selector.querySelector(selectorForName).innerHTML = name.textContent;
    }

    menuElement.removeAttribute("show");
  });
}

function handleMenuItemsClick({
  selectItemIcon,
  videoSummarizeWindowContainer,
  itemClass,
  menuId,
  itemNameClass,
  selectorClass,
  itemsArray,
  constKey,
  textSelector,
  abbreviationSelector,
}) {
  const items = videoSummarizeWindowContainer.querySelectorAll(`.${itemClass}`);

  const menu = videoSummarizeWindowContainer.querySelector(`#${menuId}`);

  items.forEach((item) => {
    item.onclick = function () {
      const currentTabElement = videoSummarizeWindowContainer.querySelector(
        ".tabs-element[select]",
      );

      const { abortControllerList, generateFunction } =
        getFetchData(currentTabElement);

      selectItemClick(
        menu,
        selectItemIcon,
        item,
        itemNameClass,
        selectorClass,
        itemsArray,
        constKey,
        textSelector,
        abbreviationSelector,
      );
      if (selectorClass !== ".bullet-point-selector") {
        startLoader();

        if (abortControllerList && generateFunction) {
          onClickGenerateSummarizeData(abortControllerList, generateFunction);
        }
      }
    };
  });
}

function setupMenuSelectHandlers(config) {
  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );

  const selectItemIcon = document.createElement("i");
  selectItemIcon.innerHTML = selectedTranslateLanguageItemSvg;

  if (videoSummarizeWindowContainer) {
    showMenuHandler({
      videoSummarizeWindowContainer,
      selectItemIcon,
      storageKey: config.storageKey,
      defaultValueForStorage: config.defaultValue,
      menuList: config.itemsArray,
      selectSelectorName: config.selectorClass,
      menuSelectorName: config.menuId,
      selectorForName: config.textSelector,
      selectorForId: config.abbreviationSelector,
    });

    handleMenuItemsClick({
      selectItemIcon,
      videoSummarizeWindowContainer,
      itemClass: config.itemClass,
      menuId: config.menuId.slice(1), //we don`t need # for id on this case
      itemNameClass: config.itemNameClass,
      selectorClass: config.selectorClass,
      itemsArray: config.itemsArray,
      constKey: config.storageKey,
      textSelector: config.textSelector,
      abbreviationSelector: config.abbreviationSelector,
    });
  }
}

browser.storage.onChanged.addListener(changeBulletPointListener);

function changeBulletPointListener(changes) {
  const values = getChangedValues(
    changes,
    getConst.system,
    getConst.summarizeWindowState,
    getConst.pickedBulletPoint,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue) return;

  const bulletPoint = newValue;

  const videoSummarizeWindowContainer = document.getElementById(
    "videoSummarizeWindowContainer",
  );
  if (!videoSummarizeWindowContainer) return;

  const videoSummarizeContainer =
    videoSummarizeWindowContainer.querySelector("#contentContainer");
  if (!videoSummarizeContainer) return;

  const currentTabElement = videoSummarizeWindowContainer.querySelector(
    ".tabs-element[select]",
  );
  if (!currentTabElement) return;

  browser.storage.local.get(getConst.system, (obj) => {
    const systemState = obj[getConst.system] ?? {};
    const summarizeWindowState =
      systemState[getConst.summarizeWindowState] ?? {};

    const isGrouped = summarizeWindowState[getConst.keyInsightSectionGrouped];

    if (currentTabElement.id === "keyInsights") {
      setKeyInsightCachedData(videoSummarizeContainer, bulletPoint, isGrouped);
    }
  });
}
