/*
 * Substitution or Composition?: interface and plotting (lecture 4, Arnberg and Bjørner 2007).
 */
(function () {
  'use strict';

  const CM = window.CompositionModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  const state = { wE: 1, eta: CM.NOTES_ETA, econ: true };   // exactly the notes' value, so 10/10 -> 5/15
  const WK = 1, L = 40;
  let ctrls = {}, timer = null;
  const schedule = U.scheduler(render);
  const f1 = v => fmt(v, 1), f2 = v => fmt(v, 2);

  function drawSpace(th) {
    const e = CM.economy(state.wE, WK, state.eta), e0 = CM.economy(1, WK, state.eta);
    const cE = th.orange, cK = th.accent4 || '#8e44ad';
    const lshape = (b, k) => [[b[0], L], [b[0], b[1]], [L, b[1]]].map(p => [p[0], p[1]]);   // isoquant through b (corner at b)
    const traces = [
      U.line2([[0, 0], [L, L / 2]], cE, 1.2, 'ray of the energy-intensive firm (K = E/2)', 'dot'),
      U.line2([[0, 0], [L / 2, L]], cK, 1.2, 'ray of the capital-intensive firm (K = 2E)', 'dot'),
      U.line2(lshape(e.firmE), cE, 1.2, 'isoquant'),
      U.line2(lshape(e.firmK), cK, 1.2, 'isoquant'),
      // The parallelogram: aggregate = vector sum.
      U.line2([[0, 0], e.firmE, [e.E, e.K], e.firmK, [0, 0]], th.grid, 1, 'vector sum', 'dash'),
      U.line2([[0, 0], [e.E * 1.25, e.K * 1.25]], th.ink, 1.8, 'aggregate ray'),
      U.dot2([e0.firmE, e0.firmK, [e0.E, e0.K]], th.muted, 'at w_E = 1', 9, { marker: { color: th.panel, size: 9, line: { color: th.muted, width: 1.5 } } }),
      U.dot2([e.firmE], cE, 'energy-intensive firm', 12),
      U.dot2([e.firmK], cK, 'capital-intensive firm', 12),
      U.dot2([[e.E, e.K]], th.ink, 'aggregate (E, K)', 13)
    ];
    // Arrows and labels move with w_E, so they are traces: an animation frame then only moves points.
    traces.push(U.arrow2(e0.firmE, e.firmE, cE, 2, 0.5), U.arrow2(e0.firmK, e.firmK, cK, 2, 0.5), U.arrow2([e0.E, e0.K], [e.E, e.K], th.ink, 2, 0.5));
    // Labels in the free quadrant next to each corner (the isoquant runs right and up from it).
    // Each label turns to the left near the right edge; the capital-intensive one also when the aggregate is close by.
    const side = x => (x > 0.55 * L ? 'left' : 'right'), pad = (t, x) => (side(x) === 'left' ? `${t}  ` : `  ${t}`);
    const kSide = e.E > e.firmK[0] && Math.abs(e.K - e.firmK[1]) < 0.15 * L ? 'left' : side(e.firmK[0]);
    traces.push(U.text2(e.firmE, pad(`energy-intensive (${f1(e.firmE[0])}, ${f1(e.firmE[1])})`, e.firmE[0]), cE, 'bottom ' + side(e.firmE[0])));
    traces.push(U.text2(e.firmK, kSide === 'left' ? `capital-intensive (${f1(e.firmK[0])}, ${f1(e.firmK[1])})  ` : `  capital-intensive (${f1(e.firmK[0])}, ${f1(e.firmK[1])})`, cK, 'top ' + kSide));
    traces.push(U.text2([e.E, e.K], pad(` aggregate (${f1(e.E)}, ${f1(e.K)})`, e.E), th.ink, 'bottom ' + side(e.E)));
    U.plot('plot', traces, U.base2d(th, { xt: 'Energy E', yt: 'Capital K', x: { range: [0, L], constrain: 'domain' }, y: { range: [0, L], scaleanchor: 'x', constrain: 'domain' }, margin: { l: 48, r: 12, t: 8, b: 44 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('cap').innerHTML = `Open circles: ${texStr('w_E=w_K=1')}, both firms produce 10, total ${texStr('(E,K)=(30,30)')}. Now ${texStr(`w_E=${f2(state.wE)}`)}: the firms produce ${f1(e.qE)} and ${f1(e.qK)} and the total is ${texStr(`(${f1(e.E)},${f1(e.K)})`)}. Each firm's input ratio ${texStr('K/E')} is fixed (½ and 2)${Math.abs(e.K / e.E - 1) < 5e-3 ? `, and so is the aggregate ${texStr('K/E')} = 1 while both firms produce the same. Raise ${texStr('w_E')} to see it move.` : `, yet the aggregate ${texStr('K/E')} moved from 1 to ${f2(e.K / e.E)}.`}`;
    return e;
  }

  function drawShares(th, e) {
    const cE = th.orange, cK = th.accent4 || '#8e44ad';
    const traces = [
      { type: 'bar', orientation: 'h', y: ['output'], x: [e.qE], name: 'energy-intensive', marker: { color: cE }, text: [f1(e.qE)], textposition: 'inside', insidetextanchor: 'middle', hoverinfo: 'skip' },
      { type: 'bar', orientation: 'h', y: ['output'], x: [e.qK], name: 'capital-intensive', marker: { color: cK }, text: [f1(e.qK)], textposition: 'inside', insidetextanchor: 'middle', hoverinfo: 'skip' }
    ];
    const lay = U.base2d(th, { xt: 'output (total 20)', x: { range: [0, 20] }, y: { visible: false }, margin: { l: 10, r: 10, t: 4, b: 40 } });
    U.plot('plotB', traces, { ...lay, barmode: 'stack', showlegend: true, legend: { orientation: 'h', traceorder: 'normal', x: 0, y: 1.02, yanchor: 'bottom', font: { color: th.ink } }, margin: { l: 10, r: 10, t: 28, b: 40 } }, { ...U.PLOT_CONFIG, displayModeBar: false });
    $('costs').innerHTML = `<dt>${texStr('c^E=2w_E+w_K')}</dt><dd>${f2(e.cE)}</dd><dt>${texStr('c^K=w_E+2w_K')}</dt><dd>${f2(e.cK)}</dd>`;
  }

  function drawEcon(th) {
    $('econPanel').hidden = !state.econ;
    if (!state.econ) return;
    const ws = U.logspace(0.5, 3, 11), r = CM.regression(ws, WK, state.eta), x = r.pts.map(p => p[0]);
    const xs = [Math.min(...x), Math.max(...x)];
    const cE = th.orange, cK = th.accent4 || '#8e44ad';
    const traces = [
      U.dot2(r.pts, th.ink, 'aggregate data', 8),
      U.line2(xs.map(v => [v, r.intercept + r.slope * v]), th.ink, 2, `fitted line, slope ${f2(r.slope)}`),
      U.line2(xs.map(v => [v, Math.log(2)]), cK, 2, 'capital-intensive firm: slope 0'),
      U.line2(xs.map(v => [v, Math.log(0.5)]), cE, 2, 'energy-intensive firm: slope 0')
    ];
    const s = CM.apparentSigma(state.wE, WK, state.eta);
    U.plot('plotC', traces, U.base2d(th, { xt: 'log(w<sub>E</sub>/w<sub>K</sub>)', yt: 'log(K/E)', y: { range: [-1, 1] }, annotations: [
      { x: xs[1], y: Math.log(2), text: 'capital-intensive firm', showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { size: 11, color: cK } },
      { x: xs[1], y: Math.log(0.5), text: 'energy-intensive firm', showarrow: false, xanchor: 'right', yanchor: 'top', font: { size: 11, color: cE } }
    ] }), U.PLOT_CONFIG);
    $('capC').innerHTML = `Aggregate data: the regression of ${texStr('\\log(K/E)')} on ${texStr('\\log(w_E/w_K)')} gives ${texStr(`\\hat\\sigma=${f2(r.slope)}>0`)} (at the current price the slope is ${f2(s)}). Within each firm: ${texStr('\\sigma=0')}. That is why the study uses variation within firms over time.`;
  }

  function render() {
    const th = U.theme();
    let e = null;
    guard('input space', () => { e = drawSpace(th); });
    if (e) guard('shares', () => drawShares(th, e));
    guard('econometrics', () => drawEcon(th));
  }

  function notesExample() {
    if (timer) cancelAnimationFrame(timer);
    ctrls.eta.setExact(CM.NOTES_ETA);
    const t0 = performance.now(), dur = 1600;
    const step = now => { const t = Math.max(0, Math.min(1, (now - t0) / dur)); state.wE = 1 + t; ctrls.wE.sync(); render(); if (t < 1) timer = requestAnimationFrame(step); };
    timer = requestAnimationFrame(step);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('notes').addEventListener('click', notesExample);
    $('econ').addEventListener('change', ev => { state.econ = ev.target.checked; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'model.js')) guard('page', init);
})();
