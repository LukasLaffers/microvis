/*
 * Homogeneous and Homothetic: interface and plotting (lecture 1).
 */
(function () {
  'use strict';

  const TM = window.TechModel, HM = window.HomModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { cls: 'homogeneous', shape: 'ces', delta: 0.5, rho: -1, k: 1, Fh: 'sshape', s: 3, c: 2, a: 2, dq: 1, R: 6 };
  const RAYS = [2.5, 1, 0.4], NLEV = 10;
  let lastR = null;
  const schedule = U.scheduler(render);
  const f2 = v => fmt(v, 2), f3 = v => fmt(v, 3), n = U.num;
  const rayColors = th => [th.accent2, th.accent4, th.accent3];

  // ---------- formula ----------

  // General form in symbols, then the current values (as in the other tools).
  function formula() {
    const gTex = state.shape === 'cd' ? 'g(z)=z_1^{\\delta}z_2^{1-\\delta}' : 'g(z)=\\big(\\delta z_1^{\\rho}+(1-\\delta)z_2^{\\rho}\\big)^{1/\\rho}';
    const gVals = state.shape === 'cd' ? `\\delta=${n(state.delta)}` : `\\delta=${n(state.delta)},\\ \\rho=${n(state.rho)}`;
    let src;
    if (state.cls === 'homogeneous') src = `\\phi(z)=g(z)^{k}\\\\ ${gTex}\\\\ ${gVals},\\ k=${n(state.k)}`;
    else if (state.cls === 'homothetic') {
      const F = state.Fh === 'log' ? 'F(x)=c\\ln(1+x)' : 'F(x)=\\frac{s^2x^2}{s^2+x^2}';
      src = `\\phi(z)=F\\big(g(z)\\big),\\quad ${F}\\\\ ${gTex}\\\\ ${gVals},\\ ${state.Fh === 'log' ? `c=${n(state.c)}` : `s=${n(state.s)}`}`;
    } else src = `\\phi(z)=a\\sqrt{z_1}+z_2\\\\ a=${n(state.a)}`;
    tex($('formula'), `\\begin{gathered}${src}\\end{gathered}`, true);
  }

  // ---------- the isoquant map ----------

  function drawMap(th, S) {
    const R = state.R, levs = HM.levels(S, state.dq, NLEV), cols = rayColors(th), traces = [], annotations = [];
    levs.forEach(q => {
      const pts = TM.isoquant(q, S, R);
      if (pts.length < 2) return;
      traces.push(U.line2(pts, th.accent, 1.8, `q = ${f2(q)}`));
      const end = pts[pts.length - 1];
      // label where the isoquant leaves the box (right or top edge)
      const lab = end[0] >= R * 0.98 ? end : pts[0];
      annotations.push({ x: lab[0], y: lab[1], text: n(q), showarrow: false, xanchor: lab === end ? 'right' : 'left', yanchor: 'bottom', xshift: lab === end ? -2 : 8, font: { size: 11, color: th.accent } });
    });
    RAYS.forEach((r, i) => {
      const s = R / Math.max(1, r);
      traces.push(U.line2([[0, 0], [s, r * s]], cols[i], 1.5, `ray z₂/z₁ = ${r}`, 'dot'));
      levs.forEach(q => {
        const p = TM.pointOnRay(r, q, S);
        if (!p || p[0] > R || p[1] > R) return;
        const m = TM.mrts(p, S);
        traces.push(U.line2(HM.tangentSegment(p, m, 0.13 * R), cols[i], 2.5, ''));
        traces.push(U.dot2([p], cols[i], `q = ${f2(q)}, MRTS = ${f3(m)}`, 7));
      });
    });
    const draw = lastR === R ? Plotly.react : Plotly.newPlot;
    lastR = R;
    draw('plot', traces, U.base2d(th, {
      xt: 'z<sub>1</sub>', yt: 'z<sub>2</sub>', x: { range: [0, R], constrain: 'domain' }, y: { range: [0, R], scaleanchor: 'x', constrain: 'domain' },
      annotations, margin: { l: 44, r: 10, t: 8, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const spacing = {
      homogeneous: state.k === 1 ? 'With k = 1 the isoquants are equally spaced along every ray: doubling the inputs doubles output.'
        : state.k > 1 ? `With k = ${n(state.k)} > 1 the isoquants bunch up further out: each extra Δq needs a smaller step along the ray (increasing returns).`
          : `With k = ${n(state.k)} < 1 the isoquants spread out: each extra Δq needs a longer step along the ray (decreasing returns).`,
      homothetic: state.Fh === 'log' ? 'The isoquants spread out faster and faster: the logarithmic F gives ever stronger decreasing returns.'
        : `Close to the origin the isoquants bunch up (increasing returns), further out they spread (decreasing returns, beyond g = ${n(state.s)}). No single degree k describes this.`,
      neither: 'The tangents along each ray are not parallel: the MRTS changes as you scale up, so the isoquants are not blow-ups of one another.'
    }[state.cls];
    $('cap').innerHTML = `<span class="c-accent"><span class="key"></span>Isoquants</span> at ${texStr(`q=${f2(state.dq)},\\ ${f2(2 * state.dq)},\\dots`)} and three rays with the tangents where they cross the isoquants. ${spacing}`;
  }

  // ---------- along the rays ----------

  function drawRays(th, S) {
    const cols = rayColors(th), amax = 3, al = U.linspace(0.05, amax, 120);
    const tq = [], tm = [];
    let mmax = 0;
    RAYS.forEach((r, i) => {
      const pts = HM.alongRay(r, S, state.dq, al);
      tq.push(U.line2(pts.map(p => [p.alpha, p.q / state.dq]), cols[i], i === 1 ? 3 : 2.5, `ray z₂/z₁ = ${r}`, i === 1 ? 'solid' : i === 0 ? 'dash' : 'dot'));
      tm.push(U.line2(pts.map(p => [p.alpha, p.mrts]), cols[i], 2.5, `ray z₂/z₁ = ${r}`));
      mmax = Math.max(mmax, ...pts.map(p => p.mrts).filter(Number.isFinite));
    });
    if (state.cls === 'homogeneous') tq.unshift(U.line2(al.map(a => [a, Math.pow(a, state.k)]), th.muted, 6, `α^k`, 'solid', { opacity: 0.25 }));
    const top = Math.min(10, Math.max(...tq.flatMap(t => t.y).filter(Number.isFinite)) * 1.05);
    Plotly.react('plotQ', tq, U.base2d(th, {
      xt: 'α  (multiple of the bundle on the first isoquant)', yt: 'q / Δq', x: { range: [0, amax] }, y: { range: [0, top], dtick: 1 },
      margin: { l: 44, r: 10, t: 6, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    Plotly.react('plotM', tm, U.base2d(th, {
      xt: 'α  (multiple of the bundle on the first isoquant)', yt: 'MRTS<sub>21</sub>', x: { range: [0, amax] }, y: { range: [0, Math.min(mmax * 1.15, 12)] },
      margin: { l: 44, r: 10, t: 6, b: 42 }
    }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('capQ').innerHTML = {
      homogeneous: `All three rays lie on one curve, ${texStr(`\\phi(\\alpha\\hat z)=\\alpha^{${n(state.k)}}\\,\\Delta q`)} (the wide grey line): if ${texStr('\\hat z')} produces ${texStr('\\Delta q')}, then ${texStr('\\alpha\\hat z')} produces ${texStr('\\alpha^k\\Delta q')}. A ray crosses the isoquant ${texStr('j\\Delta q')} where its curve crosses the gridline ${texStr('j')}.`,
      homothetic: `All three rays still lie on one curve, ${texStr('F(\\alpha\\,g(\\hat z))')}, the same for every input mix, but it is not ${texStr('\\alpha^k')} for any ${texStr('k')}.`,
      neither: 'The three rays give three different curves: how output grows with scale depends on the input mix.'
    }[state.cls];
    $('capM').innerHTML = state.cls === 'neither'
      ? 'The MRTS changes as you move out along a ray: the isoquants are not radial blow-ups.'
      : `Flat lines: the MRTS depends only on the input mix ${texStr('z_2/z_1')}, not on the scale. ${state.cls === 'homogeneous' ? `Reason: ${texStr('\\phi_j')} is homogeneous of degree ${texStr('k-1')}, so ${texStr('\\alpha^{k-1}')} cancels in ${texStr('\\phi_1/\\phi_2')}.` : `Reason: ${texStr("F'")} cancels in ${texStr("\\phi_1/\\phi_2=F'g_1/(F'g_2)")}.`}`;
  }

  // ---------- checks ----------

  function renderChecks(S) {
    const r = 1, z = TM.pointOnRay(r, state.dq, S), z2 = [2 * z[0], 2 * z[1]], z3 = [3 * z[0], 3 * z[1]];
    const q1 = TM.phi(z, S), q2 = TM.phi(z2, S), q3 = TM.phi(z3, S);
    const m1 = TM.mrts(z, S), m2 = TM.mrts(z2, S);
    const homog = state.cls === 'homogeneous', homoth = state.cls !== 'neither';
    const kk = Math.log(q2 / q1) / Math.log(2), kk2 = Math.log(q3 / q2) / Math.log(1.5);
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const items = [
      item(homog, homog
        ? `<b>Homogeneous of degree ${texStr(`k=${n(state.k)}`)}.</b> On the middle ray: ${texStr(`\\phi(2\\hat z)=${f3(q2)}=2^{${n(state.k)}}\\cdot${f3(q1)}`)}.`
        : `<b>Not homogeneous.</b> Doubling ${texStr('\\hat z')} multiplies output by ${f3(q2 / q1)} (as if ${texStr(`k=${f2(kk)}`)}), but going from ${texStr('2\\hat z')} to ${texStr('3\\hat z')} acts like ${texStr(`k=${f2(kk2)}`)}: no single degree fits.`),
      item(homoth, homoth
        ? `<b>Homothetic.</b> ${texStr(`MRTS_{21}(\\hat z)=${f3(m1)}=MRTS_{21}(2\\hat z)`)}: the MRTS is the same all along each ray.`
        : `<b>Not homothetic.</b> ${texStr(`MRTS_{21}(\\hat z)=${f3(m1)}`)} but ${texStr(`MRTS_{21}(2\\hat z)=${f3(m2)}`)}.`)
    ];
    if (homog) {
      const p1 = TM.grad(z, S)[0], p2 = TM.grad(z2, S)[0];
      items.push(`<li><span class="mark na">·</span><span>${texStr('\\phi_1')} is homogeneous of degree ${texStr(`k-1=${n(state.k - 1)}`)}: ${texStr(`\\phi_1(2\\hat z)=${f3(p2)}=2^{${n(state.k - 1)}}\\cdot${f3(p1)}`)}.</span></li>`);
    }
    items.push(`<li><span class="mark na">·</span><span>${homog ? 'Every homogeneous function is homothetic: take F(x) = x<sup>k</sup> and g = φ<sup>1/k</sup>.' : homoth ? 'Homothetic but not homogeneous: the converse of “homogeneous ⇒ homothetic” fails.' : 'Neither homogeneous nor homothetic.'}</span></li>`);
    $('checks').innerHTML = items.join('');
    $('keynums').innerHTML = `<span class="kn ${homog ? 'yes' : 'no'}">${homog ? `homogeneous, ${texStr(`k=${n(state.k)}`)}` : 'not homogeneous'}</span><span class="kn ${homoth ? 'yes' : 'no'}">${homoth ? 'homothetic' : 'not homothetic'}</span>`;
  }

  function render() {
    let S = HM.tech(state);
    // An S-shaped F never reaches its ceiling s²: keep the step between isoquants below it, so that isoquants exist.
    const top = TM.maxOutput(S), dqMax = Number.isFinite(top) ? Math.min(3, Math.floor(0.9 * top * 20) / 20) : 3;
    if (Math.abs(ctrls.dq.max - dqMax) > 1e-9) ctrls.dq.setRange(0.25, Math.max(0.25, dqMax));
    if (state.dq > ctrls.dq.max) { state.dq = ctrls.dq.max; ctrls.dq.sync(); S = HM.tech(state); }
    U.applyVisibility({ shape: state.cls !== 'neither', ces: state.shape === 'ces', homogeneous: state.cls === 'homogeneous', homothetic: state.cls === 'homothetic', neither: state.cls === 'neither', sshape: state.Fh === 'sshape', log: state.Fh === 'log' });
    document.querySelectorAll('[data-cls]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cls === state.cls)));
    formula();
    const th = U.theme();
    guard('isoquant map', () => drawMap(th, S));
    guard('ray plots', () => drawRays(th, S));
    guard('checks', () => renderChecks(S));
  }

  let ctrls = null;
  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: (k, v) => (k === 'rho' && Math.abs(v) < 0.05 ? (v < 0 ? -0.05 : 0.05) : v), onChange: schedule });
    document.querySelectorAll('[data-cls]').forEach(b => b.addEventListener('click', () => { state.cls = b.dataset.cls; schedule(); }));
    $('shape').addEventListener('change', e => { state.shape = e.target.value; schedule(); });
    $('Fh').addEventListener('change', e => { state.Fh = e.target.value; schedule(); });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(TM && HM, 'model.js')) guard('page', init);
})();
