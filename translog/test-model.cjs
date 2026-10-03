// Checks the translog formulas of lecture 4 (section 3 and the Appendix) against independent calculations.
// Run with:  node translog/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

// A CES unit cost with n inputs (independent of firm-model) and its exact shares.
const cesCost = (d, sg) => w => Math.pow(w.reduce((s, wi, i) => s + Math.pow(d[i], sg) * Math.pow(wi, 1 - sg), 0), 1 / (1 - sg));
const cesShares = (d, sg, w) => { const t = w.map((wi, i) => Math.pow(d[i], sg) * Math.pow(wi, 1 - sg)), S = t.reduce((a, b) => a + b, 0); return t.map(x => x / S); };

// 1. (&): the shares are the log-derivatives of the translog unit cost (symmetric beta).
for (const seed of [1, 2, 3, 4, 5]) {
  let x = seed; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  const n = 2 + seed % 3, alpha = Array.from({ length: n }, () => rnd()), beta = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) beta[i][j] = beta[j][i] = rnd() - 0.5;
  const P = { a0: rnd(), alpha, beta };
  for (let r = 0; r < 5; r++) {
    const w = Array.from({ length: n }, () => Math.exp(2 * rnd() - 1)), sh = M.shares(P, w);
    for (let i = 0; i < n; i++) {
      const up = w.slice(), dn = w.slice(), h = 1e-5; up[i] *= Math.exp(h); dn[i] *= Math.exp(-h);
      close(sh[i], (M.logUnitCost(P, up) - M.logUnitCost(P, dn)) / (2 * h), 1e-8, 'shares = dlog c/dlog w');
      checks++;
    }
  }
}

// 2. The second-order approximation of a CES unit cost around wbar.
for (const sg of [0.2, 0.5, 1.6, 3]) for (const d of [[0.5, 0.5], [0.3, 0.7], [0.2, 0.3, 0.5]]) for (const wbar of [d.map(() => 1), d.map((_, i) => 0.5 + i)]) {
  const f = cesCost(d, sg), P = M.translogFromUnitCost(f, wbar), n = d.length, sh = cesShares(d, sg, wbar);
  const label = JSON.stringify({ sg, d, wbar });
  // beta_ij = d sh_i / d log w_j = (1 - sigma) sh_i (delta_ij - sh_j); for two inputs beta_11 = (1 - sigma) sh_1 sh_2.
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { close(P.beta[i][j], (1 - sg) * sh[i] * ((i === j) - sh[j]), 1e-6, 'beta ' + label); checks++; }
  if (n === 2) { close(P.beta[0][0], (1 - sg) * sh[0] * sh[1], 1e-6); checks++; }
  // Exact agreement at the reference: value, shares, (%) eps_ii = -sigma (1 - sh_i), (#) eps_ij = sigma sh_j, ($) sigma_ij = sigma.
  close(M.logUnitCost(P, wbar), Math.log(f(wbar)), 1e-9, 'value at reference ' + label);
  const e = M.elasticities(P, wbar);
  for (let i = 0; i < n; i++) {
    close(e.sh[i], sh[i], 1e-7, 'share at reference ' + label);
    for (let j = 0; j < n; j++) {
      close(e.eps[i][j], i === j ? -sg * (1 - sh[i]) : sg * sh[j], 1e-5, 'elasticity ' + label);
      if (i !== j) close(e.sigma[i][j], sg, 1e-5, 'sigma_ij ' + label);
      checks += 2;
    }
  }
  // Theory holds for the approximation of a true cost function: restrictions 1-4.
  const R = M.checkRestrictions(P, Math.log(1.5), 1e-6, n === 2 ? 21 : 7);
  assert.ok(R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok, 'restrictions 1-3 ' + label);
  checks += 2;
  // The error is (at least) third order: halving the distance cuts it by about 8 (16 where the cubic term
  // vanishes, as at a symmetric reference).
  const dir = d.map((_, i) => (i % 2 ? -0.7 : 1));
  const err = t => { const w = wbar.map((wi, i) => wi * Math.exp(t * dir[i])); return Math.abs(M.logUnitCost(P, w) - Math.log(f(w))); };
  if (Math.abs(sg - 1) > 1e-9 && err(0.04) > 1e-8) { const ratio = err(0.04) / err(0.02); assert.ok(ratio > 6.5 && ratio < 17, `third order ${ratio} ` + label); checks++; }
}

