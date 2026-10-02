// Checks the production model against independent numerical calculations.
// Run with:  node production-explorer/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);

let checks = 0;
const techs = ['cobb', 'ces', 'linear', 'leontief'];
const zmax = 6;

for (const tech of techs) {
  for (const delta of [0.1, 0.3, 0.5, 0.8, 0.9]) {
    for (const nu of [0.5, 0.8, 1, 1.3, 1.6]) {
      for (const A of [0.5, 1, 2.5]) {
        for (const rho of tech === 'ces' ? [-5, -1, -0.3, 0, 0.4, 0.9] : [0]) {
          const s = { tech, delta, nu, A, rho };
          const label = JSON.stringify(s);

          // 1. Every isoquant point produces exactly q.
          for (const q of [0.5, 1, 2, 4]) {
            for (const [z1, z2] of M.isoquant(q, s, zmax)) {
              assert.ok(z1 >= 0 && z2 >= 0 && z1 <= zmax + 1e-9 && z2 <= zmax + 1e-9, label);
              close(M.output(z1, z2, s), q, 1e-6, 'isoquant ' + label);
              checks++;
            }
          }

          // 2. pointOnIsoquant lies on the isoquant with the requested mix.
          for (const r of [0.2, 1, 3.7]) {
            const [z1, z2] = M.pointOnIsoquant(2, r, s);
            close(M.output(z1, z2, s), 2, 1e-9, 'point ' + label);
            close(z2 / z1, r, 1e-12, 'mix ' + label);
            checks++;
          }

          // 3. Homogeneity of degree nu, and elasticity of scale = nu (numerical).
          for (const [z1, z2] of [[1, 1], [0.7, 2.3], [3, 0.4]]) {
            for (const lam of [0.5, 2, 3]) {
              close(M.output(lam * z1, lam * z2, s), Math.pow(lam, nu) * M.output(z1, z2, s), 1e-9, 'homog ' + label);
            }
            const h = 1e-6;
            const e = (Math.log(M.output((1 + h) * z1, (1 + h) * z2, s)) - Math.log(M.output((1 - h) * z1, (1 - h) * z2, s))) / (Math.log(1 + h) - Math.log(1 - h));
            close(e, M.scaleElasticity(s), 1e-5, 'scale elasticity ' + label);
            checks++;
          }

          // 4. MRTS against numerical marginal products (smooth technologies, off the kink).
          if (tech !== 'leontief') {
            for (const [z1, z2] of [[1, 1], [0.7, 2.3], [3, 0.4]]) {
              const h = 1e-6;
              const f1 = (M.output(z1 + h, z2, s) - M.output(z1 - h, z2, s)) / (2 * h);
              const f2 = (M.output(z1, z2 + h, s) - M.output(z1, z2 - h, s)) / (2 * h);
              close(M.mrts(z1, z2, s), f1 / f2, 1e-5, 'mrts ' + label);
              checks++;
            }
          }

          // 5. Elasticity of substitution: d log(z2/z1) / d log MRTS along an isoquant.
          if (tech === 'cobb' || tech === 'ces') {
            const r1 = 1.5, r2 = 1.5 * 1.001;
            const [a1, a2] = M.pointOnIsoquant(2, r1, s), [b1, b2] = M.pointOnIsoquant(2, r2, s);
            const num = (Math.log(r2) - Math.log(r1)) / (Math.log(M.mrts(b1, b2, s)) - Math.log(M.mrts(a1, a2, s)));
            close(num, M.sigma(s), 1e-6, 'sigma ' + label);
            checks++;
          }
        }
      }
    }
  }
}

// Leontief: MRTS is infinite above the kink, zero below it, undefined at it.
{
  const s = { tech: 'leontief', delta: 0.4, nu: 1, A: 1, rho: 0 };
  const k = M.kinkMix(s);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k * 2, s), s), Infinity);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k / 2, s), s), 0);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k, s), s), null);
  checks += 3;
}

// Known values: Cobb-Douglas with delta = 0.5, nu = 1, A = 1 at z = (1, 3).
{
  const s = { tech: 'cobb', delta: 0.5, nu: 1, A: 1, rho: 0 };
  close(M.mrts(1, 3, s), 3);
  close(M.output(1, 3, s), Math.sqrt(3));
  assert.equal(M.returnsLabel(0.8), 'decreasing');
  assert.equal(M.returnsLabel(1), 'constant');
  assert.equal(M.returnsLabel(1.2), 'increasing');
  checks += 5;
}

console.log(`All ${checks} model checks passed.`);
