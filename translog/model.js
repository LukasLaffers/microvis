/*
 * Translog Cost Shares: tool math (lecture 4, section 3 and the Appendix).
 *
 * With constant returns C = c(w) q. In log prices omega_i = log w_i the translog unit cost is
 *   log c = alpha_0 + sum_i alpha_i omega_i + 1/2 sum_i sum_j beta_ij omega_i omega_j,
 * the second-order Taylor approximation of kappa = f(omega) = log c(exp omega) around omega-bar:
 *   beta_ij = f_ij,  alpha_i = f_i - sum_j f_ij omega-bar_j,
 *   alpha_0 = f - sum_i f_i omega-bar_i + 1/2 sum_i sum_j f_ij omega-bar_i omega-bar_j.
 * Shephard's lemma gives the share equations  (&)  sh_i = alpha_i + sum_j beta_ij log w_j  and
 *   (%)  eps^c_ii = (beta_ii - sh_i + sh_i^2) / sh_i
 *   (#)  eps^c_ij = (beta_ij + sh_i sh_j) / sh_i
 *   ($)  sigma_ij = (beta_ij + sh_i sh_j) / (sh_i sh_j).
 * Parameters: { a0, alpha: [n], beta: [n][n] } (beta need not be symmetric when entered by hand).
 *
 * Works in the browser (window.TranslogModel) and in Node.
 */
