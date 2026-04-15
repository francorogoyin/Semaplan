function getSpForSort(sortBy) {
  if (sortBy === "uploadDate") return "EgIIBQ";
  if (sortBy === "viewCount") return "CAM";
  if (sortBy === "rating") return "CAE";
  return null;
}

function isYoutubeSearchUrl(urlString) {
  try {
    const url = new URL(urlString);

    const isYoutubeHost =
      url.hostname === "www.youtube.com" || url.hostname === "m.youtube.com";
    if (!isYoutubeHost) return false;
    if (url.pathname !== "/results") return false;

    const searchQuery = url.searchParams.get("search_query");
    return typeof searchQuery === "string" && searchQuery.length > 0;
  } catch (e) {
    return false;
  }
}

function normalizeSpValue(value) {
  if (!value) return "";

  let result = String(value);

  // YouTube may encode `sp` once or twice — normalize it to a stable value
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch (e) {
      break;
    }
  }

  // Remove trailing "=" that YouTube sometimes appends
  return result.replace(/=+$/g, "");
}

function safe_sort_by(sortBy) {
  const spValue = getSpForSort(sortBy);
  if (!spValue) return;

  const currentUrl = window.location.href;

  // Guard: apply logic only on YouTube search result pages
  if (!isYoutubeSearchUrl(currentUrl)) return;

  const url = new URL(currentUrl);

  // Check if the desired sort is already applied
  const currentSpRaw = url.searchParams.get("sp") || "";
  const currentSpNormalized = normalizeSpValue(currentSpRaw);
  if (currentSpNormalized === spValue) return;

  // Infinite-loop guard:
  // YouTube SPA may trigger this logic multiple times for the same URL,
  // so we remember that the sort has already been applied for this query
  const guardKey = "__untrap_search_sort_applied__";
  const guardValue = spValue + "::" + url.searchParams.get("search_query");

  if (sessionStorage.getItem(guardKey) === guardValue) return;

  sessionStorage.setItem(guardKey, guardValue);

  url.searchParams.set("sp", spValue);

  window.location.replace(url.toString());
}

// MARK: - Enter Point
function searchPageIsOpened() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? { flags: {} };

    const sort_by = flags["untrap_search_page_sort_by"] ?? "";

    if (sort_by && sort_by !== "relevance") {
      safe_sort_by(sort_by);
    }
  });
}
