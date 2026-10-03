/*
 * Budget Sets: tool math (lecture 5, section 2.1). Two goods.
 *
 * Technically feasible set X: 'all' = R^2_+, 'cap' = x2 <= xbar2, 'integer' = x2 a whole number (0, 1, 2, ...).
 * Budget constraints:
 *   (B1) p^t x <= y            exogenous income
 *   (B2) p^t x <= p^t R        endowment R, sold at the market prices
 *   (B3) p^t x <= p^t R + y    both
 *   two-part tariff on good 2: p1 x1 + p2 x2 + F <= y if x2 > 0, and p1 x1 <= y if x2 = 0.
 * When p1 changes the budget line turns about a point that stays affordable: (0, y/p2) under (B1), R under (B2),
 * (R1, R2 + y/p2) under (B3).
 *
 * Works in the browser (window.BudgetModel) and in Node.
 */
(function (root) {
  'use strict';

  const TOL = 1e-9;

  // Money available for buying goods, given prices.
  function wealth(p, b) {
    switch (b.type) {
      case 'B1': return b.y;
      case 'B2': return p[0] * b.R[0] + p[1] * b.R[1];
      case 'B3': return p[0] * b.R[0] + p[1] * b.R[1] + b.y;
      case 'tariff': return b.y;
    }
    throw new Error('unknown budget type ' + b.type);
  }

  const inX = (x, X) => x[0] >= -TOL && x[1] >= -TOL && (X.type !== 'cap' || x[1] <= X.cap + TOL) &&
    (X.type !== 'integer' || Math.abs(x[1] - Math.round(x[1])) <= TOL);

  function affordable(x, p, b) {
    const spend = p[0] * x[0] + p[1] * x[1];
    if (b.type === 'tariff') return x[1] > TOL ? spend + b.F <= b.y + TOL : spend <= b.y + TOL;
    return spend <= wealth(p, b) + TOL;
  }

  const feasible = (x, p, b, X) => inX(x, X) && affordable(x, p, b);

  // The feasible set as pieces to draw: polygons (areas) and segments (lines), plus the budget line's intercepts.
  function pieces(p, b, X) {
    const m = wealth(p, b), polys = [], segs = [];
    const mPos = b.type === 'tariff' ? b.y - b.F : m;     // money for bundles with x2 > 0
    const top = X.type === 'cap' ? Math.min(X.cap, Math.max(mPos, 0) / p[1]) : Math.max(mPos, 0) / p[1];
    if (X.type === 'integer') {
      for (let k = 0; k <= Math.floor(Math.max(m, mPos) / p[1] + TOL); k++) {
        const money = k === 0 ? (b.type === 'tariff' ? b.y : m) : mPos;
        if (money - p[1] * k >= -TOL) segs.push([[0, k], [Math.max(0, (money - p[1] * k) / p[0]), k]]);
      }
    } else {
      if (mPos > 0) {
        const pts = [[0, 0], [mPos / p[0], 0]];
        if (top < mPos / p[1] - TOL) pts.push([(mPos - p[1] * top) / p[0], top]);
        pts.push([0, top]);
        polys.push(pts);
      }
      if (b.type === 'tariff') segs.push([[0, 0], [b.y / p[0], 0]]);   // buying none of good 2 avoids the fee
    }
    return { polys, segs, intercepts: { x1: (b.type === 'tariff' ? b.y : m) / p[0], x2: mPos / p[1] }, money: m };
  }

  // The point the budget line turns about when p1 changes (null for the tariff).
  function pivot(p, b) {
    switch (b.type) {
      case 'B1': return [0, b.y / p[1]];
      case 'B2': return [b.R[0], b.R[1]];
      case 'B3': return [b.R[0], b.R[1] + b.y / p[1]];
      default: return null;
    }
  }

  // Is the feasible set convex? (B1)-(B3) on R^2_+ or with a cap: yes. Whole units: no. Tariff with F > 0: no.
  const convex = (b, X) => X.type !== 'integer' && !(b.type === 'tariff' && b.F > 0);

  const api = { wealth, inX, affordable, feasible, pieces, pivot, convex };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BudgetModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
