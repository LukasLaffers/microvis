// The small drawings on the start-page tiles: 64 x 64, one style for all of them.
// Axes: a faint L. Main curves: the text colour, 2 px. Secondary curves: thin and faint.
// The one object the tool is about: the accent colour (class "a" for lines, "af" for fills; the CSS sets the
// colour, the inline colour is only a fallback). Used by tools/build-site.cjs.
const BRAND = '#1d5bd8';
const f = v => Math.round(v * 10) / 10;
const P = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L');
const fn = (g, a, b, n = 40) => Array.from({ length: n }, (_, i) => { const x = a + (b - a) * i / (n - 1); return [x, g(x)]; });
const inBox = pts => pts.filter(p => p[1] >= 5 && p[1] <= 55 && p[0] >= 9 && p[0] <= 59);

const AX = '<path d="M9 5V55H59" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45"/>';
const L = (pts, w = 2, extra = '') => `<path d="${P(pts)}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
const S = (pts, extra = '') => L(pts, 1.3, 'opacity="0.45"' + (extra ? ' ' + extra : ''));
const A = (pts, w = 2.2, extra = '') => `<path class="a" d="${P(pts)}" fill="none" stroke="${BRAND}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
const F = (pts, op = 0.16) => `<path class="af" d="${P(pts)}Z" fill="${BRAND}" opacity="${op}"/>`;
const D = (x, y, acc = true, r = 2.8) => acc ? `<circle class="af" cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${BRAND}"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="currentColor"/>`;
const DASH = 'stroke-dasharray="3 3"';
const head = (from, to, acc = true) => {   // an arrowhead at "to"
  const dx = to[0] - from[0], dy = to[1] - from[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, s = 4.2;
  const pts = [[to[0] - s * ux + s * 0.6 * uy, to[1] - s * uy - s * 0.6 * ux], to, [to[0] - s * ux - s * 0.6 * uy, to[1] - s * uy + s * 0.6 * ux]];
  return acc ? A(pts, 2) : L(pts, 1.6);
};
const svg = b => `<svg class="glyph" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${b}</svg>`;
const iso = (k, a = 10, b = 59) => inBox(fn(x => 55 - k / (x - 9), a, b, 60));
const upper = (k, a) => [...iso(k, a, 59), [59, 5], [iso(k, a, 59)[0][0], 5]];   // the set above an isoquant
const G = {};

// Lecture 1
{ // the hill phi = sqrt(z1 z2) as a wireframe, one isoquant on it
  const Q = (z1, z2, q) => [32 + (z1 - z2) * 4.6, 55 - (z1 + z2) * 1.5 - q * 4.2], lines = [];
  for (let k = 0; k <= 6; k += 1.5) {
    lines.push(P(Array.from({ length: 25 }, (_, i) => { const t = 6 * i / 24; return Q(t, k, Math.sqrt(t * k)); })));
    lines.push(P(Array.from({ length: 25 }, (_, i) => { const t = 6 * i / 24; return Q(k, t, Math.sqrt(t * k)); })));
  }
  const q = 3, isoq = Array.from({ length: 40 }, (_, i) => { const z1 = 1.5 + 4.5 * i / 39, z2 = q * q / z1; return z2 <= 6 && z2 >= 1.5 ? Q(z1, z2, q) : null; }).filter(Boolean);
  G['production-explorer'] = svg(`<path d="${lines.join('')}" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/>` + A(isoq, 2.4));
}
G['input-requirement-sets'] = svg(AX + F(upper(260, 14.5)) + L(iso(260, 14.5)) + S([[21, 22], [45, 42]], DASH) + D(21, 22, false, 2.5) + D(45, 42, false, 2.5) + D(33, 32, true, 2.5));
{ // isoquant, tangent and the step triangle
  const X = z => 9 + z * 8.5, Y = z => 55 - z * 8.5;
  const isoq = inBox(Array.from({ length: 50 }, (_, i) => { const z1 = 0.5 + 5.4 * i / 49; return [X(z1), Y(2.6 / z1)]; }));
  const z0 = [1.75, 2.6 / 1.75], m = 2.6 / (z0[0] * z0[0]), d = 1.1;
  G['building-the-mrts'] = svg(AX + L(isoq) + A([[X(z0[0] - 1.3), Y(z0[1] + 1.3 * m)], [X(z0[0] + 1.7), Y(z0[1] - 1.7 * m)]], 1.8, DASH) +
    L([[X(z0[0]), Y(z0[1])], [X(z0[0] + d), Y(z0[1])], [X(z0[0] + d), Y(2.6 / (z0[0] + d))]], 1.3) + D(X(z0[0]), Y(z0[1])));
}
G['homogeneous-homothetic'] = svg(AX + [140, 400, 800].map(k => L(iso(k), 1.6)).join('') + S([[9, 55], [55, 9]], DASH) +
  [140, 400, 800].map(k => { const t = Math.sqrt(k); return A([[9 + t - 5.5, 55 - t - 5.5], [9 + t + 5.5, 55 - t + 5.5]], 2.2); }).join(''));
{ // e along the ray, sigma along the isoquant
  const p = [29, 35], r = [39, 25], x2 = 43, q = [x2, 55 - 400 / (x2 - 9)];
  G['two-elasticities'] = svg(AX + L(iso(400)) + S([[9, 55], [54, 10]], DASH) + A([p, r], 2.2) + head(p, r) +
    A(fn(x => 55 - 400 / (x - 9), 29, x2, 12), 2.2) + head([x2 - 2, 55 - 400 / (x2 - 11)], q) + D(p[0], p[1], false));
}
G['frisch-chocolate'] = svg(AX + [0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => D(19 + 11 * i, 45 - 11 * j, false, 1.7)).join('')).join('') + A(iso(300, 15), 2.2));

