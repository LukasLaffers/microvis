/*
 * Zoom Out: Netputs Add Up: interface and the map (lecture 8).
 * The map is drawn in screen pixels from the view (centre and zoom), so that text and icons keep their size at every
 * zoom; what is drawn depends on the zoom: towns, then firms with the goods they pass, then one firm's plan.
 */
(function () {
  'use strict';

  const M = window.NetputModel, U = window.Microvis;
  if (!U) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="warn">Could not load shared/ui.js. Make sure the whole Microvis folder is present.</p>');
    return;
  }
  const { $, fmt, texStr, guard } = U;

  // ---------- the world: where towns and firms are (map units) ----------

  // countries: rectangles [x0, y0, x1, y1], with the zoom that shows the whole country
  const COUNTRY_AT = { north: { box: [10, 45, 630, 325], k: 1 }, south: { box: [770, 45, 1190, 325], k: 1.3 } };
  const TOWN_AT = {
    riv: { c: [115, 190], r: 88 }, hil: { c: [320, 150], r: 80 }, mil: { c: [525, 205], r: 70 },
    oak: { c: [880, 170], r: 85 }, bay: { c: [1085, 195], r: 80 }
  };
  const FIRM_AT = {
    'riv-pot': [75, 165], 'riv-pig': [155, 165], 'riv-sf': [115, 235],
    'hil-pot': [285, 125], 'hil-pig1': [355, 125], 'hil-pig2': [320, 195],
    'mil-sf1': [495, 185], 'mil-sf2': [555, 185], 'mil-sf3': [525, 240],
    'oak-pig1': [840, 135], 'oak-pig2': [920, 135], 'oak-pig3': [840, 205], 'oak-pig4': [920, 205],
    'bay-sf1': [1045, 175], 'bay-sf2': [1125, 175], 'bay-sf3': [1085, 240]
  };
  const WORLD_W = 1200, VIEW_W = 640;   // the world's width; the width a view at zoom 1 shows
  const LEVEL_K = { economy: 0.52, town: 2.55, firm: 6 };   // the zoom of each level's view (countries: COUNTRY_AT)
  const K_MIN = 0.45, K_MAX = 9;
  const levelOf = k => (k < 0.8 ? 'economy' : k < 1.7 ? 'country' : k < 4.5 ? 'town' : 'firm');
  const LEVELS = ['economy', 'country', 'town', 'firm'];

  const state = { sel: 'riv-pig', t: 1, scales: {}, flows: true };
  const view = { cx: 115, cy: 195, k: LEVEL_K.town };
  let ctrls = {}, W = 640, H = 512, B = 1;   // map size in pixels; B: pixels per map unit at zoom 1

  // ---------- numbers and words ----------

  const isInt = x => Math.abs(x - Math.round(x)) < 1e-9;
  const nf = x => (Math.abs(x) < 1e-9 ? '0' : (x > 0 ? '+' : '−') + (isInt(x) ? String(Math.round(Math.abs(x))) : fmt(Math.abs(x))));
  const amt = x => (isInt(x) ? String(Math.round(x)) : fmt(x));
  const sgn = x => (x > 1e-9 ? 'pos' : x < -1e-9 ? 'neg' : 'zero');
  const SHORT = ['sausages', 'potatoes', 'pigs', 'labour', 'land'];   // the table on a phone
  const ONE = ['sausage', 'potato', 'pig', 'labour hour', 'acre of land'];
  const goodsWord = (i, x) => (Math.abs(x - 1) < 1e-9 ? ONE[i] : M.GOODS[i]);
  const qty = (i, x) => `${amt(x)} ${goodsWord(i, x)}`;
  const list = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const tOf = id => M.scaleOf(state.scales, id);
  const firmLabel = id => M.FIRMS[id].name + (Math.abs(tOf(id) - 1) > 1e-9 ? ` ×${amt(tOf(id))}` : '');
  const townName = id => M.TOWNS.find(T => T.id === id).name;
  const countryName = id => M.COUNTRIES.find(C => C.id === id).name;
  const townCountry = id => M.TOWNS.find(T => T.id === id).country;
  const firmCountry = id => townCountry(M.FIRMS[id].town);
  const abbr = name => (name.length > 6 ? name.slice(0, 5) + '.' : name);   // names on the cards of a narrow map
  const supTex = id => M.TYPES[M.FIRMS[id].type].sup + (M.FIRMS[id].n ? ',' + M.FIRMS[id].n : '');

  // ---------- view ----------

  const toScreen = ([x, y]) => [(x - view.cx) * view.k * B + W / 2, (y - view.cy) * view.k * B + H / 2];
  const toWorld = ([sx, sy]) => [(sx - W / 2) / (view.k * B) + view.cx, (sy - H / 2) / (view.k * B) + view.cy];
  const clampView = () => {
    view.k = Math.min(K_MAX, Math.max(K_MIN, view.k));
    view.cx = Math.min(WORLD_W, Math.max(0, view.cx));
    view.cy = Math.min(360, Math.max(40, view.cy));
  };
  const nearest = (pts, p) => pts.reduce((b, q) => (Math.hypot(q[1][0] - p[0], q[1][1] - p[1]) < Math.hypot(b[1][0] - p[0], b[1][1] - p[1]) ? q : b));
  const boxCentre = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  const currentCountry = () => nearest(Object.entries(COUNTRY_AT).map(([id, C]) => [id, boxCentre(C.box)]), [view.cx, view.cy])[0];
  const currentTown = () => nearest(Object.entries(TOWN_AT).map(([id, T]) => [id, T.c]), [view.cx, view.cy])[0];
  const currentFirm = () => nearest(Object.entries(FIRM_AT), [view.cx, view.cy])[0];
  const target = (level, id) => {
    if (level === 'economy') return { cx: 600, cy: 285, k: LEVEL_K.economy };
    if (level === 'country') { const C = COUNTRY_AT[id], c = boxCentre(C.box); return { cx: c[0], cy: c[1] + 55, k: C.k }; }
    if (level === 'town') { const T = TOWN_AT[id]; return { cx: T.c[0], cy: T.c[1] + 5, k: LEVEL_K.town }; }
    const p = FIRM_AT[id]; return { cx: p[0], cy: p[1] + 12, k: LEVEL_K.firm };
  };

  // Fly to a view (or jump, with reduced motion).
  let flight = null;
  function flyTo(to) {
    if (flight) cancelAnimationFrame(flight);
    const from = { ...view }, t0 = performance.now(), dur = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    const step = now => {
      const s = dur ? Math.min(1, (now - t0) / dur) : 1, e = s * s * (3 - 2 * s);
      view.cx = from.cx + (to.cx - from.cx) * e; view.cy = from.cy + (to.cy - from.cy) * e;
      view.k = Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e);
      draw();
      flight = s < 1 ? requestAnimationFrame(step) : null;
    };
    flight = requestAnimationFrame(step);
  }
  const stopFlight = () => { if (flight) { cancelAnimationFrame(flight); flight = null; } };

  // ---------- drawing the map ----------

  function icon(type, [x, y], s, sel) {
    const ring = sel ? `<circle class="sel-ring" cx="${x}" cy="${y}" r="${22 * s}"/>` : '';
    const g = d => `${ring}<g class="icon" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})">${d}</g>`;
    if (type === 'pot') return g('<rect x="-14" y="-10" width="28" height="20"/><path d="M-14 -3H14M-14 4H14"/>');   // a field
    if (type === 'pig') return g('<path d="M-14 10V-3L0 -13L14 -3V10Z"/><path d="M-4 10V2H4V10"/>');   // a barn
    return g('<path d="M-15 10V-4L-7 2V-4L1 2V-12H7V10Z"/>');   // a factory
  }
  const narrow = () => W < 560;
  // A netput card: the vector with the goods' names, or, on a narrow map, the vector alone.
  function cardSize() { return narrow() ? { w: 66, h: 20 + 5 * 15 } : { w: 176, h: 24 + 5 * 17 }; }
  function card(x0, y0, title, q, id) {
    const { w, h } = cardSize(), n = narrow();
    x0 = Math.max(4, Math.min(W - w - 4, x0)); y0 = Math.max(4, Math.min(H - h - 4, y0));
    let s = `<g class="card${id === state.sel ? ' sel' : ''}"${id ? ` data-firm="${id}"` : ''}><rect x="${x0}" y="${y0}" width="${w}" height="${h}"/>` +
      `<text class="h" x="${x0 + 7}" y="${y0 + 15}">${title}</text>`;
    q.forEach((v, i) => {
      const y = y0 + (n ? 32 : 35) + i * (n ? 15 : 17);
      if (!n) s += `<text class="g" x="${x0 + 7}" y="${y}">${M.GOODS[i]}</text>`;
      s += `<text class="${sgn(v)}" x="${x0 + w - 7}" y="${y}" text-anchor="end">${nf(v)}</text>`;
    });
    return s + '</g>';
  }
  // Arrows for the goods passed between actors: one per ordered pair, a little to the right of the straight line, so
  // that two actors passing goods both ways get two arrows.
  function flowArrows(F, posOf, gapOf) {
    const pairs = new Map();
    for (const f of F) { const k = f.from + '>' + f.to; if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(f); }
    let paths = '', labels = '';
    for (const fs of pairs.values()) {
      const a = posOf(fs[0].from), b = posOf(fs[0].to), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < 1) continue;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, off = 5, ga = gapOf(fs[0].from, [ux, uy]), gb = gapOf(fs[0].to, [ux, uy]);
      const s = [a[0] + ux * ga + nx * off, a[1] + uy * ga + ny * off], e = [b[0] - ux * gb + nx * off, b[1] - uy * gb + ny * off];
      if (Math.hypot(e[0] - s[0], e[1] - s[1]) < 12) continue;
      paths += `<path class="flow" d="M${s[0].toFixed(1)},${s[1].toFixed(1)} L${e[0].toFixed(1)},${e[1].toFixed(1)}" marker-end="url(#flow-head)"/>`;
      const m = [(s[0] + e[0]) / 2 + nx * 9, (s[1] + e[1]) / 2 + ny * 9];
      const anchor = Math.abs(nx) < 0.3 ? 'middle' : nx > 0 ? 'start' : 'end';
      labels += `<text class="flab" x="${m[0].toFixed(1)}" y="${(m[1] + (ny > 0.3 ? 10 : ny < -0.3 ? -2 : 4)).toFixed(1)}" text-anchor="${anchor}">${list(fs.map(f => qty(f.good, f.amount)))}</text>`;
    }
    return { paths, labels };
  }

  function drawMap() {
    const svg = $('map'), level = levelOf(view.k), sc = narrow() ? 0.8 : 1;
    let back = '', mid = '', front = '';
    const px = v => (v * view.k * B);
    // countries
    for (const C of M.COUNTRIES) {
      const b = COUNTRY_AT[C.id].box, a = toScreen([b[0], b[1]]), z = toScreen([b[2], b[3]]);
      back += `<rect class="country" data-country="${C.id}" x="${a[0].toFixed(1)}" y="${a[1].toFixed(1)}" width="${(z[0] - a[0]).toFixed(1)}" height="${(z[1] - a[1]).toFixed(1)}" rx="10"/>`;
      front += `<text class="cname" x="${(a[0] + 4).toFixed(1)}" y="${(a[1] - 7).toFixed(1)}">${C.name}</text>`;   // above its frame, clear of the towns' names
    }
    // towns (on the economy level without names, the countries' cards speak for them)
    for (const T of M.TOWNS) {
      const at = TOWN_AT[T.id], c = toScreen(at.c), r = px(at.r);
      back += `<circle class="town" data-town="${T.id}" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}"/>`;
      if (level !== 'economy') front += `<text class="tname" x="${c[0].toFixed(1)}" y="${(c[1] - r - 7).toFixed(1)}" text-anchor="middle">${T.name}</text>`;
    }
    // firms (not on the economy level, where they would be specks)
    if (level !== 'economy') for (const id of Object.keys(FIRM_AT)) {
      const p = toScreen(FIRM_AT[id]);
      if (p[0] < -40 || p[0] > W + 40 || p[1] < -40 || p[1] > H + 40) continue;
      const s = (level === 'country' ? 0.7 : 1) * sc;
      mid += `<g class="firm${tOf(id) === 0 ? ' idle' : ''}" data-firm="${id}">${icon(M.FIRMS[id].type, p, s, id === state.sel)}<circle class="hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="20"/></g>`;
    }
    let cards = '', fl = { paths: '', labels: '' };
    const { w, h } = cardSize();
    const onScreen = p => p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;
    if (level === 'economy') {
      // from the centre of a country to the edge of its rectangle, in the direction of the arrow
      const centre = id => toScreen(boxCentre(COUNTRY_AT[id].box));
      if (state.flows) {
        const F = M.flows(M.countryActors(state.scales));
        fl = flowArrows(F, centre, (id, u) => { const b = COUNTRY_AT[id].box, hw = px(b[2] - b[0]) / 2, hh = px(b[3] - b[1]) / 2; return Math.min(Math.abs(u[0]) > 1e-9 ? hw / Math.abs(u[0]) : 1e9, Math.abs(u[1]) > 1e-9 ? hh / Math.abs(u[1]) : 1e9) + 3; });
      }
      for (const C of M.COUNTRIES) {
        const b = COUNTRY_AT[C.id].box, c = toScreen([(b[0] + b[2]) / 2, b[3]]);
        cards += card(c[0] - w / 2, c[1] + 12, narrow() ? abbr(C.name) : C.name, M.countryNet(C, state.scales));
      }
    } else if (level === 'country') {
      if (state.flows) for (const C of M.COUNTRIES) {
        const f = flowArrows(M.flows(M.townActors(C, state.scales)), id => toScreen(TOWN_AT[id].c), id => px(TOWN_AT[id].r) + 4);
        fl.paths += f.paths; fl.labels += f.labels;
      }
      for (const T of M.TOWNS) {
        const at = TOWN_AT[T.id], c = toScreen(at.c);
        if (!onScreen(c)) continue;
        cards += card(c[0] - w / 2, c[1] + px(at.r) + 12, narrow() ? abbr(T.name) : T.name, M.townNet(T, state.scales));
      }
    } else if (level === 'town') {
      if (state.flows) for (const T of M.TOWNS) {
        const f = flowArrows(M.flows(M.firmActors(T, state.scales)), id => toScreen(FIRM_AT[id]), () => 22 * sc);
        fl.paths += f.paths; fl.labels += f.labels;
      }
      for (const T of M.TOWNS) for (const f of T.firms) {
        const p = toScreen(FIRM_AT[f.id]);
        if (!onScreen(p)) continue;
        const d = [FIRM_AT[f.id][0] - TOWN_AT[T.id].c[0], FIRM_AT[f.id][1] - TOWN_AT[T.id].c[1]];
        const left = d[0] < -1, above = d[1] < -1;
        const x0 = above ? (left ? p[0] + 20 - w : p[0] - 20) : (left ? p[0] - 28 - w : p[0] + 28);
        const y0 = above ? p[1] - 28 - h : p[1] - 18;
        cards += card(x0, y0, narrow() ? M.FIRMS[f.id].short : firmLabel(f.id), M.firmNet(f.id, state.scales), f.id);
      }
    } else {
      // one firm: its inputs come in from the left, its outputs leave to the right
      const id = currentFirm(), p = toScreen(FIRM_AT[id]), q = M.firmNet(id, state.scales);
      const ins = q.map((v, i) => [v, i]).filter(([v]) => v < -1e-9), outs = q.map((v, i) => [v, i]).filter(([v]) => v > 1e-9);
      const len = narrow() ? 46 : 70, gap = 26;
      const arrowsOf = (items, side) => items.map(([v, i], j) => {
        const y = p[1] + (j - (items.length - 1) / 2) * 34;
        const s = side < 0 ? [p[0] - gap - len, y] : [p[0] + gap, p[1] + (y - p[1]) * 0.25];
        const e = side < 0 ? [p[0] - gap, p[1] + (y - p[1]) * 0.25] : [p[0] + gap + len, y];
        const lab = side < 0 ? `<text class="flab io" x="${(s[0] - 5).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end">${qty(i, -v)}</text>`
          : `<text class="flab io" x="${(e[0] + 9).toFixed(1)}" y="${(y + 4).toFixed(1)}">${qty(i, v)}</text>`;
        return `<path class="flow" d="M${s[0].toFixed(1)},${s[1].toFixed(1)} L${e[0].toFixed(1)},${e[1].toFixed(1)}" marker-end="url(#flow-head)"/>${lab}`;
      }).join('');
      fl.paths = arrowsOf(ins, -1) + arrowsOf(outs, 1);
      cards += card(p[0] - w / 2, p[1] + 80, narrow() ? M.FIRMS[id].short : `${firmLabel(id)}, ${townName(M.FIRMS[id].town)}`, q, id);
      if (!ins.length && !outs.length) fl.labels = `<text class="flab io" x="${p[0]}" y="${p[1] - 34}" text-anchor="middle">t = 0: inaction</text>`;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.innerHTML = '<defs><marker id="flow-head" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0.5 L8.5,4.5 L0,8.5 z"/></marker></defs>' +
      back + fl.paths + mid + front + fl.labels + cards;
  }

  // ---------- the table and the texts ----------

  let tableKey = '';
  function drawTable() {
    const level = levelOf(view.k), country = currentCountry(), town = currentTown(), firm = currentFirm();
    const key = JSON.stringify([level, country, town, firm, state.scales, state.sel]);
    if (key === tableKey) return;
    tableKey = key;
    let cols, sumCol = null, tRow = false, head, formula, cap;
    const words = ['', 'One', 'Two', 'Three', 'Four'];
    if (level === 'economy') {
      cols = M.COUNTRIES.map(C => ({ name: C.name, q: M.countryNet(C, state.scales) }));
      sumCol = { name: 'economy', q: M.economyNet(state.scales) };
      head = 'Two countries add up to the economy';
      formula = 'q^{ec}=' + M.COUNTRIES.map(C => `q^{\\text{${C.name}}}`).join('+');
      cap = economyText();
    } else if (level === 'country') {
      const C = M.COUNTRIES.find(x => x.id === country), Ts = C.towns.map(id => M.TOWNS.find(T => T.id === id));
      cols = Ts.map(T => ({ name: T.name, q: M.townNet(T, state.scales) }));
      sumCol = { name: C.name, q: M.countryNet(C, state.scales) };
      head = `${words[Ts.length]} towns add up to ${C.name}`;
      formula = `q^{\\text{${C.name}}}=` + Ts.map(T => `q^{\\text{${T.name}}}`).join('+');
      cap = countryText(C);
    } else if (level === 'town') {
      const T = M.TOWNS.find(x => x.id === town);
      cols = T.firms.map(f => ({ name: f.short, q: M.firmNet(f.id, state.scales), id: f.id, t: tOf(f.id) }));
      sumCol = { name: T.name, q: M.townNet(T, state.scales) };
      tRow = true;
      head = `${words[T.firms.length]} firms add up to ${T.name}`;
      formula = `q^{\\text{${T.name}}}=` + T.firms.map(f => `${tOf(f.id) === 1 ? '' : amt(tOf(f.id)) + '\\,'}q^{${supTex(f.id)}}`).join('+');
      cap = townText(T);
    } else {
      const base = M.TYPES[M.FIRMS[firm].type].q, t = tOf(firm);
      cols = [{ name: 'q', q: base, id: firm }, { name: `t·q, t = ${amt(t)}`, q: M.firmNet(firm, state.scales), id: firm }];
      head = `One firm: the ${M.FIRMS[firm].name} in ${townName(M.FIRMS[firm].town)}`;
      formula = `t\\,q^{${supTex(firm)}}=${amt(t)}\\cdot q^{${supTex(firm)}}`;
      cap = t === 0 ? `With ${texStr('t=0')} the firm is idle: the zero vector, inaction, ${texStr('0\\in Q')}.`
        : `Every entry is multiplied by ${texStr(`t=${amt(t)}`)}. Additivity and divisibility (properties 5 and 6) give ${texStr('tq\\in Q')} for every ${texStr('t>0')}: constant returns to scale.`;
    }
    let h = '<thead><tr><th></th>' + cols.map(c => `<th${c.id && level === 'town' ? ` class="pick${c.id === state.sel ? ' sel' : ''}" data-firm="${c.id}"` : ''}>${c.name}</th>`).join('') +
      (sumCol ? `<th class="sum">${sumCol.name}</th>` : '') + '</tr></thead><tbody>';
    if (tRow) h += '<tr class="t-row"><td>scale t</td>' + cols.map(c => `<td>${amt(c.t)}</td>`).join('') + (sumCol ? '<td class="sum"></td>' : '') + '</tr>';
    M.GOODS.forEach((g, i) => {
      h += `<tr><td><span class="long">${g}</span><span class="short">${SHORT[i]}</span></td>` + cols.map(c => `<td class="${sgn(c.q[i])}">${nf(c.q[i])}</td>`).join('') + (sumCol ? `<td class="sum ${sgn(sumCol.q[i])}">${nf(sumCol.q[i])}</td>` : '') + '</tr>';
    });
    $('nv').innerHTML = h + '</tbody>';
    $('table-head').textContent = head;
    U.tex($('table-formula'), formula);
    $('table-cap').innerHTML = cap;
  }
  // What cancels inside a town, and what the town needs from outside.
  function townText(T) {
    const F = M.flows(M.firmActors(T, state.scales)), q = M.townNet(T, state.scales), parts = [];
    const byGood = M.GOODS.map((g, i) => F.filter(f => f.good === i).reduce((s, f) => s + f.amount, 0));
    const passed = byGood.map((a, i) => [a, i]).filter(([a]) => a > 1e-9).map(([a, i]) => qty(i, a));
    if (passed.length) parts.push(`Inside ${T.name}, ${list(passed)} pass between firms: each appears once with + and once with −, and cancels in the sum.`);
    const need = [1, 2].filter(i => q[i] < -1e-9).map(i => qty(i, -q[i]));
    if (need.length) parts.push(`${T.name} uses more than its firms make: ${list(need)} must come from outside.`);
    if (T.id === 'riv' && T.firms.every(f => tOf(f.id) === 1)) parts.push(`This is the notes' example: ${texStr('q^{ec}=q^{pot\\text{-}f}+q^{pig\\text{-}f}+q^{s\\text{-}fact}')}.`);
    return parts.join(' ');
  }
  // What passes between the towns of a country, what cancels, and what the country needs from outside.
  function countryText(C) {
    const F = M.flows(M.townActors(C, state.scales)), q = M.countryNet(C, state.scales), parts = [];
    const pairs = F.map(f => `${townName(f.from)} sends ${qty(f.good, f.amount)} to ${townName(f.to)}`);
    if (pairs.length) parts.push(pairs.join('; ') + '.');
    for (const i of [1, 2]) {
      if (Math.abs(q[i]) < 1e-9 && F.some(f => f.good === i)) parts.push(`In ${C.name}'s total, ${M.GOODS[i]} net out to 0.`);
      else if (q[i] < -1e-9) parts.push(`${C.name} uses ${qty(i, -q[i])} more than its towns make: they must come from outside the country.`);
    }
    return parts.join(' ');
  }
  function economyText() {
    const F = M.flows(M.countryActors(state.scales)), q = M.economyNet(state.scales), parts = [];
    const pairs = F.map(f => `${countryName(f.from)} sends ${qty(f.good, f.amount)} to ${countryName(f.to)}`);
    if (pairs.length) parts.push(pairs.join('; ') + ": in the economy's total they cancel.");
    // (a gross flow both ways of one good leaves no trace in the vectors)
    if (pairs.length) parts.push(`Netputs record only net amounts: had the countries also shipped ${M.GOODS[F[0].good]} both ways, the vectors would be the same.`);
    for (const i of [1, 2]) {
      if (q[i] > 1e-9 && F.some(f => f.good === i)) parts.push(`What is left, ${qty(i, q[i])}, is the economy's net output.`);
      else if (q[i] < -1e-9) parts.push(`The economy as a whole uses ${qty(i, -q[i])} more than it makes: they must come from its endowment ${texStr('R')}.`);
    }
    parts.push(`Labour and land are only used: they come from the households, ${texStr('x\\le q+R')}.`);
    return parts.join(' ');
  }

  function drawTexts() {
    const level = levelOf(view.k), firm = currentFirm();
    const town = level === 'firm' ? M.FIRMS[firm].town : currentTown(), country = level === 'country' ? currentCountry() : townCountry(town);
    document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === level)));
    const crumb = (lvl, id, text, last) => last ? `<b>${text}</b>` : `<a href="#" data-go="${lvl}" data-id="${id || ''}">${text}</a>`;
    const depth = LEVELS.indexOf(level);
    $('crumbs').innerHTML = [crumb('economy', null, 'Economy', depth === 0),
      depth >= 1 ? crumb('country', country, countryName(country), depth === 1) : '',
      depth >= 2 ? crumb('town', town, townName(town), depth === 2) : '',
      depth >= 3 ? crumb('firm', firm, M.FIRMS[firm].name, true) : ''].filter(Boolean).join(' <span class="sep">›</span> ');
    $('cap').innerHTML = level === 'economy' ? 'Zoomed all the way out: each country is one actor, and its netput is the sum of its towns\'. <span class="c-flow">Orange arrows</span>: goods one country makes and the other uses. Click a country to zoom in.'
      : level === 'country' ? 'Zoomed in on a country: each town is one actor, and its netput is the sum of its firms\'. <span class="c-flow">Orange arrows</span>: goods one town makes and another uses. Click a town to zoom in.'
      : level === 'town' ? 'Zoomed in on a town: its firms with their netputs. <span class="c-flow">Orange arrows</span>: goods one firm makes and another uses. Click a firm to choose it, then scale it.'
        : 'Zoomed in on one firm: its inputs come in, its outputs go out. Inputs count negative, outputs positive.';
    $('sel-name').innerHTML = `<b>${M.FIRMS[state.sel].name}</b> in ${townName(M.FIRMS[state.sel].town)}`;
  }

  function draw() {
    guard('map', drawMap);
    guard('table', drawTable);
    drawTexts();
  }
  const schedule = U.scheduler(draw);

  // ---------- size ----------

  function measure() {
    const svg = $('map');
    W = Math.max(280, Math.round(svg.parentElement.clientWidth));
    H = Math.round(Math.min(560, Math.max(300, W * 0.8)));
    B = Math.min(W / VIEW_W, H / 400);
  }

  // ---------- interaction ----------

  function select(id) {
    state.sel = id;
    ctrls.t.setExact(tOf(id));
    schedule();
  }
  // Zooming goes level by level, onto the actor nearest the given point of the map, so the map always shows something:
  // in, to the country, town or firm there; out, to what holds the current view.
  function actorNear(level, p) {
    if (level === 'country') return nearest(Object.entries(COUNTRY_AT).map(([id, C]) => [id, boxCentre(C.box)]), p)[0];
    if (level === 'town') return nearest(Object.entries(TOWN_AT).map(([id, T]) => [id, T.c]), p)[0];
    if (level === 'firm') return nearest(Object.entries(FIRM_AT), p)[0];
    return null;
  }
  function stepLevel(dir, p) {
    const i = LEVELS.indexOf(levelOf(view.k)), j = Math.max(0, Math.min(LEVELS.length - 1, i + dir));
    if (j === i) { settle(); return; }
    // going out keeps to what is in view; going in picks what is under the pointer
    flyTo(target(LEVELS[j], actorNear(LEVELS[j], dir < 0 ? [view.cx, view.cy] : p)));
  }
  // After a drag or a pinch: the view of the nearest actor at the level of the current zoom.
  const settle = () => { const lvl = levelOf(view.k); flyTo(target(lvl, actorNear(lvl, [view.cx, view.cy]))); };
  function zoomAt(f, [sx, sy]) {
    stopFlight();
    const w = toWorld([sx, sy]);
    view.k = Math.min(K_MAX, Math.max(K_MIN, view.k * f));
    view.cx = w[0] - (sx - W / 2) / (view.k * B); view.cy = w[1] - (sy - H / 2) / (view.k * B);
    clampView(); schedule();
  }
  function bindMap() {
    const svg = $('map'), pts = new Map();
    let moved = false, pinch = null, lastTap = 0;
    const local = ev => { const r = svg.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    // the wheel: one level per notch (a trackpad's small steps add up to one), then a short pause while the map flies
    let wheelSum = 0, wheelQuiet = 0;
    svg.addEventListener('wheel', ev => {
      ev.preventDefault();
      const now = performance.now();
      if (now < wheelQuiet) { wheelSum = 0; return; }
      wheelSum += ev.deltaY * (ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 400 : 1);
      if (Math.abs(wheelSum) < 50) return;
      stepLevel(wheelSum < 0 ? 1 : -1, toWorld(local(ev)));
      wheelSum = 0; wheelQuiet = now + 450;
    }, { passive: false });
    svg.addEventListener('pointerdown', ev => {
      stopFlight();
      pts.set(ev.pointerId, local(ev));
      try { svg.setPointerCapture(ev.pointerId); } catch (err) { /* still works inside the map */ }
      moved = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k }; }
    });
    svg.addEventListener('pointermove', ev => {
      if (!pts.has(ev.pointerId)) return;
      const prev = pts.get(ev.pointerId), now = local(ev);
      pts.set(ev.pointerId, now);
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        moved = true;
        zoomAt(pinch.k * d / pinch.d / view.k, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      } else if (pts.size === 1) {
        if (Math.hypot(now[0] - prev[0], now[1] - prev[1]) > 0 && (moved || Math.abs(now[0] - prev[0]) + Math.abs(now[1] - prev[1]) > 3)) moved = true;
        if (moved) { view.cx -= (now[0] - prev[0]) / (view.k * B); view.cy -= (now[1] - prev[1]) / (view.k * B); clampView(); schedule(); }
      }
    });
    const up = ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      if (moved || ev.type === 'pointercancel') { if (pts.size === 0) settle(); return; }
      // a click: a firm is chosen (a second click on it zooms in); a town, seen from afar, is zoomed into
      // (a country, seen from afar, is zoomed into too)
      const el = document.elementFromPoint(ev.clientX, ev.clientY), f = el && el.closest('[data-firm]'), tw = el && el.closest('[data-town]'), co = el && el.closest('[data-country]');
      const level = levelOf(view.k), now = performance.now();
      if (level === 'economy' && (tw || co)) flyTo(target('country', tw ? townCountry(tw.dataset.town) : co.dataset.country));
      else if (level === 'country' && (f || tw)) flyTo(target('town', f ? M.FIRMS[f.dataset.firm].town : tw.dataset.town));
      else if (f && level !== 'economy') {
        if (f.dataset.firm === state.sel && now - lastTap < 450) flyTo(target('firm', f.dataset.firm));
        lastTap = now;
        select(f.dataset.firm);
      }
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
  }

  function init() {
    U.renderStaticTex();
    ctrls = U.controls(document, state, { onChange: () => { state.scales[state.sel] = state.t; schedule(); } });
    measure();
    bindMap();
    // a level button keeps to where the view is: the town (or country) in view, else that of the chosen firm
    document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
      const lvl = b.dataset.level, now = levelOf(view.k);
      const town = now === 'town' ? currentTown() : now === 'firm' ? M.FIRMS[currentFirm()].town : M.FIRMS[state.sel].town;
      const country = now === 'country' ? currentCountry() : now === 'economy' ? firmCountry(state.sel) : townCountry(town);
      flyTo(target(lvl, lvl === 'country' ? country : lvl === 'town' ? (now === 'country' && townCountry(M.FIRMS[state.sel].town) !== country ? M.TOWNS.find(T => T.country === country).id : town) : state.sel));
    }));
    $('crumbs').addEventListener('click', ev => {
      const a = ev.target.closest('[data-go]');
      if (!a) return;
      ev.preventDefault();
      flyTo(target(a.dataset.go, a.dataset.id));
    });
    $('nv').addEventListener('click', ev => { const th = ev.target.closest('[data-firm]'); if (th) select(th.dataset.firm); });
    $('zoom-in').addEventListener('click', () => stepLevel(1, [view.cx, view.cy]));
    $('zoom-out').addEventListener('click', () => stepLevel(-1, [view.cx, view.cy]));
    $('show-flows').addEventListener('change', e => { state.flows = e.target.checked; schedule(); });
    $('reset').addEventListener('click', () => { state.scales = {}; ctrls.t.setExact(1); });
    const ro = window.ResizeObserver ? new ResizeObserver(() => { measure(); schedule(); }) : null;
    if (ro) ro.observe($('map').parentElement); else window.addEventListener('resize', () => { measure(); schedule(); });
    draw();
  }

  if (M) guard('page', init); else U.showError('Could not load netput-aggregation/model.js.');
})();
