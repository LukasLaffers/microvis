/*
 * Excess Demand and Equilibrium: tool math (lecture 9).
 *
 * A production economy with three goods, two firms and two consumers:
 *   firms A and B turn goods 1 and 2 into good 3, phi_f(z1, z2) = (z1^rho_f + z2^rho_f)^(1/(2 rho_f)), rho_f < 1, rho_f != 0
 *     (homogeneous of degree 1/2, so decreasing returns and positive profit);
 *   consumer Alpha: U = x1^alpha x3^(1-alpha), endowment (0, 1, 1), owns firm A;
 *   consumer Beta:  U = x2^beta  x3^(1-beta),  endowment (1, 0, 1), owns firm B.
 * Excess demand E_i(p) = x_i(p) - q_i(p) - R_i (demand of both consumers, minus net output of both firms, minus the
 * endowments), as in the notes. The firm is solved in two steps (cost minimisation, then output), as in lecture 2.
 *
 * Works in the browser (window.ExcessModel) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  // Firm with phi = g(z)^(1/2), g CES of degree 1: unit cost W = (w1^(1-s) + w2^(1-s))^(1/(1-s)), s = 1/(1-rho).
  // Cost C(w, q) = q^2 W (to produce q you need g = q^2); supply q = p3 / (2W); input demand H^i = q^2 (w_i / W)^(-s).
  function firm(p, rho) {
    const s = 1 / (1 - rho), W = Math.pow(Math.pow(p[0], 1 - s) + Math.pow(p[1], 1 - s), 1 / (1 - s));
    const q = p[2] / (2 * W);
    const z = [0, 1].map(i => q * q * Math.pow(p[i] / W, -s));
    return { q, z, W, profit: p[2] * q - p[0] * z[0] - p[1] * z[1] };
  }

  const R = { alpha: [0, 1, 1], beta: [1, 0, 1] };

  // Everything at prices p = [p1, p2, p3]: firms, incomes, demands, supplies and excess demands.
  function economy(p, par) {
    const A = firm(p, par.rhoA), B = firm(p, par.rhoB);
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const yA = dot(p, R.alpha) + A.profit, yB = dot(p, R.beta) + B.profit;
    const xa = [par.alpha * yA / p[0], 0, (1 - par.alpha) * yA / p[2]];
    const xb = [0, par.beta * yB / p[1], (1 - par.beta) * yB / p[2]];
    const demand = [0, 1, 2].map(i => xa[i] + xb[i] + (i < 2 ? A.z[i] + B.z[i] : 0));
    const supply = [0, 1, 2].map(i => R.alpha[i] + R.beta[i] + (i === 2 ? A.q + B.q : 0));
    return { p, A, B, yA, yB, xa, xb, demand, supply, E: demand.map((d, i) => d - supply[i]) };
  }
  const excess = (p, par) => economy(p, par).E;

  // Price adjustment (Walras' auctioneer) with p3 = 1: each step raises the price of a good in excess demand and lowers
  // the price of a good in excess supply, in proportion to its excess demand (in logs, so prices stay positive).
  function tatonnement(p0, par, { h = 0.08, steps = 400, tol = 1e-6 } = {}) {
    let p = [p0[0], p0[1]];
    const path = [p.slice()];
    for (let k = 0; k < steps; k++) {
      const E = excess([p[0], p[1], 1], par);
      if (Math.hypot(E[0], E[1]) < tol) break;
      p = [0, 1].map(i => p[i] * Math.exp(Math.max(-0.25, Math.min(0.25, h * E[i]))));
      path.push(p.slice());
    }
    return path;
  }

  // Equilibrium with p3 = 1: Newton's method on (log p1, log p2) for E1 = E2 = 0, started from the auctioneer's path.
  // By Walras' law E3 = 0 then follows.
  function equilibrium(par) {
    const start = tatonnement([1, 1], par, { steps: 600 });
    let u = start[start.length - 1].map(Math.log);
    const F = v => excess([Math.exp(v[0]), Math.exp(v[1]), 1], par).slice(0, 2);
    for (let k = 0; k < 60; k++) {
      const f = F(u), h = 1e-7;
      if (Math.hypot(f[0], f[1]) < 1e-13) break;
      const J = [0, 1].map(j => { const v = u.slice(); v[j] += h; const g = F(v); return [(g[0] - f[0]) / h, (g[1] - f[1]) / h]; });
      // J[j][i] = dF_i / dv_j
      const det = J[0][0] * J[1][1] - J[1][0] * J[0][1];
      if (!Number.isFinite(det) || Math.abs(det) < 1e-14) break;
      let d0 = (J[1][1] * f[0] - J[1][0] * f[1]) / det, d1 = (-J[0][1] * f[0] + J[0][0] * f[1]) / det;
      const cap = Math.max(1, Math.hypot(d0, d1) / 0.5);
      u = [u[0] - d0 / cap, u[1] - d1 / cap];
    }
    const p = [Math.exp(u[0]), Math.exp(u[1]), 1];
    return { p, ...economy(p, par) };
  }

  const ASSIGNMENT = { rhoA: -1, rhoB: -2, alpha: 0.3, beta: 0.7 };

  const api = { firm, economy, excess, tatonnement, equilibrium, R, ASSIGNMENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ExcessModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
