/*
 * Utility Is Ordinal: tool math (lecture 5, sections 2.4-2.6). Two goods.
 *
 * Utility functions (alpha in (0,1)):
 *   'cobb'     U = x1^alpha x2^(1-alpha)
 *   'ces'      U = (alpha x1^rho + (1-alpha) x2^rho)^(1/rho),  rho < 1, rho != 0
 *   'subs'     U = alpha x1 + (1-alpha) x2
 *   'concave'  U = alpha x1^2 + (1-alpha) x2^2      (not quasi-concave)
 * V = f(U) with f' > 0 represents the same preferences: same rankings, same indifference curves, other numbers.
 * Theorem 1 (*): if U is quasi-concave, z^t (d^2U/dx dx^t) z <= 0 for every z with z^t dU/dx = 0.
 * MRS_21 = U_1 / U_2 = -dx2/dx1 along the indifference curve.
 *
 * Works in the browser (window.OrdinalModel) and in Node.
 */
(function (root) {
  'use strict';

  function utility(x, P) {
    const a = P.alpha, [x1, x2] = x;
    switch (P.type) {
      case 'cobb': return Math.pow(x1, a) * Math.pow(x2, 1 - a);
      case 'ces': return Math.pow(a * Math.pow(x1, P.rho) + (1 - a) * Math.pow(x2, P.rho), 1 / P.rho);
      case 'subs': return a * x1 + (1 - a) * x2;
      case 'concave': return a * x1 * x1 + (1 - a) * x2 * x2;
    }
    throw new Error('unknown utility ' + P.type);
  }

  // Increasing transformations (and one decreasing one, to show what goes wrong).
  const TRANSFORMS = {
    id: { f: u => u, tex: 'V=U', increasing: true },
    log: { f: u => Math.log(u), tex: 'V=\\log U', increasing: true },
    sqrt: { f: u => Math.sqrt(u), tex: 'V=\\sqrt U', increasing: true },
    exp: { f: u => Math.exp(u / 3), tex: 'V=e^{U/3}', increasing: true },
    affine: { f: u => 10 + 5 * u, tex: 'V=10+5U', increasing: true },
    neg: { f: u => -u, tex: 'V=-U', increasing: false }
  };
  const transformed = (x, P, t) => TRANSFORMS[t].f(utility(x, P));

  // Gradient and Hessian by central differences.
  function gradient(x, P) {
    const h = 1e-6 * Math.max(1, x[0], x[1]);
    return [0, 1].map(i => { const a = x.slice(), b = x.slice(); a[i] += h; b[i] -= h; return (utility(a, P) - utility(b, P)) / (2 * h); });
  }
  function hessian(x, P) {
    const h = 1e-4 * Math.max(1, x[0], x[1]), U = y => utility(y, P), H = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const s = (di, dj) => { const y = x.slice(); y[i] += di; y[j] += dj; return U(y); };
      H[i][j] = i === j ? (s(h, 0) - 2 * U(x) + s(-h, 0)) / (h * h) : (s(h, h) - s(h, -h) - s(-h, h) + s(-h, -h)) / (4 * h * h);
    }
    return H;
  }

  // A unit vector along the tangent of the indifference curve (orthogonal to the gradient), pointing up-left.
  function tangent(x, P) {
    const g = gradient(x, P), n = Math.hypot(g[0], g[1]);
    return [-g[1] / n, g[0] / n];
  }
  // z^t H z for the unit tangent z: Theorem 1 says <= 0 when U is quasi-concave.
  function curvature(x, P) {
    const z = tangent(x, P), H = hessian(x, P);
    return z[0] * (H[0][0] * z[0] + H[0][1] * z[1]) + z[1] * (H[1][0] * z[0] + H[1][1] * z[1]);
  }
  // Utility along the tangent line, U(x + t z).
  const alongTangent = (x, P, ts) => { const z = tangent(x, P); return ts.map(t => [t, utility([x[0] + t * z[0], x[1] + t * z[1]], P)]); };

  const mrs21 = (x, P) => { const g = gradient(x, P); return g[0] / g[1]; };

  // x2 on the indifference curve U(x1, x2) = u (U increasing in x2), or null.
  function x2On(x1, u, P, hi = 1e4) {
    const f = x2 => utility([x1, x2], P) - u;
    if (!(f(0) <= 0) || !(f(hi) >= 0)) return null;
    let a = 0, b = hi;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (f(m) < 0) a = m; else b = m; }
    return 0.5 * (a + b);
  }
  const indifferenceCurve = (u, P, x1max, n = 200) => Array.from({ length: n + 1 }, (_, k) => {
    const x1 = x1max * k / n, x2 = x2On(x1, u, P);
    return [x1, x2];
  });

  const api = { utility, TRANSFORMS, transformed, gradient, hessian, tangent, curvature, alongTangent, mrs21, x2On, indifferenceCurve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OrdinalModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
