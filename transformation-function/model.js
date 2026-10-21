/*
 * The Transformation Function (lecture 8): a technology with two inputs and two outputs described by its transformation
 * function Phi, and the slopes of the frontier Phi(q) = 0 in the plane of any two goods. Pure math, no DOM; UMD so that
 * test-model.cjs can require it.
 *
 * Netputs q = (q_s, q_p, q_L, q_A): sausages and potatoes (outputs, q >= 0), labour and land (inputs, q <= 0).
 *   Phi(q) = sqrt(q_s^2 + (q_p / B)^2) - phi(-q_L, -q_A),   phi(z_L, z_A) = sqrt(z_L z_A),
 * so the outputs lie on a quarter ellipse whose size is the Cobb-Douglas output of the inputs. With q_p = 0 this is
 * Phi(q) = q_s - phi(z), the production function of lecture 1. A plan on the frontier is given by the inputs (L, A) and
 * the output mix th (0: only sausages, pi/2: only potatoes): q_s = phi cos th, q_p = B phi sin th.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PhiModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const B = 2;   // potatoes per unit of capacity, against one sausage
  const phi = (zL, zA) => Math.sqrt(zL * zA);
  const Phi = q => Math.sqrt(q[0] * q[0] + (q[1] / B) ** 2) - phi(-q[2], -q[3]);
  // the plan on the frontier with inputs L, A and output mix th
  function plan(L, A, th) {
    const f = phi(L, A);
    return [f * Math.cos(th), B * f * Math.sin(th), -L, -A];
  }
  // [Phi_s, Phi_p, Phi_L, Phi_A] at q (outputs not both 0, inputs positive): all positive
  function grad(q) {
    const o = Math.sqrt(q[0] * q[0] + (q[1] / B) ** 2), zL = -q[2], zA = -q[3];
    return [q[0] / o, q[1] / (B * B * o), 0.5 * Math.sqrt(zA / zL), 0.5 * Math.sqrt(zL / zA)];
  }
  // -dq_j/dq_i along the frontier, the other netputs fixed: Phi_i / Phi_j
  const slope = (q, i, j) => { const g = grad(q); return g[i] / g[j]; };

  // The four slices through a plan (each with the other two netputs fixed), as functions of one free netput:
  // the isoquant q_A(q_L) with both outputs fixed; sausages q_s(q_L) with potatoes and land fixed (the inverse gives the
  // fourth slice); the frontier of outputs q_p(q_s) with both inputs fixed.
  const capacity2 = q => q[0] * q[0] + (q[1] / B) ** 2;   // phi^2 needed for the outputs of q
  const isoA = (q, qL) => -capacity2(q) / -qL;
  function sausages(q, qL) {
    const g = -qL * -q[3] - (q[1] / B) ** 2;
    return g >= 0 ? Math.sqrt(g) : null;
  }
  function potatoes(q, qs) {
    const g = capacity2(q) - qs * qs;   // on the frontier the capacity is fixed by the inputs
    return g >= 0 ? B * Math.sqrt(g) : null;
  }

  // Moving the plan along a slice: the new (L, A, th).
  const alongIso = (q, L) => ({ L, A: capacity2(q) / L, th: Math.atan2(q[1] / B, q[0]) });
  function alongSausages(q, L) {
    const A = -q[3], s = sausages(q, -L);
    return s === null ? null : { L, A, th: Math.atan2(q[1] / B, s) };
  }
  const alongFrontier = (q, th) => ({ L: -q[2], A: -q[3], th });

  return { B, phi, Phi, plan, grad, slope, isoA, sausages, potatoes, alongIso, alongSausages, alongFrontier };
});
