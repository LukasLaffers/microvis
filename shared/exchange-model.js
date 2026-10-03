/*
 * Two-person exchange economy (Edgeworth box) for the lecture 9 tools. Consumers a and b with CES utility
 * (shared/consumer-model.js), total endowment Omega = R^a + R^b, prices (p, 1): good 2 is the numeraire.
 *
 *   incomes        y^a = p R^a_1 + R^a_2 + T,   y^b = p R^b_1 + R^b_2 - T     (T: balancing lump-sum transfer to a)
 *   excess demand  E(p1, p2) = x^a(p, y^a) + x^b(p, y^b) - Omega              (Walras: p1 E1 + p2 E2 = 0)
 *   equilibria     zeros of E1(p, 1) on a log grid of p, refined by bisection
 *   contract curve MRS^a_21(x^a) = MRS^b_21(Omega - x^a); core = the part inside the lens
 *                  U^a(x^a) >= U^a(R^a), U^b(Omega - x^a) >= U^b(R^b)
 *   replicas       an equal-treatment allocation y on the contract curve is blocked in the N-replica by N a-types and
 *                  M < N b-types if a prefers theta y^a + (1 - theta) R^a to y^a for some theta = M/N (the notes'
 *                  construction), and likewise with the roles of a and b swapped.
 * An economy is e = { ua, ub, Omega: [O1, O2], Ra: [R1, R2] }, ua and ub CES utilities { type: 'ces', delta, rho }.
 *
 * Works in the browser (window.ExchangeModel, needs window.ConsumerModel) and in Node.
 */
