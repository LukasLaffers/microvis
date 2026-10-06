// Checks the homogeneous/homothetic helpers.
// Run with:  node homogeneous-homothetic/test-model.cjs
const assert = require('node:assert/strict');
const TM = require('../shared/technology-model.js');
const M = require('./model.js');

const close = (a, b, tol = 1e-9, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const base = { shape: 'ces', delta: 0.4, rho: -1, k: 1.5, Fh: 'sshape', s: 3, c: 2, a: 2 };
const alphas = [0.5, 1, 1.5, 2, 3];

// homogeneous of degree k: phi(alpha zhat) = alpha^k dq on every ray, MRTS constant along rays
for (const k of [0.5, 1, 1.5]) {
  for (const shape of ['cd', 'ces']) {
    const S = M.tech({ ...base, cls: 'homogeneous', k, shape });
    for (const r of [0.4, 1, 2.5]) {
      for (const p of M.alongRay(r, S, 1, alphas)) {
        close(p.q, Math.pow(p.alpha, k), 1e-9, 'alpha^k');
        close(p.e, k, 1e-9, 'e = k');
        checks += 2;
      }
      close(M.mrtsDrift(r, S, 1), 0, 1e-9, 'MRTS along the ray');
      checks++;
    }
  }
}
// homothetic: the same function of alpha on every ray, MRTS constant along rays, e not constant
for (const Fh of ['sshape', 'log']) {
  const S = M.tech({ ...base, cls: 'homothetic', Fh });
  const rays = [0.4, 1, 2.5].map(r => M.alongRay(r, S, 1, alphas));
  for (let i = 0; i < alphas.length; i++) { close(rays[0][i].q, rays[1][i].q, 1e-9); close(rays[2][i].q, rays[1][i].q, 1e-9); checks += 2; }
  for (const r of [0.4, 1, 2.5]) { close(M.mrtsDrift(r, S, 1), 0, 1e-9); checks++; }
  assert.ok(Math.abs(rays[1][0].e - rays[1][4].e) > 0.05, 'e changes along the ray');
  checks++;
}
// neither: different along different rays, MRTS changes along a ray
{
  const S = M.tech({ ...base, cls: 'neither' });
  assert.ok(M.mrtsDrift(1, S, 1) > 0.1);
  const a = M.alongRay(0.4, S, 1, [2])[0].q, b = M.alongRay(2.5, S, 1, [2])[0].q;
  assert.ok(Math.abs(a - b) > 0.05);
  checks += 2;
}
// levels stay below the largest output; tangent segments have slope -MRTS and the right length
{
  const S = M.tech({ ...base, cls: 'homothetic', Fh: 'sshape', s: 2 });
  assert.deepEqual(M.levels(S, 1, 8), [1, 2, 3]);
  const [a, b] = M.tangentSegment([2, 3], 0.7, 1.2);
  close((b[1] - a[1]) / (b[0] - a[0]), -0.7); close(Math.hypot(b[0] - a[0], b[1] - a[1]), 1.2);
  // the tangent touches the isoquant: MRTS = -dz2/dz1 along it
  const p = TM.pointOnRay(1, 2, S), m = TM.mrts(p, S), h = 1e-6;
  const q = TM.pointOnRay(1 * Math.exp(h), 2, S), q2 = TM.pointOnRay(Math.exp(-h), 2, S);
  close(-(q[1] - q2[1]) / (q[0] - q2[0]), m, 1e-5);
  checks += 4;
}

console.log(`homogeneous-homothetic: all ${checks} checks passed`);
