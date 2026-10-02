/*
 * Interface helpers shared by the lecture 2 tools (no math: formulas as KaTeX strings, labels).
 * Exposes window.FirmUI. Needs window.Microvis (shared/ui.js).
 */
(function (root) {
  'use strict';

  const num = x => String(Number(x.toFixed(2)));

  // g(z) with the current numbers.
  function gTex(s) {
    const d = s.delta;
    switch (s.tech) {
      case 'ces':
        return Math.abs(s.rho) < 1e-6 ? `z_1^{${num(d)}}z_2^{${num(1 - d)}}`
          : `\\big[${num(d)}\\,z_1^{${num(s.rho)}}+${num(1 - d)}\\,z_2^{${num(s.rho)}}\\big]^{${num(1 / s.rho)}}`;
      case 'linear': return `${num(d)}\\,z_1+${num(1 - d)}\\,z_2`;
      case 'leontief': return `\\min\\{z_1/${num(d)},\\ z_2/${num(1 - d)}\\}`;
      default: return `z_1^{${num(d)}}\\,z_2^{${num(1 - d)}}`;
    }
  }

  /*
   * Technology formula: {general, numbers} KaTeX strings.
   * 'homog': phi = A g^k written out per technology; 'ushape': phi = F(g(z)) with G = F^{-1}.
   */
  function techFormula(s) {
    if (s.profile === 'ushape') {
      return {
        general: `\\phi(z)=F\\big(g(z)\\big),\\ \\ g(z)=${gTex(s)}`,
        numbers: `F^{-1}(q)=G(q)=\\tfrac13q^3-${num(s.a)}q^2+${num(s.a * s.a + s.m)}q`
      };
    }
    const A = s.A === 1 ? '' : num(s.A) + '\\,', d = s.delta, k = s.k, pow = Math.abs(k - 1) < 1e-9 ? '' : `^{${num(k)}}`;
    switch (s.tech) {
      case 'ces':
        return {
          general: '\\phi(z)=A\\big[\\delta z_1^{\\rho}+(1-\\delta)z_2^{\\rho}\\big]^{k/\\rho}',
          numbers: Math.abs(s.rho) < 1e-6 ? `q=${A}z_1^{${num(d * k)}}z_2^{${num((1 - d) * k)}}`
            : `q=${A}\\big[${num(d)}\\,z_1^{${num(s.rho)}}+${num(1 - d)}\\,z_2^{${num(s.rho)}}\\big]^{${num(k / s.rho)}}`
        };
      case 'linear':
        return { general: '\\phi(z)=A\\big[\\delta z_1+(1-\\delta)z_2\\big]^{k}', numbers: `q=${A}\\big[${num(d)}\\,z_1+${num(1 - d)}\\,z_2\\big]${pow}` };
      case 'leontief':
        return { general: '\\phi(z)=A\\min\\{z_1/\\delta,\\ z_2/(1-\\delta)\\}^{k}', numbers: `q=${A}\\min\\{z_1/${num(d)},\\ z_2/${num(1 - d)}\\}${pow}` };
      default:
        return { general: '\\phi(z)=A\\,z_1^{\\alpha}z_2^{\\beta}=A\\,z_1^{\\delta k}z_2^{(1-\\delta)k}', numbers: `q=${A}z_1^{${num(d * k)}}\\,z_2^{${num((1 - d) * k)}}` };
    }
  }

  const KIND = { interior: 'Interior', corner: 'Corner', kink: 'Kink', multiple: 'Multiple' };

  root.FirmUI = { gTex, techFormula, KIND };
})(window);
