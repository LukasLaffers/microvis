/*
 * Firm model shared by the lecture 2 tools (plans/lecture-2.md, section 3).
 *
 * Technology: phi(z) = F(g(z)), homothetic.
 *   g  degree-one aggregator: the shape of the isoquants (substitution).   -> used by (CM)
 *   G = F^-1: G(q) is the amount of g needed to produce q (scale).          -> used by (PM')
 * Profiles for G:
 *   'homog'   G(q) = (q/A)^(1/k), i.e. phi = A g^k, homogeneous of degree k
 *   'ushape'  G(q) = q^3/3 - a q^2 + b q with b = a^2 + m, G'(q) = (q - a)^2 + m > 0
 *             (increasing returns for small q, decreasing for large q: U-shaped AC)
 *
 * Cost side: C(w,q) = c(w) G(q),  H^i(w,q) = Htilde^i(w) G(q),  MC = c(w) G'(q).
 * Output side: supply S(w,p) from max_q pq - C(w,q).
 *
 * Works in the browser (window.FirmModel) and in Node (module.exports) for tests.
 * Prices are always passed as w = [w1, w2].
 */
(function (root) {
  'use strict';

  const RHO_CD = 1e-6; // |rho| below this is treated as Cobb-Douglas
  const isCES = s => s.tech === 'ces' && Math.abs(s.rho) > RHO_CD;
  const sigmaOf = s => 1 / (1 - s.rho);
  const TIE = 1e-9;
  const near = (x, y) => Math.abs(x - y) <= TIE * Math.max(1, Math.abs(x), Math.abs(y));

  // ---------- technology ----------

  function g(z1, z2, s) {
    if (z1 < 0 || z2 < 0) return NaN;
    const d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear': return d * z1 + e * z2;
      case 'leontief': return Math.min(z1 / d, z2 / e);
      case 'ces':
        if (isCES(s)) {
          if (s.rho < 0 && (z1 === 0 || z2 === 0)) return 0;
          return Math.pow(d * Math.pow(z1, s.rho) + e * Math.pow(z2, s.rho), 1 / s.rho);
        }
        // falls through to Cobb-Douglas
      default: return Math.pow(z1, d) * Math.pow(z2, e);
    }
  }

  const bOf = s => s.a * s.a + s.m;

  // Amount of g needed to produce q.
  function G(q, s) {
    if (q <= 0) return 0;
    if (s.profile === 'ushape') return q * q * q / 3 - s.a * q * q + bOf(s) * q;
    return Math.pow(q / s.A, 1 / s.k);
  }

  function Gprime(q, s) {
    if (s.profile === 'ushape') return (q - s.a) * (q - s.a) + s.m;
    return Math.pow(q / s.A, 1 / s.k - 1) / (s.k * s.A);
  }

  // Output from g = x: the inverse of G (bisection for the U-shaped profile).
  function F(x, s) {
    if (!(x > 0)) return 0;
    if (s.profile !== 'ushape') return s.A * Math.pow(x, s.k);
    let lo = 0, hi = 1;
    while (G(hi, s) < x) hi *= 2;
    for (let it = 0; it < 80; it++) {
      const mid = (lo + hi) / 2;
      if (G(mid, s) < x) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  const phi = (z1, z2, s) => F(g(z1, z2, s), s);

  // MRTS_21 = phi_1 / phi_2 = g_1 / g_2: a number, Infinity, 0, or null at a Leontief kink.
  function mrts(z1, z2, s) {
    const d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear': return d / e;
      case 'leontief': {
        const a = z1 / d, b = z2 / e;
        if (Math.abs(a - b) <= 1e-9 * Math.max(a, b)) return null;
        return a < b ? Infinity : 0;
      }
      case 'ces':
        if (isCES(s)) return (d / e) * Math.pow(z2 / z1, 1 - s.rho);
        // falls through to Cobb-Douglas
      default: return (d / e) * (z2 / z1);
    }
  }

  // Points of the isoquant phi = q inside [0, zmax]^2 (traced ray by ray, exact edge crossings).
  function isoquant(q, s, zmax, n = 400) {
    if (!(q > 0)) return [];
    const t = G(q, s);
    if (s.tech === 'leontief') {
      const k1 = t * s.delta, k2 = t * (1 - s.delta);
      return k1 <= zmax && k2 <= zmax ? [[zmax, k2], [k1, k2], [k1, zmax]] : [];
    }
    const at = th => {
      const c = Math.cos(th), sn = Math.sin(th), unit = g(c, sn, s);
      return unit > 0 ? [t * c / unit, t * sn / unit] : null;
    };
    const inside = p => p !== null && p[0] <= zmax && p[1] <= zmax;
    const pts = [];
    let prevTh = null, prevIn = false;
    for (let i = 0; i <= n; i++) {
      const th = (Math.PI / 2) * i / n, p = at(th), isIn = inside(p);
      if (prevTh !== null && isIn !== prevIn) {
        let lo = prevTh, hi = th;
        for (let it = 0; it < 60; it++) {
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

  // ---------- cost side (CM) ----------

  // Unit cost c(w): the cheapest way to reach g = 1.
  function unitCost(w, s) {
    const [w1, w2] = w, d = s.delta, e = 1 - d;
    switch (s.tech) {
      case 'linear': return Math.min(w1 / d, w2 / e);
      case 'leontief': return d * w1 + e * w2;
      case 'ces':
        if (isCES(s)) {
          const sg = sigmaOf(s);
          return Math.pow(Math.pow(d, sg) * Math.pow(w1, 1 - sg) + Math.pow(e, sg) * Math.pow(w2, 1 - sg), 1 / (1 - sg));
        }
        // falls through to Cobb-Douglas
      default: return Math.pow(w1 / d, d) * Math.pow(w2 / e, e);
    }
  }

  /*
   * Unit input requirement Htilde(w) = H(w, q) / G(q): the cheapest bundle with g = 1.
   * kind: 'interior' | 'corner' | 'multiple' (linear with w1/delta = w2/(1-delta)) | 'kink' (Leontief).
   * For 'multiple', segment holds the two ends of the set of cost-minimising bundles.
   */
  function unitDemand(w, s) {
    const [w1, w2] = w, d = s.delta, e = 1 - d, c = unitCost(w, s);
    switch (s.tech) {
      case 'linear': {
        const A = [1 / d, 0], B = [0, 1 / e];
        if (near(w1 / d, w2 / e)) return { h: A, kind: 'multiple', segment: [A, B] };
        return { h: w1 / d < w2 / e ? A : B, kind: 'corner' };
      }
      case 'leontief': return { h: [d, e], kind: 'kink' };
      case 'ces':
        if (isCES(s)) {
          const sg = sigmaOf(s);
          return { h: [Math.pow(d * c / w1, sg), Math.pow(e * c / w2, sg)], kind: 'interior' };
        }
        // falls through to Cobb-Douglas
      default: return { h: [d * c / w1, e * c / w2], kind: 'interior' };
    }
  }

  // Conditional input demand H(w, q) = Htilde(w) G(q).
  function condDemand(w, q, s) {
    const u = unitDemand(w, s), t = G(q, s);
    const out = { H: [u.h[0] * t, u.h[1] * t], kind: u.kind };
    if (u.segment) out.segment = u.segment.map(p => [p[0] * t, p[1] * t]);
    return out;
  }

  const cost = (w, q, s) => unitCost(w, s) * G(q, s);
  const MC = (w, q, s) => unitCost(w, s) * Gprime(q, s);
  const AC = (w, q, s) => q > 0 ? unitCost(w, s) * G(q, s) / q : NaN;

  // Elasticity of scale at the cost-minimising bundle for q: e = G / (q G') = AC / MC.
  const scaleElasticity = (q, s) => G(q, s) / (q * Gprime(q, s));

  // ---------- output side (PM') ----------

  // Shutdown price pHat = min AC and the output qHat where it is reached.
  function minAC(w, s) {
    const c = unitCost(w, s);
    if (s.profile === 'ushape') return { pHat: c * (bOf(s) - 0.75 * s.a * s.a), qHat: 1.5 * s.a };
    if (s.k < 1 - TIE) return { pHat: 0, qHat: 0 };
    if (near(s.k, 1)) return { pHat: c / s.A, qHat: null }; // MC = AC = c / A at every q
    return { pHat: null, qHat: null };                      // k > 1: AC falls forever
  }

  /*
   * Supply S(w, p) = argmax_{q >= 0} pq - C(w, q). Returns {q, kind}:
   *   'interior'      unique optimum q > 0 (or q = 0 at p = 0 for k < 1)
   *   'zero'          produce nothing
   *   'indifferent'   'ushape' at p = pHat: q = 0 and q = qHat both optimal (q reports qHat)
   *   'indeterminate' k = 1 at p = c/A: any q >= 0 is optimal (q is null)
   *   'unbounded'     profit grows without limit (q is Infinity)
   */
  function supply(w, p, s) {
    const c = unitCost(w, s);
    if (s.profile === 'ushape') {
      const { pHat, qHat } = minAC(w, s);
      if (near(p, pHat)) return { q: qHat, kind: 'indifferent' };
      if (p < pHat) return { q: 0, kind: 'zero' };
      return { q: s.a + Math.sqrt(s.a * s.a - bOf(s) + p / c), kind: 'interior' };
    }
    if (near(s.k, 1)) {
      const unit = c / s.A;
      if (near(p, unit)) return { q: null, kind: 'indeterminate' };
      return p < unit ? { q: 0, kind: 'zero' } : { q: Infinity, kind: 'unbounded' };
    }
    if (s.k > 1) return p > 0 ? { q: Infinity, kind: 'unbounded' } : { q: 0, kind: 'zero' };
    if (!(p > 0)) return { q: 0, kind: 'interior' };
    return { q: Math.pow(p * s.k * Math.pow(s.A, 1 / s.k) / c, s.k / (1 - s.k)), kind: 'interior' };
  }

  // Profit Pi(w, p) = p S - C(w, S) (0 when nothing or any output is optimal; Infinity if unbounded).
  function profit(w, p, s) {
    const S = supply(w, p, s);
    if (S.kind === 'unbounded') return Infinity;
    if (S.q === null || S.q === 0) return 0;
    return p * S.q - cost(w, S.q, s);
  }

  // Unconditional input demand D(w, p) = Htilde(w) G(S(w, p)) = H(w, S(w, p)).
  function uncondDemand(w, p, s) {
    const S = supply(w, p, s);
    if (S.kind === 'unbounded') return [Infinity, Infinity];
    if (S.q === null) return null;
    return condDemand(w, S.q, s).H;
  }

  // Profit of an input bundle, the objective of one-step maximisation (PM).
  const profitAt = (z1, z2, w, p, s) => p * phi(z1, z2, s) - w[0] * z1 - w[1] * z2;

  const api = {
    g, phi, G, Gprime, F, mrts, isoquant,
    unitCost, unitDemand, condDemand, cost, MC, AC, scaleElasticity,
    minAC, supply, profit, uncondDemand, profitAt
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FirmModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
