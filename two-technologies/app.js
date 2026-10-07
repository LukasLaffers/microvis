/*
 * Two Technologies and a Kink: interface and plotting (lecture 2). The math is in model.js.
 */
(function () {
  'use strict';

  const K = window.KinkModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const DEFAULTS = { ...K.EXERCISE, w1: 0.25, q: 1 };
  const state = { ...DEFAULTS, firm: 'D' };
  const tech = () => ({ alpha: state.alpha, beta: state.beta });
  let ctrls = {};
  const schedule = U.scheduler(render);

  // ---------- input space ----------

  function drawMain(th, s, r) {
    const w = [state.w1, 1], q = state.q, k = s.alpha + s.beta, zk = Math.pow(q, 1 / k), R = 2.3 * zk;
    const iso = which => K.isoquant(q, s, which, 0.02 * R, 1.2 * R).filter(z => z[1] <= 1.5 * R);
    const traces = [
      U.line2([[0, 0], [R, R]], th.muted, 1, 'z₁ = z₂', 'dot'),
      U.line2(iso('A'), th.accent, 1.6, 'φ_A = q'),
      U.line2(iso('B'), th.accent2, 1.6, 'φ_B = q'),
      U.line2(iso(state.firm), th.ink, 3.5, state.firm === 'D' ? 'firm D: min' : 'firm C: max')
    ];
    const annotations = [], shapes = [];
    // At the kink of firm D: the steepest and the flattest isocost lines that still touch only there.
    const [lo, hi] = K.kinkRange(s);
    if (state.firm === 'D') {
      // lines of equal length on both sides of the kink: dx = L / sqrt(slope), dy = L sqrt(slope)
      const L = 0.5 * zk, end = (slope, sgn) => [zk + sgn * L / Math.sqrt(slope), zk - sgn * L * Math.sqrt(slope)];
      const line = slope => [end(slope, -1), end(slope, 1)];
      traces.push(U.line2(line(hi), th.muted, 1, `slope −${fmt(hi)}`, 'dot'), U.line2(line(lo), th.muted, 1, `slope −${fmt(lo)}`, 'dot'));
      const tHi = end(hi, -1), tLo = end(lo, 1);
      annotations.push({ x: tHi[0], y: tHi[1], text: `slope −${fmt(hi)}`, showarrow: false, xanchor: 'right', xshift: -4, font: { size: 11, color: th.muted } });
      annotations.push({ x: tLo[0], y: tLo[1], text: `slope −${fmt(lo)}`, showarrow: false, xanchor: 'left', yanchor: 'top', font: { size: 11, color: th.muted } });
    } else {
      // The chord that shows phi_C is not quasi-concave: two bundles on the isoquant, either side of the kink.
      const f = z1 => [z1, K.z2On(q, s, 'C', z1)];
      const a = f(0.88 * zk), b = f(1.12 * zk), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], val = K.phi(m, s, 'C');
      traces.push(U.line2([a, b], th.dec, 2, 'chord', 'dash'), U.dot2([a, b], th.ink, 'z, z′', 8), U.dot2([m], th.dec, 'middle of the chord', 9));
      annotations.push({ x: m[0], y: m[1], text: `φ<sub>C</sub> = ${fmt(val)} < ${fmt(q)}`, showarrow: true, arrowhead: 0, ax: -60, ay: 40, font: { size: 12, color: th.dec }, arrowcolor: th.dec, bgcolor: th.panel });
    }
    // The isocost line through the cheapest bundle, and the bundle itself.
    const c = r.C;
    traces.push(U.line2([[c / w[0], 0], [0, c / w[1]]], th.grey, 2, 'isocost line'));
    traces.push(U.dot2([r.H], th.ink, 'H(w,q)', 13));
    annotations.push({ x: r.H[0], y: r.H[1], text: 'H', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, yshift: 4, font: { size: 14, color: th.ink } });
    U.plot('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>', annotations, shapes,
      x: { range: [0, R], constrain: 'domain' }, y: { range: [0, R], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });

    const ratio = w[0] / w[1];
    let cap;
    if (state.firm === 'D') {
      cap = r.regime === 'kink'
        ? `${texStr(`w_1/w_2=${fmt(ratio)}`)} lies between ${fmt(lo)} and ${fmt(hi)}: the isocost line touches the isoquant only at the kink, where both technologies are needed in full, ${texStr(`H=(${fmt(r.H[0])},\\ ${fmt(r.H[1])})`)}.`
        : `${texStr(`w_1/w_2=${fmt(ratio)}`)} is ${r.regime === 'A' ? `above ${fmt(hi)}` : `below ${fmt(lo)}`}: input 1 is ${r.regime === 'A' ? 'dear' : 'cheap'}, the cheapest bundle is on the part of the isoquant where ${texStr(`\\phi_${r.regime}`)} is the smaller output, and the isocost line is tangent there.`;
    } else if (Math.abs(ratio - 1) < 1e-9) {
      cap = `At ${texStr('w_1=w_2')} both technologies are equally cheap: Firm C is indifferent between two bundles, one on each side of the kink, and none in between.`;
    } else {
      cap = `Firm C produces with the better technology, so it needs only one of them to reach ${texStr('q')}: here ${texStr(`\\phi_${r.regime}`)}, the one that uses more of the ${r.regime === 'A' ? 'cheaper input 1' : 'cheaper input 2'}. At ${texStr('w_1=w_2')} it switches, and the cheapest bundle jumps across the kink.`;
    }
    $('cap').innerHTML = cap;
  }

  // ---------- H1 and C against w1 ----------

  const W1 = Array.from({ length: 401 }, (_, i) => 0.1 * Math.pow(100, i / 400));

  function drawSides(th, s, r) {
    const q = state.q, rows = W1.map(x => ({ x, ...K.costMin([x, 1], q, s, state.firm) }));
    // H1 with the price on the vertical axis, as a demand curve; a gap where it jumps (firm C).
    const pts = [];
    rows.forEach((row, i) => { if (i && Math.abs(row.H[0] - rows[i - 1].H[0]) > 0.2 * row.H[0]) pts.push([null, null]); pts.push([row.H[0], row.x]); });
    const [lo, hi] = K.kinkRange(s);
    const shapesH = state.firm === 'D' ? [{ type: 'rect', xref: 'paper', x0: 0, x1: 1, y0: Math.log10(lo), y1: Math.log10(hi), fillcolor: th.accentSoft, line: { width: 0 }, layer: 'below' }] : [];
    U.plot('plotH', [U.line2(pts, th.ink, 2.5, 'H¹'), U.dot2([[r.H[0], state.w1]], th.ink, 'now', 11)], U.base2d(th, {
      xt: 'z<sub>1</sub> = H<sup>1</sup>(w<sub>1</sub>, 1, q)', yt: 'w<sub>1</sub>', y: { type: 'log', range: [-1, 1] }, shapes: shapesH
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('capH').innerHTML = state.firm === 'D'
      ? `In the shaded band, ${texStr(`${fmt(lo)}\\le w_1/w_2\\le ${fmt(hi)}`)}, the firm stays at the kink: ${texStr('H^1')} is vertical, a change of ${texStr('w_1')} does not change the input mix.`
      : `At ${texStr('w_1=w_2')} the firm switches technology and ${texStr('H^1')} jumps: there is no price at which it would choose a bundle in between.`;
    U.plot('plotC', [U.line2(rows.map(row => [row.x, row.C]), th.ink, 2.5, 'C'), U.dot2([[state.w1, r.C]], th.ink, 'now', 11)], U.base2d(th, {
      xt: 'w<sub>1</sub>', yt: 'C', x: { type: 'log', range: [-1, 1] }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('capC').innerHTML = `Concave in ${texStr('w_1')}, with slope ${texStr('H^1')} (Shephard's lemma)${state.firm === 'D' ? `; a straight line in the band, where ${texStr('H^1')} is fixed` : `; a corner at ${texStr('w_1=w_2')}, where ${texStr('H^1')} jumps`}. Now ${texStr(`C=${fmt(r.C)}`)}.`;
  }

  // ---------- substitution and scale ----------

  function renderDeco(s, r) {
    const w = [state.w1, 1], q = state.q, p = K.priceFor(w, q, s, state.firm);
    $('decoNote').innerHTML = `At ${texStr(`w_1=${fmt(state.w1)}`)}, with the output price ${texStr(`p=${fmt(p)}`)} at which ${texStr(`q=${fmt(q)}`)} is the profit-maximising output:`;
    if (K.nearSwitch(w, s, state.firm, 2e-3)) {
      $('deco').innerHTML = '';
      $('nums').innerHTML = `<dt></dt><dd class="note">Not defined here: at this price ${texStr('H^1')} ${state.firm === 'C' ? 'jumps' : 'turns a corner'}.</dd>`;
      return;
    }
    const d = K.decompose(w, p, s, state.firm), [a, b, t] = U.fmtSum([d.substitution, d.scale]);
    $('deco').innerHTML = `<tbody>` +
      `<tr class="row-sub"><th>substitution ${texStr('\\partial H^1/\\partial w_1')}</th><td>${a}</td></tr>` +
      `<tr class="row-scale"><th>scale ${texStr('\\partial H^1/\\partial q\\cdot\\partial S/\\partial w_1')}</th><td>${b}</td></tr>` +
      `<tr class="row-total"><th>total ${texStr('\\partial D^1/\\partial w_1')}</th><td>${t}</td></tr></tbody>`;
    $('nums').innerHTML = [
      ['\\partial H^1/\\partial q', fmt(d.dHdq)],
      ['C_{qq}', fmt(d.Cqq)],
      ['\\text{scale}=-\\tfrac{1}{C_{qq}}\\big(\\tfrac{\\partial H^1}{\\partial q}\\big)^2', fmt(-d.dHdq * d.dHdq / d.Cqq)]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('') +
      (r.regime === 'kink' ? `<dt></dt><dd class="note">At the kink there is no substitution effect: only the scale effect is left.</dd>` : '');
  }

  // ---------- render ----------

  function render() {
    // keep alpha > beta and alpha + beta < 1
    if (state.beta >= state.alpha - 0.01) { state.beta = Math.max(0.05, Number((state.alpha - 0.05).toFixed(2))); ctrls.beta.sync(); }
    if (state.alpha + state.beta > 0.95) { state.beta = Number((0.95 - state.alpha).toFixed(2)); ctrls.beta.sync(); }
    document.querySelectorAll('[data-firm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.firm === state.firm)));
    const th = U.theme(), s = tech(), r = K.costMin([state.w1, 1], state.q, s, state.firm);
    tex($('formula'), `\\begin{aligned}&\\phi_A(z)=z_1^{\\alpha}z_2^{\\beta}\\\\&\\phi_B(z)=z_1^{\\beta}z_2^{\\alpha}\\\\&\\alpha=${U.num(s.alpha)},\\ \\beta=${U.num(s.beta)}\\end{aligned}`, true);
    guard('input space', () => drawMain(th, s, r));
    guard('side plots', () => drawSides(th, s, r));
    guard('decomposition', () => renderDeco(s, r));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-firm]').forEach(b => b.addEventListener('click', () => { state.firm = b.dataset.firm; schedule(); }));
    document.querySelectorAll('[data-w1]').forEach(b => b.addEventListener('click', () => ctrls.w1.setExact(Number(b.dataset.w1))));
    $('defaults').addEventListener('click', () => { Object.entries(DEFAULTS).forEach(([k, v]) => ctrls[k].setExact(v)); state.firm = 'D'; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(K, 'model.js')) guard('page', init);
})();
