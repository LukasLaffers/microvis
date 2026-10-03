/*
 * Firms That Affect Each Other: tool math (lecture 5, section 1.2).
 *
 * Two identical firms; firm i's marginal cost rises with its own output and with the other firm's output:
 *   MC_i(q_i; q_j) = c + q_i / alpha + e q_j,
 * e > 0 a negative externality (pollution, congestion), e < 0 a positive one (training, infrastructure).
 * Firm i's supply given the other's output: S^i(p; q_j) = max(0, alpha (p - c - e q_j)).
 * Market supply S(p) = q1 + q2 at the outputs that are consistent with each other (a fixed point);
 * for |alpha e| < 1 it is unique and, when both produce, S(p) = 2 alpha (p - c) / (1 + alpha e).
 * The sum of the marginal cost curves "MC1 + MC2" holds the other firm's output fixed at q-bar.
 *
 * Works in the browser (window.ExternalityModel) and in Node.
 */
(function (root) {
  'use strict';

  const supplyGiven = (s, p, qOther) => Math.max(0, s.alpha * (p - s.c - s.e * qOther));

  // The outputs both firms choose at price p, each taking the other's output as given (iterated best replies;
  // a contraction when |alpha e| < 1).
  function equilibrium(s, p) {
    let q1 = 0, q2 = 0;
    for (let it = 0; it < 5000; it++) {
      const n1 = supplyGiven(s, p, q2), n2 = supplyGiven(s, p, n1);
      const done = Math.abs(n1 - q1) + Math.abs(n2 - q2) < 1e-14 * Math.max(1, n1 + n2);
      q1 = n1; q2 = n2;
      if (done) break;
    }
    return { q1, q2, Q: q1 + q2 };
  }

  const marketSupply = (s, p) => equilibrium(s, p).Q;
  // Slope dS/dp where both firms produce; without the externality it is 2 alpha.
  const marketSlope = s => 2 * s.alpha / (1 + s.alpha * s.e);
  // "MC1 + MC2": the horizontal sum of the firms' supply curves with the other's output fixed at qbar.
  const sumOfMC = (s, p, qbar) => 2 * supplyGiven(s, p, qbar);
  // Price at which each firm, facing the other's output qbar, chooses qbar too: S and MC1 + MC2 cross there.
  const crossingPrice = (s, qbar) => s.c + qbar / s.alpha + s.e * qbar;
  // Price at which market supply reaches Q (both producing).
  const priceFor = (s, Q) => s.c + Q / marketSlope(s);

  const api = { supplyGiven, equilibrium, marketSupply, marketSlope, sumOfMC, crossingPrice, priceFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ExternalityModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
