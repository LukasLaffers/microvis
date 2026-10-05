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
    p: 8, w2: 1, w1: 1, w1n: 1.5, marginal: false, anim: null
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: 1, k: state.k, a: state.a, m: state.m });

  let ctrls = {};
  const schedule = U.scheduler(render);

  const solve = () => {
    const s = tech(), w = [state.w1, state.w2], r = SS.decompose(w, state.p, s, state.w1n - state.w1);
    return { s, w, r };
  };

  // Animation: 0-0.5 substitution (A to B), 0.5-1 scale (B to C).
  const fSub = () => state.anim === null ? 1 : Math.min(1, state.anim / 0.5);
  const fScale = () => state.anim === null ? 1 : Math.max(0, (state.anim - 0.5) / 0.5);

  // ---------- main plot ----------

  function drawMain(th, P) {
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

    // Bars on the z1 axis: (B1 - A1) + (C1 - B1) = (C1 - A1).
    if (state.anim === null) {
      const h = yr[1] - yr[0], y1 = yr[0] + 0.03 * h, y2 = yr[0] + 0.075 * h;
      shapes.push({ type: 'line', x0: A[0], x1: B[0], y0: y1, y1: y1, line: { color: th.blue, width: 5 } });
      shapes.push({ type: 'line', x0: B[0], x1: C[0], y0: y1, y1: y1, line: { color: th.red, width: 5 } });
      shapes.push({ type: 'line', x0: A[0], x1: C[0], y0: y2, y1: y2, line: { color: th.ink, width: 2 } });
      annotations.push({ x: (A[0] + C[0]) / 2, y: y2, text: `total ${fmt(C[0] - A[0], 3)}`, showarrow: false, yanchor: 'bottom', font: { size: 11, color: th.ink } });
    }

    Plotly.react('plot', traces, U.base2d(th, {
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

  // ---------- why output falls ----------

  function drawCosts(th, P) {
    const { s, w, r } = P, p = state.p, hat = FM.minAC(r.wNew, s);
    const qmax = Math.max(1.6 * Math.max(r.qA, r.qC, 0.5), hat.qHat ? 1.6 * hat.qHat : 0);
    const qq = linspace(qmax / 400, qmax, 400);
    const yMax = 1.8 * p;
    const clip = v => (Number.isFinite(v) && v < 3 * yMax ? v : null);
    const traces = [
      U.line2(qq.map(q => [q, clip(FM.MC(w, q, s))]), th.red, 1.2, 'MC before'),
      U.line2(qq.map(q => [q, clip(FM.MC(r.wNew, q, s))]), th.red, 3, 'MC after'),
      U.line2(qq.map(q => [q, clip(FM.AC(r.wNew, q, s))]), th.ink, 1.8, 'AC after')
    ];
    const annotations = [];
    if (r.qA > 0) traces.push(U.dot2([[r.qA, p]], th.muted, 'q* = S(w,p)', 10));
    if (r.qC > 0) traces.push(U.dot2([[r.qC, p]], th.red, "S(w',p)", 11));
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
    const { s, w, r } = P, f = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3);
    $('table').innerHTML =
      `<thead><tr><th></th><th>input 1</th><th>input 2</th></tr></thead><tbody>` +
      `<tr class="row-sub"><th>substitution ${texStr('B-A')}</th><td>${f(r.substitution[0])}</td><td>${f(r.substitution[1])}</td></tr>` +
      `<tr class="row-scale"><th>scale ${texStr('C-B')}</th><td>${f(r.scale[0])}</td><td>${f(r.scale[1])}</td></tr>` +
      `<tr class="row-total"><th>total ${texStr('C-A')}</th><td>${f(r.total[0])}</td><td>${f(r.total[1])}</td></tr></tbody>`;
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
      ['q^\\ast', `${fmt(r.qA, 3)} → ${fmt(r.qC, 3)}`],
      ['\\Pi(w,p)', `${fmt(r.profitA, 3)} → ${fmt(r.profitC, 3)}`],
      ['w_1', `${fmt(r.w[0])} → ${fmt(r.wNew[0])}`]
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

  function animate() {
    const start = performance.now(), DURATION = 3000;
    $('animate').disabled = true;
    const step = now => {
      state.anim = Math.min(1, (now - start) / DURATION);
      guard('animation', () => drawMain(U.theme(), solve()));
      if (state.anim < 1) requestAnimationFrame(step);
      else { state.anim = null; render(); $('animate').disabled = false; $('animate').textContent = '↻ Show the effects again'; }
    };
    requestAnimationFrame(step);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    $('marginal').addEventListener('change', e => { state.marginal = e.target.checked; schedule(); });
    $('animate').addEventListener('click', animate);
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (SS || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
