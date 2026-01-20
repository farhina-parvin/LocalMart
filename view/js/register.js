(function () {
  const form = document.getElementById("registerForm");

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const roleEl = document.getElementById("role");
  const passEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");

  const togglePass = document.getElementById("togglePassword");
  const toggleConfirm = document.getElementById("toggleConfirm");
  const toast = document.getElementById("toast");

  const hintName = document.querySelector('[data-hint="name"]');
  const hintEmail = document.querySelector('[data-hint="email"]');
  const hintRole = document.querySelector('[data-hint="role"]');
  const hintPass = document.querySelector('[data-hint="password"]');
  const hintConfirm = document.querySelector('[data-hint="confirm"]');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function toggleVisibility(input, btn) {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    btn.textContent = hidden ? "🙈" : "👁️";
  }

  togglePass.addEventListener("click", () => toggleVisibility(passEl, togglePass));
  toggleConfirm.addEventListener("click", () => toggleVisibility(confirmEl, toggleConfirm));

  function isValidEmail(email) {
    return email.includes("@") && email.includes(".");
  }

  function clearHints() {
    hintName.textContent = "";
    hintEmail.textContent = "";
    hintRole.textContent = "";
    hintPass.textContent = "";
    hintConfirm.textContent = "";
  }

  function validate() {
    clearHints();
    let ok = true;

    if (nameEl.value.trim().length < 2) {
      hintName.textContent = "Enter your full name.";
      ok = false;
    }

    if (!isValidEmail(emailEl.value.trim())) {
      hintEmail.textContent = "Enter a valid email address.";
      ok = false;
    }

    if (roleEl.value !== "buyer" && roleEl.value !== "seller") {
      hintRole.textContent = "Choose Buyer or Seller.";
      ok = false;
    }

    if (passEl.value.length < 6) {
      hintPass.textContent = "Password must be at least 6 characters.";
      ok = false;
    }

    if (confirmEl.value !== passEl.value) {
      hintConfirm.textContent = "Passwords do not match.";
      ok = false;
    }

    return ok;
  }

  form.addEventListener("submit", (e) => {
    if (!validate()) {
      e.preventDefault();
      showToast("Fix the highlighted fields 👀");
    }
  });

  
})();
