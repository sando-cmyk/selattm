/*!
 * Course engine: navigation, quiz logic, browser-local progress tracking
 * Sela Civil Advisory Ltd - NZGTTM Essentials course (standalone web version)
 */
import { auth, db, addDoc, collection } from "../../js/firebase-init.js";

(function () {
  "use strict";

  // Tracks the currently-active dwell-countdown interval (renderContentScreen)
  // so it can be cleared whenever we navigate to a different screen - without
  // this, an interval left running from a bypassed/short-circuited dwell gate
  // keeps overwriting the wait-hint text on whatever screen is shown next.
  var dwellTimerId = null;

  // Screen ids that currently have a narration audio file at assets/audio/<id>.mp3.
  // Update this list as more narration files are supplied.
  var NARRATION_AVAILABLE = [
    "welcome",
    "objectives",
    "why-ttm",
    "transition",
    "what-is-risk",
    "planning-workflow",
    "hierarchy",
    "safe-system",
    "framework",
    "quiz-intro",
    "summary",
    "quiz-q1",
    "quiz-q2",
    "quiz-q3",
    "quiz-q4",
    "quiz-q5",
    "quiz-q6",
    "quiz-q7",
    "quiz-q8"
  ];

  var state = {
    screenIndex: 0,
    screenEnteredAt: 0,
    quizIndex: 0,
    quizAnswers: [],      // selected option index per question, -1 = unanswered
    quizAnswered: false,  // has current question been submitted
    quizScore: null,      // percentage once completed
    quizPassed: null,
    sessionStartTime: 0,
    lastCommitTime: 0,
    currentNarrationId: null
  };

  var els = {};

  function qs(sel) { return document.querySelector(sel); }

  function totalNavigableScreens() {
    return COURSE.screens.length;
  }

  function init() {
    els.progressFill = qs("#progressFill");
    els.body = qs("#courseBody");
    els.prevBtn = qs("#prevBtn");
    els.nextBtn = qs("#nextBtn");
    els.waitHint = qs("#waitHint");
    els.stepIndicator = qs("#stepIndicator");
    els.headerTitle = qs("#headerCourseTitle");
    els.narrationBar = qs("#narrationBar");
    els.narrationBtn = qs("#narrationBtn");
    els.narrationIcon = qs("#narrationIcon");
    els.narrationLabel = qs("#narrationLabel");
    els.narrationTime = qs("#narrationTime");
    els.narrationPlayer = qs("#narrationPlayer");
    els.restartBtn = qs("#restartBtn");

    els.headerTitle.textContent = COURSE.meta.title;

    els.narrationBtn.addEventListener("click", toggleNarration);
    els.narrationPlayer.addEventListener("play", function () { els.narrationIcon.innerHTML = "&#10074;&#10074;"; });
    els.narrationPlayer.addEventListener("pause", function () { els.narrationIcon.innerHTML = "&#9654;"; });
    els.narrationPlayer.addEventListener("ended", function () { els.narrationIcon.innerHTML = "&#9654;"; els.narrationPlayer.currentTime = 0; });
    els.narrationPlayer.addEventListener("timeupdate", updateNarrationTime);
    els.narrationPlayer.addEventListener("loadedmetadata", updateNarrationTime);

    SCORM.init();
    state.sessionStartTime = Date.now();

    // Attempt resume from suspend_data
    var resumeData = SCORM.getSuspendData();
    if (resumeData && typeof resumeData.screenIndex === "number") {
      state.screenIndex = Math.min(resumeData.screenIndex, COURSE.screens.length - 1);
      if (resumeData.quizAnswers) state.quizAnswers = resumeData.quizAnswers;
      if (typeof resumeData.quizScore === "number") state.quizScore = resumeData.quizScore;
      if (typeof resumeData.quizPassed === "boolean") state.quizPassed = resumeData.quizPassed;
    }

    els.prevBtn.addEventListener("click", goPrev);
    els.nextBtn.addEventListener("click", goNext);

    if (els.restartBtn) {
      els.restartBtn.addEventListener("click", function () {
        var ok = window.confirm("Start this course over from the beginning? This clears your saved progress on this device.");
        if (!ok) return;
        // Stop the autosave listener first - otherwise its beforeunload/
        // interval save fires during reload and immediately re-writes the
        // in-memory (not-yet-reset) state back over the progress we just
        // cleared below.
        window.removeEventListener("beforeunload", persistAndCommit);
        if (SCORM.resetProgress) SCORM.resetProgress();
        window.location.reload();
      });
    }

    window.addEventListener("beforeunload", persistAndCommit);
    setInterval(persistAndCommit, 20000); // periodic autosave

    renderScreen();
  }

  function persistAndCommit() {
    SCORM.setSuspendData({
      screenIndex: state.screenIndex,
      quizAnswers: state.quizAnswers,
      quizScore: state.quizScore,
      quizPassed: state.quizPassed
    });
    var elapsedSec = Math.round((Date.now() - state.sessionStartTime) / 1000);
    SCORM.setSessionTime(elapsedSec);
    SCORM.commit();
  }

  function currentScreen() {
    return COURSE.screens[state.screenIndex];
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateNarrationTime() {
    var cur = els.narrationPlayer.currentTime || 0;
    var dur = els.narrationPlayer.duration || 0;
    els.narrationTime.textContent = formatTime(cur) + " / " + formatTime(dur);
  }

  function toggleNarration() {
    if (els.narrationPlayer.paused) {
      els.narrationPlayer.play().catch(function () { /* ignore - user can retry */ });
    } else {
      els.narrationPlayer.pause();
    }
  }

  // Loads (or hides) the narration control for the given screen id.
  // Pauses/resets any currently playing narration first so audio never
  // keeps playing after the learner has moved to a different page.
  function setNarrationForScreen(screenId) {
    // If this screen's narration is already loaded (e.g. the quiz question
    // re-renders after the learner picks an answer), leave playback alone
    // instead of restarting the clip from zero.
    if (screenId && screenId === state.currentNarrationId) {
      return;
    }

    els.narrationPlayer.pause();
    els.narrationPlayer.currentTime = 0;
    els.narrationIcon.innerHTML = "&#9654;";
    els.narrationTime.textContent = "0:00 / 0:00";

    var available = screenId && NARRATION_AVAILABLE.indexOf(screenId) !== -1;
    if (available) {
      els.narrationPlayer.src = "assets/audio/" + screenId + ".mp3";
      els.narrationBar.style.display = "flex";
      els.narrationLabel.textContent = "Listen to this page";
      state.currentNarrationId = screenId;

      // Auto-play the narration for this page. Modern browsers only allow
      // audio to start on its own when triggered from a user gesture (a
      // click on Next/Back qualifies; the very first page on initial load
      // does not, so autoplay may be blocked there) - if the browser
      // refuses, fail quietly and let the learner press play themselves.
      var playPromise = els.narrationPlayer.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          els.narrationLabel.textContent = "Tap play to listen to this page";
        });
      }
    } else {
      els.narrationPlayer.removeAttribute("src");
      els.narrationBar.style.display = "none";
      state.currentNarrationId = null;
    }
  }

  function updateProgressBar() {
    var pct = Math.round(((state.screenIndex) / (totalNavigableScreens() - 1)) * 100);
    els.progressFill.style.width = pct + "%";
    els.stepIndicator.textContent = "Step " + (state.screenIndex + 1) + " of " + totalNavigableScreens();
  }

  function renderScreen() {
    var screen = currentScreen();
    updateProgressBar();
    els.body.scrollTop = 0;
    els.body.innerHTML = "";

    if (dwellTimerId) {
      clearInterval(dwellTimerId);
      dwellTimerId = null;
    }

    if (screen.type === "content") {
      renderContentScreen(screen);
    } else if (screen.type === "quiz") {
      renderQuizScreen();
    } else if (screen.type === "summary") {
      renderSummaryScreen();
    }

    var quizActive = (screen.type === "quiz" && state.quizIndex < COURSE.quiz.length);
    els.prevBtn.disabled = (state.screenIndex === 0) || quizActive;
    persistAndCommit();
  }

  function renderContentScreen(screen) {
    var slide = document.createElement("div");
    slide.className = "slide";
    var html = "";
    if (screen.icon) {
      html += "<div class=\"hero-icon-wrap\"><div class=\"hero-icon\">" + screen.icon + "</div></div>";
    }
    html += "<div class=\"eyebrow\">" + screen.eyebrow + "</div>";
    html += "<h1>" + screen.title + "</h1>";
    html += screen.body.join("");
    slide.innerHTML = html;
    els.body.appendChild(slide);

    setNarrationForScreen(screen.id);

    // Gate the Next button for a minimum dwell so key content is actually read.
    state.screenEnteredAt = Date.now();
    var minMs = (screen.minSeconds || 0) * 1000;
    els.nextBtn.textContent = "Next";
    els.nextBtn.disabled = minMs > 0;
    els.waitHint.textContent = "";

    if (minMs > 0) {
      dwellTimerId = setInterval(function () {
        var elapsed = Date.now() - state.screenEnteredAt;
        var remaining = Math.ceil((minMs - elapsed) / 1000);
        if (remaining <= 0) {
          clearInterval(dwellTimerId);
          dwellTimerId = null;
          els.nextBtn.disabled = false;
          els.waitHint.textContent = "";
        } else {
          els.waitHint.textContent = "Please take a moment to read this page (" + remaining + "s)";
        }
      }, 250);
    }
  }

  function renderQuizScreen() {
    els.body.innerHTML = "";
    var slide = document.createElement("div");
    slide.className = "slide";
    els.prevBtn.disabled = (state.quizIndex < COURSE.quiz.length) || (state.screenIndex === 0);

    if (state.quizIndex >= COURSE.quiz.length) {
      setNarrationForScreen(null); // no narration for the results screen
      renderQuizResults(slide);
      els.nextBtn.disabled = (state.quizScore === null) || !state.quizPassed;
      els.nextBtn.textContent = "Finish course";
      els.waitHint.textContent = state.quizPassed ? "" : "You can retake the knowledge check to reach the pass mark.";
      els.body.appendChild(slide);
      return;
    }

    // Load this question's read-aloud narration. setNarrationForScreen()
    // no-ops if it's already loaded, so re-rendering after picking an
    // answer doesn't restart the clip.
    setNarrationForScreen("quiz-q" + (state.quizIndex + 1));

    var q = COURSE.quiz[state.quizIndex];
    var selected = state.quizAnswers[state.quizIndex];
    var answered = (selected !== undefined && selected !== -1) && state.quizAnswered;

    var html = "";
    html += "<div class=\"eyebrow\">Knowledge check</div>";
    html += "<div class=\"quiz-progress\">Question " + (state.quizIndex + 1) + " of " + COURSE.quiz.length + "</div>";
    html += "<div class=\"quiz-question\">" + q.q + "</div>";
    html += "<div class=\"quiz-options\">";
    q.options.forEach(function (opt, i) {
      var cls = "quiz-option";
      if (answered) {
        if (i === q.correct) cls += " correct";
        else if (i === selected) cls += " incorrect";
      } else if (i === selected) {
        cls += " selected";
      }
      html += "<button type=\"button\" class=\"" + cls + "\" data-idx=\"" + i + "\" " + (answered ? "disabled" : "") + ">" + opt + "</button>";
    });
    html += "</div>";

    if (answered) {
      var wasCorrect = (selected === q.correct);
      html += "<div class=\"quiz-feedback " + (wasCorrect ? "correct" : "incorrect") + "\">" +
        (wasCorrect ? "Correct. " : "Not quite. ") +
        "Correct answer: " + q.options[q.correct] + "</div>";
    }

    slide.innerHTML = html;
    els.body.appendChild(slide);

    if (!answered) {
      var buttons = slide.querySelectorAll(".quiz-option");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-idx"), 10);
          state.quizAnswers[state.quizIndex] = idx;
          state.quizAnswered = true;
          renderQuizScreen();
        });
      });
      els.nextBtn.disabled = true;
      els.nextBtn.textContent = "Submit answer to continue";
      els.waitHint.textContent = "Select an answer above";
    } else {
      els.nextBtn.disabled = false;
      els.nextBtn.textContent = (state.quizIndex === COURSE.quiz.length - 1) ? "See results" : "Next question";
      els.waitHint.textContent = "";
    }
  }

  function scoreQuiz() {
    var correctCount = 0;
    COURSE.quiz.forEach(function (q, i) {
      if (state.quizAnswers[i] === q.correct) correctCount++;
    });
    var pct = Math.round((correctCount / COURSE.quiz.length) * 100);
    state.quizScore = pct;
    state.quizPassed = pct >= COURSE.meta.passmark;
    SCORM.setScore(pct, 100, 0);
    SCORM.setStatus(state.quizPassed ? "passed" : "failed");
    return { correctCount: correctCount, pct: pct };
  }

  function renderQuizResults(slide) {
    var result = scoreQuiz();
    var html = "";
    html += "<div class=\"eyebrow\">Knowledge check results</div>";
    html += "<h1>Your results</h1>";
    html += "<div class=\"result-score\">" + result.pct + "<span>%</span></div>";
    html += "<div class=\"result-score\" style=\"font-size:15px;font-weight:500;color:#5b6572;\">" +
      result.correctCount + " of " + COURSE.quiz.length + " correct &middot; pass mark " + COURSE.meta.passmark + "%</div>";

    if (state.quizPassed) {
      html += "<div class=\"result-banner pass\">Pass &mdash; nice work.</div>";
    } else {
      html += "<div class=\"result-banner fail\">Not yet a pass &mdash; have another go.</div>";
      html += "<div style=\"text-align:center;margin-bottom:10px;\"><button type=\"button\" class=\"nav-btn secondary\" id=\"retryQuizBtn\">Retake knowledge check</button></div>";
    }

    slide.innerHTML = html;

    if (!state.quizPassed) {
      // Attach after insertion
      setTimeout(function () {
        var retryBtn = qs("#retryQuizBtn");
        if (retryBtn) {
          retryBtn.addEventListener("click", function () {
            state.quizIndex = 0;
            state.quizAnswers = [];
            state.quizAnswered = false;
            renderQuizScreen();
          });
        }
      }, 0);
    }
  }

  function renderSummaryScreen() {
    var slide = document.createElement("div");
    slide.className = "slide";
    setNarrationForScreen("summary");
    var scoreLine = (state.quizScore !== null) ?
      ("You scored <strong>" + state.quizScore + "%</strong> on the knowledge check.") :
      "";

    var html = "";
    if (COURSE.summaryIcon) {
      html += "<div class=\"hero-icon-wrap\"><div class=\"hero-icon\">" + COURSE.summaryIcon + "</div></div>";
    }
    html += "<div class=\"eyebrow\">Course complete</div>";
    html += "<h1>Nicely done</h1>";
    html += "<p class=\"lead\">" + (COURSE.summaryText || "Nicely done — you've completed the course.") + "</p>";
    html += "<p>" + scoreLine + "</p>";
    html += "<div class=\"vision-banner\">“All workers and road users go home safe every day.”</div>";
    html += "<div class=\"summary-contact\">" +
      "<strong>Sela Civil Advisory Ltd</strong><br/>" +
      "TTM oversight &middot; ASHTAS road barrier training &amp; accreditation &middot; independent site H&amp;S assurance &middot; tech-enabled safety deployments via SOST<br/><br/>" +
      "Craig Sanders, Director &mdash; craig@selacivil.co.nz &middot; 021 468 871<br/>" +
      "Joseph Rosendaal, Operations Manager &mdash; joseph@selacivil.co.nz &middot; 027 267 7264" +
      "</div>";

    slide.innerHTML = html;
    els.body.appendChild(slide);

    els.nextBtn.style.display = "none";
    els.waitHint.textContent = "You may close this tab — your result is saved in this browser.";

    if (state.quizPassed === null || state.quizPassed === true) {
      SCORM.setStatus(state.quizPassed ? "passed" : "completed");
    }
    persistAndCommit();
    SCORM.finish();

    recordResultOnceIfPassed();
  }

  // Sends the pass to Firestore so it shows up in admin.html's "Course
  // Results & Certificates" panel. Only fires once per browser per pass
  // (guarded by a localStorage flag) so re-viewing this screen doesn't
  // create duplicate rows.
  function recordResultOnceIfPassed() {
    if (!state.quizPassed) return;

    var FLAG_KEY = "sela_result_recorded::nzgttm-01::v1";
    try {
      if (window.localStorage.getItem(FLAG_KEY)) return;
    } catch (e) {}

    var user = auth.currentUser;
    if (!user || user.isAnonymous) {
      els.waitHint.textContent = "You may close this tab — your result is saved in this browser, but you weren't signed in, so it hasn't reached head office. Sign in at selattm.com and revisit this page to fix that.";
      return;
    }

    addDoc(collection(db, "submissions"), {
      userId: user.uid,
      email: (user.email || "").toLowerCase(),
      courseId: "nzgttm-01",
      courseCode: "NZGTTM-01",
      courseTitle: "NZGTTM Essentials",
      scorePercent: state.quizScore,
      passed: true,
      completedAt: new Date().toISOString(),
      certificateIssued: false
    }).then(function () {
      try { window.localStorage.setItem(FLAG_KEY, "1"); } catch (e) {}
      els.waitHint.textContent = "Recorded — head office can now see this result. You may close this tab.";
    }).catch(function (err) {
      console.error("Failed to record NZGTTM result:", err);
      els.waitHint.textContent = "Your result is saved in this browser, but sending it to head office failed. Please let head office know.";
    });
  }

  function goNext() {
    var screen = currentScreen();

    if (screen.type === "quiz") {
      if (state.quizIndex < COURSE.quiz.length) {
        if (!state.quizAnswered) return; // guarded by disabled button too
        state.quizIndex++;
        state.quizAnswered = false;
        renderQuizScreen();
        persistAndCommit();
        return;
      } else {
        // moving on from results screen
        if (!state.quizPassed) return;
        state.screenIndex++;
        els.nextBtn.style.display = "";
        renderScreen();
        return;
      }
    }

    if (state.screenIndex < COURSE.screens.length - 1) {
      state.screenIndex++;
      renderScreen();
    }
  }

  function goPrev() {
    var screen = currentScreen();
    if (screen.type === "quiz" && state.quizIndex > 0 && state.quizIndex < COURSE.quiz.length) {
      // Do not allow going back within an in-progress quiz to preserve assessment integrity.
      return;
    }
    if (state.screenIndex > 0) {
      state.screenIndex--;
      els.nextBtn.style.display = "";
      renderScreen();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
