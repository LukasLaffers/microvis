// Checks the shared firm model against independent numerical calculations (plans/lecture-2.md, 3.6).
// Run with:  node shared/test-firm-model.cjs
const assert = require('node:assert/strict');
const M = require('./firm-model.js');

const close = (a, b, tol = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const techs = ['cobb', 'ces', 'linear', 'leontief'];
const prices = [[1, 1], [1, 2], [2.5, 0.7], [0.3, 4]];
const states = [];
for (const tech of techs) {
  for (const delta of [0.2, 0.5, 0.8]) {
    for (const rho of tech === 'ces' ? [-3, -0.5, 0.5, 0.85] : [0]) {
      states.push({ tech, delta, rho, profile: 'homog', A: 1.3, k: 0.6, a: 2, m: 1 });
      states.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 1, a: 1.5, m: 0.6 });
    }
  }
}
const label = (s, w) => JSON.stringify({ ...s, w });

// 1. unitCost equals a brute-force minimum of w.z over the unit isoquant g(z) = 1 (>= 20 000 points).
for (const s of states.filter(s => s.profile === 'homog')) {
  for (const w of prices) {
    let best = Infinity;
    const N = 20000;
    if (s.tech === 'leontief') best = w[0] * s.delta + w[1] * (1 - s.delta); // the corner is the only efficient point
    for (let i = 0; i <= N; i++) {
      const th = (Math.PI / 2) * i / N, c = Math.cos(th), sn = Math.sin(th), unit = M.g(c, sn, s);
      if (unit > 0) best = Math.min(best, (w[0] * c + w[1] * sn) / unit);
    }
    close(M.unitCost(w, s), best, 1e-4, 'unitCost ' + label(s, w));
    checks++;
  }
}

// 2. g(Htilde(w)) = 1 and w.Htilde(w) = c(w).
for (const s of states) {
  for (const w of prices) {
    const { h } = M.unitDemand(w, s);
    close(M.g(h[0], h[1], s), 1, 1e-9, 'g(Htilde) ' + label(s, w));
    close(w[0] * h[0] + w[1] * h[1], M.unitCost(w, s), 1e-9, 'w.Htilde ' + label(s, w));
    checks += 2;
  }
}

// 3. Shephard's lemma: dc/dw_i = Htilde^i (cobb, ces).
for (const s of states.filter(s => s.tech === 'cobb' || s.tech === 'ces')) {
  for (const w of prices) {
    const h = 1e-6, { h: H } = M.unitDemand(w, s);
    close((M.unitCost([w[0] + h, w[1]], s) - M.unitCost([w[0] - h, w[1]], s)) / (2 * h), H[0], 1e-5, 'Shephard 1 ' + label(s, w));
    close((M.unitCost([w[0], w[1] + h], s) - M.unitCost([w[0], w[1] - h], s)) / (2 * h), H[1], 1e-5, 'Shephard 2 ' + label(s, w));
    checks += 2;
  }
}

// 4. Interior solutions: MRTS_21(H(w, q)) = w1 / w2.
for (const s of states) {
  for (const w of prices) {
    const r = M.condDemand(w, 2, s);
    if (r.kind !== 'interior') continue;
    close(M.mrts(r.H[0], r.H[1], s), w[0] / w[1], 1e-9, 'MRTS = w1/w2 ' + label(s, w));
    checks++;
  }
}

// 5. C homogeneous of degree 1 in w, H of degree 0; c concave in w (midpoint inequality).
for (const s of states) {
  for (const w of prices) {
    for (const t of [0.5, 3]) {
      close(M.cost([t * w[0], t * w[1]], 1.7, s), t * M.cost(w, 1.7, s), 1e-9, 'C hom 1');
      const a = M.condDemand(w, 1.7, s).H, b = M.condDemand([t * w[0], t * w[1]], 1.7, s).H;
      close(b[0], a[0], 1e-9, 'H hom 0'); close(b[1], a[1], 1e-9, 'H hom 0');
      checks += 3;
    }
    for (const v of prices) {
      const mid = [(w[0] + v[0]) / 2, (w[1] + v[1]) / 2];
      assert.ok(M.unitCost(mid, s) >= (M.unitCost(w, s) + M.unitCost(v, s)) / 2 - 1e-12, 'c concave ' + label(s, w));
      checks++;
    }
  }
}

