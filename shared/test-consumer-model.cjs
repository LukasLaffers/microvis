// Checks the consumer model (lecture 6+): closed forms against the numerical UMP, the duality identities, Roy's
// identity, Shephard's lemma, Slutsky, Walras' law, homogeneity, symmetry and the conditions of Engel and Cournot.
// Run with:  node shared/test-consumer-model.cjs
const assert = require('node:assert/strict');
const M = require('./consumer-model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const prefs = [
  { type: 'ces', delta: 0.4, rho: -1 }, { type: 'ces', delta: 0.6, rho: 0.5 }, { type: 'ces', delta: 0.5, rho: -3 },
  { type: 'stonegeary', a: 0.35, g1: 2, g2: 1 }, { type: 'stonegeary', a: 0.6, g1: 1, g2: -2 },
  { type: 'quasilinear', kappa: 6 },
  { type: 'giffen', c: 1, s: 4 },
  { type: 'additive', a: 0.8, b: 0.4 }, { type: 'additive', a: 0.3, b: 0.7 },
  { type: 'humped', c: 2, K: 3 }, { type: 'humped', c: 6, K: 2 }
];
// Prices and incomes with interior solutions for each utility (giffen: c p1 + p2 s / 2 < y < c p1 + p2 s).
function draw(u) {
  for (;;) {
    const p = [0.6 + 2 * rnd(), 0.6 + 2 * rnd()], y = u.type === 'giffen' ? null : 6 + 20 * rnd();
    if (u.type === 'giffen') { const lo = u.c * p[0] + p[1] * u.s / 2, hi = u.c * p[0] + p[1] * u.s; return [p, lo + (0.05 + 0.9 * rnd()) * (hi - lo)]; }
    const x = M.demandClosed(p, y, u);
    if (x && x[0] > 0.05 && x[1] > 0.05) return [p, y];
  }
}

for (const u of prefs) {
  const label = JSON.stringify(u);
  for (let r = 0; r < 40; r++) {
    const [p, y] = draw(u), x = M.demand(p, y, u), xn = M.demandNumeric(p, y, u), v = M.utility(x, u);
    // The closed form is the numerical optimum.
    close(xn[0], x[0], 1e-6, 'UMP ' + label); close(xn[1], x[1], 1e-6, 'UMP ' + label);
    // (M1) Walras' law; MRS = p1/p2 at the interior optimum.
    close(p[0] * x[0] + p[1] * x[1], y, 1e-12, '(M1)');
    close(M.mrs21(x, u), p[0] / p[1], 1e-5, 'MRS = p1/p2 ' + label);
    // (M2), (I3), (E3), (H3): homogeneity.
    const a = 0.3 + 3 * rnd(), xa = M.demand([a * p[0], a * p[1]], a * y, u);
    close(xa[0], x[0], 1e-9, '(M2)'); close(M.indirect([a * p[0], a * p[1]], a * y, u), v, 1e-9, '(I3)');
    close(M.expenditure([a * p[0], a * p[1]], v, u), a * y, 1e-8, '(E3)');
    const H = M.hicks(p, v, u), Ha = M.hicks([a * p[0], a * p[1]], v, u);
    close(Ha[0], H[0], 1e-7, '(H3)');
    // Duality: C(p,V(p,y)) = y, V(p,C(p,v)) = v, D(p,y) = H(p,V(p,y)), H(p,v) = D(p,C(p,v)).
    close(M.expenditure(p, v, u), y, 1e-9, 'C(p,V) = y ' + label);
    const v2 = v * (u.type === 'giffen' ? 1.02 : 0.9), C2 = M.expenditure(p, v2, u);
    close(M.indirect(p, C2, u), v2, 1e-9, 'V(p,C) = v');
    close(H[0], x[0], 1e-7, 'D = H(p,V)'); close(H[1], x[1], 1e-7);
    const H2 = M.hicks(p, v2, u), D2 = M.demand(p, C2, u);
    close(H2[0], D2[0], 1e-9, 'H = D(p,C)');
    // (I5) Roy's identity and (E5) Shephard's lemma.
    const hp = 1e-5 * p[0], hy = 1e-5 * y;
    const Vp = (M.indirect([p[0] + hp, p[1]], y, u) - M.indirect([p[0] - hp, p[1]], y, u)) / (2 * hp);
    const Vy = (M.indirect(p, y + hy, u) - M.indirect(p, y - hy, u)) / (2 * hy);
    close(-Vp / Vy, x[0], 1e-5, 'Roy ' + label);
    const Cp = (M.expenditure([p[0] + hp, p[1]], v, u) - M.expenditure([p[0] - hp, p[1]], v, u)) / (2 * hp);
    close(Cp, x[0], 1e-5, 'Shephard ' + label);
    // (M3) Slutsky for j, k = 1, 2; (H4) symmetry and own effects <= 0; Euler: S p = 0.
    for (const [j, k] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      const s = M.slutsky(p, y, u, j, k);
      close(s.total, s.substitution + s.income, 2e-5, `Slutsky ${j}${k} ` + label);
    }
    const S = [[M.dHdp(p, v, u, 0, 0), M.dHdp(p, v, u, 0, 1)], [M.dHdp(p, v, u, 1, 0), M.dHdp(p, v, u, 1, 1)]];
    close(S[0][1], S[1][0], 1e-5, 'symmetry ' + label);
    assert.ok(S[0][0] <= 1e-8 && S[1][1] <= 1e-8, 'own substitution effects <= 0');
    close(S[0][0] * p[0] + S[0][1] * p[1], 0, 1e-5, 'S p = 0');
    // Engel: sum b eta = 1; Cournot: b_i + sum_j b_j eps_ji = 0; homogeneity: sum_j eps_ij + eta_i = 0.
    const e = M.elasticities(p, y, u);
    close(e.b[0] * e.eta[0] + e.b[1] * e.eta[1], 1, 1e-6, 'Engel');
    for (const i of [0, 1]) {
      close(e.b[i] + e.b[0] * e.eu[0][i] + e.b[1] * e.eu[1][i], 0, 1e-6, 'Cournot');
      close(e.eu[i][0] + e.eu[i][1] + e.eta[i], 0, 1e-6, 'homogeneity');
      // Own-price Slutsky in elasticity form: eps^u_ii = eps^c_ii - eta_i b_i.
      close(e.eu[i][i], e.ec[i][i] - e.eta[i] * e.b[i], 1e-5, 'Slutsky elasticity');
    }
    checks += 32;
  }
}

