// Checks the Duality Square of lecture 6 against brute force. Run with:  node duality-square/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

// (UMP) by brute force: maximise U along the budget line, a fine grid and then a golden-section search near the best point.
function bruteUMP(ex, p, y, a) {
  const f = x1 => { const x2 = Math.max(0, (y - p[0] * x1) / p[1]); return M.utility(ex, [x1, x2], a); };
  const hi = y / p[0], N = 4000;
  let best = 0, bv = -Infinity;
  for (let i = 0; i <= N; i++) { const x1 = hi * i / N, u = f(x1); if (u > bv) { bv = u; best = i; } }
  let lo = hi * Math.max(0, best - 1) / N, up = hi * Math.min(N, best + 1) / N;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 120; k++) { const c = up - g * (up - lo), d = lo + g * (up - lo); if (f(c) >= f(d)) up = d; else lo = c; }
  const x1 = (lo + up) / 2, cand = [[x1, f(x1)], [0, f(0)], [hi, f(hi)]].sort((s, t) => t[1] - s[1])[0];
  return { x: [cand[0], Math.max(0, (y - p[0] * cand[0]) / p[1])], v: cand[1] };
}
// (EMP) by brute force: the lowest income whose best affordable bundle reaches v (bisection on brute-force UMP).
function bruteEMP(ex, p, v, a) {
  let lo = 0, hi = 1;
  while (bruteUMP(ex, p, hi, a).v < v) hi *= 2;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (bruteUMP(ex, p, m, a).v >= v) hi = m; else lo = m; }
  return { C: hi, x: bruteUMP(ex, p, hi, a).x };
}

