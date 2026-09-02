import { auth, db, addDoc, collection } from "../../js/firebase-init.js";

(function () {
  "use strict";

  var sections = MODULES.slice();
  sections.push({ id: "quiz", kind: "quiz", nav: "Knowledge Check", title: "Knowledge Check", minutes: 8 });

  var totalModules = MODULES.filter(function (m) { return m.kind === "module"; }).length;

  var visited = {};
  var currentIndex = 0;
  var quizSubmitted = false;
  var quizScore = 0;
  var quizAnswers = {};

  var navListEl, contentEl, progressFillEl, progressLabelEl, prevBtn, nextBtn;
  var audioEl, audioLabelEl, audioBarEl;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  function tagBadge(tag) {
    var isReg = tag === "regulatory";
    return el("span", { class: "badge " + (isReg ? "badge-reg" : "badge-bp") }, [isReg ? "Regulatory" : "Best Practice"]);
  }

  // Sends the pass to Firestore so it shows up in admin.html's "Course
  // Results & Certificates" panel. Fires once per submit -- a genuine
  // retake-and-repass after this is a new result and should be recorded
  // again, so (unlike the other two courses) there's no localStorage
  // duplicate guard here.
  function recordResult(pct) {
    var user = auth.currentUser;
    if (!user || user.isAnonymous) {
      console.warn("TTM Roles & Responsibilities result not sent: not signed in.");
      return;
    }

    addDoc(collection(db, "submissions"), {
      userId: user.uid,
      email: (user.email || "").toLowerCase(),
      courseId: "ttm-roles-01",
      courseCode: "TTM-ROLES-01",
      courseTitle: COURSE_TITLE,
      scorePercent: pct,
      passed: true,
      completedAt: new Date().toISOString(),
      certificateIssued: false
    }).catch(function (err) {
      console.error("Failed to record TTM Roles & Responsibilities result:", err);
    });
  }

  function renderBody(bodyItems) {
    var frag = document.createDocumentFragment();
    (bodyItems || []).forEach(function (item) {
      if (item.type === "p") {
        frag.appendChild(el("p", {}, [item.text]));
      } else if (item.type === "subhead") {
        frag.appendChild(el("h3", { class: "subhead" }, [item.text]));
      } else if (item.type === "list") {
        var listTag = item.ordered ? "ol" : "ul";
        var listEl = el(listTag, {});
        item.items.forEach(function (li) {
          listEl.appendChild(el("li", {}, [li]));
        });
        frag.appendChild(listEl);
      } else if (item.type === "duties") {
        var dutiesWrap = el("div", { class: "duties-list" });
        item.items.forEach(function (d) {
          var row = el("div", { class: "duty-row" });
          var head = el("div", { class: "duty-head" });
          head.appendChild(tagBadge(d.tag));
          if (d.source) head.appendChild(el("span", { class: "duty-source" }, [d.source]));
          row.appendChild(head);
          row.appendChild(el("div", { class: "duty-text" }, [d.text]));
          dutiesWrap.appendChild(row);
        });
        frag.appendChild(dutiesWrap);
      } else if (item.type === "table") {
        var table = el("table", { class: "role-table" });
        var thead = el("thead", {});
        var headRow = el("tr", {});
        item.headers.forEach(function (h) { headRow.appendChild(el("th", {}, [h])); });
        thead.appendChild(headRow);
        table.appendChild(thead);
        var tbody = el("tbody", {});
        item.rows.forEach(function (r) {
          var tr = el("tr", {});
          r.forEach(function (cell) { tr.appendChild(el("td", {}, [cell])); });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        var tableWrap = el("div", { class: "table-scroll" }, [table]);
        frag.appendChild(tableWrap);
      } else if (item.type === "callout") {
        frag.appendChild(el("div", { class: "callout callout-" + item.style }, [item.text]));
      } else if (item.type === "image") {
        var img = el("img", { src: item.src, alt: item.alt || "" });
        var imgWrap = el("div", { class: "body-image" }, [img]);
        frag.appendChild(imgWrap);
      }
    });
    return frag;
  }

  function renderModule(section) {
    var wrap = el("div", { class: "module" });
    var kicker = section.number ? ("Module " + section.number + " of " + totalModules) : "";
    if (kicker) wrap.appendChild(el("div", { class: "kicker" }, [kicker]));
    wrap.appendChild(el("h2", {}, [section.title]));
    if (section.minutes) wrap.appendChild(el("div", { class: "meta" }, ["~" + section.minutes + " min read"]));
    wrap.appendChild(renderBody(section.body));
    if (section.objectives && section.objectives.length) {
      var objBox = el("div", { class: "objectives" });
      objBox.appendChild(el("h4", {}, ["By the end of this section you can:"]));
      var ul = el("ul", {});
      section.objectives.forEach(function (o) { ul.appendChild(el("li", {}, [o])); });
      objBox.appendChild(ul);
      wrap.appendChild(objBox);
    }
    return wrap;
  }

  function renderQuiz() {
    var wrap = el("div", { class: "module quiz" });
    wrap.appendChild(el("div", { class: "kicker" }, ["Final Assessment"]));
    wrap.appendChild(el("h2", {}, ["Knowledge Check"]));
    wrap.appendChild(el("p", {}, ["Answer all " + QUIZ.length + " questions. A score of " + PASS_MARK + "% or higher is required to complete this course."]));

    if (quizSubmitted) {
      var pct = Math.round((quizScore / QUIZ.length) * 100);
      var passed = pct >= PASS_MARK;
      wrap.appendChild(el("div", { class: "callout " + (passed ? "callout-key" : "callout-warn") },
        [passed
          ? ("Well done — you scored " + pct + "% and have completed this course.")
          : ("You scored " + pct + "% — below the " + PASS_MARK + "% pass mark. Review the explanations below, then retake the quiz.")]
      ));
    }

    var form = el("div", { class: "quiz-form" });
    QUIZ.forEach(function (item, qi) {
      var qBox = el("div", { class: "question" });
      qBox.appendChild(el("div", { class: "q-text" }, [(qi + 1) + ". " + item.q]));
      var optsBox = el("div", { class: "options" });
      item.options.forEach(function (opt, oi) {
        var inputId = "q" + qi + "_o" + oi;
        var label = el("label", { class: "option", for: inputId });
        var input = el("input", { type: "radio", name: "q" + qi, id: inputId, value: oi });
        if (quizAnswers[qi] === oi) input.setAttribute("checked", "checked");
        if (quizSubmitted) input.setAttribute("disabled", "disabled");
        input.addEventListener("change", function () {
          quizAnswers[qi] = oi;
        });
        label.appendChild(input);
        label.appendChild(el("span", {}, [opt]));
        if (quizSubmitted) {
          if (oi === item.correct) label.className += " correct";
          else if (quizAnswers[qi] === oi) label.className += " incorrect";
        }
        optsBox.appendChild(label);
      });
      qBox.appendChild(optsBox);
      if (quizSubmitted) {
        qBox.appendChild(el("div", { class: "explain" }, [item.explain]));
      }
      form.appendChild(qBox);
    });
    wrap.appendChild(form);

    var actionRow = el("div", { class: "quiz-actions" });
    if (!quizSubmitted) {
      var submitBtn = el("button", { class: "btn btn-primary" }, ["Submit answers"]);
      submitBtn.addEventListener("click", function () {
        var unanswered = QUIZ.length - Object.keys(quizAnswers).length;
        if (unanswered > 0) {
          alert("Please answer all questions before submitting (" + unanswered + " remaining).");
          return;
        }
        var correctCount = 0;
        QUIZ.forEach(function (item, qi) {
          if (quizAnswers[qi] === item.correct) correctCount++;
        });
        quizScore = correctCount;
        quizSubmitted = true;
        var pct = Math.round((quizScore / QUIZ.length) * 100);
        var passed = pct >= PASS_MARK;
        SCORM.setCompleted(passed, pct);
        if (passed) recordResult(pct);
        renderCurrent();
      });
      actionRow.appendChild(submitBtn);
    } else {
      var pct2 = Math.round((quizScore / QUIZ.length) * 100);
      if (pct2 < PASS_MARK) {
        var retakeBtn = el("button", { class: "btn btn-secondary" }, ["Retake quiz"]);
        retakeBtn.addEventListener("click", function () {
          quizSubmitted = false;
          quizAnswers = {};
          quizScore = 0;
          renderCurrent();
        });
        actionRow.appendChild(retakeBtn);
      } else {
        actionRow.appendChild(el("div", { class: "done-msg" }, ["Course complete — nice work! Your progress and score are saved in this browser."]));
      }
    }
    wrap.appendChild(actionRow);
    return wrap;
  }

  function renderCurrent() {
    var section = sections[currentIndex];
    visited[section.id] = true;
    contentEl.innerHTML = "";
    if (section.kind === "quiz") {
      contentEl.appendChild(renderQuiz());
    } else {
      contentEl.appendChild(renderModule(section));
    }
    updateNav();
    updateProgress();
    updateAudio(section);
    SCORM.setBookmark(section.id);
    window.scrollTo(0, 0);
  }

  function updateAudio(section) {
    if (!audioEl) return;
    var src = (typeof AUDIO !== "undefined") ? AUDIO[section.id] : null;
    if (!src) {
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioBarEl.classList.add("hidden");
      return;
    }
    audioBarEl.classList.remove("hidden");
    audioBarEl.classList.remove("blocked");
    audioLabelEl.textContent = "Narration: " + section.nav;
    audioEl.src = src;
    audioEl.load();
    var playPromise = audioEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // Autoplay blocked by the browser (typically only the very first slide,
        // before any click has happened) — the control bar stays visible so the
        // learner can press play manually.
        audioBarEl.classList.add("blocked");
      });
    }
  }

  function updateNav() {
    Array.prototype.forEach.call(navListEl.querySelectorAll("li"), function (li, i) {
      li.classList.toggle("active", i === currentIndex);
      li.classList.toggle("visited", !!visited[sections[i].id]);
    });
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === sections.length - 1;
    nextBtn.textContent = currentIndex === sections.length - 2 ? "Go to Knowledge Check →" : "Next →";
  }

  function updateProgress() {
    var visitedCount = Object.keys(visited).length;
    var pct = Math.round((visitedCount / sections.length) * 100);
    progressFillEl.style.width = pct + "%";
    progressLabelEl.textContent = pct + "% viewed";
  }

  function buildNav() {
    var ul = el("ul", {});
    sections.forEach(function (section, i) {
      var li = el("li", {}, [section.nav]);
      li.addEventListener("click", function () {
        currentIndex = i;
        renderCurrent();
      });
      ul.appendChild(li);
    });
    navListEl.appendChild(ul);
  }

  function init() {
    navListEl = document.getElementById("nav-list");
    contentEl = document.getElementById("content");
    progressFillEl = document.getElementById("progress-fill");
    progressLabelEl = document.getElementById("progress-label");
    audioEl = document.getElementById("narration-audio");
    audioLabelEl = document.getElementById("audio-label");
    audioBarEl = document.getElementById("audio-bar");
    audioEl.addEventListener("play", function () { audioBarEl.classList.remove("blocked"); });
    prevBtn = document.getElementById("btn-prev");
    nextBtn = document.getElementById("btn-next");

    SCORM.init();

    buildNav();

    var bookmark = SCORM.getBookmark();
    if (bookmark) {
      var idx = sections.findIndex(function (s) { return s.id === bookmark; });
      if (idx >= 0) currentIndex = idx;
    }

    prevBtn.addEventListener("click", function () {
      if (currentIndex > 0) { currentIndex--; renderCurrent(); }
    });
    nextBtn.addEventListener("click", function () {
      if (currentIndex < sections.length - 1) { currentIndex++; renderCurrent(); }
    });

    renderCurrent();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