// 2b. The same for the two-input CES of shared/firm-model.js that the page uses.
{
  const s = { tech: 'ces', delta: 0.4, rho: -1, profile: 'homog', A: 1, k: 1 }, f = w => FM.unitCost(w, s);
  const P = M.translogFromUnitCost(f, [1.3, 0.8]), sh = cesShares([0.4, 0.6], 0.5, [1.3, 0.8]);
  close(P.beta[0][0], 0.5 * sh[0] * sh[1], 1e-6); close(M.elasticities(P, [1.3, 0.8]).sigma[0][1], 0.5, 1e-5);
  checks += 2;
}

// 3. Cobb-Douglas: beta = 0, so the shares are constant, eps_ii = sh_i - 1 and sigma_ij = 1.
{
  const P = { a0: 0, alpha: [0.3, 0.7], beta: [[0, 0], [0, 0]] }, e = M.elasticities(P, [2, 0.5]);
  close(e.eps[0][0], -0.7, 1e-12); close(e.eps[0][1], 0.7, 1e-12); close(e.sigma[0][1], 1, 1e-12);
  const R = M.checkRestrictions(P);
  assert.ok(R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok && R.negativeOwn.ok);
  checks += 4;
}

// 4. Violated restrictions are detected.
{
  const ok = { a0: 0, alpha: [0.4, 0.6], beta: [[0.1, -0.1], [-0.1, 0.1]] };
  let R = M.checkRestrictions(ok);
  assert.ok(R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok && R.negativeOwn.ok, 'all hold');
  R = M.checkRestrictions({ ...ok, alpha: [0.5, 0.6] });
  assert.ok(!R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok, 'adding up');
  R = M.checkRestrictions({ ...ok, beta: [[0.1, -0.05], [-0.1, 0.1]] });
  assert.ok(!R.homogeneity.ok && !R.symmetry.ok && !R.addingUp.ok, 'homogeneity, symmetry');
  R = M.checkRestrictions({ ...ok, beta: [[0.1, -0.1], [-0.1, 0.15]] });
  assert.ok(R.addingUp.ok === false && !R.homogeneity.ok && R.symmetry.ok, 'row sums only');
  // A large positive beta_11 makes the own-price elasticity positive (sh_1 = 0.4: (0.3 - 0.4 + 0.16) / 0.4 > 0).
  R = M.checkRestrictions({ ...ok, beta: [[0.3, -0.3], [-0.3, 0.3]] });
  assert.ok(R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok && !R.negativeOwn.ok, 'own-price sign');
  // ... and a share that turns negative within the price range is reported.
  assert.ok(!R.negativeOwn.sharesPositive);
  // (%) at a point, by hand.
  close(M.elasticities(ok, [1, 1]).eps[0][0], (0.1 - 0.4 + 0.16) / 0.4, 1e-12);
  checks += 7;
}

// 5. The notes' two Leontief firms: outputs 10, 10 -> 5, 15 move energy 30 -> 25 and capital 30 -> 35.
{
  const a = M.aggregate(10, 10), b = M.aggregate(5, 15);
  assert.deepEqual([a.firmE.E, a.firmE.K, a.firmK.E, a.firmK.K], [20, 10, 10, 20]);
  assert.deepEqual([b.firmE.E, b.firmE.K, b.firmK.E, b.firmK.K], [10, 5, 15, 30]);
  assert.deepEqual([a.E, a.K, b.E, b.K], [30, 30, 25, 35]);
  // Within each firm the input ratio does not change: no substitution.
  assert.equal(a.firmE.E / a.firmE.K, b.firmE.E / b.firmE.K); assert.equal(a.firmK.E / a.firmK.K, b.firmK.E / b.firmK.K);
  checks += 5;
}

// 6. Arnberg and Bjørner (2007) as transcribed: restrictions 1-3 hold up to the rounding of the table, and the
//    own-price elasticities are negative.
{
  const AB = M.ARNBERG_BJORNER, R = M.checkRestrictions({ a0: 0, alpha: AB.alpha, beta: AB.beta }, 0.1, 0.0015, 3);
  assert.ok(R.addingUp.ok && R.homogeneity.ok && R.symmetry.ok, 'table restrictions');
  close(AB.alpha.reduce((a, b) => a + b, 0), 1, 1e-12);
  for (let i = 0; i < 4; i++) assert.ok(AB.eps[i][i] < 0);
  assert.deepEqual(AB.eps.map((r, i) => r[i]), [-0.214, -0.450, -0.082, -0.453]);
  checks += 7;
}

console.log(`All ${checks} translog checks passed.`);
