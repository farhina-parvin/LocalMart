console.log("admin.js LOADED ✅");

(function () {
  const statUsers = document.getElementById("statUsers");
  const statListings = document.getElementById("statListings");

  const tabs = document.querySelectorAll(".tab");
  const panelTitle = document.getElementById("panelTitle");

  const usersView = document.getElementById("usersView");
  const listingsView = document.getElementById("listingsView");

  const usersTable = document.getElementById("usersTable");
  const listingsTable = document.getElementById("listingsTable");

  const emptyState = document.getElementById("emptyState");

  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const refreshBtn = document.getElementById("refreshBtn");
  const toast = document.getElementById("toast");

  let activeTab = "users";
  let users = [];
  let listings = [];

  function showToast(msg="Done ✅") {
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 900);
  }

  async function safeJson(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch {
      console.error("NOT JSON:", text);
      throw new Error("Server did not return JSON. Check PHP errors.");
    }
  }

  async function fetchUsers() {
    const res = await fetch("/LocalMart/controllers/admin_get_users.php");
    const data = await safeJson(res);
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load users");
    return data.users || [];
  }

  async function fetchListings() {
    const res = await fetch("/LocalMart/controllers/admin_get_listings.php");
    const data = await safeJson(res);
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load listings");
    return data.listings || [];
  }

  async function deleteUser(id) {
    const res = await fetch("/LocalMart/controllers/admin_delete_user.php", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ user_id: id })
    });
    const data = await safeJson(res);
    if (!res.ok || !data.ok) throw new Error(data.error || "Delete user failed");
  }

  async function deleteListing(id) {
    const res = await fetch("/LocalMart/controllers/admin_delete_listing.php", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ product_id: id })
    });
    const data = await safeJson(res);
    if (!res.ok || !data.ok) throw new Error(data.error || "Delete listing failed");
  }

  function badge(role) {
    if (role === "admin") return `<span class="badge badge--admin">admin</span>`;
    if (role === "seller") return `<span class="badge badge--seller">seller</span>`;
    return `<span class="badge badge--buyer">buyer</span>`;
  }

  function applySearchAndFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const r = roleFilter.value;

    if (activeTab === "users") {
      let list = [...users];
      if (r !== "all") list = list.filter(u => u.role === r);
      if (q) list = list.filter(u =>
        (u.name + " " + u.email + " " + u.role).toLowerCase().includes(q)
      );
      renderUsers(list);
    } else {
      let list = [...listings];
      if (q) list = list.filter(p =>
        (p.title + " " + p.category + " " + p.seller_email + " " + p.status).toLowerCase().includes(q)
      );
      renderListings(list);
    }
  }

  function renderUsers(list) {
    usersTable.innerHTML = "";
    if (!list.length) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    list.forEach(u => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div>${u.id}</div>
        <div>${escapeHtml(u.name)}</div>
        <div>${escapeHtml(u.email)}</div>
        <div>${badge(u.role)}</div>
        <div>
          <button class="actionBtn actionBtn--danger" ${u.role==="admin" ? "disabled" : ""} data-del="${u.id}">
            Remove
          </button>
        </div>
      `;
      row.querySelector("[data-del]")?.addEventListener("click", async () => {
        if (u.role === "admin") return;
        if (!confirm(`Remove user ${u.email}? This will also remove their listings.`)) return;

        try {
          await deleteUser(u.id);
          users = await fetchUsers();
          listings = await fetchListings();
          statUsers.textContent = users.length;
          statListings.textContent = listings.length;
          applySearchAndFilters();
          showToast("User removed ✅");
        } catch (e) {
          alert(e.message);
        }
      });

      usersTable.appendChild(row);
    });
  }

  function renderListings(list) {
    listingsTable.innerHTML = "";
    if (!list.length) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    list.forEach(p => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div>${p.id}</div>
        <div>${escapeHtml(p.title)}</div>
        <div>$${Number(p.price).toFixed(0)}</div>
        <div>${Number(p.quantity ?? 0)}</div>
        <div>${escapeHtml(p.seller_email || "—")}</div>
        <div><span class="badge">${escapeHtml(p.status)}</span></div>
        <div>
          <button class="actionBtn actionBtn--danger" data-del="${p.id}">Remove</button>
        </div>
      `;

      row.querySelector("[data-del]")?.addEventListener("click", async () => {
        if (!confirm(`Remove listing "${p.title}"?`)) return;
        try {
          await deleteListing(p.id);
          listings = await fetchListings();
          statListings.textContent = listings.length;
          applySearchAndFilters();
          showToast("Listing removed ✅");
        } catch (e) {
          alert(e.message);
        }
      });

      listingsTable.appendChild(row);
    });
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // Tab switching
  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("isActive"));
      t.classList.add("isActive");
      activeTab = t.dataset.tab;

      if (activeTab === "users") {
        panelTitle.textContent = "Users";
        usersView.style.display = "block";
        listingsView.style.display = "none";
        roleFilter.style.display = "inline-block";
      } else {
        panelTitle.textContent = "Listings";
        usersView.style.display = "none";
        listingsView.style.display = "block";
        roleFilter.style.display = "none";
      }
      applySearchAndFilters();
    });
  });

  searchInput.addEventListener("input", applySearchAndFilters);
  roleFilter.addEventListener("change", applySearchAndFilters);

  refreshBtn.addEventListener("click", async () => {
    try {
      users = await fetchUsers();
      listings = await fetchListings();
      statUsers.textContent = users.length;
      statListings.textContent = listings.length;
      applySearchAndFilters();
      showToast("Refreshed ✅");
    } catch (e) {
      alert(e.message);
    }
  });

  // Initial load
  (async function init() {
    try {
      users = await fetchUsers();
      listings = await fetchListings();
      statUsers.textContent = users.length;
      statListings.textContent = listings.length;
      applySearchAndFilters();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  })();
})();
