// Checks the input-requirement-set model against independent calculations.
// Run with:  node input-requirement-sets/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

// Deterministic pseudo-random numbers, so failures are reproducible.
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// 1. The activity LP against brute force over (t1, t2, t3) on a fine grid.
{
  const acts = M.PRESETS.exercise.acts;
  const brute = (z1, z2) => {
    let best = 0;
    const N = 60, tmax = 6;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const t1 = tmax * i / N, t2 = tmax * j / N;
      // Given t1, t2 the best t3 uses up whatever is left.
      const r1 = z1 - t1 * acts[0][0] - t2 * acts[1][0], r2 = z2 - t1 * acts[0][1] - t2 * acts[1][1];
      if (r1 < -1e-12 || r2 < -1e-12) continue;
      const t3 = Math.min(r1 / acts[2][0], r2 / acts[2][1]);
      best = Math.max(best, t1 + t2 + t3);
    }
    return best;
  };
  for (const [z1, z2] of [[0.25, 0.5], [0.6, 0.6], [1, 0.3], [0.3, 1], [0.45, 0.25]]) {
    const lp = M.activityOutput(z1, z2, acts, true), bf = brute(z1, z2);
    assert.ok(lp >= bf - 1e-9 && lp - bf < 0.05, `LP ${lp} vs brute force ${bf}`);
    checks++;
  }
}

// 2. Exercise 1 of the notes.
{
  const ex = M.PRESETS.exercise;
  // (i) each activity produces exactly one unit; z^2 lies below the chord z^1 z^3, so it is on the isoquant.
  for (const a of ex.acts) { close(M.output('exercise', a[0], a[1]), 1); checks++; }
  // (ii) under constant returns, 2 z^j produces 2.
  for (const a of ex.acts) { close(M.output('exercise', 2 * a[0], 2 * a[1]), 2); checks++; }
  // (iii) z^4 = (0.25, 0.5) is in Z(1) but produces more than 1 when activities can be mixed: not on I(1).
  const z4 = M.output('exercise', 0.25, 0.5, { mix: true });
  close(z4, 0.05 / 0.22 + (1 - 0.4 * 0.05 / 0.22), 1e-9, 'phi(z4)'); // t2 = 0.05/0.22, t1 = 1 - 0.4 t2
  assert.ok(z4 > 1);
  // Without mixing, z^4 is only as good as z^1 (it uses more z1 than z^1 and the same z2).
  close(M.output('exercise', 0.25, 0.5, { mix: false }), 1);
  checks += 3;
}

// 3. The exact frontier polyline lies on the isoquant: phi = q along every segment.
for (const name of ['activities', 'exercise']) {
  const p = M.PRESETS[name];
  for (const mix of [true, false]) {
    for (const q of [p.q, 2 * p.q]) {
      const line = M.activityFrontier(p.acts, mix, q, 3 * q * p.box);
      for (let k = 0; k + 1 < line.length; k++) {
        for (const l of [0, 0.25, 0.5, 0.75, 1]) {
          const z = [line[k][0] + l * (line[k + 1][0] - line[k][0]), line[k][1] + l * (line[k + 1][1] - line[k][1])];
          close(M.output(name, z[0], z[1], { mix }), q, 1e-9, `frontier ${name} mix=${mix}`);
          checks++;
        }
      }
    }
  }
}

// 4. The stated properties of each preset hold (or fail) on random samples.
for (const [name, p] of Object.entries(M.PRESETS)) {
  const opts = { mix: true }, q = p.q, box = p.box;
  const sample = () => [box * rand(), box * rand()];
  const inside = [];
  while (inside.length < 400) { const z = sample(); if (M.inSet(name, q, z, opts)) inside.push(z); }

  // Free disposal: adding inputs never leaves the set.
  let fdFails = 0;
  for (const z of inside) {
    const w = [z[0] + (box - z[0]) * rand(), z[1] + (box - z[1]) * rand()];
    if (!M.inSet(name, q, w, opts)) fdFails++;
  }
  assert.equal(fdFails === 0, p.props.freeDisposal, `free disposal ${name}`);

  // Convexity: midpoints of points in the set stay in the set.
  let cvFails = 0;
  for (let k = 0; k + 1 < inside.length; k += 2) {
    const [a, b] = [inside[k], inside[k + 1]], l = rand();
    if (!M.inSet(name, q, [l * a[0] + (1 - l) * b[0], l * a[1] + (1 - l) * b[1]], opts)) cvFails++;
  }
  // The non-convex preset fails only near its inward kink; test that explicitly.
  if (name === 'nonconvex') cvFails += M.segmentInSet(name, q, p.z, p.zp, opts).holds ? 0 : 1;
  assert.equal(cvFails === 0, p.props.convex, `convexity ${name}`);

  // Constant returns: phi(t z) = t phi(z).
  let crs = true;
  for (const z of inside.slice(0, 50)) for (const t of [0.5, 2, 3]) if (Math.abs(M.scaleRatio(name, z, t, opts) - t) > 1e-9) crs = false;
  assert.equal(crs, p.props.crs, `constant returns ${name}`);
  checks += 3;
}

// 5. The checks used by the page agree with the presets' default points.
{
  // Congestion: free disposal fails at z, with a witness outside Z(q).
  const c = M.PRESETS.congestion, r = M.freeDisposalAt('congestion', c.q, c.z, c.box);
  assert.equal(r.holds, false);
  assert.ok(M.output('congestion', r.witness[0], r.witness[1]) < c.q);
  // Non-convex: the default segment leaves the set, and its midpoint is outside.
  const n = M.PRESETS.nonconvex, s = M.segmentInSet('nonconvex', n.q, n.z, n.zp);
  assert.equal(s.holds, false);
  assert.ok(M.output('nonconvex', (n.z[0] + n.zp[0]) / 2, (n.z[1] + n.zp[1]) / 2) < n.q);
  // Smooth: both checks pass at the defaults.
  const m = M.PRESETS.smooth;
  assert.ok(M.freeDisposalAt('smooth', m.q, m.z, m.box).holds && M.segmentInSet('smooth', m.q, m.z, m.zp).holds);
  // Default points start inside Z(q) for every preset.
  for (const [name, p] of Object.entries(M.PRESETS)) assert.ok(M.inSet(name, p.q, p.z, {}) && M.inSet(name, p.q, p.zp, {}), name);
  checks += 6;
}

console.log(`All ${checks} model checks passed.`);
