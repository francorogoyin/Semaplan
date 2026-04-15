// const followTranslations = [
//   "Follow",
//   "Følg",
//   "Folgen",
//   "Follow",
//   "Seguir",
//   "Seguir",
//   "Suivre",
//   "Segui",
//   "Követés",
//   "Volgen",
//   "Følg",
//   "Obserwuj",
//   "Seguir",
//   "Seguir",
//   "Urmărește",
//   "Sledovať",
//   "Seuraa",
//   "Följ",
//   "Theo dõi",
//   "Takip et",
//   "Sledovat",
//   "Ακολούθησε",
//   "Последвай",
//   "Отслеживать",
//   "ติดตาม",
//   "متابعة",
//   "关注",
//   "關注",
//   "フォロー",
//   "팔로우",
// ];

// const subscribeTranslations = [
//   "Subscribe",
//   "Abonner",
//   "Abonnieren",
//   "Subscribe",
//   "Suscribirse",
//   "Suscribirse",
//   "S’abonner",
//   "Abbonati",
//   "Feliratkozás",
//   "Abonneren",
//   "Abonner",
//   "Subskrybuj",
//   "Subscrever",
//   "Inscrever-se",
//   "Abonează-te",
//   "Odoberať",
//   "Tilaa",
//   "Prenumerera",
//   "Đăng ký",
//   "Abone ol",
//   "Přihlásit se k odběru",
//   "Γίνε συνδρομητής",
//   "Абонирай се",
//   "Оформить подписку",
//   "สมัครสมาชิก",
//   "اشترك",
//   "订阅",
//   "訂閱",
//   "サブスクライブ",
//   "구독하기",
//   "Підписатись",
// ];

// function hideTwitchActionButtons(translationsArray, optionId, value) {
//   const typeOfHiddingButton =
//     optionId === "socialFocus_twitch_hide_subscribe_button"
//       ? "hideSubscribe"
//       : "hideFollow";

//   const actionButtonObserver = new MutationObserver(() => {
//     const buttons = [...document.querySelectorAll("button")].filter(
//       (buttonElement) => {
//         let extractedText = buttonElement
//           .getAttribute("aria-label")
//           ?.trim()
//           .toLowerCase();

//         if (!extractedText) {
//           const labelElement = buttonElement.querySelector(
//             `div[data-a-target="tw-core-button-label-text"]`,
//           );

//           if (labelElement) {
//             extractedText = labelElement.textContent?.trim().toLowerCase();
//           }
//         }

//         if (!extractedText) {
//           return false;
//         }

//         return translationsArray.some((word) =>
//           extractedText.includes(word.trim().toLowerCase()),
//         );
//       },
//     );

//     if (value) {
//       buttons.forEach((item) => {
//         if (!item.hasAttribute(typeOfHiddingButton)) {
//           item.setAttribute(typeOfHiddingButton, "true");
//         }
//       });
//     } else {
//       buttons.forEach((item) => {
//         if (item.hasAttribute(typeOfHiddingButton)) {
//           item.removeAttribute(typeOfHiddingButton);
//         }
//       });
//     }
//   });

//   if (value) {
//     const twitchWaitForBodyInterval = setInterval(() => {
//       if (document.body) {
//         clearInterval(twitchWaitForBodyInterval);

//         actionButtonObserver.observe(document.body, {
//           childList: true,
//         });
//       }
//     }, 100);
//   } else {
//     actionButtonObserver.disconnect();
//   }
// }
