/*
 * The Production Set Q: interface and plotting (lecture 8).
 * Seven technologies, two plans q' and q'' in Q, and the plans the six properties of Q talk about: 0, -q', a plan
 * below q', q' + q'', 1/2 q' (and 2 q' on the same ray). 2D: labour and sausages, the plans are dragged; 3D: pigs,
 * labour and sausages as in the notes' figure, a click on the roof moves the chosen plan there.
 */
(function () {
  'use strict';

  const M = window.QSetModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  // default plans: 2D the labour of q' and q'' (on the frontier); 3D their pigs and labour (on the roof)
  const DEF = { a2: [10, null], b2: [6, null], a3: [26, 7], b3: [9, 15] };
  const state = { tech: 'drs', dim: '2d', move: 'a', cam: '3d', a2: null, b2: null, a3: null, b3: null };
  const D2 = [2, 300], D3 = [2, 1, 300];   // "less of everything": the plan q' - d for free disposal
  const X2 = [-30, 14], Y2 = [-1400, 3400];   // 2D axes: q_L and q_s
  const ZP = 44, ZL = 22, FLOOR = -700;        // 3D: inputs up to 44 pigs and 22 hours; the curtain hangs down to FLOOR
  const PROPS = ['', 'Inaction', 'No free lunch', 'Irreversibility', 'Free disposal', 'Additivity', 'Divisibility'];
  const schedule = U.scheduler(render);

  const plans = () => (state.dim === '2d' ? [state.a2, state.b2] : [M.onFrontier(state.tech, state.a3), M.onFrontier(state.tech, state.b3)]);
  function resetPlans() {
    state.a2 = M.onFrontier(state.tech, [DEF.a2[0]]); state.b2 = M.onFrontier(state.tech, [DEF.b2[0]]);
    state.a3 = DEF.a3.slice(); state.b3 = DEF.b3.slice();
  }
  const vec = q => `(${q.map(v => fmt(v)).join(',\\ ')})`;

  // ---------- formulas and texts ----------

  function formula() {
    const t = state.tech, two = state.dim === '2d', x = two ? 'z_L/10' : 'x';
    const f = {
      crs: two ? 'q_s\\le100\\,z_L' : 'q_s\\le1000\\,x',
      drs: `q_s\\le1000\\,(${x})^{0.7}`, irs: `q_s\\le1000\\,(${x})^{1.4}`,
      fix: `q_s\\le2000\\,\\big(${x}-\\tfrac12\\big)^{+}`,
      lunch: two ? 'q_s\\le300+100\\,z_L' : 'q_s\\le300+1000\\,x',
      rev: two ? 'q_s\\le100\\,z_L,\\ \\ z_L\\in\\mathbb R' : 'q_s\\le25\\,z_P+50\\,z_L,\\ \\ z\\in\\mathbb R^2',
      nodisp: two ? 'q_s=100\\,z_L' : 'q_s=1000\\,x'
    }[t];
    return f + (two ? ',\\quad z_L=-q_L' : (t === 'rev' ? ',\\quad z=-q' : ',\\quad x=\\sqrt{z_Pz_L/200},\\ z=-q'));
  }
  const VERDICT = {
    crs: 'Additivity and divisibility together make Q a cone: tq ∈ Q for every t ≥ 0, constant returns to scale.',
    drs: 'Running two plans together takes their inputs added up, and with decreasing returns these make fewer sausages than the two plans separately.',
    irs: 'Half the inputs make less than half the sausages.',
    fix: 'Below a minimum of inputs nothing is produced (a setup cost), so half a plan may make nothing at all.',
    lunch: '300 sausages without any input. So irreversibility fails too: 100 sausages from nothing is a plan, and by free disposal so is throwing them away. And two plans together would need two free lunches.',
    rev: 'The process runs backwards: it turns sausages back into its inputs, so −q′ is in Q whenever q′ is.',
    nodisp: 'Q is only the frontier: a plan with less output than q′, or more input, is not in Q.'
  };
  const verdictText = () => VERDICT[state.tech] + (state.tech === 'nodisp' && state.dim === '3d' ? ' In 3D the roof is curved, so q′ + q″ lies strictly below it: additivity fails too. (In 2D the frontier is a straight line and q′ + q″ stays on it.)' : '');

  function renderChecks() {
    const [a, b] = plans(), T = M.tests(state.tech, a, b, state.dim === '2d' ? D2 : D3), two = state.dim === '2d';
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const zs = q => q.slice(0, -1).map(v => -v);
    const roof = q => { const f = M.frontier(state.tech, zs(q)); return f === null ? 'cannot be run (an input would be given back)' : `the frontier there is at ${texStr(fmt(f))} sausages`; };
    const tag = (ok, q) => ok ? texStr('\\in Q') : texStr('\\notin Q') + ': ' + roof(q);
    $('checks').innerHTML = [
      item(T[1].ok, `<b>1. ${PROPS[1]}:</b> ${texStr('0\\in Q')}`),
      item(T[2].ok, `<b>2. ${PROPS[2]}:</b> ` + (T[2].ok ? 'no sausages without inputs' : `${texStr(vec(T[2].plan) + '\\in Q')}: sausages without inputs`)),
      item(T[3].ok, `<b>3. ${PROPS[3]}:</b> ${texStr("-q'=" + vec(T[3].plan))} ${T[3].ok ? texStr('\\notin Q') : texStr('\\in Q') + ': the process runs backwards'}`),
      item(T[4].ok, `<b>4. ${PROPS[4]}:</b> less of everything than ${texStr("q'")}, ${texStr(vec(T[4].plan))} ${T[4].ok ? texStr('\\in Q') : texStr('\\notin Q')}`),
      item(T[5].ok, `<b>5. ${PROPS[5]}:</b> ${texStr("q'+q''=" + vec(T[5].plan))} ${tag(T[5].ok, T[5].plan)}`),
      item(T[6].ok, `<b>6. ${PROPS[6]}:</b> ${texStr("\\tfrac12q'=" + vec(T[6].plan))} ${tag(T[6].ok, T[6].plan)}`)
    ].join('');
    const fails = M.FAILS(state.tech, two ? 2 : 3);
    $('always').innerHTML = [1, 2, 3, 4, 5, 6].map(p => item(!fails.includes(p), `${p}. ${PROPS[p]}`)).join('');
    $('verdict').innerHTML = `<b>${M.NAMES[state.tech]}.</b> ` + verdictText();
  }

  // ---------- 2D ----------

  // the shaded set Q and its frontier in the plane of labour and sausages
  function draw2d(th) {
    const t = state.tech, [a, b] = plans(), traces = [], ann = [];
    const lo = t === 'rev' ? X2[0] : X2[0], hi = t === 'rev' ? X2[1] : 0;
    const zs = U.linspace(-hi, -lo, 240), fr = zs.map(z => [-z, M.frontier(t, [z])]).sort((p, q) => q[0] - p[0]);
    const red = th.red;
    // the positive quadrant: outputs without inputs
    const shapes = [{ type: 'rect', x0: 0, x1: X2[1], y0: 0, y1: Y2[1], fillcolor: th.dark ? 'rgba(255,77,94,0.08)' : 'rgba(208,2,27,0.05)', line: { width: 0 }, layer: 'below' }];
    ann.push({ x: X2[1], y: Y2[1], text: 'ℝ²₊: outputs<br>without inputs', showarrow: false, xanchor: 'right', yanchor: 'top', align: 'right', xshift: -4, yshift: -4, font: { size: 12, color: red } });
    if (t !== 'nodisp') {
      const poly = [...fr, [lo, Y2[0]], [hi, Y2[0]]];
      traces.push({ type: 'scatter', mode: 'lines', x: poly.map(p => p[0]), y: poly.map(p => p[1]), fill: 'toself', fillcolor: th.dark ? 'rgba(74,144,226,0.2)' : 'rgba(74,144,226,0.15)', line: { width: 0 }, hoverinfo: 'skip' });
      ann.push({ x: -24, y: Y2[0] * 0.75, text: 'Q', showarrow: false, font: { size: 24, color: th.blue } });
    }
    traces.push(U.line2(fr, th.blue, t === 'nodisp' ? 4 : 3, 'frontier'));
    if (t === 'lunch') {
      // the free lunch: plans with no input and up to 300 sausages
      traces.push(U.line2([[0, 0], [0, M.frontier(t, [0])]], red, 5, 'free lunch'));
      ann.push({ x: 0, y: M.frontier(t, [0]), text: 'free lunch', showarrow: false, xanchor: 'left', xshift: 8, font: { size: 13, color: red } });
    }
    const T = M.tests(t, a, b, D2), dbl = M.scale(2, a);
    // the constructions: the ray through q' (divisibility), the parallelogram (additivity), -q' (irreversibility),
    // the corner of plans below q' (free disposal)
    traces.push(U.line2([[0, 0], dbl], th.inc, 2, 'the ray through q′'));
    traces.push(U.line2([a, T[5].plan, b], th.accent2, 1.8, 'q′ + q″', 'dash'));
    traces.push(U.line2([a, [0, 0], T[3].plan], th.muted, 1.5, '−q′', 'dot'));
    traces.push(U.line2([[a[0], Y2[0]], a, [X2[0], a[1]]], th.muted, 1.2, 'less than q′', 'dot'));
    // a constructed plan: a dot if it is in Q, a cross if not; red if it breaks its property
    const mark = (p, label, color, ok, member) => U.dot2([p], ok ? color : red, label, 10, { mode: 'markers+text', text: [label], textposition: p[0] > 0 ? 'middle left' : 'middle right', textfont: { size: 13, color: ok ? color : red }, marker: { symbol: member ? 'circle' : 'x', color: ok ? color : red, size: member ? 10 : 13, line: { color: '#ffffff', width: member ? 1.5 : 0 } } });
    const dblIn = M.inQ(t, dbl);
    traces.push(mark(T[6].plan, '½q′', th.inc, T[6].ok, T[6].ok));
    traces.push(mark(dbl, '2q′', th.inc, dblIn, dblIn));
    traces.push(mark(T[5].plan, 'q′+q″', th.accent2, T[5].ok, T[5].ok));
    traces.push(mark(T[3].plan, '−q′', th.muted, T[3].ok, !T[3].ok));
    traces.push(mark(T[4].plan, 'less', th.muted, T[4].ok, T[4].ok));
    traces.push(U.dot2([[0, 0]], th.ink, '0', 7));
    traces.push(U.dot2([a, b], th.ink, 'the plans (drag them)', 13, { mode: 'markers+text', text: ['q′', 'q″'], textposition: 'top left', textfont: { size: 15, color: th.ink } }));
    U.plot('plot2d', traces, U.base2d(th, { xt: 'q<sub>L</sub> (labour, net)', yt: 'q<sub>s</sub> (sausages)', x: { range: X2, zeroline: true, zerolinecolor: th.muted }, y: { range: Y2, zeroline: true, zerolinecolor: th.muted }, annotations: ann, shapes, margin: { l: 56, r: 10, t: 8, b: 44 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  // dragging q' or q'' (whichever is nearer to the pointer): kept in Q, on the frontier without free disposal
  function bind2d() {
    const gd = $('plot2d'), GRAB = 30;
    gd.classList.add('drag-plot');
    let dragging = null;
    const px = p => { const fl = gd._fullLayout; return [fl.xaxis._offset + fl.xaxis.c2p(p[0]), fl.yaxis._offset + fl.yaxis.c2p(p[1])]; };
    const near = ev => {
      const fl = gd._fullLayout; if (!fl || !fl.xaxis || state.dim !== '2d') return null;
      const r = gd.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      let best = null, bd = GRAB;
      for (const k of ['a', 'b']) { const p = px(state[k + '2']), d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = k; } }
      return best;
    };
    const move = ev => {
      const d = U.eventToData(gd, ev); if (!d) return;
      const t = state.tech, qL = Math.min(t === 'rev' ? X2[1] : 0, Math.max(X2[0], d[0])), f = M.frontier(t, [-qL]);
      const qs = t === 'nodisp' ? f : Math.max(Y2[0], Math.min(f, d[1]));
      state[dragging + '2'] = [qL, qs];
      schedule();
    };
    gd.addEventListener('pointerdown', ev => {
      const k = near(ev); if (!k) return;
      dragging = k; state.move = k;
      try { gd.setPointerCapture(ev.pointerId); } catch (e) { /* the drag still works inside the figure */ }
      ev.preventDefault(); gd.classList.add('dragging'); move(ev);
    }, true);
    gd.addEventListener('pointermove', ev => { if (dragging) { ev.preventDefault(); move(ev); } else if (ev.pointerType === 'mouse') gd.classList.toggle('near', !!near(ev)); }, true);
    const end = () => { if (dragging) { dragging = null; gd.classList.remove('dragging'); } };
    gd.addEventListener('pointerup', end, true);
    gd.addEventListener('pointercancel', end, true);
    gd.addEventListener('touchstart', ev => { const t = ev.touches[0]; if (t && near(t)) ev.preventDefault(); }, { passive: false, capture: true });
    gd.addEventListener('touchmove', ev => { if (dragging) ev.preventDefault(); }, { passive: false, capture: true });
  }

  // ---------- 3D ----------

  const clone = o => JSON.parse(JSON.stringify(o));
  const CAMS = {
    '3d': { eye: { x: 1.25, y: 1.45, z: 0.5 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.1 }, projection: { type: 'perspective' } },
    side: { eye: { x: 0.95, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } }
  };
  CAMS.reset = CAMS['3d'];
  const ASPECT = { '3d': { x: 1.1, y: 0.9, z: 0.85 }, side: { x: 1.7, y: 1.5, z: 1.4 } };
  let camera = null;
  const camFor = cam => { const c = clone(CAMS[cam]); if (cam !== 'side' && window.innerWidth < 600) for (const k of ['x', 'y', 'z']) c.eye[k] *= 1.3; return c; };

  function draw3d(th) {
    const t = state.tech, [a, b] = plans(), traces = [], red = th.red;
    // the roof over the inputs (a reversible technology also over given-back inputs, to show it running backwards)
    const pLo = t === 'rev' ? -30 : 0, lLo = t === 'rev' ? -10 : 0;
    const ps = U.linspace(pLo, ZP, 45), ls = U.linspace(lLo, ZL, 45);
    const Z = ls.map(l => ps.map(p => M.frontier(t, [p, l])));
    const top = Math.max(...Z.map(r => Math.max(...r)));
    traces.push({
      type: 'surface', x: ps.map(p => -p), y: ls.map(l => -l), z: Z, surfacecolor: Z.map(r => r.map(v => Math.max(0, v))),
      colorscale: U.SURFACE_SCALE, cmin: 0, cmax: top, showscale: false, opacity: t === 'nodisp' ? 0.9 : 0.62,
      contours: { x: { highlight: false }, y: { highlight: false }, z: { show: true, start: 250, end: top, size: 250, color: th.dark ? '#1b1f27' : '#ffffff', width: 2, highlight: false } },
      lighting: { ambient: 0.72, diffuse: 0.5, specular: 0.05, roughness: 0.9 },
      hovertemplate: 'pigs %{x:.2f}<br>labour %{y:.2f}<br>sausages %{z:.2f}<extra>click: move the plan here</extra>'
    });
    // free disposal: a curtain from the roof's outer edges down to the floor (none when Q is only the roof)
    if (t !== 'nodisp') {
      const e1 = ps.map(p => [-p, -ZL, M.frontier(t, [p, ZL])]), e2 = ls.map(l => [-ZP, -l, M.frontier(t, [ZP, l])]);
      for (const e of [e1, e2]) traces.push({
        type: 'surface', x: [e.map(v => v[0]), e.map(v => v[0])], y: [e.map(v => v[1]), e.map(v => v[1])], z: [e.map(v => v[2]), e.map(() => FLOOR)],
        surfacecolor: [e.map(() => 1), e.map(() => 0)], colorscale: [[0, th.dark ? '#1c2533' : '#e6eef8'], [1, th.blue]], cmin: 0, cmax: 1, showscale: false, opacity: 0.45,
        hoverinfo: 'skip', lighting: { ambient: 1, diffuse: 0, specular: 0 }, contours: { x: { highlight: false }, y: { highlight: false }, z: { highlight: false } }
      });
    }
    const line = (pts, color, width, dash) => ({ type: 'scatter3d', mode: 'lines', x: pts.map(v => v[0]), y: pts.map(v => v[1]), z: pts.map(v => v[2]), line: { color, width, dash: dash || 'solid' }, hoverinfo: 'skip' });
    // a constructed plan: a dot if it is in Q, a cross if not; red if it breaks its property
    const mark = (p, label, color, ok, size = 8, member = ok) => ({
      type: 'scatter3d', mode: 'markers+text', x: [p[0]], y: [p[1]], z: [p[2]], text: [label], textposition: 'middle right',
      textfont: { size: 16, color: ok ? color : red }, marker: { color: ok ? color : red, size: member ? size : size + 3, symbol: member ? 'circle' : 'x', line: { color: '#ffffff', width: 1 } }, hovertemplate: label + '<extra></extra>'
    });
    if (t === 'lunch') { const s0 = M.frontier(t, [0, 0]); traces.push(line([[0, 0, 0], [0, 0, s0]], red, 9)); traces.push(mark([0, 0, s0], 'free lunch', red, true, 5)); }
    const T = M.tests(t, a, b, D3), dbl = M.scale(2, a);
    // the notes' grey triangle 0, q', q'', the ray through q', the parallelogram to q' + q''
    traces.push({ type: 'mesh3d', x: [0, a[0], b[0]], y: [0, a[1], b[1]], z: [0, a[2], b[2]], i: [0], j: [1], k: [2], color: th.muted, opacity: 0.35, hoverinfo: 'skip' });
    traces.push(line([[0, 0, 0], dbl], th.inc, 6));
    traces.push(line([a, T[5].plan, b], th.accent2, 5, 'dash'));
    // a plan outside Q: a dotted line to the frontier above or below it (when the frontier is defined there)
    for (const p of [T[5].plan, T[6].plan, dbl]) if (!M.inQ(t, p)) {
      const f = M.frontier(t, [-p[0], -p[1]]);
      if (f !== null) traces.push(line([p, [p[0], p[1], f]], red, 4, 'dot'));
    }
    if (t === 'rev') traces.push(line([a, [0, 0, 0], T[3].plan], th.muted, 4, 'dot'), mark(T[3].plan, '−q′', th.muted, T[3].ok, 8, !T[3].ok));
    traces.push(mark([0, 0, 0], '0', th.ink, true, 4));
    traces.push(mark(T[6].plan, '½q′', th.inc, T[6].ok, 6));
    traces.push(mark(dbl, '2q′', th.inc, M.inQ(t, dbl), 6));
    traces.push(mark(T[5].plan, 'q′+q″', th.accent2, T[5].ok, 6));
    traces.push(mark(a, 'q′', th.ink, true, state.move === 'a' ? 10 : 8));
    traces.push(mark(b, 'q″', th.ink, true, state.move === 'b' ? 10 : 8));
    const zmax = Math.max(top, T[5].plan[2], dbl[2]) * 1.04;
    const axis = (title, range, hide) => ({ visible: !hide, title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line, showbackground: true, backgroundcolor: th.panel, showspikes: false });
    U.react3d('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', font: { color: th.ink, family: th.font, size: 12 }, showlegend: false,
      uirevision: state.cam, hoverlabel: { font: { family: th.font } },
      scene: {
        uirevision: state.cam, camera, aspectmode: 'manual', aspectratio: ASPECT[state.cam === 'side' ? 'side' : '3d'],
        xaxis: axis('pigs (netput)', [Math.min(-ZP * 1.15, 1.08 * Math.min(dbl[0], T[5].plan[0])), -pLo + 4], state.cam === 'side'),
        yaxis: axis('labour (netput)', [Math.min(-ZL * 1.15, 1.08 * Math.min(dbl[1], T[5].plan[1])), -lLo + 3]),
        zaxis: axis('sausages', [Math.min(FLOOR, ...Z.map(r => Math.min(...r))), zmax])
      }
    }, U.PLOT_CONFIG, {
      plotly_relayout: ev => { const c = ev['scene.camera']; if (c) camera = { ...camera, ...clone(c) }; },
      // a click on the roof: the chosen plan moves there (inputs within the roof)
      plotly_click: ev => {
        const p = ev.points && ev.points[0];
        if (!p || p.curveNumber !== 0) return;
        const z = [-p.x, -p.y];
        if (state.tech !== 'rev' && (z[0] <= 0 || z[1] <= 0)) return;
        state[state.move + '3'] = z;
        schedule();
      }
    });
  }

  // ---------- render ----------

  function render() {
    const th = U.theme(), two = state.dim === '2d';
    document.querySelectorAll('[data-dim]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dim === state.dim)));
    document.querySelectorAll('[data-cam]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cam === state.cam)));
    document.querySelectorAll('[data-plan]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === state.move)));
    document.querySelectorAll('[data-tech]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tech === state.tech)));
    $('plot2d').hidden = !two; $('plot3d').hidden = two; $('cams').hidden = two;
    $('head').innerHTML = `${M.NAMES[state.tech]}: ${texStr(formula())}`;
    $('move-note').innerHTML = two ? 'Drag a plan in the figure; the nearer one moves.' : 'Click the roof: the chosen plan moves there.';
    guard('checks', renderChecks);
    if (two) guard('figure', () => draw2d(th)); else guard('3D figure', () => draw3d(th));
    const key = c => `<span class="${c}">`;
    $('cap').innerHTML = two
      ? `<b>Drag ${texStr("q'")} or ${texStr("q''")}.</b> Shaded: ${texStr('Q')}, on and below the frontier. ${key('c-inc')}Green</span>: the ray through ${texStr("q'")}, with ${texStr("\\tfrac12q'")} and ${texStr("2q'")}; ${key('c-accent-2')}orange</span>: ${texStr("q'+q''")}; dotted: ${texStr("-q'")} and the plans with less of everything than ${texStr("q'")}. A cross marks a plan that is not in ${texStr('Q')}; <span class="c-l2-red">red</span>: the plan breaks its property.`
      : `<b>Drag to turn the figure; click the roof to move the chosen plan.</b> The roof is the frontier ${texStr('\\Phi(q)=0')} (white lines: equal sausages); ${state.tech === 'nodisp' ? 'here it is all of ' + texStr('Q') : 'the blue curtain below it is free disposal: ' + texStr('Q') + ' is everything on and below the roof'}. Grey: the triangle ${texStr("0,q',q''")} of the notes. ${key('c-inc')}Green</span>: the ray through ${texStr("q'")}; ${key('c-accent-2')}orange</span>: ${texStr("q'+q''")}; a cross: a plan not in ${texStr('Q')}, with a dotted line to the roof; <span class="c-l2-red">red</span>: the plan breaks its property.`;
  }

  function init() {
    U.renderStaticTex();
    $('techs').innerHTML = M.TECHS.map(t => `<button type="button" data-tech="${t}" aria-pressed="false">${M.NAMES[t]}</button>`).join('');
    resetPlans();
    camera = camFor('3d');
    document.querySelectorAll('[data-tech]').forEach(b => b.addEventListener('click', () => { state.tech = b.dataset.tech; resetPlans(); schedule(); }));
    document.querySelectorAll('[data-dim]').forEach(b => b.addEventListener('click', () => { state.dim = b.dataset.dim; schedule(); }));
    document.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => { state.move = b.dataset.plan; schedule(); }));
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { state.cam = b.dataset.cam === 'reset' ? '3d' : b.dataset.cam; camera = camFor(b.dataset.cam); schedule(); }));
    $('reset').addEventListener('click', () => { resetPlans(); schedule(); });
    bind2d();
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M, 'production-set/model.js')) guard('page', init);
})();
