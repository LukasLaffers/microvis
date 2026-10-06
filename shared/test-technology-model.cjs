// Checks shared/technology-model.js against independent calculations.
// Run with:  node shared/test-technology-model.cjs
const assert = require('node:assert/strict');
const M = require('./technology-model.js');

const close = (a, b, tol = 1e-8, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

let seed = 2024;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function randomTech(homothetic = false) {
  if (!homothetic && rand() < 0.15) return { form: 'quasilinear', a: 0.5 + 3 * rand() };
  let rho = -3 + 3.8 * rand();
  if (Math.abs(rho) < 0.05) rho = -0.5;
  const S = { form: 'homothetic', g: ['cd', 'ces', 'mix'][Math.floor(3 * rand())], delta: 0.15 + 0.7 * rand(), rho, m: 0.2 + 0.8 * rand(), F: ['power', 'sshape', 'log'][Math.floor(3 * rand())] };
  Object.assign(S, { A: 0.5 + 1.5 * rand(), k: 0.3 + 1.4 * rand(), s: 1 + 4 * rand(), c: 0.5 + 3 * rand() });
  return S;
}
// Sometimes add the whiteboard's transformations: h(phi) and phi(z1^b1, z2^b2).
function withTransforms(S) {
  if (rand() < 0.5) return S;
  return { ...S, h: ['none', 'square', 'sqrt', 'log'][Math.floor(4 * rand())], b1: rand() < 0.5 ? 1 : 0.3 + 1.2 * rand(), b2: rand() < 0.5 ? 1 : 0.3 + 1.2 * rand() };
}
const fd = (f, x, h) => (f(x + h) - f(x - h)) / (2 * h);

// 1. Gradient and Hessian against finite differences.
for (let i = 0; i < 400; i++) {
  const S = withTransforms(randomTech()), z = [0.3 + 4 * rand(), 0.3 + 4 * rand()], h = 1e-5;
  const f = p => M.phi(p, S), d = M.grad(z, S);
  close(d[0], fd(t => f([t, z[1]]), z[0], h), 1e-6, 'phi_1');
  close(d[1], fd(t => f([z[0], t]), z[1], h), 1e-6, 'phi_2');
  const H = M.hessian(z, S), k = 1e-4;
  const g1 = p => M.grad(p, S)[0], g2 = p => M.grad(p, S)[1];
  close(H[0][0], fd(t => g1([t, z[1]]), z[0], k), 1e-4, 'phi_11');
  close(H[1][1], fd(t => g2([z[0], t]), z[1], k), 1e-4, 'phi_22');
  close(H[0][1], fd(t => g1([z[0], t]), z[1], k), 1e-4, 'phi_12');
  checks += 5;
}

// 2. Elasticity of scale: e = d log phi(alpha z)/d log alpha at alpha = 1 (the notes' definition).
for (let i = 0; i < 400; i++) {
  const S = withTransforms(randomTech()), z = [0.3 + 4 * rand(), 0.3 + 4 * rand()], h = 1e-5;
  const lp = a => Math.log(M.phi([a * z[0], a * z[1]], S));
  close(M.scaleElasticity(z, S), fd(lp, 1, h), 1e-6, 'e(z)');
  // Euler: e = (z1 phi_1 + z2 phi_2) / phi
  const d = M.grad(z, S);
  close(M.scaleElasticity(z, S), (z[0] * d[0] + z[1] * d[1]) / M.phi(z, S), 1e-9, 'Euler');
  checks += 2;
}
// homogeneous of degree k: e = k and phi(alpha z) = alpha^k phi(z)
for (let i = 0; i < 100; i++) {
  const S = { ...randomTech(true), F: 'power' }, z = [0.3 + 4 * rand(), 0.3 + 4 * rand()], a = 0.2 + 3 * rand();
  close(M.phi([a * z[0], a * z[1]], S), Math.pow(a, S.k) * M.phi(z, S), 1e-10, 'homogeneous');
  // phi_j is homogeneous of degree k - 1
  close(M.grad([a * z[0], a * z[1]], S)[0], Math.pow(a, S.k - 1) * M.grad(z, S)[0], 1e-9, 'phi_1 degree k-1');
  assert.ok(M.isHomogeneous(S)); close(M.degree(S), S.k);
  checks += 4;
}

// 3. Elasticity of substitution: the definition, d log(z2/z1) / d log MRTS along the isoquant.
for (let i = 0; i < 400; i++) {
  const S = withTransforms(randomTech()), z = [0.3 + 4 * rand(), 0.3 + 4 * rand()], q = M.phi(z, S), r = z[1] / z[0], h = 1e-4;
  const a = M.pointOnRay(r * Math.exp(-h), q, S), b = M.pointOnRay(r * Math.exp(h), q, S);
  const num = (2 * h) / (Math.log(M.mrts(b, S)) - Math.log(M.mrts(a, S)));
  close(M.sigma(z, S), num, 1e-5, `sigma ${S.form} ${S.g}`);
  checks++;
}
// closed forms
close(M.sigma([1, 2], { form: 'homothetic', g: 'cd', delta: 0.3, F: 'power', A: 1, k: 1 }), 1);
close(M.sigma([1, 2], { form: 'homothetic', g: 'ces', delta: 0.3, rho: -1, F: 'log', c: 1 }), 0.5);
checks += 2;

// 4. Homothetic: MRTS constant along rays; quasilinear: not.
for (let i = 0; i < 200; i++) {
  const S = randomTech(), z = [0.3 + 3 * rand(), 0.3 + 3 * rand()], a = 1.5 + 2 * rand();
  const same = Math.abs(M.mrts([a * z[0], a * z[1]], S) - M.mrts(z, S)) < 1e-9 * Math.max(1, M.mrts(z, S));
  assert.equal(same, M.isHomothetic(S), `homothetic ${S.form}`);
  checks++;
}

// 5. Points on rays and isoquants; F and its inverse.
for (let i = 0; i < 300; i++) {
  const S = withTransforms(randomTech()), r = Math.exp(-2 + 4 * rand());
  const qmax = M.maxOutput(S), q = Number.isFinite(qmax) ? qmax * (0.05 + 0.9 * rand()) : 0.3 + 4 * rand();
  const p = M.pointOnRay(r, q, S);
  close(M.phi(p, S), q, 1e-9, 'on the isoquant'); close(p[1] / p[0], r, 1e-12, 'on the ray');
  if (S.form === 'homothetic' && !M.isTransformed(S)) { const x = 0.2 + 5 * rand(); close(M.Finv(M.F(x, S), S), x, 1e-9, 'Finv'); close(M.Fprime(x, S), fd(t => M.F(t, S), x, 1e-6), 1e-6, "F'"); checks += 2; }
  checks += 2;
}
{
  const S = { form: 'homothetic', g: 'ces', delta: 0.5, rho: -1, F: 'sshape', s: 2 };
  assert.equal(M.pointOnRay(1, 4.5, S), null);   // beyond the largest output s^2 = 4
  for (const p of M.isoquant(2, S, 6)) close(M.phi(p, S), 2, 1e-9);
  // S-shaped: increasing returns below g = s, decreasing above
  assert.ok(M.scaleElasticity([1, 1], S) > 1 && M.scaleElasticity([3, 3], S) < 1);
  close(M.scaleElasticity([2, 2], S), 1, 1e-12);
  checks += 4;
}

// 6. The whiteboard (9 Oct): B = h(phi) keeps the MRTS and sigma but changes e; C = phi(f(z1), g(z2)) changes both.
for (let i = 0; i < 200; i++) {
  const base = { ...randomTech(true), g: 'ces', rho: [-1.5, -0.5, 0.5][i % 3] }, z = [0.3 + 4 * rand(), 0.3 + 4 * rand()];
  for (const h of ['square', 'sqrt', 'log']) {
    const B = { ...base, h };
    close(M.mrts(z, B), M.mrts(z, base), 1e-9, 'B: MRTS');
    close(M.sigma(z, B), M.sigma(z, base), 1e-6, 'B: sigma');
    // e_B = elasticity of h at phi times e: h(q) = q^2 doubles it
    if (h === 'square') close(M.scaleElasticity(z, B), 2 * M.scaleElasticity(z, base), 1e-9, 'B: e doubles');
    checks += 2 + (h === 'square' ? 1 : 0);
  }
  const C = { ...base, b1: 0.5, b2: 0.7 };   // both below 1: e falls everywhere
  assert.ok(Math.abs(M.sigma(z, C) - M.sigma(z, base)) > 1e-3, 'C: sigma changes');
  // e_C(z) = (b1 u1 phi_1(u) + b2 u2 phi_2(u)) / phi(u) at u = (z1^b1, z2^b2)
  const u = [Math.pow(z[0], 0.5), Math.pow(z[1], 0.7)], d = M.grad(u, base);
  close(M.scaleElasticity(z, C), (0.5 * u[0] * d[0] + 0.7 * u[1] * d[1]) / M.phi(u, base), 1e-9, 'C: e');
  // with constant returns k in the original, e_C is a weighted average of b1 k and b2 k: strictly below k here
  const Cp = { ...C, F: 'power' }, k = Cp.k;
  assert.ok(M.scaleElasticity(z, Cp) < 0.7 * k + 1e-12 && M.scaleElasticity(z, Cp) > 0.5 * k - 1e-12, 'C: e between b1 k and b2 k');
  assert.ok(!M.isHomothetic(C) && M.isHomothetic({ ...base, b1: 0.7, b2: 0.7 }));
  checks += 3;
}
// CES of powers in closed form: phi(z1^b, z2^b) with a CES base has sigma = 1/(1 - b rho)
{
  const C = { form: 'homothetic', g: 'ces', delta: 0.4, rho: -1, F: 'power', A: 1, k: 1, b1: 0.5, b2: 0.5 };
  close(M.sigma([1.3, 2.1], C), 1 / (1 + 0.5), 1e-6, 'CES of powers');
  close(M.scaleElasticity([1.3, 2.1], C), 0.5, 1e-9, 'degree b');
  checks += 2;
}

console.log(`technology-model: all ${checks} checks passed`);
