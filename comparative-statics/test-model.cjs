// Checks the comparative-statics formulas of lecture 4 against finite differences.
// Run with:  node comparative-statics/test-model.cjs
const assert = require('node:assert/strict');
const FM = require('../shared/firm-model.js');
const M = require('./model.js');

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
let checks = 0;

const cases = [];
for (const tech of ['cobb', 'ces', 'leontief']) for (const delta of [0.3, 0.5, 0.7]) for (const rho of tech === 'ces' ? [-2, -0.5, 0.5] : [0]) {
  cases.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 });
  cases.push({ tech, delta, rho, profile: 'ushape', A: 1, k: 0.6, a: 1.2, m: 0.5 });
  cases.push({ tech, delta, rho, profile: 'homog', A: 1, k: 0.6, a: 2, m: 1 });
  cases.push({ tech, delta, rho, profile: 'homog', A: 1.4, k: 0.85, a: 2, m: 1 });
}
const markets = [[[1, 1], 8], [[2, 1], 8], [[0.7, 1.6], 12], [[1.5, 0.6], 15]];

for (const s of cases) for (const [w, p] of markets) {
  const label = JSON.stringify({ s, w, p });
  if (FM.supply(w, p, s).kind !== 'interior' || !(M.output(w, p, s) > 0)) continue;
  const q = M.output(w, p, s);
  // SOSC and the supply response to the output price: dq/dp = 1 / C_qq.
  assert.ok(M.Cqq(w, q, s) > 0, 'SOSC ' + label);
  const sp = M.supplySlopeP(w, p, s);
  close(sp.formula, sp.numeric, 1e-5, 'dq/dp ' + label);
  assert.ok(sp.formula > 0);
  // (*): dq/dw_i = -(1/C_qq) dH^i/dq for both inputs.
  for (const i of [0, 1]) {
    const sw = M.supplySlopeW(w, p, s, i);
    close(sw.formula, sw.numeric, 1e-5, `dq/dw${i + 1} ` + label);
    // (**): the decomposition adds up; substitution <= 0 and scale <= 0.
    const d = M.decomposeOwn(w, p, s, i);
    close(d.substitution + d.scale, d.total, 1e-5, `(**) ${i} ` + label);
    assert.ok(d.substitution <= 1e-7 && d.scale <= 1e-12, 'signs ' + label);
    checks += 4;
  }
  // Area to the left of the conditional demand curve = change in cost (Shephard's lemma).
  for (const w1b of [0.5 * w[0], 1.8 * w[0]]) {
    const area = M.areaLeftOfH(w[1], q, s, w[0], w1b);
    close(area, Math.abs(FM.cost([w[0], w[1]], q, s) - FM.cost([w1b, w[1]], q, s)), 1e-8, 'area ' + label);
    checks++;
  }
  // The points of the first Cowell figure: a price fall raises z1 twice (substitution, then scale).
  const pts = M.points(w, p, s, 0.6 * w[0]);
  if (s.tech !== 'leontief') assert.ok(pts.zO > pts.zStar - 1e-12, 'substitution raises z1');
  assert.ok(pts.zStarStar >= pts.zO - 1e-12 && pts.qAfter >= pts.qBefore - 1e-12, 'scale raises z1');
  checks += 4;
}

// The curves: the ordinary demand curve is flatter than the conditional one where they cross.
{
  const s = { tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 };
  const q = M.output([2, 1], 8, s), Dc = M.demandCurve(1, 8, s, 1.9, 2.1, 3), Hc = M.conditionalCurve(1, q, s, 1.9, 2.1, 3);
  close(Dc[1][0], Hc[1][0], 1e-9, 'curves cross at w1 = 2');
  assert.ok(Math.abs(Dc[2][0] - Dc[0][0]) > Math.abs(Hc[2][0] - Hc[0][0]), 'D responds more than H');
  checks += 2;
}

// Defaults of the page: Cobb-Douglas delta = 0.5, 'ushape' a = 2, m = 1, p = 8, w2 = 1, w1: 2 -> 1.
{
  const s = { tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', A: 1, k: 0.6, a: 2, m: 1 };
  const pts = M.points([2, 1], 8, s, 1);
  close(pts.qBefore, 3.3522, 1e-4); close(pts.qAfter, 2 + Math.sqrt(3), 1e-9);
  close(pts.zStar, 4.8387, 1e-4); close(pts.zO, 6.8430, 1e-4); close(pts.zStarStar, 8.1308, 1e-4);
  const d = M.decomposeOwn([2, 1], 8, s, 0);
  close(d.Cqq, 7.6492, 1e-4); close(d.substitution, -1.2097, 1e-4); close(d.scale, -0.5229, 1e-4); close(d.total, -1.7326, 1e-4);
  close(M.supplySlopeP([2, 1], 8, s).formula, 0.1307, 1e-3); close(M.supplySlopeW([2, 1], 8, s, 0).formula, -0.2615, 1e-3);
  close(M.areaLeftOfH(1, pts.qBefore, s, 1, 2), 5.6689, 1e-4);
  checks += 13;
}

console.log(`All ${checks} comparative-statics checks passed.`);
