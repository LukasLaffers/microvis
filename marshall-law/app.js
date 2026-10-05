/*
 * Marshall's Law of Derived Demand: interface and plotting (lecture 4, section 2).
 * Firm math from shared/firm-model.js; the industry equilibrium and elasticities from model.js.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, DM = window.MarshallModel, U = window.Microvis, FU = window.FirmUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { tech: 'ces', delta: 0.5, rho: -1, w1: 1, w2: 1, eta: 2, r: 10, t: 1 };
  const epsD = () => -state.eta;   // the slider shows -eps^D_p, as in the notes' weighted average
  const B = 10;
  const tech = () => DM.crs({ tech: state.tech, delta: state.delta, rho: state.rho });

  const schedule = U.scheduler(render);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const f = x => fmt(x, 4);
  const pct = x => `${x >= 0 ? '+' : '−'}${fmt(Math.abs(100 * x), 2)} %`;

  // Tick marks 1, 2, 5 per decade between lo and hi, labelled in full (no abbreviated minor labels).
  function logTicks(lo, hi) {
    const vals = [];
    for (let e = Math.floor(Math.log10(lo)) - 1; e <= Math.ceil(Math.log10(hi)); e++)
      for (const m of [1, 2, 5]) { const v = m * Math.pow(10, e); if (v >= lo && v <= hi) vals.push(v); }
    return { tickvals: vals, ticktext: vals.map(v => String(Number(v.toPrecision(3)))) };
  }

  function solve() {
    const s = tech(), w = [state.w1, state.w2], dem = { B, eps: epsD() }, r = state.r / 100;
    // wiT: the wage rise so far while the "raise w1" animation runs (t from 0 to 1); wi: the full rise.
    return { s, w, dem, r, eq: DM.equilibrium(w, s, dem), el: DM.elasticities(w, s, dem), m: DM.marshall(w, s, dem), wi: DM.whatIf(w, s, dem, r), wiT: DM.whatIf(w, s, dem, r * state.t) };
  }

  // ---------- the lever: (-eps^u_11) is the balance point of weights 1 - sh1 at sigma and sh1 at -eps^D_p ----------

  function drawLever(th, P) {
    const { m } = P, sg = m.sigma, eD = -epsD(), bal = m.weighted, sh = m.sh1;
    const xMax = 1.22 * Math.max(sg, eD, 0.3), bw = 0.035 * xMax;
    const shapes = [], annotations = [];
    const rect = (x0, x1, y0, y1, color, opacity = 1) => shapes.push({ type: 'rect', x0, x1, y0, y1, fillcolor: color, opacity, line: { width: 0 } });
    // Beam, the two weights on it and the fulcrum under the balance point.
    const yB = 1;
    shapes.push({ type: 'line', x0: Math.min(sg, eD) - bw, x1: Math.max(sg, eD) + bw, y0: yB, y1: yB, line: { color: th.ink, width: 4 } });
    const hS = 0.15 + 1.1 * (1 - sh), hD = 0.15 + 1.1 * sh;
    // When the two values (nearly) coincide, put the weights side by side so both stay visible.
    const sep = Math.abs(sg - eD) < 2 * bw ? bw * (sg <= eD ? 1 : -1) : 0;
    rect(sg - bw - sep, sg + bw - sep, yB + 0.04, yB + 0.04 + hS, th.blue, 0.9);
    rect(eD - bw + sep, eD + bw + sep, yB + 0.04, yB + 0.04 + hD, th.red, 0.9);
    shapes.push({ type: 'path', path: `M ${bal} ${yB - 0.04} L ${bal - 1.1 * bw} ${yB - 0.55} L ${bal + 1.1 * bw} ${yB - 0.55} Z`, fillcolor: th.ink, line: { width: 0 } });
    // The bar: the same number split into its two parts.
    const yb0 = -0.95, yb1 = -0.55;
    rect(0, m.substitution, yb0, yb1, th.blue, 0.85);
    rect(m.substitution, bal, yb0, yb1, th.red, 0.85);
    shapes.push({ type: 'line', x0: bal, x1: bal, y0: yb1, y1: yB - 0.55, line: { color: th.muted, width: 1, dash: 'dot' } });
    // Labels.
    // Keep the labels inside the plot and apart from each other.
    const same0 = Math.abs(sg - eD) < 0.3 * xMax;
    const anchor = (x, other) => same0 ? (x <= other ? 'right' : 'left') : x < 0.15 * xMax ? 'left' : x > 0.85 * xMax ? 'right' : 'center';
    annotations.push({ x: sg, y: yB + 0.04 + hS, text: `σ = ${fmt(sg, 2)}<br>weight 1 − sh<sub>1</sub> = ${fmt(1 - sh, 2)}`, showarrow: false, yanchor: 'bottom', xanchor: anchor(sg, eD), font: { size: 12, color: th.blue } });
    annotations.push({ x: eD, y: yB + 0.04 + hD, text: `−ε<sup>D</sup><sub>p</sub> = ${fmt(eD, 2)}<br>weight sh<sub>1</sub> = ${fmt(sh, 2)}`, showarrow: false, yanchor: 'bottom', xanchor: eD === sg ? 'left' : anchor(eD, sg), font: { size: 12, color: th.red } });
    annotations.push({ x: bal + 1.2 * bw, y: yB - 0.4, text: `<b>−ε<sup>u</sup><sub>11</sub> = ${fmt(bal, 3)}</b>`, showarrow: false, xanchor: 'left', yanchor: 'middle', font: { size: 13, color: th.ink } });
    if (m.substitution > 0.09 * xMax) annotations.push({ x: m.substitution / 2, y: (yb0 + yb1) / 2, text: 'σ(1−sh<sub>1</sub>)', showarrow: false, font: { size: 11, color: '#ffffff' } });
    if (bal - m.substitution > 0.12 * xMax) annotations.push({ x: (m.substitution + bal) / 2, y: (yb0 + yb1) / 2, text: '(−ε<sup>D</sup><sub>p</sub>)sh<sub>1</sub>', showarrow: false, font: { size: 11, color: '#ffffff' } });

    Plotly.react('plot', [{ type: 'scatter', mode: 'markers', x: [0, xMax], y: [0, 0], marker: { opacity: 0 }, hoverinfo: 'skip' }], {
      ...U.base2d(th, { xt: 'elasticity (absolute value)', x: { range: [-0.04 * xMax, xMax] }, y: { range: [-1.15, 3.05], visible: false }, shapes, annotations, margin: { l: 16, r: 16, t: 8, b: 44 } })
    }, { ...U.PLOT_CONFIG, displayModeBar: false });

    $('capA').innerHTML = `Weights ${texStr('1-sh_1')} at ${texStr('\\sigma')} and ${texStr('sh_1')} at ${texStr('-\\varepsilon^D_p')} balance at their weighted average, ${texStr('-\\varepsilon^u_{11}')}. The bar below adds the two parts: ${texStr(`\\color{#4a90e2}{${fmt(m.substitution, 3)}}+\\color{#d0021b}{${fmt(m.output, 3)}}=${fmt(bal, 3)}`)}. The bigger labour's cost share, the more the answer is driven by product demand.`;
  }

  // ---------- log-log industry demand for labour vs conditional demand ----------

  function drawDemand(th, P) {
    const { s, w, dem, eq, el, wi } = P, w1 = w[0], q = eq.q;
    const ws = U.logspace(w1 / 4, w1 * 4, 160);
    const D = ws.map(v => [v, DM.industryDemand1([v, w[1]], s, dem)]);
    const H = ws.map(v => [v, DM.conditional1([v, w[1]], s, q)]);
    const z1 = eq.z[0], tan = (slope, k) => [[w1 / k, z1 * Math.pow(k, -slope)], [w1 * k, z1 * Math.pow(k, slope)]];
    const z1n = wi.D1, w1n = w1 * (1 + P.r);
    const traces = [
      U.line2(H, th.blue, 2, 'conditional demand H¹(w, q) at today\'s q', 'dash'),
      U.line2(D, th.ink, 2.5, 'industry demand D¹ = H̃¹·Dem(c(w))'),
      U.line2(tan(el.epsU, 1.9), th.red, 1.5, `slope ε^u_11 = ${fmt(el.epsU, 3)}`, 'dot'),
      U.dot2([[w1n, z1n]], th.red, 'after the wage rise', 9, { marker: { color: th.panel, size: 9, line: { color: th.red, width: 2 } } }),
      U.dot2([[w1, z1]], th.ink, 'today', 10)
    ];
    const all = [...D, ...H].map(p => p[1]).filter(v => v > 0);
    const yLo = Math.min(...all), yHi = Math.max(...all);
    Plotly.react('plotD', traces, U.base2d(th, {
      xt: 'w<sub>1</sub> (log scale)', yt: 'z<sub>1</sub> (log scale)',
      x: { type: 'log', range: [Math.log10(w1 / 4), Math.log10(w1 * 4)], ...logTicks(w1 / 4, w1 * 4) },
      y: { type: 'log', range: [Math.log10(yLo) - 0.05, Math.log10(yHi) + 0.05], ...logTicks(yLo / 1.13, yHi * 1.13) },
      annotations: [
        { x: Math.log10(w1 * 1.9), y: Math.log10(z1 * Math.pow(1.9, el.epsU)), text: `slope ε<sup>u</sup><sub>11</sub> = ${fmt(el.epsU, 2)}`, showarrow: false, xanchor: 'left', yanchor: 'top', font: { size: 12, color: th.red } },
        { x: Math.log10(w1 * 4), y: Math.log10(DM.conditional1([w1 * 4, w[1]], s, q)), text: `slope ε<sup>c</sup><sub>11</sub> = ${fmt(el.epsC, 2)}`, showarrow: false, xanchor: 'right', yanchor: 'top', yshift: -4, font: { size: 12, color: th.blue } }
      ],
      margin: { l: 60, r: 12, t: 8, b: 44 }
    }), U.PLOT_CONFIG);
    $('capD').innerHTML = `<span class="c-ink"><span class="key"></span>industry demand ${texStr('D^1=\\widetilde H^1(w)\\,Dem(c(w))')}</span>; <span class="c-l2-blue"><span class="key dash"></span>conditional demand ${texStr('H^1(w,q)')} at today's output</span>. On log scales the slopes are the elasticities: the industry curve is steeper because a higher wage also cuts output. The hollow point is the industry after a ${fmt(state.r, 0)} % wage rise.`;
  }

  // ---------- the product market ----------

  function drawMarket(th, P) {
    const { dem, eq, wi, wiT } = P, c0 = eq.p, c1 = wiT.after.p, q0 = eq.q, q1 = wiT.after.q;
    const pTop = 1.8 * wi.after.p, pLo = 0.35 * c0, qMax = 1.5 * Math.max(q0, wi.after.q);
    const ps = U.linspace(pLo, pTop, 160).map(p => [DM.demand(p, dem), p]).map(([q, p]) => [q <= qMax * 1.2 ? q : null, p]);
    const traces = [
      U.line2(ps, th.ink, 2.5, 'industry demand Dem(p)'),
      U.line2([[0, c0], [qMax, c0]], th.orange, 2.5, 'supply before: p = c(w)'),
      U.line2([[0, c1], [qMax, c1]], th.orange, 2.5, 'supply after the wage rise', 'dash'),
      U.dot2([[q0, c0]], th.ink, 'equilibrium before', 10),
      U.dot2([[q1, c1]], th.red, 'equilibrium after', 10)
    ];
    const shapes = [q0, q1].map((qq, k) => ({ type: 'line', x0: qq, x1: qq, y0: 0, y1: k ? c1 : c0, line: { color: th.muted, width: 1, dash: 'dot' } }));
    const annotations = [
      { x: q1, y: 0, ax: q0, ay: 0, axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: th.red, text: '' },
      { x: qMax, y: c0, text: 'c(w)', showarrow: false, xanchor: 'right', yanchor: 'top', yshift: -2, font: { size: 12, color: th.orange } },
      { x: qMax, y: c1, text: 'c(w′)', showarrow: false, xanchor: 'right', yanchor: 'bottom', yshift: 2, font: { size: 12, color: th.orange } }
    ];
    Plotly.react('plotC', traces, U.base2d(th, { xt: 'q (industry output)', yt: 'p', x: { range: [0, qMax] }, y: { range: [0, pTop] }, shapes, annotations }), U.PLOT_CONFIG);
    $('capC').innerHTML = `Supply is flat at ${texStr('p=c(w)')}. A ${fmt(state.r, 0)} % wage rise lifts it to ${texStr(`c(w')=${fmt(c1, 3)}`)} (by ${pct(c1 / c0 - 1)}; to first order by ${texStr('sh_1')} × ${fmt(state.r, 0)} % = ${pct(P.m.sh1 * state.r / 100)}), and output falls along ${texStr('Dem(p)')} from ${fmt(q0, 2)} to ${fmt(q1, 2)} (${pct(q1 / q0 - 1)}).`;
  }

  // ---------- inside the firm: the unit isoquant and the cost-minimising unit input requirement ----------

  function drawFirm(th, P) {
    const { s, w, wi, wiT } = P, w1n = w[0] * (1 + P.r * state.t), wn = [w1n, w[1]];
    const h0 = FM.unitDemand(w, s).h, h1 = FM.unitDemand(wn, s).h, c0 = FM.unitCost(w, s), c1 = FM.unitCost(wn, s);
    const zMax = 2.6 * Math.max(h0[0], h0[1], h1[0], h1[1]);
    const iso = FM.isoquant(1, s, zMax, 300);
    const traces = [
      U.line2(iso, th.blue, 2.5, 'unit isoquant φ(z) = 1'),
      U.line2([[c0 / w[0], 0], [0, c0 / w[1]]], th.grey, 1.8, 'isocost before'),
      U.dot2([h0], th.ink, 'H̃(w) before', 10)
    ];
    const annotations = [];
    if (state.t > 0) {
      traces.push(U.line2([[c1 / wn[0], 0], [0, c1 / wn[1]]], th.grey, 1.8, 'isocost after', 'dash'));
      traces.push(U.dot2([h1], th.blue, 'H̃(w′) after', 10));
      if (Math.hypot(h1[0] - h0[0], h1[1] - h0[1]) > 1e-3 * zMax) annotations.push({ x: h1[0], y: h1[1], ax: h0[0], ay: h0[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: th.blue, text: '' });
    }
    Plotly.react('plotF', traces, U.base2d(th, { xt: 'z<sub>1</sub> (labour per unit)', yt: 'z<sub>2</sub> (capital per unit)', x: { range: [0, zMax] }, y: { range: [0, zMax] }, annotations }), U.PLOT_CONFIG);
    $('capF').innerHTML = `Per unit of output the firm uses ${texStr(`\\widetilde H(w)=(${fmt(h0[0], 3)},${fmt(h0[1], 3)})`)}. After a ${fmt(state.r * state.t, 0)} % wage rise it moves along the <span class="c-l2-blue">unit isoquant</span> to ${texStr(`(${fmt(h1[0], 3)},${fmt(h1[1], 3)})`)}: less labour per unit of output (substitution, ${texStr('\\sigma')}). ${s.tech === 'leontief' ? 'With Leontief technology there is no substitution: the point stays put.' : ''}`;
  }

  // ---------- Marshall's rules: |eps^u_11| against sigma, -eps^D_p and sh_1 ----------

  function drawRules(th, P) {
    const { s, w, dem, m } = P, cur = -m.epsU;
    const a = DM.ruleSigma(w, s, dem, U.linspace(0.05, 5, 120));
    const b = DM.ruleEta(w, s, dem, U.linspace(0, 4, 81));
    const c = DM.ruleShare(w, s, dem, U.logspace(0.1, 10, 160));
    const traces = [
      U.line2(a, th.blue, 2, '|ε^u_11| against σ', null, { xaxis: 'x' }), U.dot2([[m.sigma, cur]], th.ink, 'now', 8, { xaxis: 'x' }),
      U.line2(b, th.red, 2, '|ε^u_11| against −ε^D_p', null, { xaxis: 'x2' }), U.dot2([[state.eta, cur]], th.ink, 'now', 8, { xaxis: 'x2' }),
      U.line2(c.map(([sh, v]) => [sh, v]), th.ink, 2, '|ε^u_11| against sh₁', null, { xaxis: 'x3' }), U.dot2([[m.sh1, cur]], th.ink, 'now', 8, { xaxis: 'x3' })
    ];
    const ys = [...a, ...b, ...c].map(p => p[1]).filter(Number.isFinite);
    const base = U.base2d(th, { xt: 'σ', yt: '|ε<sup>u</sup><sub>11</sub>|', x: { domain: [0, 0.28], range: [0, 5] }, y: { range: [0, Math.max(...ys) * 1.08] }, margin: { l: 46, r: 8, t: 8, b: 44 } });
    base.xaxis2 = { ...base.xaxis, domain: [0.36, 0.64], range: [0, 4], title: { ...base.xaxis.title, text: '−ε<sup>D</sup><sub>p</sub>' } };
    base.xaxis3 = { ...base.xaxis, domain: [0.72, 1], range: [0, 1], title: { ...base.xaxis.title, text: 'sh<sub>1</sub> (via w<sub>1</sub>)' } };
    Plotly.react('plotR', traces, base, { ...U.PLOT_CONFIG, displayModeBar: false });
    const sg = m.sigma, eta = state.eta;
    $('capR').innerHTML = `Labour demand is more elastic when substitution is easier (left) and when consumers react more to the product price (middle). Along the wage (right) ${texStr('(-\\varepsilon^u_{11})=\\sigma+(-\\varepsilon^D_p-\\sigma)\\,sh_1')}: it rises with labour's cost share only if ${texStr('-\\varepsilon^D_p>\\sigma')} (Hicks' qualification of Marshall's third rule). ${s.tech === 'cobb' ? 'With σ = 1 the share does not move with the wage.' : `Here ${texStr(`-\\varepsilon^D_p=${fmt(eta, 2)}`)} ${eta > sg ? '>' : eta < sg ? '<' : '='} ${texStr(`\\sigma=${fmt(sg, 2)}`)}.`}`;
  }

  // ---------- formulas with numerical checks ----------

  function renderChecks(P) {
    const { s, el, m, wi, eq } = P;
    const item = (good, html) => `<li><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const sigmaText = s.tech === 'cobb' ? '1\\ \\text{(Cobb-Douglas)}' : s.tech === 'leontief' ? '0\\ \\text{(Leontief)}' : `\\tfrac{1}{1-\\rho}=${f(m.sigma)}`;
    $('checks').innerHTML = [
      item(same(el.sigma, m.sigma), `Theorem 1: ${texStr(`\\sigma=\\frac{C_{12}C}{C_1C_2}=${f(el.sigma)}`)} <span class="c-muted">technology: ${texStr(`\\sigma=${sigmaText}`)}</span>`),
      item(same(el.epsC, m.epsC), `Corollary: ${texStr(`\\varepsilon^c_{11}=-\\sigma(1-sh_1)=${f(m.epsC)}`)} <span class="c-muted">slope of ${texStr('H^1')}: ${f(el.epsC)}</span>`),
      item(same(el.epsU, el.epsC + epsD() * el.sh1), `(†) ${texStr(`\\varepsilon^u_{11}=\\varepsilon^c_{11}+\\varepsilon^D_p\\,sh_1=${f(el.epsC)}+(${f(epsD())})(${f(el.sh1)})=${f(el.epsC + epsD() * el.sh1)}`)} <span class="c-muted">slope of ${texStr('D^1')}: ${f(el.epsU)}</span>`),
      item(same(-el.epsU, m.weighted), `Marshall: ${texStr(`(-\\varepsilon^u_{11})=\\color{#4a90e2}{${f(m.sigma)}\\cdot${f(1 - m.sh1)}}+\\color{#d0021b}{${f(-epsD())}\\cdot${f(m.sh1)}}=${f(m.weighted)}`)}`)
    ].join('');
    $('readouts').innerHTML = [
      ['sh_1=w_1z_1/C', fmt(eq.sh1, 4)],
      ['p=c(w),\\ q=Dem(p)', `${fmt(eq.p, 3)}, ${fmt(eq.q, 3)}`],
      ['z_1,\\ z_2', `${fmt(eq.z[0], 3)}, ${fmt(eq.z[1], 3)}`],
      [`\\Delta D^1/D^1`, `${pct(wi.pct)} <span class="c-muted">exact, for ${texStr(`w_1`)} up ${fmt(state.r, 0)} %</span>`],
      [`\\varepsilon^u_{11}\\times${fmt(state.r, 0)}\\,\\%`, `${pct(wi.approx)} <span class="c-muted">first-order approximation</span>`]
    ].map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ces: state.tech === 'ces' });
    const P = solve(), th = U.theme(), fo = FU.techFormula(P.s);
    tex($('formula-general'), fo.general, true);
    tex($('formula-numbers'), fo.numbers, true);
    guard('lever', () => drawLever(th, P));
    guard('demand plot', () => drawDemand(th, P));
    guard('product market', () => drawMarket(th, P));
    guard('inside the firm', () => drawFirm(th, P));
    guard("Marshall's rules", () => drawRules(th, P));
    guard('formulas', () => renderChecks(P));
  }

  function init() {
    U.renderStaticTex();
    U.controls(document, state, { onChange: schedule });
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    // Animate the wage rise: both channels move together.
    $('raise').addEventListener('click', () => {
      const t0 = performance.now(), dur = 1400;
      const step = now => { state.t = Math.min(1, (now - t0) / dur); render(); if (state.t < 1) requestAnimationFrame(step); };
      state.t = 0; requestAnimationFrame(step);
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js') && (DM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
