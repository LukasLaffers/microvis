/*
 * UMP and EMP: Two Sides of One Tangency: interface and plotting (lecture 6).
 */
(function () {
  'use strict';

  const CM = window.ConsumerModel, DM = window.DualityModel, U = window.Microvis, CU = window.ConsumerUI;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { reveal: false, view: 'ump', type: 'ces', delta: 0.4, rho: -1, a: 0.4, g1: 1, g2: 0.5, kappa: 5, p1: 1, p2: 1, y: 10, v: 4 };
  let ctrls = {};
  const schedule = U.scheduler(render);
  const f3 = x => fmt(x, 3);
  const same = (a, b) => Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => state.type === 'ces' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.type === 'stonegeary' ? { type: 'stonegeary', a: state.a, g1: state.g1, g2: state.g2 } : { type: 'quasilinear', kappa: state.kappa };

  function solve() {
    const u = pref(), p = [state.p1, state.p2];
    // UMP: given y; EMP: given v. Each view also computes the other side of the duality.
    let y = state.y, v = state.v;
    if (state.view === 'ump') v = CM.indirect(p, y, u); else y = CM.expenditure(p, v, u);
    const x = CM.demand(p, y, u);
    return { u, p, y, v, x };
  }

  function draw(th, S) {
    const { u, p, y, v, x } = S, L = 1.15 * Math.max(y / p[0], y / p[1]);
    const x1s = U.linspace(L / 400, L, 300), ic = lev => CM.indifferenceCurve(lev, u, x1s).map(([a, b]) => [a, b !== null && b <= L * 1.05 ? b : null]);
    const traces = [], annotations = [];
    const line = (m, color, width, name, dash) => U.line2([[m / p[0], 0], [0, m / p[1]]], color, width, name, dash);
    if (state.view === 'ump') {
      traces.push({ type: 'scatter', mode: 'lines', x: [0, y / p[0], 0, 0], y: [0, 0, y / p[1], 0], fill: 'toself', fillcolor: 'rgba(155,155,155,0.25)', line: { width: 0 }, hoverinfo: 'skip', name: 'budget set' });
      traces.push(line(y, th.ink, 2.5, 'budget line p·x = y'));
      for (const [k, lab] of [[0.75, 'lower: affordable, not best'], [1.3, 'higher: not affordable']]) {
        const lv = state.type === 'quasilinear' ? v + (k - 1) * Math.abs(v) : v * k;
        traces.push(U.line2(ic(lv), th.muted, 1.2, lab, 'dot'));
      }
      traces.push(U.line2(ic(v), th.blue, 3, `indifference curve V(p,y) = ${f3(v)}`));
    } else {
      for (const k of [0.75, 1.25]) traces.push(line(y * k, th.grey, 1.2, k < 1 ? 'cheaper: cannot reach v' : 'dearer: not the cheapest', 'dash'));
      traces.push(line(y, th.ink, 2.5, `cheapest expenditure line p·x = C(p,v) = ${f3(y)}`));
      traces.push(U.line2(ic(v), th.blue, 3, `indifference curve U = v = ${f3(v)}`));
    }
    traces.push(U.dot2([x], th.red, state.view === 'ump' ? 'D(p,y)' : 'H(p,v)', 12));
    annotations.push({ x: x[0], y: x[1], text: state.view === 'ump' ? 'x* = D(p, y)' : 'x* = H(p, v)', showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 8, font: { size: 13, color: th.red } });
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, L], constrain: 'domain' }, y: { range: [0, L], scaleanchor: 'x', constrain: 'domain' }, annotations, margin: { l: 48, r: 12, t: 8, b: 44 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('head').textContent = state.view === 'ump' ? 'Reach the highest indifference curve (UMP)' : 'Reach v at the lowest cost (EMP)';
    $('cap').innerHTML = state.view === 'ump'
      ? `<span class="c-muted"><span class="key dotted"></span>Dotted</span>: a lower indifference curve (affordable, not the best) and a higher one (not affordable). With income ${texStr(`y=${f3(y)}`)} the best affordable bundle is ${texStr(`D(p,y)=(${f3(x[0])},${f3(x[1])})`)} on the indifference curve ${texStr(`V(p,y)=${f3(v)}`)}. Switch to EMP: asked to reach ${texStr(`v=${f3(v)}`)} at least cost, the consumer picks the same bundle and spends exactly ${texStr('y')}.`
      : `<span class="c-muted"><span class="key dash"></span>Dashed</span>: a cheaper line that cannot reach ${texStr('v')} and a dearer one that is not the cheapest. To reach ${texStr(`v=${f3(v)}`)} the cheapest bundle is ${texStr(`H(p,v)=(${f3(x[0])},${f3(x[1])})`)}, costing ${texStr(`C(p,v)=${f3(y)}`)}. A consumer with that income maximising utility would choose the same bundle.`;
  }

  function renderChecks(S) {
    const { u, p, y, v } = S, I = DM.identities(p, y, v, u), E = DM.envelope(p, y, v, u);
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    const vec = a => `(${f3(a[0])},${f3(a[1])})`;
    $('ident').innerHTML = [
      item(same(I.C_of_V.lhs, I.C_of_V.rhs), `${texStr(`C(p,V(p,y))=${f3(I.C_of_V.lhs)}=y`)}`),
      item(same(I.V_of_C.lhs, I.V_of_C.rhs), `${texStr(`V(p,C(p,v))=${f3(I.V_of_C.lhs)}=v`)}`),
      item(same(I.D_is_H.lhs[0], I.D_is_H.rhs[0]) && same(I.D_is_H.lhs[1], I.D_is_H.rhs[1]), `${texStr(`D(p,y)=${vec(I.D_is_H.lhs)}=H(p,V(p,y))`)}`),
      item(same(I.H_is_D.lhs[0], I.H_is_D.rhs[0]) && same(I.H_is_D.lhs[1], I.H_is_D.rhs[1]), `${texStr(`H(p,v)=${vec(I.H_is_D.lhs)}=D(p,C(p,v))`)}`)
    ].join('');
    const x = CM.demand(p, y, u), interior = x[0] > 1e-6 && x[1] > 1e-6, a = 2;
    const xa = CM.demand([a * p[0], a * p[1]], a * y, u);
    $('props').innerHTML = [
      item(same(p[0] * x[0] + p[1] * x[1], y), `(M1) adding up: ${texStr(`p^tD(p,y)=${f3(p[0] * x[0] + p[1] * x[1])}=y`)}`),
      item(same(xa[0], x[0]) && same(xa[1], x[1]), `(M2) ${texStr('D(2p,2y)=D(p,y)')}; (E3) ${texStr(`C(2p,v)=${f3(CM.expenditure([2 * p[0], 2 * p[1]], v, u))}=2C(p,v)`)}`),
      interior ? item(same(E.kkt[0], E.kkt[1]), `Tangency, interior: ${texStr(`MRS_{21}=\\frac{U_1}{U_2}=${f3(E.kkt[0] * p[0] / (E.kkt[1] * p[1]))}=\\frac{p_1}{p_2}`)}`)
        : `<li><span class="mark na">·</span><span>Corner solution: ${texStr('x_j^\\ast=0')} for one good, where ${texStr('U_j\\le\\lambda^\\ast p_j')}.</span></li>`,
      item(same(E.roy, E.D1), `(I5) Roy's identity: ${texStr(`-\\frac{\\partial V/\\partial p_1}{\\partial V/\\partial y}=${f3(E.roy)}=D^1(p,y)`)}`),
      item(same(E.shephard, E.H1), `(E5) Shephard's lemma: ${texStr(`\\frac{\\partial C}{\\partial p_1}=${f3(E.shephard)}=H^1(p,v)`)}`)
    ].join('');
    // lambda* and mu* answer an exercise: hidden until "Check your answer"
    const btn = $('reveal');
    btn.textContent = state.reveal ? 'Hide the answer' : 'Check your answer';
    btn.setAttribute('aria-pressed', String(state.reveal));
    $('mult').hidden = !state.reveal;
    $('mult').innerHTML = [
      interior ? item(same(E.kkt[0], E.lambda), `(UMP) ${texStr(`\\lambda^\\ast=\\frac{U_1}{p_1}=\\frac{U_2}{p_2}=\\frac{\\partial V}{\\partial y}=${f3(E.lambda)}`)}: the utility of one more unit of income`)
        : item(true, `(UMP) ${texStr(`\\lambda^\\ast=\\frac{\\partial V}{\\partial y}=${f3(E.lambda)}`)}: the utility of one more unit of income`),
      item(true, `(EMP) ${texStr(`\\mu^\\ast=\\frac{\\partial C}{\\partial v}=${f3(E.mu)}`)}: the cost of one more unit of utility`),
      item(same(E.lambda * E.mu, 1), `${texStr(`\\lambda^\\ast\\mu^\\ast=${f3(E.lambda)}\\cdot${f3(E.mu)}=${f3(E.lambda * E.mu)}`)}: at the same tangency ${texStr('\\lambda^\\ast=1/\\mu^\\ast')}`)
    ].join('');
  }

  function drawCurves(th, S) {
    const { u, p, y, v } = S, ps = U.linspace(0.3, 4, 120);
    const Vc = DM.curveV(p[1], y, u, ps), Cc = DM.curveC(p[1], v, u, ps), H1 = CM.hicks(p, v, u)[0], Cnow = CM.expenditure(p, v, u);
    Plotly.react('plotV', [U.line2(Vc, th.blue, 2.5, 'V(p₁, p₂, y)'), U.dot2([[p[0], v]], th.ink, 'now', 8)], U.base2d(th, { xt: 'p<sub>1</sub>', yt: 'V(p, y)', margin: { l: 52, r: 8, t: 6, b: 40 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    // the tangent sampled at the same prices as C, so the gap between them (concavity, E4) can be shaded
    const tan = Cc.map(([q]) => [q, Cnow + H1 * (q - p[0])]);
    const gap = { ...U.line2(Cc, th.red, 0, ''), fill: 'tonexty', fillcolor: 'rgba(155,155,155,0.35)', hoverinfo: 'skip' };
    Plotly.react('plotC', [U.line2(tan, th.muted, 1.5, 'tangent, slope H¹ (Shephard)', 'dash'), gap, U.line2(Cc, th.red, 2.5, 'C(p₁, p₂, v)'), U.dot2([[p[0], Cnow]], th.ink, 'now', 8)], U.base2d(th, { xt: 'p<sub>1</sub>', yt: 'C(p, v)', y: { range: [0, Math.max(...Cc.map(q => q[1])) * 1.1] }, margin: { l: 52, r: 8, t: 6, b: 40 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('capVC').innerHTML = `Top: maximal utility falls as ${texStr('p_1')} rises (I2). Bottom: the expenditure function rises with ${texStr('p_1')} (E2) and is concave (E4): it lies below its tangent (the grey gap), whose slope is ${texStr(`H^1(p,v)=${f3(H1)}`)} (E5).`;
  }

  function render() {
    U.applyVisibility({ ces: state.type === 'ces', stonegeary: state.type === 'stonegeary', quasilinear: state.type === 'quasilinear', ump: state.view === 'ump', emp: state.view === 'emp' });
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    // Stone–Geary: income must cover the subsistence bundle (else utility, demand and the identities are meaningless)
    const note = CU.fitIncome(ctrls.y, state, 'y', pref(), [[state.p1, state.p2]]);
    $('income-note').hidden = !(note && state.view === 'ump'); $('income-note').textContent = note;
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('checks', () => renderChecks(S));
    guard('curves', () => drawCurves(th, S));
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: CU.adjustRho, onChange: schedule });
    $('type').addEventListener('change', e => { state.type = e.target.value; state.reveal = false; schedule(); });
    $('reveal').addEventListener('click', () => { state.reveal = !state.reveal; schedule(); });
    // Switching view keeps the same tangency: the EMP target is the current V(p,y), the UMP income the current C(p,v).
    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const S = solve();
      if (b.dataset.view === 'emp') ctrls.v.setExact(S.v); else ctrls.y.setExact(S.y);
      state.view = b.dataset.view; schedule();
    }));
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (DM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