const examples = [['leontief'], ['sqrt'], ['cd', 0.3], ['cd', 0.7], ['subst'], ['additive'], ['quasilin']];
const prices = [[1, 2], [2, 1], [0.7, 1.6], [3, 0.5], [1.5, 1.5]];
const h = 1e-6;
for (const [ex, a] of examples) for (const p of prices) for (const y of [1.2, 8, 17]) {
  const label = JSON.stringify({ ex, a, p, y }), V = M.indirect(ex, p, y, a), D = M.demandSet(ex, p, y, a);
  const tie = D[0][0] !== D[1][0] || D[0][1] !== D[1][1];
  // D: on the budget line, and as good as brute force; V = U(D).
  for (const x of D) { close(p[0] * x[0] + p[1] * x[1], y, 1e-12, 'adding up ' + label); close(M.utility(ex, x, a), V, 1e-10, 'V = U(D) ' + label); assert.ok(x[0] >= 0 && x[1] >= 0); checks += 3; }
  const B = bruteUMP(ex, p, y, a);
  close(V, B.v, 1e-7, 'V brute ' + label); checks++;
  if (!tie) { close(D[0][0], B.x[0], 1e-4, 'D1 brute ' + label); close(D[0][1], B.x[1], 1e-4, 'D2 brute ' + label); checks += 2; }
  // C and H by brute force at v = V(p,y); the duality identities.
  const C = M.expenditure(ex, p, V, a), H = M.hicksSet(ex, p, V, a), E = bruteEMP(ex, p, V, a);
  close(C, y, 1e-10, 'C(p,V(p,y)) = y ' + label); close(E.C, C, 1e-6, 'C brute ' + label);
  close(M.indirect(ex, p, C, a), V, 1e-10, 'V(p,C) = v ' + label); checks += 3;
  for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) { close(H[k][i], D[k][i], 1e-10, 'H(p,V) = D ' + label); checks++; }
  for (const x of H) { close(M.utility(ex, x, a), V, 1e-10, 'U(H) = v ' + label); close(p[0] * x[0] + p[1] * x[1], C, 1e-10, 'p.H = C ' + label); checks += 2; }
  assert.equal(M.regimeV(ex, p, V), M.regime(ex, p, y), 'regimes agree ' + label); checks++;
  // Roy's identity and Shephard's lemma with the closed-form derivatives, which are checked by finite differences.
  const gV = M.indirectGrad(ex, p, y, a), gC = M.expenditureGrad(ex, p, V, a);
  assert.equal(gV === null, tie, 'V kinked only at a tie ' + label); assert.equal(gC === null, tie); checks += 2;
  if (!tie) {
    const fd = (f, k) => { const q = p.slice(), r = p.slice(); q[k] += h; r[k] -= h; return (f(q) - f(r)) / (2 * h); };
    // (no finite difference across a kink: ln x1 + x2 at y = p2 is smooth, x1 + x2 has no tie here)
    for (let k = 0; k < 2; k++) {
      close(gV.p[k], fd(q => M.indirect(ex, q, y, a), k), 1e-5, 'V_p ' + label);
      close(gC[k], fd(q => M.expenditure(ex, q, V, a), k), 1e-5, 'C_p ' + label);
      close(-gV.p[k] / gV.y, D[0][k], 1e-10, 'Roy ' + label);
      close(gC[k], H[0][k], 1e-10, 'Shephard ' + label);
      checks += 4;
    }
    close(gV.y, (M.indirect(ex, p, y + h, a) - M.indirect(ex, p, y - h, a)) / (2 * h), 1e-5, 'V_y ' + label); checks++;
  } else {
    // A tie for x1 + x2: every bundle on the budget line is optimal, and V has a kink in p1 (one-sided derivatives differ).
    for (const s of [0.25, 0.5, 0.75]) { const x = [s * y / p[0], (1 - s) * y / p[1]]; close(M.utility(ex, x, a), V, 1e-12, 'tie: all optimal'); checks++; }
    const right = (M.indirect(ex, [p[0] + h, p[1]], y, a) - V) / h, left = (V - M.indirect(ex, [p[0] - h, p[1]], y, a)) / h;
    assert.ok(Math.abs(right) < 1e-6 && left < -0.1, 'kink in V at a tie ' + label); checks++;
  }
  // Homogeneity: D(2p, 2y) = D(p,y), V(2p,2y) = V(p,y), C(2p, v) = 2C(p, v), H(2p, v) = H(p, v).
  const p2 = [2 * p[0], 2 * p[1]];
  close(M.indirect(ex, p2, 2 * y, a), V, 1e-12); close(M.expenditure(ex, p2, V, a), 2 * C, 1e-12);
  close(M.demandSet(ex, p2, 2 * y, a)[0][0], D[0][0], 1e-12); close(M.hicksSet(ex, p2, V, a)[0][1], H[0][1], 1e-12);
  checks += 4;
  // The indifference curve U = v passes through D and stays at utility v.
  for (const q of M.curve(ex, V, a, 3 * Math.max(y / p[0], y / p[1]))) if (q[1] !== null && q[1] > 0 && q[0] > 0) { close(M.utility(ex, q, a), V, 1e-9, 'curve ' + label); checks++; }
}

// ln x1 + x2 switches regime at y = p2 without a jump in D, V, C or their derivatives.
{
  const p = [1, 2], e = 1e-9;
  for (const f of [(y) => M.demandSet('quasilin', p, y)[0][0], (y) => M.indirect('quasilin', p, y), (y) => M.indirectGrad('quasilin', p, y).p[0], (y) => M.indirectGrad('quasilin', p, y).y]) {
    close(f(2 - e), f(2 + e), 1e-6, 'quasilin continuous'); checks++;
  }
  const v = Math.log(2);
  close(M.expenditure('quasilin', p, v - e), M.expenditure('quasilin', p, v + e), 1e-6); close(M.expenditureGrad('quasilin', p, v - e)[0], M.expenditureGrad('quasilin', p, v + e)[0], 1e-6);
  checks += 2;
}
// The numbers of the lecture's slides: sqrt(x1 x2) at p = (1, 2), y = 8; Cobb-Douglas with a = 1/3, p = (1, 1), y = 3 gives (1, 2).
{
  close(M.indirect('sqrt', [1, 2], 8), 2 * Math.SQRT2, 1e-12); close(M.demandSet('sqrt', [1, 2], 8)[0][0], 4, 1e-12);
  const D = M.demandSet('cd', [1, 1], 3, 1 / 3)[0]; close(D[0], 1, 1e-12); close(D[1], 2, 1e-12);
  close(M.priceIndex([1, 1], 0.5), 2, 1e-12);
  checks += 5;
}
console.log(`All ${checks} duality-square checks passed.`);
