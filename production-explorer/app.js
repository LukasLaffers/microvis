/*
 * Production Explorer: interface and plotting.
 * All economics lives in model.js (window.ProductionModel); this file only draws it.
 */
(function () {
  'use strict';

  const M = window.ProductionModel;
  const $ = id => document.getElementById(id);
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
    tech: 'cobb', A: 1, delta: 0.5, rho: -0.5, nu: 1,
    mode: 'sub', qbar: 2, mix: 1, lambda: 1,
    surface: true, opacity: 0.85, contours: true, zmax: 6,
    camera: clone(DEFAULT_CAMERA)
  };
  const tech = () => ({ tech: state.tech, A: state.A, delta: state.delta, rho: state.rho, nu: state.nu });

  // ---------- formatting ----------

  function fmt(x, d = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e4 || a < 1e-3)) {
      const [m, e] = x.toExponential(2).split('e');
      return `${m}×10^${Number(e)}`;
    }
    return x.toFixed(d).replace('-', '−');
  }
  // Short number for formulas: 0.50 -> 0.5, 1.00 -> 1.
  const num = x => String(Number(x.toFixed(2)));
  const fmtSigma = x => Number.isInteger(x) ? String(x) : fmt(x);
  const pt = (z1, z2) => `(${fmt(z1)}, ${fmt(z2)})`;

  function tex(el, src, displayMode = false) {
    if (window.katex) window.katex.render(src, el, { throwOnError: false, displayMode });
    else el.textContent = src;
  }
  const texStr = src => window.katex ? window.katex.renderToString(src, { throwOnError: false }) : src;

  // ---------- controls ----------

  const ctrls = {};

  function buildControl(el) {
    const key = el.dataset.key, log = el.dataset.log === '1';
    const min = Number(el.dataset.min), max = Number(el.dataset.max);
    const step = log ? 0.005 : Number(el.dataset.step);
    el.innerHTML =
      `<div class="ctrl-label"><label for="${key}-range"><span class="lbl"></span></label>` +
      `<span class="hint">${el.dataset.hint}</span></div>` +
      `<div class="ctrl-row">` +
      `<input type="range" id="${key}-range" min="${log ? Math.log10(min) : min}" max="${log ? Math.log10(max) : max}" step="${step}">` +
      `<input type="number" id="${key}-num" min="${min}" max="${max}" step="${log ? 0.01 : step}" aria-label="${key} value">` +
      `</div>`;
    tex(el.querySelector('.lbl'), el.dataset.label);
    const range = el.querySelector('input[type=range]'), box = el.querySelector('input[type=number]');
    const dec = log ? 2 : Math.max(0, (String(step).split('.')[1] || '').length);
    const clamp = v => Math.min(max, Math.max(min, v));
    const round = v => log ? Number(v.toFixed(3)) : Number((Math.round(v / step) * step).toFixed(dec));

    const c = {
      el, range, box, hintEl: el.querySelector('.hint'),
      sync() {
        const v = state[key];
        range.value = log ? Math.log10(v) : v;
        if (document.activeElement !== box) box.value = v.toFixed(dec);
      },
      set(v) {
        if (!Number.isFinite(v)) return;
        v = round(clamp(v));
        if (key === 'mix') v = snapMix(v);
        state[key] = v;
        c.sync();
        schedule();
      }
    };
    range.addEventListener('input', () => c.set(log ? Math.pow(10, Number(range.value)) : Number(range.value)));
    box.addEventListener('change', () => { c.set(Number(box.value)); box.value = state[key].toFixed(dec); });
    ctrls[key] = c;
    c.sync();
  }

  // Leontief: make it possible to land exactly on the kink with the slider.
  function snapMix(v) {
    if (state.tech !== 'leontief') return v;
    const k = M.kinkMix(tech());
    return Math.abs(Math.log10(v / k)) < 0.015 ? k : v;
  }

  function setMode(mode) {
    state.mode = mode;
    root.dataset.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(b => {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    });
    buildReadouts();
    schedule();
  }

  function updateVisibility() {
    document.querySelectorAll('[data-show]').forEach(el => {
      const want = el.dataset.show;
      el.hidden = want === 'ces' ? state.tech !== 'ces' : want !== state.mode;
    });
  }

  // ---------- technology formula ----------

  function renderFormula() {
    const { A, delta: d, rho, nu } = state;
    const a = A === 1 ? '' : num(A) + '\\,';
    const pow = nu === 1 ? '' : `^{${num(nu)}}`;
    let general, numbers, note, extra = '';
    switch (state.tech) {
      case 'ces': {
        general = '\\phi(z)=A\\,\\big[\\delta z_1^{\\rho}+(1-\\delta)\\,z_2^{\\rho}\\big]^{\\nu/\\rho}';
        if (Math.abs(rho) < 1e-9) {
          numbers = `\\rho=0:\\ \\text{Cobb-Douglas limit}\\ q=${a}z_1^{${num(d * nu)}}z_2^{${num((1 - d) * nu)}}`;
        } else {
          numbers = `q=${a}\\big[${num(d)}\\,z_1^{${num(rho)}}+${num(1 - d)}\\,z_2^{${num(rho)}}\\big]^{${num(nu / rho)}}`;
        }
        note = `σ = 1/(1−ρ) = ${fmt(M.sigma(tech()))}. ρ → 0 gives Cobb-Douglas (σ = 1), ρ → −∞ Leontief (σ = 0), ρ → 1 linear (σ = ∞).`;
        break;
      }
      case 'linear':
        general = '\\phi(z)=A\\,\\big[\\delta z_1+(1-\\delta)\\,z_2\\big]^{\\nu}';
        numbers = `q=${a}\\big[${num(d)}\\,z_1+${num(1 - d)}\\,z_2\\big]${pow}`;
        note = 'Perfect substitutes: σ = ∞. Straight-line isoquants, the same MRTS everywhere.';
        break;
      case 'leontief':
        general = '\\phi(z)=A\\,\\min\\Big\\{\\frac{z_1}{\\delta},\\ \\frac{z_2}{1-\\delta}\\Big\\}^{\\nu}';
        numbers = `q=${a}\\min\\Big\\{\\frac{z_1}{${num(d)}},\\ \\frac{z_2}{${num(1 - d)}}\\Big\\}${pow}`;
        note = `Perfect complements: σ = 0. L-shaped isoquants with the kink at z₂/z₁ = ${fmt(M.kinkMix(tech()))}.`;
        break;
      default:
        general = '\\phi(z)=A\\,z_1^{\\alpha}z_2^{\\beta}';
        numbers = `q=${a}z_1^{${num(d * nu)}}\\,z_2^{${num((1 - d) * nu)}}`;
        extra = `\\begin{gathered}\\alpha=\\delta\\nu=${num(d * nu)},\\quad \\beta=(1-\\delta)\\nu=${num((1 - d) * nu)}\\\\ e=\\alpha+\\beta=${num(nu)}\\end{gathered}`;
        note = 'σ = 1: a 1% change in the MRTS changes the input mix by 1%.';
    }
    tex($('formula-general'), general, true);
    tex($('formula-numbers'), numbers, true);
    $('formula-extra').hidden = !extra;
    if (extra) tex($('formula-extra'), extra, true);
    $('tech-note').textContent = note;
  }

  function renderBadge() {
    const lab = M.returnsLabel(state.nu);
    const h = ctrls.nu.hintEl;
    h.className = 'badge ' + lab;
    h.textContent = `${lab} returns to scale`;
  }

  // ---------- theme for plots ----------

  function theme() {
    const cs = getComputedStyle(root), v = n => cs.getPropertyValue(n).trim();
    return {
      ink: v('--ink'), muted: v('--muted'), line: v('--line'), grid: v('--grid'), panel: v('--panel'),
      accent: v('--accent'), accent2: v('--accent-2'), accent3: v('--accent-3'),
      font: v('--font'),
      dark: v('color-scheme') === 'dark'
    };
  }
  const SURFACE_SCALE = [[0, '#f1e7c4'], [0.35, '#a9cfa0'], [0.7, '#4f9a9a'], [1, '#27577d']];

  // ---------- geometry helpers ----------

  const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  const logspace = (a, b, n) => linspace(Math.log10(a), Math.log10(b), n).map(x => Math.pow(10, x));

  // Point where the ray with mix r leaves the box [0, zmax]^2.
  function rayEnd(r, zmax) {
    const t = zmax / Math.max(1, r);
    return [t, t * r];
  }

  // Unit direction of the isoquant tangent at a point with the given MRTS (null at a kink).
  function tangentDir(m) {
    if (m === null) return null;
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
    const raw = max / 10, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10) * p;
  }

  // ---------- 3D plot ----------

  const line3 = (pts, z, color, width, extra = {}) => ({
    type: 'scatter3d', mode: 'lines',
    x: pts.map(p => p[0]), y: pts.map(p => p[1]), z: Array.isArray(z) ? z : pts.map(() => z),
    line: { color, width, ...(extra.dash ? { dash: extra.dash } : {}) },
    hoverinfo: extra.hover ? 'text' : 'skip', text: extra.hover, name: extra.name || ''
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
    let zTop = surf.max;
    const step = niceStep(surf.max);
    const traces = [{
      type: 'surface', name: 'φ(z)', x: surf.x, y: surf.y, z: surf.z,
      visible: state.surface, opacity: state.opacity,
      colorscale: SURFACE_SCALE, cmin: 0, cmax: surf.max, showscale: false,
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
    } else {
      const r = state.mix, E = rayEnd(r, zmax);
      traces.push(flatPlane([[0, E[0]], [0, E[0]]], [[0, E[1]], [0, E[1]]], [[0, 0], [zTop, zTop]], th.accent2, 0.18));
      const ts = linspace(0, 1, 120), ray = ts.map(t => [t * E[0], t * E[1]]);
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
    }

    const axis = (title, range) => ({
      title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line,
      showbackground: true, backgroundcolor: th.panel, showspikes: false
    });
    const layout = {
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
        zaxis: axis('q', [0, zTop * 1.02 || 1])
      }
    };
    Plotly.react('plot3d', traces, layout, PLOT_CONFIG);
  }

  // ---------- 2D panel A: input space ----------

  function base2d(th, extra = {}) {
    const ax = (title, more) => ({
      title: { text: title, standoff: 6, font: { color: th.ink } }, color: th.muted, gridcolor: th.grid, linecolor: th.line,
      zeroline: false, tickfont: { color: th.muted }, fixedrange: true, ...more
    });
    return {
      margin: { l: 52, r: 12, t: 8, b: 44 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: th.ink, family: th.font, size: 12 },
      showlegend: false,
      hoverlabel: { font: { family: th.font } },
      xaxis: ax(extra.xt, extra.x), yaxis: ax(extra.yt, extra.y),
      annotations: extra.annotations || []
    };
  }
  const line2 = (pts, color, width, name, dash) => ({
    type: 'scatter', mode: 'lines', x: pts.map(p => p[0]), y: pts.map(p => p[1]),
    line: { color, width, dash: dash || 'solid' }, name, hoverinfo: name ? 'name' : 'skip'
  });
  const dot2 = (pts, color, name, size = 10, symbol = 'circle') => ({
    type: 'scatter', mode: 'markers', x: pts.map(p => p[0]), y: pts.map(p => p[1]),
    marker: { color, size, symbol, line: { color: '#ffffff', width: 1.5 } },
    name, hovertemplate: `${name}<br>(%{x:.2f}, %{y:.2f})<extra></extra>`
  });

  function drawA(th) {
    const s = tech(), zmax = state.zmax, r = state.mix, E = rayEnd(r, zmax);
    const traces = [], annotations = [];
    if (state.mode === 'sub') {
      const q = state.qbar, zb = M.pointOnIsoquant(q, r, s);
      traces.push(line2([[0, 0], E], th.muted, 1.2, 'ray through z̄', 'dot'));
      traces.push(line2(M.isoquant(q, s, zmax), th.accent, 3, `isoquant q̄ = ${fmt(q)}`));
      const m = M.mrts(zb[0], zb[1], s);
      if (m === Infinity) traces.push(line2([[zb[0], 0], [zb[0], zmax]], th.accent3, 2, 'tangent (vertical)', 'dash'));
      else if (m !== null) {
        traces.push(line2([[0, zb[1] + m * zb[0]], [zmax, zb[1] - m * (zmax - zb[0])]], th.accent3, 2, `tangent, slope −${fmt(m)}`, 'dash'));
      }
      traces.push(dot2([zb], th.accent3, 'z̄', 11));
    } else {
      traces.push(line2([[0, 0], E], th.accent2, 2.5, `ray z₂/z₁ = ${fmt(r)}`));
      const labelMix = s.tech === 'leontief' ? (r >= M.kinkMix(s) ? M.kinkMix(s) / 4 : M.kinkMix(s) * 4) : (r >= 1 ? 0.3 : 3.3);
      for (let k = 1; k <= 5; k++) {
        const iso = M.isoquant(k, s, zmax);
        if (!iso.length) continue;
        traces.push(line2(iso, th.accent, 2, `isoquant q = ${k}`));
        // Label each isoquant where it crosses a second ray, well away from the user's ray.
        const lp = M.pointOnIsoquant(k, labelMix, s);
        if (inBox(lp, zmax)) annotations.push({ x: lp[0], y: lp[1], text: `q=${k}`, showarrow: false, font: { size: 11, color: th.accent }, bgcolor: th.panel, borderpad: 1 });
      }
      const zb = M.pointOnIsoquant(1, r, s);
      const crossings = [1, 2, 3, 4, 5].map(k => {
        const lk = Math.pow(k, 1 / state.nu);
        return [lk * zb[0], lk * zb[1]];
      }).filter(p => inBox(p, zmax));
      traces.push({ ...dot2(crossings, th.panel, 'ray meets isoquant', 8), marker: { color: th.panel, size: 8, line: { color: th.accent2, width: 2 } } });
      traces.push(dot2([[state.lambda * zb[0], state.lambda * zb[1]]], th.accent2, 'λz̄', 12));
    }
    const pad = zmax * 0.02;
    const layout = base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, zmax + pad], constrain: 'domain' },
      y: { range: [0, zmax + pad], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations
    });
    Plotly.react('plotA', traces, layout, PLOT_CONFIG);
  }

  // ---------- 2D panel B ----------

  function drawB(th) {
    const s = tech();
    const traces = [], annotations = [];
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
      traces.push({ ...line2(xs.map((x, i) => [x, ys[i]]), th.accent, 3, 'z₂/z₁ against MRTS₂₁'), hoverinfo: 'skip' });
      if (m !== null && Number.isFinite(m) && m > 0) traces.push(dot2([[m, state.mix]], th.accent3, 'z̄', 11));
      const slopeText = s.tech === 'linear' ? 'σ = ∞: vertical line'
        : s.tech === 'leontief' ? 'σ = 0: horizontal line'
        : `slope = σ = ${fmtSigma(sig)}`;
      annotations.push({ xref: 'paper', yref: 'paper', x: 0.02, y: 0.98, xanchor: 'left', yanchor: 'top', showarrow: false, text: slopeText, font: { color: th.accent, size: 12 }, bgcolor: th.panel });
      if (s.tech === 'leontief') {
        annotations.push({ xref: 'paper', yref: 'paper', x: 0.02, y: 0.02, xanchor: 'left', yanchor: 'bottom', showarrow: false, align: 'left',
          text: 'Mix is stuck at the kink for any MRTS.<br>Off the kink MRTS is 0 or ∞ (off this log scale).', font: { color: th.muted, size: 11 }, bgcolor: th.panel });
      }
      layout = base2d(th, {
        xt: 'MRTS<sub>21</sub>  (log scale)', yt: 'z<sub>2</sub>/z<sub>1</sub>  (log scale)',
        x: { type: 'log', range: [cx - W / 2, cx + W / 2], dtick: W > 8 ? 2 : 1, exponentformat: W > 4 ? 'power' : 'none', constrain: 'domain' },
        y: { type: 'log', range: [cy - W / 2, cy + W / 2], dtick: W > 8 ? 2 : 1, exponentformat: W > 4 ? 'power' : 'none', scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
        annotations
      });
    } else {
      const nu = state.nu, ls = linspace(0, 3.2, 161), lam = state.lambda;
      const yMax = Math.max(Math.pow(3.2, nu), 3.2) * 1.05;
      traces.push(line2([[0, 0], [3.2, 3.2]], th.muted, 1.5, 'constant returns: q = λ', 'dash'));
      traces.push({ ...line2(ls.map(l => [l, Math.pow(l, nu)]), th.accent2, 3, `q = λ^${fmt(nu)}`), hoverinfo: 'skip' });
      traces.push(dot2([[1, 1]], th.ink, 'z̄ (λ = 1, q = 1)', 8));
      traces.push(dot2([[lam, Math.pow(lam, nu)]], th.accent2, 'λz̄', 12));
      layout = base2d(th, {
        xt: 'scale factor λ', yt: 'output φ(λz̄)',
        x: { range: [0, 3.2] }, y: { range: [0, yMax] }
      });
    }
    Plotly.react('plotB', traces, layout, PLOT_CONFIG);
  }

  // ---------- readouts ----------

  const READOUTS = {
    sub: [
      ['zb', '\\bar z=(z_1,z_2)'], ['q', '\\bar q'], ['mrts', 'MRTS_{21}=\\phi_1/\\phi_2'],
      ['sigma', '\\sigma'], ['mix', 'z_2/z_1']
    ],
    scale: [
      ['lambda', '\\lambda'], ['zb', '\\bar z\\ (q=1)'], ['zl', '\\lambda\\bar z'], ['inputs', '\\text{inputs}'],
      ['output', '\\text{output}'], ['e', 'e=\\nu'], ['rts', '\\text{returns to scale}']
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

  function renderReadouts() {
    const s = tech(), zmax = state.zmax, warn = [];
    let sentence;
    if (state.mode === 'sub') {
      const q = state.qbar, zb = M.pointOnIsoquant(q, state.mix, s), m = M.mrts(zb[0], zb[1], s);
      out.zb.textContent = pt(zb[0], zb[1]);
      out.q.textContent = fmt(q);
      out.mrts.textContent = m === null ? 'undefined at the kink' : fmt(m);
      out.sigma.textContent = fmtSigma(M.sigma(s));
      out.mix.textContent = fmt(state.mix);
      if (m === null) sentence = 'At the kink both inputs bind: the MRTS is undefined (any line with slope between 0 and −∞ touches the corner).';
      else if (m === Infinity) sentence = 'Here z₁ is the binding input: extra z₂ adds no output, so the isoquant is vertical and MRTS₂₁ = ∞.';
      else if (m === 0) sentence = 'Here z₂ is the binding input: extra z₁ adds no output, so the isoquant is horizontal and MRTS₂₁ = 0.';
      else sentence = `At z̄, one extra unit of z₁ replaces ${s.tech === 'linear' ? 'exactly' : 'about'} ${fmt(m)} units of z₂ with output unchanged. Move A or ν: the MRTS at this input mix does not change.`;
      if (!inBox(zb, zmax)) warn.push('The point z̄ lies outside the plotted range: increase z_max or lower q̄.');
      else if (!M.isoquant(q, s, zmax).length) warn.push('The isoquant q̄ lies outside the plotted range: increase z_max or lower q̄.');
    } else {
      const lam = state.lambda, nu = state.nu, zb = M.pointOnIsoquant(1, state.mix, s);
      out.lambda.textContent = fmt(lam);
      out.zb.textContent = pt(zb[0], zb[1]);
      out.zl.textContent = pt(lam * zb[0], lam * zb[1]);
      out.inputs.textContent = `× ${fmt(lam)}`;
      out.output.innerHTML = `× ${texStr(`\\lambda^{\\nu}=${num(lam)}^{${num(nu)}}`)} = ${fmt(Math.pow(lam, nu))}`;
      out.e.textContent = fmt(M.scaleElasticity(s));
      out.rts.innerHTML = `<span class="badge ${M.returnsLabel(nu)}">${M.returnsLabel(nu)}</span>`;
      sentence = `Doubling all inputs multiplies output by ${texStr(`2^{\\nu}=2^{${num(nu)}}=${Math.pow(2, nu).toFixed(2)}`)}.`;
      if (!inBox([lam * zb[0], lam * zb[1]], zmax)) warn.push('The point λz̄ lies outside the plotted range: increase z_max.');
    }
    $('sentence').innerHTML = sentence;
    $('warning').hidden = !warn.length;
    $('warning').textContent = warn.join(' ');
  }

  // ---------- render loop ----------

  const PLOT_CONFIG = {
    responsive: true, displaylogo: false,
    modeBarButtonsToRemove: ['toImage', 'resetCameraLastSave3d', 'hoverClosest3d', 'orbitRotation', 'tableRotation', 'lasso2d', 'select2d', 'zoom2d', 'pan2d', 'autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d']
  };

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; render(); });
  }

  function render() {
    updateVisibility();
    renderFormula();
    renderBadge();
    const th = theme();
    draw3d(th);
    drawA(th);
    drawB(th);
    renderReadouts();
  }

  // ---------- init ----------

  function init() {
    document.querySelectorAll('.tex[data-tex]').forEach(el => tex(el, el.dataset.tex));
    document.querySelectorAll('.ctrl[data-key]').forEach(buildControl);

    $('tech').value = state.tech;
    $('tech').addEventListener('change', e => {
      state.tech = e.target.value;
      ctrls.mix.set(state.mix); // re-snap to the Leontief kink if close
      schedule();
    });
    document.querySelectorAll('.seg [data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('surface').addEventListener('change', e => { state.surface = e.target.checked; ctrls.opacity.range.disabled = !state.surface; schedule(); });
    $('contours').addEventListener('change', e => { state.contours = e.target.checked; schedule(); });
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => {
      state.camera = clone(CAMERAS[b.dataset.cam]);
      schedule();
    }));

    setMode(state.mode);
    render();

    // Remember the camera the user rotates to, so redraws keep it.
    $('plot3d').on('plotly_relayout', ev => {
      const cam = ev['scene.camera'];
      if (cam) state.camera = { ...state.camera, ...clone(cam) };
    });
    // Follow a light/dark switch of the operating system.
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', schedule);
    }
  }

  if (!M || !window.Plotly) {
    document.querySelector('main').insertAdjacentHTML('afterbegin',
      '<p class="warn">Could not load the plotting library. Check the internet connection and reload the page.</p>');
    return;
  }
  init();
})();
