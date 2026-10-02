/*
 * Cost Minimisation: interface and plotting (lecture 2, Step 1 (CM)).
 * All math comes from shared/firm-model.js (window.FirmModel); this file only draws it.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, U = window.Microvis, FU = window.FirmUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, linspace, guard } = U;

  const state = {
    tech: 'cobb', delta: 0.5, rho: -0.5, A: 1, k: 1,
    w1: 1, w2: 2, q: 2,
    iso: 'find', frac: 1.6, reached: false, expansion: true,
    zmax: 6, autofit: false
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: 'homog', A: state.A, k: state.k, a: 2, m: 1 });
  const prices = () => [state.w1, state.w2];

  let ctrls = {};
  const schedule = U.scheduler(render);
  const SNAP = 0.005;

  // Everything the page shows, from the shared model.
  function solve() {
    const s = tech(), w = prices(), r = FM.condDemand(w, state.q, s), C = FM.cost(w, state.q, s);
    const ends = r.segment ? r.segment.flat() : r.H;
    const zmax = state.autofit ? Math.max(2, 1.6 * Math.max(...ends)) : state.zmax;
    return { s, w, H: r.H, kind: r.kind, segment: r.segment, C, zmax };
  }

  // ---------- isocost slider: share of the minimum cost, shown as a cost level ----------

  function setFrac(f) {
    f = U.clampTo(f, 0, 2);
    if (Math.abs(f - 1) < SNAP) { f = 1; state.reached = true; }
    state.frac = f;
    schedule();
  }

  function renderIsoStatus(C) {
    $('cbar-range').value = state.frac;
    if (document.activeElement !== $('cbar-num')) $('cbar-num').value = (state.frac * C).toFixed(2);
    const el = $('cbar-status'), f = state.frac;
    if (f < 1 - SNAP) { el.className = 'status-line low'; el.innerHTML = `Too cheap: no bundle on this line produces ${texStr('q')}.`; }
    else if (f <= 1 + SNAP) { el.className = 'status-line min'; el.textContent = 'Minimum cost reached: the line just touches the isoquant.'; }
    else { el.className = 'status-line high'; el.innerHTML = `Bundles on this line can produce ${texStr('q')}, but cost can still be reduced.`; }
  }

  // ---------- main plot ----------

  // Isocost line w1 z1 + w2 z2 = c from axis to axis.
  const isocost = (c, w) => [[c / w[0], 0], [0, c / w[1]]];

  function drawMain(th, P) {
    const { s, w, H, kind, segment, C, zmax } = P, traces = [], annotations = [], shapes = [];
    const iso = FM.isoquant(state.q, s, zmax);

    // Z(q) shaded and the isoquant.
    if (iso.length) {
      const first = iso[0], last = iso[iso.length - 1];
      const poly = iso.concat([[last[0], zmax], [zmax, zmax], [zmax, first[1]]]);
      traces.push({ type: 'scatter', mode: 'lines', x: poly.map(p => p[0]), y: poly.map(p => p[1]), fill: 'toself', fillcolor: 'rgba(74, 144, 226, 0.12)', line: { width: 0 }, hoverinfo: 'skip' });
      traces.push(U.line2(iso, th.blue, 3, `isoquant q = ${fmt(state.q)}`));
      const lp = iso[Math.floor(iso.length * 0.88)];
      annotations.push({ x: lp[0], y: lp[1], text: `q = ${fmt(state.q)}`, showarrow: false, xanchor: 'left', xshift: 8, font: { color: th.blue, size: 13 } });
    }

    // Grey isocost lines and the "reducing cost" arrow towards the origin.
    for (const f of [0.6, 0.8, 1.2, 1.4, 1.6]) traces.push(U.line2(isocost(f * C, w), th.grey, 1, `cost ${fmt(f * C)}`));
    const mid = f => [f * C / (2 * w[0]), f * C / (2 * w[1])];
    const [tail, head] = [mid(1.6), mid(1.2)];
    annotations.push({ x: head[0], y: head[1], ax: tail[0], ay: tail[1], axref: 'x', ayref: 'y', xref: 'x', yref: 'y', showarrow: true, arrowhead: 2, arrowsize: 1.2, arrowwidth: 1.5, arrowcolor: th.grey, text: '' });
    const lab = mid(1.4);
    annotations.push({ x: lab[0], y: lab[1], text: 'reducing cost', showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 10, yshift: -4, font: { color: th.grey, size: 12 } });

    // Linear technology with w1/delta = w2/(1-delta): the whole segment is optimal.
    if (kind === 'multiple') {
      traces.push(U.line2(segment, th.ink, 6, 'cost-minimising segment'));
      annotations.push({ xref: 'paper', yref: 'paper', x: 0.98, y: 0.98, xanchor: 'right', yanchor: 'top', showarrow: false, text: 'Every bundle on this segment is cost minimising', font: { color: th.ink, size: 12 }, bgcolor: th.panel, bordercolor: th.line, borderpad: 4 });
    }

    // Expansion path: the cost-minimising bundles for every q lie on one ray (homothetic technology).
    if (state.expansion && kind !== 'multiple') {
      const t = zmax / Math.max(H[0], H[1]);
      traces.push(U.line2([[0, 0], [H[0] * t, H[1] * t]], th.blue, 1.5, 'expansion path', 'dot'));
      annotations.push({ x: H[0] * t * 0.92, y: H[1] * t * 0.92, text: 'expansion path', showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { color: th.blue, size: 11 } });
    }

    // The isocost line being moved (or the solution).
    const atMin = state.iso === 'show' || state.frac === 1;
    const cbar = state.iso === 'show' ? C : state.frac * C;
    const act = isocost(cbar, w);
    traces.push(U.line2(act, th.ink, 2.5, `isocost: cost ${fmt(cbar)}`));
    const m = [0.3 * act[0][0], 0.7 * act[1][1]];
    if (m[0] < zmax && m[1] < zmax && cbar > 0) {
      annotations.push({ x: m[0], y: m[1], text: `slope = −w₁/w₂ = −${fmt(w[0] / w[1])}`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, yshift: 4, font: { color: th.ink, size: 12 }, bgcolor: th.panel });
    }

    // The optimum z* = H(w, q) (for a whole optimal segment, the segment itself is the answer).
    if (atMin && kind !== 'multiple') {
      shapes.push({ type: 'line', x0: H[0], x1: H[0], y0: 0, y1: H[1], line: { color: th.ink, width: 1, dash: 'dot' } });
      shapes.push({ type: 'line', x0: 0, x1: H[0], y0: H[1], y1: H[1], line: { color: th.ink, width: 1, dash: 'dot' } });
      traces.push(U.dot2([H], th.ink, 'z* = H(w,q)', 13));
      annotations.push({ x: H[0], y: H[1], text: 'z* = H(w,q)', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, yshift: 4, font: { color: th.ink, size: 13 } });
      if (H[1] > 0.04 * zmax) annotations.push({ x: H[0], y: 0, text: 'H<sup>1</sup>(w,q)', showarrow: false, yanchor: 'bottom', yshift: 3, xshift: 2, xanchor: 'left', font: { color: th.ink, size: 11 } });
      if (H[0] > 0.04 * zmax) annotations.push({ x: 0, y: H[1], text: 'H<sup>2</sup>(w,q)', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 3, font: { color: th.ink, size: 11 } });
    } else if (state.reached) {
      traces.push({ ...U.dot2([H], th.ink, 'z* (found before)', 12), marker: { color: 'rgba(0,0,0,0)', size: 12, line: { color: th.ink, width: 2 } } });
    }

    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>',
      x: { range: [0, zmax], constrain: 'domain' },
      y: { range: [0, zmax], scaleanchor: 'x', scaleratio: 1, constrain: 'domain' },
      annotations, shapes
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  // ---------- conditional demand for input 1 ----------

  function drawDemand(th, P) {
    const { s, H } = P, ws = linspace(0.2, 5, 400);
    const h1 = ws.map(v => FM.condDemand([v, state.w2], state.q, s).H[0]);
    const traces = [
      U.line2(ws.map((v, i) => [v, h1[i]]), th.blue, 3, ''),
      U.dot2([[state.w1, H[0]]], th.blue, 'current w₁', 12)
    ];
    const yMax = Math.max(1, ...h1.filter(Number.isFinite).slice(5)) * 1.1;
    Plotly.react('plotB', traces, U.base2d(th, {
      xt: 'w<sub>1</sub>', yt: 'H<sup>1</sup>(w,q)', x: { range: [0, 5.1] }, y: { range: [0, Math.min(yMax, 4 * Math.max(H[0], 0.5) + 1)] }
    }), U.PLOT_CONFIG);
    $('capB').innerHTML = state.tech === 'leontief'
      ? 'No substitution possible: the demand does not react to prices.'
      : state.tech === 'linear'
        ? `Perfect substitutes: the firm uses only the cheaper input (per unit of ${texStr('g')}), so the demand jumps when ${texStr('w_1/\\delta')} passes ${texStr('w_2/(1-\\delta)')}.`
        : `Holding ${texStr('q')} fixed, a higher price of input 1 makes the firm substitute away from it.`;
  }

  // ---------- readouts ----------

  function renderReadouts(P) {
    const { s, w, H, kind, C, segment } = P;
    const mrts = kind === 'multiple' ? s.delta / (1 - s.delta) : FM.mrts(H[0], H[1], s);
    const ratio = w[0] / w[1], equal = kind === 'interior' || kind === 'multiple';
    const mrtsText = mrts === null ? 'undefined at the kink' : fmt(mrts);
    const rows = [
      ['H^1(w,q)', kind === 'multiple' ? `any value from 0 to ${fmt(segment[0][0], 3)}` : fmt(H[0], 3)],
      ['H^2(w,q)', kind === 'multiple' ? `any value from 0 to ${fmt(segment[1][1], 3)}` : fmt(H[1], 3)],
      ['C(w,q)=w_1H^1+w_2H^2', `${fmt(w[0])}·${fmt(H[0], 3)} + ${fmt(w[1])}·${fmt(H[1], 3)} = ${fmt(C, 3)}`],
      ['MRTS_{21}(z^\\ast)', mrtsText],
      ['w_1/w_2', `${fmt(ratio)}${equal ? ` <span class="ok-mark">✓ = ${texStr('MRTS_{21}')}</span>` : ''}`],
      ['\\lambda^\\ast=\\partial C/\\partial q', `${fmt(FM.MC(w, state.q, s), 3)} <span class="c-muted">marginal cost of output</span>`],
      ['\\text{solution}', FU.KIND[kind]]
    ];
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    const which = H[0] > 0 ? 1 : 2;
    $('sentence').innerHTML = {
      interior: `At ${texStr('z^\\ast')} the isoquant and the isocost line have the same slope: ${texStr(`MRTS_{21}=w_1/w_2=${fmt(ratio)}`)}. Change ${texStr('A')} or ${texStr('k')}: ${texStr('z^\\ast')} moves along the expansion path, but the slope there stays the same.`,
      kink: `Leontief: the isocost line touches only the corner of the isoquant. The MRTS is undefined there, and every price ratio gives the same ${texStr('z^\\ast')}.`,
      corner: `Linear: per unit of ${texStr('g')}, input ${which} is cheaper (${texStr(`w_1/\\delta=${fmt(w[0] / s.delta)}`)} against ${texStr(`w_2/(1-\\delta)=${fmt(w[1] / (1 - s.delta))}`)}), so only input ${which} is used: a corner solution.`,
      multiple: `Linear with ${texStr('w_1/\\delta=w_2/(1-\\delta)')}: the isocost line lies on top of the isoquant, so every bundle on it costs the same.`
    }[kind];
  }

  // ---------- render loop ----------

  function render() {
    const P = solve();
    U.applyVisibility({ ces: state.tech === 'ces', find: state.iso === 'find' });
    document.querySelectorAll('[data-iso]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.iso === state.iso)));
    const f = FU.techFormula(P.s);
    tex($('formula-general'), f.general, true);
    tex($('formula-numbers'), f.numbers, true);
    if (state.autofit) { state.zmax = Number(P.zmax.toFixed(1)); ctrls.zmax.sync(); }
    renderIsoStatus(P.C);
    const th = U.theme();
    guard('input-space plot', () => drawMain(th, P));
    guard('demand plot', () => drawDemand(th, P));
    guard('readouts', () => renderReadouts(P));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    document.querySelectorAll('[data-iso]').forEach(b => b.addEventListener('click', () => { state.iso = b.dataset.iso; schedule(); }));
    $('cbar-range').addEventListener('input', e => setFrac(Number(e.target.value)));
    $('cbar-num').addEventListener('change', e => { const C = solve().C; setFrac(Number(e.target.value) / C); });
    $('expansion').addEventListener('change', e => { state.expansion = e.target.checked; schedule(); });
    $('autofit').addEventListener('change', e => { state.autofit = e.target.checked; ctrls.zmax.range.disabled = state.autofit; ctrls.zmax.box.disabled = state.autofit; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js')) guard('page', init);
})();
