// Checks CV, EV and consumer surplus (lecture 7). Run with:  node cv-ev/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const cases = [
  ['normal', { type: 'ces', delta: 0.5, rho: -1 }, 2, 1, 1, 10], ['normal', { type: 'ces', delta: 0.4, rho: 0.5 }, 1.5, 0.8, 1, 12],
  ['normal', { type: 'stonegeary', a: 0.4, g1: 1, g2: 1 }, 2, 1.2, 1, 12],
  ['none', { type: 'quasilinear', kappa: 6 }, 2, 1, 1, 12],
  ['inferior', { type: 'giffen', c: 1, s: 4 }, 1.6, 1.2, 1, 3.8], ['inferior', { type: 'giffen', c: 1, s: 4 }, 1.18, 0.9, 1, 3.96]
];
for (const [kind, u, p10, p11, p2, y] of cases) {
  const w = M.welfare(p10, p11, p2, y, u), label = JSON.stringify(u);
  // Definitions (CVeq) and (EVeq).
  close(CM.indirect([p11, p2], y - w.CV, u), w.v0, 1e-8, 'CVeq ' + label);
  close(CM.indirect([p10, p2], y + w.EV, u), w.v1, 1e-8, 'EVeq ' + label);
  // Areas to the left of the Hicksian curves.
  close(w.CVarea, w.CV, 1e-6, 'CV area ' + label); close(w.EVarea, w.EV, 1e-6, 'EV area ' + label);
  // A price fall makes the consumer better off.
  assert.ok(w.CV > 0 && w.EV > 0 && w.dCS > 0);
  // The ordering.
  if (kind === 'normal') assert.ok(w.CV < w.dCS && w.dCS < w.EV, 'CV < dCS < EV ' + label);
  if (kind === 'inferior') assert.ok(w.EV < w.dCS && w.dCS < w.CV, 'EV < dCS < CV ' + label);
  if (kind === 'none') { close(w.CV, w.EV, 1e-7); close(w.dCS, w.CV, 1e-6); }
  checks += 6;
}
// Quasilinear kappa log(1 + x1) + x2: dCS = kappa p2 log(p10/p11) - p2 (p10 - p11)... computed directly:
// D1 = kappa p2/p1 - 1, so the area is kappa p2 log(p10/p11) - (p10 - p11).
{
  const w = M.welfare(2, 1, 1, 12, { type: 'quasilinear', kappa: 6 });
  close(w.dCS, 6 * Math.log(2) - 1, 1e-8); close(w.CV, 6 * Math.log(2) - 1, 1e-8);
  checks += 2;
}
// The bundles: on the right indifference curves at the right prices.
{
  const u = { type: 'ces', delta: 0.5, rho: -1 }, b = M.bundles(2, 1, 1, 10, u);
  close(CM.utility(b.cvBundle, u), b.v0, 1e-8); close(1 * b.cvBundle[0] + b.cvBundle[1], 10 - b.CV, 1e-7);
  close(CM.utility(b.evBundle, u), b.v1, 1e-8); close(2 * b.evBundle[0] + b.evBundle[1], 10 + b.EV, 1e-7);
  checks += 4;
}
console.log(`All ${checks} welfare checks passed.`);