// Special cases: the Giffen example (good 1 inferior and upward-sloping demand when y > p2 s), quasilinear
// (no income effect on good 1), CES (normal goods, homothetic: income elasticities 1).
{
  const u = { type: 'giffen', c: 1, s: 4 }, p = [2, 1], y = 5;   // p2 s = 4 < 5 < c p1 + p2 s = 6
  close(M.demand(p, y, u)[0], 2 + (4 - 5) / 2, 1e-12);
  assert.ok(M.dDdp(p, y, u, 0, 0) > 0, 'Giffen'); assert.ok(M.dDdy(p, y, u, 0) < 0, 'inferior');
  // Interior and y < p2 s needs c p1 < p2 s / 2: at p1 = 1.5, y = 3.8 good 1 is inferior but not Giffen.
  const q = M.demand([1.5, 1], 3.8, u);
  assert.ok(M.dDdp([1.5, 1], 3.8, u, 0, 0) < 0 && M.dDdy([1.5, 1], 3.8, u, 0) < 0 && q[0] > 1);
  const ql = { type: 'quasilinear', kappa: 6 };
  close(M.dDdy([1.5, 1], 10, ql, 0), 0, 1e-8, 'quasilinear');
  const ces = { type: 'ces', delta: 0.4, rho: -1 }, e = M.elasticities([1.2, 0.8], 10, ces);
  close(e.eta[0], 1, 1e-6); close(e.eta[1], 1, 1e-6);
  checks += 9;
}

// Indifference curves: the points have utility v.
for (const u of prefs) {
  const [p, y] = draw(u), v = M.indirect(p, y, u);
  for (const [x1, x2] of M.indifferenceCurve(v, u, [0.5, 1.5, 3, 6])) if (x2 !== null && x2 > 0) { close(M.utility([x1, x2], u), v, 1e-8); checks++; }
}

// Integration: area to the left of H^1 equals the change in expenditure.
{
  const u = { type: 'ces', delta: 0.4, rho: -1 }, v = 3;
  const area = M.integrateP1(p1 => M.hicks([p1, 1], v, u)[0], 1, 2, 100);
  close(area, M.expenditure([2, 1], v, u) - M.expenditure([1, 1], v, u), 1e-7);
  checks++;
}

