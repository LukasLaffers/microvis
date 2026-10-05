/*
 * Shared presentation helpers for the consumer tools (lecture 6+): KaTeX formulas for the utility functions of
 * shared/consumer-model.js. No economics here.
 */
(function (root) {
  'use strict';
  const num = v => (root.Microvis ? root.Microvis.num(v) : String(Math.round(v * 100) / 100));

<<<<<<< HEAD
  function formula(u) {
    switch (u.type) {
      case 'ces': {
        const inv = u.rho < 0 ? `1/(${num(u.rho)})` : `1/${num(u.rho)}`;
        return `\\begin{gathered}U(x)=\\big(${num(u.delta)}\\,x_1^{${num(u.rho)}}+${num(1 - u.delta)}\\,x_2^{${num(u.rho)}}\\big)^{${inv}}\\\\ \\sigma=\\tfrac{1}{1-\\rho}=${num(1 / (1 - u.rho))}\\end{gathered}`;
      }
      case 'stonegeary': return `U(x)=(x_1${u.g1 < 0 ? '+' + num(-u.g1) : '-' + num(u.g1)})^{${num(u.a)}}(x_2${u.g2 < 0 ? '+' + num(-u.g2) : '-' + num(u.g2)})^{${num(1 - u.a)}}`;
      case 'quasilinear': return `U(x)=${num(u.kappa)}\\log(1+x_1)+x_2`;
      case 'giffen': return `U(x)=-\\frac{(${num(u.s)}-x_2)^2}{x_1-${num(u.c)}}`;
=======
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
>>>>>>> 40baa6a22a6e5f3bc4b11bbf79b9556039b5218a
    }
    return '';
  }

  // Keep the CES parameter away from 0 (rho = 0 would be Cobb-Douglas, the subject of an exercise).
  const rhoAway = rho => (Math.abs(rho) < 0.1 ? (rho < 0 ? -0.1 : 0.1) : rho);
<<<<<<< HEAD

  root.ConsumerUI = { formula, rhoAway };
=======
  // Slider adjustment for the CES parameter, so that the number shown is the number used.
  const adjustRho = (key, v) => (key === 'rho' ? rhoAway(v) : v);

  root.ConsumerUI = { formula, rhoAway, adjustRho };
>>>>>>> 40baa6a22a6e5f3bc4b11bbf79b9556039b5218a
})(typeof globalThis !== 'undefined' ? globalThis : this);
