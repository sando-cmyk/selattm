var Course = (function () {
  var TOTAL_SLIDES = 27;
  var GATED_SLIDES = 26; // slides 1-26 are gated; 27 is the assessment page
  var QUIZ_IDS = ["quiz1", "quiz2", "quiz3"];
  var STORAGE_KEY = "40233_course_state_v1";

  function loadState() {
    var raw = null;
    try { raw = SCORM.getSuspendData(); } catch (e) {}
    if (!raw) { try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {} }
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
    return { visited: [], quizzes: {} };
  }
  function saveState(state) {
    var str = JSON.stringify(state);
    try { localStorage.setItem(STORAGE_KEY, str); } catch (e) {}
    try { SCORM.setSuspendData(str); } catch (e) {}
  }
  var state = loadState();

  function markVisited(slideNum) {
    slideNum = Number(slideNum);
    if (state.visited.indexOf(slideNum) === -1) { state.visited.push(slideNum); saveState(state); }
  }
  function recordQuiz(quizId, score, total) {
    state.quizzes[quizId] = { score: score, total: total, passed: (score / total) >= 0.8 };
    saveState(state);
    // Every attempt (pass or fail) is also logged for the admin learner history.
    try { import("/js/attempt-logger.js").then(function (m) { m.logAttempt({ quizId: quizId, score: score, total: total, passed: (score / total) >= 0.8 }); }); } catch (e) {}
  }
  function getQuizResult(quizId) { return state.quizzes[quizId] || null; }
  // A slide only counts once its read/listen/watch lock was cleared too (see
  // public/js/course-gate.js), so typing slide URLs cannot complete the course.
  function gateClearedCount() {
    try {
      var m = location.pathname.match(/\/courses\/([^\/]+)\//);
      var g = JSON.parse(window.localStorage.getItem("sela_course_gate::" + (m ? m[1] : "course") + "::v1") || "{}");
      return Array.isArray(g.cleared) ? g.cleared.length : 0;
    } catch (e) { return 0; }
  }
  function allSlidesVisited() { return state.visited.length >= TOTAL_SLIDES && gateClearedCount() >= GATED_SLIDES; }
  function allQuizzesPassed() {
    return QUIZ_IDS.every(function (id) { return state.quizzes[id] && state.quizzes[id].passed; });
  }
  function overallPercent() {
    var slidePart = Math.min(state.visited.length, TOTAL_SLIDES) / TOTAL_SLIDES;
    var quizPart = QUIZ_IDS.filter(function (id) {
      return state.quizzes[id] && state.quizzes[id].passed;
    }).length / QUIZ_IDS.length;
    return Math.round((slidePart * 0.6 + quizPart * 0.4) * 100);
  }
  function lastVisitedSlide() {
    if (state.visited.length === 0) return null;
    return Math.max.apply(null, state.visited);
  }
  function isComplete() { return allSlidesVisited() && allQuizzesPassed(); }
  function markCourseComplete() {
    var pct = overallPercent();
    SCORM.setStatus(isComplete() ? "completed" : "incomplete");
    SCORM.setScore(pct);
    saveState(state);
  }
  function resetAll() { state = { visited: [], quizzes: {} }; saveState(state); }

  return {
    TOTAL_SLIDES: TOTAL_SLIDES, QUIZ_IDS: QUIZ_IDS,
    markVisited: markVisited, recordQuiz: recordQuiz, getQuizResult: getQuizResult,
    allSlidesVisited: allSlidesVisited, allQuizzesPassed: allQuizzesPassed,
    overallPercent: overallPercent, lastVisitedSlide: lastVisitedSlide,
    isComplete: isComplete, markCourseComplete: markCourseComplete, resetAll: resetAll,
    getState: function () { return state; }
  };
})();
