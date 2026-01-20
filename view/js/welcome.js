// welcome.js — subtle animations + ripple + tilt + counters
(() => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    // Ripple on buttons
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
  
    // Animated counters
    const counters = document.querySelectorAll(".stat-num[data-count]");
    const animateCounter = (el) => {
      const target = Number(el.dataset.count || "0");
      const duration = 900;
      const start = performance.now();
  
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const val = Math.floor(target * (0.15 + 0.85 * p));
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      };
  
      requestAnimationFrame(step);
    };
  
    // Trigger counters once when visible
    const hero = document.querySelector(".hero");
    if (hero && counters.length) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            counters.forEach(animateCounter);
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(hero);
    }
  
})();
  