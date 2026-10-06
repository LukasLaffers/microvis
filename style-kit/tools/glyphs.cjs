// The small drawings on the start-page tiles: 64 x 64 SVG, one style for all of them.
// Axes: a faint L. Main curves: the text colour, 2 px. Secondary curves: thin and faint.
// The one object the page is about: the accent colour (class "a" for lines, "af" for fills; the CSS sets the
// colour, the inline colour is only a fallback if the stylesheet is missing). Used by tools/build-site.cjs.
// Draw in screen coordinates: x from 9 (left axis) to 59, y from 55 (bottom axis) up to 5.
const BRAND = '#1d5bd8';
const f = v => Math.round(v * 10) / 10;
const P = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L');
const fn = (g, a, b, n = 40) => Array.from({ length: n }, (_, i) => { const x = a + (b - a) * i / (n - 1); return [x, g(x)]; });
const inBox = pts => pts.filter(p => p[1] >= 5 && p[1] <= 55 && p[0] >= 9 && p[0] <= 59);

const AX = '<path d="M9 5V55H59" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45"/>';
const L = (pts, w = 2, extra = '') => `<path d="${P(pts)}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
const S = (pts, extra = '') => L(pts, 1.3, 'opacity="0.45"' + (extra ? ' ' + extra : ''));
const A = (pts, w = 2.2, extra = '') => `<path class="a" d="${P(pts)}" fill="none" stroke="${BRAND}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
const F = (pts, op = 0.16) => `<path class="af" d="${P(pts)}Z" fill="${BRAND}" opacity="${op}"/>`;
const D = (x, y, acc = true, r = 2.8) => acc ? `<circle class="af" cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${BRAND}"/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="currentColor"/>`;
const DASH = 'stroke-dasharray="3 3"';
const svg = b => `<svg class="glyph" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${b}</svg>`;
const G = {};

// Example: a curve (ink), a straight line touching it (accent, dashed) and the point where they touch.
G['example-tool'] = svg(AX + L(fn(x => 55 - 7 * Math.sqrt(x - 9), 9.5, 58, 60)) + A([[13, 34.7], [56, 4.6]], 1.8, DASH) + D(34, 20));

module.exports = G;
module.exports.helpers = { AX, L, S, A, F, D, DASH, svg, fn, inBox };
