// Checks the excess-demand model against independent calculations.
// Run with:  node excess-demand/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

let checks = 0;
const close = (a, b, tol, msg) => { assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`); checks++; };
const rand = (lo, hi) => lo + (hi - lo) * Math.random();
const phi = (z, rho) => Math.pow(Math.pow(z[0], rho) + Math.pow(z[1], rho), 1 / (2 * rho));

const params = [M.ASSIGNMENT, { rhoA: 0.5, rhoB: -3, alpha: 0.6, beta: 0.2 }, { rhoA: -0.4, rhoB: 0.7, alpha: 0.85, beta: 0.9 }, { rhoA: -4, rhoB: -4, alpha: 0.1, beta: 0.5 }];

for (const par of params) {
  for (let k = 0; k < 40; k++) {
    const p = [rand(0.2, 3), rand(0.2, 3), rand(0.3, 2)], e = M.economy(p, par), label = JSON.stringify({ par, p });
    // Walras' law at any prices, not only in equilibrium.
    close(p[0] * e.E[0] + p[1] * e.E[1] + p[2] * e.E[2], 0, 1e-12, 'Walras ' + label);
    // Homogeneous of degree zero.
    const lam = rand(0.1, 10), e2 = M.economy(p.map(v => lam * v), par);
    e.E.forEach((v, i) => close(e2.E[i], v, 1e-10, 'homogeneity ' + label));
    // Budgets hold: each consumer spends exactly the value of the endowment plus the profit of the own firm.
    close(p[0] * e.xa[0] + p[2] * e.xa[2], p[1] + p[2] + e.A.profit, 1e-12, 'Alpha budget');
    close(p[1] * e.xb[1] + p[2] * e.xb[2], p[0] + p[2] + e.B.profit, 1e-12, 'Beta budget');
  }
  // Firms: the inputs produce the output, and no other input bundle earns more profit (brute force on a grid).
  for (const rho of [par.rhoA, par.rhoB]) {
    const p = [rand(0.4, 2), rand(0.4, 2), rand(0.5, 2)], f = M.firm(p, rho);
    close(phi(f.z, rho), f.q, 1e-10, 'firm produces q');
    const prof = z => p[2] * phi(z, rho) - p[0] * z[0] - p[1] * z[1];
    let best = -Infinity;
    for (let i = 1; i <= 300; i++) for (let j = 1; j <= 300; j++) best = Math.max(best, prof([f.z[0] * 3 * i / 300, f.z[1] * 3 * j / 300]));
    assert.ok(best <= f.profit + 1e-9, `firm profit is maximal ${best} vs ${f.profit}`); checks++;
    close(prof(f.z), f.profit, 1e-12, 'profit');
  }
  // Consumers: Cobb-Douglas demand beats any other affordable bundle on the budget line.
  {
    const p = [rand(0.4, 2), rand(0.4, 2), rand(0.5, 2)], e = M.economy(p, par);
    const U = x => Math.pow(x[0], par.alpha) * Math.pow(x[1], 1 - par.alpha);
    const best = Math.max(...Array.from({ length: 999 }, (_, i) => { const s = (i + 1) / 1000; return U([s * e.yA / p[0], (1 - s) * e.yA / p[2]]); }));
    assert.ok(U([e.xa[0], e.xa[2]]) >= best - 1e-12, 'Alpha demand is optimal'); checks++;
  }
  // Equilibrium: all three markets clear (the third by Walras' law), and the auctioneer gets there too.
  const eq = M.equilibrium(par);
  eq.E.forEach((v, i) => close(v, 0, 1e-9, `market ${i + 1} clears ${JSON.stringify(par)}`));
  for (const start of [[0.3, 0.3], [3, 0.4], [0.4, 3], [2.5, 2.5]]) {
    const path = M.tatonnement(start, par, { steps: 3000 }), end = path[path.length - 1];
    close(end[0], eq.p[0], 1e-4, 'auctioneer p1'); close(end[1], eq.p[1], 1e-4, 'auctioneer p2');
  }
}

// The 2021 assignment: equilibrium (0.794, 1.395, 1), incomes 2.453 and 1.876, x1 of Alpha 0.9265, x3 of Beta 0.5628.
{
  const eq = M.equilibrium(M.ASSIGNMENT);
  close(eq.p[0], 0.794, 5e-4, 'p1*'); close(eq.p[1], 1.395, 5e-4, 'p2*');
  close(eq.yA, 2.453, 5e-4, 'y alpha'); close(eq.yB, 1.876, 5e-4, 'y beta');
  close(eq.xa[0], 0.9265, 1e-3, 'x1 alpha'); close(eq.xb[2], 0.5628, 1e-3, 'x3 beta');
  close(eq.A.q, 0.1164, 1e-3, 'q3 of A'); close(eq.B.q, 0.1636, 1e-3, 'q3 of B');
}

console.log(`All ${checks} excess-demand checks passed.`);
