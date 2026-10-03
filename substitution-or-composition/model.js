/*
 * Substitution or Composition?: tool math (lecture 4, empirical application, Arnberg and Bjørner 2007).
 *
 * Two firms that cannot substitute at all (Leontief), inputs energy E and capital K at prices wE, wK:
 *   energy intensive  phi^E(E,K) = min{E/2, K}: uses (2 qE, qE), unit cost cE = 2 wE + wK
 *   capital intensive phi^K(E,K) = min{E, K/2}: uses (qK, 2 qK), unit cost cK = wE + 2 wK
 * Products sell at unit cost; consumers split a fixed total Q between the two close substitutes:
 *   qE = Q cE^(-eta) / (cE^(-eta) + cK^(-eta)),  qK = Q - qE,   eta >= 0 their substitutability.
 * Aggregates E = 2 qE + qK, K = qE + 2 qK. Inside each firm K/E never changes (sigma = 0), but the aggregate
 * "elasticity of substitution" d log(K/E) / d log(wE/wK) is positive whenever eta > 0.
 *
 * Works in the browser (window.CompositionModel) and in Node.
 */
(function (root) {
  'use strict';

  function economy(wE, wK, eta, Q = 20) {
    const cE = 2 * wE + wK, cK = wE + 2 * wK;
    const aE = Math.pow(cE, -eta), aK = Math.pow(cK, -eta);
    const qE = Q * aE / (aE + aK), qK = Q - qE;
    const firmE = [2 * qE, qE], firmK = [qK, 2 * qK];
    return { cE, cK, qE, qK, firmE, firmK, E: firmE[0] + firmK[0], K: firmE[1] + firmK[1] };
  }

  // The apparent (aggregate) elasticity of substitution at wE/wK, by a central difference in logs.
  function apparentSigma(wE, wK, eta, Q = 20) {
    const h = 1e-5, f = l => { const e = economy(wK * Math.exp(l), wK, eta, Q); return Math.log(e.K / e.E); };
    const l0 = Math.log(wE / wK);
    return (f(l0 + h) - f(l0 - h)) / (2 * h);
  }

  // What an econometrician with aggregate data sees: (log(wE/wK), log(K/E)) for several energy prices, and the
  // OLS slope; within each firm the same regression gives slope 0.
  function regression(wEs, wK, eta, Q = 20) {
    const pts = wEs.map(wE => { const e = economy(wE, wK, eta, Q); return [Math.log(wE / wK), Math.log(e.K / e.E)]; });
    const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    const slope = sxy / sxx;
    return { pts, slope, intercept: my - slope * mx };
  }

  // The notes' example: wE rises from 1 to 2 (wK = 1) and output moves from (10, 10) to (5, 15) exactly when
  // (cE/cK)^(-eta) = (5/4)^(-eta) = 1/3, i.e. eta = log 3 / log(5/4).
  const NOTES_ETA = Math.log(3) / Math.log(5 / 4);

  const api = { economy, apparentSigma, regression, NOTES_ETA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CompositionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
