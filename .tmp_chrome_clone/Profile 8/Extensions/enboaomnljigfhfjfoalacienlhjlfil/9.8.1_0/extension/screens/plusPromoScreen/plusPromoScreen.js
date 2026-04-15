const promoScreenGetPlusButton = document.querySelector(
  "#plusPromoScreen .proButton",
);

promoScreenGetPlusButton.addEventListener("click", () => {
  browser.storage.local.get(
    [getConst.system, getConstNotSyncing.notSyncingState],
    function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const sharedState = systemState[getConst.sharedState] ?? {};
      const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

      const uuid = sharedState[getConst.userUniqueIdentifier] ?? "";

      const userName =
        notSyncingState[getConstNotSyncing.pro_usernameData] ?? "";

      const encodeUUID = encodeURIComponent(uuid);

      if (!uuid) {
        if (isBrowserSafari()) {
          window.open("untrapforyt://");
        } else {
          showScreen("proSignUpScreen");

          setToStorageWithoutSync(getConstNotSyncing.notSyncingState, {
            ...notSyncingState,
            [getConstNotSyncing.isGetUnlimitedProPlanNonAuth]: true,
          });
        }
      } else {
        const encodedEmail = encodeURIComponent(userName);

        const redirectUrl = isBrowserSafari()
          ? `untrapforyt://`
          : `https://untrap.app/offer?email=${encodedEmail}&uuid=${encodeUUID}`;

        window.open(redirectUrl, "_blank");
      }
    },
  );
});
