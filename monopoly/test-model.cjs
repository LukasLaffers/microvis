// Checks the monopoly and product-differentiation math of lecture 5 (sections 1.4-1.5).
// Run with:  node monopoly/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
const W = [1, 1];

const techs = [[2, 1], [1.5, 0.5], [2.5, 1.5]].map(([a, m]) => ({ tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a, m }));
const demands = [];
for (const A of [6, 9, 12, 20]) for (const B of [0.5, 1, 2]) demands.push({ type: 'linear', A, B });
for (const K of [8, 14, 25]) for (const e of [-1.5, -2, -4]) demands.push({ type: 'ce', K, eta: e });
for (const A of [8, 12]) for (const B of [0.5, 1.5]) for (const g of [0.4, 0.7, 1, 1.6, 2.5]) demands.push({ type: 'curved', A, B, g });

for (const s of techs) for (const d of demands) {
  const label = JSON.stringify({ s, d });
  // Derivatives of revenue and p(q) by finite differences.
  const q0 = 1.7, h = 1e-6;
  close(M.MR(q0, d), (M.price(q0 + h, d) * (q0 + h) - M.price(q0 - h, d) * (q0 - h)) / (2 * h), 1e-6, 'MR ' + label);
  close(M.eta(q0, d), (Math.log(q0 + h) - Math.log(q0 - h)) / (Math.log(M.price(q0 + h, d)) - Math.log(M.price(q0 - h, d))), 1e-5, 'eta ' + label);
  const o = M.optimum(W, s, d);
  // Brute-force maximum of profit.
  let best = 0;
  for (let q = 0.001; q <= M.qLimit(d, s); q += 0.001) best = Math.max(best, M.profitAt(q, W, s, d));
  if (o.shutdown) { assert.ok(best <= 1e-6 && o.profit < 0, 'shutdown ' + label); checks++; continue; }
  assert.ok(o.profit >= best - 1e-9, 'optimum ' + label);
  close(o.profit, best, 1e-5, 'optimum value ' + label);
  // MR = MC and the markup rule p = MC / (1 + 1/eta).
  close(o.MR, o.MC, 1e-7, 'MR = MC ' + label);
  close(o.p, o.MC / (1 + 1 / o.eta), 1e-6, 'markup ' + label);
  // Profit = (AR - AC) q.
  close(o.profit, (o.p - o.AC) * o.q, 1e-9, 'profit rectangle ' + label);
  // Demand is elastic at the optimum (MR = MC > 0) and the monopolist produces less than a price taker.
  assert.ok(o.eta < -1, 'elastic ' + label);
  const c = M.competitive(W, s, d);
  if (c) { assert.ok(o.q < c.q && o.p > c.p, 'less output, higher price ' + label); checks++; }
  checks += 8;
}

// Constant elasticity: MR = p (1 + 1/eta), so the markup p / MC = eta / (1 + eta) is the same at every output.
{
  const d = { type: 'ce', K: 14, eta: -2 }, s = techs[0], o = M.optimum(W, s, d);
  close(o.p / o.MC, 2, 1e-6); close(M.MR(3.3, d), M.price(3.3, d) / 2, 1e-12);
  checks += 2;
}

// Long run with differentiated products: at A* profit is zero and AR is tangent to AC where MR = MC.
for (const s of techs) for (const B of [0.5, 1, 2]) {
  const As = M.tangencyIntercept(W, s, B), d = { type: 'linear', A: As, B }, o = M.optimum(W, s, d);
  close(o.profit, 0, 1e-6, 'zero profit');
  close(o.p, o.AC, 1e-4, 'AR = AC');
  const h = 1e-5, acSlope = (FM.AC(W, o.q + h, s) - FM.AC(W, o.q - h, s)) / (2 * h);
  close(acSlope, -B, 1e-3, 'tangent: slope of AC = slope of AR');
  close(o.MR, o.MC, 1e-6, 'MR = MC');
  // The tangency is on the falling part of AC: output below the minimum of AC.
  assert.ok(o.q < FM.minAC(W, s).qHat);
  checks += 5;
}

// Defaults of the page: Cobb-Douglas, 'ushape' a = 2, m = 1, w = (1, 1) (C = 2(q^3/3 - 2q^2 + 5q)); AR = 12 - q.
{
  const s = techs[0], d = { type: 'linear', A: 12, B: 1 }, o = M.optimum(W, s, d);
  close(o.q, (3 + Math.sqrt(13)) / 2, 1e-9); close(o.p, 12 - (3 + Math.sqrt(13)) / 2, 1e-9);
  close(o.profit, 15.3107, 1e-4);
  const c = M.competitive(W, s, d);
  close(c.q, (7 + Math.sqrt(65)) / 4, 1e-9);
  // Deadweight loss: p - MC = 12 - q - 2(q^2 - 4q + 5) = 2 + 7q - 2q^2, integrated by hand from q* to the price taker's q.
  const F = q => 2 * q + 3.5 * q * q - 2 / 3 * q ** 3;
  close(M.deadweightLoss(W, s, d, o.q, c.q), F(c.q) - F(o.q), 1e-9, 'deadweight loss');
  assert.ok(M.deadweightLoss(W, s, d, o.q, c.q) > 0);
  const As = M.tangencyIntercept(W, s, 1);
  close(As, 6.625, 1e-6); close(M.optimum(W, s, { type: 'linear', A: As, B: 1 }).q, 2.25, 1e-4);
  checks += 8;
}

// Curved demand p = A - B q^g: MR = A - (1 + g) B q^g; g = 1 is the linear case; the long-run tangency works the same way.
{
  for (const g of [0.4, 0.7, 1.6, 2.5]) for (const q of [0.3, 1, 2.2]) {
    const d = { type: 'curved', A: 12, B: 1, g };
    close(M.MR(q, d), 12 - (1 + g) * Math.pow(q, g), 1e-12, 'MR closed form');
    close(M.price(q, d) - M.MR(q, d), -q * M.priceSlope(q, d), 1e-12, 'AR - MR = -q p\'(q)');
    // MR is (1 + g) times as steep as AR at every output (twice as steep for linear demand)
    const h = 1e-6, mrSlope = (M.MR(q + h, d) - M.MR(q - h, d)) / (2 * h);
    close(mrSlope, (1 + g) * M.priceSlope(q, d), 1e-6, 'MR slope = (1 + g) AR slope');
    checks += 3;
  }
  const s = techs[0], lin = M.optimum(W, s, { type: 'linear', A: 12, B: 1 }), cur = M.optimum(W, s, { type: 'curved', A: 12, B: 1, g: 1 });
  close(cur.q, lin.q, 1e-9, 'g = 1 is linear'); close(cur.profit, lin.profit, 1e-9);
  checks += 2;
  for (const s2 of techs) for (const g of [0.6, 1.5]) {
    const As = M.tangencyIntercept(W, s2, 1, g), d = { type: 'curved', A: As, B: 1, g }, o = M.optimum(W, s2, d);
    close(o.profit, 0, 1e-6, 'zero profit (curved)'); close(o.p, o.AC, 1e-4, 'AR = AC (curved)');
    const h = 1e-5, acSlope = (FM.AC(W, o.q + h, s2) - FM.AC(W, o.q - h, s2)) / (2 * h);
    close(acSlope, M.priceSlope(o.q, d), 2e-3, 'tangent (curved)');
    checks += 3;
  }
}

console.log(`All ${checks} monopoly checks passed.`);
