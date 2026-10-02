/*
 * Better, Worse, Indifferent: tool math (lecture 5, sections 2.2-2.4). Two goods, X = R^2_+.
 *
 * Preferences (alpha in (0,1) is a weight):
 *   'cobb'     U = x1^alpha x2^(1-alpha)                 (Cobb-Douglas)
 *   'subs'     U = alpha x1 + (1-alpha) x2               (perfect substitutes)
 *   'concave'  U = alpha x1^2 + (1-alpha) x2^2           (indifference curves bowed out: not convex)
 *   'bliss'    U = -(x1-b1)^2 - (x2-b2)^2               (a bliss point b: not monotone)
 *   'lex'      x >=_L y  iff  x1 > y1, or x1 = y1 and x2 >= y2   (lexicographic: not continuous)
 * compare(x, y) = 1 if x is strictly preferred to y, 0 if indifferent, -1 if y is strictly preferred.
 * B(x) = {x' : x' >= x}, W(x) = {x' : x >= x'}, I(x) = {x' : x' ~ x}.
 *
 * Works in the browser (window.PreferenceModel) and in Node.
 */
(function (root) {
  'use strict';

  const REL = 1e-12;

  function utility(x, P) {
    const a = P.alpha;
    switch (P.type) {
      case 'cobb': return Math.pow(x[0], a) * Math.pow(x[1], 1 - a);
      case 'subs': return a * x[0] + (1 - a) * x[1];
      case 'concave': return a * x[0] * x[0] + (1 - a) * x[1] * x[1];
      case 'bliss': return -((x[0] - P.bliss[0]) ** 2) - ((x[1] - P.bliss[1]) ** 2);
      default: return null;   // lexicographic preferences have no utility representation
    }
  }

  function compare(x, y, P) {
    if (P.type === 'lex') {
      if (x[0] !== y[0]) return x[0] > y[0] ? 1 : -1;
      return x[1] === y[1] ? 0 : x[1] > y[1] ? 1 : -1;
    }
    const u = utility(x, P), v = utility(y, P), tol = REL * Math.max(1, Math.abs(u), Math.abs(v));
    return Math.abs(u - v) <= tol ? 0 : u > v ? 1 : -1;
  }

  const better = (xp, x, P) => compare(xp, x, P) >= 0;   // x' in B(x)
  const worse = (xp, x, P) => compare(xp, x, P) <= 0;    // x' in W(x)

  // Points of the indifference curve I(x) for plotting (utility types): x2 as a function of x1 where it exists.
  function indifferenceCurve(x, P, x1max, n = 400) {
    const u = utility(x, P), a = P.alpha, pts = [];
    if (P.type === 'bliss') {
      const r = Math.sqrt(-u);
      for (let k = 0; k <= n; k++) { const t = 2 * Math.PI * k / n; pts.push([P.bliss[0] + r * Math.cos(t), P.bliss[1] + r * Math.sin(t)]); }
      return pts.map(([p, q]) => (p >= 0 && q >= 0 ? [p, q] : [null, null]));
    }
    for (let k = 0; k <= n; k++) {
      const x1 = x1max * k / n;
      let x2 = null;
      if (P.type === 'cobb') x2 = u > 0 && x1 > 0 ? Math.pow(u / Math.pow(x1, a), 1 / (1 - a)) : null;
      if (P.type === 'subs') x2 = (u - a * x1) / (1 - a);
      if (P.type === 'concave') { const r = (u - a * x1 * x1) / (1 - a); x2 = r >= 0 ? Math.sqrt(r) : null; }
      pts.push([x1, x2 !== null && x2 >= 0 ? x2 : null]);
    }
    return pts;
  }

  // Is the whole segment from a to b in B(x)? (a convexity test of B(x) when a, b are in B(x)).
  function segmentInB(a, b, x, P, n = 400) {
    let worstT = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n, z = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
      if (!better(z, x, P)) { worstT = t; break; }
    }
    return { allIn: worstT === null, firstOut: worstT };
  }

  // Which axioms hold (the global answer) and why, as stated on the page.
  const AXIOMS = {
    cobb: { complete: true, transitive: true, continuous: true, monotone: true, strongMonotone: false, convex: true, strictlyConvex: true },
    subs: { complete: true, transitive: true, continuous: true, monotone: true, strongMonotone: true, convex: true, strictlyConvex: false },
    concave: { complete: true, transitive: true, continuous: true, monotone: true, strongMonotone: true, convex: false, strictlyConvex: false },
    bliss: { complete: true, transitive: true, continuous: true, monotone: false, strongMonotone: false, convex: true, strictlyConvex: true },
    lex: { complete: true, transitive: true, continuous: false, monotone: true, strongMonotone: true, convex: true, strictlyConvex: false }
  };

  const api = { utility, compare, better, worse, indifferenceCurve, segmentInB, AXIOMS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PreferenceModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
