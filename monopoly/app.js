/*
 * Monopoly and Product Differentiation: interface and plotting (lecture 5, sections 1.4 and 1.5).
 * Firm math from shared/firm-model.js; revenue and the optimum from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, MM = window.MonopolyModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { mode: 'mono', dem: 'linear', A: 12, B: 1, K: 14, eta: -2, AL: 12, BL: 1, a: 2, m: 1 };
  const W = [1, 1];
  let ctrls = {}, timer = null;
  // While the demand curve is dragged the axes stay as they were (above A = 12 they follow demand otherwise).
  let frozen = null, lastAxes = null;
  const schedule = U.scheduler(render);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const z = x => Math.abs(x) < 1e-9 ? 0 : x;   // print rounding noise as 0
  const tech = () => ({ tech: 'cobb', delta: 0.5, rho: 0, profile: 'ushape', A: 1, k: 0.6, a: state.a, m: state.m });
  const demand = () => state.mode === 'local' ? { type: 'linear', A: state.AL, B: state.BL }
    : state.dem === 'linear' ? { type: 'linear', A: state.A, B: state.B } : { type: 'ce', K: state.K, eta: state.eta };

  function draw(th) {
    const s = tech(), d = demand(), o = MM.optimum(W, s, d), comp = state.mode === 'mono' ? MM.competitive(W, s, d) : null;
    // Keep the axes of A = 12 for lower demand, so that AR is seen shifting down (as substitutes enter).
    const local = state.mode === 'local', A0 = d.type === 'linear' ? Math.max(12, d.A) : 0;
    const qMax = frozen ? frozen.qMax : d.type === 'linear' ? Math.min(A0 / d.B, 8) * 1.02 : 7;
    const yMax = frozen ? frozen.yMax : d.type === 'linear' ? A0 * 1.05 : Math.max(16, o.p * 1.4);
    lastAxes = { qMax, yMax };
    const qq = U.linspace(0.02, qMax, 400), clip = v => (v <= yMax * 1.5 && v >= -yMax) ? v : null;
    const traces = [];
    if (!o.shutdown && o.q > 0) {
      const fill = o.profit >= 0 ? th.profitFill : 'rgba(208,2,27,0.18)';
      traces.push({ type: 'scatter', mode: 'lines', x: [0, o.q, o.q, 0, 0], y: [o.AC, o.AC, o.p, o.p, o.AC], fill: 'toself', fillcolor: fill, line: { width: 0 }, hoverinfo: 'skip', name: 'profit' });
    }
    // Monopoly deadweight loss: between AR and MC from q* to the price taker's output.
    if (comp && !o.shutdown && comp.q > o.q) {
      const qs = U.linspace(o.q, comp.q, 60), top = qs.map(q => [q, MM.price(q, d)]), bot = qs.map(q => [q, FM.MC(W, q, s)]).reverse(), poly = [...top, ...bot, top[0]];
      traces.push({ type: 'scatter', mode: 'lines', x: poly.map(v => v[0]), y: poly.map(v => v[1]), fill: 'toself', fillcolor: 'rgba(155,155,155,0.4)', line: { width: 0 }, hoverinfo: 'skip', name: 'deadweight loss' });
    }
    traces.push(U.line2(qq.map(q => [q, clip(FM.AC(W, q, s))]), th.ink, 2, 'average cost AC'));
    traces.push(U.line2(qq.map(q => [q, clip(FM.MC(W, q, s))]), th.red, 2.5, 'marginal cost MC'));
    if (local && Math.abs(d.A - 12) > 1e-6) traces.push(U.line2(qq.map(q => [q, clip(12 - d.B * q)]), th.blue, 1.2, 'AR before entry', 'dot', { opacity: 0.6 }));
    traces.push(U.line2(qq.map(q => [q, clip(MM.price(q, d))]), th.blue, 2.5, 'average revenue AR = p(q)'));
    traces.push(U.line2(qq.map(q => [q, clip(MM.MR(q, d))]), th.blue, 2, 'marginal revenue MR', 'dash'));
    const shapes = [], annotations = [];
    if (!o.shutdown) {
      shapes.push({ type: 'line', x0: o.q, x1: o.q, y0: 0, y1: o.p, line: { color: th.muted, width: 1, dash: 'dot' } });
      shapes.push({ type: 'line', x0: 0, x1: o.q, y0: o.p, y1: o.p, line: { color: th.muted, width: 1, dash: 'dot' } });
      traces.push(U.dot2([[o.q, o.MC]], th.red, 'MR = MC', 8));
      traces.push(U.dot2([[o.q, o.p]], th.ink, 'p*, q*', 10));
      // p* on the price axis, over the tick labels (the curves start next to the axis)
      annotations.push({ xref: 'paper', x: 0, y: o.p, text: 'p*', showarrow: false, xanchor: 'right', xshift: -3, bgcolor: th.panel, font: { size: 13, color: th.ink } });
      annotations.push({ x: o.q, y: 0, text: 'q*', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { size: 13, color: th.ink } });
      if (Math.abs(o.p - o.AC) * 12 > yMax && o.q > 0.06 * qMax) annotations.push({ x: o.q / 2, y: (o.p + o.AC) / 2, text: 'Π', showarrow: false, font: { size: 15, color: th.ink }, bgcolor: th.panel, borderpad: 2 });
    }
    if (comp) traces.push(U.dot2([[comp.q, comp.p]], th.ink, 'price taker: AR = MC', 9, { marker: { color: th.panel, size: 9, line: { color: th.ink, width: 1.5 } } }));
    const h = handle();
    traces.push(U.dot2([h], th.blue, d.type === 'linear' ? 'demand AR (drag it)' : 'demand AR, level K at q = 1 (drag it)', 14, { cliponaxis: false }));
    // Curve labels at their right ends.
    // Rising curves get the label above their end, falling ones below it, so that the curve does not run through it.
    const label = (f, text, color, falling) => { for (let i = qq.length - 1; i >= 0; i--) { const v = f(qq[i]); if (v > 0.05 * yMax && v < 0.93 * yMax) { annotations.push({ x: qq[i], y: v, text, showarrow: false, xanchor: 'right', xshift: -6, yanchor: falling ? 'top' : 'bottom', yshift: falling ? -2 : 0, font: { size: 12, color } }); return; } } };
    label(q => FM.MC(W, q, s), 'MC', th.red, false);
    label(q => FM.AC(W, q, s), 'AC', th.ink, false);
    label(q => MM.price(q, d), 'AR', th.blue, true);
    label(q => MM.MR(q, d), 'MR', th.blue, true);
    if (comp && comp.q > o.q && !o.shutdown) annotations.push({ x: (2 * o.q + comp.q) / 3, y: (o.p + o.MC + comp.p) / 3, text: 'deadweight loss', showarrow: true, arrowhead: 0, arrowwidth: 1, arrowcolor: th.muted, ax: 70, ay: -95, xanchor: 'left', yanchor: 'bottom', font: { size: 11, color: th.muted } });
    Plotly.react('plot', traces, U.base2d(th, { xt: 'q', yt: 'p', x: { range: [0, qMax] }, y: { range: [0, yMax] }, shapes, annotations }), U.PLOT_CONFIG);
    const dwl = comp && !o.shutdown ? MM.deadweightLoss(W, s, d, o.q, comp.q) : null;
    return { s, d, o, comp, dwl };
  }

  // The handle on the demand curve: at q = 0.5 (linear), or at q = 1 where the level is K (constant elasticity).
  const DRAG = '<b>Drag the blue dot</b> up or down to shift demand. ';
  const handle = () => { const d = demand(); return d.type === 'linear' ? [0.5, d.A - 0.5 * d.B] : [1, d.K]; };

  function renderText({ s, d, o, comp, dwl }) {
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const local = state.mode === 'local', As = local ? MM.tangencyIntercept(W, s, state.BL) : null;
    $('head').textContent = !local ? 'Profit optimisation of a monopolist' : Math.abs(state.AL - As) < 0.02 ? 'Local monopolist in the long run' : 'Local monopolist in the short run';
    if (o.shutdown) {
      $('checks').innerHTML = `<li><span class="mark na">–</span><span>Even the best output makes a loss (${texStr(`\\Pi=${fmt(o.profit, 3)}`)}), so the firm produces nothing.${local ? ' Too many substitutes: some rivals would leave.' : ''}</span></li>`;
      $('readouts').innerHTML = '';
      $('cap').innerHTML = DRAG + 'Average revenue lies below average cost everywhere: no output covers its cost.';
      return;
    }
    const lines = [
      item(same(o.MR, o.MC), `${texStr(`MR=${fmt(o.MR, 3)}`)} = ${texStr(`MC=${fmt(o.MC, 3)}`)}`),
      item(same(o.p, o.MC / (1 + 1 / o.eta)), `${texStr(`p=\\frac{MC}{1+1/\\eta}=\\frac{${fmt(o.MC, 3)}}{1+1/(${fmt(o.eta, 3)})}=${fmt(o.MC / (1 + 1 / o.eta), 3)}`)}`),
      // AC shown as p minus the rounded margin, so the shown numbers fit together (at the tangency 4.38 − 4.38, not 4.38 − 4.37)
      (() => { const pS = o.p.toFixed(2), mS = (o.p - o.AC).toFixed(2), acS = fmt(Number(pS) - Number(mS));
        return item(same(o.profit, (o.p - o.AC) * o.q), `${texStr(`\\Pi=(AR-AC)\\,q^\\ast=(${fmt(o.p)}-${acS})\\cdot${fmt(o.q)}=${fmt(z(o.profit))}`)}`); })()
    ];
    if (local) {
      const tangent = Math.abs(o.profit) < 0.02;
      lines.push(tangent
        ? item(same(o.p, o.AC), `Long run: ${texStr('AR=AC')}, profit zero; ${texStr('AR')} is tangent to ${texStr('AC')} at ${texStr(`q^N=${fmt(o.q, 3)}`)}, left of minimum average cost ${texStr(`(\\hat q=${fmt(FM.minAC(W, s).qHat, 2)})`)}`)
        : `<li><span class="mark na">→</span><span>${o.profit > 0 ? 'Profit attracts substitutes: average revenue will shift down' : 'Losses: some rivals leave and average revenue shifts up'} until ${texStr(`A=${fmt(As, 3)}`)}.</span></li>`);
    }
    $('checks').innerHTML = lines.join('');
    const rows = [['q^\\ast,\\ p^\\ast', `${fmt(o.q, 3)}, ${fmt(o.p, 3)}`], ['\\eta(q^\\ast)', fmt(o.eta, 3)], ['\\text{markup}\\ p/MC', fmt(o.p / o.MC, 3)]];
    if (comp) rows.push(['\\text{price taker}', `${texStr(`q=${fmt(comp.q, 3)}`)}, ${texStr(`p=${fmt(comp.p, 3)}`)}`]);
    if (dwl !== null) rows.push(['\\text{deadweight loss}', fmt(dwl)]);
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    $('cap').innerHTML = DRAG + `<span class="c-l2-blue"><span class="key"></span>${texStr('AR=p(q)')}</span>, <span class="c-l2-blue"><span class="key dash"></span>${texStr('MR')}</span>, <span class="c-l2-red"><span class="key"></span>${texStr('MC')}</span>, <span class="c-ink"><span class="key"></span>${texStr('AC')}</span>. ` +
      (local ? (Math.abs(o.profit) < 0.02 ? 'Entry of substitutes has pushed average revenue down until it just touches average cost: the firm still sets MR = MC, but earns zero profit.' : `The firm earns ${texStr(`\\Pi=${fmt(o.profit, 2)}`)}. Press "Substitutes enter" to let rivals take its demand.`)
        : `Where ${texStr('MR')} crosses ${texStr('MC')} the firm sells ${texStr(`q^\\ast=${fmt(o.q, 2)}`)} at ${texStr(`p^\\ast=${fmt(o.p, 2)}`)}${comp ? `, less than the ${fmt(comp.q, 2)} a price taker would sell at ${fmt(comp.p, 2)}; the <span class="c-muted">grey area</span> between ${texStr('AR')} and ${texStr('MC')} is the deadweight loss, ${fmt(dwl)}: units that buyers value above their marginal cost but that are not produced` : ''}. Demand is elastic there: ${texStr(`\\eta=${fmt(o.eta, 2)}<-1`)}.` +
          // close to unit elasticity MR is a small fraction of the price: a tiny quantity at a very high price
          (o.eta > -1.5 ? ` So close to ${texStr('\\eta=-1')}, marginal revenue is only ${fmt(1 + 1 / o.eta, 2)} of the price, so the markup is huge: ${texStr(`p^\\ast=${fmt(1 / (1 + 1 / o.eta), 1)}\\cdot MC`)}.` : ''));
  }

  function render() {
    U.applyVisibility({ mono: state.mode === 'mono', local: state.mode === 'local', linear: state.dem === 'linear', ce: state.dem === 'ce' });
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    document.querySelectorAll('[data-dem]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dem === state.dem)));
    // A - Bq with the numbers (no "1q"); the constant-elasticity exponent 1/eta exactly (a number only when exact).
    const lin = (A, B) => `${U.num(A)}-${B === 1 ? '' : U.num(B) + '\\,'}q`;
    const inv = 1 / state.eta, invTex = Math.abs(100 * inv - Math.round(100 * inv)) < 1e-7 ? U.num(inv) : `1/(${U.num(state.eta)})`;
    tex($('formula-dem'), state.dem === 'linear' ? `p(q)=A-Bq=${lin(state.A, state.B)}` : `p(q)=K\\,q^{1/\\eta}=${U.num(state.K)}\\,q^{${invTex}}`, true);
    tex($('formula-local'), `AR=p(q)=${lin(state.AL, state.BL)}`, true);
    tex($('formula-cost'), `\\begin{gathered}C(w,q)=c(w)\\,G(q),\\ c(w)=2\\\\ G(q)=\\tfrac13q^3-${U.num(state.a)}q^2+${U.num(state.a * state.a + state.m)}q\\end{gathered}`, true);
    const th = U.theme();
    let R = null;
    guard('plot', () => { R = draw(th); });
    if (R) guard('numbers', () => renderText(R));
  }

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  function enter() {
    stop();
    const target = MM.tangencyIntercept(W, tech(), state.BL), start = state.AL, steps = 30;
    let k = 0;
    timer = setInterval(() => {
      k++;
      state.AL = start + (target - start) * k / steps; ctrls.AL.sync(); schedule();
      if (k >= steps) stop();
    }, 60);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('.ctrl input').forEach(i => i.addEventListener('pointerdown', stop));
    document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { stop(); state.mode = b.dataset.mode; schedule(); }));
    document.querySelectorAll('[data-dem]').forEach(b => b.addEventListener('click', () => { state.dem = b.dataset.dem; schedule(); }));
    $('enter').addEventListener('click', enter);
    $('short').addEventListener('click', () => { stop(); ctrls.AL.set(12); });
    // Drag the demand curve up or down: it sets A (the A of differentiated products), or K.
    const lim = (k, v) => Math.min(ctrls[k].max, Math.max(ctrls[k].min, v));
    U.dragPoint('plot', {
      start: () => { stop(); frozen = lastAxes; },
      end: () => { frozen = null; schedule(); },
      target: handle,
      move: ([, y]) => { const k = state.mode === 'local' ? 'AL' : state.dem === 'linear' ? 'A' : 'K'; ctrls[k].setExact(lim(k, k === 'K' ? y : y + 0.5 * demand().B)); }
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (MM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
