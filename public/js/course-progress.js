/* ==========================================================================
   Sela Civil Advisory - Shared Course Progress Tracker
   ==========================================================================
   Include ONE script tag on every slide and quiz page:

     <script src="../../js/course-progress.js"></script>

   Everything about tracking a learner's progress through a course --
   remembering which slides they've seen, which quizzes they've passed,
   whether the course is complete, saving and resuming across visits --
   lives here, once. A course page should never contain its own hand-rolled
   progress-tracking code.

   How a page tells this script what it is, with (in most cases) zero
   other JavaScript:

   On <body>, once per course (same on every page of that course):
     data-course-id="pts-01"
     data-course-total-slides="30"
     data-course-quiz-ids="quiz1,quiz2,quiz3,quiz4"

   On <body>, for a SLIDE page only -- this is all a slide page needs:
     data-slide="2"
   Visiting the page is enough; there is nothing else to write.

   On <body>, for a QUIZ page only:
     data-quiz="quiz2"
   A quiz's own "which answers are correct" logic necessarily differs
   per quiz, so that part still lives on the quiz page -- see
   /course-kit/quiz-template.html for the standard pattern. Once that
   code knows the learner's score, it calls:
     CourseProgress.recordQuiz(score, total)
   and this script handles everything else (saving, pass/fail at 80%).

   On the completion page, use these to decide what to show and what to
   record:
     CourseProgress.isComplete()       -> true once every slide is visited
                                           and every quiz is passed
     CourseProgress.overallPercent()   -> 0-100, for a certificate/score
     CourseProgress.allSlidesVisited() / .allQuizzesPassed()
                                        -> for a specific "you still need
                                           to..." message
   ========================================================================== */
(function () {
  "use strict";

  var body = document.body;
  var courseId = body.getAttribute("data-course-id") || "unknown-course";
  var STORAGE_KEY = "sela_course_state::" + courseId + "::v1";
  var totalSlides = Number(body.getAttribute("data-course-total-slides") || 0);
  var quizIds = (body.getAttribute("data-course-quiz-ids") || "")
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { visited: [], quizzes: {} };
  }
  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = loadState();

  // Auto-record this page's slide visit. Zero per-page code beyond the
  // data-slide attribute makes this happen.
  var slideAttr = body.getAttribute("data-slide");
  if (slideAttr) {
    var slideNum = Number(slideAttr);
    if (slideNum && state.visited.indexOf(slideNum) === -1) {
      state.visited.push(slideNum);
      saveState();
    }
  }

  function allSlidesVisited() {
    return totalSlides > 0 && state.visited.length >= totalSlides;
  }
  function allQuizzesPassed() {
    return quizIds.length > 0 && quizIds.every(function (id) {
      return state.quizzes[id] && state.quizzes[id].passed;
    });
  }
  function isComplete() {
    return allSlidesVisited() && allQuizzesPassed();
  }
  function overallPercent() {
    var slidePart = totalSlides ? Math.min(state.visited.length, totalSlides) / totalSlides : 1;
    var quizPart = quizIds.length
      ? quizIds.filter(function (id) { return state.quizzes[id] && state.quizzes[id].passed; }).length / quizIds.length
      : 1;
    return Math.round((slidePart * 0.6 + quizPart * 0.4) * 100);
  }

  // Called by a quiz page once the learner submits. total is the number
  // of questions; score is how many they got right.
  function recordQuiz(score, total) {
    var quizId = body.getAttribute("data-quiz");
    if (!quizId || !total) return;
    state.quizzes[quizId] = { score: score, total: total, passed: (score / total) >= 0.8 };
    saveState();
    return state.quizzes[quizId];
  }

  function lastVisitedSlide() {
    if (state.visited.length === 0) return null;
    return Math.max.apply(null, state.visited);
  }

  window.CourseProgress = {
    markVisited: function (n) {
      n = Number(n);
      if (n && state.visited.indexOf(n) === -1) { state.visited.push(n); saveState(); }
    },
    recordQuiz: recordQuiz,
    getQuizResult: function (quizId) { return state.quizzes[quizId] || null; },
    allSlidesVisited: allSlidesVisited,
    allQuizzesPassed: allQuizzesPassed,
    isComplete: isComplete,
    overallPercent: overallPercent,
    lastVisitedSlide: lastVisitedSlide,
    resetAll: function () { state = { visited: [], quizzes: {} }; saveState(); },
    getState: function () { return state; }
  };
})();
