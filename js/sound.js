/* Легкі звуки через Web Audio — без файлів і запитів. Грають на пульті:
   Zoom передає звук комп'ютера, якщо ввімкнути «Поділитися звуком». */
(function () {
  var KHV = (window.KHV = window.KHV || {});
  var ctx = null;
  var enabled = false;
  // Пентатоніка — кожна зона має свою ноту.
  var NOTES = { head: 523, cheeks: 587, throat: 659, heart: 784, belly: 880, hands: 988, legs: 1047 };

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + start;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  KHV.sound = {
    setEnabled: function (on) { enabled = !!on; if (enabled) ac(); },
    pop: function (zone) {
      if (!enabled) return;
      var f = NOTES[zone] || 660;
      tone(f * 0.7, 0, 0.12, 'sine', 0.22, f * 1.2);
      tone(f * 1.5, 0.07, 0.18, 'triangle', 0.08);
    },
    undo: function () { if (enabled) tone(420, 0, 0.18, 'sine', 0.15, 260); },
    summary: function () {
      if (!enabled) return;
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.5, 'triangle', 0.16); });
    },
    reset: function () { if (enabled) tone(700, 0, 0.35, 'triangle', 0.14, 220); }
  };
})();
