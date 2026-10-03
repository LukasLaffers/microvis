/*
 * Robinson Crusoe's economy: tool math (lecture 8). Consumer math from shared/consumer-model.js.
 *
 * Good 1: leisure x1 (time endowment T), good 2: coconuts x2. Labour L = T - x1 = -q1, coconuts q2 = phi(L).
 *   technologies  'concave'  phi(L) = A L^beta                       (0 < beta < 1: convex production set Q)
 *                 'sshape'   phi(L) = A L^g / (K^g + L^g),  g > 1   (increasing returns at first: Q not convex)
 *   planner       max_L U(T - L, phi(L)):  MRS_21 = U1/U2 = phi'(L*) at an interior optimum   (MRS = MRT)
 *   prices        w/p = MRS at x*;  the firm  max_L phi(L) - (w/p) L  (real profit pi/p);
 *                 Robinson  max U  s.t.  (w/p) x1 + x2 <= (w/p) T + pi/p,  x1 <= T
 *   open economy  the same two problems at a world price w/p, without market clearing: the difference between
 *                 consumption and production is traded.
 * Utility: CES in (x1, x2), { type: 'ces', delta, rho }.
 *
 * Works in the browser (window.RobinsonModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('../shared/consumer-model.js') : root.ConsumerModel;

  function phi(L, t) {
    if (L <= 0) return 0;
    return t.type === 'concave' ? t.A * Math.pow(L, t.beta) : t.A * Math.pow(L, t.g) / (Math.pow(t.K, t.g) + Math.pow(L, t.g));
  }
  function dphi(L, t) {
    if (t.type === 'concave') return L <= 0 ? Infinity : t.A * t.beta * Math.pow(L, t.beta - 1);
    const Kg = Math.pow(t.K, t.g), Lg = Math.pow(L, t.g);
    return L <= 0 ? 0 : t.A * t.g * Kg * Lg / L / ((Kg + Lg) ** 2);
  }
  function d2phi(L, t) {
    const h = 1e-5 * Math.max(1, L);
    return (dphi(L + h, t) - dphi(Math.max(1e-12, L - h), t)) / (L + h - Math.max(1e-12, L - h));
  }
  const mrs = (x, u) => u.delta / (1 - u.delta) * Math.pow(x[0] / x[1], u.rho - 1);

  // Maximise f on [a, b]: a fine grid finds the best point (f may have several local maxima), golden section refines.
  function argmax(f, a, b, n = 2000) {
    let best = -Infinity, k0 = 0;
    for (let k = 0; k <= n; k++) { const v = f(a + (b - a) * k / n); if (v > best) { best = v; k0 = k; } }
    let lo = a + (b - a) * Math.max(0, k0 - 1) / n, hi = a + (b - a) * Math.min(n, k0 + 1) / n;
    const r = (Math.sqrt(5) - 1) / 2;
    let c = hi - r * (hi - lo), d = lo + r * (hi - lo), fc = f(c), fd = f(d);
    for (let it = 0; it < 200 && hi - lo > 1e-14 * (1 + Math.abs(hi)); it++) {
      if (fc < fd) { lo = c; c = d; fc = fd; d = lo + r * (hi - lo); fd = f(d); }
      else { hi = d; d = c; fd = fc; c = hi - r * (hi - lo); fc = f(c); }
    }
    const t = 0.5 * (lo + hi), g = a + (b - a) * k0 / n;
    return f(g) > f(t) ? g : t;
  }

  // Polish an interior maximum L0 of a smooth objective with its first-order condition g(L) = 0 (bisection on a
  // small bracket around L0; kept as is if g does not change sign there).
  function polish(g, L0, a, b) {
    const h = 1e-3 * (b - a);
    let lo = Math.max(a, L0 - h), hi = Math.min(b, L0 + h), glo = g(lo), ghi = g(hi);
    if (!(glo * ghi < 0)) return L0;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi), gm = g(m); if (gm * glo > 0) { lo = m; glo = gm; } else hi = m; }
    return 0.5 * (lo + hi);
  }

  // The planner's (Robinson's morning) problem.
  function planner(P) {
    const f = L => CM.utility([P.T - L, phi(L, P.tech)], P.u);
    const L = polish(L => mrs([P.T - L, phi(L, P.tech)], P.u) - dphi(L, P.tech), argmax(f, 0, P.T), 0, P.T), x = [P.T - L, phi(L, P.tech)];
    return { L, x, q: [-L, x[1]], v: f(L), omega: mrs(x, P.u), mrt: dphi(L, P.tech), convexHere: d2phi(L, P.tech) <= 0 };
  }

  // The firm at the real wage omega = w/p (hiring at most Lmax hours).
  function firm(P, omega, Lmax = 4 * P.T) {
    const f = L => phi(L, P.tech) - omega * L;
    let L = polish(L => dphi(L, P.tech) - omega, argmax(f, 0, Lmax), 0, Lmax);
    if (f(0) >= f(L)) L = 0;
    return { L, q2: phi(L, P.tech), profit: f(L) };
  }

  // Robinson as a consumer: leisure at price omega, coconuts at price 1, income omega T + profit, x1 <= T.
  function consumer(P, omega, profit) {
    const y = omega * P.T + profit, x = CM.demand([omega, 1], y, P.u);
    if (x[0] <= P.T) return x;
    return [P.T, profit];   // he would like more leisure than the day has
  }

  // Decentralisation at the price omega: firm and consumer choose separately; do the markets clear?
  function decentralise(P, omega) {
    const fm = firm(P, omega), x = consumer(P, omega, fm.profit);
    const labourSupply = P.T - x[0];
    return { firm: fm, x, labourSupply, excessLabour: fm.L - labourSupply, excessCoconuts: x[1] - fm.q2, v: CM.utility(x, P.u) };
  }

  // Indifference curve x2(x1) at utility v.
  const indifference = (P, v, x1s) => x1s.map(x1 => [x1, CM.x2On(x1, v, P.u, 1e4)]);
  // The production possibility frontier in consumption space: x2 = phi(T - x1).
  const ppf = (P, x1s) => x1s.map(x1 => [x1, phi(P.T - x1, P.tech)]);

  const api = { phi, dphi, d2phi, mrs, argmax, planner, firm, consumer, decentralise, indifference, ppf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RobinsonModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
