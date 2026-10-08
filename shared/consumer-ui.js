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

  // Incomes at which the consumer's problem has its usual solution at every price vector in ps: Stone–Geary needs income
  // above the cost of the subsistence bundle, the Giffen example an interior solution (c p1 + p2 s/2 <= y < c p1 + p2 s).
  function incomeBounds(u, ps) {
    let lo = 0, hi = Infinity;
    for (const p of ps) {
      if (u.type === 'stonegeary') lo = Math.max(lo, p[0] * Math.max(u.g1, 0) + p[1] * Math.max(u.g2, 0));
      if (u.type === 'giffen') { lo = Math.max(lo, u.c * p[0] + p[1] * u.s / 2); hi = Math.min(hi, u.c * p[0] + p[1] * u.s); }
    }
    return [lo, hi];
  }
  // Keep an income slider (Microvis control `ctrl` of state[key]) inside those bounds and inside its own range from the
  // page. Returns a sentence for the page when the bounds cut into that range, '' otherwise.
  function fitIncome(ctrl, state, key, u, ps) {
    if (!ctrl._range0) ctrl._range0 = [ctrl.min, ctrl.max];
    const [r0, r1] = ctrl._range0, [lo, hi] = incomeBounds(u, ps), step = Number(ctrl.range.step) || 0.05;
    const a = Math.max(r0, Math.ceil((lo + 0.01) / step) * step), b = Math.min(Math.max(r1, a + 5), Math.floor((hi - 0.01) / step) * step);
    if (!(a < b)) return 'No income gives an interior solution at both prices: bring the two prices closer together.';
    if (Math.abs(ctrl.min - a) > 1e-9 || Math.abs(ctrl.max - b) > 1e-9) ctrl.setRange(Number(a.toFixed(2)), Number(b.toFixed(2)));
    if (state[key] < a || state[key] > b) { state[key] = Number(Math.min(b, Math.max(a, state[key])).toFixed(2)); ctrl.sync(); }
    if (u.type === 'stonegeary' && lo > r0) return `Income must exceed the cost of the subsistence bundle, ${lo.toFixed(2)}: the income slider starts there.`;
    if (u.type === 'giffen') return `The Giffen example needs an interior solution: income between ${a.toFixed(2)} and ${b.toFixed(2)} at these prices.`;
    return '';
  }

  root.ConsumerUI = { formula, rhoAway, adjustRho, incomeBounds, fitIncome };
})(typeof globalThis !== 'undefined' ? globalThis : this);
