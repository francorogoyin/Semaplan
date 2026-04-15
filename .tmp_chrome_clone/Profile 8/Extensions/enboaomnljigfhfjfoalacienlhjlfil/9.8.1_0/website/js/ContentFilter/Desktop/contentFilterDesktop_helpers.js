// MARK: -

function getPostID(element) {
  const link = element.querySelector("a[href*='post/']");

  return link ? extractPostID(link.getAttribute("href")) : null;
}

function getCommentID(element) {
  const link = element.querySelector("a[href*='lc=']");

  return link ? extractCommentID(link.getAttribute("href")) : null;
}

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
  const nameContainer = element.querySelector(".ytd-channel-name[title]");

  if (nameContainer) {
    const title = nameContainer.getAttribute("title");

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

// Function to check if the link contains any keyword from the arrays

const contentTags = [
  "ytd-rich-item-renderer", // video
  "ytd-video-renderer", // video
  "ytd-grid-video-renderer", // video on channel page
  "ytd-rich-grid-slim-media", // shorts
  "ytd-reel-item-renderer", // shorts
  "ytd-compact-video-renderer", // video
  "ytd-comment-thread-renderer", // comment
  "ytd-playlist-renderer", // Playlist on video page
  "ytd-playlist-video-renderer", // Playlist on playlist page
  "ytd-backstage-post-thread-renderer", // post
  "ytd-reel-video-renderer", // videos from shorts page
  "ytd-watch-metadata", // video page
  "ytd-channel-renderer", // Channel Blocks (Search / Channel)
  "ytd-radio-renderer",
  "ytd-universal-watch-card-renderer",
  "yt-lockup-view-model",
];
