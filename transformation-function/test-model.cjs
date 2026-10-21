// Checks the transformation function of lecture 8. Run with:  node transformation-function/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
const h = 1e-6;

for (const L of [2, 5, 16, 33]) for (const A of [1, 4, 9.5]) for (const deg of [5, 30, 45, 70, 85]) {
  const th = deg * Math.PI / 180, q = M.plan(L, A, th), g = M.grad(q), label = JSON.stringify({ L, A, deg });
  close(M.Phi(q), 0, 1e-12, 'on the frontier ' + label); checks++;
  // the gradient against finite differences, and all four partial derivatives positive
  for (let i = 0; i < 4; i++) {
    const a = q.slice(), b = q.slice(); a[i] += h; b[i] -= h;
    close(g[i], (M.Phi(a) - M.Phi(b)) / (2 * h), 1e-6, 'Phi_' + i + ' ' + label);
    assert.ok(g[i] > 0); checks += 2;
  }
  // each slice passes through q and its slope is -dq_j/dq_i = Phi_i / Phi_j (finite differences along the slice)
  close(M.isoA(q, q[2]), q[3], 1e-12); close(M.sausages(q, q[2]), q[0], 1e-12); close(M.potatoes(q, q[0]), q[1], 1e-12);
  close(-(M.isoA(q, q[2] + h) - M.isoA(q, q[2] - h)) / (2 * h), M.slope(q, 2, 3), 1e-6, 'TRS ' + label);
  close(-(M.sausages(q, q[2] + h) - M.sausages(q, q[2] - h)) / (2 * h), M.slope(q, 2, 0), 1e-6, 'MP ' + label);
  close(-(M.potatoes(q, q[0] + h) - M.potatoes(q, q[0] - h)) / (2 * h), M.slope(q, 0, 1), 1e-6, 'MRT ' + label);
  checks += 6;
  // every point of a slice is on the frontier, with the other two netputs of q
  for (const t of [0.5, 0.8, 1.3, 2]) {
    const qL = q[2] * t, a = M.isoA(q, qL), s = M.sausages(q, qL), p = M.potatoes(q, q[0] * Math.min(t, 0.99));
    close(M.Phi([q[0], q[1], qL, a]), 0, 1e-9); checks++;
    if (s !== null) { close(M.Phi([s, q[1], qL, q[3]]), 0, 1e-9); checks++; }
    close(M.Phi([q[0] * Math.min(t, 0.99), p, q[2], q[3]]), 0, 1e-9); checks++;
  }
  // marginal productivity and marginal input requirement are reciprocal; the TRS is the MRTS of phi, A/L
  close(M.slope(q, 2, 0) * M.slope(q, 0, 2), 1, 1e-12); close(M.slope(q, 2, 3), A / L, 1e-12); checks += 2;
  // moving along a slice keeps the other two netputs and stays on the frontier
  { const n = M.alongIso(q, 1.4 * L), r = M.plan(n.L, n.A, n.th); close(r[0], q[0], 1e-9); close(r[1], q[1], 1e-9); checks += 2; }
  { const n = M.alongSausages(q, 1.4 * L), r = M.plan(n.L, n.A, n.th); close(r[1], q[1], 1e-9); close(r[3], q[3], 1e-12); close(r[0], M.sausages(q, -1.4 * L), 1e-9); checks += 3; }
  { const n = M.alongFrontier(q, 0.5), r = M.plan(n.L, n.A, n.th); close(r[2], q[2], 1e-12); close(r[3], q[3], 1e-12); close(M.Phi(r), 0, 1e-12); checks += 3; }
}
// Only sausages: Phi(q) = q_s - phi(z), lecture 1's production function; then -dq_s/dq_L = phi_L(z).
{
  const q = [M.phi(16, 4), 0, -16, -4];
  close(M.Phi(q), 0, 1e-12); close(M.Phi([3, 0, -16, -4]), 3 - 8, 1e-12); close(M.slope(q, 2, 0), 0.5 * Math.sqrt(4 / 16), 1e-12);
  checks += 3;
}
// The mock-up's plan: L = 16, A = 4, 40 degrees.
{
  const q = M.plan(16, 4, 40 * Math.PI / 180);
  close(M.slope(q, 2, 3), 0.25, 1e-12); close(M.slope(q, 2, 0), 0.3264, 1e-3); close(M.slope(q, 0, 1), 2.3835, 1e-3);
  checks += 3;
}
console.log(`All ${checks} transformation-function checks passed.`);
