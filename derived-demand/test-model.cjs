// Checks Marshall's law of derived demand (lecture 4, section 2) against independent calculations.
// Run with:  node derived-demand/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const techs = [];
for (const delta of [0.2, 0.5, 0.8]) {
  techs.push({ tech: 'cobb', delta, rho: 0 });
  techs.push({ tech: 'leontief', delta, rho: 0 });
  for (const rho of [-4, -1, -0.3, 0.3, 0.7]) techs.push({ tech: 'ces', delta, rho });
}
const prices = [[1, 1], [0.5, 2], [2, 0.7], [3, 3]];
const dems = [-0.2, -1, -1.5, -3.5].map(eps => ({ B: 100, eps }));

for (const s of techs) for (const w of prices) {
  const label = JSON.stringify({ s, w });
  // Constant returns: C(w, q) = c(w) q, so marginal and average cost are flat at c(w).
  const cs = M.crs(s);
  close(FM.cost(w, 3.7, cs), M.unitCost(w, s) * 3.7, 1e-9, 'C = c q ' + label);
  close(FM.MC(w, 3.7, cs), M.unitCost(w, s), 1e-6, 'MC = c ' + label);
  // Theorem 1: sigma = C_12 C / (C_1 C_2) is 1 for Cobb-Douglas, 1/(1 - rho) for CES, 0 for Leontief.
  const th = M.sigmaTheorem1(w, s);
  close(th.sigma, M.sigmaFormula(s), 1e-5, 'Theorem 1 ' + label);
  // Shephard's lemma: C_i = H~^i.
  const h = FM.unitDemand(w, cs).h;
  close(th.C1, h[0], 1e-7, 'C1 ' + label); close(th.C2, h[1], 1e-7, 'C2 ' + label);
  checks += 6;

  for (const dem of dems) {
    const eq = M.equilibrium(w, s, dem), e = M.elasticities(w, s, dem), m = M.marshall(w, s, dem);
    // Equilibrium: p = c(w), q = Dem(p), sh1 = w1 z1 / C.
    close(eq.q, dem.B * Math.pow(eq.p, dem.eps), 1e-12);
    close(eq.sh1, w[0] * eq.z[0] / (w[0] * eq.z[0] + w[1] * eq.z[1]), 1e-12, 'sh1 ' + label);
    // Corollary: eps^c_11 = -sigma (1 - sh1).
    close(e.epsC, m.epsC, 1e-6, 'corollary ' + label);
    // (dagger): eps^u_11 = eps^c_11 + eps^D_p sh1, with the numerical eps^c_11.
    close(e.epsU, e.epsC + dem.eps * e.sh1, 1e-6, '(dagger) ' + label);
    // Marshall's law: (-eps^u_11) is the weighted average sigma (1 - sh1) + (-eps^D_p) sh1 ...
    close(-e.epsU, m.weighted, 1e-6, 'Marshall ' + label);
    // ... and therefore lies between sigma and -eps^D_p.
    assert.ok(-e.epsU >= Math.min(m.sigma, -dem.eps) - 1e-6 && -e.epsU <= Math.max(m.sigma, -dem.eps) + 1e-6, 'between ' + label);
    // Leontief: no substitution, eps^u_11 = eps^D_p sh1.
    if (s.tech === 'leontief') { close(e.epsU, dem.eps * eq.sh1, 1e-6, 'Leontief ' + label); checks++; }
    // The what-if: the exact percentage change approaches eps^u_11 r for small r.
    const small = M.whatIf(w, s, dem, 1e-4);
    close(small.pct / 1e-4, e.epsU, 1e-3, 'what-if ' + label);
    // The derivative form: dD^1/dw1 = dH^1/dw1 + (H~^1)^2 dDem/dp.
    const hh = 1e-5 * w[0], up = [w[0] + hh, w[1]], dn = [w[0] - hh, w[1]];
    const dD = (M.industryDemand1(up, s, dem) - M.industryDemand1(dn, s, dem)) / (2 * hh);
    const dH = (M.conditional1(up, s, eq.q) - M.conditional1(dn, s, eq.q)) / (2 * hh);
    const dDem = dem.eps * eq.q / eq.p;
    close(dD, dH + h[0] * h[0] * dDem, 1e-5, 'derivative form ' + label);
    checks += 8;
  }
}

// Cobb-Douglas by hand: sh1 = delta, D^1 ∝ w1^(delta (1 + eps) - 1).
{
  const s = { tech: 'cobb', delta: 0.3, rho: 0 }, dem = { B: 50, eps: -2 };
  close(M.elasticities([1.7, 0.9], s, dem).epsU, 0.3 * (1 - 2) - 1, 1e-6, 'Cobb-Douglas power');
  close(M.equilibrium([1.7, 0.9], s, dem).sh1, 0.3, 1e-12);
  checks += 2;
}

// Defaults of the page: Cobb-Douglas delta = 0.5, w = (1, 1), eps^D_p = -1.5, B = 100, a 10 % wage rise.
{
  const s = { tech: 'cobb', delta: 0.5, rho: -0.5 }, dem = { B: 100, eps: -1.5 }, w = [1, 1];
  const eq = M.equilibrium(w, s, dem), e = M.elasticities(w, s, dem), m = M.marshall(w, s, dem);
  close(eq.p, 2, 1e-12); close(eq.q, 100 / Math.pow(2, 1.5), 1e-12); close(eq.sh1, 0.5, 1e-12);
  close(e.sigma, 1, 1e-5); close(e.epsC, -0.5, 1e-6); close(e.epsU, -1.25, 1e-6);
  close(m.substitution, 0.5, 1e-12); close(m.output, 0.75, 1e-12);
  const wi = M.whatIf(w, s, dem, 0.1);
  close(wi.pct, Math.pow(1.1, -1.25) - 1, 1e-9); close(wi.approx, -0.125, 1e-6);
  close(wi.after.p, 2 * Math.sqrt(1.1), 1e-12);
  checks += 11;
}

console.log(`All ${checks} derived-demand checks passed.`);
