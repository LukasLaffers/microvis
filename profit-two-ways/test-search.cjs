// One step = two steps: the numerical search for (PM) against the closed forms of the shared model.
// Run with:  node profit-two-ways/test-search.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const { maximise } = require('./search.js');

let checks = 0;
const rel = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));

// The search finds the maximum of a known function, including on a ridge.
{
  const r = maximise((a, b) => -((a - 1.234) ** 2) - 3 * (b - 0.777) ** 2, 4);
  assert.ok(Math.abs(r.z[0] - 1.234) < 1e-6 && Math.abs(r.z[1] - 0.777) < 1e-6);
  const ridge = maximise((a, b) => Math.min(a / 0.3, b / 0.7) - 0.4 * (a + b) - 0.01 * (a + b) ** 2, 30);
  // On the ridge z = t (0.3, 0.7) the value is 0.6 t - 0.01 t^2, highest at t = 30.
  assert.ok(Math.abs(ridge.z[0] - 9) < 1e-3 && Math.abs(ridge.z[1] - 21) < 1e-3, `ridge ${ridge.z}`);
  checks += 2;
}

// Deterministic pseudo-random parameters across the ranges the page's controls allow.
let seed = 2024;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = arr => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi, step) => Math.round((lo + (hi - lo) * rand()) / step) * step;

let compared = 0;
for (let n = 0; n < 160; n++) {
  const tech = pick(['cobb', 'ces', 'linear', 'leontief']);
  const profile = pick(['ushape', 'homog']);
  const s = {
    tech, delta: between(0.1, 0.9, 0.01), rho: tech === 'ces' ? between(-5, 0.9, 0.05) : 0, profile,
    A: between(0.5, 3, 0.05), k: between(0.3, 0.95, 0.05), a: between(0.5, 3, 0.05), m: between(0.2, 3, 0.05)
  };
  if (tech === 'ces' && Math.abs(s.rho) < 1e-9) s.rho = 0.05;
  const w = [between(0.2, 5, 0.05), between(0.2, 5, 0.05)], p = between(0.5, 20, 0.05);
  const S = FM.supply(w, p, s), Pi = FM.profit(w, p, s), D = FM.uncondDemand(w, p, s);
  if (!D || !Number.isFinite(Pi)) continue;
  if (S.kind === 'indifferent') continue; // two optimal outputs; covered separately below
  const zmax = Math.max(2, 1.4 * Math.max(D[0], D[1]));
  const r = maximise((a, b) => FM.profitAt(a, b, w, p, s), zmax);
  const label = JSON.stringify({ s, w, p });
  // Same profit to 3 significant digits (relative to the scale of revenue).
  const scale = Math.max(1, Math.abs(Pi), p * (S.q || 0) * 1e-3);
  assert.ok(Math.abs(r.value - Pi) / scale < 1e-3, `profit ${r.value} vs ${Pi} ${label}`);
  // Same output.
  const q1 = FM.phi(r.z[0], r.z[1], s);
  assert.ok(rel(q1, S.q) < 1e-3 || Math.abs(q1 - S.q) < 1e-3, `output ${q1} vs ${S.q} ${label}`);
  // Same inputs, unless many bundles are optimal (linear with w1/delta = w2/(1-delta)).
  if (FM.unitDemand(w, s).kind !== 'multiple') {
    assert.ok(Math.abs(r.z[0] - D[0]) <= 1e-3 * Math.max(1, D[0], D[1]) && Math.abs(r.z[1] - D[1]) <= 1e-3 * Math.max(1, D[0], D[1]), `inputs ${r.z} vs ${D} ${label}`);
  }
  compared++;
  checks += 3;
}
assert.ok(compared > 120, `only ${compared} cases compared`);

// The defaults of the page: Cobb-Douglas, 'ushape' a = 2, m = 1, w = (1, 1), p = 8.
{
  const s = { tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 };
  const D = FM.uncondDemand([1, 1], 8, s), r = maximise((a, b) => FM.profitAt(a, b, [1, 1], 8, s), 1.4 * D[0]);
  assert.ok(Math.abs(r.z[0] - 8.131) < 2e-3 && Math.abs(r.z[1] - 8.131) < 2e-3 && Math.abs(r.value - 13.595) < 1e-3);
  // Below the shutdown price both approaches say: produce nothing.
  const low = maximise((a, b) => FM.profitAt(a, b, [1, 1], 3, s), 5);
  assert.ok(low.value === 0 && low.z[0] === 0 && low.z[1] === 0 && FM.profit([1, 1], 3, s) === 0);
  checks += 2;
}

console.log(`All ${checks} one-step search checks passed (${compared} random cases).`);
