/* ==========================================================================
   Sela Civil Advisory - "Home" button for every course page
   ==========================================================================
   Adds a Home link back to the site home page (https://selattm.com/) on
   every course page. Each course page includes one line before </body>:

     <script src="/js/home-button.js" defer></script>

   The script places the link inside whatever header that course already
   has, so it matches the course's own look:
     - hand-built / course-header.js .topbar (PTS-01, barrier, side-roads,
       40233)          -> next to the existing "Menu" link
     - ASHTAS header.topbar                   -> right-hand end of the bar
     - NZGTTM / Roles header.course-header    -> right-hand end of the header
     - Engineering Essentials nav.sidebar     -> beside "Restart course"
   If none of those exist it falls back to a small floating button.
   ========================================================================== */
(function () {
  "use strict";

  var HOME_HREF = "/";
  var LABEL = "⌂ Home";
  var MARK = "data-sela-home";

  function makeLink(extraClass, extraStyle) {
    var a = document.createElement("a");
    a.href = HOME_HREF;
    a.textContent = LABEL;
    a.title = "Back to the Sela home page (your progress is saved)";
    a.setAttribute(MARK, "1");
    if (extraClass) a.className = extraClass;
    a.style.cssText = "white-space:nowrap;" + (extraStyle || "");
    return a;
  }

  function place() {
    if (document.querySelector("[" + MARK + "]")) return true;

    // 1. Course topbar (div.topbar) -- reuses the bar's own link styling.
    var topbar = document.querySelector("div.topbar, #course-header .topbar");
    if (topbar) {
      var menu = topbar.querySelector('a[href$="menu.html"]');
      if (menu) {
        menu.parentNode.insertBefore(makeLink(), menu);
      } else {
        var slot = topbar.lastElementChild;
        if (!slot || slot.classList.contains("title")) {
          slot = document.createElement("div");
          topbar.appendChild(slot);
        }
        slot.appendChild(makeLink());
      }
      return true;
    }

    // 2. ASHTAS header.topbar
    var ashtas = document.querySelector("header.topbar");
    if (ashtas) {
      ashtas.appendChild(makeLink("", "color:#fff;text-decoration:none;font-size:13px;font-weight:600;" +
        "padding:6px 12px;border-radius:6px;background:rgba(255,255,255,.15);white-space:nowrap;margin-left:12px;"));
      return true;
    }

    // 3. NZGTTM Essentials / Roles & Responsibilities header (its title
    //    area is hidden on phones, so the link goes on the header itself).
    var ch = document.querySelector("header.course-header");
    if (ch) {
      ch.appendChild(makeLink("", "color:#fff;background:#16326e;text-decoration:none;font-size:13px;" +
        "font-weight:600;padding:7px 12px;border-radius:6px;margin-left:12px;flex-shrink:0;"));
      return true;
    }

    // 4. Engineering Essentials sidebar
    var block = document.querySelector("nav.sidebar .progress-block");
    if (block) {
      var r = block.querySelector(".restart-link");
      var l = makeLink("restart-link", "display:inline-block;text-decoration:none;margin-right:10px;");
      if (r) block.insertBefore(l, r); else block.appendChild(l);
      return true;
    }
    return false;
  }

  function fallback() {
    if (document.querySelector("[" + MARK + "]")) return;
    document.body.appendChild(makeLink("", "position:fixed;top:10px;right:10px;z-index:9999;" +
      "background:#16326e;color:#fff;text-decoration:none;font:600 13px/1 Arial,sans-serif;" +
      "padding:8px 12px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.25);"));
  }

  function run() {
    // Let course-header.js / ashtas-header.js render first (they also run on
    // DOMContentLoaded), then place the link; retry once on full load.
    setTimeout(function () {
      if (place()) return;
      window.addEventListener("load", function () { if (!place()) fallback(); });
      if (document.readyState === "complete" && !place()) fallback();
    }, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // Course pages don't load navigation.js, so record "last active" from here.
  try { import("/js/last-seen.js"); } catch (e) {}
  // Lock the course if the learner's plan says an earlier course comes first.
  try { import("/js/sequence-guard.js"); } catch (e) {}
})();
