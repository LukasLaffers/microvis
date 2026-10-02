/*
 * CV, EV and Consumer Surplus: tool math (lecture 7). Consumer math from shared/consumer-model.js.
 *
 * Price of good 1 changes p1^0 -> p1^1 (p2 = 1 in the notes, here any p2), income y fixed; v^0 = V(p^0, y), v^1 = V(p^1, y).
 *   CV = C(p^0, v^0) - C(p^1, v^0)  (V(p^1, y - CV) = v^0)   = area left of H^1(p1, p2, v^0) between the prices
 *   EV = C(p^0, v^1) - C(p^1, v^1)  (V(p^0, y + EV) = v^1)   = area left of H^1(p1, p2, v^1)
 *   dCS = area left of the Marshallian D^1(p1, p2, y)
 * Normal good: CV <= dCS <= EV for a price fall; inferior: EV <= dCS <= CV; no income effect: all equal.
 *
 * Works in the browser (window.WelfareModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  function welfare(p10, p11, p2, y, u, n = 200) {
    const p0 = [p10, p2], p1 = [p11, p2];
    const v0 = CM.indirect(p0, y, u), v1 = CM.indirect(p1, y, u);
    const CV = CM.expenditure(p0, v0, u) - CM.expenditure(p1, v0, u);
    const EV = CM.expenditure(p0, v1, u) - CM.expenditure(p1, v1, u);
    const area = f => CM.integrateP1(f, p11, p10, n);   // positive for a price fall
    return {
      v0, v1, CV, EV,
      CVarea: area(q => CM.hicks([q, p2], v0, u)[0]),
      EVarea: area(q => CM.hicks([q, p2], v1, u)[0]),
      dCS: area(q => CM.demand([q, p2], y, u)[0]),
      x0: CM.demand(p0, y, u), x1: CM.demand(p1, y, u)
    };
  }

  // The bundles behind CV and EV in the (x1, x2) plane: the cheapest bundle on v^0 at the new prices and on v^1
  // at the old prices.
  function bundles(p10, p11, p2, y, u) {
    const w = welfare(p10, p11, p2, y, u, 50);
    return { ...w, cvBundle: CM.hicks([p11, p2], w.v0, u), evBundle: CM.hicks([p10, p2], w.v1, u) };
  }

  const api = { welfare, bundles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WelfareModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
