// Checks the netputs of lecture 8. Run with:  node netput-aggregation/test-model.cjs
const assert = require('node:assert/strict');
const M = require('./model.js');

const close = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} != ${b}`);
const closeV = (a, b, msg) => a.forEach((x, i) => close(x, b[i], 1e-9, msg + ' ' + M.GOODS[i]));
let checks = 0;

// The notes' example: q^ec = q^pot-f + q^pig-f + q^s-fact = (1000, 900, 0, -30, -2): Riverton at scale 1.
const riv = M.TOWNS[0];
assert.deepEqual(M.townNet(riv, {}), [1000, 900, 0, -30, -2]); checks++;
assert.deepEqual(M.townNet(M.TOWNS[1], {}), [0, 810, 40, -30, -3]); checks++;
assert.deepEqual(M.townNet(M.TOWNS[2], {}), [2000, 0, -40, -20, 0]); checks++;
assert.deepEqual(M.economyNet({}), [3000, 1710, 0, -80, -5]); checks++;
// Inside Riverton 90 potatoes go to the pig farm and 20 pigs to the sausage factory; between towns, 40 pigs to Millbrook.
assert.deepEqual(M.flows(M.firmActors(riv, {})).map(f => [f.from, f.to, f.good, f.amount]), [['riv-pot', 'riv-pig', 1, 90], ['riv-pig', 'riv-sf', 2, 20]]); checks++;
assert.deepEqual(M.flows(M.townActors({})).map(f => [f.from, f.to, f.good, f.amount]), [['hil', 'mil', 2, 40]]); checks++;

// Random scales: sums, linearity in t, and the flows, checked good by good and actor by actor.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let n = 0; n < 400; n++) {
  const scales = {};
  for (const id of Object.keys(M.FIRMS)) scales[id] = n % 5 === 0 ? 1 : Math.round(rnd() * 30) / 10;
  // the economy is the sum of the towns, and also the sum of all firms
  closeV(M.economyNet(scales), M.sum(M.TOWNS.map(T => M.townNet(T, scales))), 'towns');
  closeV(M.economyNet(scales), M.sum(Object.keys(M.FIRMS).map(id => M.firmNet(id, scales))), 'firms');
  checks += 2;
  // constant returns: doubling every scale doubles every netput
  const twice = {}; for (const id in scales) twice[id] = 2 * scales[id];
  closeV(M.economyNet(twice), M.economyNet(scales).map(x => 2 * x), 'CRS'); checks++;
  for (const actors of [...M.TOWNS.map(T => M.firmActors(T, scales)), M.townActors(scales)]) {
    const F = M.flows(actors);
    for (const f of F) assert.ok(f.amount > 0 && f.from !== f.to); 
    M.GOODS.forEach((g, i) => {
      const S = actors.reduce((s, a) => s + Math.max(0, a.q[i]), 0), D = actors.reduce((s, a) => s + Math.max(0, -a.q[i]), 0);
      const Fi = F.filter(f => f.good === i), passed = Fi.reduce((s, f) => s + f.amount, 0);
      close(passed, Math.min(S, D), 1e-9, 'passed = min(S, D)'); checks++;
      for (const a of actors) {
        const sent = Fi.filter(f => f.from === a.id).reduce((s, f) => s + f.amount, 0), got = Fi.filter(f => f.to === a.id).reduce((s, f) => s + f.amount, 0);
        // nobody sends more than it makes or gets more than it uses; a good goes one way only
        assert.ok(sent <= Math.max(0, a.q[i]) + 1e-9 && got <= Math.max(0, -a.q[i]) + 1e-9); assert.ok(sent === 0 || got === 0);
        checks += 2;
      }
      // what is not passed is the level's netput of the good
      close(S - passed - (D - passed), actors.reduce((s, a) => s + a.q[i], 0), 1e-9, 'rest'); checks++;
    });
  }
}
// Inaction: every scale 0 gives the zero vector.
{ const z = {}; for (const id of Object.keys(M.FIRMS)) z[id] = 0; assert.deepEqual(M.economyNet(z).map(Math.abs), [0, 0, 0, 0, 0]); checks++; }
console.log(`All ${checks} netput checks passed.`);
