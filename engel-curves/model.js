/*
 * Income Expansion Paths and Engel Curves: tool math (lecture 6). Consumer math from shared/consumer-model.js.
 *
 * At fixed prices the income expansion path is the locus of D(p, y) as y grows; the Engel curves are D^j(p, y)
 * against y. Income elasticities eta_j classify the goods (inferior < 0 < necessity < 1 < luxury). From (M1):
 * Engel  sum_j b_j eta_j = 1  and  Cournot  b_i + sum_j b_j eps^u_ji = 0; from (M2): sum_j eps^u_ij + eta_i = 0.
 *
 * Works in the browser (window.EngelModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  const expansionPath = (p, u, ys) => ys.map(y => CM.demand(p, y, u));
  const engelCurves = (p, u, ys) => ys.map(y => { const x = CM.demand(p, y, u); return [y, x[0], x[1]]; });

  function kind(eta) { return eta < -1e-9 ? 'inferior' : eta < 1 - 1e-9 ? 'necessity' : eta > 1 + 1e-9 ? 'luxury' : 'unit elastic'; }

  // Incomes over which the example has interior solutions (the Giffen example only for c p1 + p2 s/2 <= y < c p1 + p2 s).
  function incomeRange(p, u) {
    if (u.type === 'giffen') return [u.c * p[0] + p[1] * u.s / 2 + 1e-6, u.c * p[0] + p[1] * u.s - 1e-6];
    if (u.type === 'stonegeary') { const m = p[0] * Math.max(u.g1, 0) + p[1] * Math.max(u.g2, 0); return [m + 0.5, m + 25]; }
    return [1, 25];
  }

  // The conditions of Engel and Cournot and homogeneity, from the elasticities at (p, y).
  function conditions(p, y, u) {
    const e = CM.elasticities(p, y, u);
    return {
      e, engel: e.b[0] * e.eta[0] + e.b[1] * e.eta[1],
      cournot: [0, 1].map(i => e.b[i] + e.b[0] * e.eu[0][i] + e.b[1] * e.eu[1][i]),
      homogeneity: [0, 1].map(i => e.eu[i][0] + e.eu[i][1] + e.eta[i])
    };
  }

  const api = { expansionPath, engelCurves, kind, incomeRange, conditions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EngelModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
