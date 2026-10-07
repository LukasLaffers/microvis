// Checks the Slutsky tool (lecture 6). Run with:  node slutsky/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const cases = [
  [{ type: 'ces', delta: 0.5, rho: -1 }, [2, 1], 10, 1], [{ type: 'ces', delta: 0.3, rho: 0.6 }, [1, 1.5], 12, 1.6],
  [{ type: 'stonegeary', a: 0.4, g1: 1, g2: 1 }, [2, 1], 12, 1.2],
  [{ type: 'giffen', c: 1, s: 4 }, [2.5, 1], 5, 2], [{ type: 'giffen', c: 1, s: 4 }, [2.5, 1], 5, 1.5], [{ type: 'giffen', c: 1, s: 4 }, [1.6, 1], 3.8, 1.2]
];
for (const [u, p, y, p1n] of cases) {
  const d = M.decompose(p, y, u, p1n), label = JSON.stringify({ u, p, y, p1n }), pn = [p1n, p[1]];
  // The pieces add up; E2 is on the old indifference curve, tangent to a line with the new prices; E3 on the new budget.
  for (const j of [0, 1]) close(d.substitution[j] + d.income[j], d.total[j], 1e-12, 'adds up ' + label);
  close(CM.utility(d.E2, u), d.v0, 1e-8, 'E2 on v0 ' + label);
  if (d.E2[0] > 1e-6 && d.E2[1] > 1e-6) { close(CM.mrs21(d.E2, u), pn[0] / pn[1], 1e-5, 'E2 tangency ' + label); checks++; }   // E2 can be a corner
  close(pn[0] * d.E3[0] + pn[1] * d.E3[1], y, 1e-12, 'E3 on the new budget');
  // A price fall: the substitution effect raises the demand for good 1 (negative own substitution effect).
  if (p1n < p[0]) assert.ok(d.substitution[0] > 0, 'substitution ' + label);
  // Compensated income is below y when the price falls (the consumer could be as happy with less).
  if (p1n < p[0]) assert.ok(d.yc < y);
  // Marginal Slutsky and the own-price elasticity form at the starting point.
  const s = CM.slutsky(p, y, u, 0, 0), e = CM.elasticities(p, y, u);
  close(s.total, s.substitution + s.income, 2e-5, 'Slutsky ' + label);
  close(e.eu[0][0], e.ec[0][0] - e.eta[0] * e.b[0], 1e-5, 'elasticity form ' + label);
  checks += 9;
}
// Classification: CES normal; the Giffen example at y > p2 s is Giffen (E3 has less good 1 after a price fall),
// at y < p2 s inferior but not Giffen.
{
  assert.equal(M.classify([2, 1], 10, { type: 'ces', delta: 0.5, rho: -1 }).kind, 'normal');
  const g = { type: 'giffen', c: 1, s: 4 };
  assert.equal(M.classify([2.5, 1], 5, g).kind, 'giffen');
  const d = M.decompose([2.5, 1], 5, g, 2);
  assert.ok(d.E3[0] < d.E1[0] && d.income[0] < -d.substitution[0], 'income effect outweighs substitution');
  close(d.E1[0], 2 - 1 / 2.5, 1e-12); close(d.E3[0], 2 - 1 / 2, 1e-12);
  assert.ok(d.E2[1] > 0, 'E2 interior for the page default');
  assert.equal(M.classify([1.6, 1], 3.8, g).kind, 'inferior');
  // Marshallian curve slopes up for the Giffen case.
  const mc = M.marshallCurve(1, 5, g, [1.5, 2, 2.5]);
  assert.ok(mc[1][0] > mc[0][0] && mc[2][0] > mc[1][0]);
  checks += 8;
}
// Defaults: CES delta = 0.5, rho = -1, p = (2, 1), y = 10, p1 falls to 1.
{
  const d = M.decompose([2, 1], 10, { type: 'ces', delta: 0.5, rho: -1 }, 1);
  // sigma = 0.5, delta = 0.5: x1/x2 = (p2/p1)^0.5.
  close(d.E1[0] / d.E1[1], Math.sqrt(0.5), 1e-12); close(d.E3[0], 10 / 2, 1e-12);
  checks += 2;
}
// The smooth path: starts at E1, ends at E3, the accumulated parts add up exactly to the total at every step,
// converge as the steps shrink, and equal the integrals of the two terms of (M3) (trapezoid rule on the derivatives).
for (const [u, p, y, p1n] of cases) {
  const label = JSON.stringify({ u, p, y, p1n });
  const P = M.path(p, y, u, p1n, 200), d = M.decompose(p, y, u, p1n), n = P.p1.length - 1;
  for (const i of [0, 1]) { close(P.D[0][i], d.E1[i], 1e-12, 'starts at E1 ' + label); close(P.D[n][i], d.E3[i], 1e-12, 'ends at E3 ' + label); }
  P.D.forEach((x, k) => [0, 1].forEach(i => close(P.substitution[k][i] + P.income[k][i], x[i] - P.D[0][i], 1e-10, 'adds up along the way ' + label)));
  const fine = M.path(p, y, u, p1n, 800);
  for (const i of [0, 1]) close(fine.substitution[800][i], P.substitution[n][i], 1e-4, 'converges ' + label);
  let si = [0, 0], ii = [0, 0];
  const m = 400, h = (p1n - p[0]) / m;
  const terms = x => [0, 1].map(j => CM.slutsky([x, p[1]], y, u, j, 0)).map(s => [s.substitution, s.income]);
  let prev = terms(p[0]);
  for (let k = 1; k <= m; k++) {
    const cur = terms(p[0] + k * h);
    for (const j of [0, 1]) { si[j] += 0.5 * h * (prev[j][0] + cur[j][0]); ii[j] += 0.5 * h * (prev[j][1] + cur[j][1]); }
    prev = cur;
  }
  for (const j of [0, 1]) { close(fine.substitution[800][j], si[j], 2e-3, 'substitution = integral ' + label); close(fine.income[800][j], ii[j], 2e-3, 'income = integral ' + label); }
  // A price fall: the accumulated substitution effect raises the demand for good 1.
  if (p1n < p[0]) assert.ok(P.substitution[n][0] > 0, 'smooth substitution ' + label);
  checks += 4 + 2 * (n + 1) + 6;
}

console.log(`All ${checks} Slutsky checks passed.`);
