// Checks the replica core (lecture 9). Run with:  node core-replica/test-model.cjs
const assert = require('node:assert/strict');
const CM = require('../shared/consumer-model.js');
const X = require('../shared/exchange-model.js');
const M = require('./model.js');

let checks = 0;
const economies = [
  { ua: { type: 'ces', delta: 0.6, rho: -1 }, ub: { type: 'ces', delta: 0.35, rho: 0.3 }, Omega: [10, 10], Ra: [8, 2] },
  { ua: { type: 'ces', delta: 0.5, rho: -0.5 }, ub: { type: 'ces', delta: 0.5, rho: -0.5 }, Omega: [10, 10], Ra: [2, 7] },
  { ua: { type: 'ces', delta: 0.3, rho: 0.6 }, ub: { type: 'ces', delta: 0.7, rho: -3 }, Omega: [10, 10], Ra: [3, 7] }
];

for (const e of economies) {
  const P = M.profile(e, 300), xe = P.eqs[0].xa[0];
  assert.equal(P.eqs.length, 1);
  // N = 1: the whole core survives. Endpoints of the core (on the status-quo curves) are blocked already at N = 2,
  // as in the notes' example with Alf, Arthur and Bill.
  assert.ok(M.surviving(P, 1).keep.every(Boolean)); checks++;
  assert.equal(X.blockingN(e, P.core[0] + 1e-9).N, 2); assert.equal(X.blockingN(e, P.core[1] - 1e-9).N, 2); checks += 2;
  // Nested, contain the equilibrium, shrink towards it.
  let prev = M.surviving(P, 1);
  for (let N = 2; N <= 400; N++) {
    const s = M.surviving(P, N);
    s.keep.forEach((k, i) => { if (k) assert.ok(prev.keep[i], 'nested'); });
    if (s.lo !== null) { assert.ok(s.lo <= xe && s.hi >= xe, 'contains the equilibrium'); }
    prev = s; checks += 2;
  }
  const s2 = M.surviving(P, 2), s50 = M.surviving(P, 50), s400 = M.surviving(P, 400);
  assert.ok(s50.hi - s50.lo < s2.hi - s2.lo, 'shrinks');
  assert.ok(Math.max(Math.abs(s400.lo - xe), Math.abs(s400.hi - xe)) < 0.05 * (P.core[1] - P.core[0]), 'close to the equilibrium');
  checks += 2;
  // Every blocked point: the coalition of the blocking replica improves on the allocation for its blocking type and
  // can give the other type a tiny bit more too (strictly better for everybody).
  P.xs.forEach((x1, k) => {
    if (!(P.Ns[k] < Infinity)) return;
    const c = X.coalition(e, x1, P.Ns[k]), b = X.blockingN(e, x1);
    const u = c.side === 'a' ? e.ua : e.ub, own = c.side === 'a' ? b.xa : b.xb;
    const gain = CM.utility(c.get, u) - CM.utility(own, u);
    assert.ok(gain > 0);
    if (gain < 1e-10) return;   // right next to the equilibrium the gain is below what doubles can redistribute
    // Shift eps of good 1 from each of the N blockers to the M others: blockers still better off, the others too.
    const eps = 1e-3 * gain, give = [c.get[0] - eps, c.get[1]], recv = [c.other[0] + eps * P.Ns[k] / c.M, c.other[1]];
    const uo = c.side === 'a' ? e.ub : e.ua;
    assert.ok(CM.utility(give, u) > CM.utility(own, u) && CM.utility(recv, uo) > CM.utility(c.other, uo), 'strict for all');
    checks += 2;
  });
}
console.log(`All ${checks} replica-core checks passed.`);
