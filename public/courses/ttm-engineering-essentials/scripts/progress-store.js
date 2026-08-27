/*
 * Browser-based progress store for the standalone web/HTML build.
 *
 * This replaces the SCORM 1.2 API wrapper used in the LMS/Moodle package.
 * There is no LMS here, so instead of talking to an LMS API, this saves the
 * learner's bookmark and final-test result to localStorage in their own
 * browser — so if they close the tab and come back later (same browser,
 * same device), they resume where they left off.
 *
 * Exposes the exact same "SCORM" object shape/function names that app.js
 * already calls (init, setBookmark, getBookmark, setScore, setCompleted,
 * markComplete, commit, finish, isStandalone) so app.js needs no changes
 * between the SCORM build and this web build.
 *
 * Important limitation to be aware of: this is per-browser, per-device
 * storage with no account system and no server record. Clearing browser
 * data, using a private/incognito window, or switching browsers or devices
 * will reset progress. There is also no tamper-proof record of completion
 * for compliance purposes — if that's needed, use the SCORM package in a
 * real LMS instead, which reports properly trackable completion per user.
 */
var SCORM = (function () {
  var STORAGE_KEY = "sela_ttm_engineering_essentials_progress_v1";
  var storageOk = true;
  var state = { bookmark: "", status: "not attempted", score: null };

  function safeRead() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") state = parsed;
      }
    } catch (e) {
      storageOk = false;
    }
  }

  function safeWrite() {
    if (!storageOk) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      storageOk = false;
    }
  }

  function init() {
    safeRead();
    if (!storageOk) {
      console.warn("Progress storage unavailable (private browsing or storage disabled) — progress won't be saved between visits this session.");
    }
    return true;
  }

  function setValue(name, value) {
    // Mirrors the cmi.core.* naming used by the SCORM build, kept only for
    // familiarity/debugging — the web build reads/writes via the named
    // helpers below rather than this generic setter.
    if (name === "cmi.core.lesson_location") state.bookmark = value;
    if (name === "cmi.core.lesson_status") state.status = value;
    if (name === "cmi.core.score.raw") state.score = Number(value);
    safeWrite();
  }

  function getValue(name) {
    if (name === "cmi.core.lesson_location") return state.bookmark || "";
    if (name === "cmi.core.lesson_status") return state.status || "not attempted";
    if (name === "cmi.core.score.raw") return state.score == null ? "" : String(state.score);
    return "";
  }

  function commit() { safeWrite(); }

  function setBookmark(location) {
    state.bookmark = location;
    safeWrite();
  }

  function getBookmark() {
    return state.bookmark || "";
  }

  function setScore(rawScore) {
    state.score = rawScore;
    safeWrite();
  }

  function setCompleted(passed, score) {
    if (typeof score === "number") state.score = score;
    state.status = passed ? "passed" : "failed";
    safeWrite();
  }

  function markComplete() {
    state.status = "completed";
    safeWrite();
  }

  function finish() {
    safeWrite();
  }

  function reset() {
    state = { bookmark: "", status: "not attempted", score: null };
    safeWrite();
  }

  return {
    init: init,
    setValue: setValue,
    getValue: getValue,
    commit: commit,
    setBookmark: setBookmark,
    getBookmark: getBookmark,
    setScore: setScore,
    setCompleted: setCompleted,
    markComplete: markComplete,
    finish: finish,
    reset: reset,
    isStandalone: function () { return true; },
    getStatus: function () { return state.status; },
    getScoreValue: function () { return state.score; },
    storageAvailable: function () { return storageOk; }
  };
})();
