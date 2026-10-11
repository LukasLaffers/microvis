/*
 * Input requirement sets: interface and plotting.
 * All economics lives in model.js (window.InputSetsModel); this file only draws it.
 */
(function () {
  'use strict';

  const M = window.InputSetsModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, num, pt, tex, texStr, guard } = U;

  const state = {
    preset: 'smooth', q: 2, z: [0, 0], zp: [0, 0], lambda: 0.5,
    mix: true, exQ2: false, showFd: true, showCv: true, showRs: false
  };
  const P = () => M.PRESETS[state.preset];
  const opts = () => ({ mix: state.mix });
  const isEx = () => state.preset === 'exercise';
  const q = () => isEx() ? 1 : state.q;

  let ctrls = {};
  const schedule = U.scheduler(render);

  const NOTES = {
    smooth: 'Cobb-Douglas with constant returns: the textbook case (Figure 7, panel 1).',
    activities: 'Four activities, each can be run at any scale and mixed with the others. The isoquant is made of straight pieces with kinks at the activities (Figure 7, panel 2).',
    nonconvex: 'Two processes, one good with much z₁, the other with much z₂; the firm uses whichever gives more. A 50–50 mix of two bundles that work can fail (Figure 7, panel 3).',
    leontief: 'Inputs are needed in fixed proportions; more of one input alone is wasted. The set is an L-shaped corner (Figure 7, panel 4).',
    congestion: 'Too much of everything gets in the way: output falls when both inputs grow large. The set is bounded, so adding inputs can take you out of it.',
    exercise: 'Each activity produces one unit of output. With divisibility the firm can mix them; with constant returns it can scale them.'
  };

  function setPreset(name) {
    const p = M.PRESETS[name];
    state.preset = name;
    state.q = p.q;
    state.z = p.z.slice();
    state.zp = p.zp.slice();
    state.lambda = 0.5;
    if (ctrls.q) { ctrls.q.sync(); ctrls.lambda.sync(); }
    syncPointInputs(true);
    schedule();
  }

  function clampPoint(p) {
    const b = P().box;
    return [U.clampTo(p[0], 0, b), U.clampTo(p[1], 0, b)];
  }

  function syncPointInputs(force) {
    const set = (id, v) => { const el = $(id); if (force || document.activeElement !== el) el.value = v.toFixed(isEx() ? 3 : 2); };
    set('z-1', state.z[0]); set('z-2', state.z[1]); set('zp-1', state.zp[0]); set('zp-2', state.zp[1]);
  }

  // ---------- plot ----------

  let gridCache = { key: '', data: null };
  function gridData() {
    const p = P(), key = `${state.preset}|${state.mix}`;
    if (gridCache.key !== key) gridCache = { key, data: M.grid(state.preset, p.box, isEx() ? 241 : 181, opts()) };
    return gridCache.data;
  }

  const constraint = (g, value, fill, color, width, dash, scale = 1) => ({
    type: 'contour', x: g.x.map(v => v * scale), y: g.y.map(v => v * scale), z: g.z,
    // Plotly shades where a constraint fails, so "phi < q" shades exactly Z(q) = {phi >= q}.
    contours: { type: 'constraint', operation: '<', value },
    fillcolor: fill, line: { color, width, dash: dash || 'solid', smoothing: 0 },
    hoverinfo: 'skip', showscale: false, showlegend: false
  });
  const marker = (p, color, name, size = 14, symbol = 'circle') => ({
    type: 'scatter', mode: 'markers', x: [p[0]], y: [p[1]],
    marker: { color, size, symbol, line: { color: symbol.startsWith('x') ? color : '#ffffff', width: symbol.startsWith('x') ? 1 : 2 } },
    name, hovertemplate: `${name}<br>(%{x:.2f}, %{y:.2f})<extra></extra>`
  });
  // A red cross at w: a point that breaks an assumption (a shape of fixed size in pixels).
  const cross = (w, color) => [[-6, -6, 6, 6], [-6, 6, 6, -6]].map(([x0, y0, x1, y1]) => ({
    type: 'line', xref: 'x', yref: 'y', xsizemode: 'pixel', ysizemode: 'pixel', xanchor: w[0], yanchor: w[1], x0, y0, x1, y1, line: { color, width: 2 }
  }));
  const zLambda = () => [state.lambda * state.z[0] + (1 - state.lambda) * state.zp[0], state.lambda * state.z[1] + (1 - state.lambda) * state.zp[1]];

  function draw(th) {
    const p = P(), box = p.box, g = gridData(), Q = q(), traces = [], annotations = [];
    const clear = 'rgba(0,0,0,0)';

    // Z(q): shaded; its boundary I(q) is drawn exactly for activity technologies.
    traces.push(constraint(g, Q, th.accentSoft, th.accent, p.acts ? 0 : 3));
    if (p.acts) traces.push(U.line2(M.activityFrontier(p.acts, state.mix, Q, box * 1.01), th.accent, 3, `I(${fmt(Q)})`));

    // Returns to scale: 2 * I(q) against I(2q).
    if (state.showRs) {
      if (p.acts) {
        traces.push(U.line2(M.activityFrontier(p.acts, state.mix, Q, box * 2).map(v => [2 * v[0], 2 * v[1]]), th.accent2, 2.5, '2 · I(q)', 'dash'));
        traces.push(U.line2(M.activityFrontier(p.acts, state.mix, 2 * Q, box * 2), th.accent, 2, 'I(2q)', 'dot'));
      } else {
        traces.push(constraint(g, Q, clear, th.accent2, 2.5, 'dash', 2));
        traces.push(constraint(g, 2 * Q, clear, th.accent, 2, 'dot'));
      }
    }

    // Exercise 1: the activities, z^4, and (ii) the isoquant for q = 2 under constant returns.
    if (isEx()) {
      if (state.exQ2) {
        traces.push(U.line2(M.activityFrontier(p.acts, state.mix, 2, box * 1.01), th.accent, 2.5, 'I(2) under constant returns', 'dash'));
        p.acts.forEach((a, k) => annotations.push({ x: 2 * a[0], y: 2 * a[1], text: `2z<sup>${k + 1}</sup>`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 4, font: { color: th.accent, size: 12 } }));
      }
      traces.push({ type: 'scatter', mode: 'markers', x: p.acts.map(a => a[0]), y: p.acts.map(a => a[1]), marker: { color: th.ink, size: 9 }, name: 'activities', hovertemplate: '(%{x:.2f}, %{y:.2f})<extra></extra>' });
      p.acts.forEach((a, k) => annotations.push({ x: a[0], y: a[1], text: `z<sup>${k + 1}</sup>`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 5, font: { color: th.ink, size: 13 } }));
      traces.push(marker(p.extra, th.accent3, 'z⁴', 11, 'diamond'));
      annotations.push({ x: p.extra[0], y: p.extra[1], text: 'z<sup>4</sup>', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 6, yshift: -2, font: { color: th.accent3, size: 13 } });
    }

    const layout = U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, box], constrain: 'domain' },
      y: { range: [0, box], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations
    });
    // U.plot: while a point is dragged the set does not change, so Plotly has nothing to redraw
    U.plot('plot', traces, layout, { ...U.PLOT_CONFIG, displayModeBar: false });

    // Everything below moves with z and z': lines and points on the fast overlay layer; the shaded quadrant, the crosses
    // and the labels as shapes and annotations, which Plotly.relayout redraws without redrawing the set.
    const moving = [], shapes = [], labels = [];
    const zIn = M.inSet(state.preset, Q, state.z, opts()), zpIn = M.inSet(state.preset, Q, state.zp, opts());
    const label = (pt, text, color, size, right) => labels.push({ x: pt[0], y: pt[1], text, showarrow: false, xanchor: right ? 'left' : 'right', yanchor: right ? 'bottom' : 'top', xshift: right ? 8 : -6, yshift: right ? 2 : 0, font: { color, size } });

    // Free disposal: the quadrant above and to the right of z.
    if (state.showFd) {
      shapes.push({ type: 'rect', x0: state.z[0], y0: state.z[1], x1: box, y1: box, fillcolor: th.accent2, opacity: 0.08, line: { width: 0 } });
      moving.push(U.line2([[box, state.z[1]], state.z, [state.z[0], box]], th.accent2, 1.5, '', 'dot'));
      if (zIn) {
        const r = M.freeDisposalAt(state.preset, Q, state.z, box, opts());
        if (!r.holds) shapes.push(...cross(r.witness, th.dec));
      }
    }

    // Convexity: the segment from z to z' and the point z^lambda.
    if (state.showCv) {
      moving.push(U.line2([state.z, state.zp], th.ink, 2, 'segment'));
      if (zIn && zpIn) {
        const r = M.segmentInSet(state.preset, Q, state.z, state.zp, opts());
        if (!r.holds) shapes.push(...cross(r.witness, th.dec));
      }
      moving.push(marker(zLambda(), th.muted, 'z^λ', 11));
      label(zLambda(), 'z<sup>λ</sup>', th.muted, 12, false);
    }

    moving.push(marker(state.zp, th.accent4, "z' (drag it)", 15));
    moving.push(marker(state.z, th.accent2, 'z (drag it)', 15));
    label(state.z, 'z', th.accent2, 15, true);
    label(state.zp, "z'", th.accent4, 15, true);
    Plotly.relayout('plot', { shapes, annotations: annotations.concat(labels) });
    U.overlay('plot', moving, th.font);
  }

  // ---------- checks ----------

  const item = (status, title, detail, def) =>
    `<li><span class="mark ${status}">${status === 'ok' ? '✓' : status === 'no' ? '✗' : '–'}</span><span>${title}${detail ? ` <span class="c-muted">${detail}</span>` : ''}</span>${def ? `<span class="def">${def}</span>` : ''}</li>`;

  function renderChecks() {
    const p = P(), Q = q(), o = opts(), name = state.preset;
    const phiZ = M.output(name, state.z[0], state.z[1], o), phiZp = M.output(name, state.zp[0], state.zp[1], o);
    const zIn = phiZ >= Q - 1e-9, zpIn = phiZp >= Q - 1e-9;
    const zl = zLambda(), phiZl = M.output(name, zl[0], zl[1], o);
    const rows = [];
    rows.push(item(zIn ? 'ok' : 'no', `${texStr('z\\in Z(q)')}`, `φ(z) = ${fmt(phiZ)} ${zIn ? '≥' : '<'} q = ${fmt(Q)}`));
    rows.push(item(zpIn ? 'ok' : 'no', `${texStr("z'\\in Z(q)")}`, `φ(z′) = ${fmt(phiZp)} ${zpIn ? '≥' : '<'} q = ${fmt(Q)}`));

    const fdDef = texStr("z\\in Z(q),\\ z'\\ge z\\ \\Rightarrow\\ z'\\in Z(q)");
    if (!zIn) rows.push(item('na', 'Free disposal at z', 'z is not in Z(q), so there is nothing to check.', fdDef));
    else {
      const r = M.freeDisposalAt(name, Q, state.z, p.box, o);
      rows.push(item(r.holds ? 'ok' : 'no', 'Free disposal at z',
        r.holds ? 'every bundle with at least as much of both inputs is in Z(q).'
          : `but ${pt(r.witness[0], r.witness[1])} ≥ z produces only ${fmt(M.output(name, r.witness[0], r.witness[1], o))} < q.`, fdDef));
    }

    const cvDef = texStr("z,z'\\in Z(q)\\ \\Rightarrow\\ \\lambda z+(1-\\lambda)z'\\in Z(q)");
    if (!(zIn && zpIn)) rows.push(item('na', 'Convexity between z and z′', 'both points must be in Z(q) first.', cvDef));
    else {
      const r = M.segmentInSet(name, Q, state.z, state.zp, o);
      rows.push(item(r.holds ? 'ok' : 'no', 'Convexity between z and z′',
        r.holds ? `every mix is in Z(q); at λ = ${fmt(state.lambda)}, φ(z^λ) = ${fmt(phiZl)}.`
          : `the mix at λ = ${fmt(r.lambda)} produces only ${fmt(M.output(name, r.witness[0], r.witness[1], o))} < q.`, cvDef));
    }

    const ratio = M.scaleRatio(name, state.z, 2, o);
    const rsDef = texStr('z\\in Z(q)\\ \\Rightarrow\\ \\lambda z\\in Z(\\lambda q)');
    if (!(phiZ > 0)) rows.push(item('na', 'Constant returns along the ray through z', 'z produces nothing.', rsDef));
    else {
      const crs = Math.abs(ratio - 2) < 1e-6;
      rows.push(item(crs ? 'ok' : 'no', 'Constant returns along the ray through z',
        `φ(2z)/φ(z) = ${fmt(ratio)}${crs ? '' : ratio < 2 ? ' < 2 (decreasing)' : ' > 2 (increasing)'}.`, rsDef));
    }
    $('checks').innerHTML = rows.join('');

    // Overall properties of the technology (the exercise is convex only if activities can be mixed).
    const props = { ...p.props, convex: isEx() ? state.mix : p.props.convex };
    $('global').innerHTML = [
      item(props.freeDisposal ? 'ok' : 'no', 'Free disposal', props.freeDisposal ? 'everywhere' : 'fails: large bundles fall out of Z(q)'),
      item(props.convex ? 'ok' : 'no', 'Convex Z(q)', props.convex ? 'φ is quasi-concave' : 'some mixes of good bundles fail'),
      item(props.crs ? 'ok' : 'no', 'Constant returns to scale', props.crs ? 'λZ(q) = Z(λq)' : 'scaling up changes output by a different factor')
    ].join('');

    let sentence = '';
    if (isEx()) {
      const z4 = M.output(name, p.extra[0], p.extra[1], o);
      sentence = state.mix
        ? `(i) The isoquant I(1) joins z¹, z², z³ with straight lines (z² lies below the line from z¹ to z³, so it is part of it), plus a vertical line above z¹ and a horizontal one to the right of z³. (ii) Under constant returns, I(2) is the same shape through 2z¹, 2z², 2z³. (iii) z⁴ is in Z(1) but mixing z¹ and z² it can produce φ(z⁴) = ${fmt(z4, 3)} > 1, so it is not on I(1).`
        : `Without mixing, Z(1) is the union of three corners, and its boundary is a staircase. z⁴ = (0.25, 0.5) uses more z₁ than z¹ and the same z₂, so φ(z⁴) = ${fmt(z4, 3)}: it is on the boundary of Z(1) but wasteful (z¹ does the same with less). Tick "can be mixed" to see the convex isoquant of the notes.`;
    } else if (state.preset === 'nonconvex') {
      sentence = 'Move z and z′ to either side of the inward kink: their mix falls outside Z(q). This is the shape that convexity rules out.';
    } else if (state.preset === 'congestion') {
      sentence = 'Put z inside the set: the quadrant above and to the right of z leaves Z(q), so free disposal fails. Turn on the returns-to-scale view (under More settings): 2·I(q) and I(2q) do not coincide.';
    }
    $('sentence').innerHTML = sentence;
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ex: isEx(), notex: !isEx(), rs: state.showRs });
    tex($('formula'), P().formula, true);
    $('preset-note').textContent = NOTES[state.preset];
    syncPointInputs(false);
    const th = U.theme();
    guard('plot', () => draw(th));
    guard('checks', renderChecks);
  }

  // ---------- dragging ----------

  // Drag z or z': the one nearer to the pointer when it goes down (a mouse click moves that one there).
  function setupDrag() {
    const gd = $('plot');
    let which = 'z', dragging = false;
    const pick = ev => {
      if (dragging) return;
      const d = U.eventToData(gd, ev);
      if (!d) return;
      const dist = p => Math.hypot(p[0] - d[0], p[1] - d[1]);
      which = dist(state.z) <= dist(state.zp) ? 'z' : 'zp';
    };
    // registered before U.dragPoint, so its target() already sees the nearer point
    gd.addEventListener('pointerdown', pick, true);
    gd.addEventListener('pointermove', pick, true);
    gd.addEventListener('touchstart', ev => { if (ev.touches[0]) pick(ev.touches[0]); }, { passive: true, capture: true });
    U.dragPoint(gd, {
      start: () => { dragging = true; },
      end: () => { dragging = false; },
      target: () => state[which],
      move: d => { state[which] = clampPoint(d); schedule(); }
    });
  }

  // ---------- init ----------

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('preset').addEventListener('change', e => setPreset(e.target.value));
    $('mix').addEventListener('change', e => { state.mix = e.target.checked; schedule(); });
    $('ex-q2').addEventListener('change', e => { state.exQ2 = e.target.checked; schedule(); });
    $('show-fd').addEventListener('change', e => { state.showFd = e.target.checked; schedule(); });
    $('show-cv').addEventListener('change', e => { state.showCv = e.target.checked; schedule(); });
    $('show-rs').addEventListener('change', e => { state.showRs = e.target.checked; schedule(); });
    [['z-1', 'z', 0], ['z-2', 'z', 1], ['zp-1', 'zp', 0], ['zp-2', 'zp', 1]].forEach(([id, key, i]) => {
      $(id).addEventListener('change', e => {
        const v = Number(e.target.value);
        if (!Number.isFinite(v)) return;
        const p = state[key].slice();
        p[i] = v;
        state[key] = clampPoint(p);
        syncPointInputs(true);
        schedule();
      });
    });
    setPreset(state.preset);
    render();
    setupDrag();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M)) guard('page', init);
})();