// 6. G(F(x)) = x; phi(H(w,q)) = q; MC = dC/dq; 'homog': AC / MC = k.
for (const s of states) {
  for (const x of [0.2, 1, 3.7, 12]) { close(M.G(M.F(x, s), s), x, 1e-9, 'G(F(x))'); checks++; }
  for (const w of prices) {
    for (const q of [0.4, 1, 2.3, 4]) {
      const H = M.condDemand(w, q, s).H;
      close(M.phi(H[0], H[1], s), q, 1e-9, 'phi(H) ' + label(s, w));
      const h = 1e-6;
      close(M.MC(w, q, s), (M.cost(w, q + h, s) - M.cost(w, q - h, s)) / (2 * h), 1e-5, 'MC ' + label(s, w));
      close(M.scaleElasticity(q, s), M.AC(w, q, s) / M.MC(w, q, s), 1e-9, 'e = AC/MC');
      if (s.profile === 'homog') close(M.AC(w, q, s) / M.MC(w, q, s), s.k, 1e-9, 'AC/MC = k');
      checks += 4;
    }
  }
}

// 7. Supply equals a brute-force maximiser of pq - C(w,q) on a fine grid; special kinds.
{
  // Search q in [0, qmax] with 100 000 steps; qmax well beyond the closed-form answer.
  const bruteSupply = (w, p, s, qmax) => {
    let best = 0, bestQ = 0;
    const N = 100000;
    for (let n = 0; n <= N; n++) { const q = qmax * n / N, v = p * q - M.cost(w, q, s); if (v > best) { best = v; bestQ = q; } }
    return { q: bestQ, profit: best, step: qmax / N };
  };
  for (const s of states.filter(s => s.tech === 'cobb' || s.tech === 'linear')) {
    for (const w of [[1, 1], [2, 0.5]]) {
      for (const p of [0.5, 2, 5, 9]) {
        const S = M.supply(w, p, s), b = bruteSupply(w, p, s, Math.max(10, 3 * (S.q || 0)));
        if (S.kind === 'zero') assert.equal(b.q, 0, 'zero ' + label(s, w));
        else { assert.ok(Math.abs(S.q - b.q) <= 2 * b.step, 'supply ' + label(s, w) + ` ${S.q} vs ${b.q}`); close(M.profit(w, p, s), b.profit, 1e-6, 'profit'); }
        checks++;
      }
    }
  }
  const base = { tech: 'cobb', delta: 0.5, rho: 0, profile: 'homog', A: 1, k: 1, a: 2, m: 1 }, w = [1, 1]; // c(w) = 2
  assert.equal(M.supply(w, 1.5, base).kind, 'zero');
  assert.equal(M.supply(w, 2, base).kind, 'indeterminate');
  assert.equal(M.supply(w, 2.5, base).kind, 'unbounded');
  assert.equal(M.supply(w, 1, { ...base, k: 1.3 }).kind, 'unbounded');
  const u = { ...base, profile: 'ushape' }, { pHat, qHat } = M.minAC(w, u);
  close(pHat, 4); close(qHat, 3);
  close(M.MC(w, qHat, u), M.AC(w, qHat, u), 1e-12, 'MC = AC at qHat');
  assert.equal(M.supply(w, 3.9, u).kind, 'zero');
  assert.equal(M.supply(w, 4, u).kind, 'indifferent');
  close(M.profit(w, 4, u), 0, 1e-9);
  // pHat is the minimum of AC (brute force).
  let minAc = Infinity;
  for (let q = 0.01; q < 10; q += 0.0005) minAc = Math.min(minAc, M.AC(w, q, u));
  close(minAc, pHat, 1e-6, 'min AC');
  checks += 11;
}

