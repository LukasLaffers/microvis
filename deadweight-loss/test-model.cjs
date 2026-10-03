// Checks the deadweight loss of a commodity tax (lecture 7). Run with:  node deadweight-loss/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const prefs = [{ type: 'ces', delta: 0.5, rho: -1 }, { type: 'ces', delta: 0.3, rho: 0.5 }, { type: 'stonegeary', a: 0.4, g1: 1, g2: 1 }, { type: 'quasilinear', kappa: 6 }];
for (const u of prefs) for (const tau of [0.05, 0.25, 0.6]) {
  const p10 = 1, p11 = p10 * (1 + tau), r = M.tax(p10, p11, 1, 12, u), label = JSON.stringify({ u, tau });
  // |EV| is the area left of H^1(., v^1) between the prices, and it exceeds the revenue: DWL > 0.
  close(CM.integrateP1(q => CM.hicks([q, 1], r.v1, u)[0], p10, p11, 100), r.lossEV, 1e-6, 'area ' + label);
  assert.ok(r.DWL > 0, 'DWL > 0 ' + label);
  checks += 2;
}
// The approximations become exact as the tax shrinks (second order).
for (const u of prefs) {
  const a = M.tax(1, 1.02, 1, 12, u), b = M.tax(1, 1.01, 1, 12, u);
  assert.ok(Math.abs(a.DWL / a.approx - 1) < 0.05 && Math.abs(b.DWL / b.approx - 1) < 0.03, 'DWL ~ -(1/2) dH/dp t^2');
  assert.ok(Math.abs(b.ratio / b.ratioApprox - 1) < 0.03, 'DWL/T ~ -(1/2) eps^c tau/(1+tau)');
  // DWL grows like the square of the tax.
  close(a.DWL / b.DWL, 4, 0.05);
  checks += 3;
}
// The notes' example: a 14 % value added tax gives (p1 - p0)/p1 = 0.123.
close(0.14 / 1.14, 0.123, 1e-3); checks++;
// The table: DWL/T reproduced by -(1/2) eps^c x effective tax rate up to the rounding of the table. (The estimated
// elasticities need not satisfy the own-price Slutsky equation exactly, so that is not checked.)
for (const g of M.GROUPS) {
  assert.ok(Math.abs(g.approx - g.dwlT) <= 0.006, `DWL/T ${g.name} ${g.approx} vs ${g.dwlT}`);
  checks++;
}
close(M.GROUPS.reduce((s, g) => s + g.b, 0), 1, 1e-9, 'budget shares sum to 1');
close(M.GROUPS.reduce((s, g) => s + g.b * g.eta, 0), 1, 0.01, 'Engel: sum b eta = 1');
checks += 2;
// Defaults of the page: CES delta = 0.5, rho = -1, p1^0 = 1, tau = 25 %, y = 12.
{
  const r = M.tax(1, 1.25, 1, 12, { type: 'ces', delta: 0.5, rho: -1 });
  assert.ok(r.DWL > 0 && r.T > 0);
  checks++;
}
console.log(`All ${checks} deadweight-loss checks passed.`);