// The curved examples of the Engel tool.
{
  // additive: the good whose exponent is closer to 1 is the luxury (eta > 1), the other the necessity; both normal
  const u = { type: 'additive', a: 0.8, b: 0.4 };
  for (const y of [2, 8, 20]) {
    const e = M.elasticities([1, 1], y, u);
    assert.ok(e.eta[0] > 1 && e.eta[1] > 0 && e.eta[1] < 1, `additive eta ${e.eta}`);
    checks++;
  }
  // and the income elasticities change with income (the path is not a straight line)
  const e1 = M.elasticities([1, 1], 2, u).eta[0], e2 = M.elasticities([1, 1], 20, u).eta[0];
  assert.ok(Math.abs(e1 - e2) > 0.05); checks++;
  const x1 = M.demand([1, 1], 2, u), x2 = M.demand([1, 1], 20, u), xm = M.demand([1, 1], 11, u);
  // the midpoint income does not give the midpoint bundle: the path is curved
  assert.ok(Math.abs(xm[0] - (x1[0] + x2[0]) / 2) > 0.05 || Math.abs(xm[1] - (x1[1] + x2[1]) / 2) > 0.05); checks++;
}
{
  // humped: good 1 is normal while D2 < K and inferior after; its Engel curve has one peak, at D2 = K
  for (const u of [{ type: 'humped', c: 2, K: 3 }, { type: 'humped', c: 6, K: 2 }]) {
    const p = [1.3, 0.8], ys = Array.from({ length: 400 }, (_, i) => 0.2 + i * 0.25), d = ys.map(y => M.demand(p, y, u));
    let peak = 0; d.forEach((x, i) => { if (x[0] > d[peak][0]) peak = i; });
    assert.ok(peak > 0 && peak < ys.length - 1, 'Engel curve of good 1 has an interior peak');
    close(d[peak][1], u.K, 0.06, 'peak where D2 = K (on a grid of incomes 0.25 apart)');
    for (let i = 1; i < d.length; i++) {
      assert.ok(d[i][1] > d[i - 1][1], 'good 2 always normal');
      if (d[i][1] < u.K * 0.98) assert.ok(d[i][0] > d[i - 1][0], 'good 1 normal below K');
      if (d[i - 1][1] > u.K * 1.02) assert.ok(d[i][0] < d[i - 1][0], 'good 1 inferior above K');
    }
    // convex indifference curves (quasi-concave U): along the curve through a bundle the MRS falls as x1 rises
    for (const y of [3, 8, 20]) {
      const v = M.indirect(p, y, u), x1s = Array.from({ length: 60 }, (_, i) => 0.05 + i * 0.2);
      const mrs = x1s.map(a => { const b = M.x2On(a, v, u); return b === null ? null : M.mrs21([a, b], u); }).filter(m => m !== null);
      for (let i = 1; i < mrs.length; i++) assert.ok(mrs[i] <= mrs[i - 1] * (1 + 1e-6), 'convex indifference curve');
    }
    checks += 3 + 2 * (ys.length - 1);
  }
}

// An indifference curve that meets the x1 axis ends there: no flat piece along the axis (quasilinear, kappa = 2, v = 3).
{
  const u = { type: 'quasilinear', kappa: 2 }, v = 3, pts = M.indifferenceCurve(v, u, [1, 2, 3, 5, 10, 20, 40]);
  for (const [x1, x2] of pts) if (x2 !== null) assert.ok(Math.abs(M.utility([x1, x2], u) - v) < 1e-8, 'on the curve at x1 = ' + x1);
  assert.ok(pts.some(p => p[1] === null), 'beyond the axis the curve has no points');
  checks += pts.length + 1;
}

// x2On with its closed forms gives the same as plain bisection (an independent copy here), on and off the curve's domain.
{
  const bisect = (x1, v, u) => {
    const f = x2 => M.utility([x1, x2], u) - v;
    let lo = u.type === 'stonegeary' ? Math.max(0, u.g2) : 0, hi = u.type === 'giffen' ? Math.min(1e4, u.s - 1e-12) : 1e4;
    if (!(f(hi) >= 0)) return null;
    if (f(lo) >= 0) return lo;
    for (let it = 0; it < 300; it++) { const m = 0.5 * (lo + hi); if (f(m) < 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  };
  for (const u of prefs) for (let k = 0; k < 400; k++) {
    const x1 = 12 * rnd() + 1e-3, v = M.utility([1 + 6 * rnd(), 0.5 + 3 * rnd()], u) * (0.3 + 1.4 * rnd());
    const a = M.x2On(x1, v, u), b = bisect(x1, v, u);
    if (b === null) assert.equal(a, null, `x2On null ${JSON.stringify(u)} ${x1} ${v}`);
    else close(a, b, 1e-8, `x2On ${JSON.stringify(u)} ${x1} ${v}`);
    checks++;
  }
}

console.log(`All ${checks} consumer-model checks passed.`);
