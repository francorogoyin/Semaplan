function contentScriptServerLogIn(user, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/login.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("user", user);
  data.append("password", password);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetch(phpScriptURL, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        // Handle the result returned by the PHP script
        resolve(result);
      })
      .catch((error) => {
        // Handle errors
        reject(error);
      });
  });
}
