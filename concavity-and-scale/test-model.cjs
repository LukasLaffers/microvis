// Checks the concavity-and-scale model against independent calculations.
// Run with:  node concavity-and-scale/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol = 1e-9, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

let seed = 4242;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const L = 8;
const CE = { k1: 1, k2: 0.5 };

// 1. phi against closed forms and against bisection.
{
  for (let i = 0; i < 200; i++) {
    const z = [L * rand(), L * rand()];
    // k1 = 1, k2 = 1/2: q^2 - z1 q - z2 = 0.
    close(M.phi(z, CE), (z[0] + Math.sqrt(z[0] * z[0] + 4 * z[1])) / 2, 1e-12, 'closed form (1, 1/2)');
    // homothetic: (z1 + z2)^k
    const k = 0.3 + 0.9 * rand();
    close(M.phi(z, { k1: k, k2: k }), Math.pow(z[0] + z[1], k), 1e-12, 'homothetic');
    // general: the isoquant equation holds, and bisection on q agrees
    const P = { k1: 0.3 + 1.2 * rand(), k2: 0.3 + 1.2 * rand() }, q = M.phi(z, P);
    close(z[0] / Math.pow(q, 1 / P.k1) + z[1] / Math.pow(q, 1 / P.k2), 1, 1e-12, 'isoquant equation');
    let lo = 1e-9, hi = 1e9;
    for (let it = 0; it < 300; it++) { const m = Math.sqrt(lo * hi); if (z[0] / Math.pow(m, 1 / P.k1) + z[1] / Math.pow(m, 1 / P.k2) > 1) lo = m; else hi = m; }
    close(q, Math.sqrt(lo * hi), 1e-10, 'bisection');
    checks += 4;
  }
  // on the axes
  close(M.phi([5, 0], { k1: 0.7, k2: 0.4 }), Math.pow(5, 0.7)); close(M.phi([0, 5], { k1: 0.7, k2: 0.4 }), Math.pow(5, 0.4));
  assert.equal(M.phi([0, 0], CE), 0);
  checks += 3;
}

// 2. Gradient, Hessian and elasticity of scale against finite differences.
{
  const h = 1e-4;
  for (let i = 0; i < 100; i++) {
    const z = [0.5 + 7 * rand(), 0.5 + 7 * rand()], P = { k1: 0.3 + 1.2 * rand(), k2: 0.3 + 1.2 * rand() };
    const f = p => M.phi(p, P), d = M.derivatives(z, P);
    const fd1 = (f([z[0] + h, z[1]]) - f([z[0] - h, z[1]])) / (2 * h), fd2 = (f([z[0], z[1] + h]) - f([z[0], z[1] - h])) / (2 * h);
    close(d.grad[0], fd1, 1e-6, 'phi_1'); close(d.grad[1], fd2, 1e-6, 'phi_2');
    const H = 1e-3;
    const f11 = (f([z[0] + H, z[1]]) - 2 * f(z) + f([z[0] - H, z[1]])) / (H * H);
    const f22 = (f([z[0], z[1] + H]) - 2 * f(z) + f([z[0], z[1] - H])) / (H * H);
    const f12 = (f([z[0] + H, z[1] + H]) - f([z[0] + H, z[1] - H]) - f([z[0] - H, z[1] + H]) + f([z[0] - H, z[1] - H])) / (4 * H * H);
    close(d.hess[0][0], f11, 1e-4, 'phi_11'); close(d.hess[1][1], f22, 1e-4, 'phi_22'); close(d.hess[0][1], f12, 1e-4, 'phi_12');
    // e(z) = d ln phi(alpha z) / d ln alpha at alpha = 1, as defined in the notes
    const e = (Math.log(f([z[0] * (1 + h), z[1] * (1 + h)])) - Math.log(f([z[0] * (1 - h), z[1] * (1 - h)]))) / (Math.log(1 + h) - Math.log(1 - h));
    close(M.scaleElasticity(z, P), e, 1e-6, 'e(z)');
    // e(z) lies between k1 and k2; Euler: e = (z1 phi_1 + z2 phi_2) / phi
    assert.ok(M.scaleElasticity(z, P) >= Math.min(P.k1, P.k2) - 1e-12 && M.scaleElasticity(z, P) <= Math.max(P.k1, P.k2) + 1e-12);
    close(M.scaleElasticity(z, P), (z[0] * d.grad[0] + z[1] * d.grad[1]) / d.q, 1e-10, 'Euler');
    // MRTS21 = phi_1 / phi_2
    close(M.mrts21(z, P), d.grad[0] / d.grad[1], 1e-10, 'MRTS');
    checks += 9;
  }
}

