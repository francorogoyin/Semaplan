function showResetPasswordError(text) {
  queryById("resetPasswordError").innerHTML = text;
  queryById("resetPasswordError").style.display = "block";
}

document
  .querySelector(".resetPasswordForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

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
        showResetPasswordError("Error: " + error);
      });
  });
