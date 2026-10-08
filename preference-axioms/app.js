/*
 * Better, Worse, Indifferent: interface and plotting (lecture 5, sections 2.2-2.4).
 */
(function () {
  'use strict';

  const PM = window.PreferenceModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const state = { type: 'cobb', alpha: 0.5, b1: 6, b2: 6, x1: 4, x2: 4, test: [7, 2.5] };
  const L = 10, N = 161;
  const schedule = U.scheduler(render);
  const pref = () => ({ type: state.type, alpha: state.alpha, bliss: [state.b1, state.b2] });
  const f2 = v => fmt(v, 2);

  const FORMULA = {
    cobb: a => `U(x)=x_1^{${U.num(a)}}\\,x_2^{${U.num(1 - a)}}`,
    subs: a => `U(x)=${U.num(a)}\\,x_1+${U.num(1 - a)}\\,x_2`,
    concave: a => `U(x)=${U.num(a)}\\,x_1^2+${U.num(1 - a)}\\,x_2^2`,
    bliss: () => `U(x)=-(x_1-${U.num(state.b1)})^2-(x_2-${U.num(state.b2)})^2`,
    lex: () => `x\\succcurlyeq_L\\bar x\\iff\\begin{cases}x_1>\\bar x_1,\\ \\text{or}\\\\ x_1=\\bar x_1\\ \\text{and}\\ x_2\\ge\\bar x_2\\end{cases}`
  };

  // Why each axiom holds or fails, per preference relation.
  const WHY = {
    complete: () => state.type === 'lex' ? 'Compare the amounts of good 1; if they are equal, compare good 2.' : 'Any two bundles can be ranked by their utility.',
    transitive: () => state.type === 'lex' ? 'The dictionary order is transitive.' : 'Utility numbers are ordered transitively.',
    continuous: ok => ok ? 'B(x) and W(x) are closed: the indifference curve belongs to both.' : 'B(x°) is not closed: the dots (x°₁ + 1/n, x°₂ − 2) are all better than x°, their limit (x°₁, x°₂ − 2) is worse. I(x°) is the single point x°.',
    monotone: ok => ok ? 'More of both goods is always strictly better.' : 'Beyond the bliss point more of both goods is worse.',
    strongMonotone: ok => ok ? 'More of any one good, the rest equal, is strictly better.' : state.type === 'cobb' ? 'On the axes: (0, 2) ∼ (0, 1). More of good 2 does not help without good 1.' : 'Already monotonicity fails.',
    convex: ok => ok ? 'B(x) is convex for every x: segments between better bundles stay better.' : 'The indifference curves are bowed away from the origin: a segment between two bundles of B(x°) leaves it.',
    strictlyConvex: ok => ok ? 'No flat pieces: the midpoint of two different indifferent bundles is strictly better (bundles with x ≫ 0).' : state.type === 'subs' ? 'I(x) is a straight line: the midpoint of two indifferent bundles is only indifferent.' : state.type === 'lex' ? 'The half-line above x° lies on the edge of B(x°).' : 'Not even convex.'
  };
  const NAMES = [['complete', 'Completeness'], ['transitive', 'Transitivity'], ['continuous', 'Continuity'], ['monotone', 'Monotonicity'], ['strongMonotone', 'Strong monotonicity'], ['convex', 'Convexity'], ['strictlyConvex', 'Strict convexity']];

  function draw(th) {
    const P = pref(), x0 = [state.x1, state.x2], g = U.linspace(0, L, N);
    const z = g.map(b => g.map(a => PM.compare([a, b], x0, P)));
    const traces = [{
      type: 'heatmap', x: g, y: g, z, zmin: -1, zmax: 1, showscale: false, hoverinfo: 'skip',
      colorscale: [[0, 'rgba(155,155,155,0.45)'], [0.45, 'rgba(155,155,155,0.45)'], [0.46, 'rgba(74,144,226,0.28)'], [1, 'rgba(74,144,226,0.28)']]
    }];
    const shapes = [], annotations = [];
    if (P.type === 'lex') {
      // The boundary x1 = x°1: the part above x° belongs to B, the part below to W.
      traces.push(U.line2([[x0[0], x0[1]], [x0[0], L]], th.blue, 3, 'in B(x°)'));
      traces.push(U.line2([[x0[0], 0], [x0[0], x0[1]]], th.grey, 3, 'in W(x°)'));
      const seq = [1, 2, 3, 4, 6, 8, 12, 20].map(n => [x0[0] + 1 / n, x0[1] - 2]).filter(v => v[1] >= 0 && v[0] <= L);
      if (seq.length) {
        traces.push(U.dot2(seq, th.blue, 'x^n in B(x°)', 7));
        traces.push(U.dot2([[x0[0], x0[1] - 2]], th.red, 'limit not in B(x°)', 10, { marker: { color: th.panel, size: 10, line: { color: th.red, width: 2 } } }));
      }
    } else {
      traces.push(U.line2(PM.indifferenceCurve(x0, P, L, 500), th.ink, 2.5, 'I(x°)'));
      if (P.type === 'bliss') traces.push(U.dot2([P.bliss], th.ink, 'bliss point', 8, { marker: { symbol: 'star', size: 13, color: th.ink } }));
    }
    // Segment test between x° and x'.
    const xp = state.test, inB = PM.better(xp, x0, P), seg = PM.segmentInB(x0, xp, x0, P, 600);
    if (inB) {
      const t = seg.allIn ? 1 : seg.firstOut;
      traces.push(U.line2([x0, [x0[0] + t * (xp[0] - x0[0]), x0[1] + t * (xp[1] - x0[1])]], th.ink, 1.5, 'segment in B(x°)'));
      if (!seg.allIn) traces.push(U.line2([[x0[0] + t * (xp[0] - x0[0]), x0[1] + t * (xp[1] - x0[1])], xp], th.red, 3, 'segment leaves B(x°)'));
    }
    traces.push(U.dot2([x0], th.ink, 'x°', 11));
    traces.push(U.dot2([xp], th.accent4 || th.ink, "x'", 10, { marker: { symbol: 'diamond', size: 11, color: th.accent4 || th.ink } }));
    // labels turn inwards at the edges of the box (x° and x' can sit on them)
    const tag = (z, text, color) => {
      const right = z[0] > 0.85 * L, top = z[1] > 0.9 * L;
      annotations.push({ x: z[0], y: z[1], text, showarrow: false, xanchor: right ? 'right' : 'left', yanchor: top ? 'top' : 'bottom', xshift: right ? -6 : 6, yshift: top ? -4 : 0, font: { size: 14, color } });
    };
    tag(x0, 'x°', th.ink); tag(xp, "x'", th.accent4 || th.ink);
    annotations.push({ xref: 'paper', yref: 'paper', x: 0.98, y: 0.98, text: 'better than x°', showarrow: false, xanchor: 'right', yanchor: 'top', font: { size: 12, color: th.ink }, bgcolor: th.panel, bordercolor: th.line, borderpad: 4, visible: P.type !== 'bliss' });
    annotations.push({ xref: 'paper', yref: 'paper', x: 0.03, y: 0.03, text: 'worse than x°', showarrow: false, xanchor: 'left', yanchor: 'bottom', font: { size: 12, color: th.ink }, bgcolor: th.panel, bordercolor: th.line, borderpad: 4, visible: P.type !== 'bliss' });
    Plotly.react('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, 1.03 * L], constrain: 'domain' }, y: { range: [0, 1.03 * L], scaleanchor: 'x', constrain: 'domain' }, shapes, annotations, margin: { l: 48, r: 12, t: 8, b: 44 } }), { ...U.PLOT_CONFIG, displayModeBar: false });
    return { P, x0, xp, inB, seg };
  }

  function renderText({ P, x0, xp, inB, seg }) {
    const A = PM.AXIOMS[P.type];
    $('axioms').innerHTML = NAMES.map(([k, name]) => `<li><span class="mark ${A[k] ? 'ok' : 'no'}">${A[k] ? '✓' : '✗'}</span><span><b>${name}</b><span class="why">${WHY[k](A[k])}</span></span></li>`).join('');
    $('repr').innerHTML = P.type === 'lex'
      ? 'Continuity fails, so Proposition 1 does not apply. In fact no utility function represents lexicographic preferences (a classical result).'
      : `Complete, transitive and continuous${A.strongMonotone ? ' and strongly monotone' : ''}: the utility function ${texStr(FORMULA[P.type](P.alpha))} represents the preferences.`;
    const rel = c => c > 0 ? '\\succ' : c < 0 ? '\\prec' : '\\sim';
    const c = PM.compare(xp, x0, P);
    const step = d => { const y = [x0[0] + d[0], x0[1] + d[1]]; const r = PM.compare(y, x0, P); return `${r > 0 ? '<span class="ok-mark">better</span>' : r === 0 ? 'indifferent' : '<span class="c-l2-red">worse</span>'}`; };
    const rows = [
      ["x'\\ \\text{vs}\\ x^\\circ", `${texStr(`x'=(${f2(xp[0])},${f2(xp[1])})\\ ${rel(c)}\\ x^\\circ=(${f2(x0[0])},${f2(x0[1])})`)}`]
    ];
    if (P.type !== 'lex') rows.push(['U(x\'),\\ U(x^\\circ)', `${fmt(PM.utility(xp, P), 3)}, ${fmt(PM.utility(x0, P), 3)}`]);
    rows.push(['\\text{segment}\\ x^\\circ x\'', inB ? (seg.allIn ? 'stays in B(x°)' : '<span class="c-l2-red">leaves B(x°): not convex</span>') : 'x′ is not in B(x°)']);
    rows.push(['x^\\circ+(1,1)', step([1, 1])], ['x^\\circ+(1,0)', step([1, 0])], ['x^\\circ+(0,1)', step([0, 1])]);
    $('readouts').innerHTML = rows.map(([l, v]) => `<dt>${texStr(l)}</dt><dd>${v}</dd>`).join('');
    $('cap').innerHTML = `<span class="c-l2-blue">Blue: strictly better than ${texStr('x^\\circ')}</span>, <span class="c-l2-grey">grey: strictly worse</span>; ${texStr('B(x^\\circ)')} is the blue set with ${texStr('I(x^\\circ)')}, ${texStr('W(x^\\circ)')} the grey set with ${texStr('I(x^\\circ)')}. ${P.type === 'lex' ? `${texStr('I(x^\\circ)=\\{x^\\circ\\}')}. On the line ${texStr('x_1=x_1^\\circ')} the part above ${texStr('x^\\circ')} is better, the part below is worse.` : `<span class="c-ink"><span class="key"></span>the indifference curve ${texStr('I(x^\\circ)')}</span>.`}`;
  }

  function render() {
    U.applyVisibility({ cobb: state.type === 'cobb', subs: state.type === 'subs', concave: state.type === 'concave', bliss: state.type === 'bliss', lex: state.type === 'lex' });
    tex($('formula'), FORMULA[state.type](state.alpha), true);
    const th = U.theme();
    let R = null;
    guard('plot', () => { R = draw(th); });
    if (R) guard('readouts', () => renderText(R));
  }

  function init() {
    U.renderStaticTex();
    U.controls(document, state, { onChange: schedule });
    // A test bundle that makes the point of each example visible.
    const DEMO = { cobb: [7, 2.5], subs: [7, 2.5], concave: [5.8, 0.3], bliss: [8.5, 8.5], lex: [7, 2.5] };
    $('type').addEventListener('change', e => { state.type = e.target.value; state.test = DEMO[state.type].slice(); schedule(); });
    const gd = $('plot');
    gd.addEventListener('click', ev => {
      const v = U.eventToData(gd, ev);
      if (!v) return;
      state.test = [Math.min(L, Math.max(0, Math.round(v[0] * 10) / 10)), Math.min(L, Math.max(0, Math.round(v[1] * 10) / 10))];
      schedule();
    });
    render();
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(PM, 'model.js')) guard('page', init);
})();
