// Checks the exchange economy (lecture 9): Walras' law and homogeneity of excess demand, equilibria (market
// clearing, on the contract curve, in the core), the contract curve against a brute-force Pareto search, the core
// boundaries, the second welfare theorem, and the replica blocking coalitions (feasible, improving, core shrinking).
// Run with:  node shared/test-exchange-model.cjs
const assert = require('node:assert/strict');
const CM = require('./consumer-model.js');
const X = require('./exchange-model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const economies = [
  { ua: { type: 'ces', delta: 0.6, rho: -1 }, ub: { type: 'ces', delta: 0.35, rho: 0.3 }, Omega: [10, 10], Ra: [8, 2] },
  { ua: { type: 'ces', delta: 0.5, rho: -0.5 }, ub: { type: 'ces', delta: 0.5, rho: -0.5 }, Omega: [10, 8], Ra: [2, 6] },
  { ua: { type: 'ces', delta: 0.95, rho: -6 }, ub: { type: 'ces', delta: 0.05, rho: -6 }, Omega: [10, 10], Ra: [9.5, 0.5] },
  { ua: { type: 'ces', delta: 0.3, rho: 0.6 }, ub: { type: 'ces', delta: 0.7, rho: -3 }, Omega: [12, 9], Ra: [3, 7] }
];

