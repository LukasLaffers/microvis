/*
 * Frisch's chocolate data: interface and plotting.
 * All calculations live in model.js (window.FrischModel); this file only draws them.
 */
(function () {
  'use strict';

  const M = window.FrischModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, linspace, guard } = U;
  const D = M.DATA;

  const DEFAULT_CAMERA = { eye: { x: -1.35, y: -1.55, z: 0.9 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.1 }, projection: { type: 'perspective' } };
  const ortho = (eye, up) => ({ eye, up, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } });
  const CAMERAS = {
    '3d': DEFAULT_CAMERA,
    top: ortho({ x: 0, y: 0, z: 1.5 }, { x: 0, y: 1, z: 0 }),
    front: ortho({ x: 0, y: -1.5, z: 0 }, { x: 0, y: 0, z: 1 }),
    side: ortho({ x: 1.5, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  const state = { sel: [1, 2], vary: 2, showFit: true, showSurface: true, camera: clone(DEFAULT_CAMERA) };
  const FIT = M.fitCobbDouglas();
  const PAIRS = M.scalePairs();
  const schedule = U.scheduler(render);
  const Z1MAX = 300, Z2MAX = 30, QMAX = 1100;

  const select = (i, j) => { state.sel = [i, j]; schedule(); };
  const involves = (p, i, j) => (p.from[0] === i && p.from[1] === j) || (p.to[0] === i && p.to[1] === j);

  // ---------- table ----------

  function renderTable() {
    const [si, sj] = state.sel, lo = 352, hi = 957;
    let html = `<thead><tr><th>${texStr('z_1\\backslash z_2')}</th>${D.z2.map(b => `<th>${b} kr</th>`).join('')}</tr></thead><tbody>`;
    D.z1.forEach((a, i) => {
      html += `<tr><th>${a} kr</th>`;
      D.z2.forEach((b, j) => {
        const alpha = 0.06 + 0.32 * (M.value(i, j) - lo) / (hi - lo);
        html += `<td data-i="${i}" data-j="${j}" class="${i === si && j === sj ? 'sel' : ''}" style="background: rgba(79, 140, 200, ${alpha.toFixed(2)})" tabindex="0" aria-label="${a} kr work, ${b} kr cocoa fat: ${M.value(i, j)} kg">${M.value(i, j)}</td>`;
      });
      html += '</tr>';
    });
    $('table').innerHTML = html + '</tbody>';

    const [fi, fj] = state.sel;
    $('scale-table').innerHTML = `<thead><tr><th>from</th><th>to</th><th>${texStr('\\lambda')}</th><th>${texStr("q'/q")}</th><th>${texStr('e')}</th></tr></thead><tbody>` +
      PAIRS.map((p, k) => `<tr data-k="${k}" style="${involves(p, fi, fj) ? 'font-weight:700' : ''}">` +
        `<td>(${D.z1[p.from[0]]}, ${D.z2[p.from[1]]})</td><td>(${D.z1[p.to[0]]}, ${D.z2[p.to[1]]})</td>` +
        `<td>${fmt(p.lambda)}</td><td>${fmt(p.ratio)}</td><td>${fmt(p.e)}</td></tr>`).join('') + '</tbody>';
  }

  // ---------- 3D ----------

  function draw3d(th) {
    const [si, sj] = state.sel, traces = [];
    if (state.showSurface) {
      const xs = linspace(D.z1[0], D.z1[3], 31), ys = linspace(D.z2[0], D.z2[3], 31);
      traces.push({
        type: 'surface', x: xs, y: ys, z: ys.map(b => xs.map(a => M.interpolate(a, b))),
        colorscale: U.SURFACE_SCALE, cmin: 0, cmax: QMAX, showscale: false, opacity: 0.95,
        contours: { x: { highlight: false }, y: { highlight: false }, z: { show: true, start: 400, end: 900, size: 100, color: '#ffffff', width: 2, highlight: false } },
        hovertemplate: 'z₁ = %{x:.0f} kr<br>z₂ = %{y:.1f} kr<br>q ≈ %{z:.0f} kg<extra></extra>'
      });
    }
    if (state.showFit) {
      const xs = linspace(10, Z1MAX, 30), ys = linspace(1, Z2MAX, 30);
      traces.push({
        type: 'surface', x: xs, y: ys, z: ys.map(b => xs.map(a => Math.min(M.cdOutput(a, b, FIT), QMAX))),
        colorscale: [[0, th.muted], [1, th.muted]], showscale: false, opacity: 0.25,
        contours: { x: { highlight: false }, y: { highlight: false }, z: { highlight: false } },
        hovertemplate: 'fitted Cobb-Douglas<br>z₁ = %{x:.0f}, z₂ = %{y:.1f}<br>q = %{z:.0f} kg<extra></extra>'
      });
    }
    // The row and the column of the table through the selected cell.
    traces.push({ type: 'scatter3d', mode: 'lines', x: D.z2.map(() => D.z1[si]), y: D.z2, z: D.q[si], line: { color: th.accent3, width: 6 }, hoverinfo: 'skip' });
    traces.push({ type: 'scatter3d', mode: 'lines', x: D.z1, y: D.z1.map(() => D.z2[sj]), z: D.q.map(r => r[sj]), line: { color: th.accent3, width: 6 }, hoverinfo: 'skip' });
    const cells = [];
    D.z1.forEach((a, i) => D.z2.forEach((b, j) => cells.push([a, b, M.value(i, j), i, j])));
    traces.push({
      type: 'scatter3d', mode: 'markers', x: cells.map(c => c[0]), y: cells.map(c => c[1]), z: cells.map(c => c[2]),
      customdata: cells.map(c => [c[3], c[4]]),
      marker: { size: cells.map(c => c[3] === si && c[4] === sj ? 9 : 5), color: th.accent2, line: { color: '#ffffff', width: 1 } },
      hovertemplate: 'z₁ = %{x} kr, z₂ = %{y} kr<br>q = %{z} kg<extra></extra>'
    });
    const axis = (title, range) => ({ title: { text: title }, range, color: th.ink, gridcolor: th.grid, zerolinecolor: th.line, showbackground: true, backgroundcolor: th.panel, showspikes: false });
    Plotly.react('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', showlegend: false, uirevision: 'keep',
      font: { color: th.ink, family: th.font, size: 12 }, hoverlabel: { font: { family: th.font } },
      scene: {
        uirevision: 'keep', camera: state.camera, aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.8 },
        xaxis: axis('z₁ work (kr)', [0, Z1MAX]), yaxis: axis('z₂ cocoa fat (kr)', [0, Z2MAX]), zaxis: axis('q (kg)', [0, QMAX])
      }
    }, U.PLOT_CONFIG);
  }

  // ---------- isoquants (Frisch's figure) ----------

  function drawA(th) {
    const [si, sj] = state.sel, traces = [], annotations = [], shapes = [];
    shapes.push({ type: 'rect', x0: D.z1[0], x1: D.z1[3], y0: D.z2[0], y1: D.z2[3], line: { color: th.muted, width: 1, dash: 'dot' }, fillcolor: 'rgba(0,0,0,0)' });
    // Fitted Cobb-Douglas isoquants: z2 = (q / (A z1^alpha))^(1/beta).
    if (state.showFit) {
      for (const q of [250, 500, 750, 1000]) {
        const pts = linspace(5, Z1MAX, 400).map(a => [a, Math.pow(q / (FIT.A * Math.pow(a, FIT.alpha)), 1 / FIT.beta)]).filter(p => p[1] <= Z2MAX * 1.05);
        if (!pts.length) continue;
        traces.push(U.line2(pts, th.muted, 1.5, `fitted: ${q} kg`, 'dash'));
        annotations.push({ x: pts[0][0], y: Math.min(pts[0][1], Z2MAX), text: `${q} kg`, showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -3, font: { size: 11, color: th.muted } });
      }
    }
    // Isoquants through the data (bilinear interpolation inside the measured rectangle).
    const xs = linspace(D.z1[0], D.z1[3], 121), ys = linspace(D.z2[0], D.z2[3], 121);
    traces.push({
      type: 'contour', x: xs, y: ys, z: ys.map(b => xs.map(a => M.interpolate(a, b))),
      contours: { coloring: 'lines', start: 400, end: 900, size: 100, showlabels: true, labelfont: { size: 10, color: th.accent } },
      colorscale: [[0, th.accent], [1, th.accent]], showscale: false, line: { width: 2 }, hoverinfo: 'skip'
    });
    // Rays through cells with the same input mix.
    for (const p of PAIRS) {
      const [i, j] = p.to;
      traces.push(U.line2([[0, 0], [D.z1[i], D.z2[j]]], th.accent3, involves(p, si, sj) ? 2 : 1, '', 'dash', { opacity: involves(p, si, sj) ? 1 : 0.45 }));
    }
    const cells = [];
    D.z1.forEach((a, i) => D.z2.forEach((b, j) => cells.push([a, b, i, j])));
    traces.push({
      type: 'scatter', mode: 'markers', x: cells.map(c => c[0]), y: cells.map(c => c[1]), customdata: cells.map(c => [c[2], c[3]]),
      text: cells.map(c => M.value(c[2], c[3])),
      marker: { color: th.accent2, size: cells.map(c => c[2] === si && c[3] === sj ? 15 : 9), line: { color: '#ffffff', width: 1.5 } },
      hovertemplate: 'z₁ = %{x} kr, z₂ = %{y} kr<br>q = %{text} kg<extra></extra>'
    });
    Plotly.react('plotA', traces, U.base2d(th, {
      xt: 'z<sub>1</sub> moulding and cooling work (kr)', yt: 'z<sub>2</sub> cocoa fat (kr)',
      x: { range: [0, Z1MAX] }, y: { range: [0, Z2MAX] }, annotations, shapes
    }), U.PLOT_CONFIG);
  }

  // ---------- one input varies ----------

  function drawB(th) {
    const [si, sj] = state.sel, vary2 = state.vary === 2, traces = [], annotations = [];
    const levels = vary2 ? D.z1 : D.z2, xsData = vary2 ? D.z2 : D.z1, selLevel = vary2 ? si : sj;
    levels.forEach((lev, k) => {
      const ys = vary2 ? D.q[k] : D.q.map(r => r[k]), on = k === selLevel;
      traces.push({
        type: 'scatter', mode: 'lines+markers', x: xsData, y: ys,
        line: { color: on ? th.accent3 : th.muted, width: on ? 3 : 1.5 }, marker: { size: on ? 8 : 5, color: on ? th.accent3 : th.muted },
        name: vary2 ? `z₁ = ${lev} kr` : `z₂ = ${lev} kr`, hovertemplate: '%{x} kr → %{y} kg<extra>%{fullData.name}</extra>'
      });
      annotations.push({ x: xsData[3], y: ys[3], text: vary2 ? `z₁=${lev}` : `z₂=${lev}`, showarrow: false, xanchor: 'left', xshift: 6, font: { size: 11, color: on ? th.accent3 : th.muted } });
      if (on) {
        for (let m = 0; m + 1 < 4; m++) {
          annotations.push({ x: (xsData[m] + xsData[m + 1]) / 2, y: (ys[m] + ys[m + 1]) / 2, text: `+${ys[m + 1] - ys[m]}`, showarrow: false, yshift: 12, font: { size: 12, color: th.accent3 }, bgcolor: th.panel });
        }
      }
    });
    const cur = vary2 ? [D.z2[sj], M.value(si, sj)] : [D.z1[si], M.value(si, sj)];
    traces.push(U.dot2([cur], th.accent2, 'selected cell', 14));
    const span = xsData[3] - xsData[0];
    Plotly.react('plotB', traces, U.base2d(th, {
      xt: vary2 ? 'z<sub>2</sub> cocoa fat (kr)' : 'z<sub>1</sub> work (kr)', yt: 'q (kg)',
      x: { range: [0, xsData[3] + span * 0.25] }, y: { range: [0, 1000] }, annotations,
      margin: { l: 52, r: 16, t: 8, b: 44 }
    }), U.PLOT_CONFIG);

    const row = vary2 ? D.q[si] : D.q.map(r => r[sj]), steps = [1, 2, 3].map(m => row[m] - row[m - 1]);
    const step = vary2 ? 5 : 50;
    $('titleB').textContent = vary2 ? 'Adding cocoa fat, work fixed' : 'Adding work, cocoa fat fixed';
    $('capB').textContent = vary2
      ? `Each line is a row of the table. With z₁ = ${D.z1[si]} kr of work, each extra ${step} kr of cocoa fat adds ${steps.join(', ')} kg: ${steps[2] < steps[0] ? 'diminishing marginal product' : 'no clear pattern'}.`
      : `Each line is a column of the table. With z₂ = ${D.z2[sj]} kr of cocoa fat, each extra ${step} kr of work adds ${steps.join(', ')} kg.`;
  }

  // ---------- readouts ----------

  function renderReadouts() {
    const [i, j] = state.sel, z1 = D.z1[i], z2 = D.z2[j], q = M.value(i, j);
    const { mp1, mp2 } = M.marginalProducts(i, j), m = M.mrts(i, j);
    const fitQ = M.cdOutput(z1, z2, FIT), fitM = (FIT.alpha / FIT.beta) * (z2 / z1);
    const side = d => [d.back !== null ? `${fmt(d.back)} before` : '', d.fwd !== null ? `${fmt(d.fwd)} after` : ''].filter(Boolean).join(', ');
    const rows = [
      ['z=(z_1,z_2)', `(${z1}, ${z2}) kr`],
      ['q', `${q} kg`],
      ['\\phi_1\\approx\\Delta q/\\Delta z_1', `${fmt(mp1.est)} kg per kr <span class="c-muted">(${side(mp1)})</span>`],
      ['\\phi_2\\approx\\Delta q/\\Delta z_2', `${fmt(mp2.est)} kg per kr <span class="c-muted">(${side(mp2)})</span>`],
      ['MRTS_{21}=\\phi_1/\\phi_2', fmt(m)],
      ['\\text{fitted C-D}', `q = ${fmt(fitQ, 0)} kg, MRTS₂₁ = ${fmt(fitM)}`]
    ];
    const dl = $('readouts');
    dl.innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    $('sentence').textContent = `Here one more krone of work adds about ${fmt(mp1.est)} kg and one more krone of cocoa fat about ${fmt(mp2.est)} kg, so 1 kr of work can replace about ${fmt(m)} kr of cocoa fat with the same output.`;
    $('fit-line').innerHTML = `Least squares on logs: ${texStr(`q=${fmt(FIT.A)}\\,z_1^{${fmt(FIT.alpha)}}z_2^{${fmt(FIT.beta)}}`)}, so ${texStr(`\\alpha+\\beta=${fmt(FIT.alpha + FIT.beta)}`)}: almost constant returns to scale (${texStr(`R^2=${fmt(FIT.r2, 3)}`)} on logs).`;
  }

  // ---------- render loop ----------

  function render() {
    document.querySelectorAll('[data-vary]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.vary) === state.vary)));
    guard('table', renderTable);
    const th = U.theme();
    guard('3D plot', () => draw3d(th));
    guard('isoquant plot', () => drawA(th));
    guard('one-input plot', () => drawB(th));
    guard('readouts', renderReadouts);
  }

  function init() {
    U.renderStaticTex();
    const pick = el => { if (el && el.dataset.i !== undefined) select(Number(el.dataset.i), Number(el.dataset.j)); };
    $('table').addEventListener('click', e => pick(e.target.closest('td')));
    $('table').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target.closest('td')); } });
    $('scale-table').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-k]');
      if (tr) { const p = PAIRS[Number(tr.dataset.k)]; select(p.from[0], p.from[1]); }
    });
    $('show-fit').addEventListener('change', e => { state.showFit = e.target.checked; schedule(); });
    $('show-surface').addEventListener('change', e => { state.showSurface = e.target.checked; schedule(); });
    document.querySelectorAll('[data-vary]').forEach(b => b.addEventListener('click', () => { state.vary = Number(b.dataset.vary); schedule(); }));
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { state.camera = clone(CAMERAS[b.dataset.cam]); schedule(); }));
    render();
    const onClick = ev => { const pt = ev.points && ev.points[0]; if (pt && pt.customdata) select(pt.customdata[0], pt.customdata[1]); };
    $('plotA').on('plotly_click', onClick);
    $('plot3d').on('plotly_click', onClick);
    $('plot3d').on('plotly_relayout', ev => { const cam = ev['scene.camera']; if (cam) state.camera = { ...state.camera, ...clone(cam) }; });
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M)) guard('page', init);
})();
