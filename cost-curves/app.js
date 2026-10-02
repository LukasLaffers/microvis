/*
 * Cost Curves and Supply: interface and plotting (lecture 2, Step 2 (PM')).
 * All math comes from shared/firm-model.js (window.FirmModel); this file only draws it.
 */
(function () {
  'use strict';

  const FM = window.FirmModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, linspace, guard } = U;

  const state = {
    profile: 'ushape', a: 2, m: 1, k: 0.6, A: 1,
    p: 8, w1: 1, w2: 1, tech: 'cobb', delta: 0.5, rho: -0.5, qmax: 6
  };
  const tech = () => ({ tech: state.tech, delta: state.delta, rho: state.rho, profile: state.profile, A: state.A, k: state.k, a: state.a, m: state.m });
  const prices = () => [state.w1, state.w2];

  let ctrls = {};
  const schedule = U.scheduler(render);

  // Price range: 0-20 for 'ushape', up to 3 MC(qmax/2) for 'homog'.
  const priceMax = () => state.profile === 'ushape' ? 20 : Math.max(1, 3 * FM.MC(prices(), state.qmax / 2, tech()));

  function solve() {
    const s = tech(), w = prices(), p = state.p, c = FM.unitCost(w, s);
    const S = FM.supply(w, p, s), hat = FM.minAC(w, s);
    const qs = S.kind === 'interior' ? S.q : S.kind === 'indifferent' ? S.q : 0;
    const Pi = FM.profit(w, p, s);
    const Cqq = q => { const h = 1e-5 * Math.max(1, q); return (FM.MC(w, q + h, s) - FM.MC(w, Math.max(q - h, 1e-12), s)) / (q + h - Math.max(q - h, 1e-12)); };
    return { s, w, p, c, S, hat, qs, Pi, Cqq };
  }

  const isHomog = () => state.profile === 'homog';
  const kOne = () => Math.abs(state.k - 1) < 1e-9;

  // ---------- main plot: MC, AC, supply ----------

  function drawMain(th, P) {
    const { s, w, p, S, hat, qs, Pi } = P, qmax = state.qmax, traces = [], annotations = [], shapes = [];
    const pm = priceMax(), yMax = Math.max(0.6 * pm, 1.25 * p, hat.pHat ? 1.6 * hat.pHat : 0, 1);
    const qq = linspace(qmax / 600, qmax, 600);
    const mc = qq.map(q => FM.MC(w, q, s)), ac = qq.map(q => FM.AC(w, q, s));
    const clip = v => (Number.isFinite(v) && v < yMax * 3 ? v : null);
    const box = (text) => annotations.push({ xref: 'paper', yref: 'paper', x: 0.98, y: 0.98, xanchor: 'right', yanchor: 'top', align: 'left', showarrow: false, text, font: { size: 12, color: th.ink }, bgcolor: th.panel, bordercolor: th.line, borderpad: 6 });

    // Supply curve underneath everything else.
    if (!isHomog()) {
      const above = qq.map((q, i) => [q, mc[i]]).filter(v => v[0] >= hat.qHat);
      traces.push(U.line2([[0, 0], [0, hat.pHat]], th.orange, 5, 'supply: q = 0 below p̂'));
      traces.push(U.line2(above.map(v => [v[0], clip(v[1])]), th.orange, 5, 'supply S(w,p)'));
    } else if (state.k < 1 - 1e-9) {
      traces.push(U.line2(qq.map((q, i) => [q, clip(mc[i])]), th.orange, 5, 'supply S(w,p)'));
    } else if (kOne()) {
      traces.push(U.line2([[0, 0], [0, hat.pHat]], th.orange, 5, 'supply'));
      traces.push(U.line2([[0, hat.pHat], [qmax, hat.pHat]], th.orange, 5, 'supply (any q at p = c/A)'));
    }

    traces.push(U.line2(qq.map((q, i) => [q, clip(ac[i])]), th.ink, 2, 'AC = C/q'));
    traces.push(U.line2(qq.map((q, i) => [q, clip(mc[i])]), th.red, 2.5, 'MC = C_q'));
    const lastIn = arr => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null && clip(arr[i]) !== null && arr[i] <= 0.9 * yMax) return i; return -1; };
    const iMc = lastIn(mc), iAc = lastIn(ac);
    if (iMc >= 0) annotations.push({ x: qq[iMc], y: mc[iMc], text: 'MC = C<sub>q</sub>', showarrow: false, xanchor: 'right', yanchor: 'bottom', xshift: -4, font: { color: th.red, size: 13 } });
    if (iAc >= 0 && !(isHomog() && kOne())) annotations.push({ x: qq[iAc], y: ac[iAc], text: 'AC = C/q', showarrow: false, xanchor: 'right', yanchor: 'top', yshift: -4, font: { color: th.ink, size: 13 } });

    // The shutdown point (q^, p^) and the part of MC that is never observed.
    if (!isHomog()) {
      shapes.push({ type: 'line', x0: 0, x1: hat.qHat, y0: hat.pHat, y1: hat.pHat, line: { color: th.orange, width: 1, dash: 'dash' } });
      shapes.push({ type: 'line', x0: hat.qHat, x1: hat.qHat, y0: 0, y1: hat.pHat, line: { color: th.orange, width: 1, dash: 'dash' } });
      traces.push(U.dot2([[hat.qHat, hat.pHat]], th.orange, 'min AC: (q̂, p̂)', 12));
      annotations.push({ x: 0, y: hat.pHat, text: 'p̂', showarrow: false, xanchor: 'right', xshift: -6, font: { color: th.orange, size: 14 } });
      annotations.push({ x: hat.qHat, y: 0, text: 'q̂', showarrow: false, yanchor: 'top', yshift: -16, font: { color: th.orange, size: 14 } });
      const qn = (state.a + hat.qHat) / 2;
      annotations.push({ x: qn, y: FM.MC(w, qn, s), ax: 50, ay: 40, showarrow: true, arrowhead: 0, arrowcolor: th.muted, text: 'this part of the MC curve<br>is not observed', align: 'left', font: { size: 11, color: th.muted } });
    }

    // Price line.
    shapes.push({ type: 'line', x0: 0, x1: qmax, y0: p, y1: p, line: { color: th.muted, width: 1.5, dash: 'dash' } });
    annotations.push({ x: qmax, y: p, text: 'p', showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { size: 14, color: th.muted } });

    // Optimum and profit rectangle; special cases get a boxed message.
    if (S.kind === 'unbounded' && !kOne()) {
      box('Increasing returns to scale: MC is falling and lies below AC.<br>Profit grows without limit for any price, so there is<br>no optimal output under price taking (compare lecture 1:<br>a > 1 is not meaningful).');
    } else if (kOne()) {
      box(S.kind === 'zero' ? 'Price below unit cost: produce nothing.' : S.kind === 'indeterminate' ? 'Any output is optimal (zero profit).' : 'Profit grows without limit: no optimal output.');
      if (S.kind === 'zero') traces.push(U.dot2([[0, p]], th.ink, 'q* = 0', 12));
    } else {
      if (S.kind === 'indifferent') box('Indifferent between q = 0 and q = q̂ (zero profit).');
      if (Pi > 1e-9) {
        const acq = FM.AC(w, qs, s);
        shapes.push({ type: 'rect', x0: 0, x1: qs, y0: acq, y1: p, fillcolor: th.profitFill, line: { width: 0 }, layer: 'below' });
        annotations.push({ x: qs / 2, y: (acq + p) / 2, text: 'profit Π(w,p)', showarrow: false, font: { size: 12, color: th.inc } });
      }
      if (qs > 0) {
        shapes.push({ type: 'line', x0: qs, x1: qs, y0: 0, y1: p, line: { color: th.ink, width: 1, dash: 'dot' } });
        annotations.push({ x: qs, y: 0, text: 'q* = S(w,p)', showarrow: false, yanchor: 'bottom', xanchor: 'left', xshift: 4, yshift: 4, font: { size: 12, color: th.ink } });
        traces.push(U.dot2([[qs, p]], th.ink, 'optimum (q*, p)', 13));
      }
      if (S.kind === 'zero' || S.kind === 'indifferent') traces.push(U.dot2([[0, p]], th.ink, 'q* = 0', 12));
    }

    Plotly.react('plot', traces, U.base2d(th, {
      xt: 'q', yt: 'p', x: { range: [0, qmax] }, y: { range: [0, yMax] }, annotations, shapes,
      margin: { l: 52, r: 16, t: 10, b: 48 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
  }

  // ---------- revenue and cost; profit ----------

  function drawSide(th, P) {
    const { s, w, p, S, qs, Pi } = P, qmax = state.qmax, qq = linspace(0, qmax, 400);
    const C = qq.map(q => FM.cost(w, q, s)), R = qq.map(q => p * q), prof = qq.map((q, i) => R[i] - C[i]);
    const bounded = S.kind !== 'unbounded' && S.kind !== 'indeterminate';
    const top = p * qmax * 1.1;

    const annR = [];
    if (bounded && Pi > 1e-9) {
      annR.push({ x: qs, y: p * qs, ax: qs, ay: FM.cost(w, qs, s), axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, startarrowhead: 2, arrowside: 'end+start', arrowcolor: th.inc, arrowwidth: 2, text: '' });
      annR.push({ x: qs, y: (p * qs + FM.cost(w, qs, s)) / 2, text: 'Π(w,p)', showarrow: false, xanchor: 'left', xshift: 6, font: { color: th.inc, size: 12 } });
    }
    Plotly.react('plotR', [
      U.line2(qq.map((q, i) => [q, R[i]]), th.ink, 2, 'revenue pq', 'dash'),
      U.line2(qq.map((q, i) => [q, C[i] < 3 * top ? C[i] : null]), th.red, 2.5, 'cost C(w,q)')
    ], U.base2d(th, { xt: 'q', yt: 'value', x: { range: [0, qmax] }, y: { range: [0, top] }, annotations: annR }), U.PLOT_CONFIG);

    const finite = prof.filter(Number.isFinite), pmaxV = Math.max(...finite, 1), pminV = Math.min(...finite);
    const lo = Math.max(pminV, -1.2 * pmaxV) - 0.1 * pmaxV;
    const annP = [], tr = [U.line2(qq.map((q, i) => [q, prof[i]]), th.red, 2.5, 'profit pq − C(w,q)')];
    if (bounded && qs > 0) tr.push(U.dot2([[qs, Pi]], th.ink, 'maximum at q*', 12));
    if (S.kind === 'zero') tr.push(U.dot2([[0, 0]], th.ink, 'maximum at q = 0', 12));
    if (S.kind === 'unbounded') annP.push({ xref: 'paper', x: 0.98, y: prof[prof.length - 1], xanchor: 'right', yanchor: 'bottom', showarrow: false, text: 'unbounded →', font: { color: th.red, size: 13 } });
    Plotly.react('plotP', tr, U.base2d(th, {
      xt: 'q', yt: 'pq − C(w,q)', x: { range: [0, qmax] }, y: { range: [lo, pmaxV * 1.2] }, annotations: annP,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: th.muted, width: 1.5 } }]
    }), U.PLOT_CONFIG);
  }

  // ---------- readouts ----------

  function renderReadouts(P) {
    const { s, w, S, hat, qs, Pi, Cqq, c } = P;
    let qText;
    switch (S.kind) {
      case 'zero': qText = '0 (shut down)'; break;
      case 'indeterminate': qText = 'any'; break;
      case 'unbounded': qText = 'none (unbounded)'; break;
      case 'indifferent': qText = `0 or ${fmt(qs, 3)}`; break;
      default: qText = fmt(qs, 3);
    }
    const has = S.kind === 'interior' && qs > 0 || S.kind === 'indifferent';
    const e = has ? FM.scaleElasticity(qs, s) : null;
    const rtsLabel = e === null ? '' : Math.abs(e - 1) < 1e-9 ? 'constant' : e < 1 ? 'decreasing' : 'increasing';
    const soc = has ? Cqq(qs) : null;
    const rows = [
      ['q^\\ast=S(w,p)', qText],
      ['MC(w,q^\\ast)', has ? fmt(FM.MC(w, qs, s), 3) : '—'],
      ['AC(w,q^\\ast)', has ? fmt(FM.AC(w, qs, s), 3) : '—'],
      ['\\Pi(w,p)', S.kind === 'unbounded' ? '∞' : fmt(Math.abs(Pi) < 1e-9 ? 0 : Pi, 3)],
      ['\\hat p,\\ \\hat q', hat.pHat === null ? 'no minimum of AC' : `${fmt(hat.pHat, 3)}, ${hat.qHat === null ? 'any q' : fmt(hat.qHat, 3)}`],
      ['C_{qq}(w,q^\\ast)\\ge0?', soc === null ? '—' : soc >= -1e-9 ? `<span class="ok-mark">✓</span> ${fmt(soc, 3)}` : `<span class="no-mark">✗</span> ${fmt(soc, 3)}`],
      ['e(H(w,q^\\ast))=AC/MC', e === null ? '—' : `${fmt(e, 3)} <span class="badge ${rtsLabel}">${rtsLabel}</span>`]
    ];
    // Lecture 3, homogeneous case: AC/MC = k at every q (shown at q*, or at q = 1 when there is no optimum).
    if (isHomog()) {
      const qe = has ? qs : 1;
      rows.push(['AC/MC=k', `${fmt(FM.AC(w, qe, s) / FM.MC(w, qe, s), 3)} = k = ${fmt(s.k)}${has ? '' : ' <span class="c-muted">(at q = 1)</span>'}`]);
    }
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    let sentence;
    if (S.kind === 'unbounded') sentence = 'Profit has no maximum: with constant or increasing returns to scale and a fixed price, producing more always pays. Price taking and increasing returns do not fit together.';
    else if (S.kind === 'indeterminate') sentence = `With constant returns and ${texStr('p=c(w)/A')}, every output gives zero profit.`;
    else if (S.kind === 'zero') sentence = `The price is below the lowest average cost ${texStr(`\\hat p=${fmt(hat.pHat === null ? 0 : hat.pHat)}`)}: every positive output loses money, so the firm shuts down.`;
    else if (S.kind === 'indifferent') sentence = `At ${texStr('p=\\hat p')} the firm earns zero profit both at ${texStr('q=0')} and at ${texStr('\\hat q')}: the supply curve jumps here.`;
    else sentence = `At ${texStr('q^\\ast')} the elasticity of scale is ${fmt(e)} ${e < 1 ? '< 1: decreasing returns to scale, as the second order condition and p ≥ AC require.' : '≥ 1: this cannot be a profit maximum.'}`;
    $('sentence').innerHTML = sentence;
    $('unit-cost').innerHTML = `Unit cost ${texStr(`c(w)=${fmt(c, 3)}`)}.`;
  }

  // ---------- render loop ----------

  function render() {
    U.applyVisibility({ ushape: state.profile === 'ushape', homog: state.profile === 'homog', ces: state.tech === 'ces' });
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
    ctrls.p.setRange(0, Number(priceMax().toFixed(2)));
    if (state.p > ctrls.p.max) { state.p = ctrls.p.max; ctrls.p.sync(); }
    // The badge next to k.
    const kl = Math.abs(state.k - 1) < 1e-9 ? 'constant' : state.k < 1 ? 'decreasing' : 'increasing';
    ctrls.k.hintEl.className = 'badge ' + kl;
    ctrls.k.hintEl.textContent = `${kl} returns to scale`;
    const s = tech();
    tex($('formula-G'), s.profile === 'ushape'
      ? `\\begin{gathered}C(w,q)=c(w)\\,G(q)\\\\ G(q)=\\tfrac13q^3-${U.num(s.a)}q^2+${U.num(s.a * s.a + s.m)}q\\end{gathered}`
      : `\\begin{gathered}C(w,q)=c(w)\\,(q/A)^{1/k}\\\\ =c(w)\\,(q/${U.num(s.A)})^{${U.num(1 / s.k)}}\\end{gathered}`, true);
    const P = solve(), th = U.theme();
    // Lecture 3 corollary with the current numbers (homogeneous profile only).
    if (isHomog()) {
      const c = U.num(P.c), e = U.num((1 - s.k) / s.k), inv = U.num(1 / s.k), Aterm = s.A === 1 ? '' : `\\,${U.num(s.A)}^{-${inv}}`;
      tex($('homog-formulas'), s.A === 1
        ? `\\begin{gathered}C(w,q)=c(w)\\,q^{1/k}=${c}\\,q^{${inv}}\\\\ AC=c(w)\\,q^{\\frac{1-k}{k}}=${c}\\,q^{${e}},\\quad MC=\\tfrac1k c(w)\\,q^{\\frac{1-k}{k}}=${U.num(P.c / s.k)}\\,q^{${e}}\\end{gathered}`
        : `\\begin{gathered}C(w,q)=c(w)\\,(q/A)^{1/k}=${c}\\,(q/${U.num(s.A)})^{${inv}}\\\\ AC=c(w)A^{-1/k}q^{\\frac{1-k}{k}}=${c}${Aterm}\\,q^{${e}},\\quad MC=\\tfrac1k\\,AC\\end{gathered}`, true);
    }
    guard('cost plot', () => drawMain(th, P));
    guard('side plots', () => drawSide(th, P));
    guard('readouts', () => renderReadouts(P));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => { state.profile = b.dataset.profile; schedule(); }));
    $('tech').addEventListener('change', e => { state.tech = e.target.value; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(FM, 'shared/firm-model.js')) guard('page', init);
})();
