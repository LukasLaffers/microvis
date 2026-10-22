/*
 * The Offer Curve: interface and plotting (lecture 9).
 * The budget line turns around the endowment R as the price ratio changes; the choice x(p) moves, and the offer curve
 * is traced from R over every price visited. A click in the figure animates the price from no trade to the price whose
 * choice is nearest the click.
 */
(function () {
  'use strict';

  const M = window.OfferModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  const DEF_R = { convex: 0.5, nonconvex: 1.3 };   // the price ratio shown first
  const R_MIN = 0.02, R_MAX = 4, L = 10.5;          // the slider's range; the axes run from 0 to L
  // lo, hi: the price ratios visited since the last reset (the traced part of the offer curve, always containing R's)
  const state = { pref: 'convex', r: DEF_R.convex, lo: 0, hi: 0, showR: true, whole: false };
  let ctrls = {}, anim = null;
  const schedule = U.scheduler(render);
  const logs = (a, b, n) => U.linspace(Math.log(a), Math.log(b), n).map(Math.exp);

  // the price ratios at which the construction leaves a faint indifference curve: r0 3^k, k != 0, within the slider
  const STEPS = () => { const r0 = M.noTrade(state.pref), out = []; for (let k = -8; k <= 8; k++) { const q = r0 * Math.pow(3, k); if (k && q >= R_MIN && q <= R_MAX) out.push(q); } return out; };
  function resetTrace() { const r0 = M.noTrade(state.pref); state.lo = Math.min(r0, state.r); state.hi = Math.max(r0, state.r); }

  // The offer curve over the price ratios [a, b], with a break where it jumps.
  function offerCurve(a, b, n = 260) {
    const out = [], J = M.jump(state.pref);
    let prev = null;
    for (const r of logs(a, b, n)) {
      if (J !== null && prev !== null && (prev - J) * (r - J) < 0) out.push([null, null]);
      out.push(M.choice(state.pref, r));
      prev = r;
    }
    return out;
  }
  // an indifference curve, clipped to the figure
  const curve = v => logs(0.02, L, 320).map(a => { const b = M.curveX2(state.pref, v, a); return [a, b !== null && b <= L * 1.2 ? b : null]; });

  // ---------- drawing ----------

  function draw(th) {
    const r = state.r, y = M.income(state.pref, r), xs = M.choices(state.pref, r), R = M.endowment(state.pref);
    const grey = th.grey, traces = [];
    const some = pts => (pts.length ? pts : [[null, null]]);   // (Plotly does not clear a trace animated to no points)
    // the affordable bundles and the budget line through R (the plot clips them)
    traces.push({ type: 'scatter', mode: 'lines', x: [0, y / r, 0, 0], y: [0, 0, y, 0], fill: 'toself', fillcolor: th.dark ? 'rgba(155,155,155,0.16)' : 'rgba(155,155,155,0.22)', line: { width: 0 }, hoverinfo: 'skip' });
    traces.push(U.line2([[0, y], [y / r, 0]], grey, 2.2, 'budget line through R'));
    traces.push(U.line2(some(state.showR ? curve(M.utility(state.pref, R)) : []), grey, 1.3, 'indifference curve through R', 'dot'));
    traces.push(U.line2(some(state.whole ? offerCurve(R_MIN, R_MAX, 400) : []), th.blue, 1.5, 'the whole offer curve', 'dot', { opacity: 0.45 }));
    // the construction: at price ratios r0 3^k already visited, the choice and its indifference curve, faint grey
    const steps = STEPS().filter(q => q >= state.lo * (1 - 1e-9) && q <= state.hi * (1 + 1e-9));
    const ghost = [];
    for (const q of steps) { if (ghost.length) ghost.push([null, null]); ghost.push(...curve(M.utility(state.pref, M.choice(state.pref, q)))); }
    traces.push(U.line2(some(ghost), grey, 1, '', null, { opacity: 0.5 }));
    traces.push(U.dot2(some(steps.map(q => M.choice(state.pref, q))), grey, '', 7, { hoverinfo: 'skip', hovertemplate: null, marker: { color: grey, size: 7, line: { width: 0 } } }));
    traces.push(U.line2(offerCurve(state.lo, state.hi), th.blue, 3, 'offer curve (traced)', 'dash'));
    // a jump the trace has crossed: its two ends as open circles, and the word
    const J = M.jump(state.pref), crossed = J !== null && state.lo < J && state.hi > J;
    const ends = crossed ? [M.choice(state.pref, J * (1 - 1e-9)), M.choice(state.pref, J * (1 + 1e-9))] : [];
    traces.push(U.dot2(some(ends), th.blue, 'the jump', 12, { hoverinfo: 'skip', hovertemplate: null, marker: { symbol: 'circle-open', color: th.blue, size: 12, line: { width: 2, color: th.blue } } }));
    traces.push(U.text2(crossed ? ends[1] : null, `\u2002\u2002jump at p₁/p₂ = ${J}`, th.blue, 'middle right', 13));   // next to the upper end
    traces.push(U.line2(curve(M.utility(state.pref, xs[0])), th.blue, 1.5, 'indifference curve through x(p)'));
    traces.push(U.dot2(xs, th.blue, 'x(p)', 13, { hoverinfo: 'skip', hovertemplate: null }));
    traces.push(U.dot2([R], th.ink, 'endowment R', 13, { hoverinfo: 'skip', hovertemplate: null, marker: { color: th.ink, size: 13, symbol: 'square', line: { color: '#ffffff', width: 1.5 } } }));
    traces.push(U.text2(R, '\u2002R', th.ink, 'bottom right', 15));   // (the space keeps the label clear of the square)
    traces.push({ ...U.text2(xs[xs.length - 1], 'x(p)', th.blue, 'top right', 15), text: ['\u2002' + (xs.length > 1 ? 'two choices' : 'x(p)')] });
    U.plot('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, L], constrain: 'domain' }, y: { range: [0, L], scaleanchor: 'x', constrain: 'domain' }, margin: { l: 44, r: 10, t: 8, b: 40 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  function texts() {
    const r = state.r, y = M.income(state.pref, r), xs = M.choices(state.pref, r), R = M.endowment(state.pref);
    const item = (mark, html) => `<li><span class="mark ${mark}">${mark === 'ok' ? '✓' : mark === 'no' ? '✗' : '·'}</span><span>${html}</span></li>`;
    const trade = x => {
      const d1 = x[0] - R[0], d2 = x[1] - R[1];
      if (Math.abs(d1) < 5e-3 && Math.abs(d2) < 5e-3) return 'no trade';
      return d1 < 0 ? `sells ${fmt(-d1)} of good 1, buys ${fmt(d2)} of good 2` : `buys ${fmt(d1)} of good 1, sells ${fmt(-d2)} of good 2`;
    };
    const vec = x => `(${fmt(x[0])},\\ ${fmt(x[1])})`;
    $('nums').innerHTML = [
      item('na', `Prices ${texStr(`p_1/p_2=${fmt(r)}`)}; no trade at ${texStr(state.pref === 'convex' ? 'p_1/p_2=1/16' : 'p_1/p_2=3/4')}, where the budget line touches the indifference curve through ${texStr('R')}`),
      item('na', `Income ${texStr(`p^tR=${fmt(y)}`)} (with ${texStr('p_2=1')})`),
      xs.length > 1
        ? item('na', `Two choices, equally good: ${texStr(vec(xs[0]))} and ${texStr(vec(xs[1]))}`)
        : item('na', `Choice ${texStr(`x(p)=${vec(xs[0])}`)}: ${trade(xs[0])}`)
    ].join('');
    const uR = M.utility(state.pref, R), ux = M.utility(state.pref, xs[0]);
    $('props').innerHTML = [
      item('ok', `<b>1.</b> The offer curve lies above the indifference curve through ${texStr('R')}: here ${texStr(`U(x(p))=${fmt(ux)}\\ge U(R)=${fmt(uR)}`)}, as ${texStr('R')} itself is affordable.`),
      state.pref === 'convex'
        ? item('ok', '<b>2.</b> Preferences are convex, so the offer curve is continuous.')
        : item('no', `<b>2.</b> Preferences are not convex (the indifference curves bend inwards at the diagonal): the offer curve jumps at ${texStr('p_1/p_2=1')}, from ${texStr(vec(M.choice(state.pref, 1 - 1e-9)))} to ${texStr(vec(M.choice(state.pref, 1 + 1e-9)))}.`)
    ].join('');
    U.tex($('formula'), state.pref === 'convex' ? 'U(x)=\\Big(\\tfrac12x_1^{-1}+\\tfrac12x_2^{-1}\\Big)^{-1},\\ \\ \\sigma=\\tfrac12' : 'U(x)=\\max\\{x_1^{1/4}x_2^{3/4},\\ x_1^{3/4}x_2^{1/4}\\}', true);
    $('cap').innerHTML = `<b>Drag the blue point</b> along the offer curve, or <b>click a point</b> to see the way there from ${texStr('R')}. <span class="c-l2-grey">Grey</span>: the budget line through ${texStr('R')} and the affordable bundles` +
      (state.showR ? `; dotted, the indifference curve through ${texStr('R')}` : '') + `; faint grey, the choices and indifference curves at the prices passed on the way` +
      `. <span class="c-l2-blue">Blue</span>: the choice ${texStr('x(p)')} with its indifference curve and, dashed, the offer curve traced from ${texStr('R')}.`;
  }

  function render() {
    document.querySelectorAll('[data-pref]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pref === state.pref)));
    const t = $('trace');
    t.textContent = anim && anim.sweep ? '■ Stop' : '▶ Trace the offer curve';
    t.setAttribute('aria-pressed', String(!!(anim && anim.sweep)));
    guard('figure', () => draw(U.theme()));
    guard('numbers', texts);
  }

  // ---------- animation: the price ratio moves in log steps along a list of stops ----------

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stop() { if (anim) { cancelAnimationFrame(anim.frame); anim = null; schedule(); } }
  // from no trade at R through the stops; 1.3 seconds for each factor e in the price ratio, at least 2.2 seconds a leg
  function play(stops, sweep) {
    stop();
    const r0 = M.noTrade(state.pref);
    ctrls.r.setExact(r0); state.lo = state.hi = r0;
    const legs = [], pts = [r0, ...stops];
    for (let i = 1; i < pts.length; i++) legs.push({ a: Math.log(pts[i - 1]), b: Math.log(pts[i]), dur: reduced() ? 1 : Math.max(2200, 1300 * Math.abs(Math.log(pts[i] / pts[i - 1]))) });
    anim = { legs, i: 0, t0: performance.now(), sweep, frame: 0 };
    const step = now => {
      const A = anim; if (!A) return;
      const leg = A.legs[A.i], s = Math.min(1, (now - A.t0) / leg.dur), e = s * s * (3 - 2 * s);
      ctrls.r.setExact(Math.exp(leg.a + (leg.b - leg.a) * e));
      if (s >= 1) { A.i++; A.t0 = now; if (A.i >= A.legs.length) { anim = null; schedule(); return; } }
      A.frame = requestAnimationFrame(step);
    };
    anim.frame = requestAnimationFrame(step);
    schedule();
  }
  // the price ratio whose choice is nearest to a point of the figure
  function priceNear(pt) {
    let best = null, bd = Infinity;
    for (const r of logs(R_MIN, R_MAX, 900)) for (const x of M.choices(state.pref, r)) {
      const d = Math.hypot(x[0] - pt[0], x[1] - pt[1]);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, {
      onChange: () => { state.lo = Math.min(state.lo, state.r); state.hi = Math.max(state.hi, state.r); schedule(); }
    });
    resetTrace();
    // the slider stops an animation (a change from the animation itself does not)
    $('r-range').addEventListener('input', stop, true);
    $('r-num').addEventListener('change', stop, true);
    document.querySelectorAll('[data-pref]').forEach(b => b.addEventListener('click', () => {
      stop(); state.pref = b.dataset.pref; ctrls.r.setExact(DEF_R[state.pref]); resetTrace(); schedule();
    }));
    $('trace').addEventListener('click', () => { if (anim && anim.sweep) stop(); else play([R_MAX, R_MIN, M.noTrade(state.pref)], true); });
    $('clear').addEventListener('click', () => { stop(); state.lo = state.hi = M.noTrade(state.pref); resetTrace(); schedule(); });
    $('show-r').addEventListener('change', e => { state.showR = e.target.checked; schedule(); });
    $('show-whole').addEventListener('change', e => { state.whole = e.target.checked; schedule(); });
    // a click in the figure: from no trade to the price whose choice is nearest the click
    // the blue point can be dragged along the offer curve; a click anywhere else plays the way there from R
    const gd = $('plot'), GRAB = 26;
    let dragging = null, dragged = false;
    const nearDot = ev => {
      const fl = gd._fullLayout; if (!fl || !fl.xaxis) return false;
      const b = gd.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
      return M.choices(state.pref, state.r).some(p => Math.hypot(fl.xaxis._offset + fl.xaxis.c2p(p[0]) - x, fl.yaxis._offset + fl.yaxis.c2p(p[1]) - y) <= GRAB);
    };
    gd.addEventListener('pointerdown', ev => {
      if (!nearDot(ev)) return;
      stop(); dragging = ev.pointerId; dragged = false;
      try { gd.setPointerCapture(ev.pointerId); } catch (e) { /* the drag still works inside the figure */ }
      ev.preventDefault(); gd.classList.add('dragging');
    }, true);
    gd.addEventListener('pointermove', ev => {
      if (dragging === ev.pointerId) {
        ev.preventDefault();
        const d = U.eventToData(gd, ev);
        if (d) { dragged = true; ctrls.r.setExact(priceNear(d)); }
      } else if (ev.pointerType === 'mouse') gd.classList.toggle('near', nearDot(ev));
    }, true);
    const end = ev => { if (dragging === ev.pointerId) { dragging = null; gd.classList.remove('dragging'); } };
    gd.addEventListener('pointerup', end, true);
    gd.addEventListener('pointercancel', end, true);
    gd.addEventListener('touchstart', ev => { const t = ev.touches[0]; if (t && nearDot(t)) ev.preventDefault(); }, { passive: false, capture: true });
    gd.addEventListener('touchmove', ev => { if (dragging !== null) ev.preventDefault(); }, { passive: false, capture: true });
    gd.addEventListener('click', ev => {
      if (dragged || nearDot(ev)) { dragged = false; return; }
      const d = U.eventToData(gd, ev); if (d) play([priceNear(d)], false);
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M, 'offer-curve/model.js')) guard('page', init);
})();
