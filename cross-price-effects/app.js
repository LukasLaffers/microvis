/*
 * Cross-Price Effects: interface and plotting (lecture 4).
 */
(function () {
  'use strict';

  const CM = window.CrossModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U, n = U.num;

  const KEYS = ['sigA', 'sigB', 'sigC'];
  const state = { ...CM.DEFAULTS, reveal: false };
  let ctrls = {}, held = null;   // the axes are held still while C is dragged
  const schedule = U.scheduler(render);

  function buildCases() {
    $('cases').innerHTML = KEYS.map((k, i) => `<section class="case" aria-label="Firm ${i + 1}">
      <h3 id="t${i}"></h3><p class="sub" id="s${i}"></p>
      <div id="iso${i}" class="plot plot-iso"></div>
      <div id="dem${i}" class="plot plot-dem"></div>
      <p class="line" id="l${i}"></p></section>`).join('');
  }

  // One set of axes for all three firms, so that they can be compared.
  function ranges(all) {
    const zx = Math.max(...all.flatMap(st => [st.A[0], st.B[0], st.C[0]]));
    const zy = Math.max(...all.flatMap(st => [st.A[1], st.B[1], st.C[1]]));
    return { x: [0, Math.max(1.6, 1.18 * zx)], y: [0, Math.max(1.6, 1.18 * zy)], w: [0, Math.max(2, 1.25 * Math.max(1, state.w2n))] };
  }

  const label = (pt, text, xa, ya, color) => ({
    x: pt[0], y: pt[1], text, showarrow: false, xanchor: xa, yanchor: ya,
    xshift: xa === 'left' ? 7 : xa === 'right' ? -7 : 0, yshift: ya === 'bottom' ? 5 : ya === 'top' ? -5 : 0, font: { size: 14, color }
  });
  const arrow = (a, b, color) => ({
    x: b[0], y: b[1], ax: a[0], ay: a[1], axref: 'x', ayref: 'y', showarrow: true, text: '',
    arrowcolor: color, arrowwidth: 2.5, arrowhead: 2, arrowsize: 1, standoff: 6, startstandoff: 6
  });
  const far = (a, b, R) => Math.hypot((b[0] - a[0]) / (R.x[1] - R.x[0]), (b[1] - a[1]) / (R.y[1] - R.y[0])) > 0.04;
  // A short piece of the isocost line w.z = const through pt.
  const isocost = (pt, w, L) => { const m = Math.hypot(w[0], w[1]), ux = w[1] / m, uy = -w[0] / m; return [[pt[0] - L * ux, pt[1] - L * uy], [pt[0] + L * ux, pt[1] + L * uy]]; };

  function drawIso(i, th, sig, st, R) {
    const zmax = 1.05 * Math.max(R.x[1], R.y[1]), L = 0.2 * Math.max(R.x[1], R.y[1]), { A, B, C } = st;
    const traces = [
      U.line2(CM.isoquant(sig, st.q0, zmax), th.ink, 2, `isoquant q = ${fmt(st.q0)}`),
      U.line2(CM.isoquant(sig, st.q1, zmax), th.muted, 1.4, `isoquant q = ${fmt(st.q1)}`, 'dot'),
      U.line2(isocost(A, CM.W0, L), th.grey, 1.6, 'isocost at the old prices'),
      U.line2(isocost(B, [CM.W0[0], state.w2n], L), th.grey, 1.6, 'isocost at the new prices'),
      U.line2([[A[0], 0], A], th.muted, 1, '', 'dot'), U.line2([[C[0], 0], C], th.muted, 1, '', 'dot'),
      U.dot2([A], th.ink, 'A', 10), U.dot2([B], th.blue, 'B', 10), U.dot2([C], th.red, 'C', 10)
    ];
    const ann = [label(A, 'A', 'left', 'bottom', th.ink), label(B, 'B', 'left', 'bottom', th.ink), label(C, 'C', 'right', 'top', th.ink)];
    if (far(A, B, R)) ann.push(arrow(A, B, th.blue));
    if (far(B, C, R)) ann.push(arrow(B, C, th.red));
    Plotly.react('iso' + i, traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>', x: { range: R.x }, y: { range: R.y }, annotations: ann, margin: { l: 44, r: 8, t: 6, b: 40 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  function drawDem(i, th, sig, st, R) {
    const w2s = U.linspace(0.12, R.w[1], 120), cv = CM.curves(sig, w2s), w2n = state.w2n, { A, B, C } = st;
    const B2 = [B[0], w2n], C2 = [C[0], w2n], A2 = [A[0], CM.W0[1]];
    Plotly.react('dem' + i, [
      U.line2(cv.H1, th.blue, 2, 'H¹ at the old output', 'dash'),
      U.line2(cv.D1, th.ink, 2.5, 'D¹'),
      U.dot2([A2], th.ink, 'A', 10), U.dot2([B2], th.blue, 'B', 10), U.dot2([C2], th.red, 'C (drag it)', 12)
    ], U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'w<sub>2</sub>', x: { range: R.x }, y: { range: R.w },
      annotations: [label(A2, 'A', 'left', 'top', th.ink), label(B2, 'B', B[0] >= C[0] ? 'left' : 'right', 'bottom', th.ink), label(C2, 'C', B[0] >= C[0] ? 'right' : 'left', 'bottom', th.ink)],
      margin: { l: 44, r: 8, t: 6, b: 40 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  function caseText(i, sig, st) {
    const up = state.w2n > 1, same = Math.abs(state.w2n - 1) < 1e-9, dir = CM.direction(st.A[0], st.C[0]);
    $('t' + i).innerHTML = same ? `${texStr(`\\sigma=${n(sig)}`)}: nothing changes` : `${texStr(`\\sigma=${n(sig)}`)}: input 1 ${dir > 0 ? 'rises' : dir < 0 ? 'falls' : 'does not move'}`;
    $('s' + i).textContent = same ? `w₂′ = w₂` : dir === 0 ? 'the two effects cancel' : (dir > 0) === up ? 'gross substitutes' : 'gross complements';
    $('l' + i).innerHTML = `${texStr('z_1')}: ${fmt(st.A[0])} <span class="c-l2-blue">→ ${fmt(st.B[0])}</span> <span class="c-l2-red">→ ${fmt(st.C[0])}</span>` +
      ` <span class="c-muted">· output ${fmt(st.q0)} → ${fmt(st.q1)}</span>`;
  }

  function renderTable() {
    const rows = KEYS.map(k => {
      const sig = state[k], m = CM.marginal(sig), [a, b, t] = U.fmtSum([m.substitution, m.scale]), cross = U.fmtSum([m.substitution21, m.scale])[2];
      return `<tr><th>${texStr(`\\sigma=${n(sig)}`)}</th><td class="c-l2-blue">${a}</td><td class="c-l2-red">${b}</td><td><b>${t}</b></td>` +
        (state.reveal ? `<td><b>${cross}</b></td>` : '<td class="hidden-answer">?</td>') + '</tr>';
    });
    $('effects').innerHTML = `<thead><tr><th></th><th>substitution</th><th>scale</th><th>${texStr('\\partial D^1/\\partial w_2')}</th><th>${texStr('\\partial D^2/\\partial w_1')}</th></tr></thead><tbody>${rows.join('')}</tbody>`;
    const btn = $('reveal');
    btn.textContent = state.reveal ? 'Hide the answer' : 'Check your answer';
    btn.setAttribute('aria-pressed', String(state.reveal));
    $('answer').hidden = !state.reveal;
    $('answer').innerHTML = `${texStr('\\partial D^2/\\partial w_1=\\partial D^1/\\partial w_2')} for every firm, term by term: ${texStr('\\partial H^2/\\partial w_1=\\partial H^1/\\partial w_2')}, and the scale term is the same.`;
  }

  function render() {
    tex($('formula'), `\\begin{gathered}\\phi(z)=g(z)^{1/2}\\\\ g(z)=\\big(\\tfrac12 z_1^{\\rho}+\\tfrac12 z_2^{\\rho}\\big)^{1/\\rho},\\quad \\sigma=\\tfrac{1}{1-\\rho}\\\\ \\sigma=${KEYS.map(k => n(state[k])).join(',\\ ')}\\end{gathered}`, true);
    const th = U.theme(), all = KEYS.map(k => CM.steps(state[k], state.w2n)), R = held || ranges(all);
    KEYS.forEach((k, i) => {
      guard(`firm ${i + 1}`, () => { drawIso(i, th, state[k], all[i], R); drawDem(i, th, state[k], all[i], R); caseText(i, state[k], all[i]); });
    });
    guard('table', renderTable);
  }

  function init() {
    buildCases();
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('defaults').addEventListener('click', () => { Object.keys(CM.DEFAULTS).forEach(k => ctrls[k].setExact(CM.DEFAULTS[k])); schedule(); });
    $('reveal').addEventListener('click', () => { state.reveal = !state.reveal; schedule(); });
    // Drag C up or down in a lower figure: it sets the new price of input 2.
    const lim = v => Math.min(ctrls.w2n.max, Math.max(ctrls.w2n.min, Math.round(v * 20) / 20));
    KEYS.forEach((k, i) => U.dragPoint('dem' + i, {
      target: () => [CM.steps(state[k], state.w2n).C[0], state.w2n],
      move: ([, y]) => ctrls.w2n.setExact(lim(y)),
      start: () => { held = ranges(KEYS.map(kk => CM.steps(state[kk], state.w2n))); },
      end: () => { held = null; schedule(); }
    }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(window.FirmModel && CM, 'model.js')) guard('page', init);
})();
