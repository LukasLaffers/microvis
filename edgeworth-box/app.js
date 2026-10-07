/*
 * The Edgeworth Box: interface and plotting (lecture 9).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, X = window.ExchangeModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const OMEGA = [10, 10], GREEN = '#3d9a40';
  const EXAMPLES = {
    one: { da: 0.6, ra: -1, db: 0.35, rb: 0.3, R1: 8, R2: 2, p: 1, t: 4.6 },
    three: { da: 0.95, ra: -6, db: 0.05, rb: -6, R1: 9.5, R2: 0.5, p: 0.6, t: 5 }
  };
  const state = { ex: 'one', mode: 'market', ...EXAMPLES.one, showOffer: true, showCore: true, eqIndex: -1 };
  let ctrls = null;
  const schedule = U.scheduler(render);
  const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
  const vec = x => `(${f2(x[0])},\\ ${f2(x[1])})`;

  const ces = (delta, rho) => ({ type: 'ces', delta, rho: Math.abs(rho) < 0.05 ? (rho < 0 ? -0.05 : 0.05) : rho });
  const economy = () => ({ ua: ces(state.da, state.ra), ub: ces(state.db, state.rb), Omega: OMEGA, Ra: [state.R1, state.R2] });

  const inBox = q => q[0] >= -1e-9 && q[0] <= OMEGA[0] + 1e-9 && q[1] >= -1e-9 && q[1] <= OMEGA[1] + 1e-9;
  // Split a polyline into the pieces inside the box (gaps as nulls).
  const boxed = pts => pts.map(q => q && inBox(q) ? q : [null, null]);

  // Indifference curve of a (in a's coordinates) or of b (mapped into a's coordinates) at utility v.
  function icA(e, v) {
    return U.linspace(0.02, OMEGA[0], 240).map(x1 => { const x2 = CM.x2On(x1, v, e.ua, 1e3); return x2 === null ? null : [x1, x2]; }).filter(Boolean);
  }
  function icB(e, v) {
    return U.linspace(0.02, OMEGA[0], 240).map(x1 => { const x2 = CM.x2On(x1, v, e.ub, 1e3); return x2 === null ? null : X.toB(e, [x1, x2]); }).filter(Boolean);
  }
  // The lens between the indifference curves through R: a's curve below, b's above.
  function lens(e) {
    const va = CM.utility(e.Ra, e.ua), vb = CM.utility(X.Rb(e), e.ub), lo = [], hi = [];
    for (const x1 of U.linspace(0.005, OMEGA[0] - 0.005, 400)) {
      const a2 = CM.x2On(x1, va, e.ua, 1e3), b2o = CM.x2On(OMEGA[0] - x1, vb, e.ub, 1e3);
      if (a2 === null || b2o === null) continue;
      const b2 = OMEGA[1] - b2o;
      if (a2 < b2 && a2 <= OMEGA[1]) { lo.push([x1, a2]); hi.push([x1, b2]); }
    }
    return { lo, hi };
  }

  function solve() {
    const e = economy(), eqs = X.equilibria(e), core = X.coreRange(e);
    const d = X.demands(e, state.p), E = X.excess(e, state.p), E2p = X.excess(e, 2 * state.p, 2);
    const swt = X.support(e, state.t);
    return { e, eqs, core, d, E, E2p, swt };
  }

  function draw(th, S) {
    const { e, eqs, core, d, swt } = S, traces = [], annotations = [], swtMode = state.mode === 'swt';
    const va = CM.utility(e.Ra, e.ua), vb = CM.utility(X.Rb(e), e.ub);
    // b's axes: an invisible trace so that the top and right axes are drawn.
    traces.push({ type: 'scatter', x: [0, OMEGA[0]], y: [0, OMEGA[1]], xaxis: 'x2', yaxis: 'y2', mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip' });
    if (state.showCore) {
      const L = swtMode ? { lo: [] } : lens(e);
      if (L.lo.length > 1) {
        traces.push({ ...U.line2(L.lo, 'rgba(0,0,0,0)', 0), hoverinfo: 'skip' });
        traces.push({ ...U.line2(L.hi, 'rgba(0,0,0,0)', 0), fill: 'tonexty', fillcolor: th.dark ? 'rgba(76,175,80,0.16)' : 'rgba(76,175,80,0.12)', hoverinfo: 'skip' });
      }
      const cc = X.contractCurve(e, U.linspace(0.01, OMEGA[0] - 0.01, 300));
      traces.push(U.line2(boxed(cc), th.ink, 1.3, 'contract curve', 'dot'));
      traces.push(U.line2(X.contractCurve(e, U.linspace(core[0], core[1], 120)), GREEN, 5, 'core'));
    }
    if (!swtMode) {
      traces.push(U.line2(boxed(icA(e, va)), th.blue, 1.6, 'Alf: indifference curve through R'));
      traces.push(U.line2(boxed(icB(e, vb)), th.red, 1.6, 'Bill: indifference curve through R'));
    }
    if (state.showOffer && !swtMode) {
      const ps = U.logspace(0.01, 100, 400);
      traces.push(U.line2(boxed(X.offerCurve(e, 'a', ps)), th.blue, 2.4, 'Alf: offer curve', 'dash'));
      traces.push(U.line2(boxed(X.offerCurve(e, 'b', ps).map(x => X.toB(e, x))), th.red, 2.4, 'Bill: offer curve', 'dash'));
    }
    const priceLine = (pt, p) => {
      // x2 = pt2 - p (x1 - pt1), clipped to the box
      const xs = U.linspace(0, OMEGA[0], 200).map(x1 => [x1, pt[1] - p * (x1 - pt[0])]);
      return boxed(xs);
    };
    if (!swtMode) {
      traces.push(U.line2(priceLine(e.Ra, state.p), th.grey, 2, `price line, slope −${f3(state.p)}`));
      traces.push(U.dot2([d.xa], th.blue, 'Alf wants', 12));
      traces.push(U.dot2([X.toB(e, d.xb)], th.red, 'Bill wants', 12, { marker: { color: th.red, size: 12, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } } }));
    } else {
      const ua = CM.utility(swt.xa, e.ua), ub = CM.utility(swt.xb, e.ub);
      traces.push(U.line2(boxed(icA(e, ua)), th.blue, 1.8, 'Alf at the target'));
      traces.push(U.line2(boxed(icB(e, ub)), th.red, 1.8, 'Bill at the target'));
      traces.push(U.line2(priceLine(swt.xa, swt.p), th.grey, 2, `supporting price line, slope −${f3(swt.p)}`));
      const Rn = transferPoint(e, swt);
      if (Rn) {
        traces.push(U.line2([e.Ra, Rn.pt], th.ink, 2, 'transfer'));
        traces.push(U.dot2([Rn.pt], th.panel, "R' after the transfer", 11, { marker: { color: th.panel, size: 11, symbol: 'square', line: { color: th.ink, width: 2 } } }));
        annotations.push({ x: Rn.pt[0], y: Rn.pt[1], text: "R'", showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 13, color: th.ink } });
        annotations.push({ x: Rn.pt[0], y: Rn.pt[1], ax: e.Ra[0], ay: e.Ra[1], axref: 'x', ayref: 'y', text: '', showarrow: true, arrowhead: 2, arrowsize: 1.2, arrowcolor: th.ink, standoff: 8 });
      }
      traces.push(U.dot2([swt.xa], GREEN, 'target allocation', 15, { marker: { color: GREEN, size: 15, symbol: 'star', line: { color: '#ffffff', width: 1 } } }));
    }
    if (eqs.length) traces.push(U.dot2(eqs.map(q => q.xa), th.ink, 'competitive equilibrium', 15, { marker: { color: th.ink, size: 15, symbol: 'star', line: { color: '#ffffff', width: 1 } } }));
    traces.push(U.dot2([e.Ra], th.ink, 'endowment R', 12, { marker: { color: th.ink, size: 12, symbol: 'square', line: { color: '#ffffff', width: 1.5 } } }));
    annotations.push({ x: e.Ra[0], y: e.Ra[1], text: 'R', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 7, yshift: -2, font: { size: 14, color: th.ink } });
    annotations.push({ x: 0, y: 0, text: '<b>O<sup>a</sup></b>', showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -12, yshift: -14, font: { color: th.blue, size: 13 } });
    annotations.push({ x: OMEGA[0], y: OMEGA[1], text: '<b>O<sup>b</sup></b>', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 12, yshift: 14, font: { color: th.red, size: 13 } });
    eqs.forEach((q, i) => annotations.push({ x: q.xa[0], y: q.xa[1], text: eqs.length > 1 ? `E${i + 1}` : 'E', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -6, yshift: 4, font: { size: 13, color: th.ink } }));

    const L = U.base2d(th, {
      xt: '<span style="color:' + th.blue + '">x<sub>1</sub><sup>a</sup></span>', yt: '<span style="color:' + th.blue + '">x<sub>2</sub><sup>a</sup></span>',
      x: { range: [0, OMEGA[0]], showline: true, mirror: false }, y: { range: [0, OMEGA[1]], showline: true },
      annotations, margin: { l: 50, r: 50, t: 44, b: 44 }
    });
    const bax = (title, more) => ({ title: { text: title, standoff: 4 }, color: th.red, tickfont: { color: th.red }, showgrid: false, zeroline: false, fixedrange: true, showline: true, linecolor: th.line, ...more });
    L.xaxis2 = bax('<span>x<sub>1</sub><sup>b</sup></span>', { overlaying: 'x', side: 'top', range: [OMEGA[0], 0] });
    L.yaxis2 = bax('<span>x<sub>2</sub><sup>b</sup></span>', { overlaying: 'y', side: 'right', range: [OMEGA[1], 0] });
    L.hovermode = 'closest';
    Plotly.react('plot', traces, L, U.PLOT_CONFIG);
  }

  // Lump-sum transfer as a change in a's endowment of good 1 (as in the notes), or of good 2 if that leaves the box.
  function transferPoint(e, swt) {
    const g1 = [e.Ra[0] + swt.T1, e.Ra[1]], g2 = [e.Ra[0], e.Ra[1] + swt.T];
    if (Math.abs(swt.T) < 1e-6) return null;
    if (inBox(g1)) return { pt: g1, good: 1, amount: swt.T1 };
    if (inBox(g2)) return { pt: g2, good: 2, amount: swt.T };
    return null;
  }

  function drawE(th, S) {
    const e = S.e, ps = U.logspace(0.05, 20, 300), E = ps.map(p => X.excess(e, p));
    // y range: what happens around the equilibria (E can be tiny with strong complements, huge at extreme prices)
    const pl = S.eqs.length ? S.eqs[0].p / 4 : 0.05, ph = S.eqs.length ? S.eqs[S.eqs.length - 1].p * 4 : 20;
    let m = 0;
    ps.forEach((p, i) => { if (p >= pl && p <= ph) m = Math.max(m, Math.abs(E[i][0]), Math.abs(E[i][1])); });
    const lim = Math.min(12, Math.max(0.05, 1.1 * m)), cl = v => Math.max(-lim, Math.min(lim, v));
    const traces = [
      { type: 'scatter', mode: 'lines', x: ps, y: E.map(v => cl(v[0])), line: { color: th.ink, width: 2.5 }, name: 'E₁(p, 1)', hovertemplate: 'p = %{x:.2f}<br>E₁ = %{y:.2f}<extra></extra>' },
      { type: 'scatter', mode: 'lines', x: ps, y: E.map(v => cl(v[1])), line: { color: th.muted, width: 1.5, dash: 'dash' }, name: 'E₂(p, 1)', hovertemplate: 'p = %{x:.2f}<br>E₂ = %{y:.2f}<extra></extra>' }
    ];
    if (S.eqs.length) traces.push({ type: 'scatter', mode: 'markers', x: S.eqs.map(q => q.p), y: S.eqs.map(() => 0), marker: { symbol: 'star', size: 13, color: th.ink, line: { color: '#ffffff', width: 1 } }, hovertemplate: 'equilibrium p = %{x:.2f}<extra></extra>' });
    const shapes = [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: th.muted, width: 1 } }];
    if (state.mode === 'market') shapes.push({ type: 'line', x0: state.p, x1: state.p, yref: 'paper', y0: 0, y1: 1, line: { color: th.grey, width: 2 } });
    const L = U.base2d(th, { xt: 'p = p<sub>1</sub>/p<sub>2</sub> (log scale)', yt: 'excess demand', x: { type: 'log', range: [Math.log10(0.05), Math.log10(20)], tickvals: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20], ticktext: ['0.05', '0.1', '0.2', '0.5', '1', '2', '5', '10', '20'] }, y: { range: [-lim, lim] }, shapes, margin: { l: 52, r: 10, t: 8, b: 44 } });
    Plotly.react('plotE', traces, L, U.PLOT_CONFIG);
    $('capE').innerHTML = `<span class="c-ink"><span class="key"></span>${texStr('E_1')}</span> and <span class="c-muted"><span class="key dash"></span>${texStr('E_2')}</span> as functions of the relative price. A rise in ${texStr('p')} usually turns excess demand for good 1 into excess supply; where ${texStr('E_1')} crosses zero, ${texStr('E_2=-pE_1')} does too (Walras' law). ${S.eqs.length > 1 ? `Here it crosses ${S.eqs.length} times: equilibria where ${texStr('E_1')} slopes up are unstable under price adjustment.` : ''}`;
  }

  function renderText(S) {
    const { e, eqs, d, E, E2p, swt } = S, swtMode = state.mode === 'swt';
    const eqTxt = eqs.map((q, i) => `${texStr(`p^*${eqs.length > 1 ? '_' + (i + 1) : ''}=${f3(q.p)}`)}${eqs.length > 1 ? (q.stable ? ' (stable)' : ' (unstable)') : ''}`).join(', ');
    $('eqCount').textContent = eqs.length === 1 ? '1 equilibrium' : `${eqs.length} equilibria`;
    const rows = swtMode ? [
      ['\\text{target }x^a', vec(swt.xa)], ['x^b=R-x^a', vec(swt.xb)],
      ['p^*=MRS^a_{21}=MRS^b_{21}', f3(swt.p)],
      ['T^a\\ (\\text{units of good }2)', f3(swt.T)], ['T^a/p^*\\ (\\text{units of good }1)', f3(swt.T1)]
    ] : [
      ['p=p_1/p_2', f3(state.p)], ['x^a(p)', vec(d.xa)], ['x^b(p)', vec(d.xb)],
      ['E_1(p)', f3(E[0])], ['E_2(p)', f3(E[1])]
    ];
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${texStr(v)}</dd>`).join('') + `<dt>${swtMode ? 'equilibria from R' : 'equilibria'}</dt><dd>${eqTxt}</dd>`;
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const tiny = v => Math.abs(v) < 1e-9 ? 0 : v;
    if (!swtMode) {
      const clear = Math.abs(E[0]) < 2e-3;
      $('checks').innerHTML = [
        item(true, `Walras' law: ${texStr(`p_1E_1+p_2E_2=${f3(tiny(state.p * E[0] + E[1]))}`)} at any price, not only in equilibrium`),
        item(Math.abs(E2p[0] - E[0]) < 1e-9, `Homogeneity: doubling both prices changes nothing, ${texStr(`E_1(2p_1,2p_2)=${f3(E2p[0])}=E_1(p_1,p_2)`)}`),
        item(clear, clear ? 'Both markets clear: a competitive equilibrium' : `Not an equilibrium: excess ${E[0] > 0 ? 'demand' : 'supply'} for good 1, so ${texStr('p')} should ${E[0] > 0 ? 'rise' : 'fall'}`)
      ].join('');
      $('cap').innerHTML = `<span class="c-l2-blue"><span class="key dot"></span>Alf</span> and <span class="c-l2-red"><span class="key dot"></span>Bill</span> choose on the grey price line through ${texStr('R')}; their dashed offer curves trace these choices for every price. ${state.showCore ? `<span class="c-green"><span class="key"></span>Core</span>: the contract curve (dotted) inside the shaded lens. ` : ''}Stars: competitive equilibria, where the two offer curves cross. Drag ${texStr('R')} in the box.`;
    } else {
      const eqT = X.equilibria(e, swt.T), hit = eqT.find(q => Math.abs(q.p - swt.p) < 1e-4 * swt.p);
      const Rn = transferPoint(e, swt);
      const inCore = state.t >= S.core[0] && state.t <= S.core[1];
      $('checks').innerHTML = [
        item(Math.abs(X.mrs(swt.xa, e.ua) - X.mrs(swt.xb, e.ub)) < 1e-6, `Pareto efficient: ${texStr(`MRS^a_{21}=MRS^b_{21}=${f3(swt.p)}`)}`),
        item(!!hit, hit ? `After the transfer, ${texStr(`p^*=${f3(swt.p)}`)} clears both markets and both choose the target` : 'The target is not reached'),
        item(true, `The transfers balance: ${texStr(`T^a+T^b=${f3(swt.T)}+(${f3(-swt.T)})=0`)}`),
        `<li><span class="mark na">·</span><span>${Math.abs(swt.T) < 1e-3 ? 'No transfer needed: the target is a competitive equilibrium from R.' : Rn ? `Lump sum: move ${f2(Math.abs(Rn.amount))} units of good ${Rn.good} from ${swt.T > 0 ? 'Bill to Alf' : 'Alf to Bill'}${Rn.good === 2 ? ' (good 1 alone would not be enough)' : ''}.` : 'The transfer is larger than what can be moved in one good: pay it as income.'} ${inCore ? 'The target is in the core, so no coalition blocks it from R; but the market from R ends at a different point, so a transfer is still needed.' : 'The target is outside the core: one of them is worse off than at R, which only a transfer can bring about.'}</span></li>`
      ].join('');
      $('cap').innerHTML = `Pick any Pareto-efficient point <span class="c-green">(star)</span> on the contract curve. The common tangent of the two indifference curves there gives the supporting price ${texStr(`p^*=${f3(swt.p)}`)}. A balancing lump-sum transfer moves the endowment from ${texStr('R')} to ${texStr("R'")} on that price line; from ${texStr("R'")} the market reaches the target.`;
    }
  }

  function render() {
    document.querySelectorAll('[data-ex]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ex === state.ex)));
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    U.applyVisibility({ market: state.mode === 'market', swt: state.mode === 'swt' });
    $('mainTitle').textContent = state.mode === 'market' ? 'The Edgeworth box: trade at a given price' : 'Second welfare theorem: any efficient point with a transfer';
    const S = solve(), th = U.theme();
    tex($('formula'), `\\begin{gathered}U^h(x)=\\left(\\delta^h x_1^{\\rho^h}+(1-\\delta^h)x_2^{\\rho^h}\\right)^{1/\\rho^h}\\\\ h=a,b,\\quad R^a+R^b=(${OMEGA[0]},\\ ${OMEGA[1]})\\end{gathered}`, true);
    guard('box', () => draw(th, S));
    guard('excess demand', () => drawE(th, S));
    guard('numbers', () => renderText(S));
  }

  function setExample(name) {
    state.ex = name;
    const ex = EXAMPLES[name];
    for (const k of Object.keys(ex)) { state[k] = ex[k]; if (ctrls[k]) ctrls[k].sync(); }
    state.eqIndex = -1;
    schedule();
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: () => { state.ex = matchExample(); schedule(); } });
    document.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => setExample(b.dataset.ex)));
    document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; schedule(); }));
    $('showOffer').addEventListener('change', ev => { state.showOffer = ev.target.checked; schedule(); });
    $('showCore').addEventListener('change', ev => { state.showCore = ev.target.checked; schedule(); });
    $('toEq').addEventListener('click', () => {
      const eqs = X.equilibria(economy());
      if (!eqs.length) return;
      state.eqIndex = (state.eqIndex + 1) % eqs.length;
      ctrls.p.setExact(eqs[state.eqIndex].p);
      schedule();
    });
    // Drag the endowment (market mode) or the target (second welfare theorem).
    const gd = $('plot');
    let dragging = false;
    const move = ev => {
      const v = U.eventToData(gd, ev);
      if (!v) return;
      if (state.mode === 'market') {
        ctrls.R1.set(U.clampTo(Math.round(v[0] * 10) / 10, 0.2, 9.8));
        ctrls.R2.set(U.clampTo(Math.round(v[1] * 10) / 10, 0.2, 9.8));
        state.ex = matchExample();
      } else ctrls.t.set(U.clampTo(Math.round(v[0] * 100) / 100, 0.3, 9.7));
      schedule();
    };
    gd.addEventListener('pointerdown', ev => { dragging = true; if (gd.setPointerCapture) gd.setPointerCapture(ev.pointerId); move(ev); });
    gd.addEventListener('pointermove', ev => { if (dragging) move(ev); });
    ['pointerup', 'pointercancel'].forEach(t => gd.addEventListener(t, () => { dragging = false; }));
    render();
    U.watchColorScheme(schedule);
  }

  // The example button stays highlighted only while the economy is unchanged.
  function matchExample() {
    for (const [name, ex] of Object.entries(EXAMPLES)) if (['da', 'ra', 'db', 'rb', 'R1', 'R2'].every(k => Math.abs(state[k] - ex[k]) < 1e-9)) return name;
    return '';
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (X || (U.showError('Could not load shared/exchange-model.js.'), false))) guard('page', init);
})();
