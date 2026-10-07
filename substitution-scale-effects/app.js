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
    p: 8, w2: 1, w1: 1, w1n: 1.5, t: 1, marginal: false, twostep: false, playing: false
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: 1, k: state.k, a: state.a, m: state.m });

  let ctrls = {};
  const schedule = U.scheduler(render);
  const N = 160;   // steps along the smooth change

  // The smooth change of w1 is recomputed only when a parameter other than t changes.
  let cache = { key: '', path: null };
  const solve = () => {
    const s = tech(), w = [state.w1, state.w2], r = SS.decompose(w, state.p, s, state.w1n - state.w1);
    const key = JSON.stringify([s, w, state.p, state.w1n]);
    if (cache.key !== key) cache = { key, path: SS.path(w, state.p, s, state.w1n, N) };
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

  function drawMain(th, P) {
    const { s, w, r, path, now } = P, { A, B, C } = r, traces = [], annotations = [], shapes = [];
    const wNow = [now.w1, w[1]], D = now.D, qNow = now.q;
    // Frame the view around the whole path (and B when it is shown), keeping equal scales on both axes.
    const pts = path.D.concat(state.twostep ? [B] : []).filter(z => z[0] > 0 || z[1] > 0);
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
    if (r.qA > 0) {
      traces.push(U.line2(FM.isoquant(r.qA, s, zmax), th.muted, 1.2, `isoquant at the start, q = ${fmt(r.qA)}`));
      traces.push(U.line2(isocost(w, A), th.muted, 1.2, 'isocost line at the start', 'dash'));
      traces.push(ray(A, th.muted, 1, 'expansion path at the start'));
    }
    if (qNow > 0) {
      traces.push(U.line2(FM.isoquant(qNow, s, zmax), th.ink, 2.5, `isoquant now, q = ${fmt(qNow)}`));
      if (moved) traces.push(U.line2(isocost(wNow, D), th.ink, 1.8, 'isocost line now'));
      if (moved) traces.push(ray(D, th.ink, 1.4, 'expansion path now'));
    }

    // The textbook two-step bookkeeping, on request: A to B along the old isoquant, B to C down the new ray.
    if (state.twostep && r.qA > 0) {
      const arc = SS.isoquantArc(r.qA, A, B, s, 60);
      traces.push(U.line2(arc, th.blue, 2, 'two-step: A → B', 'dash'));
      traces.push(U.line2([B, C], th.red, 2, 'two-step: B → C', 'dash'));
      traces.push(U.dot2([B], th.blue, 'B = H(w′,q*)', 9));
      annotations.push({ x: B[0], y: B[1], text: 'B', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -6, yshift: 4, font: { size: 14, color: th.blue } });
    }

    // The path of the firm: travelled (black) and still ahead (faint).
    const k = now.k;
    traces.push(U.line2(path.D.slice(k), th.muted, 1.5, 'still ahead', 'dot'));
    traces.push(U.line2(path.D.slice(0, k + 1).concat([D]), th.ink, 4, 'path of the firm'));

    // At the current point, both effects at once: substitution along the isoquant, scale along the ray.
    const sign = Math.sign(state.w1n - state.w1) || 1;
    const vel = x => {
      if (FM.unitDemand([x, w[1]], s).kind === 'multiple' || !(SS.output([x, w[1]], state.p, s) > 0)) return null;
      const d = SS.decomposeDerivative([x, w[1]], state.p, s);
      return { sub: [d.input1.substitution, d.input2.substitution].map(v => v * sign), sc: [d.input1.scale, d.input2.scale].map(v => v * sign) };
    };
    const v = vel(now.w1);
    if (v) {
      // one length scale for the whole change, so the arrows' lengths can be compared from moment to moment
      let big = 1e-12;
      for (let i = 0; i <= N; i += 10) { const u = vel(path.w1[i]); if (u) big = Math.max(big, Math.hypot(...u.sub), Math.hypot(...u.sc), Math.hypot(u.sub[0] + u.sc[0], u.sub[1] + u.sc[1])); }
      const L = 0.45 * span / big, tip = d => [D[0] + d[0] * L, D[1] + d[1] * L];
      const arrow = (to, color, width) => {
        if (Math.hypot(to[0] - D[0], to[1] - D[1]) < 1e-3 * span) return;
        annotations.push({ x: to[0], y: to[1], ax: D[0], ay: D[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowsize: 1.2, arrowwidth: width, arrowcolor: color, text: '' });
      };
      const tS = tip(v.sub), tC = tip(v.sc), tT = tip([v.sub[0] + v.sc[0], v.sub[1] + v.sc[1]]);
      if (Math.hypot(tT[0] - D[0], tT[1] - D[1]) > 1e-3 * span) {
        shapes.push({ type: 'line', x0: tS[0], y0: tS[1], x1: tT[0], y1: tT[1], line: { color: th.red, width: 1, dash: 'dot' } });
        shapes.push({ type: 'line', x0: tC[0], y0: tC[1], x1: tT[0], y1: tT[1], line: { color: th.blue, width: 1, dash: 'dot' } });
      }
      arrow(tS, th.blue, 3); arrow(tC, th.red, 3); arrow(tT, th.ink, 2);
      const lab = (z, text, color) => { if (Math.hypot(z[0] - D[0], z[1] - D[1]) > 0.02 * span) annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: z[0] >= D[0] ? 'left' : 'right', xshift: z[0] >= D[0] ? 6 : -6, font: { size: 12, color }, bgcolor: th.panel }); };
      lab(tS, 'substitution', th.blue); lab(tC, 'scale', th.red);
    }

    // Points.
    const label = (z, text, color, dx) => annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: dx > 0 ? 'left' : 'right', yanchor: 'bottom', xshift: dx, yshift: 4, font: { size: 15, color } });
    traces.push(U.dot2([A], th.ink, 'A = D(w,p)', 10)); label(A, 'A', th.ink, 8);
    traces.push(U.dot2([C], th.muted, "C = D(w',p)", 9)); label(C, 'C', th.muted, 8);
    traces.push(U.dot2([D], th.ink, 'the firm now', 13));

    // Bars on the z1 axis, growing together: substitution, scale and their sum, accumulated so far.
    const h = yr[1] - yr[0], row = i => yr[0] + (0.035 + 0.04 * i) * h;
    const bar = (i, d, color, width, text) => {
      if (Math.abs(d) < 1e-9) return;
      shapes.push({ type: 'line', x0: A[0], x1: A[0] + d, y0: row(i), y1: row(i), line: { color, width } });
      annotations.push({ x: Math.min(A[0], A[0] + d), y: row(i), text, showarrow: false, xanchor: 'right', xshift: -6, font: { size: 11, color } });
    };
    bar(2, now.substitution[0], th.blue, 5, 'substitution');
    bar(1, now.scale[0], th.red, 5, 'scale');
    bar(0, now.substitution[0] + now.scale[0], th.ink, 2.5, 'total');

    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: xr, constrain: 'domain' }, y: { range: yr, scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations, shapes
    }), { ...U.PLOT_CONFIG, displayModeBar: false });

    let cap;
    if (r.qA === 0) cap = 'At these prices the firm does not produce (p is below minimum average cost), so there is nothing to decompose.';
    else if (s.tech === 'leontief') cap = 'Leontief: no substitution is possible, so the whole change is the scale effect: the firm slides down its expansion path.';
    else if (s.tech === 'linear') cap = 'Linear: the firm uses only the cheaper input, so when w₁ passes the switch price the bundle jumps to the other axis.';
    else cap = `${texStr(`w_1=${fmt(now.w1)}`)}, output ${texStr(`q=${fmt(qNow)}`)}. The firm moves along the black path from A to C. At every moment it substitutes (blue arrow, along the current isoquant) and scales down (red arrow, along the current expansion path) at the same time; the two arrows add up to the black one, the direction of the path.`;
    $('cap-main').innerHTML = cap;
  }

  // ---------- why output falls ----------

  function drawCosts(th, P) {
    const { s, w, r } = P, p = state.p, hat = FM.minAC(r.wNew, s);
    const qmax = Math.max(1.6 * Math.max(r.qA, r.qC, 0.5), hat.qHat ? 1.6 * hat.qHat : 0);
    const qq = linspace(qmax / 400, qmax, 400);
    const yMax = 1.8 * p;
    const clip = v => (Number.isFinite(v) && v < 3 * yMax ? v : null);
    const wNow = [P.now.w1, w[1]];
    const traces = [
      U.line2(qq.map(q => [q, clip(FM.MC(w, q, s))]), th.red, 1.2, 'MC at the start'),
      U.line2(qq.map(q => [q, clip(FM.MC(r.wNew, q, s))]), th.red, 1.2, 'MC at the end', 'dot'),
      U.line2(qq.map(q => [q, clip(FM.MC(wNow, q, s))]), th.red, 3, 'MC now'),
      U.line2(qq.map(q => [q, clip(FM.AC(wNow, q, s))]), th.ink, 1.8, 'AC now')
    ];
    const annotations = [];
    if (r.qA > 0) traces.push(U.dot2([[r.qA, p]], th.muted, 'q* = S(w,p)', 9));
    if (r.qC > 0) traces.push(U.dot2([[r.qC, p]], th.muted, "S(w',p)", 9));
    if (P.now.q > 0) traces.push(U.dot2([[P.now.q, p]], th.red, 'output now', 12));
    if (r.qA > 0 && Math.abs(r.qA - r.qC) > 1e-6) {
      annotations.push({ x: r.qC, y: p, ax: r.qA, ay: p, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: th.red, text: '' });
      annotations.push({ x: (r.qA + r.qC) / 2, y: p, text: `${fmt(r.qA)} → ${fmt(r.qC)}`, showarrow: false, yanchor: 'bottom', yshift: 8, font: { size: 12, color: th.red } });
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
    $('capTri').innerHTML = tri ? `Lecture 4, (∗): by Shephard's lemma ${texStr(`\\partial MC/\\partial w_1=\\partial H^1/\\partial q=${fmt(tri.c.dHdq, 3)}`)}. A change of ${texStr(`w_1`)} by ${fmt(dw, 2)} shifts MC at ${texStr('q^\\ast')} by about ${fmt(tri.c.dHdq, 3)} × ${fmt(dw, 2)} = ${fmt(tri.shift, 3)} (the vertical side of the red triangle). MC has slope ${texStr(`C_{qq}=${fmt(tri.c.Cqq, 3)}`)}, so output changes by about ${fmt(tri.shift, 3)} / ${fmt(tri.c.Cqq, 3)} = ${fmt(tri.dq, 3)} (the horizontal side): ${texStr('\\frac{\\mathrm dq^\\ast}{\\mathrm dw_1}=\\left(-\\frac{1}{C_{qq}}\\right)\\frac{\\partial H^1}{\\partial q}')}. This is a first-order estimate; the actual change is ${fmt(Math.abs(r.qA - r.qC), 3)}.` : '';
    Plotly.react('plotB', traces, U.base2d(th, {
      xt: 'q', yt: 'p', x: { range: [0, qmax] }, y: { range: [0, yMax] }, annotations,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: p, y1: p, line: { color: th.muted, width: 1.5, dash: 'dash' } }]
    }), U.PLOT_CONFIG);
  }

  // ---------- the table ----------

  function renderTable(P) {
    const { s, w, r, now } = P, f = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3);
    const sub = now.substitution, sc = now.scale, tot = [sub[0] + sc[0], sub[1] + sc[1]];
    $('table').innerHTML =
      `<thead><tr><th>so far</th><th>input 1</th><th>input 2</th></tr></thead><tbody>` +
      `<tr class="row-sub"><th>substitution</th><td>${f(sub[0])}</td><td>${f(sub[1])}</td></tr>` +
      `<tr class="row-scale"><th>scale</th><td>${f(sc[0])}</td><td>${f(sc[1])}</td></tr>` +
      `<tr class="row-total"><th>total</th><td>${f(tot[0])}</td><td>${f(tot[1])}</td></tr>` +
      (state.twostep ? `<tr class="row-head"><th colspan="3">two-step bookkeeping, whole change</th></tr>` +
        `<tr class="row-sub"><th>${texStr('B-A')}</th><td>${f(r.substitution[0])}</td><td>${f(r.substitution[1])}</td></tr>` +
        `<tr class="row-scale"><th>${texStr('C-B')}</th><td>${f(r.scale[0])}</td><td>${f(r.scale[1])}</td></tr>` +
        `<tr class="row-total"><th>${texStr('C-A')}</th><td>${f(r.total[0])}</td><td>${f(r.total[1])}</td></tr>` : '') +
      `</tbody>`;
    const box = $('marginal-box');
    if (state.marginal) {
      const tie = FM.unitDemand(w, s).kind === 'multiple';
      if (r.qA === 0 || tie) box.innerHTML = '<p class="note">The derivative is not defined here (no production, or the linear technology at its switch price).</p>';
      else {
        const d = SS.decomposeDerivative(w, state.p, s), e = d.input1, ok = Math.abs(e.substitution + e.scale - e.total) <= 1e-4 * Math.max(1, Math.abs(e.total));
        box.innerHTML = texStr(`\\frac{\\partial D^1}{\\partial w_1}=${f(e.total)}=\\color{#4a90e2}{${f(e.substitution)}}\\color{#d0021b}{${e.scale < 0 ? '' : '+'}${f(e.scale)}}`) +
          ` <span class="${ok ? 'ok-mark' : 'no-mark'}">${ok ? '✓ sum = total' : '✗'}</span>` +
          (() => { const c = SS.scaleClosedForm(w, state.p, s), ok2 = Math.abs(c.scale - e.scale) <= 1e-4 * Math.max(1, Math.abs(e.scale));
            return `<p class="note">Lecture 4, (∗∗): scale effect ${texStr(`\\color{#d0021b}{-\\tfrac{1}{C_{qq}}\\big(\\tfrac{\\partial H^1}{\\partial q}\\big)^2=-\\tfrac{1}{${f(c.Cqq)}}(${f(c.dHdq)})^2=${f(c.scale)}}`)} <span class="${ok2 ? 'ok-mark' : 'no-mark'}">${ok2 ? '✓ = finite difference' : '✗'}</span></p>`; })() +
          `<p class="note">${texStr(`\\partial S/\\partial w_1=${f(d.dSdw1)}`)}, ${texStr(`\\partial H^1/\\partial q=${f(e.dHdq)}`)}. Cross effect: ${texStr(`\\partial D^2/\\partial w_1=${f(d.input2.total)}=\\color{#4a90e2}{${f(d.input2.substitution)}}\\color{#d0021b}{${d.input2.scale < 0 ? '' : '+'}${f(d.input2.scale)}}`)}</p>`;
      }
    } else box.innerHTML = '';
    $('readouts').innerHTML = [
      ['w_1', `${fmt(r.w[0])} → ${fmt(now.w1)}${state.t < 1 ? ` (→ ${fmt(r.wNew[0])})` : ''}`],
      ['q^\\ast', `${fmt(r.qA, 3)} → ${fmt(now.q, 3)}`],
      ['\\Pi(w,p)', `${fmt(r.profitA, 3)} → ${fmt(r.profitC, 3)} at the end`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ces: state.tech === 'ces', ushape: state.profile === 'ushape', homog: state.profile === 'homog' });
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
    // "w1 after" ranges from half to three times "w1 before".
    ctrls.w1n.setRange(Number((0.5 * state.w1).toFixed(2)), Number((3 * state.w1).toFixed(2)));
    if (state.w1n < ctrls.w1n.min || state.w1n > ctrls.w1n.max) { state.w1n = U.clampTo(state.w1n, ctrls.w1n.min, ctrls.w1n.max); ctrls.w1n.sync(); }
    const P = solve(), th = U.theme(), f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    guard('input-space plot', () => drawMain(th, P));
    guard('cost plot', () => drawCosts(th, P));
    guard('table', () => renderTable(P));
  }

  // Raise (or lower) w1 smoothly: t runs from 0 to 1 and everything moves at the same time.
  function animate() {
    if (state.playing) return;
    const start = performance.now(), DURATION = 5000;
    state.playing = true; $('animate').disabled = true;
    const step = now => {
      state.t = Math.min(1, (now - start) / DURATION);
      ctrls.t.sync();
      guard('animation', render);
      if (state.t < 1) requestAnimationFrame(step);
      else { state.playing = false; $('animate').disabled = false; }
    };
    requestAnimationFrame(step);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    $('marginal').addEventListener('change', e => { state.marginal = e.target.checked; schedule(); });
    $('twostep').addEventListener('change', e => { state.twostep = e.target.checked; schedule(); });
    $('animate').addEventListener('click', animate);
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (SS || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
