// app/admin/page.tsx — Design Warehouse admin page.
// Why this exists: under output:"standalone" + Railpack, public/*.html files
// (only) 404 at runtime, and route handlers under app/api/* did not bind for
// this path either. Embedding the admin.html content directly into a page
// route forces Next.js to register the URL through the same mechanism as the
// existing root page (/) which is known to work.
//
// The wrapping admin/layout.tsx returns {children} as a fragment so the OS
// root layout is not applied; this page provides its own <html>/<body>.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_HTML = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #FFFFFF;
    --soft: #FAFAFA;
    --red: #C41E3A;
    --red-dark: #A8172F;
    --ink: #0B0B0F;
    --line: #E5E7EB;
    --muted: #6B7280;
    --muted-soft: #9CA3AF;
    --green: #10B981;
    --indigo: #6366F1;
  }
  * , *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    font-family: Inter, system-ui, -apple-system, sans-serif;
    background: var(--paper);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  button { font: inherit; cursor: pointer; }
  input { font: inherit; }

  /* Layout */
  .app { display: grid; grid-template-rows: 60px 1fr; height: 100vh; }
  .top {
    display: grid;
    grid-template-columns: 280px 1fr auto auto auto;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .brand { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
  .brand .dot { display: inline-block; width: 8px; height: 8px; background: var(--red); border-radius: 999px; margin-right: 8px; vertical-align: middle; }
  .search {
    height: 36px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 0 12px 0 36px;
    width: 100%;
    max-width: 540px;
    background: var(--paper) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='7'/><path d='M21 21l-4.35-4.35'/></svg>") 12px 50% / 16px 16px no-repeat;
    outline: none;
  }
  .search:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(196,30,58,0.10); }

  .pills { display: flex; gap: 6px; }
  .pill {
    height: 28px;
    padding: 0 12px;
    border-radius: 9999px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font-size: 12px;
    font-weight: 500;
    display: inline-flex; align-items: center;
  }
  .pill.active { background: var(--red); color: #FFFFFF; border-color: var(--red); }
  .pill:hover:not(.active) { background: #F4F4F5; }

  .sort {
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 9999px;
    background: var(--paper);
    font-size: 12px;
  }
  .count { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .logout { font-size: 12px; color: var(--muted); background: transparent; border: none; padding: 0 4px; }
  .logout:hover { color: var(--red); }

  /* Body */
  .body { display: grid; grid-template-columns: 240px 1fr; min-height: 0; }
  .side {
    background: var(--soft);
    border-right: 1px solid var(--line);
    overflow-y: auto;
    padding: 16px 8px;
  }
  .side h2 {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 8px 12px 8px;
  }
  .cat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    border-left: 3px solid transparent;
    color: var(--ink);
  }
  .cat-row:hover { background: #F4F4F5; }
  .cat-row.active { background: #FFFFFF; border-left-color: var(--red); font-weight: 600; }
  .cat-row .n { font-size: 11px; color: var(--muted); }
  .cat-row.active .n { color: var(--ink); }

  .main { overflow-y: auto; padding: 16px; background: var(--paper); }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }
  .card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.08);
    cursor: pointer;
    outline: none;
    transition: border-color 0.12s, transform 0.12s;
  }
  .card:hover { border-color: #D4D4D8; }
  .card:focus-visible { border-color: var(--red); box-shadow: 0 0 0 3px rgba(196,30,58,0.15); }
  .thumb {
    aspect-ratio: 16 / 10;
    background: #F4F4F5 center/cover no-repeat;
    border-bottom: 1px solid var(--line);
  }
  .meta { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .name { font-size: 13px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .source { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 10px; border-top: 1px solid var(--line);
  }
  .status {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 9999px;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .status.raw { background: var(--muted-soft); }
  .status.approved { background: var(--green); }
  .status.rejected { background: var(--red); }
  .status.usable { background: var(--indigo); }

  .actions { display: flex; gap: 4px; }
  .icon-btn {
    width: 28px; height: 28px;
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ink);
  }
  .icon-btn svg { width: 14px; height: 14px; }
  .icon-btn:hover { background: #F4F4F5; }
  .icon-btn.approve:hover { background: #ECFDF5; border-color: var(--green); color: var(--green); }
  .icon-btn.reject:hover { background: #FEF2F2; border-color: var(--red); color: var(--red); }

  .empty {
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    padding: 80px 20px;
  }

  /* Modal */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(11,11,15,0.55);
    display: none;
    align-items: center; justify-content: center;
    z-index: 50;
    padding: 24px;
  }
  .overlay.show { display: flex; }
  .modal {
    background: var(--paper);
    border-radius: 14px;
    width: 100%;
    max-width: 980px;
    max-height: 90vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    box-shadow: 0 30px 60px -20px rgba(0,0,0,0.30);
  }
  .modal .preview {
    background: #0B0B0F;
    display: grid; place-items: center;
    padding: 24px;
    overflow: hidden;
  }
  .modal .preview img { max-width: 100%; max-height: 80vh; object-fit: contain; }
  .modal .info { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
  .modal h2 { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }
  .modal .src { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .modal label { font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .modal .field { font-size: 13px; color: var(--ink); word-break: break-word; }
  .modal .field a { color: var(--red); text-decoration: none; }
  .modal textarea {
    width: 100%; min-height: 96px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit; font-size: 13px;
    resize: vertical;
    outline: none;
  }
  .modal textarea:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(196,30,58,0.10); }
  .modal-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn {
    height: 34px; padding: 0 14px; border-radius: 9999px;
    border: 1px solid var(--line); background: var(--paper); color: var(--ink);
    font-size: 12px; font-weight: 600;
  }
  .btn:hover { background: #F4F4F5; }
  .btn.primary { background: var(--green); border-color: var(--green); color: #FFFFFF; }
  .btn.primary:hover { background: #0EA371; }
  .btn.danger { background: var(--red); border-color: var(--red); color: #FFFFFF; }
  .btn.danger:hover { background: var(--red-dark); }
  .btn.indigo { background: var(--indigo); border-color: var(--indigo); color: #FFFFFF; }
  .btn.indigo:hover { background: #4F46E5; }
  .btn.close { margin-left: auto; }

  /* Loading */
  .skeleton {
    background: linear-gradient(90deg, #F4F4F5 0%, #FAFAFA 50%, #F4F4F5 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
</style>

<div class="app">
  <div class="top">
    <div class="brand"><span class="dot"></span>Design Warehouse</div>
    <input id="search" class="search" placeholder="Search by name, source, prompt or tag..." autocomplete="off" />
    <div class="pills" id="status-pills">
      <button class="pill active" data-status="">All</button>
      <button class="pill" data-status="raw">Raw</button>
      <button class="pill" data-status="approved">Approved</button>
      <button class="pill" data-status="rejected">Rejected</button>
      <button class="pill" data-status="usable">Usable</button>
    </div>
    <select id="sort" class="sort">
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="name_asc">Name A→Z</option>
      <option value="name_desc">Name Z→A</option>
    </select>
    <div style="display:flex;align-items:center;gap:14px;">
      <span id="count" class="count">— / —</span>
      <button id="logout" class="logout" title="Log out">Log out</button>
    </div>
  </div>
  <div class="body">
    <aside class="side">
      <h2>Categories</h2>
      <div id="categories"></div>
    </aside>
    <main class="main">
      <div id="grid" class="grid"></div>
      <div id="empty" class="empty" style="display:none;">No assets match the current filters.</div>
    </main>
  </div>
</div>

<div id="overlay" class="overlay" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="preview"><img id="m-img" alt="" /></div>
    <div class="info">
      <div>
        <h2 id="m-name">—</h2>
        <div class="src" id="m-source">—</div>
      </div>
      <div><label>Category</label><div class="field" id="m-category">—</div></div>
      <div><label>License</label><div class="field" id="m-license">—</div></div>
      <div><label>Source URL</label><div class="field" id="m-srcurl">—</div></div>
      <div><label>Prompt</label><div class="field" id="m-prompt">—</div></div>
      <div><label>Tags</label><div class="field" id="m-tags">—</div></div>
      <div>
        <label>Notes</label>
        <textarea id="m-notes" placeholder="Add review notes..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn primary" id="m-approve">Approve</button>
        <button class="btn danger" id="m-reject">Reject</button>
        <button class="btn indigo" id="m-usable">Mark Usable</button>
        <button class="btn close" id="m-close">Close</button>
      </div>
    </div>
  </div>
</div>


<script>
(function(){
  "use strict";
  // Token gate — reads localStorage.memelli_token. Shows login overlay if absent.
  var TOKEN_KEY = "memelli_token";
  var token = localStorage.getItem(TOKEN_KEY) || "";

  function showLogin(msg){
    var overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "flex";
    if (msg) {
      var e = document.getElementById("login-err");
      if (e) { e.textContent = msg; e.style.display = "block"; }
    }
    // Hide the warehouse shell so the form is the only interactive surface.
    var app = document.querySelector(".app");
    if (app) app.style.filter = "blur(2px)";
  }

  function hideLogin(){
    var overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "none";
    var app = document.querySelector(".app");
    if (app) app.style.filter = "";
  }

  // Patch window.fetch so every same-origin /api/* and /admin/auth/check call
  // automatically carries Authorization: Bearer <token>.
  var origFetch = window.fetch.bind(window);
  window.fetch = function(input, init){
    init = init || {};
    var url = (typeof input === "string") ? input : (input && input.url) || "";
    var needsAuth = url.indexOf("/api/") === 0 || url.indexOf("/admin/auth/check") === 0;
    if (needsAuth && token) {
      var headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined) || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", "Bearer " + token);
      }
      init.headers = headers;
    }
    return origFetch(input, init).then(function(res){
      // If a protected call returns 401, drop token + show login.
      if (needsAuth && res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        token = "";
        showLogin("Your session has expired. Please sign in again.");
      }
      return res;
    });
  };

  // Wire the login form.
  function wireLoginForm(){
    var form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener("submit", async function(ev){
      ev.preventDefault();
      var emailEl = document.getElementById("login-email");
      var passEl  = document.getElementById("login-password");
      var btn     = document.getElementById("login-submit");
      var errEl   = document.getElementById("login-err");
      var email   = emailEl.value.trim();
      var password = passEl.value;
      if (!email || !password) return;
      btn.disabled = true; btn.textContent = "Signing in...";
      errEl.style.display = "none";
      try {
        var r = await origFetch("/admin/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        });
        var j = await r.json();
        if (!r.ok || !j.ok) {
          throw new Error(j.error || "Sign-in failed");
        }
        localStorage.setItem(TOKEN_KEY, j.data.token);
        location.reload();
      } catch (e) {
        errEl.textContent = e && e.message ? e.message : "Sign-in failed";
        errEl.style.display = "block";
        btn.disabled = false; btn.textContent = "Sign in";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    wireLoginForm();
    if (!token) {
      showLogin();
      return;
    }
    // Have a token — let the warehouse boot. The existing IIFE runs after this.
    hideLogin();
  });

  // Logout — wipe token + reload.
  document.addEventListener("DOMContentLoaded", function(){
    var lo = document.getElementById("logout");
    if (lo) {
      lo.addEventListener("click", function(){
        localStorage.removeItem(TOKEN_KEY);
        location.reload();
      });
    }
  });
})();
</script>

<script>
(function(){
  "use strict";

  var state = {
    category: "",
    status: "",
    q: "",
    sort: "newest",
    assets: [],
    total: 0,
    focusIndex: -1,
    modalAssetId: null,
    notesDirty: false
  };

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function escHtml(s){ if(s==null) return ""; return String(s).replace(/[&<>"']/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"})[c]; }); }
  function debounce(fn, ms){ var t=null; return function(){ var a=arguments,th=this; clearTimeout(t); t=setTimeout(function(){ fn.apply(th,a); }, ms); }; }

  function buildQuery(){
    var p = new URLSearchParams();
    if (state.category) p.set("category", state.category);
    if (state.status) p.set("status", state.status);
    if (state.q) p.set("q", state.q);
    if (state.sort) p.set("sort", state.sort);
    p.set("limit", "500");
    return p.toString();
  }

  function pickThumb(a){
    if (a.thumb_url) return a.thumb_url;
    if (a.url) return a.url;
    return "";
  }

  async function fetchCategories(){
    try {
      var r = await fetch("/api/assets/categories");
      var j = await r.json();
      if (!j.ok) throw new Error(j.error || "categories failed");
      renderCategories(j.categories || []);
    } catch (err) {
      console.error("categories error", err);
    }
  }

  async function fetchAssets(){
    var grid = $("#grid");
    grid.innerHTML = "";
    for (var i=0;i<8;i++){
      var sk = document.createElement("div");
      sk.className = "card";
      sk.innerHTML = '<div class="thumb skeleton"></div><div class="meta"><div class="name skeleton" style="height:14px;border-radius:4px;"></div><div class="source skeleton" style="height:10px;width:60%;border-radius:4px;margin-top:6px;"></div></div>';
      grid.appendChild(sk);
    }
    try {
      var r = await fetch("/api/assets?" + buildQuery());
      var j = await r.json();
      if (!j.ok) throw new Error(j.error || "list failed");
      state.assets = j.assets || [];
      state.total = j.total || state.assets.length;
      renderGrid();
      renderCount();
    } catch (err) {
      console.error("assets error", err);
      grid.innerHTML = '<div class="empty">Failed to load assets: ' + escHtml(err && err.message || String(err)) + '</div>';
    }
  }

  function renderCategories(cats){
    var host = $("#categories");
    var totalAll = cats.reduce(function(s,c){ return s + (c.count||0); }, 0);
    var rows = [];
    rows.push(makeCatRow("", "All", totalAll));
    for (var i=0;i<cats.length;i++){
      var c = cats[i];
      var label = c.category || "(uncategorized)";
      rows.push(makeCatRow(c.category || "__null__", label, c.count));
    }
    host.innerHTML = rows.join("");
    $$("#categories .cat-row").forEach(function(el){
      el.addEventListener("click", function(){
        var cat = el.getAttribute("data-cat") || "";
        state.category = (cat === "__null__") ? "" : cat;
        renderActiveCat();
        fetchAssets();
      });
    });
    renderActiveCat();
  }

  function makeCatRow(key, label, n){
    return '<div class="cat-row" data-cat="' + escHtml(key) + '"><span>' + escHtml(label) + '</span><span class="n">' + (n||0) + '</span></div>';
  }

  function renderActiveCat(){
    $$("#categories .cat-row").forEach(function(el){
      var cat = el.getAttribute("data-cat") || "";
      var match = (cat === state.category) || (cat === "" && !state.category);
      el.classList.toggle("active", match);
    });
  }

  function renderGrid(){
    var grid = $("#grid");
    var empty = $("#empty");
    if (!state.assets.length) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    var html = state.assets.map(function(a, idx){
      var thumb = pickThumb(a);
      var thumbCss = thumb ? 'style="background-image:url(' + JSON.stringify(thumb).slice(1,-1) + ')"' : "";
      var name = a.name || a.prompt || a.id || "Untitled";
      var source = a.source || a.engine || a.asset_type || "";
      var status = a.status || "raw";
      return ''
        + '<div class="card" tabindex="0" data-idx="' + idx + '" data-id="' + escHtml(a.id) + '">'
        +   '<div class="thumb" ' + thumbCss + '></div>'
        +   '<div class="meta">'
        +     '<div class="name" title="' + escHtml(name) + '">' + escHtml(name) + '</div>'
        +     '<div class="source">' + escHtml(source) + '</div>'
        +   '</div>'
        +   '<div class="row">'
        +     '<span class="status ' + escHtml(status) + '">' + escHtml(status) + '</span>'
        +     '<div class="actions">'
        +       '<button class="icon-btn approve" data-act="approved" title="Approve (a)">' + ICON_CHECK + '</button>'
        +       '<button class="icon-btn reject" data-act="rejected" title="Reject (r)">' + ICON_X + '</button>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }).join("");
    grid.innerHTML = html;

    $$("#grid .card").forEach(function(card){
      card.addEventListener("click", function(e){
        var actBtn = e.target.closest("[data-act]");
        var idx = parseInt(card.getAttribute("data-idx"), 10);
        if (actBtn) {
          e.stopPropagation();
          updateStatus(state.assets[idx].id, actBtn.getAttribute("data-act"), null);
          return;
        }
        openModal(idx);
      });
      card.addEventListener("focus", function(){
        state.focusIndex = parseInt(card.getAttribute("data-idx"), 10);
      });
    });
  }

  function renderCount(){
    var shown = state.assets.length;
    var total = state.total;
    $("#count").textContent = shown + " / " + total + " assets";
  }

  async function updateStatus(id, status, notes){
    var asset = state.assets.find(function(a){ return a.id === id; });
    if (asset) {
      asset.status = status;
      if (notes != null) asset.notes = notes;
      renderGrid();
    }
    try {
      var r = await fetch("/api/assets/" + encodeURIComponent(id) + "/status", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: status, notes: notes == null ? undefined : notes })
      });
      var j = await r.json();
      if (!j.ok) throw new Error(j.error || "patch failed");
      if (asset && j.asset) {
        Object.assign(asset, j.asset);
      }
      fetchCategories();
    } catch (err) {
      console.error("status patch failed", err);
      alert("Failed to update status: " + (err && err.message || String(err)));
      fetchAssets();
    }
  }

  /* Modal */
  function openModal(idx){
    if (idx < 0 || idx >= state.assets.length) return;
    var a = state.assets[idx];
    state.modalAssetId = a.id;
    state.notesDirty = false;
    $("#m-img").src = pickThumb(a) || "";
    $("#m-img").alt = a.name || "";
    $("#m-name").textContent = a.name || a.prompt || a.id || "Untitled";
    $("#m-source").textContent = a.source || a.engine || a.asset_type || "—";
    $("#m-category").textContent = a.category || "—";
    $("#m-license").textContent = a.license || "—";
    var srcUrl = a.source_url || "";
    $("#m-srcurl").innerHTML = srcUrl ? '<a href="' + escHtml(srcUrl) + '" target="_blank" rel="noreferrer">' + escHtml(srcUrl) + '</a>' : "—";
    $("#m-prompt").textContent = a.prompt || "—";
    var tags = Array.isArray(a.tags) ? a.tags : (function(){ try { return JSON.parse(a.tags || "[]"); } catch(_){ return []; } })();
    $("#m-tags").textContent = (tags && tags.length) ? tags.join(", ") : "—";
    $("#m-notes").value = a.notes || "";
    $("#overlay").classList.add("show");
  }
  function closeModal(){
    $("#overlay").classList.remove("show");
    state.modalAssetId = null;
  }

  $("#m-close").addEventListener("click", closeModal);
  $("#overlay").addEventListener("click", function(e){
    if (e.target === $("#overlay")) closeModal();
  });
  $("#m-approve").addEventListener("click", function(){ if (state.modalAssetId) updateStatus(state.modalAssetId, "approved", $("#m-notes").value || null); });
  $("#m-reject").addEventListener("click", function(){ if (state.modalAssetId) updateStatus(state.modalAssetId, "rejected", $("#m-notes").value || null); });
  $("#m-usable").addEventListener("click", function(){ if (state.modalAssetId) updateStatus(state.modalAssetId, "usable", $("#m-notes").value || null); });
  $("#m-notes").addEventListener("input", function(){ state.notesDirty = true; });
  $("#m-notes").addEventListener("blur", function(){
    if (!state.modalAssetId || !state.notesDirty) return;
    var asset = state.assets.find(function(a){ return a.id === state.modalAssetId; });
    var status = asset ? (asset.status || "raw") : "raw";
    updateStatus(state.modalAssetId, status, $("#m-notes").value || "");
    state.notesDirty = false;
  });

  /* Search + filters */
  var doSearch = debounce(function(){ fetchAssets(); }, 200);
  $("#search").addEventListener("input", function(e){ state.q = e.target.value.trim(); doSearch(); });
  $("#sort").addEventListener("change", function(e){ state.sort = e.target.value; fetchAssets(); });
  $$("#status-pills .pill").forEach(function(p){
    p.addEventListener("click", function(){
      $$("#status-pills .pill").forEach(function(x){ x.classList.remove("active"); });
      p.classList.add("active");
      state.status = p.getAttribute("data-status") || "";
      fetchAssets();
    });
  });

  /* logout handled by outer bootScript */

  /* Keyboard nav */
  document.addEventListener("keydown", function(e){
    if ($("#overlay").classList.contains("show")) {
      if (e.key === "Escape") { closeModal(); }
      return;
    }
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    if (document.activeElement && document.activeElement.tagName === "TEXTAREA") return;
    var cards = $$("#grid .card");
    if (!cards.length) return;
    var idx = state.focusIndex;
    if (e.key === "j") {
      idx = Math.min(cards.length - 1, (idx < 0 ? 0 : idx + 1));
      cards[idx].focus();
      e.preventDefault();
    } else if (e.key === "k") {
      idx = Math.max(0, (idx < 0 ? 0 : idx - 1));
      cards[idx].focus();
      e.preventDefault();
    } else if (e.key === "a") {
      if (idx >= 0) updateStatus(state.assets[idx].id, "approved", null);
      e.preventDefault();
    } else if (e.key === "r") {
      if (idx >= 0) updateStatus(state.assets[idx].id, "rejected", null);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (idx >= 0) openModal(idx);
      e.preventDefault();
    }
  });

  /* Boot */
  fetchCategories();
  fetchAssets();
})();
</script>

<div id="login-overlay" style="position:fixed;inset:0;background:rgba(11,11,15,0.55);display:none;align-items:center;justify-content:center;z-index:100;padding:24px;">
  <form id="login-form" style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:28px;width:100%;max-width:380px;box-shadow:0 30px 60px -20px rgba(0,0,0,0.30);">
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:600;letter-spacing:-0.01em;">Design Warehouse</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#6B7280;">Sign in with your Memelli admin account.</p>
    <div id="login-err" style="display:none;background:#FEF2F2;border:1px solid #FCA5A5;color:#991B1B;font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:14px;"></div>
    <label for="login-email" style="display:block;font-size:12px;font-weight:500;margin:0 0 6px;">Email</label>
    <input id="login-email" type="email" autocomplete="username" required style="width:100%;height:38px;padding:0 12px;border:1px solid #E5E7EB;border-radius:10px;font:inherit;font-size:13px;outline:none;margin-bottom:12px;" />
    <label for="login-password" style="display:block;font-size:12px;font-weight:500;margin:0 0 6px;">Password</label>
    <input id="login-password" type="password" autocomplete="current-password" required style="width:100%;height:38px;padding:0 12px;border:1px solid #E5E7EB;border-radius:10px;font:inherit;font-size:13px;outline:none;" />
    <button id="login-submit" type="submit" style="width:100%;height:38px;margin-top:14px;background:#C41E3A;color:#FFFFFF;border:none;border-radius:10px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;">Sign in</button>
  </form>
</div>

`;

export default function AdminPage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div dangerouslySetInnerHTML={{ __html: ADMIN_HTML }} />
      </body>
    </html>
  );
}
