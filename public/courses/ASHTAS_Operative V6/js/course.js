/* Course navigation + progress tracking (v4 — slide-by-slide deck, spoken
   notes). Each page calls CourseNav.start(pageId) after including this
   script. State (visited pages + chosen narration voice + bookmark)
   persists via the SCORM wrapper's cmi.suspend_data when the course is
   launched from an LMS. When opened as a plain website (no SCORM API
   found — Scorm.isAvailable is false), the same state is kept in the
   browser's localStorage instead, so progress, the resume banner and the
   "Viewed" menu badges all keep working for direct web/HTML delivery.
   localStorage is scoped per browser/device — it won't follow a learner
   across devices or sync back to an LMS gradebook the way SCORM does.
   speech.js reads and writes the voice choice through window.CourseState
   so it's remembered as the learner moves between slides. */
(function () {
  "use strict";

  var PAGE_ORDER = ["menu", "slide1", "slide2", "slide3", "slide4", "slide5", "slide6", "quiz1", "slide7", "slide8", "slide9", "slide10", "slide11", "slide12", "slide13", "slide14", "slide15", "slide16", "slide17", "slide18", "slide19", "slide20", "quiz2", "slide21", "slide22", "slide23", "slide24", "slide25", "slide26", "quiz3", "slide27", "slide28", "slide29", "slide30", "slide31", "slide32", "slide33", "slide34", "slide35", "slide36", "slide37", "slide38", "slide39", "slide40", "slide41", "slide42", "slide43", "slide44", "slide45", "slide46", "slide47", "slide48", "slide49", "slide50", "slide51", "slide52", "quiz4", "slide53", "slide54", "slide55", "slide56", "complete"];

  var LOCAL_KEY = "ashtas_operative_training_v6_progress";

  // Wrapped in try/catch: localStorage can throw in private-browsing modes
  // or when third-party storage is blocked. Failing silently just means
  // the course behaves like it always did outside an LMS (not tracked).
  var LocalStore = {
    read: function () {
      try {
        return window.localStorage.getItem(LOCAL_KEY) || "";
      } catch (e) {
        return "";
      }
    },
    write: function (raw) {
      try {
        window.localStorage.setItem(LOCAL_KEY, raw);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  function usingScorm() {
    return !!(window.Scorm && Scorm.isAvailable);
  }

  function loadState() {
    var raw = usingScorm() ? Scorm.getSuspendData() : LocalStore.read();
    if (!raw) return { visited: [], voice: "", location: "" };
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          visited: Array.isArray(parsed.visited) ? parsed.visited : [],
          voice: parsed.voice || "",
          location: parsed.location || ""
        };
      }
    } catch (e) {
      // Legacy v2 format: plain comma-separated list of visited page ids.
      return { visited: raw.split(",").filter(Boolean), voice: "", location: "" };
    }
    return { visited: [], voice: "", location: "" };
  }

  function saveState(state) {
    if (usingScorm()) {
      Scorm.setSuspendData(JSON.stringify(state));
    } else {
      LocalStore.write(JSON.stringify(state));
    }
  }

  function setLocation(pageId) {
    if (usingScorm()) {
      Scorm.setLocation(pageId);
    } else {
      var state = loadState();
      state.location = pageId;
      saveState(state);
    }
  }

  function getLocation() {
    return usingScorm() ? Scorm.getLocation() : loadState().location;
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

  function initResumeBanner(priorLocation) {
    var banner = document.getElementById("resumeBanner");
    if (!banner) return;
    var loc = priorLocation;
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
          // Read the bookmark left by the *previous* page before this
          // page overwrites it below, so the resume banner (shown on the
          // menu) can point at wherever the learner last left off.
          var priorLocation = getLocation();
          var visited = markVisited(pageId);
          setLocation(pageId);
          renderProgress(visited);
          markMenuBadges(visited);
          initSelfChecks();
          initResumeBanner(priorLocation);

          if (pageId === "complete") {
            var completeBtn = document.getElementById("completeCourseBtn");
            if (completeBtn) {
              // Reflect an already-completed state if the learner reloads
              // this page (SCORM tracks this via lesson_status; the
              // standalone web fallback keeps its own flag alongside the
              // rest of the progress state in localStorage).
              var priorState = loadState();
              if (usingScorm()) {
                if (Scorm.get("cmi.core.lesson_status") === "completed") {
                  completeBtn.textContent = "Course marked complete ✓";
                  completeBtn.disabled = true;
                }
              } else if (priorState.completed) {
                completeBtn.textContent = "Course marked complete ✓";
                completeBtn.disabled = true;
              }

              completeBtn.addEventListener("click", function () {
                if (usingScorm()) {
                  Scorm.complete();
                  Scorm.commit();
                } else {
                  var state = loadState();
                  state.completed = true;
                  saveState(state);
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
