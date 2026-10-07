/*
 * Substitution and Income Effects: tool math (lecture 6, (M3) the Slutsky equation and Giffen goods).
 * Consumer math from shared/consumer-model.js.
 *
 * Discrete (Hicks) decomposition of a change p1 -> p1' (p2, y fixed), as in the notes' figure:
 *   E1 = D(p, y) on the indifference curve v0 = V(p, y);
 *   E2 = H(p', v0): new prices, old utility (substitution effect E1 -> E2), bought with the compensated income C(p', v0);
 *   E3 = D(p', y): new prices, old income (income effect E2 -> E3).
 * (the textbook two-step bookkeeping; the change itself is smooth, see path() below)
 * Marginal version: dD^j/dp_k = dH^j/dp_k - (dD^j/dy) D^k (M3), and in elasticities eps^u_jj = eps^c_jj - eta_j b_j.
 *
 * Works in the browser (window.SlutskyModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  function decompose(p, y, u, p1new) {
    const pn = [p1new, p[1]], E1 = CM.demand(p, y, u), v0 = CM.utility(E1, u);
    const yc = CM.expenditure(pn, v0, u), E2 = CM.demand(pn, yc, u), E3 = CM.demand(pn, y, u);
    return {
      E1, E2, E3, v0, v1: CM.utility(E3, u), yc,
      substitution: [E2[0] - E1[0], E2[1] - E1[1]], income: [E3[0] - E2[0], E3[1] - E2[1]], total: [E3[0] - E1[0], E3[1] - E1[1]]
    };
  }

  // Normal, inferior or Giffen (for good 1 at (p, y)).
  function classify(p, y, u) {
    const dy = CM.dDdy(p, y, u, 0), dp = CM.dDdp(p, y, u, 0, 0);
    return { dy, dp, kind: dp > 0 ? 'giffen' : dy < 0 ? 'inferior' : 'normal' };
  }

  // Marshallian D1(p1) at income y and Hicksian H1(p1) at utility v, for p1 in a range: points [x1, p1].
  const marshallCurve = (p2, y, u, p1s) => p1s.map(p1 => [CM.demand([p1, p2], y, u)[0], p1]);
  const hicksCurve = (p2, v, u, p1s) => p1s.map(p1 => [CM.hicks([p1, p2], v, u)[0], p1]);

  /*
   * The smooth change: p1 moves gradually from p[0] to p1End (p2, y fixed), and at every moment the consumer both
   * substitutes and changes her real income. n steps; at each step the bundle D = H(p, V(p, y)) moves, and the move splits into
   *   substitution: change of H at fixed utility (along the current indifference curve),
   *   income:       change of H at fixed prices (to the next indifference curve),
   * averaged over the two orders, so each step is split symmetrically and the steps add up exactly to the total
   * D(end) - D(start). As n grows, the accumulated parts converge to the integrals of the two terms of
   * (M3), dD/dp1 = dH/dp1 - (dD/dy) D^1, along the way.
   * Returns p1 (n+1 values), v, D (bundles) and the accumulated substitution and income (vectors, starting at 0).
   */
  function path(p, y, u, p1End, n = 120) {
    const p1 = Array.from({ length: n + 1 }, (_, i) => p[0] + (p1End - p[0]) * i / n);
    const D = p1.map(x => CM.demand([x, p[1]], y, u)), v = D.map(x => CM.utility(x, u));
    const H = (x, vv) => CM.hicks([x, p[1]], vv, u);
    const substitution = [[0, 0]], income = [[0, 0]];
    for (let k = 0; k < n; k++) {
      const a = D[k], b = H(p1[k + 1], v[k]), c = H(p1[k], v[k + 1]), d = D[k + 1];
      const ps = substitution[k], pi = income[k];
      substitution.push([0, 1].map(i => ps[i] + 0.5 * ((b[i] - a[i]) + (d[i] - c[i]))));
      income.push([0, 1].map(i => pi[i] + 0.5 * ((c[i] - a[i]) + (d[i] - b[i]))));
    }
    return { p1, v, D, substitution, income };
  }

  const api = { decompose, classify, marshallCurve, hicksCurve, path };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SlutskyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
