(function () {
  "use strict";

  var visited = {};
  var currentIndex = 0;
  var quizPicks = {};      // quizIndex -> chosen option index (set on question slide)
  var quizRevealed = {};   // quizIndex -> true once its answer slide has been viewed
  var testAnswers = {};    // final-test testIndex -> chosen option index

  var navListEl, slideRootEl, progressFillEl, progressLabelEl, prevBtn, nextBtn, audioBar, audioEl;

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function iconCircle(iconName, colorClass) {
    var d = el("div", { class: "icon-circle " + (colorClass || "blue") });
    var img = el("img", { src: ICON(iconName + "-white"), alt: "" });
    d.appendChild(img);
    return d;
  }

  // ---------------------------------------------------------------- block renderers
  var BLOCK_RENDERERS = {
    richText: function (b) {
      return el("div", { class: "block richtext" }, b.html);
    },
    subhead: function (b) {
      return el("div", { class: "block subhead-block" }, b.text);
    },
    footnote: function (b) {
      return el("div", { class: "block footnote-block" }, b.text);
    },
    iconList: function (b) {
      var wrap = el("div", { class: "block icon-list" + (b.bold ? " bold" : "") });
      b.items.forEach(function (item) {
        var row = el("div", { class: "row" });
        row.appendChild(iconCircle(item[0], "blue"));
        row.appendChild(el("span", {}, item[1]));
        wrap.appendChild(row);
      });
      return wrap;
    },
    numberedIconList: function (b) {
      var wrap = el("div", { class: "block numbered-icon-list" });
      b.items.forEach(function (item, i) {
        var row = el("div", { class: "row" });
        row.appendChild(el("div", { class: "num" }, item[0]));
        row.appendChild(iconCircle(item[1], i % 2 === 0 ? "blue" : "blue-deep"));
        row.appendChild(el("span", {}, item[2]));
        wrap.appendChild(row);
      });
      return wrap;
    },
    sidebarNote: function (b) {
      var wrap = el("div", { class: "block sidebar-note" });
      var head = el("div", { class: "snhead" });
      head.appendChild(iconCircle(b.icon, "green"));
      head.appendChild(el("span", {}, b.heading));
      wrap.appendChild(head);
      wrap.appendChild(el("p", {}, b.text));
      wrap.appendChild(el("div", { class: "note" }, b.note));
      return wrap;
    },
    cardGrid: function (b) {
      var wrap = el("div", { class: "block card-grid cols-" + b.columns });
      b.cards.forEach(function (c) {
        var card = el("div", { class: "card" + (b.small ? " small" : "") });
        card.appendChild(iconCircle(c.icon, "blue-deep"));
        card.appendChild(el("h4", {}, c.heading));
        if (c.body) card.appendChild(el("p", {}, c.body));
        wrap.appendChild(card);
      });
      return wrap;
    },
    quote: function (b) {
      var wrap = el("div", { class: "block quote-block" });
      wrap.appendChild(el("div", { class: "qtext" }, b.text));
      wrap.appendChild(el("div", { class: "qcite" }, b.cite));
      return wrap;
    },
    tripleCol: function (b) {
      var wrap = el("div", { class: "block triple-col" });
      b.cards.forEach(function (c) {
        var card = el("div", { class: "card" });
        card.appendChild(iconCircle(c.icon, "blue"));
        card.appendChild(el("h4", {}, c.heading));
        card.appendChild(el("p", {}, c.body));
        wrap.appendChild(card);
      });
      return wrap;
    },
    checklist: function (b) {
      var wrap = el("div", { class: "block checklist" });
      b.items.forEach(function (t) {
        var row = el("div", { class: "row" });
        row.appendChild(el("div", { class: "tick" }, "&#10003;"));
        row.appendChild(el("span", {}, t));
        wrap.appendChild(row);
      });
      return wrap;
    },
    taperDiagram: function (b) {
      var wrap = el("div", { class: "block taper-wrap" });
      wrap.appendChild(el("h5", {}, "A TAPER, SCHEMATICALLY"));
      var dia = el("div", { class: "taper-diagram" });
      var lane = el("div", { class: "lane" });
      [18, 46, 74, 102].forEach(function (top) {
        lane.appendChild(el("div", { class: "mark", style: "top:" + top + "px" }));
      });
      dia.appendChild(lane);
      var mid = el("div", { class: "taper-mid" });
      [[10, 14], [38, 42], [66, 70], [92, 92]].forEach(function (pos) {
        var img = el("img", { class: "cone", src: ICON("cone-blue"), style: "left:" + pos[0] + "px; top:" + pos[1] + "px;" });
        mid.appendChild(img);
      });
      dia.appendChild(mid);
      dia.appendChild(el("div", { class: "workzone" }, "WORK<br/>ZONE"));
      wrap.appendChild(dia);
      var labels = el("div", { class: "taper-labels" });
      labels.appendChild(el("span", {}, "Open lane"));
      labels.appendChild(el("span", {}, "Taper"));
      wrap.appendChild(labels);
      wrap.appendChild(el("div", { class: "taper-caption" }, b.caption));
      return wrap;
    },
    sidePanel: function (b) {
      var wrap = el("div", { class: "block side-panel" });
      wrap.appendChild(el("h5", {}, b.heading));
      b.items.forEach(function (t) {
        var term = el("div", { class: "term" });
        term.appendChild(el("div", { class: "label " + t[2] }, t[0]));
        term.appendChild(el("p", {}, t[1]));
        wrap.appendChild(term);
      });
      wrap.appendChild(el("div", { class: "footnote" }, b.footnote));
      return wrap;
    },
    hierarchy: function (b) {
      var wrap = el("div", { class: "block hierarchy-wrap" });
      wrap.appendChild(el("h5", {}, b.heading.toUpperCase()));
      b.tiers.forEach(function (t, i) {
        var tier = el("div", { class: "hierarchy-tier t" + i + " " + t.color });
        tier.appendChild(el("div", { class: "label" }, t.label));
        tier.appendChild(el("div", { class: "sub" }, t.sub));
        wrap.appendChild(tier);
      });
      wrap.appendChild(el("div", { class: "footnote" }, b.footnote));
      return wrap;
    },
    specialistCols: function (b) {
      var wrap = el("div", { class: "block specialist-cols" });
      b.cards.forEach(function (c) {
        var card = el("div", { class: "card" });
        card.appendChild(iconCircle(c.icon, c.color === "navy" ? "navy" : c.color));
        card.appendChild(el("h4", {}, c.heading));
        card.appendChild(el("p", {}, c.body));
        var tagColor = c.color === "navy" ? "#003264" : (c.color === "green" ? "#1e8228" : "#0a78be");
        card.appendChild(el("div", { class: "tag", style: "border-color:" + tagColor + "; color:" + tagColor + ";" }, c.tag.toUpperCase()));
        wrap.appendChild(card);
      });
      return wrap;
    },
    sourceGrid: function (b) {
      var wrap = el("div", { class: "block source-grid" });
      b.cards.forEach(function (c) {
        var card = el("div", { class: "card" });
        card.appendChild(iconCircle(c.icon, c.color));
        card.appendChild(el("h4", {}, c.heading));
        card.appendChild(el("p", {}, c.body));
        wrap.appendChild(card);
      });
      return wrap;
    },
    summaryCards: function (b) {
      var wrap = el("div", { class: "block summary-cards" });
      b.items.forEach(function (t, i) {
        var card = el("div", { class: "card" });
        card.appendChild(el("div", { class: "num" }, String(i + 1)));
        card.appendChild(el("p", {}, t));
        wrap.appendChild(card);
      });
      return wrap;
    },
    keyCallout: function (b) {
      var wrap = el("div", { class: "block key-callout" });
      wrap.appendChild(iconCircle("check-circle", "green"));
      var txt = el("div", {});
      txt.appendChild(el("h5", {}, b.heading));
      txt.appendChild(el("p", {}, b.text));
      wrap.appendChild(txt);
      return wrap;
    },
  };

  function renderBlocks(container, blocks) {
    (blocks || []).forEach(function (b) {
      var fn = BLOCK_RENDERERS[b.type];
      if (fn) container.appendChild(fn(b));
    });
  }

  // ---------------------------------------------------------------- slide kinds
  function renderTitleSlide(slide) {
    var wrap = el("div", { class: "title-slide" });
    wrap.appendChild(el("div", { class: "eyebrow" }, slide.eyebrow));
    wrap.appendChild(el("h1", {}, slide.title));
    wrap.appendChild(el("div", { class: "subtitle" }, slide.subtitle));
    return wrap;
  }

  function renderClosingSlide(slide) {
    var wrap = el("div", { class: "closing-slide" });
    wrap.appendChild(el("h1", {}, slide.title));
    wrap.appendChild(el("div", { class: "subtitle" }, slide.subtitle));
    if (slide.courseInvite) {
      var card = el("div", { class: "course-invite-card" });
      card.appendChild(iconCircle("book", "green"));
      var txt = el("div", {});
      txt.appendChild(el("h5", {}, slide.courseInvite.heading));
      txt.appendChild(el("p", {}, slide.courseInvite.text));
      card.appendChild(txt);
      wrap.appendChild(card);
    }
    return wrap;
  }

  function renderHeaderedSlide(slide) {
    var wrap = el("div", {});
    if (slide.kicker) wrap.appendChild(el("div", { class: "kicker" }, slide.kicker));
    if (slide.pill) wrap.appendChild(el("div", { class: "pill" }, slide.pill));
    wrap.appendChild(el("h1", { class: "title" }, slide.title));
    if (slide.subtitle) wrap.appendChild(el("div", { class: "subtitle" }, slide.subtitle));
    renderBlocks(wrap, slide.blocks);
    return wrap;
  }

  var LETTERS = ["A", "B", "C", "D"];

  function renderQuestionSlide(slide) {
    var quiz = QUIZ[slide.quizIndex];
    var wrap = el("div", {});
    var head = el("div", { class: "kicker" }, "QUICK CHECK " + (slide.quizIndex + 1) + " / " + QUIZ.length);
    wrap.appendChild(head);
    wrap.appendChild(el("div", { class: "quiz-title" }, quiz.q));

    var grid = el("div", { class: "quiz-options-grid" });
    quiz.options.forEach(function (opt, i) {
      var picked = quizPicks[slide.quizIndex] === i;
      var row = el("div", { class: "quiz-option" + (picked ? " picked" : "") });
      row.appendChild(el("div", { class: "letter" }, LETTERS[i]));
      row.appendChild(el("span", { class: "txt" }, opt));
      row.addEventListener("click", function () {
        quizPicks[slide.quizIndex] = i;
        renderCurrent();
      });
      grid.appendChild(row);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el("div", { class: "quiz-hint" },
      quizPicks[slide.quizIndex] !== undefined
        ? "Answer selected — move to the next slide to see if you were right and why."
        : "Pick an answer, or just discuss out loud — reveal is on the next slide."));
    return wrap;
  }

  function renderAnswerSlide(slide) {
    var quiz = QUIZ[slide.quizIndex];
    quizRevealed[slide.quizIndex] = true;
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "kicker" }, "ANSWER · QUICK CHECK " + (slide.quizIndex + 1) + " / " + QUIZ.length));
    wrap.appendChild(el("h1", { class: "title", style: "font-size:20px;" }, quiz.q));

    var list = el("div", { class: "quiz-answer-list" });
    var picked = quizPicks[slide.quizIndex];
    quiz.options.forEach(function (opt, i) {
      var isCorrect = i === quiz.correct;
      var row = el("div", { class: "quiz-answer-row" + (isCorrect ? " correct" : "") });
      row.appendChild(el("div", { class: "letter" }, LETTERS[i]));
      var label = opt + (picked === i && !isCorrect ? "  (your answer)" : (picked === i && isCorrect ? "  (your answer — correct!)" : ""));
      row.appendChild(el("span", { class: "txt" }, label));
      list.appendChild(row);
    });
    wrap.appendChild(list);

    var why = el("div", { class: "quiz-why" });
    why.appendChild(el("label", {}, "WHY"));
    why.appendChild(el("p", {}, quiz.explain));
    wrap.appendChild(why);
    return wrap;
  }

  // ---------------------------------------------------------------- final test (10Q, 80% to pass)
  var PASS_PCT = 80;

  function renderFinalTestQuestion(slide) {
    var q = FINAL_TEST[slide.testIndex];
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "kicker" }, "FINAL TEST · QUESTION " + (slide.testIndex + 1) + " OF " + FINAL_TEST.length));
    wrap.appendChild(el("div", { class: "quiz-title" }, q.q));

    var grid = el("div", { class: "quiz-options-grid" });
    q.options.forEach(function (opt, i) {
      var picked = testAnswers[slide.testIndex] === i;
      var row = el("div", { class: "quiz-option" + (picked ? " picked" : "") });
      row.appendChild(el("div", { class: "letter" }, LETTERS[i]));
      row.appendChild(el("span", { class: "txt" }, opt));
      row.addEventListener("click", function () {
        testAnswers[slide.testIndex] = i;
        renderCurrent();
      });
      grid.appendChild(row);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el("div", { class: "quiz-hint" },
      testAnswers[slide.testIndex] !== undefined
        ? "Answer recorded — use Next to continue."
        : "Select an answer to continue."));
    return wrap;
  }

  function computeTestScore() {
    var correct = 0;
    FINAL_TEST.forEach(function (q, i) {
      if (testAnswers[i] === q.correct) correct++;
    });
    var pct = Math.round((correct / FINAL_TEST.length) * 100);
    return { correct: correct, total: FINAL_TEST.length, pct: pct, pass: pct >= PASS_PCT };
  }

  function firstTestQuestionIndex() {
    return SLIDES.findIndex(function (s) { return s.kind === "finaltest-question" && s.testIndex === 0; });
  }

  function renderFinalTestResult(slide) {
    var result = computeTestScore();
    SCORM.setCompleted(result.pass, result.pct);

    var wrap = el("div", { class: "test-result" });
    wrap.appendChild(el("div", { class: "kicker" }, "FINAL TEST RESULT"));

    var banner = el("div", { class: "result-banner " + (result.pass ? "pass" : "fail") });
    banner.appendChild(el("div", { class: "score-num" }, result.pct + "%"));
    var bannerText = el("div", { class: "banner-text" });
    bannerText.appendChild(el("h2", {}, result.pass ? "Course complete — well done!" : "Not quite there yet"));
    bannerText.appendChild(el("p", {},
      result.pass
        ? ("You scored " + result.correct + " out of " + result.total + " (" + result.pct + "%) — at or above the " + PASS_PCT + "% pass mark. This course is now recorded as complete.")
        : ("You scored " + result.correct + " out of " + result.total + " (" + result.pct + "%) — you need " + PASS_PCT + "% to pass. Review the explanations below, then retake the test.")
    ));
    banner.appendChild(bannerText);
    wrap.appendChild(banner);

    if (!result.pass) {
      var retake = el("button", { class: "btn retake-btn" }, "Retake the test");
      retake.addEventListener("click", function () {
        testAnswers = {};
        currentIndex = firstTestQuestionIndex();
        renderCurrent();
      });
      wrap.appendChild(retake);
    }

    var review = el("div", { class: "test-review" });
    FINAL_TEST.forEach(function (q, i) {
      var picked = testAnswers[i];
      var isCorrect = picked === q.correct;
      var row = el("div", { class: "review-row" + (isCorrect ? " correct" : " incorrect") });
      row.appendChild(el("div", { class: "review-q" }, (i + 1) + ". " + q.q));
      var yourAns = picked !== undefined ? (LETTERS[picked] + " — " + q.options[picked]) : "Not answered";
      row.appendChild(el("div", { class: "review-your" }, "Your answer: " + yourAns));
      if (!isCorrect) {
        row.appendChild(el("div", { class: "review-correct" }, "Correct answer: " + LETTERS[q.correct] + " — " + q.options[q.correct]));
      }
      if (q.explain) row.appendChild(el("div", { class: "review-explain" }, q.explain));
      review.appendChild(row);
    });
    wrap.appendChild(review);

    return wrap;
  }

  function renderSlideContent(slide) {
    switch (slide.kind) {
      case "title": return renderTitleSlide(slide);
      case "closing": return renderClosingSlide(slide);
      case "question": return renderQuestionSlide(slide);
      case "answer": return renderAnswerSlide(slide);
      case "finaltest-question": return renderFinalTestQuestion(slide);
      case "finaltest-result": return renderFinalTestResult(slide);
      default: return renderHeaderedSlide(slide);
    }
  }

  // ---------------------------------------------------------------- shell / nav
  function buildNav() {
    var frag = document.createDocumentFragment();
    SLIDES.forEach(function (slide, i) {
      var item = el("div", { class: "nav-item" }, slide.nav || slide.title || slide.id);
      item.addEventListener("click", function () { currentIndex = i; renderCurrent(); });
      frag.appendChild(item);
    });
    navListEl.innerHTML = "";
    navListEl.appendChild(frag);
  }

  function updateNavHighlight() {
    Array.prototype.forEach.call(navListEl.querySelectorAll(".nav-item"), function (item, i) {
      item.classList.toggle("active", i === currentIndex);
      item.classList.toggle("visited", !!visited[SLIDES[i].id]);
    });
  }

  function updateProgress() {
    var pct = Math.round((Object.keys(visited).length / SLIDES.length) * 100);
    progressFillEl.style.width = pct + "%";
    progressLabelEl.textContent = pct + "% viewed";
  }

  function updateAudio(slide) {
    var src = "audio/" + slide.audio + ".mp3";
    audioEl.onerror = function () { audioBar.classList.add("hidden"); };
    audioBar.classList.remove("hidden");
    audioBar.classList.toggle("dark", slide.theme === "dark");
    audioEl.pause();
    audioEl.src = src;
    audioEl.load();
    // Autoplay narration as the slide opens. Browsers may block this on the
    // very first slide (no user gesture yet) or if the MP3 is missing —
    // either way the promise rejection is swallowed so it fails silently
    // and the learner can just press play manually.
    var playPromise = audioEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () { /* autoplay blocked or file missing — ignore */ });
    }
  }

  function renderCurrent() {
    var slide = SLIDES[currentIndex];
    visited[slide.id] = true;

    var root = el("div", { class: "slide theme-" + slide.theme });
    root.appendChild(renderSlideContent(slide));
    slideRootEl.innerHTML = "";
    slideRootEl.appendChild(root);

    updateAudio(slide);
    updateNavHighlight();
    updateProgress();

    var isLast = currentIndex === SLIDES.length - 1;
    var lockedNext = slide.kind === "finaltest-question" && testAnswers[slide.testIndex] === undefined;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = isLast || lockedNext;
    nextBtn.textContent = isLast ? "Finished" : "Next →";

    // Completion is driven by the final test result (80% pass mark), not just
    // reaching the last slide — see renderFinalTestResult() / SCORM.setCompleted().
    SCORM.setBookmark(slide.id);
    window.scrollTo(0, 0);
  }

  function init() {
    navListEl = document.getElementById("nav-list");
    slideRootEl = document.getElementById("slide-root");
    progressFillEl = document.getElementById("progress-fill");
    progressLabelEl = document.getElementById("progress-label");
    prevBtn = document.getElementById("btn-prev");
    nextBtn = document.getElementById("btn-next");
    audioBar = document.getElementById("audio-bar");
    audioEl = document.getElementById("narration-audio");

    SCORM.init();
    buildNav();

    var bookmark = SCORM.getBookmark();
    if (bookmark) {
      var idx = SLIDES.findIndex(function (s) { return s.id === bookmark; });
      if (idx >= 0) currentIndex = idx;
    }

    prevBtn.addEventListener("click", function () { if (currentIndex > 0) { currentIndex--; renderCurrent(); } });
    nextBtn.addEventListener("click", function () { if (currentIndex < SLIDES.length - 1) { currentIndex++; renderCurrent(); } });

    var restartBtn = document.getElementById("btn-restart");
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        if (window.confirm("Restart the course? This clears your saved progress and final test result on this device.")) {
          if (typeof SCORM.reset === "function") SCORM.reset();
          visited = {};
          quizPicks = {};
          quizRevealed = {};
          testAnswers = {};
          currentIndex = 0;
          renderCurrent();
        }
      });
    }

    renderCurrent();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
