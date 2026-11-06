/*
 * Стан гри та синхронізація.
 *
 * Увесь стан — один JSON-об'єкт у localStorage (ключ KEY). Пише в нього лише пульт.
 * Зміни розсилаються через BroadcastChannel; якщо його немає — екран отримує
 * подію `storage`. Кожна зміна збільшує `rev`, тож дублікати відкидаються.
 *
 * Структура (schema "khvylyunchyk/v1"):
 * {
 *   schema: "khvylyunchyk/v1",
 *   rev: 12,                          // монотонний лічильник змін
 *   updatedAt: "2026-11-06T10:00:00Z",
 *   session: {                        // одна «карта групи»
 *     id: "lr8x2k-ab12cd",
 *     startedAt: "...",
 *     lesson: { program, number, title },
 *     group: null                     // назва групи — на майбутнє
 *   },
 *   votes: { head: 0, cheeks: 0, throat: 0, heart: 0, belly: 0, hands: 0, legs: 0 },
 *   log: [ { at: "...", zone: "head", delta: 1 } ],   // журнал тапів (останні 500)
 *   summary: false,
 *   settings: { sound: false },
 *   archive: [ { session, votes, endedAt } ]           // попередні карти (останні 20)
 * }
 *
 * KHV.store.toSheetRow(state) повертає «плаский» рядок для майбутньої
 * відправки в Google Таблицю. Зараз нічого не відправляється.
 */
