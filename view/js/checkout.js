// view/js/checkout.js
(function () {
    const form = document.getElementById("checkoutForm");
  
    // address
    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const street = document.getElementById("street");
    const city = document.getElementById("city");
    const postal = document.getElementById("postal");
  
    // payment method chips
    const methodWrap = document.getElementById("methods");
    const payCard = document.getElementById("payCard");
    const payMobile = document.getElementById("payMobile");
  
    // card fields
    const cardName = document.getElementById("cardName");
    const cardNumber = document.getElementById("cardNumber");
    const cardExpiry = document.getElementById("cardExpiry");
    const cardCvv = document.getElementById("cardCvv");
  
    // mobile fields
    const mfsPhone = document.getElementById("mfsPhone");
    const mfsPin = document.getElementById("mfsPin");
  
    // summary
    const miniList = document.getElementById("miniList");
    const itemCount = document.getElementById("itemCount");
    const grandTotal = document.getElementById("grandTotal");
    const subtotalEl = document.getElementById("subtotal");
    const feeEl = document.getElementById("fee");
    const totalEl = document.getElementById("total");
  
    // auth modal
    const authModal = document.getElementById("authModal");
    const authClose = document.getElementById("authClose");
    const authX = document.getElementById("authX");
    const cancelAuth = document.getElementById("cancelAuth");
    const confirmAuth = document.getElementById("confirmAuth");
    const authCode = document.getElementById("authCode");
  
    // success
    const successScreen = document.getElementById("successScreen");
    const successMsg = document.getElementById("successMsg");
  
    let selectedMethod = "card_credit";
    let pendingPayload = null;
  
    function hint(key, msg="") {
      const el = document.querySelector(`.hint[data-hint="${key}"]`);
      if (el) el.textContent = msg;
    }
    function clearHints() {
      document.querySelectorAll(".hint[data-hint]").forEach(h => (h.textContent = ""));
    }
  
    function getCart() {
      try { return JSON.parse(localStorage.getItem("localmart_cart") || "[]"); }
      catch { return []; }
    }
  
    function setCart(cart) {
      localStorage.setItem("localmart_cart", JSON.stringify(cart));
    }
  
    function money(n) {
      const x = Number(n || 0);
      return "$" + x.toFixed(0);
    }
  
    function calc(cart) {
      let count = 0, sub = 0;
      cart.forEach(i => {
        const qty = Number(i.qty || 1);
        count += qty;
        sub += Number(i.price || 0) * qty;
      });
      const fee = cart.length ? Math.min(50, Math.round(sub * 0.02)) : 0;
      const total = sub + fee;
      return { count, sub, fee, total };
    }
  
    function renderSummary() {
      const cart = getCart();
      const { count, sub, fee, total } = calc(cart);
  
      miniList.innerHTML = "";
      cart.slice(0, 6).forEach(i => {
        const row = document.createElement("div");
        row.className = "miniItem";
        row.innerHTML = `
          <div>
            <div class="v">${i.title}</div>
            <div class="k">${i.qty || 1} × ${money(i.price)}</div>
          </div>
          <div class="v">${money(Number(i.price) * Number(i.qty || 1))}</div>
        `;
        miniList.appendChild(row);
      });
  
      itemCount.textContent = String(count);
      grandTotal.textContent = money(total);
      subtotalEl.textContent = money(sub);
      feeEl.textContent = money(fee);
      totalEl.textContent = money(total);
    }
  
    function isBangladeshPhone(v) {
      return /^01\d{9}$/.test(v);
    }
  
    function validAuthCode(v) {
      return /^\d{6}$/.test(v);
    }
  
    function showAuth() { authModal.classList.add("show"); }
    function hideAuth() { authModal.classList.remove("show"); authCode.value = ""; hint("authCode",""); }
  
    authClose.addEventListener("click", hideAuth);
    authX.addEventListener("click", hideAuth);
    cancelAuth.addEventListener("click", hideAuth);
  
    methodWrap.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => {
        methodWrap.querySelectorAll(".chip").forEach(x => x.classList.remove("isActive"));
        btn.classList.add("isActive");
        selectedMethod = btn.dataset.method;
  
        const isCard = selectedMethod.startsWith("card_");
        payCard.style.display = isCard ? "block" : "none";
        payMobile.style.display = isCard ? "none" : "block";
      });
    });
  
    function validate() {
      clearHints();
      let ok = true;
  
      if (fullName.value.trim().length < 3) { hint("fullName","Enter your full name."); ok = false; }
      if (!isBangladeshPhone(phone.value.trim())) { hint("phone","Phone must start with 01 and be exactly 11 digits."); ok = false; }
      if (street.value.trim().length < 5) { hint("street","Enter a valid street address."); ok = false; }
      if (city.value.trim().length < 2) { hint("city","Enter your city."); ok = false; }
  
      const cart = getCart();
      if (!cart.length) { alert("Your cart is empty."); ok = false; }
  
      if (selectedMethod.startsWith("card_")) {
        const digits = cardNumber.value.replace(/\s+/g, "");
        if (cardName.value.trim().length < 3) { hint("cardName","Enter cardholder name."); ok = false; }
        if (!/^\d{16}$/.test(digits)) { hint("cardNumber","Card number must be 16 digits."); ok = false; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.value.trim())) { hint("cardExpiry","Use MM/YY."); ok = false; }
        if (!/^\d{3}$/.test(cardCvv.value.trim())) { hint("cardCvv","CVV must be 3 digits."); ok = false; }
      } else {
        if (!isBangladeshPhone(mfsPhone.value.trim())) { hint("mfsPhone","Phone must start with 01 and be exactly 11 digits."); ok = false; }
        if (mfsPin.value.trim().length < 4) { hint("mfsPin","Enter a valid PIN."); ok = false; }
      }
  
      return ok;
    }
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
  
      const cart = getCart();
      const totals = calc(cart);
  
      // create payload for backend (don’t send raw sensitive fields — keep it demo-safe)
      pendingPayload = {
        address: {
          fullName: fullName.value.trim(),
          phone: phone.value.trim(),
          street: street.value.trim(),
          city: city.value.trim(),
          postal: postal.value.trim()
        },
        payment: {
          method: selectedMethod,
          // masked summary only (demo)
          ref: selectedMethod.startsWith("card_")
            ? ("**** " + cardNumber.value.replace(/\s+/g,"").slice(-4))
            : (mfsPhone.value.trim())
        },
        cart,
        totals
      };
  
      // Next step: authorization code
      showAuth();
    });
  
    confirmAuth.addEventListener("click", async (e) => {
        e.preventDefault(); // ✅ stops any accidental form submit
        e.stopPropagation();
      
        clearHints();
        const code = authCode.value.trim();
      
        if (!/^\d{6}$/.test(code)) {
          hint("authCode","Authorization code must be exactly 6 digits.");
          return;
        }
        if (!pendingPayload) return;
      
        try {
          const res = await fetch("/LocalMart/controllers/place_order.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...pendingPayload, authorization_code: code })
          });
      
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error("Server did not return JSON. Raw response:");
            console.error(text);
            throw new Error("Server error (not JSON). Check console for raw response.");
          }

          if (!res.ok || !data.ok) throw new Error(data.error || "Payment failed");
      
          localStorage.setItem("localmart_cart", "[]");
          hideAuth();
      
          successMsg.textContent = `Receipt has been sent to ${data.email}. Order ID: ${data.order_id}.`;
          successScreen.style.display = "grid";
        } catch (err) {
          alert(err.message);
        }
      }); 
      
      authCode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          confirmAuth.click();
        }
      });      
  
    renderSummary();
  })();
  