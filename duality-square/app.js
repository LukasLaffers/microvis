/*
 * The Duality Square: interface and plotting (lecture 6).
 * The square of D, V, C and H with its eight arrows; the figure shows what the chosen arrow does, and the two buttons
 * go round the square, one arrow at a time.
 */
(function () {
  'use strict';

  const M = window.DualitySquare, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, tex, texStr, guard } = U;

  const DEF = { ex: 'sqrt', p1: 1, p2: 2, y: 8, alpha: 0.3 };
  // sel: the chosen arrow; t: how far its animation in the figure has got (1: done)
  const state = { ...DEF, sel: 'CH', t: 1 };
  let ctrls = {};

  // The eight arrows. rule: the general rule (card), short: the same in the table, as in the lecture's slides.
  const ARROWS = {
    DV: { from: 'D', to: 'V', name: 'plug in', rule: 'V(p,y)=U\\big(D(p,y)\\big)', short: 'V=U(D)' },
    VC: { from: 'V', to: 'C', name: 'invert', rule: 'C(p,v)\\text{ solves }V\\big(p,C(p,v)\\big)=v', short: 'V(p,C)=v' },
    CH: { from: 'C', to: 'H', name: 'Shephard', rule: 'H^i(p,v)=\\dfrac{\\partial C(p,v)}{\\partial p_i}', short: 'H^1=\\partial C/\\partial p_1' },
    HD: { from: 'H', to: 'D', name: 'substitute V', rule: 'D(p,y)=H\\big(p,V(p,y)\\big)', short: 'D(p,y)=H(p,V(p,y))' },
    VD: { from: 'V', to: 'D', name: 'Roy', rule: 'D^i(p,y)=-\\dfrac{\\partial V(p,y)/\\partial p_i}{\\partial V(p,y)/\\partial y}', short: 'D^1=-V_{p_1}/V_y' },
    CV: { from: 'C', to: 'V', name: 'invert', rule: 'V(p,y)\\text{ solves }C\\big(p,V(p,y)\\big)=y', short: 'C(p,V)=y' },
    HC: { from: 'H', to: 'C', name: 'weight by prices', rule: 'C(p,v)=p_1H^1(p,v)+p_2H^2(p,v)', short: 'C=p_1H^1+p_2H^2' },
    DH: { from: 'D', to: 'H', name: 'substitute C', rule: 'H(p,v)=D\\big(p,C(p,v)\\big)', short: 'H(p,v)=D(p,C(p,v))' }
  };
  const GRID = ['DV', 'VC', 'CH', 'HD', 'VD', 'CV', 'HC', 'DH'];   // the table: inverse pairs one above the other
  const TRIPS = { fwd: ['DV', 'VC', 'CH', 'HD'], back: ['DH', 'HC', 'CV', 'VD'] };
  const NAMES = { fwd: 'Round the square', back: 'The other way' };

  // ---------- the example's formulas ----------

  const L21 = '\\ln\\dfrac{p_2}{p_1}';
  // The step of each arrow for this example, in the current case (x1 + x2: which good is cheaper; ln x1 + x2: corner or not).
  function cells(ex, reg) {
    if (ex === 'leontief') return {
      DV: 'V=\\min\\{D^1,D^2\\}=\\dfrac{y}{p_1+p_2}',
      VC: '\\dfrac{C}{p_1+p_2}=v\\Rightarrow C=v(p_1+p_2)',
      CH: 'H^1=H^2=v',
      HD: 'D^1=D^2=V=\\dfrac{y}{p_1+p_2}',
      VD: '\\dfrac{y/(p_1+p_2)^2}{1/(p_1+p_2)}=\\dfrac{y}{p_1+p_2}',
      CV: 'V(p_1+p_2)=y\\Rightarrow V=\\dfrac{y}{p_1+p_2}',
      HC: 'p_1v+p_2v=v(p_1+p_2)',
      DH: '\\dfrac{v(p_1+p_2)}{p_1+p_2}=v'
    };
    if (ex === 'sqrt') return {
      DV: '\\sqrt{\\dfrac{y}{2p_1}\\dfrac{y}{2p_2}}=\\dfrac{y}{2\\sqrt{p_1p_2}}',
      VC: '\\dfrac{C}{2\\sqrt{p_1p_2}}=v\\Rightarrow C=2v\\sqrt{p_1p_2}',
      CH: 'H^1=v\\sqrt{\\dfrac{p_2}{p_1}},\\ H^2=v\\sqrt{\\dfrac{p_1}{p_2}}',
      HD: '\\dfrac{y}{2\\sqrt{p_1p_2}}\\sqrt{\\dfrac{p_2}{p_1}}=\\dfrac{y}{2p_1}',
      VD: '\\dfrac{\\tfrac{y}{4}p_1^{-3/2}p_2^{-1/2}}{\\tfrac12(p_1p_2)^{-1/2}}=\\dfrac{y}{2p_1}',
      CV: '2V\\sqrt{p_1p_2}=y\\Rightarrow V=\\dfrac{y}{2\\sqrt{p_1p_2}}',
      HC: 'v\\sqrt{p_1p_2}+v\\sqrt{p_1p_2}=2v\\sqrt{p_1p_2}',
      DH: '\\dfrac{2v\\sqrt{p_1p_2}}{2p_1}=v\\sqrt{\\dfrac{p_2}{p_1}}'
    };
    if (ex === 'cd') return {
      DV: '\\Big(\\dfrac{\\alpha y}{p_1}\\Big)^{\\alpha}\\Big(\\dfrac{(1-\\alpha)y}{p_2}\\Big)^{1-\\alpha}=\\dfrac{y}{P}',
      VC: '\\dfrac{C}{P}=v\\Rightarrow C=vP',
      CH: 'H^1=\\dfrac{\\alpha vP}{p_1},\\ H^2=\\dfrac{(1-\\alpha)vP}{p_2}',
      HD: '\\dfrac{\\alpha P}{p_1}\\cdot\\dfrac{y}{P}=\\dfrac{\\alpha y}{p_1}',
      VD: '\\dfrac{\\alpha y/(p_1P)}{1/P}=\\dfrac{\\alpha y}{p_1}',
      CV: 'VP=y\\Rightarrow V=\\dfrac{y}{P}',
      HC: '\\alpha vP+(1-\\alpha)vP=vP',
      DH: '\\dfrac{\\alpha C}{p_1}=\\dfrac{\\alpha vP}{p_1}'
    };
    if (ex === 'subst' && reg === 'tie') return {
      DV: 'V=x_1+x_2=\\dfrac{y}{p_1}\\text{ at every optimal }x',
      VC: '\\dfrac{C}{p_1}=v\\Rightarrow C=vp_1',
      CH: '\\text{no }\\partial C/\\partial p_1\\text{: a kink at }p_1=p_2',
      HD: '\\text{every }x\\ge0\\text{ with }x_1+x_2=\\dfrac{y}{p_1}',
      VD: '\\text{no }\\partial V/\\partial p_1\\text{: a kink at }p_1=p_2',
      CV: 'Vp_1=y\\Rightarrow V=\\dfrac{y}{p_1}',
      HC: 'p_1H^1+p_2H^2=p_1(H^1+H^2)=vp_1',
      DH: '\\text{every }x\\ge0\\text{ with }x_1+x_2=v'
    };
    if (ex === 'subst') {
      const i = reg, j = reg === '1' ? '2' : '1';
      return {
        DV: `V=D^1+D^2=\\dfrac{y}{p_${i}}`,
        VC: `\\dfrac{C}{p_${i}}=v\\Rightarrow C=vp_${i}`,
        CH: `H^${i}=\\dfrac{\\partial(vp_${i})}{\\partial p_${i}}=v,\\ H^${j}=0`,
        HD: `D^${i}=V=\\dfrac{y}{p_${i}},\\ D^${j}=0`,
        VD: `D^${i}=\\dfrac{y/p_${i}^2}{1/p_${i}}=\\dfrac{y}{p_${i}},\\ D^${j}=0`,
        CV: `Vp_${i}=y\\Rightarrow V=\\dfrac{y}{p_${i}}`,
        HC: i === '1' ? 'p_1v+p_2\\cdot0=vp_1' : 'p_1\\cdot0+p_2v=vp_2',
        DH: `H^${i}=\\dfrac{vp_${i}}{p_${i}}=v,\\ H^${j}=0`
      };
    }
    if (ex === 'additive') return {
      DV: '\\sqrt{D^1}+\\sqrt{D^2}=\\sqrt{\\dfrac{y(p_1+p_2)}{p_1p_2}}',
      VC: '\\dfrac{C(p_1+p_2)}{p_1p_2}=v^2\\Rightarrow C=\\dfrac{v^2p_1p_2}{p_1+p_2}',
      CH: 'H^1=\\dfrac{v^2p_2^2}{(p_1+p_2)^2},\\ H^2=\\dfrac{v^2p_1^2}{(p_1+p_2)^2}',
      HD: '\\dfrac{y(p_1+p_2)}{p_1p_2}\\cdot\\dfrac{p_2^2}{(p_1+p_2)^2}=\\dfrac{yp_2}{p_1(p_1+p_2)}',
      VD: '\\dfrac{y/(2p_1^2V)}{(p_1+p_2)/(2p_1p_2V)}=\\dfrac{yp_2}{p_1(p_1+p_2)}',
      CV: '\\dfrac{V^2p_1p_2}{p_1+p_2}=y\\Rightarrow V=\\sqrt{\\dfrac{y(p_1+p_2)}{p_1p_2}}',
      HC: '\\dfrac{v^2(p_1p_2^2+p_2p_1^2)}{(p_1+p_2)^2}=\\dfrac{v^2p_1p_2}{p_1+p_2}',
      DH: '\\dfrac{C\\,p_2}{p_1(p_1+p_2)}=\\dfrac{v^2p_2^2}{(p_1+p_2)^2}'
    };
    if (reg === 'corner') return {
      DV: 'V=\\ln D^1+D^2=\\ln\\dfrac{y}{p_1}',
      VC: '\\ln\\dfrac{C}{p_1}=v\\Rightarrow C=p_1e^v',
      CH: 'H^1=e^v,\\ H^2=0',
      HD: 'D^1=e^V=\\dfrac{y}{p_1},\\ D^2=0',
      VD: '\\dfrac{1/p_1}{1/y}=\\dfrac{y}{p_1},\\ D^2=0',
      CV: 'p_1e^V=y\\Rightarrow V=\\ln\\dfrac{y}{p_1}',
      HC: 'p_1e^v+p_2\\cdot0=p_1e^v',
      DH: '\\dfrac{p_1e^v}{p_1}=e^v,\\ H^2=0'
    };
    return {
      DV: `V=\\ln D^1+D^2=${L21}+\\dfrac{y}{p_2}-1`,
      VC: `${L21}+\\dfrac{C}{p_2}-1=v\\Rightarrow C=p_2\\Big(v+1-${L21}\\Big)`,
      CH: `H^1=\\dfrac{p_2}{p_1},\\ H^2=v-${L21}`,
      HD: `D^1=\\dfrac{p_2}{p_1},\\ D^2=V-${L21}=\\dfrac{y}{p_2}-1`,
      VD: '\\dfrac{1/p_1}{1/p_2}=\\dfrac{p_2}{p_1}',
      CV: `p_2\\Big(V+1-${L21}\\Big)=y\\Rightarrow V=${L21}+\\dfrac{y}{p_2}-1`,
      HC: `p_1\\dfrac{p_2}{p_1}+p_2\\Big(v-${L21}\\Big)=p_2\\Big(v+1-${L21}\\Big)`,
      DH: `H^1=\\dfrac{p_2}{p_1},\\ H^2=\\dfrac{C}{p_2}-1=v-${L21}`
    };
  }

  // The utility function and how D follows from it (left panel).
  function formula(ex) {
    switch (ex) {
      case 'leontief': return '\\begin{gathered}U=\\min\\{x_1,x_2\\}\\\\[2pt]\\text{optimum at the kink: }x_1=x_2\\\\[2pt]\\text{budget: }(p_1+p_2)x_1=y\\\\[2pt]\\Rightarrow D^1=D^2=\\dfrac{y}{p_1+p_2}\\end{gathered}';
      case 'sqrt': return '\\begin{gathered}U=\\sqrt{x_1x_2}\\\\[2pt]\\text{tangency: }\\dfrac{U_1}{U_2}=\\dfrac{x_2}{x_1}=\\dfrac{p_1}{p_2}\\\\[2pt]\\Rightarrow D^1=\\dfrac{y}{2p_1},\\ D^2=\\dfrac{y}{2p_2}\\end{gathered}';
      case 'cd': return '\\begin{gathered}U=x_1^{\\alpha}x_2^{1-\\alpha}\\\\[2pt]\\text{tangency: }\\dfrac{\\alpha}{1-\\alpha}\\dfrac{x_2}{x_1}=\\dfrac{p_1}{p_2}\\\\[2pt]\\Rightarrow D^1=\\dfrac{\\alpha y}{p_1},\\ D^2=\\dfrac{(1-\\alpha)y}{p_2}\\\\[6pt]\\text{a price index:}\\\\[2pt]P(p)=\\Big(\\dfrac{p_1}{\\alpha}\\Big)^{\\alpha}\\Big(\\dfrac{p_2}{1-\\alpha}\\Big)^{1-\\alpha}\\end{gathered}';
      case 'subst': return '\\begin{gathered}U=x_1+x_2\\\\[2pt]\\text{only the cheaper good is bought}\\\\[2pt]D(p,y)=\\begin{cases}(y/p_1,\\,0)&p_1<p_2\\\\(0,\\,y/p_2)&p_1>p_2\\\\\\text{the budget line}&p_1=p_2\\end{cases}\\end{gathered}';
      case 'additive': return '\\begin{gathered}U=\\sqrt{x_1}+\\sqrt{x_2}\\\\[2pt]\\text{tangency: }\\dfrac{U_1}{U_2}=\\sqrt{\\dfrac{x_2}{x_1}}=\\dfrac{p_1}{p_2}\\\\[2pt]\\Rightarrow D^1=\\dfrac{yp_2}{p_1(p_1+p_2)}\\\\[2pt]D^2=\\dfrac{yp_1}{p_2(p_1+p_2)}\\end{gathered}';
      case 'quasilin': return '\\begin{gathered}U=\\ln x_1+x_2\\\\[2pt]\\text{tangency: }\\dfrac{U_1}{U_2}=\\dfrac{1}{x_1}=\\dfrac{p_1}{p_2}\\\\[2pt]\\text{if }y\\ge p_2:\\ D^1=\\dfrac{p_2}{p_1},\\ D^2=\\dfrac{y}{p_2}-1\\\\[2pt]\\text{if }y<p_2:\\ D=(y/p_1,\\,0)\\end{gathered}';
    }
    return '';
  }
  function exNote(S) {
    const { ex, reg, p, y } = S;
    if (ex === 'leontief') return 'No tangency here: the indifference curves have a kink, and the optimum is on the diagonal.';
    if (ex === 'cd') return `For Roy and Shephard: ${texStr('\\partial P/\\partial p_1=\\alpha P/p_1')}. With ${texStr('\\alpha=\\tfrac12')} this is ${texStr('\\sqrt{x_1x_2}')}, with ${texStr('P=2\\sqrt{p_1p_2}')}.`;
    if (ex === 'subst') return reg === 'tie'
      ? `Now ${texStr('p_1=p_2')}: every bundle on the budget line is optimal, and ${texStr('V')} and ${texStr('C')} have a kink in ${texStr('p_1')}, so Roy's identity and Shephard's lemma do not apply.`
      : `Now ${texStr(reg === '1' ? 'p_1<p_2' : 'p_1>p_2')}: only good ${reg} is bought, ${texStr(`V=y/p_${reg}`)}.`;
    if (ex === 'quasilin') return reg === 'corner'
      ? `Now ${texStr(`y=${fmt(y)}<p_2=${fmt(p[1])}`)}: a corner, all income goes on good 1.`
      : `Now ${texStr(`y=${fmt(y)}\\ge p_2=${fmt(p[1])}`)}: interior. ${texStr('D^1=H^1=p_2/p_1')} does not depend on income.`;
    if (ex === 'additive') return 'A CES function with σ = 2: the goods are substitutes, yet both are always bought.';
    return '';
  }

  // ---------- numbers ----------

  function solve() {
    const ex = state.ex, a = state.alpha, p = [state.p1, state.p2], y = state.y;
    const v = M.indirect(ex, p, y, a), D = M.demandSet(ex, p, y, a), C = M.expenditure(ex, p, v, a), H = M.hicksSet(ex, p, v, a);
    const tie = D[0][0] !== D[1][0] || D[0][1] !== D[1][1];
    return { ex, a, p, y, v, D, C, H, tie, reg: M.regime(ex, p, y), gV: M.indirectGrad(ex, p, y, a), gC: M.expenditureGrad(ex, p, v, a), L: 1.12 * Math.max(y / p[0], y / p[1]) };
  }
  const vec = x => `(${fmt(x[0])},\\ ${fmt(x[1])})`;
  const setTex = (S, set, lvl) => S.tie ? `\\{x\\ge0:\\ x_1+x_2=${fmt(lvl)}\\}` : vec(set[0]);

  // The numbers of the chosen arrow at the current prices, for the card.
  function numbers(id, S) {
    const { p, y, v, D, C, H, gV, gC, tie } = S, f = fmt;
    const Dt = setTex(S, D, y / p[0]), Ht = setTex(S, H, v);
    switch (id) {
      case 'DV': return tie
        ? texStr(`D(p,y)=${Dt}\\ \\Rightarrow\\ V(p,y)=${f(v)}`)
        : texStr(`D(p,y)=${Dt}\\ \\Rightarrow\\ V(p,y)=U${Dt}=${f(v)}`);
      case 'VC': return texStr(`V(p,y)=v=${f(v)}\\ \\Rightarrow\\ C(p,v)=${f(C)}=y`);
      case 'CH': return tie
        ? `${texStr('\\partial C/\\partial p_1')} does not exist here; ${texStr(`H(p,v)=${Ht}=D(p,y)`)}, a set`
        : texStr(`H(p,v)=\\Big(\\dfrac{\\partial C}{\\partial p_1},\\dfrac{\\partial C}{\\partial p_2}\\Big)=${vec(gC)}=D(p,y)`);
      case 'HD': return texStr(`D(p,y)=H(p,${f(v)})=${Ht}`);
      case 'VD': return tie
        ? `${texStr('\\partial V/\\partial p_1')} does not exist here; ${texStr(`D(p,y)=${Dt}`)}, a set`
        : texStr(`D(p,y)=\\Big(-\\dfrac{V_{p_1}}{V_y},-\\dfrac{V_{p_2}}{V_y}\\Big)=${vec([-gV.p[0] / gV.y, -gV.p[1] / gV.y])}`);
      case 'CV': return texStr(`C\\big(p,V(p,y)\\big)=y=${f(y)}\\ \\Rightarrow\\ V(p,y)=${f(v)}`);
      case 'HC': {
        if (tie) return texStr(`C(p,v)=p_1(H^1+H^2)=${f(p[0])}\\cdot${f(v)}=${f(C)}`);
        const [a, b, s] = U.fmtSum([p[0] * H[0][0], p[1] * H[0][1]]);
        return texStr(`C(p,v)=p_1H^1+p_2H^2=${a}+${b}=${s}=y`);
      }
      case 'DH': return texStr(`H(p,v)=D\\big(p,${f(C)}\\big)=${Dt}`);
    }
    return '';
  }
  // The value of each box in the table.
  function value(id, S) {
    const { p, y, v, C, D, H } = S;
    const to = ARROWS[id].to;
    if (to === 'V') return texStr(`V(p,y)=${fmt(v)}`);
    if (to === 'C') return texStr(`C(p,v)=${fmt(C)}`);
    if (to === 'D') return texStr(`D(p,y)=${setTex(S, D, y / p[0])}`);
    return texStr(`H(p,v)=${setTex(S, H, v)}`);
  }

  // ---------- the square ----------

  const NODE = { D: [90, 62], H: [380, 62], V: [90, 268], C: [380, 268] };
  function buildSquare() {
    const sq = $('square');
    let h = '<defs><marker id="ah" class="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,1 L9,5 L0,9 z"/></marker>' +
      '<marker id="ah-sel" class="ah-sel" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,1 L11,6 L0,11 z"/></marker></defs>';
    for (const id of GRID) {
      const A = ARROWS[id], [x1, y1] = NODE[A.from], [x2, y2] = NODE[A.to];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, gap = 30;
      const sx = x1 + ux * gap, sy = y1 + uy * gap, ex = x2 - ux * gap, ey = y2 - uy * gap;
      // every arrow bends to the same side of its direction, so the two arrows of a pair do not overlap
      const nx = uy, ny = -ux, k = 30, cx = (sx + ex) / 2 + nx * k, cy = (sy + ey) / 2 + ny * k;
      const d = `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`;
      // the label just outside the bend
      const lx = (sx + ex) / 2 + nx * (k / 2 + 12), ly = (sy + ey) / 2 + ny * (k / 2 + 12);
      const anchor = Math.abs(nx) > 0.5 ? (nx > 0 ? 'start' : 'end') : 'middle';
      const lines = id === 'HC' ? ['weight by', 'prices'] : [A.name];
      const y0 = Math.abs(ny) > 0.5 ? (ny > 0 ? ly + 11 : ly - 4 - 16 * (lines.length - 1)) : ly + 5 - 8 * (lines.length - 1);
      const label = lines.map((s, i) => `<tspan x="${lx.toFixed(1)}" y="${(y0 + 16 * i).toFixed(1)}">${s}</tspan>`).join('');
      h += `<g class="arrow" data-id="${id}" tabindex="0" role="button" aria-label="${A.name}: from ${A.from} to ${A.to}">` +
        `<path class="hit" d="${d}"/><path class="stem" d="${d}" marker-end="url(#ah)"/>` +
        `<text class="alab" text-anchor="${anchor}">${label}</text></g>`;
    }
    for (const [k, [x, y]] of Object.entries(NODE)) h += `<text class="node node-${k}" x="${x}" y="${y + 11}" text-anchor="middle">${k}</text>`;
    h += `<text class="side-lab" x="${NODE.V[0]}" y="318" text-anchor="middle">UMP</text><text class="side-lab" x="${NODE.C[0]}" y="318" text-anchor="middle">EMP</text>`;
    sq.innerHTML = h;
    sq.querySelectorAll('.arrow').forEach(g => {
      const go = () => select(g.dataset.id);
      g.addEventListener('click', go);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
    });
  }
  function markSquare() {
    $('square').querySelectorAll('.arrow').forEach(g => {
      const on = g.dataset.id === state.sel;
      g.classList.toggle('sel', on);
      g.querySelector('.stem').setAttribute('marker-end', `url(#${on ? 'ah-sel' : 'ah'})`);
      g.setAttribute('aria-pressed', String(on));
    });
  }

  // ---------- the figure ----------

  const ease = t => t * t * (3 - 2 * t);
  const START = 0.3;   // the slides start from 30% of income
  // A polyline with many points (so that it can be drawn growing from a point).
  function dense(pts, n = 200) {
    if (pts.length > 20) return pts;
    const out = [];
    for (let i = 1; i < pts.length; i++) for (let j = 0; j < n / (pts.length - 1); j++) {
      const s = j / (n / (pts.length - 1)), [a, b] = pts[i - 1], [c, d] = pts[i];
      out.push([a + s * (c - a), b + s * (d - b)]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // The part of a curve within distance r of the point x (sup norm): the curve grows out of x.
  const grow = (pts, x, r) => pts.map(q => q[1] !== null && Math.max(Math.abs(q[0] - x[0]), Math.abs(q[1] - x[1])) <= r ? q : [q[0], null]);

  function figure(th, S, id, t) {
    const { ex, a, p, y, v, D, H, tie, L } = S, s = ease(t), done = t >= 1;
    const traces = [];
    const lineOf = m => [[m / p[0], 0], [0, m / p[1]]];
    const curveOf = u => M.curve(ex, u, a, L);
    const lineTr = (m, color, width, dash) => U.line2(lineOf(m), color, width, '', dash);
    const curveTr = (u, color, width, dash, pts) => U.line2(pts || curveOf(u), color, width, '', dash);
    // a bundle: a dot (D, red) or a ring (H, blue); for x1 + x2 at p1 = p2 the whole segment
    const bundle = (set, kind, opacity = 1) => {
      const color = kind === 'D' ? th.red : kind === 'H' ? th.blue : th.muted;
      if (tie) return U.line2(set, color, kind === 'H' ? 11 : 5, '', null, { opacity: kind === 'H' ? 0.35 * opacity : opacity });
      return kind === 'H'
        ? { type: 'scatter', mode: 'markers', x: [set[0][0]], y: [set[0][1]], marker: { symbol: 'circle-open', size: 20, color, line: { width: 3, color } }, opacity, hoverinfo: 'skip' }
        : U.dot2([set[0]], color, '', kind === 'D' ? 12 : 10, { opacity, hoverinfo: 'skip' });
    };
    // the path of the optimal bundle as income (or the utility level) changes: the income expansion path
    const path = () => tie ? U.line2([], th.muted, 1, '') : U.line2(U.linspace(0.005, 1.6, 120).map(k => M.demandSet(ex, p, k * y, a)[0]), th.muted, 1.5, '', 'dot');
    const mOf = () => y * (START + (1 - START) * s);   // the income of a slide
    const label = (pt, text, color) => U.text2(pt, text ? '\u2002\u2002\u2002' + text : '', color, 'top right', 13);   // the spaces clear the ring of H
    const at = D[tie ? 1 : 0];   // where the labels go
    // a label just below the budget line p.x = m, near its left end, away from the curve above it
    // (hidden labels have no text, so that they can move)
    const lineLabel = (m, text) => U.text2([0.06 * m / p[0], 0.94 * m / p[1]], text, th.blue, 'bottom right', 13);

    switch (id) {
      case 'DV': {   // the indifference curve grows out of D
        traces.push(lineTr(y, th.ink, 1.5));
        traces.push(curveTr(v, th.red, 3, null, grow(dense(curveOf(v)), D[0], 0.02 * L + s * L)));
        traces.push(bundle(D, 'D'));
        traces.push(label(at, 'D(p,y)', th.red));
        break;
      }
      case 'VD': {   // D appears where the curve U = V(p,y) touches the budget line
        traces.push(lineTr(y, th.ink, 1.5));
        traces.push(curveTr(v, th.red, 3));
        traces.push(bundle(D, 'D', s));
        traces.push(label(at, done ? 'D(p,y)' : '', th.red));
        break;
      }
      case 'VC': {   // budget lines move out until the best affordable bundle reaches U = v
        const m = mOf();
        traces.push(path());
        traces.push(curveTr(v, th.red, 3));
        traces.push(lineTr(m, th.blue, done ? 3 : 2, done ? null : 'dash'));
        traces.push(bundle(M.demandSet(ex, p, m, a), done ? 'D' : 'grey'));
        traces.push(lineLabel(m, done ? `p·x = C(p,v) = ${fmt(m)}` : `p·x = ${fmt(m)}`));
        break;
      }
      case 'CV': {   // indifference curves move up until the cheapest bundle on them costs y
        const m = mOf(), u = M.indirect(ex, p, m, a);
        traces.push(path());
        traces.push(lineTr(y, th.blue, 3));
        traces.push(curveTr(u, th.red, done ? 3 : 2, done ? null : 'dash'));
        traces.push(bundle(M.hicksSet(ex, p, u, a), done ? 'D' : 'grey'));
        traces.push(label(M.hicksSet(ex, p, u, a)[tie ? 1 : 0], done ? `U = V(p,y) = ${fmt(u)}` : `U = ${fmt(u)}`, th.red));
        break;
      }
      case 'CH': {   // H appears where the cheapest line touches U = v
        traces.push(curveTr(v, th.ink, 1.5));
        traces.push(lineTr(y, th.blue, 3));
        traces.push(bundle(H, 'H', s));
        traces.push(label(at, done ? 'H(p,v)' : '', th.blue));
        break;
      }
      case 'HC': {   // the line through H with slope -p1/p2 grows out of H
        const h = H[0], ends = lineOf(y), seg = [[h[0] + s * (ends[0][0] - h[0]), h[1] + s * (ends[0][1] - h[1])], [h[0] + s * (ends[1][0] - h[0]), h[1] + s * (ends[1][1] - h[1])]];
        traces.push(curveTr(v, th.ink, 1.5));
        traces.push(U.line2(tie ? ends : seg, th.blue, 3, ''));
        traces.push(bundle(H, 'H'));
        traces.push(lineLabel(y, done ? `p·x = C(p,v) = ${fmt(y)}` : ''));
        break;
      }
      case 'HD': {   // H(p,u) moves along the path as u rises to V(p,y), and lands on D
        const m = mOf(), u = M.indirect(ex, p, m, a), Hu = M.hicksSet(ex, p, u, a);
        traces.push(path());
        traces.push(lineTr(y, th.ink, 1.5));
        traces.push(curveTr(u, th.muted, 1.2, done ? null : 'dash'));
        traces.push(bundle(D, 'D'));
        traces.push(bundle(Hu, 'H'));
        traces.push(label(Hu[tie ? 1 : 0], done ? 'D = H(p, V(p,y))' : `H(p, ${fmt(u)})`, done ? th.ink : th.blue));
        break;
      }
      case 'DH': {   // D(p,m) moves along the path as income rises to C(p,v), and lands on H
        const m = mOf(), Dm = M.demandSet(ex, p, m, a);
        traces.push(path());
        traces.push(curveTr(v, th.ink, 1.5));
        traces.push(lineTr(m, th.muted, 1.2, done ? null : 'dash'));
        traces.push(bundle(H, 'H'));
        traces.push(bundle(Dm, 'D'));
        traces.push(label(Dm[tie ? 1 : 0], done ? 'H = D(p, C(p,v))' : `D(p, ${fmt(m)})`, done ? th.ink : th.red));
        break;
      }
    }
    U.plot('plot', traces, U.base2d(th, { xt: 'x<sub>1</sub>', yt: 'x<sub>2</sub>', x: { range: [0, L], constrain: 'domain' }, y: { range: [0, L], scaleanchor: 'x', constrain: 'domain' }, margin: { l: 44, r: 10, t: 8, b: 40 } }), { ...U.PLOT_CONFIG, displayModeBar: false, staticPlot: true });
  }

  // What the figure shows, for each arrow.
  function figCaption(id, S) {
    const red = s => `<span class="c-l2-red">${s}</span>`, blue = s => `<span class="c-l2-blue">${s}</span>`, dots = '<span class="c-muted">dotted</span>';
    const pathNote = S.tie ? '' : ` The ${dots} path holds the best bundle at every income.`;
    switch (id) {
      case 'DV': return `Plug ${red('the bundle D')} into ${texStr('U')}: the ${red('indifference curve')} through it is the highest one the budget line reaches, ${texStr(`U=V(p,y)=${fmt(S.v)}`)}.`;
      case 'VD': return S.tie ? `${red('Every bundle')} on the budget line reaches the ${red('indifference curve')} ${texStr('U=V(p,y)')}; ${texStr('V')} has a kink in ${texStr('p_1')}, so Roy's identity cannot pick one.`
        : `Roy's identity: a small rise ${texStr('\\Delta')} in ${texStr('p_1')} costs the consumer about ${texStr('D^1\\Delta')} of income, worth ${texStr('V_y D^1\\Delta')} in utility; so ${texStr('-V_{p_1}=V_yD^1')}, and ${red('D')} is where the ${red('curve')} touches the budget line.`;
      case 'VC': return `Inverting ${texStr('V')}: ${blue('budget lines')} move out until the best affordable bundle reaches the ${red('indifference curve')} ${texStr('U=v')}. That income is ${texStr(`C(p,v)=${fmt(S.C)}`)}.${pathNote}`;
      case 'CV': return `Inverting ${texStr('C')}: ${red('indifference curves')} move up until their cheapest bundle costs the whole ${blue('budget')} ${texStr(`y=${fmt(S.y)}`)}. That level is ${texStr(`V(p,y)=${fmt(S.v)}`)}.${pathNote}`;
      case 'CH': return S.tie ? `${blue('Every bundle')} on the line is a cheapest way to reach ${texStr('U=v')}; ${texStr('C')} has a kink in ${texStr('p_1')}, so Shephard's lemma cannot pick one.`
        : `Shephard's lemma: a small rise ${texStr('\\Delta')} in ${texStr('p_1')} makes ${blue('the bundle H')} cost ${texStr('H^1\\Delta')} more, and switching to another bundle saves only a second-order amount (the envelope theorem). So ${texStr('\\partial C/\\partial p_1=H^1')}.`;
      case 'HC': return `Weight by prices: the cost of ${blue('the bundle H')} at prices ${texStr('p')}. The ${blue('line')} through ${texStr('H')} with slope ${texStr('-p_1/p_2')} is the cheapest budget line, ${texStr(`p^tx=C(p,v)=${fmt(S.C)}`)}.`;
      case 'HD': return `Substitute ${texStr('V')}: ${blue('H(p,u)')} for a rising utility level ${texStr('u')}. At ${texStr(`u=V(p,y)=${fmt(S.v)}`)} the cheapest bundle costs ${texStr('y')}: it is ${red('D(p,y)')}.${pathNote}`;
      case 'DH': return `Substitute ${texStr('C')}: ${red('D(p,m)')} for a rising income ${texStr('m')}. At ${texStr(`m=C(p,v)=${fmt(S.C)}`)} the best affordable bundle reaches ${texStr('U=v')}: it is ${blue('H(p,v)')}.${pathNote}`;
    }
    return '';
  }

  // ---------- drawing ----------

  // A formula wider than its box is drawn smaller (down to 60%), so that no box needs a scroll bar.
  function fit(el) {
    el.style.fontSize = '';
    const w = el.clientWidth, sw = el.scrollWidth;
    if (w > 0 && sw > w + 1) el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * Math.max(0.6, (w - 2) / sw)}px`;
  }
  const fitAll = () => document.querySelectorAll('#formula, #card-step, .cell-tex').forEach(fit);

  function drawFigure() {
    const S = solve(), th = U.theme();
    guard('figure', () => figure(th, S, state.sel, state.t));
  }

  function render() {
    U.applyVisibility({ cd: state.ex === 'cd' });
    document.querySelectorAll('[data-ex]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ex === state.ex)));
    const S = solve(), A = ARROWS[state.sel], C8 = cells(S.ex, S.reg);
    tex($('formula'), formula(S.ex), true);
    $('ex-note').innerHTML = exNote(S);
    markSquare();
    $('card-rule').innerHTML = `${texStr(`${A.from}\\to ${A.to}`)} <b>${A.name}</b>: ${texStr(A.rule)}`;
    tex($('card-step'), C8[state.sel], true);
    $('card-num').innerHTML = `At ${texStr(`p=(${fmt(S.p[0])},\\ ${fmt(S.p[1])}),\\ y=${fmt(S.y)}${S.ex === 'cd' ? `,\\ \\alpha=${fmt(S.a)}` : ''}`)}: ${numbers(state.sel, S)}`;
    $('figcap').innerHTML = figCaption(state.sel, S);
    guard('table', () => {
      $('grid').innerHTML = GRID.map(id => {
        const B = ARROWS[id];
        return `<div class="cell${id === state.sel ? ' sel' : ''}" data-id="${id}" role="button" tabindex="0" aria-pressed="${id === state.sel}">` +
          `<div class="cell-head">${texStr(`${B.from}\\to ${B.to}`)} <b>${B.name}</b></div>` +
          `<div class="cell-rule">${texStr(B.short)}</div>` +
          `<div class="cell-tex formula">${texStr('\\displaystyle ' + C8[id])}</div>` +
          `<div class="cell-val">${value(id, S)}</div></div>`;
      }).join('');
    });
    fitAll();
    drawFigure();
  }
  const schedule = U.scheduler(render);

  // ---------- animation and the round trips ----------

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // One player for both a single arrow and a trip round the square: each arrow plays its step in the figure (ANIM ms),
  // then holds the result (HOLD ms, on a trip) before the next. Time runs only while not paused.
  const ANIM = 2400, TRIP_ANIM = 3400, HOLD = 3000;
  let player = null;
  function frame(now) {
    const P = player;
    if (!P || P.paused) return;
    P.elapsed += now - P.last; P.last = now;
    if (P.phase === 'anim') {
      state.t = P.dur > 0 ? Math.min(1, P.elapsed / P.dur) : 1;
      drawFigure();
      if (state.t >= 1) { P.phase = 'hold'; P.elapsed = 0; }
    } else if (P.elapsed >= P.hold) {
      if (P.i + 1 < P.seq.length) { P.i++; startStep(); }
      else { finish(); return; }
    }
    P.frame = requestAnimationFrame(frame);
  }
  function startStep() {
    const P = player;
    P.phase = 'anim'; P.elapsed = 0;
    state.sel = P.seq[P.i]; state.t = P.dur > 0 ? 0 : 1;
    render();
    tripStatus();
  }
  function play(seq, dir) {
    stop();
    const still = reduced();
    player = { seq, dir, i: 0, dur: still ? 0 : dir ? TRIP_ANIM : ANIM, hold: dir ? (still ? 5000 : HOLD) : 0, paused: false, last: performance.now(), elapsed: 0, phase: 'anim', frame: 0 };
    startStep();
    tripButtons();
    player.frame = requestAnimationFrame(frame);
  }
  function stop() {
    if (!player) return;
    cancelAnimationFrame(player.frame);
    const wasTrip = !!player.dir;
    player = null;
    if (state.t < 1) { state.t = 1; drawFigure(); }
    if (wasTrip) { tripButtons(); $('trip-status').innerHTML = ''; }
  }
  function finish() {
    const dir = player.dir;
    player = null;
    tripButtons();
    if (dir) {
      const S = solve();
      $('trip-status').innerHTML = `Back at ${texStr('D')}: ${texStr(`D(p,y)=${setTex(S, S.D, S.y / S.p[0])}`)}, the bundle we started from.`;
    }
  }
  function pause(on) {
    const P = player;
    if (!P) return;
    P.paused = on;
    if (on) cancelAnimationFrame(P.frame);
    else { P.last = performance.now(); P.frame = requestAnimationFrame(frame); }
    tripButtons(); tripStatus();
  }
  // Choose an arrow and play its step once.
  const select = id => play([id], null);
  function tripButtons() {
    for (const dir of ['fwd', 'back']) {
      const b = $(`trip-${dir}`), on = player && player.dir === dir;
      b.textContent = !on ? `▶ ${NAMES[dir]}` : player.paused ? '▶ Resume' : '❚❚ Pause';
      b.setAttribute('aria-pressed', String(!!on));
    }
    $('trip-stop').hidden = !(player && player.dir);
  }
  function tripStatus() {
    const P = player;
    if (!P || !P.dir) return;
    const A = ARROWS[P.seq[P.i]];
    $('trip-status').innerHTML = `Step ${P.i + 1} of 4: ${texStr(`${A.from}\\to ${A.to}`)}, ${A.name}${P.paused ? ' <span class="c-muted">(paused)</span>' : ''}`;
  }
  // A trip button starts its trip; while that trip runs it pauses it, and then resumes it.
  function tripButton(dir) {
    if (player && player.dir === dir) pause(!player.paused);
    else play(TRIPS[dir], dir);
  }

  function init() {
    U.renderStaticTex();
    buildSquare();
    ctrls = U.controls(document, state, { onChange: schedule });
    document.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => {
      state.ex = b.dataset.ex; select(state.sel);
    }));
    $('grid').addEventListener('click', ev => { const c = ev.target.closest('.cell'); if (c) select(c.dataset.id); });
    $('grid').addEventListener('keydown', ev => {
      const c = ev.target.closest('.cell');
      if (c && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); select(c.dataset.id); }
    });
    $('trip-fwd').addEventListener('click', () => tripButton('fwd'));
    $('trip-back').addEventListener('click', () => tripButton('back'));
    $('trip-stop').addEventListener('click', stop);
    $('reset').addEventListener('click', () => {
      stop();
      for (const k of ['p1', 'p2', 'y', 'alpha']) ctrls[k].setExact(DEF[k]);
      state.ex = DEF.ex; schedule();
    });
    render();
    window.addEventListener('resize', schedule);
    U.watchColorScheme(schedule);
  }

  if (U.librariesReady(M, 'duality-square/model.js')) guard('page', init);
})();