// 3. The three conditions of Exercise 3, checked by brute force on random bundles.
{
  for (const P of [CE, { k1: 0.9, k2: 0.4 }, { k1: 0.5, k2: 1 }, { k1: 0.7, k2: 0.7 }]) {
    for (let i = 0; i < 300; i++) {
      const z = [L * rand(), L * rand()], zp = [L * rand(), L * rand()], l = rand();
      const zl = [l * z[0] + (1 - l) * zp[0], l * z[1] + (1 - l) * zp[1]];
      // quasi-concave: phi(z^lambda) >= min(phi(z), phi(z'))
      assert.ok(M.phi(zl, P) >= Math.min(M.phi(z, P), M.phi(zp, P)) - 1e-9, 'quasi-concave');
      // no increasing returns to scale: phi(alpha z) <= alpha phi(z) for alpha > 1
      const a = 1 + 3 * rand();
      assert.ok(M.phi([a * z[0], a * z[1]], P) <= a * M.phi(z, P) + 1e-9, 'NIRS');
      checks += 2;
    }
  }
  // homothetic: MRTS constant along rays exactly when k1 = k2
  close(M.mrts21([1, 2], { k1: 0.7, k2: 0.7 }), M.mrts21([3, 6], { k1: 0.7, k2: 0.7 }));
  assert.ok(Math.abs(M.mrts21([1, 2], CE) - M.mrts21([3, 6], CE)) > 0.1);
  checks += 2;
}

// 4. Concavity: fails for the counterexample, holds when homothetic with k <= 1, fails with increasing returns.
{
  // the classic pair: z on the z1 axis, z' on the z2 axis
  const z = [8, 0], zp = [0, 8], mid = M.phi([4, 4], CE), chord = (M.phi(z, CE) + M.phi(zp, CE)) / 2;
  close(chord - mid, (8 + Math.sqrt(8)) / 2 - (4 + Math.sqrt(32)) / 2, 1e-12, 'gap on the axes');
  assert.ok(chord - mid > 0.5);
  const g = M.maxGap(z, zp, CE);
  // brute force over lambda
  let bf = 0; for (let i = 0; i <= 20000; i++) { const l = i / 20000; bf = Math.max(bf, l * 8 + (1 - l) * Math.sqrt(8) - M.phi([8 * l, 8 * (1 - l)], CE)); }
  close(g.gap, bf, 1e-6, 'maxGap vs brute force');
  // segment() agrees with phi and the chord
  const seg = M.segment(z, zp, CE, 11);
  close(seg[5].phi, mid); close(seg[5].gap, chord - mid); close(seg[0].phi, M.phi(zp, CE)); close(seg[10].phi, M.phi(z, CE));
  checks += 7;

  // phi_11 > 0 in the interior for (1, 1/2): convex in z1 at fixed z2 > 0
  for (let i = 0; i < 50; i++) { const p = [0.2 + 7 * rand(), 0.2 + 7 * rand()]; assert.ok(M.derivatives(p, CE).hess[0][0] > 0); checks++; }

  // Friedman: homothetic, quasi-concave, NIRS => concave. No chord ever lies above phi.
  for (const k of [0.4, 0.75, 1]) {
    const P = { k1: k, k2: k };
    for (let i = 0; i < 300; i++) {
      const a = [L * rand(), L * rand()], b = [L * rand(), L * rand()], l = rand();
      assert.ok(M.phi([l * a[0] + (1 - l) * b[0], l * a[1] + (1 - l) * b[1]], P) >= l * M.phi(a, P) + (1 - l) * M.phi(b, P) - 1e-9, `concave k=${k}`);
      checks++;
    }
    assert.ok(M.concaveOnGrid(P, L).concave, `grid concave k=${k}`);
    assert.ok(M.worstPair(P, L, 8).gap < 1e-9, `worstPair k=${k}`);
    checks += 2;
  }
  // non-homothetic with no increasing returns: not concave
  for (const P of [CE, { k1: 0.9, k2: 0.5 }, { k1: 0.5, k2: 0.9 }, { k1: 0.6, k2: 0.5 }]) {
    assert.ok(!M.concaveOnGrid(P, L).concave, `not concave ${JSON.stringify(P)}`);
    const w = M.worstPair(P, L, 8);
    assert.ok(w.gap > 1e-4, `a pair with a gap ${JSON.stringify(P)}`);
    // the pair found really violates concavity
    const m = [(w.z[0] + w.zp[0]) / 2, (w.z[1] + w.zp[1]) / 2];
    close((M.phi(w.z, P) + M.phi(w.zp, P)) / 2 - M.phi(m, P), w.gap);
    checks += 3;
  }
  // homothetic with increasing returns (k > 1): convex along rays, not concave
  assert.ok(!M.concaveOnGrid({ k1: 1.3, k2: 1.3 }, L).concave);
  checks++;
}

console.log(`concavity-and-scale: all ${checks} checks passed`);
