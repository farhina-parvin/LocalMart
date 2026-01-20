console.log("reset_password.js LOADED ✅");

(function () {
  const form = document.getElementById("resetForm");
  const emailEl = document.getElementById("email");
  const newPassEl = document.getElementById("newPass");
  const confirmPassEl = document.getElementById("confirmPass");

  const emailHint = document.getElementById("emailHint");
  const passHint = document.getElementById("passHint");

  const toast = document.getElementById("toast");
  const submitBtn = document.getElementById("submitBtn");

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 1400);
  }

  function clearHints() {
    emailHint.textContent = "";
    passHint.textContent = "";
  }

  async function safeJson(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch {
      console.error("NOT JSON:", text);
      throw new Error("Server did not return JSON. Check PHP errors.");
    }
  }

  function validate() {
    clearHints();
    let ok = true;

    const email = emailEl.value.trim();
    const p1 = newPassEl.value;
    const p2 = confirmPassEl.value;

    if (!email.includes("@") || email.length < 5) {
      emailHint.textContent = "Enter a valid email.";
      ok = false;
    }

    if (p1.length < 6) {
      passHint.textContent = "Password must be at least 6 characters.";
      ok = false;
    } else if (p1 !== p2) {
      passHint.textContent = "Passwords do not match.";
      ok = false;
    }

    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    submitBtn.disabled = true;

    try {
      const payload = {
        email: emailEl.value.trim(),
        new_password: newPassEl.value
      };

      const res = await fetch("/LocalMart/controllers/reset_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await safeJson(res);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Reset failed");
      }

      showToast("Password updated ✅ Redirecting…");
      setTimeout(() => {
        window.location.href = "/LocalMart/view/html/login.html";
      }, 900);

    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
