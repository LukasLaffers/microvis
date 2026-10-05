/*
 * Substitution and Income Effects: interface and plotting (lecture 6).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, SM = window.SlutskyModel, U = window.Microvis, CU = window.ConsumerUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const PRESETS = {
    normal: { type: 'ces', delta: 0.5, rho: -1, p1: 2, p1n: 1, p2: 1, y: 10 },
    giffen: { type: 'giffen', p1: 2.5, p1n: 2, p2: 1, y: 5 }
  };
  const state = { a: 0.4, g1: 1, g2: 1, ...PRESETS.normal };
  let ctrls = {};
  const schedule = U.scheduler(render);
  const f3 = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => state.type === 'ces' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.type === 'stonegeary' ? { type: 'stonegeary', a: state.a, g1: state.g1, g2: state.g2 } : { type: 'giffen', c: 1, s: 4 };

  function solve() {
    const u = pref(), p = [state.p1, state.p2];
    return { u, p, d: SM.decompose(p, state.y, u, state.p1n), cls: SM.classify(p, state.y, u) };
  }

  function draw(th, S) {
    const { u, p, d } = S, y = state.y, pn = [state.p1n, state.p2];
    // Each axis up to its largest intercept (no common scale: the Giffen example lives in a narrow strip).
    const Lx = 1.12 * y / Math.min(p[0], pn[0]), Ly = 1.12 * y / p[1];
    const x1s = U.linspace(Lx / 500, Lx, 400), ic = v => CM.indifferenceCurve(v, u, x1s).map(([a, b]) => [a, b !== null && b <= Ly * 1.05 ? b : null]);
    const L = Math.max(Lx, Ly);
    const line = (m, q, color, width, name, dash) => U.line2([[m / q[0], 0], [0, m / q[1]]], color, width, name, dash);
    const traces = [
      U.line2(ic(d.v0), th.muted, 1.8, 'indifference curve v⁰'),
      U.line2(ic(d.v1), th.muted, 1.8, 'indifference curve v¹', 'dot'),
      line(y, p, th.ink, 2, `budget at p₁ = ${fmt(p[0])}`),
      line(y, pn, th.ink, 2, `budget at p₁′ = ${fmt(pn[0])}`, 'dash'),
      line(d.yc, pn, th.blue, 1.6, 'compensated budget (new prices, old utility)', 'dot'),
      U.dot2([d.E1], th.ink, 'E₁', 11), U.dot2([d.E2], th.blue, 'E₂', 11), U.dot2([d.E3], th.red, 'E₃', 11)
    ];
    const annotations = [];
    const arrow = (a, b, color) => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) > L * 0.01) annotations.push({ x: b[0], y: b[1], ax: a[0], ay: a[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: color, text: '' }); };
    arrow(d.E1, d.E2, th.blue); arrow(d.E2, d.E3, th.red);
    const lab = (pt, text, color, ax) => annotations.push({ x: pt[0], y: pt[1], text, showarrow: false, xanchor: ax, yanchor: 'bottom', xshift: ax === 'left' ? 8 : -8, yshift: 4, font: { size: 14, color } });
    lab(d.E1, 'E<sub>1</sub>', th.ink, 'right'); lab(d.E2, 'E<sub>2</sub>', th.blue, 'left'); lab(d.E3, 'E<sub>3</sub>', th.red, 'left');
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, Lx] }, y: { range: [0, Ly] }, annotations, margin: { l: 48, r: 12, t: 8, b: 44 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    const fall = pn[0] < p[0];
    $('head').textContent = S.cls.kind === 'giffen' ? 'A Giffen good: the income effect wins' : S.cls.kind === 'inferior' ? 'An inferior good' : 'A normal good';
    $('cap').innerHTML = `The price of good 1 ${fall ? 'falls' : 'rises'} from ${fmt(p[0])} to ${fmt(pn[0])}. ${texStr('E_1\\to E_2')}: <span class="c-l2-blue">substitution</span> along the indifference curve ${texStr('v^0')}, to where its slope equals the new price ratio (the dotted blue line is the budget line that would just let her stay on ${texStr('v^0')}, with income ${texStr(`C(p',v^0)=${f3(d.yc)}`)}). ${texStr('E_2\\to E_3')}: <span class="c-l2-red">income effect</span>, a parallel shift to the actual new budget line.` +
      (S.cls.kind === 'giffen' ? ` Here the income effect on good 1 (${f3(d.income[0])}) outweighs the substitution effect (${f3(d.substitution[0])}): she buys ${fall ? 'less' : 'more'} of good 1 although it got ${fall ? 'cheaper' : 'dearer'}.` : '');
  }

  function drawDemand(th, S) {
    const { u, p, d } = S, lo = Math.min(p[0], state.p1n), hi = Math.max(p[0], state.p1n);
    // The Giffen example is defined for interior solutions only: (y - p2 s)/c < p1 <= (y - p2 s/2)/c, with c = 1, s = 4.
    const ps = state.type === 'giffen'
      ? U.linspace(Math.max(0.3, (state.y - 4 * p[1]) * 1.02, 0.3), Math.max((state.y - 2 * p[1]), lo + 0.1), 120)
      : U.linspace(Math.max(0.3, lo * 0.6), hi * 1.5, 120);
    const D = SM.marshallCurve(p[1], state.y, u, ps), H = SM.hicksCurve(p[1], d.v0, u, ps);
    const xs = [...D, ...H].map(q => q[0]).filter(Number.isFinite);
    Plotly.react('plotB', [
      U.line2(H, th.blue, 2.2, 'Hicksian H¹(p₁, p₂, v⁰)', 'dash'),
      U.line2(D, '#4caf50', 2.5, 'Marshallian D¹(p₁, p₂, y)'),
      U.dot2([[d.E1[0], p[0]]], th.ink, 'E₁', 9), U.dot2([[d.E2[0], state.p1n]], th.blue, 'E₂', 9), U.dot2([[d.E3[0], state.p1n]], th.red, 'E₃', 9)
    ], U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'p<sub>1</sub>', x: { range: [0, Math.max(...xs) * 1.1] } }), U.PLOT_CONFIG);
    const k = S.cls.kind;
    $('capB').innerHTML = `<span style="color:#4caf50"><span class="key"></span>Marshallian</span> and <span class="c-l2-blue"><span class="key dash"></span>Hicksian</span> demand through ${texStr('E_1')}. ` +
      (k === 'normal' ? 'For a normal good the Marshallian curve is flatter: the income effect adds to the substitution effect.' : k === 'inferior' ? 'For an inferior good (not Giffen) the Marshallian curve is steeper than the Hicksian one.' : 'For a Giffen good the Marshallian curve slopes upwards; the Hicksian curve still slopes down.') +
      ' Only the Marshallian curve can be observed.';
  }

  function renderNumbers(S) {
    const { u, p, d, cls } = S;
    $('table').innerHTML = `<thead><tr><th></th><th>good 1</th><th>good 2</th></tr></thead><tbody>` +
      `<tr class="row-sub"><th>substitution ${texStr('E_2-E_1')}</th><td>${f3(d.substitution[0])}</td><td>${f3(d.substitution[1])}</td></tr>` +
      `<tr class="row-inc"><th>income ${texStr('E_3-E_2')}</th><td>${f3(d.income[0])}</td><td>${f3(d.income[1])}</td></tr>` +
      `<tr><th>total ${texStr('E_3-E_1')}</th><td>${f3(d.total[0])}</td><td>${f3(d.total[1])}</td></tr></tbody>`;
    const s = CM.slutsky(p, state.y, u, 0, 0), e = CM.elasticities(p, state.y, u);
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const kindTxt = { normal: '<span class="badge-kind c-inc">normal</span>', inferior: '<span class="badge-kind c-l2-orange">inferior</span>', giffen: '<span class="badge-kind c-l2-red">Giffen</span>' }[cls.kind];
    $('checks').innerHTML = [
      item(same(s.total, s.substitution + s.income), `At ${texStr(`p_1=${fmt(p[0])}`)}: ${texStr(`\\frac{\\partial D^1}{\\partial p_1}=${f3(s.total)}=\\color{#4a90e2}{${f3(s.substitution)}}\\color{#d0021b}{${s.income < 0 ? '' : '+'}${f3(s.income)}}`)}`),
      item(same(e.eu[0][0], e.ec[0][0] - e.eta[0] * e.b[0]), `${texStr(`\\varepsilon^u_{11}=${f3(e.eu[0][0])}=\\varepsilon^c_{11}-\\eta_1b_1=${f3(e.ec[0][0])}-(${f3(e.eta[0])})(${f3(e.b[0])})`)}`),
      `<li><span class="mark na">·</span><span>Good 1 is ${kindTxt}: ${texStr(`\\eta_1=${f3(e.eta[0])}`)}${cls.kind === 'giffen' ? `, ${texStr(`\\varepsilon^u_{11}=${f3(e.eu[0][0])}>0`)}` : ''}.</span></li>`
    ].join('');
  }

  function render() {
    U.applyVisibility({ ces: state.type === 'ces', stonegeary: state.type === 'stonegeary', giffen: state.type === 'giffen' });
    document.querySelectorAll('[data-preset]').forEach(b => { const P = PRESETS[b.dataset.preset]; b.setAttribute('aria-pressed', String(Object.keys(P).every(k => state[k] === P[k]))); });
    $('type').value = state.type;
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('demand plot', () => drawDemand(th, S));
    guard('numbers', () => renderNumbers(S));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: CU.adjustRho, onChange: schedule });
    $('type').addEventListener('change', e => { state.type = e.target.value; schedule(); });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const P = PRESETS[b.dataset.preset];
      Object.entries(P).forEach(([k, v]) => { state[k] = v; if (ctrls[k]) ctrls[k].sync(); });
      schedule();
    }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (SM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
