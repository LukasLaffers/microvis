/*
 * The Duality Square (lecture 6): closed forms of D, V, C and H for six simple utility functions, with the derivatives
 * that Roy's identity and Shephard's lemma use. Pure math, no DOM; UMD so that test-model.cjs can require it.
 *
 * Examples (key: U(x)):
 *   leontief  min{x1, x2}            sqrt      sqrt(x1 x2)          cd        x1^a x2^(1-a), 0 < a < 1
 *   subst     x1 + x2                additive  sqrt(x1) + sqrt(x2)  quasilin  ln x1 + x2
 * p = [p1, p2] > 0, income y > 0, utility level v (in the range of U). Demands are returned as sets: [lo, hi], two
 * bundles that are equal when the optimum is unique; for x1 + x2 at p1 = p2 every bundle on the segment between them is
 * optimal. Derivatives are null where they do not exist (x1 + x2 at p1 = p2, where V and C have a kink in p).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DualitySquare = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EXAMPLES = ['leontief', 'sqrt', 'cd', 'subst', 'additive', 'quasilin'];
  const pt = (a, b) => [[a, b], [a, b]];

  // Cobb-Douglas price index P(p) = (p1/a)^a (p2/(1-a))^(1-a): V = y/P, C = vP.
  const priceIndex = (p, a) => Math.pow(p[0] / a, a) * Math.pow(p[1] / (1 - a), 1 - a);

  function utility(ex, x, a) {
    const [x1, x2] = x;
    switch (ex) {
      case 'leontief': return Math.min(x1, x2);
      case 'sqrt': return Math.sqrt(x1 * x2);
      case 'cd': return Math.pow(x1, a) * Math.pow(x2, 1 - a);
      case 'subst': return x1 + x2;
      case 'additive': return Math.sqrt(x1) + Math.sqrt(x2);
      case 'quasilin': return Math.log(x1) + x2;
    }
    throw new Error('unknown example ' + ex);
  }

  // Which case applies: x1 + x2 buys the cheaper good ('1', '2' or 'tie'); ln x1 + x2 is interior when y >= p2.
  function regime(ex, p, y) {
    if (ex === 'subst') return p[0] < p[1] ? '1' : p[0] > p[1] ? '2' : 'tie';
    if (ex === 'quasilin') return y >= p[1] ? 'interior' : 'corner';
    return 'interior';
  }
  // The same for (EMP) at utility v: ln x1 + x2 is interior when v >= ln(p2/p1), i.e. when C(p,v) >= p2.
  const regimeV = (ex, p, v) => ex === 'quasilin' ? (v >= Math.log(p[1] / p[0]) ? 'interior' : 'corner') : regime(ex, p, 0);

  // Marshallian demand D(p,y), as a set.
  function demandSet(ex, p, y, a) {
    const [p1, p2] = p;
    switch (ex) {
      case 'leontief': return pt(y / (p1 + p2), y / (p1 + p2));
      case 'sqrt': return pt(y / (2 * p1), y / (2 * p2));
      case 'cd': return pt(a * y / p1, (1 - a) * y / p2);
      case 'subst': return p1 < p2 ? pt(y / p1, 0) : p1 > p2 ? pt(0, y / p2) : [[y / p1, 0], [0, y / p2]];
      case 'additive': return pt(y * p2 / (p1 * (p1 + p2)), y * p1 / (p2 * (p1 + p2)));
      case 'quasilin': return y >= p2 ? pt(p2 / p1, y / p2 - 1) : pt(y / p1, 0);
    }
    throw new Error('unknown example ' + ex);
  }

  // Indirect utility V(p,y).
  function indirect(ex, p, y, a) {
    const [p1, p2] = p;
    switch (ex) {
      case 'leontief': return y / (p1 + p2);
      case 'sqrt': return y / (2 * Math.sqrt(p1 * p2));
      case 'cd': return y / priceIndex(p, a);
      case 'subst': return y / Math.min(p1, p2);
      case 'additive': return Math.sqrt(y * (p1 + p2) / (p1 * p2));
      case 'quasilin': return y >= p2 ? Math.log(p2 / p1) + y / p2 - 1 : Math.log(y / p1);
    }
    throw new Error('unknown example ' + ex);
  }

  // Expenditure function C(p,v).
  function expenditure(ex, p, v, a) {
    const [p1, p2] = p;
    switch (ex) {
      case 'leontief': return v * (p1 + p2);
      case 'sqrt': return 2 * v * Math.sqrt(p1 * p2);
      case 'cd': return v * priceIndex(p, a);
      case 'subst': return v * Math.min(p1, p2);
      case 'additive': return v * v * p1 * p2 / (p1 + p2);
      case 'quasilin': return v >= Math.log(p2 / p1) ? p2 * (v + 1 - Math.log(p2 / p1)) : p1 * Math.exp(v);
    }
    throw new Error('unknown example ' + ex);
  }

  // Hicksian demand H(p,v), as a set.
  function hicksSet(ex, p, v, a) {
    const [p1, p2] = p;
    switch (ex) {
      case 'leontief': return pt(v, v);
      case 'sqrt': return pt(v * Math.sqrt(p2 / p1), v * Math.sqrt(p1 / p2));
      case 'cd': { const P = priceIndex(p, a); return pt(a * v * P / p1, (1 - a) * v * P / p2); }
      case 'subst': return p1 < p2 ? pt(v, 0) : p1 > p2 ? pt(0, v) : [[v, 0], [0, v]];
      case 'additive': { const s = (p1 + p2) * (p1 + p2); return pt(v * v * p2 * p2 / s, v * v * p1 * p1 / s); }
      case 'quasilin': return v >= Math.log(p2 / p1) ? pt(p2 / p1, v - Math.log(p2 / p1)) : pt(Math.exp(v), 0);
    }
    throw new Error('unknown example ' + ex);
  }

  // Partial derivatives of V: { p: [V_p1, V_p2], y: V_y }, or null where V has a kink in p.
  function indirectGrad(ex, p, y, a) {
    const [p1, p2] = p, V = indirect(ex, p, y, a);
    switch (ex) {
      case 'leontief': { const s = p1 + p2; return { p: [-y / (s * s), -y / (s * s)], y: 1 / s }; }
      case 'sqrt': return { p: [-V / (2 * p1), -V / (2 * p2)], y: V / y };
      case 'cd': return { p: [-a * V / p1, -(1 - a) * V / p2], y: V / y };
      case 'subst': return p1 < p2 ? { p: [-y / (p1 * p1), 0], y: 1 / p1 } : p1 > p2 ? { p: [0, -y / (p2 * p2)], y: 1 / p2 } : null;
      case 'additive': return { p: [-y / (2 * p1 * p1 * V), -y / (2 * p2 * p2 * V)], y: (p1 + p2) / (2 * p1 * p2 * V) };
      case 'quasilin': return y >= p2 ? { p: [-1 / p1, 1 / p2 - y / (p2 * p2)], y: 1 / p2 } : { p: [-1 / p1, 0], y: 1 / y };
    }
    throw new Error('unknown example ' + ex);
  }

  // Partial derivatives of C in p: [C_p1, C_p2], or null where C has a kink in p.
  function expenditureGrad(ex, p, v, a) {
    const [p1, p2] = p;
    switch (ex) {
      case 'leontief': return [v, v];
      case 'sqrt': return [v * Math.sqrt(p2 / p1), v * Math.sqrt(p1 / p2)];
      case 'cd': { const P = priceIndex(p, a); return [a * v * P / p1, (1 - a) * v * P / p2]; }
      case 'subst': return p1 < p2 ? [v, 0] : p1 > p2 ? [0, v] : null;
      case 'additive': { const s = (p1 + p2) * (p1 + p2); return [v * v * p2 * p2 / s, v * v * p1 * p1 / s]; }
      case 'quasilin': return v >= Math.log(p2 / p1) ? [p2 / p1, v - Math.log(p2 / p1)] : [Math.exp(v), 0];
    }
    throw new Error('unknown example ' + ex);
  }

  // The indifference curve U = v as a polyline inside [0, L]^2 (null breaks where it leaves the box).
  function curve(ex, v, a, L, n = 240) {
    if (ex === 'leontief') return [[v, L], [v, v], [L, v]];
    if (ex === 'subst') return [[0, v], [v, 0]];
    const out = [];
    const lo = ex === 'quasilin' ? Math.exp(v - L) : ex === 'additive' ? 0 : ex === 'cd' ? Math.pow(v, 1 / a) * Math.pow(L, -(1 - a) / a) : v * v / L;
    const hi = ex === 'quasilin' ? Math.exp(v) : ex === 'additive' ? v * v : L;
    for (let i = 0; i <= n; i++) {
      // denser near the steep end, where the curve bends most
      const s = i / n, x1 = lo + (Math.min(hi, L) - lo) * s * s;
      const x2 = ex === 'sqrt' ? v * v / x1 : ex === 'cd' ? Math.pow(v / Math.pow(x1, a), 1 / (1 - a))
        : ex === 'additive' ? Math.pow(v - Math.sqrt(x1), 2) : v - Math.log(x1);
      out.push([x1, x2 <= L * 1.001 ? Math.max(0, x2) : null]);
    }
    return out;
  }

  return { EXAMPLES, priceIndex, utility, regime, regimeV, demandSet, indirect, expenditure, hicksSet, indirectGrad, expenditureGrad, curve };
});
