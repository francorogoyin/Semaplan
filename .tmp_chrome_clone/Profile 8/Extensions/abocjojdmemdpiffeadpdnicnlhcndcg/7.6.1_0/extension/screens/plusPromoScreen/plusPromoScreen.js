const promoScreenGetPlusButton = document.querySelector(
  "#plusPromoScreen .proButton",
);

promoScreenGetPlusButton.addEventListener("click", () => {
  browser.storage.local.get(
    [getConstNotSyncing.notSyncingState, getConst.system],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const sharedState = systemState[getConst.sharedState] ?? {};

      const userName =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";
      const encodeUUID = encodeURIComponent(uuid);

      if (!uuid) {
        if (isBrowserSafari()) {
          window.open("socialfocus://");
        } else {
          showScreen("proSignUpScreen");

          setToStorageWithoutSync(
            getConstNotSyncing.isGetUnlimitedProPlanNonAuth,
            true,
          );
        }
      } else {
        const encodedEmail = encodeURIComponent(userName);

        const redirectUrl = isBrowserSafari()
          ? `socialfocus://`
          : `https://socialfocus.app/offer/?email=${encodedEmail}&uuid=${encodeUUID}`;

        window.open(redirectUrl, "_blank");
      }
    },
  );
});
