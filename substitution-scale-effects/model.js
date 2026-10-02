/*
 * Substitution and Scale Effects: tool math (lecture 3). Firm math comes from shared/firm-model.js.
 *
 * From D(w,p) = H(w, S(w,p)), a change in w1 moves the demand for inputs in two steps:
 *   A = D(w,p) = H(w, q*)          before
 *   B = H(w', q*)                  same output, new prices      B - A: substitution (blue)
 *   C = D(w',p) = H(w', S(w',p))   new output, new prices       C - B: scale (red)
 * and, for a marginal change,
 *   dD^i/dw1 = dH^i(w,q*)/dw1 + dH^i(w,q*)/dq * dS(w,p)/dw1.
 *
 * Works in the browser (window.SubScaleModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;

  // Optimal output, taking q-hat when the firm is indifferent and 0 when it shuts down.
  function output(w, p, s) {
    const S = FM.supply(w, p, s);
    return S.kind === 'interior' || S.kind === 'indifferent' ? S.q : 0;
  }

  const sub = (u, v) => [u[0] - v[0], u[1] - v[1]];

  // Discrete change w1 -> w1 + dw1: the bundles A, B, C and the split C - A = (B - A) + (C - B).
  function decompose(w, p, s, dw1) {
    const w2 = [w[0] + dw1, w[1]];
    const qA = output(w, p, s), qC = output(w2, p, s);
    const A = FM.condDemand(w, qA, s).H, B = FM.condDemand(w2, qA, s).H, C = FM.condDemand(w2, qC, s).H;
    const profit = (ww, q) => p * q - FM.cost(ww, q, s);
    return {
      w: w.slice(), wNew: w2, qA, qC, A, B, C,
      substitution: sub(B, A), scale: sub(C, B), total: sub(C, A),
      profitA: profit(w, qA), profitC: profit(w2, qC)
    };
  }

  /*
   * Marginal version by central finite differences (relative step 1e-5):
   * for each input i, total dD^i/dw1, substitution dH^i(w,q*)/dw1 at fixed q*,
   * and scale dH^i(w,q*)/dq * dS/dw1.
   */
  function decomposeDerivative(w, p, s, rel = 1e-5) {
    const q = output(w, p, s), h = rel * w[0], hq = rel * Math.max(q, 1e-3);
    const up = [w[0] + h, w[1]], dn = [w[0] - h, w[1]];
    const D = ww => FM.condDemand(ww, output(ww, p, s), s).H;
    const Du = D(up), Dd = D(dn);
    const Hu = FM.condDemand(up, q, s).H, Hd = FM.condDemand(dn, q, s).H;
    const Hq1 = FM.condDemand(w, q + hq, s).H, Hq0 = FM.condDemand(w, Math.max(q - hq, 0), s).H;
    const dq = q + hq - Math.max(q - hq, 0);
    const dSdw1 = (output(up, p, s) - output(dn, p, s)) / (2 * h);
    const effect = i => {
      const dHdq = (Hq1[i] - Hq0[i]) / dq;
      return { total: (Du[i] - Dd[i]) / (2 * h), substitution: (Hu[i] - Hd[i]) / (2 * h), scale: dHdq * dSdw1, dHdq };
    };
    return { q, dSdw1, input1: effect(0), input2: effect(1) };
  }

  /*
   * Points along the isoquant phi = q from bundle P to bundle Q (both on it), for the animation:
   * interpolate the angle of the ray and put each point back on the isoquant.
   */
  function isoquantArc(q, P, Q, s, n = 40) {
    const t0 = Math.atan2(P[1], P[0]), t1 = Math.atan2(Q[1], Q[0]), need = FM.G(q, s);
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = t0 + (t1 - t0) * i / n, c = Math.cos(t), sn = Math.sin(t), unit = FM.g(c, sn, s);
      return unit > 0 ? [need * c / unit, need * sn / unit] : null;
    }).filter(Boolean);
  }

  const api = { output, decompose, decomposeDerivative, isoquantArc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SubScaleModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
