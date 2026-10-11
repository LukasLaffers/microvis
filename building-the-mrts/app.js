/*
 * Building the MRTS: interface and plotting (lecture 1).
 */
(function () {
  'use strict';

  const MM = window.MrtsModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { tech: 'cd', A: 1, alpha: 0.4, beta: 0.6, a: 1, b: 2, delta: 0.4, rho: -1, q: 2, r: 1, dz: 0.8, R: 6, x: 'z1', pins: [] };
  const PIN_LABELS = ['ẑ', 'z', 'z*'], PIN_TEX = ['\\hat z', 'z', 'z^*'];
  let ctrls = {}, lastR = null;
  const schedule = U.scheduler(render);
  const f2 = v => fmt(v, 2), f3 = v => fmt(v, 3);
  const T = () => {
    switch (state.tech) {
      case 'cd': return { tech: 'cd', A: state.A, alpha: state.alpha, beta: state.beta };
      case 'linear': return { tech: 'linear', a: state.a, b: state.b };
      case 'leontief': return { tech: 'leontief', a: state.a, b: state.b };
      default: return { tech: 'ces', A: state.A, delta: state.delta, rho: state.rho };
    }
  };
  const pinColors = th => [th.orange, th.blue, th.red];
  const big = m => (m === Infinity ? '∞' : Number.isNaN(m) ? 'not defined' : f3(m));

  // ---------- formula ----------

  function formula(t) {
    const n = U.num;
    const F = {
      cd: () => [`\\phi(z)=Az_1^{\\alpha}z_2^{\\beta}`, `A=${n(t.A)},\\ \\alpha=${n(t.alpha)},\\ \\beta=${n(t.beta)}`],
      linear: () => ['\\phi(z)=az_1+bz_2', `a=${n(t.a)},\\ b=${n(t.b)}`],
      leontief: () => ['\\phi(z)=\\min\\{az_1,bz_2\\}', `a=${n(t.a)},\\ b=${n(t.b)}`],
      ces: () => ['\\phi(z)=A\\big(\\delta z_1^{\\rho}+(1-\\delta)z_2^{\\rho}\\big)^{1/\\rho}', `A=${n(t.A)},\\ \\delta=${n(t.delta)},\\ \\rho=${n(t.rho)}`]
    }[t.tech]();
    tex($('formula'), `\\begin{gathered}${F[0]}\\\\ ${F[1]}\\end{gathered}`, true);
  }

  // ---------- the isoquant ----------

  // A line through p with slope -m, clipped to the box [0, R]^2 (vertical for m = Infinity).
  function tangentLine(p, m, R) {
    if (m === Infinity) return [[p[0], 0], [p[0], R]];
    const half = R * 0.42, d = [1, -m], n = Math.hypot(d[0], d[1]);
    const a = [p[0] - half * d[0] / n, p[1] - half * d[1] / n], b = [p[0] + half * d[0] / n, p[1] + half * d[1] / n];
    return clip(a, b, R);
  }

  // Clip the segment ab to the box [0, R]^2 (Liang-Barsky).
  function clip(a, b, R) {
    let t0 = 0, t1 = 1;
    const d = [b[0] - a[0], b[1] - a[1]];
    for (const [p, q] of [[-d[0], a[0]], [d[0], R - a[0]], [-d[1], a[1]], [d[1], R - a[1]]]) {
      if (p === 0) { if (q < 0) return []; continue; }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    }
    if (t0 > t1) return [];
    return [[a[0] + t0 * d[0], a[1] + t0 * d[1]], [a[0] + t1 * d[0], a[1] + t1 * d[1]]];
  }

  function drawIsoquant(th, t) {
    const R = state.R, q = state.q, z = MM.pointOnRay(state.r, q, t), m = MM.mrts(z, t);
    const traces = [];
    // the ray through z-bar
    const s = R / Math.max(z[0], z[1]);
    traces.push(U.line2([[0, 0], [s * z[0], s * z[1]]], th.muted, 1, '', 'dot'));
    traces.push(U.line2(MM.isoquant(q, t, R), th.ink, 3, `isoquant q̄ = ${f2(q)}`));
    // pins: point and tangent
    const cols = pinColors(th);
    state.pins.forEach((r, i) => {
      const p = MM.pointOnRay(r, q, t), mp = MM.mrts(p, t);
      if (!Number.isNaN(mp)) traces.push(U.line2(tangentLine(p, mp, R), cols[i], 2, '', 'dash'));
      traces.push(U.dot2([p], cols[i], PIN_LABELS[i], 12));
    });
    // the step triangle
    const annotations = [], st = MM.step(z, state.dz, q, t), x2 = z[0] + state.dz;
    traces.push(U.line2([z, [x2, z[1]]], th.accent, 3, 'Δz₁'));
    if (st.z2new !== null) traces.push(U.line2([[x2, z[1]], [x2, st.z2new]], th.accent2, 4, 'what can be given up'));
    if (Number.isFinite(m)) {
      const off = 0.012 * R;
      traces.push(U.line2([[x2 + off, z[1]], [x2 + off, z[1] - m * state.dz]], th.accent3, 2.5, 'MRTS · Δz₁', 'dash'));
    }
    annotations.push({ x: (z[0] + x2) / 2, y: z[1], text: 'Δz<sub>1</sub>', showarrow: false, yanchor: 'bottom', yshift: 2, font: { size: 12, color: th.accent } });
    if (st.z2new !== null && st.giveUp > 1e-9) annotations.push({ x: x2, y: (z[1] + st.z2new) / 2, text: '−Δz<sub>2</sub>', showarrow: false, xanchor: 'right', xshift: -4, font: { size: 12, color: th.accent2 } });
    // tangent and point
    if (!Number.isNaN(m)) traces.push(U.line2(tangentLine(z, m, R), th.accent3, 2.5, 'tangent, slope −MRTS', 'dash'));
    traces.push(U.dot2([z], th.accent3, 'z̄ (drag it)', 15));
    annotations.push({ x: z[0], y: z[1], text: 'z̄', showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -7, yshift: -3, font: { size: 15, color: th.ink } });
    state.pins.forEach((r, i) => {
      const p = MM.pointOnRay(r, q, t);
      annotations.push({ x: p[0], y: p[1], text: PIN_LABELS[i], showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, yshift: 2, font: { size: 14, color: cols[i] } });
    });
    if (t.tech === 'leontief' && MM.regime(z, t) === 'corner') annotations.push({ x: z[0], y: z[1], ax: 40, ay: -40, text: 'kink: no unique tangent', showarrow: true, arrowhead: 0, arrowcolor: th.muted, font: { size: 12, color: th.muted } });
    // A changed range with equal axis scales needs a fresh plot: Plotly.react would keep the old domain and
    // stretch the range instead.
    const draw = lastR === R ? Plotly.react : Plotly.newPlot;
    lastR = R;
    draw('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>', x: { range: [0, R], constrain: 'domain' }, y: { range: [0, R], scaleanchor: 'x', constrain: 'domain' },
      annotations, margin: { l: 44, r: 10, t: 8, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    return { z, m, st };
  }

  // ---------- the two cuts: phi in z1 alone and in z2 alone ----------

  function drawCut(th, t, which, S) {
    const R = state.R, q = state.q, i = which === 1 ? 0 : 1, xs = U.linspace(0, R, 161);
    const at = (p, x) => (i === 0 ? [x, p[1]] : [p[0], x]);
    const traces = [U.line2([[0, q], [R, q]], th.muted, 1, '', 'dot')];
    const cols = pinColors(th);
    let ymax = q * 1.6;
    const one = (p, color, label, width) => {
      const ys = xs.map(x => MM.phi(at(p, x), t));
      ymax = Math.max(ymax, Math.min(Math.max(...ys), 3.5 * q));
      traces.push(U.line2(xs.map((x, k) => [x, ys[k]]), color, width, label));
      const g = MM.mp(p, t);
      if (g) {
        const sl = g[i], h = R * 0.22;
        traces.push(U.line2([[p[i] - h, q - sl * h], [p[i] + h, q + sl * h]], color, 2, '', 'dash'));
      } else {
        // Leontief corner: the two one-sided slopes
        const c = MM.leontiefCorner(t)[i === 0 ? 'phi1' : 'phi2'], h = R * 0.22;
        traces.push(U.line2([[p[i] - h, q - c.left * h], [p[i], q], [p[i] + h, q + c.right * h]], color, 2, '', 'dash'));
      }
      traces.push(U.dot2([[p[i], q]], color, label, width > 2.5 ? 12 : 10));
    };
    state.pins.forEach((r, k) => one(MM.pointOnRay(r, q, t), cols[k], PIN_LABELS[k], 2));
    one(S.z, th.accent3, 'z̄', 3);
    Plotly.react(`plot${which}`, traces, U.base2d(th, {
      xt: which === 1 ? `z<sub>1</sub>   (z<sub>2</sub> = ${f2(S.z[1])} fixed)` : `z<sub>2</sub>   (z<sub>1</sub> = ${f2(S.z[0])} fixed)`, yt: 'q',
      x: { range: [0, R] }, y: { range: [0, ymax * 1.05] }, margin: { l: 44, r: 10, t: 6, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const g = MM.mp(S.z, t), other = which === 1 ? 'z_2' : 'z_1', me = which === 1 ? 'z_1' : 'z_2';
    let cap;
    if (g) {
      const v = g[i];
      cap = v > 0
        ? `At ${texStr('\\bar z')}: ${texStr(`\\phi_${which}(\\bar z)=${f3(v)}`)}. One more unit of ${texStr(me)} (with ${texStr(other)} fixed) adds about ${f3(v)} units of output.`
        : `At ${texStr('\\bar z')}: ${texStr(`\\phi_${which}(\\bar z)=0`)}. More ${texStr(me)} alone adds nothing: input ${which === 1 ? 2 : 1} is the bottleneck.`;
    } else {
      const c = MM.leontiefCorner(t)[i === 0 ? 'phi1' : 'phi2'];
      cap = `At the kink the cut has a corner: slope ${f2(c.left)} to the left, ${f2(c.right)} to the right. ${texStr(`\\phi_${which}`)} is not defined there.`;
    }
    if (state.pins.length) cap += ` The coloured curves are the same cuts at the pinned points; all points sit at height ${texStr(`\\bar q=${f2(q)}`)}, but with different slopes.`;
    $(`cap${which}`).innerHTML = cap;
  }

  // ---------- the MRTS along the isoquant ----------

  const LOGX = { type: 'log', range: [Math.log10(0.05), Math.log10(20)], tickvals: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20], ticktext: ['0.05', '0.1', '0.2', '0.5', '1', '2', '5', '10', '20'] };

  function drawMrts(th, t, S) {
    const q = state.q, R = state.R, cols = pinColors(th), byRatio = state.x === 'ratio';
    const rs = U.logspace(0.01, 100, 400), traces = [], annotations = [];
    const pts = rs.map(r => { const z = MM.pointOnRay(r, q, t); return { r, z, m: MM.mrts(z, t) }; });
    const X = p => (byRatio ? p.r : p.z[0]);
    let layoutX, layoutY;
    if (t.tech === 'leontief') {
      const c = [q / t.a, q / t.b];
      if (byRatio) {
        const k = t.a / t.b;
        traces.push(U.line2([[0.05, 1e-3], [k, 1e-3]], th.ink, 3, 'MRTS = 0'));
        annotations.push({ x: Math.log10(k), y: Math.log10(1e-3), text: 'corner: z₂/z₁ = a/b', showarrow: true, ax: 0, ay: -40, arrowcolor: th.muted, font: { size: 12, color: th.muted } });
        annotations.push({ x: Math.log10(Math.sqrt(k * 20)), y: Math.log10(1), text: 'MRTS = ∞ for z₂/z₁ > a/b', showarrow: false, font: { size: 12, color: th.ink } });
        layoutX = { ...LOGX }; layoutY = { type: 'log', range: [-3.2, 2], dtick: 1 };
      } else {
        traces.push(U.line2([[c[0], 0], [R, 0]], th.ink, 3, 'MRTS = 0 on the horizontal arm'));
        annotations.push({ x: c[0], y: 0, ax: 0, ay: -120, axref: 'pixel', text: '∞ on the vertical arm', showarrow: true, arrowhead: 2, arrowcolor: th.ink, font: { size: 12, color: th.ink } });
        layoutX = { range: [0, R] }; layoutY = { range: [-0.2, 3] };
      }
    } else {
      const good = pts.filter(p => Number.isFinite(p.m) && p.m > 0 && (byRatio || p.z[0] <= R));
      traces.push(U.line2(good.map(p => [X(p), p.m]), th.ink, 3, 'MRTS₂₁ along the isoquant'));
      if (byRatio) {
        const ms = good.filter(p => p.r >= 0.05 && p.r <= 20).map(p => Math.log10(p.m));
        const lo = Math.min(...ms), hi = Math.max(...ms), pad = Math.max(0.3, (hi - lo) * 0.08);
        layoutX = { ...LOGX }; layoutY = { type: 'log', range: [lo - pad, hi + pad], dtick: hi - lo > 1.2 ? 1 : 'D1' };
      } else {
        const vis = [S.m, ...state.pins.map(r => MM.mrts(MM.pointOnRay(r, q, t), t))].filter(Number.isFinite);
        const top = t.tech === 'linear' ? S.m * 2 + 0.5 : Math.max(...vis) * 1.6 + 0.2;
        layoutX = { range: [0, R] }; layoutY = { range: [0, top] };
      }
    }
    const mark = (r, color, label, size) => {
      const z = MM.pointOnRay(r, q, t), m = MM.mrts(z, t);
      if (!Number.isFinite(m) || (byRatio && m <= 0)) return;
      traces.push(U.dot2([[byRatio ? r : z[0], m]], color, label, size));
    };
    state.pins.forEach((r, i) => mark(r, cols[i], PIN_LABELS[i], 11));
    mark(state.r, th.accent3, 'z̄', 13);
    Plotly.react('plotM', traces, U.base2d(th, {
      xt: byRatio ? 'factor intensity z<sub>2</sub>/z<sub>1</sub> (log scale)' : 'z<sub>1</sub> on the isoquant',
      yt: byRatio ? 'MRTS<sub>21</sub> (log scale)' : 'MRTS<sub>21</sub>',
      x: layoutX, y: layoutY, annotations, margin: { l: 56, r: 12, t: 8, b: 44 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const sg = MM.sigma(t);
    let cap;
    if (byRatio) {
      cap = t.tech === 'leontief'
        ? `Leontief: no substitution at all, ${texStr('\\sigma=0')}. The MRTS jumps from 0 to ${texStr('\\infty')} at the corner.`
        : t.tech === 'linear'
          ? `Linear: the MRTS is ${f3(S.m)} whatever the input mix, a flat line: the input mix can change without any change in the MRTS, ${texStr('\\sigma=\\infty')}.`
          : `On log scales the curve is a straight line with slope ${texStr(`d\\log MRTS_{21}/d\\log\\frac{z_2}{z_1}=1/\\sigma=${f3(1 / sg)}`)}, so ${texStr(`\\sigma=\\frac{d\\log(z_2/z_1)}{d\\log MRTS_{21}}\\Big|_{d\\phi=0}=${f3(sg)}`)}${t.tech === 'cd' ? ' (Cobb-Douglas)' : ''}. The flatter the line, the larger ${texStr('\\sigma')} and the easier substitution.`;
    } else {
      cap = t.tech === 'leontief'
        ? 'Leontief: on the vertical arm extra input 2 is wasted and the isoquant is vertical (MRTS = ∞); on the horizontal arm extra input 1 is wasted (MRTS = 0). At the corner the MRTS is not defined.'
        : t.tech === 'linear'
          ? `Linear: the isoquant is a straight line and the MRTS is the same everywhere, ${texStr(`MRTS_{21}=${f3(S.m)}`)}, so ${texStr('dMRTS_{21}/dz_1=0')}.`
          : `Moving down the isoquant (more ${texStr('z_1')}, less ${texStr('z_2')}) the MRTS falls: ${texStr(`\\frac{dMRTS_{21}}{dz_1}\\Big|_{d\\phi=0}=${f3(MM.dMrtsAlong(S.z, t))}\\le 0`)} at ${texStr('\\bar z')}. A falling MRTS is a convex isoquant.`;
    }
    $('capM').innerHTML = cap;
  }

  // ---------- step by step ----------

  function renderEqs(t, S) {
    const z = S.z, g = MM.mp(z, t), q = state.q, dz = state.dz, st = S.st;
    const lines = [`\\bar z=(${f2(z[0])},\\ ${f2(z[1])}),\\quad \\phi(\\bar z)=\\bar q=${f2(q)}`];
    let text = '';
    if (g) {
      lines.push(`\\begin{aligned}0=dq&=\\phi_1(\\bar z)\\,dz_1+\\phi_2(\\bar z)\\,dz_2\\\\ &=${f3(g[0])}\\,dz_1+${f3(g[1])}\\,dz_2\\end{aligned}`);
      if (g[1] > 0) {
        lines.push(`\\begin{aligned}MRTS_{21}(\\bar z)&=-\\frac{dz_2}{dz_1}\\Big|_{d\\phi=0}=\\frac{\\phi_1(\\bar z)}{\\phi_2(\\bar z)}\\\\ &=\\frac{${f3(g[0])}}{${f3(g[1])}}=${f3(S.m)}\\end{aligned}`);
        text = `A step of ${texStr(`\\Delta z_1=${f2(dz)}`)}: the tangent says ${texStr(`MRTS_{21}\\cdot\\Delta z_1=${f3(S.m * dz)}`)} units of ${texStr('z_2')} can go; staying exactly on the isoquant, ${texStr(`-\\Delta z_2=${f3(st.giveUp)}`)}. ` +
          (t.tech === 'linear' ? 'They are equal: the isoquant is its own tangent.' : Math.abs(S.m * dz - st.giveUp) < 1e-9 ? '' : 'The smaller the step, the closer the two: the MRTS is the rate for small steps.') +
          (t.tech === 'linear' && st.z2new === 0 ? ` (Here the step uses up all of ${texStr('z_2')}.)` : '');
      } else {
        lines.push(`MRTS_{21}(\\bar z)=\\frac{\\phi_1(\\bar z)}{\\phi_2(\\bar z)}=\\frac{${f3(g[0])}}{0}=\\infty`);
        text = `Here ${texStr('\\phi_2=0')}: input 2 is in excess. Even a tiny step ${texStr('\\Delta z_1>0')} frees all the excess ${texStr('z_2')} down to the corner${st.giveUp === null ? '' : ` (${texStr(`-\\Delta z_2=${f3(st.giveUp)}`)})`}, so ${texStr('-\\Delta z_2/\\Delta z_1')} grows without bound as the step shrinks: the isoquant is vertical.`;
      }
      if (g[0] === 0) text = `Here ${texStr('\\phi_1=0')}: input 1 is in excess, so more of it saves no ${texStr('z_2')} at all (${texStr('-\\Delta z_2=0')}): the isoquant is flat and ${texStr('MRTS_{21}=0')}.`;
    } else {
      lines.push('\\phi_1(\\bar z),\\ \\phi_2(\\bar z)\\ \\text{not defined at the kink}');
      text = `At the corner ${texStr('\\phi')} is not differentiable, so the MRTS is not defined: any line between the vertical and the horizontal arm touches the isoquant here. A step ${texStr(`\\Delta z_1=${f2(dz)}`)} saves no ${texStr('z_2')}.`;
    }
    if (t.tech === 'cd' || t.tech === 'ces') {
      const [p1, p2] = MM.mrtsPartials(z, t);
      lines.push(`\\begin{aligned}\\frac{dMRTS_{21}}{dz_1}\\Big|_{d\\phi=0}&=\\frac{\\partial MRTS_{21}}{\\partial z_1}\\\\ &\\quad-\\frac{\\partial MRTS_{21}}{\\partial z_2}MRTS_{21}\\\\ &=${f3(p1)}-(${f3(p2)})(${f3(S.m)})=${f3(MM.dMrtsAlong(z, t))}\\end{aligned}`);
    }
    const block = l => (window.katex ? window.katex.renderToString(l, { throwOnError: false, displayMode: true }) : l);
    $('eqs').innerHTML = lines.map(l => `<div class="eq">${block(l)}</div>`).join('') + `<p class="sentence">${text}</p>`;

    // a table of the current point and the pins
    const rows = [[texStr('\\bar z'), z, 'cur'], ...state.pins.map((r, i) => [`<span class="pin-${i}">${texStr(PIN_TEX[i])}</span>`, MM.pointOnRay(r, q, t), i])];
    const cell = v => (v === null ? '—' : v === Infinity ? '∞' : Number.isNaN(v) ? 'n.d.' : f3(v));
    const table = `<table class="pins"><thead><tr><th></th><th>${texStr('z_1')}</th><th>${texStr('z_2')}</th><th>${texStr('\\phi_1')}</th><th>${texStr('\\phi_2')}</th><th>${texStr('MRTS_{21}')}</th></tr></thead><tbody>` +
      rows.map(([lab, p]) => { const gg = MM.mp(p, t); return `<tr><td>${lab}</td><td>${f2(p[0])}</td><td>${f2(p[1])}</td><td>${gg ? f3(gg[0]) : 'n.d.'}</td><td>${gg ? f3(gg[1]) : 'n.d.'}</td><td>${cell(MM.mrts(p, t))}</td></tr>`; }).join('') + '</tbody></table>';

    const item = (mark, html) => `<li><span class="mark ${mark}">${mark === 'ok' ? '✓' : mark === 'no' ? '✗' : '·'}</span><span>${html}</span></li>`;
    const m2 = MM.mrts([2 * z[0], 2 * z[1]], t), k = MM.degree(t);
    const items = [];
    if (t.tech === 'cd' || t.tech === 'ces') items.push(item('ok', `<b>Diminishing MRTS:</b> it falls along the isoquant as ${texStr('z_1')} rises, so the isoquant is convex.`));
    else if (t.tech === 'linear') items.push(item('ok', `<b>Constant MRTS:</b> ${texStr('dMRTS_{21}/dz_1=0')}, a straight isoquant (still convex).`));
    else items.push(item('na', '<b>Leontief:</b> the MRTS is 0 or ∞, and not defined at the corner.'));
    items.push(item('na', `<b>Along the ray through ${texStr('\\bar z')}</b> the MRTS does not change: at ${texStr('2\\bar z')} it is ${Number.isNaN(m2) ? 'not defined either' : `${big(m2)} too`}, because ${texStr('\\phi')} is homogeneous (of degree ${texStr(`k=${U.num(k)}`)}). As ${texStr('\\bar q')} changes, ${texStr('\\bar z')} slides along its ray with the same slope.`));
    $('checks').innerHTML = items.join('');
    $('eqs').insertAdjacentHTML('beforeend', table);
  }

  // MRTS21 and sigma at z-bar, next to the isoquant.
  function renderKey(t, S) {
    const sg = MM.sigma(t), m = S.m;
    const mTex = Number.isNaN(m) ? '\\text{not defined}' : m === Infinity ? '\\infty' : f3(m);
    const sTex = sg === Infinity ? '\\infty' : sg === 0 ? '0' : f3(sg);
    $('keynums').innerHTML =
      `<span class="kn">${texStr(`MRTS_{21}(\\bar z)=${mTex}`)}</span>` +
      `<span class="kn">${texStr(`\\sigma(\\bar z)=${sTex}`)}</span>`;
  }

  function render() {
    const t = T();
    U.applyVisibility({ cd: t.tech === 'cd', linear: t.tech === 'linear', leontief: t.tech === 'leontief', ces: t.tech === 'ces' });
    document.querySelectorAll('[data-x]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.x === state.x)));
    formula(t);
    const th = U.theme();
    let S = null;
    guard('isoquant', () => { S = drawIsoquant(th, t); });
    if (!S) return;
    guard('cut in z₁', () => drawCut(th, t, 1, S));
    guard('cut in z₂', () => drawCut(th, t, 2, S));
    guard('MRTS plot', () => drawMrts(th, t, S));
    guard('step by step', () => renderEqs(t, S));
    guard('key numbers', () => renderKey(t, S));
  }

  // ---------- dragging the point along the isoquant ----------

  // The point stays on the isoquant: the pointer sets the input mix z2/z1 (the ray through the pointer), q-bar stays.
  function setupDrag() {
    const lim = v => Math.min(ctrls.r.max, Math.max(ctrls.r.min, v));
    U.dragPoint('plot', {
      target: () => MM.pointOnRay(state.r, state.q, T()),
      move: ([x, y]) => { if (x > 1e-6 && y > 1e-6) ctrls.r.setExact(lim(y / x)); }
    });
  }

  function init() {
    U.renderStaticTex();
    // rho = 0 is the Cobb-Douglas limit (its own option): the slider skips it so that the number shown is the number used.
    ctrls = U.controls(document, state, { adjust: (k, v) => (k === 'rho' && Math.abs(v) < 0.05 ? (v < 0 ? -0.05 : 0.05) : v), onChange: schedule });
    $('tech').addEventListener('change', e => {
      state.tech = e.target.value;
      // fit the plot range to the new isoquant: z-bar at about a third of the box
      const z = MM.pointOnRay(state.r, state.q, T());
      ctrls.R.set(U.clampTo(Math.ceil(6 * Math.max(z[0], z[1])) / 2, 2, 20));
      schedule();
    });
    $('pin').addEventListener('click', () => { state.pins = [...state.pins, state.r].slice(-3); schedule(); });
    $('three').addEventListener('click', () => {
      // high, middle and low on the isoquant (for Leontief: the vertical arm, the corner, the horizontal arm);
      // the middle one a little above z-bar so that the two do not hide each other
      const t = T(), cl = v => U.clampTo(v, 0.05, 20);
      state.pins = t.tech === 'leontief' ? [4, 1, 0.25].map(f => cl(f * t.a / t.b)) : [Math.exp(1.5), Math.exp(0.5), Math.exp(-1.5)].map(f => cl(f * state.r));
      schedule();
    });
    $('clear').addEventListener('click', () => { state.pins = []; schedule(); });
    document.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => { state.x = b.dataset.x; schedule(); }));
    setupDrag();
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(MM, 'model.js')) guard('page', init);
})();
