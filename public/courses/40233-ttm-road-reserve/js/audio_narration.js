var Narration = (function () {
  function init(opts) {
    var audio = opts.audio;
    if (!audio) return;
    var autoplay = opts.autoplay !== false;

    function setPlayLabel(playing) {
      if (opts.playBtn) opts.playBtn.textContent = playing ? "⏸ Playing…" : "▶ Play narration";
    }

    if (opts.playBtn) opts.playBtn.addEventListener("click", function () {
      opts.playBtn.classList.remove("cta-pulse");
      audio.play();
    });
    if (opts.pauseBtn) opts.pauseBtn.addEventListener("click", function () {
      if (audio.paused) { audio.play(); } else { audio.pause(); }
    });
    if (opts.restartBtn) opts.restartBtn.addEventListener("click", function () {
      audio.currentTime = 0; audio.play();
    });
    if (opts.speedSelect) opts.speedSelect.addEventListener("change", function () {
      audio.playbackRate = Number(opts.speedSelect.value);
    });
    if (opts.transcriptToggle && opts.transcriptBox) {
      opts.transcriptToggle.addEventListener("click", function () {
        opts.transcriptBox.classList.toggle("open");
      });
    }
    audio.addEventListener("play", function () {
      setPlayLabel(true);
      if (opts.playBtn) opts.playBtn.classList.remove("cta-pulse");
    });
    audio.addEventListener("pause", function () { setPlayLabel(false); });

    if (autoplay) {
      // Most browsers allow audio-with-sound autoplay once the user has interacted with the
      // site at all (and every "Next"/menu click that lands here is itself a user gesture), so
      // this succeeds for the overwhelming majority of real course navigation. If a browser still
      // blocks it (e.g. a slide opened directly/bookmarked with no prior interaction), fall back
      // to a clearly-highlighted manual play button rather than failing silently.
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          if (opts.playBtn) {
            opts.playBtn.classList.add("cta-pulse");
            opts.playBtn.textContent = "▶ Tap to start narration";
          }
        });
      }
    }
    window.addEventListener("beforeunload", function () { audio.pause(); });
  }
  return { init: init };
})();
