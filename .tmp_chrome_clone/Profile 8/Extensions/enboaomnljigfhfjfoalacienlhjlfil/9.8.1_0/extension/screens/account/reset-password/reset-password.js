function showResetPasswordError(text) {
  queryById("resetPasswordError").innerHTML = text;
  queryById("resetPasswordError").style.display = "block";
}
const resetPassButton = document.querySelector(
  "#resetPasswordScreen #submitResetPasswordButton",
);

document
  .querySelector(".resetPasswordForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    if (!resetPassButton.hasAttribute("disabled")) {
      resetPassButton.setAttribute("disabled", "");
    }

    const email = queryById("resetPasswordEmailInput").value;

    forgotPasswordRequest(email)
      .then((response) => {
        if (response.message === "Reset link sent to your email") {
          showScreen("resetPasswordSuccessfulScreen");
        } else {
          showResetPasswordError(response.message);
        }
      })
      .catch((error) => {
        showResetPasswordError("Error: " + error.message);
      })
      .finally(() => {
        if (resetPassButton.hasAttribute("disabled")) {
          resetPassButton.removeAttribute("disabled");
        }
      });
  });
