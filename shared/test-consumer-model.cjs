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
  { type: 'giffen', c: 1, s: 4 }
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

console.log(`All ${checks} consumer-model checks passed.`);