for (const e of economies) {
  // Walras' law at any prices, homogeneity of degree zero.
  for (let r = 0; r < 30; r++) {
    const p1 = Math.exp(-3 + 6 * rnd()), p2 = Math.exp(-1 + 2 * rnd()), T = (rnd() - 0.5) * 2, a = 0.2 + 5 * rnd();
    const E = X.excess(e, p1, p2), Ea = X.excess(e, a * p1, a * p2);
    close(p1 * E[0] + p2 * E[1], 0, 1e-9, 'Walras');
    close(Ea[0], E[0], 1e-9, 'homogeneity'); close(Ea[1], E[1], 1e-9);
    const Et = X.excess(e, p1, p2, T);
    close(p1 * Et[0] + p2 * Et[1], 0, 1e-9, 'Walras with transfers');
    checks += 4;
  }
  // Equilibria: markets clear, MRS^a = p = MRS^b, in the core; an odd number.
  const eqs = X.equilibria(e), [lo, hi] = X.coreRange(e);
  assert.ok(eqs.length % 2 === 1, 'odd number of equilibria');
  for (const q of eqs) {
    const E = X.excess(e, q.p);
    close(E[0], 0, 1e-8, 'E1 = 0'); close(E[1], 0, 1e-8, 'E2 = 0');
    close(X.mrs(q.xa, e.ua), q.p, 1e-6, 'MRS^a = p'); close(X.mrs(q.xb, e.ub), q.p, 1e-6, 'MRS^b = p');
    close(X.contractX2(e, q.xa[0]), q.xa[1], 1e-6, 'on the contract curve');
    assert.ok(q.xa[0] >= lo - 1e-9 && q.xa[0] <= hi + 1e-9, 'in the core');
    assert.ok(CM.utility(q.xa, e.ua) >= CM.utility(e.Ra, e.ua) - 1e-12, 'better than R^a');
    // Competitive allocations are never blocked by the replica coalitions.
    assert.equal(X.blockingN(e, q.xa[0]).N, Infinity, 'equilibrium not blocked');
    checks += 8;
  }
  // Contract curve: no feasible reallocation makes a better off without hurting b (brute force on a fine grid).
  for (const s of [0.15, 0.4, 0.7, 0.9]) {
    const x1 = s * e.Omega[0], xa = [x1, X.contractX2(e, x1)], va = CM.utility(xa, e.ua), vb = CM.utility(X.toB(e, xa), e.ub);
    close(X.mrs(xa, e.ua), X.mrs(X.toB(e, xa), e.ub), 1e-7, 'tangency');
    let best = -Infinity;
    for (let i = 1; i < 300; i++) for (let j = 1; j < 300; j++) {
      const z = [e.Omega[0] * i / 300, e.Omega[1] * j / 300];
      if (CM.utility(X.toB(e, z), e.ub) >= vb) best = Math.max(best, CM.utility(z, e.ua));
    }
    assert.ok(best <= va * (1 + 1e-9), 'Pareto efficient');
    checks += 2;
  }
  // Core boundaries: on the status-quo indifference curves.
  close(CM.utility([lo, X.contractX2(e, lo)], e.ua), CM.utility(e.Ra, e.ua), 1e-8, 'core: a');
  close(CM.utility(X.toB(e, [hi, X.contractX2(e, hi)]), e.ub), CM.utility(X.Rb(e), e.ub), 1e-8, 'core: b');
  checks += 2;
  // Second welfare theorem: with the transfer T the target is an equilibrium.
  for (const s of [0.2, 0.5, 0.8]) {
    const x1 = lo + s * (hi - lo), w = X.support(e, x1), eqT = X.equilibria(e, w.T);
    const hit = eqT.find(q => Math.abs(q.p - w.p) < 1e-5 * w.p);
    assert.ok(hit, 'supporting price is an equilibrium price after the transfer');
    close(hit.xa[0], w.xa[0], 1e-5, 'target allocation'); close(hit.xa[1], w.xa[1], 1e-5);
    close(w.p * w.xa[0] + w.xa[1], w.p * e.Ra[0] + e.Ra[1] + w.T, 1e-9, 'a on the budget');
    checks += 4;
  }
  // Replicas: the coalition is feasible and makes the blocking type strictly better off; the replica core is
  // nested (blocked at N stays blocked at N + 1) and shrinks towards the equilibria.
  const xs = Array.from({ length: 41 }, (_, k) => lo + (hi - lo) * (k + 0.5) / 41);
  const Ns = xs.map(x1 => X.blockingN(e, x1).N);
  for (let k = 0; k < xs.length; k++) {
    const N = Ns[k];
    if (N === Infinity) continue;
    for (const NN of [N, N + 1, N + 5]) {
      const c = X.coalition(e, xs[k], NN), b = X.blockingN(e, xs[k]);
      assert.ok(c && c.M >= 1 && c.M <= NN - 1, 'coalition size');
      const own = c.side === 'a' ? b.xa : b.xb, R = c.side === 'a' ? e.Ra : X.Rb(e), u = c.side === 'a' ? e.ua : e.ub;
      assert.ok(CM.utility(c.get, u) > CM.utility(own, u), 'blocking type strictly better off');
      // Feasibility: N of the blocking type get c.get, M of the other type keep their allocation.
      const Rother = c.side === 'a' ? X.Rb(e) : e.Ra;
      for (const i of [0, 1]) close(NN * c.get[i] + c.M * c.other[i], NN * R[i] + c.M * Rother[i], 1e-9, 'feasible');
      checks += 4;
    }
    assert.equal(X.coalition(e, xs[k], N - 1), null, 'not blocked one replica earlier');
    checks++;
  }
  // Farther from the equilibria, smaller N blocks: N is largest at points closest to an equilibrium.
  if (eqs.length === 1) {
    const d = xs.map(x => Math.abs(x - eqs[0].xa[0]));
    for (let k = 0; k < xs.length; k++) for (let j = 0; j < xs.length; j++)
      if ((xs[k] - eqs[0].xa[0]) * (xs[j] - eqs[0].xa[0]) > 0 && d[k] < d[j]) { assert.ok(Ns[k] >= Ns[j], 'monotone'); checks++; }
  }
}

// The multiple-equilibria example: three equilibria, the middle one unstable.
{
  const eqs = X.equilibria(economies[2]);
  assert.equal(eqs.length, 3);
  close(eqs[1].p, 1, 1e-8, 'symmetric middle equilibrium');
  assert.ok(eqs[0].stable && !eqs[1].stable && eqs[2].stable, 'stability alternates');
  checks += 3;
}

console.log(`All ${checks} exchange-model checks passed.`);
