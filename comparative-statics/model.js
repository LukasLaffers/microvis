/*
 * What If? Comparative Statics: tool math (lecture 4, section 1). Firm math from shared/firm-model.js.
 *
 * From the first-order condition p = C_q(w, q_star):
 *   d q_star / d p    = 1 / C_qq
 *   d q_star / d w_i  = -(1 / C_qq) dH^i/dq                          (lecture: (*))
 *   d D^i / d w_i     = dH^i/dw_i + (-1 / C_qq) (dH^i/dq)^2          (lecture: (**))
 * and, by Shephard's lemma, the area to the left of the conditional demand curve between two
 * prices is the change in cost.
 *
 * Works in the browser (window.CompStatModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;
  const REL = 1e-5;

  // Optimal output: q-hat when indifferent, 0 when the firm shuts down.
  function output(w, p, s) {
    const S = FM.supply(w, p, s);
    return S.kind === 'interior' || S.kind === 'indifferent' ? S.q : 0;
  }

  const H = (w, q, s, i) => FM.condDemand(w, q, s).H[i];
  const D = (w, p, s, i) => H(w, output(w, p, s), s, i);
  const bump = (w, i, h) => { const v = w.slice(); v[i] += h; return v; };

  // Second derivative of cost in output, by a central difference of marginal cost.
  function Cqq(w, q, s) {
    const h = REL * Math.max(q, 1);
    return (FM.MC(w, q + h, s) - FM.MC(w, Math.max(q - h, 0), s)) / (q + h - Math.max(q - h, 0));
  }

  // dH^i/dq at (w, q).
  function dHdq(w, q, s, i) {
    const h = REL * Math.max(q, 1);
    return (H(w, q + h, s, i) - H(w, Math.max(q - h, 0), s, i)) / (q + h - Math.max(q - h, 0));
  }

  // d q_star / d p: the formula 1 / C_qq and the finite-difference slope of S(w, p).
  function supplySlopeP(w, p, s) {
    const q = output(w, p, s), h = REL * p;
    return { formula: 1 / Cqq(w, q, s), numeric: (output(w, p + h, s) - output(w, p - h, s)) / (2 * h) };
  }

  // d q_star / d w_i: the formula -(1 / C_qq) dH^i/dq and the finite-difference slope.
  function supplySlopeW(w, p, s, i) {
    const q = output(w, p, s), h = REL * w[i];
    return {
      formula: -dHdq(w, q, s, i) / Cqq(w, q, s),
      numeric: (output(bump(w, i, h), p, s) - output(bump(w, i, -h), p, s)) / (2 * h)
    };
  }

  // (**): own-price effect on the unconditional demand for input i, split as in the notes.
  function decomposeOwn(w, p, s, i) {
    const q = output(w, p, s), h = REL * w[i];
    const substitution = (H(bump(w, i, h), q, s, i) - H(bump(w, i, -h), q, s, i)) / (2 * h);
    const cqq = Cqq(w, q, s), dh = dHdq(w, q, s, i);
    const scale = (-1 / cqq) * dh * dh;
    const total = (D(bump(w, i, h), p, s, i) - D(bump(w, i, -h), p, s, i)) / (2 * h);
    return { q, Cqq: cqq, dHdq: dh, substitution, scale, total };
  }

  // The three points of the first Cowell figure for a change w1 -> w1new.
  function points(w, p, s, w1new) {
    const w2 = [w1new, w[1]], qBefore = output(w, p, s), qAfter = output(w2, p, s);
    return {
      qBefore, qAfter,
      zStar: H(w, qBefore, s, 0),        // z1*: before
      zO: H(w2, qBefore, s, 0),          // z1°: new price, old output (substitution)
      zStarStar: H(w2, qAfter, s, 0)     // z1**: new price, new output (scale)
    };
  }

  // Area to the left of the conditional demand curve H^1(., w2, q) between prices wa and wb (Simpson).
  function areaLeftOfH(w2, q, s, wa, wb, n = 400) {
    const lo = Math.min(wa, wb), hi = Math.max(wa, wb), h = (hi - lo) / n;
    let sum = 0;
    for (let k = 0; k <= n; k++) sum += (k === 0 || k === n ? 1 : k % 2 ? 4 : 2) * H([lo + k * h, w2], q, s, 0);
    return sum * h / 3;
  }

  // Curves in the (z1, w1) plane: points [z1, w1] for w1 in [lo, hi].
  const demandCurve = (w2, p, s, lo, hi, n = 200) =>
    Array.from({ length: n }, (_, k) => { const w1 = lo + (hi - lo) * k / (n - 1); return [D([w1, w2], p, s, 0), w1]; });
  const conditionalCurve = (w2, q, s, lo, hi, n = 200) =>
    Array.from({ length: n }, (_, k) => { const w1 = lo + (hi - lo) * k / (n - 1); return [H([w1, w2], q, s, 0), w1]; });

  const api = { output, Cqq, dHdq, supplySlopeP, supplySlopeW, decomposeOwn, points, areaLeftOfH, demandCurve, conditionalCurve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CompStatModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
