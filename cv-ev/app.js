/*
 * CV, EV and Consumer Surplus: interface and plotting (lecture 7).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, WM = window.WelfareModel, U = window.Microvis, CU = window.ConsumerUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const GREEN = '#4caf50';
  const state = { type: 'ces', delta: 0.5, rho: -1, kappa: 6, p10: 2, p11: 1, y: 10, area: 'all' };
  // The Giffen example where good 1 is inferior but not Giffen, and demand stays interior over the plotted prices.
  const INFERIOR = { y: 3.96, p10: 1.18, p11: 0.9 };
  let ctrls = {};
  const schedule = U.scheduler(render);
  const f3 = x => fmt(x, 3);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => state.type === 'ces' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.type === 'quasilinear' ? { type: 'quasilinear', kappa: state.kappa } : { type: 'giffen', c: 1, s: 4 };
  const income = () => state.type === 'giffen' ? INFERIOR.y : state.y;

  function solve() {
    const u = pref(), y = income();
    return { u, y, b: WM.bundles(state.p10, state.p11, 1, y, u), w: WM.welfare(state.p10, state.p11, 1, y, u) };
  }

  function drawAreas(th, S) {
    const { u, y, b } = S, lo = Math.min(state.p10, state.p11), hi = Math.max(state.p10, state.p11);
    const pTop = state.type === 'giffen' ? hi * 1.15 : hi * 1.6, ps = U.linspace(state.type === 'giffen' ? lo * 0.8 : Math.max(0.3, lo * 0.5), pTop, 140), band = U.linspace(lo, hi, 60);
    const curve = f => ps.map(p1 => [f(p1), p1]);
    const D = p1 => CM.demand([p1, 1], y, u)[0], H0 = p1 => CM.hicks([p1, 1], b.v0, u)[0], H1 = p1 => CM.hicks([p1, 1], b.v1, u)[0];
    // The region between two curves (f left, g right) for p1 between the two prices; f = null means the p1 axis.
    const strip = (f, g, color) => {
      const pts = [...band.map(p1 => [f ? f(p1) : 0, p1]), ...band.slice().reverse().map(p1 => [g(p1), p1])];
      return { type: 'scatter', mode: 'lines', x: pts.map(q => q[0]), y: pts.map(q => q[1]), fill: 'toself', fillcolor: color, line: { width: 0 }, hoverinfo: 'skip' };
    };
    const RED = 'rgba(208,2,27,0.25)', GRN = 'rgba(76,175,80,0.30)', BLU = 'rgba(74,144,226,0.28)';
    const traces = [];
    if (state.area === 'CV') traces.push(strip(null, H0, RED));
    else if (state.area === 'CS') traces.push(strip(null, D, GRN));
    else if (state.area === 'EV') traces.push(strip(null, H1, BLU));
    else if (state.type === 'quasilinear') traces.push(strip(null, D, GRN));
    // All three as nested strips, the smallest area first: CV < dCS < EV (normal) or EV < dCS < CV (inferior).
    else if (state.type === 'giffen' ? state.p11 < state.p10 : state.p11 > state.p10) traces.push(strip(null, H1, BLU), strip(H1, D, GRN), strip(D, H0, RED));
    else traces.push(strip(null, H0, RED), strip(H0, D, GRN), strip(D, H1, BLU));
    traces.push(U.line2(curve(H0), th.red, 2.2, 'H¹(p₁, 1, v⁰)'), U.line2(curve(H1), th.blue, 2.2, 'H¹(p₁, 1, v¹)'), U.line2(curve(D), GREEN, 2.8, 'D¹(p₁, 1, y)'));
    traces.push(U.dot2([[b.x0[0], state.p10], [b.x1[0], state.p11]], th.ink, 'D¹ at the two prices', 9));
    const xs = [...ps.map(D), ...ps.map(H0), ...ps.map(H1)].filter(Number.isFinite);
    const shapes = [state.p10, state.p11].map(p => ({ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: p, y1: p, line: { color: th.muted, width: 1, dash: 'dot' } }));
    const annotations = [
      { x: 0, y: state.p10, text: 'p<sub>1</sub><sup>0</sup>', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { size: 13, color: th.ink } },
      { x: 0, y: state.p11, text: 'p<sub>1</sub><sup>1</sup>', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { size: 13, color: th.ink } }
    ];
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'p<sub>1</sub>', x: { range: [0, Math.max(...xs) * 1.05] }, y: { range: [0, pTop] }, shapes, annotations }), U.PLOT_CONFIG);
    $('cap').innerHTML = `<span class="c-l2-red"><span class="key"></span>${texStr('H^1(p_1,1,v^0)')}</span>, <span class="c-l2-blue"><span class="key"></span>${texStr('H^1(p_1,1,v^1)')}</span>, <span class="c-green"><span class="key"></span>${texStr('D^1(p_1,1,y)')}</span>. ` +
      `The Hicksian curves cross the Marshallian one at the old and the new price: ${texStr('D^1(p_1^0,1,y)=H^1(p_1^0,1,v^0)')} and ${texStr('D^1(p_1^1,1,y)=H^1(p_1^1,1,v^1)')}. ` +
      (state.area === 'all' && state.type !== 'quasilinear' ? 'Shaded, from the axis: the smallest measure, then the strips that the next two add. ' : '') +
      (state.type === 'quasilinear' ? 'Without an income effect on good 1 the three curves coincide.' : state.type === 'giffen' ? 'Good 1 is inferior: the Hicksian curve for the higher utility lies to the left.' : 'Good 1 is normal: the Hicksian curve for the higher utility lies to the right.');
  }

  function drawGoods(th, S) {
    const { u, y, b } = S, p0 = state.p10, p1 = state.p11;
    const Lx = 1.1 * Math.max(y / Math.min(p0, p1), (y + b.EV) / p0), Ly = 1.1 * Math.max(y, y + b.EV);
    const x1s = U.linspace(Lx / 400, Lx, 300), ic = v => CM.indifferenceCurve(v, u, x1s).map(([a, c]) => [a, c !== null && c <= Ly ? c : null]);
    const line = (m, p, color, width, name, dash) => U.line2([[m / p, 0], [0, m]], color, width, name, dash);
    const traces = [
      U.line2(ic(b.v0), th.red, 1.8, 'v⁰'), U.line2(ic(b.v1), th.blue, 1.8, 'v¹'),
      line(y, p0, th.ink, 2, 'budget before'), line(y, p1, th.ink, 2, 'budget after', 'dash'),
      line(y - b.CV, p1, th.red, 1.5, 'new prices, income y − CV', 'dot'), line(y + b.EV, p0, th.blue, 1.5, 'old prices, income y + EV', 'dot'),
      U.dot2([b.x0, b.x1], th.ink, 'chosen bundles', 8), U.dot2([b.cvBundle], th.red, '', 7), U.dot2([b.evBundle], th.blue, '', 7)
    ];
    const annotations = [
      { x: 0, y: y - b.CV, ax: 0, ay: y, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: th.red, text: '', xshift: 6 },
      { x: 0, y: y + b.EV, ax: 0, ay: y, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: th.blue, text: '', xshift: 14 },
      { x: 0, y: y - b.CV / 2, text: 'CV', showarrow: false, xanchor: 'left', xshift: 12, font: { size: 12, color: th.red } },
      { x: 0, y: y + b.EV / 2, text: 'EV', showarrow: false, xanchor: 'left', xshift: 20, font: { size: 12, color: th.blue } }
    ];
    Plotly.react('plotB', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub> (income, p<sub>2</sub> = 1)', x: { range: [0, Lx] }, y: { range: [0, Ly] }, annotations }), U.PLOT_CONFIG);
    $('capB').innerHTML = `With ${texStr('p_2=1')} the ${texStr('x_2')}-axis measures income. CV: the line with the new prices that just reaches ${texStr('v^0')} starts ${f3(Math.abs(b.CV))} ${b.CV >= 0 ? 'below' : 'above'} ${texStr('y')}. EV: the line with the old prices that just reaches ${texStr('v^1')} starts ${f3(Math.abs(b.EV))} ${b.EV >= 0 ? 'above' : 'below'} ${texStr('y')}.`;
  }

  function renderNumbers(S) {
    const { u, y, w } = S;
    $('readouts').innerHTML = [
      ['CV', `<span class="c-l2-red">${f3(w.CV)}</span>`], ['\\Delta CS', `<span class="c-green">${f3(w.dCS)}</span>`], ['EV', `<span class="c-l2-blue">${f3(w.EV)}</span>`],
      ['v^0\\to v^1', `${f3(w.v0)} → ${f3(w.v1)}`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const fall = state.p11 < state.p10;
    // The signed order holds for a fall and for a rise alike (for a rise all three are negative); only the sizes turn round.
    const le = (a, b) => a <= b + 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    const ordered = state.type === 'quasilinear' ? (same(w.CV, w.EV) && same(w.dCS, w.CV)) : state.type === 'giffen' ? le(w.EV, w.dCS) && le(w.dCS, w.CV) : le(w.CV, w.dCS) && le(w.dCS, w.EV);
    const orderTxt = state.type === 'quasilinear' ? texStr('EV=\\Delta CS=CV') + ': no income effect on good 1' : state.type === 'giffen' ? texStr('EV\\le\\Delta CS\\le CV') + ': good 1 is inferior' : texStr('CV\\le\\Delta CS\\le EV') + ': good 1 is normal';
    $('checks').innerHTML = [
      item(same(CM.indirect([state.p11, 1], y - w.CV, u), w.v0), `(CVeq) ${texStr(`V(p^1,y-CV)=v^0`)}`),
      item(same(CM.indirect([state.p10, 1], y + w.EV, u), w.v1), `(EVeq) ${texStr(`V(p^0,y+EV)=v^1`)}`),
      item(same(w.CVarea, w.CV) && same(w.EVarea, w.EV), `Areas: ${texStr(`\\int_{p_1^1}^{p_1^0}H^1(p_1,1,v^0)\\,\\mathrm dp_1=${f3(w.CVarea)}=CV`)}, ${texStr(`\\int_{p_1^1}^{p_1^0}H^1(p_1,1,v^1)\\,\\mathrm dp_1=${f3(w.EVarea)}=EV`)}`),
      item(ordered, `${orderTxt}${fall || state.type === 'quasilinear' ? '' : ' (a price rise: all three are negative, so in absolute values the order turns round)'}`)
    ].join('');
  }

  function render() {
    U.applyVisibility({ ces: state.type === 'ces', quasilinear: state.type === 'quasilinear', giffen: state.type === 'giffen' });
    document.querySelectorAll('[data-area]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.area === state.area)));
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u, state.type === 'giffen' ? `,\\ y=${INFERIOR.y}` : ''), true);
    guard('areas', () => drawAreas(th, S));
    guard('goods space', () => drawGoods(th, S));
    guard('numbers', () => renderNumbers(S));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: CU.adjustRho, onChange: schedule });
    $('type').addEventListener('change', e => {
      state.type = e.target.value;
      // The inferior example is defined only for some prices: start it where good 1 is inferior but not Giffen.
      if (state.type === 'giffen') { ctrls.p10.setRange(0.9, 1.2); ctrls.p11.setRange(0.9, 1.2); ctrls.p10.set(INFERIOR.p10); ctrls.p11.set(INFERIOR.p11); }
      else { ctrls.p10.setRange(0.5, 4); ctrls.p11.setRange(0.5, 4); }
      schedule();
    });
    document.querySelectorAll('[data-area]').forEach(b => b.addEventListener('click', () => { state.area = b.dataset.area; schedule(); }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (WM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
