/* Ілюстрації: Хвилюнчик та іконки зон (inline SVG як рядки). */
(function () {
  var KHV = (window.KHV = window.KHV || {});

  /* Пухнастий контур: коло з «хвильками». */
  function fluffy(R, n, bump, squash) {
    var d = '';
    var r2 = R + bump;
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * Math.PI * 2 - Math.PI / 2;
      var x = (R * Math.cos(t)).toFixed(1);
      var y = (R * Math.sin(t) * squash).toFixed(1);
      if (i === 0) { d += 'M' + x + ' ' + y; continue; }
      var tm = ((i - 0.5) / n) * Math.PI * 2 - Math.PI / 2;
      d += ' Q' + (r2 * Math.cos(tm)).toFixed(1) + ' ' + (r2 * Math.sin(tm) * squash).toFixed(1) + ' ' + x + ' ' + y;
    }
    return d + 'Z';
  }

  var BODY = fluffy(100, 22, 26, 0.94);

  /* Хвилюнчик, центрований у (0,0), «радіус» ~110.
     Стан задає клас предка: khv--tremble | khv--watch | khv--calm | khv--peek */
  KHV.khvylyunchyk = function () {
    return '' +
      '<g class="k-shake"><g class="k-bob">' +
        '<ellipse class="k-foot" cx="-40" cy="96" rx="28" ry="16"/>' +
        '<ellipse class="k-foot" cx="40" cy="96" rx="28" ry="16"/>' +
        '<ellipse class="k-arm k-arm-l" cx="-100" cy="34" rx="17" ry="26" transform="rotate(28 -100 34)"/>' +
        '<ellipse class="k-arm k-arm-r" cx="100" cy="34" rx="17" ry="26" transform="rotate(-28 100 34)"/>' +
        '<path class="k-body" d="' + BODY + '"/>' +
        '<path class="k-tuft" d="M-14 -96 C-16 -124 8 -130 10 -112 C11 -102 0 -100 -2 -108"/>' +
        '<path class="k-fur" d="M-64 -52 q8 -10 18 -8 M52 -60 q10 -4 16 4 M-70 50 q6 8 16 8"/>' +
        '<g class="k-eyes-open">' +
          '<ellipse class="k-eye" cx="-36" cy="-14" rx="27" ry="31"/>' +
          '<ellipse class="k-eye" cx="36" cy="-14" rx="27" ry="31"/>' +
          '<g class="k-pupils">' +
            '<circle class="k-pupil" cx="-32" cy="-8" r="14"/>' +
            '<circle class="k-pupil" cx="40" cy="-8" r="14"/>' +
            '<circle class="k-shine" cx="-27" cy="-14" r="5"/>' +
            '<circle class="k-shine" cx="45" cy="-14" r="5"/>' +
          '</g>' +
        '</g>' +
        '<g class="k-eyes-happy">' +
          '<path d="M-58 -10 Q-36 -36 -14 -10"/>' +
          '<path d="M14 -10 Q36 -36 58 -10"/>' +
        '</g>' +
        '<g class="k-brows">' +
          '<path d="M-62 -56 L-22 -66"/>' +
          '<path d="M22 -66 L62 -56"/>' +
        '</g>' +
        '<ellipse class="k-blush" cx="-64" cy="26" rx="16" ry="10"/>' +
        '<ellipse class="k-blush" cx="64" cy="26" rx="16" ry="10"/>' +
        '<path class="k-mouth k-mouth-worried" d="M-24 40 q6 -9 12 0 t12 0 t12 0 t12 0"/>' +
        '<path class="k-mouth k-mouth-smile" d="M-30 30 Q0 64 30 30 Z"/>' +
        '<ellipse class="k-mouth k-mouth-o" cx="0" cy="40" rx="11" ry="14"/>' +
        '<path class="k-sweat" d="M84 -78 C84 -78 72 -60 72 -52 a12 12 0 0 0 24 0 C96 -60 84 -78 84 -78 Z"/>' +
      '</g></g>';
  };

  /* Іконки легенди, viewBox 0 0 64 64. */
  var N = 'stroke="#2A2069" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
  KHV.ICONS = {
    head:
      '<path ' + N + ' fill="#fff" d="M17 40c-6 0-10-4-10-9s4-9 9-9h1c1-6 6-11 13-11 5 0 9 3 11 7h3c6 0 11 5 11 11s-5 11-11 11z"/>' +
      '<circle fill="#2A2069" cx="23" cy="30" r="3"/><circle fill="#2A2069" cx="32" cy="30" r="3"/><circle fill="#2A2069" cx="41" cy="30" r="3"/>' +
      '<circle ' + N + ' fill="#fff" cx="16" cy="49" r="4"/><circle ' + N + ' fill="#fff" cx="9" cy="57" r="2.4"/>',
    cheeks:
      '<circle ' + N + ' fill="#fff" cx="32" cy="32" r="23"/>' +
      '<circle fill="#2A2069" cx="24" cy="27" r="3"/><circle fill="#2A2069" cx="40" cy="27" r="3"/>' +
      '<ellipse fill="#FF7A66" cx="19" cy="37" rx="6" ry="4"/><ellipse fill="#FF7A66" cx="45" cy="37" rx="6" ry="4"/>' +
      '<path ' + N + ' fill="none" d="M26 40q6 5 12 0"/>',
    throat:
      '<path ' + N + ' fill="#fff" d="M9 25h10l13-11v36L19 39H9z"/>' +
      '<path ' + N + ' fill="none" d="M41 24a11 11 0 0 1 0 16M48 17a20 20 0 0 1 0 30"/>',
    heart:
      '<path ' + N + ' fill="#FF7A66" d="M32 54C14 42 7 32 7 22c0-8 6-13 13-13 5 0 9 3 12 8 3-5 7-8 12-8 7 0 13 5 13 13 0 10-7 20-25 32z"/>' +
      '<path fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" d="M17 20q2-4 6-4"/>',
    belly:
      '<path ' + N + ' fill="#3FD6A0" d="M31 30C25 16 9 10 7 20c-2 9 8 14 24 12z"/>' +
      '<path ' + N + ' fill="#FFD43B" d="M31 34C21 34 12 40 15 48c3 7 12 2 16-12z"/>' +
      '<path ' + N + ' fill="#3FD6A0" d="M33 30c6-14 22-20 24-10 2 9-8 14-24 12z"/>' +
      '<path ' + N + ' fill="#FFD43B" d="M33 34c10 0 19 6 16 14-3 7-12 2-16-12z"/>' +
      '<path ' + N + ' fill="#2A2069" d="M32 22v26"/>' +
      '<path ' + N + ' fill="none" d="M30 20l-4-8M34 20l4-8"/>',
    hands:
      '<rect ' + N + ' fill="#fff" x="15" y="12" width="9" height="26" rx="4.5"/>' +
      '<rect ' + N + ' fill="#fff" x="25" y="7" width="9" height="30" rx="4.5"/>' +
      '<rect ' + N + ' fill="#fff" x="35" y="9" width="9" height="28" rx="4.5"/>' +
      '<rect ' + N + ' fill="#fff" x="45" y="15" width="8" height="22" rx="4"/>' +
      '<rect ' + N + ' fill="#fff" x="3" y="32" width="22" height="10" rx="5" transform="rotate(-35 14 37)"/>' +
      '<path ' + N + ' fill="#fff" d="M14 32h40v8c0 11-8 18-19 18h-2c-11 0-19-7-19-18z"/>',
    legs:
      '<path ' + N + ' fill="#fff" d="M18 6h16v22c0 4 3 7 7 8l12 3c4 1 7 5 7 9v4H10V34c0-4 1-6 3-8 2-2 5-4 5-8z"/>' +
      '<path ' + N + ' fill="#4DA8FF" d="M10 46h50v6c0 2-1 3-3 3H13c-2 0-3-1-3-3z"/>' +
      '<path ' + N + ' fill="none" d="M18 18h16M24 34l4-4M31 36l4-4"/>'
  };

  KHV.icon = function (id, cls) {
    return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 64 64" aria-hidden="true">' + KHV.ICONS[id] + '</svg>';
  };
})();
