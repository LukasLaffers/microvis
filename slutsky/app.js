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
  const state = { a: 0.4, g1: 1, g2: 1, ...PRESETS.normal, t: 1,
    mode: 'steps', anim: null, playing: false };   // mode: 'steps' (E1 -> E2 -> E3) or 'smooth' (p1 changes gradually)
  let ctrls = {};
  const schedule = U.scheduler(render);
  // While an animation plays, captions and tables are rewritten at most ten times a second (each rewrite lays out the page).
  let writeText = true, lastText = 0;
  const textDue = () => { if (!state.playing) return true; const t = performance.now(); if (t - lastText < 100) return false; lastText = t; return true; };
  const f3 = x => fmt(Math.abs(x) < 5e-10 ? 0 : x, 3);
  const same = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b));
  const pref = () => state.type === 'ces' ? { type: 'ces', delta: state.delta, rho: CU.rhoAway(state.rho) }
    : state.type === 'stonegeary' ? { type: 'stonegeary', a: state.a, g1: state.g1, g2: state.g2 } : { type: 'giffen', c: 1, s: 4 };

  const N = 160;   // steps along the smooth change

  // The smooth change of p1 is computed only in that mode, and again only when a parameter other than t changes.
  let cache = { key: '', path: null };
  function solve() {
    const u = pref(), p = [state.p1, state.p2];
    const S = { u, p, d: SM.decompose(p, state.y, u, state.p1n), cls: SM.classify(p, state.y, u) };
    if (state.mode !== 'smooth') return S;
    const key = JSON.stringify([u, p, state.y, state.p1n]);
    if (cache.key !== key) cache = { key, path: SM.path(p, state.y, u, state.p1n, N), big: null };
    return { ...S, path: cache.path, now: at(cache.path, state.t) };
  }

  // The state of the change at t in [0, 1]: p1, bundle and the accumulated parts (linear between steps).
  function at(P, t) {
    const x = t * N, k = Math.min(N - 1, Math.floor(x)), f = x - k;
    const lerp = (u, v) => Array.isArray(u) ? u.map((ui, i) => ui + (v[i] - ui) * f) : u + (v - u) * f;
    return { p1: lerp(P.p1[k], P.p1[k + 1]), D: lerp(P.D[k], P.D[k + 1]),
      substitution: lerp(P.substitution[k], P.substitution[k + 1]), income: lerp(P.income[k], P.income[k + 1]), k: Math.round(x) };
  }

  // Each axis up to its largest intercept (no common scale: the Giffen example lives in a narrow strip).
  function frame(S) {
    const y = state.y, p = S.p, pn = [state.p1n, state.p2];
    const Lx = 1.12 * y / Math.min(p[0], pn[0]), Ly = 1.12 * y / p[1];
    const x1s = U.linspace(Lx / 500, Lx, 400), few = U.linspace(Lx / 500, Lx, 150);
    const key = JSON.stringify([S.u, p, y, pn]);
    if (icMemo.key !== key) icMemo = { key, map: new Map() };
    const curve = (v, xs) => CM.indifferenceCurve(v, S.u, xs).map(([a, b]) => [a, b !== null && b <= Ly * 1.05 ? b : null]);
    // the fixed curves are computed once; the moving one (n = 'few') with fewer points, as it changes every frame
    const ic = (v, n) => n === 'few' ? curve(v, few) : (icMemo.map.get(v) || (icMemo.map.set(v, curve(v, x1s)), icMemo.map.get(v)));
    return { Lx, Ly, L: Math.max(Lx, Ly), ic };
  }
  let icMemo = { key: '', map: null }, demandMemo = { key: '', D: null, H: null }, lastChecks = 0;
  const budget = (m, q, color, width, name, dash) => U.line2([[m / q[0], 0], [0, m / q[1]]], color, width, name, dash);
  const layout = (th, F, annotations, shapes = []) => U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, F.Lx] }, y: { range: [0, F.Ly] }, annotations, shapes, margin: { l: 48, r: 12, t: 8, b: 44 } });

  // Two pictures: the two-step split E1 -> E2 -> E3 (on load), and the smooth change with slider t.
  const draw = (th, S) => (state.mode === 'smooth' ? drawSmooth : drawSteps)(th, S);

  const headText = S => S.cls.kind === 'giffen' ? 'A Giffen good: the income effect wins' : S.cls.kind === 'inferior' ? 'An inferior good' : 'A normal good';

  // ---------- the two-step split ----------

  // Animation: 0-0.5 substitution (E1 to E2 along v0), 0.5-1 income (E2 to E3).
  const fSub = () => state.anim === null ? 1 : Math.min(1, state.anim / 0.5);
  const fInc = () => state.anim === null ? 1 : Math.max(0, (state.anim - 0.5) / 0.5);

  function drawSteps(th, S) {
    const { u, p, d } = S, y = state.y, pn = [state.p1n, state.p2], F = frame(S), L = F.L;
    const traces = [
      U.line2(F.ic(d.v0), th.muted, 1.8, 'indifference curve v⁰'),
      U.line2(F.ic(d.v1), th.muted, 1.8, 'indifference curve v¹', 'dot'),
      budget(y, p, th.ink, 2, `budget at p₁ = ${fmt(p[0])}`),
      budget(y, pn, th.ink, 2, `budget at p₁′ = ${fmt(pn[0])}`, 'dash'),
      budget(d.yc, pn, th.blue, 1.6, 'compensated budget (new prices, old utility)', 'dot')
    ];
    const annotations = [];
    const lab = (pt, text, color, ax) => annotations.push({ x: pt[0], y: pt[1], text, showarrow: false, xanchor: ax, yanchor: 'bottom', xshift: ax === 'left' ? 8 : -8, yshift: 4, font: { size: 14, color } });
    if (state.anim === null) {
      traces.push(U.dot2([d.E1], th.ink, 'E₁', 11), U.dot2([d.E2], th.blue, 'E₂', 11), U.dot2([d.E3], th.red, 'E₃', 11));
      const arrow = (a, b, color) => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) > L * 0.01) annotations.push({ x: b[0], y: b[1], ax: a[0], ay: a[1], axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowwidth: 2.5, arrowcolor: color, text: '' }); };
      arrow(d.E1, d.E2, th.blue); arrow(d.E2, d.E3, th.red);
      lab(d.E1, 'E<sub>1</sub>', th.ink, 'right'); lab(d.E2, 'E<sub>2</sub>', th.blue, 'left'); lab(d.E3, 'E<sub>3</sub>', th.red, 'left');
    } else {
      // Substitution: along v0 from E1 to E2 (blue). Income: from E2 straight to E3 (red).
      const fs = fSub(), fc = fInc(), n = 60;
      const arc = Array.from({ length: Math.max(1, Math.round(n * fs)) + 1 }, (_, i) => {
        const x1 = d.E1[0] + (d.E2[0] - d.E1[0]) * i / n, x2 = i === 0 ? d.E1[1] : i === n ? d.E2[1] : CM.x2On(x1, d.v0, u);
        return x2 === null ? null : [x1, x2];
      }).filter(Boolean);
      if (arc.length > 1) traces.push(U.line2(arc, th.blue, 4, 'substitution'));
      const now = fs < 1 ? arc[arc.length - 1] : [d.E2[0] + (d.E3[0] - d.E2[0]) * fc, d.E2[1] + (d.E3[1] - d.E2[1]) * fc];
      if (fs >= 1 && fc > 0) traces.push(U.line2([d.E2, now], th.red, 4, 'income'));
      traces.push(U.dot2([d.E1], th.ink, 'E₁', 11)); lab(d.E1, 'E<sub>1</sub>', th.ink, 'right');
      if (fs >= 1) { traces.push(U.dot2([d.E2], th.blue, 'E₂', 11)); lab(d.E2, 'E<sub>2</sub>', th.blue, 'left'); }
      traces.push(U.dot2([now], fs < 1 ? th.blue : th.red, 'moving', 9));
    }
    U.plot('plot', traces, layout(th, F, annotations), { ...U.PLOT_CONFIG, displayModeBar: false });
    const fall = pn[0] < p[0];
    $('head').textContent = headText(S);
    $('cap').innerHTML = `The price of good 1 ${fall ? 'falls' : 'rises'} from ${fmt(p[0])} to ${fmt(pn[0])}. ${texStr('E_1\\to E_2')}: <span class="c-l2-blue">substitution</span> along the indifference curve ${texStr('v^0')}, to where its slope equals the new price ratio (the dotted blue line is the budget line that would just let her stay on ${texStr('v^0')}, with income ${texStr(`C(p',v^0)=${f3(d.yc)}`)}). ${texStr('E_2\\to E_3')}: <span class="c-l2-red">income effect</span>, a parallel shift to the actual new budget line.` +
      (S.cls.kind === 'giffen' ? ` Here the income effect on good 1 (${f3(d.income[0])}) outweighs the substitution effect (${f3(d.substitution[0])}): she buys ${fall ? 'less' : 'more'} of good 1 although it got ${fall ? 'cheaper' : 'dearer'}.` : '');
  }

  // ---------- the smooth change ----------

  function drawSmooth(th, S) {
    const { u, p, d, path, now } = S, y = state.y, F = frame(S), traces = [], annotations = [], shapes = [];
    const pNow = [now.p1, p[1]], D = now.D, vNow = CM.utility(D, u), moved = Math.abs(now.p1 - p[0]) > 1e-9;

    // Where the consumer started (faint) and where she is now (strong): indifference curve and budget line.
    traces.push(U.line2(F.ic(d.v0), th.muted, 1.2, 'indifference curve at the start, v⁰'));
    traces.push(budget(y, p, th.muted, 1.2, `budget at the start, p₁ = ${fmt(p[0])}`, 'dash'));
    traces.push(U.line2(F.ic(vNow, 'few'), th.ink, 2.5, 'indifference curve now'));
    if (moved) traces.push(budget(y, pNow, th.ink, 1.8, 'budget now'));

    // The path of the consumer: travelled (black) and still ahead (faint).
    const k = now.k;
    traces.push(U.line2(path.D.slice(k), th.muted, 1.5, 'still ahead', 'dot'));
    traces.push(U.line2(path.D.slice(0, k + 1).concat([D]), th.ink, 4, 'path of the consumer'));

    // At the current point, both effects at once: substitution along the indifference curve, income across them.
    const sign = Math.sign(state.p1n - state.p1) || 1;
    const vel = x => {
      const sl = [0, 1].map(j => CM.slutsky([x, p[1]], y, u, j, 0));
      return { sub: sl.map(s => s.substitution * sign), inc: sl.map(s => s.income * sign) };
    };
    const ok = v => [...v.sub, ...v.inc].every(Number.isFinite);
    // Arrows, labels and bars are traces (not annotations), so that each frame of the animation only moves points.
    let v = vel(now.p1);
    if (!ok(v)) v = { sub: [0, 0], inc: [0, 0] };
    // one length scale for the whole change, so the arrows' lengths can be compared from moment to moment
    if (cache.big === null) {
      let big = 1e-12;
      for (let i = 0; i <= N; i += 10) { const w = vel(path.p1[i]); if (ok(w)) big = Math.max(big, Math.hypot(...w.sub), Math.hypot(...w.inc), Math.hypot(w.sub[0] + w.inc[0], w.sub[1] + w.inc[1])); }
      cache.big = big;
    }
    const ext = Math.max(...[path.D[N], d.E2].map(z => Math.hypot(z[0] - d.E1[0], z[1] - d.E1[1])), 0.05 * Math.min(F.Lx, F.Ly));
    const len = 0.6 * Math.max(ext, 0.15 * Math.min(F.Lx, F.Ly)) / cache.big, tip = q => [D[0] + q[0] * len, D[1] + q[1] * len], tiny = 1e-3 * ext;
    const tS = tip(v.sub), tI = tip(v.inc), tT = tip([v.sub[0] + v.inc[0], v.sub[1] + v.inc[1]]);
    const far = (z, m) => Math.hypot(z[0] - D[0], z[1] - D[1]) > m;
    traces.push(U.line2(far(tT, tiny) ? [tS, tT] : [], th.red, 1, '', 'dot'), U.line2(far(tT, tiny) ? [tI, tT] : [], th.blue, 1, '', 'dot'));
    traces.push(U.arrow2(D, tS, th.blue, 3, tiny), U.arrow2(D, tI, th.red, 3, tiny), U.arrow2(D, tT, th.ink, 2, tiny));
    const lab = (z, text, color) => U.text2(far(z, 0.04 * ext) ? z : null, ' ' + text + ' ', color, z[0] >= D[0] ? 'middle right' : 'middle left');
    traces.push(lab(tS, 'substitution', th.blue), lab(tI, 'income', th.red));

    // Points.
    const label = (z, text, color, dx) => annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: dx > 0 ? 'left' : 'right', yanchor: 'bottom', xshift: dx, yshift: 4, font: { size: 14, color } });
    traces.push(U.dot2([d.E1], th.ink, 'E₁ = D(p, y)', 10)); label(d.E1, 'E<sub>1</sub>', th.ink, -8);
    traces.push(U.dot2([d.E3], th.muted, "E₃ = D(p′, y)", 9)); label(d.E3, 'E<sub>3</sub>', th.muted, 8);
    traces.push(U.dot2([D], th.ink, 'the consumer now', 13));

    // Bars at the bottom of the figure (changes in x1), growing together: substitution, income and their sum, accumulated so far.
    const row = i => (0.035 + 0.04 * i) * F.Ly;
    const bar = (i, dx, color, width, text) => {
      const show = Math.abs(dx) >= 1e-9;
      traces.push(U.line2(show ? [[d.E1[0], row(i)], [d.E1[0] + dx, row(i)]] : [], color, width, ''));
      traces.push(U.text2(show ? [Math.min(d.E1[0], d.E1[0] + dx), row(i)] : null, text + '  ', color, 'middle left', 11));
    };
    bar(2, now.substitution[0], th.blue, 5, 'substitution');
    bar(1, now.income[0], th.red, 5, 'income');
    bar(0, now.substitution[0] + now.income[0], th.ink, 2.5, 'total');

    U.plot('plot', traces, layout(th, F, annotations, shapes), { ...U.PLOT_CONFIG, displayModeBar: false });
    $('head').textContent = headText(S);
    if (writeText) $('cap').innerHTML = `${texStr(`p_1=${fmt(now.p1)}`)}. She moves along the black path from ${texStr('E_1')} to ${texStr('E_3')}. At every moment she substitutes (blue arrow, along the current indifference curve) and her real income changes (red arrow, to the next indifference curve) at the same time; the two arrows add up to the black one, the direction of the path. The bars at the bottom (changes in ${texStr('x_1')}) grow together: <span class="c-l2-blue">substitution</span> + <span class="c-l2-red">income</span> = total, accumulated so far.`;
  }

  // ---------- demand curves ----------

  function drawDemand(th, S) {
    const { u, p, d } = S, lo = Math.min(p[0], state.p1n), hi = Math.max(p[0], state.p1n);
    // The Giffen example is defined for interior solutions only: (y - p2 s)/c < p1 <= (y - p2 s/2)/c, with c = 1, s = 4.
    const ps = state.type === 'giffen'
      ? U.linspace(Math.max(0.3, (state.y - 4 * p[1]) * 1.02, 0.3), Math.max((state.y - 2 * p[1]), lo + 0.1), 120)
      : U.linspace(Math.max(0.3, lo * 0.6), hi * 1.5, 120);
    // the two curves do not change while p1 moves: computed once per setting
    const key = JSON.stringify([u, p, state.y, state.p1n]);
    if (demandMemo.key !== key) demandMemo = { key, D: SM.marshallCurve(p[1], state.y, u, ps), H: SM.hicksCurve(p[1], d.v0, u, ps) };
    const { D, H } = demandMemo;
    const xs = [...D, ...H].map(q => q[0]).filter(Number.isFinite);
    U.plot('plotB', [
      U.line2(H, th.blue, 2.2, 'Hicksian H¹(p₁, p₂, v⁰)', 'dash'),
      U.line2(D, '#4caf50', 2.5, 'Marshallian D¹(p₁, p₂, y)'),
      ...(S.now ? [U.dot2([[d.E1[0], p[0]]], th.ink, 'E₁', 9), U.dot2([[d.E3[0], state.p1n]], th.muted, 'E₃', 9), U.dot2([[S.now.D[0], S.now.p1]], th.ink, 'now', 12)]
        : [U.dot2([[d.E1[0], p[0]]], th.ink, 'E₁', 9), U.dot2([[d.E2[0], state.p1n]], th.blue, 'E₂', 9), U.dot2([[d.E3[0], state.p1n]], th.red, 'E₃', 9)])
    ], U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'p<sub>1</sub>', x: { range: [0, Math.max(...xs) * 1.1] } }), U.PLOT_CONFIG);
    const k = S.cls.kind;
    $('capB').innerHTML = `<span style="color:#4caf50"><span class="key"></span>Marshallian</span> and <span class="c-l2-blue"><span class="key dash"></span>Hicksian</span> demand through ${texStr('E_1')}. ` +
      (k === 'normal' ? 'For a normal good the Marshallian curve is flatter: the income effect adds to the substitution effect.' : k === 'inferior' ? 'For an inferior good (not Giffen) the Marshallian curve is steeper than the Hicksian one.' : 'For a Giffen good the Marshallian curve slopes upwards; the Hicksian curve still slopes down.') +
      ' Only the Marshallian curve can be observed.';
  }

  function renderNumbers(S) {
    const TH = U.theme();   // the colours of the two effects, in the current light or dark theme
    const { u, d, cls, now } = S, p = now ? [now.p1, S.p[1]] : S.p;   // the derivatives at the current price
    // the totals are the sums of the rounded parts, so the table adds up
    const sub = now ? now.substitution : d.substitution, inc = now ? now.income : d.income;
    const g1 = U.fmtSum([sub[0], inc[0]]), g2 = U.fmtSum([sub[1], inc[1]]);
    $('table').innerHTML = `<thead><tr><th>${now ? 'so far' : ''}</th><th>good 1</th><th>good 2</th></tr></thead><tbody>` +
      `<tr class="row-sub"><th>substitution${now ? '' : ` ${texStr('E_2-E_1')}`}</th><td>${g1[0]}</td><td>${g2[0]}</td></tr>` +
      `<tr class="row-inc"><th>income${now ? '' : ` ${texStr('E_3-E_2')}`}</th><td>${g1[1]}</td><td>${g2[1]}</td></tr>` +
      `<tr><th>total${now ? '' : ` ${texStr('E_3-E_1')}`}</th><td>${g1[2]}</td><td>${g2[2]}</td></tr></tbody>`;
    // the derivatives below are slow (finite differences of demand): while an animation plays, at most five times a second
    if (state.playing && performance.now() - lastChecks < 200) return;
    lastChecks = performance.now();
    const s = CM.slutsky(p, state.y, u, 0, 0), e = CM.elasticities(p, state.y, u);
    const item = (ok, html) => `<li><span class="mark ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span><span>${html}</span></li>`;
    // the elasticity as computed from the rounded numbers on the right, so the line adds up
    const shown = x => { const t = f3(x); return t.includes('×') ? x : Number(t.replace('−', '-')); };
    const euShown = shown(e.ec[0][0]) - shown(e.eta[0]) * shown(e.b[0]);
    const kindTxt = { normal: '<span class="badge-kind c-inc">normal</span>', inferior: '<span class="badge-kind c-l2-orange">inferior</span>', giffen: '<span class="badge-kind c-l2-red">Giffen</span>' }[cls.kind];
    $('checks').innerHTML = [
      item(same(s.total, s.substitution + s.income), `At ${texStr(`p_1=${fmt(p[0])}`)}: ${(() => { const [a, b, t] = U.fmtSum([s.substitution, s.income]); return texStr(`\\frac{\\partial D^1}{\\partial p_1}=${t}=\\color{${TH.blue}}{${a}}\\color{${TH.red}}{${b.startsWith('−') ? '' : '+'}${b}}`); })()}`),
      item(same(e.eu[0][0], e.ec[0][0] - e.eta[0] * e.b[0]), `${texStr(`\\varepsilon^u_{11}=${f3(euShown)}=\\varepsilon^c_{11}-\\eta_1b_1=${f3(e.ec[0][0])}-(${f3(e.eta[0])})(${f3(e.b[0])})`)}`),
      `<li><span class="mark na">·</span><span>Good 1 is ${kindTxt}: ${texStr(`\\eta_1=${f3(e.eta[0])}`)}${cls.kind === 'giffen' ? `, ${texStr(`\\varepsilon^u_{11}=${f3(euShown)}>0`)}` : ''}.</span></li>`
    ].join('');
  }

  function render() {
    writeText = textDue();
    U.applyVisibility({ ces: state.type === 'ces', stonegeary: state.type === 'stonegeary', giffen: state.type === 'giffen', steps: state.mode === 'steps', smooth: state.mode === 'smooth' });
    $('play-steps').setAttribute('aria-pressed', String(state.mode === 'steps'));
    $('play-smooth').setAttribute('aria-pressed', String(state.mode === 'smooth'));
    $('play-smooth').textContent = `▶ ${state.p1n < state.p1 ? 'Lower' : 'Raise'} p₁ smoothly`;
    document.querySelectorAll('[data-preset]').forEach(b => { const P = PRESETS[b.dataset.preset]; b.setAttribute('aria-pressed', String(Object.keys(P).every(k => state[k] === P[k]))); });
    $('type').value = state.type;
    const S = solve(), th = U.theme();
    tex($('formula'), CU.formula(S.u), true);
    guard('plot', () => draw(th, S));
    guard('demand plot', () => drawDemand(th, S));
    if (writeText) guard('numbers', () => renderNumbers(S));
  }

  // The two animations; while one runs, both buttons wait.
  function play(mode, DURATION, frame, done) {
    if (state.playing) return;
    const start = performance.now();
    state.playing = true; state.mode = mode;
    $('play-steps').disabled = $('play-smooth').disabled = true;
    const step = now => {
      const f = Math.max(0, Math.min(1, (now - start) / DURATION));   // the first frame's time stamp can be earlier than the click
      frame(f);
      if (f < 1) requestAnimationFrame(step);
      else { state.playing = false; $('play-steps').disabled = $('play-smooth').disabled = false; done(); }
    };
    requestAnimationFrame(step);
  }

  // Step by step: first substitution (E1 to E2), then income (E2 to E3); ends on the two-step picture.
  const playSteps = () => play('steps', 3000,
    f => { if (state.anim === null) { state.anim = 0; render(); } state.anim = f; guard('animation', () => draw(U.theme(), solve())); },
    () => { state.anim = null; render(); });

  // Change p1 smoothly: t runs from 0 to 1 and everything moves at the same time; the slider t stays.
  const playSmooth = () => play('smooth', 5000,
    f => { state.t = f; ctrls.t.sync(); guard('animation', render); },
    render);

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { adjust: CU.adjustRho, onChange: schedule });
    $('type').addEventListener('change', e => { state.type = e.target.value; schedule(); });
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const P = PRESETS[b.dataset.preset];
      Object.entries(P).forEach(([k, v]) => { state[k] = v; if (ctrls[k]) ctrls[k].sync(); });
      schedule();
    }));
    $('play-steps').addEventListener('click', playSteps);
    $('play-smooth').addEventListener('click', playSmooth);
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(CM, 'shared/consumer-model.js') && (SM || (U.showError('Could not load model.js.'), false))) guard('page', init);
})();
