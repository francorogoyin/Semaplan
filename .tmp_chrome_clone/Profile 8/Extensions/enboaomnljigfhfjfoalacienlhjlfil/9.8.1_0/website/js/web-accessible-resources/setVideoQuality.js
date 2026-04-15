(function () {
  const qualityLevels = [
    { key: "highres", value: 4320 },
    { key: "hd2160", value: 2160 },
    { key: "hd1440", value: 1440 },
    { key: "hd1080", value: 1080 },
    { key: "hd720", value: 720 },
    { key: "large", value: 480 },
    { key: "medium", value: 360 },
    { key: "small", value: 240 },
    { key: "tiny", value: 144 },
  ];

  function setYoutubeVideoQuality(videoQuality) {
    const player = document.getElementById("movie_player");

    if (player && typeof player.getAvailableQualityLevels === "function") {
      const availableQualities = player.getAvailableQualityLevels();

      const lowest = availableQualities[availableQualities.length - 2];
      const highest = availableQualities[0];
      const closestQuality = findClosestQuality(
        availableQualities,
        videoQuality,
      );

      if (closestQuality) {
        player.setPlaybackQualityRange(closestQuality, closestQuality);
      } else if (videoQuality === "lowest") {
        player.setPlaybackQualityRange(lowest, lowest);
      } else if (videoQuality === "highest") {
        player.setPlaybackQualityRange(highest, highest);
      } else {
        player.setPlaybackQualityRange("auto", "auto");
      }
    } else {
      updateYouTubeQuality(videoQuality);
    }
  }

  function updateYouTubeQuality(videoQuality) {
    const ytPlayerQuality = localStorage.getItem("yt-player-quality");

    if (!ytPlayerQuality) {
      return;
    }

    const qualityObj = JSON.parse(ytPlayerQuality);

    const dataString = qualityObj.data;

    const qualityMatch = dataString.match(/"quality":(\d+)/);
    const previousQuality = qualityMatch ? parseInt(qualityMatch[1]) : 0;

    const newQualityLevel = qualityLevels.find(
      (level) => level.key === videoQuality,
    );

    if (!newQualityLevel) {
      return;
    }

    const newData = `{"quality":${newQualityLevel.value},"previousQuality":${previousQuality}}`;

    qualityObj.data = newData;

    localStorage.setItem("yt-player-quality", JSON.stringify(qualityObj));
  }

  function findClosestQuality(availableQualities, desiredQuality) {
    const desiredIndex = qualityLevels.findIndex(
      (level) => level.key === desiredQuality,
    );

    if (desiredIndex === -1) {
      return null;
    }

    for (let i = desiredIndex; i >= 0; i--) {
      if (availableQualities.includes(qualityLevels[i].key)) {
        return qualityLevels[i].key;
      }
    }

    return availableQualities[0];
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    if (event.data.type === "SET_VIDEO_QUALITY") {
      setYoutubeVideoQuality(event.data.videoQuality);
    }
  });

  window.addEventListener("load", () => {
    window.postMessage({ type: "REQUEST_VIDEO_QUALITY" }, "*");
  });
})();
