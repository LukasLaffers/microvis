/*
 * Budget Sets: interface and plotting (lecture 5, section 2.1).
 */
(function () {
  'use strict';

  const BM = window.BudgetModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { b: 'B1', X: 'all', y: 12, R1: 4, R2: 4, F: 4, p1: 2, p2: 1, p1n: 3, cap: 8, test: [3, 4] };
  const schedule = U.scheduler(render);
  const budget = () => ({ type: state.b, y: state.y, R: [state.R1, state.R2], F: state.F });
  const feasSet = () => ({ type: state.X, cap: state.cap });
  const f2 = x => fmt(x, 2);

  function axisMax() {
    const b = budget(), m = Math.max(BM.wealth([state.p1, state.p2], b), BM.wealth([state.p1n, state.p2], b), 1);
    const top = Math.max(m / Math.min(state.p1, state.p1n), m / state.p2, state.R1, state.R2, 4);
    return Math.ceil(top * 1.12);
  }

  function draw(th) {
    const b = budget(), X = feasSet(), p = [state.p1, state.p2], pn = [state.p1n, state.p2];
    const P = BM.pieces(p, b, X), Pn = BM.pieces(pn, b, X), L = axisMax();
    const traces = [], shapes = [], annotations = [];
    const grey = 'rgba(155,155,155,0.45)';
    for (const poly of P.polys) traces.push({ type: 'scatter', mode: 'lines', x: [...poly.map(v => v[0]), poly[0][0]], y: [...poly.map(v => v[1]), poly[0][1]], fill: 'toself', fillcolor: grey, line: { color: th.ink, width: 1.5 }, hoverinfo: 'skip', name: 'budget set' });
    for (const s of P.segs) traces.push(U.line2(s, th.ink, X.type === 'integer' ? 4 : 3, 'feasible'));
    // The open boundary of the tariff region at x2 = 0 (those bundles cost the fee too, but x2 = 0 avoids it).
    if (b.type === 'tariff' && b.F > 0 && X.type !== 'integer') traces.push(U.dot2([[0, 0]], th.ink, '', 1, { hoverinfo: 'skip' }));
    // Budget line after the price change (blue), and the fixed point it turns about.
    if (Math.abs(state.p1n - state.p1) > 1e-9) {
      const mPos = b.type === 'tariff' ? b.y - b.F : Pn.money;
      if (mPos > 0) traces.push(U.line2([[mPos / pn[0], 0], [0, mPos / pn[1]]], th.blue, 2.5, `budget line at p₁′ = ${f2(state.p1n)}`));
      if (b.type === 'tariff') traces.push(U.line2([[0, 0], [b.y / pn[0], 0]], th.blue, 2.5, 'x₂ = 0 at p₁′'));
      const pv = BM.pivot(p, b);
      if (pv) traces.push(U.dot2([pv], th.blue, 'stays affordable at any p₁', 11));
    }
    if (b.type === 'B2' || b.type === 'B3') {
      traces.push(U.dot2([[state.R1, state.R2]], th.ink, 'endowment R', 9));
      annotations.push({ x: state.R1, y: state.R2, text: 'R', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 14, color: th.ink } });
    }
    if (X.type === 'cap') shapes.push({ type: 'line', x0: 0, x1: L, y0: X.cap, y1: X.cap, line: { color: th.muted, width: 1.5, dash: 'dash' } });
    if (X.type === 'cap') annotations.push({ x: L, y: X.cap, text: 'x̄<sub>2</sub>', showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { size: 12, color: th.muted } });
    // Intercepts and slope as in the notes' figure.
    const ix = P.intercepts;
    if (ix.x1 > 0) annotations.push({ x: ix.x1, y: 0, text: b.type === 'B1' || b.type === 'tariff' ? 'y/p<sub>1</sub>' : 'p<sup>t</sup>R/p<sub>1</sub>', showarrow: false, yanchor: 'top', yshift: -16, font: { size: 12, color: th.ink } });
    if (ix.x2 > 0 && ix.x2 <= L) annotations.push({ x: 0, y: ix.x2, text: b.type === 'B1' ? 'y/p<sub>2</sub>' : b.type === 'tariff' ? '(y−F)/p<sub>2</sub>' : 'p<sup>t</sup>R/p<sub>2</sub>', showarrow: false, xanchor: 'left', xshift: 6, font: { size: 12, color: th.ink } });
    // The test bundle.
    const ok = BM.feasible(state.test, p, b, X);
    traces.push(U.dot2([state.test], ok ? th.inc : th.red, 'test bundle', 11, { marker: { color: ok ? th.inc : th.red, size: 11, symbol: 'x', line: { width: 0 } } }));
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, L], scaleanchor: undefined }, y: { range: [0, L] }, shapes, annotations }), { ...U.PLOT_CONFIG, displayModeBar: false });
    return { b, X, p, pn, P, Pn, ok };
  }

  function renderText(R) {
    const { b, X, p, pn, P, Pn, ok } = R, cost = p[0] * state.test[0] + p[1] * state.test[1];
    const pivot = BM.pivot(p, b);
    const changed = Math.abs(state.p1n - state.p1) > 1e-9;
    const rows = [
      ['\\text{money}', b.type === 'B1' ? texStr(`y=${f2(b.y)}`) : b.type === 'tariff' ? `${texStr(`y=${f2(b.y)}`)}, ${texStr(`y-F=${f2(b.y - b.F)}`)} if ${texStr('x_2>0')}` : `${texStr(`p^tR${b.type === 'B3' ? '+y' : ''}=${f2(P.money)}`)}${changed ? ` → ${f2(Pn.money)} at ${texStr("p_1'")}` : ''}`],
      ['\\text{slope}', `${texStr(`-p_1/p_2=-${f2(p[0] / p[1])}`)}${changed ? ` → ${texStr(`-${f2(pn[0] / pn[1])}`)}` : ''}`],
      ['\\text{intercepts}', `${texStr(`x_1=${f2(P.intercepts.x1)}`)}, ${texStr(`x_2=${f2(P.intercepts.x2)}`)}`],
      ['x=(x_1,x_2)', `${f2(state.test[0])}, ${f2(state.test[1])}: ${ok ? '<span class="ok-mark">feasible</span>' : '<span class="c-l2-red">not feasible</span>'} <span class="c-muted">(${!BM.inX(state.test, X) ? 'not in X' : `costs ${f2(cost + (b.type === 'tariff' && state.test[1] > 1e-9 ? b.F : 0))}`})</span>`]
    ];
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const convex = BM.convex(b, X);
    const items = [`<li><span class="mark ${convex ? 'ok' : 'na'}">${convex ? '✓' : '–'}</span><span>The feasible set is ${convex ? '' : '<b>not</b> '}convex${convex ? '' : (X.type === 'integer' ? ': good 2 comes in whole units' : ': the fee makes a jump at x₂ = 0')}.</span></li>`];
    if (pivot && changed) items.push(`<li><span class="mark ok">✓</span><span>After the change the blue line still passes through ${texStr(`(${f2(pivot[0])},${f2(pivot[1])})`)}: ${texStr(`p_1'\\,${f2(pivot[0])}+p_2\\,${f2(pivot[1])}=${f2(pn[0] * pivot[0] + pn[1] * pivot[1])}`)} = money ${f2(Pn.money)}.</span></li>`);
    $('checks').innerHTML = items.join('');
    const what = {
      B1: `With income ${texStr('y')}, a rise in ${texStr('p_1')} rotates the line about ${texStr('(0,\\,y/p_2)')}: the consumer can only lose.`,
      B2: `With an endowment, the consumer can always consume ${texStr('R')} itself, so the line turns about ${texStr('R')}. A rise in ${texStr('p_1')} makes the endowment of good 1 worth more: bundles with more good 2 than ${texStr('R_2')} become affordable.`,
      B3: `Income and endowment: the line turns about ${texStr('(R_1,\\,R_2+y/p_2)')}.`,
      tariff: `Good 2 costs an entrance fee ${texStr('F')} on top of ${texStr('p_2')} per unit. Buying none of it avoids the fee, so the set is the smaller triangle plus the segment on the ${texStr('x_1')}-axis: not convex.`
    }[b.type];
    $('cap').innerHTML = `<span class="c-ink">Grey: budget-feasible bundles</span>${Math.abs(state.p1n - state.p1) > 1e-9 ? `; <span class="c-l2-blue"><span class="key"></span>budget line at ${texStr(`p_1'=${f2(state.p1n)}`)}</span>` : ''}. ${what}`;
  }

  function render() {
    U.applyVisibility({ B1: state.b === 'B1', B2: state.b === 'B2', B3: state.b === 'B3', tariff: state.b === 'tariff', cap: state.X === 'cap' });
    document.querySelectorAll('[data-b]').forEach(e => e.setAttribute('aria-pressed', String(e.dataset.b === state.b)));
    document.querySelectorAll('[data-x]').forEach(e => e.setAttribute('aria-pressed', String(e.dataset.x === state.X)));
    tex($('formula'), {
      B1: `p_1x_1+p_2x_2\\le y`, B2: `p_1x_1+p_2x_2\\le p_1R_1+p_2R_2`, B3: `p_1x_1+p_2x_2\\le p_1R_1+p_2R_2+y`,
      tariff: `\\begin{cases}p_1x_1+p_2x_2+F\\le y & x_2>0\\\\ p_1x_1\\le y & x_2=0\\end{cases}`
    }[state.b], true);
    const th = U.theme();
    let R = null;
    guard('plot', () => { R = draw(th); });
    if (R) guard('numbers', () => renderText(R));
  }

  function init() {
    U.renderStaticTex();
    U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-b]').forEach(e => e.addEventListener('click', () => { state.b = e.dataset.b; schedule(); }));
    document.querySelectorAll('[data-x]').forEach(e => e.addEventListener('click', () => { state.X = e.dataset.x; schedule(); }));
    const gd = $('plot');
    gd.addEventListener('click', ev => {
      const v = U.eventToData(gd, ev);
      if (!v || v[0] < 0 || v[1] < 0) return;
      state.test = [Math.round(v[0] * 4) / 4, state.X === 'integer' ? Math.round(v[1]) : Math.round(v[1] * 4) / 4];
      schedule();
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(BM, 'model.js')) guard('page', init);
})();
