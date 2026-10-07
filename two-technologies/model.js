/*
 * Two Technologies and a Kink: tool math (lecture 2).
 *
 * Two Cobb-Douglas technologies that mirror each other, phi_A = z1^alpha z2^beta and phi_B = z1^beta z2^alpha
 * (alpha > beta > 0, k = alpha + beta < 1). They give the same output on the ray z1 = z2.
 *   Firm D needs both:        phi_D = min{phi_A, phi_B}  (quasi-concave; its isoquant has a kink on z1 = z2)
 *   Firm C uses the better:   phi_C = max{phi_A, phi_B}  (not quasi-concave; its isoquant bends inwards)
 * Cost minimisation (CM) for each firm, the minimal cost C(w, q) = c(w) q^(1/k), supply and the split of
 * dD1/dw1 into substitution and scale. Works in the browser (window.KinkModel) and in Node.
 */
(function (root) {
  'use strict';

  const phiA = (z, s) => Math.pow(z[0], s.alpha) * Math.pow(z[1], s.beta);
  const phiB = (z, s) => Math.pow(z[0], s.beta) * Math.pow(z[1], s.alpha);
  const phi = (z, s, firm) => (firm === 'C' ? Math.max : Math.min)(phiA(z, s), phiB(z, s));

  // Cheapest bundle for one Cobb-Douglas technology z1^a z2^b >= q (interior tangency).
  function cdBundle(w, q, a, b) {
    const k = a + b, t = Math.pow(q, 1 / k);
    return [t * Math.pow(a * w[1] / (b * w[0]), b / k), t * Math.pow(b * w[0] / (a * w[1]), a / k)];
  }
  const cost = (w, z) => w[0] * z[0] + w[1] * z[1];

  /*
   * (CM) for firm D or C. D: phi_A >= q and phi_B >= q; the cheapest of the tangency of A (if B is also met there),
   * the tangency of B (if A is met there) and the kink z1 = z2. C: phi_A >= q or phi_B >= q; the cheaper tangency.
   * Returns the bundle H, its cost and which regime it is in: 'A', 'B' or 'kink'.
   */
  function costMin(w, q, s, firm = 'D') {
    const zA = cdBundle(w, q, s.alpha, s.beta), zB = cdBundle(w, q, s.beta, s.alpha);
    if (firm === 'C') {
      const cA = cost(w, zA), cB = cost(w, zB);
      return cA <= cB ? { H: zA, C: cA, regime: 'A' } : { H: zB, C: cB, regime: 'B' };
    }
    const tol = 1e-12 * Math.max(1, q);
    const cands = [];
    if (phiB(zA, s) >= q - tol) cands.push({ H: zA, regime: 'A' });
    if (phiA(zB, s) >= q - tol) cands.push({ H: zB, regime: 'B' });
    const zk = Math.pow(q, 1 / (s.alpha + s.beta));
    cands.push({ H: [zk, zk], regime: 'kink' });
    cands.forEach(c => { c.C = cost(w, c.H); });
    return cands.reduce((m, c) => (c.C < m.C - 1e-12 ? c : m));
  }

  // The prices at which firm D stays at the kink: beta/alpha <= w1/w2 <= alpha/beta.
  const kinkRange = s => [s.beta / s.alpha, s.alpha / s.beta];

  // C(w, q) = c(w) q^(1/k) for both firms (both technologies are homogeneous of degree k): supply from p = MC.
  const unitCost = (w, s, firm) => costMin(w, 1, s, firm).C;
  function supply(w, p, s, firm = 'D') {
    const k = s.alpha + s.beta, c = unitCost(w, s, firm);
    return Math.pow(p * k / c, k / (1 - k));
  }
  // The output price at which q is the profit-maximising output.
  const priceFor = (w, q, s, firm = 'D') => unitCost(w, s, firm) * Math.pow(q, 1 / (s.alpha + s.beta) - 1) / (s.alpha + s.beta);

  /*
   * dD1/dw1 = dH1/dw1 (substitution, output fixed) + dH1/dq * dS/dw1 (scale), at prices w and output price p,
   * by central differences in w1 (relative step 1e-6). Not defined where H jumps or has a corner in w1.
   */
  function decompose(w, p, s, firm = 'D') {
    const h = 1e-6 * w[0], q = supply(w, p, s, firm);
    const up = [w[0] + h, w[1]], dn = [w[0] - h, w[1]];
    const H1 = (ww, qq) => costMin(ww, qq, s, firm).H[0];
    const D1 = ww => H1(ww, supply(ww, p, s, firm));
    const total = (D1(up) - D1(dn)) / (2 * h);
    const substitution = (H1(up, q) - H1(dn, q)) / (2 * h);
    // H(w, q) = H(w, 1) q^(1/k) and C(w, q) = c(w) q^(1/k), so the q-derivatives are exact
    const k = s.alpha + s.beta, at1 = costMin(w, 1, s, firm);
    const dHdq = at1.H[0] * Math.pow(q, 1 / k - 1) / k;
    const Cqq = at1.C * (1 / k) * (1 / k - 1) * Math.pow(q, 1 / k - 2);
    const dSdw1 = (supply(up, p, s, firm) - supply(dn, p, s, firm)) / (2 * h);
    return { q, total, substitution, scale: dHdq * dSdw1, dHdq, dSdw1, Cqq };
  }

  // Where the cheapest bundle jumps (firm C, at w1 = w2) or turns a corner (firm D, at the ends of the kink range).
  function nearSwitch(w, s, firm, rel = 1e-4) {
    const r = w[0] / w[1], pts = firm === 'C' ? [1] : kinkRange(s);
    return pts.some(x => Math.abs(r - x) <= rel * x);
  }

  // Isoquant phi = q of one technology or a firm, as points (z1, z2) for z1 in [lo, hi].
  // z2 on the isoquant phi = q at a given z1, for technology A or B or firm C or D.
  function z2On(q, s, which, z1) {
    const a = Math.pow(q / Math.pow(z1, s.alpha), 1 / s.beta), b = Math.pow(q / Math.pow(z1, s.beta), 1 / s.alpha);
    return which === 'A' ? a : which === 'B' ? b : which === 'C' ? Math.min(a, b) : Math.max(a, b);
  }
  function isoquant(q, s, which, lo, hi, n = 200) {
    return Array.from({ length: n }, (_, i) => { const z1 = lo * Math.pow(hi / lo, i / (n - 1)); return [z1, z2On(q, s, which, z1)]; });
  }

  const EXERCISE = { alpha: 0.6, beta: 0.2 };
  const api = { phiA, phiB, phi, cdBundle, costMin, kinkRange, unitCost, supply, priceFor, decompose, nearSwitch, z2On, isoquant, EXERCISE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KinkModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
