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
    for (const k of [0.5, 0.8, 1, 1.3, 1.6]) {
      for (const A of [0.5, 1, 2.5]) {
        for (const rho of tech === 'ces' ? [-5, -1, -0.3, 0, 0.4, 0.9] : [0]) {
          const s = { tech, delta, k, A, rho };
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

          // 3. Homogeneity of degree k, and elasticity of scale = k (numerical).
          for (const [z1, z2] of [[1, 1], [0.7, 2.3], [3, 0.4]]) {
            for (const lam of [0.5, 2, 3]) {
              close(M.output(lam * z1, lam * z2, s), Math.pow(lam, k) * M.output(z1, z2, s), 1e-9, 'homog ' + label);
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
  const s = { tech: 'leontief', delta: 0.4, k: 1, A: 1, rho: 0 };
  const k = M.kinkMix(s);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k * 2, s), s), Infinity);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k / 2, s), s), 0);
  assert.equal(M.mrts(...M.pointOnIsoquant(1, k, s), s), null);
  checks += 3;
}

// Known values: Cobb-Douglas with delta = 0.5, k = 1, A = 1 at z = (1, 3).
{
  const s = { tech: 'cobb', delta: 0.5, k: 1, A: 1, rho: 0 };
  close(M.mrts(1, 3, s), 3);
  close(M.output(1, 3, s), Math.sqrt(3));
  assert.equal(M.returnsLabel(0.8), 'decreasing');
  assert.equal(M.returnsLabel(1), 'constant');
  assert.equal(M.returnsLabel(1.2), 'increasing');
  checks += 5;
}

// ---------- homothetic scale laws F(g(z)) ----------
const laws = [
  { law: 'power', A: 1.7, k: 1.3 },
  { law: 'power', A: 0.8, k: 0.6 },
  { law: 'ultra', qmax: 6, c: 3, kappa: 3 },
  { law: 'ultra', qmax: 4, c: 1.5, kappa: 1.6 },
  { law: 'threshold', A: 1, k: 0.7, x0: 1 },
  { law: 'threshold', A: 2, k: 1.2, x0: 0.5 }
];
const numD = (f, x, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h);

for (const L of laws) {
  for (const tech of techs) {
    for (const delta of [0.3, 0.5, 0.8]) {
      for (const rho of tech === 'ces' ? [-2, -0.5, 0.5] : [0]) {
        const s = { tech, delta, rho, ...L };
        const label = JSON.stringify(s);

        // F' against a numerical derivative; gLevel inverts F.
        for (const x of [0.7, 1.9, 3.4, 5]) {
          if (L.law === 'threshold' && Math.abs(x - L.x0) < 0.05) continue;
          close(M.Fprime(x, s), numD(t => M.F(t, s), x), 1e-5, 'Fprime ' + label);
          const f = M.F(x, s);
          if (f > 0) close(M.gLevel(f, s), x, 1e-9, 'gLevel ' + label);
          const ef = M.elasticityF(x, s);
          if (f > 0) close(ef, x * M.Fprime(x, s) / f, 1e-9, 'elasticityF ' + label);
          checks += 3;
        }

        // Isoquants and points on them produce q; unreachable q gives no isoquant.
        for (const q of [0.5, 1, 2, 3.5]) {
          const t = M.gLevel(q, s);
          if (!(t > 0)) { assert.equal(M.isoquant(q, s, 6).length, 0, label); checks++; continue; }
          for (const [z1, z2] of M.isoquant(q, s, 6)) { close(M.output(z1, z2, s), q, 1e-6, 'isoquant ' + label); checks++; }
          const [z1, z2] = M.pointOnIsoquant(q, 1.7, s);
          close(M.output(z1, z2, s), q, 1e-9, 'point ' + label);
          checks++;
        }
        if (L.law === 'ultra') { assert.equal(M.isoquant(L.qmax + 0.1, s, 6).length, 0); checks++; }

        for (const [z1, z2] of [[1.2, 1.1], [0.7, 2.3], [3, 0.9], [2.5, 2.8]]) {
          if (M.output(z1, z2, s) <= 0) continue;
          // Marginal products against finite differences (off the Leontief kink).
          const mp = M.marginalProducts(z1, z2, s);
          if (tech !== 'leontief') {
            close(mp[0], numD(t => M.output(t, z2, s), z1), 1e-5, 'phi1 ' + label);
            close(mp[1], numD(t => M.output(z1, t, s), z2), 1e-5, 'phi2 ' + label);
            // Homothetic: MRTS = phi1/phi2 and it is the same at every point of the ray.
            close(M.mrts(z1, z2, s), mp[0] / mp[1], 1e-6, 'mrts=phi1/phi2 ' + label);
            close(M.mrts(2.3 * z1, 2.3 * z2, s), M.mrts(z1, z2, s), 1e-9, 'mrts on ray ' + label);
            checks += 4;
          }
          // Elasticity of scale against d log phi(lambda z) / d log lambda.
          const h = 1e-6;
          const eNum = (Math.log(M.output((1 + h) * z1, (1 + h) * z2, s)) - Math.log(M.output((1 - h) * z1, (1 - h) * z2, s))) / (Math.log(1 + h) - Math.log(1 - h));
          close(M.elasticityOfScale(z1, z2, s), eNum, 1e-5, 'e(z) ' + label);
          // ... which also equals (z1 phi1 + z2 phi2) / phi (Euler).
          if (mp) close(M.elasticityOfScale(z1, z2, s), (z1 * mp[0] + z2 * mp[1]) / M.output(z1, z2, s), 1e-9, 'e Euler ' + label);
          // phi_11 against a finite difference of phi_1 (smooth technologies).
          if (tech !== 'leontief') close(M.mp1Slope(z1, z2, s), numD(t => M.marginalProducts(t, z2, s)[0], z1, 1e-5), 1e-3, 'phi11 ' + label);
          checks += 3;
        }

        // lambdaForOutput: the ray through zb reaches output q at that lambda.
        const zb = M.pointOnIsoquant(1, 0.8, s);
        for (const q of [0.5, 1, 2.5]) {
          const lam = M.lambdaForOutput(q, zb, s);
          if (Number.isFinite(lam)) { close(M.output(lam * zb[0], lam * zb[1], s), q, 1e-9, 'lambdaForOutput ' + label); checks++; }
        }

        // Where e = 1, output per unit of scale F(x)/x peaks (brute-force search).
        const xs = M.unitElasticityLevel(s);
        if (xs !== null) {
          close(M.elasticityF(xs, s), 1, 1e-9, 'unit elasticity ' + label);
          let best = 0, bestX = 0;
          for (let x = 0.01; x < 30; x += 0.0005) { const v = M.F(x, s) / x; if (v > best) { best = v; bestX = x; } }
          close(bestX, xs, 1e-3, 'max F(x)/x ' + label);
          checks += 2;
        }
      }
    }
  }
}

