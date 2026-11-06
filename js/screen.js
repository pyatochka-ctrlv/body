/* Екран для демонстрації. Нічого не пише в стан — лише показує. */
(function () {
  var KHV = window.KHV;
  if (document.documentElement.getAttribute('data-mode') !== 'screen') return;

  var store = KHV.store;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var stage = document.getElementById('stage');
  var figure = document.getElementById('figure');
  var ripples = document.getElementById('ripples');
  var peeks = document.getElementById('peeks');
  var badges = document.getElementById('badges');
  var khvBig = document.getElementById('khvBig');
  var bubble = document.getElementById('bubble');
  var bubbleText = document.getElementById('bubbleText');
  var legendList = document.getElementById('legendList');
  var burst = document.getElementById('burst');

  /* Геометрія у координатах силуету:
     badge — номер, line — куди веде пунктир, anchor — звідки визирає Хвилюнчик, peek — куди вистрибує. */
  var GEO = {
    head:   { badge: [60, 84],   line: [282, 84],  anchor: [350, 84],  peek: [150, -70] },
    cheeks: { badge: [640, 182], line: [432, 182], anchor: [410, 182], peek: [104, -44] },
    throat: { badge: [60, 276],  line: [327, 276], anchor: [350, 275], peek: [-122, 6] },
    heart:  { badge: [640, 392], line: [440, 392], anchor: [398, 392], peek: [100, -96] },
    belly:  { badge: [60, 532],  line: [274, 532], anchor: [350, 532], peek: [-128, 0] },
    hands:  { badge: [640, 600], line: [555, 596], anchor: [528, 590], peek: [40, 118] },
    legs:   { badge: [60, 805],  line: [294, 805], anchor: [388, 805], peek: [118, -10] }
  };

  /* --- побудова --- */
  khvBig.innerHTML = KHV.khvylyunchyk();

  var zoneEls = {}, badgeEls = {}, rowEls = {}, badgeLegend = {};
  KHV.ZONES.forEach(function (z) {
    zoneEls[z.id] = figure.querySelector('.zone[data-zone="' + z.id + '"]');

    var g = GEO[z.id];
    var b = document.createElementNS(SVGNS, 'g');
    b.setAttribute('class', 'badge');
    b.innerHTML =
      '<line class="badge-line" x1="' + g.badge[0] + '" y1="' + g.badge[1] + '" x2="' + g.line[0] + '" y2="' + g.line[1] + '"/>' +
      '<circle class="badge-end" cx="' + g.line[0] + '" cy="' + g.line[1] + '" r="6"/>' +
      '<g class="badge-c"><circle cx="' + g.badge[0] + '" cy="' + g.badge[1] + '" r="50"/>' +
      '<text x="' + g.badge[0] + '" y="' + g.badge[1] + '" dy="0.35em">' + z.n + '</text></g>';
    badges.appendChild(b);
    badgeEls[z.id] = b;

    var li = document.createElement('li');
    li.innerHTML =
      '<span class="lg-badge">' + z.n + '</span>' +
      '<span class="lg-icon" style="background:' + z.soft + '">' + KHV.icon(z.id) + '</span>' +
      '<span class="lg-name">' + z.name + '</span>';
    legendList.appendChild(li);
    rowEls[z.id] = li;
    badgeLegend[z.id] = li.querySelector('.lg-badge');
  });

  /* --- масштаб сцени під вікно --- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.setProperty('--scale', s.toFixed(4));
  }
  window.addEventListener('resize', fit);
  fit();

  /* --- анімації --- */
  function restartClass(el, cls) {
    el.classList.remove(cls);
    void el.getBoundingClientRect(); // перезапуск анімації
    el.classList.add(cls);
  }

  function ripple(id, color) {
    zoneEls[id].querySelectorAll('.zs').forEach(function (zs) {
      var r = zs.cloneNode(true);
      r.setAttribute('class', 'ripple');
      r.querySelectorAll('*').forEach(function (c) { c.style.stroke = color; c.style.fill = 'none'; });
      r.addEventListener('animationend', function () { r.remove(); });
      ripples.appendChild(r);
    });
  }

  var activePeek = {};
  function peek(id) {
    var g = GEO[id];
    if (activePeek[id]) activePeek[id].remove();
    var outer = document.createElementNS(SVGNS, 'g');
    outer.setAttribute('class', 'peek khv--peek');
    outer.setAttribute('transform', 'translate(' + g.anchor[0] + ' ' + g.anchor[1] + ')');
    outer.innerHTML =
      '<g class="peek-anim" style="--dx:' + g.peek[0] + 'px;--dy:' + g.peek[1] + 'px">' +
      '<g transform="scale(0.62)">' + KHV.khvylyunchyk() + '</g></g>';
    var anim = outer.firstChild;
    anim.addEventListener('animationend', function (e) {
      if (e.target !== anim) return;
      outer.remove();
      if (activePeek[id] === outer) delete activePeek[id];
    });
    peeks.appendChild(outer);
    activePeek[id] = outer;
  }

  function celebrate(id, color) {
    restartClass(zoneEls[id], 'is-pulse');
    restartClass(badgeEls[id], 'is-pulse');
    restartClass(rowEls[id], 'is-pulse');
    ripple(id, color);
    peek(id);
  }

  var COLORS = ['#FFD43B', '#4DA8FF', '#3FD6A0', '#FF7A66', '#A78BFA'];
  function confetti() {
    burst.innerHTML = '';
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      p.className = 'bp ' + (i % 2 ? 'round' : 'dia');
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty('--x', Math.round(Math.random() * 1880) + 'px');
      p.style.setProperty('--dx', Math.round(Math.random() * 240 - 120) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
      p.style.setProperty('--d', (2.4 + Math.random() * 1.6).toFixed(2) + 's');
      p.style.setProperty('--delay', (Math.random() * 0.9).toFixed(2) + 's');
      burst.appendChild(p);
    }
    clearTimeout(confetti.t);
    confetti.t = setTimeout(function () { burst.innerHTML = ''; }, 5000);
  }

  var BUBBLE = { tremble: 'Ой-ой…', watch: 'Ви мене знайшли!', calm: 'Мені вже краще!' };
  var mood = null;
  function setMood(m) {
    if (m === mood) return;
    var first = mood === null;
    mood = m;
    khvBig.setAttribute('class', 'khv-big khv--' + m);
    if (first) { bubbleText.textContent = BUBBLE[m]; return; }
    bubble.classList.add('is-swap');
    setTimeout(function () {
      bubbleText.textContent = BUBBLE[m];
      bubble.classList.remove('is-swap');
    }, 260);
  }

  /* --- відмальовка стану --- */
  var cur = null;

  function render(s, prev) {
    var heat = KHV.heatMap(s.votes);
    var sameSession = prev && prev.session.id === s.session.id;
    var total = 0;
    var bumped = [];

    KHV.ZONES.forEach(function (z) {
      var h = heat.zones[z.id];
      var c = s.votes[z.id];
      total += c;
      var el = zoneEls[z.id];
      el.classList.toggle('is-on', !h.empty);
      el.classList.toggle('is-top', h.top);
      badgeEls[z.id].classList.toggle('is-top', h.top);
      el.querySelectorAll('.zs > *').forEach(function (shape) {
        shape.style.fill = h.empty ? 'rgba(255,255,255,0)' : h.color;
      });
      badgeEls[z.id].querySelector('.badge-c circle').style.fill = h.empty ? '' : h.color;
      badgeLegend[z.id].style.backgroundColor = h.empty ? '' : h.color;
      if (sameSession && c > prev.votes[z.id]) bumped.push({ id: z.id, color: h.color });
    });

    bumped.forEach(function (b, i) {
      setTimeout(function () { celebrate(b.id, b.color); }, i * 220);
    });

    stage.classList.toggle('is-summary', s.summary);
    if (s.summary && prev && !prev.summary) confetti();

    setMood(s.summary ? 'calm' : total === 0 ? 'tremble' : 'watch');
  }

  function apply(s) {
    if (cur && !store.isNewer(s, cur)) return;
    var prev = cur;
    cur = s;
    render(s, prev);
    store.beat(cur);
  }

  apply(store.load());

  store.on('state', apply);
  store.on('ping', function () { store.pong(cur); });

  // Якщо вкладка «проспала» подію — перечитуємо сховище.
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(store.load()); });
  setInterval(function () { store.beat(cur); }, 1500);
  window.addEventListener('pagehide', function () { store.clearBeat(); store.bye(); });
  window.addEventListener('pageshow', function () { store.beat(cur); });

  // R — відкрити пульт у окремому вузькому вікні.
  document.addEventListener('keydown', function (e) {
    if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      window.open(location.pathname + '?mode=remote', 'khv-remote', 'popup,width=420,height=860');
    }
  });

  KHV.screen = { celebrate: celebrate, state: function () { return cur; } };
})();
