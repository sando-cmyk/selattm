/* ==========================================================================
   Sela Civil Advisory - Shared Course "Read / Listen / Watch" Gate
   ==========================================================================
   Locks the Next button on a slide page until the learner has actually
   engaged with it:

     - slide has narration audio  -> must play through to the end
     - slide has a video          -> must play through to the end (jumping
                                     forward on the scrub bar is blocked)
     - no media, or the media file fails to load -> a reading timer based on
                                     how much text is on the slide
                                     (about 3.3 words/second, minimum 10s,
                                     maximum 45s)

   Once a slide has been cleared it stays cleared (remembered in
   localStorage), so going Back and forward again never re-locks it.

   You do NOT add this script to slide pages by hand. It is loaded
   automatically by course-progress.js (courses built from course-kit) and
   by each older course's js/audio_narration.js. It only acts on pages named
   slideN.html, so menus, quizzes and completion pages are untouched.

   Cleared slides are stored at  sela_course_gate::<course>::v1  and read
   back by the course's completion check, so a learner cannot finish a
   course by typing slide URLs into the address bar.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__selaGateLoaded) return;
  window.__selaGateLoaded = true;

  var WORDS_PER_SECOND = 3.3;
  var MIN_READ_SECONDS = 10;
  var MAX_READ_SECONDS = 45;

  function courseId() {
    var attr = document.body && document.body.getAttribute("data-course-id");
    if (attr) return attr;
    var m = location.pathname.match(/\/courses\/([^\/]+)\//);
    return m ? m[1] : "course";
  }
  var KEY = "sela_course_gate::" + courseId() + "::v1";

  function read() {
    try {
      var r = JSON.parse(window.localStorage.getItem(KEY) || "{}");
      return { cleared: Array.isArray(r.cleared) ? r.cleared : [] };
    } catch (e) { return { cleared: [] }; }
  }
  function write(state) {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function isCleared(n) { return read().cleared.indexOf(Number(n)) !== -1; }
  function markCleared(n) {
    var s = read();
    n = Number(n);
    if (s.cleared.indexOf(n) === -1) { s.cleared.push(n); write(s); }
  }
  window.SelaGate = {
    key: KEY,
    isCleared: isCleared,
    clearedCount: function () { return read().cleared.length; },
    markCleared: markCleared
  };

  var match = location.pathname.match(/slide(\d+)\.html$/i);
  if (!match) return;
  var slideNum = Number(match[1]);

  function words(text) {
    var m = (text || "").match(/\S+/g);
    return m ? m.length : 0;
  }

  function init() {
    // The forward button is the amber one in the bottom nav row. Its label
    // varies ("Next", "Knowledge Check", "Continue to Module 2 Check"...).
    var links = document.querySelectorAll(".nav-row a.btn.amber");
    if (!links.length) links = document.querySelectorAll("a.btn.amber");
    var nextLink = links.length ? links[links.length - 1] : null;
    if (!nextLink) return;
    if (isCleared(slideNum)) return;

    var style = document.createElement("style");
    style.textContent = ".sela-gate-locked{opacity:.5;cursor:not-allowed !important;}";
    document.head.appendChild(style);

    var originalLabel = nextLink.textContent;
    var locked = true;
    var timerId = null;

    function setLabel(t) { nextLink.textContent = t; }

    function lock(label) {
      nextLink.classList.add("sela-gate-locked");
      nextLink.setAttribute("aria-disabled", "true");
      nextLink.title = "Finish this slide to unlock Next";
      setLabel(label);
    }
    function unlock() {
      if (!locked) return;
      locked = false;
      if (timerId) { clearInterval(timerId); timerId = null; }
      markCleared(slideNum);
      nextLink.classList.remove("sela-gate-locked");
      nextLink.removeAttribute("aria-disabled");
      nextLink.removeAttribute("title");
      setLabel(originalLabel);
    }

    nextLink.addEventListener("click", function (e) {
      if (locked) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);

    // ---- reading-timer mode ------------------------------------------------
    function startTimer() {
      if (timerId || !locked) return;
      var box = document.getElementById("transcriptBox");
      var text = box ? box.textContent : "";
      if (words(text) < 20) {
        var content = document.querySelector(".slide-content") || document.querySelector(".container");
        text = content ? content.textContent : "";
      }
      var secs = Math.round(words(text) / WORDS_PER_SECOND);
      secs = Math.max(MIN_READ_SECONDS, Math.min(MAX_READ_SECONDS, secs));
      var end = Date.now() + secs * 1000;
      function tick() {
        var left = Math.ceil((end - Date.now()) / 1000);
        if (left <= 0) { unlock(); return; }
        lock("🔒 Please read this slide (" + left + "s)");
      }
      tick();
      if (locked) timerId = setInterval(tick, 250);
    }

    // ---- media mode --------------------------------------------------------
    var media = document.getElementById("narrationAudio") ||
                document.getElementById("welcomeVideo") ||
                document.querySelector(".slide-image-wrap video") ||
                document.querySelector("video");
    if (media && media.tagName && /^(audio|video)$/i.test(media.tagName)) {
      var isVideo = /video/i.test(media.tagName);
      lock(isVideo ? "🔒 Watch the video to continue" : "🔒 Listen to continue");

      var maxPlayed = 0;
      var failed = false;
      function fallBack() {
        if (failed || !locked) return;
        failed = true;
        startTimer();
      }

      media.addEventListener("timeupdate", function () {
        if (!media.seeking && media.currentTime > maxPlayed) maxPlayed = media.currentTime;
      });
      // Stop forward-skipping to the end on the scrub bar / via script.
      media.addEventListener("seeking", function () {
        if (media.currentTime > maxPlayed + 1) media.currentTime = maxPlayed;
      });
      media.addEventListener("ended", function () {
        var d = media.duration;
        if (!isFinite(d) || maxPlayed >= d - 2) unlock();
        else { media.currentTime = maxPlayed; }
      });
      media.addEventListener("error", fallBack);
      var sources = media.querySelectorAll("source");
      for (var s = 0; s < sources.length; s++) sources[s].addEventListener("error", fallBack);
      if (media.error) fallBack();
      // A file that never loads (404, unsupported codec) must not trap the learner.
      setTimeout(function () {
        if (locked && media.readyState === 0 && media.networkState === 3) fallBack();
      }, 4000);
    } else {
      startTimer();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
