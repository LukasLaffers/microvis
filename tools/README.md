# Maintenance scripts (not part of the website)

- `glyphs-sample.cjs`, `glyphs.cjs`: print the small SVG drawings of the start-page tiles as JSON (`node tools/glyphs.cjs`); they were pasted into `index.html`.
- `previews.cjs`: screenshots of each tool's main figure, saved as `<tool>/preview.webp` and `preview-dark.webp` (needs Playwright with Chromium):
  `node tools/previews.cjs "edgeworth-box:.layout .plot"`. Re-run for a tool after changing it.
