/*
 * Substitution and Scale Effects: tool math (lecture 3). Firm math comes from shared/firm-model.js.
 *
 * From D(w,p) = H(w, S(w,p)), a change in w1 moves the demand for inputs in two steps:
 *   A = D(w,p) = H(w, q*)          before
 *   B = H(w', q*)                  same output, new prices      B - A: substitution (blue)
 *   C = D(w',p) = H(w', S(w',p))   new output, new prices       C - B: scale (red)
 * (the textbook two-step bookkeeping; the change itself is smooth, see path() below) and, for a marginal change,
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

  /*
   * Lecture 4, (*) and (**): the marginal scale effect in closed form. By Shephard's lemma MC shifts up by
   * dMC/dw1 = dH^1/dq per unit of w1; output falls by shift / slope of MC: d q_star / d w1 = -(dH^1/dq) / C_qq, and the
   * scale effect on input 1 is -(1/C_qq) (dH^1/dq)^2.
   */
  function scaleClosedForm(w, p, s, rel = 1e-5) {
    const q = output(w, p, s), hq = rel * Math.max(q, 1e-3), h = rel * w[0];
    const Cqq = (FM.MC(w, q + hq, s) - FM.MC(w, Math.max(q - hq, 0), s)) / (q + hq - Math.max(q - hq, 0));
    const dHdq = (FM.condDemand(w, q + hq, s).H[0] - FM.condDemand(w, Math.max(q - hq, 0), s).H[0]) / (q + hq - Math.max(q - hq, 0));
    const dMCdw1 = (FM.MC([w[0] + h, w[1]], q, s) - FM.MC([w[0] - h, w[1]], q, s)) / (2 * h);
    return { q, Cqq, dHdq, dMCdw1, dqdw1: -dHdq / Cqq, scale: -dHdq * dHdq / Cqq };
  }

  /*
   * The smooth change: w1 rises gradually from w[0] to w1End, and at every moment the firm both substitutes
   * and scales. n steps; at each step the bundle D = H(w, S(w,p)) moves, and the move splits into
   *   substitution: change of H at fixed output (along the current isoquant),
   *   scale:        change of H at fixed prices (along the current expansion path),
   * averaged over the two orders, so each step is split symmetrically and the steps add up exactly to the total
   * D(end) - D(start). As n grows, the accumulated parts converge to the integrals of the two terms of
   * dD/dw1 = dH/dw1 + dH/dq dS/dw1 along the way.
   * Returns w1 (n+1 values), q, D (bundles) and the accumulated substitution and scale (vectors, starting at 0).
   */
  function path(w, p, s, w1End, n = 120) {
    const w1 = Array.from({ length: n + 1 }, (_, i) => w[0] + (w1End - w[0]) * i / n);
    const q = w1.map(x => output([x, w[1]], p, s));
    const H = (x, qq) => qq > 0 ? FM.condDemand([x, w[1]], qq, s).H : [0, 0];
    const D = w1.map((x, i) => H(x, q[i]));
    const substitution = [[0, 0]], scale = [[0, 0]];
    for (let k = 0; k < n; k++) {
      const a = D[k], b = H(w1[k + 1], q[k]), c = H(w1[k], q[k + 1]), d = D[k + 1];
      const ps = substitution[k], pc = scale[k];
      substitution.push([0, 1].map(i => ps[i] + 0.5 * ((b[i] - a[i]) + (d[i] - c[i]))));
      scale.push([0, 1].map(i => pc[i] + 0.5 * ((c[i] - a[i]) + (d[i] - b[i]))));
    }
    return { w1, q, D, substitution, scale };
  }

  const api = { output, decompose, decomposeDerivative, isoquantArc, scaleClosedForm, path };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SubScaleModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
