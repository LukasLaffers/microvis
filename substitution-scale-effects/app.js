/*
 * Substitution and Scale Effects: interface and plotting (lecture 3).
 * Firm math from shared/firm-model.js; the decomposition from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, SS = window.SubScaleModel, U = window.Microvis, FU = window.FirmUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, linspace, guard } = U;

  const state = {
    tech: 'cobb', delta: 0.5, rho: -0.5, profile: 'ushape', a: 2, m: 1, k: 0.6,
    p: 8, w2: 1, w1: 1, w1n: 1.5, t: 1, marginal: false,
    mode: 'steps', anim: null, playing: false   // mode: 'steps' (A -> B -> C) or 'smooth' (w1 rises gradually)
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: 1, k: state.k, a: state.a, m: state.m });

  let ctrls = {};
  const schedule = U.scheduler(render);
  // While an animation plays or the point is dragged, captions and tables are rewritten at most ten times a second
  // (each rewrite lays out the page).
  let writeText = true, lastText = 0, dragging = false;
  const textDue = () => { if (!state.playing && !dragging) return true; const t = performance.now(); if (t - lastText < 100) return false; lastText = t; return true; };
  const N = 160;   // steps along the smooth change

  // The smooth change of w1 is computed only in that mode, and again only when a parameter other than t changes.
  let cache = { key: '', path: null };
  const solve = () => {
    const s = tech(), w = [state.w1, state.w2], r = SS.decompose(w, state.p, s, state.w1n - state.w1);
    if (state.mode !== 'smooth') return { s, w, r };
    const key = JSON.stringify([s, w, state.p, state.w1n]);
    if (cache.key !== key) cache = { key, path: SS.path(w, state.p, s, state.w1n, N), big: null };
    return { s, w, r, path: cache.path, now: at(cache.path, state.t) };
  };

  // The state of the change at t in [0, 1]: w1, output, bundle and the accumulated parts (linear between steps).
  function at(P, t) {
    const x = t * N, k = Math.min(N - 1, Math.floor(x)), f = x - k;
    const lerp = (u, v) => Array.isArray(u) ? u.map((ui, i) => ui + (v[i] - ui) * f) : u + (v - u) * f;
    return { w1: lerp(P.w1[k], P.w1[k + 1]), q: lerp(P.q[k], P.q[k + 1]), D: lerp(P.D[k], P.D[k + 1]),
      substitution: lerp(P.substitution[k], P.substitution[k + 1]), scale: lerp(P.scale[k], P.scale[k + 1]), k: Math.round(x) };
  }

  // ---------- main plot ----------

  // Two pictures: the two-step split A -> B -> C (on load), and the smooth change with slider t.
  const drawMain = (th, P) => (state.mode === 'smooth' ? drawSmooth : drawSteps)(th, P);

  // ---------- the two-step split ----------

  // Animation: 0-0.5 substitution (A to B), 0.5-1 scale (B to C).
  const fSub = () => state.anim === null ? 1 : Math.min(1, state.anim / 0.5);
  const fScale = () => state.anim === null ? 1 : Math.max(0, (state.anim - 0.5) / 0.5);

  function drawSteps(th, P) {
    const { s, w, r } = P, { A, B, C, qA, qC, wNew } = r, traces = [], annotations = [], shapes = [];
    // Frame the view around A, B and C (with room around them), keeping equal scales on both axes.
    const xs = [A[0], B[0], C[0]], ys = [A[1], B[1], C[1]];
    const top = Math.max(...xs, ...ys, 1e-6);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.3 * top);
    const xr = [Math.max(0, Math.min(...xs) - 0.7 * span), Math.max(...xs) + 0.7 * span];
    const yr = [Math.max(0, Math.min(...ys) - 0.7 * span), Math.max(...ys) + 0.7 * span];
    const zmax = Math.max(xr[1], yr[1]);
    const ray = (z, color, name) => { const t = zmax * 1.5 / Math.max(z[0], z[1], 1e-12); return U.line2([[0, 0], [z[0] * t, z[1] * t]], color, 1.2, name, 'dot'); };
    const isocost = (ww, z) => { const c = ww[0] * z[0] + ww[1] * z[1]; return [[c / ww[0], 0], [0, c / ww[1]]]; };

    if (qA > 0) traces.push(U.line2(FM.isoquant(qA, s, zmax), th.muted, 2.5, `isoquant q* = ${fmt(qA)}`));
    if (qC > 0 && Math.abs(qC - qA) > 1e-9) traces.push(U.line2(FM.isoquant(qC, s, zmax), th.grey, 1.5, `isoquant S(w',p) = ${fmt(qC)}`));
    if (qA > 0) {
      traces.push(U.line2(isocost(w, A), th.ink, 1.5, 'old isocost line', 'dash'));
      traces.push(U.line2(isocost(wNew, B), th.ink, 2, 'new isocost line'));
      traces.push(ray(A, th.muted, 'old expansion path'));
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) > 1e-6) traces.push(ray(B, th.ink, 'new expansion path'));
    }

    // Substitution: along the old isoquant from A to B (blue). Scale: down the new expansion path to C (red).
    const fs = fSub(), fc = fScale();
    const arc = qA > 0 ? SS.isoquantArc(qA, A, B, s, 60) : [A, B];
    const arcShown = arc.slice(0, Math.max(1, Math.round(arc.length * fs)));
    if (arcShown.length > 1) traces.push(U.line2(arcShown, th.blue, 4, 'substitution'));
    const Cnow = [B[0] + (C[0] - B[0]) * fc, B[1] + (C[1] - B[1]) * fc];
    if (fs >= 1 && fc > 0) traces.push(U.line2([B, Cnow], th.red, 4, 'scale'));
    const arrow = (from, to, color) => {
      if (Math.hypot(to[0] - from[0], to[1] - from[1]) < 1e-6) return;
      annotations.push({ x: to[0], y: to[1], ax: from[0], ay: from[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowsize: 1.4, arrowwidth: 2.5, arrowcolor: color, text: '' });
    };
    if (state.anim === null) {
      if (arc.length > 2) arrow(arc[arc.length - 3], arc[arc.length - 1], th.blue);
      arrow(B, C, th.red);
      const mid = arc[Math.floor(arc.length / 2)];
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) > 1e-6) annotations.push({ x: mid[0], y: mid[1], text: 'substitution', showarrow: false, xanchor: 'right', xshift: -8, font: { color: th.blue, size: 13 }, bgcolor: th.panel });
      if (Math.hypot(C[0] - B[0], C[1] - B[1]) > 1e-6) annotations.push({ x: (B[0] + C[0]) / 2, y: (B[1] + C[1]) / 2, text: 'scale', showarrow: false, xanchor: 'left', xshift: 8, font: { color: th.red, size: 13 }, bgcolor: th.panel });
    }

    // Points.
    const label = (z, text, color, dx) => annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: dx > 0 ? 'left' : 'right', yanchor: 'bottom', xshift: dx, yshift: 4, font: { size: 15, color } });
    traces.push(U.dot2([A], th.ink, 'A = D(w,p)', 11));
    label(A, 'A', th.ink, 8);
    if (fs >= 1) { traces.push(U.dot2([B], th.blue, 'B = H(w′,q*)', 11)); label(B, 'B', th.blue, -8); }
    if (fs >= 1 && fc >= 1) { traces.push(U.dot2([C], th.red, 'C = D(w′,p)', 11)); label(C, 'C', th.red, 8); }
    else if (fc > 0) traces.push(U.dot2([Cnow], th.red, 'moving', 9));

    // Bars at the bottom of the figure (changes in z1): (B1 - A1) + (C1 - B1) = (C1 - A1).
    if (state.anim === null) {
      const h = yr[1] - yr[0], y1 = yr[0] + 0.03 * h, y2 = yr[0] + 0.075 * h;
      shapes.push({ type: 'line', x0: A[0], x1: B[0], y0: y1, y1: y1, line: { color: th.blue, width: 5 } });
      shapes.push({ type: 'line', x0: B[0], x1: C[0], y0: y1, y1: y1, line: { color: th.red, width: 5 } });
      shapes.push({ type: 'line', x0: A[0], x1: C[0], y0: y2, y1: y2, line: { color: th.ink, width: 2 } });
      // the label left of its bar, as in the smooth picture (above it, it can sit on the bar)
      annotations.push({ x: Math.min(A[0], C[0]), y: y2, text: `total ${U.fmtSum([B[0] - A[0], C[0] - B[0]])[2]}`, showarrow: false, xanchor: 'right', xshift: -6, font: { size: 11, color: th.ink } });
    }

    U.overlay('plot', []);
    U.plot('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: xr, constrain: 'domain' }, y: { range: yr, scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations, shapes
    }), { ...U.PLOT_CONFIG, displayModeBar: false });

    let cap;
    if (qA === 0) cap = 'At these prices the firm does not produce (p is below minimum average cost), so there is nothing to decompose.';
    else if (s.tech === 'leontief') cap = 'Leontief: no substitution is possible, so A and B coincide and the whole change is the scale effect.';
    else if (s.tech === 'linear') cap = 'Linear: the firm uses only the cheaper input, so B can jump to the other axis when w₁ rises past the switch price.';
    else cap = `Both effects reduce the demand for input 1: ${texStr('B_1<A_1')} (substitution) and ${texStr('C_1<B_1')} (scale).`;
    $('cap-main').innerHTML = cap;
  }

  // ---------- the smooth change ----------

  function drawSmooth(th, P) {
    const { s, w, r, path, now } = P, { A, C } = r, traces = [], moving = [], annotations = [], shapes = [];
    const wNow = [now.w1, w[1]], D = now.D, qNow = now.q;
    // Frame the view around the whole path, keeping equal scales on both axes.
    const pts = path.D.filter(z => z[0] > 0 || z[1] > 0);
    const xs = pts.map(z => z[0]), ys = pts.map(z => z[1]);
    const top = Math.max(...xs, ...ys, 1e-6);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.3 * top);
    const xr = [Math.max(0, Math.min(...xs) - 0.7 * span), Math.max(...xs) + 0.7 * span];
    const yr = [Math.max(0, Math.min(...ys) - 0.7 * span), Math.max(...ys) + 0.7 * span];
    const zmax = Math.max(xr[1], yr[1]);
    const ray = (z, color, width, name) => { const k = zmax * 1.5 / Math.max(z[0], z[1], 1e-12); return U.line2([[0, 0], [z[0] * k, z[1] * k]], color, width, name, 'dot'); };
    const isocost = (ww, z) => { const c = ww[0] * z[0] + ww[1] * z[1]; return [[c / ww[0], 0], [0, c / ww[1]]]; };
    const moved = Math.abs(now.w1 - w[0]) > 1e-9;

    // Where the firm started (faint) and where it is now (strong): isoquant, isocost line, expansion path.
    // Everything that moves goes on the fast overlay layer (U.overlay), the rest is drawn by Plotly once.
    if (r.qA > 0) {
      traces.push(U.line2(FM.isoquant(r.qA, s, zmax), th.muted, 1.2, `isoquant at the start, q = ${fmt(r.qA)}`));
      traces.push(U.line2(isocost(w, A), th.muted, 1.2, 'isocost line at the start', 'dash'));
      traces.push(ray(A, th.muted, 1, 'expansion path at the start'));
    }
    if (qNow > 0) {
      moving.push(U.line2(FM.isoquant(qNow, s, zmax), th.ink, 2.5, 'isoquant now'));
      if (moved) moving.push(U.line2(isocost(wNow, D), th.ink, 1.8, 'isocost line now'));
      if (moved) moving.push(ray(D, th.ink, 1.4, 'expansion path now'));
    }

    // The path of the firm: travelled (black) and still ahead (faint).
    const k = now.k;
    moving.push(U.line2(path.D.slice(k), th.muted, 1.5, 'still ahead', 'dot'));
    moving.push(U.line2(path.D.slice(0, k + 1).concat([D]), th.ink, 4, 'path of the firm'));

    // At the current point, both effects at once: substitution along the isoquant, scale along the ray.
    const sign = Math.sign(state.w1n - state.w1) || 1;
    const vel = x => {
      if (FM.unitDemand([x, w[1]], s).kind === 'multiple' || !(SS.output([x, w[1]], state.p, s) > 0)) return null;
      const d = SS.decomposeDerivative([x, w[1]], state.p, s);
      return { sub: [d.input1.substitution, d.input2.substitution].map(v => v * sign), sc: [d.input1.scale, d.input2.scale].map(v => v * sign) };
    };
    // Arrows, labels and bars are traces (not annotations), so that each frame of the animation only moves points.
    const v = vel(now.w1) || { sub: [0, 0], sc: [0, 0] };
    // one length scale for the whole change, so the arrows' lengths can be compared from moment to moment
    if (cache.big === null) {
      let big = 1e-12;
      for (let i = 0; i <= N; i += 10) { const u = vel(path.w1[i]); if (u) big = Math.max(big, Math.hypot(...u.sub), Math.hypot(...u.sc), Math.hypot(u.sub[0] + u.sc[0], u.sub[1] + u.sc[1])); }
      cache.big = big;
    }
    const L = 0.45 * span / cache.big, tip = d => [D[0] + d[0] * L, D[1] + d[1] * L], min = 1e-3 * span;
    const tS = tip(v.sub), tC = tip(v.sc), tT = tip([v.sub[0] + v.sc[0], v.sub[1] + v.sc[1]]);
    const far = (z, m) => Math.hypot(z[0] - D[0], z[1] - D[1]) > m;
    moving.push(U.line2(far(tT, min) ? [tS, tT] : [], th.red, 1, '', 'dot'), U.line2(far(tT, min) ? [tC, tT] : [], th.blue, 1, '', 'dot'));
    moving.push(U.arrow2(D, tS, th.blue, 3, min), U.arrow2(D, tC, th.red, 3, min), U.arrow2(D, tT, th.ink, 2, min));
    // All moving labels in one text trace (fewer traces: each one costs Plotly time in every frame).
    const texts = { x: [], y: [], text: [], pos: [], color: [], size: [] };
    const put = (z, text, color, pos, size) => { texts.x.push(z ? z[0] : null); texts.y.push(z ? z[1] : null); texts.text.push(text); texts.pos.push(pos); texts.color.push(color); texts.size.push(size); };
    const lab = (z, text, color) => put(far(z, 0.02 * span) ? z : null, ' ' + text + ' ', color, z[0] >= D[0] ? 'middle right' : 'middle left', 12);
    lab(tS, 'substitution', th.blue); lab(tC, 'scale', th.red);

    // Points.
    const label = (z, text, color, dx) => annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: dx > 0 ? 'left' : 'right', yanchor: 'bottom', xshift: dx, yshift: 4, font: { size: 15, color } });
    moving.push(U.dot2([A], th.ink, 'A = D(w,p)', 10)); label(A, 'A', th.ink, 8);
    moving.push(U.dot2([C], th.muted, "C = D(w',p)", 9)); label(C, 'C', th.muted, 8);
    moving.push(U.dot2([D], th.ink, 'the firm now (drag it)', 15));

    // Bars at the bottom of the figure (changes in z1), growing together: substitution, scale and their sum, accumulated so far.
    const h = yr[1] - yr[0], row = i => yr[0] + (0.035 + 0.04 * i) * h;
    const bar = (i, d, color, width, text) => {
      const show = Math.abs(d) >= 1e-9;
      moving.push(U.line2(show ? [[A[0], row(i)], [A[0] + d, row(i)]] : [], color, width, ''));
      put(show ? [Math.min(A[0], A[0] + d), row(i)] : null, text + '  ', color, 'middle left', 11);
    };
    bar(2, now.substitution[0], th.blue, 5, 'substitution');
    bar(1, now.scale[0], th.red, 5, 'scale');
    bar(0, now.substitution[0] + now.scale[0], th.ink, 2.5, 'total');
    moving.push({ type: 'scatter', mode: 'text', x: texts.x, y: texts.y, text: texts.text, textposition: texts.pos, textfont: { color: texts.color, size: texts.size }, hoverinfo: 'skip', cliponaxis: false });

    U.plot('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: xr, constrain: 'domain' }, y: { range: yr, scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations, shapes
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    U.overlay('plot', moving, th.font);

    let cap;
    if (r.qA === 0) cap = 'At these prices the firm does not produce (p is below minimum average cost), so there is nothing to decompose.';
    else if (s.tech === 'leontief') cap = 'Leontief: no substitution is possible, so the whole change is the scale effect: the firm slides down its expansion path.';
    else if (s.tech === 'linear') cap = 'Linear: the firm uses only the cheaper input, so when w₁ passes the switch price the bundle jumps to the other axis.';
    else if (!writeText) cap = null;
    else cap = `${texStr(`w_1=${fmt(now.w1)}`)}, output ${texStr(`q=${fmt(qNow)}`)}. The firm moves along the black path from A to C. At every moment it substitutes (blue arrow, along the current isoquant) and scales down (red arrow, along the current expansion path) at the same time; the two arrows add up to the black one, the direction of the path.`;
    if (cap !== null) $('cap-main').innerHTML = (r.qA > 0 ? `<b>Drag the black point</b> along the path to change ${texStr('t')}. ` : '') + cap;
  }

  // ---------- why output falls ----------

  function drawCosts(th, P) {
    const { s, w, r } = P, p = state.p, hat = FM.minAC(r.wNew, s);
    const qmax = Math.max(1.6 * Math.max(r.qA, r.qC, 0.5), hat.qHat ? 1.6 * hat.qHat : 0);
    const qq = linspace(qmax / 400, qmax, 400);
    const yMax = 1.8 * p;
    const clip = v => (Number.isFinite(v) && v < 3 * yMax ? v : null);
    const curve = (f, ww, color, width, name, dash) => U.line2(qq.map(q => [q, clip(f(ww, q, s))]), color, width, name, dash);
    let traces, moving = [];   // moving: on the fast overlay layer while w1 changes smoothly
    if (P.now) {
      const wNow = [P.now.w1, w[1]];
      traces = [
        curve(FM.MC, w, th.red, 1.2, 'MC at the start'),
        curve(FM.MC, r.wNew, th.red, 1.2, 'MC at the end', 'dot')
      ];
      moving = [curve(FM.MC, wNow, th.red, 3, 'MC now'), curve(FM.AC, wNow, th.ink, 1.8, 'AC now')];
      if (r.qA > 0) moving.push(U.dot2([[r.qA, p]], th.muted, 'q* = S(w,p)', 9));
      if (r.qC > 0) moving.push(U.dot2([[r.qC, p]], th.muted, "S(w',p)", 9));
      if (P.now.q > 0) moving.push(U.dot2([[P.now.q, p]], th.red, 'output now', 12));
    } else {
      traces = [
        curve(FM.MC, w, th.red, 1.2, 'MC before'),
        curve(FM.MC, r.wNew, th.red, 3, 'MC after'),
        curve(FM.AC, r.wNew, th.ink, 1.8, 'AC after')
      ];
      if (r.qA > 0) traces.push(U.dot2([[r.qA, p]], th.muted, 'q* = S(w,p)', 10));
      if (r.qC > 0) traces.push(U.dot2([[r.qC, p]], th.red, "S(w',p)", 11));
    }
    const annotations = [];
    if (r.qA > 0 && Math.abs(r.qA - r.qC) > 1e-6) {
      annotations.push({ x: r.qC, y: p, ax: r.qA, ay: p, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: th.red, text: '' });
      // below the price line: the first-order triangle sits above it
      annotations.push({ x: (r.qA + r.qC) / 2, y: p, text: `${fmt(r.qA)} → ${fmt(r.qC)}`, showarrow: false, yanchor: 'top', yshift: -8, font: { size: 12, color: th.red } });
    }
    // Lecture 4, (*): to first order MC shifts up by (dH1/dq) dw1 and output falls by shift / C_qq (the triangle).
    let tri = null;
    if (r.qA > 0 && Math.abs(r.wNew[0] - w[0]) > 1e-9 && FM.unitDemand(w, s).kind !== 'multiple') {
      const c = SS.scaleClosedForm(w, p, s), shift = c.dHdq * (r.wNew[0] - w[0]), dq = shift / c.Cqq;
      if (Number.isFinite(dq) && c.Cqq > 0) {
        tri = { shift, dq, c };
        traces.push({ type: 'scatter', mode: 'lines', x: [r.qA, r.qA, r.qA - dq, r.qA], y: [p, p + shift, p, p], fill: 'toself', fillcolor: 'rgba(208,2,27,0.25)', line: { color: th.red, width: 2 }, hoverinfo: 'skip', name: 'first-order triangle' });
        // (labelled in the caption below; the plot already carries the q* -> q** label)
      }
    }
    const dw = r.wNew[0] - w[0];
    if (writeText) $('capTri').innerHTML = tri ? `Lecture 4, (∗): by Shephard's lemma ${texStr(`\\partial MC/\\partial w_1=\\partial H^1/\\partial q=${fmt(tri.c.dHdq, 3)}`)}. A change of ${texStr(`w_1`)} by ${fmt(dw, 2)} shifts MC at ${texStr('q^\\ast')} by about ${fmt(tri.c.dHdq, 3)} × ${fmt(dw, 2)} = ${fmt(tri.shift, 3)} (the vertical side of the red triangle). MC has slope ${texStr(`C_{qq}=${fmt(tri.c.Cqq, 3)}`)}, so output changes by about ${fmt(tri.shift, 3)} / ${fmt(tri.c.Cqq, 3)} = ${fmt(tri.dq, 3)} (the horizontal side): ${texStr('\\frac{\\mathrm dq^\\ast}{\\mathrm dw_1}=\\left(-\\frac{1}{C_{qq}}\\right)\\frac{\\partial H^1}{\\partial q}')}. This is a first-order estimate; the actual change is ${fmt(Math.abs(r.qA - r.qC), 3)}.` : '';
    U.plot('plotB', traces, U.base2d(th, {
      xt: 'q', yt: 'p', x: { range: [0, qmax] }, y: { range: [0, yMax] }, annotations,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: p, y1: p, line: { color: th.muted, width: 1.5, dash: 'dash' } }]
    }), U.PLOT_CONFIG);
    U.overlay('plotB', moving, th.font);
  }

  // ---------- the table ----------

  function renderTable(P) {
    const TH = U.theme();   // the colours of the two effects, in the current light or dark theme
    const { s, w, r, now } = P, f = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3);
    if (now) {
      const [s1, c1, t1] = U.fmtSum([now.substitution[0], now.scale[0]]), [s2, c2, t2] = U.fmtSum([now.substitution[1], now.scale[1]]);
      $('table').innerHTML =
        `<thead><tr><th>so far</th><th>input 1</th><th>input 2</th></tr></thead><tbody>` +
        `<tr class="row-sub"><th>substitution</th><td>${s1}</td><td>${s2}</td></tr>` +
        `<tr class="row-scale"><th>scale</th><td>${c1}</td><td>${c2}</td></tr>` +
        `<tr class="row-total"><th>total</th><td>${t1}</td><td>${t2}</td></tr></tbody>`;
    } else {
      const [s1, c1, t1] = U.fmtSum([r.substitution[0], r.scale[0]]), [s2, c2, t2] = U.fmtSum([r.substitution[1], r.scale[1]]);
      $('table').innerHTML =
        `<thead><tr><th></th><th>input 1</th><th>input 2</th></tr></thead><tbody>` +
        `<tr class="row-sub"><th>substitution ${texStr('B-A')}</th><td>${s1}</td><td>${s2}</td></tr>` +
        `<tr class="row-scale"><th>scale ${texStr('C-B')}</th><td>${c1}</td><td>${c2}</td></tr>` +
        `<tr class="row-total"><th>total ${texStr('C-A')}</th><td>${t1}</td><td>${t2}</td></tr></tbody>`;
    }
    const box = $('marginal-box');
    if (state.marginal) {
      const tie = FM.unitDemand(w, s).kind === 'multiple';
      if (r.qA === 0 || tie) box.innerHTML = '<p class="note">The derivative is not defined here (no production, or the linear technology at its switch price).</p>';
      else {
        const d = SS.decomposeDerivative(w, state.p, s), e = d.input1, ok = Math.abs(e.substitution + e.scale - e.total) <= 1e-4 * Math.max(1, Math.abs(e.total));
        // total = substitution + scale, rounded so that the shown numbers add up
        const split = (x, y) => { const [a, b, t] = U.fmtSum([x, y]); return `${t}=\\color{${TH.blue}}{${a}}\\color{${TH.red}}{${b.startsWith('−') ? '' : '+'}${b}}`; };
        box.innerHTML = texStr(`\\frac{\\partial D^1}{\\partial w_1}=${split(e.substitution, e.scale)}`) +
          ` <span class="${ok ? 'ok-mark' : 'no-mark'}">${ok ? '✓ sum = total' : '✗'}</span>` +
          (() => { const c = SS.scaleClosedForm(w, state.p, s), ok2 = Math.abs(c.scale - e.scale) <= 1e-4 * Math.max(1, Math.abs(e.scale));
            return `<p class="note">Lecture 4, (∗∗): scale effect ${texStr(`\\color{${TH.red}}{-\\tfrac{1}{C_{qq}}\\big(\\tfrac{\\partial H^1}{\\partial q}\\big)^2=-\\tfrac{1}{${f(c.Cqq)}}(${f(c.dHdq)})^2=${f(c.scale)}}`)} <span class="${ok2 ? 'ok-mark' : 'no-mark'}">${ok2 ? '✓ = finite difference' : '✗'}</span></p>`; })() +
          `<p class="note">${texStr(`\\partial S/\\partial w_1=${f(d.dSdw1)}`)}, ${texStr(`\\partial H^1/\\partial q=${f(e.dHdq)}`)}. Cross effect: ${texStr(`\\partial D^2/\\partial w_1=${split(d.input2.substitution, d.input2.scale)}`)}</p>`;
      }
    } else box.innerHTML = '';
    $('readouts').innerHTML = (now ? [
      ['w_1', `${fmt(r.w[0])} → ${fmt(now.w1)}${state.t < 1 ? ` (→ ${fmt(r.wNew[0])})` : ''}`],
      ['q^\\ast', `${fmt(r.qA, 3)} → ${fmt(now.q, 3)}`],
      ['\\Pi(w,p)', `${fmt(r.profitA, 3)} → ${fmt(r.profitC, 3)} at the end`]
    ] : [
      ['q^\\ast', `${fmt(r.qA, 3)} → ${fmt(r.qC, 3)}`],
      ['\\Pi(w,p)', `${fmt(r.profitA, 3)} → ${fmt(r.profitC, 3)}`],
      ['w_1', `${fmt(r.w[0])} → ${fmt(r.wNew[0])}`]
    ]).map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  // ---------- render loop ----------

  function render() {
    writeText = textDue();
    U.applyVisibility({ ces: state.tech === 'ces', ushape: state.profile === 'ushape', homog: state.profile === 'homog', steps: state.mode === 'steps', smooth: state.mode === 'smooth' });
    $('play-steps').setAttribute('aria-pressed', String(state.mode === 'steps'));
    $('play-smooth').setAttribute('aria-pressed', String(state.mode === 'smooth'));
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
    $('plot').classList.toggle('drag-plot', state.mode === 'smooth');   // the grab cursor only where there is a point to drag
    // "w1 after" ranges from half to three times "w1 before".
    ctrls.w1n.setRange(Number((0.5 * state.w1).toFixed(2)), Number((3 * state.w1).toFixed(2)));
    if (state.w1n < ctrls.w1n.min || state.w1n > ctrls.w1n.max) { state.w1n = U.clampTo(state.w1n, ctrls.w1n.min, ctrls.w1n.max); ctrls.w1n.sync(); }
    const P = solve(), th = U.theme(), f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    guard('input-space plot', () => drawMain(th, P));
    guard('cost plot', () => drawCosts(th, P));
    if (writeText) guard('table', () => renderTable(P));
  }

  // The two animations; while one runs, both buttons wait.
  function play(mode, DURATION, frame, done) {
    if (state.playing) return;
    const start = performance.now();
    state.playing = true; state.mode = mode;
    $('play-steps').disabled = $('play-smooth').disabled = true;
    const step = now => {
      const f = Math.max(0, Math.min(1, (now - start) / DURATION));   // the first frame's time stamp can be earlier than the click
      frame(f);
      if (f < 1) requestAnimationFrame(step);
      else { state.playing = false; $('play-steps').disabled = $('play-smooth').disabled = false; done(); }
    };
    requestAnimationFrame(step);
  }

  // Step by step: first substitution (A to B), then scale (B to C); ends on the two-step picture.
  const playSteps = () => play('steps', 3000,
    f => { if (state.anim === null) { state.anim = 0; render(); } state.anim = f; guard('animation', () => drawMain(U.theme(), solve())); },
    () => { state.anim = null; render(); });

  // Raise w1 smoothly: t runs from 0 to 1 and everything moves at the same time; the slider t stays.
  const playSmooth = () => play('smooth', 5000,
    f => { state.t = f; ctrls.t.sync(); guard('animation', render); },
    render);

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    $('marginal').addEventListener('change', e => { state.marginal = e.target.checked; schedule(); });
    $('play-steps').addEventListener('click', playSteps);
    $('play-smooth').addEventListener('click', playSmooth);
    // In the smooth picture, drag the firm's point along its path: it sets t (the moving parts stay on the overlay).
    const smoothPath = () => (state.mode === 'smooth' && !state.playing && cache.path ? cache.path : null);
    U.dragPoint('plot', {
      start: () => { dragging = true; },
      end: () => { dragging = false; schedule(); },   // the last frame writes the captions and the table in full
      target: () => { const P = smoothPath(); return P ? at(P, state.t).D : null; },
      move: ([x, y]) => {
        const P = smoothPath();
        if (!P) return;
        // the point of the path nearest to the pointer
        let best = Infinity, tBest = state.t;
        for (let i = 0; i < N; i++) {
          const a = P.D[i], b = P.D[i + 1], d = [b[0] - a[0], b[1] - a[1]], dd = d[0] * d[0] + d[1] * d[1];
          const f = dd > 0 ? U.clampTo(((x - a[0]) * d[0] + (y - a[1]) * d[1]) / dd, 0, 1) : 0;
          const e = Math.hypot(a[0] + f * d[0] - x, a[1] + f * d[1] - y);
          if (e < best) { best = e; tBest = (i + f) / N; }
        }
        ctrls.t.setExact(U.clampTo(tBest, ctrls.t.min, ctrls.t.max));
      }
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (SS || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
