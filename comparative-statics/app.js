/*
 * What If? Comparative Statics: interface and plotting (lecture 4, section 1).
 * Firm math from shared/firm-model.js; comparative statics from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, CS = window.CompStatModel, U = window.Microvis, FU = window.FirmUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', a: 2, m: 1, k: 0.6, p: 8, w2: 1, w1: 2, w1n: 1 };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: 1, k: state.k, a: state.a, m: state.m });

  let ctrls = {}, hold = null;   // hold: the axes of the demand figure, kept fixed while a point is dragged
  const schedule = U.scheduler(render);

  function solve() {
    const s = tech(), w = [state.w1, state.w2], p = state.p;
    return { s, w, p, pts: CS.points(w, p, s, state.w1n) };
  }

  // A z1 scale for when the firm produces nothing (at both prices, or at the old one): its conditional demand at the
  // output of minimum average cost, so that the axes stay readable instead of shrinking to 0.
  const zRef = (s, w) => { const hat = FM.minAC(w, s), q = hat.qHat > 0 ? hat.qHat : 1; return FM.condDemand(w, q, s).H[0]; };

  const ok = good => good ? '<span class="ok-mark">✓</span>' : '<span class="no-mark">✗</span>';
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));

  // ---------- the first Cowell figure ----------

  function drawMain(th, P) {
    const { s, p, pts } = P, w1a = state.w1, w1b = state.w1n, w2 = state.w2;
    const wTop = hold ? hold.wTop : Math.max(w1a, w1b) * 1.6, wLow = Math.max(0.15, Math.min(w1a, w1b) * 0.45);
    const zMax = hold ? hold.zMax : 1.45 * Math.max(pts.zStar, pts.zO, pts.zStarStar, pts.zStar > 0 || pts.zStarStar > 0 ? 1e-3 : zRef(s, [w1a, w2]));
    drawMain.axes = { wTop, zMax };
    const traces = [], annotations = [], shapes = [];
    const clipX = c => c.map(([z, w]) => [z <= zMax * 1.5 ? z : null, w]);
    traces.push(U.line2(clipX(CS.demandCurve(w2, p, s, wLow, wTop, 220)), th.ink, 2.5, 'ordinary demand D¹'));
    if (pts.qBefore > 0) traces.push(U.line2(clipX(CS.conditionalCurve(w2, pts.qBefore, s, wLow, wTop, 160)), th.ink, 1.8, `conditional demand, q = ${fmt(pts.qBefore)}`, 'dash'));
    if (pts.qAfter > 0 && Math.abs(pts.qAfter - pts.qBefore) > 1e-6) traces.push(U.line2(clipX(CS.conditionalCurve(w2, pts.qAfter, s, wLow, wTop, 160)), th.muted, 1.8, `conditional demand, q = ${fmt(pts.qAfter)}`, 'dash'));

    // Price lines and the three points.
    shapes.push({ type: 'line', x0: 0, x1: pts.zStar, y0: w1a, y1: w1a, line: { color: th.muted, width: 1, dash: 'dot' } });
    shapes.push({ type: 'line', x0: 0, x1: Math.max(pts.zO, pts.zStarStar), y0: w1b, y1: w1b, line: { color: th.muted, width: 1, dash: 'dot' } });
    const drop = (z, w) => shapes.push({ type: 'line', x0: z, x1: z, y0: 0, y1: w, line: { color: th.muted, width: 1, dash: 'dot' } });
    drop(pts.zStar, w1a); drop(pts.zO, w1b); drop(pts.zStarStar, w1b);
    traces.push(U.dot2([[pts.zO, w1b]], th.blue, 'z₁° (substitution)', 11));
    traces.push(U.dot2([[pts.zStar, w1a]], th.ink, 'z₁* at w₁ (drag it)', 14));
    traces.push(U.dot2([[pts.zStarStar, w1b]], th.red, 'z₁** at w₁′ (drag it)', 14));
    const lab = (x, text, color) => annotations.push({ x, y: 0, text, showarrow: false, yanchor: 'bottom', yshift: 16, font: { size: 13, color } });
    lab(pts.zStar, 'z<sub>1</sub><sup>*</sup>', th.ink); lab(pts.zO, 'z<sub>1</sub><sup>o</sup>', th.blue); lab(pts.zStarStar, 'z<sub>1</sub><sup>**</sup>', th.red);
    // Arrows along the z1 axis: substitution (blue) then scale (red).
    const y0 = 0.025 * wTop;
    const arrow = (from, to, color) => { if (Math.abs(to - from) > 1e-6) annotations.push({ x: to, y: y0, ax: from, ay: y0, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color, text: '' }); };
    arrow(pts.zStar, pts.zO, th.blue); arrow(pts.zO, pts.zStarStar, th.red);
    // Price change arrow on the w1 axis.
    annotations.push({ x: 0, y: w1b, ax: 0, ay: w1a, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: th.ink, text: '' });
    annotations.push({ x: 0, y: (w1a + w1b) / 2, text: w1b < w1a ? 'price fall' : 'price rise', textangle: -90, showarrow: false, xanchor: 'left', xshift: 4, font: { size: 11, color: th.ink } });

    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'w<sub>1</sub>', x: { range: [0, zMax] }, y: { range: [0, wTop] }, annotations, shapes,
      margin: { l: 56, r: 12, t: 8, b: 44 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  // ---------- the second Cowell figure: area = change in cost ----------

  function drawArea(th, P) {
    const { s, w, pts } = P, w1a = state.w1, w1b = state.w1n, w2 = state.w2, q = pts.qBefore;
    const lo = Math.min(w1a, w1b), hi = Math.max(w1a, w1b), wTop = hi * 1.6, wLow = Math.max(0.15, lo * 0.45);
    const curve = CS.conditionalCurve(w2, q, s, wLow, wTop, 200);
    const band = CS.conditionalCurve(w2, q, s, lo, hi, 80);
    const poly = [[0, lo], ...band, [0, hi]];
    const zMax = 1.6 * Math.max(...band.map(b => b[0]), q > 0 ? 1e-3 : zRef(s, w));
    const traces = [
      { type: 'scatter', mode: 'lines', x: poly.map(v => v[0]), y: poly.map(v => v[1]), fill: 'toself', fillcolor: 'rgba(155,155,155,0.35)', line: { width: 0 }, hoverinfo: 'skip' },
      U.line2(curve.map(([z, w1]) => [z <= zMax * 1.5 ? z : null, w1]), th.ink, 2.5, 'conditional demand H¹(w,q*)')
    ];
    const zA = CS.points([w1a, w2], state.p, s, w1a).zStar, zB = FM.condDemand([w1b, w2], q, s).H[0];
    traces.push(U.dot2([[zA, w1a], [zB, w1b]], th.ink, 'points', 9));
    const area = CS.areaLeftOfH(w2, q, s, lo, hi), dC = Math.abs(FM.cost([w1a, w2], q, s) - FM.cost([w1b, w2], q, s));
    Plotly.react('plotB', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'w<sub>1</sub>', x: { range: [0, zMax] }, y: { range: [0, wTop] },
      annotations: [q > 0
        ? { x: Math.min(zA, zB) / 2, y: (lo + hi) / 2, text: 'change in cost', showarrow: false, font: { size: 12, color: th.ink } }
        : { xref: 'paper', x: 0.5, y: (lo + hi) / 2, text: 'no production at the old price: q* = 0, no change in cost', showarrow: false, font: { size: 12, color: th.muted } }]
    }), U.PLOT_CONFIG);
    // As in the notes: the integral from the old to the new price is the change in cost; the shaded area is its size.
    const dCsigned = FM.cost([w1b, w2], q, s) - FM.cost([w1a, w2], q, s);
    $('capB').innerHTML = `Because ${texStr('H^1(w,q)=\\partial C(w,q)/\\partial w_1')}, the integral along the conditional demand curve from the old price ${texStr(`w_1=${fmt(w1a)}`)} to the new price ${texStr(`w_1'=${fmt(w1b)}`)} is the change in cost at the output ${texStr(`q^\\ast=${fmt(q, 3)}`)}: ${texStr(`\\int_{w_1}^{w_1'}H^1(w_1,w_2,q^\\ast)\\,\\mathrm dw_1=C(w',q^\\ast)-C(w,q^\\ast)=${fmt(dCsigned, 4)}`)}. The shaded area is its size, ${fmt(area, 4)} ${ok(same(area, dC))}`;
  }

  // ---------- formulas with numerical checks ----------

  function renderChecks(P) {
    const { s, w, p, pts } = P;
    if (!(pts.qBefore > 0) || FM.supply(w, p, s).kind !== 'interior') {
      $('checks').innerHTML = '<li><span class="mark na">–</span><span>At these prices the firm does not produce (p below minimum average cost), so the derivatives are not defined. Raise p.</span></li>';
      $('readouts').innerHTML = '';
      return;
    }
    const d = CS.decomposeOwn(w, p, s, 0), sp = CS.supplySlopeP(w, p, s), sw = CS.supplySlopeW(w, p, s, 0);
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const f = x => fmt(x, 4);
    $('checks').innerHTML = [
      `<li><span class="mark na">·</span><span>Derivatives at the starting price ${texStr(`w_1=${fmt(w[0])}`)}, ${texStr(`q^\\ast=${fmt(pts.qBefore)}`)}; the figure shows the whole change to ${texStr(`w_1'=${fmt(state.w1n)}`)}.</span></li>`,
      item(d.Cqq > 0, `SOSC: ${texStr(`C_{qq}=${f(d.Cqq)}>0`)}`),
      item(same(sp.formula, sp.numeric), `${texStr(`\\frac{\\mathrm dq^\\ast}{\\mathrm dp}=\\frac{1}{C_{qq}}=${f(sp.formula)}`)} <span class="c-muted">finite difference ${texStr('\\partial S/\\partial p')}: ${f(sp.numeric)}</span>`),
      item(same(sw.formula, sw.numeric), `(∗) ${texStr(`\\frac{\\mathrm dq^\\ast}{\\mathrm dw_1}=-\\frac{1}{C_{qq}}\\frac{\\partial H^1}{\\partial q}=${f(sw.formula)}`)} <span class="c-muted">finite difference ${texStr('\\partial S/\\partial w_1')}: ${f(sw.numeric)}</span>`),
      item(same(d.substitution + d.scale, d.total), `(∗∗) ${texStr(`\\frac{\\partial D^1}{\\partial w_1}=\\color{#4a90e2}{${f(d.substitution)}}\\color{#d0021b}{+(${f(-1 / d.Cqq)})(${f(d.dHdq)})^2}=${f(d.substitution + d.scale)}`)} <span class="c-muted">finite difference: ${f(d.total)}</span>`)
    ].join('');
    $('readouts').innerHTML = [
      ['\\text{signs}', `${texStr('(-)\\ +\\ (-)(+)')}: both effects lower the demand for input 1 when ${texStr('w_1')} rises`],
      ['q^\\ast\\to q^{\\ast\\ast}', `${fmt(pts.qBefore, 3)} → ${fmt(pts.qAfter, 3)}`],
      ['z_1^\\ast,\\ z_1^o,\\ z_1^{\\ast\\ast}', `${fmt(pts.zStar, 3)}, <span class="c-l2-blue">${fmt(pts.zO, 3)}</span>, <span class="c-l2-red">${fmt(pts.zStarStar, 3)}</span>`],
      ['\\text{substitution, scale}', (([a, b, t]) => `<span class="c-l2-blue">${a}</span> + <span class="c-l2-red">${b}</span> = ${t}`)(U.fmtSum([pts.zO - pts.zStar, pts.zStarStar - pts.zO]))]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ces: state.tech === 'ces', ushape: state.profile === 'ushape', homog: state.profile === 'homog' });
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
    const P = solve(), th = U.theme(), f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    guard('demand plot', () => drawMain(th, P));
    guard('area plot', () => drawArea(th, P));
    guard('formulas', () => renderChecks(P));
  }

  // Several points in one figure that can be dragged: the one nearest the pointer when it goes down is moved.
  // points: [{ at: () => [x, y] or null, move: ([x, y]) => {} }]
  function dragNearest(id, points, opts = {}) {
    const gd = $(id);
    let pick = 0, down = false;
    const choose = ev => {
      const fl = gd._fullLayout;
      if (!fl || !fl.xaxis) return;
      const b = gd.getBoundingClientRect(), xa = fl.xaxis, ya = fl.yaxis;
      let best = Infinity;
      points.forEach((p, i) => {
        const t = p.at();
        if (!t) return;
        const d = Math.hypot(ev.clientX - b.left - xa._offset - xa.c2p(t[0]), ev.clientY - b.top - ya._offset - ya.c2p(t[1]));
        if (d < best) { best = d; pick = i; }
      });
    };
    // registered before U.dragPoint's own handlers, so the choice is made before the drag starts
    gd.addEventListener('pointerdown', choose, true);
    gd.addEventListener('pointermove', ev => { if (!down) choose(ev); }, true);
    U.dragPoint(gd, {
      target: () => points[pick].at(),
      move: v => points[pick].move(v),
      start: () => { down = true; if (opts.start) opts.start(); },
      end: () => { down = false; if (opts.end) opts.end(); }
    });
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    // Drag the points of the demand figure up or down: the old price w1 and the new price w1'. The axes stay put meanwhile.
    const lim = (k, v) => Math.min(ctrls[k].max, Math.max(ctrls[k].min, v));
    const pts = () => CS.points([state.w1, state.w2], state.p, tech(), state.w1n);
    dragNearest('plot', [
      { at: () => [pts().zStar, state.w1], move: ([, y]) => ctrls.w1.setExact(lim('w1', y)) },
      { at: () => [pts().zStarStar, state.w1n], move: ([, y]) => ctrls.w1n.setExact(lim('w1n', y)) }
    ], { start: () => { hold = drawMain.axes || null; }, end: () => { hold = null; schedule(); } });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (CS || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
