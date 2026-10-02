/*
 * Marshall's Law of Derived Demand: tool math (lecture 4, section 2 and the Appendix corollary).
 * Firm math from shared/firm-model.js with constant returns ('homog', k = 1, A = 1), so C(w, q) = c(w) q.
 *
 * Supply is flat at p = c(w), the industry produces q = Dem(c(w)) and demands D^1 = H~^1(w) Dem(c(w)).
 *   (dagger)   eps^u_11 = eps^c_11 + eps^D_p sh_1
 *   Corollary  eps^c_11 = -sigma (1 - sh_1),   Theorem 1: sigma = C_12 C / (C_1 C_2)
 *   Marshall   (-eps^u_11) = sigma (1 - sh_1) + (-eps^D_p) sh_1
 * Industry demand: Dem(p) = B p^eps with constant price elasticity eps < 0.
 *
 * Works in the browser (window.MarshallModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;
  const REL = 1e-5;

  // Constant returns: profile 'homog' with k = 1 and A = 1.
  const crs = s => ({ ...s, profile: 'homog', k: 1, A: 1 });
  const demand = (p, dem) => dem.B * Math.pow(p, dem.eps);
  const unitCost = (w, s) => FM.unitCost(w, crs(s));
  const unitInput1 = (w, s) => FM.unitDemand(w, crs(s)).h[0];

  // The industry equilibrium: price, output and input demands.
  function equilibrium(w, s, dem) {
    const c = unitCost(w, s), q = demand(c, dem), h = FM.unitDemand(w, crs(s)).h;
    return { p: c, q, z: [h[0] * q, h[1] * q], h, sh1: w[0] * h[0] / c };
  }

  // The industry demand for input 1, D^1 = H~^1(w) Dem(c(w)), and the conditional demand at a fixed q.
  const industryDemand1 = (w, s, dem) => unitInput1(w, s) * demand(unitCost(w, s), dem);
  const conditional1 = (w, s, q) => unitInput1(w, s) * q;

  // Elasticity of substitution by Theorem 1, sigma = C_12 C / (C_1 C_2), with finite differences of c(w).
  function sigmaTheorem1(w, s) {
    // Step 1e-4: balances truncation (h^2) and rounding (1e-16 / h^2) in the mixed second difference.
    const c = (a, b) => unitCost([a, b], s), [w1, w2] = w, h1 = 1e-4 * w1, h2 = 1e-4 * w2;
    const C = c(w1, w2);
    const C1 = (c(w1 + h1, w2) - c(w1 - h1, w2)) / (2 * h1);
    const C2 = (c(w1, w2 + h2) - c(w1, w2 - h2)) / (2 * h2);
    const C12 = (c(w1 + h1, w2 + h2) - c(w1 + h1, w2 - h2) - c(w1 - h1, w2 + h2) + c(w1 - h1, w2 - h2)) / (4 * h1 * h2);
    return { sigma: C12 * C / (C1 * C2), C, C1, C2, C12 };
  }

  // Numerical elasticities at w: log-derivatives in w1 (conditional at today's output, unconditional along Dem).
  function elasticities(w, s, dem) {
    const eq = equilibrium(w, s, dem), t = Math.exp(REL), up = [w[0] * t, w[1]], dn = [w[0] / t, w[1]];
    const epsC = (Math.log(conditional1(up, s, eq.q)) - Math.log(conditional1(dn, s, eq.q))) / (2 * REL);
    const epsU = (Math.log(industryDemand1(up, s, dem)) - Math.log(industryDemand1(dn, s, dem))) / (2 * REL);
    return { epsC, epsU, sigma: sigmaTheorem1(w, s).sigma, sh1: eq.sh1 };
  }

  // Elasticity of substitution from the technology's formula: 1 (Cobb-Douglas), 1/(1-rho) (CES), 0 (Leontief).
  function sigmaFormula(s) {
    if (s.tech === 'cobb') return 1;
    if (s.tech === 'leontief') return 0;
    return 1 / (1 - s.rho);
  }

  // The formula side: the corollary, (dagger) and Marshall's law as a weighted average.
  function marshall(w, s, dem) {
    const sigma = sigmaFormula(s), sh1 = equilibrium(w, s, dem).sh1;
    const substitution = sigma * (1 - sh1), output = -dem.eps * sh1;
    return { sigma, sh1, epsC: -sigma * (1 - sh1), epsU: -sigma * (1 - sh1) + dem.eps * sh1, substitution, output, weighted: substitution + output };
  }

  // What if w1 rises by a fraction r: the exact change in output, price and industry labour demand.
  function whatIf(w, s, dem, r) {
    const w2 = [w[0] * (1 + r), w[1]], a = equilibrium(w, s, dem), b = equilibrium(w2, s, dem);
    const D0 = industryDemand1(w, s, dem), D1 = industryDemand1(w2, s, dem);
    return { before: a, after: b, D0, D1, pct: D1 / D0 - 1, approx: elasticities(w, s, dem).epsU * r };
  }

  // A technology with elasticity of substitution sigma and the same delta: CES, or Cobb-Douglas at sigma = 1.
  const withSigma = (s, sigma) => Math.abs(sigma - 1) < 1e-9 ? { ...s, tech: 'cobb' } : { ...s, tech: 'ces', rho: 1 - 1 / sigma };
  // Marshall's rules: |eps^u_11| as sigma, -eps^D_p, or the wage (and with it sh_1) varies, the rest fixed.
  const ruleSigma = (w, s, dem, sigmas) => sigmas.map(sg => [sg, -marshall(w, withSigma(s, sg), dem).epsU]);
  const ruleEta = (w, s, dem, etas) => etas.map(e => [e, -marshall(w, s, { ...dem, eps: -e }).epsU]);
  const ruleShare = (w, s, dem, w1s) => w1s.map(v => { const m = marshall([v, w[1]], s, dem); return [m.sh1, -m.epsU, v]; });

  const api = { withSigma, ruleSigma, ruleEta, ruleShare, crs, demand, unitCost, equilibrium, industryDemand1, conditional1, sigmaTheorem1, elasticities, sigmaFormula, marshall, whatIf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarshallModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
