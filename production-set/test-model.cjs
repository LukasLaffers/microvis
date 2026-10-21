// Checks the production sets of lecture 8. Run with:  node production-set/test-model.cjs
// Each technology's claim (which of the six properties hold for every plan) is checked by a search for counterexamples:
// a property claimed to hold must hold for every sampled plan; one claimed to fail must fail for some sampled plan.
const assert = require('node:assert/strict');
const M = require('./model.js');

let checks = 0, seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);

// a random plan in Q: random inputs, sausages on the frontier or (with free disposal) below it
function sample(tech, dims, onRoof) {
  const z = Array.from({ length: dims - 1 }, () => (tech === 'rev' && rnd() < 0.3 ? -1 : 1) * 30 * rnd() * rnd());
  const f = M.frontier(tech, z);
  const s = onRoof || tech === 'nodisp' ? f : f - 1500 * rnd();
  return [...z.map(v => -v), s];
}
const zeroIn = (tech, dims) => M.inQ(tech, new Array(dims).fill(0));

for (const dims of [2, 3]) for (const tech of M.TECHS) {
  const fails = new Set(), label = tech + ' ' + dims + 'D';
  // the notes' factory: 10 hours (2D), 20 pigs and 10 hours (3D) give 1000 sausages, except with a free lunch (1300)
  close(M.frontier(tech, dims === 2 ? [10] : [20, 10]), tech === 'lunch' ? 1300 : 1000, 1e-12, 'factory ' + label); checks++;
  for (let k = 0; k < 4000; k++) {
    const a = sample(tech, dims, k % 3 === 0), b = sample(tech, dims, k % 5 === 0);
    assert.ok(M.inQ(tech, a) && M.inQ(tech, b), 'samples in Q ' + label); checks += 2;
    const d = Array.from({ length: dims }, () => 0.5 + 200 * rnd());
    const T = M.tests(tech, a, b, d);
    for (let p = 1; p <= 6; p++) if (!T[p].ok) fails.add(p);
    // independent checks of the properties on these plans
    assert.equal(T[5].ok, M.inQ(tech, M.add(a, b))); assert.equal(T[6].ok, M.inQ(tech, M.scale(0.5, a)));
    for (const t of [0.1, 0.37, 0.9]) if (!M.inQ(tech, M.scale(t, a))) fails.add(6);
    // irreversibility for any plan q != 0: also the plans with no inputs, e.g. (0, s) with s <= the free lunch
    const s0 = M.frontier(tech, new Array(dims - 1).fill(0));
    if (s0 !== null && s0 > 1e-9) { const q = [...new Array(dims - 1).fill(0), s0 * rnd()]; if (M.inQ(tech, q) && M.inQ(tech, M.scale(-1, q))) fails.add(3); }
    // free disposal: any plan below a, in every coordinate
    const below = a.map((v, i) => v - d[i] * rnd());
    if (!M.inQ(tech, below)) fails.add(4);
    checks += 2;
  }
  // no free lunch: Q has no point q >= 0 other than 0
  for (let k = 0; k < 2000; k++) {
    const q = Array.from({ length: dims }, () => (rnd() < 0.3 ? 0 : 50 * rnd()));
    if (q.some(v => v > 0) && M.inQ(tech, q)) fails.add(2);
  }
  if (!zeroIn(tech, dims)) fails.add(1);
  assert.deepEqual([...fails].sort(), M.FAILS(tech, dims), 'claims ' + label);
  checks++;
}
// Constant returns: Q is a cone (t q in Q for every t >= 0); additivity and divisibility give it.
for (let k = 0; k < 500; k++) {
  const q = sample('crs', 3, false);
  for (const t of [0, 0.3, 1, 2.5, 7]) { assert.ok(M.inQ('crs', M.scale(t, q))); checks++; }
}
console.log(`All ${checks} production-set checks passed.`);
