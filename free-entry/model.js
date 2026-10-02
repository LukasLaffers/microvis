/*
 * Free Entry and Industry Size: tool math (lecture 5, section 1.3). Firm math from shared/firm-model.js.
 *
 * N identical price-taking firms with the U-shaped cost C(w,q) = c(w) G(q) ('ushape' profile) face industry
 * demand D(p) = M (pMax - p). With N firms the market clears where N q(p) = D(p), q(p) the firm's output on the
 * rising branch of MC. Firms keep entering while the entrant still makes a profit: the industry size N is the
 * largest number with Pi(q_N) >= 0, so Pi(q_{N+1}) < 0. Profit is non-negative exactly when p_N >= min AC = p-hat,
 * i.e. when D(p-hat) >= N q-hat, so N = floor(D(p-hat) / q-hat). In large markets p_N -> p-hat: zero profit.
 *
 * Works in the browser (window.FreeEntryModel, needs window.FirmModel) and in Node.
 */
(function (root) {
  'use strict';

  const FM = typeof module !== 'undefined' && module.exports ? require('../shared/firm-model.js') : root.FirmModel;

  const demand = (p, d) => Math.max(0, d.M * (d.pMax - p));
  // Lowest point of MC (at q = a for the 'ushape' profile) and output on the rising branch of MC at price p.
  const mcMin = (w, s) => FM.MC(w, s.a, s);
  function outputOnMC(w, p, s) {
    const b = s.a * s.a + s.m, c = FM.unitCost(w, s);
    return s.a + Math.sqrt(Math.max(0, s.a * s.a - b + p / c));
  }

  // Market equilibrium with N firms all producing on their MC curves (profit may be negative).
  function equilibrium(N, w, s, d) {
    const lo = mcMin(w, s), hi = d.pMax;
    const f = p => N * outputOnMC(w, p, s) - demand(p, d);
    if (f(lo) > 0) return null;   // the market is too small for N firms on the rising part of MC
    let a = lo, b = hi;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) > 0) b = m; else a = m; }
    const p = 0.5 * (a + b), q = outputOnMC(w, p, s);
    return { N, p, q, Q: N * q, profit: p * q - FM.cost(w, q, s), AC: FM.AC(w, q, s), MC: FM.MC(w, q, s) };
  }

  // Industry size: the largest N with Pi(q_N) >= 0.
  function industrySize(w, s, d) {
    const { pHat, qHat } = FM.minAC(w, s);
    return Math.max(0, Math.floor(demand(pHat, d) / qHat + 1e-12));
  }

  // Largest N for which the market can be shared on the rising branch of MC (for the slider range).
  const maxFirms = (w, s, d) => Math.max(1, Math.floor(demand(mcMin(w, s), d) / s.a));

  const api = { demand, mcMin, outputOnMC, equilibrium, industrySize, maxFirms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FreeEntryModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
