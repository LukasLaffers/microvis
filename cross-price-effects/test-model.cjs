// Checks the cross-price model against an independent brute-force firm (no ../shared/firm-model.js inside it).
// Run with:  node cross-price-effects/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

let checks = 0;
const close = (a, b, tol, msg) => { checks++; assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} != ${b}`); };

// ---------- the brute-force firm: phi = g(z)^k, g = CES(delta, sigma) ----------
const d = M.DELTA, k = M.K;
// z2 on the isoquant g(z1, z2) = gq, solved from the definition of g
function z2On(z1, gq, sig) {
  if (Math.abs(sig - 1) < 1e-12) return Math.pow(gq / Math.pow(z1, d), 1 / (1 - d));
  const r = 1 - 1 / sig, v = (Math.pow(gq, r) - d * Math.pow(z1, r)) / (1 - d);
  return v > 0 ? Math.pow(v, 1 / r) : Infinity;
}
const golden = (f, lo, hi, n) => {
  const gr = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < n; i++) { const a = hi - gr * (hi - lo), b = lo + gr * (hi - lo); if (f(a) < f(b)) hi = b; else lo = a; }
  return (lo + hi) / 2;
};
// cost minimisation: search along the isoquant in log z1 (for sigma < 1 the isoquant has an asymptote z1 > gq d^(sigma/(1-sigma)))
function Hbf(w, q, sig) {
  const gq = Math.pow(q, 1 / k);
  const lo = sig < 1 ? Math.log(gq * Math.pow(d, sig / (1 - sig))) + 1e-9 : Math.log(gq) - 12;
  const l = golden(t => w[0] * Math.exp(t) + w[1] * z2On(Math.exp(t), gq, sig), lo, Math.log(gq) + 12, 160);
  return [Math.exp(l), z2On(Math.exp(l), gq, sig)];
}
const Cbf = (w, q, sig) => { const h = Hbf(w, q, sig); return w[0] * h[0] + w[1] * h[1]; };
const Sbf = (w, p, sig) => golden(q => Cbf(w, q, sig) - p * q, 1e-9, 100, 120);
const Dbf = (w, p, sig) => Hbf(w, Sbf(w, p, sig), sig);
const Pibf = (w, p, sig) => { const q = Sbf(w, p, sig); return p * q - Cbf(w, q, sig); };

// ---------- the three firms start at the same point ----------
for (const sig of [0.3, 0.5, 1, 2, 3, 4.5]) {
  const st = M.steps(sig, 2);
  close(st.q0, 1, 1e-9, 'q0 = 1'); close(st.A[0], 1, 1e-9, 'A = (1, 1)'); close(st.A[1], 1, 1e-9, 'A = (1, 1)');
}

// ---------- A, B, C against the brute-force firm ----------
for (const sig of [0.5, 1, 2, 3]) for (const w2n of [0.5, 2, 3.5]) {
  const st = M.steps(sig, w2n), w1 = [1, w2n], tag = `sigma ${sig}, w2' ${w2n}`;
  const B = Hbf(w1, st.q0, sig), C = Dbf(w1, M.P, sig);
  close(st.B[0], B[0], 1e-6, `B ${tag}`); close(st.B[1], B[1], 1e-6, `B ${tag}`);
  close(st.C[0], C[0], 1e-6, `C ${tag}`); close(st.C[1], C[1], 1e-6, `C ${tag}`);
  close(st.q1, Sbf(w1, M.P, sig), 1e-6, `q1 ${tag}`);
  // B costs no more than A at the new prices (cost minimisation), C is on the new isoquant
  checks++; assert.ok(w1[0] * st.B[0] + w1[1] * st.B[1] <= w1[0] * st.A[0] + w1[1] * st.A[1] + 1e-12, `B cheapest ${tag}`);
}

