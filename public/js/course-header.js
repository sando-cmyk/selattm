/* ==========================================================================
   Sela Civil Advisory - Shared Course Header
   ==========================================================================
   Every course page includes this ONE line of markup, and nothing else,
   for its header:

     <div id="course-header" data-title="Slide 2: Course Overview"></div>

   ...plus one script tag near the bottom of the page:

     <script src="../../js/course-header.js"></script>

   (adjust the "../../" to however many folders deep the page actually is
   under /public -- same rule as firebase-init.js imports elsewhere on
   this site.)

   That is the entire header contract. The actual markup -- the coloured
   dots, the wordmark, the title, the Menu link -- lives in ONE place: this
   file. Nobody should ever hand-write topbar HTML inside a course page
   again. Want to change the header design, add a new nav link, change the
   brand text? Change it here, once, and every course picks it up on the
   next deploy.

   Optional attributes on the same #course-header element:
     data-menu-href="menu.html"     -- override the Menu link's target
                                        (defaults to "menu.html" in the same
                                        folder as the current page)
     data-hide-menu-link="true"     -- omit the Menu link entirely (use on
                                        the menu page itself, since a "Menu"
                                        link back to the page you're already
                                        on is pointless)
   ========================================================================== */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render() {
    var mount = document.getElementById("course-header");
    if (!mount) return;

    var title = mount.getAttribute("data-title") || document.title || "";
    var menuHref = mount.getAttribute("data-menu-href") || "menu.html";
    var hideMenuLink = mount.getAttribute("data-hide-menu-link") === "true";
    var menuSlot = hideMenuLink ? "<div></div>" : '<div><a href="' + menuHref + '">Menu</a></div>';

    mount.innerHTML =
      '<div class="topbar">' +
        '<div style="display:flex;align-items:center;">' +
          '<span class="dots"><span class="dot r"></span><span class="dot a"></span><span class="dot g"></span></span>' +
          '<span class="brand">SELA CIVIL ADVISORY</span>' +
        "</div>" +
        '<div class="title">' + escapeHtml(title) + "</div>" +
        menuSlot +
      "</div>";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
