/*
 * Income Expansion Paths and Engel Curves: interface and plotting (lecture 6).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, EM = window.EngelModel, U = window.Microvis, CU = window.ConsumerUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { panel: 'A', delta: 0.5, rho: -1, a: 0.4, g1: 3, p1: 1, p2: 1, y: 10 };
  let ctrls = {};
  const schedule = U.scheduler(render);
  const f3 = x => fmt(Math.abs(x) < 1e-7 ? 0 : x, 3);   // rounding noise of the finite differences prints as 0
  const par = x => (x < 0 ? `(${f3(x)})` : f3(x));
  const same = (a, b) => Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => state.panel === 'A' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.panel === 'B' ? { type: 'stonegeary', a: state.a, g1: state.g1, g2: 0 } : { type: 'giffen', c: 1, s: 4 };

  function solve() {
    const u = pref(), p = [state.p1, state.p2], [lo, hi] = EM.incomeRange(p, u);
    // The income slider follows the example's range.
    if (ctrls.y && (Math.abs(ctrls.y.min - lo) > 1e-9 || Math.abs(ctrls.y.max - hi) > 1e-9)) ctrls.y.setRange(Number(lo.toFixed(2)), Number(hi.toFixed(2)));
    if (state.y < lo || state.y > hi) { state.y = U.clampTo(state.y, lo, hi); if (ctrls.y) ctrls.y.sync(); }
    return { u, p, lo, hi, x: CM.demand(p, state.y, u) };
  }

  function draw(th, S) {
    const { u, p, lo, hi, x } = S;
    const ys = U.linspace(lo + 0.05 * (hi - lo), hi - 0.05 * (hi - lo), 5), Lx = 1.1 * hi / p[0], Ly = 1.1 * hi / p[1];
    const x1s = U.linspace(Lx / 400, Lx, 300);
    const traces = [];
    for (const yy of ys) {
      traces.push(U.line2([[yy / p[0], 0], [0, yy / p[1]]], th.grey, 1.2, `budget line, y = ${fmt(yy)}`));
      const v = CM.indirect(p, yy, u);
      traces.push(U.line2(CM.indifferenceCurve(v, u, x1s).map(([a, b]) => [a, b !== null && b <= Ly ? b : null]), th.blue, 1, 'indifference curve', 'dot'));
    }
    const path = EM.expansionPath(p, u, U.linspace(lo, hi, 80));
    traces.push(U.line2(path, th.orange, 3.5, 'income expansion path'));
    traces.push(U.line2([[state.y / p[0], 0], [0, state.y / p[1]]], th.ink, 2.2, `budget line, y = ${fmt(state.y)}`));
    traces.push(U.dot2([x], th.red, 'D(p, y)', 11));
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, Lx] }, y: { range: [0, Ly] } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('cap').innerHTML = { A: 'A homothetic (CES) consumer: the path is a ray from the origin. Doubling income doubles the demand for both goods (both income elasticities are 1).', B: 'Subsistence in good 1: the first ' + texStr(`p_1\\gamma_1=${fmt(p[0] * state.g1)}`) + ' of income goes on good 1, the rest is split. The path bends towards good 2: a luxury.', C: 'Good 1 is inferior: as income rises the path bends back, she buys less of good 1 and more of good 2. (The example is defined for incomes from ' + fmt(lo, 2) + ' to ' + fmt(hi, 2) + '.)' }[state.panel];
  }

  function drawEngel(th, S) {
    const { u, p, lo, hi, x } = S, c = EM.engelCurves(p, u, U.linspace(lo, hi, 120));
    // When the two Engel curves coincide (e.g. equal weights in A), draw D¹ dashed on top of D² and label them once.
    const top = Math.max(...c.map(r => Math.max(r[1], r[2]))), same = c.every(r => Math.abs(r[1] - r[2]) < 1e-3 * top);
    const end = c[c.length - 1];
    const annotations = same
      ? [{ x: end[0], y: end[1], text: 'D<sup>1</sup> = D<sup>2</sup>', showarrow: false, xanchor: 'right', yanchor: 'bottom', yshift: 4, font: { size: 13, color: th.ink } }]
      : [{ x: end[0], y: end[1], text: 'D<sup>1</sup>', showarrow: false, xanchor: 'left', xshift: 4, font: { size: 13, color: th.blue } },
         { x: end[0], y: end[2], text: 'D<sup>2</sup>', showarrow: false, xanchor: 'left', xshift: 4, font: { size: 13, color: th.red } }];
    Plotly.react('plotB', [
      U.line2(c.map(r => [r[0], r[2]]), th.red, 2.5, 'D²(p, y)'), U.line2(c.map(r => [r[0], r[1]]), th.blue, 2.5, 'D¹(p, y)', same ? 'dash' : 'solid'),
      U.dot2([[state.y, x[0]], [state.y, x[1]]], th.ink, 'now', 8)
    ], U.base2d(th, { xt: 'y', yt: 'demand', annotations, margin: { l: 52, r: 28, t: 8, b: 44 } }), U.PLOT_CONFIG);
    $('capB').innerHTML = `Demand for each good as income grows, prices fixed. The slope of ${texStr('\\log D^j')} in ${texStr('\\log y')} is the income elasticity ${texStr('\\eta_j')}.`;
  }

  function renderNumbers(S) {
    const c = EM.conditions(S.p, state.y, S.u), e = c.e;
    const k = j => { const t = EM.kind(e.eta[j]); return `<span class="kind ${t.replace(' ', '-')}">${t}</span>`; };
    $('table').innerHTML = `<thead><tr><th></th><th>good 1</th><th>good 2</th></tr></thead><tbody>` +
      `<tr><th>${texStr('D^j(p,y)')}</th><td>${f3(e.x[0])}</td><td>${f3(e.x[1])}</td></tr>` +
      `<tr><th>${texStr('b_j')}</th><td>${f3(e.b[0])}</td><td>${f3(e.b[1])}</td></tr>` +
      `<tr><th>${texStr('\\eta_j')}</th><td>${f3(e.eta[0])}</td><td>${f3(e.eta[1])}</td></tr>` +
      `<tr><th></th><td>${k(0)}</td><td>${k(1)}</td></tr></tbody>`;
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    $('checks').innerHTML = [
      item(same(c.engel, 1), `Engel (from M1): ${texStr(`b_1\\eta_1+b_2\\eta_2=${f3(e.b[0])}\\cdot${par(e.eta[0])}+${f3(e.b[1])}\\cdot${par(e.eta[1])}=${f3(c.engel)}`)}`),
      item(same(c.cournot[0] + 1, 1) && same(c.cournot[1] + 1, 1), `Cournot (from M1): ${texStr(`b_i+\\sum_jb_j\\varepsilon^u_{ji}=0`)} for ${texStr('i=1,2')}: ${f3(c.cournot[0])}, ${f3(c.cournot[1])}`),
      item(same(c.homogeneity[0] + 1, 1) && same(c.homogeneity[1] + 1, 1), `Homogeneity (M2): ${texStr(`\\sum_j\\varepsilon^u_{ij}+\\eta_i=0`)}: ${f3(c.homogeneity[0])}, ${f3(c.homogeneity[1])}`)
    ].join('');
  }

  function render() {
    U.applyVisibility({ A: state.panel === 'A', B: state.panel === 'B', C: state.panel === 'C' });
    document.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.panel === state.panel)));
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('Engel curves', () => drawEngel(th, S));
    guard('numbers', () => renderNumbers(S));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => {
      state.panel = b.dataset.panel;
      const p = [state.p1, state.p2], [lo, hi] = EM.incomeRange(p, pref());
      state.y = lo + 0.5 * (hi - lo);
      schedule();
    }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (EM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
