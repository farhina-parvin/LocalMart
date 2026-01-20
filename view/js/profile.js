console.log("profile.js LOADED ✅");

(function () {
  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const newPassEl = document.getElementById("newPass");
  const confirmPassEl = document.getElementById("confirmPass");

  const nameHint = document.getElementById("nameHint");
  const passHint = document.getElementById("passHint");

  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const toast = document.getElementById("toast");

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 1200);
  }

  function clearHints() {
    nameHint.textContent = "";
    passHint.textContent = "";
  }

  async function safeJson(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("NOT JSON:", text);
      throw new Error("Server error. Check PHP logs.");
    }
  }

  async function loadProfile() {
    const res = await fetch("/LocalMart/controllers/get_profile.php");
    const data = await safeJson(res);

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Failed to load profile");
    }

    nameEl.value = data.user.name || "";
    emailEl.value = data.user.email || "";
  }

  function validate() {
    clearHints();
    let ok = true;

    const name = nameEl.value.trim();
    if (name.length < 2) {
      nameHint.textContent = "Name must be at least 2 characters.";
      ok = false;
    }

    const p1 = newPassEl.value;
    const p2 = confirmPassEl.value;

    if (p1 || p2) {
      if (p1.length < 6) {
        passHint.textContent = "Password must be at least 6 characters.";
        ok = false;
      } else if (p1 !== p2) {
        passHint.textContent = "Passwords do not match.";
        ok = false;
      }
    }

    return ok;
  }

  async function saveProfile() {
    if (!validate()) return;

    const payload = {
      name: nameEl.value.trim(),
      new_password: newPassEl.value || ""
    };

    const res = await fetch("/LocalMart/controllers/update_profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await safeJson(res);
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Update failed");
    }

    newPassEl.value = "";
    confirmPassEl.value = "";
    showToast("Profile updated ✅");
  }

  saveBtn.addEventListener("click", () => {
    saveProfile().catch(err => alert(err.message));
  });

  cancelBtn.addEventListener("click", () => {
    history.back();
  });

  // Init
  (async function () {
    try {
      await loadProfile();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  })();
})();
