/*
 * The Core Shrinks: interface and plotting (lecture 9).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, X = window.ExchangeModel, RM = window.ReplicaModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const OMEGA = [10, 10], GREEN = '#3d9a40', NMAX = 60;
  const state = { N: 2, s: 0.2, da: 0.6, ra: -1, db: 0.35, rb: 0.3, R1: 8, R2: 2 };
  const schedule = U.scheduler(render);
  const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
  const vec = x => `(${f2(x[0])},\\ ${f2(x[1])})`;
  const ces = (delta, rho) => ({ type: 'ces', delta, rho: Math.abs(rho) < 0.05 ? (rho < 0 ? -0.05 : 0.05) : rho });
  const economy = () => ({ ua: ces(state.da, state.ra), ub: ces(state.db, state.rb), Omega: OMEGA, Ra: [state.R1, state.R2] });

  // The profile only depends on the economy: cache it.
  let cacheKey = '', cache = null;
  function profile(e) {
    const key = JSON.stringify(e);
    if (key !== cacheKey) { cacheKey = key; cache = RM.profile(e, 300); }
    return cache;
  }

  function solve() {
    const e = economy(), P = profile(e);
    const x1 = P.core[0] + state.s * (P.core[1] - P.core[0]);
    const b = X.blockingN(e, x1), c = X.coalition(e, x1, state.N), surv = RM.surviving(P, state.N);
    return { e, P, x1, b, c, surv };
  }

  function draw(th, S) {
    const { e, P, b, c, surv } = S, traces = [], annotations = [];
    const va = CM.utility(e.Ra, e.ua), vb = CM.utility(X.Rb(e), e.ub);
    const icA = v => U.linspace(0.02, OMEGA[0], 300).map(x1 => { const x2 = CM.x2On(x1, v, e.ua, 1e3); return x2 === null ? null : [x1, x2]; }).filter(Boolean);
    const icB = v => U.linspace(0.02, OMEGA[0], 300).map(x1 => { const x2 = CM.x2On(x1, v, e.ub, 1e3); return x2 === null ? null : X.toB(e, [x1, x2]); }).filter(Boolean);
    // Lens between the status-quo curves.
    const lo = [], hi = [];
    for (const x1 of U.linspace(0.005, OMEGA[0] - 0.005, 400)) {
      const a2 = CM.x2On(x1, va, e.ua, 1e3), b2o = CM.x2On(OMEGA[0] - x1, vb, e.ub, 1e3);
      if (a2 === null || b2o === null) continue;
      if (a2 < OMEGA[1] - b2o) { lo.push([x1, a2]); hi.push([x1, OMEGA[1] - b2o]); }
    }
    if (lo.length > 1) {
      traces.push({ ...U.line2(lo, 'rgba(0,0,0,0)', 0), hoverinfo: 'skip' });
      traces.push({ ...U.line2(hi, 'rgba(0,0,0,0)', 0), fill: 'tonexty', fillcolor: th.dark ? 'rgba(76,175,80,0.14)' : 'rgba(76,175,80,0.10)', hoverinfo: 'skip' });
    }
    traces.push(U.line2(icA(va), th.blue, 1.3, 'Alf: indifference curve through R'));
    traces.push(U.line2(icB(vb), th.red, 1.3, 'Bill: indifference curve through R'));
    traces.push(U.line2(X.contractCurve(e, U.linspace(0.05, OMEGA[0] - 0.05, 200)), th.muted, 1, 'contract curve', 'dot'));
    // The core: blocked parts grey, surviving part green.
    const pts = P.xs.map(x1 => [x1, X.contractX2(e, x1)]);
    traces.push(U.line2(pts, th.grey, 7, `core of the 1-replica, blocked at N = ${state.N}`));
    traces.push(U.line2(pts.map((q, k) => surv.keep[k] ? q : [null, null]), GREEN, 7, `core of the ${state.N}-replica`));
    // The allocation y, the line R–y, the blocking point and the blocker's indifference curve through y.
    const y = b.xa;
    traces.push(U.line2([e.Ra, y], th.ink, 1.5, 'line through R and y', 'dash'));
    if (b.N < Infinity) {
      const isA = b.side === 'a', col = isA ? th.blue : th.red;
      const v = isA ? CM.utility(b.xa, e.ua) : CM.utility(b.xb, e.ub);
      traces.push(U.line2(isA ? icA(v) : icB(v), col, 2.2, `${isA ? 'Alf' : 'Bill'}: indifference curve through y`));
      const th0 = b.theta, z0 = [th0 * y[0] + (1 - th0) * e.Ra[0], th0 * y[1] + (1 - th0) * e.Ra[1]];
      traces.push(U.line2([z0, y], col, 5, `better than y for ${isA ? 'Alf' : 'Bill'}: θ > ${f3(th0)}`));
      if (c) {
        const z = [c.theta * y[0] + (1 - c.theta) * e.Ra[0], c.theta * y[1] + (1 - c.theta) * e.Ra[1]];
        traces.push(U.dot2([z], col, `θy + (1 − θ)R, θ = ${c.M}/${c.N}`, 12));
        annotations.push({ x: z[0], y: z[1], text: `θ = ${c.M}/${c.N}`, showarrow: true, ax: isA ? -40 : 40, ay: 34, arrowcolor: col, font: { size: 12, color: col } });
      }
    }
    for (const q of P.eqs) traces.push(U.dot2([q.xa], th.ink, 'competitive equilibrium', 15, { marker: { color: th.ink, size: 15, symbol: 'star', line: { color: '#ffffff', width: 1 } } }));
    traces.push(U.dot2([y], th.ink, 'allocation y', 12, { marker: { color: th.panel, size: 12, symbol: 'diamond', line: { color: th.ink, width: 2 } } }));
    traces.push(U.dot2([e.Ra], th.ink, 'endowment R', 12, { marker: { color: th.ink, size: 12, symbol: 'square', line: { color: '#ffffff', width: 1.5 } } }));
    annotations.push({ x: e.Ra[0], y: e.Ra[1], text: 'R', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 7, font: { size: 14, color: th.ink } });
    annotations.push({ x: y[0], y: y[1], text: 'y', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -7, yshift: 3, font: { size: 14, color: th.ink } });
    P.eqs.forEach(q => annotations.push({ x: q.xa[0], y: q.xa[1], text: 'E', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 7, yshift: -3, font: { size: 13, color: th.ink } }));
    // Zoom on the lens and R.
    const all = lo.concat(hi, [e.Ra]);
    const bx = [Math.min(...all.map(q => q[0])), Math.max(...all.map(q => q[0]))], by = [Math.min(...all.map(q => q[1])), Math.max(...all.map(q => q[1]))];
    const w = Math.max(bx[1] - bx[0], by[1] - by[0]) * 1.12 + 0.3, cx = (bx[0] + bx[1]) / 2, cy = (by[0] + by[1]) / 2;
    const xr = [Math.max(0, cx - w / 2), Math.min(OMEGA[0], cx + w / 2)], yr = [Math.max(0, cy - w / 2), Math.min(OMEGA[1], cy + w / 2)];
    const L = U.base2d(th, { xt: 'x<sub>1</sub><sup>a</sup>', yt: 'x<sub>2</sub><sup>a</sup>', x: { range: xr }, y: { range: yr }, annotations, margin: { l: 50, r: 50, t: 44, b: 44 } });
    const bax = (title, more) => ({ title: { text: title, standoff: 4 }, color: th.red, tickfont: { color: th.red }, showgrid: false, zeroline: false, fixedrange: true, ...more });
    L.xaxis2 = bax('x<sub>1</sub><sup>b</sup>', { overlaying: 'x', side: 'top', range: [OMEGA[0] - xr[0], OMEGA[0] - xr[1]] });
    L.yaxis2 = bax('x<sub>2</sub><sup>b</sup>', { overlaying: 'y', side: 'right', range: [OMEGA[1] - yr[0], OMEGA[1] - yr[1]] });
    traces.unshift({ type: 'scatter', x: [OMEGA[0] - xr[0]], y: [OMEGA[1] - yr[0]], xaxis: 'x2', yaxis: 'y2', mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip' });
    L.hovermode = 'closest';
    Plotly.react('plot', traces, L, U.PLOT_CONFIG);
    $('cap').innerHTML = `Zoomed on the lens between the indifference curves through ${texStr('R')} (Alf's from the bottom left, Bill's from the top right). <span class="c-green"><span class="key"></span>Green</span>: the part of the core that no coalition of the notes' type blocks when there are ${texStr(`N=${state.N}`)} of each; grey: blocked. Star: the competitive equilibrium, which is never blocked.`;
  }

  function drawN(th, S) {
    const { P } = S, Ns = U.linspace(1, NMAX, NMAX), lo = [], hi = [];
    for (const N of Ns) { const s = RM.surviving(P, N); lo.push(s.lo); hi.push(s.hi); }
    const traces = [
      { type: 'scatter', mode: 'lines', x: Ns, y: lo, line: { color: GREEN, width: 2, shape: 'hv' }, hovertemplate: 'N = %{x}: from %{y:.3f}<extra></extra>' },
      { type: 'scatter', mode: 'lines', x: Ns, y: hi, line: { color: GREEN, width: 2, shape: 'hv' }, fill: 'tonexty', fillcolor: 'rgba(76,175,80,0.22)', hovertemplate: 'N = %{x}: to %{y:.3f}<extra></extra>' }
    ];
    P.eqs.forEach(q => traces.push(U.line2([[1, q.xa[0]], [NMAX, q.xa[0]]], th.ink, 1.5, 'competitive equilibrium', 'dot')));
    traces.push(U.line2([[1, S.x1], [NMAX, S.x1]], th.ink, 1.5, 'allocation y', 'dash'));
    const shapes = [{ type: 'line', x0: state.N, x1: state.N, yref: 'paper', y0: 0, y1: 1, line: { color: th.grey, width: 2 } }];
    Plotly.react('plotN', traces, U.base2d(th, { xt: 'N, copies of each person (log scale)', yt: 'x<sub>1</sub><sup>a</sup> in the core', x: { type: 'log', range: [Math.log10(0.95), Math.log10(NMAX * 1.05)], tickvals: [1, 2, 3, 5, 10, 20, 30, 60], ticktext: ['1', '2', '3', '5', '10', '20', '30', '60'] }, y: { range: P.core }, shapes }), U.PLOT_CONFIG);
    $('capN').innerHTML = `The green band is the core of the ${texStr('N')}-replica (as ${texStr('x_1^a')} along the contract curve). It narrows towards the competitive allocation (dotted) as ${texStr('N')} grows. The dashed line is ${texStr('y')}: it drops out at ${texStr(`N=${S.b.N === Infinity ? '\\infty' : S.b.N}`)}.`;
  }

  function renderText(S) {
    const { e, b, c } = S;
    const who = b.side === 'a' ? 'Alf' : 'Bill', other = b.side === 'a' ? 'Bill' : 'Alf';
<<<<<<< HEAD
=======
    const h = b.side, o = b.side === 'a' ? 'b' : 'a';
>>>>>>> 40baa6a22a6e5f3bc4b11bbf79b9556039b5218a
    const rows = [['y^a', vec(b.xa)], ['y^b', vec(b.xb)]];
    if (b.N < Infinity) rows.push(['\\theta\\ \\text{must exceed}', f3(b.theta)], ['\\text{blocked from}', `N=${b.N}`]);
    else rows.push(['\\text{blocked}', '\\text{never}']);
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${texStr(v)}</dd>`).join('');
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'na'}">${ok ? '✓' : '·'}</span><span>${html}</span></li>`;
    if (b.N === Infinity) {
      $('checks').innerHTML = item(true, `${texStr('y')} is the competitive allocation: the line through ${texStr('R')} and ${texStr('y')} is the equilibrium price line, tangent to both indifference curves. No such coalition can block it, whatever ${texStr('N')}.`);
      return;
    }
    if (!c) {
      $('checks').innerHTML = item(false, `With ${texStr(`N=${state.N}`)} no fraction ${texStr('M/N<1')} lies above ${texStr(`\\theta=${f3(b.theta)}`)}: ${texStr('y')} survives. It needs ${texStr(`N\\ge${b.N}`)}.`);
      return;
    }
    const R = b.side === 'a' ? e.Ra : X.Rb(e), Ro = b.side === 'a' ? X.Rb(e) : e.Ra, u = b.side === 'a' ? e.ua : e.ub;
    const own = b.side === 'a' ? b.xa : b.xb, gain = CM.utility(c.get, u) - CM.utility(own, u);
    const lhs = [c.N * c.get[0] + c.M * c.other[0], c.N * c.get[1] + c.M * c.other[1]], rhs = [c.N * R[0] + c.M * Ro[0], c.N * R[1] + c.M * Ro[1]];
    $('checks').innerHTML = [
      item(true, `Coalition: all ${c.N} ${who}s and ${c.M} of the ${other}s, ${texStr(`\\theta=\\tfrac{${c.M}}{${c.N}}=${f3(c.theta)}`)}`),
<<<<<<< HEAD
      item(true, `Each ${who} gets ${texStr(`\\theta y+(1-\\theta)R=${vec(c.get)}`)}, each ${other} in it keeps ${texStr(vec(c.other))}`),
      item(Math.abs(lhs[0] - rhs[0]) < 1e-9 && Math.abs(lhs[1] - rhs[1]) < 1e-9, `Feasible: they use exactly their own endowments, ${texStr(vec(rhs))}`),
      item(gain > 0, `Better for every ${who}: ${texStr(`U(\\theta y+(1-\\theta)R)-U(y)=${fmt(gain, 4)}>0`)}. Passing a crumb to the ${other}s makes them strictly better off too.`)
=======
      item(true, `Each ${who} gets ${texStr(`\\theta y^${h}+(1-\\theta)R^${h}=${vec(c.get)}`)}, each ${other} in it keeps ${texStr(`y^${o}=${vec(c.other)}`)}`),
      item(Math.abs(lhs[0] - rhs[0]) < 1e-9 && Math.abs(lhs[1] - rhs[1]) < 1e-9, `Feasible: they use exactly their own endowments, ${texStr(vec(rhs))}`),
      item(gain > 0, `Better for every ${who}: ${texStr(`U^${h}(\\theta y^${h}+(1-\\theta)R^${h})-U^${h}(y^${h})=${fmt(gain, 4)}>0`)}. Passing a crumb to the ${other}s makes them strictly better off too.`)
>>>>>>> 40baa6a22a6e5f3bc4b11bbf79b9556039b5218a
    ].join('');
  }

  function render() {
    const S = solve(), th = U.theme();
    $('mainTitle').textContent = `The core of the ${state.N}-replica economy`;
    document.querySelectorAll('[data-n]').forEach(bt => bt.setAttribute('aria-pressed', String(Number(bt.dataset.n) === state.N)));
    tex($('formula'), `U^h(x)=\\left(\\delta^h x_1^{\\rho^h}+(1-\\delta^h)x_2^{\\rho^h}\\right)^{1/\\rho^h}`, true);
    guard('box', () => draw(th, S));
    guard('replica plot', () => drawN(th, S));
    guard('numbers', () => renderText(S));
  }

  function init() {
    U.renderStaticTex();
    const ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-n]').forEach(bt => bt.addEventListener('click', () => ctrls.N.set(Number(bt.dataset.n))));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (X && RM || (U.showError('Could not load shared/exchange-model.js or model.js.'), false))) guard('page', init);
})();