(function (root) {
  'use strict';

  const CM = typeof module !== 'undefined' && module.exports ? require('./consumer-model.js') : root.ConsumerModel;

  const Rb = e => [e.Omega[0] - e.Ra[0], e.Omega[1] - e.Ra[1]];
  const toB = (e, xa) => [e.Omega[0] - xa[0], e.Omega[1] - xa[1]];

  // Marginal rate of substitution of a CES utility, in closed form.
  const mrs = (x, u) => u.delta / (1 - u.delta) * Math.pow(x[0] / x[1], u.rho - 1);

  // Demands at prices (p1, p2) with the transfer T (in units of good 2, scaled with p2).
  function demands(e, p1, p2 = 1, T = 0) {
    const rb = Rb(e), ya = p1 * e.Ra[0] + p2 * e.Ra[1] + p2 * T, yb = p1 * rb[0] + p2 * rb[1] - p2 * T;
    return { xa: CM.demand([p1, p2], ya, e.ua), xb: CM.demand([p1, p2], yb, e.ub), ya, yb };
  }
  function excess(e, p1, p2 = 1, T = 0) {
    const d = demands(e, p1, p2, T);
    return [d.xa[0] + d.xb[0] - e.Omega[0], d.xa[1] + d.xb[1] - e.Omega[1]];
  }

  // All equilibrium prices p = p1/p2 in [lo, hi].
  function equilibria(e, T = 0, lo = 1e-3, hi = 1e3, n = 1200) {
    const f = p => excess(e, p, 1, T)[0], out = [];
    let pa = lo, fa = f(lo);
    for (let k = 1; k <= n; k++) {
      const pb = lo * Math.pow(hi / lo, k / n), fb = f(pb);
      if (fa === 0) out.push(pa);
      else if (fa * fb < 0) {
        let a = pa, b = pb, va = fa;
        for (let it = 0; it < 100; it++) { const m = Math.sqrt(a * b), vm = f(m); if (vm === 0) { a = b = m; break; } if (vm * va < 0) b = m; else { a = m; va = vm; } }
        out.push(Math.sqrt(a * b));
      }
      pa = pb; fa = fb;
    }
    return out.map(p => {
      const d = demands(e, p, 1, T), slope = (excess(e, p * 1.0001, 1, T)[0] - excess(e, p / 1.0001, 1, T)[0]) / (p * 1.0001 - p / 1.0001);
      return { p, xa: d.xa, xb: d.xb, stable: slope < 0 };
    });
  }

  // Offer curve of a (or b, in b's own coordinates): the demanded bundle for each price p, budget through R.
  function offerCurve(e, who, ps) {
    const R = who === 'a' ? e.Ra : Rb(e), u = who === 'a' ? e.ua : e.ub;
    return ps.map(p => CM.demand([p, 1], p * R[0] + R[1], u));
  }

  // Contract curve: x2 of a at x1 of a; MRS^a - MRS^b is increasing in x2^a.
  function contractX2(e, x1) {
    const f = x2 => mrs([x1, x2], e.ua) - mrs([e.Omega[0] - x1, e.Omega[1] - x2], e.ub);
    let lo = 0, hi = e.Omega[1];
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (f(m) < 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  const contractCurve = (e, x1s) => x1s.map(x1 => [x1, contractX2(e, x1)]);

  // U^a increases and U^b decreases along the contract curve as x1^a grows.
  const along = (e, x1) => { const xa = [x1, contractX2(e, x1)]; return { xa, ua: CM.utility(xa, e.ua), ub: CM.utility(toB(e, xa), e.ub) }; };
  function solveAlong(e, g) {   // g increasing in x1
    let lo = 1e-9 * e.Omega[0], hi = e.Omega[0] * (1 - 1e-9);
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (g(m) < 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  // The core: the x1^a interval of the contract curve inside the lens.
  function coreRange(e) {
    const va = CM.utility(e.Ra, e.ua), vb = CM.utility(Rb(e), e.ub);
    return [solveAlong(e, x1 => along(e, x1).ua - va), solveAlong(e, x1 => vb - along(e, x1).ub)];
  }

  // Second welfare theorem: the price supporting the Pareto-efficient point with x1^a on the contract curve, and the
  // balancing transfer to a (units of good 2) that makes it an equilibrium.
  function support(e, x1) {
    const xa = [x1, contractX2(e, x1)], p = mrs(xa, e.ua);
    const T = p * (xa[0] - e.Ra[0]) + (xa[1] - e.Ra[1]);
    return { xa, xb: toB(e, xa), p, T, T1: T / p };
  }

  // Smallest theta in [0, 1) with U(theta y + (1 - theta) R) >= U(y), or null when no theta < 1 does better
  // (the budget line through R and y is tangent to the indifference curve at y, or y is worse than R).
  function thetaMin(y, R, u) {
    const vy = CM.utility(y, u), at = t => CM.utility([t * y[0] + (1 - t) * R[0], t * y[1] + (1 - t) * R[1]], u) - vy;
    // Moving from y back towards R raises U iff grad U(y) . (y - R) < 0 (in units of U_2, to avoid rounding noise).
    const slope = mrs(y, u) * (y[0] - R[0]) + (y[1] - R[1]);
    if (!(slope < -1e-9 * (Math.abs(y[0]) + Math.abs(y[1]) + Math.abs(R[0]) + Math.abs(R[1]))) || !(at(1 - 1e-7) > 0)) return null;
    let lo = 0, hi = 1 - 1e-7;
    if (at(lo) >= 0) return 0;
    for (let it = 0; it < 200; it++) { const m = 0.5 * (lo + hi); if (at(m) < 0) lo = m; else hi = m; }
    return hi;
  }
  // The smallest replica N at which the notes' coalition blocks the core allocation with x1^a on the contract curve:
  // N a-types and M b-types (theta = M/N > thetaMin, M <= N - 1) or the other way round. Infinity if none.
  function blockingN(e, x1) {
    const xa = [x1, contractX2(e, x1)], xb = toB(e, xa);
    const ta = thetaMin(xa, e.Ra, e.ua), tb = thetaMin(xb, Rb(e), e.ub);
    const need = t => t === null ? Infinity : Math.max(2, Math.floor(1 / (1 - t)) + 1);
    const Na = need(ta), Nb = need(tb);
    return { N: Math.min(Na, Nb), side: Na <= Nb ? 'a' : 'b', theta: Na <= Nb ? ta : tb, xa, xb };
  }
  // The coalition for replica N: who blocks, with how many members, and what each type gets.
  function coalition(e, x1, N) {
    const b = blockingN(e, x1);
    if (!(N >= b.N)) return null;
    const M = Math.floor(b.theta * N) + 1, th = M / N;   // the smallest M/N above theta
    if (b.side === 'a') return { side: 'a', N, M, theta: th, get: [th * b.xa[0] + (1 - th) * e.Ra[0], th * b.xa[1] + (1 - th) * e.Ra[1]], other: b.xb };
    const rb = Rb(e);
    return { side: 'b', N, M, theta: th, get: [th * b.xb[0] + (1 - th) * rb[0], th * b.xb[1] + (1 - th) * rb[1]], other: b.xa };
  }

  const api = { Rb, toB, mrs, demands, excess, equilibria, offerCurve, contractX2, contractCurve, coreRange, support, thetaMin, blockingN, coalition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ExchangeModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