// 8. One step = two steps: brute-force max of p phi(z) - w.z matches D(w,p) and Pi(w,p).
{
  const oneStep = (w, p, s, zmax) => {
    let best = -Infinity, z = [0, 0];
    const N = 160;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const a = zmax * i / N, b = zmax * j / N, v = M.profitAt(a, b, w, p, s);
      if (v > best) { best = v; z = [a, b]; }
    }
    // Local refinement: pattern search with shrinking steps.
    for (let h = zmax / N; h > 1e-9; h /= 2) {
      let moved = true;
      while (moved) {
        moved = false;
        for (const [da, db] of [[h, 0], [-h, 0], [0, h], [0, -h], [h, h], [-h, -h], [h, -h], [-h, h]]) {
          const a = Math.max(0, z[0] + da), b = Math.max(0, z[1] + db), v = M.profitAt(a, b, w, p, s);
          if (v > best + 1e-13) { best = v; z = [a, b]; moved = true; }
        }
      }
    }
    return { z, profit: best };
  };
  const cases = [];
  for (const tech of ['cobb', 'ces']) for (const delta of [0.3, 0.5, 0.7]) for (const rho of tech === 'ces' ? [-1, 0.4] : [0]) {
    cases.push({ tech, delta, rho, profile: 'homog', A: 1.2, k: 0.6, a: 2, m: 1 });
    cases.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 1, a: 2, m: 1 });
  }
  for (const s of cases) {
    for (const [w, p] of [[[1, 1], 8], [[1.5, 0.8], 12]]) {
      const D = M.uncondDemand(w, p, s), Pi = M.profit(w, p, s), r = oneStep(w, p, s, 1.6 * Math.max(D[0], D[1]));
      close(r.profit, Pi, 1e-6, 'one step profit ' + label(s, w));
      close(r.z[0], D[0], 2e-3, 'D1 ' + label(s, w));
      close(r.z[1], D[1], 2e-3, 'D2 ' + label(s, w));
      checks += 3;
    }
  }
}

// 9. Lecture 2 exercises.
{
  // Exercise 1 with a1 = delta, a2 = 1 - delta: Leontief C = q(a1 w1 + a2 w2); linear C = q min(w1/a1, w2/a2).
  const w = [1.3, 0.9], d = 0.35, q = 2.4;
  const crs = { delta: d, rho: 0, profile: 'homog', A: 1, k: 1 };
  close(M.cost(w, q, { ...crs, tech: 'leontief' }), q * (d * w[0] + (1 - d) * w[1]));
  close(M.cost(w, q, { ...crs, tech: 'linear' }), q * Math.min(w[0] / d, w[1] / (1 - d)));
  // Exercise 4: C = q [w1^(1-sigma) + w2^(1-sigma)]^(1/(1-sigma)) = our CES unit cost (delta = 1/2) / 2^(1/rho).
  for (const rho of [-2, -0.5, 0.3, 0.8]) {
    const sg = 1 / (1 - rho), s = { ...crs, tech: 'ces', delta: 0.5, rho };
    const ex4 = q * Math.pow(Math.pow(w[0], 1 - sg) + Math.pow(w[1], 1 - sg), 1 / (1 - sg));
    close(ex4, M.cost(w, q, s) / Math.pow(2, 1 / rho), 1e-12, 'exercise 4');
    checks++;
  }
  checks += 2;
}

// Defaults of the three tools (numbers listed in their SPEC.md files).
{
  const cd = { tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'homog', A: 1, k: 1, a: 2, m: 1 };
  close(M.unitCost([1, 2], cd), 2 * Math.SQRT2);
  const H = M.condDemand([1, 2], 2, cd).H;
  close(H[0], 2 * Math.SQRT2); close(H[1], Math.SQRT2); close(M.cost([1, 2], 2, cd), 4 * Math.SQRT2);
  const u = { ...cd, profile: 'ushape' }, S = M.supply([1, 1], 8, u).q;
  close(S, 2 + Math.sqrt(3)); close(M.cost([1, 1], S, u), 16.2614, 1e-4); close(M.profit([1, 1], 8, u), 13.5948, 1e-4);
  close(M.AC([1, 1], S, u), 4.3572, 1e-4); close(M.MC([1, 1], S, u), 8); close(M.scaleElasticity(S, u), 0.5447, 1e-3);
  const D = M.uncondDemand([1, 1], 8, u);
  close(D[0], 8.131, 1e-3); close(D[1], 8.131, 1e-3);
  close(M.supply([1, 1], 5, { ...cd, k: 0.6, A: 1.5 }).q, 5.0625, 1e-4);
  checks += 13;
}

console.log(`All ${checks} firm-model checks passed.`);
