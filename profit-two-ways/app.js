/*
 * One Step vs Two Steps: interface and plotting (lecture 2).
 * Two steps: closed forms from shared/firm-model.js. One step: a direct numerical search
 * (search.js) over input bundles that never uses the cost function.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, U = window.Microvis, FU = window.FirmUI, SR = window.OneStepSearch;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, linspace, guard } = U;

  const DEFAULT_CAMERA = { eye: { x: -0.55, y: -1.95, z: 0.9 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.1 }, projection: { type: 'perspective' } };
  const ortho = (eye, up) => ({ eye, up, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } });
  const CAMERAS = {
    '3d': DEFAULT_CAMERA, reset: DEFAULT_CAMERA,
    top: ortho({ x: 0, y: 0, z: 1.5 }, { x: 0, y: 1, z: 0 }),
    front: ortho({ x: 0, y: -1.5, z: 0 }, { x: 0, y: 0, z: 1 }),
    side: ortho({ x: 1.5, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  const state = {
    tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', a: 2, m: 1, k: 0.6, A: 1,
    p: 8, w1: 1, w2: 1, surface: true, opacity: 0.85, zero: true,
    anim: null, camera: clone(DEFAULT_CAMERA)
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: state.A, k: state.k, a: state.a, m: state.m });

  let ctrls = {};
  const schedule = U.scheduler(render);

  // ---------- the two answers (cached: the search and the surface are the expensive parts) ----------

  let cache = { key: '', P: null };
  function solve() {
    const s = tech(), w = [state.w1, state.w2], p = state.p, key = JSON.stringify([s, w, p]);
    if (cache.key === key) return cache.P;
    const S = FM.supply(w, p, s), Pi = FM.profit(w, p, s), D = FM.uncondDemand(w, p, s), u = FM.unitDemand(w, s);
    const hat = FM.minAC(w, s);
    const qRef = S.q > 0 ? S.q : (hat.qHat > 0 ? hat.qHat : 1);
    const Href = FM.condDemand(w, qRef, s).H;
    const zmax = Math.max(2, 1.4 * Math.max(...(S.q > 0 ? D : Href)));
    const one = SR.maximise((a, b) => FM.profitAt(a, b, w, p, s), zmax);
    // Profit surface on a 70 x 70 grid, cut off below so the peak stays visible.
    const floor = -0.5 * Math.max(Pi, 0.25 * p * qRef, 1e-6);
    const xs = linspace(0, zmax, 70);
    const zs = xs.map(b => xs.map(a => Math.max(floor, FM.profitAt(a, b, w, p, s))));
    // Expansion path: H(w, q) for q up to where it leaves the box.
    const hmax = Math.max(u.h[0], u.h[1]), qEnd = FM.F(zmax / hmax, s);
    const path = linspace(0, qEnd, 160).map(q => { const H = FM.condDemand(w, q, s).H; return { q, H, profit: p * q - FM.cost(w, q, s) }; });
    cache = { key, P: { s, w, p, S, Pi, D, u, hat, qRef, zmax, one, floor, xs, zs, path } };
    return cache.P;
  }

  // Animation progress: phase 1 (0-0.5) draws Step 1, phase 2 (0.5-1) slides along the path.
  const phase1 = () => state.anim === null ? 1 : Math.min(1, state.anim / 0.5);
  const phase2 = () => state.anim === null ? 1 : Math.max(0, (state.anim - 0.5) / 0.5);

  // ---------- 3D ----------

  // Step 1: the expansion path on the floor (drawn progressively during the animation).
  // Step 2: profit along the path lifted onto the surface, and a marker sliding to the top.
  let anim3dIdx = null;
  function animated3d(P) {
    const { path, floor, S } = P, xyz = pts => ({ x: pts.map(v => v[0]), y: pts.map(v => v[1]), z: pts.map(v => v[2]) });
    const n1 = Math.max(2, Math.round(path.length * phase1()));
    const floorPath = path.slice(0, n1).map(v => [v.H[0], v.H[1], floor]);
    let lifted = [], marker = [];
    if (phase1() >= 1) {
      const qStop = (S.q > 0 ? S.q : 0) * phase2();
      lifted = path.filter(v => v.profit >= floor && (state.anim === null || v.q <= qStop + 1e-12)).map(v => [v.H[0], v.H[1], v.profit]);
      if (state.anim !== null && S.q > 0) {
        const H = FM.condDemand(P.w, qStop, P.s).H;
        marker = [[H[0], H[1], P.p * qStop - FM.cost(P.w, qStop, P.s)]];
      }
    }
    return [xyz(floorPath), xyz(lifted), xyz(marker)];
  }

  function draw3d(th, P) {
    const { zmax, floor, xs, zs, path, S, Pi, one } = P, traces = [];
    const top = Math.max(Pi, 0.5 * -floor) * 1.15;
    if (state.surface) {
      traces.push({
        type: 'surface', x: xs, y: xs, z: zs, opacity: state.opacity, showscale: false, cmin: floor, cmax: top,
        colorscale: [[0, '#c9ccd3'], [0.6, '#e9e6dc'], [1, '#f6efd9']],
        contours: { x: { highlight: false }, y: { highlight: false }, z: { show: true, color: th.dark ? '#1b1f27' : '#ffffff', width: 1, highlight: false, start: floor, end: top, size: (top - floor) / 12 } },
        lighting: { ambient: 0.75, diffuse: 0.5, specular: 0.05 },
        hovertemplate: 'z₁ = %{x:.2f}<br>z₂ = %{y:.2f}<br>profit = %{z:.2f}<extra></extra>'
      });
    }
    if (state.zero) {
      traces.push({ type: 'surface', x: [0, zmax], y: [0, zmax], z: [[0, 0], [0, 0]], opacity: 0.25, showscale: false, colorscale: [[0, th.muted], [1, th.muted]], hoverinfo: 'skip', contours: { x: { highlight: false }, y: { highlight: false }, z: { highlight: false } } });
    }
    // The animated traces: always present (possibly empty), so the animation can update them alone.
    const A = animated3d(P);
    anim3dIdx = [traces.length, traces.length + 1, traces.length + 2];
    traces.push({ type: 'scatter3d', mode: 'lines', ...A[0], line: { color: th.blue, width: 6, dash: 'dot' }, hoverinfo: 'skip' });
    traces.push({ type: 'scatter3d', mode: 'lines', ...A[1], line: { color: th.red, width: 8 }, hoverinfo: 'skip' });
    traces.push({ type: 'scatter3d', mode: 'markers', ...A[2], marker: { color: th.red, size: 7 }, hoverinfo: 'skip' });
    // One step answer: the peak found by the numerical search.
    traces.push({ type: 'scatter3d', mode: 'markers+text', x: [one.z[0]], y: [one.z[1]], z: [one.value], marker: { color: th.ink, size: 7, line: { color: '#ffffff', width: 1 } }, text: ['one step: D(w,p)'], textposition: 'top center', textfont: { color: th.ink, size: 12 }, hovertemplate: 'one step<br>z₁ = %{x:.2f}, z₂ = %{y:.2f}<br>profit = %{z:.2f}<extra></extra>' });
    const axis = (title, range) => ({ title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line, showbackground: true, backgroundcolor: th.panel, showspikes: false });
    Plotly.react('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', showlegend: false, uirevision: 'keep',
      font: { color: th.ink, family: th.font, size: 12 }, hoverlabel: { font: { family: th.font } },
      scene: { uirevision: 'keep', camera: state.camera, aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.75 },
        xaxis: axis('z₁', [0, zmax]), yaxis: axis('z₂', [0, zmax]), zaxis: axis('profit', [floor, top]) }
    }, U.PLOT_CONFIG);
  }

  // ---------- Step 1 in the input space ----------

  function drawA(th, P) {
    const { s, w, zmax, u, qRef, S, path } = P, traces = [], annotations = [];
    const f1 = phase1();
    const levels = [0.5, 1, 1.5].map(f => f * qRef);
    levels.forEach((q, i) => {
      const main = i === 1, iso = FM.isoquant(q, s, zmax);
      traces.push(U.line2(iso, main ? th.blue : th.grey, main ? 3 : 1.2, `isoquant q = ${fmt(q)}`));
      if (f1 < 0.3 * (i + 1)) return; // tangencies appear one by one in the animation
      const C = FM.cost(w, q, s), H = FM.condDemand(w, q, s).H;
      traces.push(U.line2([[C / w[0], 0], [0, C / w[1]]], main ? th.ink : th.grey, main ? 2 : 1, `isocost, cost ${fmt(C)}`));
      if (u.kind !== 'multiple') traces.push(U.dot2([H], main ? th.ink : th.grey, `H(w, ${fmt(q)})`, main ? 12 : 8));
    });
    const n1 = Math.max(2, Math.round(path.length * f1));
    traces.push(U.line2(path.slice(0, n1).map(v => v.H), th.blue, 2, 'expansion path', 'dash'));
    if (u.kind === 'multiple') {
      const seg = FM.condDemand(w, qRef, s).segment;
      traces.push(U.line2(seg, th.ink, 5, 'many optimal bundles'));
      annotations.push({ xref: 'paper', yref: 'paper', x: 0.98, y: 0.98, xanchor: 'right', yanchor: 'top', showarrow: false, text: 'Many bundles are optimal', bgcolor: th.panel, bordercolor: th.line, borderpad: 4, font: { size: 12 } });
    } else if (f1 >= 1) {
      const z = S.q > 0 ? P.D : [0, 0], right = z[0] > 0.5 * zmax;
      annotations.push({ x: z[0], y: z[1], text: 'H(w,S(w,p)) = D(w,p)', showarrow: false, xanchor: right ? 'right' : 'left', yanchor: 'top', xshift: right ? -8 : 8, yshift: -6, font: { size: 12, color: th.ink }, bgcolor: th.panel });
    }
    U.plot('plotA', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, zmax], constrain: 'domain' }, y: { range: [0, zmax], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' }, annotations
    }), U.PLOT_CONFIG);
  }

  // ---------- Step 2: profit along the path ----------

  function drawB(th, P) {
    const { s, w, p, S, Pi, qRef } = P, qMax = 2 * qRef, qq = linspace(0, qMax, 300);
    const prof = qq.map(q => p * q - FM.cost(w, q, s));
    const traces = [U.line2(qq.map((q, i) => [q, prof[i]]), th.red, 2.5, 'profit along the expansion path')];
    const f2 = phase2(), sq = S.q > 0 ? S.q : 0;
    if (f2 >= 1) traces.push(U.dot2([[sq, Pi]], th.red, 'maximum: S(w,p)', 12));
    else if (state.anim !== null && phase1() >= 1) { const q = sq * f2; traces.push(U.dot2([[q, p * q - FM.cost(w, q, s)]], th.red, 'searching', 11)); }
    const hi = Math.max(...prof, 1), lo = Math.max(Math.min(...prof), -1.5 * hi);
    const ann = f2 >= 1 && sq > 0 ? [{ x: sq, y: Pi, text: 'q = S(w,p)', showarrow: false, yanchor: 'bottom', yshift: 8, font: { color: th.red, size: 12 } }] : [];
    U.plot('plotB', traces, U.base2d(th, {
      xt: 'q (along the expansion path)', yt: 'pq − C(w,q)', x: { range: [0, qMax] }, y: { range: [lo - 0.05 * hi, hi * 1.25] }, annotations: ann,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: th.muted, width: 1.5 } }]
    }), U.PLOT_CONFIG);
  }

  // ---------- comparison ----------

  const sameTo3 = (a, b, scale) => Math.abs(a - b) <= 5e-4 * Math.max(Math.abs(a), Math.abs(b), scale);

  function renderCompare(P) {
    const { s, S, Pi, D, u, one } = P;
    const q1 = FM.phi(one.z[0], one.z[1], s), sq = S.q > 0 ? S.q : 0, z2 = S.q > 0 ? D : [0, 0];
    const many = u.kind === 'multiple' && sq > 0;
    const scale = Math.max(1e-6, Math.abs(Pi) * 1e-3, P.p * sq * 1e-4);
    const okIn = many || (sameTo3(one.z[0], z2[0], 1e-3 * Math.max(...z2, 1)) && sameTo3(one.z[1], z2[1], 1e-3 * Math.max(...z2, 1)));
    const okQ = sameTo3(q1, sq, 1e-6), okPi = sameTo3(one.value, Pi, scale);
    $('compare').innerHTML =
      `<thead><tr><th></th><th>One step (PM)</th><th>Two steps (CM)+(PM')</th></tr></thead><tbody>` +
      `<tr><th>inputs</th><td>${U.pt(one.z[0], one.z[1], 3)}</td><td>${many ? 'many (a segment)' : `${texStr('H(w,S)=')}${U.pt(z2[0], z2[1], 3)}`}</td></tr>` +
      `<tr><th>output</th><td>${texStr('\\phi(z^\\ast)=')}${fmt(q1, 3)}</td><td>${texStr('S(w,p)=')}${fmt(sq, 3)}</td></tr>` +
      `<tr><th>profit</th><td>${fmt(Math.abs(one.value) < 1e-9 ? 0 : one.value, 3)}</td><td>${texStr('\\Pi(w,p)=')}${fmt(Math.abs(Pi) < 1e-9 ? 0 : Pi, 3)}</td></tr></tbody>`;
    let verdict = okIn && okQ && okPi
      ? '<span class="same">✓ same answer</span>: ' + texStr('D^i(w,p)=H^i(w,S(w,p))') + '.'
      : `<span class="differ">The two answers differ</span> (inputs ${fmt(Math.hypot(one.z[0] - z2[0], one.z[1] - z2[1]), 4)}, output ${fmt(q1 - sq, 4)}, profit ${fmt(one.value - Pi, 4)}). This should not happen: please report it.`;
    if (S.kind === 'zero') verdict += ' Price below minimum average cost: the firm does not produce.';
    if (many) verdict += ' With linear technology and w₁/δ = w₂/(1−δ), many bundles are optimal; output and profit still agree.';
    $('verdict').innerHTML = verdict;
  }

  // ---------- render loop and animation ----------

  function render() {
    U.applyVisibility({ ushape: state.profile === 'ushape', homog: state.profile === 'homog', ces: state.tech === 'ces' });
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
    const P = solve(), th = U.theme(), f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    guard('3D plot', () => draw3d(th, P));
    guard('input-space plot', () => drawA(th, P));
    guard('profit plot', () => drawB(th, P));
    guard('comparison', () => renderCompare(P));
  }

  function animate() {
    const start = performance.now(), DURATION = 4000;
    $('animate').disabled = true;
    const step = now => {
      state.anim = Math.min(1, (now - start) / DURATION);
      const P = solve(), th = U.theme(), A = animated3d(P);
      guard('animation', () => {
        if (anim3dIdx) Plotly.restyle('plot3d', { x: A.map(t => t.x), y: A.map(t => t.y), z: A.map(t => t.z) }, anim3dIdx);
        drawA(th, P);
        drawB(th, P);
      });
      if (state.anim < 1) requestAnimationFrame(step);
      else { state.anim = null; render(); $('animate').disabled = false; }
    };
    requestAnimationFrame(step);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    $('surface').addEventListener('change', e => { state.surface = e.target.checked; schedule(); });
    $('zero').addEventListener('change', e => { state.zero = e.target.checked; schedule(); });
    $('animate').addEventListener('click', animate);
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { state.camera = clone(CAMERAS[b.dataset.cam]); schedule(); }));
    render();
    $('plot3d').on('plotly_relayout', ev => { const cam = ev['scene.camera']; if (cam) state.camera = { ...state.camera, ...clone(cam) }; });
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (SR || (U.showError('Could not load search.js.'), false))) guard('page', init);
})();
