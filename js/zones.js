/* Опис зон тіла. id — стабільні ключі для збереження й майбутнього експорту. */
(function () {
  var KHV = (window.KHV = window.KHV || {});

  KHV.ZONES = [
    { id: 'head',   n: 1, name: 'Голова й думки', accent: '#A78BFA', soft: '#E6DCFF' },
    { id: 'cheeks', n: 2, name: 'Щоки',           accent: '#FF7A66', soft: '#FFDCD5' },
    { id: 'throat', n: 3, name: 'Горло й голос',  accent: '#4DA8FF', soft: '#D6EBFF' },
    { id: 'heart',  n: 4, name: 'Серце',          accent: '#FF7A66', soft: '#FFDCD5' },
    { id: 'belly',  n: 5, name: 'Живіт',          accent: '#3FD6A0', soft: '#CFF5E7' },
    { id: 'hands',  n: 6, name: 'Руки',           accent: '#FFD43B', soft: '#FFF1BF' },
    { id: 'legs',   n: 7, name: 'Коліна й ноги',  accent: '#4DA8FF', soft: '#D6EBFF' }
  ];

  KHV.ZONE_IDS = KHV.ZONES.map(function (z) { return z.id; });

  /* Теплова шкала: частка від максимуму (0..1] → колір від світло-жовтого до коралового. */
  var STOPS = [
    [0.0, [255, 243, 176]], // #FFF3B0
    [0.4, [255, 212, 59]],  // #FFD43B
    [0.72, [255, 168, 84]], // #FFA854
    [1.0, [255, 122, 102]]  // #FF7A66
  ];

  KHV.heatColor = function (ratio) {
    var t = Math.max(0, Math.min(1, ratio));
    for (var i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i];
        var k = (t - a[0]) / (b[0] - a[0]);
        var c = a[1].map(function (v, j) { return Math.round(v + (b[1][j] - v) * k); });
        return 'rgb(' + c.join(',') + ')';
      }
    }
    return 'rgb(255,122,102)';
  };

  /* Обчислює вигляд кожної зони за станом: колір, чи порожня, чи серед лідерів. */
  KHV.heatMap = function (votes) {
    var max = 0;
    KHV.ZONE_IDS.forEach(function (id) { max = Math.max(max, votes[id] || 0); });
    var out = {};
    KHV.ZONE_IDS.forEach(function (id) {
      var c = votes[id] || 0;
      out[id] = {
        empty: c === 0,
        color: c === 0 ? null : KHV.heatColor(c / max),
        top: max > 0 && c === max
      };
    });
    return { max: max, zones: out };
  };
})();
