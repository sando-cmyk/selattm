var Interactive = (function () {
  function hotspot(btn, widgetId, idx) {
    var widget = document.getElementById(widgetId);
    var card = document.getElementById(widgetId + '-card' + idx);
    var wasOpen = card.classList.contains('open');
    // close all cards, then open the clicked one (accordion-style, keeps the slide short)
    widget.querySelectorAll('.hotspot-card').forEach(function (c) { c.classList.remove('open'); });
    if (!wasOpen) { card.classList.add('open'); }
    if (!btn.classList.contains('found')) {
      btn.classList.add('found');
      var found = widget.querySelectorAll('.hotspot-btn.found, .scene-pin.found').length;
      var total = widget.getAttribute('data-total');
      var progressEl = widget.querySelector('.hotspot-progress');
      if (progressEl) progressEl.textContent = found + ' of ' + total + ' explored';
    }
    // If this widget has a matching diagram (e.g. the Road Reserve cross-section), highlight the
    // zone that corresponds to the clicked item and clear any other highlighted zone.
    var diagram = document.getElementById(widgetId + '-diagram');
    if (diagram) {
      diagram.querySelectorAll('.rr-zone').forEach(function (z) { z.classList.remove('hl-zone'); });
      if (!wasOpen) {
        var zones = diagram.querySelectorAll('[data-zone="' + idx + '"]');
        zones.forEach(function (zone) { zone.classList.add('hl-zone'); });
        if (zones.length) { zones[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }
      }
    }
  }

  function tab(btn, widgetId, idx) {
    var widget = document.getElementById(widgetId);
    widget.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    widget.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(widgetId + '-panel' + idx).classList.add('active');

    // Track distinct tabs viewed so the activity has a real "done" state.
    var seenAttr = widget.getAttribute('data-seen') || '0';
    var seen = seenAttr.split(',').filter(Boolean);
    if (seen.indexOf(String(idx)) === -1) { seen.push(String(idx)); }
    widget.setAttribute('data-seen', seen.join(','));
    var total = Number(widget.getAttribute('data-total'));
    var viewedCount = seen.length;
    var progressEl = widget.querySelector('.hotspot-progress');
    if (progressEl) {
      progressEl.textContent = viewedCount >= total
        ? 'All ' + total + ' tabs viewed'
        : viewedCount + ' of ' + total + ' viewed — click each tab';
    }
    if (viewedCount >= total) {
      var badge = document.getElementById(widgetId + '-complete');
      if (badge) badge.classList.add('show');
    }
  }

  function choice(btn, widgetId, si, ci, correct) {
    var card = btn.closest('.scenario-card');
    if (card.getAttribute('data-answered') === 'true') return; // one attempt shown, but allow review
    card.querySelectorAll('.choice-btn').forEach(function (b) { b.disabled = false; });
    btn.classList.add(correct ? 'correct-picked' : 'wrong-picked');
    var fb = document.getElementById(widgetId + '-fb-' + si + '-' + ci);
    if (fb) fb.classList.add('show');
    if (correct) { card.setAttribute('data-answered', 'true'); }
  }

  function step(cardEl) {
    cardEl.classList.toggle('open');
  }

  return { hotspot: hotspot, tab: tab, choice: choice, step: step };
})();
