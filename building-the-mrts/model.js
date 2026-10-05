/*
 * Building the MRTS: model (lecture 1, the marginal rate of technical substitution).
 *
 * MRTS21(z) = -dz2/dz1 |_{dphi=0} = phi_1(z) / phi_2(z), the slope of the isoquant in absolute value.
 * Technologies as in the notes:
 *   cd        A z1^alpha z2^beta
 *   linear    a z1 + b z2
 *   leontief  min{a z1, b z2}
 *   ces       A (delta z1^rho + (1 - delta) z2^rho)^(1/rho)
 * A point on the isoquant phi = q is found on the ray with factor intensity r = z2/z1.
 *
 * Works in the browser (window.MrtsModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const KINK = 1e-9;   // relative tolerance for "on the Leontief corner"

  // Degree of homogeneity (every technology here is homogeneous).
  const degree = T => (T.tech === 'cd' ? T.alpha + T.beta : 1);

  function phi(z, T) {
    const [z1, z2] = z;
    switch (T.tech) {
      case 'cd': return T.A * Math.pow(z1, T.alpha) * Math.pow(z2, T.beta);
      case 'linear': return T.a * z1 + T.b * z2;
      case 'leontief': return Math.min(T.a * z1, T.b * z2);
      case 'ces': {
        if (T.rho < 0 && (z1 <= 0 || z2 <= 0)) return 0;
        return T.A * Math.pow(T.delta * Math.pow(z1, T.rho) + (1 - T.delta) * Math.pow(z2, T.rho), 1 / T.rho);
      }
      default: throw new Error(`unknown technology ${T.tech}`);
    }
  }

  // Leontief regime at z: 'z1' when a z1 < b z2 (input 1 binds: vertical arm), 'z2' when input 2 binds, 'corner'.
  function regime(z, T) {
    const u = T.a * z[0], v = T.b * z[1];
    if (Math.abs(u - v) <= KINK * Math.max(u, v)) return 'corner';
    return u < v ? 'z1' : 'z2';
  }

  // Marginal products [phi_1, phi_2]; null at the Leontief corner (not differentiable there).
  function mp(z, T) {
    const [z1, z2] = z;
    switch (T.tech) {
      case 'cd': { const q = phi(z, T); return [T.alpha * q / z1, T.beta * q / z2]; }
      case 'linear': return [T.a, T.b];
      case 'leontief': {
        const r = regime(z, T);
        return r === 'corner' ? null : r === 'z1' ? [T.a, 0] : [0, T.b];
      }
      case 'ces': {
        // phi_i = A^rho phi^(1-rho) delta_i z_i^(rho-1)
        const q = phi(z, T), c = Math.pow(T.A, T.rho) * Math.pow(q, 1 - T.rho);
        return [c * T.delta * Math.pow(z1, T.rho - 1), c * (1 - T.delta) * Math.pow(z2, T.rho - 1)];
      }
      default: throw new Error(`unknown technology ${T.tech}`);
    }
  }

  // One-sided marginal products at the Leontief corner: [right, left] derivatives for each input.
  function leontiefCorner(T) { return { phi1: { left: T.a, right: 0 }, phi2: { left: T.b, right: 0 } }; }

  // MRTS21 = phi_1 / phi_2: Infinity on a vertical piece, NaN where it is not defined.
  function mrts(z, T) {
    const g = mp(z, T);
    if (!g) return NaN;
    if (g[1] === 0) return g[0] > 0 ? Infinity : NaN;
    return g[0] / g[1];
  }

  // The point on the isoquant phi = q with factor intensity z2/z1 = r.
  function pointOnRay(r, q, T) {
    const z1 = Math.pow(q / phi([1, r], T), 1 / degree(T));
    return [z1, r * z1];
  }

  // The least z2 >= 0 with phi(z1, z2) >= q: the isoquant as a function of z1 (null if z1 alone is too little
  // and no z2 can make up for it; for linear and CES with rho > 0 it is 0 once z1 alone suffices).
  function isoquantZ2(z1, q, T) {
    if (!(z1 > 0)) return null;
    switch (T.tech) {
      case 'cd': return Math.pow(q / (T.A * Math.pow(z1, T.alpha)), 1 / T.beta);
      case 'linear': return Math.max(0, (q - T.a * z1) / T.b);
      case 'leontief': return T.a * z1 >= q * (1 - KINK) ? q / T.b : null;
      case 'ces': {
        const X = (Math.pow(q / T.A, T.rho) - T.delta * Math.pow(z1, T.rho)) / (1 - T.delta);
        if (T.rho > 0) return X <= 0 ? 0 : Math.pow(X, 1 / T.rho);
        return X > 0 ? Math.pow(X, 1 / T.rho) : null;
      }
      default: throw new Error(`unknown technology ${T.tech}`);
    }
  }

  // Points of the isoquant phi = q inside [0, R]^2 (exact corners for Leontief and the linear technology).
  function isoquant(q, T, R, n = 400) {
    if (T.tech === 'leontief') {
      const c = [q / T.a, q / T.b];
      return c[0] > R || c[1] > R ? [] : [[c[0], R], c, [R, c[1]]];
    }
    if (T.tech === 'linear') {
      const pts = [[0, q / T.b], [q / T.a, 0]];
      // clip the segment to the box
      const out = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = [t * pts[1][0], (1 - t) * pts[0][1]];
        if (p[0] <= R && p[1] <= R) out.push(p);
      }
      return out;
    }
    const out = [];
    for (let i = 0; i <= n; i++) {
      // denser near the axes, where the isoquant is steep
      const z1 = R * Math.pow(i / n, 2);
      const z2 = isoquantZ2(z1, q, T);
      if (z2 !== null && z2 <= R && Number.isFinite(z2)) out.push([z1, z2]);
    }
    return out;
  }

  // A finite step: take dz1 more of input 1 and give up as much of input 2 as possible while phi stays >= q.
  function step(z, dz1, q, T) {
    const z2new = isoquantZ2(z[0] + dz1, q, T);
    const m = mrts(z, T);
    return { z2new, giveUp: z2new === null ? null : z[1] - z2new, linear: m * dz1 };
  }

  // dMRTS21/dz1 along the isoquant (dphi = 0). For CD and CES, log MRTS changes with log(z2/z1) at the rate
  // 1/sigma, and along the isoquant dlog(z2/z1) = -(MRTS/z2 + 1/z1) dz1, so
  //   dMRTS/dz1 = -(1/sigma) MRTS (MRTS/z2 + 1/z1)   (0 for the linear technology).
  function dMrtsAlong(z, T) {
    if (T.tech === 'linear') return 0;
    if (T.tech === 'leontief') return NaN;
    const m = mrts(z, T);
    return -(1 / sigma(T)) * m * (m / z[1] + 1 / z[0]);
  }

  // Partial derivatives of MRTS21(z1, z2) (central differences), and the notes' formula
  //   dMRTS/dz1 |_{dphi=0} = dMRTS/dz1 (partial) - dMRTS/dz2 (partial) * MRTS.
  function mrtsPartials(z, T) {
    const h = 1e-5;
    return [
      (mrts([z[0] * (1 + h), z[1]], T) - mrts([z[0] * (1 - h), z[1]], T)) / (2 * h * z[0]),
      (mrts([z[0], z[1] * (1 + h)], T) - mrts([z[0], z[1] * (1 - h)], T)) / (2 * h * z[1])
    ];
  }
  function dMrtsFormula(z, T) {
    const [p1, p2] = mrtsPartials(z, T);
    return p1 - p2 * mrts(z, T);
  }

  // Elasticity of substitution sigma = dlog(z2/z1) / dlog MRTS21 along the isoquant.
  function sigma(T) {
    switch (T.tech) {
      case 'cd': return 1;
      case 'linear': return Infinity;
      case 'leontief': return 0;
      case 'ces': return 1 / (1 - T.rho);
      default: throw new Error(`unknown technology ${T.tech}`);
    }
  }
  function sigmaNumeric(r, q, T) {
    const h = 1e-4, a = pointOnRay(r * Math.exp(-h), q, T), b = pointOnRay(r * Math.exp(h), q, T);
    return (2 * h) / (Math.log(mrts(b, T)) - Math.log(mrts(a, T)));
  }

  const api = { degree, phi, regime, mp, leontiefCorner, mrts, pointOnRay, isoquantZ2, isoquant, step, dMrtsAlong, mrtsPartials, dMrtsFormula, sigma, sigmaNumeric };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MrtsModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
