// Checks free entry and industry size (lecture 5, section 1.3).
// Run with:  node free-entry/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

for (const tech of ['cobb', 'ces']) for (const [a, m] of [[2, 1], [1.5, 0.5], [2.5, 2]]) for (const w of [[1, 1], [2, 0.7]]) for (const M_ of [1, 4, 15, 60]) {
  const s = { tech, delta: 0.5, rho: -0.5, profile: 'ushape', A: 1, k: 0.6, a, m }, d = { M: M_, pMax: 3 * FM.minAC(w, s).pHat };
  const label = JSON.stringify({ s, w, d });
  // On the rising branch of MC the output is the supply S(w,p) whenever p > p-hat.
  const { pHat, qHat } = FM.minAC(w, s);
  close(M.outputOnMC(w, 1.3 * pHat, s), FM.supply(w, 1.3 * pHat, s).q, 1e-9, 'supply branch ' + label);
  close(FM.MC(w, M.outputOnMC(w, 1.1 * pHat, s), s), 1.1 * pHat, 1e-9, 'MC = p');
  const Nmax = M.maxFirms(w, s, d), Nstar = M.industrySize(w, s, d);
  let prevP = Infinity, prevProfit = Infinity, lastNonNeg = 0;
  for (let N = 1; N <= Nmax; N++) {
    const e = M.equilibrium(N, w, s, d);
    assert.ok(e, 'equilibrium exists up to maxFirms ' + label);
    // Market clears, price falls with N, profit falls with N.
    close(e.Q, M.demand(e.p, d), 1e-8, 'clearing ' + label);
    assert.ok(e.p < prevP + 1e-12 && e.profit < prevProfit + 1e-9, 'monotone in N ' + label);
    // Profit is non-negative exactly when p >= p-hat.
    assert.equal(e.profit >= -1e-9, e.p >= pHat - 1e-9, 'profit sign ' + label);
    if (e.profit >= -1e-9) lastNonNeg = N;
    prevP = e.p; prevProfit = e.profit;
    checks += 4;
  }
  // The industry size: Pi(q_N) >= 0 but Pi(q_{N+1}) < 0.
  if (Nstar >= 1 && Nstar < Nmax) {
    assert.equal(Nstar, lastNonNeg, 'industry size ' + label);
    assert.ok(M.equilibrium(Nstar, w, s, d).profit >= -1e-9 && M.equilibrium(Nstar + 1, w, s, d).profit < 0);
    checks += 2;
  }
}

// In ever larger markets the price with free entry approaches min AC (zero profit in the long run).
{
  const s = { tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 }, w = [1, 1];
  let prevGap = Infinity;
  for (const M_ of [2, 20, 200, 2000]) {
    const d = { M: M_, pMax: 10 }, N = M.industrySize(w, s, d), e = M.equilibrium(N, w, s, d);
    const gap = e.p - 4;
    assert.ok(gap >= -1e-9 && gap < prevGap + 1e-9); prevGap = gap;
    checks++;
  }
  assert.ok(prevGap < 1e-3, 'p -> min AC');
  checks++;
}

// Defaults of the page: Cobb-Douglas, 'ushape' a = 2, m = 1, w = (1, 1), D(p) = 6.6 (10 - p), N = 3.
{
  const s = { tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 }, w = [1, 1], d = { M: 6.6, pMax: 10 };
  close(FM.minAC(w, s).pHat, 4, 1e-12); close(FM.minAC(w, s).qHat, 3, 1e-12);
  assert.equal(M.industrySize(w, s, d), 13); assert.equal(M.maxFirms(w, s, d), 26);
  const e3 = M.equilibrium(3, w, s, d), e13 = M.equilibrium(13, w, s, d), e14 = M.equilibrium(14, w, s, d);
  close(e3.p, 8.28512, 1e-5); close(e3.q, 3.77273, 1e-5); close(e3.profit, 14.66479, 1e-5);
  close(e13.p, 4.06107, 1e-5); close(e13.profit, 0.18366, 1e-4); close(e14.profit, -0.69818, 1e-4);
  checks += 10;
}

console.log(`All ${checks} free-entry checks passed.`);
