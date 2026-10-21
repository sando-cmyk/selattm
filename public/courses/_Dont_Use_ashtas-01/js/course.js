/* Course navigation + progress tracking (v3 — slide-by-slide deck, spoken
   notes). Each page calls CourseNav.start(pageId) after including this
   script. State (visited pages + chosen narration voice) persists via the
   SCORM wrapper's cmi.suspend_data as a small JSON blob — no browser
   storage is used, so everything round-trips through the LMS and degrades
   gracefully to "not tracked" when previewed outside one. speech.js reads
   and writes the voice choice through window.CourseState so it's
   remembered as the learner moves between slides. */
(function () {
  "use strict";

  var PAGE_ORDER = ["menu", "slide1", "slide2", "slide3", "slide4", "slide5", "slide6", "quiz1", "slide7", "slide8", "slide9", "slide10", "slide11", "slide12", "slide13", "slide14", "slide15", "slide16", "slide17", "slide18", "slide19", "slide20", "quiz2", "slide21", "slide22", "slide23", "slide24", "slide25", "slide26", "quiz3", "slide27", "slide28", "slide29", "slide30", "slide31", "slide32", "slide33", "slide34", "slide35", "slide36", "slide37", "slide38", "slide39", "slide40", "slide41", "slide42", "slide43", "slide44", "slide45", "slide46", "slide47", "slide48", "slide49", "slide50", "slide51", "slide52", "quiz4", "slide53", "slide54", "slide55", "slide56", "complete"];

  function loadState() {
    var raw = window.Scorm && Scorm.isAvailable ? Scorm.getSuspendData() : "";
    if (!raw) return { visited: [], voice: "" };
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { visited: Array.isArray(parsed.visited) ? parsed.visited : [], voice: parsed.voice || "" };
      }
    } catch (e) {
      // Legacy v2 format: plain comma-separated list of visited page ids.
      return { visited: raw.split(",").filter(Boolean), voice: "" };
    }
    return { visited: [], voice: "" };
  }

  function saveState(state) {
    if (window.Scorm && Scorm.isAvailable) {
      Scorm.setSuspendData(JSON.stringify(state));
    }
  }

  function markVisited(pageId) {
    var state = loadState();
    if (state.visited.indexOf(pageId) === -1) {
      state.visited.push(pageId);
      saveState(state);
    }
    return state.visited;
  }

  function renderProgress(visited) {
    var bar = document.getElementById("progressFill");
    var label = document.getElementById("progressLabel");
    var total = PAGE_ORDER.length;
    var count = visited.length;
    var pct = Math.round((count / total) * 100);
    if (bar) bar.style.width = pct + "%";
    if (label) label.textContent = count + " / " + total + " screens viewed";
  }

  function markMenuBadges(visited) {
    document.querySelectorAll("[data-page-ref]").forEach(function (el) {
      var ref = el.getAttribute("data-page-ref");
      if (visited.indexOf(ref) !== -1 && !el.querySelector(".done-badge")) {
        var badge = document.createElement("span");
        badge.className = "done-badge";
        badge.textContent = "Viewed";
        el.querySelector("h3") && el.querySelector("h3").appendChild(badge);
      }
    });
  }

  function initResumeBanner() {
    var banner = document.getElementById("resumeBanner");
    if (!banner) return;
    var loc = window.Scorm && Scorm.isAvailable ? Scorm.getLocation() : "";
    if (loc && loc !== "menu" && PAGE_ORDER.indexOf(loc) !== -1) {
      var link = document.getElementById("resumeLink");
      if (link) link.href = loc + ".html";
      banner.classList.add("visible");
    }
  }

  function initSelfChecks() {
    document.querySelectorAll(".check-question").forEach(function (block) {
      var button = block.querySelector("button");
      var feedbackEl = block.querySelector(".feedback");
      if (!button) return;
      button.addEventListener("click", function () {
        var selected = block.querySelector("input[type=radio]:checked");
        if (!selected) {
          feedbackEl.textContent = "Please select an answer first.";
          feedbackEl.className = "feedback incorrect";
          feedbackEl.style.display = "block";
          return;
        }
        var isCorrect = selected.getAttribute("data-correct") === "true";
        feedbackEl.textContent = isCorrect
          ? "Correct. " + (selected.getAttribute("data-explain") || "")
          : "Not quite. " + (selected.getAttribute("data-explain-wrong") || "Review the slide above and try again.");
        feedbackEl.className = "feedback " + (isCorrect ? "correct" : "incorrect");
        feedbackEl.style.display = "block";
      });
    });
  }

  // Shared with js/speech.js so the learner's chosen narration voice
  // survives navigating from one slide (one full page load) to the next.
  window.CourseState = {
    getVoice: function () {
      return loadState().voice || "";
    },
    setVoice: function (name) {
      var state = loadState();
      state.voice = name || "";
      saveState(state);
    }
  };

  window.CourseNav = {
    start: function (pageId) {
      document.addEventListener("DOMContentLoaded", function () {
        // Give scorm_api.js a moment to finish LMSInitialize.
        setTimeout(function () {
          var visited = markVisited(pageId);
          if (window.Scorm && Scorm.isAvailable) {
            Scorm.setLocation(pageId);
          }
          renderProgress(visited);
          markMenuBadges(visited);
          initSelfChecks();
          initResumeBanner();

          if (pageId === "complete") {
            var completeBtn = document.getElementById("completeCourseBtn");
            if (completeBtn) {
              completeBtn.addEventListener("click", function () {
                if (window.Scorm && Scorm.isAvailable) {
                  Scorm.complete();
                  Scorm.commit();
                }
                completeBtn.textContent = "Course marked complete ✓";
                completeBtn.disabled = true;
              });
            }
          }

          // speech.js runs after this file and reads window.CourseState
          // directly, so no event/callback wiring is needed here.
        }, 150);
      });
    }
  };
})();
