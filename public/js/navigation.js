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

const auth = getAuth();
const db = getFirestore();

const NAV_LINKS = [
  { href: "store.html", label: "Courses" },
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

function renderHeader() {
  const header = document.getElementById("global-header");
  if (!header) return; // page hasn't added the header container -- nothing to do

  const linksHtml = NAV_LINKS.map(
    link => `<li><a href="${link.href}"${isCurrentPage(link.href) ? ' class="active"' : ""}>${link.label}</a></li>`
  ).join("");

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
  footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} Sela Civil Advisory Ltd. All rights reserved.</p>`;
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
      let links = `<a href="learner.html"${isCurrentPage("learner.html") ? ' class="active"' : ""}>Learner Hub</a>`;
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
