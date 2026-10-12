/*
 * Cross-Price Effects: model (lecture 4). All firm math is in ../shared/firm-model.js.
 *
 * Three firms with phi(z) = g(z)^k, k = 1/2, g a CES of degree one with delta = 0.5; they differ only in the
 * elasticity of substitution sigma. At the starting prices w = (1, 1) and output price p = 4 every firm has the
 * same unit cost c = 2 and produces q = 1 with z = (1, 1), so the three start from the same point A.
 * When w2 changes to w2' (w1 and p stay):
 *   A = H(w, q0)            the starting bundle
 *   B = H(w', q0)           substitution: the old output at the new prices
 *   C = H(w', q1) = D(w', p) scale: the new output q1 = S(w', p)
 * At the starting prices the marginal effects are
 *   dD1/dw2 = dH1/dw2 + dH1/dq * dS/dw2,  dS/dw2 = -(1/Cqq) dH2/dq   (the (*) of the notes)
 * and dD2/dw1 = dH2/dw1 + the same scale term is computed separately, to compare.
 *
 * Works in the browser (window.CrossModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const FM = root.FirmModel || (typeof require === 'function' ? require('../shared/firm-model.js') : null);

  const DELTA = 0.5, K = 0.5, P = 4, W0 = [1, 1];
  const DEFAULTS = { w2n: 2, sigA: 3, sigB: 2, sigC: 0.5 };

  // The firm-model description of a firm with elasticity of substitution sig (Cobb-Douglas at sig = 1).
  function tech(sig) {
    const rho = Math.abs(sig - 1) < 1e-9 ? 0 : 1 - 1 / sig;
    return { tech: 'ces', delta: DELTA, rho, profile: 'homog', A: 1, k: K };
  }

  // A -> B -> C for a change of w2 from 1 to w2n.
  function steps(sig, w2n) {
    const s = tech(sig), w1 = [W0[0], w2n];
    const q0 = FM.supply(W0, P, s).q, q1 = FM.supply(w1, P, s).q;
    return {
      q0, q1,
      A: FM.condDemand(W0, q0, s).H,
      B: FM.condDemand(w1, q0, s).H,
      C: FM.condDemand(w1, q1, s).H
    };
  }

  // Marginal effects at the starting prices: the two terms of dD1/dw2, the total, and dD2/dw1.
  function marginal(sig, w = W0) {
    const s = tech(sig), q = FM.supply(w, P, s).q, h = 1e-5;
    const H = (ww, qq) => FM.condDemand(ww, qq, s).H, D = ww => FM.uncondDemand(ww, P, s);
    const at = (i, d) => { const v = w.slice(); v[i] += d; return v; };
    const substitution = (H(at(1, h), q)[0] - H(at(1, -h), q)[0]) / (2 * h);
    const substitution21 = (H(at(0, h), q)[1] - H(at(0, -h), q)[1]) / (2 * h);
    const Hq = i => (H(w, q + h)[i] - H(w, q - h)[i]) / (2 * h);
    const Cqq = (FM.MC(w, q + h, s) - FM.MC(w, q - h, s)) / (2 * h);
    const scale = -Hq(0) * Hq(1) / Cqq;
    return {
      substitution, substitution21, scale, Cqq, dSdw2: -Hq(1) / Cqq,
      total: (D(at(1, h))[0] - D(at(1, -h))[0]) / (2 * h),
      cross: (D(at(0, h))[1] - D(at(0, -h))[1]) / (2 * h)
    };
  }

  // Conditional demand for input 1 at the old output and unconditional demand, as functions of w2.
  function curves(sig, w2s) {
    const s = tech(sig), q0 = FM.supply(W0, P, s).q;
    return {
      H1: w2s.map(w2 => [FM.condDemand([W0[0], w2], q0, s).H[0], w2]),
      D1: w2s.map(w2 => [FM.uncondDemand([W0[0], w2], P, s)[0], w2])
    };
  }

  // The isoquant through the bundle for output q, inside [0, zmax]^2.
  const isoquant = (sig, q, zmax) => FM.isoquant(q, tech(sig), zmax);

  // What happens to input 1: +1 rises, 0 does not move (within tol), -1 falls.
  const direction = (from, to, tol = 5e-3) => (Math.abs(to - from) < tol ? 0 : to > from ? 1 : -1);

  const api = { DELTA, K, P, W0, DEFAULTS, tech, steps, marginal, curves, isoquant, direction };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CrossModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
