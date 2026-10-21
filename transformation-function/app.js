/*
 * One Frontier, Four Names: interface and plotting (lecture 8).
 * Four slices of the frontier Phi(q) = 0 through one plan q, each in the plane of two goods with the other two fixed.
 * The red point can be dragged along each slice; that moves the plan, and all four slices follow.
 */
(function () {
  'use strict';

  const M = window.PhiModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  const DEF = { L: 16, A: 4, deg: 40 };
  const state = { ...DEF, zview: false, low: true };
  const LIM = { L: [2, 40], A: [1, 10], deg: [5, 85] };
  let ctrls = {}, frozen = null;   // frozen: the axis ranges, held while a point is dragged
  const schedule = U.scheduler(render);
  const rad = d => d * Math.PI / 180;
  const S = 0, P = 1, LAB = 2, LAND = 3;   // indices of the goods in q
  const SUB = ['s', 'p', 'L', 'A'], NAME = ['sausages', 'potatoes', 'labour', 'land'];
  const isInput = i => i >= 2;

  // The four panels: the goods on the axes, and how the plan moves along the slice (a new L, A, th for a parameter).
  const PANELS = {
    trs: { x: LAB, y: LAND },
    mp: { x: LAB, y: S },
    mrt: { x: S, y: P },
    mir: { x: S, y: LAB }
  };

  const qNow = () => M.plan(state.L, state.A, rad(state.deg));
  const inLimits = n => n && n.L >= LIM.L[0] - 1e-9 && n.L <= LIM.L[1] + 1e-9 && n.A >= LIM.A[0] - 1e-9 && n.A <= LIM.A[1] + 1e-9 &&
    n.th >= rad(LIM.deg[0]) - 1e-9 && n.th <= rad(LIM.deg[1]) + 1e-9;
  // display coordinate of good i: the netput, or, in the lecture 1 view, an input as z = -q
  const disp = (i, v) => (state.zview && isInput(i) ? -v : v);

  // Samples of each slice: the plans one reaches by moving along it, with the point they put in the panel.
  function samples(key, q) {
    const out = [], L = -q[2], A = -q[3], c = q[0] * q[0] + (q[1] / M.B) ** 2;
    const logs = (a, b, n) => U.linspace(Math.log(a), Math.log(b), n).map(Math.exp);
    if (key === 'trs') for (const l of logs(c / (2.6 * A), 2.6 * L, 220)) out.push(M.alongIso(q, l));
    else if (key === 'mp' || key === 'mir') {
      const l0 = (q[1] / M.B) ** 2 / A;   // the labour that just makes the fixed potatoes, no sausages
      for (const l of logs(l0 * 1.0005 + 1e-9, 2.6 * L, 220)) out.push(M.alongSausages(q, l));
    } else for (const t of U.linspace(0, Math.PI / 2, 160)) out.push(M.alongFrontier(q, t));
    return out.filter(Boolean).map(n => {
      const r = M.plan(n.L, n.A, n.th), p = PANELS[key];
      return { n, pt: [disp(p.x, r[p.x]), disp(p.y, r[p.y])] };
    });
  }

  // Axis ranges of a panel: the slice up to 2.5 times the plan's inputs, and a little of the other quadrants, so that the
  // axes cross at 0 (in the lecture 1 view the input axes are mirrored).
  function ranges(key, q) {
    const L = -q[2], A = -q[3], f = M.phi(L, A), sMax = M.sausages(q, -2.5 * L);
    const inp = v => (state.zview ? [-0.06 * v, 2.5 * v] : [-2.5 * v, 0.06 * v]);
    const out = v => [-0.06 * v, 1.12 * v];
    if (key === 'trs') return { x: inp(L), y: inp(A) };
    if (key === 'mp') return { x: inp(L), y: out(sMax) };
    if (key === 'mir') return { x: out(sMax), y: inp(L) };
    return { x: out(f), y: out(M.B * f) };
  }

  function drawPanel(key, th, q, R) {
    const p = PANELS[key], smp = samples(key, q), r = R[key];
    const pt = [disp(p.x, q[p.x]), disp(p.y, q[p.y])];
    // slope in the figure: dq_y/dq_x = -Phi_x/Phi_y, with a sign for each axis shown as z = -q
    const sgn = (state.zview && isInput(p.x) ? -1 : 1) * (state.zview && isInput(p.y) ? -1 : 1);
    const m = -M.slope(q, p.x, p.y) * sgn;
    const dxN = 1 / (r.x[1] - r.x[0]), dyN = m / (r.y[1] - r.y[0]), k = 0.3 / Math.hypot(dxN, dyN);
    const tan = [[pt[0] - k, pt[1] - k * m], [pt[0] + k, pt[1] + k * m]];
    const traces = [];
    if (key === 'mrt' && state.low) {
      // the frontier of outputs with 60% of both inputs: phi is homogeneous of degree 1, so 60% of the capacity
      const f = 0.6 * M.phi(state.L, state.A);
      traces.push(U.line2(U.linspace(0, Math.PI / 2, 100).map(t => [f * Math.cos(t), M.B * f * Math.sin(t)]), th.muted, 1.5, 'less input (60%)', 'dash'));
    }
    traces.push(U.line2(smp.map(s => s.pt), th.ink, 2.5, 'the frontier, other netputs fixed'));
    traces.push(U.line2(tan, th.accent2, 2, 'tangent', 'dot'));
    traces.push(U.dot2([pt], th.red, 'the plan q (drag it)', 12));
    const lab = i => (state.zview && isInput(i) ? `z<sub>${SUB[i]}</sub> (${NAME[i]})` : `q<sub>${SUB[i]}</sub> (${NAME[i]}${isInput(i) ? ', net' : ''})`);
    const ax = { zeroline: true, zerolinecolor: th.muted, zerolinewidth: 1.3 };
    U.plot('p-' + key, traces, U.base2d(th, { xt: lab(p.x), yt: lab(p.y), x: { range: r.x, ...ax }, y: { range: r.y, ...ax }, margin: { l: 50, r: 8, t: 6, b: 42 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    return smp;
  }

  // The slope above each panel, in netputs or, in the lecture 1 view, in inputs z.
  function slopeText(key, q) {
    const p = PANELS[key], v = fmt(M.slope(q, p.x, p.y)), i = SUB[p.x], j = SUB[p.y];
    const net = `-\\frac{dq_${j}}{dq_${i}}=\\frac{\\Phi_${i}}{\\Phi_${j}}=${v}`;
    const what = s => ` <span class="what">${s}</span>`;
    if (key === 'trs') return state.zview ? texStr(`MRTS_{LA}=-\\frac{dz_A}{dz_L}=\\frac{\\phi_L}{\\phi_A}=${v}`) + what('as in lecture 1') : texStr(net) + what('the MRTS of lecture 1');
    if (key === 'mp') return (state.zview ? texStr(`\\frac{dq_s}{dz_L}=${v}`) : texStr(net)) + what('sausages per extra hour of labour');
    if (key === 'mir') return (state.zview ? texStr(`\\frac{dz_L}{dq_s}=${v}`) : texStr(net)) + what('hours of labour per extra sausage');
    return texStr(net) + what('potatoes given up per extra sausage');
  }

  let smpNow = {};
  function render() {
    const th = U.theme(), q = qNow();
    const R = frozen || {};
    for (const key of Object.keys(PANELS)) if (!frozen) R[key] = ranges(key, q);
    for (const key of Object.keys(PANELS)) {
      guard('figure', () => { smpNow[key] = drawPanel(key, th, q, R); });
      $('s-' + key).innerHTML = slopeText(key, q);
    }
    const g = M.grad(q), mp = M.slope(q, LAB, S), mir = M.slope(q, S, LAB);
    U.tex($('tech'), '\\begin{gathered}\\Phi(q)=\\sqrt{q_s^2+(q_p/2)^2}-\\phi(-q_L,-q_A)\\\\[3pt]\\phi(z_L,z_A)=\\sqrt{z_Lz_A}\\\\[3pt]\\text{outputs }q_s,q_p\\ge0,\\ \\ \\text{inputs }q_L,q_A\\le0\\end{gathered}', true);
    const item = html => `<li><span class="mark ok">✓</span><span>${html}</span></li>`;
    $('nums').innerHTML = [
      item(`The plan ${texStr(`q=(${q.map(v => fmt(v)).join(',\\,')})`)}, on the frontier: ${texStr('\\Phi(q)=0')}`),
      item(`${texStr(`(\\Phi_s,\\Phi_p,\\Phi_L,\\Phi_A)=(${g.map(v => fmt(v)).join(',\\,')})`)}, all positive`),
      item(`Technical rate of substitution ${texStr(`\\Phi_L/\\Phi_A=\\phi_L/\\phi_A=z_A/z_L=${fmt(state.A / state.L)}`)}`),
      item(`Marginal productivity × marginal input requirement: ${texStr(`\\frac{\\Phi_L}{\\Phi_s}\\cdot\\frac{\\Phi_s}{\\Phi_L}=${fmt(mp)}\\cdot${fmt(mir)}=1`)}`)
    ].join('');
    $('side-cap').innerHTML = `More of any netput is harder to reach, so all four partial derivatives are positive and every slice slopes down: one formula serves all four. With only sausages (${texStr('q_p=0')}), ${texStr('\\Phi(q)=q_s-\\phi(z)')} with ${texStr('z=-q')}: the production function of lecture 1, and ${texStr('\\Phi_L/\\Phi_s=\\phi_L')}.`;
    $('cap').innerHTML = `<b>Drag the red point</b> along a curve: the other two netputs stay fixed, and the other three figures follow. The <span class="c-accent-2">dotted line</span> is the tangent; its slope is the number above the figure.` +
      (state.low ? ' Dashed, bottom left: the frontier of outputs with 60% of both inputs, as in the notes (low and high input).' : '');
  }

  // Dragging: the point goes to the nearest point of its slice (measured on the figure), within the sliders' limits.
  function bindDrag(key) {
    U.dragPoint('p-' + key, {
      target: () => { const q = qNow(), p = PANELS[key]; return [disp(p.x, q[p.x]), disp(p.y, q[p.y])]; },
      start: () => { frozen = {}; for (const k of Object.keys(PANELS)) { const gd = $('p-' + k); frozen[k] = { x: gd._fullLayout.xaxis.range.slice(), y: gd._fullLayout.yaxis.range.slice() }; } },
      move: ([x, y]) => {
        const r = frozen[key], dx = r.x[1] - r.x[0], dy = r.y[1] - r.y[0];
        let best = null, bd = Infinity;
        for (const s of smpNow[key]) {
          if (!inLimits(s.n)) continue;
          const d = Math.hypot((s.pt[0] - x) / dx, (s.pt[1] - y) / dy);
          if (d < bd) { bd = d; best = s.n; }
        }
        if (!best) return;
        ctrls.L.setExact(best.L); ctrls.A.setExact(best.A); ctrls.deg.setExact(best.th * 180 / Math.PI);
      },
      end: () => { frozen = null; schedule(); }
    });
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('zview').addEventListener('change', e => { state.zview = e.target.checked; schedule(); });
    $('low').addEventListener('change', e => { state.low = e.target.checked; schedule(); });
    $('reset').addEventListener('click', () => { for (const k of Object.keys(DEF)) ctrls[k].setExact(DEF[k]); });
    render();
    for (const key of Object.keys(PANELS)) bindDrag(key);
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M, 'transformation-function/model.js')) guard('page', init);
})();
