// Checks the MRTS model against independent calculations.
// Run with:  node building-the-mrts/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol = 1e-8, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

let seed = 777;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const randomTech = kind => {
  switch (kind) {
    case 'cd': return { tech: 'cd', A: 0.5 + 2 * rand(), alpha: 0.1 + 1.2 * rand(), beta: 0.1 + 1.2 * rand() };
    case 'linear': return { tech: 'linear', a: 0.2 + 2.5 * rand(), b: 0.2 + 2.5 * rand() };
    case 'leontief': return { tech: 'leontief', a: 0.2 + 2.5 * rand(), b: 0.2 + 2.5 * rand() };
    case 'ces': {
      let rho = -3 + 3.8 * rand();
      if (Math.abs(rho) < 0.05) rho = 0.3;
      return { tech: 'ces', A: 0.5 + 2 * rand(), delta: 0.1 + 0.8 * rand(), rho };
    }
  }
};

// 1. Marginal products against central differences; MRTS = phi_1 / phi_2.
for (const kind of ['cd', 'linear', 'ces']) {
  for (let i = 0; i < 200; i++) {
    const T = randomTech(kind), z = [0.3 + 5 * rand(), 0.3 + 5 * rand()], h = 1e-6;
    const g = M.mp(z, T);
    close(g[0], (M.phi([z[0] + h, z[1]], T) - M.phi([z[0] - h, z[1]], T)) / (2 * h), 1e-6, `${kind} phi_1`);
    close(g[1], (M.phi([z[0], z[1] + h], T) - M.phi([z[0], z[1] - h], T)) / (2 * h), 1e-6, `${kind} phi_2`);
    close(M.mrts(z, T), g[0] / g[1], 1e-12);
    checks += 3;
  }
}
// Cobb-Douglas against the textbook closed form (used here only as an independent check).
for (let i = 0; i < 100; i++) {
  const T = randomTech('cd'), z = [0.3 + 5 * rand(), 0.3 + 5 * rand()];
  close(M.mrts(z, T), (T.alpha * z[1]) / (T.beta * z[0]), 1e-12, 'CD MRTS');
  checks++;
}
// Leontief: arms and corner
{
  const T = { tech: 'leontief', a: 2, b: 1 };
  assert.deepEqual(M.mp([1, 5], T), [2, 0]); assert.equal(M.mrts([1, 5], T), Infinity); assert.equal(M.regime([1, 5], T), 'z1');
  assert.deepEqual(M.mp([3, 2], T), [0, 1]); assert.equal(M.mrts([3, 2], T), 0); assert.equal(M.regime([3, 2], T), 'z2');
  assert.equal(M.mp([1, 2], T), null); assert.ok(Number.isNaN(M.mrts([1, 2], T))); assert.equal(M.regime([1, 2], T), 'corner');
  checks += 9;
}

// 2. Points on rays and the isoquant function.
for (const kind of ['cd', 'linear', 'leontief', 'ces']) {
  for (let i = 0; i < 200; i++) {
    const T = randomTech(kind), q = 0.5 + 4 * rand(), r = Math.exp(-3 + 6 * rand());
    const z = M.pointOnRay(r, q, T);
    close(M.phi(z, T), q, 1e-10, `${kind} on the isoquant`);
    close(z[1] / z[0], r, 1e-12, `${kind} on the ray`);
    // isoquantZ2 gives the least z2: phi reaches q there and not a bit below
    const z2 = M.isoquantZ2(z[0], q, T);
    if (z2 !== null && z2 > 0) {
      assert.ok(M.phi([z[0], z2], T) >= q * (1 - 1e-9), `${kind} reaches q`);
      assert.ok(M.phi([z[0], z2 * (1 - 1e-6)], T) < q, `${kind} least z2`);
      checks += 2;
    }
    if (kind !== 'leontief') { close(z2, z[1], 1e-9, `${kind} isoquantZ2`); checks++; }
    checks += 2;
  }
}
// the isoquant polyline lies on phi = q
for (const kind of ['cd', 'linear', 'leontief', 'ces']) {
  const T = randomTech(kind), q = 2;
  for (const p of M.isoquant(q, T, 8, 200)) {
    if (p[1] === 0 && kind !== 'cd') { assert.ok(M.phi(p, T) >= q * (1 - 1e-9)); continue; }
    close(M.phi(p, T), q, 1e-9, `${kind} isoquant point`);
    checks++;
  }
}