(function (root) {
  'use strict';

  const H = 1e-4;   // step in log prices for the numerical gradient and Hessian

  // Second-order approximation of log f(w) in log prices around wbar (f: price vector -> unit cost).
  function translogFromUnitCost(f, wbar) {
    const n = wbar.length, ob = wbar.map(Math.log);
    const kappa = om => Math.log(f(om.map(Math.exp)));
    const at = (i, di, j, dj) => { const o = ob.slice(); o[i] += di; if (j !== undefined) o[j] += dj; return kappa(o); };
    const k0 = kappa(ob);
    const g = ob.map((_, i) => (at(i, H) - at(i, -H)) / (2 * H));
    const B = ob.map((_, i) => ob.map((_, j) => i === j
      ? (at(i, H) - 2 * k0 + at(i, -H)) / (H * H)
      : (at(i, H, j, H) - at(i, H, j, -H) - at(i, -H, j, H) + at(i, -H, j, -H)) / (4 * H * H)));
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) B[i][j] = B[j][i] = (B[i][j] + B[j][i]) / 2;
    const alpha = g.map((gi, i) => gi - B[i].reduce((s, b, j) => s + b * ob[j], 0));
    let a0 = k0;
    for (let i = 0; i < n; i++) { a0 -= g[i] * ob[i]; for (let j = 0; j < n; j++) a0 += 0.5 * B[i][j] * ob[i] * ob[j]; }
    return { a0, alpha, beta: B };
  }

  function logUnitCost(P, w) {
    const om = w.map(Math.log);
    let v = P.a0;
    for (let i = 0; i < om.length; i++) { v += P.alpha[i] * om[i]; for (let j = 0; j < om.length; j++) v += 0.5 * P.beta[i][j] * om[i] * om[j]; }
    return v;
  }

  // (&): the cost shares, linear in log prices.
  const shares = (P, w) => P.alpha.map((a, i) => a + P.beta[i].reduce((s, b, j) => s + b * Math.log(w[j]), 0));

  // (%), (#), ($) at prices w: own- and cross-price elasticities eps[i][j] and sigma[i][j].
  function elasticities(P, w) {
    const sh = shares(P, w), n = sh.length;
    const eps = sh.map((si, i) => sh.map((sj, j) => i === j ? (P.beta[i][i] - si + si * si) / si : (P.beta[i][j] + si * sj) / si));
    const sigma = sh.map((si, i) => sh.map((sj, j) => (P.beta[i][j] + si * sj) / (si * sj)));
    return { sh, eps, sigma, n };
  }

  // Restrictions 1-4 of the notes. Restriction 4 (negative own-price elasticities) is checked on a grid of
  // log prices in [-R, R]^n; it needs positive shares there, which is reported too.
  function checkRestrictions(P, R = Math.log(4), tol = 1e-9, m = 21) {
    const n = P.alpha.length;
    const sumAlpha = P.alpha.reduce((s, a) => s + a, 0);
    const colSums = P.alpha.map((_, j) => P.beta.reduce((s, row) => s + row[j], 0));
    const rowSums = P.beta.map(row => row.reduce((s, b) => s + b, 0));
    let symGap = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) symGap = Math.max(symGap, Math.abs(P.beta[i][j] - P.beta[j][i]));
    let worst = -Infinity, worstAt = null, sharesPositive = true;
    const idx = new Array(n).fill(0);
    for (;;) {
      const w = idx.map(k => Math.exp(-R + 2 * R * k / (m - 1)));
      const e = elasticities(P, w);
      e.sh.forEach((s, i) => {
        if (!(s > 0)) sharesPositive = false;
        const v = s > 0 ? e.eps[i][i] : Infinity;
        if (v > worst) { worst = v; worstAt = { w, i }; }
      });
      let k = 0;
      while (k < n && ++idx[k] === m) idx[k++] = 0;
      if (k === n) break;
    }
    return {
      addingUp: { ok: Math.abs(sumAlpha - 1) <= tol && colSums.every(c => Math.abs(c) <= tol), sumAlpha, colSums },
      homogeneity: { ok: rowSums.every(r => Math.abs(r) <= tol), rowSums },
      symmetry: { ok: symGap <= tol, gap: symGap },
      negativeOwn: { ok: sharesPositive && worst < 0, worst, worstAt, sharesPositive }
    };
  }

  // The notes' two Leontief firms: phi^E = min{E/2, K} (energy intensive), phi^K = min{E, K/2}.
  // Cost-minimising inputs for outputs yE and yK, and the industry totals.
  function aggregate(yE, yK) {
    const firmE = { E: 2 * yE, K: yE }, firmK = { E: yK, K: 2 * yK };
    return { firmE, firmK, E: firmE.E + firmK.E, K: firmE.K + firmK.K };
  }

  // Arnberg and Bjørner (2007): part of their Table 3 (translog with fixed effects) and Table 5 (price
  // elasticities at sample-mean cost shares), as reported in the notes. Inputs: 1 electricity,
  // 2 other energy, 3 labour, 4 machine capital. Stars: * 10 %, ** 5 %, *** 1 %.
  const ARNBERG_BJORNER = {
    inputs: ['Electricity', 'Other energy', 'Labour', 'Machines'],
    alpha: [0.054, 0.013, 0.314, 0.619],
    beta: [
      [0.020, 0.001, -0.013, -0.008],
      [0.001, 0.010, -0.004, -0.006],
      [-0.013, -0.004, 0.044, -0.027],
      [-0.008, -0.006, -0.027, 0.041]
    ],
    betaStars: [['***', '', '**', '*'], ['', '***', '', '**'], ['**', '', '', ''], ['*', '**', '', '*']],
    betaSE: [
      [0.002, 0.001, 0.005, 0.004],
      [0.001, 0.001, 0.003, 0.003],
      [0.005, 0.003, 0.029, 0.024],
      [0.004, 0.003, 0.024, 0.021]
    ],
    betaT: [0.00028, 0.00035, -0.000019, -0.00062], betaTSE: [0.00025, 0.00027, 0.001, 0.001], betaTStars: ['', '', '', ''],
    betaV: [-0.001, -0.002, 0.015, -0.012], betaVSE: [0.001, 0.002, 0.006, 0.005], betaVStars: ['', '', '***', '**'],
    betaB: [0.00045, -0.00053, -0.014, 0.014], betaBSE: [0.001, 0.00038, 0.003, 0.003], betaBStars: ['', '', '***', '***'],
    chi2: '6.0 (3)', p: 0.114, N: 2375,
    // elasticity of input i (row) with respect to price P_j (column), standard errors, stars
    eps: [
      [-0.214, 0.042, 0.375, -0.203],
      [0.063, -0.450, 0.628, -0.242],
      [0.011, 0.013, -0.082, 0.057],
      [-0.061, -0.049, 0.563, -0.453]
    ],
    se: [
      [0.060, 0.045, 0.191, 0.158],
      [0.067, 0.078, 0.188, 0.141],
      [0.006, 0.004, 0.033, 0.027],
      [0.048, 0.028, 0.268, 0.235]
    ],
    stars: [['***', '', '*', ''], ['', '***', '***', '*'], ['*', '***', '**', '**'], ['', '*', '*', '*']]
  };

  const api = { translogFromUnitCost, logUnitCost, shares, elasticities, checkRestrictions, aggregate, ARNBERG_BJORNER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TranslogModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
