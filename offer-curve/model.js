/*
 * The Offer Curve (lecture 9): one household with endowment R trades at prices p; its budget line p'x = p'R passes
 * through R, and the offer curve joins its choices x(p) as the price ratio r = p1/p2 changes. Pure math, no DOM; UMD so
 * that test-model.cjs can require it. Prices are normalised to p2 = 1.
 *
 *   convex      U = 2 / (1/x1 + 1/x2)   (CES, sigma = 1/2):  x1 = y / (r + sqrt r),  x2 = y / (1 + sqrt r)
 *   nonconvex   U = max{ x1^(1/4) x2^(3/4), x1^(3/4) x2^(1/4) }: two Cobb-Douglas households in one. Each part's
 *               choice is (y/(4r), 3y/4) or (3y/(4r), y/4), with utilities k y r^(-1/4) and k y r^(-3/4)
 *               (k = (1/4)^(1/4) (3/4)^(3/4)): the second is better when r < 1, the first when r > 1, both at r = 1.
 *               The better-than sets are unions of two convex sets, not convex, and the offer curve jumps at r = 1.
 * The convex household owns R = (8, 2), chosen without trade at r = 1/16; the non-convex one R = (8, 1), well away from
 * the diagonal where its indifference curves have their kink, chosen without trade at r = 3/8.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OfferModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ENDOW = { convex: [8, 2], nonconvex: [8, 1] };
  const PREFS = ['convex', 'nonconvex'];
  const endowment = pref => ENDOW[pref];
  const income = (pref, r) => r * ENDOW[pref][0] + ENDOW[pref][1];

  function utility(pref, x) {
    const [a, b] = x;
    if (a < 0 || b < 0) return -Infinity;
    if (pref === 'convex') return a > 0 && b > 0 ? 2 / (1 / a + 1 / b) : 0;
    return Math.max(Math.pow(a, 0.25) * Math.pow(b, 0.75), Math.pow(a, 0.75) * Math.pow(b, 0.25));
  }

  // The choices at r: one bundle, or two at a jump (the non-convex household at r = 1).
  function choices(pref, r) {
    const y = income(pref, r);
    if (pref === 'convex') { const s = Math.sqrt(r); return [[y / (r + s), y / (1 + s)]]; }
    const A = [y / (4 * r), 3 * y / 4], B = [3 * y / (4 * r), y / 4];
    if (Math.abs(r - 1) < 1e-12) return [B, A];
    return r < 1 ? [B] : [A];
  }
  const choice = (pref, r) => choices(pref, r)[0];
  // the price ratio at which R itself is chosen (no trade)
  const noTrade = pref => { const R = ENDOW[pref]; return pref === 'convex' ? (R[1] / R[0]) ** 2 : 3 * R[1] / R[0]; };
  // the price ratio at which the offer curve jumps (null when it never does)
  const jump = pref => (pref === 'convex' ? null : 1);

  // The indifference curve U = v as x2 against x1 (null where x2 would be infinite).
  function curveX2(pref, v, x1) {
    if (pref === 'convex') { const d = 2 / v - 1 / x1; return d > 0 ? 1 / d : null; }
    return Math.min(Math.pow(v / Math.pow(x1, 0.25), 4 / 3), Math.pow(v / Math.pow(x1, 0.75), 4));
  }

  return { PREFS, endowment, income, utility, choices, choice, noTrade, jump, curveX2 };
});
