/*
 * The Transformation Function: interface and plotting (lecture 8).
 * The frontier Phi(q) = 0 for four pairs of goods, each with the other two goods fixed at the plan q (a "slice").
 * The red point can be dragged along each slice; that moves the plan, and the other figures follow.
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
  const state = { ...DEF, zview: false, low: true, dim: '2d', fix: 'land', cam: '3d', planes: true };
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

  // ---------- 3D: the frontier with one good fixed ----------
  // Land fixed: the labour needed for each pair of outputs, z_L = (q_s^2 + (q_p/B)^2) / z_A; its height lines are the
  // frontiers of outputs. Potatoes fixed: the sausages made from labour and land, q_s = sqrt(z_L z_A - (q_p/B)^2); its
  // height lines are the isoquants. Inputs are drawn as netputs (q = -z) unless the lecture 1 view is on.

  const clone = o => JSON.parse(JSON.stringify(o));
  const ortho = (eye, up) => ({ eye, up, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } });
  // cameras: in 3D from the corner where all goods are small; from above (the height lines) and from the side
  const CAMERAS = {
    land: { '3d': { eye: { x: 1.45, y: 1.05, z: 0.62 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.1 }, projection: { type: 'perspective' } },
      top: ortho({ x: 0, y: 0, z: 0.95 }, { x: 0, y: 1, z: 0 }), side: ortho({ x: 0, y: -0.95, z: 0 }, { x: 0, y: 0, z: 1 }) },
    potatoes: { '3d': { eye: { x: -1.4, y: -1.12, z: 0.66 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.12 }, projection: { type: 'perspective' } },
      top: ortho({ x: 0, y: 0, z: 0.95 }, { x: 0, y: 1, z: 0 }), side: ortho({ x: 0, y: -0.95, z: 0 }, { x: 0, y: 0, z: 1 }) }
  };
  // the camera for a view; with potatoes fixed it looks from the corner where both inputs are 0 (which, in netputs, is
  // the corner of the largest coordinates)
  function camFor(fix, cam) {
    const c = clone(CAMERAS[fix][cam]);
    if (fix === 'potatoes' && cam === '3d' && !state.zview) { c.eye.x = -c.eye.x; c.eye.y = -c.eye.y; }
    // on a narrow screen the camera stands further back, so that the whole surface and its axes fit
    if (cam === '3d' && window.innerWidth < 600) for (const k of ['x', 'y', 'z']) c.eye[k] *= 1.3;
    return c;
  }
  // (an orthographic view is zoomed by its aspect ratio: from above and from the side the figure fills the panel)
  const ASPECT = { '3d': { x: 1, y: 1, z: 0.75 }, top: { x: 1.75, y: 1.75, z: 1.3 }, side: { x: 1.75, y: 1.75, z: 1.3 } };
  let camera = null;   // set in init (camFor needs the state)
  const sgnIn = () => (state.zview ? 1 : -1);   // inputs on the axes: z, or the netput q = -z
  const line3 = (pts, color, width, dash) => ({ type: 'scatter3d', mode: 'lines', x: pts.map(a => a[0]), y: pts.map(a => a[1]), z: pts.map(a => a[2]), line: { color, width, dash: dash || 'solid' }, hoverinfo: 'skip' });
  // a translucent rectangle: corners a, b, c, d in order
  const plane = (a, b, c, d, color) => ({
    type: 'surface', x: [[a[0], b[0]], [d[0], c[0]]], y: [[a[1], b[1]], [d[1], c[1]]], z: [[a[2], b[2]], [d[2], c[2]]],
    colorscale: [[0, color], [1, color]], surfacecolor: [[0, 0], [0, 0]], showscale: false, opacity: 0.13, hoverinfo: 'skip',
    lighting: { ambient: 1, diffuse: 0, specular: 0 }, contours: { x: { highlight: false }, y: { highlight: false }, z: { highlight: false } }
  });

  function draw3d(th, q) {
    const g = sgnIn(), L = -q[2], A = -q[3], s0 = q[0], p0 = q[1], c = (p0 / M.B) ** 2, traces = [];
    const step = v => { const e = Math.pow(10, Math.floor(Math.log10(v / 6))), m = v / 6 / e; return (m < 1.5 ? 1 : m < 3.5 ? 2 : 5) * e; };
    let axes, heightMax;
    const surf = (X, Y, Zabs, title, hstep) => ({
      type: 'surface', x: X, y: Y, z: Zabs.map(r => r.map(v => (v === null ? null : title.input ? g * v : v))), surfacecolor: Zabs,
      colorscale: U.SURFACE_SCALE, cmin: 0, cmax: heightMax, showscale: false, opacity: 0.92,
      contours: {
        x: { highlight: false }, y: { highlight: false },
        // height lines every hstep (for a netput height, at -hstep, -2 hstep, ...)
        z: { show: true, ...(title.input && g < 0 ? { start: -Math.floor(heightMax / hstep) * hstep, end: -hstep } : { start: hstep, end: heightMax }), size: hstep, color: th.dark ? '#1b1f27' : '#ffffff', width: 2, highlight: false }
      },
      lighting: { ambient: 0.72, diffuse: 0.5, specular: 0.05, roughness: 0.9 },
      hovertemplate: title.hover + '<extra></extra>'
    });
    if (state.fix === 'land') {
      // polar grid over the outputs: radius r is the capacity phi, so the edge is a frontier of outputs
      const R = M.phi(2.2 * L, A), rs = U.linspace(0, R, 46), ts = U.linspace(0, Math.PI / 2, 46);
      heightMax = R * R / A;
      const X = ts.map(t => rs.map(r => r * Math.cos(t))), Y = ts.map(t => rs.map(r => M.B * r * Math.sin(t))), Z = ts.map(() => rs.map(r => r * r / A));
      const hstep = step(heightMax);
      traces.push(surf(X, Y, Z, { input: true, hover: 'sausages %{x:.2f}<br>potatoes %{y:.2f}<br>' + (g > 0 ? 'labour z<sub>L</sub>' : 'labour q<sub>L</sub>') + ' %{z:.2f}' }, hstep));
      const f = M.phi(L, A), ring = (cap, lab) => U.linspace(0, Math.PI / 2, 80).map(t => [cap * Math.cos(t), M.B * cap * Math.sin(t), g * lab]);
      if (state.planes && state.cam === '3d') {
        traces.push(plane([0, 0, g * L], [R * 1.05, 0, g * L], [R * 1.05, M.B * R * 1.05, g * L], [0, M.B * R * 1.05, g * L], th.ink));
        traces.push(plane([0, p0, 0], [R * 1.05, p0, 0], [R * 1.05, p0, g * heightMax], [0, p0, g * heightMax], th.accent2));
      }
      if (state.low) traces.push(line3(ring(0.6 * f, 0.36 * L), th.muted, 5, 'dash'));
      traces.push(line3(ring(f, L), th.ink, 8));
      const smax = Math.sqrt(Math.max(0, R * R - c));
      traces.push(line3(U.linspace(0, smax, 80).map(x => [x, p0, g * (x * x + c) / A]), th.accent2, 8));
      traces.push({ type: 'scatter3d', mode: 'markers', x: [s0], y: [p0], z: [g * L], marker: { color: th.red, size: 7, line: { color: '#ffffff', width: 1 } }, hovertemplate: 'the plan q<extra></extra>' });
      axes = { x: ['sausages', [0, R * 1.05]], y: ['potatoes', [0, M.B * R * 1.05]], z: [g > 0 ? 'labour' : 'labour (netput)', g > 0 ? [0, heightMax] : [-heightMax, 0]] };
    } else {
      // labour and land up to 2.5 times the plan's, from the curve where no sausages are left (a clean edge)
      const Lm = 2.5 * L, Am = 2.5 * A, l0 = Math.max(c / Am, 1e-6) * 1.0001, ls = U.linspace(l0, Lm, 50), us = U.linspace(0, 1, 40);
      heightMax = Math.sqrt(Lm * Am - c);
      const X = us.map(() => ls.map(l => g * l)), Y = us.map(u => ls.map(l => g * (c / l + u * (Am - c / l)))), Z = us.map(u => ls.map(l => Math.sqrt(Math.max(0, l * (c / l + u * (Am - c / l)) - c))));
      const hstep = step(heightMax);
      traces.push(surf(X, Y, Z, { input: false, hover: (g > 0 ? 'labour z<sub>L</sub> %{x:.2f}<br>land z<sub>A</sub> %{y:.2f}' : 'labour q<sub>L</sub> %{x:.2f}<br>land q<sub>A</sub> %{y:.2f}') + '<br>sausages %{z:.2f}' }, hstep));
      if (state.planes && state.cam === '3d') {
        traces.push(plane([0, 0, s0], [g * Lm, 0, s0], [g * Lm, g * Am, s0], [0, g * Am, s0], th.ink));
        traces.push(plane([0, g * A, 0], [g * Lm, g * A, 0], [g * Lm, g * A, heightMax], [0, g * A, heightMax], th.accent2));
      }
      const k = s0 * s0 + c;   // the isoquant at the plan's sausages: z_L z_A = k
      traces.push(line3(U.linspace(Math.max(k / Am, 1e-6), Lm, 90).map(l => [g * l, g * k / l, s0]), th.ink, 8));
      traces.push(line3(U.linspace(c / A, Lm, 90).map(l => [g * l, g * A, Math.sqrt(Math.max(0, l * A - c))]), th.accent2, 8));
      traces.push({ type: 'scatter3d', mode: 'markers', x: [g * L], y: [g * A], z: [s0], marker: { color: th.red, size: 7, line: { color: '#ffffff', width: 1 } }, hovertemplate: 'the plan q<extra></extra>' });
      axes = { x: [g > 0 ? 'labour' : 'labour (netput)', g > 0 ? [0, Lm] : [-Lm, 0]], y: [g > 0 ? 'land' : 'land (netput)', g > 0 ? [0, Am] : [-Am, 0]], z: ['sausages', [0, heightMax * 1.02]] };
    }
    const hide = { top: 'z', side: 'y' }[state.cam];
    const axis = ([title, range], name) => ({ visible: name !== hide, title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line, showbackground: true, backgroundcolor: th.panel, showspikes: false });
    U.react3d('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', font: { color: th.ink, family: th.font, size: 12 },
      showlegend: false, uirevision: state.fix + state.cam, hoverlabel: { font: { family: th.font } },
      scene: { uirevision: state.fix + state.cam, camera, aspectmode: 'manual', aspectratio: ASPECT[state.cam], xaxis: axis(axes.x, 'x'), yaxis: axis(axes.y, 'y'), zaxis: axis(axes.z, 'z') }
    }, U.PLOT_CONFIG, { plotly_relayout: ev => { const cam = ev['scene.camera']; if (cam) camera = { ...camera, ...clone(cam) }; } });
  }

  function caption3d(q) {
    const key = (cls, extra) => `<span class="key ${extra || ''} ${cls}"></span>`, f2 = fmt;
    const L = -q[2], A = -q[3];
    const net = state.zview ? '' : ` Inputs are netputs, ${texStr('q=-z')}: more labour is further down.`;
    if (state.fix === 'land') return `<b>The labour needed</b> for each pair of outputs, with land fixed at ${texStr(`z_A=${f2(A)}`)}. Each height line is a frontier of outputs, one for each amount of labour.${net} ` +
      `${key('c-ink')}<b>the frontier at the plan's ${f2(L)} hours</b> (bottom left in 2D)` + (state.low ? `, ${key('c-muted', 'dash')}with less input` : '') +
      `; ${key('c-accent-2')}<b>potatoes fixed</b> at ${texStr(`q_p=${f2(q[1])}`)}: labour against sausages (bottom right in 2D; top right is the same curve with the axes swapped). ` +
      `See them as in 2D: <i>From above</i> and <i>From the side</i>.`;
    return `<b>The sausages made</b> from labour and land, with potatoes fixed at ${texStr(`q_p=${f2(q[1])}`)}: the production function of lecture 1. Each height line is an isoquant.${state.zview ? '' : ' Inputs are netputs, ' + texStr('q=-z') + ': more input is further from the corner at 0.'} ` +
      `${key('c-ink')}<b>the isoquant at the plan's ${f2(q[0])} sausages</b> (top left in 2D); ${key('c-accent-2')}<b>land fixed</b> at ${texStr(`z_A=${f2(A)}`)}: sausages against labour (top right in 2D). ` +
      `See them as in 2D: <i>From above</i> and <i>From the side</i>.`;
  }

  let smpNow = {};
  function render() {
    const th = U.theme(), q = qNow();
    const three = state.dim === '3d';
    document.querySelectorAll('[data-dim]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dim === state.dim)));
    document.querySelectorAll('[data-fix]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fix === state.fix)));
    document.querySelectorAll('[data-cam]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cam === state.cam)));
    $('view3d').hidden = !three; $('grid4').hidden = three; $('cap').hidden = three;
    $('main-head').innerHTML = three ? `The frontier ${texStr('\\Phi(q)=0')} with ${state.fix} fixed` : `The frontier ${texStr('\\Phi(q)=0')} for each pair of goods`;
    if (three) {
      guard('3D figure', () => draw3d(th, q));
      $('cap3d').innerHTML = caption3d(q);
    }
    const R = frozen || {};
    for (const key of Object.keys(PANELS)) if (!frozen) R[key] = ranges(key, q);
    if (!three) for (const key of Object.keys(PANELS)) {
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
    $('side-cap').innerHTML = `More of any netput is harder to reach, so all four partial derivatives are positive and every curve slopes down: the same formula gives all four slopes. With only sausages (${texStr('q_p=0')}), ${texStr('\\Phi(q)=q_s-\\phi(z)')} with ${texStr('z=-q')}: the production function of lecture 1, and ${texStr('\\Phi_L/\\Phi_s=\\phi_L')}.`;
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
    $('zview').addEventListener('change', e => { state.zview = e.target.checked; if (state.cam === '3d') camera = camFor(state.fix, '3d'); schedule(); });
    $('low').addEventListener('change', e => { state.low = e.target.checked; schedule(); });
    $('planes').addEventListener('change', e => { state.planes = e.target.checked; schedule(); });
    document.querySelectorAll('[data-dim]').forEach(b => b.addEventListener('click', () => { state.dim = b.dataset.dim; schedule(); }));
    document.querySelectorAll('[data-fix]').forEach(b => b.addEventListener('click', () => { state.fix = b.dataset.fix; state.cam = '3d'; camera = camFor(state.fix, '3d'); schedule(); }));
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { state.cam = b.dataset.cam; camera = camFor(state.fix, state.cam); schedule(); }));
    $('reset').addEventListener('click', () => { for (const k of Object.keys(DEF)) ctrls[k].setExact(DEF[k]); });
    camera = camFor(state.fix, state.cam);
    render();
    for (const key of Object.keys(PANELS)) bindDrag(key);
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M, 'transformation-function/model.js')) guard('page', init);
})();
