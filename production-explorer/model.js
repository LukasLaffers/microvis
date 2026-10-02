/*
 * Production Explorer: model.
 *
 * Every technology is written as  phi(z) = F(g(z)),  where g is homogeneous of degree one
 * (it fixes the shape of the isoquants) and F is increasing (it fixes how output grows
 * along a ray). So every technology here is homothetic: the MRTS and sigma depend on g only.
 *
 * Scale laws F (s.law):
 *   'power'     F(x) = A x^nu                          homogeneous of degree nu, e(z) = nu
 *   'ultra'     F(x) = qmax (x/c)^kappa / (1 + (x/c)^kappa)
 *                                                       S-shaped ("regular ultra passum law"):
 *                                                       e falls from kappa towards 0
 *   'threshold' F(x) = A max(0, x - x0)^nu              nothing is produced below a threshold
 *
 * Works in the browser (window.ProductionModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const RHO_CD = 1e-6; // |rho| below this is treated as Cobb-Douglas
  const isCES = s => s.tech === 'ces' && Math.abs(s.rho) > RHO_CD;
  const law = s => s.law || 'power';

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
        if (isCES(s)) {
          if (s.rho < 0 && (z1 === 0 || z2 === 0)) return 0;
          return Math.pow(d * Math.pow(z1, s.rho) + e * Math.pow(z2, s.rho), 1 / s.rho);
        }
        // falls through to Cobb-Douglas
      default:
        return Math.pow(z1, d) * Math.pow(z2, e);
    }
  }

  // Partial derivatives [g1, g2]; null at the Leontief kink.
  function gGrad(z1, z2, s) {
    const d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear':
        return [d, e];
      case 'leontief': {
        const a = z1 / d, b = z2 / e;
        if (Math.abs(a - b) <= 1e-9 * Math.max(a, b)) return null;
        return a < b ? [1 / d, 0] : [0, 1 / e];
      }
      case 'ces':
        if (isCES(s)) {
          const G = g(z1, z2, s), r = s.rho;
          return [d * Math.pow(z1 / G, r - 1), e * Math.pow(z2 / G, r - 1)];
        }
        // falls through to Cobb-Douglas
      default: {
        const G = g(z1, z2, s);
        return [d * G / z1, e * G / z2];
      }
    }
  }

  // ---------- scale law F ----------

  function F(x, s) {
    if (!(x >= 0)) return NaN;
    switch (law(s)) {
      case 'ultra': {
        const u = Math.pow(x / s.c, s.kappa);
        return s.qmax * u / (1 + u);
      }
      case 'threshold':
        return x > s.x0 ? s.A * Math.pow(x - s.x0, s.nu) : 0;
      default:
        return s.A * Math.pow(x, s.nu);
    }
  }

  // Derivative F'(x).
  function Fprime(x, s) {
    switch (law(s)) {
      case 'ultra': {
        const u = Math.pow(x / s.c, s.kappa);
        return x > 0 ? s.qmax * s.kappa * u / (x * (1 + u) * (1 + u)) : (s.kappa > 1 ? 0 : NaN);
      }
      case 'threshold':
        return x > s.x0 ? s.A * s.nu * Math.pow(x - s.x0, s.nu - 1) : 0;
      default:
        return s.A * s.nu * Math.pow(x, s.nu - 1);
    }
  }

  // Inverse: the value of g needed to produce q (NaN if q cannot be produced).
  function gLevel(q, s) {
    if (!(q > 0)) return q === 0 ? 0 : NaN;
    switch (law(s)) {
      case 'ultra':
        return q < s.qmax ? s.c * Math.pow(q / (s.qmax - q), 1 / s.kappa) : NaN;
      case 'threshold':
        return s.x0 + Math.pow(q / s.A, 1 / s.nu);
      default:
        return Math.pow(q / s.A, 1 / s.nu);
    }
  }

  // Elasticity of F: x F'(x) / F(x). Along a ray g grows proportionally, so this is e(z).
  function elasticityF(x, s) {
    const f = F(x, s);
    if (!(f > 0)) return null;
    switch (law(s)) {
      case 'ultra':
        return s.kappa / (1 + Math.pow(x / s.c, s.kappa));
      case 'threshold':
        return s.nu * x / (x - s.x0);
      default:
        return s.nu;
    }
  }

  function output(z1, z2, s) {
    return F(g(z1, z2, s), s);
  }

  // Input bundle on the isoquant phi = q with input mix r = z2/z1 ([NaN, NaN] if q is out of reach).
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
    if (!(t > 0) || !Number.isFinite(t)) return [];
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

  // Marginal products [phi_1, phi_2] = F'(g) [g_1, g_2]; null at the Leontief kink.
  function marginalProducts(z1, z2, s) {
    const grad = gGrad(z1, z2, s);
    if (grad === null) return null;
    const fp = Fprime(g(z1, z2, s), s);
    return [fp * grad[0], fp * grad[1]];
  }

  /*
   * Marginal rate of technical substitution MRTS_21 = phi_1 / phi_2 = g_1 / g_2
   * (F cancels: for homothetic technologies scale does not affect substitution).
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
        if (isCES(s)) return (d / e) * Math.pow(z2 / z1, 1 - s.rho);
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

  // Elasticity of scale e(z) = d log phi(lambda z) / d log lambda at lambda = 1 (null where phi = 0).
  function elasticityOfScale(z1, z2, s) {
    return elasticityF(g(z1, z2, s), s);
  }

  // The same number at every z when phi is homogeneous; null when it varies along the ray.
  function scaleElasticity(s) {
    return law(s) === 'power' ? s.nu : null;
  }

  // Scale factor lambda at which the ray through zb reaches output q (NaN if never).
  function lambdaForOutput(q, zb, s) {
    return gLevel(q, s) / g(zb[0], zb[1], s);
  }

  // Value of g where e = 1 (the most productive scale, where output per unit of scale peaks), or null.
  function unitElasticityLevel(s) {
    switch (law(s)) {
      case 'ultra':
        return s.kappa > 1 ? s.c * Math.pow(s.kappa - 1, 1 / s.kappa) : null;
      case 'threshold':
        return s.nu < 1 ? s.x0 / (1 - s.nu) : null;
      default:
        return null;
    }
  }

  // Change of phi_1 when z1 grows (z2 fixed): numerical second derivative phi_11.
  function mp1Slope(z1, z2, s) {
    const h = 1e-4 * Math.max(1, z1);
    const lo = Math.max(z1 - h, 0), hi = z1 + h;
    return (output(hi, z2, s) - 2 * output((lo + hi) / 2, z2, s) + output(lo, z2, s)) / Math.pow((hi - lo) / 2, 2);
  }

  /*
   * Parameters in the form used in the lecture notes (power law only):
   *   Cobb-Douglas  A z1^alpha z2^beta,       alpha = delta nu, beta = (1 - delta) nu
   *   Leontief      (min{a z1, b z2})^nu,     a = A^(1/nu) / delta, b = A^(1/nu) / (1 - delta)
   *   linear        (a z1 + b z2)^nu,         a = A^(1/nu) delta,   b = A^(1/nu) (1 - delta)
   */
  function notesParams(s) {
    const k = Math.pow(s.A, 1 / s.nu), d = s.delta;
    switch (s.tech) {
      case 'leontief': return { a: k / d, b: k / (1 - d) };
      case 'linear': return { a: k * d, b: k * (1 - d) };
      case 'cobb': return { alpha: d * s.nu, beta: (1 - d) * s.nu };
      default: return null;
    }
  }

  function returnsLabel(e) {
    if (Math.abs(e - 1) < 1e-9) return 'constant';
    return e < 1 ? 'decreasing' : 'increasing';
  }

  const api = {
    g, gGrad, F, Fprime, gLevel, elasticityF, output, pointOnIsoquant, kinkMix, isoquant,
    marginalProducts, mrts, sigma, elasticityOfScale, scaleElasticity, lambdaForOutput,
    unitElasticityLevel, mp1Slope, notesParams, returnsLabel
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ProductionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
