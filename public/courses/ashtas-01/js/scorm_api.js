/* Minimal SCORM 1.2 wrapper.
   Locates the LMS API object in the window/frame hierarchy, initialises a
   session, and exposes small helpers used by course.js to report progress,
   score and completion back to Moodle. Falls back to a harmless no-op mode
   when previewed outside an LMS (e.g. opening the file directly in a
   browser) so authors can test pages without errors. */
(function (window) {
  "use strict";

  var API = null;
  var findAttempts = 0;
  var MAX_FIND_ATTEMPTS = 500;

  function findAPI(win) {
    while (win.API == null && win.parent != null && win.parent !== win && findAttempts < MAX_FIND_ATTEMPTS) {
      findAttempts++;
      win = win.parent;
    }
    return win.API || null;
  }

  function locateAPI() {
    var theAPI = null;
    if (window.API != null) {
      theAPI = window.API;
    } else if (window.parent != null && window.parent !== window) {
      theAPI = findAPI(window.parent);
    }
    if (theAPI == null && window.opener != null) {
      theAPI = findAPI(window.opener);
    }
    return theAPI;
  }

  var Scorm = {
    isAvailable: false,
    initialised: false,

    init: function () {
      API = locateAPI();
      if (API == null) {
        Scorm.isAvailable = false;
        console.warn("SCORM API not found — running in standalone preview mode (progress will not be saved to an LMS).");
        return false;
      }
      var result = API.LMSInitialize("");
      Scorm.isAvailable = true;
      Scorm.initialised = (result === "true" || result === true);
      // Default to incomplete until the learner finishes the course.
      var status = Scorm.get("cmi.core.lesson_status");
      if (!status || status === "not attempted") {
        Scorm.set("cmi.core.lesson_status", "incomplete");
        Scorm.commit();
      }
      return Scorm.initialised;
    },

    get: function (key) {
      if (!Scorm.isAvailable) return "";
      var v = API.LMSGetValue(key);
      return v == null ? "" : v;
    },

    set: function (key, value) {
      if (!Scorm.isAvailable) return false;
      var res = API.LMSSetValue(key, String(value));
      return res === "true" || res === true;
    },

    commit: function () {
      if (!Scorm.isAvailable) return false;
      var res = API.LMSCommit("");
      return res === "true" || res === true;
    },

    setLocation: function (bookmark) {
      Scorm.set("cmi.core.lesson_location", bookmark);
      Scorm.commit();
    },

    getLocation: function () {
      return Scorm.get("cmi.core.lesson_location");
    },

    setScore: function (raw, min, max) {
      Scorm.set("cmi.core.score.raw", raw);
      Scorm.set("cmi.core.score.min", min);
      Scorm.set("cmi.core.score.max", max);
      Scorm.commit();
    },

    setSuspendData: function (dataStr) {
      Scorm.set("cmi.suspend_data", dataStr);
      Scorm.commit();
    },

    getSuspendData: function () {
      return Scorm.get("cmi.suspend_data");
    },

    complete: function () {
      Scorm.set("cmi.core.lesson_status", "completed");
      Scorm.commit();
    },

    finish: function () {
      if (!Scorm.isAvailable) return;
      API.LMSFinish("");
    }
  };

  window.Scorm = Scorm;

  window.addEventListener("beforeunload", function () {
    Scorm.commit();
    Scorm.finish();
  });

  window.addEventListener("DOMContentLoaded", function () {
    Scorm.init();
  });
})(window);
