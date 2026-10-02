/*
 * Production Explorer: interface and plotting.
 * All economics lives in model.js (window.ProductionModel); this file only draws it.
 */
(function () {
  'use strict';

  const M = window.ProductionModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, num, pt, tex, texStr, linspace, logspace, line2, dot2, guard } = U;
  const root = document.documentElement;

  // ---------- state ----------

  const DEFAULT_CAMERA = {
    eye: { x: -0.8, y: -1.6, z: 0.85 },
    up: { x: 0, y: 0, z: 1 },
    center: { x: 0, y: 0, z: -0.12 },
    projection: { type: 'perspective' }
  };
  const ortho = (eye, up) => ({ eye, up, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } });
  const CAMERAS = {
    '3d': DEFAULT_CAMERA,
    top: ortho({ x: 0, y: 0, z: 1.5 }, { x: 0, y: 1, z: 0 }),     // looking down: the contour map
    front: ortho({ x: 0, y: -1.5, z: 0 }, { x: 0, y: 0, z: 1 }),  // q against z1
    side: ortho({ x: 1.5, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }),    // q against z2
    reset: DEFAULT_CAMERA
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  const state = {
    tech: 'cobb', delta: 0.5, rho: -0.5, ab: true, alpha: 0.5, beta: 0.5,
    law: 'power', A: 1, k: 1, qmax: 6, c: 3, kappa: 3, x0: 1,
    mode: 'sub', qbar: 2, mix: 1, lambda: 1, z2fix: 2, z1: 2,
    surface: true, opacity: 0.85, contours: true, zmax: 6,
    camera: clone(DEFAULT_CAMERA)
  };

  // Cobb-Douglas with alpha, beta entered directly (as in the notes).
  const abActive = () => state.ab && state.tech === 'cobb' && state.law === 'power';

  // The technology the model sees.
  function tech() {
    const s = {
      tech: state.tech, delta: state.delta, rho: state.rho, law: state.law,
      A: state.A, k: state.k, qmax: state.qmax, c: state.c, kappa: state.kappa, x0: state.x0
    };
    if (abActive()) {
      s.k = state.alpha + state.beta;
      s.delta = state.alpha / s.k;
    }
    return s;
  }

  // ---------- controls ----------

  let ctrls = {};
  const schedule = U.scheduler(render);

  // Leontief: make it possible to land exactly on the kink with the slider.
  function adjust(key, v) {
    if (key !== 'mix' || state.tech !== 'leontief') return v;
    const k = M.kinkMix(tech());
    return Math.abs(Math.log10(v / k)) < 0.015 ? k : v;
  }

  // Keep delta, k and alpha, beta describing the same Cobb-Douglas when switching between them.
  function syncAB(turningOn) {
    if (turningOn) {
      state.alpha = U.clampTo(Number((state.delta * state.k).toFixed(2)), 0.05, 1.5);
      state.beta = U.clampTo(Number(((1 - state.delta) * state.k).toFixed(2)), 0.05, 1.5);
    } else {
      const k = state.alpha + state.beta;
      state.delta = U.clampTo(Number((state.alpha / k).toFixed(2)), 0.1, 0.9);
      state.k = U.clampTo(Number(k.toFixed(2)), 0.4, 1.6);
    }
    ['alpha', 'beta', 'delta', 'k'].forEach(k => ctrls[k].sync());
  }

  function setMode(mode) {
    state.mode = mode;
    root.dataset.mode = mode;
    document.querySelectorAll('.seg [data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    buildReadouts();
    schedule();
  }

  function updateVisibility() {
    const ab = abActive();
    U.applyVisibility({
      sub: state.mode === 'sub', scale: state.mode === 'scale', one: state.mode === 'one',
      ces: state.tech === 'ces',
      power: state.law === 'power', ultra: state.law === 'ultra', threshold: state.law === 'threshold',
      cobbpower: state.tech === 'cobb' && state.law === 'power',
      ab, noab: !ab
    });
  }

  // The four shapes of Figure 10 in the notes (output as z1 grows, z2 fixed).
  const PRESETS = {
    concave: { tech: 'cobb', law: 'power', ab: true, alpha: 0.5, beta: 0.5, A: 1, z2fix: 2, z1: 2 },
    leontief: { tech: 'leontief', law: 'power', delta: 0.5, A: 1, k: 1, z2fix: 2, z1: 0.5 },
    sshape: { tech: 'cobb', law: 'ultra', delta: 0.5, qmax: 6, c: 3, kappa: 3, z2fix: 3, z1: 2 },
    threshold: { tech: 'cobb', law: 'threshold', delta: 0.5, A: 1, k: 0.7, x0: 1, z2fix: 2, z1: 3 }
  };
  function applyPreset(name) {
    Object.assign(state, PRESETS[name], { zmax: 6 });
    $('tech').value = state.tech;
    $('law').value = state.law;
    $('ab').checked = state.ab;
    Object.values(ctrls).forEach(c => c.sync());
    prevAb = abActive(); // the preset sets alpha, beta itself: do not convert from delta, k
    schedule();
  }

  // ---------- technology formula ----------

  // g(z) with the current numbers.
  function gTex(s) {
    const d = s.delta;
    switch (s.tech) {
      case 'ces':
        return Math.abs(s.rho) < 1e-9 ? `z_1^{${num(d)}}z_2^{${num(1 - d)}}`
          : `\\big[${num(d)}\\,z_1^{${num(s.rho)}}+${num(1 - d)}\\,z_2^{${num(s.rho)}}\\big]^{${num(1 / s.rho)}}`;
      case 'linear': return `${num(d)}\\,z_1+${num(1 - d)}\\,z_2`;
      case 'leontief': return `\\min\\Big\\{\\frac{z_1}{${num(d)}},\\ \\frac{z_2}{${num(1 - d)}}\\Big\\}`;
      default: return `z_1^{${num(d)}}\\,z_2^{${num(1 - d)}}`;
    }
  }

  function techNote(s) {
    switch (s.tech) {
      case 'ces': return `σ = 1/(1−ρ) = ${fmt(M.sigma(s))}. ρ → 0 gives Cobb-Douglas (σ = 1), ρ → −∞ Leontief (σ = 0), ρ → 1 linear (σ = ∞).`;
      case 'linear': return 'Perfect substitutes: σ = ∞. Straight-line isoquants, the same MRTS everywhere.';
      case 'leontief': return `Perfect complements: σ = 0. L-shaped isoquants with the kink at z₂/z₁ = ${fmt(M.kinkMix(s))}.`;
      default: return 'σ = 1: a 1% change in the MRTS changes the input mix by 1%.';
    }
  }

  function renderFormula() {
    const s = tech(), { A, delta: d, rho, k } = s;
    const a = A === 1 ? '' : num(A) + '\\,';
    const pow = Math.abs(k - 1) < 1e-9 ? '' : `^{${num(k)}}`;
    let general, numbers, extra = '', notes = '', note = techNote(s);
    if (s.law === 'power') {
      switch (s.tech) {
        case 'ces':
          general = '\\phi(z)=A\\,\\big[\\delta z_1^{\\rho}+(1-\\delta)\\,z_2^{\\rho}\\big]^{k/\\rho}';
          numbers = Math.abs(rho) < 1e-9
            ? `\\rho=0:\\ \\text{Cobb-Douglas limit}\\ q=${a}z_1^{${num(d * k)}}z_2^{${num((1 - d) * k)}}`
            : `q=${a}\\big[${num(d)}\\,z_1^{${num(rho)}}+${num(1 - d)}\\,z_2^{${num(rho)}}\\big]^{${num(k / rho)}}`;
          break;
        case 'linear':
          general = '\\phi(z)=A\\,\\big[\\delta z_1+(1-\\delta)\\,z_2\\big]^{k}';
          numbers = `q=${a}\\big[${num(d)}\\,z_1+${num(1 - d)}\\,z_2\\big]${pow}`;
          break;
        case 'leontief':
          general = '\\phi(z)=A\\,\\min\\Big\\{\\frac{z_1}{\\delta},\\ \\frac{z_2}{1-\\delta}\\Big\\}^{k}';
          numbers = `q=${a}\\min\\Big\\{\\frac{z_1}{${num(d)}},\\ \\frac{z_2}{${num(1 - d)}}\\Big\\}${pow}`;
          break;
        default: {
          const p = M.notesParams(s);
          general = '\\phi(z)=A\\,z_1^{\\alpha}z_2^{\\beta}';
          numbers = `q=${a}z_1^{${num(p.alpha)}}\\,z_2^{${num(p.beta)}}`;
          extra = abActive()
            ? `\\begin{gathered}e=\\alpha+\\beta=${num(k)}\\\\ \\text{i.e. }\\delta=\\tfrac{\\alpha}{\\alpha+\\beta}=${num(d)},\\ k=\\alpha+\\beta\\end{gathered}`
            : `\\begin{gathered}\\alpha=\\delta k=${num(p.alpha)},\\quad \\beta=(1-\\delta)k=${num(p.beta)}\\\\ e=\\alpha+\\beta=${num(k)}\\end{gathered}`;
        }
      }
      // Linear and Leontief in the form of the notes: (a z1 + b z2)^k and (min{a z1, b z2})^k.
      if (s.tech === 'linear' || s.tech === 'leontief') {
        const p = M.notesParams(s);
        const inner = s.tech === 'linear' ? `${num(p.a)}\\,z_1+${num(p.b)}\\,z_2` : `\\min\\{${num(p.a)}\\,z_1,\\ ${num(p.b)}\\,z_2\\}`;
        const shape = s.tech === 'linear' ? 'az_1+bz_2' : '\\min\\{az_1,bz_2\\}';
        notes = pow ? `\\text{Notes: }(${shape})^{k}:\\ q=\\big(${inner}\\big)${pow}` : `\\text{Notes: }${shape}:\\ q=${inner}`;
      }
    } else {
      general = '\\phi(z)=F\\big(g(z)\\big),\\quad g(z)=' + gTex(s).replace(/\\Big/g, '\\big');
      numbers = s.law === 'ultra'
        ? `F(x)=${num(s.qmax)}\\,\\frac{(x/${num(s.c)})^{${num(s.kappa)}}}{1+(x/${num(s.c)})^{${num(s.kappa)}}}`
        : `F(x)=${a}\\max\\{0,\\ x-${num(s.x0)}\\}${pow}`;
      note += ' Homothetic: F relabels the isoquants of g without changing their shape, so the MRTS and σ are those of g.';
    }
    tex($('formula-general'), general, true);
    tex($('formula-numbers'), numbers, true);
    $('formula-extra').hidden = !extra;
    if (extra) tex($('formula-extra'), extra, true);
    $('formula-notes').hidden = !notes;
    if (notes) tex($('formula-notes'), notes, true);
    $('tech-note').textContent = note;
  }

  function renderScaleLine() {
    const s = tech(), el = $('rts-line');
    if (s.law === 'power') {
      const lab = M.returnsLabel(s.k);
      el.innerHTML = `${texStr(`e=k=${num(s.k)}`)} everywhere: <span class="badge ${lab}">${lab} returns to scale</span>`;
    } else {
      const xs = M.unitElasticityLevel(s);
      el.innerHTML = s.law === 'ultra'
        ? `${texStr('e(z)')} falls along every ray, from ${texStr(`\\kappa=${num(s.kappa)}`)} towards 0: increasing returns first, decreasing later${xs ? ` (${texStr('e=1')} where ${texStr(`g(z)=${num(xs)}`)})` : ''}.`
        : `Nothing is produced until ${texStr(`g(z)>${num(s.x0)}`)}. After that ${texStr('e(z)')} falls towards ${texStr(`k=${num(s.k)}`)}${xs ? ` and equals 1 where ${texStr(`g(z)=${num(xs)}`)}` : ''}.`;
    }
  }

  // ---------- geometry helpers ----------

  // Point where the ray with mix r leaves the box [0, zmax]^2.
  function rayEnd(r, zmax) {
    const t = zmax / Math.max(1, r);
    return [t, t * r];
  }

  // Unit direction of the isoquant tangent at a point with the given MRTS (null at a kink).
  function tangentDir(m) {
    if (m === null || Number.isNaN(m)) return null;
    if (m === Infinity) return [0, 1];
    const n = Math.hypot(1, m);
    return [1 / n, -m / n];
  }

  const inBox = (p, zmax) => p[0] <= zmax + 1e-9 && p[1] <= zmax + 1e-9;

  let surfCache = { key: '', data: null };
  function surfaceData() {
    const s = tech(), key = JSON.stringify([s, state.zmax]);
    if (surfCache.key === key) return surfCache.data;
    const n = 61, xs = linspace(0, state.zmax, n);
    let max = 0;
    const z = xs.map(y => xs.map(x => {
      const q = M.output(x, y, s);
      if (q > max) max = q;
      return q;
    }));
    surfCache = { key, data: { x: xs, y: xs, z, max } };
    return surfCache.data;
  }

  // A "nice" contour spacing for heights from 0 to max.
  function niceStep(max) {
    const raw = Math.max(max, 1e-6) / 10, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10) * p;
  }

  // ---------- 3D plot ----------

  const line3 = (pts, z, color, width, extra = {}) => ({
    type: 'scatter3d', mode: 'lines',
    x: pts.map(p => p[0]), y: pts.map(p => p[1]), z: Array.isArray(z) ? z : pts.map(() => z),
    line: { color, width, ...(extra.dash ? { dash: extra.dash } : {}) },
    hoverinfo: 'skip', name: extra.name || ''
  });
  const marker3 = (p, q, color, name, size = 6) => ({
    type: 'scatter3d', mode: 'markers', x: [p[0]], y: [p[1]], z: [q],
    marker: { color, size, line: { color: '#ffffff', width: 1 } },
    name, hovertemplate: `${name}<br>z₁ = %{x:.2f}<br>z₂ = %{y:.2f}<br>q = %{z:.2f}<extra></extra>`
  });
  const flatPlane = (x, y, z, color, opacity) => ({
    type: 'surface', x, y, z, opacity, showscale: false, hoverinfo: 'skip',
    colorscale: [[0, color], [1, color]], surfacecolor: z.map(r => r.map(() => 0)),
    contours: { x: { highlight: false }, y: { highlight: false }, z: { highlight: false } },
    lighting: { ambient: 1, diffuse: 0, specular: 0 }
  });

  function draw3d(th) {
    const s = tech(), zmax = state.zmax, surf = surfaceData();
    let zTop = surf.max || 1;
    const step = niceStep(surf.max);
    const traces = [{
      type: 'surface', name: 'φ(z)', x: surf.x, y: surf.y, z: surf.z,
      visible: state.surface, opacity: state.opacity,
      colorscale: U.SURFACE_SCALE, cmin: 0, cmax: surf.max || 1, showscale: false,
      contours: {
        x: { highlight: false }, y: { highlight: false },
        z: { show: state.contours, start: step, end: surf.max, size: step, color: th.dark ? '#1b1f27' : '#ffffff', width: 2, highlight: false }
      },
      lighting: { ambient: 0.7, diffuse: 0.55, specular: 0.05, roughness: 0.9 },
      hovertemplate: 'z₁ = %{x:.2f}<br>z₂ = %{y:.2f}<br>q = %{z:.2f}<extra></extra>'
    }];

    if (state.mode === 'sub') {
      const q = state.qbar;
      zTop = Math.max(zTop, q);
      traces.push(flatPlane([0, zmax], [0, zmax], [[q, q], [q, q]], th.accent, 0.22));
      const iso = M.isoquant(q, s, zmax);
      if (iso.length) {
        traces.push(line3(iso, q, th.accent, 7, { name: 'isoquant' }));
        traces.push(line3(iso, 0, th.accent, 4, { dash: 'dash', name: 'isoquant (floor)' }));
      }
      const zb = M.pointOnIsoquant(q, state.mix, s);
      if (inBox(zb, zmax)) {
        const dir = tangentDir(M.mrts(zb[0], zb[1], s));
        if (dir) {
          const L = 0.18 * zmax;
          traces.push(line3([[zb[0] - L * dir[0], zb[1] - L * dir[1]], [zb[0] + L * dir[0], zb[1] + L * dir[1]]], q, th.accent3, 6, { name: 'tangent' }));
        }
        traces.push(line3([zb, zb], [0, q], th.muted, 2, { dash: 'dot' }));
        traces.push(marker3(zb, q, th.accent3, 'z̄', 7));
      }
    } else if (state.mode === 'scale') {
      const r = state.mix, E = rayEnd(r, zmax);
      traces.push(flatPlane([[0, E[0]], [0, E[0]]], [[0, E[1]], [0, E[1]]], [[0, 0], [zTop, zTop]], th.accent2, 0.18));
      const ray = linspace(0, 1, 160).map(t => [t * E[0], t * E[1]]);
      traces.push(line3(ray, ray.map(p => M.output(p[0], p[1], s)), th.accent2, 8, { name: 'output along the ray' }));
      for (let k = 1; k <= 5; k++) {
        const iso = M.isoquant(k, s, zmax);
        if (iso.length) traces.push(line3(iso, k, th.accent, 4, { name: `isoquant q = ${k}` }));
      }
      const zb = M.pointOnIsoquant(1, r, s), zl = [state.lambda * zb[0], state.lambda * zb[1]];
      if (inBox(zb, zmax)) traces.push(marker3(zb, 1, th.ink, 'z̄ (q = 1)', 5));
      if (inBox(zl, zmax)) {
        const ql = M.output(zl[0], zl[1], s);
        traces.push(line3([zl, zl], [0, ql], th.muted, 2, { dash: 'dot' }));
        traces.push(marker3(zl, ql, th.accent2, 'λz̄', 7));
      }
    } else {
      const z2 = Math.min(state.z2fix, zmax), z1 = state.z1;
      traces.push(flatPlane([[0, zmax], [0, zmax]], [[z2, z2], [z2, z2]], [[0, 0], [zTop, zTop]], th.accent2, 0.18));
      const path = linspace(0, zmax, 200).map(x => [x, z2]);
      traces.push(line3(path, path.map(p => M.output(p[0], z2, s)), th.accent2, 8, { name: 'output as z₁ grows' }));
      if (z1 <= zmax) {
        const q = M.output(z1, z2, s), mp = M.marginalProducts(z1, z2, s);
        if (mp) {
          const L = 0.15 * zmax;
          traces.push(line3([[z1 - L, z2], [z1 + L, z2]], [q - L * mp[0], q + L * mp[0]], th.accent3, 6, { name: 'tangent' }));
        }
        traces.push(line3([[z1, z2], [z1, z2]], [0, q], th.muted, 2, { dash: 'dot' }));
        traces.push(marker3([z1, z2], q, th.accent3, 'z̄', 7));
      }
    }

    const axis = (title, range) => ({
      title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line,
      showbackground: true, backgroundcolor: th.panel, showspikes: false
    });
    Plotly.react('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { color: th.ink, family: th.font, size: 12 },
      showlegend: false,
      uirevision: 'keep',
      hoverlabel: { font: { family: th.font } },
      scene: {
        uirevision: 'keep',
        camera: state.camera,
        aspectmode: 'manual',
        aspectratio: { x: 1, y: 1, z: 0.8 },
        xaxis: axis('z₁', [0, zmax]),
        yaxis: axis('z₂', [0, zmax]),
        zaxis: axis('q', [0, zTop * 1.02])
      }
    }, U.PLOT_CONFIG);
  }

  // ---------- 2D panel A: input space ----------

  function drawA(th) {
    const s = tech(), zmax = state.zmax, r = state.mix, E = rayEnd(r, zmax);
    const traces = [], annotations = [];
    const label = (p, text) => annotations.push({ x: p[0], y: p[1], text, showarrow: false, font: { size: 11, color: th.accent }, bgcolor: th.panel, borderpad: 1 });
    if (state.mode === 'sub') {
      const q = state.qbar, zb = M.pointOnIsoquant(q, r, s);
      traces.push(line2([[0, 0], E], th.muted, 1.2, 'ray through z̄', 'dot'));
      traces.push(line2(M.isoquant(q, s, zmax), th.accent, 3, `isoquant q̄ = ${fmt(q)}`));
      const m = M.mrts(zb[0], zb[1], s);
      if (m === Infinity) traces.push(line2([[zb[0], 0], [zb[0], zmax]], th.accent3, 2, 'tangent (vertical)', 'dash'));
      else if (m !== null && Number.isFinite(m)) {
        traces.push(line2([[0, zb[1] + m * zb[0]], [zmax, zb[1] - m * (zmax - zb[0])]], th.accent3, 2, `tangent, slope −${fmt(m)}`, 'dash'));
      }
      if (Number.isFinite(zb[0])) traces.push(dot2([zb], th.accent3, 'z̄', 11));
    } else if (state.mode === 'scale') {
      traces.push(line2([[0, 0], E], th.accent2, 2.5, `ray z₂/z₁ = ${fmt(r)}`));
      const labelMix = s.tech === 'leontief' ? (r >= M.kinkMix(s) ? M.kinkMix(s) / 4 : M.kinkMix(s) * 4) : (r >= 1 ? 0.3 : 3.3);
      const zb = M.pointOnIsoquant(1, r, s), crossings = [];
      for (let k = 1; k <= 5; k++) {
        const iso = M.isoquant(k, s, zmax);
        if (!iso.length) continue;
        traces.push(line2(iso, th.accent, 2, `isoquant q = ${k}`));
        // Label each isoquant where it crosses a second ray, well away from the user's ray.
        const lp = M.pointOnIsoquant(k, labelMix, s);
        if (inBox(lp, zmax)) label(lp, `q=${k}`);
        const lk = M.lambdaForOutput(k, zb, s);
        if (inBox([lk * zb[0], lk * zb[1]], zmax)) crossings.push([lk * zb[0], lk * zb[1]]);
      }
      traces.push({ ...dot2(crossings, th.panel, 'ray meets isoquant', 8), marker: { color: th.panel, size: 8, line: { color: th.accent2, width: 2 } } });
      if (Number.isFinite(zb[0])) traces.push(dot2([[state.lambda * zb[0], state.lambda * zb[1]]], th.accent2, 'λz̄', 12));
    } else {
      const z2 = state.z2fix;
      traces.push(line2([[0, z2], [zmax, z2]], th.accent2, 2.5, `path z₂ = ${fmt(z2)}`));
      // Isoquants through z1 = 1, 2, 3, ... on the path: equal steps in z1, unequal steps in output.
      const stepZ = zmax <= 8 ? 1 : 2;
      for (let x = stepZ; x <= zmax + 1e-9; x += stepZ) {
        const q = M.output(x, z2, s);
        if (!(q > 0)) continue;
        traces.push(line2(M.isoquant(q, s, zmax), th.accent, 1.5, `isoquant q = ${fmt(q)}`));
        label([x, Math.min(z2 + zmax * 0.06, zmax * 0.97)], `q=${fmt(q, 1)}`);
      }
      traces.push(dot2([[state.z1, z2]], th.accent3, 'z̄', 12));
    }
    const pad = zmax * 0.02;
    Plotly.react('plotA', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, zmax + pad], constrain: 'domain' },
      y: { range: [0, zmax + pad], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations
    }), U.PLOT_CONFIG);
  }

  // ---------- 2D panel B ----------

  function drawB(th) {
    const s = tech(), traces = [], annotations = [], shapes = [];
    let layout;
    if (state.mode === 'sub') {
      const rs = logspace(0.1, 10, 200), sig = M.sigma(s), d = s.delta / (1 - s.delta);
      const zb = M.pointOnIsoquant(state.qbar, state.mix, s), m = M.mrts(zb[0], zb[1], s);
      let xs, ys;
      if (s.tech === 'linear') { xs = [d, d]; ys = [0.1, 10]; }
      else if (s.tech === 'leontief') { const k = M.kinkMix(s); xs = [d / 30, d * 30]; ys = [k, k]; }
      else { xs = rs.map(r => M.mrts(1, r, s)); ys = rs; }
      const lx = xs.map(Math.log10), ly = ys.map(Math.log10);
      const cx = (Math.min(...lx) + Math.max(...lx)) / 2, cy = (Math.min(...ly) + Math.max(...ly)) / 2;
      const W = Math.max(Math.max(...lx) - Math.min(...lx), Math.max(...ly) - Math.min(...ly), 2) + 0.5;
      // Cobb-Douglas with the same delta: z2/z1 = MRTS / d (slope 1 through (d, 1)).
      const ref = [Math.pow(10, cx - W), Math.pow(10, cx + W)];
      traces.push(line2(ref.map(x => [x, x / d]), th.muted, 1.2, 'σ = 1 (Cobb-Douglas)', 'dash'));
      traces.push(line2(xs.map((x, i) => [x, ys[i]]), th.accent, 3, '', 'solid'));
      if (m !== null && Number.isFinite(m) && m > 0) traces.push(dot2([[m, state.mix]], th.accent3, 'z̄', 11));
      const slopeText = s.tech === 'linear' ? 'σ = ∞: vertical line'
        : s.tech === 'leontief' ? 'σ = 0: horizontal line'
        : `slope = σ = ${fmtSigma(sig)}`;
      annotations.push({ xref: 'paper', yref: 'paper', x: 0.02, y: 0.98, xanchor: 'left', yanchor: 'top', showarrow: false, text: slopeText, font: { color: th.accent, size: 12 }, bgcolor: th.panel });
      if (s.tech === 'leontief') {
        annotations.push({ xref: 'paper', yref: 'paper', x: 0.02, y: 0.02, xanchor: 'left', yanchor: 'bottom', showarrow: false, align: 'left',
          text: 'Mix is stuck at the kink for any MRTS.<br>Off the kink MRTS is 0 or ∞ (off this log scale).', font: { color: th.muted, size: 11 }, bgcolor: th.panel });
      }
      layout = U.base2d(th, {
        xt: 'MRTS<sub>21</sub>  (log scale)', yt: 'z<sub>2</sub>/z<sub>1</sub>  (log scale)',
        x: { type: 'log', range: [cx - W / 2, cx + W / 2], dtick: W > 8 ? 2 : 1, exponentformat: W > 4 ? 'power' : 'none', constrain: 'domain' },
        y: { type: 'log', range: [cy - W / 2, cy + W / 2], dtick: W > 8 ? 2 : 1, exponentformat: W > 4 ? 'power' : 'none', scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
        annotations
      });
    } else if (state.mode === 'scale') {
      const zb = M.pointOnIsoquant(1, state.mix, s), lam = state.lambda, LMAX = 3.2;
      const ls = linspace(0, LMAX, 241), q = l => M.output(l * zb[0], l * zb[1], s);
      const qs = ls.map(q), yMax = Math.max(...qs.filter(Number.isFinite), LMAX) * 1.05;
      const es = ls.map(l => l > 0 ? M.elasticityOfScale(l * zb[0], l * zb[1], s) : null);
      const eMax = Math.max(2, ...es.filter(e => e !== null && e < 8)) * 1.1;
      traces.push(line2([[0, 0], [LMAX, LMAX]], th.muted, 1.5, 'constant returns: q = λ', 'dash'));
      traces.push(line2(ls.map((l, i) => [l, qs[i]]), th.accent2, 3, '', 'solid'));
      traces.push({ ...line2(ls.map((l, i) => [l, es[i]]), th.accent3, 2, 'e(λz̄)', 'dash'), yaxis: 'y2', connectgaps: false });
      traces.push(dot2([[1, 1]], th.ink, 'z̄ (λ = 1, q = 1)', 8));
      if (Number.isFinite(zb[0])) traces.push(dot2([[lam, q(lam)]], th.accent2, 'λz̄', 12));
      shapes.push({ type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y2', y0: 1, y1: 1, line: { color: th.accent3, width: 1, dash: 'dot' } });
      const xs = M.unitElasticityLevel(s), lstar = xs === null ? null : xs / M.g(zb[0], zb[1], s);
      if (lstar !== null && lstar > 0 && lstar < LMAX) {
        shapes.push({ type: 'line', x0: lstar, x1: lstar, yref: 'paper', y0: 0, y1: 1, line: { color: th.accent3, width: 1, dash: 'dot' } });
        annotations.push({ x: lstar, yref: 'paper', y: 1, yanchor: 'top', xanchor: 'left', showarrow: false, text: 'e = 1', font: { color: th.accent3, size: 11 } });
      }
      layout = U.base2d(th, {
        xt: 'scale factor λ', yt: 'output φ(λz̄)',
        x: { range: [0, LMAX] }, y: { range: [0, yMax] },
        margin: { l: 52, r: 44, t: 8, b: 44 }, annotations, shapes
      });
      layout.yaxis2 = {
        overlaying: 'y', side: 'right', range: [0, eMax], fixedrange: true, showgrid: false, zeroline: false,
        title: { text: 'e', standoff: 4, font: { color: th.accent3 } }, tickfont: { color: th.accent3 }, color: th.accent3
      };
    } else {
      const z2 = state.z2fix, zmax = state.zmax, z1 = state.z1;
      const xs = linspace(0, zmax, 301), q = x => M.output(x, z2, s);
      const tp = xs.map(q);
      const mp = xs.map(x => { const v = M.marginalProducts(x, z2, s); return v ? v[0] : null; });
      const ap = xs.map((x, i) => x > 0 ? tp[i] / x : null);
      traces.push(line2(xs.map((x, i) => [x, tp[i]]), th.accent2, 3, '', 'solid'));
      const qz = q(z1), mpz = M.marginalProducts(z1, z2, s);
      if (mpz) {
        const L = 0.2 * zmax;
        traces.push(line2([[z1 - L, qz - L * mpz[0]], [z1 + L, qz + L * mpz[0]]], th.accent3, 2, `tangent, slope φ₁ = ${fmt(mpz[0])}`, 'dash'));
      }
      traces.push(dot2([[z1, qz]], th.accent3, 'z̄', 11));
      traces.push({ ...line2(xs.map((x, i) => [x, mp[i]]), th.accent3, 2.5, 'marginal product φ₁', 'solid'), yaxis: 'y2', connectgaps: false });
      traces.push({ ...line2(xs.map((x, i) => [x, ap[i]]), th.muted, 2, 'average product φ/z₁', 'dash'), yaxis: 'y2' });
      if (mpz) traces.push({ ...dot2([[z1, mpz[0]]], th.accent3, 'φ₁ at z̄', 9), yaxis: 'y2' });
      // Ignore the steep start near z1 = 0 when choosing the scale of the lower panel.
      const tail = (arr) => arr.filter((v, i) => v !== null && Number.isFinite(v) && xs[i] >= 0.12 * zmax);
      const y2Max = Math.max(1e-6, ...tail(mp), ...tail(ap)) * 1.15;
      const yMax = Math.max(1e-6, ...tp) * 1.08;
      layout = U.base2d(th, {
        xt: 'z<sub>1</sub>  (z<sub>2</sub> fixed)', yt: 'q',
        x: { range: [0, zmax], anchor: 'y2' }, y: { range: [0, yMax], domain: [0.42, 1] }
      });
      layout.yaxis2 = {
        domain: [0, 0.34], range: [0, y2Max], fixedrange: true, zeroline: false, gridcolor: th.grid, linecolor: th.line,
        tickfont: { color: th.muted }, title: { text: 'φ₁, φ/z₁', standoff: 6, font: { color: th.ink } }
      };
    }
    Plotly.react('plotB', traces, layout, U.PLOT_CONFIG);
  }
  const fmtSigma = x => Number.isInteger(x) ? String(x) : fmt(x);

  // ---------- readouts ----------

  const READOUTS = {
    sub: [
      ['zb', '\\bar z=(z_1,z_2)'], ['q', '\\bar q'], ['mrts', 'MRTS_{21}=\\phi_1/\\phi_2'],
      ['sigma', '\\sigma'], ['mix', 'z_2/z_1'], ['e', 'e(\\bar z)']
    ],
    scale: [
      ['lambda', '\\lambda'], ['zb', '\\bar z\\ (q=1)'], ['zl', '\\lambda\\bar z'], ['inputs', '\\text{inputs}'],
      ['output', '\\text{output}'], ['e', 'e(\\lambda\\bar z)'], ['rts', '\\text{returns to scale}']
    ],
    one: [
      ['zb', '\\bar z=(z_1,\\bar z_2)'], ['q', 'q=\\phi(\\bar z)'], ['mp', '\\phi_1\\ \\text{(marginal)}'],
      ['ap', '\\phi/z_1\\ \\text{(average)}'], ['dim', '\\phi_{11}'], ['e', 'e(\\bar z)']
    ]
  };
  const out = {};

  function buildReadouts() {
    const dl = $('readouts');
    dl.innerHTML = '';
    for (const k in out) delete out[k];
    for (const [key, label] of READOUTS[state.mode]) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      tex(dt, label);
      dl.append(dt, dd);
      out[key] = dd;
    }
  }

  const badge = e => e === null ? '' : ` <span class="badge ${M.returnsLabel(e)}">${M.returnsLabel(e)}</span>`;

  function renderReadouts() {
    const s = tech(), zmax = state.zmax, warn = [];
    let sentence = '';
    if (state.mode === 'sub') {
      const q = state.qbar, zb = M.pointOnIsoquant(q, state.mix, s), m = M.mrts(zb[0], zb[1], s);
      const reachable = Number.isFinite(zb[0]);
      out.zb.textContent = reachable ? pt(zb[0], zb[1]) : '—';
      out.q.textContent = fmt(q);
      out.mrts.textContent = !reachable ? '—' : m === null ? 'undefined at the kink' : fmt(m);
      out.sigma.textContent = fmtSigma(M.sigma(s));
      out.mix.textContent = fmt(state.mix);
      const e = reachable ? M.elasticityOfScale(zb[0], zb[1], s) : null;
      out.e.innerHTML = fmt(e) + badge(e);
      if (!reachable) sentence = '';
      else if (m === null) sentence = 'At the kink both inputs bind: the MRTS is undefined (any line with slope between 0 and −∞ touches the corner).';
      else if (m === Infinity) sentence = 'Here z₁ is the binding input: extra z₂ adds no output, so the isoquant is vertical and MRTS₂₁ = ∞.';
      else if (m === 0) sentence = 'Here z₂ is the binding input: extra z₁ adds no output, so the isoquant is horizontal and MRTS₂₁ = 0.';
      else sentence = `At z̄, one extra unit of z₁ replaces ${s.tech === 'linear' ? 'exactly' : 'about'} ${fmt(m)} units of z₂ with output unchanged. Change anything under “Output along a ray”: the MRTS at this input mix stays the same.`;
      if (!reachable) warn.push(`Output q̄ = ${fmt(q)} cannot be produced: the ceiling is q_max = ${fmt(s.qmax)}.`);
      else if (!inBox(zb, zmax)) warn.push('The point z̄ lies outside the plotted range: increase z_max or lower q̄.');
      else if (!M.isoquant(q, s, zmax).length) warn.push('The isoquant q̄ lies outside the plotted range: increase z_max or lower q̄.');
    } else if (state.mode === 'scale') {
      const lam = state.lambda, zb = M.pointOnIsoquant(1, state.mix, s), zl = [lam * zb[0], lam * zb[1]];
      const ql = M.output(zl[0], zl[1], s), e = M.elasticityOfScale(zl[0], zl[1], s);
      out.lambda.textContent = fmt(lam);
      out.zb.textContent = pt(zb[0], zb[1]);
      out.zl.textContent = pt(zl[0], zl[1]);
      out.inputs.textContent = `× ${fmt(lam)}`;
      out.output.innerHTML = s.law === 'power'
        ? `× ${texStr(`\\lambda^{k}=${num(lam)}^{${num(s.k)}}`)} = ${fmt(ql)}`
        : `× ${fmt(ql)}`;
      out.e.textContent = fmt(e) + (s.law === 'power' ? ' (= k everywhere)' : ' (here)');
      out.rts.innerHTML = e === null ? '—' : `<span class="badge ${M.returnsLabel(e)}">${M.returnsLabel(e)}</span>`;
      if (s.law === 'power') {
        sentence = `Doubling all inputs multiplies output by ${texStr(`2^{k}=2^{${num(s.k)}}=${Math.pow(2, s.k).toFixed(2)}`)}, wherever you start.`;
      } else {
        const q2 = M.output(2 * zl[0], 2 * zl[1], s);
        sentence = ql > 0
          ? `From λz̄, doubling all inputs multiplies output by ${fmt(q2 / ql)}. Here e(λz̄) = ${fmt(e)}: locally ${M.returnsLabel(e)} returns to scale. Move λ: the answer changes along the ray.`
          : 'At λz̄ nothing is produced yet: the threshold has not been reached.';
      }
      if (!inBox(zl, zmax)) warn.push('The point λz̄ lies outside the plotted range: increase z_max.');
    } else {
      const z1 = state.z1, z2 = state.z2fix, q = M.output(z1, z2, s), mp = M.marginalProducts(z1, z2, s);
      const slope = M.mp1Slope(z1, z2, s), e = M.elasticityOfScale(z1, z2, s);
      const tol = 1e-6 * Math.max(1, Math.abs(q));
      const trend = !mp ? 'undefined at the kink' : slope < -tol ? 'falling: diminishing marginal product' : slope > tol ? 'rising: increasing marginal product' : 'constant';
      out.zb.textContent = pt(z1, z2);
      out.q.textContent = fmt(q);
      out.mp.textContent = mp ? fmt(mp[0]) : 'undefined at the kink';
      out.ap.textContent = fmt(q / z1);
      out.dim.textContent = mp ? `${fmt(slope)} (${trend.split(':')[0]})` : '—';
      out.e.innerHTML = fmt(e) + badge(e);
      if (mp && slope < -tol && e !== null && e > 1 + 1e-9) {
        sentence = `Holding z₂ fixed, each extra unit of z₁ adds less and less (φ₁ is falling), yet e(z̄) = ${fmt(e)} > 1: increasing returns to scale. Diminishing marginal product is about one input; returns to scale are about all inputs together.`;
      } else if (mp) {
        sentence = `Holding z₂ = ${fmt(z2)} fixed, one more unit of z₁ adds about φ₁ = ${fmt(mp[0])} units of output; the marginal product is ${trend}. Scaling all inputs at z̄ gives e(z̄) = ${fmt(e)}.`;
      } else {
        sentence = 'At the kink z₁ and z₂ are both exactly enough: more z₁ alone adds nothing, less z₁ loses output. The marginal product jumps here.';
      }
      if (z1 > zmax || z2 > zmax) warn.push('The point lies outside the plotted range: increase z_max.');
    }
    $('sentence').innerHTML = sentence;
    $('warning').hidden = !warn.length;
    $('warning').textContent = warn.join(' ');
  }

  // ---------- render loop ----------

  let prevAb = null;
  function render() {
    const ab = abActive();
    if (prevAb !== null && ab !== prevAb) syncAB(ab);
    prevAb = ab;
    updateVisibility();
    guard('formula', () => { renderFormula(); renderScaleLine(); });
    const th = U.theme();
    // Draw each panel on its own, so one failing plot does not blank the others.
    guard('3D plot', () => draw3d(th));
    guard('input-space plot', () => drawA(th));
    guard('second plot', () => drawB(th));
    guard('readouts', renderReadouts);
  }

  // ---------- init ----------

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule, adjust });

    $('tech').value = state.tech;
    $('tech').addEventListener('change', e => {
      state.tech = e.target.value;
      ctrls.mix.set(state.mix); // re-snap to the Leontief kink if close
      schedule();
    });
    $('law').value = state.law;
    $('law').addEventListener('change', e => { state.law = e.target.value; schedule(); });
    $('ab').addEventListener('change', e => { state.ab = e.target.checked; schedule(); });
    document.querySelectorAll('.seg [data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
    $('surface').addEventListener('change', e => { state.surface = e.target.checked; ctrls.opacity.range.disabled = !state.surface; schedule(); });
    $('contours').addEventListener('change', e => { state.contours = e.target.checked; schedule(); });
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => {
      state.camera = clone(CAMERAS[b.dataset.cam]);
      schedule();
    }));
    // "Go to z̄": put the point exactly at (z1, z2), e.g. (1, 3) for Exercise 2 of the notes.
    $('go').addEventListener('click', () => {
      const z1 = Number($('go-z1').value), z2 = Number($('go-z2').value), q = M.output(z1, z2, tech());
      if (!(z1 > 0 && z2 > 0 && q > 0)) { U.showError('Go to z̄: both inputs must be positive and produce some output.'); return; }
      ctrls.mix.setExact(z2 / z1);
      ctrls.qbar.setExact(q);
      if (Math.max(z1, z2) > state.zmax) ctrls.zmax.set(Math.ceil(Math.max(z1, z2) * 1.2));
    });

    setMode(state.mode);
    render();

    // Remember the camera the user rotates to, so redraws keep it.
    $('plot3d').on('plotly_relayout', ev => {
      const cam = ev['scene.camera'];
      if (cam) state.camera = { ...state.camera, ...clone(cam) };
    });
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M)) guard('page', init);
})();
