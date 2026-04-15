function getVideoID(element) {
  const link = element.querySelector("a[href*='watch?v='], a[href*='shorts']");

  if (link) {
    return link ? extractVideoId(link.getAttribute("href")) : null;
  } else {
    // Special for video page
    return element.getAttribute("video-id") ?? null;
  }
}

function getChannelID(element) {
  const link = element.querySelector("a[href*='/@'], a[href*='/channel']");

  return link ? extractChannelId(link.getAttribute("href")) : null;
}

function getChannelName(element) {
  const nameContainer =
    element.querySelector(".ytm-badge-and-byline-item-byline > span") ||
    element.querySelector(
      ".compact-media-item-byline > .yt-core-attributed-string"
    );

  if (nameContainer) {
    const title = nameContainer.innerHTML;

    return title == "" ? null : title;
  } else {
    return null;
  }
}

const BUTTON_TITLES = {
  video: "Block Video",
  channel: "Block Channel",
  comment: "Block Comment",
  post: "Block Post",
};

const BLOCK_STORAGE_CONSTANTS = {
  video: getConst.filterVideosRulesData,
  channel: getConst.filterChannelsRulesData,
  comment: getConst.filterCommentsRulesData,
  post: getConst.filterPostsRulesData,
};

const contentTags = [
  "ytm-rich-item-renderer",
  "ytm-reel-item-renderer",
  "ytm-video-with-context-renderer", // search, related
  "ytm-video-card-renderer", // channel page for you
  "ytm-compact-video-renderer",
  "ytm-comment-thread-renderer",
  "ytm-comment-renderer",
  "ytm-universal-watch-card-renderer",
  "ytm-compact-channel-renderer",
  "ytm-compact-radio-renderer",
  "ytm-compact-playlist-renderer", // Playlist
]; // Playlist / Mixes
