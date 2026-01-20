// login.js — validation + password toggle + ripple + subtle tilt
(() => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");
  const toggle = document.getElementById("togglePass");
  const pass = document.getElementById("password");

  // Password show/hide
  if (toggle && pass) {
    toggle.addEventListener("click", () => {
      const isHidden = pass.type === "password";
      pass.type = isHidden ? "text" : "password";
      toggle.textContent = isHidden ? "🙈" : "👁️";
      toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  }

  // Ripple on button clicks
  document.querySelectorAll('[data-ripple="true"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";

      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;

      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 520);
    });
  });

  // Client-side validation (keeps your PHP as source of truth)
  if (form) {
    form.addEventListener("submit", (e) => {
      msg.textContent = "";

      const email = form.elements["email"]?.value.trim();
      const password = form.elements["password"]?.value ?? "";
      const role = form.elements["role"]?.value ?? "";

      if (!email || !password || !role) {
        e.preventDefault();
        msg.textContent = "Please fill all fields.";
        return;
      }

      // basic email check
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        e.preventDefault();
        msg.textContent = "Please enter a valid email.";
        return;
      }

      if (password.length < 4) {
        e.preventDefault();
        msg.textContent = "Password looks too short.";
        return;
      }
    });
  }
})();
