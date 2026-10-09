/*
 * Homogeneous and Homothetic: model helpers (lecture 1). The technologies are in ../shared/technology-model.js.
 *
 * Isoquants are drawn at equal output steps q = dq, 2 dq, ... . Along a ray the points
 * alpha * zhat_r (zhat_r on the first isoquant) show the scale properties:
 *   homogeneous of degree k:  phi(alpha zhat_r) = alpha^k dq on every ray;
 *   homothetic:               phi(alpha zhat_r) is the same function of alpha on every ray;
 *   neither:                  it differs from ray to ray, and so does the MRTS along the ray.
 * The page can also draw the isoquants through zhat = (1, 1), 2 zhat, 3 zhat, ...: for a homothetic
 * technology these curves depend only on g, and F only sets the output on each of them.
 *
 * Works in the browser (window.HomModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const TM = root.TechModel || (typeof require === 'function' ? require('../shared/technology-model.js') : null);

  // The technology for the class chosen on the page.
  function tech(st) {
    if (st.cls === 'neither') return { form: 'quasilinear', a: st.a };
    const S = { form: 'homothetic', g: st.shape, delta: st.delta, rho: st.rho };
    if (st.cls === 'homogeneous') return { ...S, F: 'power', A: 1, k: st.k };
    return st.Fh === 'log' ? { ...S, F: 'log', c: st.c } : { ...S, F: 'sshape', s: st.s };
  }

  // Output levels j * dq, j = 1..n, that the technology can reach.
  function levels(S, dq, n) {
    const out = [], top = TM.maxOutput(S);
    for (let j = 1; j <= n; j++) if (j * dq < top * (1 - 1e-9)) out.push(j * dq);
    return out;
  }

  // Along the ray with intensity r, from the point on the first isoquant: alpha, q, MRTS, e.
  function alongRay(r, S, dq, alphas) {
    const z0 = TM.pointOnRay(r, dq, S);
    if (!z0) return [];
    return alphas.map(a => {
      const z = [a * z0[0], a * z0[1]];
      return { alpha: a, z, q: TM.phi(z, S), mrts: TM.mrts(z, S), e: TM.scaleElasticity(z, S) };
    });
  }

  // A short segment through p with slope -m (the tangent of the isoquant), of length len.
  function tangentSegment(p, m, len) {
    const n = Math.hypot(1, m), h = len / 2;
    return [[p[0] - h / n, p[1] + h * m / n], [p[0] + h / n, p[1] - h * m / n]];
  }

  // The largest relative change of the MRTS along a ray over alpha in [1, amax] (0 for homothetic technologies).
  function mrtsDrift(r, S, dq, amax = 3) {
    const pts = alongRay(r, S, dq, [1, 1.5, 2, 2.5, amax]);
    if (!pts.length) return NaN;
    const m0 = pts[0].mrts;
    return Math.max(...pts.map(p => Math.abs(p.mrts - m0) / m0));
  }

  // The multiples alpha = step, 2 step, ... (alpha < R) of zhat = (1, 1) whose isoquants are drawn, at most about ten.
  function scaleSteps(R) {
    const step = Math.max(1, Math.ceil(R / 10)), out = [];
    for (let a = step; a < R * (1 - 1e-9); a += step) out.push(a);
    return out;
  }

  // Output at alpha * zhat, its ratio to the output at zhat, and log_alpha of that ratio
  // (the degree k for every alpha if the technology is homogeneous).
  function scaleTable(S, zhat, alphas) {
    const q0 = TM.phi(zhat, S);
    return alphas.map(a => {
      const q = TM.phi([a * zhat[0], a * zhat[1]], S), ratio = q / q0;
      return { alpha: a, q, ratio, k: a === 1 ? NaN : Math.log(ratio) / Math.log(a) };
    });
  }

  const api = { tech, levels, alongRay, tangentSegment, mrtsDrift, scaleSteps, scaleTable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HomModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
