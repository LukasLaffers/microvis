// Example page: state, controls built by shared/ui.js, one Plotly figure, live numbers.
(function () {
  'use strict';
  const M = window.Microvis;
  if (!M.librariesReady(true)) return;
  M.renderStaticTex();

  const state = { A: 1, k: 0.5 };
  const q = z => state.A * Math.pow(z, state.k);

  function render() {
    M.guard('figure', () => {
      const th = M.theme();
      const zs = M.linspace(0, 3, 200);
      const data = [
        M.line2(zs.map(z => [z, q(z)]), th.accent, 3, 'q = A z^k'),
        M.dot2([[1, q(1)]], th.accent3, 'z = 1')
      ];
      const layout = M.base2d(th, { xt: 'z', yt: 'q', x: { range: [0, 3] }, y: { range: [0, Math.max(3, q(3) * 1.05)] } });
      Plotly.react('plot', data, layout, M.PLOT_CONFIG);
    });
    M.$('nums').innerHTML =
      `<dt>${M.texStr('q(1)')}</dt><dd>${M.fmt(q(1))}</dd>` +
      `<dt>${M.texStr('e')}</dt><dd>${M.fmt(state.k)}</dd>`;
  }

  const schedule = M.scheduler(render);
  M.controls(document, state, { onChange: schedule });
  M.watchColorScheme(schedule);
  render();
})();
