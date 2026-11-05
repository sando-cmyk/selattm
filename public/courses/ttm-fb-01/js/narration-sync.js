/* =========================================================
   narration-sync.js — TTM-FB-01
   ---------------------------------------------------------
   Brings each point on a slide in as the narrator reaches it.

   - Elements with data-cue="0.42" appear when the narration is 42%
     of the way through. Fractions scale to the recording's real
     length, so re-recording a slide doesn't need new timings.
     To pin an element to an exact moment, add data-cue-sec="12.5".
   - Until a point is reached it shows faintly, so the layout never
     jumps and the learner can see more is coming.
   - Pause, Restart and scrubbing back all follow the audio.
   - Already-cleared slides (going Back) show everything at once.
   - If the audio file is missing or fails, everything builds in
     quickly on a timer instead, so nothing is ever left hidden.
   Load after the narration panel (needs #narrationAudio).
   ========================================================= */
(function () {
  "use strict";
  var audio = document.getElementById("narrationAudio");
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-cue]"));
  if (!audio || !items.length) return;

  // Same key as course-gate.js: a slide revisited after it was cleared shows in full.
  function cleared() {
    try {
      var m = location.pathname.match(/\/courses\/([^\/]+)\//);
      var id = (document.body && document.body.getAttribute("data-course-id")) || (m ? m[1] : "course");
      var g = JSON.parse(window.localStorage.getItem("sela_course_gate::" + id + "::v1") || "{}");
      var n = Number((location.pathname.match(/slide(\d+)\.html$/i) || [])[1]);
      return Array.isArray(g.cleared) && g.cleared.map(Number).indexOf(n) !== -1;
    } catch (e) { return false; }
  }
  if (cleared()) return;

  document.documentElement.classList.add("cue-on");
  var est = Number(audio.getAttribute("data-est-dur")) || 45;
  function duration() { return isFinite(audio.duration) && audio.duration > 0 ? audio.duration : est; }
  function cueTime(el) {
    var s = el.getAttribute("data-cue-sec");
    return s !== null ? Number(s) : Number(el.getAttribute("data-cue")) * duration();
  }
  function show(el, pop) {
    if (el.classList.contains("cue-shown")) return;
    el.classList.add("cue-shown");
    if (pop) {
      el.classList.add("cue-pop");
      setTimeout(function () { el.classList.remove("cue-pop"); }, 1500);
    }
  }
  function sync() {
    var t = audio.currentTime;
    items.forEach(function (el) {
      if (cueTime(el) <= t + 0.15) show(el, !audio.paused);
      else el.classList.remove("cue-shown");
    });
  }
  function showAll() { items.forEach(function (el) { show(el, false); }); }

  var fellBack = false;
  function fallBack() {
    if (fellBack) return;
    fellBack = true;
    ["timeupdate", "seeked", "play"].forEach(function (e) { audio.removeEventListener(e, sync); });
    items.sort(function (a, b) { return Number(a.getAttribute("data-cue")) - Number(b.getAttribute("data-cue")); })
      .forEach(function (el, i) { setTimeout(function () { show(el, true); }, 400 + i * 700); });
  }

  ["timeupdate", "seeked", "play"].forEach(function (e) { audio.addEventListener(e, sync); });
  audio.addEventListener("ended", showAll);
  audio.addEventListener("error", fallBack);
  if (audio.error) fallBack();
  setTimeout(function () {
    if (audio.readyState === 0 && audio.networkState === 3) fallBack();
  }, 4000);
  sync();
})();
