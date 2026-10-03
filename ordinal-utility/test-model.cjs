// Checks ordinal utility, Theorem 1 (*) and the MRS (lecture 5, sections 2.4-2.6).
// Run with:  node ordinal-utility/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pt = () => [0.3 + 9 * rnd(), 0.3 + 9 * rnd()];

const prefs = [
  { type: 'cobb', alpha: 0.3 }, { type: 'cobb', alpha: 0.6 },
  { type: 'ces', alpha: 0.4, rho: -1 }, { type: 'ces', alpha: 0.5, rho: 0.5 }, { type: 'ces', alpha: 0.7, rho: -3 },
  { type: 'subs', alpha: 0.5 }, { type: 'concave', alpha: 0.5 }, { type: 'concave', alpha: 0.3 }
];

for (const P of prefs) {
  const label = JSON.stringify(P);
  // An increasing f keeps every ranking; f(u) = -u reverses it.
  for (let r = 0; r < 500; r++) {
    const x = pt(), y = pt(), du = M.utility(x, P) - M.utility(y, P);
    if (Math.abs(du) < 1e-9) continue;
    for (const [k, T] of Object.entries(M.TRANSFORMS)) {
      const dv = M.transformed(x, P, k) - M.transformed(y, P, k);
      assert.equal(Math.sign(dv), T.increasing ? Math.sign(du) : -Math.sign(du), `ranking ${k} ${label}`);
      checks++;
    }
  }
  // The same indifference curves: points with U = u all have V = f(u).
  const u = M.utility([4, 5], P);
  for (const [x1, x2] of M.indifferenceCurve(u, P, 9, 60)) {
    if (x2 === null || x1 === 0) continue;
    for (const [k, T] of Object.entries(M.TRANSFORMS)) { close(M.transformed([x1, x2], P, k), T.f(u), 1e-8, `level set ${k} ${label}`); checks++; }
  }
  // Theorem 1 (*): along the tangent of the indifference curve the Hessian form is <= 0 for quasi-concave U
  // (= 0 for perfect substitutes) and > 0 for the bowed-out curves; U along the tangent line peaks at x (or is flat).
  for (let r = 0; r < 200; r++) {
    const x = pt(), c = M.curvature(x, P), z = M.tangent(x, P), g = M.gradient(x, P);
    close(z[0] * g[0] + z[1] * g[1], 0, 1e-9, 'z orthogonal to the gradient');
    const prof = M.alongTangent(x, P, [-0.05, 0.05]), u0 = M.utility(x, P);
    if (P.type === 'concave') { assert.ok(c > 1e-6, 'not quasi-concave ' + label); assert.ok(prof.every(([, v]) => v > u0)); }
    else if (P.type === 'subs') { close(c, 0, 1e-5); prof.forEach(([, v]) => close(v, u0, 1e-9)); }
    else { assert.ok(c < -1e-8, 'quasi-concave ' + label); assert.ok(prof.every(([, v]) => v < u0)); }
    checks += 3;
  }
  // MRS_21 = U1/U2 = minus the slope of the indifference curve (finite difference along the curve).
  for (let r = 0; r < 100; r++) {
    const x = pt(), u0 = M.utility(x, P), h = 1e-5;
    const a = M.x2On(x[0] + h, u0, P), b = M.x2On(x[0] - h, u0, P);
    if (a === null || b === null || M.mrs21(x, P) > 50) continue;   // very steep curves: finite differences lose accuracy
    close(M.mrs21(x, P), -(a - b) / (2 * h), 1e-4, 'MRS ' + label);
    checks++;
  }
}

// Cobb-Douglas by hand: MRS_21 = alpha x2 / ((1 - alpha) x1); Hessian entries.
{
  const P = { type: 'cobb', alpha: 0.3 }, x = [2, 5];
  close(M.mrs21(x, P), 0.3 * 5 / (0.7 * 2), 1e-8);
  const H = M.hessian(x, P), u = M.utility(x, P);
  close(H[0][0], 0.3 * (0.3 - 1) * u / 4, 1e-5); close(H[0][1], 0.3 * 0.7 * u / 10, 1e-5); close(H[1][1], 0.7 * (0.7 - 1) * u / 25, 1e-5);
  checks += 4;
}

console.log(`All ${checks} ordinal-utility checks passed.`);
