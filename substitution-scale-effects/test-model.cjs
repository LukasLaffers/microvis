// Checks the substitution/scale decomposition (substitution-scale-effects/SPEC.md, tests i-iv).
// Run with:  node substitution-scale-effects/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol = 1e-6, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const cases = [];
for (const tech of ['cobb', 'ces', 'linear', 'leontief']) {
  for (const delta of [0.3, 0.5, 0.7]) {
    for (const rho of tech === 'ces' ? [-2, -0.5, 0.5] : [0]) {
      cases.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 });
      cases.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 0.6, a: 1.2, m: 0.5 });
      cases.push({ tech, delta, rho, profile: 'homog', A: 1, k: 0.6, a: 2, m: 1 });
      cases.push({ tech, delta, rho, profile: 'homog', A: 1.5, k: 0.85, a: 2, m: 1 });
    }
  }
}
const markets = [[[1, 1], 8], [[0.7, 1.4], 12], [[1.6, 0.9], 15]];

// Second derivative of G, computed independently of the shared model.
const Gpp = (q, s) => s.profile === 'ushape' ? 2 * (q - s.a) : (1 / s.k) * (1 / s.k - 1) * Math.pow(q, 1 / s.k - 2) * Math.pow(s.A, -1 / s.k);

for (const s of cases) {
  for (const [w, p] of markets) {
    const label = JSON.stringify({ s, w, p });
    const S = FM.supply(w, p, s);
    if (S.kind !== 'interior' || !(S.q > 0)) continue;
    const u = FM.unitDemand(w, s);
    const linearTie = u.kind === 'multiple';

    // (i) the marginal decomposition adds up (smooth technologies; linear only away from the switch).
    if (!linearTie) {
      const d = M.decomposeDerivative(w, p, s);
      for (const e of [d.input1, d.input2]) {
        close(e.substitution + e.scale, e.total, 1e-5, 'adds up ' + label);
        checks++;
      }
      // (ii) for input 1 both effects are <= 0 whenever dH1/dq > 0.
      if (d.input1.dHdq > 0) {
        assert.ok(d.input1.substitution <= 1e-6 && d.input1.scale <= 1e-6, 'signs ' + label);
        checks++;
      }
      // (iii) dS/dw1 = - Htilde^1(w) G'(q*) / (c(w) G''(q*)).
      const closed = -u.h[0] * FM.Gprime(S.q, s) / (FM.unitCost(w, s) * Gpp(S.q, s));
      close(d.dSdw1, closed, 1e-5, 'dS/dw1 ' + label);
      checks++;
    }

    // Discrete version: (iv) B is on the old isoquant, C produces S(w', p); the split adds up exactly.
    for (const dw1 of [0.3, 0.5, -0.2]) {
      const r = M.decompose(w, p, s, dw1);
      close(FM.phi(r.B[0], r.B[1], s), r.qA, 1e-9, 'B on isoquant ' + label);
      close(FM.phi(r.C[0], r.C[1], s), M.output(r.wNew, p, s), 1e-9, 'C produces S ' + label);
      for (let i = 0; i < 2; i++) close(r.substitution[i] + r.scale[i], r.total[i], 1e-12, 'discrete adds up');
      // A rise in w1 lowers output (or leaves it at zero) and lowers the demand for input 1.
      if (dw1 > 0 && !linearTie) assert.ok(r.qC <= r.qA + 1e-12 && r.total[0] <= 1e-9, 'direction ' + label);
      checks += 5;
    }
  }
}

// The arc used by the animation stays on the isoquant and runs from P to Q.
{
  const s = { tech: 'ces', delta: 0.4, rho: -0.7, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 };
  const r = M.decompose([1, 1], 8, s, 0.8), arc = M.isoquantArc(r.qA, r.A, r.B, s, 30);
  arc.forEach(z => close(FM.phi(z[0], z[1], s), r.qA, 1e-9, 'arc'));
  close(arc[0][0], r.A[0], 1e-9); close(arc[arc.length - 1][1], r.B[1], 1e-9);
  checks += arc.length + 2;
}

// Defaults of the page (SPEC): Cobb-Douglas delta = 0.5, 'ushape' a = 2, m = 1, p = 8, w2 = 1, w1: 1 -> 1.5.
{
  const s = { tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 };
  const r = M.decompose([1, 1], 8, s, 0.5);
  close(r.qA, 3.732, 1e-3); close(r.qC, 3.505, 1e-3);
  close(r.A[0], 8.131, 1e-3); close(r.B[0], 6.639, 1e-3); close(r.B[1], 9.958, 1e-3); close(r.C[0], 5.968, 1e-3); close(r.C[1], 8.952, 1e-3);
  close(r.substitution[0], -1.492, 1e-3); close(r.scale[0], -0.671, 1e-3); close(r.total[0], -2.163, 1e-3);
  close(r.profitA, 13.59, 1e-3); close(r.profitC, 10.14, 1e-3);
  const d = M.decomposeDerivative([1, 1], 8, s);
  close(d.input1.total, -6.375, 1e-3); close(d.input1.substitution, -4.065, 1e-3); close(d.input1.scale, -2.309, 1e-3);
  checks += 15;
}

console.log(`All ${checks} decomposition checks passed.`);
