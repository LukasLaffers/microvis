/*
 * The Deadweight Loss of a Tax: interface and plotting (lecture 7).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, DM = window.DWLModel, U = window.Microvis, CU = window.ConsumerUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const GREEN = '#4caf50', YELLOW = '#f8e71c';
  const state = { type: 'ces', delta: 0.5, rho: 0.5, a: 0.4, g1: 1, kappa: 6, p10: 1, tau: 40, y: 12 };
  const schedule = U.scheduler(render);
  const f3 = x => fmt(x, 3);
  const pref = () => state.type === 'ces' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.type === 'stonegeary' ? { type: 'stonegeary', a: state.a, g1: state.g1, g2: 0 } : { type: 'quasilinear', kappa: state.kappa };

  function solve() {
    const u = pref(), p11 = state.p10 * (1 + state.tau / 100);
    return { u, p11, r: DM.tax(state.p10, p11, 1, state.y, u) };
  }

  function draw(th, S) {
    const { u, p11, r } = S, p10 = state.p10, y = state.y;
    const pTop = Math.max(p11, p10) * 1.6, ps = U.linspace(p10 * 0.4, pTop, 160);
    const D = p => CM.demand([p, 1], y, u)[0], H1 = p => CM.hicks([p, 1], r.v1, u)[0], H0 = p => CM.hicks([p, 1], r.v0, u)[0];
    const traces = [];
    if (p11 > p10) {
      const band = U.linspace(p10, p11, 60), x1 = r.x1[0];
      traces.push({ type: 'scatter', mode: 'lines', x: [0, x1, x1, 0, 0], y: [p10, p10, p11, p11, p10], fill: 'toself', fillcolor: 'rgba(248,231,28,0.65)', line: { color: '#c9a400', width: 1 }, hoverinfo: 'skip', name: 'tax revenue T' });
      const dwl = [[x1, p10], ...band.map(p => [H1(p), p]), [x1, p11]];
      traces.push({ type: 'scatter', mode: 'lines', x: dwl.map(q => q[0]), y: dwl.map(q => q[1]), fill: 'toself', fillcolor: 'rgba(74,144,226,0.35)', line: { width: 0 }, hoverinfo: 'skip', name: 'DWL' });
    }
    traces.push(U.line2(ps.map(p => [H0(p), p]), th.red, 1.5, 'H¹(p₁, 1, v⁰)', 'dot'));
    traces.push(U.line2(ps.map(p => [H1(p), p]), th.blue, 2.5, 'H¹(p₁, 1, v¹)'));
    traces.push(U.line2(ps.map(p => [D(p), p]), GREEN, 2.5, 'D¹(p₁, 1, y)'));
    traces.push(U.dot2([[r.x0[0], p10], [r.x1[0], p11]], th.ink, 'x₁⁰ and x₁¹', 9));
    const xMax = Math.max(r.x0[0], H1(p10), H0(p11)) * 1.45;
    const shapes = [p10, p11].map(p => ({ type: 'line', x0: 0, x1: xMax, y0: p, y1: p, line: { color: th.grey, width: 1, dash: 'dot' } }));
    const annotations = [
      { x: xMax, y: p10, text: `p<sub>1</sub><sup>0</sup> = ${f3(p10)}`, showarrow: false, xanchor: 'right', yanchor: 'top', font: { size: 12, color: th.muted } }
    ];
    if (p11 > p10) {
      annotations.push({ x: xMax, y: p11, text: `p<sub>1</sub><sup>1</sup> = ${f3(p11)}`, showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { size: 12, color: th.muted } });
      annotations.push({ x: r.x1[0] / 2, y: (p10 + p11) / 2, text: '<b>T</b>', showarrow: false, font: { size: 14, color: '#7a6400' } });
      const xm = (r.x1[0] + H1((p10 + p11) / 2)) / 2;
      annotations.push({ x: xm, y: p10 + 0.3 * (p11 - p10), ax: 40, ay: 46, text: '<b>DWL</b>', showarrow: true, arrowhead: 2, arrowwidth: 1.5, font: { size: 13, color: th.blue }, arrowcolor: th.blue });
    }
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'p<sub>1</sub>', x: { range: [0, xMax] }, y: { range: [0, pTop] }, annotations, shapes, margin: { l: 56, r: 12, t: 8, b: 44 } }), U.PLOT_CONFIG);
    $('cap').innerHTML = `<span class="c-green"><span class="key"></span>${texStr('D^1(p_1,1,y)')}</span>, <span class="c-l2-blue"><span class="key"></span>${texStr('H^1(p_1,1,v^1)')}</span> (utility after the tax), <span class="c-l2-red"><span class="key dot"></span></span>${texStr('H^1(p_1,1,v^0)')} dotted. ${texStr('D^1(p_1^1,1,y)=H^1(p_1^1,1,v^1)')}: the curves meet at the taxed price. <span class="c-yellow">Yellow: tax revenue</span> ${texStr(`T=${f3(r.T)}`)}; <span class="c-l2-blue">blue: deadweight loss</span> ${texStr(`DWL=${f3(r.DWL)}`)}.` +
      (state.type === 'quasilinear' ? ' Quasilinear utility has no income effect on good 1, so all three curves coincide and the deadweight loss is the familiar triangle under the demand curve.' : '');
  }

  function renderNumbers(S) {
    const { p11, r } = S, rate = (p11 - state.p10) / p11;
    $('readouts').innerHTML = [
      ['p_1^1=p_1^0(1+\\tau)', f3(p11)], ['\\frac{p_1^1-p_1^0}{p_1^1}=\\frac{\\tau}{1+\\tau}', f3(rate)],
      ['T', f3(r.T)], ['|EV|', f3(r.lossEV)], ['DWL=|EV|-T', `<b>${f3(r.DWL)}</b>`], ['\\varepsilon^c_{11}\\ \\text{at}\\ p_1^1', f3(r.epsC)]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'na'}">${ok ? '✓' : '·'}</span><span>${html}</span></li>`;
    $('checks').innerHTML = state.tau > 0 ? [
      item(r.lossEV > r.T, `${texStr(`|EV|=${f3(r.lossEV)}>T=${f3(r.T)}`)}: the consumer loses more than the government collects`),
      item(true, `Approximation ${texStr(`-\\tfrac12\\frac{\\partial H^1}{\\partial p_1}(p_1^1-p_1^0)^2=${f3(r.approx)}`)} vs exact ${f3(r.DWL)}`),
      item(true, `Per krone: ${texStr(`DWL/T=${f3(r.ratio)}`)}; approximation ${texStr(`-\\tfrac12\\varepsilon^c_{11}\\frac{p_1^1-p_1^0}{p_1^1}=${f3(r.ratioApprox)}`)}. (A 14 % VAT gives ${texStr('\\tfrac{p_1^1-p_1^0}{p_1^1}=0.123')}.)`)
    ].join('') : '<li><span class="mark na">·</span><span>No tax: no revenue, no deadweight loss.</span></li>';
  }

  function renderGroups(th) {
    const G = DM.GROUPS;
    $('groups').innerHTML = `<table class="dw"><thead><tr><th>Commodity group</th><th>${texStr('b_i')}</th><th>${texStr('\\eta_i')}</th><th>${texStr('\\varepsilon^u_{ii}')}</th><th>${texStr('\\varepsilon^c_{ii}')}</th><th>tax rate</th><th>${texStr('DWL/T')}</th><th>${texStr('-\\tfrac12\\varepsilon^c_{ii}\\cdot')}rate</th></tr></thead><tbody>` +
      G.map(g => `<tr><td>${g.name}</td><td>${g.b.toFixed(3)}</td><td>${g.eta.toFixed(2)}</td><td>${g.eu.toFixed(2)}</td><td>${g.ec.toFixed(2)}</td><td>${g.rate.toFixed(2)}</td><td>${g.dwlT.toFixed(3)}</td><td class="calc">${g.approx.toFixed(3)}</td></tr>`).join('') + '</tbody></table>';
    const order = G.slice().sort((a, b) => a.dwlT - b.dwlT);
    Plotly.react('plotG', [
      { type: 'bar', orientation: 'h', y: order.map(g => g.name), x: order.map(g => g.dwlT), marker: { color: th.blue }, name: 'reported', hovertemplate: '%{y}: %{x:.3f}<extra></extra>' },
      { type: 'scatter', mode: 'markers', y: order.map(g => g.name), x: order.map(g => g.approx), marker: { color: th.ink, size: 8, symbol: 'line-ns-open', line: { width: 2, color: th.ink } }, name: 'recomputed', hovertemplate: '%{y}: %{x:.3f}<extra></extra>' }
    ], { ...U.base2d(th, { xt: 'DWL per krone of tax', margin: { l: 190, r: 10, t: 8, b: 44 } }), yaxis: { automargin: true, tickfont: { size: 11, color: th.muted }, fixedrange: true }, showlegend: false }, { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  function render() {
    U.applyVisibility({ ces: state.type === 'ces', stonegeary: state.type === 'stonegeary', quasilinear: state.type === 'quasilinear' });
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('numbers', () => renderNumbers(S));
    guard('groups', () => renderGroups(th));
  }

  function init() {
    U.renderStaticTex();
    U.controls(document, state, { onChange: schedule });
    $('type').addEventListener('change', e => { state.type = e.target.value; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (DM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
