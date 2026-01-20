
(function () {
  const productCards = document.getElementById("productCards");
  const emptyState = document.getElementById("emptyState");

  const searchInput = document.getElementById("searchInput");
  const sortBy = document.getElementById("sortBy");

  // Modal
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("closeModal");
  const xModal = document.getElementById("xModal");
  const closeBtn = document.getElementById("closeBtn");

  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const modalImg = document.getElementById("modalImg");
  const modalImgFallback = document.getElementById("modalImgFallback");
  const modalPrice = document.getElementById("modalPrice");
  const modalTag = document.getElementById("modalTag");
  const modalCondition = document.getElementById("modalCondition");
  const modalLocation = document.getElementById("modalLocation");
  const modalDesc = document.getElementById("modalDesc");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const toast = document.getElementById("toast");

  let items = [];
  let filter = "all";
  let activeItem = null;

  function showModal() {
    modal.classList.add("show");
  }
  function hideModal() {
    modal.classList.remove("show");
    activeItem = null;
  }

  closeModal?.addEventListener("click", hideModal);
  xModal?.addEventListener("click", hideModal);
  closeBtn?.addEventListener("click", hideModal);

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

  function addToCart(item) {
    const cart = getCart();

    // Merge: if item exists, increase qty
    const idx = cart.findIndex(x => String(x.id) === String(item.id));
    if (idx >= 0) {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
    } else {
      cart.push({
        id: item.id,
        title: item.title,
        price: Number(item.price),
        category: item.category,
        condition: item.condition,
        location: item.location,
        desc: item.desc,
        photo: item.photo || "",
        qty: 1
      });
    }
    setCart(cart);
  }

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
  

  async function fetchProducts() {
    const res = await fetch("../../controllers/get_products.php");

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned invalid JSON. Check get_products.php for errors.");
    }

    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to fetch products");
    return data.products || [];
  }

  function normalizeCategory(cat) {
    const c = (cat || "").toLowerCase();
    if (c.includes("elect")) return "electronics";
    if (c.includes("furn")) return "furniture";
    if (c.includes("fash")) return "fashion";
    if (c.includes("book")) return "books";
    if (c.includes("other")) return "other";
    return "other";
  }

  function applyFilter(list) {
    if (filter === "all") return list;
    return list.filter(i => normalizeCategory(i.category) === filter);
  }

  function applySearch(list) {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return list;
    return list.filter(i => (i.title + " " + i.category + " " + i.location).toLowerCase().includes(q));
  }

  function applySort(list) {
    const mode = sortBy.value;
    const copy = [...list];
    if (mode === "newest") copy.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (mode === "priceLow") copy.sort((a,b) => Number(a.price) - Number(b.price));
    if (mode === "priceHigh") copy.sort((a,b) => Number(b.price) - Number(a.price));
    return copy;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openDetails(item) {
    activeItem = item;
  
    modalTitle.textContent = item.title;
    modalSub.textContent = `${item.category} • ${item.location}`;
    modalPrice.textContent = `$${Number(item.price).toFixed(0)}`;
    modalTag.textContent = item.category;
  
    modalCondition.textContent = item.condition || "—";
    modalLocation.textContent = item.location || "—";
    modalDesc.textContent = item.desc || "—";
  
    // ✅ quantity (safe)
    const qtyEl = document.getElementById("modalQty");
    if (qtyEl) qtyEl.textContent = String(item.quantity ?? "—");
  
    // image handling
    const hasPhoto = item.photo && String(item.photo).trim().length > 0;
    if (hasPhoto) {
      modalImg.src = item.photo;
      modalImg.style.display = "block";
      modalImgFallback.style.display = "none";
      modalImg.onerror = () => {
        modalImg.style.display = "none";
        modalImgFallback.style.display = "grid";
      };
    } else {
      modalImg.style.display = "none";
      modalImgFallback.style.display = "grid";
    }
  
    toast.style.display = "none";
    showModal();
  }  

  addToCartBtn?.addEventListener("click", () => {
    if (!activeItem) return;
    addToCart(activeItem);

    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 1200);
  });

  function makeCard(item) {
    const el = document.createElement("div");
    el.className = "card";

    const img = item.photo
      ? `<img src="${escapeHtml(item.photo)}" alt="Product photo"
           style="width:100%;height:160px;object-fit:cover;display:block;"
           onerror="this.style.display='none'; this.parentElement.querySelector('.card__img').style.display='grid';">`
      : "";

    el.innerHTML = `
      ${img}
      <div class="card__img" style="display:${item.photo ? "none" : "grid"};">📦</div>

      <div class="card__body">
        <div class="card__title">${escapeHtml(item.title)}</div>
        <div class="card__sub">${escapeHtml(item.location)} • ${escapeHtml(item.condition)}</div>
        <div class="card__bottom">
          <div class="price">$${Number(item.price).toFixed(0)}</div>
          <span class="pillTag">${escapeHtml(item.category)}</span>
        </div>
      </div>
    `;

    // Click card → open details modal
    el.addEventListener("click", () => openDetails(item));
    return el;
  }

  function render() {
    const visible = applySort(applySearch(applyFilter(items)));

    productCards.innerHTML = "";
    if (visible.length === 0) {
      productCards.appendChild(emptyState);
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    visible.forEach(i => productCards.appendChild(makeCard(i)));
  }


  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("isActive"));
      chip.classList.add("isActive");
      filter = chip.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener("input", render);
  sortBy.addEventListener("change", render);

  // Load from DB on page load
  (async function init() {
    try {
      items = await fetchProducts();
      render();
    } catch (e) {
      console.error(e);
      render();
    }
  })();
})();
