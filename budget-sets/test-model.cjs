// Checks the budget sets of lecture 5 (section 2.1).
// Run with:  node budget-sets/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Point-in-polygon (convex polygons listed in order) for checking the drawn pieces against the definition.
function inPoly(x, poly) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    const cr = (b[0] - a[0]) * (x[1] - a[1]) - (b[1] - a[1]) * (x[0] - a[0]);
    if (Math.abs(cr) < 1e-9) continue;
    if (sign === 0) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) return false;
  }
  return true;
}
const onSeg = (x, [a, b]) => Math.abs(x[1] - a[1]) < 1e-9 && x[0] >= Math.min(a[0], b[0]) - 1e-9 && x[0] <= Math.max(a[0], b[0]) + 1e-9;

const types = ['B1', 'B2', 'B3', 'tariff'], Xs = [{ type: 'all' }, { type: 'cap', cap: 3 }, { type: 'integer' }];
for (let r = 0; r < 400; r++) {
  const p = [0.5 + 3 * rnd(), 0.5 + 3 * rnd()];
  const b = { type: types[r % 4], y: 2 + 10 * rnd(), R: [6 * rnd(), 6 * rnd()], F: 3 * rnd() };
  const X = Xs[Math.floor(r / 4) % 3], P = M.pieces(p, b, X);
  // The drawn pieces contain exactly the feasible bundles (random test points).
  for (let k = 0; k < 60; k++) {
    let x = [12 * rnd(), 12 * rnd()];
    if (X.type === 'integer' || k % 5 === 0) x[1] = Math.round(x[1]);
    if (k % 7 === 0) x[1] = 0;
    const drawn = P.polys.some(poly => inPoly(x, poly) && (b.type !== 'tariff' || x[1] > 1e-9)) || P.segs.some(s => onSeg(x, s));
    assert.equal(drawn, M.feasible(x, p, b, X), `pieces vs feasible ${JSON.stringify({ x, p, b, X })}`);
    checks++;
  }
}

// The budget line turns about the pivot when p1 changes; under (B2) the endowment is always affordable.
for (let r = 0; r < 200; r++) {
  const b = { type: ['B1', 'B2', 'B3'][r % 3], y: 1 + 10 * rnd(), R: [6 * rnd(), 6 * rnd()] }, p2 = 0.5 + 2 * rnd();
  for (const p1 of [0.4, 1, 2.5, 6]) {
    const pv = M.pivot([p1, p2], b);
    close(p1 * pv[0] + p2 * pv[1], M.wealth([p1, p2], b), 1e-12, 'pivot on the line');
    checks++;
  }
  // The pivot does not depend on p1.
  assert.deepEqual(M.pivot([1, p2], b), M.pivot([3, p2], b));
  checks++;
}

// (B1) and (B2) can give the same budget set at one price vector and react differently to a price change.
{
  const p = [2, 1], b1 = { type: 'B1', y: 12 }, b2 = { type: 'B2', R: [4, 4] };
  close(M.wealth(p, b1), M.wealth(p, b2), 1e-12);
  const q = [3, 1];
  close(M.pieces(q, b1, { type: 'all' }).intercepts.x2, 12, 1e-12);          // (B1): the x2-intercept stays
  close(M.pieces(q, b2, { type: 'all' }).intercepts.x2, 16, 1e-12);          // (B2): the endowment is worth more
  close(M.pieces(q, b2, { type: 'all' }).intercepts.x1, 16 / 3, 1e-12);
  checks += 4;
}

// The two-part tariff makes the budget set non-convex: the midpoint of two affordable bundles is not affordable.
for (const F of [0.5, 2, 4]) {
  const p = [1, 1], b = { type: 'tariff', y: 10, F }, X = { type: 'all' };
  const A = [10, 0], B = [0, 10 - F - 1e-9], mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  assert.ok(M.feasible(A, p, b, X) && M.feasible(B, p, b, X) && !M.feasible(mid, p, b, X));
  assert.equal(M.convex(b, X), false);
  checks += 2;
}
assert.equal(M.convex({ type: 'tariff', F: 0 }, { type: 'all' }), true);
assert.equal(M.convex({ type: 'B2' }, { type: 'cap', cap: 2 }), true);
assert.equal(M.convex({ type: 'B1' }, { type: 'integer' }), false);
checks += 3;

console.log(`All ${checks} budget-set checks passed.`);
