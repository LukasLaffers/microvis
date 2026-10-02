/*
 * The Cost Function: tool math (lecture 3). Firm math comes from shared/firm-model.js.
 *
 * C(w, q) as a function of input prices: the matrix of price effects dH/dw^t (= d2C/dw dw^t),
 * the cost of keeping inputs fixed when prices change (the tangent line of Shephard's lemma),
 * and the cost curve in w1.
 *
 * Works in the browser (window.CostFunctionModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;

  /*
   * Matrix of price effects [dH^j / dw_k] (row j = input, column k = price), by central
   * finite differences of the conditional demand with relative step 1e-6.
   */
  function priceEffects(w, q, s, rel = 1e-6) {
    const M = [[0, 0], [0, 0]];
    for (let k = 0; k < 2; k++) {
      const h = rel * w[k], up = w.slice(), dn = w.slice();
      up[k] += h; dn[k] -= h;
      const Hu = FM.condDemand(up, q, s).H, Hd = FM.condDemand(dn, q, s).H;
      for (let j = 0; j < 2; j++) M[j][k] = (Hu[j] - Hd[j]) / (2 * h);
    }
    return M;
  }

  // Cost of the fixed bundle zbar at prices w: the straight line that C(w, q) lies below (C4).
  const fixedInputCost = (w, zbar) => w[0] * zbar[0] + w[1] * zbar[1];

  // Points (w1, C(w1, w2, q)) for w1 in range.
  function costCurveInW1(w2, q, s, range = [0.2, 5], n = 200) {
    return Array.from({ length: n }, (_, i) => {
      const w1 = range[0] + (range[1] - range[0]) * i / (n - 1);
      return [w1, FM.cost([w1, w2], q, s)];
    });
  }

  // Linear technology: the price w1 at which the cheaper input switches (w1/delta = w2/(1-delta)).
  const linearSwitchW1 = (w2, s) => s.delta * w2 / (1 - s.delta);

  // [dH/dw^t] w: zero by Euler's theorem, because H is homogeneous of degree zero in w (H3).
  const timesPrices = (M, w) => [M[0][0] * w[0] + M[0][1] * w[1], M[1][0] * w[0] + M[1][1] * w[1]];

  /*
   * Lecture 4: the area to the left of the conditional demand curve H^1(w1, w2, q) between two prices is the change
   * in cost, because H^1 = dC/dw1 (Shephard's lemma). Simpson's rule on each smooth piece; for the linear technology
   * H^1 jumps at the switch price, so the integral is split there.
   */
  function areaLeftOfH1(w2, q, s, wa, wb, n = 400) {
    const lo = Math.min(wa, wb), hi = Math.max(wa, wb), cuts = [lo];
    if (s.tech === 'linear') { const sw = linearSwitchW1(w2, s); if (sw > lo && sw < hi) cuts.push(sw); }
    cuts.push(hi);
    const H1 = w1 => FM.condDemand([w1, w2], q, s).H[0];
    let total = 0;
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k], b = cuts[k + 1], eps = 1e-7 * (b - a), h = (b - a) / n;   // eps: clear of the tie tolerance of firm-model
      let sum = 0;
      for (let i = 0; i <= n; i++) {
        const x = i === 0 ? a + eps : i === n ? b - eps : a + i * h;   // stay inside the piece at a jump
        sum += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * H1(x);
      }
      total += sum * h / 3;
    }
    return total;
  }

  const api = { priceEffects, fixedInputCost, costCurveInW1, linearSwitchW1, timesPrices, areaLeftOfH1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CostFunctionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
