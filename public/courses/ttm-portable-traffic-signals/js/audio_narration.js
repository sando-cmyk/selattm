var Narration = (function () {
  function init(opts) {
    var audio = opts.audio;
    if (!audio) return;
    if (opts.playBtn) opts.playBtn.addEventListener("click", function () { audio.play(); });
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
    window.addEventListener("beforeunload", function () { audio.pause(); });
  }
  return { init: init };
})();
