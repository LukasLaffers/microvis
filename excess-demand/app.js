/*
 * Excess Demand and Equilibrium: interface and plotting (lecture 9). The economy is in model.js.
 */
(function () {
  'use strict';

  const X = window.ExcessModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const DEFAULTS = { ...X.ASSIGNMENT, p1: 0.55, p2: 2.2, lam: 1 };
  const state = { ...DEFAULTS };
  const par = () => ({ rhoA: state.rhoA, rhoB: state.rhoB, alpha: state.alpha, beta: state.beta });
  const prices = () => [state.lam * state.p1, state.lam * state.p2, state.lam];

  let ctrls = {};
  const schedule = U.scheduler(render);

  // ---------- what depends only on the economy: equilibrium, view, curves where each market clears ----------

  let cache = { key: '' }, eqCache = { key: '' };
  function economyView() {
    const pr = par(), ek = JSON.stringify(pr);
    if (eqCache.key !== ek) eqCache = { key: ek, eq: X.equilibrium(pr) };
    const eq = eqCache.eq;
    // The view: around the equilibrium, and wide enough for the current prices (in steps of 0.5, so that it does not
    // jump with every move of a slider; the curves are recomputed only when the view changes).
    const up = v => Math.ceil(v / 0.5) * 0.5;
    const xmax = Math.max(1.2, 2.6 * eq.p[0], up(1.1 * state.p1)), ymax = Math.max(1.2, 2.2 * eq.p[1], up(1.1 * state.p2));
    const key = JSON.stringify([pr, xmax, ymax]);
    if (cache.key === key) return cache;
    const n = 80, xs = [], ys = [];
    for (let i = 0; i < n; i++) { xs.push(xmax * (0.02 + 0.98 * i / (n - 1))); ys.push(ymax * (0.02 + 0.98 * i / (n - 1))); }
    const Z = [[], [], []];
    ys.forEach(b => { const rows = [[], [], []]; xs.forEach(a => { const E = X.excess([a, b, 1], pr); for (let k = 0; k < 3; k++) rows[k].push(E[k]); }); for (let k = 0; k < 3; k++) Z[k].push(rows[k]); });
    cache = { key, eq, xmax, ymax, xs, ys, Z };
    return cache;
  }

  // ---------- main plot ----------

  // The curves are drawn by Plotly only when the economy, the view or the theme changes (Plotly.react, not U.plot: with
  // Plotly.animate the contour traces disappear); the current prices move on the fast overlay layer.
  function drawMain(th, V, e) {
    const gd = $('plot'), key = V.key + JSON.stringify(th);
    if (gd._staticKey !== key) { drawCurves(th, V); gd._staticKey = key; }
    U.overlay(gd, [U.dot2([[state.p1, state.p2]], th.orange, 'current prices (drag it)', 15)], th.font);
  }
  function drawCurves(th, V) {
    const traces = [];
    const curve = (k, color, dash, name) => ({
      type: 'contour', x: V.xs, y: V.ys, z: V.Z[k], name, showscale: false, hoverinfo: 'skip',
      contours: { start: 0, end: 0, size: 1, coloring: 'none' }, line: { color, width: k === 2 ? 2 : 3, dash }
    });
    traces.push(curve(0, th.blue, 'solid', 'E₁ = 0'), curve(1, th.red, 'solid', 'E₂ = 0'), curve(2, th.ink, 'dot', 'E₃ = 0'));
    traces.push(U.dot2([[V.eq.p[0], V.eq.p[1]]], th.ink, 'equilibrium', 13));
    const annotations = [];
    // Label the three curves near the edge of the view.
    const lab = (k, color, text) => {
      const Z = V.Z[k], n = V.xs.length;
      for (let i = n - 3; i > n / 2; i--) for (let j = 1; j < n; j++) {
        if (Z[j - 1][i] * Z[j][i] <= 0) {
          const nearTop = V.ys[j] > 0.9 * V.ymax;
          annotations.push({ x: V.xs[i], y: V.ys[j], text, showarrow: false, xanchor: nearTop ? 'left' : 'right', yanchor: nearTop ? 'top' : 'bottom', xshift: nearTop ? 6 : 0, font: { size: 13, color }, bgcolor: th.panel });
          return;
        }
      }
    };
    lab(0, th.blue, 'E<sub>1</sub> = 0'); lab(1, th.red, 'E<sub>2</sub> = 0'); lab(2, th.ink, 'E<sub>3</sub> = 0');
    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'p<sub>1</sub> / p<sub>3</sub>', yt: 'p<sub>2</sub> / p<sub>3</sub>',
      x: { range: [0, V.xmax] }, y: { range: [0, V.ymax] }, annotations
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  // ---------- the three markets ----------

  function drawMarkets(th, e) {
    const g = ['good 1', 'good 2', 'good 3'];
    const bar = (name, color, items) => {
      const c = [[], []], y = [];
      items.forEach(([good, side, v]) => { c[0].push(g[good]); c[1].push(side); y.push(v); });
      return { type: 'bar', x: c, y, name, marker: { color }, hovertemplate: `${name}: %{y:.3f}<extra></extra>` };
    };
    const order = { type: 'bar', x: [[g[0], g[0], g[1], g[1], g[2], g[2]], ['demand', 'supply', 'demand', 'supply', 'demand', 'supply']], y: [0, 0, 0, 0, 0, 0], showlegend: false, hoverinfo: 'skip' };
    const traces = [order,
      bar('Alpha', th.ink, [[0, 'demand', e.xa[0]], [2, 'demand', e.xa[2]]]),
      bar('Beta', th.muted, [[1, 'demand', e.xb[1]], [2, 'demand', e.xb[2]]]),
      bar('firms, as inputs', th.grey, [[0, 'demand', e.A.z[0] + e.B.z[0]], [1, 'demand', e.A.z[1] + e.B.z[1]]]),
      bar('endowments', th.line, [[0, 'supply', 1], [1, 'supply', 1], [2, 'supply', 2]]),
      bar('firms, output', th.orange, [[2, 'supply', e.A.q + e.B.q]])
    ];
    const colors = [th.blue, th.red, th.ink];
    const top = Math.max(...e.demand, ...e.supply);
    const annotations = [0, 1, 2].map(i => ({
      x: [g[i], 'demand'], y: Math.max(e.demand[i], e.supply[i]), xref: 'x', yref: 'y', xshift: 22, text: `E<sub>${i + 1}</sub> = ${fmt(e.E[i])}`,
      showarrow: false, yanchor: 'bottom', yshift: 4, font: { size: 12, color: colors[i] }
    }));
    Plotly.react('plotM', traces, {
      ...U.base2d(th, { yt: 'units', y: { range: [0, 1.25 * top] }, annotations, margin: { l: 44, r: 8, t: 8, b: 74 } }),
      barmode: 'stack', showlegend: true, legend: { orientation: 'h', y: -0.32, x: 0, font: { size: 11, color: th.ink } },
      xaxis: { type: 'multicategory', color: th.muted, tickfont: { color: th.muted, size: 11 }, tickangle: 0, fixedrange: true, linecolor: th.line }
    }, { ...U.PLOT_CONFIG, displayModeBar: false });
    const word = i => Math.abs(e.E[i]) < 5e-3 ? 'the market clears' : e.E[i] > 0 ? 'excess demand' : 'excess supply';
    $('capM').innerHTML = `Demand (consumers and firms' inputs) next to supply (endowments and firms' output). Good 1: ${word(0)}. Good 2: ${word(1)}. Good 3: ${word(2)}.`;
  }

  function drawWalras(th, e) {
    const v = e.E.map((x, i) => e.p[i] * x), sum = v[0] + v[1] + v[2], m = Math.max(0.05, ...v.map(Math.abs)) * 1.25;
    Plotly.react('plotW', [{
      type: 'bar', orientation: 'h', y: ['p<sub>3</sub>E<sub>3</sub>', 'p<sub>2</sub>E<sub>2</sub>', 'p<sub>1</sub>E<sub>1</sub>'], x: [v[2], v[1], v[0]],
      marker: { color: [th.ink, th.red, th.blue] }, hovertemplate: '%{x:.4f}<extra></extra>'
    }], U.base2d(th, {
      x: { range: [-m, m], zeroline: true, zerolinecolor: th.ink, zerolinewidth: 1.5 }, margin: { l: 52, r: 10, t: 22, b: 26 },
      annotations: [{ xref: 'paper', yref: 'paper', x: 1, y: 1.12, xanchor: 'right', showarrow: false, text: `sum = ${fmt(Math.abs(sum) < 5e-10 ? 0 : sum, 2)}`, font: { size: 12, color: th.ink } }]
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  function renderNumbers(V, e) {
    const p = e.p, eq = V.eq, f3 = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3), f2 = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 2);
    $('nums').innerHTML = [
      ['p', `(${f3(p[0])}, ${f3(p[1])}, ${f3(p[2])})`],
      ['E(p)', `(${f2(e.E[0])}, ${f2(e.E[1])}, ${f2(e.E[2])})`],
      ['y^\\alpha,\\ y^\\beta', `${f2(e.yA)}, ${f2(e.yB)}`],
      ['\\Pi_A,\\ \\Pi_B', `${f2(e.A.profit)}, ${f2(e.B.profit)}`],
      ['p^\\ast\\ (p_3=1)', `(${f3(eq.p[0])}, ${f3(eq.p[1])}, 1)`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const walras = e.p.reduce((s, pi, i) => s + pi * e.E[i], 0);
    const e1 = X.excess([state.p1, state.p2, 1], par());
    const homog = e1.every((v, i) => Math.abs(v - e.E[i]) < 1e-9 * Math.max(1, Math.abs(v)));
    const item = (ok, html, def) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span><span class="def">${def}</span></li>`;
    $('checks').innerHTML =
      item(Math.abs(walras) < 1e-9, `Walras' law: ${texStr(`\\textstyle\\sum_i p_iE_i(p)=${f2(walras)}`)}`, 'at these prices, which need not be equilibrium prices.') +
      item(homog, `Homogeneity: ${texStr('E(\\lambda p)=E(p)')}`, state.lam === 1 ? 'Move λ to multiply all prices: excess demand stays the same.' : `All prices multiplied by ${fmt(state.lam)}: the same excess demand as with λ = 1.`);
  }

  // ---------- render ----------

  function render() {
    const th = U.theme(), V = economyView(), e = X.economy(prices(), par());
    tex($('formula'), '\\begin{aligned}&\\phi_f(z)=\\big(z_1^{\\rho_f}+z_2^{\\rho_f}\\big)^{1/(2\\rho_f)},\\ f=A,B\\\\&U^\\alpha=x_1^{\\alpha}x_3^{1-\\alpha},\\ R^\\alpha=(0,1,1)\\\\&U^\\beta=x_2^{\\beta}x_3^{1-\\beta},\\ R^\\beta=(1,0,1)\\end{aligned}', true);
    guard('price plane', () => drawMain(th, V, e));
    guard('markets', () => drawMarkets(th, e));
    guard("Walras' law", () => drawWalras(th, e));
    guard('numbers', () => renderNumbers(V, e));
  }

  function init() {
    U.renderStaticTex();
    // rho = 0 is the Cobb-Douglas limit, where the formula is not defined: step over it.
    const adjust = (key, v) => (key === 'rhoA' || key === 'rhoB') && Math.abs(v) < 0.025 ? (v >= 0 ? 0.05 : -0.05) : v;
    ctrls = U.controls(document, state, { adjust, onChange: schedule });
    $('toEq').addEventListener('click', () => { const V = economyView(); ctrls.p1.setExact(V.eq.p[0]); ctrls.p2.setExact(V.eq.p[1]); });
    // Default values: the economy, prices and lambda as the page opens.
    $('defaults').addEventListener('click', () => { Object.entries(DEFAULTS).forEach(([k, v]) => ctrls[k].setExact(v)); });
    // Drag the current prices in the plane.
    const gd = $('plot');
    U.dragPoint(gd, {
      target: () => [state.p1, state.p2],
      move: ([x, y]) => {
        const V = economyView(), eq = V.eq.p, fl = gd._fullLayout;
        // The equilibrium is magnetic: within about 14 pixels of it, the point snaps onto it.
        const px = fl && fl.xaxis ? Math.hypot((x - eq[0]) / V.xmax * fl.xaxis._length, (y - eq[1]) / V.ymax * fl.yaxis._length) : Infinity;
        if (px < 14) { ctrls.p1.setExact(eq[0]); ctrls.p2.setExact(eq[1]); return; }
        ctrls.p1.setExact(U.clampTo(x, ctrls.p1.min, Math.min(ctrls.p1.max, V.xmax)));
        ctrls.p2.setExact(U.clampTo(y, ctrls.p2.min, Math.min(ctrls.p2.max, V.ymax)));
      }
    });
    render();
    U.watchColorScheme(() => { cache.key = ''; $('plot')._staticKey = ''; schedule(); });
  }

  if (U.librariesReady(X, 'model.js')) guard('page', init);
})();
