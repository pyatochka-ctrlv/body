/* Пульт педагога: єдине місце, яке змінює стан. */
(function () {
  var KHV = window.KHV;
  if (document.documentElement.getAttribute('data-mode') !== 'remote') return;

  var store = KHV.store;
  var list = document.getElementById('rZones');
  var totalEl = document.getElementById('rTotal');
  var summaryBtn = document.getElementById('rSummary');
  var resetBox = document.getElementById('rReset');
  var soundInput = document.getElementById('rSound');
  var sync = document.getElementById('sync');
  var syncText = document.getElementById('syncText');

  var rows = {};
  KHV.ZONES.forEach(function (z) {
    var li = document.createElement('li');
    li.className = 'r-zone';
    li.innerHTML =
      '<button class="r-add" type="button" aria-label="Плюс один: ' + z.name + '">' +
        '<span class="r-num" style="background:' + z.soft + '">' + z.n + '</span>' +
        '<span class="r-name">' + z.name + '</span><span class="r-plus">+1</span>' +
      '</button>' +
      '<span class="r-count" aria-label="Голосів">0</span>' +
      '<button class="r-minus" type="button" aria-label="Мінус один: ' + z.name + '">−1</button>';
    list.appendChild(li);
    var r = { add: li.querySelector('.r-add'), count: li.querySelector('.r-count'), minus: li.querySelector('.r-minus') };
    r.add.addEventListener('click', function () { add(z.id); });
    r.minus.addEventListener('click', function () { remove(z.id); });
    rows[z.id] = r;
  });

  var cur = store.load();
  KHV.sound.setEnabled(cur.settings.sound);

  function flash(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function add(id) {
    cur = store.vote(id, +1);
    KHV.sound.pop(id);
    flash(rows[id].add, 'is-hit');
    flash(rows[id].count, 'is-bump');
    render();
  }
  function remove(id) {
    var before = store.load().votes[id];
    cur = store.vote(id, -1);
    if (cur.votes[id] < before) { KHV.sound.undo(); flash(rows[id].count, 'is-bump'); }
    render();
  }

  function render() {
    var heat = KHV.heatMap(cur.votes);
    var total = 0;
    KHV.ZONES.forEach(function (z) {
      var c = cur.votes[z.id];
      total += c;
      rows[z.id].count.textContent = c;
      rows[z.id].minus.disabled = c === 0;
      rows[z.id].add.style.backgroundColor = heat.zones[z.id].empty ? '' : heat.zones[z.id].color;
    });
    totalEl.textContent = total;
    summaryBtn.setAttribute('aria-pressed', cur.summary ? 'true' : 'false');
    soundInput.checked = cur.settings.sound;
    updateSync();
  }

  summaryBtn.addEventListener('click', function () {
    var on = !store.load().summary;
    cur = store.setSummary(on);
    if (on) KHV.sound.summary();
    render();
  });

  document.getElementById('rResetAsk').addEventListener('click', function () {
    resetBox.classList.add('is-asking');
    clearTimeout(resetBox.t);
    resetBox.t = setTimeout(function () { resetBox.classList.remove('is-asking'); }, 6000);
  });
  document.getElementById('rResetNo').addEventListener('click', function () { resetBox.classList.remove('is-asking'); });
  document.getElementById('rResetYes').addEventListener('click', function () {
    resetBox.classList.remove('is-asking');
    cur = store.reset();
    KHV.sound.reset();
    render();
  });

  soundInput.addEventListener('change', function () {
    cur = store.setSound(soundInput.checked);
    KHV.sound.setEnabled(soundInput.checked);
    if (soundInput.checked) KHV.sound.pop('heart');
    render();
  });

  function openScreen() {
    window.open(location.pathname, 'khv-screen', 'popup,width=1280,height=760');
  }
  document.getElementById('rOpen').addEventListener('click', openScreen);
  sync.addEventListener('click', function () { if (sync.classList.contains('is-off')) openScreen(); });

  /* Клавіатура: 1–7 → +1, Shift+1–7 → −1. */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    var m = /^(?:Digit|Numpad)([1-7])$/.exec(e.code);
    if (!m) return;
    var z = KHV.ZONES[parseInt(m[1], 10) - 1];
    e.preventDefault();
    if (e.shiftKey) remove(z.id); else add(z.id);
  });

  /* Стан змінено в іншій вкладці (наприклад, другий пульт). */
  store.on('state', function (s) {
    if (!store.isNewer(s, cur)) return;
    cur = s;
    KHV.sound.setEnabled(cur.settings.sound);
    render();
  });

  /* --- індикатор синхронізації --- */
  var contact = { t: 0, rev: -1, session: null };
  function noteContact(m) {
    if (!m) return;
    contact = { t: Date.now(), rev: m.rev, session: m.session };
    updateSync();
  }
  store.on('pong', noteContact);
  store.on('heartbeat', function (hb) { if (hb) noteContact(hb); else { contact.t = 0; updateSync(); } });
  store.on('bye', function () { contact.t = 0; updateSync(); });

  function updateSync() {
    var alive = Date.now() - contact.t < 5000;
    var fresh = contact.session === cur.session.id && contact.rev >= cur.rev;
    sync.classList.toggle('is-ok', alive && fresh);
    sync.classList.toggle('is-wait', alive && !fresh);
    sync.classList.toggle('is-off', !alive);
    syncText.textContent = !alive ? 'Екран не відкрито' : fresh ? 'Синхронізовано' : 'Оновлюю…';
    sync.title = !alive ? 'Натисніть, щоб відкрити вікно екрана' : "Зв'язок з екраном є";
  }

  setInterval(function () {
    store.ping();
    var hb = store.readBeat();
    if (hb && Date.now() - hb.t < 5000 && hb.t > contact.t) contact = { t: hb.t, rev: hb.rev, session: hb.session };
    updateSync();
  }, 1000);
  store.ping();

  render();
})();
