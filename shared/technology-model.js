/*
 * Technologies for the lecture 1 tools on homogeneity, homotheticity and the two elasticities.
 *
 * Homothetic technologies phi(z) = F(g(z)):
 *   g  homogeneous of degree one, the shape of the isoquants (substitution):
 *      'cd'   z1^delta z2^(1-delta)                                         sigma = 1
 *      'ces'  (delta z1^rho + (1-delta) z2^rho)^(1/rho)                     sigma = 1/(1-rho)
 *      'mix'  m CES(z) + (1-m) (delta z1 + (1-delta) z2)                    sigma changes along the isoquant
 *   F  increasing, the labels of the isoquants (scale); e(z) is the elasticity of F at g(z):
 *      'power'   A x^k                       e = k: phi is homogeneous of degree k
 *      'sshape'  s^2 x^2 / (s^2 + x^2)       e = 2 s^2/(s^2 + x^2): increasing, then decreasing returns
 *      'log'     c ln(1 + x)                 e < 1 and falling
 * A technology that is not homothetic:
 *   form 'quasilinear'   phi(z) = a sqrt(z1) + z2   (the MRTS depends on z1 only, so it changes along rays)
 *
 * Optional transformations of a base technology phi (lecture whiteboard, 9 Oct):
 *   of the output   h(phi(z)),               h = 'square' | 'sqrt' | 'log' (ln(1+q)) | 'none'
 *   of the inputs   phi(z1^b1, z2^b2),       b1 = b2 = 1: none
 * h leaves the MRTS, and so sigma, unchanged (h' cancels) but changes e; the input transformations change both.
 *
 * S = { form: 'homothetic' | 'quasilinear', g, delta, rho, m, F, A, k, s, c, a, h, b1, b2 }.
 * Works in the browser (window.TechModel) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const RHO_CD = 1e-6;   // |rho| below this: the Cobb-Douglas limit

  // ---------- the aggregator g (degree one) ----------

  // CES part with its gradient and cross derivative; the Cobb-Douglas limit at rho = 0.
  function ces(z, delta, rho) {
    const [z1, z2] = z, d = delta, e = 1 - d;
    if (Math.abs(rho) < RHO_CD) {
      const v = Math.pow(z1, d) * Math.pow(z2, e);
      const g1 = d * v / z1, g2 = e * v / z2;
      return { v, g1, g2, g12: g1 * g2 / v };
    }
    if (rho < 0 && (z1 <= 0 || z2 <= 0)) return { v: 0, g1: NaN, g2: NaN, g12: NaN };
    const v = Math.pow(d * Math.pow(z1, rho) + e * Math.pow(z2, rho), 1 / rho);
    const g1 = d * Math.pow(v / z1, 1 - rho), g2 = e * Math.pow(v / z2, 1 - rho);
    return { v, g1, g2, g12: (1 - rho) * g1 * g2 / v };
  }

  function gParts(z, S) {
    switch (S.g) {
      case 'cd': return ces(z, S.delta, 0);
      case 'ces': return ces(z, S.delta, S.rho);
      case 'mix': {
        const C = ces(z, S.delta, S.rho), m = S.m, d = S.delta;
        return {
          v: m * C.v + (1 - m) * (d * z[0] + (1 - d) * z[1]),
          g1: m * C.g1 + (1 - m) * d, g2: m * C.g2 + (1 - m) * (1 - d), g12: m * C.g12
        };
      }
      default: throw new Error(`unknown aggregator ${S.g}`);
    }
  }
  const g = (z, S) => gParts(z, S).v;

  // ---------- the transformation F ----------

  function F(x, S) {
    if (!(x > 0)) return 0;
    switch (S.F) {
      case 'power': return S.A * Math.pow(x, S.k);
      case 'sshape': return S.s * S.s * x * x / (S.s * S.s + x * x);
      case 'log': return S.c * Math.log1p(x);
      default: throw new Error(`unknown F ${S.F}`);
    }
  }
  function Fprime(x, S) {
    switch (S.F) {
      case 'power': return S.A * S.k * Math.pow(x, S.k - 1);
      case 'sshape': { const s2 = S.s * S.s, D = s2 + x * x; return 2 * s2 * s2 * x / (D * D); }
      case 'log': return S.c / (1 + x);
      default: throw new Error(`unknown F ${S.F}`);
    }
  }
  function Fsecond(x, S) {
    switch (S.F) {
      case 'power': return S.A * S.k * (S.k - 1) * Math.pow(x, S.k - 2);
      case 'sshape': { const s2 = S.s * S.s, D = s2 + x * x; return 2 * s2 * s2 * (s2 - 3 * x * x) / (D * D * D); }
      case 'log': return -S.c / ((1 + x) * (1 + x));
      default: throw new Error(`unknown F ${S.F}`);
    }
  }
  // Elasticity of F: x F'(x) / F(x).
  function Felasticity(x, S) {
    switch (S.F) {
      case 'power': return S.k;
      case 'sshape': return 2 * S.s * S.s / (S.s * S.s + x * x);
      case 'log': return x / ((1 + x) * Math.log1p(x));
      default: throw new Error(`unknown F ${S.F}`);
    }
  }
  // The amount of g that produces q (null if q is out of reach).
  function Finv(q, S) {
    if (!(q > 0)) return 0;
    switch (S.F) {
      case 'power': return Math.pow(q / S.A, 1 / S.k);
      case 'sshape': return q < S.s * S.s ? S.s * Math.sqrt(q / (S.s * S.s - q)) : null;
      case 'log': return Math.expm1(q / S.c);
      default: throw new Error(`unknown F ${S.F}`);
    }
  }
  // The largest output the technology can reach (Infinity if unbounded).
  const maxOutput = S => {
    const base = S.form === 'homothetic' && S.F === 'sshape' ? S.s * S.s : Infinity;
    return Number.isFinite(base) ? hFun(base, S)[0] : Infinity;
  };

  // ---------- the base technology and its derivatives ----------

  function basePhi(z, S) {
    if (S.form === 'quasilinear') return S.a * Math.sqrt(Math.max(0, z[0])) + z[1];
    return F(g(z, S), S);
  }

  function baseGrad(z, S) {
    if (S.form === 'quasilinear') return [S.a / (2 * Math.sqrt(z[0])), 1];
    const P = gParts(z, S), f = Fprime(P.v, S);
    return [f * P.g1, f * P.g2];
  }

  function baseHessian(z, S) {
    if (S.form === 'quasilinear') return [[-S.a / (4 * Math.pow(z[0], 1.5)), 0], [0, 0]];
    // phi_ij = F'' g_i g_j + F' g_ij, with g_11 = -(z2/z1) g_12 and g_22 = -(z1/z2) g_12 (degree one).
    const P = gParts(z, S), F2 = Fsecond(P.v, S), F1 = Fprime(P.v, S);
    const g11 = -(z[1] / z[0]) * P.g12, g22 = -(z[0] / z[1]) * P.g12;
    return [[F2 * P.g1 * P.g1 + F1 * g11, F2 * P.g1 * P.g2 + F1 * P.g12], [F2 * P.g1 * P.g2 + F1 * P.g12, F2 * P.g2 * P.g2 + F1 * g22]];
  }

  // ---------- transformations: h(phi(z1^b1, z2^b2)) ----------

  const b1 = S => (S.b1 === undefined ? 1 : S.b1), b2 = S => (S.b2 === undefined ? 1 : S.b2);
  const hOf = S => S.h || 'none';
  const inputsTransformed = S => b1(S) !== 1 || b2(S) !== 1;
  const isTransformed = S => inputsTransformed(S) || hOf(S) !== 'none';

  // h, h' and h''
  function hFun(q, S) {
    switch (hOf(S)) {
      case 'none': return [q, 1, 0];
      case 'square': return [q * q, 2 * q, 2];
      case 'sqrt': { const r = Math.sqrt(q); return [r, 0.5 / r, -0.25 / (r * q)]; }
      case 'log': return [Math.log1p(q), 1 / (1 + q), -1 / ((1 + q) * (1 + q))];
      default: throw new Error(`unknown h ${S.h}`);
    }
  }
  const hInv = (q, S) => ({ none: q, square: Math.sqrt(q), sqrt: q * q, log: Math.expm1(q) })[hOf(S)];

  // u = (z1^b1, z2^b2) with u' and u''
  function inner(z, S) {
    const B = [b1(S), b2(S)];
    return {
      u: [Math.pow(z[0], B[0]), Math.pow(z[1], B[1])],
      d1: [B[0] * Math.pow(z[0], B[0] - 1), B[1] * Math.pow(z[1], B[1] - 1)],
      d2: [B[0] * (B[0] - 1) * Math.pow(z[0], B[0] - 2), B[1] * (B[1] - 1) * Math.pow(z[1], B[1] - 2)]
    };
  }

  function phi(z, S) {
    if (!isTransformed(S)) return basePhi(z, S);
    const v = basePhi(inputsTransformed(S) ? inner(z, S).u : z, S);
    return hFun(v, S)[0];
  }

  // gradient and Hessian by the chain rule: psi(z) = phi(u(z)), then h(psi)
  function derivs(z, S) {
    const I = inputsTransformed(S) ? inner(z, S) : { u: z, d1: [1, 1], d2: [0, 0] };
    const v = basePhi(I.u, S), bg = baseGrad(I.u, S), bH = baseHessian(I.u, S);
    const pg = [bg[0] * I.d1[0], bg[1] * I.d1[1]];
    const pH = [[bH[0][0] * I.d1[0] * I.d1[0] + bg[0] * I.d2[0], bH[0][1] * I.d1[0] * I.d1[1]],
      [bH[1][0] * I.d1[0] * I.d1[1], bH[1][1] * I.d1[1] * I.d1[1] + bg[1] * I.d2[1]]];
    const [, h1, h2] = hFun(v, S);
    return {
      grad: [h1 * pg[0], h1 * pg[1]],
      hess: [[h2 * pg[0] * pg[0] + h1 * pH[0][0], h2 * pg[0] * pg[1] + h1 * pH[0][1]], [h2 * pg[0] * pg[1] + h1 * pH[1][0], h2 * pg[1] * pg[1] + h1 * pH[1][1]]]
    };
  }
  const grad = (z, S) => (isTransformed(S) ? derivs(z, S).grad : baseGrad(z, S));
  const hessian = (z, S) => (isTransformed(S) ? derivs(z, S).hess : baseHessian(z, S));

  const mrts = (z, S) => { const d = grad(z, S); return d[0] / d[1]; };

  // Elasticity of scale e(z) = d log phi(alpha z) / d log alpha at alpha = 1 = (z . grad phi) / phi.
  function scaleElasticity(z, S) {
    if (S.form === 'homothetic' && !isTransformed(S)) return Felasticity(g(z, S), S);
    const d = grad(z, S);
    return (z[0] * d[0] + z[1] * d[1]) / phi(z, S);
  }

  // Elasticity of substitution sigma(z) = d log(z2/z1) / d log MRTS21 along the isoquant.
  // Homothetic: sigma of g, = g1 g2 / (g g12) (h does not change it). In general (two inputs):
  //   sigma = -phi1 phi2 (z1 phi1 + z2 phi2) / (z1 z2 (phi11 phi2^2 - 2 phi12 phi1 phi2 + phi22 phi1^2)).
  function sigma(z, S) {
    if (S.form === 'homothetic' && !inputsTransformed(S)) {
      if (S.g === 'cd') return 1;
      if (S.g === 'ces') return Math.abs(S.rho) < RHO_CD ? 1 : 1 / (1 - S.rho);
      const P = gParts(z, S);
      return P.g1 * P.g2 / (P.v * P.g12);
    }
    const d = grad(z, S), H = hessian(z, S);
    const den = z[0] * z[1] * (H[0][0] * d[1] * d[1] - 2 * H[0][1] * d[0] * d[1] + H[1][1] * d[0] * d[0]);
    return -d[0] * d[1] * (z[0] * d[0] + z[1] * d[1]) / den;
  }

  // phi(z1^b, z2^b) with the same b is still homothetic: g(z1^b, z2^b) is homogeneous of degree b.
  const isHomothetic = S => S.form === 'homothetic' && b1(S) === b2(S);
  const isHomogeneous = S => S.form === 'homothetic' && S.F === 'power' && !isTransformed(S);
  const degree = S => (isHomogeneous(S) ? S.k : NaN);

  // ---------- isoquants ----------

  // The point with factor intensity z2/z1 = r on the isoquant phi = q (null if q cannot be produced).
  function pointOnRay(r, q, S) {
    if (isTransformed(S)) {
      // phi rises along the ray: bisection in log alpha on phi(alpha (1, r)) = q
      if (!(q < maxOutput(S))) return null;
      const f = la => phi([Math.exp(la), r * Math.exp(la)], S) - q;
      let lo = -1, hi = 1;
      while (f(lo) > 0 && lo > -60) lo -= 2;
      while (f(hi) < 0 && hi < 60) hi += 2;
      if (f(lo) > 0 || f(hi) < 0) return null;
      for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
      const a = Math.exp((lo + hi) / 2);
      return [a, r * a];
    }
    if (S.form === 'quasilinear') {
      // a u + r u^2 = q with u = sqrt(z1)
      const u = (-S.a + Math.sqrt(S.a * S.a + 4 * r * q)) / (2 * r);
      return [u * u, r * u * u];
    }
    const x = Finv(q, S);
    if (x === null) return null;
    const z1 = x / g([1, r], S);
    return [z1, r * z1];
  }

  // Points of the isoquant phi = q inside [0, R]^2, from steep to flat.
  function isoquant(q, S, R, n = 300) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const r = Math.exp(7 - 14 * i / n), p = pointOnRay(r, q, S);
      if (p && p[0] <= R && p[1] <= R) out.push(p);
    }
    return out;
  }

  const api = {
    g, gParts, F, Fprime, Fsecond, Felasticity, Finv, maxOutput, basePhi, phi, grad, hessian, mrts, scaleElasticity, sigma,
    hFun, hInv, isTransformed, inputsTransformed, isHomothetic, isHomogeneous, degree, pointOnRay, isoquant
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TechModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
