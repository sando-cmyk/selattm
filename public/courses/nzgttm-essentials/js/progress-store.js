/*!
 * Browser-local progress store
 * Sela Civil Advisory Ltd - NZGTTM Essentials course
 *
 * Standalone-web replacement for the SCORM 1.2 API wrapper. Exposes the
 * exact same interface the course engine (app.js) already calls -
 * init/get/set/commit/finish/setScore/setStatus/setSuspendData/
 * getSuspendData/setSessionTime - but backs it with the browser's
 * localStorage instead of an LMS, so a learner's progress and last quiz
 * result are remembered on their own device between visits. There is no
 * server and nothing leaves the browser.
 */
var SCORM = (function () {
  "use strict";

  // Bump the trailing version if the course content changes in a way that
  // should invalidate old saved progress (e.g. a different quiz).
  var STORAGE_KEY = "sela_course_progress::nzgttm-essentials::v1";

  var data = {};
  var loaded = false;

  function load() {
    if (loaded) return;
    loaded = true;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw) || {};
    } catch (e) {
      data = {};
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable (private browsing, quota, disabled site data,
      // etc.) - fail silently. The course still works, it just won't
      // remember progress on the next visit.
      console.warn("Progress store: could not save to localStorage.", e);
    }
  }

  function init() {
    load();
    var status = get("cmi.core.lesson_status");
    if (!status || status === "not attempted") {
      set("cmi.core.lesson_status", "incomplete");
    }
    commit();
    return true;
  }

  function get(param) {
    load();
    var value = data[param];
    return (value !== undefined && value !== null) ? String(value) : "";
  }

  function set(param, value) {
    load();
    data[param] = value;
    persist();
    return true;
  }

  function commit() {
    persist();
    return true;
  }

  function setScore(rawScore, maxScore, minScore) {
    set("cmi.core.score.raw", rawScore);
    set("cmi.core.score.max", (maxScore != null ? maxScore : 100));
    set("cmi.core.score.min", (minScore != null ? minScore : 0));
  }

  function setStatus(status) {
    // passed, completed, failed, incomplete, browsed, not attempted
    set("cmi.core.lesson_status", status);
  }

  function setSuspendData(dataObj) {
    try {
      set("cmi.suspend_data", JSON.stringify(dataObj));
    } catch (e) {
      console.warn("Progress store: could not serialise suspend_data", e);
    }
  }

  function getSuspendData() {
    var raw = get("cmi.suspend_data");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function secondsToSCORMTime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    var hh = Math.floor(totalSeconds / 3600);
    var mm = Math.floor((totalSeconds % 3600) / 60);
    var ss = totalSeconds % 60;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return pad(hh) + ":" + pad(mm) + ":" + pad(ss);
  }

  function setSessionTime(totalSeconds) {
    set("cmi.core.session_time", secondsToSCORMTime(totalSeconds));
  }

  function finish() {
    commit();
    return true;
  }

  // Web-only extra: wipe saved progress and start the course over. There is
  // no LMS "retake" flow here, so the UI offers this directly to the learner.
  function resetProgress() {
    data = {};
    loaded = true;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Progress store: could not clear localStorage.", e);
    }
  }

  return {
    init: init,
    get: get,
    set: set,
    commit: commit,
    finish: finish,
    setScore: setScore,
    setStatus: setStatus,
    setSuspendData: setSuspendData,
    getSuspendData: getSuspendData,
    setSessionTime: setSessionTime,
    isStandalone: function () { return true; },
    resetProgress: resetProgress
  };
})();
