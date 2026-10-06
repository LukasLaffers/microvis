/*
 * Translog Cost Shares: interface and plotting (lecture 4, section 3 and the Appendix).
 * The true CES unit cost comes from shared/firm-model.js; the translog math from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, TL = window.TranslogModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = {
    mode: 'ces', delta: 0.5, rho: 0.5, wb1: 1, wb2: 1,
    a1: 0.4, a2: 0.6, b11: 0.1, b12: -0.1, b21: -0.1, b22: 0.1,
    w1: 2, w2: 1, yE: 10
  };
  const schedule = U.scheduler(render);
  const X = 1.6;   // plotted range of log(w1/w2)

  const ces = () => ({ tech: 'ces', delta: state.delta, rho: state.rho, profile: 'homog', A: 1, k: 1 });
  const sigmaCES = () => 1 / (1 - state.rho);
  const cesCost = w => FM.unitCost(w, ces());
  const cesShare1 = w => w[0] * FM.unitDemand(w, ces()).h[0] / cesCost(w);

  function solve() {
    const w = [state.w1, state.w2];
    if (state.mode === 'ces') {
      const wbar = [state.wb1, state.wb2];
      return { w, wbar, P: TL.translogFromUnitCost(cesCost, wbar), tol: 1e-6, isCES: true };
    }
    return { w, P: { a0: 0, alpha: [state.a1, state.a2], beta: [[state.b11, state.b12], [state.b21, state.b22]] }, tol: 1e-9, isCES: false };
  }

  const f3 = x => fmt(x, 3), f4 = x => fmt(x, 4);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const mark = good => `<span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span>`;

  // ---------- panel 1: log c along log(w1/w2), with w2 at its current value ----------

  function drawApprox(th, S) {
    const { P, w, isCES } = S, w2 = w[1], xs = U.linspace(-X, X, 161);
    const traces = [];
    if (isCES) traces.push(U.line2(xs.map(x => [x, Math.log(cesCost([w2 * Math.exp(x), w2]))]), th.ink, 2.5, 'true CES log c'));
    traces.push(U.line2(xs.map(x => [x, TL.logUnitCost(P, [w2 * Math.exp(x), w2])]), th.accent, 2.5, 'translog approximation', isCES ? 'dash' : 'solid'));
    const xNow = Math.log(w[0] / w2);
    traces.push(U.dot2([[xNow, TL.logUnitCost(P, w)]], th.accent, 'translog at the current prices', 9));
    const shapes = [{ type: 'line', x0: xNow, x1: xNow, yref: 'paper', y0: 0, y1: 1, line: { color: th.muted, width: 1, dash: 'dot' } }];
    const annotations = [{ x: xNow, yref: 'paper', y: 1, text: 'current', showarrow: false, yanchor: 'top', xanchor: 'left', xshift: 3, font: { size: 11, color: th.muted } }];
    if (isCES) {
      const xb = Math.log(S.wbar[0] / S.wbar[1]);
      traces.push(U.dot2([[xb, Math.log(cesCost([w2 * Math.exp(xb), w2]))]], th.ink, 'reference prices', 10));
      annotations.push({ x: xb, y: Math.log(cesCost([w2 * Math.exp(xb), w2])), text: 'w̄', showarrow: false, yanchor: 'top', yshift: -8, font: { size: 13, color: th.ink } });
    }
    const layout = U.base2d(th, { xt: 'log(w<sub>1</sub>/w<sub>2</sub>)', yt: 'log c', x: { range: [-X, X] }, shapes, annotations, margin: { l: 56, r: isCES ? 56 : 12, t: 8, b: 44 } });
    if (isCES) {
      // The approximation error on a second axis: zero, flat and without curvature at the reference.
      const errs = xs.map(x => { const v = [w2 * Math.exp(x), w2]; return [x, TL.logUnitCost(P, v) - Math.log(cesCost(v))]; });
      const m = Math.max(1e-3, ...errs.map(e => Math.abs(e[1]))) * 1.1;
      traces.push(U.line2(errs, th.muted, 1.5, 'error: translog − true (right axis)', 'dot', { yaxis: 'y2' }));
      layout.yaxis2 = { ...layout.yaxis, overlaying: 'y', side: 'right', range: [-m, m], showgrid: false, zeroline: true, zerolinecolor: th.grid, title: { text: 'error', standoff: 4, font: { color: th.muted } } };
    }
    $('headA').textContent = isCES ? 'A second-order approximation' : 'The translog unit cost';
    Plotly.react('plotA', traces, layout, U.PLOT_CONFIG);
    if (isCES) {
      const err = TL.logUnitCost(P, w) - Math.log(cesCost(w));
      $('capA').innerHTML = `<span class="c-ink"><span class="key"></span>true CES unit cost (${texStr(`\\sigma=${f3(sigmaCES())}`)})</span>, <span class="c-accent"><span class="key dash"></span>translog</span>, <span class="c-muted"><span class="key dotted"></span>their difference (right axis)</span>, with ${texStr('\\alpha_i,\\beta_{ij}')} from the Taylor expansion around ${texStr('\\bar w')}. They touch at the reference (value, slope and curvature agree) and drift apart only at third order: at the current prices the error in ${texStr('\\log c')} is ${f4(err)}.` +
        (Math.abs(state.rho) < 1e-9 ? ' With ρ = 0 (Cobb-Douglas) all β are 0 and the translog is exact.' : '');
    } else {
      $('capA').innerHTML = `${texStr('\\log c')} of your translog (with ${texStr('\\alpha_0=0')}) as ${texStr('w_1')} varies and ${texStr('w_2')} stays at its current value.`;
    }
  }

  // ---------- panel 2: shares against log(w1/w2) ----------

  function drawShares(th, S) {
    const { P, w, isCES } = S, w2 = w[1], xs = U.linspace(-X, X, 161), at = x => [w2 * Math.exp(x), w2];
    const traces = [];
    if (isCES) {
      traces.push(U.line2(xs.map(x => [x, cesShare1(at(x))]), th.ink, 2.5, 'CES share sh₁'));
      traces.push(U.line2(xs.map(x => [x, 1 - cesShare1(at(x))]), th.ink, 1.5, 'CES share sh₂', 'dash'));
    }
    traces.push(U.line2(xs.map(x => [x, TL.shares(P, at(x))[0]]), th.accent, 2.5, 'translog sh₁ (&)'));
    traces.push(U.line2(xs.map(x => [x, TL.shares(P, at(x))[1]]), th.accent, 1.5, 'translog sh₂ (&)', 'dash'));
    if (!isCES) traces.push(U.line2(xs.map(x => [x, TL.shares(P, at(x)).reduce((a, b) => a + b, 0)]), th.muted, 1.5, 'sh₁ + sh₂', 'dot'));
    const xNow = Math.log(w[0] / w2), sh = TL.shares(P, w);
    traces.push(U.dot2([[xNow, sh[0]]], th.accent, 'sh₁ at the current prices', 9));
    const shapes = [{ type: 'line', x0: xNow, x1: xNow, yref: 'paper', y0: 0, y1: 1, line: { color: th.muted, width: 1, dash: 'dot' } }];
    const ys = traces.flatMap(t => t.y).filter(Number.isFinite);
    const yr = [Math.min(-0.05, ...ys), Math.max(1.05, ...ys)];
    Plotly.react('plotS', traces, U.base2d(th, { xt: 'log(w<sub>1</sub>/w<sub>2</sub>)', yt: 'cost share', x: { range: [-X, X] }, y: { range: yr }, shapes, margin: { l: 56, r: 12, t: 8, b: 44 } }), U.PLOT_CONFIG);
    const slope = `\\beta_{11}=${f4(P.beta[0][0])}`;
    $('capS').innerHTML = isCES
      ? `<span class="c-ink"><span class="key"></span>CES shares</span> bend; the <span class="c-accent"><span class="key"></span>translog shares</span> are straight lines with slope ${texStr(slope)} ${texStr(`=(1-\\sigma)\\,sh_1sh_2`)} at ${texStr('\\bar w')}, tangent to the CES curve there. Solid: ${texStr('sh_1')}; dashed: ${texStr('sh_2')}. ${sigmaCES() < 1 ? 'With σ < 1 the share of an input rises with its relative price.' : sigmaCES() > 1 ? 'With σ > 1 the share of an input falls with its relative price.' : ''}`
      : `Your share equations (&): solid ${texStr('sh_1')}, dashed ${texStr('sh_2')}, dotted their sum (must be 1, restriction 1). Slope of ${texStr('sh_1')} in ${texStr('\\log w_1')}: ${texStr(slope)}.`;
  }

  // ---------- elasticities (%), (#), ($) ----------

  function renderElasticities(S) {
    const { P, w, isCES } = S, e = TL.elasticities(P, w), sh = e.sh;
    const sg = sigmaCES(), cs1 = isCES ? cesShare1(w) : 0, cs = [cs1, 1 - cs1];
    const rows = [
      ['(%)', '\\varepsilon^c_{11}', e.eps[0][0], -sg * cs[1]],
      ['(%)', '\\varepsilon^c_{22}', e.eps[1][1], -sg * cs[0]],
      ['(#)', '\\varepsilon^c_{12}', e.eps[0][1], sg * cs[1]],
      ['(#)', '\\varepsilon^c_{21}', e.eps[1][0], sg * cs[0]],
      ['($)', '\\sigma_{12}', e.sigma[0][1], sg]
    ];
    const valid = sh.every(s => s > 0);
    $('elas').innerHTML = `<table class="tl elas-table"><thead><tr><th></th><th></th><th>translog</th>${isCES ? '<th>true CES</th>' : ''}</tr></thead><tbody>` +
      rows.map(([lab, sym, v, t], k) => `<tr><td>${lab}</td><td>${texStr(sym)}</td><td${k < 2 && valid && v >= 0 ? ' class="c-l2-red" title="positive own-price elasticity: restriction 4 fails"' : ''}>${valid ? f3(v) : '–'}</td>${isCES ? `<td>${f3(t)}</td>` : ''}</tr>`).join('') +
      `<tr class="sum"><td></td><td>${texStr('sh_1,\\ sh_2')}</td><td>${f3(sh[0])}, ${f3(sh[1])}</td>${isCES ? `<td>${f3(cs[0])}, ${f3(cs[1])}</td>` : ''}</tr></tbody></table>`;
    let cap = `${texStr('\\varepsilon^c_{ii}=\\frac{\\beta_{ii}-sh_i+sh_i^2}{sh_i}')}, ${texStr('\\varepsilon^c_{ij}=\\frac{\\beta_{ij}+sh_ish_j}{sh_i}')}, ${texStr('\\sigma_{ij}=\\frac{\\beta_{ij}+sh_ish_j}{sh_ish_j}')}, all evaluated at the translog shares (&).`;
    if (!valid) cap += ' A share is not positive at these prices, so the formulas do not apply.';
    if (isCES) {
      const eb = TL.elasticities(P, S.wbar), shb = cesShare1(S.wbar);
      const agree = same(eb.eps[0][0], -sg * (1 - shb)) && same(eb.eps[0][1], sg * (1 - shb)) && same(eb.sigma[0][1], sg);
      cap += ` At the reference prices they equal the CES values exactly: ${texStr(`\\varepsilon^c_{11}=-\\sigma\\,sh_2=${f3(eb.eps[0][0])}`)}, ${texStr(`\\sigma_{12}=\\sigma=${f3(eb.sigma[0][1])}`)} <span class="${agree ? 'ok-mark' : 'c-l2-red'}">${agree ? '✓' : '✗'}</span>. Move the current prices away from ${texStr('\\bar w')} to see them drift.`;
    }
    $('capE').innerHTML = cap;
  }

  // ---------- restrictions 1-4 ----------

  function renderRestrictions(S) {
    const { P, tol, isCES } = S, R = TL.checkRestrictions(P, X / 2, tol);
    const sums = a => a.map(v => f3(Math.abs(v) < 10 * tol ? 0 : v)).join(', ');
    const items = [
      [R.addingUp.ok, `1. Adding up: ${texStr(`\\textstyle\\sum_i\\alpha_i=${f3(R.addingUp.sumAlpha)}`)} and ${texStr('\\sum_i\\beta_{ij}')} = ${sums(R.addingUp.colSums)} (need 1 and 0)`],
      [R.homogeneity.ok, `2. Homogeneity of degree 0 of the shares: ${texStr('\\sum_j\\beta_{ij}')} = ${sums(R.homogeneity.rowSums)} (need 0)`],
      [R.symmetry.ok, `3. Symmetry: ${texStr(`\\beta_{12}=${f3(P.beta[0][1])}`)}, ${texStr(`\\beta_{21}=${f3(P.beta[1][0])}`)}`],
      [R.negativeOwn.ok, `4. Negative own-price elasticities for all prices ${texStr(`w_i\\in[${fmt(Math.exp(-X / 2), 2)},\\,${fmt(Math.exp(X / 2), 2)}]`)} (the plotted range): ` + (R.negativeOwn.sharesPositive
        ? `largest ${texStr('\\varepsilon^c_{ii}')} is ${f3(R.negativeOwn.worst)}`
        : 'a cost share becomes zero or negative in this range, so the translog is not a valid cost function there')]
    ];
    $('restr').innerHTML = items.map(([ok, html]) => `<li>${mark(ok)}<span>${html}</span></li>`).join('') +
      (isCES ? `<li><span class="mark na">·</span><span class="c-muted">The approximation of a true cost function satisfies 1–3 exactly and 4 near the reference prices; far from them its straight share lines can leave (0, 1).</span></li>` : '');
  }

  // ---------- Arnberg and Bjørner (2007) ----------

  function renderTables() {
    const AB = TL.ARNBERG_BJORNER, short = ['E (1)', 'O (2)', 'L (3)', 'M (4)'];
    const cls = (i, j) => i === j ? 'ab-own' : (i < 2 && j < 2) ? 'ab-sub' : ((i < 2 && j === 3) || (i === 3 && j < 2)) ? 'ab-comp' : '';
    const num = x => (x < 0 ? '−' : '') + Math.abs(x).toFixed(3);
    $('abElas').innerHTML = `<table class="tl"><thead><tr><th>Input</th>${[1, 2, 3, 4].map(j => `<th>${texStr(`P_${j}`)}</th>`).join('')}</tr></thead><tbody>` +
      AB.eps.map((row, i) => `<tr><td>${AB.inputs[i]} (${i + 1})</td>${row.map((v, j) => `<td><span class="${cls(i, j)}">${num(v)}</span><sup>${AB.stars[i][j]}</sup><span class="se">(${AB.se[i][j].toFixed(3)})</span></td>`).join('')}</tr>`).join('') +
      '</tbody></table>';
    const g = x => { const a = Math.abs(x); return (x < 0 ? '−' : '') + (a !== 0 && a < 0.001 ? a.toPrecision(2) : a < 0.01 && String(a).length > 5 ? String(a) : a.toFixed(3)); };
    const colSums = [0, 1, 2, 3].map(j => Math.round(1000 * AB.beta.reduce((s, r) => s + r[j], 0)) / 1000);
    const row = (label, vals, stars) => `<tr><td>${texStr(label)}</td>${vals.map((v, j) => `<td>${g(v)}<sup>${stars ? stars[j] : ''}</sup></td>`).join('')}</tr>`;
    $('abPar').innerHTML = `<table class="tl"><thead><tr><th></th>${short.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>` +
      row('\\alpha_i', AB.alpha) +
      AB.beta.map((r, i) => row(`\\beta_{${i + 1}j}`, r, AB.betaStars[i])).join('') +
      `<tr class="sum"><td>${texStr('\\sum_i\\beta_{ij}')}</td>${colSums.map(s => `<td>${(s < 0 ? '−' : '') + Math.abs(s).toFixed(3)}</td>`).join('')}</tr>` +
      row('\\beta_{Ti}', AB.betaT, AB.betaTStars) + row('\\beta_{Vi}', AB.betaV, AB.betaVStars) + row('\\beta_{Bi}', AB.betaB, AB.betaBStars) +
      '</tbody></table>';
    $('abParCap').innerHTML = `${texStr('\\alpha_i')}: mean of the firm fixed effects ${texStr('\\alpha_{if}')}; ${texStr('T')} time trend, ${texStr('V')} value added, ${texStr('B')} building capital. The matrix is symmetric (restriction 3), ${texStr('\\sum_i\\alpha_i=1')} and the column sums of ${texStr('\\beta')} are zero up to rounding (restrictions 1–2). Min ${texStr('\\chi^2')} ${AB.chi2}, ${texStr('p')} = ${AB.p}, ${texStr(`N=${AB.N}`)}.`;
  }

  // ---------- two Leontief firms ----------

  function drawAggregate(th) {
    const yE = state.yE, yK = 20 - yE, a = TL.aggregate(yE, yK), a0 = TL.aggregate(10, 10);
    const cats = ['energy-intensive<br>firm', 'capital-intensive<br>firm', 'industry<br>total'];
    const E = [a.firmE.E, a.firmK.E, a.E], K = [a.firmE.K, a.firmK.K, a.K];
    const traces = [
      { type: 'bar', name: 'energy E', x: cats, y: E, marker: { color: th.orange }, text: E.map(v => fmt(v, 1)), textposition: 'outside', cliponaxis: false, hovertemplate: 'E = %{y}<extra></extra>' },
      { type: 'bar', name: 'capital K', x: cats, y: K, marker: { color: th.grey }, text: K.map(v => fmt(v, 1)), textposition: 'outside', cliponaxis: false, hovertemplate: 'K = %{y}<extra></extra>' }
    ];
    const layout = U.base2d(th, { yt: 'input use', y: { range: [0, 45] }, margin: { l: 48, r: 8, t: 8, b: 48 } });
    Plotly.react('plotAgg', traces, { ...layout, barmode: 'group', showlegend: true, legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { color: th.ink } }, xaxis: { ...layout.xaxis, type: 'category', tickangle: 0 } }, U.PLOT_CONFIG);
    $('capAgg').innerHTML = `Outputs ${fmt(yE, 1)} and ${fmt(yK, 1)}. Industry totals: energy ${fmt(a0.E, 0)} → <b>${fmt(a.E, 1)}</b>, capital ${fmt(a0.K, 0)} → <b>${fmt(a.K, 1)}</b>, ${(() => { const r = a.E / a.K; return Math.abs(r - 1) < 5e-3 ? `so ${texStr('E/K')} stays at 1. Move the slider: as output shifts to the capital-intensive firm, the industry's ${texStr('E/K')} falls, which would look like substitution away from energy.` : `so ${texStr('E/K')} ${r < 1 ? 'falls' : 'rises'} from 1 to ${fmt(r, 2)}, which looks like substitution ${r < 1 ? 'away from' : 'towards'} energy.`; })()} Yet inside each firm ${texStr('E/K')} stays at 2 and ½. Only data on individual firms over time can tell the two apart.`;
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ces: state.mode === 'ces', own: state.mode === 'own' });
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    const S = solve(), th = U.theme();
    if (state.mode === 'ces') tex($('formula-ces'), `\\begin{gathered}c(w)=\\big[\\delta^{\\sigma}w_1^{1-\\sigma}+(1-\\delta)^{\\sigma}w_2^{1-\\sigma}\\big]^{\\frac{1}{1-\\sigma}}\\\\ \\sigma=${f3(sigmaCES())}\\end{gathered}`, true);
    guard('approximation plot', () => drawApprox(th, S));
    guard('share plot', () => drawShares(th, S));
    guard('elasticities', () => renderElasticities(S));
    guard('restrictions', () => renderRestrictions(S));
    guard('aggregation plot', () => drawAggregate(th));
  }

  function init() {
    U.renderStaticTex();
    U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; schedule(); }));
    guard('results tables', renderTables);
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (TL || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
