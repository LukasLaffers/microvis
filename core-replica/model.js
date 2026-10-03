/*
 * The Core Shrinks: tool math (lecture 9). Exchange economy from shared/exchange-model.js.
 *
 * For equal-treatment allocations on the core of the two-person economy, blockingN gives the smallest replica N in
 * which the notes' coalition (N people of one type, M < N of the other, theta = M/N) blocks it. The allocation
 * survives in the N-replica (against these coalitions) when that number is larger than N. As N grows, only the
 * competitive allocations survive.
 *
 * Works in the browser (window.ReplicaModel, needs window.ExchangeModel) and in Node.
 */
(function (root) {
  'use strict';

  const X = typeof module !== 'undefined' && module.exports ? require('../shared/exchange-model.js') : root.ExchangeModel;

  // The core on a grid of x1^a, with the smallest blocking replica of each point.
  function profile(e, n = 400) {
    const core = X.coreRange(e), eqs = X.equilibria(e);
    // The grid plus the competitive allocations themselves, which are never blocked.
    const xs = Array.from({ length: n }, (_, k) => core[0] + (core[1] - core[0]) * (k + 0.5) / n)
      .concat(eqs.map(q => q.xa[0]).filter(x => x > core[0] && x < core[1])).sort((a, b) => a - b);
    return { core, eqs, xs, Ns: xs.map(x1 => eqs.some(q => Math.abs(q.xa[0] - x1) < 1e-12) ? Infinity : X.blockingN(e, x1).N) };
  }

  // The grid points that survive the N-replica, as [min, max] of x1^a (null if none), and as a mask.
  function surviving(prof, N) {
    const keep = prof.Ns.map(b => b > N);
    let lo = null, hi = null;
    prof.xs.forEach((x, k) => { if (keep[k]) { if (lo === null) lo = x; hi = x; } });
    return { lo, hi, keep };
  }

  const api = { profile, surviving };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReplicaModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