// Lecture 2
G['cost-minimisation'] = svg(AX + L(iso(400)) + S([[9, 25], [39, 55]]) + S([[9, 5], [59, 55]]) + A([[9, 15], [49, 55]]) + D(29, 35));
{ // AC (U-shaped), MC through its minimum, supply = MC above the minimum
  const ac = x => 37 - 0.034 * (x - 34) ** 2, mc = x => 37 - 0.95 * (x - 34) - 0.012 * (x - 34) ** 2;
  G['cost-curves'] = svg(AX + L(fn(ac, 12, 57)) + S(fn(mc, 17, 34)) + A(fn(mc, 34, 52)) + D(34, 37));
}
G['profit-two-ways'] = svg(AX + [7, 13, 19].map((r, i) => `<ellipse cx="38" cy="27" rx="${f(r * 1.15)}" ry="${f(r * 0.75)}" transform="rotate(-30 38 27)" fill="none" stroke="currentColor" stroke-width="1.4" opacity="${[0.9, 0.6, 0.35][i]}"/>`).join('') +
  A([[9, 55], [38, 27], [52, 13.5]], 1.8, DASH) + D(38, 27));
{ // the surface along a segment sags below the chord
  const g = x => 47 - 0.014 * (x - 13) ** 2 - 0.2 * (x - 13);
  G['concavity-and-scale'] = svg(AX + F([...fn(g, 13, 57), [13, g(13)]], 0.2) + L(fn(g, 13, 57)) + A([[13, g(13)], [57, g(57)]], 2) + D(13, g(13), false, 2.4) + D(57, g(57), false, 2.4));
}

// Lecture 3
G['cost-function'] = svg(AX + L(fn(x => 55 - 7 * Math.sqrt(x - 9), 9.5, 58, 60)) + A([[13, 34.7], [56, 4.6]], 1.8, DASH) + D(34, 20));
G['substitution-scale-effects'] = svg(AX + L(iso(500)) + S(iso(230)) + D(31, 32.3, false) + D(25, 23.8) + D(21, 35.8, false) +
  A([[31, 32.3], [25, 23.8]], 1.8) + A([[25, 23.8], [21, 35.8]], 1.8, DASH));

// Lecture 4
G['comparative-statics'] = svg(AX + L([[18.8, 8], [39.8, 55]]) + A([[9, 12], [52, 55]]) + D(30, 33));
G['marshall-law'] = svg(AX + L(fn(x => 55 - 280 / (x - 3), 10, 59)) + A([[12, 12], [56, 50]], 2) + S([[24, 22.4], [38, 22.4], [38, 34.6]]) + D(24, 22.4));
{ // cost share against log price: data and a straight line
  const pts = [[14, 46], [19, 44], [23, 38], [28, 39], [32, 33], [37, 31], [41, 27], [46, 25], [50, 19], [55, 18]];
  G['translog'] = svg(AX + pts.map(p => D(p[0], p[1], false, 2)).join('') + A([[11, 49.5], [58, 14]], 2));
}
G['substitution-or-composition'] = svg(AX + L([[17, 7], [17, 41], [33, 41]], 1.8) + L([[33, 7], [33, 21], [57, 21]], 1.8) + A([[11, 49], [42, 10]], 1.8, DASH) + D(17, 41) + D(33, 21));

// Lecture 5: the firm and the market
G['market-supply'] = svg(AX + L([[9, 18], [44, 55]]) + A([[9, 55], [9, 33]], 2.6) + S([[9, 33], [30, 33]], DASH) + A([[30, 33], [55, 7]]) + D(30, 33));
G['firm-externalities'] = svg(AX + L(fn(x => 53 - 0.02 * (x - 9) ** 2, 11, 59)) + A(fn(x => 53 - 0.034 * (x - 9) ** 2, 11, 47)) + S(fn(x => 53 - 0.011 * (x - 9) ** 2, 11, 59)));
G['free-entry'] = svg(AX + L(fn(x => 38 - 0.034 * (x - 34) ** 2, 12, 57)) + A([[9, 38], [59, 38]], 1.8) + S([[34, 38], [34, 55]], DASH) + D(34, 38));
G['monopoly'] = svg(AX + L([[9, 9], [55, 55]]) + A([[9, 9], [32, 55]]) + S([[9, 43], [59, 43]]) + S([[26, 26], [26, 55]], DASH) + D(26, 26));

