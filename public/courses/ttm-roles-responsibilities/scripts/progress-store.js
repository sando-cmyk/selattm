/*
 * Progress store for the standalone web version of this course.
 * This file replaces the SCORM 1.2 API wrapper used in the LMS package.
 * This course is now a plain website, so it persists a learner's bookmark,
 * quiz score, and completion status in the browser's own localStorage
 * instead of talking to an LMS. The public interface (SCORM.init/
 * setBookmark/getBookmark/setScore/setCompleted/commit/finish/isStandalone)
 * is kept identical to the SCORM version so app.js did not need to change.
 *
 * Note: localStorage is per-browser, per-device. It is a good fit for "pick
 * up where I left off" on one device, but it is NOT a substitute for an LMS
 * if Sela needs a central record of who has completed the course and what
 * they scored — that data never leaves the learner's own browser.
 */
var SCORM = (function () {
  var STORAGE_KEY = "sela_ttm_roles_progress_v1";
  var state = { location: "", score: null, status: "incomplete" };
  var storageAvailable = true;

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state.location = parsed.location || "";
          state.score = (typeof parsed.score === "number") ? parsed.score : null;
          state.status = parsed.status || "incomplete";
        }
      }
    } catch (e) {
      storageAvailable = false;
      console.warn("Progress storage unavailable (private browsing or blocked storage) — progress will not be saved between visits.", e);
    }
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      storageAvailable = false;
      console.warn("Could not save progress.", e);
    }
  }

  function init() {
    loadState();
    return true;
  }

  function setBookmark(location) {
    state.location = location;
    saveState();
  }

  function getBookmark() {
    return state.location || "";
  }

  function setScore(rawScore) {
    state.score = rawScore;
    saveState();
  }

  function setCompleted(passed, score) {
    if (typeof score === "number") state.score = score;
    state.status = passed ? "passed" : "failed";
    saveState();
  }

  function commit() {
    saveState();
  }

  function finish() {
    saveState();
  }

  return {
    init: init,
    setBookmark: setBookmark,
    getBookmark: getBookmark,
    setScore: setScore,
    setCompleted: setCompleted,
    commit: commit,
    finish: finish,
    isStandalone: function () { return true; }
  };
})();
