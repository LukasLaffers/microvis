/*
 * One step vs two steps: the direct numerical search for (PM), max_z p phi(z) - w.z.
 *
 * Deliberately knows nothing about cost functions: it only evaluates the objective.
 * The search runs in polar coordinates, z = r (cos t, sin t): the angle t is the input mix and
 * r the size of the bundle. Kinks and ridges of the objective (Leontief) lie along rays from the
 * origin, i.e. along lines of constant t, so a grid in (t, r) follows them exactly.
 * A 120 x 120 grid finds the best region; then a fine grid around the best point moves with it
 * and shrinks once the best point stops moving, until the window is tiny.
 *
 * Works in the browser (window.OneStepSearch) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const HALF_PI = Math.PI / 2;

  // Maximise f(z1, z2) over z >= 0 with |z| <= sqrt(2) zmax. Returns {z: [z1, z2], value}.
  function maximise(f, zmax, opts = {}) {
    const N = opts.grid || 120, rounds = opts.rounds || 30, M = 16, R = Math.SQRT2 * zmax;
    const at = (t, r) => [r * Math.cos(t), r * Math.sin(t)];
    let best = f(0, 0), bt = 0, br = 0;
    for (let i = 0; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        const t = HALF_PI * i / N, r = R * j / N, [a, b] = at(t, r), v = f(a, b);
        if (v > best) { best = v; bt = t; br = r; }
      }
    }
    let ht = 2 * HALF_PI / N, hr = 2 * R / N; // half-widths of the window: two grid cells
    for (let it = 0, shrinks = 0; it < 600 && shrinks < rounds; it++) {
      const ct = bt, cr = br;
      for (let i = 0; i <= M; i++) {
        for (let j = 0; j <= M; j++) {
          const t = Math.min(HALF_PI, Math.max(0, ct - ht + 2 * ht * i / M));
          const r = Math.max(0, cr - hr + 2 * hr * j / M), [a, b] = at(t, r), v = f(a, b);
          if (v > best) { best = v; bt = t; br = r; }
        }
      }
      if (Math.abs(bt - ct) < ht / 2 && Math.abs(br - cr) < hr / 2) { ht /= 3; hr /= 3; shrinks++; }
    }
    const z = br === 0 ? [0, 0] : at(bt, br);
    return { z: [Math.max(0, z[0]), Math.max(0, z[1])], value: best };
  }

  const api = { maximise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OneStepSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
