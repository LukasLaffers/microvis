// Small schematic drawings (64 x 64) for the start-page tiles. Lines use currentColor (the text colour) and the
// class "a" for the accent, so they follow the light and dark themes.
const f = v => Math.round(v * 10) / 10;
const path = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L');
const svg = body => `<svg class="glyph" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
const out = {};

// Production Explorer: the hill phi = sqrt(z1 z2) as a wireframe, with one isoquant on it (accent).
{
  const P = (z1, z2, q) => [32 + (z1 - z2) * 4.6, 54 - (z1 + z2) * 1.5 - q * 4.2];   // oblique projection
  const lines = [];
  for (let k = 0; k <= 6; k += 1.5) {
    lines.push(path(Array.from({ length: 25 }, (_, i) => { const t = 6 * i / 24; return P(t, k, Math.sqrt(t * k)); })));
    lines.push(path(Array.from({ length: 25 }, (_, i) => { const t = 6 * i / 24; return P(k, t, Math.sqrt(t * k)); })));
  }
  const q = 3, iso = Array.from({ length: 40 }, (_, i) => { const z1 = 1.5 + 4.5 * i / 39, z2 = q * q / z1; return z2 <= 6 && z2 >= 1.5 ? P(z1, z2, q) : null; }).filter(Boolean);
  out['production-explorer'] = svg(`<path d="${lines.join('')}" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.55"/><path class="a" d="${path(iso)}" fill="none" stroke-width="2.2"/>`);
}

// Building the MRTS: axes, a convex isoquant, its tangent at a point, and the step triangle.
{
  const X = z => 10 + z * 8.5, Y = z => 56 - z * 8.5;
  const iso = Array.from({ length: 40 }, (_, i) => { const z1 = 0.55 + 5.3 * i / 39; return [X(z1), Y(2.6 / z1)]; }).filter(p => p[1] >= 6);
  const z0 = [1.75, 2.6 / 1.75], m = 2.6 / (z0[0] * z0[0]);
  const tan = [[X(z0[0] - 1.3), Y(z0[1] + 1.3 * m)], [X(z0[0] + 1.6), Y(z0[1] - 1.6 * m)]];
  const d = 1.1, step = [[X(z0[0]), Y(z0[1])], [X(z0[0] + d), Y(z0[1])], [X(z0[0] + d), Y(2.6 / (z0[0] + d))]];
  out['building-the-mrts'] = svg(
    `<path d="M10 6V56H60" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>` +
    `<path d="${path(iso)}" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<path class="a" d="${path(tan)}" fill="none" stroke-width="1.6" stroke-dasharray="3 2"/>` +
    `<path d="${path(step)}" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.8"/>` +
    `<circle class="af" cx="${f(X(z0[0]))}" cy="${f(Y(z0[1]))}" r="2.6"/>`);
}

// Edgeworth box: the box, one indifference curve from each corner touching on the contract curve, the price line.
{
  const L = 8, T = 56, W = 48, H = 48, X = x => L + x * W / 10, Y = y => T - y * H / 10;
  const ua = Array.from({ length: 40 }, (_, i) => { const x = 1.2 + 8.6 * i / 39; return [X(x), Y(25 / x)]; }).filter(p => p[1] >= T - H && p[1] <= T);
  const ub = Array.from({ length: 40 }, (_, i) => { const x = 1.2 + 8.6 * i / 39; return [X(10 - x), Y(10 - 25 / x)]; }).filter(p => p[1] >= T - H && p[1] <= T);
  const cc = [[X(0), Y(0)], [X(10), Y(10)]];
  const E = [5, 5], R = [8.4, 1.6], s = (E[1] - R[1]) / (E[0] - R[0]);
  const price = [[X(R[0] + 1.5), Y(R[1] + 1.5 * s)], [X(E[0] - 2.6), Y(E[1] - 2.6 * s)]];
  out['edgeworth-box'] = svg(
    `<rect x="${L}" y="${T - H}" width="${W}" height="${H}" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.7"/>` +
    `<path d="${path(cc)}" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 2" opacity="0.7"/>` +
    `<path d="${path(ua)}" fill="none" stroke="currentColor" stroke-width="1.8"/>` +
    `<path d="${path(ub)}" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.6"/>` +
    `<path class="a" d="${path(price)}" fill="none" stroke-width="1.6"/>` +
    `<circle class="af" cx="${f(X(E[0]))}" cy="${f(Y(E[1]))}" r="2.6"/><circle cx="${f(X(R[0]))}" cy="${f(Y(R[1]))}" r="2.2" fill="currentColor"/>`);
}
console.log(JSON.stringify(out));