// Lecture 5: consumer preferences
G['budget-sets'] = svg(AX + F([[9, 55], [9, 15], [49, 55]], 0.2) + L([[9, 15], [49, 55]]) + A([[9, 15], [29, 55]], 1.8, DASH) + D(9, 15, false, 2.4));
G['preference-axioms'] = svg(AX + F(upper(350, 16.5)) + L(iso(350, 16.5)) + D(30, 38.3, false));
G['ordinal-utility'] = svg(AX + S(iso(140)) + A(iso(380), 2.4) + S(iso(760)));

// Lecture 6
G['demand-duality'] = svg(AX + F([[9, 55], [9, 15], [49, 55]], 0.12) + A([[9, 15], [49, 55]], 2) + L(iso(400)) + D(29, 35));
G['slutsky'] = svg(AX + A([[9, 15], [49, 55]], 1.8) + S([[9, 15], [33, 55]]) + L(iso(400)) + S(iso(150)) + D(29, 35));
G['engel-curves'] = svg(AX + S(fn(x => 53 - 0.5 * (x - 9) - 0.004 * (x - 9) ** 2, 9, 57)) + A(fn(x => 55 - 34 * ((x - 9) / 18) * Math.exp(1 - (x - 9) / 18), 9, 59)));

// Lecture 7
G['cv-ev'] = svg(AX + F([[9, 29], ...fn(y => 400 / (55 - y) - 1, 29, 41, 20).map(p => [p[1], p[0]]), [9, 41]], 0.25) +
  L(fn(x => 55 - 400 / (x + 1), 12, 59)) + A([[9, 29], [59, 29]], 1.6) + A([[9, 41], [59, 41]], 1.6, DASH));
G['deadweight-loss'] = svg(AX + L([[9, 13], [57, 53]]) + A([[9, 25], [59, 25]], 1.6) + S([[9, 39], [59, 39]]) + F([[23.4, 25], [40.2, 39], [23.4, 39]], 0.35) + S([[23.4, 25], [23.4, 55]], DASH));

// Lecture 8
{ // production possibility frontier and the indifference curve that touches it
  const T = [33, 55 - 44 * Math.sqrt(1 - (24 / 46) ** 2)];
  G['robinson-crusoe'] = svg(AX + L(fn(x => 55 - 44 * Math.sqrt(Math.max(0, 1 - ((x - 9) / 46) ** 2)), 9, 55, 60)) +
    A(inBox(fn(x => 55 - 637 / x - 18.2, 18, 59, 50)), 2) + D(T[0], T[1]));
}

// Lecture 9
{ // the box, an indifference curve from each corner, the contract curve and a price line
  const L0 = 7, T = 57, W = 50, H = 50, X = x => L0 + x * W / 10, Y = y => T - y * H / 10;
  const ua = Array.from({ length: 50 }, (_, i) => { const x = 1.2 + 8.6 * i / 49; return [X(x), Y(25 / x)]; }).filter(p => p[1] >= T - H && p[1] <= T);
  const ub = Array.from({ length: 50 }, (_, i) => { const x = 1.2 + 8.6 * i / 49; return [X(10 - x), Y(10 - 25 / x)]; }).filter(p => p[1] >= T - H && p[1] <= T);
  const E = [5, 5], R = [8.4, 1.6], s = (E[1] - R[1]) / (E[0] - R[0]);
  G['edgeworth-box'] = svg(`<rect x="${L0}" y="${T - H}" width="${W}" height="${H}" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45"/>` +
    S([[X(0), Y(0)], [X(10), Y(10)]], DASH) + L(ua, 1.8) + L(ub, 1.8, 'opacity="0.6"') +
    A([[X(R[0] + 1.2), Y(R[1] + 1.2 * s)], [X(E[0] - 2.6), Y(E[1] - 2.6 * s)]], 1.8) + D(X(E[0]), Y(E[1])) + D(X(R[0]), Y(R[1]), false, 2.4));
}
{ // the price plane: where market 1 clears (steep), market 2 (flat, accent) and market 3 (dashed), all meeting at the
  // equilibrium
  const m1 = x => 55 - 1.7 * (x - 15), m2 = x => 43 - 0.45 * (x - 9);
  let lo = 15, hi = 45; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (m1(m) - m2(m)) > 0 ? lo = m : hi = m; }
  const E = [lo, m1(lo)];
  G['excess-demand'] = svg(AX + S([[9, E[1] - 0.5 * (E[0] - 9)], [59, E[1] + 0.5 * (59 - E[0])]], DASH) + L(fn(m1, 15, 44.4), 2) + A(fn(m2, 9, 59), 2) + D(E[0], E[1], false, 3));
}
G['core-replica'] = svg('<rect x="7" y="7" width="50" height="50" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45"/>' +
  '<path d="M13 51Q19 19 51 13Q37 41 13 51Z" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.45"/>' +
  '<path d="M19 45Q23 26 44 21Q37 37 19 45Z" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.75"/>' +
  `<path class="af" d="M26 38Q28 29 38 27Q35 34 26 38Z" fill="${BRAND}" opacity="0.4"/>` + D(32, 32));

module.exports = G;
if (require.main === module) console.log(Object.keys(G).length + ' glyphs');
