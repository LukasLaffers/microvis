/*
 * Robinson Crusoe's Economy: interface and plotting (lecture 8).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, RM = window.RobinsonModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const EXAMPLES = {
    convex: { tech: 'concave', A: 3, beta: 0.5, T: 10, delta: 0.5, rho: -1 },
    inc: { tech: 'sshape', A: 40, K: 7, g: 3, T: 10, delta: 0.9, rho: -0.5 },
    loss: { tech: 'sshape', A: 40, K: 4, g: 3, T: 10, delta: 0.3, rho: -1 }
  };
  const state = { example: 'convex', open: false, A: 3, beta: 0.5, K: 7, g: 3, T: 10, tech: 'concave', delta: 0.5, rho: -1, wp: 2 };
  let ctrls = null;
  const schedule = U.scheduler(render);
  const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
  const vec = x => `(${f2(x[0])},\\ ${f2(x[1])})`;

  const params = () => ({
    T: state.T,
    tech: state.tech === 'concave' ? { type: 'concave', A: state.A, beta: state.beta } : { type: 'sshape', A: state.A, K: state.K, g: state.g },
    u: { type: 'ces', delta: state.delta, rho: Math.abs(state.rho) < 0.05 ? (state.rho < 0 ? -0.05 : 0.05) : state.rho }
  });

  function solve() {
    const P = params(), pl = RM.planner(P), omega = state.open ? state.wp : pl.omega, d = RM.decentralise(P, omega);
    return { P, pl, omega, d, prod: [P.T - d.firm.L, d.firm.q2] };
  }

  function draw(th, S) {
    const { P, pl, omega, d, prod } = S, traces = [], annotations = [];
    const x1s = U.linspace(0, P.T, 300), fr = RM.ppf(P, x1s);
    const xLo = Math.min(0, prod[0]) - 0.03 * P.T, xHi = P.T * 1.04;
    const yTop = Math.max(RM.phi(P.T, P.tech), pl.x[1], d.x[1], prod[1]) * 1.25;
    // Attainable set in the closed economy.
    traces.push({ ...U.line2([[0, 0], ...fr, [P.T, 0]], 'rgba(0,0,0,0)', 0), fill: 'toself', fillcolor: th.dark ? 'rgba(255,77,94,0.07)' : 'rgba(208,2,27,0.07)', hoverinfo: 'skip' });
    traces.push(U.line2(fr, th.red, 2.6, 'production possibility frontier x₂ = φ(T − x₁)'));
    const icPts = v => RM.indifference(P, v, U.linspace(Math.max(0.02, xLo), xHi, 300)).filter(q => q[1] !== null && q[1] <= yTop * 1.5);
    const line = (pt, w) => [[xLo, pt[1] + w * (pt[0] - xLo)], [P.T, pt[1] + w * (pt[0] - P.T)]];
    if (!state.open) {
      traces.push(U.line2(icPts(pl.v), th.blue, 2, 'indifference curve through x*'));
      const same = Math.abs(d.firm.L - pl.L) < 1e-4 && Math.abs(d.x[0] - pl.x[0]) < 1e-4;
      if (!same) traces.push(U.line2(line(pl.x, omega), th.grey, 1.5, 'slope w/p at x*', 'dot'));
      // Budget line = the firm's best isoprofit line: x2 = pi + (w/p)(T - x1).
      traces.push(U.line2(line([P.T, d.firm.profit], omega), th.grey, 2.2, 'budget line = isoprofit line at the maximal profit'));
      if (!same) {
        traces.push(U.line2(icPts(d.v), th.blue, 1.6, 'indifference curve through x**', 'dash'));
        traces.push(U.dot2([d.x], th.blue, 'Robinson the consumer chooses x**', 12));
      }
      traces.push(U.dot2([prod], th.red, 'the firm produces q** (as T − L**, q₂**)', 12, { marker: { color: th.red, size: 12, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } } }));
      traces.push(U.dot2([pl.x], th.ink, 'planner\'s optimum x*', 16, { marker: { color: th.ink, size: 16, symbol: 'star', line: { color: '#ffffff', width: 1 } } }));
      annotations.push({ x: pl.x[0], y: pl.x[1], text: 'x*', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, yshift: 2, font: { size: 14, color: th.ink } });
      if (!same) {
        annotations.push({ x: d.x[0], y: d.x[1], text: 'x**', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, font: { size: 13, color: th.blue } });
        annotations.push({ x: prod[0], y: prod[1], text: 'q**', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -8, font: { size: 13, color: th.red } });
      }
    } else {
      traces.push(U.line2(icPts(pl.v), th.blue, 1.2, 'autarky indifference curve', 'dot'));
      traces.push(U.line2(line(prod, omega), th.grey, 2.2, 'world price line through production'));
      traces.push(U.line2(icPts(d.v), th.blue, 2, 'indifference curve with trade'));
      const corner = [d.x[0], prod[1]];
      traces.push(U.line2([prod, corner, d.x], th.ink, 1.3, 'trade', 'dash'));
      traces.push(U.dot2([pl.x], th.ink, 'autarky optimum x*', 14, { marker: { color: th.panel, size: 14, symbol: 'star', line: { color: th.ink, width: 1.5 } } }));
      traces.push(U.dot2([prod], th.red, 'production q**', 12, { marker: { color: th.red, size: 12, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } } }));
      traces.push(U.dot2([d.x], th.blue, 'consumption x** with trade', 12));
      annotations.push({ x: d.x[0], y: d.x[1], text: 'x**', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, font: { size: 13, color: th.blue } });
      annotations.push({ x: prod[0], y: prod[1], text: 'q**', showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -8, font: { size: 13, color: th.red } });
      annotations.push({ x: pl.x[0], y: pl.x[1], text: 'x*', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -8, font: { size: 13, color: th.ink } });
    }
    const L = U.base2d(th, { xt: 'x<sub>1</sub>: leisure (hours)', yt: 'x<sub>2</sub>: coconuts', x: { range: [xLo, xHi] }, y: { range: [0, yTop] }, annotations, margin: { l: 56, r: 12, t: 8, b: 44 } });
    L.shapes = [{ type: 'line', x0: P.T, x1: P.T, y0: 0, y1: yTop, line: { color: th.muted, width: 1, dash: 'dot' } }];
    L.annotations.push({ x: P.T, y: yTop, text: 'T', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 4, font: { color: th.muted, size: 13 } });
    Plotly.react('plot', traces, L, U.PLOT_CONFIG);
  }

  function drawF(th, S) {
    const { P, pl, omega, d } = S, Lmax = Math.max(P.T, d.firm.L) * 1.1, Ls = U.linspace(0, Lmax, 300);
    const traces = [
      U.line2(Ls.map(L => [L, RM.phi(L, P.tech)]), th.red, 2.6, 'q₂ = φ(L)'),
      U.line2([[0, d.firm.profit], [Lmax, d.firm.profit + omega * Lmax]], th.grey, 2.2, 'best isoprofit line q₂ = π/p + (w/p)L')
    ];
    if (!state.open && Math.abs(d.firm.L - pl.L) > 1e-4) {
      const p0 = RM.phi(pl.L, P.tech) - omega * pl.L;
      traces.push(U.line2([[0, p0], [Lmax, p0 + omega * Lmax]], th.grey, 1.5, 'isoprofit line through L*', 'dot'));
    }
    if (!state.open) traces.push(U.dot2([[pl.L, RM.phi(pl.L, P.tech)]], th.ink, 'L* (planner)', 14, { marker: { color: th.ink, size: 14, symbol: 'star', line: { color: '#ffffff', width: 1 } } }));
    traces.push(U.dot2([[d.firm.L, d.firm.q2]], th.red, 'L** (profit maximum)', 12, { marker: { color: th.red, size: 12, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } } }));
    const top = Math.max(RM.phi(Lmax, P.tech), d.firm.profit + omega * Lmax * 0.3) * 1.15;
    const yLo = Math.min(0, d.firm.profit, RM.phi(pl.L, P.tech) - omega * pl.L) * 1.15;
    Plotly.react('plotF', traces, U.base2d(th, { xt: 'L: labour (hours)', yt: 'q<sub>2</sub>', x: { range: [0, Lmax] }, y: { range: [yLo, top] }, shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: th.muted, width: 1 } }] }), U.PLOT_CONFIG);
    const profitAt = RM.phi(pl.L, P.tech) - omega * pl.L;
    $('capF').innerHTML = `The manager slides the grey line, slope ${texStr(`w/p=${f3(omega)}`)}, up until it last touches ${texStr('\\phi')}; its intercept is the real profit ${texStr(`\\pi^{\\ast\\ast}/p=${f3(d.firm.profit)}`)}.` +
      (!state.open && Math.abs(d.firm.L - pl.L) > 1e-4 ? ` At ${texStr('L^\\ast')} the line is tangent too, but there the profit is only ${texStr(f3(profitAt))}${RM.d2phi(pl.L, P.tech) > 0 ? ', a local minimum: φ is convex there' : ''}.` : '');
  }

  function renderText(S) {
    const { P, pl, omega, d, prod } = S, same = Math.abs(d.firm.L - pl.L) < 1e-4 && Math.abs(d.x[0] - pl.x[0]) < 1e-4;
    const rows = state.open ? [
      ['w/p\\ (\\text{world})', f3(omega)], ['L^{\\ast\\ast},\\ q_2^{\\ast\\ast}', `${f2(d.firm.L)},\\ ${f2(d.firm.q2)}`], ['\\pi^{\\ast\\ast}/p', f3(d.firm.profit)],
      ['x^{\\ast\\ast}', vec(d.x)], ['U(x^{\\ast\\ast})\\ \\text{vs}\\ U(x^\\ast)', `${f3(d.v)}\\ \\text{vs}\\ ${f3(pl.v)}`]
    ] : [
      ['x^\\ast', vec(pl.x)], ['L^\\ast=T-x_1^\\ast', f2(pl.L)], ['w/p=MRS(x^\\ast)', f3(pl.omega)],
      ['L^{\\ast\\ast},\\ q_2^{\\ast\\ast}', `${f2(d.firm.L)},\\ ${f2(d.firm.q2)}`], ['\\pi^{\\ast\\ast}/p', f3(d.firm.profit)], ['x^{\\ast\\ast}', vec(d.x)]
    ];
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${texStr(v)}</dd>`).join('');
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const info = html => `<li><span class="mark na">·</span><span>${html}</span></li>`;
    const mkt = `labour: demand ${texStr(`L^{\\ast\\ast}=${f2(d.firm.L)}`)}, supply ${texStr(`T-x_1^{\\ast\\ast}=${f2(d.labourSupply)}`)}; coconuts: demand ${f2(d.x[1])}, supply ${f2(d.firm.q2)}`;
    if (!state.open) {
      const convex = pl.convexHere, profitAt = RM.phi(pl.L, P.tech) - omega * pl.L;
      const why = same ? (P.tech.type === 'concave' ? 'φ is concave, so the production set is convex (C1), and preferences are convex (C2): the price line separates the attainable set from the better set.'
        : 'The production set is not convex, but here the price line still lies above the whole frontier, so profit maximisation picks x* anyway.')
        : !convex ? 'At x* the frontier bends the wrong way (φ is convex: increasing returns). The tangent price line cuts into the attainable set, and the firm earns more by hiring more.'
        : profitAt < 0 ? `At L* the firm would make a loss (${f3(profitAt)}), since φ starts flat: it prefers to shut down. The production set is not convex (C1 fails).`
        : 'The production set is not convex (C1 fails): the price line through x* cuts into it elsewhere.';
      $('checks').innerHTML = [
        item(Math.abs(pl.omega - pl.mrt) < 1e-4 * Math.max(1, pl.omega), `Planner: ${texStr(`MRS=${f3(pl.omega)}=\\phi'(L^\\ast)`)} (MRS = MRT)`),
        item(Math.abs(d.firm.L - pl.L) < 1e-4, `The firm hires ${texStr(`L^{\\ast\\ast}=${f2(d.firm.L)}`)} ${Math.abs(d.firm.L - pl.L) < 1e-4 ? texStr('=L^\\ast') : texStr(`\\ne L^\\ast=${f2(pl.L)}`)}`),
        item(Math.abs(d.excessLabour) < 1e-4 && Math.abs(d.excessCoconuts) < 1e-4, `${same ? 'Markets clear' : 'Markets do not clear'}: ${mkt}`),
        info(why)
      ].join('');
      $('cap').innerHTML = `<span class="c-l2-red"><span class="key"></span>Frontier</span> ${texStr('x_2=\\phi(T-x_1)')} and the attainable set (shaded). <span class="c-l2-blue"><span class="key"></span>Indifference curve</span> through the planner's optimum ${texStr('x^\\ast')} (star). The <span class="c-l2-grey"><span class="key"></span>grey line</span> is at the same time the firm's best isoprofit line and Robinson's budget line ${texStr('(w/p)x_1+x_2=(w/p)T+\\pi^{\\ast\\ast}/p')}.` + (same ? ' It touches both curves at x*: decentralisation works.' : ' The firm (red diamond) and the consumer (blue dot) end up at different points.');
    } else {
      const imp = d.x[1] - d.firm.q2, lab = d.firm.L - d.labourSupply;
      $('checks').innerHTML = [
        item(d.v >= pl.v - 1e-9, `Trade never hurts: ${texStr(`U(x^{\\ast\\ast})=${f3(d.v)}\\ge U(x^\\ast)=${f3(pl.v)}`)}`),
        info(`Trade: Robinson ${imp >= 0 ? 'imports' : 'exports'} ${f2(Math.abs(imp))} coconuts and ${lab >= 0 ? 'hires' : 'sells'} ${f2(Math.abs(lab))} hours of labour ${lab >= 0 ? 'from' : 'to'} the traders. The value balances: ${texStr(`(w/p)\\cdot${f2(lab)}+(${f2(imp)})=${f3(Math.abs(omega * lab + imp) < 1e-9 ? 0 : omega * lab + imp)}`)}.`),
        info(P.tech.type === 'sshape' ? 'The frontier is not concave, but the world price line makes the consumption possibilities a straight line: trade convexifies the technology.' : `At ${texStr(`w/p=MRS(x^\\ast)=${f3(pl.omega)}`)} there is no trade and ${texStr('x^{\\ast\\ast}=x^\\ast')}.`)
      ].join('');
      $('cap').innerHTML = `Robinson produces where the world price line touches the <span class="c-l2-red"><span class="key"></span>frontier</span> (red diamond, maximal profit at world prices) and then trades along that line to his best bundle (blue dot). The dashed triangle is the trade. The open star is the autarky optimum.`;
    }
  }

  function render() {
    document.querySelectorAll('[data-tech]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tech === state.tech)));
    document.querySelectorAll('[data-open]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.open === 'open') === state.open)));
    U.applyVisibility({ concave: state.tech === 'concave', sshape: state.tech === 'sshape', open: state.open, closed: !state.open });
    $('example').value = state.example;
    $('mainTitle').textContent = state.open ? 'Opening the economy: produce at world prices, then trade' : 'Planner and markets: leisure and coconuts';
    tex($('formulaT'), state.tech === 'concave' ? 'q_2=\\phi(L)=A L^{\\beta}' : 'q_2=\\phi(L)=\\frac{A L^{\\gamma}}{K^{\\gamma}+L^{\\gamma}}', true);
    tex($('formulaU'), 'U(x)=\\left(\\delta x_1^{\\rho}+(1-\\delta)x_2^{\\rho}\\right)^{1/\\rho}', true);
    const S = solve(), th = U.theme();
    guard('plot', () => draw(th, S));
    guard('firm plot', () => drawF(th, S));
    guard('numbers', () => renderText(S));
  }

  function setExample(name) {
    state.example = name;
    const ex = EXAMPLES[name];
    if (!ex) return;
    for (const k of Object.keys(ex)) { state[k] = ex[k]; if (ctrls[k]) ctrls[k].sync(); }
    schedule();
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: key => { if (key !== 'wp') state.example = 'custom'; schedule(); } });
    $('example').addEventListener('change', e => setExample(e.target.value));
    document.querySelectorAll('[data-tech]').forEach(b => b.addEventListener('click', () => { state.tech = b.dataset.tech; state.example = 'custom'; schedule(); }));
    document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      state.open = b.dataset.open === 'open';
      if (state.open) ctrls.wp.setExact(Number((RM.planner(params()).omega * 1.5).toFixed(3)));
      schedule();
    }));
    setExample('convex');
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (RM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
