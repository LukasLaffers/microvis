// Checks the duality tool of lecture 6. Run with:  node demand-duality/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const prefs = [{ type: 'ces', delta: 0.4, rho: -1 }, { type: 'ces', delta: 0.55, rho: 0.4 }, { type: 'stonegeary', a: 0.4, g1: 1, g2: 0.5 }, { type: 'quasilinear', kappa: 5 }];
for (const u of prefs) for (const p of [[1, 1], [2, 0.8], [0.7, 1.6]]) for (const y of [8, 15]) {
  const v = 0.8 * CM.indirect(p, y, u), I = M.identities(p, y, v, u), E = M.envelope(p, y, v, u), label = JSON.stringify({ u, p, y });
  close(I.C_of_V.lhs, I.C_of_V.rhs, 1e-9, 'C(p,V) ' + label); close(I.V_of_C.lhs, I.V_of_C.rhs, 1e-9, 'V(p,C) ' + label);
  for (const k of [0, 1]) { close(I.D_is_H.lhs[k], I.D_is_H.rhs[k], 1e-7, 'D = H ' + label); close(I.H_is_D.lhs[k], I.H_is_D.rhs[k], 1e-7, 'H = D ' + label); }
  close(E.roy, E.D1, 1e-5, 'Roy ' + label); close(E.shephard, E.H1, 1e-5, 'Shephard ' + label);
  // Kuhn-Tucker at an interior optimum: U_1/p_1 = U_2/p_2 = lambda* = dV/dy.
  const x = CM.demand(p, y, u);
  if (x[0] > 1e-6 && x[1] > 1e-6) { close(E.kkt[0], E.lambda, 1e-5, 'lambda ' + label); close(E.kkt[1], E.lambda, 1e-5); checks += 2; }
  // The two multipliers at the same tangency: lambda*(p, C(p,v)) mu*(p,v) = 1.
  { const Ev = M.envelope(p, CM.expenditure(p, v, u), v, u); close(Ev.lambda * Ev.mu, 1, 1e-5, 'lambda mu ' + label); checks++; }
  // (I2) V falls with p1; (E4) C is concave in p1 and (E2) rises with p1.
  const Vc = M.curveV(p[1], y, u, [0.5, 1, 1.5, 2, 2.5]).map(q => q[1]), Cc = M.curveC(p[1], v, u, [0.5, 1, 1.5, 2, 2.5]).map(q => q[1]);
  for (let i = 1; i < 5; i++) { assert.ok(Vc[i] <= Vc[i - 1] + 1e-12 && Cc[i] >= Cc[i - 1] - 1e-12); }
  for (let i = 1; i < 4; i++) assert.ok(Cc[i + 1] - 2 * Cc[i] + Cc[i - 1] <= 1e-9, 'concave');
  checks += 16;
}
// Defaults of the page: CES delta = 0.4, rho = -1 (sigma = 0.5), p = (1, 1), y = 10.
{
  const u = { type: 'ces', delta: 0.4, rho: -1 }, x = CM.demand([1, 1], 10, u);
  // Shares with sigma = 0.5: x1/x2 = (delta/(1-delta))^sigma (p2/p1)^sigma.
  close(x[0] / x[1], Math.sqrt(0.4 / 0.6), 1e-12); close(x[0] + x[1], 10, 1e-12);
  checks += 2;
}
console.log(`All ${checks} duality checks passed.`);
