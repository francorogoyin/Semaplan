const facebookFeedFollowLabels = [
  "Raac",
  "Volg",
  "İzlə",
  "Ikuti",
  "Ikut",
  "Sundi",
  "Prati",
  "Heuliañ",
  "Segueix",
  "Seguità",
  "Dilyn",
  "Følg",
  "Folgen",
  "Jälgi",
  "Follow",
  "Seguir",
  "Aboni",
  "Jarraitu",
  "I-follow",
  "S’abonner",
  "Suivre",
  "Folgje",
  "Rewindo",
  "Segui",
  "Fylg",
  "Lean",
  "Prati",
  "Fuata",
  "Swiv",
  "Bişopîne",
  "Sekot",
  "Stebėti",
  "Követem",
  "Segwi",
  "Volgen",
  "Følg",
  "Kuzatish",
  "Obserwuj",
  "Urmăreşte",
  "Sighi",
  "Tevera",
  "Ndiqe",
  "Sledovať",
  "Seuraa",
  "Följ",
  "Theo dõi",
  "Takip Et",
  "Volgen",
  "Fylgjast með",
  "Sledovat",
  "Ακολουθήστε",
  "Сачыць",
  "Последване",
  "Дагах",
  "Подписаться",
  "Прати",
  "Язылу",
  "Пайравӣ кардан",
  "Стежити",
  "Жазылуу",
  "Жазылу",
  "Հետևել",
  "מעקב",
  "فالو کریں",
  "متابعة",
  "دنبال کردن",
  "وڅارئ",
  "شوێنکەوتن",
  "पछ्याउनुहोस्",
  "फॉलो करा",
  "फ़ॉलो करें",
  "অনুসৰণ কৰক",
  "ফলো করুন",
  "ਫਾਲੋ ਕਰੋ",
  "ફૉલો કરો",
  "ଅନୁସରଣ କରନ୍ତୁ",
  "பின்தொடர்",
  "ఫాలో అవ్వండి",
  "ಅನುಸರಿಸು",
  "പിന്തുടരുക",
  "හඹා යන්න",
  "ติดตาม",
  "ຕິດຕາມ",
  "စောင့်ကြည့်ရန်",
  "გამოწერა",
  "តាមដាន",
  "ⴹⴼⵕ",
  "追蹤",
  "关注",
  "追蹤",
  "フォローする",
  "フォローするで",
  "팔로우",
];

const facebookSpecialObserver = new MutationObserver((mutations) => {
  const hasFeedUnitChanges = mutations.some((mutation) =>
    [...mutation.addedNodes].some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        node.getAttribute?.("data-pagelet")?.startsWith("FeedUnit_"),
    ),
  );

  if (hasFeedUnitChanges) {
    filterFacebookPostsFromQuery();
  }
});

var hideFacebookPostsFromPeopleToFollow = false;

function triggerFilterFacebookPosts() {
  browser.storage.local.get(getConst.runtimeSnapshot, function (obj) {
    const { flags } = obj[getConst.runtimeSnapshot] ?? {
      css: {},
      flags: {},
    };

    hideFacebookPostsFromPeopleToFollow =
      flags["socialFocus_facebook_feed_hide_posts_from_people_to_follow"] ??
      false;

    if (hideFacebookPostsFromPeopleToFollow) {
      const interval = setInterval(() => {
        const feed = document.querySelector("div[role='feed']");
        if (feed) {
          clearInterval(interval);

          facebookSpecialObserver.observe(feed, {
            childList: true,
            subtree: true,
          });
        }
      }, 100);
    }

    if (!hideFacebookPostsFromPeopleToFollow) {
      facebookSpecialObserver.disconnect();
    }

    filterFacebookPostsFromQuery();
  });
}

function hidePost(post, value) {
  if (value) {
    post.style.display = "none";
  } else {
    post.style.display = "block";
  }
}

function filterFacebookPosts(posts) {
  for (const post of posts) {
    // Mobile

    if (post.hasAttribute("data-type")) {
      if (post.getAttribute("data-type") == "vscroller") {
        post.classList.add("disable-virtualization");
        continue;
      }
    }

    // Posts From People to Follow

    var contentToCheck = "";
    const postHeader = post.querySelector("h4");
    const postContent = post.innerText.toLowerCase();

    if (postHeader) {
      contentToCheck = postHeader.innerText.toLowerCase();
    } else {
      contentToCheck = postContent;
    }

    const hasFollowButton = facebookFeedFollowLabels.some((word) =>
      contentToCheck.includes(word.toLowerCase()),
    );

    if (hasFollowButton) {
      hidePost(post, hideFacebookPostsFromPeopleToFollow);
    }
  }
}

function filterFacebookPostsFromQuery() {
  const facebookPosts = document.querySelectorAll(
    "body:has(div[role='navigation'] a[href='/'][aria-current='page']) div[role='main'] div[aria-describedby], div[data-mcomponent='MContainer'][data-tracking-duration-id][data-type='container'].m, #MFirstBatch article, div[data-pagelet*=\"FeedUnit_\"]",
  );

  filterFacebookPosts(facebookPosts);
}
