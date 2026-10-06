/*
 * Two Elasticities: model helpers (lecture 1). Technologies are in ../shared/technology-model.js.
 *
 * Both elasticities are local: e(z) looks along the ray through z (scale), sigma(z) along the isoquant
 * through z (substitution). For the whiteboard (9 Oct) the page also transforms a technology phi into
 *   B: h(phi(z))            same isoquants, so the same MRTS and sigma, but a different e;
 *   C: phi(f(z1), g(z2))    with f(z1) = z1^b1, g(z2) = z2^b2: both sigma and e change.
 *
 * Works in the browser (window.ScaleSubModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const TM = root.TechModel || (typeof require === 'function' ? require('../shared/technology-model.js') : null);

  // The base technology A and the transformed one (B or C) from the page state.
  function techs(st) {
    const A = { form: 'homothetic', g: st.g, delta: st.delta, rho: st.rho, m: st.m, F: st.F, A: 1, k: st.k, s: st.s };
    const T = st.tr === 'B' ? { ...A, h: st.h } : st.tr === 'C' ? { ...A, b1: st.b1, b2: st.b2 } : A;
    return { A, T };
  }

  // The constant cases behind the buttons, and the default where both elasticities vary.
  const PRESETS = {
    vary: { F: 'sshape', s: 3, g: 'mix', delta: 0.5, rho: -2, m: 0.7, k: 1 },
    cd: { F: 'power', k: 1.2, g: 'cd', delta: 0.4, s: 3, rho: -1, m: 0.5 },
    ces: { F: 'power', k: 0.8, g: 'ces', delta: 0.5, rho: -1, s: 3, m: 0.5 }
  };

  // e along the ray through z: alpha, e(alpha z).
  const eAlongRay = (z, S, alphas) => alphas.map(a => [a, TM.scaleElasticity([a * z[0], a * z[1]], S)]);

  // sigma along the isoquant through z: for each factor intensity r, the point on the isoquant and sigma there.
  function sigmaAlongIsoquant(z, S, rs) {
    const q = TM.phi(z, S), out = [];
    for (const r of rs) {
      const p = TM.pointOnRay(r, q, S);
      if (p) out.push({ r, p, sigma: TM.sigma(p, S) });
    }
    return out;
  }

  // A grid of e or sigma over (0, R]^2 for the shading.
  function grid(S, R, n, what) {
    const xs = Array.from({ length: n }, (_, i) => R * (i + 0.5) / n);
    const z = xs.map(y => xs.map(x => (what === 'e' ? TM.scaleElasticity([x, y], S) : TM.sigma([x, y], S))));
    return { xs, z };
  }

  const api = { techs, PRESETS, eAlongRay, sigmaAlongIsoquant, grid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScaleSubModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
