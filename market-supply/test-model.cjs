// Checks the market-supply math of lecture 5 (section 1.1) against brute-force calculations.
// Run with:  node market-supply/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// The notes' example: q-hat = 16, supply 16 + alpha (p - p') above p'.
{
  const f = { c: 2, alpha: 4, F: 32 }, { qHat, pHat } = M.startPoint(f);
  close(qHat, 16, 1e-12); close(pHat, 6, 1e-12);
  assert.deepEqual(M.supplySet(f, 6), [0, 16]);
  close(M.supplyAt(f, 7.5), 16 + 4 * 1.5, 1e-12);
  assert.deepEqual(M.supplySet(f, 5.9), [0]);
  close(M.cost(f, 16), 6 * 16, 1e-12, 'zero profit at p\'');
  assert.deepEqual(M.averageSupplySet(f, 2, 6), [0, 8, 16]);
  assert.deepEqual(M.averageSupplySet(f, 4, 6), [0, 4, 8, 12, 16]);
  checks += 8;
}

// p' = min AC and supply = argmax profit, by brute force.
for (let r = 0; r < 60; r++) {
  const f = { c: 0.5 + 3 * rnd(), alpha: 0.5 + 6 * rnd(), F: r % 4 === 0 ? 0 : 60 * rnd() };
  const { qHat, pHat } = M.startPoint(f);
  if (f.F > 0) {
    let best = Infinity, arg = 0;
    for (let q = 0.01; q < 200; q += 0.01) { const a = M.AC(f, q); if (a < best) { best = a; arg = q; } }
    assert.ok(pHat <= best + 1e-12, 'min AC is a lower bound'); close(pHat, best, 1e-5, 'min AC'); close(qHat, arg, 0.02, 'argmin AC');
    close(M.MC(f, qHat), pHat, 1e-12, 'MC = AC at the minimum');
    checks += 3;
  }
  for (const p of [0.5 * pHat + 0.1, pHat * 1.3 + 0.2, pHat + 5 * rnd()]) {
    let best = 0, arg = 0;
    for (let q = 0.005; q < 400; q += 0.005) { const v = p * q - M.cost(f, q); if (v > best) { best = v; arg = q; } }
    assert.ok(M.profit(f, p) >= best - 1e-9); close(M.profit(f, p), best, 1e-5, 'max profit');
    if (best > 1e-6) close(M.supplyAt(f, p), arg, 0.01, 'supply');
    checks += 2;
  }
}

// The market: two firms; the equilibrium found agrees with a fine scan of D - S.
let none = 0, atJump = 0;
for (let r = 0; r < 300; r++) {
  const firms = [0, 1].map(() => ({ c: 1 + 2 * rnd(), alpha: 1 + 5 * rnd(), F: rnd() < 0.2 ? 0 : 50 * rnd() }));
  const dem = { K: 5 + 400 * rnd(), eps: 0.3 + 2 * rnd() };
  const e = M.equilibrium(firms, dem);
  if (e.exists) {
    const set = M.marketSupplySet(firms, e.p);
    if (!set.some(v => Math.abs(v - e.Q) <= 1e-6 * Math.max(1, e.Q))) console.log(JSON.stringify({ firms, dem, e, set }));
    assert.ok(set.some(v => Math.abs(v - e.Q) <= 1e-6 * Math.max(1, e.Q)), 'D(p) in the supply set');
    if (e.atJump) atJump++;
  } else {
    none++;
    // At the gap price demand lies strictly between two neighbouring points of the supply set,
    // demand exceeds supply below it and falls short above it.
    const pg = e.gapPrice, d = M.demand(pg, dem), set = M.marketSupplySet(firms, pg);
    assert.ok(!set.some(v => Math.abs(v - d) < 1e-9), 'no hit at the gap');
    for (let p = 0.02; p < 3 * pg; p += pg / 500) {
      if (Math.abs(p - pg) < 1e-6) continue;
      const S = firms.reduce((s, f) => s + M.supplyAt(f, p), 0), D = M.demand(p, dem);
      assert.ok(p < pg ? D > S : D < S, 'excess demand changes sign only at the gap');
    }
  }
  checks += 2;
}
assert.ok(none > 5 && atJump >= 0, 'the random cases include markets without equilibrium');

// Zero fixed costs: supply is continuous, so an equilibrium always exists.
for (let r = 0; r < 100; r++) {
  const firms = [0, 1].map(() => ({ c: 1 + 2 * rnd(), alpha: 1 + 5 * rnd(), F: 0 }));
  const e = M.equilibrium(firms, { K: 1 + 400 * rnd(), eps: 0.3 + 2 * rnd() });
  assert.ok(e.exists && !e.atJump); checks++;
}

// Many identical firms: the gap between average supply and average demand is at most q-hat / (2N) and vanishes.
{
  const f = { c: 2, alpha: 4, F: 32 };
  for (const K of [20, 60, 120, 400]) {
    const dem = { K, eps: 1.5 };
    for (const N of [1, 2, 4, 8, 16, 64, 1000]) {
      const e = M.averageEquilibrium(f, N, dem);
      assert.ok(e.gap <= 16 / (2 * N) + 1e-12, 'gap bound');
      if (e.share >= 1) close(e.avgSupply, e.avgDemand, 1e-9, 'all produce');
      else { close(e.p, 6, 1e-12); assert.ok(e.producing >= 0 && e.producing <= N); }
      checks += 2;
    }
  }
  // Demand per firm 8 at p' = 6: half of the firms produce 16.
  const K8 = 8 * Math.pow(6, 1.5), e = M.averageEquilibrium(f, 10, { K: K8, eps: 1.5 });
  close(e.share, 0.5, 1e-12); assert.equal(e.producing, 5); close(e.gap, 0, 1e-9);
  checks += 3;
}

// Defaults of the page: firm 1 (c 2, alpha 4, F 8), firm 2 (c 2, alpha 4, F 32), D(p) = 300 p^-1.5.
{
  const f1 = { c: 2, alpha: 4, F: 8 }, f2 = { c: 2, alpha: 4, F: 32 };
  close(M.startPoint(f1).qHat, 8, 1e-12); close(M.startPoint(f1).pHat, 4, 1e-12);
  const e = M.equilibrium([f1, f2], { K: 300, eps: 1.5 });
  assert.equal(e.exists, false); close(e.gapPrice, 6, 1e-12);
  checks += 4;
}

console.log(`All ${checks} market-supply checks passed.`);
