const watchedKeys = [
  "socialFocus_reddit_post_hide_comments",
  "socialFocus_reddit_post_hide_up_down_vote_buttons",
  "socialFocus_reddit_post_hide_votes_count",
  "socialFocus_reddit_post_hide_shares_button",
  "socialFocus_reddit_post_hide_award_button",
  "socialFocus_reddit_master_toggle",
];

function getPostHideButtonsContainers() {
  const redditPostContainers = document.querySelectorAll(
    "shreddit-post, shreddit-ad-post",
  );

  const result = Array.from(redditPostContainers)
    .map((container) =>
      container.shadowRoot
        ? container.shadowRoot.querySelector(
            `div:has(span[data-post-click-location="vote"])`,
          )
        : null,
    )
    .filter((postButtonSection) => postButtonSection !== null);

  return result;
}

function handlePostHideButtons() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? {
      css: {},
      flags: {},
    };

    const isHideUpDownVote =
      flags["socialFocus_reddit_post_hide_up_down_vote_buttons"] ?? false;
    const isHideComments =
      flags["socialFocus_reddit_post_hide_comments"] ?? false;
    const isHideVotesCount =
      flags["socialFocus_reddit_post_hide_votes_count"] ?? false;
    const isHideSharesButton =
      flags["socialFocus_reddit_post_hide_shares_button"] ?? false;
    const isHideAwardButton =
      flags["socialFocus_reddit_post_hide_award_button"] ?? false;
    const masterToogle = flags["socialFocus_reddit_master_toggle"] ?? false;

    const postButtonSections = getPostHideButtonsContainers();

    postButtonSections.forEach((postButtonSection) => {
      if (postButtonSection) {
        hideCheckPostButtons(
          postButtonSection,
          masterToogle ? false : isHideUpDownVote,
          "upDownVote",
        );
        hideCheckPostButtons(
          postButtonSection,
          masterToogle ? false : isHideComments,
          "comments",
        );
        hideCheckPostButtons(
          postButtonSection,
          masterToogle ? false : isHideVotesCount,
          "voteCounts",
        );
        hideCheckPostButtons(
          postButtonSection,
          masterToogle ? false : isHideSharesButton,
          "share",
        );
        hideCheckPostButtons(
          postButtonSection,
          masterToogle ? false : isHideAwardButton,
          "awards",
        );
      }
    });
  });
}

function handleLandingMobileCheckPostButtons(
  postsButtonSection,
  checkedValue,
  typeButtonToHide,
) {
  const isHideButtonValue = checkedValue
    ? "display: none !important;"
    : "display: block !important;";

  const currentShredditPost = postsButtonSection.getRootNode().host;

  const menuShadowRoot = currentShredditPost.shadowRoot.querySelector(
    `div[data-testid="action-row"]`,
  );

  if (menuShadowRoot) {
    const commentsButton = menuShadowRoot.querySelector(
      `a[data-post-click-location="comments-button"]`,
    );

    const upDownVoteButtons = postsButtonSection.querySelector(
      `span:has(span[data-post-click-location="vote"])`,
    );

    const voteCounts = postsButtonSection.querySelector(
      `span > span[data-post-click-location="vote"] span:has(faceplate-number)`,
    );

    const shareButton = menuShadowRoot.querySelector(
      `slot[name="share-button"]`,
    );

    const awardsButton = menuShadowRoot.querySelector(`award-button`);

    switch (typeButtonToHide) {
      case "comments":
        if (commentsButton && commentsButton.style) {
          commentsButton.style.cssText = isHideButtonValue;
        }
        break;

      case "upDownVote":
        if (upDownVoteButtons && upDownVoteButtons.style) {
          upDownVoteButtons.style.cssText = checkedValue
            ? "opacity: 0 !important;"
            : "opacity: 1 !important;";
        }
        break;

      case "voteCounts":
        if (voteCounts && voteCounts.style) {
          voteCounts.style.cssText = checkedValue
            ? "opacity: 0 !important;"
            : "opacity: 1 !important;";
        }
        break;

      case "share":
        if (shareButton && shareButton.style) {
          shareButton.style.cssText = isHideButtonValue;
        }
        break;

      case "awards":
        if (awardsButton && awardsButton.style) {
          awardsButton.style.cssText = isHideButtonValue;
        }
        break;

      default:
        break;
    }
  }
}

function hideCheckPostButtons(
  postsButtonSection,
  checkedValue,
  typeButtonToHide,
) {
  const isHideButtonValue = checkedValue
    ? "display: none !important;"
    : "display: block !important;";
  const isLandingPageAreMobile =
    document.querySelector("shreddit-app").getAttribute("routename") ===
      "frontpage" &&
    document.querySelector("shreddit-app").getAttribute("devicetype") ===
      "mobile";

  if (isLandingPageAreMobile) {
    handleLandingMobileCheckPostButtons(
      postsButtonSection,
      checkedValue,
      typeButtonToHide,
    );
  } else {
    const commentsButton = postsButtonSection.querySelector(
      `button[data-post-click-location="comments-button"], a[name="comments-action-button"]`,
    );
    const upDownVoteButtons = postsButtonSection.querySelector(
      `span:has(span[data-post-click-location="vote"])`,
    );
    const voteCounts = postsButtonSection.querySelector(
      `span > span[data-post-click-location="vote"] span:has(faceplate-number)`,
    );
    const shareButton = postsButtonSection.querySelector(
      `slot[name="share-button"], shreddit-post-share-button`,
    );
    const awardsButton = postsButtonSection.querySelector("award-button");

    switch (typeButtonToHide) {
      case "comments":
        if (commentsButton && commentsButton.style) {
          commentsButton.style.cssText = isHideButtonValue;
        }
        break;
      case "upDownVote":
        if (upDownVoteButtons && upDownVoteButtons.style) {
          upDownVoteButtons.style.cssText = isHideButtonValue;
        }
        break;
      case "voteCounts":
        if (voteCounts && voteCounts.style) {
          voteCounts.style.cssText = isHideButtonValue;
        }
        break;
      case "share":
        if (shareButton && shareButton.style) {
          shareButton.style.cssText = isHideButtonValue;
        }
        break;
      case "awards":
        if (awardsButton && awardsButton.style) {
          awardsButton.style.cssText = isHideButtonValue;
        }
        break;
      default:
        break;
    }
  }
}
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  watchedKeys.forEach((key) => {
    const values = getChangedValues(
      changes,
      getConst.runtimeSnapshot,
      "flags",
      key,
    );

    if (!values) return;

    const { newValue, oldValue } = values;
    if (newValue === oldValue) return;

    handlePostHideButtons();
  });
});

const newPostsObserver = new MutationObserver(() => {
  handlePostHideButtons();
});

const waitForBodyInterval = setInterval(() => {
  if (document.body) {
    clearInterval(waitForBodyInterval);
    newPostsObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}, 50);

const intervalForFoundPosts = setInterval(() => {
  if (getPostHideButtonsContainers().length) {
    clearInterval(intervalForFoundPosts);
    handlePostHideButtons();
  }
}, 500);
