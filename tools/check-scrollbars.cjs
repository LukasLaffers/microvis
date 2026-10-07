// node tools/check-scrollbars.cjs [tool ...]
// Lists boxes whose content is wider or taller than the box at 1440, 1280, 1024 and 768 px: Safari would show a
// scrollbar there. Needs Playwright with Chromium (set PLAYWRIGHT to its module path if it is not found).
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const ROOT = path.resolve(__dirname, '..');
const all = require('./catalog.cjs').flatMap(s => s.tools.map(t => t[0]));
const tools = process.argv.slice(2).length ? process.argv.slice(2) : ['.', ...all];

(async () => {
  const b = await chromium.launch();
  let found = 0;
  for (const w of [1440, 1280, 1024, 768]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const t of tools) {
      await p.goto('file://' + path.join(ROOT, t, 'index.html')); await p.waitForTimeout(600);
      const bad = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
        const cs = getComputedStyle(el);
        const sx = /auto|scroll/.test(cs.overflowX), sy = /auto|scroll/.test(cs.overflowY);
        if (!sx && !sy) return false;
        return (sx && el.scrollWidth > el.clientWidth + 1) || (sy && el.scrollHeight > el.clientHeight + 1);
      }).map(el => `${el.className || el.tagName}: ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`));
      if (bad.length) { found++; console.log(w, t, bad.join(' | ')); }
    }
    await p.close();
  }
  console.log(found ? `${found} page/width combinations with a scrollbar.` : 'No unneeded scrollbars.');
  await b.close();
})();