(function () {
  var KHV = (window.KHV = window.KHV || {});
  var KEY = 'khvylyunchyk:state:v1';
  var HB_KEY = 'khvylyunchyk:screen:v1';
  var CHANNEL = 'khvylyunchyk';
  var SCHEMA = 'khvylyunchyk/v1';
  var LOG_LIMIT = 500;
  var ARCHIVE_LIMIT = 20;
  var IDS = KHV.ZONE_IDS;

  function now() { return new Date().toISOString(); }
  function uid() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function emptyVotes() { var v = {}; IDS.forEach(function (id) { v[id] = 0; }); return v; }

  function newSession() {
    return {
      id: uid(),
      startedAt: now(),
      lesson: { program: 'Майстерня суперсил', number: 1, title: 'Чому голос ховається?' },
      group: null
    };
  }

  function fresh() {
    return {
      schema: SCHEMA,
      rev: 0,
      updatedAt: now(),
      session: newSession(),
      votes: emptyVotes(),
      log: [],
      summary: false,
      settings: { sound: false },
      archive: []
    };
  }

  /* Доповнює неповні/старі об'єкти, щоб код міг на них покладатися. */
  function normalize(s) {
    if (!s || typeof s !== 'object') return fresh();
    var f = fresh();
    s.schema = SCHEMA;
    s.rev = typeof s.rev === 'number' ? s.rev : 0;
    s.session = s.session && s.session.id ? s.session : f.session;
    s.votes = s.votes || {};
    IDS.forEach(function (id) {
      var c = parseInt(s.votes[id], 10);
      s.votes[id] = isFinite(c) && c > 0 ? c : 0;
    });
    s.log = Array.isArray(s.log) ? s.log : [];
    s.summary = !!s.summary;
    s.settings = s.settings || {};
    s.settings.sound = !!s.settings.sound;
    s.archive = Array.isArray(s.archive) ? s.archive : [];
    return s;
  }

  var memory = null; // якщо localStorage недоступний (дуже суворий приватний режим)

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? normalize(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  function load() {
    var s = read();
    if (s) return s;
    if (!memory) memory = fresh();
    write(memory); // фіксуємо одну спільну сесію для екрана й пульта
    return memory;
  }

  function write(s) {
    memory = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ігноруємо */ }
  }

  /* --- канали --- */
  var bc = null;
  try { if ('BroadcastChannel' in window) bc = new BroadcastChannel(CHANNEL); } catch (e) { bc = null; }

  var handlers = {};
  function on(type, fn) { (handlers[type] = handlers[type] || []).push(fn); }
  function emit(type, data) { (handlers[type] || []).forEach(function (fn) { fn(data); }); }
  function post(msg) { if (bc) { try { bc.postMessage(msg); } catch (e) {} } }

  if (bc) {
    bc.onmessage = function (e) {
      var m = e.data;
      if (!m || !m.type) return;
      if (m.type === 'state') emit('state', normalize(m.state));
      else emit(m.type, m);
    };
  }

  window.addEventListener('storage', function (e) {
    if (e.key === KEY) {
      var s = null;
      try { s = e.newValue ? JSON.parse(e.newValue) : null; } catch (err) {}
      emit('state', s ? normalize(s) : fresh());
    } else if (e.key === HB_KEY) {
      var hb = null;
      try { hb = e.newValue ? JSON.parse(e.newValue) : null; } catch (err) {}
      emit('heartbeat', hb);
    } else if (e.key === null) {
      emit('state', load()); // localStorage.clear()
    }
  });

  /* Чи новіший стан b за поточний a. */
  function isNewer(b, a) {
    if (!a) return true;
    if (b.session.id !== a.session.id) return b.rev >= a.rev || b.rev === 0;
    return b.rev > a.rev;
  }

  /* Атомарна (в межах вкладки) зміна: свіже читання → зміна → запис → розсилка. */
  function mutate(fn) {
    var s = load();
    if (fn(s) === false) return s;
    s.rev += 1;
    s.updatedAt = now();
    write(s);
    post({ type: 'state', state: s });
    return s;
  }

  var api = {
    KEY: KEY,
    load: load,
    on: on,
    isNewer: isNewer,

    vote: function (id, delta) {
      return mutate(function (s) {
        if (IDS.indexOf(id) < 0) return false;
        if (delta < 0 && s.votes[id] <= 0) return false;
        s.votes[id] += delta;
        s.log.push({ at: now(), zone: id, delta: delta });
        if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
      });
    },

    setSummary: function (on) {
      return mutate(function (s) {
        if (s.summary === !!on) return false;
        s.summary = !!on;
      });
    },

    setSound: function (on) {
      return mutate(function (s) { s.settings.sound = !!on; });
    },

    reset: function () {
      return mutate(function (s) {
        var total = IDS.reduce(function (a, id) { return a + s.votes[id]; }, 0);
        if (total > 0) {
          s.archive.push({ session: s.session, votes: s.votes, endedAt: now() });
          if (s.archive.length > ARCHIVE_LIMIT) s.archive.splice(0, s.archive.length - ARCHIVE_LIMIT);
        }
        s.session = newSession();
        s.votes = emptyVotes();
        s.log = [];
        s.summary = false;
      });
    },

    /* Пульс екрана: щоб пульт бачив, що екран відкритий і має актуальний стан. */
    beat: function (s) {
      try { localStorage.setItem(HB_KEY, JSON.stringify({ t: Date.now(), rev: s.rev, session: s.session.id })); } catch (e) {}
    },
    readBeat: function () {
      try { var raw = localStorage.getItem(HB_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    clearBeat: function () { try { localStorage.removeItem(HB_KEY); } catch (e) {} },
    ping: function () { post({ type: 'ping' }); },
    pong: function (s) { post({ type: 'pong', rev: s.rev, session: s.session.id, t: Date.now() }); },
    bye: function () { post({ type: 'bye' }); },
    hasChannel: !!bc,

    /* На майбутнє: рядок для Google Таблиці (одна карта групи = один рядок). */
    toSheetRow: function (s) {
      var row = {
        sessionId: s.session.id,
        startedAt: s.session.startedAt,
        program: s.session.lesson.program,
        lesson: s.session.lesson.number,
        group: s.session.group || ''
      };
      var total = 0;
      KHV.ZONES.forEach(function (z) { row[z.n + ' ' + z.name] = s.votes[z.id]; total += s.votes[z.id]; });
      row.total = total;
      return row;
    }
  };

  KHV.store = api;
})();
