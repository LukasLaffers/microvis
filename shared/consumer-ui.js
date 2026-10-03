/*
 * Shared presentation helpers for the consumer tools (lecture 6+): KaTeX formulas for the utility functions of
 * shared/consumer-model.js. No economics here.
 */
(function (root) {
  'use strict';
  const num = v => (root.Microvis ? root.Microvis.num(v) : String(Math.round(v * 100) / 100));

  function formula(u) {
    switch (u.type) {
      case 'ces': {
        const inv = u.rho < 0 ? `1/(${num(u.rho)})` : `1/${num(u.rho)}`;
        return `\\begin{gathered}U(x)=\\big(${num(u.delta)}\\,x_1^{${num(u.rho)}}+${num(1 - u.delta)}\\,x_2^{${num(u.rho)}}\\big)^{${inv}}\\\\ \\sigma=\\tfrac{1}{1-\\rho}=${num(1 / (1 - u.rho))}\\end{gathered}`;
      }
      case 'stonegeary': return `U(x)=(x_1${u.g1 < 0 ? '+' + num(-u.g1) : '-' + num(u.g1)})^{${num(u.a)}}(x_2${u.g2 < 0 ? '+' + num(-u.g2) : '-' + num(u.g2)})^{${num(1 - u.a)}}`;
      case 'quasilinear': return `U(x)=${num(u.kappa)}\\log(1+x_1)+x_2`;
      case 'giffen': return `U(x)=-\\frac{(${num(u.s)}-x_2)^2}{x_1-${num(u.c)}}`;
    }
    return '';
  }

  // Keep the CES parameter away from 0 (rho = 0 would be Cobb-Douglas, the subject of an exercise).
  const rhoAway = rho => (Math.abs(rho) < 0.1 ? (rho < 0 ? -0.1 : 0.1) : rho);

  root.ConsumerUI = { formula, rhoAway };
})(typeof globalThis !== 'undefined' ? globalThis : this);
