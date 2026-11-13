// ============================================================================
// File: public/js/navigation.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Single-source global header + footer + auth-state.
//
// Every page includes:
//   <link rel="stylesheet" href="css/site-header.css">   (or css/custom.css)
//   <header class="site-header" id="global-header"></header>
//   <footer class="site-footer" id="global-footer"></footer>
//   <script type="module" src="./js/navigation.js"></script>
//
// This file renders into those two elements and keeps the login/status
// display in sync everywhere. Change the header ONCE, here — never re-build
// header markup/CSS on an individual page again.
// ============================================================================

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import "./last-seen.js"; // records "last active" for the admin Learners panel
import "./site-analytics.js"; // Google Analytics visitor counts (see that file)

const auth = getAuth();
const db = getFirestore();

const NAV_LINKS = [
  {
    href: "store.html", label: "Sela Course Library",
    // Sub-menu: opens the library on that category's tab (store.html#...).
    children: [
      { href: "store.html#barrier", label: "Barrier Training" },
      { href: "store.html#ttm", label: "TTM Training" },
      { href: "store.html#other", label: "Other Training" },
    ],
  },
  { href: "about-us.html", label: "About" },
  { href: "contact.html", label: "Contact" }
];

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str == null ? "" : str);
  return div.innerHTML;
}

function isCurrentPage(href) {
  const current = window.location.pathname.split("/").pop() || "index.html";
  return current === href;
}

// Dropdown styles live here (not in a CSS file) because pages use either
// css/site-header.css or css/custom.css -- this keeps it working on both.
function ensureSubMenuStyles() {
  if (document.getElementById("nav-sub-styles")) return;
  const st = document.createElement("style");
  st.id = "nav-sub-styles";
  st.textContent = `
    .main-nav .nav-has-sub { position: relative; }
    .main-nav .nav-sub {
      display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      min-width: 190px; margin: 0; padding: 6px 0; list-style: none; z-index: 1000;
      background: #fff; border-radius: 8px; box-shadow: 0 10px 28px rgba(15, 23, 42, .18);
      border: 1px solid rgba(15, 23, 42, .08);
    }
    .main-nav .nav-sub li { display: block; margin: 0; }
    .main-nav .nav-sub a {
      display: block; padding: 9px 16px; white-space: nowrap; font-size: .92rem;
      color: #1f2937; text-decoration: none; border: none !important;
    }
    .main-nav .nav-sub a:hover { background: #f1f5f9; color: #0f172a; }
    @media (hover: hover) and (min-width: 769px) {
      .main-nav .nav-has-sub:hover > .nav-sub,
      .main-nav .nav-has-sub:focus-within > .nav-sub { display: block; }
    }`;
  document.head.appendChild(st);
}

function renderHeader() {
  const header = document.getElementById("global-header");
  if (!header) return; // page hasn't added the header container -- nothing to do

  const linksHtml = NAV_LINKS.map(link => {
    const a = `<a href="${link.href}"${isCurrentPage(link.href) ? ' class="active"' : ""}>${link.label}</a>`;
    if (!link.children) return `<li>${a}</li>`;
    const sub = link.children.map(c => `<li><a href="${c.href}">${c.label}</a></li>`).join("");
    return `<li class="nav-has-sub">${a}<ul class="nav-sub">${sub}</ul></li>`;
  }).join("");
  ensureSubMenuStyles();

  header.innerHTML = `
    <div class="nav-container">
      <div class="logo-box">
        <a href="index.html"><img src="img/sela-logo-transparent.png" alt="Sela Civil Advisory Ltd" class="site-logo"></a>
      </div>
      <nav class="main-nav">
        <ul>
          ${linksHtml}
          <li id="nav-dynamic-links"></li>
          <li id="nav-auth-slot"><a href="login.html" class="btn-secondary">Sign In</a></li>
        </ul>
      </nav>
    </div>
  `;
}

function renderFooter() {
  const footer = document.getElementById("global-footer");
  if (!footer) return;
  footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} Sela Civil Advisory Ltd. All rights reserved.</p>
    <p style="font-size: 0.8rem; opacity: 0.75; margin-top: 0.25rem;">This site uses Google Analytics to count visits and see which pages are useful. We don&#39;t send your name, email or course results to Google.</p>`;
}

function bindAuthState() {
  onAuthStateChanged(auth, async (user) => {
    const dynamicLinks = document.getElementById("nav-dynamic-links");
    const authSlot = document.getElementById("nav-auth-slot");
    if (!authSlot) return; // header not present on this page

    if (!user || user.isAnonymous) {
      if (dynamicLinks) dynamicLinks.innerHTML = "";
      authSlot.innerHTML = `<a href="login.html" class="btn-secondary">Sign In</a>`;
      return;
    }

    // Secure role check: UID must exist in the 'admins' collection
    let isAdmin = false;
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      isAdmin = adminDoc.exists();
    } catch (err) {
      console.warn("[nav] admin check failed:", err.message);
    }

    if (dynamicLinks) {
      let links = `<a href="learner.html"${isCurrentPage("learner.html") ? ' class="active"' : ""}>Your Courses</a>`;
      if (isAdmin) {
        links += ` <a href="admin.html" style="color: var(--primary-color);"${isCurrentPage("admin.html") ? ' class="active"' : ""}>Admin</a>`;
      }
      dynamicLinks.innerHTML = links;
    }

    const displayName = escapeHtml(user.displayName || user.email || "Learner");
    authSlot.innerHTML = `
      <span class="header-auth-box">
        <span class="auth-badge"><span class="auth-badge-dot active"></span>${displayName}</span>
        <button id="btn-global-signout" class="btn-secondary" type="button">Sign Out</button>
      </span>
    `;

    const signOutBtn = document.getElementById("btn-global-signout");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          window.location.href = "index.html";
        } catch (err) {
          console.error("[nav] sign out error:", err);
        }
      });
    }
  });
}

renderHeader();
renderFooter();
bindAuthState();
