// Checks the externality model of lecture 5 (section 1.2).
// Run with:  node firm-externalities/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

for (const alpha of [0.5, 1, 2]) for (const c of [0, 1, 2.5]) for (const ae of [-0.8, -0.5, -0.1, 0, 0.2, 0.5, 0.9]) {
  const s = { alpha, c, e: ae / alpha }, label = JSON.stringify(s);
  for (const p of [c - 0.5, c + 0.3, c + 2, c + 7]) {
    const { q1, q2, Q } = M.equilibrium(s, p);
    // A fixed point: each firm's output is its supply given the other's.
    close(q1, M.supplyGiven(s, p, q2), 1e-10, 'fixed point 1 ' + label);
    close(q2, M.supplyGiven(s, p, q1), 1e-10, 'fixed point 2 ' + label);
    close(q1, q2, 1e-10, 'symmetric');
    // Closed form: S(p) = 2 alpha (p - c) / (1 + alpha e) when p > c, else 0.
    close(Q, p > c ? 2 * alpha * (p - c) / (1 + ae) : 0, 1e-10, 'closed form ' + label);
    checks += 4;
  }
  // Slope of market supply by finite differences.
  const p0 = c + 3, h = 1e-6;
  close((M.marketSupply(s, p0 + h) - M.marketSupply(s, p0 - h)) / (2 * h), M.marketSlope(s), 1e-6, 'slope ' + label);
  // Negative externality: steeper supply in (q, p) = flatter Q(p) than MC1 + MC2; positive: the reverse.
  const sumSlope = 2 * alpha;
  if (ae > 0) assert.ok(M.marketSlope(s) < sumSlope); else if (ae < 0) assert.ok(M.marketSlope(s) > sumSlope); else close(M.marketSlope(s), sumSlope, 1e-12);
  // S crosses MC1 + MC2 (other's output fixed at qbar) where each firm produces qbar.
  for (const qbar of [1, 5]) {
    const pc = M.crossingPrice(s, qbar);
    close(M.marketSupply(s, pc), 2 * qbar, 1e-9, 'S at crossing ' + label);
    close(M.sumOfMC(s, pc, qbar), 2 * qbar, 1e-9, 'MC1 + MC2 at crossing ' + label);
    close(M.priceFor(s, 2 * qbar), pc, 1e-9);
    checks += 3;
  }
  checks += 2;
}

// Defaults of the page: alpha = 1, c = 1, e = 0.5, p = 6: each firm 3.333, market 6.667; slope 4/3 vs 2.
{
  const s = { alpha: 1, c: 1, e: 0.5 }, eq = M.equilibrium(s, 6);
  close(eq.q1, 10 / 3, 1e-12); close(eq.Q, 20 / 3, 1e-12); close(M.marketSlope(s), 4 / 3, 1e-12);
  close(M.crossingPrice(s, 1), 2.5, 1e-12); close(M.crossingPrice(s, 5), 8.5, 1e-12);
  checks += 5;
}

console.log(`All ${checks} externality checks passed.`);
