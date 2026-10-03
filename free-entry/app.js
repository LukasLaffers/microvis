/*
 * Free Entry and Industry Size: interface and plotting (lecture 5, section 1.3).
 * Firm math from shared/firm-model.js; the market equilibrium with N firms from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, FE = window.FreeEntryModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { N: 3, M: 6.6, a: 2, m: 1 };
  const W = [1, 1], P_MAX = 10;
  let ctrls = {}, timer = null;
  const schedule = U.scheduler(render);
  const tech = () => ({ tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a: state.a, m: state.m });
  const dem = () => ({ M: state.M, pMax: P_MAX });

  function solve() {
    const s = tech(), d = dem(), Nmax = FE.maxFirms(W, s, d);
    if (ctrls.N && ctrls.N.max !== Nmax) ctrls.N.setRange(1, Nmax);
    if (state.N > Nmax) state.N = Nmax;
    const e = FE.equilibrium(state.N, W, s, d), next = FE.equilibrium(state.N + 1, W, s, d);
    const Nstar = FE.industrySize(W, s, d), hat = FM.minAC(W, s);
    return { s, d, e, next, Nstar, hat, Nmax };
  }

  // ---------- one firm: MC, AC, AR = MR = p and the profit rectangle ----------

  function drawFirm(th, R) {
    const { s, e, hat } = R, qMax = Math.max(6, 1.25 * e.q), yMax = P_MAX * 1.05;
    const qq = U.linspace(0.02, qMax, 300), clip = v => v <= yMax * 1.4 ? v : null;
    const traces = [];
    if (e) {
      const ac = e.AC, up = e.profit >= 0;
      traces.push({ type: 'scatter', mode: 'lines', x: [0, e.q, e.q, 0, 0], y: [ac, ac, e.p, e.p, ac], fill: 'toself', fillcolor: up ? th.profitFill : 'rgba(208,2,27,0.18)', line: { width: 0 }, hoverinfo: 'skip', name: 'profit' });
    }
    traces.push(U.line2(qq.map(q => [q, clip(FM.AC(W, q, s))]), th.ink, 2, 'average cost'));
    traces.push(U.line2(qq.map(q => [q, clip(FM.MC(W, q, s))]), th.red, 2.5, 'marginal cost'));
    traces.push(U.line2([[0, e.p], [qMax, e.p]], th.blue, 2, 'average revenue = marginal revenue = p'));
    traces.push(U.dot2([[e.q, e.p]], th.ink, 'q_N', 10));
    traces.push(U.dot2([[hat.qHat, hat.pHat]], th.ink, 'min AC', 7, { marker: { color: th.panel, size: 7, line: { color: th.ink, width: 1.5 } } }));
    const shapes = [{ type: 'line', x0: e.q, x1: e.q, y0: 0, y1: e.p, line: { color: th.muted, width: 1, dash: 'dot' } }];
    const annotations = [
      { x: e.q / 2, y: (e.p + e.AC) / 2, text: 'Π', showarrow: false, font: { size: 15, color: th.ink }, bgcolor: th.panel, bordercolor: th.line, borderpad: 3, visible: Math.abs(e.p - e.AC) > 0.35 },
      { x: qMax, y: e.p, text: 'average revenue = p', showarrow: false, xanchor: 'right', yanchor: 'top', yshift: -2, font: { size: 12, color: th.blue } },
      { x: e.q, y: 0, text: `q<sub>${state.N}</sub>`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 3, font: { size: 12, color: th.ink } }
    ];
    const lastBelow = f => { for (let i = qq.length - 1; i >= 0; i--) { const v = f(qq[i]); if (v < yMax * 0.92) return [qq[i], v]; } return null; };
    const mcL = lastBelow(q => FM.MC(W, q, s)), acL = lastBelow(q => FM.AC(W, q, s));
    if (mcL) annotations.push({ x: mcL[0], y: mcL[1], text: 'marginal cost', showarrow: false, xanchor: 'right', xshift: -6, font: { size: 12, color: th.red } });
    if (acL) annotations.push({ x: acL[0], y: acL[1], text: 'average cost', showarrow: false, xanchor: 'right', xshift: -8, font: { size: 12, color: th.ink } });
    Plotly.react('plot', traces, U.base2d(th, { xt: `output of firm 1, …, ${state.N}`, yt: 'p', x: { range: [0, qMax] }, y: { range: [0, yMax] }, shapes, annotations }), U.PLOT_CONFIG);
    $('headA').textContent = e.profit > 1e-6 ? 'A single firm: profit attracts entry' : e.profit < -1e-6 ? 'A single firm: a loss' : 'A single firm: zero profit';
    $('capA').innerHTML = `Each of the ${state.N} firms produces ${texStr(`q_{${state.N}}=${fmt(e.q, 3)}`)} where ${texStr(`MC=p=${fmt(e.p, 3)}`)}. Profit ${texStr(`\\Pi=(p-AC)\\,q=${fmt(e.profit, 3)}`)}${e.profit < 0 ? ': this firm would rather not have entered.' : '.'} The open circle is the bottom of average cost, ${texStr(`\\min AC=${fmt(R.hat.pHat, 3)}`)}.`;
  }

  // ---------- the market ----------

  function drawMarket(th, R) {
    const { s, d, e, hat } = R, qTop = d.M * P_MAX;
    const lo = FE.mcMin(W, s), pp = U.linspace(lo, P_MAX, 160);
    const traces = [
      U.line2([[0, P_MAX], [qTop, 0]], th.ink, 2, 'demand D(p)'),
      U.line2(pp.filter(p => p >= hat.pHat).map(p => [state.N * FE.outputOnMC(W, p, s), p]), th.orange, 2.5, `supply of ${state.N} firms`),
      U.line2(pp.filter(p => p <= hat.pHat).map(p => [state.N * FE.outputOnMC(W, p, s), p]), th.orange, 1.5, 'below min AC: losses', 'dash'),
      U.line2([[0, hat.pHat], [qTop, hat.pHat]], th.muted, 1.5, 'long run: p = min AC', 'dot'),
      U.dot2([[e.Q, e.p]], th.ink, 'market with N firms', 10)
    ];
    const annotations = [{ x: qTop, y: hat.pHat, text: 'min AC', showarrow: false, xanchor: 'right', yanchor: 'top', yshift: -2, font: { size: 11, color: th.muted } }];
    Plotly.react('plotB', traces, U.base2d(th, { xt: 'market output', yt: 'p', x: { range: [0, qTop] }, y: { range: [0, P_MAX * 1.05] }, annotations }), U.PLOT_CONFIG);
    $('capB').innerHTML = `<span class="c-ink"><span class="key"></span>demand</span> ${texStr(`D(p)=${fmt(d.M, 1)}\\,(10-p)`)}, <span class="c-l2-orange"><span class="key"></span>supply of ${state.N} firms</span>. Each entrant shifts supply to the right and the price down, towards ${texStr('\\min AC')}.`;
  }

  function renderChecks(R) {
    const { e, next, Nstar, hat } = R;
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const lines = [item(e.profit >= -1e-9, `${texStr(`\\Pi(q_{${state.N}})=${fmt(e.profit, 3)}`)} ${e.profit >= -1e-9 ? '≥ 0: these firms want to be in' : '< 0: too many firms'}`)];
    if (next) lines.push(next.profit < 0
      ? item(true, `${texStr(`\\Pi(q_{${state.N + 1}})=${fmt(next.profit, 3)}`)} < 0: the next firm stays out`)
      : `<li><span class="mark na">→</span><span>${texStr(`\\Pi(q_{${state.N + 1}})=${fmt(next.profit, 3)}`)} ≥ 0: one more firm would enter</span></li>`);
    $('checks').innerHTML = lines.join('');
    const eS = FE.equilibrium(Nstar, W, R.s, R.d);
    $('readouts').innerHTML = [
      ['\\text{industry size}', `${texStr(`N=${Nstar}`)} ${state.N === Nstar ? '<span class="ok-mark">(here)</span>' : ''}`],
      ['p_N\\ \\text{vs}\\ \\min AC', eS ? `${fmt(eS.p, 3)} vs ${fmt(hat.pHat, 3)}` : '—'],
      ['\\Pi(q_N)', eS ? fmt(eS.profit, 3) : '—'],
      ['N=\\lfloor D(\\min AC)/\\hat q\\rfloor', `⌊${fmt(FE.demand(hat.pHat, R.d), 2)} / ${fmt(hat.qHat, 2)}⌋ = ${Nstar}`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  function render() {
    const th = U.theme(), R = solve(), s = R.s;
    tex($('formula'), `\\begin{gathered}C(w,q)=c(w)\\,G(q),\\ c(w)=2\\\\ G(q)=\\tfrac13q^3-${U.num(s.a)}q^2+${U.num(s.a * s.a + s.m)}q\\end{gathered}`, true);
    if (!R.e) { U.showError('The market is too small for this many firms.'); return; }
    guard('firm plot', () => drawFirm(th, R));
    guard('market plot', () => drawMarket(th, R));
    guard('entry', () => renderChecks(R));
  }

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  function freeEntry() {
    stop();
    const target = FE.industrySize(W, tech(), dem());
    if (target < 1) return;
    timer = setInterval(() => {
      if (state.N === target) return stop();
      ctrls.N.set(state.N + (state.N < target ? 1 : -1));
    }, 260);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: k => { if (k !== 'N') stop(); schedule(); } });
    document.querySelectorAll('.ctrl input').forEach(i => i.addEventListener('pointerdown', stop));
    $('add').addEventListener('click', () => { stop(); ctrls.N.set(state.N + 1); });
    $('entry').addEventListener('click', freeEntry);
    $('reset').addEventListener('click', () => { stop(); ctrls.N.set(3); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (FE || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
