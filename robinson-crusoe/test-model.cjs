// Checks Robinson Crusoe's economy (lecture 8). Run with:  node robinson-crusoe/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// phi' and phi'' against finite differences.
for (const tech of [{ type: 'concave', A: 3, beta: 0.5 }, { type: 'concave', A: 5, beta: 0.8 }, { type: 'sshape', A: 40, K: 7, g: 3 }, { type: 'sshape', A: 20, K: 4, g: 2 }]) {
  for (const L of [0.3, 1, 2.5, 5, 8, 12]) {
    const h = 1e-6 * L;
    close(M.dphi(L, tech), (M.phi(L + h, tech) - M.phi(L - h, tech)) / (2 * h), 1e-6, 'phi\'');
    checks++;
  }
}
// S-shape: increasing returns below the inflection point L = K ((g - 1)/(g + 1))^(1/g), decreasing above.
{
  const t = { type: 'sshape', A: 40, K: 7, g: 3 }, Li = 7 * Math.pow(2 / 4, 1 / 3);
  assert.ok(M.d2phi(Li * 0.9, t) > 0 && M.d2phi(Li * 1.1, t) < 0); checks++;
}

// Convex technology: the planner's optimum is decentralised by w/p = MRS.
for (let r = 0; r < 60; r++) {
  const P = { T: 4 + 12 * rnd(), tech: { type: 'concave', A: 1 + 5 * rnd(), beta: 0.2 + 0.7 * rnd() }, u: { type: 'ces', delta: 0.2 + 0.6 * rnd(), rho: (rnd() < 0.5 ? -1 : 1) * (0.1 + 0.7 * rnd()) } };
  const pl = M.planner(P);
  // Brute force planner.
  let best = -Infinity;
  for (let k = 0; k <= 20000; k++) { const L = P.T * k / 20000; best = Math.max(best, CM.utility([P.T - L, M.phi(L, P.tech)], P.u)); }
  assert.ok(pl.v >= best - 1e-9, 'planner optimum');
  // (MRSMRT): MRS = phi'(L*).
  close(pl.omega, pl.mrt, 1e-5, 'MRS = MRT');
  assert.ok(pl.convexHere);
  // (F2) the firm hires L** with phi'(L**) = w/p, and L** = L*; (C1) Robinson's MRS = w/p and x** = x*.
  const d = M.decentralise(P, pl.omega);
  close(d.firm.L, pl.L, 1e-6, 'L** = L*'); close(M.dphi(d.firm.L, P.tech), pl.omega, 1e-6, '(F2)');
  close(d.x[0], pl.x[0], 1e-6, 'x1** = x1*'); close(d.x[1], pl.x[1], 1e-6, 'x2** = x2*');
  // Markets clear; budget (C2) holds with equality: omega x1 + x2 = omega T + pi.
  close(d.excessLabour, 0, 1e-6); close(d.excessCoconuts, 0, 1e-6);
  close(pl.omega * d.x[0] + d.x[1], pl.omega * P.T + d.firm.profit, 1e-9, '(C2)');
  // Walras' law at any price: omega (labour demand - supply) + (coconut demand - supply) = 0.
  const om = pl.omega * Math.exp(rnd() - 0.5), dd = M.decentralise(P, om);
  if (dd.x[0] < P.T) { close(om * dd.excessLabour + dd.excessCoconuts, 0, 1e-8, 'Walras'); checks++; }
  // Opening the economy: trade at any world price never hurts.
  assert.ok(dd.v >= pl.v - 1e-9, 'gains from trade');
  checks += 11;
}

// Non-convex technology: the optimum on the increasing-returns part cannot be decentralised.
{
  const P = { T: 10, tech: { type: 'sshape', A: 40, K: 7, g: 3 }, u: { type: 'ces', delta: 0.9, rho: -0.5 } };
  const pl = M.planner(P), d = M.decentralise(P, pl.omega);
  close(pl.omega, pl.mrt, 1e-5, 'MRS = MRT still holds');
  assert.ok(!pl.convexHere, 'phi convex at L*');
  assert.ok(Math.abs(d.firm.L - pl.L) > 3, 'the firm does not choose L*');
  // At L* the firm's profit is a local minimum along phi, so any profit maximiser leaves it.
  const f = L => M.phi(L, P.tech) - pl.omega * L;
  assert.ok(f(pl.L + 0.1) > f(pl.L) && f(pl.L - 0.1) > f(pl.L));
  assert.ok(Math.abs(d.excessLabour) > 1e-3, 'markets do not clear');
  // Trade at the planner's shadow price makes Robinson better off than the autarky optimum ("trade convexifies").
  assert.ok(d.v > pl.v);
  checks += 6;
}
// A non-convex technology with the optimum on the concave part of phi: decentralisation works if the price line
// supports Q globally (the firm makes a profit at L*), and fails if the firm would rather shut down.
{
  const P = { T: 10, tech: { type: 'sshape', A: 40, K: 4, g: 3 }, u: { type: 'ces', delta: 0.1, rho: -1 } };
  const pl = M.planner(P), d = M.decentralise(P, pl.omega);
  assert.ok(pl.convexHere && M.phi(pl.L, P.tech) - pl.omega * pl.L > 0);
  close(d.firm.L, pl.L, 1e-6); close(d.x[0], pl.x[0], 1e-6);
  const Q = { ...P, u: { type: 'ces', delta: 0.3, rho: -1 } }, ql = M.planner(Q), e = M.decentralise(Q, ql.omega);
  assert.ok(ql.convexHere && M.phi(ql.L, Q.tech) - ql.omega * ql.L < 0, 'loss at L*');
  assert.equal(e.firm.L, 0, 'the firm shuts down');
  checks += 5;
}
console.log(`All ${checks} Robinson Crusoe checks passed.`);