// The S-shaped law has increasing returns first and decreasing returns later along the same ray.
{
  const s = { tech: 'cobb', delta: 0.5, rho: 0, law: 'ultra', qmax: 6, c: 3, kappa: 3 };
  assert.ok(M.elasticityOfScale(1, 1, s) > 1 && M.elasticityOfScale(5, 5, s) < 1);
  assert.equal(M.scaleElasticity(s), null);
  checks += 2;
}

// Diminishing marginal product does not mean decreasing returns: alpha = beta = 0.6.
{
  const s = { tech: 'cobb', delta: 0.5, k: 1.2, A: 1, rho: 0 };
  assert.ok(M.mp1Slope(2, 1, s) < 0 && M.elasticityOfScale(2, 1, s) > 1);
  checks++;
}

// Parameters in the notation of the lecture notes reproduce phi.
for (const k of [0.6, 1, 1.4]) {
  for (const A of [0.7, 1, 2]) {
    for (const delta of [0.2, 0.5, 0.75]) {
      const base = { A, k, delta, rho: 0 };
      for (const [z1, z2] of [[1, 3], [2.2, 0.4], [0.5, 0.5]]) {
        let s = { ...base, tech: 'cobb' }, p = M.notesParams(s);
        close(M.output(z1, z2, s), A * Math.pow(z1, p.alpha) * Math.pow(z2, p.beta), 1e-9, 'notes CD');
        s = { ...base, tech: 'leontief' }; p = M.notesParams(s);
        close(M.output(z1, z2, s), Math.pow(Math.min(p.a * z1, p.b * z2), k), 1e-9, 'notes Leontief');
        s = { ...base, tech: 'linear' }; p = M.notesParams(s);
        close(M.output(z1, z2, s), Math.pow(p.a * z1 + p.b * z2, k), 1e-9, 'notes linear');
        checks += 3;
      }
    }
  }
}

// Exercise 2 of the notes: Cobb-Douglas at z = (1, 3) has MRTS = 3 alpha / beta and e = alpha + beta.
{
  const alpha = 0.3, beta = 0.6, s = { tech: 'cobb', A: 2, delta: alpha / (alpha + beta), k: alpha + beta, rho: 0 };
  close(M.mrts(1, 3, s), 3 * alpha / beta);
  close(M.elasticityOfScale(1, 3, s), alpha + beta);
  checks += 2;
}

console.log(`All ${checks} model checks passed.`);
