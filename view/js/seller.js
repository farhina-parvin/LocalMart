console.log("seller.js LOADED ✅");

(function () {
  const listingCards = document.getElementById("listingCards");
  const emptyState = document.getElementById("emptyState");

  const form = document.getElementById("listingForm");
  const titleEl = document.getElementById("title");
  const priceEl = document.getElementById("price");
  const catEl = document.getElementById("category");
  const condEl = document.getElementById("condition");
  const descEl = document.getElementById("desc");
  const locEl = document.getElementById("location");
  const photoEl = document.getElementById("photoUrl");
  const qtyEl = document.getElementById("quantity");

  const sortBy = document.getElementById("sortBy");
  const searchInput = document.getElementById("searchInput");

  const openListing = document.getElementById("openListing");
  const resetForm = document.getElementById("resetForm");

  const boostTips = document.getElementById("boostTips");
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("closeModal");
  const xModal = document.getElementById("xModal");
  const gotIt = document.getElementById("gotIt");

  const autoFillDemo = document.getElementById("autoFillDemo");
  const clearListings = document.getElementById("clearListings");

  const viewsToday = document.getElementById("viewsToday");
  const activeCount = document.getElementById("activeCount");
  const msgCount = document.getElementById("msgCount");

  const notifBtn = document.getElementById("notifBtn");
  const notifDot = document.getElementById("notifDot");

  let filter = "all";
  let listings = []; // UI state (synced from DB)
  let busy = false;

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showModal() { modal.classList.add("show"); }
  function hideModal() { modal.classList.remove("show"); }

  boostTips?.addEventListener("click", showModal);
  closeModal?.addEventListener("click", hideModal);
  xModal?.addEventListener("click", hideModal);
  gotIt?.addEventListener("click", hideModal);

  notifBtn?.addEventListener("click", () => {
    notifDot.style.display = "none";
  });

  openListing?.addEventListener("click", () => {
    document.getElementById("formPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    titleEl?.focus();
  });

  resetForm?.addEventListener("click", () => {
    form.reset();
  });

  // -----------------------------
  // API: DB endpoints
  // -----------------------------
  async function loadUserPill() {
    const pill = document.getElementById("userPill");
    if (!pill) return;
  
    try {
      const res = await fetch("/LocalMart/controllers/get_profile.php");
      const text = await res.text();
      const data = JSON.parse(text);
  
      if (res.ok && data.ok && data.user?.name) {
        pill.textContent = data.user.name;
      } else {
        pill.textContent = "Account";
      }
    } catch (e) {
      pill.textContent = "Account";
    }
  }  

  async function fetchMyProducts() {
    const res = await fetch("/LocalMart/controllers/get_my_products.php");
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("get_my_products.php did not return JSON. Check PHP errors."); }

    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load your products");
    return data.products || [];
  }

  async function publishToDB(payload) {
    const res = await fetch("/LocalMart/controllers/add_product.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("add_product.php did not return JSON. Check PHP errors."); }

    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to publish");
    return data.product;
  }

  async function deleteFromDB(productId) {
    const res = await fetch("/LocalMart/controllers/delete_product.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("delete_product.php did not return JSON. Check PHP errors."); }

    if (!res.ok || !data.ok) throw new Error(data.error || "Delete failed");
  }

  async function updateStatusInDB(productId, newStatus) {
    const res = await fetch("/LocalMart/controllers/update_product_status.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, status: newStatus }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("update_product_status.php did not return JSON. Check PHP errors."); }

    if (!res.ok || !data.ok) throw new Error(data.error || "Status update failed");
  }

  // -----------------------------
  // Validation helpers
  // -----------------------------
  function clearHints() {
    document.querySelectorAll(".hint[data-hint]").forEach((h) => (h.textContent = ""));
  }
  function setHint(key, msg) {
    const el = document.querySelector(`.hint[data-hint="${key}"]`);
    if (el) el.textContent = msg;
  }

  function validate() {
    clearHints();
    let ok = true;

    if (titleEl.value.trim().length < 6) { setHint("title", "Make the title more descriptive (at least 6 chars)."); ok = false; }
    if (!priceEl.value || Number(priceEl.value) <= 0) { setHint("price", "Set a realistic price greater than 0."); ok = false; }
    if (!catEl.value) { setHint("category", "Pick a category so buyers can find it."); ok = false; }
    if (!condEl.value) { setHint("condition", "Pick a condition (buyers care)."); ok = false; }
    if (descEl.value.trim().length < 20) { setHint("desc", "Add at least 20 chars: include flaws + what’s included."); ok = false; }
    if (locEl.value.trim().length < 3) { setHint("location", "Add a location (city/neighborhood)."); ok = false; }
    if (!qtyEl.value || Number(qtyEl.value) < 1) { setHint("quantity", "Quantity must be at least 1."); ok = false; }

    return ok;
  }

  // -----------------------------
  // UI transforms
  // -----------------------------
  function updateStats() {
    viewsToday.textContent = String(rand(12, 120));
    activeCount.textContent = String(listings.filter((l) => l.status === "active").length);
    msgCount.textContent = String(rand(0, 14));
  }

  function applyFilter(list) {
    if (filter === "all") return list;
    return list.filter((l) => l.status === filter);
  }

  function applySearch(list) {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) =>
      (l.title + " " + l.category + " " + l.location).toLowerCase().includes(q)
    );
  }

  function applySort(list) {
    const mode = sortBy?.value || "newest";
    const copy = [...list];

    if (mode === "newest") copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (mode === "priceHigh") copy.sort((a, b) => Number(b.price) - Number(a.price));
    if (mode === "priceLow") copy.sort((a, b) => Number(a.price) - Number(b.price));
    if (mode === "views") copy.sort((a, b) => (b.views || 0) - (a.views || 0));

    return copy;
  }

  function render() {
    const visible = applySort(applySearch(applyFilter(listings)));

    listingCards.innerHTML = "";
    if (visible.length === 0) {
      listingCards.appendChild(emptyState);
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
      visible.forEach((item) => listingCards.appendChild(makeCard(item)));
    }

    updateStats();
  }

  function statusTag(status) {
    if (status === "active") return `<span class="tag tag--active">Active</span>`;
    if (status === "sold") return `<span class="tag tag--sold">Sold</span>`;
    return `<span class="tag">Draft</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeCard(item) {
    const el = document.createElement("div");
    el.className = "cardItem";

    const imgHtml = item.photo
      ? `<img src="${escapeHtml(item.photo)}" alt="Listing photo">`
      : `<div style="width:100%;height:100%;display:grid;place-items:center;opacity:.75;">📦</div>`;

    el.innerHTML = `
      <div class="thumb">${imgHtml}</div>
      <div class="meta">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="sub">
          ${escapeHtml(item.category)} • ${escapeHtml(item.condition)} • ${escapeHtml(item.location)}
        </div>

        <div class="pills">
          ${statusTag(item.status)}
          <span class="tag">$${Number(item.price).toFixed(0)}</span>
          <span class="tag">${Number(item.quantity ?? 0)} in stock</span>
          <span class="tag">${item.views || 0} views</span>
        </div>

        <div class="itemActions">
          <button class="smallBtn" data-action="toggle">${item.status === "sold" ? "Mark Active" : "Mark Sold"}</button>
          <button class="smallBtn" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    // Toggle status (DB + UI)
    el.querySelector('[data-action="toggle"]').addEventListener("click", async (e) => {
      e.stopPropagation();
      if (busy) return;

      const newStatus = item.status === "sold" ? "active" : "sold";

      try {
        busy = true;
        await updateStatusInDB(item.id, newStatus);
        item.status = newStatus; // update UI state
        render();
      } catch (err) {
        alert(err.message);
      } finally {
        busy = false;
      }
    });

    // Delete (DB + UI)
    el.querySelector('[data-action="delete"]').addEventListener("click", async (e) => {
      e.stopPropagation();
      if (busy) return;

      const ok = confirm("Delete this listing permanently? This cannot be undone.");
      if (!ok) return;

      try {
        busy = true;
        await deleteFromDB(item.id);
        listings = listings.filter((x) => String(x.id) !== String(item.id));
        render();
      } catch (err) {
        alert(err.message);
      } finally {
        busy = false;
      }
    });

    return el;
  }

  // -----------------------------
  // Submit: create listing (DB first)
  // -----------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (busy) return;

    const payload = {
      title: titleEl.value.trim(),
      price: Number(priceEl.value),
      quantity: Number(qtyEl.value),
      category: catEl.value,
      condition: condEl.value,
      description: descEl.value.trim(),
      location: locEl.value.trim(),
      photo_url: photoEl.value.trim(),
    };

    try {
      busy = true;

      const inserted = await publishToDB(payload);

      // refresh from DB (truth source)
      listings = await fetchMyProducts();

      form.reset();
      notifDot.style.display = "block";
      render();

      console.log("Published to DB:", inserted);
    } catch (err) {
      alert(err.message);
    } finally {
      busy = false;
    }
  });

  // filter chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("isActive"));
      chip.classList.add("isActive");
      filter = chip.dataset.filter;
      render();
    });
  });

  sortBy?.addEventListener("change", render);
  searchInput?.addEventListener("input", render);

  // demo filler still local (does NOT save to DB)
  autoFillDemo?.addEventListener("click", () => {
    const demo = [
      {
        title: "Gaming Chair — Like New (ergonomic)",
        price: 120,
        quantity: 2,
        category: "Furniture",
        condition: "Like New",
        desc: "No damage, barely used. Includes lumbar pillow. Pickup evenings.",
        location: "NW Calgary",
        photo: "",
      },
      {
        title: "AirPods Pro (2nd Gen) — Great Condition",
        price: 180,
        quantity: 1,
        category: "Electronics",
        condition: "Good",
        desc: "Works perfectly. Includes case + extra tips. Can meet downtown.",
        location: "Downtown",
        photo: "",
      },
    ];

    demo.forEach((d) => {
      listings.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        status: "active",
        createdAt: Date.now() - rand(10000, 800000),
        views: rand(20, 300),
        ...d,
      });
    });

    notifDot.style.display = "block";
    render();
  });

  clearListings?.addEventListener("click", () => {
    listings = [];
    render();
  });

  // -----------------------------
  // INIT: load from DB
  // -----------------------------
  (async function init() {
    viewsToday.textContent = String(rand(12, 120));
    msgCount.textContent = String(rand(0, 14));

    try {
      listings = await fetchMyProducts();
    } catch (e) {
      console.error(e);
      // fall back: keep empty UI, but don't crash
      listings = [];
    }
    render();
  })();
})();
