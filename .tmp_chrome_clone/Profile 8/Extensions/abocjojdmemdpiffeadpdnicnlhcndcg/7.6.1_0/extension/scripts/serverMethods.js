// MARK: - Update Settings

function serverUpdateSettings(uuid, password, featuresSettings, lastModified) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/updateFields.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();

  data.append("uuid", uuid);
  data.append("password", password);

  data.append("socialfocus_FeaturesSettings", featuresSettings);
  data.append("socialfocus_LastSettingsModified", lastModified);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetch(phpScriptURL, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.text())
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

// MARK: - Fetch Settings

function serverFetchSettings(uuid, password, fields) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/fetchFields.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();

  data.append("uuid", uuid);
  data.append("password", password);
  data.append("fields", JSON.stringify(fields));

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

// MARK: - Update Login

function serverUpdateLogin(newEmail, oldEmail, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/updateLogin.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("newUsername", newEmail);

  data.append("currentUsername", oldEmail);
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
      .then((response) => response.text())
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

// MARK: - Update Password

function serverUpdatePassword(newPassword, uuid, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/updatePass.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("uuid", uuid);
  data.append("oldPassword", password);

  data.append("newPassword", newPassword);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetch(phpScriptURL, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.text())
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

// MARK: - Log In

function serverLogIn(user, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/login.php";

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

// MARK: - Sign Up

function serverSignUp(user, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/social/signup.php";

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

function sendVerificationCode(uuid) {
  const scriptURL = "https://untrap.app/api/social/send_verification_code";

  return new Promise((resolve, reject) => {
    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({ uuid }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function verifyOTPCode(uuid, code) {
  const scriptURL = "https://untrap.app/api/social/verify_code";

  return new Promise((resolve, reject) => {
    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({ uuid, code }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function requestUserFromDb(uuid) {
  const url = `https://untrap.app/api/social/get_user?uuid=${encodeURIComponent(
    uuid,
  )}`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function deleteUserFromDb(uuid) {
  const url = `https://untrap.app/api/social/delete_user?uuid=${encodeURIComponent(
    uuid,
  )}`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function forgotPasswordRequest(email) {
  const url = `https://untrap.app/api/social/forgot-password`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getOptionsSettings(is_testers_release) {
  const url = `https://untrap.app/api/social/get_settings?is_testers_release=${is_testers_release}`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getPartialOptionsSettings(version) {
  const url = `https://untrap.app/api/social/get_partial_settings?version=${version}`;

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
