/*
 * Frisch's 1935 Freia chocolate data: model.
 *
 * Table (5a.8) in Frisch's study, as reproduced in the lecture notes: kilos of nut chocolate
 * q for each combination of
 *   z1 = moulding and cooling work (value in kroner) and
 *   z2 = pure cocoa fat (value in kroner).
 * Frisch calls the inputs v1, v2 and the output x.
 *
 * Everything here is discrete: marginal products are differences between neighbouring cells,
 * returns to scale are read off cells that lie on the same ray from the origin.
 *
 * Works in the browser (window.FrischModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const DATA = {
    z1: [100, 150, 200, 250],         // rows
    z2: [5, 10, 15, 20],              // columns
    q: [
      [352, 396, 402, 403],
      [500, 562, 577, 589],
      [625, 725, 760, 783],
      [738, 858, 930, 957]
    ]
  };
  const N1 = DATA.z1.length, N2 = DATA.z2.length;

  const value = (i, j) => DATA.q[i][j];

  // Bilinear interpolation inside the data rectangle (NaN outside).
  function interpolate(z1, z2) {
    const { z1: a, z2: b } = DATA;
    if (z1 < a[0] || z1 > a[N1 - 1] || z2 < b[0] || z2 > b[N2 - 1]) return NaN;
    let i = 0, j = 0;
    while (i < N1 - 2 && z1 > a[i + 1]) i++;
    while (j < N2 - 2 && z2 > b[j + 1]) j++;
    const t = (z1 - a[i]) / (a[i + 1] - a[i]), u = (z2 - b[j]) / (b[j + 1] - b[j]);
    return (1 - t) * (1 - u) * value(i, j) + t * (1 - u) * value(i + 1, j)
      + (1 - t) * u * value(i, j + 1) + t * u * value(i + 1, j + 1);
  }

  /*
   * Marginal products at cell (i, j), in kg of chocolate per extra krone of the input:
   * the backward and forward difference quotients, and their average (the central estimate)
   * where both exist.
   */
  function marginalProducts(i, j) {
    const diff = (axis) => {
      const grid = axis === 1 ? DATA.z1 : DATA.z2, k = axis === 1 ? i : j, n = grid.length;
      const at = m => axis === 1 ? value(m, j) : value(i, m);
      const back = k > 0 ? (at(k) - at(k - 1)) / (grid[k] - grid[k - 1]) : null;
      const fwd = k < n - 1 ? (at(k + 1) - at(k)) / (grid[k + 1] - grid[k]) : null;
      const est = back !== null && fwd !== null ? (back + fwd) / 2 : (back !== null ? back : fwd);
      return { back, fwd, est };
    };
    return { mp1: diff(1), mp2: diff(2) };
  }

  // MRTS_21 = phi_1 / phi_2 at cell (i, j), from the central estimates.
  function mrts(i, j) {
    const { mp1, mp2 } = marginalProducts(i, j);
    return mp2.est > 0 ? mp1.est / mp2.est : Infinity;
  }

  /*
   * Pairs of cells on the same ray from the origin: (z1', z2') = lambda (z1, z2) with lambda > 1.
   * For each: the output ratio and the arc elasticity of scale  log(q'/q) / log(lambda).
   */
  function scalePairs() {
    const out = [];
    for (let i = 0; i < N1; i++) for (let j = 0; j < N2; j++) {
      for (let i2 = 0; i2 < N1; i2++) for (let j2 = 0; j2 < N2; j2++) {
        const l1 = DATA.z1[i2] / DATA.z1[i], l2 = DATA.z2[j2] / DATA.z2[j];
        if (l1 > 1 && Math.abs(l1 - l2) < 1e-12) {
          const ratio = value(i2, j2) / value(i, j);
          out.push({ from: [i, j], to: [i2, j2], lambda: l1, ratio, e: Math.log(ratio) / Math.log(l1) });
        }
      }
    }
    return out;
  }

  // Solve a small linear system A x = b by Gaussian elimination with partial pivoting.
  function solve(A, b) {
    const n = b.length, M = A.map((row, k) => row.concat([b[k]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let sum = M[r][n];
      for (let k = r + 1; k < n; k++) sum -= M[r][k] * x[k];
      x[r] = sum / M[r][r];
    }
    return x;
  }

  /*
   * Least-squares fit of a Cobb-Douglas function q = A z1^alpha z2^beta to cells
   * (default: the whole table), by OLS of log q on 1, log z1, log z2.
   * Returns {A, alpha, beta, r2} with r2 the R-squared of the log regression.
   */
  function fitCobbDouglas(cells) {
    const rows = cells || [];
    if (!cells) for (let i = 0; i < N1; i++) for (let j = 0; j < N2; j++) rows.push([DATA.z1[i], DATA.z2[j], value(i, j)]);
    const X = rows.map(r => [1, Math.log(r[0]), Math.log(r[1])]), y = rows.map(r => Math.log(r[2]));
    const XtX = [0, 1, 2].map(a => [0, 1, 2].map(b => X.reduce((s, x) => s + x[a] * x[b], 0)));
    const Xty = [0, 1, 2].map(a => X.reduce((s, x, k) => s + x[a] * y[k], 0));
    const [c, alpha, beta] = solve(XtX, Xty);
    const mean = y.reduce((s, v) => s + v, 0) / y.length;
    const sst = y.reduce((s, v) => s + (v - mean) ** 2, 0);
    const sse = X.reduce((s, x, k) => s + (y[k] - (c + alpha * x[1] + beta * x[2])) ** 2, 0);
    return { A: Math.exp(c), alpha, beta, r2: 1 - sse / sst };
  }

  const cdOutput = (z1, z2, fit) => fit.A * Math.pow(z1, fit.alpha) * Math.pow(z2, fit.beta);

  const api = { DATA, value, interpolate, marginalProducts, mrts, scalePairs, fitCobbDouglas, cdOutput, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FrischModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
