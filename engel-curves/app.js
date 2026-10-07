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

  const state = { panel: 'A', delta: 0.5, rho: -1, a: 0.4, g1: 3, ad1: 0.8, ad2: 0.4, hc: 2, hK: 3, p1: 1, p2: 1, y: 10, anim: null };   // anim: progress of the income animation (null when not playing)
  let ctrls = {}, memo = { key: '' }, lastNumbers = 0;
  // The expansion path and the Engel curves do not change while income moves: computed once per setting.
  function curves(u, p, lo, hi) {
    const key = JSON.stringify([u, p]);
    if (memo.key !== key) { const yAll = U.linspace(lo, hi, 80); memo = { key, yAll, path: EM.expansionPath(p, u, yAll), engel: EM.engelCurves(p, u, U.linspace(lo, hi, 120)) }; }
    return memo;
  }
  const schedule = U.scheduler(render);
  const f3 = x => fmt(Math.abs(x) < 1e-7 ? 0 : x, 3);   // rounding noise of the finite differences prints as 0
  const par = x => (x < 0 ? `(${f3(x)})` : f3(x));
  const same = (a, b) => Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => ({
    A: () => ({ type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }),
    B: () => ({ type: 'stonegeary', a: state.a, g1: state.g1, g2: 0 }),
    C: () => ({ type: 'giffen', c: 1, s: 4 }),
    D: () => ({ type: 'additive', a: state.ad1, b: state.ad2 }),
    E: () => ({ type: 'humped', c: state.hc, K: state.hK })
  })[state.panel]();

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
    const traces = [], anim = state.anim !== null;
    // While income rises: only the current budget line and indifference curve; otherwise five sample incomes.
    if (!anim) for (const yy of ys) {
      traces.push(U.line2([[yy / p[0], 0], [0, yy / p[1]]], th.grey, 1.2, `budget line, y = ${fmt(yy)}`));
      const v = CM.indirect(p, yy, u);
      traces.push(U.line2(CM.indifferenceCurve(v, u, x1s).map(([a, b]) => [a, b !== null && b <= Ly ? b : null]), th.blue, 1, 'indifference curve', 'dot'));
    }
    const { yAll, path } = curves(u, p, lo, hi);
    if (anim) {
      // the path traced so far (strong) and still ahead (faint), and the indifference curve touching the current budget line
      traces.push(U.line2(path.filter((_, i) => yAll[i] >= state.y), th.orange, 1.5, 'still ahead', 'dot'));
      traces.push(U.line2(path.filter((_, i) => yAll[i] < state.y).concat([x]), th.orange, 3.5, 'income expansion path'));
      traces.push(U.line2(CM.indifferenceCurve(CM.indirect(p, state.y, u), u, U.linspace(Lx / 400, Lx, 150)).map(([a, b]) => [a, b !== null && b <= Ly ? b : null]), th.blue, 1.8, 'indifference curve'));
    } else traces.push(U.line2(path, th.orange, 3.5, 'income expansion path'));
    traces.push(U.line2([[state.y / p[0], 0], [0, state.y / p[1]]], th.ink, 2.2, anim ? 'budget line now' : `budget line, y = ${fmt(state.y)}`));
    if (state.panel === 'E') {
      const yT = EM.turningIncome(p, u);
      if (yT > lo && yT < hi) traces.push(U.dot2([CM.demand(p, yT, u)], th.muted, 'good 1 turns inferior here', 9, { marker: { color: th.panel, size: 9, line: { color: th.ink, width: 1.5 } } }));
    }
    traces.push(U.dot2([x], th.red, 'D(p, y)', 11));
    U.plot('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, Lx] }, y: { range: [0, Ly] } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const lux = state.ad1 > state.ad2 ? 1 : 2, yT = state.panel === 'E' ? EM.turningIncome(p, u) : 0;
    const capD = Math.abs(state.ad1 - state.ad2) < 1e-9
      ? 'With a = b the utility is homothetic and the path is a ray again.'
      : `The path curves towards good ${lux}: good ${lux} (the exponent closer to 1) is a luxury and good ${3 - lux} a necessity. The income elasticities are not constant: compare them at a low and a high income.`;
    const capE = `Good 1 is normal while she has less than ${texStr(`K=${fmt(state.hK)}`)} of good 2, that is up to ${texStr(`y=p_2K(1+c/2)=${fmt(yT)}`)}; beyond that the path bends back and she buys less of good 1 as income rises: good 1 becomes inferior.`;
    $('cap').innerHTML = { D: capD, E: capE, A: 'A homothetic (CES) consumer: the path is a ray from the origin. Doubling income doubles the demand for both goods (both income elasticities are 1).', B: 'Subsistence in good 1: the first ' + texStr(`p_1\\gamma_1=${fmt(p[0] * state.g1)}`) + ' of income goes on good 1, the rest is split. The path bends towards good 2: a luxury.', C: 'Good 1 is inferior: as income rises the path bends back, she buys less of good 1 and more of good 2. (The example is defined for incomes from ' + fmt(lo, 2) + ' to ' + fmt(hi, 2) + '.)' }[state.panel];
  }

  function drawEngel(th, S) {
    const { u, p, lo, hi, x } = S, c = curves(u, p, lo, hi).engel;
    // When the two Engel curves coincide (e.g. equal weights in A), draw D¹ dashed on top of D² and label them once.
    const top = Math.max(...c.map(r => Math.max(r[1], r[2]))), same = c.every(r => Math.abs(r[1] - r[2]) < 1e-3 * top);
    const end = c[c.length - 1];
    const annotations = same
      ? [{ x: end[0], y: end[1], text: 'D<sup>1</sup> = D<sup>2</sup>', showarrow: false, xanchor: 'right', yanchor: 'bottom', yshift: 4, font: { size: 13, color: th.ink } }]
      : [{ x: end[0], y: end[1], text: 'D<sup>1</sup>', showarrow: false, xanchor: 'left', xshift: 4, font: { size: 13, color: th.blue } },
         { x: end[0], y: end[2], text: 'D<sup>2</sup>', showarrow: false, xanchor: 'left', xshift: 4, font: { size: 13, color: th.red } }];
    // While income rises, the curves are drawn up to the current income (strong) and faint beyond it.
    const anim = state.anim !== null, done = c.filter(r => !anim || r[0] < state.y).concat(anim ? [[state.y, x[0], x[1]]] : []);
    const ahead = anim ? [U.line2(c.filter(r => r[0] >= state.y).map(r => [r[0], r[2]]), th.red, 1, 'D² still ahead', 'dot'), U.line2(c.filter(r => r[0] >= state.y).map(r => [r[0], r[1]]), th.blue, 1, 'D¹ still ahead', 'dot')] : [];
    U.plot('plotB', [
      ...ahead,
      U.line2(done.map(r => [r[0], r[2]]), th.red, 2.5, 'D²(p, y)'), U.line2(done.map(r => [r[0], r[1]]), th.blue, 2.5, 'D¹(p, y)', same ? 'dash' : 'solid'),
      U.dot2([[state.y, x[0]], [state.y, x[1]]], th.ink, 'now', anim ? 11 : 8)
    ], U.base2d(th, {
      xt: 'y', yt: 'demand', annotations, margin: { l: 52, r: 28, t: 8, b: 44 },
      shapes: state.panel === 'E' ? [{ type: 'line', x0: EM.turningIncome(p, u), x1: EM.turningIncome(p, u), yref: 'paper', y0: 0, y1: 1, line: { color: th.muted, width: 1, dash: 'dot' } }] : [],
      x: { range: [c[0][0], c[c.length - 1][0]] }
    }), U.PLOT_CONFIG);
    $('capB').innerHTML = `Demand for each good as income grows, prices fixed. The slope of ${texStr('\\log D^j')} in ${texStr('\\log y')} is the income elasticity ${texStr('\\eta_j')}.`;
  }

  function renderNumbers(S) {
    // finite differences of demand are slow: while income rises, the numbers are updated at most five times a second
    if (state.anim !== null && performance.now() - lastNumbers < 200) return;
    lastNumbers = performance.now();
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
    U.applyVisibility({ A: state.panel === 'A', B: state.panel === 'B', C: state.panel === 'C', D: state.panel === 'D', E: state.panel === 'E' });
    document.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.panel === state.panel)));
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('Engel curves', () => drawEngel(th, S));
    guard('numbers', () => renderNumbers(S));
  }

  // Raise y smoothly over the example's range: the budget line shifts out, the bundle traces the path and the Engel curves.
  function playIncome() {
    if (state.anim !== null) return;
    const start = performance.now(), DURATION = 5000;
    state.anim = 0; $('play-income').disabled = true;
    const step = now => {
      state.anim = Math.min(1, (now - start) / DURATION);
      const [lo, hi] = EM.incomeRange([state.p1, state.p2], pref());
      state.y = lo + (0.03 + 0.94 * state.anim) * (hi - lo); ctrls.y.sync();
      guard('animation', render);
      if (state.anim < 1) requestAnimationFrame(step);
      else { state.anim = null; $('play-income').disabled = false; render(); }
    };
    requestAnimationFrame(step);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: CU.adjustRho, onChange: schedule });
    document.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => {
      state.panel = b.dataset.panel;
      const p = [state.p1, state.p2], [lo, hi] = EM.incomeRange(p, pref());
      state.y = lo + 0.5 * (hi - lo);
      schedule();
    }));
    $('play-income').addEventListener('click', playIncome);
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (EM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
