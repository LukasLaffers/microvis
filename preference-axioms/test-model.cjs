// Checks the preference relations of lecture 5 (sections 2.2-2.4) and the table of axioms shown on the page:
// every axiom marked as holding survives a random search for counterexamples, and every axiom marked as failing
// has an explicit counterexample.
// Run with:  node preference-axioms/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

let checks = 0;
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pt = (lo = 0, hi = 10) => [lo + (hi - lo) * rnd(), lo + (hi - lo) * rnd()];
const prefs = {
  cobb: { type: 'cobb', alpha: 0.4 }, subs: { type: 'subs', alpha: 0.6 }, concave: { type: 'concave', alpha: 0.5 },
  bliss: { type: 'bliss', alpha: 0.5, bliss: [6, 6] }, lex: { type: 'lex', alpha: 0.5 }
};

for (const [name, P] of Object.entries(prefs)) {
  const A = M.AXIOMS[name];
  // Completeness and transitivity: compare is a total order (antisymmetric signs, transitive).
  for (let r = 0; r < 3000; r++) {
    const x = pt(), y = pt(), z = pt();
    assert.equal(M.compare(x, y, P), -M.compare(y, x, P), 'complete/antisymmetric ' + name);
    if (M.compare(x, y, P) >= 0 && M.compare(y, z, P) >= 0) assert.ok(M.compare(x, z, P) >= 0, 'transitive ' + name);
    checks += 2;
  }
  // Monotonicity: x >> y implies x strictly better, searched at random.
  let monoFail = false, strongFail = false;
  for (let r = 0; r < 4000; r++) {
    const y = pt(), d = [0.01 + 3 * rnd(), 0.01 + 3 * rnd()], x = [y[0] + d[0], y[1] + d[1]];
    if (M.compare(x, y, P) !== 1) monoFail = true;
    // Strong: more of one good, the same of the other (also on the axes).
    const yy = r % 3 === 0 ? [0, y[1]] : r % 3 === 1 ? [y[0], 0] : y, i = r % 2;
    const xx = yy.slice(); xx[i] += d[i];
    if (M.compare(xx, yy, P) !== 1) strongFail = true;
  }
  assert.equal(!monoFail, A.monotone, 'monotone ' + name);
  assert.equal(!(monoFail || strongFail), A.strongMonotone, 'strongly monotone ' + name);
  checks += 2;
  // Convexity of B(x) for x >> 0: segments between two bundles in B(x) stay in B(x).
  let convexFail = false, strictFail = false;
  for (let r = 0; r < 1500; r++) {
    const x = pt(0.5, 9.5), a = pt(), b = pt();
    if (!(M.better(a, x, P) && M.better(b, x, P))) continue;
    if (!M.segmentInB(a, b, x, P, 60).allIn) convexFail = true;
    // Strict convexity: the midpoint of two different indifferent bundles is strictly better.
  }
  // For strict convexity use pairs on I(x).
  for (let r = 0; r < 400 && P.type !== 'lex'; r++) {
    const x = pt(1, 8), curve = M.indifferenceCurve(x, P, 10, 200).filter(q => q[1] !== null && q[0] > 0 && q[1] > 0);
    if (curve.length < 2) continue;
    const a = curve[Math.floor(rnd() * curve.length)], b = curve[Math.floor(rnd() * curve.length)];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.3) continue;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ua = M.utility(a, P), um = M.utility(mid, P);
    if (!(um > ua + 1e-9 * Math.max(1, Math.abs(ua)))) strictFail = true;
  }
  if (P.type === 'lex') {
    // Two bundles with the same x1 and the segment between them lies on the boundary of B(x): not strictly convex.
    const x = [4, 4], a = [4, 5], b = [4, 7], mid = [4, 6];
    assert.ok(M.better(a, x, P) && M.better(b, x, P) && M.better(mid, x, P) && !M.better([4 - 1e-9, 6], x, P));
    strictFail = true;
  }
  assert.equal(!convexFail, A.convex, 'convex ' + name);
  assert.equal(!(convexFail || strictFail), A.strictlyConvex, 'strictly convex ' + name);
  checks += 2;
}

// Continuity fails for lexicographic preferences: x^n = (4 + 1/n, 2) is in B((4,4)) for every n, its limit (4, 2) is not.
{
  const P = prefs.lex, x = [4, 4];
  for (let n = 1; n <= 1e6; n *= 10) assert.ok(M.better([4 + 1 / n, 2], x, P));
  assert.ok(!M.better([4, 2], x, P));
  // I(x) is a single point.
  assert.equal(M.compare([4, 4], x, P), 0); assert.notEqual(M.compare([4, 4 + 1e-12], x, P), 0);
  checks += 9;
}
// Utility-based preferences are continuous: B(x) is closed along the same kind of sequence.
for (const name of ['cobb', 'subs', 'concave', 'bliss']) {
  const P = prefs[name], x = [4, 4], u = M.utility(x, P);
  for (let r = 0; r < 200; r++) {
    const y = pt(), seq = [1, 10, 100, 1000].map(n => [y[0] + 1 / n, y[1]]);
    if (seq.every(z => M.better(z, x, P))) { assert.ok(M.utility(y, P) >= u - 1e-9); checks++; }
  }
}

// The indifference curve points have the utility of x.
for (const name of ['cobb', 'subs', 'concave', 'bliss']) {
  const P = prefs[name], x = [3, 5], u = M.utility(x, P);
  for (const q of M.indifferenceCurve(x, P, 10, 100)) if (q[1] !== null) { assert.ok(Math.abs(M.utility(q, P) - u) < 1e-8 * Math.max(1, Math.abs(u))); checks++; }
}

// Bliss point: beyond it more of both goods is worse; Cobb-Douglas on the axis: more of good 2 does not help.
assert.equal(M.compare([8, 8], [7, 7], prefs.bliss), -1);
assert.equal(M.compare([0, 2], [0, 1], prefs.cobb), 0);
// Concave indifference curves: the midpoint of two indifferent bundles is worse (Cowell's segment test fails).
assert.ok(!M.segmentInB([6, 0], [0, 6], [6, 0], prefs.concave).allIn);
checks += 3;

console.log(`All ${checks} preference checks passed.`);
