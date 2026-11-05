/* =========================================================
   course-lock.js — TTM-FB-01 sequence lock
   ---------------------------------------------------------
   Learners must work through the course in order:
     slides 1-5 > Module 1 check > slides 6-8 > Module 2 check >
     slides 9-11 > Module 3 check > Final Assessment
   A slide counts as done once its read/listen/watch lock has been
   cleared (course-gate.js). A knowledge check or the final counts
   once it has been passed (80%+).

   - Opening a page that is not yet unlocked (typed URL, bookmark,
     old link) sends the learner to the first step they still need
     to finish.
   - On the menu, later items are shown as locked and can't be
     clicked, and "Resume" points at the next step to do.
   Going back to anything already unlocked is always allowed.
   Load after js/course.js.
   ========================================================= */
(function () {
  "use strict";
  if (typeof Course === "undefined") return;

  // Course order. Slide numbers in each module, then that module's check.
  var MODULES = [[1, 5], [6, 8], [9, 11]];
  var STEPS = [];
  MODULES.forEach(function (m, i) {
    for (var n = m[0]; n <= m[1]; n++) STEPS.push({ page: "slide" + n + ".html", slide: n });
    STEPS.push({ page: "quiz" + (i + 1) + ".html", quiz: "quiz" + (i + 1), label: "the Module " + (i + 1) + " Knowledge Check" });
  });
  STEPS.push({ page: "final.html", quiz: "final", label: "the Final Assessment" });

  function gateCleared() {
    try {
      var m = location.pathname.match(/\/courses\/([^\/]+)\//);
      var id = (document.body && document.body.getAttribute("data-course-id")) || (m ? m[1] : "course");
      var g = JSON.parse(window.localStorage.getItem("sela_course_gate::" + id + "::v1") || "{}");
      return Array.isArray(g.cleared) ? g.cleared.map(Number) : [];
    } catch (e) { return []; }
  }
  var cleared = gateCleared();

  function done(step) {
    if (step.slide) return cleared.indexOf(step.slide) !== -1;
    var r = Course.getQuizResult(step.quiz);
    return !!(r && r.passed);
  }
  // Index of the first step not yet finished (STEPS.length = all done).
  var next = STEPS.length;
  for (var i = 0; i < STEPS.length; i++) { if (!done(STEPS[i])) { next = i; break; } }
  function indexOf(page) {
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].page === page) return i;
    return -1;
  }
  function unlocked(page) { var i = indexOf(page); return i === -1 || i <= next; }

  window.CourseLock = { steps: STEPS, nextIndex: next, unlocked: unlocked };

  var here = (location.pathname.split("/").pop() || "").toLowerCase();

  // ---- Content pages: bounce forward-jumps back to the next step ----
  if (indexOf(here) !== -1) {
    if (!unlocked(here)) {
      var target = STEPS[next].page;
      try { sessionStorage.setItem("sela_lock_notice", here); } catch (e) {}
      document.documentElement.style.visibility = "hidden";
      location.replace(target);
    } else {
      var from = null;
      try { from = sessionStorage.getItem("sela_lock_notice"); sessionStorage.removeItem("sela_lock_notice"); } catch (e) {}
      if (from) {
        var bar = document.createElement("div");
        bar.setAttribute("role", "status");
        bar.style.cssText = "background:#FFF4D6;border:1px solid #E8B400;color:#5a4500;padding:10px 14px;border-radius:8px;margin:0 0 14px;font-size:14px;";
        bar.textContent = "That part of the course is still locked. Finish this step first — the course unlocks in order.";
        var wrap = document.querySelector(".wrap, main, .container") || document.body;
        wrap.insertBefore(bar, wrap.firstChild);
      }
    }
    return;
  }

  // ---- Menu (menu.html / index.html): show locked items ----
  // Runs after the menu's own status script, so it has the last word.
  function menu() {
  if (!document.querySelector(".item-list")) return;
  var style = document.createElement("style");
  style.textContent =
    ".item-list a.sela-locked{color:#999;pointer-events:none;cursor:not-allowed;text-decoration:none;}" +
    ".item-list li.sela-locked-row{opacity:.7;}" +
    ".status-tag.locked{background:#eee;color:#888;}";
  document.head.appendChild(style);

  var links = document.querySelectorAll(".item-list a[href]");
  Array.prototype.forEach.call(links, function (a) {
    var page = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (unlocked(page)) return;
    a.classList.add("sela-locked");
    a.setAttribute("aria-disabled", "true");
    a.setAttribute("tabindex", "-1");
    a.title = "Locked — finish the earlier slides and checks first";
    a.addEventListener("click", function (e) { e.preventDefault(); });
    var li = a.closest("li");
    if (li) {
      li.classList.add("sela-locked-row");
      var tag = li.querySelector(".status-tag");
      if (tag) { tag.textContent = "🔒 Locked"; tag.className = "status-tag locked"; }
    }
  });

  // Resume goes to the next step to do, not just the furthest slide opened.
  var banner = document.getElementById("resumeBanner");
  var btn = document.getElementById("resumeBtn");
  var text = document.getElementById("resumeText");
  if (banner && btn && text && next > 0 && next < STEPS.length) {
    var s = STEPS[next];
    banner.style.display = "flex";
    btn.href = s.page;
    text.textContent = s.slide
      ? "Your next step is Slide " + s.slide + ". Pick up where you left off?"
      : "Your next step is " + s.label + ". Pick up where you left off?";
  } else if (banner && btn && text && next >= STEPS.length) {
    banner.style.display = "flex";
    btn.href = "complete.html";
    text.textContent = "You've finished every slide and check. Go to course completion?";
  }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", menu);
  else menu();
})();
