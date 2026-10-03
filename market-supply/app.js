/*
 * From Firms to Market Supply: interface and plotting (lecture 5, section 1.1).
 */
(function () {
  'use strict';

  const MS = window.MarketSupplyModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  const PRESETS = {
    zero: { a1: 6, F1: 0, a2: 2, F2: 0, c: 0, K: 300 },
    fixed: { a1: 4, F1: 8, a2: 4, F2: 32, c: 2, K: 300 }
  };
  const state = { ...PRESETS.fixed, N: 4, Kd: 100, limit: false };
  const EPS = 1.5;
  let ctrls = {};
  const schedule = U.scheduler(render);

  const firm = i => ({ c: state.c, alpha: state['a' + i], F: state['F' + i] });
  const dem = () => ({ K: state.K, eps: EPS });

  // ---------- supply graphs ----------

  // One firm's supply: the thick segment q = 0 up to p', the dot(s) at p', then q-hat + alpha (p - p').
  function firmTraces(f, pTop, color, xa, th) {
    const { qHat, pHat } = MS.startPoint(f);
    const out = [
      { type: 'scatter', mode: 'lines', x: [0, 0], y: [0, pHat], line: { color, width: 5 }, xaxis: xa, hoverinfo: 'skip' },
      U.line2([[MS.supplyAt(f, pHat + 1e-9), pHat], [f.alpha * (pTop - f.c), pTop]], color, 2.5, 'supply', null, { xaxis: xa })
    ];
    if (f.F > 0) out.push(U.dot2([[0, pHat], [qHat, pHat]], color, 'both optimal at p′', 8, { xaxis: xa, marker: { color, size: 8, line: { color: th.panel, width: 1 } } }));
    return out;
  }

  // Market supply: between the jump prices a continuous curve; at a jump price every sum of the firms' choices.
  function marketTraces(firms, pTop, color, th) {
    const jumps = [...new Set(firms.filter(f => f.F > 0).map(f => MS.startPoint(f).pHat))].sort((a, b) => a - b);
    const S = p => firms.reduce((s, f) => s + MS.supplyAt(f, p), 0);
    const pStart = Math.min(...firms.map(f => f.F > 0 ? MS.startPoint(f).pHat : f.c));
    const breaks = [pStart, ...jumps.filter(p => p > pStart + 1e-9), pTop];
    const pts = [];
    for (let k = 0; k + 1 < breaks.length; k++) {
      const a = breaks[k] * (1 + 1e-7), b = breaks[k + 1] * (1 - 1e-7);
      U.linspace(a, b, 40).forEach(p => pts.push([S(p), p]));
      pts.push([null, null]);
    }
    const dots = [];
    for (const pj of jumps) MS.marketSupplySet(firms, pj).forEach(v => dots.push([v, pj]));
    return [
      { type: 'scatter', mode: 'lines', x: [0, 0], y: [0, pStart], line: { color, width: 5 }, xaxis: 'x3', hoverinfo: 'skip' },
      U.line2(pts, color, 2.5, 'market supply', null, { xaxis: 'x3', connectgaps: false }),
      U.dot2(dots, color, 'possible market supply at a jump', 8, { xaxis: 'x3', marker: { color, size: 8, line: { color: th.panel, width: 1 } } })
    ];
  }

  function drawMain(th) {
    const f1 = firm(1), f2 = firm(2), firms = [f1, f2], d = dem();
    const s1 = MS.startPoint(f1), s2 = MS.startPoint(f2);
    const pTop = Math.max(s1.pHat, s2.pHat, state.c + 1) * 1.7 + 1;
    const e = MS.equilibrium(firms, d);
    const traces = [
      ...firmTraces(f1, pTop, th.orange, 'x', th),
      ...firmTraces(f2, pTop, th.orange, 'x2', th),
      ...marketTraces(firms, pTop, th.orange, th)
    ];
    const qMarketTop = f1.alpha * (pTop - f1.c) + f2.alpha * (pTop - f2.c);
    const xMax3 = qMarketTop * 1.05;
    const pd = U.linspace(Math.max(0.2, pTop * 0.06), pTop, 200).map(p => [MS.demand(p, d), p]).map(([q, p]) => [q <= xMax3 * 1.3 ? q : null, p]);
    traces.push(U.line2(pd, th.ink, 2, 'demand D(p)', null, { xaxis: 'x3' }));
    const shapes = [], annotations = [];
    const hline = (p, x1ref, dash) => shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: p, y1: p, line: { color: th.muted, width: 1, dash } });
    if (e.exists) {
      traces.push(U.dot2([[e.Q, e.p]], th.ink, 'equilibrium', 11, { xaxis: 'x3' }));
      hline(e.p, 1, 'dot');
    } else if (e.gapPrice !== null) {
      hline(e.gapPrice, 1, 'dot');
      annotations.push({ xref: 'x3', yref: 'y', x: MS.demand(e.gapPrice, d), y: e.gapPrice, text: 'no equilibrium', showarrow: true, arrowhead: 2, ax: 40, ay: -34, font: { size: 12, color: th.red }, arrowcolor: th.red });
    }
    const lab = (xa, text, x) => annotations.push({ xref: xa + ' domain', yref: 'paper', x: 0.5, y: -0.2, text, showarrow: false, font: { size: 12, color: th.ink }, bordercolor: th.line, borderwidth: 1, borderpad: 3 });
    lab('x', 'low-cost firm'); lab('x2', 'high-cost firm'); lab('x3', 'both firms');
    // p' and p'' on the price axis of the market panel.
    if (f1.F > 0) annotations.push({ xref: 'x3 domain', x: 0, y: s1.pHat, text: 'p′', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 12, color: th.ink } });
    if (f2.F > 0) annotations.push({ xref: 'x3 domain', x: 0, y: s2.pHat, text: 'p″', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 12, color: th.ink } });

    const base = U.base2d(th, { xt: 'q<sup>1</sup>', yt: 'p', x: { domain: [0, 0.27], range: [0, f1.alpha * (pTop - f1.c) * 1.05] }, y: { range: [0, pTop] }, shapes, annotations, margin: { l: 44, r: 10, t: 8, b: 74 } });
    base.xaxis2 = { ...base.xaxis, domain: [0.34, 0.61], range: [0, f2.alpha * (pTop - f2.c) * 1.05], title: { ...base.xaxis.title, text: 'q<sup>2</sup>' } };
    base.xaxis3 = { ...base.xaxis, domain: [0.68, 1], range: [0, xMax3], title: { ...base.xaxis.title, text: 'q<sup>1</sup> + q<sup>2</sup>' } };
    Plotly.react('plot', traces, base, { ...U.PLOT_CONFIG, displayModeBar: false });

    let cap = `<span class="c-l2-orange"><span class="key"></span>supply</span> (thick on the price axis: nothing is produced), <span class="c-ink"><span class="key"></span>demand</span> ${texStr('D(p)=K\\,p^{-1.5}')}. `;
    if (f1.F === 0 && f2.F === 0) cap += 'Without fixed costs each firm\'s supply is continuous, so their sum is too, and it always meets demand.';
    else if (e.exists) cap += e.atJump ? `Demand meets one of the possible market outputs exactly at the jump price ${fmt(e.p, 2)}.` : `Demand crosses market supply at ${texStr(`p=${fmt(e.p, 2)}`)}, ${texStr(`q^1+q^2=${fmt(e.Q, 2)}`)}.`;
    else cap += `Demand passes through the gap in market supply at ${texStr(`p=${fmt(e.gapPrice, 2)}`)}: just below, the market demands more than the firms offer; just above, less. It is not clear what will happen there.`;
    $('capMain').innerHTML = cap;
    return { e, s1, s2 };
  }

  // ---------- the average of N identical firms ----------

  function drawAverage(th) {
    const f = firm(2), N = state.N, dPer = { K: state.Kd, eps: EPS }, { qHat, pHat } = MS.startPoint(f);
    const pTop = Math.max(pHat, state.c + 1) * 1.7 + 1, color = th.orange;
    const traces = [
      { type: 'scatter', mode: 'lines', x: [0, 0], y: [0, pHat], line: { color, width: 5 }, hoverinfo: 'skip' },
      U.line2([[MS.supplyAt(f, pHat + 1e-9), pHat], [f.alpha * (pTop - f.c), pTop]], color, 2.5, 'average supply')
    ];
    if (f.F > 0) {
      if (state.limit) traces.push(U.line2([[0, pHat], [qHat, pHat]], color, 2.5, 'average supply at p′'));
      else traces.push(U.dot2(MS.averageSupplySet(f, N, pHat).map(v => [v, pHat]), color, 'possible average supply at p′', N > 24 ? 5 : 8, { marker: { color, size: N > 24 ? 5 : 8 } }));
    }
    const xMax = Math.max(qHat, f.alpha * (pTop - f.c)) * 1.05;
    traces.push(U.line2(U.linspace(Math.max(0.2, pTop * 0.06), pTop, 160).map(p => [MS.demand(p, dPer), p]).map(([q, p]) => [q <= xMax * 1.3 ? q : null, p]), th.ink, 2, 'demand per firm'));
    const eq = MS.averageEquilibrium(f, state.limit ? 1e6 : N, dPer);
    const annotations = [{ x: 0, y: pHat, text: 'p′', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 12, color: th.ink } }];
    if (f.F > 0 && eq.share < 1) {
      traces.push(U.dot2([[eq.avgSupply, pHat]], th.red, 'average supply closest to demand', 11));
      traces.push(U.dot2([[eq.avgDemand, pHat]], th.ink, 'average demand at p′', 7));
    } else traces.push(U.dot2([[eq.avgSupply, eq.p]], th.ink, 'equilibrium', 10));
    const ticks = f.F > 0 ? [0, 0.25, 0.5, 0.75, 1].map(t => t * qHat) : undefined;
    Plotly.react('plotB', traces, U.base2d(th, {
      xt: '(q<sup>1</sup> + … + q<sup>N</sup>)/N', yt: 'p', x: { range: [0, xMax], tickvals: ticks, ticktext: ticks && ticks.map(v => fmt(v, v % 1 ? 1 : 0)) }, y: { range: [0, pTop] }, annotations
    }), U.PLOT_CONFIG);
    let cap;
    if (!(f.F > 0)) cap = 'Firm 2 has no fixed cost, so there is no jump to fill. Give it a fixed cost.';
    else if (eq.share >= 1) cap = `Demand per firm is large: all firms produce, at ${texStr(`p=${fmt(eq.p, 2)}>p'`)}.`;
    else if (state.limit) cap = `In the limit the average firm's supply is the whole segment ${texStr(`[0,${fmt(qHat, 0)}]`)} at ${texStr("p'")}: a share ${fmt(eq.share, 3)} of the firms produce ${fmt(qHat, 0)} and the rest nothing, and the market clears exactly.`;
    else cap = `At ${texStr(`p'=${fmt(pHat, 2)}`)} each firm is indifferent between 0 and ${fmt(qHat, 0)}, so the average of ${N} firms can be any of the ${N + 1} dots. With <b>${eq.producing}</b> of the ${N} firms producing, average supply is ${fmt(eq.avgSupply, 2)} against average demand ${fmt(eq.avgDemand, 2)}: off by ${fmt(eq.gap, 2)} ≤ ${texStr('\\hat q/(2N)')} = ${fmt(qHat / (2 * N), 2)}. More firms, smaller gap.`;
    $('capB').innerHTML = cap;
  }

  function renderNumbers(R) {
    const { e, s1, s2 } = R, rows = [];
    const start = (s, F, name) => F > 0 ? `${texStr(`${name}=${fmt(s.pHat, 2)}`)}, ${texStr(`\\hat q=${fmt(s.qHat, 2)}`)}` : `starts at ${texStr(`p=c=${fmt(state.c, 2)}`)}, no jump`;
    rows.push(['\\text{firm 1}', start(s1, state.F1, "p'")]);
    rows.push(['\\text{firm 2}', start(s2, state.F2, "p''")]);
    rows.push(['\\text{market}', e.exists ? `${texStr(`p=${fmt(e.p, 3)}`)}, ${texStr(`q^1+q^2=${fmt(e.Q, 2)}`)}` : `<span class="c-l2-red">no equilibrium</span> (gap at ${texStr(`p=${fmt(e.gapPrice, 2)}`)})`]);
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  function render() {
    const th = U.theme();
    document.querySelectorAll('[data-preset]').forEach(b => {
      const P = PRESETS[b.dataset.preset];
      b.setAttribute('aria-pressed', String(Object.keys(P).every(k => state[k] === P[k])));
    });
    ctrls.N.el.querySelector('input[type=range]').disabled = state.limit;
    let R = null;
    guard('market plot', () => { R = drawMain(th); });
    guard('average-firm plot', () => drawAverage(th));
    if (R) guard('numbers', () => renderNumbers(R));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const P = PRESETS[b.dataset.preset];
      Object.keys(P).forEach(k => { state[k] = P[k]; ctrls[k].sync(); });
      schedule();
    }));
    $('limit').addEventListener('change', e => { state.limit = e.target.checked; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(MS, 'model.js')) guard('page', init);
})();
