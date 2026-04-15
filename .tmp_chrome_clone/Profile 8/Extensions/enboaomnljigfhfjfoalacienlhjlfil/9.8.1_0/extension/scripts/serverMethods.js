// MARK: - Update Settings

function serverUpdateSettings(uuid, password, featuresSettings, lastModified) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/updateFields.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();

  data.append("uuid", uuid);
  data.append("password", password);

  data.append("untrap_FeaturesSettings", featuresSettings);
  data.append("untrap_LastSettingsModified", lastModified);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

// MARK: - Fetch Settings

function serverFetchSettings(uuid, password, fields) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/fetchFields.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();

  data.append("uuid", uuid);
  data.append("password", password);
  data.append("fields", JSON.stringify(fields));
  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

// MARK: - Update Login

function serverUpdateLogin(newEmail, oldEmail, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/updateLogin.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("newUsername", newEmail);

  data.append("currentUsername", oldEmail);
  data.append("password", password);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

// MARK: - Update Password

function serverUpdatePassword(newPassword, uuid, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/updatePass.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("uuid", uuid);
  data.append("oldPassword", password);

  data.append("newPassword", newPassword);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

// MARK: - Log In

function serverLogIn(user, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/login.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("user", user);
  data.append("password", password);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

// MARK: - Sign Up

function serverSignUp(user, password) {
  // URL to PHP script

  const phpScriptURL = "https://untrap.app/db/untrap/signup.php";

  // Data to be sent to the PHP script

  const data = new URLSearchParams();
  data.append("user", user);
  data.append("password", password);

  // Perform a POST request to the PHP script

  return new Promise((resolve, reject) => {
    fetchWithTimeout(phpScriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function sendVerificationCode(uuid) {
  const scriptURL = "https://untrap.app/api/untrap/send_verification_code";

  return new Promise((resolve, reject) => {
    fetchWithTimeout(scriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function verifyOTPCode(uuid, code) {
  const scriptURL = "https://untrap.app/api/untrap/verify_code";

  return new Promise((resolve, reject) => {
    fetchWithTimeout(scriptURL, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function requestUserFromDb(uuid) {
  const url = `https://untrap.app/api/untrap/get_user?uuid=${encodeURIComponent(
    uuid,
  )}`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function deleteUserFromDb(uuid) {
  const url = `https://untrap.app/api/untrap/delete_user?uuid=${encodeURIComponent(
    uuid,
  )}`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function forgotPasswordRequest(email) {
  const url = `https://untrap.app/api/untrap/forgot-password`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function checkRequestLimit(uuid) {
  const url = `https://untrap.app/api/check_request_limit?uuid=${encodeURIComponent(
    uuid,
  )}`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
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
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function getOptionsSettings(is_testers_release) {
  const url = `https://untrap.app/api/untrap/get_settings?is_testers_release=${is_testers_release}`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => resolve(result))
      .catch((error) => {
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

function getPartialOptionsSettings(version) {
  const url = `https://untrap.app/api/untrap/get_partial_settings?version=${version}`;

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => resolve(result))
      .catch((error) => {
        if (error.name === "AbortError") {
          reject(new Error("Request timeout expired"));
        }
        reject(error);
      });
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}
