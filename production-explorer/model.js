/*
 * Production Explorer: model.
 *
 * Every technology is written as  phi(z) = A * g(z)^nu,  where g is homogeneous of
 * degree one. Hence phi is homogeneous of degree nu: nu is the elasticity of scale
 * (returns to scale), while the shape of g alone determines substitution (MRTS, sigma).
 *
 * Works in the browser (window.ProductionModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const RHO_CD = 1e-6; // |rho| below this is treated as Cobb-Douglas

  // Degree-one aggregator g(z1, z2). s = {tech, delta, rho, ...}
  function g(z1, z2, s) {
    if (z1 < 0 || z2 < 0) return NaN;
    const d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear':
        return d * z1 + e * z2;
      case 'leontief':
        return Math.min(z1 / d, z2 / e);
      case 'ces':
        if (Math.abs(s.rho) > RHO_CD) {
          if (s.rho < 0 && (z1 === 0 || z2 === 0)) return 0;
          return Math.pow(d * Math.pow(z1, s.rho) + e * Math.pow(z2, s.rho), 1 / s.rho);
        }
        // falls through to Cobb-Douglas
      default:
        return Math.pow(z1, d) * Math.pow(z2, e);
    }
  }

  function output(z1, z2, s) {
    return s.A * Math.pow(g(z1, z2, s), s.nu);
  }

  // Value of g needed to produce q.
  function gLevel(q, s) {
    return Math.pow(q / s.A, 1 / s.nu);
  }

  // Input bundle on the isoquant phi = q with input mix r = z2/z1.
  function pointOnIsoquant(q, r, s) {
    const scale = gLevel(q, s) / g(1, r, s);
    return [scale, scale * r];
  }

  // Input mix z2/z1 at the Leontief kink.
  function kinkMix(s) {
    return (1 - s.delta) / s.delta;
  }

  /*
   * Points of the isoquant phi = q inside the box [0, zmax]^2.
   * Because g is homogeneous of degree one, the isoquant is a radial blow-up of the
   * unit isoquant, so we trace it ray by ray: angle theta in [0, pi/2].
   */
  function isoquant(q, s, zmax, n = 400) {
    if (!(q > 0)) return [];
    const t = gLevel(q, s);
    if (s.tech === 'leontief') {
      const k1 = t * s.delta, k2 = t * (1 - s.delta);
      return k1 <= zmax && k2 <= zmax ? [[zmax, k2], [k1, k2], [k1, zmax]] : [];
    }
    // Point on the isoquant along the ray with angle th (null if g = 0 there).
    const at = th => {
      const c = Math.cos(th), sn = Math.sin(th), unit = g(c, sn, s);
      return unit > 0 ? [t * c / unit, t * sn / unit] : null;
    };
    const inside = p => p !== null && p[0] <= zmax && p[1] <= zmax;
    const pts = [];
    let prevTh = null, prevIn = false;
    for (let i = 0; i <= n; i++) {
      const th = (Math.PI / 2) * i / n, p = at(th), isIn = inside(p);
      // Where the isoquant crosses the edge of the box, find the exact crossing point.
      if (prevTh !== null && isIn !== prevIn) {
        let lo = prevTh, hi = th; // lo has status prevIn
        for (let k = 0; k < 60; k++) {
          const mid = (lo + hi) / 2;
          if (inside(at(mid)) === prevIn) lo = mid; else hi = mid;
        }
        const edge = at(prevIn ? lo : hi);
        if (edge) pts.push(edge);
      }
      if (isIn) pts.push(p);
      prevTh = th; prevIn = isIn;
    }
    return pts;
  }

  /*
   * Marginal rate of technical substitution MRTS_21 = phi_1 / phi_2 = g_1 / g_2
   * (A and nu cancel: scale does not affect substitution for homogeneous functions).
   * Returns a number, Infinity, 0, or null (undefined at a kink).
   */
  function mrts(z1, z2, s) {
    const d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear':
        return d / e;
      case 'leontief': {
        const a = z1 / d, b = z2 / e;
        if (Math.abs(a - b) <= 1e-9 * Math.max(a, b)) return null;
        return a < b ? Infinity : 0; // z1 binding: only z1 raises output (vertical arm)
      }
      case 'ces':
        if (Math.abs(s.rho) > RHO_CD) return (d / e) * Math.pow(z2 / z1, 1 - s.rho);
        // falls through to Cobb-Douglas
      default:
        return (d / e) * (z2 / z1);
    }
  }

  // Elasticity of substitution sigma = d log(z2/z1) / d log MRTS.
  function sigma(s) {
    switch (s.tech) {
      case 'linear': return Infinity;
      case 'leontief': return 0;
      case 'ces': return Math.abs(s.rho) > RHO_CD ? 1 / (1 - s.rho) : 1;
      default: return 1;
    }
  }

  // Elasticity of scale e(z) = sum_i z_i phi_i / phi; equals nu at every z.
  function scaleElasticity(s) {
    return s.nu;
  }

  function returnsLabel(nu) {
    if (Math.abs(nu - 1) < 1e-9) return 'constant';
    return nu < 1 ? 'decreasing' : 'increasing';
  }

  const api = { g, output, gLevel, pointOnIsoquant, kinkMix, isoquant, mrts, sigma, scaleElasticity, returnsLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ProductionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
