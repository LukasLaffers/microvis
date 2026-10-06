// Screenshot the main figure of each tool (light and dark) and save it as WebP next to the tool: preview.webp, preview-dark.webp.
// node previews.cjs tool:selector ...
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const spec of process.argv.slice(2)) {
    const [tool, sel] = spec.split(':');
    for (const dark of [false, true]) {
      const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
      await p.goto(`file:///home/user/Microvis/${tool}/index.html`); await p.waitForTimeout(1800);
      const png = await p.locator(sel).first().screenshot();
      // PNG -> WebP, 640 px wide, in the browser
      const webp = await p.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const w = 640, h = Math.round(img.height * w / img.width), c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
        return c.toDataURL('image/webp', 0.82).split(',')[1];
      }, png.toString('base64'));
      const out = `/home/user/Microvis/${tool}/preview${dark ? '-dark' : ''}.webp`;
      fs.writeFileSync(out, Buffer.from(webp, 'base64'));
      console.log(out, Math.round(fs.statSync(out).size / 1024) + ' KB');
      await p.close();
    }
  }
  await b.close();
})();
