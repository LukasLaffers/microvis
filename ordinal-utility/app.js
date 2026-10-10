/*
 * Utility Is Ordinal: interface and plotting (lecture 5, sections 2.4-2.6).
 */
(function () {
  'use strict';

  const OM = window.OrdinalModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { type: 'cobb', alpha: 0.5, rho: -1, t: 'log', a1: 3, a2: 6, b1: 6, b2: 4, reveal: false };
  const L = 10, LO = 0.25;
  const schedule = U.scheduler(render);
  const pref = () => ({ type: state.type, alpha: state.alpha, rho: state.rho });
  const f3 = v => fmt(v, 3);

  const FORMULA = {
    cobb: P => `U(x)=x_1^{${U.num(P.alpha)}}\\,x_2^{${U.num(1 - P.alpha)}}`,
    ces: P => `\\begin{gathered}U(x)=\\big(\\alpha x_1^{\\rho}+(1-\\alpha)x_2^{\\rho}\\big)^{1/\\rho}\\\\ \\alpha=${U.num(P.alpha)},\\ \\rho=${U.num(P.rho)}\\end{gathered}`,
    subs: P => `U(x)=${U.num(P.alpha)}\\,x_1+${U.num(1 - P.alpha)}\\,x_2`,
    concave: P => `U(x)=${U.num(P.alpha)}\\,x_1^2+${U.num(1 - P.alpha)}\\,x_2^2`
  };

  // ---------- the two surfaces ----------

  function draw3d(th) {
    const P = pref(), T = OM.TRANSFORMS[state.t], g = U.linspace(LO, L, 46);
    const Uz = g.map(b => g.map(a => OM.utility([a, b], P))), Vz = Uz.map(r => r.map(T.f));
    const xo = [state.a1, state.a2], xp = [state.b1, state.b2], uo = OM.utility(xo, P);
    const ic = OM.indifferenceCurve(uo, P, L, 160).filter(([x1, x2]) => x1 >= LO && x2 !== null && x2 >= LO && x2 <= L);
    const range = z => { const v = z.flat().filter(Number.isFinite); return [Math.min(...v), Math.max(...v)]; };
    const rU = range(Uz), rV = range(Vz);
    const surf = (z, r, scene) => ({ type: 'surface', x: g, y: g, z, scene, colorscale: U.SURFACE_SCALE, cmin: r[0], cmax: r[1], showscale: false, opacity: 0.92, hoverinfo: 'skip' });
    // The same few indifference curves on both surfaces: at heights u_k on the left and f(u_k) on the right.
    const levels = [1.5, 3, 4.5, 6, 7.5, 9].map(s => OM.utility([s, s], P));
    const contour = (u, h, scene) => {
      const c = OM.indifferenceCurve(u, P, L, 120).map(([x1, x2]) => (x1 >= LO && x2 !== null && x2 >= LO && x2 <= L ? [x1, x2] : [null, null]));
      return { type: 'scatter3d', mode: 'lines', x: c.map(p => p[0]), y: c.map(p => p[1]), z: c.map(p => (p[0] === null ? null : h)), scene, line: { color: 'rgba(0,0,0,0.45)', width: 2 }, hoverinfo: 'skip', connectgaps: false };
    };
    const curve = (h, scene, floor) => [
      { type: 'scatter3d', mode: 'lines', x: ic.map(p => p[0]), y: ic.map(p => p[1]), z: ic.map(() => h), scene, line: { color: th.dark ? '#ffffff' : '#111111', width: 7 }, hoverinfo: 'skip', name: 'indifference curve' },
      { type: 'scatter3d', mode: 'lines', x: ic.map(p => p[0]), y: ic.map(p => p[1]), z: ic.map(() => floor), scene, line: { color: th.ink, width: 4, dash: 'dash' }, hoverinfo: 'skip', name: 'projection' }
    ];
    const pts = (f, scene) => ({ type: 'scatter3d', mode: 'markers+text', x: [xo[0], xp[0]], y: [xo[1], xp[1]], z: [f(OM.utility(xo, P)), f(OM.utility(xp, P))], text: ['x°', "x'"], textposition: 'top center', scene, marker: { size: 8, color: [th.ink, th.accent4 || th.red], line: { color: th.dark ? '#000000' : '#ffffff', width: 2 } }, textfont: { color: th.ink, size: 14 }, hoverinfo: 'skip' });
    const traces = [surf(Uz, rU, 'scene'), ...levels.map(u => contour(u, u, 'scene')), ...curve(uo, 'scene', rU[0]), pts(u => u, 'scene'),
      surf(Vz, rV, 'scene2'), ...levels.map(u => contour(u, T.f(u), 'scene2')), ...curve(T.f(uo), 'scene2', rV[0]), pts(T.f, 'scene2')];
    const axis = (title, r) => ({ title: { text: title, font: { color: th.ink } }, range: r, color: th.muted, gridcolor: th.grid, backgroundcolor: 'rgba(0,0,0,0)', showspikes: false, tickfont: { color: th.muted } });
    const scene = (dom, zt, r, eye = { x: -1.7, y: -1.7, z: 1.15 }) => ({ domain: { x: dom, y: [0, 1] }, aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.75 }, camera: { eye }, xaxis: axis('x₁', [0, L]), yaxis: axis('x₂', [0, L]), zaxis: axis(zt, r), uirevision: eye.x > 0 ? 'turned' : 'keep' });
    Plotly.react('plot', traces, {
      margin: { l: 0, r: 0, t: 26, b: 0 }, paper_bgcolor: 'rgba(0,0,0,0)', font: { color: th.ink, family: th.font, size: 12 }, showlegend: false, uirevision: 'keep',
      // a decreasing f turns the surface round: look at it from the opposite corner, so that it rises away from the viewer
      // a gap between the two scenes keeps the x1 title of the left one apart from the x2 title of the right one
      scene: scene([0, 0.47], 'U', rU), scene2: scene([0.53, 1], 'V', rV, T.increasing === false ? { x: 1.7, y: 1.7, z: 1.15 } : undefined),
      annotations: [
        { xref: 'paper', yref: 'paper', x: 0.235, y: 1.03, text: 'U(x<sub>1</sub>, x<sub>2</sub>)', showarrow: false, font: { size: 14, color: th.ink } },
        { xref: 'paper', yref: 'paper', x: 0.765, y: 1.03, text: `V = ${$('transform').selectedOptions[0].textContent.replace('V = ', '')}`, showarrow: false, font: { size: 14, color: th.ink } }
      ]
    }, U.PLOT_CONFIG);
    $('cap').innerHTML = `The black curve is the indifference curve through ${texStr('x^\\circ')}, at height ${texStr(`U=${f3(uo)}`)} on the left and ${texStr(`V=${f3(T.f(uo))}`)} on the right; its shadow on the floor is the same curve in both. ${T.increasing ? 'The thin curves are the same few indifference curves on both surfaces; only their heights differ. Drag a surface to look from above.' : 'With a decreasing f the curves are still the same, but "better" and "worse" swap: V ranks every pair the wrong way round.'}`;
    return { P, T, xo, xp };
  }

  function renderRanking({ P, T, xo, xp }) {
    const uo = OM.utility(xo, P), up = OM.utility(xp, P), vo = T.f(uo), vp = T.f(up);
    const rel = d => Math.abs(d) < 1e-12 ? '\\sim' : d > 0 ? '\\succ' : '\\prec';
    $('rank').innerHTML = [
      ['U(x^\\circ),\\ U(x\')', `${f3(uo)}, ${f3(up)} ⇒ ${texStr(`x'\\ ${rel(up - uo)}\\ x^\\circ`)}`],
      ['V(x^\\circ),\\ V(x\')', `${f3(vo)}, ${f3(vp)} ⇒ ${texStr(`x'\\ ${rel(vp - vo)}\\ x^\\circ`)}`],
      ['V(x\')-V(x^\\circ)', `${f3(vp - vo)} <span class="c-muted">vs ${texStr(`U(x')-U(x^\\circ)=${f3(up - uo)}`)}</span>`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const same = Math.sign(vp - vo) === Math.sign(up - uo);
    $('rankCheck').innerHTML = `<li><span class="mark ${same ? 'ok' : 'no'}">${same ? '✓' : '✗'}</span><span>${same ? `Same ranking. The differences in utility are not comparable (${f3(up - uo)} vs ${f3(vp - vo)}): only the order matters.` : `Reversed: ${texStr("f'<0")}, so ${texStr('V')} does not represent the same preferences.`}</span></li>`;
  }

  // ---------- indifference curve, gradient, tangent; U along the tangent ----------

  function drawTheorem(th, { P, xo }) {
    const uo = OM.utility(xo, P), g = OM.gradient(xo, P), z = OM.tangent(xo, P), c = OM.curvature(xo, P), mrs = OM.mrs21(xo, P);
    const ic = OM.indifferenceCurve(uo, P, L, 300).map(([x1, x2]) => [x1, x2 !== null && x2 <= L * 1.5 ? x2 : null]);
    const n = Math.hypot(g[0], g[1]), arrow = [xo[0] + 1.6 * g[0] / n, xo[1] + 1.6 * g[1] / n];
    const traces = [
      U.line2(ic, th.ink, 2.5, 'indifference curve u(x°)'),
      U.line2([[xo[0] - 8 * z[0], xo[1] - 8 * z[1]], [xo[0] + 8 * z[0], xo[1] + 8 * z[1]]], th.muted, 1.5, 'tangent line', 'dash'),
      U.dot2([[xo[0] + 1.5 * z[0], xo[1] + 1.5 * z[1]]], th.muted, "x' on the tangent", 7),
      U.dot2([xo], th.ink, 'x°', 10)
    ];
    const annotations = [
      { x: arrow[0], y: arrow[1], ax: xo[0], ay: xo[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: th.blue, text: '' },
      { x: arrow[0], y: arrow[1], text: '∇U(x°)', showarrow: false, xanchor: 'left', xshift: 4, font: { size: 12, color: th.blue } },
      { x: xo[0], y: xo[1], text: 'x°', showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -6, font: { size: 13, color: th.ink } }
    ];
    Plotly.react('plotB', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, L], constrain: 'domain' }, y: { range: [0, L], scaleanchor: 'x', constrain: 'domain' }, annotations, margin: { l: 40, r: 8, t: 6, b: 40 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const prof = OM.alongTangent(xo, P, U.linspace(-3, 3, 121)).filter(([t]) => { const y = [xo[0] + t * z[0], xo[1] + t * z[1]]; return y[0] > 0 && y[1] > 0; });
    Plotly.react('plotC', [U.line2(prof, th.ink, 2, 'U along the tangent'), U.dot2([[0, uo]], th.ink, 'x°', 8)], U.base2d(th, {
      xt: 'distance t along the tangent', yt: 'U(x° + t z)',
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: uo, y1: uo, line: { color: th.muted, width: 1, dash: 'dot' } }], margin: { l: 56, r: 8, t: 6, b: 40 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const qc = P.type !== 'concave';
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    $('thm').innerHTML = [
      item(c <= 1e-6, `(∗) ${texStr(`z^t\\frac{\\partial^2U}{\\partial x\\partial x^t}z=${fmt(Math.abs(c) < 1e-7 ? 0 : c, 4)}`)} for the unit ${texStr('z')} with ${texStr('z^t\\nabla U=0')}. ${qc ? (P.type === 'subs' ? 'Zero: the indifference curve is the tangent line itself.' : 'Negative: moving along the tangent leads to lower indifference curves, as convex B(x) requires.') : 'Positive: along the tangent utility rises, so B(x°) is not convex and U is not quasi-concave.'}`),
      `<li><span class="mark na">·</span><span>${texStr(`MRS_{21}=\\frac{U_1}{U_2}=\\frac{${f3(g[0])}}{${f3(g[1])}}=${f3(mrs)}`)}: the indifference curve and the tangent have slope ${texStr(`-${f3(mrs)}`)} at ${texStr('x^\\circ')}.</span></li>`
    ].join('');
    // MRS of V = f(U): answers an exercise, so hidden until "Check your answer"
    const T = OM.TRANSFORMS[state.t], h = 1e-5, V = x => T.f(OM.utility(x, P));
    const v1 = (V([xo[0] + h, xo[1]]) - V([xo[0] - h, xo[1]])) / (2 * h), v2 = (V([xo[0], xo[1] + h]) - V([xo[0], xo[1] - h])) / (2 * h);
    const btn = $('revealMRS');
    btn.textContent = state.reveal ? 'Hide the answer' : 'Check your answer';
    btn.setAttribute('aria-pressed', String(state.reveal));
    const sameMRS = Math.abs(v1 / v2 - mrs) <= 1e-4 * Math.max(1, Math.abs(mrs));
    $('mrsV').hidden = !state.reveal;
    $('mrsV').innerHTML = `<li><span class="mark ${sameMRS ? 'ok' : 'no'}">${sameMRS ? '✓' : '✗'}</span><span>${texStr(`\\frac{V_1}{V_2}=\\frac{f'(U)\\,U_1}{f'(U)\\,U_2}=\\frac{${f3(v1)}}{${f3(v2)}}=${f3(v1 / v2)}`)}: the same ${texStr('MRS_{21}')} as for ${texStr('U')}, for any ${texStr('f')} with ${texStr("f'\\ne0")}. The slope of an indifference curve does not depend on how utility is numbered.</span></li>`;
  }

  function render() {
    U.applyVisibility({ ces: state.type === 'ces' });
    tex($('formula'), FORMULA[state.type](pref()), true);
    const th = U.theme();
    let R = null;
    guard('surfaces', () => { R = draw3d(th); });
    if (R) { guard('ranking', () => renderRanking(R)); guard('Theorem 1', () => drawTheorem(th, R)); }
  }

  function init() {
    U.renderStaticTex();
    // rho = 0 is the Cobb-Douglas limit (its own option): the slider skips it so that the number shown is the number used.
    U.controls(document, state, { adjust: (k, v) => (k === 'rho' && Math.abs(v) < 0.05 ? (v < 0 ? -0.05 : 0.05) : v), onChange: schedule });
    $('type').addEventListener('change', e => { state.type = e.target.value; schedule(); });
    $('transform').addEventListener('change', e => { state.t = e.target.value; state.reveal = false; schedule(); });
    $('revealMRS').addEventListener('click', () => { state.reveal = !state.reveal; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(OM, 'model.js')) guard('page', init);
})();
