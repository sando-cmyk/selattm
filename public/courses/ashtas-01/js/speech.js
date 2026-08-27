/* Plays the pre-recorded narration audio for each slide's presenter notes
   (one mp3 per slide, generated externally with neural TTS voices) instead
   of relying on the browser's built-in speech synthesiser. This means
   every learner hears the exact same, consistent, natural-sounding voice
   regardless of their device — the whole point of moving off Web Speech
   API. If a slide's audio file is missing or fails to load for any
   reason, the panel falls back to showing the transcript so the course
   still works. */
(function () {
  "use strict";

  function setupPanel(panel) {
    var audio = panel.querySelector(".narration-audio");
    var playBtn = panel.querySelector(".narration-btn");
    var restartBtn = panel.querySelector(".narration-restart");
    var rateSelect = panel.querySelector(".narration-rate");
    var statusEl = panel.querySelector(".narration-status");
    var fallbackMsg = panel.querySelector(".narration-fallback");
    var transcriptDetails = panel.querySelector(".transcript-toggle");

    if (!audio) return; // no audio file for this slide — nothing to wire up

    var failed = false;

    function showFallback() {
      if (failed) return;
      failed = true;
      [playBtn, restartBtn, rateSelect, statusEl].forEach(function (el) {
        if (el) el.style.display = "none";
      });
      if (fallbackMsg) fallbackMsg.style.display = "block";
      if (transcriptDetails) transcriptDetails.open = true;
    }

    audio.addEventListener("error", showFallback);
    audio.playbackRate = parseFloat(rateSelect.value || "1");

    rateSelect.addEventListener("change", function () {
      audio.playbackRate = parseFloat(rateSelect.value || "1");
    });

    playBtn.addEventListener("click", function () {
      if (failed) return;
      if (audio.paused) {
        audio.play().catch(showFallback);
      } else {
        audio.pause();
      }
    });

    restartBtn.addEventListener("click", function () {
      if (failed) return;
      audio.currentTime = 0;
      audio.play().catch(showFallback);
    });

    audio.addEventListener("play", function () {
      playBtn.textContent = "⏸ Pause";
      statusEl.textContent = "Playing…";
    });
    audio.addEventListener("pause", function () {
      if (audio.ended) return; // the "ended" handler sets its own text
      playBtn.textContent = "▶ Resume";
      statusEl.textContent = "Paused";
    });
    audio.addEventListener("ended", function () {
      playBtn.textContent = "▶ Play presenter notes";
      statusEl.textContent = "Finished — Play to hear it again";
    });

    // Try to autoplay narration as soon as the slide loads. Browsers block
    // audio-with-sound autoplay until the learner has interacted with the
    // page at least once (a standard anti-annoyance policy, not something
    // this course can override) — most browsers relax this after the
    // learner's first manual Play click, so later slides tend to autoplay
    // fine even when the very first one doesn't. If it's blocked, this
    // fails silently and the slide just waits for a manual Play press —
    // same as before this feature existed, so nothing breaks either way.
    var autoplayAttempt = audio.play();
    if (autoplayAttempt && typeof autoplayAttempt.catch === "function") {
      autoplayAttempt.catch(function () {
        /* Autoplay blocked — leave the panel in its normal idle state. */
      });
    }
  }

  function init() {
    document.querySelectorAll('.narration-panel[data-has-notes="true"]').forEach(setupPanel);
  }

  document.addEventListener("DOMContentLoaded", init);

  // Stop playback cleanly when navigating away so audio doesn't keep
  // playing under the next page.
  function stopAll() {
    document.querySelectorAll(".narration-audio").forEach(function (a) {
      a.pause();
    });
  }
  window.addEventListener("pagehide", stopAll);
  window.addEventListener("beforeunload", stopAll);
})();
