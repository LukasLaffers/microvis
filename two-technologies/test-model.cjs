// Checks the kinked-technology model against brute-force cost minimisation and the 2022 exercise.
// Run with:  node two-technologies/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

let checks = 0;
const close = (a, b, tol, msg) => { assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`); checks++; };

// Brute force: on a fine grid of z1, the least z2 that reaches q (bisection), and the cheapest such bundle.
function brute(w, q, s, firm) {
  let best = { C: Infinity };
  const zk = Math.pow(q, 1 / (s.alpha + s.beta));
  for (let i = 1; i <= 6000; i++) {
    const z1 = zk * 6 * i / 6000;
    let lo = 0, hi = 100 * zk;
    if (M.phi([z1, hi], s, firm) < q) continue;
    for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; M.phi([z1, m], s, firm) >= q ? hi = m : lo = m; }
    const c = w[0] * z1 + w[1] * hi;
    if (c < best.C) best = { C: c, H: [z1, hi] };
  }
  return best;
}

const params = [M.EXERCISE, { alpha: 0.5, beta: 0.3 }, { alpha: 0.7, beta: 0.1 }];
for (const s of params) for (const firm of ['D', 'C']) for (const w1 of [0.1, 0.25, 0.5, 0.9, 1.15, 2, 4, 6, 9]) for (const q of [0.6, 1, 1.7]) {
  const w = [w1, 1], r = M.costMin(w, q, s, firm), b = brute(w, q, s, firm), label = JSON.stringify({ s, firm, w1, q });
  close(r.C, b.C, 2e-3, 'cost ' + label);
  close(M.phi(r.H, s, firm), q, 1e-9, 'bundle produces q ' + label);
  assert.ok(r.C <= b.C + 1e-9, 'no cheaper bundle ' + label); checks++;
}

// Firm D: at the kink for beta/alpha <= w1/w2 <= alpha/beta, on technology A above, B below.
for (const s of params) {
  const [lo, hi] = M.kinkRange(s);
  for (const w1 of [lo * 1.001, Math.sqrt(lo * hi), hi * 0.999]) { const r = M.costMin([w1, 1], 1, s, 'D'); assert.equal(r.regime, 'kink'); close(r.H[0], 1, 1e-12, 'kink'); }
  assert.equal(M.costMin([hi * 1.01, 1], 1, s, 'D').regime, 'A');
  assert.equal(M.costMin([lo * 0.99, 1], 1, s, 'D').regime, 'B');
  checks += 2;
  // Shephard's lemma: H1 = dC/dw1, inside and outside the kink range; C(w, q) = c(w) q^(1/k).
  for (const w1 of [lo * 0.5, Math.sqrt(lo * hi), hi * 2]) for (const firm of ['D', 'C']) {
    if (firm === 'C' && Math.abs(w1 - 1) < 0.05) continue;
    const h = 1e-6, q = 1.3, dC = (M.costMin([w1 + h, 1], q, s, firm).C - M.costMin([w1 - h, 1], q, s, firm).C) / (2 * h);
    close(dC, M.costMin([w1, 1], q, s, firm).H[0], 1e-5, 'Shephard');
    close(M.costMin([w1, 1], q, s, firm).C, M.unitCost([w1, 1], s, firm) * Math.pow(q, 1 / (s.alpha + s.beta)), 1e-12, 'C = c q^(1/k)');
  }
  // Supply maximises profit (grid search).
  for (const firm of ['D', 'C']) {
    const w = [0.8, 1], p = 2.3, q = M.supply(w, p, s, firm), prof = x => p * x - M.costMin(w, x, s, firm).C;
    let best = -Infinity; for (let i = 1; i <= 20000; i++) best = Math.max(best, prof(q * 3 * i / 20000));
    assert.ok(best <= prof(q) + 1e-9, 'supply maximises profit'); checks++;
    close(M.supply(w, M.priceFor(w, 1.4, s, firm), s, firm), 1.4, 1e-9, 'priceFor');
  }
  // Decomposition adds up; inside the kink range there is no substitution effect.
  for (const w1 of [lo * 0.6, Math.sqrt(lo * hi), hi * 1.7]) {
    const w = [w1, 1], d = M.decompose(w, M.priceFor(w, 1, s), s, 'D');
    close(d.substitution + d.scale, d.total, 1e-5, 'adds up');
    close(d.scale, -d.dHdq * d.dHdq / d.Cqq, 1e-4, 'scale = -(dH1/dq)^2 / C_qq');
    if (w1 > lo && w1 < hi) close(d.substitution, 0, 1e-9, 'no substitution at the kink');
  }
}

// Firm C is not quasi-concave: the exercise's counterexample, and its cheapest bundle jumps at w1 = w2.
{
  const s = M.EXERCISE;
  close(M.phi([0.9, 1.036], s, 'C'), 1, 2e-3, 'z on the isoquant'); close(M.phi([1.1, 0.751], s, 'C'), 1, 2e-3, "z' on the isoquant");
  assert.ok(M.phi([1, 0.8935], s, 'C') < 0.98); checks++;
  const a = M.costMin([0.99, 1], 1, s, 'C').H[0], b = M.costMin([1.01, 1], 1, s, 'C').H[0];
  assert.ok(a - b > 0.8, 'H1 jumps at w1 = w2'); checks++;
}

// The 2022 exercise (q = 1, w2 = 1): costs, prices and the decompositions at w1 = 0.25 and w1 = 6.
{
  const s = M.EXERCISE;
  close(M.costMin([0.25, 1], 1, s).C, 1.755 * Math.pow(0.25, 0.25), 1e-3, 'C at 0.25');
  close(M.costMin([6, 1], 1, s).C, 1.755 * Math.pow(6, 0.75), 1e-3, 'C at 6');
  close(M.costMin([0.25, 1], 1, s).H[0], 1.2416, 1e-3, 'H1 at 0.25');
  close(M.priceFor([0.25, 1], 1, s), 1.551, 1e-3, 'p triangle');
  close(M.priceFor([6, 1], 1, s), 8.41, 1e-3, 'p hash');
  const d1 = M.decompose([0.25, 1], M.priceFor([0.25, 1], 1, s), s);
  close(d1.total, -9.94, 2e-3, 'total at 0.25'); close(d1.substitution, -3.725, 2e-3, 'sub at 0.25'); close(d1.Cqq, 0.388, 2e-3, 'Cqq at 0.25');
  const d2 = M.decompose([6, 1], M.priceFor([6, 1], 1, s), s);
  close(d2.total, -0.561, 2e-3, 'total at 6'); close(d2.substitution, -0.035, 2e-2, 'sub at 6'); close(d2.Cqq, 2.102, 2e-3, 'Cqq at 6');
}

// Points of the isoquants lie on them.
for (const which of ['A', 'B', 'C', 'D']) for (const z1 of [0.5, 0.9, 1, 1.4]) {
  const s = M.EXERCISE, q = 1.2, z = [z1, M.z2On(q, s, which, z1)];
  close(which === 'A' ? M.phiA(z, s) : which === 'B' ? M.phiB(z, s) : M.phi(z, s, which), q, 1e-12, 'on the isoquant ' + which);
}

console.log(`All ${checks} kink checks passed.`);
