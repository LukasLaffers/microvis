/*
 * From Firms to Market Supply: tool math (lecture 5, section 1.1).
 *
 * The notes' firms: an avoidable fixed cost F and a linear marginal cost,
 *   C(q) = F + c q + q^2 / (2 alpha)  for q > 0,  C(0) = 0,
 * so MC = c + q / alpha, AC = F/q + c + q/(2 alpha). The firm starts to produce at
 *   q-hat = sqrt(2 alpha F),  p' = min AC = c + q-hat / alpha,
 * and its supply is 0 for p < p', {0, q-hat} at p = p', and q-hat + alpha (p - p') = alpha (p - c) above.
 * With F = 0 supply is continuous: alpha (p - c) for p > c.
 * Industry demand: D(p) = K p^(-eps).
 *
 * Works in the browser (window.MarketSupplyModel) and in Node.
 */
(function (root) {
  'use strict';

  const TOL = 1e-9;
  const near = (a, b) => Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b));

  const cost = (f, q) => q > 0 ? f.F + f.c * q + q * q / (2 * f.alpha) : 0;
  const MC = (f, q) => f.c + q / f.alpha;
  const AC = (f, q) => cost(f, q) / q;

  function startPoint(f) {
    const qHat = Math.sqrt(2 * f.alpha * f.F);
    return { qHat, pHat: f.c + qHat / f.alpha };
  }

  // All profit-maximising outputs at price p (one value, or two at p = p' when F > 0).
  function supplySet(f, p) {
    const { qHat, pHat } = startPoint(f);
    if (f.F > 0 && near(p, pHat)) return [0, qHat];
    return p > pHat ? [f.alpha * (p - f.c)] : [0];
  }
  // Supply away from the jump (the larger option at p = p').
  const supplyAt = (f, p) => Math.max(...supplySet(f, p));
  const profit = (f, p) => { const q = supplyAt(f, p); return p * q - cost(f, q); };

  const demand = (p, dem) => dem.K * Math.pow(p, -dem.eps);

  // The market supply correspondence: every sum of the firms' optimal outputs.
  function marketSupplySet(firms, p) {
    let sums = [0];
    for (const f of firms) {
      const next = [];
      for (const s of sums) for (const q of supplySet(f, p)) next.push(s + q);
      sums = next;
    }
    return [...new Set(sums.map(v => Math.round(v * 1e9) / 1e9))].sort((a, b) => a - b);
  }

  // Equilibrium of the market with these firms: a price with D(p) in the market supply set.
  // Between the jump prices supply is a continuous increasing function, so D - S is decreasing there.
  function equilibrium(firms, dem, pMax = 1e4) {
    const jumps = [...new Set(firms.filter(f => f.F > 0).map(f => startPoint(f).pHat))].sort((a, b) => a - b);
    const S = p => firms.reduce((s, f) => s + supplyAt(f, p), 0);
    const Z = p => demand(p, dem) - S(p);
    const edges = [1e-9, ...jumps, pMax];
    // Equilibria exactly at a jump price.
    for (const pj of jumps) {
      const set = marketSupplySet(firms, pj), d = demand(pj, dem);
      const hit = set.find(v => Math.abs(v - d) <= 1e-9 * Math.max(1, d));
      if (hit !== undefined) return { exists: true, p: pj, Q: d, atJump: true };
    }
    // Regular equilibria inside an interval.
    for (let k = 0; k + 1 < edges.length; k++) {
      const lo = edges[k] * (1 + 1e-7) + 1e-12, hi = edges[k + 1] * (1 - 1e-7);   // clear of the jump tolerance
      if (!(hi > lo) || !(Z(lo) > 0 && Z(hi) < 0)) continue;
      let a = lo, b = hi;
      for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (Z(m) > 0) a = m; else b = m; }
      const p = 0.5 * (a + b);
      return { exists: true, p, Q: demand(p, dem), atJump: false };
    }
    // None: demand passes through a gap in supply at one of the jump prices.
    const gap = jumps.find(pj => Z(pj * (1 - 1e-7)) > 0 && Z(pj * (1 + 1e-7)) < 0);
    return { exists: false, gapPrice: gap !== undefined ? gap : null };
  }

  // Average supply of N identical firms at price p: the set {k q-hat / N} at p = p'.
  function averageSupplySet(f, N, p) {
    const { qHat, pHat } = startPoint(f);
    if (f.F > 0 && near(p, pHat)) return Array.from({ length: N + 1 }, (_, k) => k * qHat / N);
    return [supplyAt(f, p)];
  }

  // Equilibrium for N identical firms when demand per firm is d(p) = D(p) / N (market size grows with N).
  // If d(p') >= q-hat all firms produce at a price p >= p'; otherwise the price is p' and k of the N firms produce,
  // with k the closest integer to N d(p') / q-hat (exact only in the limit N -> infinity).
  function averageEquilibrium(f, N, demPerFirm) {
    const { qHat, pHat } = startPoint(f), d0 = demand(pHat, demPerFirm);
    if (d0 >= qHat) {
      let a = pHat, b = Math.max(2 * pHat, 1);
      while (demand(b, demPerFirm) > supplyAt(f, b)) b *= 2;
      for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (demand(m, demPerFirm) > supplyAt(f, m)) a = m; else b = m; }
      const p = 0.5 * (a + b);
      return { p, producing: N, avgSupply: supplyAt(f, p), avgDemand: demand(p, demPerFirm), share: 1, gap: 0 };
    }
    const share = d0 / qHat, k = Math.round(N * share);
    return { p: pHat, producing: k, avgSupply: k * qHat / N, avgDemand: d0, share, gap: Math.abs(k * qHat / N - d0) };
  }

  const api = { cost, MC, AC, startPoint, supplySet, supplyAt, profit, demand, marketSupplySet, equilibrium, averageSupplySet, averageEquilibrium };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarketSupplyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