// ---------- the marginal effects, every term by finite differences of the brute-force firm ----------
for (const sig of [0.5, 1, 2, 3]) for (const w of [[1, 1], [1, 2], [1.5, 0.8]]) {
  const m = M.marginal(sig, w), p = M.P, h = 1e-3, tag = `sigma ${sig}, w ${w}`;
  const at = (i, t) => { const v = w.slice(); v[i] += t; return v; };
  const q = Sbf(w, p, sig);
  const sub = (Hbf(at(1, h), q, sig)[0] - Hbf(at(1, -h), q, sig)[0]) / (2 * h);
  const Hq = i => (Hbf(w, q * (1 + h), sig)[i] - Hbf(w, q * (1 - h), sig)[i]) / (2 * q * h);
  const Cqq = (Cbf(w, q * (1 + h), sig) - 2 * Cbf(w, q, sig) + Cbf(w, q * (1 - h), sig)) / Math.pow(q * h, 2);
  const tot = (Dbf(at(1, h), p, sig)[0] - Dbf(at(1, -h), p, sig)[0]) / (2 * h);
  const cross = (Dbf(at(0, h), p, sig)[1] - Dbf(at(0, -h), p, sig)[1]) / (2 * h);
  const dSdw2 = (Sbf(at(1, h), p, sig) - Sbf(at(1, -h), p, sig)) / (2 * h);
  close(m.substitution, sub, 2e-3, `substitution ${tag}`);
  close(m.scale, -Hq(0) * Hq(1) / Cqq, 2e-3, `scale ${tag}`);
  close(m.Cqq, Cqq, 2e-3, `Cqq ${tag}`);
  close(m.dSdw2, dSdw2, 2e-3, `dS/dw2 = -(1/Cqq) dH2/dq ${tag}`);
  close(m.total, tot, 2e-3, `dD1/dw2 ${tag}`);
  close(m.cross, cross, 2e-3, `dD2/dw1 ${tag}`);
  // the decomposition adds up, the two cross effects are equal, and Hotelling: dD1/dw2 = -d2Pi/dw1dw2
  close(m.substitution + m.scale, m.total, 1e-6, `sub + scale = total ${tag}`);
  close(m.cross, m.total, 1e-6, `symmetry ${tag}`);
  close(m.substitution21, m.substitution, 1e-6, `dH2/dw1 = dH1/dw2 ${tag}`);
  close(m.substitution21 + m.scale, m.cross, 1e-6, `dD2/dw1 = its two terms ${tag}`);
  const H = 1e-2, Pi = v => Pibf(v, p, sig);
  const Pi12 = (Pi([w[0] + H, w[1] + H]) - Pi([w[0] + H, w[1] - H]) - Pi([w[0] - H, w[1] + H]) + Pi([w[0] - H, w[1] - H])) / (4 * H * H);
  close(m.total, -Pi12, 5e-3, `Hotelling ${tag}`);
  // signs: substitution > 0, scale < 0 (both inputs normal)
  checks += 2; assert.ok(m.substitution > 0, `substitution > 0 ${tag}`); assert.ok(m.scale < 0, `scale < 0 ${tag}`);
  // elasticity of D1 with respect to w2: s2 (sigma - 1/(1-k)), s2 the cost share of input 2
  const D = Dbf(w, p, sig), s2 = w[1] * D[1] / (w[0] * D[0] + w[1] * D[1]);
  close(m.total * w[1] / D[0], s2 * (sig - 1 / (1 - k)), 2e-3, `elasticity ${tag}`);
}

// ---------- the default cases: substitution sigma/2, scale -1, total sigma/2 - 1 at w = (1, 1) ----------
for (const sig of [3, 2, 0.5]) {
  const m = M.marginal(sig);
  close(m.substitution, sig / 2, 1e-6, 'substitution = sigma/2'); close(m.scale, -1, 1e-6, 'scale = -1'); close(m.total, sig / 2 - 1, 1e-6, 'total');
}
// and the discrete change w2: 1 -> 2: input 1 rises for sigma = 3, stays for sigma = 2, falls for sigma = 0.5
assert.deepEqual([3, 2, 0.5].map(sig => { const st = M.steps(sig, 2); return M.direction(st.A[0], st.C[0]); }), [1, 0, -1]); checks++;
close(M.steps(2, 2).C[0], 1, 1e-9, 'sigma = 2: C1 = A1');
// D1 is monotone in w2, in the direction of the marginal effect, for every sigma (the sign of sigma - 1/(1-k) does not depend on w)
for (const sig of [0.5, 1, 1.9, 2.1, 3]) {
  const c = M.curves(sig, [0.5, 1, 1.5, 2, 3, 4]).D1.map(p => p[0]), sgn = Math.sign(M.marginal(sig).total);
  for (let i = 1; i < c.length; i++) { checks++; assert.ok(Math.sign(c[i] - c[i - 1]) === sgn, `D1 monotone, sigma ${sig}`); }
}
// the H1 curve passes through A and B, the D1 curve through A and C
{
  const st = M.steps(3, 2.5), cv = M.curves(3, [1, 2.5]);
  close(cv.H1[0][0], st.A[0], 1e-9, 'H1 through A'); close(cv.H1[1][0], st.B[0], 1e-9, 'H1 through B');
  close(cv.D1[0][0], st.A[0], 1e-9, 'D1 through A'); close(cv.D1[1][0], st.C[0], 1e-9, 'D1 through C');
}

console.log(`cross-price-effects: all ${checks} checks passed`);
