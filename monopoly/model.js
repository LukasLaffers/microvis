/*
 * Monopoly and Product Differentiation: tool math (lecture 5, sections 1.4 and 1.5).
 * Firm cost from shared/firm-model.js ('ushape' profile): C(w,q) = c(w) G(q).
 *
 * The monopolist solves max_{q >= 0} p(q) q - C(w,q). For q > 0 the first-order condition is MR = MC:
 *   p(q) + p_q(q) q - MC(w,q) = 0   <=>   p(q) = MC(w,q) / (1 + 1/eta(q)),  eta(q) = p(q) / (q p_q(q)) < 0.
 * Profit = [AR(p(q*),q*) - AC(w,q*)] q*.
 * Demand (average revenue): linear p(q) = A - B q, or constant elasticity p(q) = K q^(1/eta).
 * Product differentiation: substitutes entering shift the firm's AR down (A falls) until the best profit is zero;
 * then AR is tangent to AC, at the output where MR = MC.
 *
 * Works in the browser (window.MonopolyModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;

  // Inverse demand p(q), its derivative, MR and the elasticity eta.
  function price(q, d) { return d.type === 'linear' ? d.A - d.B * q : d.K * Math.pow(q, 1 / d.eta); }
  function priceSlope(q, d) { return d.type === 'linear' ? -d.B : d.K / d.eta * Math.pow(q, 1 / d.eta - 1); }
  const MR = (q, d) => price(q, d) + priceSlope(q, d) * q;
  const eta = (q, d) => price(q, d) / (q * priceSlope(q, d));
  // Largest output with a non-negative price (linear demand), or a plotting bound.
  const qLimit = (d, s) => d.type === 'linear' ? d.A / d.B : 4 * s.a + 4;

  const profitAt = (q, w, s, d) => price(q, d) * q - FM.cost(w, q, s);

  // Maximise profit over q > 0: a fine grid, then bisection on MR - MC around the best grid point.
  // shutdown: the best positive output still makes a loss, so q = 0 is optimal.
  function optimum(w, s, d) {
    const top = qLimit(d, s), n = 4000;
    let best = -Infinity, qb = top / n;
    for (let k = 1; k <= n; k++) { const q = top * k / n, v = profitAt(q, w, s, d); if (v > best) { best = v; qb = q; } }
    const f = q => MR(q, d) - FM.MC(w, q, s);
    let a = Math.max(1e-9, qb - top / n), b = Math.min(top, qb + top / n);
    const bracketed = f(a) > 0 && f(b) < 0;
    if (bracketed) for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) > 0) a = m; else b = m; }
    const out = describe(bracketed ? 0.5 * (a + b) : qb, w, s, d);
    out.shutdown = out.profit < 0;
    return out;
  }

  function describe(q, w, s, d) {
    const p = price(q, d);
    return { q, p, profit: profitAt(q, w, s, d), MR: MR(q, d), MC: FM.MC(w, q, s), AC: FM.AC(w, q, s), eta: eta(q, d), shutdown: false };
  }

  // The price-taking benchmark: the largest output where demand meets the rising part of MC.
  function competitive(w, s, d) {
    const top = qLimit(d, s), f = q => price(q, d) - FM.MC(w, q, s);
    let a = s.a, b = top;
    if (!(f(a) > 0) || !(f(b) < 0)) return null;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) > 0) a = m; else b = m; }
    const q = 0.5 * (a + b);
    return { q, p: price(q, d) };
  }

  // Long run with differentiated products: the intercept A* of a linear AR (slope B) at which the best profit is 0.
  function tangencyIntercept(w, s, B) {
    const best = A => optimum(w, s, { type: 'linear', A, B }).profit;
    let lo = 0, hi = 1;
    while (best(hi) <= 0) hi *= 2;
    for (let it = 0; it < 100; it++) { const m = 0.5 * (lo + hi); if (best(m) > 0) hi = m; else lo = m; }
    return hi;
  }

  const api = { price, priceSlope, MR, eta, qLimit, profitAt, optimum, describe, competitive, tangencyIntercept };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MonopolyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