// 3. MRTS is the slope of the isoquant: -dz2/dz1 by finite differences of isoquantZ2.
for (const kind of ['cd', 'linear', 'ces']) {
  for (let i = 0; i < 200; i++) {
    const T = randomTech(kind), q = 0.5 + 3 * rand(), r = Math.exp(-1.5 + 3 * rand()), z = M.pointOnRay(r, q, T), h = 1e-6 * z[0];
    const a = M.isoquantZ2(z[0] - h, q, T), b = M.isoquantZ2(z[0] + h, q, T);
    if (a === null || b === null || b <= 0) continue;
    close(-(b - a) / (2 * h), M.mrts(z, T), 1e-5, `${kind} slope of the isoquant`);
    checks++;
  }
}

// 4. A finite step: the exact amount given up approaches MRTS dz1 as dz1 shrinks (error of order dz1^2).
{
  const T = { tech: 'cd', A: 1, alpha: 0.4, beta: 0.6 }, q = 2, z = M.pointOnRay(1, q, T);
  let prev = Infinity;
  for (const dz of [0.8, 0.4, 0.2, 0.1, 0.05]) {
    const s = M.step(z, dz, q, T), err = Math.abs(s.giveUp - s.linear);
    assert.ok(err < prev, 'error shrinks'); prev = err;
    close(M.phi([z[0] + dz, s.z2new], T), q, 1e-10);
    checks += 2;
  }
  // convex isoquant: the linear estimate overstates what can be given up
  const s = M.step(z, 0.5, q, T);
  assert.ok(s.linear > s.giveUp && s.giveUp > 0);
  // linear technology: exact
  const L = { tech: 'linear', a: 1, b: 2 }, zl = M.pointOnRay(1, 3, L), sl = M.step(zl, 0.3, 3, L);
  close(sl.giveUp, sl.linear, 1e-12);
  checks += 2;
}

// 5. Diminishing MRTS along the isoquant, and the notes' formula for its derivative.
//    Exact for CES: MRTS = delta/(1-delta) (z2/z1)^(1-rho), so along the isoquant
//    dMRTS/dz1 = -(1-rho) MRTS/z1 - (1-rho) MRTS^2/z2 (the CD case is rho = 0 with delta/(1-delta) = alpha/beta).
for (const kind of ['cd', 'ces']) {
  for (let i = 0; i < 100; i++) {
    const T = randomTech(kind), q = 0.5 + 3 * rand(), z = M.pointOnRay(Math.exp(-1.5 + 3 * rand()), q, T);
    const m = M.mrts(z, T), c = kind === 'cd' ? 1 : 1 - T.rho, exact = -c * m / z[0] - c * m * m / z[1];
    const d = M.dMrtsAlong(z, T);
    assert.ok(d <= 1e-9, `${kind} diminishing MRTS ${d}`);
    close(d, exact, 1e-10, `${kind} along the isoquant`);
    close(M.dMrtsFormula(z, T), exact, 1e-5, `${kind} notes' formula`);
    // and by moving a little along the isoquant
    const h = 1e-5 * z[0], a = [z[0] - h, M.isoquantZ2(z[0] - h, q, T)], b = [z[0] + h, M.isoquantZ2(z[0] + h, q, T)];
    close((M.mrts(b, T) - M.mrts(a, T)) / (2 * h), exact, 1e-4, `${kind} moving along the isoquant`);
    checks += 4;
  }
}
{
  const T = { tech: 'cd', A: 1, alpha: 0.4, beta: 0.6 }, z = M.pointOnRay(1.5, 2, T), k = T.alpha / T.beta;
  // CD along the isoquant: dMRTS/dz1 = -(alpha/beta) z2/z1^2 (1 + alpha/beta)
  close(M.dMrtsAlong(z, T), -k * z[1] / (z[0] * z[0]) * (1 + k), 1e-6, 'CD dMRTS');
  checks++;
}

// 6. Elasticity of substitution: the closed forms against dlog(z2/z1)/dlog MRTS.
for (const kind of ['cd', 'ces']) {
  for (let i = 0; i < 100; i++) {
    const T = randomTech(kind), r = Math.exp(-1.5 + 3 * rand());
    close(M.sigmaNumeric(r, 2, T), M.sigma(T), 1e-5, `${kind} sigma`);
    checks++;
  }
}

console.log(`building-the-mrts: all ${checks} checks passed`);
