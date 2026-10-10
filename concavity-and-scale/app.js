/*
 * Concavity and Returns to Scale: interface and plotting (lecture 1, Exercise 3).
 */
(function () {
  'use strict';

  const CM = window.ConcavityModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const L = 8;
  const clone = o => JSON.parse(JSON.stringify(o));
  const CAMERA_3D = { eye: { x: -1.5, y: -1.25, z: 0.55 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.15 }, projection: { type: 'perspective' } };
  // On a phone the plot is narrow: step back so that the whole box fits.
  const far = cam => { const f = window.innerWidth < 600 ? 1.35 : 1; return { ...cam, eye: { x: cam.eye.x * f, y: cam.eye.y * f, z: cam.eye.z * f } }; };
  const state = { k1: 1, k2: 0.5, a1: 7.5, a2: 0.5, b1: 0.5, b2: 4, lam: 0.5, camera: far(clone(CAMERA_3D)) };
  let ctrls = {};
  const schedule = U.scheduler(render);
  const tech = () => ({ k1: state.k1, k2: state.k2 });
  const homothetic = P => Math.abs(P.k1 - P.k2) < 1e-9;
  const nirs = P => P.k1 <= 1 + 1e-9 && P.k2 <= 1 + 1e-9;
  const f2 = v => fmt(v, 2), f3 = v => fmt(v, 3);
  const z = () => [state.a1, state.a2], zp = () => [state.b1, state.b2];
  const mix = (a, b, l) => [l * a[0] + (1 - l) * b[0], l * a[1] + (1 - l) * b[1]];
  // 1/k as a short number, or as a fraction when its two decimals would not be exact
  const inv = k => (Math.abs(1 / k - Number((1 / k).toFixed(2))) < 1e-9 ? U.num(1 / k) : `1/${U.num(k)}`);

  // ---------- formula ----------

  const pow = (b, e) => (e === '1' ? b : `${b}^{${e}}`);

  function formula(P) {
    const k1 = U.num(P.k1), k2 = U.num(P.k2);
    let closed = '';
    if (homothetic(P)) closed = `\\phi(z)=(z_1+z_2)^{${k1}}`;
    else if (Math.abs(P.k1 - 2 * P.k2) < 1e-9) closed = P.k1 === 1 ? '\\phi(z)=\\tfrac12\\big(z_1+\\sqrt{z_1^2+4z_2}\\big)' : `\\phi(z)=\\Big(\\tfrac12\\big(z_1+\\sqrt{z_1^2+4z_2}\\big)\\Big)^{${k1}}`;
    else if (Math.abs(P.k2 - 2 * P.k1) < 1e-9) closed = P.k2 === 1 ? '\\phi(z)=\\tfrac12\\big(z_2+\\sqrt{z_2^2+4z_1}\\big)' : `\\phi(z)=\\Big(\\tfrac12\\big(z_2+\\sqrt{z_2^2+4z_1}\\big)\\Big)^{${k2}}`;
    tex($('formula'), `\\begin{gathered}\\phi(z)=q\\ \\text{ such that}\\\\ \\frac{z_1}{q^{1/k_1}}+\\frac{z_2}{q^{1/k_2}}=1\\\\ k_1=${k1},\\ k_2=${k2}${closed ? `\\\\ ${closed}` : ''}\\end{gathered}`, true);
    $('tech-note').innerHTML = `The isoquant of output ${texStr('q')} is the straight line from ${texStr(`(${pow('q', inv(P.k1))},0)`)} to ${texStr(`(0,${pow('q', inv(P.k2))})`)}. On the axes ${texStr(`\\phi(z_1,0)=${pow('z_1', k1)}`)} and ${texStr(`\\phi(0,z_2)=${pow('z_2', k2)}`)}.`;
  }

  // ---------- 3D ----------

  function draw3d(th, P) {
    const g = U.linspace(0, L, 49), Z = g.map(b => g.map(a => CM.phi([a, b], P)));
    const zmax = CM.phi([L, L], P), A = z(), B = zp(), fA = CM.phi(A, P), fB = CM.phi(B, P);
    const lift = 0.006 * zmax;   // lines on the surface sit just above it, so that it does not cut through them
    const lineColor = th.dark ? 'rgba(255,255,255,0.45)' : 'rgba(29,36,51,0.38)', floorColor = th.dark ? 'rgba(255,255,255,0.22)' : 'rgba(29,36,51,0.2)';
    const traces = [{
      type: 'surface', x: g, y: g, z: Z, colorscale: U.SURFACE_SCALE, cmin: 0, cmax: zmax, showscale: false, opacity: 0.86,
      lighting: { ambient: 0.75, diffuse: 0.55, specular: 0.05, roughness: 0.9 },
      hovertemplate: 'z₁ = %{x:.2f}<br>z₂ = %{y:.2f}<br>q = %{z:.2f}<extra></extra>'
    }];
    const l3 = (pts, color, width, dash, name) => ({
      type: 'scatter3d', mode: 'lines', x: pts.map(p => p[0]), y: pts.map(p => p[1]), z: pts.map(p => p[2]),
      line: { color, width, dash: dash || 'solid' }, hoverinfo: name ? 'name' : 'skip', name: name || '', connectgaps: false
    });
    // isoquants: straight lines between the axis points, on the surface and on the floor
    for (let j = 1; j <= 7; j++) {
      const q = zmax * j / 8, [E1, E2] = CM.isoquantEnds(q, P);
      const pts = U.linspace(0, 1, 80).map(t => [(1 - t) * E1[0] + t * E2[0], (1 - t) * E1[1] + t * E2[1]])
        .map(p => (p[0] <= L + 1e-9 && p[1] <= L + 1e-9 ? p : [null, null]));
      traces.push(l3(pts.map(p => [p[0], p[1], p[0] === null ? null : q + lift]), lineColor, 2));
      traces.push(l3(pts.map(p => [p[0], p[1], p[0] === null ? null : 0]), floorColor, 2));
    }
    // rays through z and z', on the floor and on the surface
    const ray = (p, color, name) => {
      const m = Math.max(p[0], p[1]);
      if (m <= 0) return [];
      const al = U.linspace(0, L / m, 60);
      return [
        l3(al.map(a => [a * p[0], a * p[1], 0]), color, 3, 'dash'),
        l3(al.map(a => [a * p[0], a * p[1], CM.phi([a * p[0], a * p[1]], P) + lift]), color, 5, 'solid', name)
      ];
    };
    traces.push(...ray(A, th.orange, 'φ along the ray through z'), ...ray(B, th.accent4, "φ along the ray through z'"));
    // the segment, phi above it, the chord and the curtain between them
    const seg = CM.segment(A, B, P, 121);
    traces.push(l3(seg.map(s => [s.z[0], s.z[1], 0]), th.ink, 4));
    const curtain = (sign, color) => {
      const x = [], y = [], zz = [], I = [], J = [], K = [];
      seg.forEach(s => { x.push(s.z[0], s.z[0]); y.push(s.z[1], s.z[1]); zz.push(s.phi, s.chord); });
      for (let i = 0; i + 1 < seg.length; i++) {
        const g0 = seg[i].gap, g1 = seg[i + 1].gap, mid = (g0 + g1) / 2;
        if (sign * mid <= 1e-9 * Math.max(1, zmax)) continue;
        const p = 2 * i, c = 2 * i + 1, p2 = 2 * i + 2, c2 = 2 * i + 3;
        I.push(p, p2); J.push(p2, c2); K.push(c, c);
      }
      return I.length ? [{ type: 'mesh3d', x, y, z: zz, i: I, j: J, k: K, color, opacity: 0.5, flatshading: true, hoverinfo: 'skip', lighting: { ambient: 1, diffuse: 0 } }] : [];
    };
    traces.push(...curtain(1, th.red), ...curtain(-1, th.blue));
    traces.push(l3(seg.map(s => [s.z[0], s.z[1], s.phi + lift]), th.ink, 9, 'solid', 'φ(z^λ) above the segment'));
    traces.push(l3([[B[0], B[1], fB], [A[0], A[1], fA]], th.red, 6, 'solid', 'chord λφ(z) + (1−λ)φ(z′)'));
    // drop lines and points
    const lam = state.lam, Zl = mix(A, B, lam), fl = CM.phi(Zl, P), cl = lam * fA + (1 - lam) * fB;
    const drop = p => l3([[p[0], p[1], 0], [p[0], p[1], CM.phi(p, P)]], th.muted, 2, 'dot');
    traces.push(drop(A), drop(B), drop(Zl), l3([[Zl[0], Zl[1], fl], [Zl[0], Zl[1], cl]], th.red, 7));
    traces.push({
      type: 'scatter3d', mode: 'markers+text', x: [A[0], B[0], Zl[0], A[0], B[0], Zl[0]], y: [A[1], B[1], Zl[1], A[1], B[1], Zl[1]], z: [fA, fB, fl, 0, 0, 0],
      text: ['z', 'z′', 'z<sup>λ</sup>', '', '', ''], textposition: 'top center', textfont: { color: th.ink, size: 14 },
      marker: { size: [7, 7, 6, 4, 4, 4], color: [th.orange, th.accent4, th.ink, th.orange, th.accent4, th.ink], line: { color: '#ffffff', width: 1 } }, hoverinfo: 'skip'
    }, {
      type: 'scatter3d', mode: 'markers', x: [Zl[0]], y: [Zl[1]], z: [cl], marker: { size: 5, color: th.red }, hoverinfo: 'skip'
    });
    const axis = (title, r) => ({ title: { text: title, font: { color: th.ink } }, range: r, color: th.muted, gridcolor: th.grid, backgroundcolor: 'rgba(0,0,0,0)', showspikes: false, tickfont: { color: th.muted } });
    U.react3d('plot3d', traces, {
      margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', font: { color: th.ink, family: th.font, size: 12 }, showlegend: false, uirevision: 'keep',
      scene: {
        uirevision: 'keep', camera: state.camera, aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.9 },
        xaxis: axis('z₁', [0, L]), yaxis: axis('z₂', [0, L]), zaxis: axis('q', [0, zmax * 1.02])
      }
    }, U.PLOT_CONFIG, events3d);
  }

  // Camera looking horizontally at the segment, from the side of the origin (where the surface is lower).
  function faceCamera() {
    const A = z(), B = zp(), d = [A[0] - B[0], A[1] - B[1]], n0 = Math.hypot(d[0], d[1]);
    let n = n0 > 1e-9 ? [-d[1] / n0, d[0] / n0] : [-Math.SQRT1_2, -Math.SQRT1_2];
    const mid = mix(A, B, 0.5);
    // the origin side: there the surface is lower than above the segment and does not hide it
    if (n[0] * mid[0] + n[1] * mid[1] > 0) n = [-n[0], -n[1]];
    return { eye: { x: 2.1 * n[0], y: 2.1 * n[1], z: 0.32 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: -0.05 }, projection: { type: 'perspective' } };
  }
  const CAMERAS = {
    '3d': () => far(clone(CAMERA_3D)),
    face: () => far(faceCamera()),
    top: () => ({ eye: { x: 0, y: -0.01, z: 2.3 }, up: { x: 0, y: 1, z: 0 }, center: { x: 0, y: 0, z: 0 }, projection: { type: 'orthographic' } })
  };

  // ---------- along the segment ----------

  function drawSegment(th, P) {
    const A = z(), B = zp(), seg = CM.segment(A, B, P, 201), lam = state.lam;
    const fA = CM.phi(A, P), fB = CM.phi(B, P), fl = CM.phi(mix(A, B, lam), P), cl = lam * fA + (1 - lam) * fB;
    const xs = seg.map(s => s.lambda);
    const fill = (vals, color) => ({ type: 'scatter', mode: 'lines', x: xs, y: vals, line: { width: 0 }, fill: 'tonexty', fillcolor: color, hoverinfo: 'skip' });
    const base = { type: 'scatter', mode: 'lines', x: xs, y: seg.map(s => s.phi), line: { width: 0 }, hoverinfo: 'skip' };
    const red = th.dark ? 'rgba(255,77,94,0.35)' : 'rgba(208,2,27,0.22)', blue = th.dark ? 'rgba(74,144,226,0.35)' : 'rgba(74,144,226,0.25)';
    const traces = [
      base, fill(seg.map(s => Math.max(s.phi, s.chord)), red),
      base, fill(seg.map(s => Math.min(s.phi, s.chord)), blue),
      U.line2(seg.map(s => [s.lambda, s.chord]), th.red, 2.5, 'chord λφ(z) + (1−λ)φ(z′)', 'dash'),
      U.line2(seg.map(s => [s.lambda, s.phi]), th.ink, 3, 'φ(z^λ)'),
      U.line2([[lam, fl], [lam, cl]], th.red, 2),
      U.dot2([[0, fB]], th.accent4, "z'", 11), U.dot2([[1, fA]], th.orange, 'z', 11),
      U.dot2([[lam, cl]], th.red, 'chord', 7), U.dot2([[lam, fl]], th.ink, 'φ(z^λ) (drag it)', 14)
    ];
    const lo = Math.min(...seg.map(s => Math.min(s.phi, s.chord))), hi = Math.max(...seg.map(s => Math.max(s.phi, s.chord)));
    const pad = Math.max(0.05, (hi - lo) * 0.12);
    Plotly.react('plotSeg', traces, U.base2d(th, {
      xt: 'λ', yt: 'output q', x: { range: [-0.04, 1.04], tickvals: [0, 0.25, 0.5, 0.75, 1], ticktext: ["0 (z′)", '0.25', '0.5', '0.75', '1 (z)'] },
      y: { range: [lo - pad, hi + pad] }, margin: { l: 50, r: 12, t: 8, b: 44 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const mg = CM.maxGap(A, B, P), tol = 1e-9 * Math.max(1, hi);
    const now = `At ${texStr(`\\lambda=${f2(lam)}`)}: ${texStr(`\\phi(z^\\lambda)=${f3(fl)}`)}, chord ${texStr(`\\lambda\\phi(z)+(1-\\lambda)\\phi(z')=${f3(cl)}`)}.`;
    $('capSeg').innerHTML = `<b>Drag the point</b> along the curve to change ${texStr('\\lambda')}. ${now} ` + (mg.gap > tol
      ? `<span class="c-l2-red">The chord lies above ${texStr('\\phi')}</span>, by up to ${f3(mg.gap)} at ${texStr(`\\lambda=${f2(mg.lambda)}`)}: on this segment ${texStr('\\phi')} is not concave.`
      : (Math.abs(fA - fB) < tol && CM.maxGap(B, A, P).gap <= tol && seg.every(s => Math.abs(s.gap) <= tol)
        ? 'The chord and the curve coincide.'
        : `<span class="c-l2-blue">${texStr('\\phi(z^\\lambda)')} is on or above the chord</span> all the way: concavity holds on this segment.`));
    return mg;
  }

  // ---------- along the rays ----------

  function drawRays(th, P) {
    const al = U.linspace(0, 2.5, 101), traces = [U.line2([[0, 0], [2.5, 2.5]], th.muted, 2, 'constant returns: α', 'dash')];
    const items = [];
    for (const [p, color, name] of [[z(), th.orange, 'z'], [zp(), th.accent4, "z'"]]) {
      const f = CM.phi(p, P);
      if (!(f > 0)) continue;
      traces.push(U.line2(al.map(a => [a, CM.phi([a * p[0], a * p[1]], P) / f]), color, 3, `φ(α${name}) / φ(${name})`));
      items.push([name, CM.scaleElasticity(p, P)]);
    }
    traces.push(U.dot2([[1, 1]], th.ink, 'α = 1', 8));
    Plotly.react('plotRay', traces, U.base2d(th, {
      xt: 'scale factor α', yt: 'φ(αz) / φ(z)', x: { range: [0, 2.5] }, y: { range: [0, Math.max(2.6, ...traces.slice(1, -1).map(t => t.y[t.y.length - 1]).filter(Number.isFinite).map(v => Math.min(v, 6)))] },
      margin: { l: 50, r: 12, t: 8, b: 44 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const es = items.map(([n, e]) => texStr(`e(${n})=${f3(e)}`)).join(', ');
    $('capRay').innerHTML = (nirs(P)
      ? `Both curves stay on or below the <span class="c-muted">dashed line</span> for ${texStr('\\alpha>1')}: ${texStr('\\phi(\\alpha z)\\le\\alpha\\phi(z)')}, no increasing returns to scale along either ray.`
      : `A curve rises above the <span class="c-muted">dashed line</span> for ${texStr('\\alpha>1')}: increasing returns to scale along that ray.`) +
      (!es ? '' : homothetic(P)
        ? ` The two curves coincide: ${texStr('\\phi')} is homogeneous, ${texStr(`\\phi(\\alpha z)=\\alpha^{${U.num(P.k1)}}\\phi(z)`)} on every ray, ${texStr(`e=${U.num(P.k1)}`)} everywhere.`
        : ` Elasticities of scale: ${es}, always between ${texStr('k_1')} and ${texStr('k_2')}.`);
  }

  // ---------- the three conditions ----------

  function renderChecks(P, mg) {
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const A = z(), m1 = CM.mrts21(A, P), m2 = CM.mrts21([2 * A[0], 2 * A[1]], P), grid = CM.concaveOnGrid(P, L);
    const homo = homothetic(P), nr = nirs(P);
    let verdict;
    if (grid.concave) verdict = nr && homo ? '<b>Concave</b>, as the notes say: quasi-concave, no increasing returns to scale and homothetic together give a concave production function (Friedman 1973). No chord lies above the surface.' : '<b>Concave.</b>';
    else if (nr && !homo) verdict = '<b>Not concave</b>, although it is quasi-concave and has no increasing returns to scale. So the statement in Exercise 3 is false. The missing ingredient is homotheticity.';
    else if (!nr) verdict = '<b>Not concave</b>: with increasing returns to scale, output already bends upwards along a ray.';
    else verdict = '<b>Not concave</b>.';
    $('checks').innerHTML = [
      item(true, `<b>Quasi-concave.</b> Every isoquant is a straight line, so every input requirement set ${texStr('Z(q)=\\{z:\\phi(z)\\ge q\\}')} is convex.`),
      item(nr, nr
        ? homo ? `<b>No increasing returns to scale.</b> ${texStr(`e(z)=k=${U.num(P.k1)}\\le 1`)} at every ${texStr('z')}.` : `<b>No increasing returns to scale.</b> ${texStr('e(z)')} lies between ${texStr(`k_1=${U.num(P.k1)}`)} and ${texStr(`k_2=${U.num(P.k2)}`)}, so ${texStr('e(z)\\le 1')} at every ${texStr('z')}.`
        : homo ? `<b>Increasing returns to scale</b> everywhere: ${texStr(`e(z)=k=${U.num(P.k1)}>1`)}.` : (P.k1 > 1 && P.k2 > 1
          ? `<b>Increasing returns to scale</b> everywhere: ${texStr('e(z)')} lies between ${texStr(`k_1=${U.num(P.k1)}`)} and ${texStr(`k_2=${U.num(P.k2)}`)}, both above 1.`
          : `<b>Increasing returns to scale</b> near the ${texStr(P.k1 > 1 ? 'z_1' : 'z_2')} axis, where ${texStr('e(z)')} is close to ${texStr(`k_${P.k1 > 1 ? 1 : 2}=${U.num(P.k1 > 1 ? P.k1 : P.k2)}>1`)}.`)),
      item(homo, homo
        ? `<b>Homothetic.</b> The isoquants are parallel lines, so ${texStr('MRTS_{21}')} is the same all along each ray: ${texStr(`\\phi=(z_1+z_2)^{${U.num(P.k1)}}`)} is homogeneous of degree ${texStr(`k=${U.num(P.k1)}`)}.`
        : `<b>Not homothetic.</b> ${texStr(`MRTS_{21}=q^{1/k_2-1/k_1}`)} changes with output: on the ray through ${texStr('z')} it is ${f3(m1)} at ${texStr('z')} and ${f3(m2)} at ${texStr('2z')}. The isoquants rotate as output rises.`),
      item(grid.concave, verdict)
    ].join('');
    $('nums').innerHTML = [
      ["\\phi(z),\\ \\phi(z')", `${f3(CM.phi(A, P))}, ${f3(CM.phi(zp(), P))}`],
      ["e(z),\\ e(z')", `${CM.phi(A, P) > 0 ? f3(CM.scaleElasticity(A, P)) : '—'}, ${CM.phi(zp(), P) > 0 ? f3(CM.scaleElasticity(zp(), P)) : '—'}`],
      ['\\text{chord above }\\phi\\text{ by at most}', mg.gap > 1e-9 ? f3(mg.gap) : '0 (never above)']
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  let dragging = false, last3d = 0, pending3d = false;
  function render() {
    const P = tech(), th = U.theme();
    formula(P);
    // while λ is dragged, the 3D figure (slow to redraw) follows at most 15 times a second, and exactly on release
    const t = performance.now();
    if (!dragging || t - last3d > 66) { last3d = t; guard('3D plot', () => draw3d(th, P)); }
    else if (!pending3d) { pending3d = true; setTimeout(() => { pending3d = false; schedule(); }, 70); }
    let mg = { gap: 0, lambda: 0 };
    guard('segment plot', () => { mg = drawSegment(th, P); });
    guard('ray plot', () => drawRays(th, P));
    guard('checks', () => renderChecks(P, mg));
  }

  function setBundles(a, b, lam) {
    ctrls.a1.setExact(a[0]); ctrls.a2.setExact(a[1]); ctrls.b1.setExact(b[0]); ctrls.b2.setExact(b[1]);
    if (lam !== undefined) ctrls.lam.setExact(lam);
  }

  // Handlers of the 3D figure (attached again by U.react3d whenever it rebuilds the figure).
  const events3d = {
    // remember the camera the user rotates to, so redraws keep it
    plotly_relayout: ev => { const cam = ev['scene.camera']; if (cam) state.camera = { ...state.camera, ...clone(cam) }; }
  };

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('preset-ce').addEventListener('click', () => { ctrls.k1.setExact(1); ctrls.k2.setExact(0.5); });
    $('preset-homo').addEventListener('click', () => {
      const k = Math.round((state.k1 + state.k2) / 2 / 0.05) * 0.05;
      ctrls.k1.setExact(Number(k.toFixed(2))); ctrls.k2.setExact(Number(k.toFixed(2)));
    });
    $('pair-axes').addEventListener('click', () => setBundles([L, 0], [0, L], 0.5));
    $('pair-worst').addEventListener('click', () => {
      const w = CM.worstPair(tech(), L, 16);
      if (w.z) {
        // z is the bundle with the larger output, so that it sits at lambda = 1
        const [a, b] = CM.phi(w.z, tech()) >= CM.phi(w.zp, tech()) ? [w.z, w.zp] : [w.zp, w.z];
        setBundles(a, b, CM.maxGap(a, b, tech()).lambda);
      } else {
        $('capSeg').insertAdjacentHTML('beforeend', ' <span class="c-l2-blue">No pair of bundles has a chord above the surface: this technology is concave.</span>');
      }
    });
    // Drag the point along the segment plot: it sets λ.
    U.dragPoint('plotSeg', {
      start: () => { dragging = true; },
      end: () => { dragging = false; schedule(); },
      target: () => [state.lam, CM.phi(mix(z(), zp(), state.lam), tech())],
      move: ([x]) => ctrls.lam.setExact(U.clampTo(Math.round(x * 1000) / 1000, ctrls.lam.min, ctrls.lam.max))
    });
    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { state.camera = CAMERAS[b.dataset.cam](); schedule(); }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'model.js')) guard('page', init);
})();
