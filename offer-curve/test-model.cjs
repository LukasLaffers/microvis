// Checks the offer curves of lecture 9. Run with:  node offer-curve/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
// brute force: the best bundle on the budget line r x1 + x2 = y, on a fine grid and then refined around the best
function brute(pref, r) {
  const y = M.income(r), hi = y / r, f = a => M.utility(pref, [a, Math.max(0, y - r * a)]);
  let best = 0, bv = -Infinity;
  const N = 20000;
  for (let i = 0; i <= N; i++) { const a = hi * i / N, v = f(a); if (v > bv) { bv = v; best = a; } }
  let lo = Math.max(0, best - hi / N), up = Math.min(hi, best + hi / N);
  for (let k = 0; k < 80; k++) { const a = lo + (up - lo) / 3, b = up - (up - lo) / 3; if (f(a) >= f(b)) up = b; else lo = a; }
  const a = (lo + up) / 2;
  return { x: [a, y - r * a], v: f(a) };
}

for (const pref of M.PREFS) {
  // no trade: at that price R is the choice
  const r0 = M.noTrade(pref), x0 = M.choice(pref, r0);
  close(x0[0], M.R[0], 1e-12, 'no trade ' + pref); close(x0[1], M.R[1], 1e-12); checks += 2;
  for (const r of [0.02, 0.05, 0.0625, 0.1, 0.3, 0.75, 0.9, 0.99, 1.01, 1.5, 2.5, 4]) {
    const xs = M.choices(pref, r), B = brute(pref, r), y = M.income(r);
    for (const x of xs) {
      close(r * x[0] + x[1], y, 1e-12, 'on the budget line ' + pref + ' ' + r);
      close(M.utility(pref, x), B.v, 1e-7, 'as good as brute force ' + pref + ' ' + r);
      // property 1 of the notes: the choice is at least as good as R (R is affordable)
      assert.ok(M.utility(pref, x) >= M.utility(pref, M.R) - 1e-12);
      checks += 3;
    }
    if (xs.length === 1) { close(xs[0][0], B.x[0], 1e-4, 'x1 brute ' + pref + ' ' + r); checks++; }
  }
  // the indifference curve through a choice passes through it, and every point on it has that utility
  for (const r of [0.1, 0.5, 2]) {
    const x = M.choice(pref, r), v = M.utility(pref, x);
    close(M.curveX2(pref, v, x[0]), x[1], 1e-9, 'curve through x ' + pref);
    for (const a of [1, 2.5, 5, 9]) { const b = M.curveX2(pref, v, a); if (b !== null) { close(M.utility(pref, [a, b]), v, 1e-9, 'level ' + pref); checks++; } }
    checks++;
  }
}
// The convex household's offer curve is continuous; the non-convex one jumps at r = 1 from (7.5, 2.5) to (2.5, 7.5),
// where both bundles are optimal.
{
  const e = 1e-7;
  for (let k = 0; k < 400; k++) {
    const r = Math.exp(Math.log(0.02) + k * Math.log(200) / 400), a = M.choice('convex', r), b = M.choice('convex', r * (1 + e));
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-4); checks++;
  }
  const lo = M.choice('nonconvex', 1 - e), hi = M.choice('nonconvex', 1 + e), both = M.choices('nonconvex', 1);
  close(lo[0], 7.5, 1e-5); close(lo[1], 2.5, 1e-5); close(hi[0], 2.5, 1e-5); close(hi[1], 7.5, 1e-5);
  assert.equal(both.length, 2); close(M.utility('nonconvex', both[0]), M.utility('nonconvex', both[1]), 1e-12);
  checks += 6;
  // the better-than set is not convex: two bundles with U >= v whose midpoint has U < v
  const v = M.utility('nonconvex', [7.5, 2.5]), mid = [5, 5];
  assert.ok(M.utility('nonconvex', [2.5, 7.5]) >= v - 1e-12 && M.utility('nonconvex', mid) < v); checks++;
}
console.log(`All ${checks} offer-curve checks passed.`);
