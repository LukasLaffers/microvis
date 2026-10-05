/*
 * Concavity and returns to scale: model (lecture 1, Exercise 3; J.W. Friedman, Econometrica 1973).
 *
 * The technology: the isoquant of output q is the straight line from (q^{1/k1}, 0) to (0, q^{1/k2}),
 *   phi(z) = the q that solves  z1 / q^{1/k1} + z2 / q^{1/k2} = 1.
 * - Every input requirement set Z(q) is a half-plane cut by the positive quadrant, so it is convex:
 *   phi is quasi-concave for all k1, k2 > 0.
 * - On the z1 axis phi(z1, 0) = z1^k1, on the z2 axis phi(0, z2) = z2^k2. The elasticity of scale
 *   e(z) = 1 / (s1/k1 + s2/k2), with s1 = z1/q^{1/k1} and s2 = z2/q^{1/k2} (s1 + s2 = 1), lies between
 *   k1 and k2: no increasing returns to scale anywhere when k1, k2 <= 1.
 * - MRTS21 = q^{1/k2 - 1/k1} depends on q only: it changes along a ray unless k1 = k2, so phi is
 *   homothetic exactly when k1 = k2 (then phi(z) = (z1 + z2)^k).
 * - With k1 != k2 phi is not concave: the chord between two bundles on different rays can lie above it.
 *
 * Works in the browser (window.ConcavityModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  // phi(z) by Newton's method in log q. F(l) = z1 e^{-l/k1} + z2 e^{-l/k2} - 1 is decreasing and convex
  // in l, and F >= 0 at l0 = max(k1 ln z1, k2 ln z2), so Newton from l0 rises monotonically to the root.
  function phi(z, P) {
    const z1 = Math.max(0, z[0]), z2 = Math.max(0, z[1]);
    if (z1 === 0 && z2 === 0) return 0;
    const a = 1 / P.k1, b = 1 / P.k2;
    let l = Math.max(z1 > 0 ? P.k1 * Math.log(z1) : -Infinity, z2 > 0 ? P.k2 * Math.log(z2) : -Infinity);
    for (let i = 0; i < 100; i++) {
      const t1 = z1 * Math.exp(-a * l), t2 = z2 * Math.exp(-b * l);
      const F = t1 + t2 - 1, dF = -(a * t1 + b * t2);
      if (F <= 0) break;
      const step = -F / dF;
      l += step;
      if (step < 1e-15 * Math.max(1, Math.abs(l))) break;
    }
    return Math.exp(l);
  }

  // Shares s1, s2 of the two terms of the isoquant equation at z (they add up to 1).
  function shares(z, P, q = phi(z, P)) {
    const t1 = Math.max(0, z[0]) * Math.pow(q, -1 / P.k1), t2 = Math.max(0, z[1]) * Math.pow(q, -1 / P.k2);
    const s = t1 + t2;
    return [t1 / s, t2 / s];
  }

  // Elasticity of scale e(z) = d ln phi(alpha z) / d ln alpha at alpha = 1.
  function scaleElasticity(z, P) {
    const [s1, s2] = shares(z, P);
    return 1 / (s1 / P.k1 + s2 / P.k2);
  }

  // Gradient and Hessian by implicit differentiation of F(z, q) = z1 q^{-a} + z2 q^{-b} - 1 = 0.
  function derivatives(z, P) {
    const q = phi(z, P), a = 1 / P.k1, b = 1 / P.k2, z1 = z[0], z2 = z[1];
    const Fz = [Math.pow(q, -a), Math.pow(q, -b)];
    const D = a * z1 * Math.pow(q, -a - 1) + b * z2 * Math.pow(q, -b - 1);          // -F_q
    const Fzq = [-a * Math.pow(q, -a - 1), -b * Math.pow(q, -b - 1)];
    const Fqq = a * (a + 1) * z1 * Math.pow(q, -a - 2) + b * (b + 1) * z2 * Math.pow(q, -b - 2);
    const g = [Fz[0] / D, Fz[1] / D];
    const h = (i, j) => (Fzq[i] * g[j] + Fzq[j] * g[i] + Fqq * g[i] * g[j]) / D;
    return { q, grad: g, hess: [[h(0, 0), h(0, 1)], [h(1, 0), h(1, 1)]] };
  }

  // Largest eigenvalue of the Hessian: positive where phi bends upwards in some direction.
  function maxCurvature(z, P) {
    const H = derivatives(z, P).hess, m = (H[0][0] + H[1][1]) / 2, d = (H[0][0] - H[1][1]) / 2;
    return m + Math.hypot(d, H[0][1]);
  }

  const mrts21 = (z, P) => Math.pow(phi(z, P), 1 / P.k2 - 1 / P.k1);

  // End points of the isoquant phi = q on the two axes.
  const isoquantEnds = (q, P) => [[Math.pow(q, 1 / P.k1), 0], [0, Math.pow(q, 1 / P.k2)]];

  // Along the segment z^lambda = lambda z + (1 - lambda) z': phi(z^lambda), the chord and the gap.
  function segment(z, zp, P, n = 101) {
    const fz = phi(z, P), fzp = phi(zp, P), out = [];
    for (let i = 0; i < n; i++) {
      const l = i / (n - 1), zl = [l * z[0] + (1 - l) * zp[0], l * z[1] + (1 - l) * zp[1]];
      const f = phi(zl, P), chord = l * fz + (1 - l) * fzp;
      out.push({ lambda: l, z: zl, phi: f, chord, gap: chord - f });
    }
    return out;
  }

  // The largest gap chord - phi(z^lambda) on the segment (golden-section refinement of a scan).
  function maxGap(z, zp, P) {
    const fz = phi(z, P), fzp = phi(zp, P);
    const gap = l => l * fz + (1 - l) * fzp - phi([l * z[0] + (1 - l) * zp[0], l * z[1] + (1 - l) * zp[1]], P);
    let best = 0, bl = 0;
    for (let i = 0; i <= 40; i++) { const g = gap(i / 40); if (g > best) { best = g; bl = i / 40; } }
    let lo = Math.max(0, bl - 1 / 40), hi = Math.min(1, bl + 1 / 40);
    const r = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 60; i++) {
      const m1 = hi - r * (hi - lo), m2 = lo + r * (hi - lo);
      if (gap(m1) > gap(m2)) hi = m2; else lo = m1;
    }
    const l = (lo + hi) / 2, g = gap(l);
    return g > best ? { gap: g, lambda: l } : { gap: best, lambda: bl };
  }

  // Search a grid of pairs of bundles in [0, L]^2 for the largest midpoint gap (phi is not concave if > 0).
  function worstPair(P, L, n = 12) {
    const pts = [];
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) pts.push([L * i / n, L * j / n]);
    const f = pts.map(p => phi(p, P));
    let best = { gap: 0, z: null, zp: null };
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const m = [(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2];
        const g = (f[i] + f[j]) / 2 - phi(m, P);
        if (g > best.gap) best = { gap: g, z: pts[i], zp: pts[j] };
      }
    }
    return best;
  }

  // Is phi locally concave on the grid (all Hessians negative semidefinite, up to rounding)?
  function concaveOnGrid(P, L, n = 24) {
    let worst = -Infinity, at = null;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) {
      const z = [L * i / n, L * j / n], c = maxCurvature(z, P) / Math.max(1e-12, phi(z, P)) * L * L;
      if (c > worst) { worst = c; at = z; }
    }
    return { concave: worst <= 1e-7, worst, at };
  }

  const api = { phi, shares, scaleElasticity, derivatives, maxCurvature, mrts21, isoquantEnds, segment, maxGap, worstPair, concaveOnGrid };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConcavityModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
