// node tools/check-fuzz.cjs [tool,tool,...] [moves]
// For every tool (or the ones given): each slider to its minimum and maximum, each option of each select, each button,
// then `moves` random moves (default 60), and a wait for animations to end. Reports the error banner, page errors and
// KaTeX errors or warnings, with the step that caused them. Needs Playwright with Chromium (see check-pages.cjs).
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const tools = process.argv[2] ? process.argv[2].split(',') : require('./catalog.cjs').flatMap(s => s.tools.map(t => t[0]));
  const N = Number(process.argv[3] || 60);
  const b = await chromium.launch();
  let bad = 0;
  for (const t of tools) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    const errs = new Set(); p.on('pageerror', e => errs.add('pageerror: ' + e.message.slice(0, 120)));
    p.on('console', m => { if (m.type() === 'warning' && /LaTeX-incompatible|KaTeX/.test(m.text())) errs.add('katex: ' + m.text().slice(0, 120)); });
    await p.goto('file://' + path.join(ROOT, t, 'index.html')); await p.waitForTimeout(700);
    const check = async what => {
      const r = await p.evaluate(() => { const s = document.getElementById('status'); return { banner: s && !s.hidden ? s.textContent.slice(0, 160) : '', kerr: document.querySelectorAll('.katex-error').length }; });
      if (r.banner) errs.add(`banner after ${what}: ${r.banner}`);
      if (r.kerr) errs.add(`katex-error after ${what}`);
    };
    const keys = await p.evaluate(() => [...document.querySelectorAll('.ctrl[data-key]')].map(c => c.dataset.key));
    const setVal = (k, which) => p.evaluate(([k, which]) => {
      const c = document.querySelector(`.ctrl[data-key="${k}"]`); if (!c || c.closest('[hidden]')) return;
      const r = c.querySelector('input[type=range]'), lo = Number(r.min), hi = Number(r.max);
      r.value = which === 'min' ? lo : which === 'max' ? hi : lo + Math.random() * (hi - lo);
      r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true }));
    }, [k, which]);
    for (const k of keys) for (const w of ['min', 'max']) { await setVal(k, w); await p.waitForTimeout(60); await check(`${k}=${w}`); }
    const sels = await p.evaluate(() => [...document.querySelectorAll('select')].map(s => [s.id, [...s.options].map(o => o.value)]));
    for (const [id, vals] of sels) for (const v of vals) { if (!id) continue; await p.selectOption('#' + id, v).catch(() => {}); await p.waitForTimeout(80); await check(`#${id}=${v}`); }
    const btns = await p.evaluate(() => [...document.querySelectorAll('main button')].map((b, i) => i));
    for (const i of btns) { await p.evaluate(i => { const b = document.querySelectorAll('main button')[i]; if (b && !b.disabled && b.offsetParent) b.click(); }, i); await p.waitForTimeout(120); await check(`button ${i}`); }
    for (let k = 0; k < N; k++) {
      const r = Math.random();
      if (r < 0.75 && keys.length) await setVal(keys[Math.floor(Math.random() * keys.length)], 'rand');
      else if (r < 0.88 && sels.length) { const [id, vals] = sels[Math.floor(Math.random() * sels.length)]; if (id) await p.selectOption('#' + id, vals[Math.floor(Math.random() * vals.length)]).catch(() => {}); }
      else if (btns.length) await p.evaluate(i => { const b = document.querySelectorAll('main button')[i]; if (b && !b.disabled && b.offsetParent) b.click(); }, btns[Math.floor(Math.random() * btns.length)]);
      await p.waitForTimeout(50); await check(`random move ${k}`);
    }
    await p.waitForTimeout(6000); await check('the end');
    console.log(t.padEnd(30), errs.size ? [...errs].slice(0, 6).join('\n   ') : 'ok');
    if (errs.size) bad++;
    await p.context().close();
  }
  console.log(bad ? `${bad} tools with problems` : 'all tools ok');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
