/* ASHTAS Operative Training -- shared header + footer injector.
   Every page mounts <div id="ashtas-header" data-subtitle="..."></div> at
   the top of .app and <div id="ashtas-footer"></div> at the bottom, instead
   of hand-duplicating the topbar/footer markup on every one of the 62
   pages. This keeps ASHTAS-01's own look and its SCORM/Moodle progress
   model exactly as they were -- course.js still owns all progress
   tracking and LMS communication via CourseNav.start(pageId). This script
   only owns the repeated header/footer markup, and its <script> tag must
   stay ahead of course.js's in each page so the #progressFill /
   #progressLabel elements it creates exist before course.js's
   renderProgress() runs. */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderHeader() {
    var mount = document.getElementById("ashtas-header");
    if (!mount) return;
    var subtitle = mount.getAttribute("data-subtitle") || "";
    mount.outerHTML =
      '<header class="topbar">' +
        '<div class="brand">' +
          "<strong>ASHTAS Operative Training</strong>" +
          "<span>" + escapeHtml(subtitle) + "</span>" +
        "</div>" +
        '<div class="progress-wrap">' +
          '<div class="progress-bar"><span id="progressFill"></span></div>' +
          '<span class="progress-label" id="progressLabel">0 / 62 screens viewed</span>' +
        "</div>" +
      "</header>";
  }

  function renderFooter() {
    var mount = document.getElementById("ashtas-footer");
    if (!mount) return;
    mount.outerHTML =
      '<footer class="foot">' +
        "© Lantra — ASHTAS Operative Training material, reproduced under licence for internal Moodle delivery." +
      "</footer>";
  }

  function render() {
    renderHeader();
    renderFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
