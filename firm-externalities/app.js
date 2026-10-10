/*
 * Firms That Affect Each Other: interface and plotting (lecture 5, section 1.2).
 */
(function () {
  'use strict';

  const EM = window.ExternalityModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  const state = { e: 0.5, alpha: 1, c: 1, qa: 1, qb: 5, p: 6 };
  // P_TOP a little above the price slider's maximum 12, so the dots are never cut at the top; the q axes grow
  // with the equilibrium output (a strong positive externality, e = −0.8, gives q = 25 each).
  const P_TOP = 12.6;
  let Q_FIRM = 12, Q_MARKET = 24;
  let ctrls = {};
  const schedule = U.scheduler(render);
  const model = () => ({ alpha: state.alpha, c: state.c, e: state.e });
  const same = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

  // A supply curve q = f(p) drawn in the (q, p) plane, with q = 0 below its start.
  const curve = (f, xa, color, width, name, dash) => U.line2(U.linspace(0, P_TOP, 241).map(p => [f(p), p]), color, width, name, dash, { xaxis: xa });

  function draw(th) {
    const s = model(), eq = EM.equilibrium(s, state.p), traces = [], annotations = [], shapes = [];
    Q_MARKET = Math.max(24, 1.15 * eq.Q); Q_FIRM = Q_MARKET / 2;
    // The market is on the main axes x, y (its dot can be dragged); firm 1 on x2, firm 2 on x3.
    for (const [xa, other] of [['x2', 'q²'], ['x3', 'q¹']]) {
      const self = xa === 'x2' ? '1' : '2';
      traces.push(curve(p => EM.supplyGiven(s, p, state.qa), xa, th.orange, 2.5, `S${self}(${other} = ${fmt(state.qa)})`));
      traces.push(curve(p => EM.supplyGiven(s, p, state.qb), xa, th.orange, 2, `S${self}(${other} = ${fmt(state.qb)})`, 'dot'));
      // Label the higher of the two curves at the top left of it, the lower one at the bottom right (as in the notes).
      const hiQ = s.e * state.qb >= s.e * state.qa ? state.qb : state.qa;
      const lab = (qbar, upper) => {
        const q = (upper ? 0.42 : 0.55) * Q_FIRM, p = s.c + q / s.alpha + s.e * qbar;
        if (p > 0.3 && p < P_TOP * 0.97) annotations.push({ xref: xa, yref: 'y', x: q, y: p, text: `S<sup>${self}</sup>(${other.replace('²', '<sup>2</sup>').replace('¹', '<sup>1</sup>')} = ${fmt(qbar)})`, showarrow: false, xanchor: upper ? 'right' : 'left', xshift: upper ? -8 : 8, font: { size: 11, color: th.ink } });
      };
      lab(hiQ, true); if (state.qa !== state.qb) lab(hiQ === state.qb ? state.qa : state.qb, false);
      // The supply curve at the other firm's actual output: the dot lies on it.
      const qOther = xa === 'x2' ? eq.q2 : eq.q1;
      traces.push(curve(p => EM.supplyGiven(s, p, qOther), xa, th.ink, 1.5, `S${self}(${other} = ${fmt(qOther)}), the other firm's actual output`));
      traces.push(U.dot2([[xa === 'x2' ? eq.q1 : eq.q2, state.p]], th.ink, `firm ${self} at p`, 9, { xaxis: xa }));
    }
    // Market: true supply S and the sums of marginal cost curves for fixed outputs of the other firm.
    traces.push(curve(p => EM.sumOfMC(s, p, state.qa), 'x', th.grey, 1.8, `MC₁ + MC₂ (other at ${fmt(state.qa)})`, 'dot'));
    traces.push(curve(p => EM.sumOfMC(s, p, state.qb), 'x', th.grey, 1.8, `MC₁ + MC₂ (other at ${fmt(state.qb)})`, 'dot'));
    traces.push(curve(p => EM.marketSupply(s, p), 'x', th.orange, 3, 'market supply S'));
    for (const qbar of [state.qa, state.qb]) {
      const pc = EM.crossingPrice(s, qbar);
      if (pc < P_TOP && 2 * qbar < Q_MARKET) traces.push(U.dot2([[2 * qbar, pc]], th.grey, 'S meets MC₁ + MC₂ where each firm produces q̄', 7, { marker: { color: th.panel, size: 7, line: { color: th.muted, width: 1.5 } } }));
      const upper = s.e * qbar >= s.e * (qbar === state.qa ? state.qb : state.qa);
      const ql = (upper ? 0.42 : 0.6) * Q_MARKET, pl = s.c + ql / (2 * s.alpha) + s.e * qbar;
      if (pl > 0.3 && pl < P_TOP * 0.97) annotations.push({ xref: 'x', yref: 'y', x: ql, y: pl, text: 'MC<sub>1</sub> + MC<sub>2</sub>', showarrow: false, xanchor: upper ? 'right' : 'left', xshift: upper ? -6 : 6, font: { size: 11, color: th.muted } });
    }
    const pS = Math.min(P_TOP * 0.8, EM.priceFor(s, Q_MARKET * 0.55));
    annotations.push({ xref: 'x', yref: 'y', x: EM.marketSupply(s, pS), y: pS, text: '<b>S</b>', showarrow: false, xanchor: 'right', xshift: -8, font: { size: 13, color: th.ink } });
    shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: state.p, y1: state.p, line: { color: th.muted, width: 1, dash: 'dot' } });
    const box = (xa, text) => annotations.push({ xref: xa + ' domain', yref: 'paper', x: 0.5, y: -0.2, text, showarrow: false, font: { size: 12, color: th.ink }, bordercolor: th.line, borderwidth: 1, borderpad: 3 });
    box('x2', 'firm 1 alone'); box('x3', 'firm 2 alone'); box('x', 'both firms');
    traces.push(U.dot2([[eq.Q, state.p]], th.ink, 'market at p (drag it)', 14, { cliponaxis: false }));

    // the price axis stays at the left edge, next to firm 1
    const base = U.base2d(th, { xt: 'q<sup>1</sup> + q<sup>2</sup>', yt: 'p', x: { domain: [0.68, 1], range: [0, Q_MARKET] }, y: { range: [0, P_TOP], anchor: 'free', position: 0 }, shapes, annotations, margin: { l: 44, r: 10, t: 8, b: 74 } });
    base.xaxis2 = { ...base.xaxis, domain: [0, 0.27], range: [0, Q_FIRM], title: { ...base.xaxis.title, text: 'q<sup>1</sup>' } };
    base.xaxis3 = { ...base.xaxis, domain: [0.34, 0.61], range: [0, Q_FIRM], title: { ...base.xaxis.title, text: 'q<sup>2</sup>' } };
    Plotly.react('plot', traces, base, { ...U.PLOT_CONFIG, displayModeBar: false });

    $('head').textContent = state.e > 0 ? 'Negative externality' : state.e < 0 ? 'Positive externality' : 'No externality';
    const kind = state.e > 0 ? `A higher output of the other firm <b>raises</b> marginal cost, so ${texStr(`S^1(q^2=${fmt(state.qb)})`)} lies above ${texStr(`S^1(q^2=${fmt(state.qa)})`)}. Market supply ${texStr('S')} is steeper than ${texStr('MC_1+MC_2')}: it reacts less to the price.`
      : state.e < 0 ? `A higher output of the other firm <b>lowers</b> marginal cost, so ${texStr(`S^1(q^2=${fmt(state.qb)})`)} lies below ${texStr(`S^1(q^2=${fmt(state.qa)})`)}. Market supply ${texStr('S')} is flatter than ${texStr('MC_1+MC_2')}: it reacts more to the price.`
      : `Without an externality the firms' supply curves do not depend on each other and ${texStr('S')} is simply ${texStr('MC_1+MC_2')}.`;
    $('capMain').innerHTML = `<b>Drag the market dot</b> up or down to change the price. Left and middle: a firm's supply when the other firm produces <span class="c-l2-orange"><span class="key"></span>${fmt(state.qa)}</span> or <span class="c-l2-orange"><span class="key dash"></span>${fmt(state.qb)}</span>, and <span class="c-ink"><span class="key"></span>${fmt(eq.q2)}</span>, what it actually produces at this price: the dot lies on that curve. Right: <span class="c-l2-orange"><span class="key"></span>market supply</span> and <span class="c-l2-grey"><span class="key dash"></span>${texStr('MC_1+MC_2')}</span> for the other firm's output fixed at ${fmt(state.qa)} and ${fmt(state.qb)}. ${kind} ${texStr('S')} meets each dotted line where both firms produce exactly that output.`;
    return { s, eq };
  }

  function renderChecks({ s, eq }) {
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const h = 1e-5, p0 = Math.max(state.p, s.c + 0.5), num = (EM.marketSupply(s, p0 + h) - EM.marketSupply(s, p0 - h)) / (2 * h);
    $('checks').innerHTML = [
      item(same(eq.q1, EM.supplyGiven(s, state.p, eq.q2)) && same(eq.q2, EM.supplyGiven(s, state.p, eq.q1)),
        `Consistent outputs: ${texStr(`q^1=S^1(p;q^2)=${fmt(eq.q1, 3)}`)} and ${texStr(`q^2=S^2(p;q^1)=${fmt(eq.q2, 3)}`)}`),
      state.p <= s.c
        ? `<li><span class="mark na">·</span><span>Below ${texStr(`p=c=${fmt(s.c)}`)} neither firm produces: market supply is 0 there, and its slope 0.</span></li>`
        : item(same(num, EM.marketSlope(s)), `Slope of market supply ${texStr(`\\frac{\\mathrm d(q^1+q^2)}{\\mathrm dp}=\\frac{2\\alpha}{1+\\alpha e}=${fmt(EM.marketSlope(s), 3)}`)} <span class="c-muted">numerically ${fmt(num, 3)}; without the externality ${texStr(`2\\alpha=${fmt(2 * s.alpha, 3)}`)}</span>`)
    ].join('');
    $('readouts').innerHTML = [
      ['q^1=q^2', fmt(eq.q1, 3)],
      ['q^1+q^2', fmt(eq.Q, 3)],
      ['MC_1(q^1;q^2)', `${fmt(s.c + eq.q1 / s.alpha + s.e * eq.q2, 3)} ${eq.Q > 0 ? '= p' : ''}`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  function render() {
    const th = U.theme();
    document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.preset) === state.e)));
    let R = null;
    guard('plot', () => { R = draw(th); });
    if (R) guard('numbers', () => renderChecks(R));
  }

  function init() {
    U.renderStaticTex();
    // Keep |alpha e| < 1 so that the outputs settle down (the slider ranges already ensure it).
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => ctrls.e.set(Number(b.dataset.preset))));
    // Drag the market dot along S: only the price counts (the q axes follow the output).
    U.dragPoint('plot', {
      target: () => [EM.equilibrium(model(), state.p).Q, state.p],
      move: ([, y]) => ctrls.p.setExact(Math.min(ctrls.p.max, Math.max(ctrls.p.min, y)))
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(EM, 'model.js')) guard('page', init);
})();
