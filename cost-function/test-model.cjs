// Checks the Cost Function tool math (cost-function/SPEC.md, tests i-vii).
// Run with:  node cost-function/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const base = { rho: 0, profile: 'homog', A: 1, k: 1, a: 2, m: 1 };
const smooth = [];
for (const delta of [0.2, 0.5, 0.8]) for (const A of [0.7, 1.6]) for (const k of [0.6, 1, 1.4]) {
  smooth.push({ ...base, tech: 'cobb', delta, A, k });
  for (const rho of [-3, -0.5, 0.4]) smooth.push({ ...base, tech: 'ces', delta, rho, A, k });
}
const prices = [[1, 2], [0.4, 3], [2.5, 0.8], [1, 1]];

// (i) Cobb-Douglas closed form of the price effects.
for (const s of smooth.filter(s => s.tech === 'cobb')) {
  for (const w of prices) for (const q of [0.5, 2, 3.7]) {
    const P = M.priceEffects(w, q, s), d = s.delta, c = FM.unitCost(w, s), G = FM.G(q, s);
    close(P[0][0], -d * (1 - d) * c * G / (w[0] * w[0]), 1e-5, 'dH1/dw1');
    close(P[0][1], d * (1 - d) * c * G / (w[0] * w[1]), 1e-5, 'dH1/dw2');
    close(P[1][0], d * (1 - d) * c * G / (w[0] * w[1]), 1e-5, 'dH2/dw1');
    checks += 3;
  }
}

// (ii) symmetry, (iii) [dH/dw^t] w = 0, (iv) non-positive diagonal; (v) Shephard's lemma.
for (const s of smooth) {
  for (const w of prices) for (const q of [0.5, 2, 3.7]) {
    const P = M.priceEffects(w, q, s), scale = Math.max(1, Math.abs(P[0][0]), Math.abs(P[1][1]));
    assert.ok(Math.abs(P[0][1] - P[1][0]) <= 1e-5 * scale, 'symmetric ' + JSON.stringify(s));
    const v = M.timesPrices(P, w);
    assert.ok(Math.abs(v[0]) <= 1e-5 * scale * Math.max(...w) && Math.abs(v[1]) <= 1e-5 * scale * Math.max(...w), 'Euler');
    assert.ok(P[0][0] <= 1e-9 && P[1][1] <= 1e-9, 'diagonal');
    const H = FM.condDemand(w, q, s).H;
    for (let j = 0; j < 2; j++) {
      const h = 1e-6 * w[j], up = w.slice(), dn = w.slice();
      up[j] += h; dn[j] -= h;
      close((FM.cost(up, q, s) - FM.cost(dn, q, s)) / (2 * h), H[j], 1e-5, 'Shephard');
    }
    checks += 5;
  }
}

// (vi) concavity: C(w, q) never exceeds the cost of keeping the inputs at H(wbar, q) (all four technologies).
for (const tech of ['cobb', 'ces', 'linear', 'leontief']) {
  for (const delta of [0.3, 0.5, 0.7]) {
    const s = { ...base, tech, delta, rho: tech === 'ces' ? -0.5 : 0, k: 0.8 };
    for (const wbar of prices) {
      const zbar = FM.condDemand(wbar, 2, s).H;
      for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
        const w = [0.2 + 4.8 * i / 40, 0.2 + 4.8 * j / 40];
        assert.ok(FM.cost(w, 2, s) <= M.fixedInputCost(w, zbar) * (1 + 1e-12) + 1e-12, `concavity ${tech}`);
        checks++;
      }
      // ... and touches it at wbar (Shephard's lemma: same value).
      close(FM.cost(wbar, 2, s), M.fixedInputCost(wbar, zbar), 1e-12, 'touch');
      checks++;
    }
  }
}

// (vii) C(alpha w, q) = alpha C(w, q) and H(alpha w, q) = H(w, q).
for (const s of smooth) for (const w of prices) for (const alpha of [0.25, 1.7, 3]) {
  const aw = [alpha * w[0], alpha * w[1]];
  close(FM.cost(aw, 2, s), alpha * FM.cost(w, 2, s), 1e-12, 'C3');
  const H = FM.condDemand(w, 2, s).H, Ha = FM.condDemand(aw, 2, s).H;
  close(Ha[0], H[0], 1e-12, 'H3'); close(Ha[1], H[1], 1e-12, 'H3');
  checks += 3;
}

// The cost curve in w1 and the switch price of the linear technology.
{
  const s = { ...base, tech: 'cobb', delta: 0.5 }, pts = M.costCurveInW1(2, 2, s, [0.2, 5], 50);
  assert.equal(pts.length, 50);
  pts.forEach(([w1, C]) => close(C, FM.cost([w1, 2], 2, s), 1e-12));
  const lin = { ...base, tech: 'linear', delta: 0.3 }, ws = M.linearSwitchW1(2, lin);
  close(ws / 0.3, 2 / 0.7, 1e-12);
  checks += 52;
}

// Defaults of the page (SPEC): Cobb-Douglas delta = 0.5, A = k = 1, wbar = (1, 2), q = 2.
{
  const s = { ...base, tech: 'cobb', delta: 0.5 }, w = [1, 2];
  close(FM.cost(w, 2, s), 4 * Math.SQRT2, 1e-9);
  const H = FM.condDemand(w, 2, s).H;
  close(H[0], 2 * Math.SQRT2, 1e-9); close(H[1], Math.SQRT2, 1e-9);
  close(FM.MC(w, 2, s), 2 * Math.SQRT2, 1e-9);
  const P = M.priceEffects(w, 2, s);
  close(P[0][0], -1.4142, 1e-4); close(P[0][1], 0.7071, 1e-4); close(P[1][0], 0.7071, 1e-4); close(P[1][1], -0.35355, 1e-4);
  close(FM.cost([2, 2], 2, s), 8, 1e-9);
  close(M.fixedInputCost([2, 2], H), 8.4853, 1e-4);
  checks += 10;
}

console.log(`All ${checks} cost-function checks passed.`);
