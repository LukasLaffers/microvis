// Checks the elasticity-of-scale-and-substitution helpers.
// Run with:  node scale-and-substitution/test-model.cjs
const assert = require('node:assert/strict');
const TM = require('../shared/technology-model.js');
const M = require('./model.js');

const close = (a, b, tol = 1e-9, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;
const st = (preset, more = {}) => ({ ...M.PRESETS[preset], tr: 'none', h: 'square', b1: 0.5, b2: 1.2, ...more });

// The constant cases: e and sigma are the same everywhere.
for (const [name, e, s] of [['cd', 1.2, 1], ['ces', 0.8, 0.5]]) {
  const { A } = M.techs(st(name));
  for (const z of [[0.5, 3], [2, 2], [4, 1], [5, 5]]) { close(TM.scaleElasticity(z, A), e); close(TM.sigma(z, A), s); checks += 2; }
  // Cobb-Douglas preset is z1^alpha z2^beta with alpha + beta = k
  if (name === 'cd') { close(TM.phi([2, 3], A), Math.pow(2, 0.4 * 1.2) * Math.pow(3, 0.6 * 1.2), 1e-12); checks++; }
}

// The default: both vary. e changes along a ray (and not along an isoquant); sigma along an isoquant (not along a ray).
{
  const { A } = M.techs(st('vary')), z = [2, 2.5];
  const eRay = M.eAlongRay(z, A, [0.5, 1, 2]).map(p => p[1]);
  assert.ok(eRay[0] - eRay[2] > 0.3, 'e changes along the ray');
  const iso = M.sigmaAlongIsoquant(z, A, [0.2, 1, 5]);
  assert.ok(Math.max(...iso.map(p => p.sigma)) - Math.min(...iso.map(p => p.sigma)) > 0.2, 'sigma changes along the isoquant');
  // homothetic: e is constant along the isoquant, sigma constant along the ray
  for (const p of iso) close(TM.scaleElasticity(p.p, A), TM.scaleElasticity(z, A), 1e-7);
  for (const a of [0.5, 2]) close(TM.sigma([a * z[0], a * z[1]], A), TM.sigma(z, A), 1e-9);
  // the points really lie on the isoquant through z
  for (const p of iso) close(TM.phi(p.p, A), TM.phi(z, A), 1e-9);
  checks += 2 + iso.length * 2 + 2;
}

// The whiteboard transformations
{
  const z = [1.7, 2.6];
  const { A, T: B } = M.techs(st('vary', { tr: 'B', h: 'square' }));
  close(TM.sigma(z, B), TM.sigma(z, A), 1e-6, 'B keeps sigma'); close(TM.mrts(z, B), TM.mrts(z, A), 1e-12, 'B keeps MRTS');
  close(TM.scaleElasticity(z, B), 2 * TM.scaleElasticity(z, A), 1e-9, 'B doubles e (h = q^2)');
  const { T: C } = M.techs(st('ces', { tr: 'C', b1: 0.5, b2: 1.2 }));
  const { A: A2 } = M.techs(st('ces'));
  assert.ok(Math.abs(TM.sigma(z, C) - TM.sigma(z, A2)) > 0.01 && Math.abs(TM.scaleElasticity(z, C) - TM.scaleElasticity(z, A2)) > 0.01);
  checks += 4;
}

// The shading grid agrees with pointwise values
{
  const { A } = M.techs(st('vary')), G = M.grid(A, 6, 10, 'sigma');
  close(G.z[3][7], TM.sigma([G.xs[7], G.xs[3]], A));
  checks++;
}

console.log(`scale-and-substitution: all ${checks} checks passed`);
