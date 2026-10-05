/*
 * The Cost Function: interface and plotting (lecture 3).
 * Firm math from shared/firm-model.js; price derivatives from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, CF = window.CostFunctionModel, U = window.Microvis, FU = window.FirmUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { tech: 'cobb', delta: 0.5, rho: -0.5, A: 1, k: 1, w1: 1, w2: 2, q: 2, probe: 2, alpha: 1, w1o: 0.5 };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: 'homog', A: state.A, k: state.k, a: 2, m: 1 });

  let ctrls = {};
  const schedule = U.scheduler(render);
  const W1 = [0.2, 5];

  function solve() {
    const s = tech(), wbar = [state.w1, state.w2], q = state.q;
    const zbar = FM.condDemand(wbar, q, s).H, Cbar = FM.cost(wbar, q, s);
    const wp = [state.probe, state.w2], zp = FM.condDemand(wp, q, s).H;
    return { s, wbar, q, zbar, Cbar, wp, zp, Cp: FM.cost(wp, q, s), Fp: CF.fixedInputCost(wp, zbar) };
  }

  // ---------- panel 1: cost as a function of w1 ----------

  function drawMain(th, P) {
    const { s, wbar, q, zbar, Cbar } = P, traces = [], annotations = [], shapes = [];
    const curve = CF.costCurveInW1(state.w2, q, s, W1, 300);
    const fixed = curve.map(([w1]) => [w1, CF.fixedInputCost([w1, state.w2], zbar)]);
    const yMax = Math.max(...curve.map(p => p[1])) * 1.3;
    traces.push(U.line2(curve, th.blue, 3, 'C(w,q): inputs adjust'));
    traces.push({ ...U.line2(fixed, th.ink, 2, 'cost if inputs stay at H(w̄,q)'), fill: 'tonexty', fillcolor: 'rgba(74, 144, 226, 0.15)' });
    // Tangency and slope triangle (C5).
    const d = 0.6, H1 = zbar[0];
    shapes.push({ type: 'path', path: `M ${wbar[0]} ${Cbar} L ${wbar[0] + d} ${Cbar} L ${wbar[0] + d} ${Cbar + H1 * d}`, line: { color: th.ink, width: 1, dash: 'dot' } });
    annotations.push({ x: wbar[0] + d, y: Cbar + H1 * d / 2, text: 'slope = H<sup>1</sup>(w̄,q)  (C5)', showarrow: false, xanchor: 'left', xshift: 6, font: { size: 12, color: th.ink }, bgcolor: th.panel });
    traces.push(U.dot2([[wbar[0], Cbar]], th.ink, 'w̄₁: C = fixed-input cost', 12));
    annotations.push({ x: wbar[0], y: 0, text: 'w̄<sub>1</sub>', showarrow: false, yanchor: 'bottom', yshift: 4, font: { size: 13, color: th.ink } });
    shapes.push({ type: 'line', x0: wbar[0], x1: wbar[0], y0: 0, y1: Cbar, line: { color: th.ink, width: 1, dash: 'dot' } });
    // The compared price w1: the saving from substitution.
    const { wp, Cp, Fp } = P;
    if (Math.abs(wp[0] - wbar[0]) > 1e-9) {
      shapes.push({ type: 'line', x0: wp[0], x1: wp[0], y0: Cp, y1: Math.min(Fp, yMax), line: { color: th.blue, width: 2 } });
      traces.push(U.dot2([[wp[0], Cp]], th.blue, 'C at the compared price', 10));
      annotations.push({ x: wp[0], y: (Cp + Math.min(Fp, yMax)) / 2, text: `saving ${fmt(Fp - Cp)}`, showarrow: false, xanchor: 'left', xshift: 6, font: { size: 12, color: th.blue }, bgcolor: th.panel });
    }
    // Linear: where the cheaper input switches.
    if (s.tech === 'linear') {
      const ws = CF.linearSwitchW1(state.w2, s);
      if (ws > W1[0] && ws < W1[1]) {
        shapes.push({ type: 'line', x0: ws, x1: ws, yref: 'paper', y0: 0, y1: 1, line: { color: th.muted, width: 1, dash: 'dash' } });
        annotations.push({ x: ws, yref: 'paper', y: 1, yanchor: 'top', xanchor: 'left', xshift: 4, showarrow: false, text: 'the cheaper input switches', font: { size: 11, color: th.muted } });
      }
    }
    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'w<sub>1</sub>  (w<sub>2</sub> = ' + fmt(state.w2) + ', q = ' + fmt(q) + ')', yt: 'cost',
      x: { range: [0, W1[1] + 0.1] }, y: { range: [0, yMax] }, annotations, shapes
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('cap-main').innerHTML = s.tech === 'leontief'
      ? 'No substitution possible: cost is linear in w₁ and the saving is zero.'
      : `(C4) concave in ${texStr('w')}: the cost curve lies below every such line. (C2) And it never decreases when a price rises.`;
  }

  // ---------- panel 2: the firm adjusts its inputs ----------

  function inputSpace(th, P, zs, extra) {
    const { s, q } = P, zmax = Math.max(2, 1.7 * Math.max(...zs.flat()));
    const traces = [U.line2(FM.isoquant(q, s, zmax), th.blue, 3, `isoquant q = ${fmt(q)}`)];
    return { zmax, traces, layout: () => U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, zmax], constrain: 'domain' }, y: { range: [0, zmax], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations: extra.annotations || []
    }) };
  }
  const isocostLine = (w, C) => [[C / w[0], 0], [0, C / w[1]]];

  function drawInputs(th, P) {
    const { wbar, zbar, Cbar, wp, zp, Cp } = P, annotations = [];
    const box = inputSpace(th, P, [zbar, zp], { annotations });
    box.traces.push(U.line2(isocostLine(wbar, Cbar), th.ink, 2, `isocost at w̄`));
    box.traces.push(U.dot2([zbar], th.ink, 'z̄ = H(w̄,q)', 12));
    annotations.push({ x: zbar[0], y: zbar[1], text: 'H(w̄,q)', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 12, color: th.ink } });
    if (Math.abs(wp[0] - wbar[0]) > 1e-9) {
      box.traces.push(U.line2(isocostLine(wp, Cp), th.blue, 1.5, `isocost at w₁ = ${fmt(wp[0])}`, 'dash'));
      box.traces.push(U.dot2([zp], th.blue, 'H(w,q)', 11));
      if (Math.hypot(zp[0] - zbar[0], zp[1] - zbar[1]) > 1e-6) {
        annotations.push({ x: zp[0], y: zp[1], ax: zbar[0], ay: zbar[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowcolor: th.blue, arrowwidth: 1.5, text: '' });
      }
      annotations.push({ x: zp[0], y: zp[1], text: `H(w,q), w₁ = ${fmt(wp[0])}`, showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -6, yshift: 4, font: { size: 11, color: th.blue }, bgcolor: th.panel });
    }
    Plotly.react('plotA', box.traces, box.layout(), U.PLOT_CONFIG);
    $('capA').innerHTML = `At ${texStr(`\\bar w_1=${fmt(wbar[0])}`)}: ${texStr('H=')}${U.pt(zbar[0], zbar[1], 3)}. At ${texStr(`w_1=${fmt(wp[0])}`)}: ${texStr('H=')}${U.pt(zp[0], zp[1], 3)}` +
      (P.s.tech === 'leontief' ? ' — the same bundle: no substitution.' : ': the firm moves along the isoquant, away from the input that became dearer.');
  }

  // ---------- panel 3: scaling all prices ----------

  function drawScaling(th, P) {
    const { s, wbar, q, zbar, Cbar } = P, a = state.alpha, aw = [a * wbar[0], a * wbar[1]];
    const za = FM.condDemand(aw, q, s).H, Ca = FM.cost(aw, q, s);
    const box = inputSpace(th, P, [zbar], {});
    box.traces.push(U.line2(isocostLine(aw, Ca), th.ink, 2, `isocost at αw̄, cost ${fmt(Ca)}`));
    box.traces.push(U.dot2([za], th.ink, 'H(αw̄,q)', 12));
    Plotly.react('plotB', box.traces, box.layout(), U.PLOT_CONFIG);
    const ok = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)) ? ' <span class="ok-mark">✓</span>' : ' <span class="no-mark">✗</span>';
    $('scale-readouts').innerHTML = [
      ['\\alpha\\bar w', U.pt(aw[0], aw[1])],
      ['C(\\alpha\\bar w,q)', `${fmt(Ca, 3)} = ${fmt(a)} · ${fmt(Cbar, 3)} = ${texStr('\\alpha C(\\bar w,q)')}${ok(Ca, a * Cbar)}`],
      ['H(\\alpha\\bar w,q)', `${U.pt(za[0], za[1], 3)} = ${texStr('H(\\bar w,q)')}${ok(za[0], zbar[0])}`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('') +
      `<dt></dt><dd class="c-muted" style="font-weight:400">The isocost line keeps its slope ${texStr('-w_1/w_2')} and the bundle does not move.</dd>`;
  }

  // ---------- panel 4: matrix of price effects ----------

  function renderMatrix(P) {
    const { s, wbar, q, zbar, Cbar } = P;
    const item = (good, text) => `<li><span class="mark ${good === null ? 'na' : good ? 'ok' : 'no'}">${good === null ? '–' : good ? '✓' : '✗'}</span><span>${text}</span></li>`;
    let checks;
    if (s.tech === 'cobb' || s.tech === 'ces') {
      const M = CF.priceEffects(wbar, q, s), v = CF.timesPrices(M, wbar), f = x => fmt(Math.abs(x) < 5e-7 ? 0 : x, 3);
      tex($('matrix'), `\\frac{\\partial H(w,q)}{\\partial w^t}=\\begin{bmatrix}${f(M[0][0])} & ${f(M[0][1])}\\\\ ${f(M[1][0])} & ${f(M[1][1])}\\end{bmatrix}`, true);
      const scale = Math.max(1, Math.abs(M[0][0]), Math.abs(M[1][1]));
      checks = [
        item(Math.abs(M[0][1] - M[1][0]) <= 1e-5 * scale, `symmetric: ${texStr('\\partial H^1/\\partial w_2=\\partial H^2/\\partial w_1')} = ${f(M[0][1])}`),
        item(M[0][0] <= 1e-9 && M[1][1] <= 1e-9, `own-price effects ${texStr('\\le0')}: ${f(M[0][0])}, ${f(M[1][1])}`),
        item(Math.abs(v[0]) <= 1e-5 * scale * Math.max(...wbar) && Math.abs(v[1]) <= 1e-5 * scale * Math.max(...wbar), `${texStr('\\frac{\\partial H}{\\partial w^t}\\,w=0')} (H3, Euler): (${f(v[0])}, ${f(v[1])})`)
      ];
    } else if (s.tech === 'leontief') {
      tex($('matrix'), '\\frac{\\partial H(w,q)}{\\partial w^t}=\\begin{bmatrix}0 & 0\\\\ 0 & 0\\end{bmatrix}', true);
      checks = [item(null, 'Leontief: the demand does not react to prices at all, so the matrix is zero (trivially symmetric and negative semi-definite).')];
    } else {
      const tie = FM.unitDemand(wbar, s).kind === 'multiple';
      tex($('matrix'), tie ? '\\frac{\\partial H(w,q)}{\\partial w^t}\\ \\text{not defined here}' : '\\frac{\\partial H(w,q)}{\\partial w^t}=\\begin{bmatrix}0 & 0\\\\ 0 & 0\\end{bmatrix}', true);
      checks = [item(null, tie ? 'Linear at the switch price: the demand jumps from one input to the other, so it is not differentiable here.' : 'Linear: away from the switch price only the cheaper input is used and small price changes do not move it, so the matrix is zero; at the switch it jumps (not differentiable).')];
    }
    $('checks').innerHTML = checks.join('');
    $('readouts').innerHTML = [
      ['C(\\bar w,q)', fmt(Cbar, 3)],
      ['H(\\bar w,q)', U.pt(zbar[0], zbar[1], 3)],
      ['\\lambda^\\ast=\\partial C/\\partial q', fmt(FM.MC(wbar, q, s), 3)]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  // ---------- lecture 4: the area to the left of H^1 between two prices is the change in cost ----------

  function drawArea(th, P) {
    const { s, wbar, q } = P, w2 = wbar[1], wa = wbar[0], wb = state.w1o, lo = Math.min(wa, wb), hi = Math.max(wa, wb);
    const H1 = w1 => FM.condDemand([w1, w2], q, s).H[0];
    const ws = U.linspace(W1[0], W1[1], 300);
    const band = U.linspace(lo, hi, 120);
    if (s.tech === 'linear') { const sw = CF.linearSwitchW1(w2, s); if (sw > lo && sw < hi) band.push(sw - 1e-7 * (hi - lo), sw + 1e-7 * (hi - lo)); band.sort((x, y) => x - y); }
    const zTop = 1.15 * Math.max(...ws.map(H1).filter(Number.isFinite), 1e-3);
    const poly = [[0, lo], ...band.map(w => [H1(w), w]), [0, hi]];
    const traces = [
      { type: 'scatter', mode: 'lines', x: poly.map(v => v[0]), y: poly.map(v => v[1]), fill: 'toself', fillcolor: 'rgba(74,144,226,0.22)', line: { width: 0 }, hoverinfo: 'skip', name: 'area' },
      U.line2(ws.map(w => [H1(w), w]), th.blue, 2.5, 'H¹(w₁, w̄₂, q)'),
      U.dot2([[H1(wa), wa]], th.ink, 'w₁* = w̄₁', 10),
      U.dot2([[H1(wb), wb]], th.blue, 'w₁°', 10)
    ];
    const ann = [
      { x: 0, y: wa, text: 'w<sub>1</sub>*', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { size: 12, color: th.ink } },
      { x: 0, y: wb, text: 'w<sub>1</sub><sup>o</sup>', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { size: 12, color: th.blue } }
    ];
    Plotly.react('plotArea', traces, U.base2d(th, { xt: 'z<sub>1</sub> = H<sup>1</sup>(w<sub>1</sub>, w̄<sub>2</sub>, q)', yt: 'w<sub>1</sub>', x: { range: [0, zTop] }, y: { range: [0, W1[1]] }, annotations: ann }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const area = CF.areaLeftOfH1(w2, q, s, wa, wb), dC = FM.cost([wb, w2], q, s) - FM.cost([wa, w2], q, s);
    const ok = Math.abs(area - Math.abs(dC)) <= 1e-4 * Math.max(1, Math.abs(dC));
<<<<<<< HEAD
    $('capArea').innerHTML = `Because ${texStr('H^1(w,q)=\\partial C(w,q)/\\partial w_1')}, the shaded area to the left of the conditional demand curve, ${texStr(`\\int_{${fmt(lo, 2)}}^{${fmt(hi, 2)}}H^1(w_1,\\bar w_2,q)\\,\\mathrm dw_1=${fmt(area, 4)}`)}, reflects the change in cost that the price change induces: ${texStr(`C(w_1^o,\\bar w_2,q)-C(w_1^\\ast,\\bar w_2,q)=${fmt(dC, 4)}`)} <span class="${ok ? 'ok-mark' : 'no-mark'}">${ok ? '✓' : '✗'}</span>`;
=======
    // As in the notes: the integral from w1* (= the reference price) to w1^o equals the change in cost; the shaded area is its size.
    $('capArea').innerHTML = `Because ${texStr('H^1(w,q)=\\partial C(w,q)/\\partial w_1')}, the integral along the conditional demand curve from ${texStr(`w_1^\\ast=\\bar w_1=${fmt(wa, 2)}`)} to ${texStr(`w_1^o=${fmt(wb, 2)}`)} is the change in cost the price change induces: ${texStr(`\\int_{w_1^\\ast}^{w_1^o}H^1(w_1,\\bar w_2,q)\\,\\mathrm dw_1=C(w_1^o,\\bar w_2,q)-C(w_1^\\ast,\\bar w_2,q)=${fmt(dC, 4)}`)}. The shaded area to the left of the curve is its size, ${fmt(area, 4)} <span class="${ok ? 'ok-mark' : 'no-mark'}">${ok ? '✓' : '✗'}</span>`;
>>>>>>> 40baa6a22a6e5f3bc4b11bbf79b9556039b5218a
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ces: state.tech === 'ces' });
    const P = solve(), th = U.theme(), f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    guard('cost plot', () => drawMain(th, P));
    guard('input plot', () => drawInputs(th, P));
    guard('scaling plot', () => drawScaling(th, P));
    guard('matrix', () => renderMatrix(P));
    guard('area plot', () => drawArea(th, P));
  }

  // Pointer on the cost plot: hover compares a price, press or drag moves the reference price.
  function setupPointer() {
    const gd = $('plot');
    let down = false;
    const at = ev => { const d = U.eventToData(gd, ev); return d ? U.clampTo(Number(d[0].toFixed(2)), W1[0], W1[1]) : null; };
    gd.addEventListener('pointermove', ev => { const x = at(ev); if (x === null) return; if (down) ctrls.w1.set(x); else ctrls.probe.set(x); }, true);
    gd.addEventListener('pointerdown', ev => { const x = at(ev); if (x === null) return; down = true; ctrls.w1.set(x); if (gd.setPointerCapture) gd.setPointerCapture(ev.pointerId); ev.preventDefault(); }, true);
    const up = () => { down = false; };
    gd.addEventListener('pointerup', up, true);
    gd.addEventListener('pointercancel', up, true);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    render();
    setupPointer();
    const ga = $('plotArea');
    ga.addEventListener('click', ev => { const d = U.eventToData(ga, ev); if (d) ctrls.w1o.set(U.clampTo(d[1], W1[0], W1[1])); });
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (CF || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
