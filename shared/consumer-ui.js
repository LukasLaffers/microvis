/*
 * Shared presentation helpers for the consumer tools (lecture 6+): KaTeX formulas for the utility functions of
 * shared/consumer-model.js. No economics here.
 */
(function (root) {
  'use strict';
  const num = v => (root.Microvis ? root.Microvis.num(v) : String(Math.round(v * 100) / 100));

  // The utility function in general form (first line) and the current parameter values (second line); extra is
  // appended to the values, e.g. ',\\ y=3.96'.
  function formula(u, extra = '') {
    const two = (general, values) => `\\begin{gathered}${general}\\\\ ${values}${extra}\\end{gathered}`;
    switch (u.type) {
      case 'ces':
        return two('U(x)=\\big(\\delta x_1^{\\rho}+(1-\\delta)x_2^{\\rho}\\big)^{1/\\rho}',
          `\\delta=${num(u.delta)},\\ \\rho=${num(u.rho)},\\ \\sigma=\\tfrac{1}{1-\\rho}=${num(1 / (1 - u.rho))}`);
      case 'stonegeary':
        return two('U(x)=(x_1-\\gamma_1)^{a}(x_2-\\gamma_2)^{1-a}',
          `a=${num(u.a)},\\ \\gamma_1=${num(u.g1)},\\ \\gamma_2=${num(u.g2)}`);
      case 'quasilinear':
        return two('U(x)=\\kappa\\log(1+x_1)+x_2', `\\kappa=${num(u.kappa)}`);
      case 'giffen':
        return two('U(x)=-\\frac{(s-x_2)^2}{x_1-c}', `c=${num(u.c)},\\ s=${num(u.s)}`);
      case 'additive':
        return two('U(x)=\\frac{x_1^{a}}{a}+\\frac{x_2^{b}}{b}', `a=${num(u.a)},\\ b=${num(u.b)}`);
      case 'humped':
        return two('U(x)=c\\log x_1+\\log x_2+\\frac{x_2^2}{2K^2}', `c=${num(u.c)},\\ K=${num(u.K)}`);
    }
    return '';
  }

  // Keep the CES parameter away from 0 (rho = 0 would be Cobb-Douglas, the subject of an exercise).
  const rhoAway = rho => (Math.abs(rho) < 0.1 ? (rho < 0 ? -0.1 : 0.1) : rho);
  // Slider adjustment for the CES parameter, so that the number shown is the number used.
  const adjustRho = (key, v) => (key === 'rho' ? rhoAway(v) : v);

  root.ConsumerUI = { formula, rhoAway, adjustRho };
})(typeof globalThis !== 'undefined' ? globalThis : this);
