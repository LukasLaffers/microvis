/*
 * Monopoly and Product Differentiation: tool math (lecture 5, sections 1.4 and 1.5).
 * Firm cost from shared/firm-model.js ('ushape' profile): C(w,q) = c(w) G(q).
 *
 * The monopolist solves max_{q >= 0} p(q) q - C(w,q). For q > 0 the first-order condition is MR = MC:
 *   p(q) + p_q(q) q - MC(w,q) = 0   <=>   p(q) = MC(w,q) / (1 + 1/eta(q)),  eta(q) = p(q) / (q p_q(q)) < 0.
 * Profit = [AR(p(q*),q*) - AC(w,q*)] q*.
 * Demand (average revenue): linear p(q) = A - B q, curved p(q) = A - B q^g (g = 1: linear; g < 1: AR convex, g > 1:
 * concave; then MR = A - (1 + g) B q^g, curved too and not halfway between AR and the price axis), or constant
 * elasticity p(q) = K q^(1/eta).
 * Product differentiation: substitutes entering shift the firm's AR down (A falls) until the best profit is zero;
 * then AR is tangent to AC, at the output where MR = MC.
 * Constant-elasticity view (profile 'quadF'): C(q) = F + q^2, so MC = 2q rises from zero, AC = F/q + q is lowest,
 * 2 sqrt(F), at q = sqrt(F); demand p(q) = K q^(1/eta) passes through that point, where p = MC = AC (the long-run
 * competitive outcome), for every eta. MR falls and MC rises, so MR = MC has one solution. (With the U-shaped MC,
 * which falls first, this demand can give two profit peaks, and the optimum jumps between them as eta moves.)
 *
 * Works in the browser (window.MonopolyModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;

  // Inverse demand p(q), its derivative, MR and the elasticity eta.
  function price(q, d) {
    if (d.type === 'linear') return d.A - d.B * q;
    if (d.type === 'curved') return d.A - d.B * Math.pow(q, d.g);
    return d.K * Math.pow(q, 1 / d.eta);
  }
  function priceSlope(q, d) {
    if (d.type === 'linear') return -d.B;
    if (d.type === 'curved') return -d.B * d.g * Math.pow(q, d.g - 1);
    return d.K / d.eta * Math.pow(q, 1 / d.eta - 1);
  }
  const MR = (q, d) => price(q, d) + priceSlope(q, d) * q;
  const eta = (q, d) => price(q, d) / (q * priceSlope(q, d));
  // Largest output with a non-negative price (linear and curved demand), or a plotting bound.
  const qLimit = (d, s) => d.type === 'linear' ? d.A / d.B : d.type === 'curved' ? Math.pow(d.A / d.B, 1 / d.g) : quad(s) ? 3 * Math.sqrt(s.F) : 4 * s.a + 4;

  // Cost of the firm: the shared firm model, or C(q) = F + q^2 in the constant-elasticity view.
  const quad = s => s.profile === 'quadF';
  const costAt = (w, q, s) => quad(s) ? s.F + q * q : FM.cost(w, q, s);
  const MCAt = (w, q, s) => quad(s) ? 2 * q : FM.MC(w, q, s);
  const ACAt = (w, q, s) => quad(s) ? s.F / q + q : FM.AC(w, q, s);
  const lowestAC = (w, s) => quad(s) ? { qHat: Math.sqrt(s.F), pHat: 2 * Math.sqrt(s.F) } : FM.minAC(w, s);
  // Constant-elasticity demand through the bottom of AC, (qHat, pHat): p(q) = pHat (q/qHat)^(1/eta).
  function anchoredCE(eta, w, s) { const { qHat, pHat } = lowestAC(w, s); return { type: 'ce', K: pHat * Math.pow(qHat, -1 / eta), eta }; }

  const profitAt = (q, w, s, d) => price(q, d) * q - costAt(w, q, s);

  // Maximise profit over q > 0: a fine grid, then bisection on MR - MC around the best grid point.
  // shutdown: the best positive output still makes a loss, so q = 0 is optimal.
  function optimum(w, s, d) {
    // C = F + q^2 with constant elasticity: K (1 + 1/eta) q^(1/eta) = 2q in closed form
    if (quad(s) && d.type === 'ce') {
      const out = describe(Math.pow(d.K * (1 + 1 / d.eta) / 2, 1 / (1 - 1 / d.eta)), w, s, d);
      out.shutdown = out.profit < 0;
      return out;
    }
    const top = qLimit(d, s), n = 4000;
    let best = -Infinity, qb = top / n;
    for (let k = 1; k <= n; k++) { const q = top * k / n, v = profitAt(q, w, s, d); if (v > best) { best = v; qb = q; } }
    const f = q => MR(q, d) - MCAt(w, q, s);
    let a = Math.max(1e-9, qb - top / n), b = Math.min(top, qb + top / n);
    const bracketed = f(a) > 0 && f(b) < 0;
    if (bracketed) for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) > 0) a = m; else b = m; }
    const out = describe(bracketed ? 0.5 * (a + b) : qb, w, s, d);
    out.shutdown = out.profit < 0;
    return out;
  }

  function describe(q, w, s, d) {
    const p = price(q, d);
    return { q, p, profit: profitAt(q, w, s, d), MR: MR(q, d), MC: MCAt(w, q, s), AC: ACAt(w, q, s), eta: eta(q, d), shutdown: false };
  }

  // The price-taking benchmark: the largest output where demand meets the rising part of MC.
  function competitive(w, s, d) {
    const top = qLimit(d, s), f = q => price(q, d) - MCAt(w, q, s);
    let a = quad(s) ? 1e-9 : s.a, b = top;
    if (!(f(a) > 0) || !(f(b) < 0)) return null;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) > 0) a = m; else b = m; }
    const q = 0.5 * (a + b);
    return { q, p: price(q, d) };
  }

  // Deadweight loss of monopoly: the area between demand and MC from the monopoly output q* to the price taker's q
  // (Simpson's rule; both curves are smooth there).
  function deadweightLoss(w, s, d, qm, qc) {
    if (!(qc > qm)) return 0;
    const n = 200, h = (qc - qm) / n, g = q => price(q, d) - MCAt(w, q, s);
    let sum = g(qm) + g(qc);
    for (let k = 1; k < n; k++) sum += (k % 2 ? 4 : 2) * g(qm + k * h);
    return sum * h / 3;
  }

  // Long run with differentiated products: the intercept A* of AR = A - B q^g (g = 1: linear) at which the best profit is 0.
  function tangencyIntercept(w, s, B, g = 1) {
    const best = A => optimum(w, s, g === 1 ? { type: 'linear', A, B } : { type: 'curved', A, B, g }).profit;
    let lo = 0, hi = 1;
    while (best(hi) <= 0) hi *= 2;
    for (let it = 0; it < 100; it++) { const m = 0.5 * (lo + hi); if (best(m) > 0) hi = m; else lo = m; }
    return hi;
  }

  const api = { price, priceSlope, MR, eta, qLimit, costAt, MCAt, ACAt, lowestAC, anchoredCE, profitAt, optimum, describe, competitive, deadweightLoss, tangencyIntercept };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MonopolyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
