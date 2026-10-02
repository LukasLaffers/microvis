// Checks the two-Leontief-firm example of lecture 4 (Arnberg and Bjørner 2007).
// Run with:  node substitution-or-composition/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

// (i) The notes' numbers exactly.
{
  close(M.NOTES_ETA, 4.923, 1e-3);
  const a = M.economy(1, 1, M.NOTES_ETA), b = M.economy(2, 1, M.NOTES_ETA);
  close(a.cE, 3, 1e-15); close(a.cK, 3, 1e-15); close(a.qE, 10, 1e-12); close(a.qK, 10, 1e-12);
  assert.deepEqual(a.firmE.map(v => +v.toFixed(9)), [20, 10]); assert.deepEqual(a.firmK.map(v => +v.toFixed(9)), [10, 20]);
  close(a.E, 30, 1e-12); close(a.K, 30, 1e-12);
  close(b.cE, 5, 1e-15); close(b.cK, 4, 1e-15); close(b.qE, 5, 1e-12); close(b.qK, 15, 1e-12);
  assert.deepEqual(b.firmE.map(v => +v.toFixed(9)), [10, 5]); assert.deepEqual(b.firmK.map(v => +v.toFixed(9)), [15, 30]);
  close(b.E, 25, 1e-12); close(b.K, 35, 1e-12);
  checks += 19;
}

for (const eta of [0, 0.5, 2, M.NOTES_ETA, 8]) for (const wK of [0.7, 1, 1.6]) for (const wE of [0.5, 1, 1.7, 3]) {
  const e = M.economy(wE, wK, eta);
  // (ii) Inside each firm the input ratio never changes; output adds up to 20.
  close(e.firmE[1] / e.firmE[0], 0.5, 1e-12); close(e.firmK[1] / e.firmK[0], 2, 1e-12); close(e.qE + e.qK, 20, 1e-12);
  // (iii) Apparent substitution: positive for eta > 0, zero for eta = 0.
  const s = M.apparentSigma(wE, wK, eta);
  if (eta === 0) close(s, 0, 1e-9); else assert.ok(s > 0, 'apparent sigma > 0');
  // A dearer energy price moves output to the capital-intensive firm.
  if (eta > 0) assert.ok(M.economy(wE * 1.1, wK, eta).qE < e.qE);
  // (iv) Over a small range of prices the regression slope equals the derivative.
  const r = M.regression([0.99, 0.995, 1, 1.005, 1.01].map(v => v * wE), wK, eta);
  close(r.slope, s, 1e-3, 'regression slope');
  checks += 6;
}

// Default view, wE = wK = 1: shares 1/2, d qE / d log wE = -20 eta / 4 * (2/3 - 1/3) = -5 eta / 3, so
// d log K = (5 eta / 3) / 30 and d log E = -(5 eta / 3) / 30: the apparent elasticity is eta / 9 (0.547 in the notes' case).
{
  close(M.apparentSigma(1, 1, M.NOTES_ETA), M.NOTES_ETA / 9, 1e-8);
  close(M.apparentSigma(1, 1, 2), 2 / 9, 1e-8);
  assert.ok(M.regression([0.5, 0.75, 1, 1.5, 2, 3], 1, M.NOTES_ETA).slope > 0);
  checks += 3;
}

console.log(`All ${checks} substitution-or-composition checks passed.`);
