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
  const As = M.tangencyIntercept(W, s, 1);
  close(As, 6.625, 1e-6); close(M.optimum(W, s, { type: 'linear', A: As, B: 1 }).q, 2.25, 1e-4);
  checks += 6;
}

console.log(`All ${checks} monopoly checks passed.`);
