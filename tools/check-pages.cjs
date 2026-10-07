// node tools/check-pages.cjs
// Opens the start page and every tool (desktop, phone, dark mode) and reports anything wrong:
// page errors, console errors, failed or external requests, the error banner, horizontal scrolling on a
// phone, and header links that do not lead back to the start page. Needs Playwright with Chromium; if it is
// not found, set PLAYWRIGHT to the path of the playwright module, e.g.
//   PLAYWRIGHT=/opt/node22/lib/node_modules/playwright node tools/check-pages.cjs
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const ROOT = path.resolve(__dirname, '..');
const url = rel => 'file://' + path.join(ROOT, rel);
const tools = require('./catalog.cjs').flatMap(s => s.tools.map(t => t[0]));

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const page = async (opts, tag) => {
    const p = await (await browser.newContext(opts)).newPage();
    await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || u.startsWith('data:')) ? r.continue() : (errs.push(`${tag} external request ${u}`), r.abort()); });
    p.on('pageerror', e => errs.push(`${tag} page error ${p.url()} ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errs.push(`${tag} console ${p.url()} ${m.text()}`); });
    p.on('requestfailed', r => errs.push(`${tag} failed ${r.url()}`));
    return p;
  };
  const banner = p => p.evaluate(() => { const s = document.getElementById('status'); return s && !s.hidden ? s.innerText : ''; });

  const desk = await page({ viewport: { width: 1440, height: 900 } }, 'desktop');
  for (const t of tools) {
    await desk.goto(url(`${t}/index.html`)); await desk.waitForTimeout(1500);
    const info = await desk.evaluate(() => [...document.querySelectorAll('.js-plotly-plot')].map(gd => gd.data ? gd.data.length : 0));
    const b = await banner(desk);
    if (b) errs.push(`desktop banner on ${t}: ${b}`);
    console.log(`${t}: ${info.length} plots`);
    await desk.click('.eyebrow a'); await desk.waitForTimeout(300);
    if (!/index\.html#l[0-9]/.test(desk.url())) errs.push(`header link of ${t} went to ${desk.url()}`);
  }

  const phone = await page({ viewport: { width: 375, height: 800 } }, 'phone');
  for (const t of ['.', ...tools]) {
    await phone.goto(url(`${t}/index.html`)); await phone.waitForTimeout(1000);
    const [sw, iw] = await phone.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (sw > iw) errs.push(`phone: horizontal scroll on ${t} (${sw} > ${iw})`);
  }

  const dark = await page({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, 'dark');
  for (const t of ['.', 'cost-curves', 'two-elasticities']) { await dark.goto(url(`${t}/index.html`)); await dark.waitForTimeout(1200); }

  console.log(errs.length ? 'PROBLEMS:\n' + errs.join('\n') : 'No problems found.');
  await browser.close();
  process.exitCode = errs.length ? 1 : 0;
})();
