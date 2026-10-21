/*
 * The Production Set Q (lecture 8): seven technologies and the six properties of Q in the notes. Pure math, no DOM;
 * UMD so that test-model.cjs can require it.
 *
 * Netputs: in 2D q = (q_L, q_s), labour and sausages; in 3D q = (q_P, q_L, q_s), pigs, labour and sausages. Inputs
 * z = -q. Every technology but the free lunch passes through the notes' sausage factory: 10 hours of labour (2D), or
 * 20 pigs and 10 hours (3D), make 1000 sausages. With the input index
 *   x = z_L / 10 (2D),   x = sqrt(z_P z_L / 200) (3D, homogeneous of degree 1, concave),
 * the most sausages are 1000 h(x):
 *   crs h = x;  drs h = x^0.7;  irs h = x^1.4;  fix h = 2 max(0, x - 1/2) (a setup cost);  lunch h = x + 0.3;
 *   nodisp h = x, but Q is only the frontier (no free disposal);
 *   rev: a linear technology that also runs backwards, q_s <= 100 z_L (2D) or 25 z_P + 50 z_L (3D), any sign of z.
 * Q = { q : inputs z >= 0 and q_s <= 1000 h(x) } (rev: any z; nodisp: q_s = 1000 h(x)).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QSetModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TECHS = ['crs', 'drs', 'irs', 'fix', 'lunch', 'rev', 'nodisp'];
  const NAMES = { crs: 'Constant returns', drs: 'Decreasing returns', irs: 'Increasing returns', fix: 'A fixed cost', lunch: 'A free lunch', rev: 'Reversible', nodisp: 'No free disposal' };
  // the properties that fail for some plans (1 inaction, 2 no free lunch, 3 irreversibility, 4 free disposal,
  // 5 additivity, 6 divisibility); all the others hold for every plan. Without free disposal Q is only the frontier: in
  // 2D a straight line, closed under addition; in 3D a curved roof, and q' + q'' lies strictly below it.
  const FAIL = { crs: [], drs: [5], irs: [6], fix: [6], lunch: [2, 3, 5], rev: [3] };
  const FAILS = (tech, dims) => (tech === 'nodisp' ? (dims === 2 ? [4] : [4, 5]) : FAIL[tech]);
  const UNIT = 1000;

  const h = (tech, x) => {
    switch (tech) {
      case 'drs': return Math.pow(x, 0.7);
      case 'irs': return Math.pow(x, 1.4);
      case 'fix': return 2 * Math.max(0, x - 0.5);
      case 'lunch': return x + 0.3;
      default: return x;
    }
  };
  // the input index of the inputs z (2D: [z_L]; 3D: [z_P, z_L])
  const index = z => (z.length === 1 ? z[0] / 10 : Math.sqrt(z[0] * z[1] / 200));
  // the most sausages from inputs z (null where the technology cannot run: an input given back, except when reversible)
  function frontier(tech, z) {
    if (tech === 'rev') return z.length === 1 ? 100 * z[0] : 25 * z[0] + 50 * z[1];
    if (z.some(v => v < 0)) return null;
    return UNIT * h(tech, index(z));
  }
  // q in Q? q = [...inputs as netputs, q_s]
  function inQ(tech, q, tol = 1e-9) {
    const z = q.slice(0, -1).map(v => -v), s = q[q.length - 1], f = frontier(tech, z);
    if (f === null) return false;
    const t = tol * Math.max(1, Math.abs(f));
    return tech === 'nodisp' ? Math.abs(s - f) <= t : s <= f + t;
  }
  // a plan on the frontier with inputs z
  const onFrontier = (tech, z) => [...z.map(v => -v), frontier(tech, z)];

  const add = (a, b) => a.map((v, i) => v + b[i]);
  const scale = (t, a) => a.map(v => t * v);
  // The six properties tested on two plans q1, q2 (and on the technology at 0 for no free lunch). d: a vector > 0 for
  // free disposal (the plan q1 - d, less of everything). Returns { ok, plan } for each.
  function tests(tech, q1, q2, d) {
    const n = q1.length, zero = new Array(n).fill(0);
    const lunch = frontier(tech, new Array(n - 1).fill(0));
    const below = add(q1, scale(-1, d));
    return {
      1: { ok: inQ(tech, zero), plan: zero },
      2: { ok: !(lunch > 1e-9), plan: [...new Array(n - 1).fill(0), Math.max(0, lunch)] },
      3: { ok: !inQ(tech, scale(-1, q1)), plan: scale(-1, q1) },
      4: { ok: inQ(tech, below), plan: below },
      5: { ok: inQ(tech, add(q1, q2)), plan: add(q1, q2) },
      6: { ok: inQ(tech, scale(0.5, q1)), plan: scale(0.5, q1) }
    };
  }

  return { TECHS, NAMES, FAILS, UNIT, h, index, frontier, inQ, onFrontier, add, scale, tests };
});
