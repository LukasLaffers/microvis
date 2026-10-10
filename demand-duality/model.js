/*
 * UMP and EMP: Two Sides of One Tangency: tool math (lecture 6). Consumer math from shared/consumer-model.js.
 *
 * The four duality identities, Roy's identity (I5), Shephard's lemma (E5), the Kuhn-Tucker multiplier
 * lambda* = U_j / p_j = dV/dy, mu* = dC/dv = 1/lambda*, and the curves V(p1) (I2) and C(p1) (E4) with Shephard's tangent.
 *
 * Works in the browser (window.DualityModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  // The four identities at prices p, income y and utility level v.
  function identities(p, y, v, u) {
    const Vpy = CM.indirect(p, y, u), Cpv = CM.expenditure(p, v, u);
    return {
      C_of_V: { lhs: CM.expenditure(p, Vpy, u), rhs: y },          // C(p, V(p,y)) = y
      V_of_C: { lhs: CM.indirect(p, Cpv, u), rhs: v },             // V(p, C(p,v)) = v
      D_is_H: { lhs: CM.demand(p, y, u), rhs: CM.hicks(p, Vpy, u) },   // D(p,y) = H(p, V(p,y))
      H_is_D: { lhs: CM.hicks(p, v, u), rhs: CM.demand(p, Cpv, u) }    // H(p,v) = D(p, C(p,v))
    };
  }

  // Roy's identity: -dV/dp1 / dV/dy against D1; Shephard's lemma: dC/dp1 against H1; lambda* = dV/dy, mu* = dC/dv.
  function envelope(p, y, v, u) {
    const hp = 1e-5 * p[0], hy = 1e-5 * y;
    const Vp = (CM.indirect([p[0] + hp, p[1]], y, u) - CM.indirect([p[0] - hp, p[1]], y, u)) / (2 * hp);
    const Vy = (CM.indirect(p, y + hy, u) - CM.indirect(p, y - hy, u)) / (2 * hy);
    const Cp = (CM.expenditure([p[0] + hp, p[1]], v, u) - CM.expenditure([p[0] - hp, p[1]], v, u)) / (2 * hp);
    const hv = 1e-5 * Math.max(1, Math.abs(v)), Cv = (CM.expenditure(p, v + hv, u) - CM.expenditure(p, v - hv, u)) / (2 * hv);
    const x = CM.demand(p, y, u), g = CM.gradient(x, u);
    return { roy: -Vp / Vy, D1: x[0], shephard: Cp, H1: CM.hicks(p, v, u)[0], lambda: Vy, mu: Cv, kkt: [g[0] / p[0], g[1] / p[1]] };
  }

  // V(p1, p2, y) and C(p1, p2, v) as functions of p1.
  const curveV = (p2, y, u, p1s) => p1s.map(p1 => [p1, CM.indirect([p1, p2], y, u)]);
  const curveC = (p2, v, u, p1s) => p1s.map(p1 => [p1, CM.expenditure([p1, p2], v, u)]);

  const api = { identities, envelope, curveV, curveC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DualityModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
