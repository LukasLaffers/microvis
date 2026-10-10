/*
 * Consumer model for the lecture 6+ tools (two goods): utility, Marshallian demand D(p,y), indirect utility
 * V(p,y), expenditure function C(p,v), Hicksian demand H(p,v), and the derivatives the lectures use.
 *
 * Utility functions u = { type, ... }:
 *   'ces'          U = (delta x1^rho + (1-delta) x2^rho)^(1/rho),  rho < 1, rho != 0   (sigma = 1/(1-rho))
 *   'stonegeary'   U = (x1 - g1)^a (x2 - g2)^(1-a)       on x1 > g1, x2 > g2 (g < 0: no subsistence, corners possible)
 *   'quasilinear'  U = kappa log(1 + x1) + x2            (no income effect on good 1 at interior solutions)
 *   'giffen'       U = -(s - x2)^2 / (x1 - c)            on x1 > c, x2 < s. Interior solutions (c p1 + p2 s/2 <= y
 *                  < c p1 + p2 s): D1 = 2c + (p2 s - y)/p1, D2 = 2(y - c p1)/p2 - s. Good 1 is always inferior
 *                  (dD1/dy = -1/p1) and a Giffen good (dD1/dp1 > 0) exactly when y > p2 s.
 *   'additive'     U = x1^a/a + x2^b/b,  0 < a, b < 1     curved income expansion path; the good whose exponent is
 *                  closer to 1 is the luxury, the other the necessity, and the income elasticities change with y.
 *   'humped'       U = c log x1 + log x2 + x2^2/(2K^2),  0 < c < 8.  MRS21 = h(x2)/x1 with h(x2) = c x2/(1 + x2^2/K^2):
 *                  h rises up to x2 = K and falls after, so good 1 is normal while x2 < K and inferior after (its
 *                  Engel curve rises, then falls). Indifference curves are convex because h' > -1 (min h' = -c/8).
 * The UMP is solved in closed form where one is known and otherwise numerically (golden section along the budget
 * line, valid for quasi-concave U); the EMP through duality: C(p,v) solves V(p,C) = v and H(p,v) = D(p,C(p,v)).
 *
 * Works in the browser (window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const NEG = -1e300;   // utility outside the domain of a utility function

  function utility(x, u) {
    const [x1, x2] = x;
    switch (u.type) {
      case 'ces': {
        if (x1 < 0 || x2 < 0) return NEG;
        if (u.rho < 0 && (x1 === 0 || x2 === 0)) return 0;
        return Math.pow(u.delta * Math.pow(x1, u.rho) + (1 - u.delta) * Math.pow(x2, u.rho), 1 / u.rho);
      }
      case 'stonegeary': {
        const a = x1 - u.g1, b = x2 - u.g2;
        if (x1 < 0 || x2 < 0 || a <= 0 || b <= 0) return NEG;
        return Math.pow(a, u.a) * Math.pow(b, 1 - u.a);
      }
      case 'quasilinear': return x1 < 0 || x2 < 0 ? NEG : u.kappa * Math.log(1 + x1) + x2;
      case 'giffen': {
        if (x1 < 0 || x2 < 0 || x1 <= u.c || x2 >= u.s) return NEG;
        return -((u.s - x2) ** 2) / (x1 - u.c);
      }
      case 'additive': return x1 < 0 || x2 < 0 ? NEG : Math.pow(x1, u.a) / u.a + Math.pow(x2, u.b) / u.b;
      case 'humped': return x1 <= 0 || x2 <= 0 ? NEG : u.c * Math.log(x1) + Math.log(x2) + x2 * x2 / (2 * u.K * u.K);
    }
    throw new Error('unknown utility ' + u.type);
  }

  // Marginal utilities by central differences.
  function gradient(x, u) {
    return [0, 1].map(i => {
      const h = 1e-6 * Math.max(1, x[i]), a = x.slice(), b = x.slice();
      a[i] += h; b[i] = Math.max(0, b[i] - h);
      return (utility(a, u) - utility(b, u)) / (a[i] - b[i]);
    });
  }
  const mrs21 = (x, u) => { const g = gradient(x, u); return g[0] / g[1]; };

  // Closed-form Marshallian demand where known (interior solutions); null when not applicable.
  function demandClosed(p, y, u) {
    const [p1, p2] = p;
    if (u.type === 'ces') {
      const sg = 1 / (1 - u.rho), A = Math.pow(u.delta, sg) * Math.pow(p1, 1 - sg), B = Math.pow(1 - u.delta, sg) * Math.pow(p2, 1 - sg);
      return [y * A / (p1 * (A + B)), y * B / (p2 * (A + B))];
    }
    if (u.type === 'stonegeary') {
      const m = y - p1 * u.g1 - p2 * u.g2;
      const x = [u.g1 + u.a * m / p1, u.g2 + (1 - u.a) * m / p2];
      return m > 0 && x[0] >= 0 && x[1] >= 0 ? x : null;
    }
    if (u.type === 'quasilinear') {
      const x1 = u.kappa * p2 / p1 - 1;
      if (x1 < 0) return [0, y / p2];
      const x2 = (y - p1 * x1) / p2;
      return x2 >= 0 ? [x1, x2] : null;
    }
    if (u.type === 'giffen') {
      const x = [2 * u.c + (p2 * u.s - y) / p1, 2 * (y - u.c * p1) / p2 - u.s];
      return x[0] > u.c && x[1] >= 0 && x[1] < u.s ? x : null;
    }
    if (u.type === 'additive') {
      // x_i^(a_i - 1) = lambda p_i, so x_i = (lambda p_i)^(-1/(1 - a_i)); spending falls with lambda: bisection in log lambda.
      const xs = l => [Math.pow(Math.exp(l) * p1, -1 / (1 - u.a)), Math.pow(Math.exp(l) * p2, -1 / (1 - u.b))];
      const spend = l => { const x = xs(l); return p1 * x[0] + p2 * x[1] - y; };
      let lo = -60, hi = 60;
      for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (spend(m) > 0) lo = m; else hi = m; }
      return xs(0.5 * (lo + hi));
    }
    if (u.type === 'humped') {
      // tangency x1 = (p2/p1) h(x2); the budget gives h(x2) + x2 = y/p2, increasing in x2 (h' > -1): bisection.
      const h = x2 => u.c * x2 / (1 + x2 * x2 / (u.K * u.K)), target = y / p2;
      let lo = 0, hi = target;
      for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (h(m) + m < target) lo = m; else hi = m; }
      const x2 = 0.5 * (lo + hi);
      return [p2 * h(x2) / p1, x2];
    }
    return null;
  }

  // Numerical UMP along the budget line x = (t y/p1, (1-t) y/p2), t in [0, 1]: a grid finds the peak (U is
  // quasi-concave, so it is unimodal where defined), golden section refines it between the neighbouring grid points.
  function demandNumeric(p, y, u) {
    const f = t => utility([t * y / p[0], (1 - t) * y / p[1]], u), n = 400;
    let best = -Infinity, k0 = 0;
    for (let k = 0; k <= n; k++) { const v = f(k / n); if (v > best) { best = v; k0 = k; } }
    let a = Math.max(0, (k0 - 1) / n), b = Math.min(1, (k0 + 1) / n);
    const r = (Math.sqrt(5) - 1) / 2;
    let c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d);
    for (let it = 0; it < 200 && b - a > 1e-15; it++) {
      if (fc < fd) { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); }
      else { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); }
    }
    let t = 0.5 * (a + b);
    if (f(k0 / n) > f(t)) t = k0 / n;   // a corner (t = 0 or 1) or a grid point that is already best
    return [t * y / p[0], (1 - t) * y / p[1]];
  }

  const demand = (p, y, u) => demandClosed(p, y, u) || demandNumeric(p, y, u);
  const indirect = (p, y, u) => utility(demand(p, y, u), u);

  // Expenditure function: the income y with V(p, y) = v (V increasing in y), by bisection.
  function expenditure(p, v, u) {
    let lo = 0, hi = Math.max(1, p[0] + p[1]);
    while (indirect(p, hi, u) < v) { hi *= 2; if (hi > 1e12) return Infinity; }
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (indirect(p, m, u) < v) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  const hicks = (p, v, u) => demand(p, expenditure(p, v, u), u);

  // x2 on U(x1, x2) = v solved in closed form where the utility function allows it (or NaN): fast enough for an
  // indifference curve that moves in every frame of an animation. x2On checks it and falls back to bisection.
  function x2Closed(x1, v, u) {
    switch (u.type) {
      case 'ces': return Math.pow((Math.pow(v, u.rho) - u.delta * Math.pow(x1, u.rho)) / (1 - u.delta), 1 / u.rho);
      case 'stonegeary': return u.g2 + Math.pow(v / Math.pow(x1 - u.g1, u.a), 1 / (1 - u.a));
      case 'quasilinear': return v - u.kappa * Math.log(1 + x1);
      case 'giffen': return u.s - Math.sqrt(-v * (x1 - u.c));
    }
    return NaN;
  }

  // x2 on the indifference curve U = v at x1 (U increasing in x2 on its domain), or null.
  function x2On(x1, v, u, hi = 1e4) {
    const f = x2 => utility([x1, x2], u) - v;
    let lo = 0;
    if (u.type === 'giffen') hi = Math.min(hi, u.s - 1e-12);
    if (u.type === 'stonegeary') lo = Math.max(0, u.g2);
    // the closed form, when it lands inside (lo, hi) and on the curve; otherwise (axis, asymptote, domain) bisection decides
    const c = x2Closed(x1, v, u);
    if (Number.isFinite(c) && c > lo && c < hi && Math.abs(f(c)) <= 1e-10 * Math.max(1, Math.abs(v))) return c;
    if (!(f(hi) >= 0)) return null;
    if (f(lo) >= 0) return lo;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (f(m) < 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  // Points of the indifference curve U = v. Where x2On stops at the lower boundary (x2 = 0, or g2) with more than v,
  // the curve has already met the axis: that piece of the boundary is not on the curve, so it is left out (null).
  const indifferenceCurve = (v, u, x1s) => x1s.map(x1 => {
    const x2 = x2On(x1, v, u);
    return [x1, x2 !== null && utility([x1, x2], u) - v > 1e-9 * Math.max(1, Math.abs(v)) ? null : x2];
  });

  // Derivatives by central differences (relative step 1e-5).
  const bumpP = (p, k, h) => { const q = p.slice(); q[k] += h; return q; };
  function dDdp(p, y, u, j, k) { const h = 1e-5 * p[k]; return (demand(bumpP(p, k, h), y, u)[j] - demand(bumpP(p, k, -h), y, u)[j]) / (2 * h); }
  function dDdy(p, y, u, j) { const h = 1e-5 * y; return (demand(p, y + h, u)[j] - demand(p, y - h, u)[j]) / (2 * h); }
  function dHdp(p, v, u, j, k) { const h = 1e-5 * p[k]; return (hicks(bumpP(p, k, h), v, u)[j] - hicks(bumpP(p, k, -h), v, u)[j]) / (2 * h); }

  // Slutsky (M3): dD^j/dp_k = dH^j/dp_k - (dD^j/dy) D^k, all at v = V(p, y).
  function slutsky(p, y, u, j, k) {
    const x = demand(p, y, u), v = utility(x, u);
    const total = dDdp(p, y, u, j, k), substitution = dHdp(p, v, u, j, k), income = -dDdy(p, y, u, j) * x[k];
    return { total, substitution, income, x, v };
  }

  // Elasticities at (p, y): own and cross price (uncompensated and compensated), income, budget shares.
  function elasticities(p, y, u) {
    const x = demand(p, y, u), v = utility(x, u);
    const b = [p[0] * x[0] / y, p[1] * x[1] / y];
    const eta = [0, 1].map(j => dDdy(p, y, u, j) * y / x[j]);
    const eu = [0, 1].map(j => [0, 1].map(k => dDdp(p, y, u, j, k) * p[k] / x[j]));
    const ec = [0, 1].map(j => [0, 1].map(k => dHdp(p, v, u, j, k) * p[k] / x[j]));
    return { x, v, b, eta, eu, ec };
  }

  // Integral of a function of p1 (p2 fixed) by Simpson's rule: areas to the left of demand curves.
  function integrateP1(f, a, b, n = 200) {
    const lo = Math.min(a, b), hi = Math.max(a, b), h = (hi - lo) / n;
    let s = 0;
    for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(lo + i * h);
    return (b >= a ? 1 : -1) * s * h / 3;
  }

  const api = { x2Closed, utility, gradient, mrs21, demandClosed, demandNumeric, demand, indirect, expenditure, hicks, x2On, indifferenceCurve, dDdp, dDdy, dHdp, slutsky, elasticities, integrateP1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ConsumerModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
