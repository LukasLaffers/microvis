// Checks the Engel-curve tool (lecture 6). Run with:  node engel-curves/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

// The notes' panels: A homothetic (CES): a ray, eta = 1; B good 2 a luxury (Stone-Geary, subsistence in good 1);
// C good 1 inferior (the Giffen example).
const A = { type: 'ces', delta: 0.5, rho: -1 }, B = { type: 'stonegeary', a: 0.4, g1: 3, g2: 0 }, C = { type: 'giffen', c: 1, s: 4 };
const p = [1, 1];
{
  const path = M.expansionPath(p, A, [2, 5, 10, 20]);
  path.forEach(x => close(x[1] / x[0], path[0][1] / path[0][0], 1e-12, 'ray'));
  const e = CM.elasticities(p, 10, A); close(e.eta[0], 1, 1e-6); close(e.eta[1], 1, 1e-6);
  assert.equal(M.kind(e.eta[0]), 'unit elastic');
  checks += 7;
}
{
  for (const y of [5, 8, 15]) {
    const e = CM.elasticities(p, y, B);
    assert.ok(e.eta[1] > 1 && e.eta[0] > 0 && e.eta[0] < 1, 'B: good 2 luxury, good 1 necessity');
    close(e.eta[1], y / (y - 3), 1e-5, 'eta2 for Stone-Geary with g2 = 0');
    assert.equal(M.kind(e.eta[1]), 'luxury'); assert.equal(M.kind(e.eta[0]), 'necessity');
    checks += 4;
  }
}
{
  const [lo, hi] = M.incomeRange(p, C);
  close(lo, 3, 1e-5); close(hi, 5, 1e-5);
  const curve = M.engelCurves(p, C, [3.2, 4, 4.8]);
  assert.ok(curve[1][1] < curve[0][1] && curve[2][1] < curve[1][1], 'C: good 1 inferior');
  assert.equal(M.kind(CM.elasticities(p, 4, C).eta[0]), 'inferior');
  checks += 4;
}
// Engel, Cournot and homogeneity for all three, over their income ranges.
for (const u of [A, B, C, { type: 'ces', delta: 0.3, rho: 0.5 }, { type: 'quasilinear', kappa: 4 }]) for (const q of [[1, 1], [1.5, 0.8]]) {
  const [lo, hi] = M.incomeRange(q, u);
  for (const t of [0.2, 0.5, 0.8]) {
    const y = lo + t * (hi - lo), c = M.conditions(q, y, u), x = CM.demand(q, y, u);
    if (!(x[0] > 1e-6 && x[1] > 1e-6)) continue;
    close(c.engel, 1, 1e-6, 'Engel ' + JSON.stringify(u));
    c.cournot.forEach(v => close(v, 0, 1e-6, 'Cournot')); c.homogeneity.forEach(v => close(v, 0, 1e-6, 'homogeneity'));
    checks += 5;
  }
}
console.log(`All ${checks} Engel-curve checks passed.`);
