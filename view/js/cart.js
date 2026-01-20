// view/js/cart.js
(function () {
    const cartList = document.getElementById("cartList");
    const emptyState = document.getElementById("emptyState");
  
    const itemCount = document.getElementById("itemCount");
    const grandTotal = document.getElementById("grandTotal");
  
    const subtotalEl = document.getElementById("subtotal");
    const feeEl = document.getElementById("fee");
    const totalEl = document.getElementById("total");
  
    const clearCartBtn = document.getElementById("clearCart");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const continueBtn = document.getElementById("continueBtn");
    const toast = document.getElementById("toast");
  
    function getCart() {
      try {
        return JSON.parse(localStorage.getItem("localmart_cart") || "[]");
      } catch {
        return [];
      }
    }
  
    function setCart(cart) {
      localStorage.setItem("localmart_cart", JSON.stringify(cart));
    }
  
    function money(n) {
      const x = Number(n || 0);
      return "$" + x.toFixed(0);
    }
  
    function calc(cart) {
      let count = 0;
      let sub = 0;
  
      cart.forEach(i => {
        const qty = Number(i.qty || 1);
        count += qty;
        sub += Number(i.price || 0) * qty;
      });
  
      // tiny “service fee” just for UI polish (you can remove later)
      const fee = cart.length ? Math.min(50, Math.round(sub * 0.02)) : 0;
      const total = sub + fee;
  
      return { count, sub, fee, total };
    }
  
    function showToast(msg = "Updated ✅") {
      toast.textContent = msg;
      toast.style.display = "block";
      setTimeout(() => (toast.style.display = "none"), 900);
    }
  
    function inc(id) {
      const cart = getCart();
      const idx = cart.findIndex(x => String(x.id) === String(id));
      if (idx < 0) return;
  
      cart[idx].qty = (cart[idx].qty || 1) + 1;
      setCart(cart);
      render();
      showToast();
    }
  
    function dec(id) {
      const cart = getCart();
      const idx = cart.findIndex(x => String(x.id) === String(id));
      if (idx < 0) return;
  
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
      setCart(cart);
      render();
      showToast();
    }
  
    function removeItem(id) {
      let cart = getCart();
      cart = cart.filter(x => String(x.id) !== String(id));
      setCart(cart);
      render();
      showToast("Removed ✅");
    }
  
    function clearCart() {
      setCart([]);
      render();
      showToast("Cleared ✅");
    }
  
    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  
    function makeRow(item) {
      const el = document.createElement("div");
      el.className = "item";
  
      const hasPhoto = item.photo && String(item.photo).trim().length > 0;
  
      el.innerHTML = `
        <div class="thumb">
          ${hasPhoto ? `<img src="${escapeHtml(item.photo)}" alt="photo"
              onerror="this.style.display='none'; this.parentElement.querySelector('.thumbFallback').style.display='grid';">` : ""}
          <div class="thumbFallback" style="display:${hasPhoto ? "none" : "grid"};">📦</div>
        </div>
  
        <div class="meta">
          <div class="titleRow">
            <div>
              <div class="itemTitle">${escapeHtml(item.title || "Item")}</div>
              <div class="itemSub">${escapeHtml(item.category || "")} • ${escapeHtml(item.location || "")} • ${escapeHtml(item.condition || "")}</div>
            </div>
            <button class="removeBtn" data-remove="${escapeHtml(item.id)}">Remove</button>
          </div>
  
          <div class="priceRow">
            <div class="qty">
              <button class="qtyBtn" data-dec="${escapeHtml(item.id)}">−</button>
              <div class="qtyVal">${Number(item.qty || 1)}</div>
              <button class="qtyBtn" data-inc="${escapeHtml(item.id)}">+</button>
            </div>
  
            <div style="font-weight:900;">
              ${money(Number(item.price || 0) * Number(item.qty || 1))}
            </div>
          </div>
        </div>
      `;
  
      el.querySelector(`[data-inc="${CSS.escape(String(item.id))}"]`)?.addEventListener("click", () => inc(item.id));
      el.querySelector(`[data-dec="${CSS.escape(String(item.id))}"]`)?.addEventListener("click", () => dec(item.id));
      el.querySelector(`[data-remove="${CSS.escape(String(item.id))}"]`)?.addEventListener("click", () => removeItem(item.id));
  
      return el;
    }
  
    function render() {
      const cart = getCart();
  
      cartList.innerHTML = "";
  
      if (!cart.length) {
        emptyState.style.display = "block";
      } else {
        emptyState.style.display = "none";
        cart.forEach(i => cartList.appendChild(makeRow(i)));
      }
  
      const { count, sub, fee, total } = calc(cart);
  
      itemCount.textContent = String(count);
      grandTotal.textContent = money(total);
  
      subtotalEl.textContent = money(sub);
      feeEl.textContent = money(fee);
      totalEl.textContent = money(total);
    }
  
    clearCartBtn?.addEventListener("click", clearCart);
  
    continueBtn?.addEventListener("click", () => {
      window.location.href = "buyer.html";
    });
  
    checkoutBtn?.addEventListener("click", () => {
        window.location.href = "checkout.html";
      });      
  
    render();
  })();
  