/*
 * The Deadweight Loss of a Tax: tool math (lecture 7, section 1.1). Consumer math from shared/consumer-model.js.
 *
 * A tax raises the consumer price of good 1 from p1^0 to p1^1 (= p1^0 (1 + tau) for a value added tax tau).
 * Utility after the tax v^1 = V(p^1, y); revenue T = (p1^1 - p1^0) D^1(p^1, y); the consumer's loss
 * |EV| = C(p^1, v^1) - C(p^0, v^1) = area left of H^1(p1, 1, v^1) between the prices. DWL = |EV| - T > 0 because
 * the Hicksian curve slopes down. First-order approximations:
 *   DWL ~ -(1/2) dH^1/dp1 (p1^1 - p1^0)^2,    DWL/T ~ -(1/2) eps^c_11 (p1^1 - p1^0)/p1^1.
 *
 * Works in the browser (window.DWLModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  function tax(p10, p11, p2, y, u) {
    const p0 = [p10, p2], p1 = [p11, p2], x1 = CM.demand(p1, y, u), x0 = CM.demand(p0, y, u), v1 = CM.utility(x1, u);
    const T = (p11 - p10) * x1[0];
    const lossEV = CM.expenditure(p1, v1, u) - CM.expenditure(p0, v1, u);
    const DWL = lossEV - T;
    const dH = CM.dHdp(p1, v1, u, 0, 0), epsC = dH * p11 / x1[0];
    const approx = -0.5 * dH * (p11 - p10) ** 2;
    return { x0, x1, v0: CM.utility(x0, u), v1, T, lossEV, DWL, approx, ratio: DWL / T, ratioApprox: -0.5 * epsC * (p11 - p10) / p11, epsC };
  }

  // Part of the notes' table (1999 data, 14 commodity groups): budget share, income elasticity, uncompensated and
  // compensated own-price elasticities, effective tax rate (p1 - p0)/p1, and DWL per krone of tax.
  const GROUPS = [
    ['Food and non-alcoholic drinks', 0.143, 0.31, -0.21, -0.17, 0.21, 0.018],
    ['Alcohol and tobacco', 0.046, 0.94, -0.75, -0.71, 0.69, 0.250],
    ['Clothing and footwear', 0.055, 1.16, -0.51, -0.49, 0.19, 0.047],
    ['Gross rents', 0.155, 1.13, -0.61, -0.44, 0.02, 0.004],
    ['Electricity', 0.028, 0.42, -0.26, -0.25, 0.28, 0.035],
    ['Fuels', 0.005, 0.18, -0.48, -0.48, 0.23, 0.055],
    ['Health', 0.026, 0.74, -0.32, -0.30, 0.08, 0.012],
    ['Private transport', 0.094, 1.39, -0.84, -0.71, 0.42, 0.149],
    ['Public local transport', 0.017, 0.87, -0.66, -0.65, 0.00, 0.000],
    ['Public distant transport', 0.010, 1.77, -1.65, -1.63, 0.05, 0.041],
    ['Post and telecommunication', 0.022, 0.31, -0.28, -0.27, 0.18, 0.024],
    ['Other goods', 0.151, 1.03, -0.53, -0.37, 0.17, 0.031],
    ['Other services', 0.181, 1.20, -0.62, -0.40, 0.11, 0.022],
    ['Direct purchases abroad', 0.067, 1.52, -0.92, -0.82, 0.00, 0]
  ].map(([name, b, eta, eu, ec, rate, dwlT]) => ({ name, b, eta, eu, ec, rate, dwlT, approx: -0.5 * ec * rate }));

  const api = { tax, GROUPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DWLModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
