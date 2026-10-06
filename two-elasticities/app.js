/*
 * Two Elasticities: interface and plotting (lecture 1).
 */
(function () {
  'use strict';

  const TM = window.TechModel, SM = window.ScaleSubModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { ...SM.PRESETS.vary, tr: 'none', h: 'square', b1: 0.5, b2: 1.2, z1: 2, z2: 2.5, shade: 'sigma', R: 6 };
  let ctrls = {}, lastR = null;
  const schedule = U.scheduler(render);
  const f2 = v => fmt(v, 2), f3 = v => fmt(v, 3), n = U.num;
  const zbar = () => [state.z1, state.z2];
  const H_TEX = { square: 'h(q)=q^2', sqrt: 'h(q)=\\sqrt q', log: 'h(q)=\\ln(1+q)' };
  const sTex = v => (v === Infinity || v > 1e6 ? '\\infty' : f3(v));

  // ---------- formula ----------

  // General form in symbols, then the current values (as in the other tools).
  function formula() {
    const ces = '\\big(\\delta z_1^{\\rho}+(1-\\delta)z_2^{\\rho}\\big)^{1/\\rho}';
    const x = {
      cd: 'x=z_1^{\\delta}z_2^{1-\\delta}',
      ces: `x=${ces}`,
      mix: `\\begin{aligned}x=\\ &m${ces}\\\\ &+(1-m)\\big(\\delta z_1+(1-\\delta)z_2\\big)\\end{aligned}`
    }[state.g];
    const F = state.F === 'power' ? '\\phi(z)=x^{k}' : '\\phi(z)=\\frac{s^2x^2}{s^2+x^2}';
    const vals = [state.F === 'power' ? `k=${n(state.k)}` : `s=${n(state.s)}`, `\\delta=${n(state.delta)}`];
    if (state.g !== 'cd') vals.push(`\\rho=${n(state.rho)}`);
    if (state.g === 'mix') vals.push(`m=${n(state.m)}`);
    const T = state.tr === 'B' ? `\\\\ \\phi_B(z)=h\\big(\\phi(z)\\big),\\ ${H_TEX[state.h]}`
      : state.tr === 'C' ? `\\\\ \\phi_C(z)=\\phi\\big(f(z_1),g(z_2)\\big)\\\\ f(z_1)=z_1^{b_1},\\ g(z_2)=z_2^{b_2}\\\\ b_1=${n(state.b1)},\\ b_2=${n(state.b2)}` : '';
    tex($('formula'), `\\begin{gathered}${F}\\\\ ${x}\\\\ ${vals.join(',\\ ')}${T}\\end{gathered}`, true);
  }

  // ---------- the input space ----------

  function shadeTrace(th, S) {
    if (state.shade === 'none') return null;
    const G = SM.grid(S, state.R, 72, state.shade), isE = state.shade === 'e';
    // e: around 1 on a linear scale; sigma: around 1 on a log2 scale
    const z = G.z.map(row => row.map(v => (isE ? U.clampTo(v, 0, 2) : U.clampTo(Math.log2(v), -2, 2))));
    const lo = isE ? th.dec : th.accent4, hi = isE ? th.inc : '#2a9d8f';
    const tickvals = isE ? [0, 0.5, 1, 1.5, 2] : [-2, -1, 0, 1, 2], ticktext = isE ? ['0', '0.5', '1', '1.5', '2'] : ['¼', '½', '1', '2', '4'];
    return {
      type: 'heatmap', x: G.xs, y: G.xs, z, zmin: isE ? 0 : -2, zmax: 2, zmid: isE ? 1 : 0, zsmooth: 'best', opacity: 0.55,
      colorscale: [[0, lo], [0.5, th.panel], [1, hi]], hoverinfo: 'skip',
      colorbar: { title: { text: isE ? 'e(z)' : 'σ(z)', side: 'right', font: { color: th.ink } }, tickvals, ticktext, thickness: 10, len: 0.6, x: 1.01, tickfont: { color: th.muted }, outlinewidth: 0 }
    };
  }

  function drawMain(th, A, T) {
    const R = state.R, z = zbar(), q = TM.phi(z, T), traces = [], annotations = [];
    const sh = shadeTrace(th, T);
    if (sh) traces.push(sh);
    const thin = th.dark ? 'rgba(255,255,255,0.35)' : 'rgba(29,36,51,0.3)';
    for (const a of [0.45, 0.7, 1.4, 1.9, 2.6]) {
      const lev = TM.phi([a * z[0], a * z[1]], T);
      if (lev < TM.maxOutput(T)) traces.push(U.line2(TM.isoquant(lev, T, R, 220), thin, 1.2, ''));
    }
    if (state.tr !== 'none') traces.push(U.line2(TM.isoquant(TM.phi(z, A), A, R, 220), th.muted, 2, 'isoquant of φ through z̄', 'dash'));
    traces.push(U.line2(TM.isoquant(q, T, R, 300), th.blue, 4, 'isoquant through z̄'));
    const s = R / Math.max(z[0], z[1]);
    traces.push(U.line2([[0, 0], [s * z[0], s * z[1]]], th.red, 4, 'ray through z̄'));
    traces.push(U.dot2([z], th.ink, 'z̄', 13));
    annotations.push({ x: z[0], y: z[1], text: 'z̄', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 7, yshift: 3, font: { size: 15, color: th.ink } });
    const draw = lastR === R ? Plotly.react : Plotly.newPlot;
    lastR = R;
    const layout = U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>', x: { range: [0, R], constrain: 'domain' }, y: { range: [0, R], scaleanchor: 'x', constrain: 'domain' },
      annotations, margin: { l: 44, r: 10, t: 8, b: 42 }
    });
    draw('plot', traces, layout, { ...U.PLOT_CONFIG, displayModeBar: false });
    const shade = state.shade === 'e'
      ? `Shading: ${texStr('e(z)')}, <span class="c-inc">green above 1</span> (increasing returns) and <span class="c-dec">brown below 1</span> (decreasing returns).`
      : state.shade === 'sigma' ? `Shading: ${texStr('\\sigma(z)')}, <span class="c-teal">teal above 1</span> (easy substitution) and <span class="c-accent-4">purple below 1</span> (hard substitution).` : '';
    const homoth = TM.isHomothetic(T);
    $('cap').innerHTML = `The <span class="c-l2-red"><span class="key"></span>ray</span> and the <span class="c-l2-blue"><span class="key"></span>isoquant</span> through ${texStr('\\bar z')}; thin lines are other isoquants${state.tr !== 'none' ? `, the <span class="c-muted"><span class="key dash"></span>dashed one</span> is the isoquant of the original ${texStr('\\phi')} through ${texStr('\\bar z')}${state.tr === 'B' ? ' (hidden under the blue one: h does not move isoquants)' : ''}` : ''}. ${shade} ` +
      (state.shade === 'none' ? '' : homoth
        ? (state.shade === 'e' ? 'For a homothetic technology the bands of equal e follow the isoquants: e depends on the output level only.' : 'For a homothetic technology σ is the same along every ray: it depends on the input mix only.')
        : 'This technology is not homothetic, so the shading follows neither the rays nor the isoquants.') + ' Click or drag to move the point.';
  }

  // ---------- e along the ray, sigma along the isoquant ----------

  function drawSides(th, A, T) {
    const z = zbar(), amax = state.R / Math.max(z[0], z[1]) * 1.15, al = U.linspace(0.05, amax, 160);
    const eT = SM.eAlongRay(z, T, al), traces = [U.line2([[0, 1], [amax, 1]], th.muted, 1.2, 'e = 1: constant returns', 'dot')];
    if (state.tr !== 'none') traces.push(U.line2(SM.eAlongRay(z, A, al), th.muted, 2, 'e of φ', 'dash'));
    traces.push(U.line2(eT, th.red, 3, 'e(αz̄)'));
    const e0 = TM.scaleElasticity(z, T);
    traces.push(U.dot2([[1, e0]], th.red, 'z̄', 10));
    const ys = eT.map(p => p[1]).concat(state.tr !== 'none' ? SM.eAlongRay(z, A, al).map(p => p[1]) : []);
    const top = Math.max(1.4, ...ys) * 1.1, bot = Math.min(0.6, ...ys) - 0.1;
    Plotly.react('plotE', traces, U.base2d(th, {
      xt: 'α (the point αz̄ on the ray)', yt: 'e', x: { range: [0, amax] }, y: { range: [Math.max(0, bot), top] },
      annotations: [{ xref: 'paper', x: 0.99, y: 1, yshift: 9, text: 'increasing returns ↑', showarrow: false, xanchor: 'right', font: { size: 11, color: th.muted } },
        { xref: 'paper', x: 0.99, y: 1, yshift: -9, text: 'decreasing returns ↓', showarrow: false, xanchor: 'right', font: { size: 11, color: th.muted } }],
      margin: { l: 44, r: 10, t: 6, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const flatE = Math.max(...eT.map(p => p[1])) - Math.min(...eT.map(p => p[1])) < 1e-6;
    $('capE').innerHTML = flatE
      ? `Flat: ${texStr(`e=${f3(e0)}`)} at every point of the ray (and everywhere else): the technology is homogeneous of degree ${f3(e0)}.`
      : `${texStr('e')} changes as you scale ${texStr('\\bar z')} up or down: returns to scale are a local property. At ${texStr('\\bar z')}: ${texStr(`e(\\bar z)=${f3(e0)}`)}.`;

    const rs = U.logspace(0.04, 25, 160), sT = SM.sigmaAlongIsoquant(z, T, rs), r0 = z[1] / z[0], s0 = TM.sigma(z, T);
    const tS = [U.line2([[0.04, 1], [25, 1]], th.muted, 1.2, 'σ = 1: Cobb-Douglas', 'dot')];
    let sAll = sT.map(p => p.sigma);
    if (state.tr !== 'none') { const sA = SM.sigmaAlongIsoquant(z, A, rs); tS.push(U.line2(sA.map(p => [p.r, p.sigma]), th.muted, 2, 'σ of φ', 'dash')); sAll = sAll.concat(sA.map(p => p.sigma)); }
    tS.push(U.line2(sT.map(p => [p.r, p.sigma]), th.blue, 3, 'σ along the isoquant'));
    tS.push(U.dot2([[r0, s0]], th.blue, 'z̄', 10));
    const sTop = Math.min(6, Math.max(1.5, ...sAll.filter(Number.isFinite)) * 1.1);
    Plotly.react('plotS', tS, U.base2d(th, {
      xt: 'z<sub>2</sub>/z<sub>1</sub> on the isoquant (log scale)', yt: 'σ',
      x: { type: 'log', range: [Math.log10(0.04), Math.log10(25)], tickvals: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20], ticktext: ['0.05', '0.1', '0.2', '0.5', '1', '2', '5', '10', '20'] },
      y: { range: [0, sTop] }, margin: { l: 44, r: 10, t: 6, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const flatS = Math.max(...sT.map(p => p.sigma)) - Math.min(...sT.map(p => p.sigma)) < 1e-6;
    $('capS').innerHTML = flatS
      ? `Flat: ${texStr(`\\sigma=${sTex(s0)}`)} all along the isoquant${TM.isHomothetic(T) ? ' (and, the technology being homothetic, everywhere)' : ''}.`
      : `${texStr('\\sigma')} changes as you move along the isoquant: substitution is easier for some input mixes than for others. At ${texStr('\\bar z')}: ${texStr(`\\sigma(\\bar z)=${sTex(s0)}`)}.`;
  }

  // ---------- at z-bar ----------

  function renderMeaning(A, T) {
    const z = zbar(), e = TM.scaleElasticity(z, T), s = TM.sigma(z, T);
    const pct = (TM.phi([1.01 * z[0], 1.01 * z[1]], T) / TM.phi(z, T) - 1) * 100;
    const ret = e > 1 + 1e-9 ? 'increasing' : e < 1 - 1e-9 ? 'decreasing' : 'constant';
    // a 1% move along the isoquant: z2/z1 up 1%, the MRTS changes by about 1/sigma %
    const q = TM.phi(z, T), r = z[1] / z[0], p1 = TM.pointOnRay(r * 1.01, q, T);
    const dm = p1 ? (TM.mrts(p1, T) / TM.mrts(z, T) - 1) * 100 : NaN;
    let html = `<p class="sentence"><span class="c-l2-red">${texStr(`e(\\bar z)=${f3(e)}`)}</span>: 1% more of every input gives about ${f3(e)}% more output (exactly ${f3(pct)}% here), so returns to scale are locally ${ret}.</p>` +
      `<p class="sentence"><span class="c-l2-blue">${texStr(`\\sigma(\\bar z)=${sTex(s)}`)}</span>: moving along the isoquant so that ${texStr('z_2/z_1')} rises by 1%, the MRTS rises by about ${Number.isFinite(dm) ? f3(dm) : '—'}% ${texStr(`\\approx 1/\\sigma`)}. ${s < 1 ? 'σ < 1: the inputs are hard to substitute; the isoquant bends sharply.' : s > 1 + 1e-9 ? 'σ > 1: the inputs substitute easily; the isoquant bends gently.' : 'σ = 1: the Cobb-Douglas benchmark.'}</p>`;
    if (state.tr !== 'none') {
      const mA = TM.mrts(z, A), mT = TM.mrts(z, T), sA = TM.sigma(z, A), eA = TM.scaleElasticity(z, A);
      const same = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a));
      const mark = (a, b) => (same(a, b) ? '<span class="ok-mark">same</span>' : '<span class="no-mark">changed</span>');
      const L = state.tr === 'B' ? 'B' : 'C';
      html += `<table class="cmp"><thead><tr><th></th><th>${texStr('MRTS_{21}')}</th><th>${texStr('\\sigma')}</th><th>${texStr('e')}</th></tr></thead><tbody>` +
        `<tr><td>${texStr('\\phi')}</td><td>${f3(mA)}</td><td>${sTex(sA)}</td><td>${f3(eA)}</td></tr>` +
        `<tr><td>${texStr(`\\phi_${L}`)}</td><td>${f3(mT)}</td><td>${sTex(s)}</td><td>${f3(e)}</td></tr>` +
        `<tr><td></td><td>${mark(mA, mT)}</td><td>${mark(sA, s)}</td><td>${mark(eA, e)}</td></tr></tbody></table>`;
      html += state.tr === 'B'
        ? `<p class="sentence">${texStr("\\frac{\\phi_{B1}}{\\phi_{B2}}=\\frac{h'(\\phi)\\,\\phi_1}{h'(\\phi)\\,\\phi_2}=\\frac{\\phi_1}{\\phi_2}")}: ${texStr("h'")} cancels, so the isoquants, the MRTS and ${texStr('\\sigma')} stay the same. Only the labels of the isoquants change, and with them ${texStr('e')}: ${texStr('e_B=')} (elasticity of ${texStr('h')}) ${texStr('\\times\\, e')}.</p>`
        : `<p class="sentence">${texStr("\\frac{\\phi_{C1}}{\\phi_{C2}}=\\frac{\\phi_1(f,g)\\,f'(z_1)}{\\phi_2(f,g)\\,g'(z_2)}")}: the input transformations do not cancel, so the isoquants move and both ${texStr('\\sigma')} and ${texStr('e')} change.${state.b1 === state.b2 ? ` With ${texStr('b_1=b_2')} the result is still homothetic${state.g === 'cd' ? ', and with a Cobb-Douglas shape σ stays 1' : ''}.` : ''}</p>`;
    }
    $('meaning').innerHTML = html;
    $('keynums').innerHTML = `<span class="kn e">${texStr(`e(\\bar z)=${f3(e)}`)}</span><span class="kn s">${texStr(`\\sigma(\\bar z)=${sTex(s)}`)}</span>`;
  }

  function render() {
    const { A, T } = SM.techs(state);
    U.applyVisibility({ sshape: state.F === 'sshape', power: state.F === 'power', rho: state.g !== 'cd', mix: state.g === 'mix', trB: state.tr === 'B', trC: state.tr === 'C' });
    document.querySelectorAll('[data-tr]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tr === state.tr)));
    document.querySelectorAll('[data-shade]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.shade === state.shade)));
    $('F').value = state.F; $('g').value = state.g; $('h').value = state.h;
    $('tr-note').innerHTML = { none: 'The technology as it is.', B: 'Transform the output: the same isoquants with new labels.', C: 'Transform each input before it enters φ.' }[state.tr];
    formula();
    const th = U.theme();
    guard('input space', () => drawMain(th, A, T));
    guard('side plots', () => drawSides(th, A, T));
    guard('numbers', () => renderMeaning(A, T));
  }

  function setupDrag() {
    const gd = $('plot');
    let dragging = false;
    const move = d => { ctrls.z1.set(U.clampTo(d[0], 0.2, state.R)); ctrls.z2.set(U.clampTo(d[1], 0.2, state.R)); };
    gd.addEventListener('pointerdown', ev => {
      const d = U.eventToData(gd, ev);
      if (!d) return;
      dragging = true; move(d);
      if (gd.setPointerCapture) gd.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }, true);
    gd.addEventListener('pointermove', ev => { if (dragging) { const d = U.eventToData(gd, ev); if (d) move(d); } }, true);
    const stop = () => { dragging = false; };
    gd.addEventListener('pointerup', stop, true);
    gd.addEventListener('pointercancel', stop, true);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: (k, v) => (k === 'rho' && Math.abs(v) < 0.05 ? (v < 0 ? -0.05 : 0.05) : v), onChange: schedule });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const P = SM.PRESETS[b.dataset.preset];
      state.F = P.F; state.g = P.g; state.tr = 'none';
      for (const k of ['s', 'k', 'delta', 'rho', 'm']) ctrls[k].setExact(P[k]);
      schedule();
    }));
    $('F').addEventListener('change', e => { state.F = e.target.value; schedule(); });
    $('g').addEventListener('change', e => { state.g = e.target.value; schedule(); });
    $('h').addEventListener('change', e => { state.h = e.target.value; schedule(); });
    document.querySelectorAll('[data-tr]').forEach(b => b.addEventListener('click', () => { state.tr = b.dataset.tr; schedule(); }));
    document.querySelectorAll('[data-shade]').forEach(b => b.addEventListener('click', () => { state.shade = b.dataset.shade; schedule(); }));
    setupDrag();
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(TM && SM, 'model.js')) guard('page', init);
})();
