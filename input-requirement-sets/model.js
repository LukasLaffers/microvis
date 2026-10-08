/*
 * Input requirement sets: model.
 *
 * Z(q) = { z : phi(z) >= q } and its boundary, the isoquant I(q) = { z : phi(z) = q }.
 * Each preset is a production function phi(z1, z2) chosen to show which of the assumptions
 * of the lecture notes (free disposal, convexity, constant returns to scale) hold.
 *
 * Works in the browser (window.InputSetsModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  /*
   * Activity analysis: each activity a = (a1, a2) produces one unit of output.
   * With mixing (divisibility) and constant returns, the most output from z is the LP
   *   max sum t_j  s.t.  sum t_j a_j <= z,  t >= 0.
   * With two inputs an optimal vertex uses one activity (scaled until an input runs out) or
   * two activities with both inputs used up, so it is enough to check those candidates.
   * Without mixing, only one activity can be run (scaled up or down): an L-shaped set per activity.
   */
  function activityOutput(z1, z2, acts, mix) {
    let best = 0;
    for (const a of acts) best = Math.max(best, Math.min(z1 / a[0], z2 / a[1]));
    if (!mix) return best;
    for (let i = 0; i < acts.length; i++) {
      for (let j = i + 1; j < acts.length; j++) {
        const [a1, a2] = acts[i], [b1, b2] = acts[j], det = a1 * b2 - b1 * a2;
        if (Math.abs(det) < 1e-12) continue;
        const ti = (z1 * b2 - b1 * z2) / det, tj = (a1 * z2 - z1 * a2) / det;
        if (ti >= -1e-12 && tj >= -1e-12) best = Math.max(best, ti + tj);
      }
    }
    return best;
  }

  // Activities that are not dominated (no other activity uses at most as much of both inputs), sorted by z1.
  function efficientActivities(acts) {
    return acts
      .filter(a => !acts.some(b => b !== a && b[0] <= a[0] && b[1] <= a[1] && (b[0] < a[0] || b[1] < a[1])))
      .slice().sort((a, b) => a[0] - b[0]);
  }

  /*
   * Exact isoquant I(q) of an activity technology inside the box [0, box]^2, as a polyline:
   * with mixing the lower-left convex hull of the activities, without mixing a staircase.
   */
  function activityFrontier(acts, mix, q, box) {
    let pts = efficientActivities(acts).map(a => [q * a[0], q * a[1]]);
    if (mix) {
      // Lower convex hull of a decreasing sequence: drop points above the chord of their neighbours.
      const hull = [];
      for (const p of pts) {
        while (hull.length >= 2) {
          const [o, a] = [hull[hull.length - 2], hull[hull.length - 1]];
          const cross = (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]);
          if (cross <= 0) hull.pop(); else break;
        }
        hull.push(p);
      }
      pts = hull;
    }
    const line = [[pts[0][0], box], pts[0]];
    for (let k = 1; k < pts.length; k++) {
      if (!mix) line.push([pts[k][0], pts[k - 1][1]]);
      line.push(pts[k]);
    }
    line.push([box, pts[pts.length - 1][1]]);
    return line;
  }

  const sqrt = Math.sqrt, pow = Math.pow;

  // Presets: phi, default output level, plot box, default points z and z', and which assumptions hold.
  const PRESETS = {
    smooth: {
      label: 'Smooth and convex',
      phi: (a, b) => sqrt(a * b),
      q: 2, box: 6, z: [1.3, 4.6], zp: [4.4, 1.5],
      props: { freeDisposal: true, convex: true, crs: true },
      formula: '\\phi(z)=\\sqrt{z_1 z_2}'
    },
    activities: {
      label: 'Kinked: a few activities',
      acts: [[0.4, 3.0], [0.9, 1.7], [2.6, 0.55], [3.6, 0.4]],
      q: 2, box: 8, z: [1.2, 6.5], zp: [6.5, 1.3],
      props: { freeDisposal: true, convex: true, crs: true },
      formula: '\\text{four activities}'
    },
    nonconvex: {
      label: 'Not convex',
      phi: (a, b) => Math.max(pow(a, 0.75) * pow(b, 0.25), pow(a, 0.25) * pow(b, 0.75)),
      q: 2, box: 6, z: [1.4, 2.3], zp: [2.3, 1.4],
      props: { freeDisposal: true, convex: false, crs: true },
      formula: '\\phi(z)=\\max\\{z_1^{3/4}z_2^{1/4},\\ z_1^{1/4}z_2^{3/4}\\}'
    },
    leontief: {
      label: 'Leontief (fixed proportions)',
      phi: (a, b) => Math.min(a, b),
      q: 2, box: 6, z: [2.4, 4.8], zp: [4.8, 2.4],
      props: { freeDisposal: true, convex: true, crs: true },
      formula: '\\phi(z)=\\min\\{z_1,\\ z_2\\}'
    },
    congestion: {
      label: 'Congestion: no free disposal',
      phi: (a, b) => 4 * sqrt(a * b) * Math.exp(-(a + b) / 4),
      q: 2, box: 8, z: [1.2, 2.6], zp: [3.4, 1.4],
      props: { freeDisposal: false, convex: true, crs: false },
      formula: '\\phi(z)=4\\sqrt{z_1z_2}\\,e^{-(z_1+z_2)/4}'
    },
    exercise: {
      label: 'Exercise 1 of the notes',
      acts: [[0.2, 0.5], [0.3, 0.2], [0.5, 0.1]],
      extra: [0.25, 0.5], // z^4
      q: 1, box: 1.2, z: [0.35, 0.85], zp: [0.9, 0.3],
      props: { freeDisposal: true, convex: true, crs: true }, // convex only when mixing is allowed
      formula: '\\phi(z^1)=\\phi(z^2)=\\phi(z^3)=1'
    }
  };

  // Output phi(z) of a preset (opts.mix: may activities be mixed).
  function output(name, z1, z2, opts = {}) {
    const p = PRESETS[name];
    if (z1 < 0 || z2 < 0) return NaN;
    if (p.acts) return activityOutput(z1, z2, p.acts, opts.mix !== false);
    return p.phi(z1, z2);
  }

  // Values of phi on an n x n grid over [0, box]^2 (rows are z2, columns z1, as Plotly expects).
  function grid(name, box, n, opts) {
    const xs = Array.from({ length: n }, (_, i) => box * i / (n - 1));
    return { x: xs, y: xs, z: xs.map(b => xs.map(a => output(name, a, b, opts))) };
  }

  const EPS = 1e-9;
  const inSet = (name, q, z, opts) => output(name, z[0], z[1], opts) >= q - EPS;

  /*
   * Free disposal at z: is every z' >= z (up to the box, or a little beyond z when z lies outside it) also in Z(q)?
   * Checked on an n x n grid of the quadrant; returns {holds, witness} with a failing z' if any.
   */
  function freeDisposalAt(name, q, z, box, opts, n = 40) {
    const top = [Math.max(box, 1.5 * z[0]), Math.max(box, 1.5 * z[1])];   // never below z: the quadrant points up and right
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const w = [z[0] + (top[0] - z[0]) * i / n, z[1] + (top[1] - z[1]) * j / n];
        if (!inSet(name, q, w, opts)) return { holds: false, witness: w };
      }
    }
    return { holds: true, witness: null };
  }

  /*
   * Convexity along the segment from z to z': is lambda z + (1 - lambda) z' in Z(q) for all lambda?
   * Returns {holds, witness, lambda} with the first failing point.
   */
  function segmentInSet(name, q, z, zp, opts, n = 400) {
    for (let k = 0; k <= n; k++) {
      const l = k / n, w = [l * z[0] + (1 - l) * zp[0], l * z[1] + (1 - l) * zp[1]];
      if (!inSet(name, q, w, opts)) return { holds: false, witness: w, lambda: l };
    }
    return { holds: true, witness: null, lambda: null };
  }

  // Constant returns along the ray through z: phi(t z) / phi(z) against t.
  function scaleRatio(name, z, t, opts) {
    const base = output(name, z[0], z[1], opts);
    return base > 0 ? output(name, t * z[0], t * z[1], opts) / base : NaN;
  }

  const api = {
    PRESETS, activityOutput, efficientActivities, activityFrontier, output, grid,
    inSet, freeDisposalAt, segmentInSet, scaleRatio
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InputSetsModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
