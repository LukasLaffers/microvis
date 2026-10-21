/*
 * Zoom Out: Netputs Add Up (lecture 8): the netput vectors of firms, towns and the economy. Pure math, no DOM; UMD so
 * that test-model.cjs can require it.
 *
 * A production plan is a netput vector q: outputs positive, inputs negative. Each firm runs its plan at a scale t >= 0
 * (with additivity and divisibility, tq is feasible whenever q is). A town's netput is the sum of its firms', a
 * country's the sum of its towns', the economy's the sum of its countries'. Within a level, what net producers of a good make and net users of it use is passed
 * between them; only the rest leaves (or enters) the level, and that rest is its netput.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NetputModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GOODS = ['sausages', 'potatoes', 'pigs', 'labour hours', 'acres of land'];
  // The three firms of the notes (lecture 8, section 1.2).
  const TYPES = {
    pot: { name: 'potato farmer', short: 'pot-f', sup: 'pot\\text{-}f', q: [0, 990, 0, -10, -1] },
    pig: { name: 'pig farm', short: 'pig-f', sup: 'pig\\text{-}f', q: [0, -90, 20, -10, -1] },
    sf: { name: 'sausage factory', short: 's-fact', sup: 's\\text{-}fact', q: [1000, 0, -20, -10, 0] }
  };
  // Riverton is the economy of the notes; Hillside has pigs to spare, Millbrook needs them, and more than Hillside has.
  // Northland grows more potatoes than it uses; Southland grows none, but its pig farms need them, and they raise more
  // pigs than Bayport uses: potatoes go south, pigs go north.
  const COUNTRIES = [
    { id: 'north', name: 'Northland', towns: ['riv', 'hil', 'mil'] },
    { id: 'south', name: 'Southland', towns: ['oak', 'bay'] }
  ];
  const TOWNS = [
    { id: 'riv', name: 'Riverton', firms: [{ id: 'riv-pot', type: 'pot' }, { id: 'riv-pig', type: 'pig' }, { id: 'riv-sf', type: 'sf' }] },
    { id: 'hil', name: 'Hillside', firms: [{ id: 'hil-pot', type: 'pot' }, { id: 'hil-pig1', type: 'pig', n: 1 }, { id: 'hil-pig2', type: 'pig', n: 2 }] },
    { id: 'mil', name: 'Millbrook', firms: [{ id: 'mil-sf1', type: 'sf', n: 1 }, { id: 'mil-sf2', type: 'sf', n: 2 }, { id: 'mil-sf3', type: 'sf', n: 3 }] },
    { id: 'oak', name: 'Oakford', firms: [{ id: 'oak-pig1', type: 'pig', n: 1 }, { id: 'oak-pig2', type: 'pig', n: 2 }, { id: 'oak-pig3', type: 'pig', n: 3 }, { id: 'oak-pig4', type: 'pig', n: 4 }] },
    { id: 'bay', name: 'Bayport', firms: [{ id: 'bay-sf1', type: 'sf', n: 1 }, { id: 'bay-sf2', type: 'sf', n: 2 }, { id: 'bay-sf3', type: 'sf', n: 3 }] }
  ];
  for (const C of COUNTRIES) for (const id of C.towns) TOWNS.find(T => T.id === id).country = C.id;
  const FIRMS = {};
  for (const T of TOWNS) for (const f of T.firms) {
    f.town = T.id;
    f.name = TYPES[f.type].name + (f.n ? ' ' + f.n : '');
    f.short = TYPES[f.type].short + (f.n ? ' ' + f.n : '');
    FIRMS[f.id] = f;
  }

  const zero = () => GOODS.map(() => 0);
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sum = vs => vs.reduce(add, zero());
  // scales: {firmId: t}; a missing scale is 1
  const scaleOf = (scales, id) => (scales && scales[id] !== undefined ? scales[id] : 1);
  const firmNet = (id, scales) => TYPES[FIRMS[id].type].q.map(x => scaleOf(scales, id) * x);
  const townNet = (T, scales) => sum(T.firms.map(f => firmNet(f.id, scales)));
  const countryTowns = C => C.towns.map(id => TOWNS.find(T => T.id === id));
  const countryNet = (C, scales) => sum(countryTowns(C).map(T => townNet(T, scales)));
  const economyNet = scales => sum(COUNTRIES.map(C => countryNet(C, scales)));

  /*
   * Goods passed between the actors of one level. actors: [{id, q}]. For each good, the net producers (q > 0) supply the
   * net users (q < 0): in all min(supply, use) is passed, each producer's share in proportion to its output, each user's
   * in proportion to its use. Returns [{from, to, good, amount}]; the level's own netput, the sum of the q, is what is left.
   */
  function flows(actors) {
    const out = [];
    GOODS.forEach((g, i) => {
      const prod = actors.filter(a => a.q[i] > 1e-12), use = actors.filter(a => a.q[i] < -1e-12);
      const S = prod.reduce((s, a) => s + a.q[i], 0), Dm = use.reduce((s, a) => s - a.q[i], 0), F = Math.min(S, Dm);
      if (F <= 1e-12) return;
      for (const a of prod) for (const b of use) out.push({ from: a.id, to: b.id, good: i, amount: F * (a.q[i] / S) * (-b.q[i] / Dm) });
    });
    return out;
  }
  const firmActors = (T, scales) => T.firms.map(f => ({ id: f.id, q: firmNet(f.id, scales) }));
  const townActors = (C, scales) => countryTowns(C).map(T => ({ id: T.id, q: townNet(T, scales) }));
  const countryActors = scales => COUNTRIES.map(C => ({ id: C.id, q: countryNet(C, scales) }));

  return { GOODS, TYPES, COUNTRIES, TOWNS, FIRMS, add, sum, scaleOf, firmNet, townNet, countryNet, economyNet, flows, firmActors, townActors, countryActors };
});
