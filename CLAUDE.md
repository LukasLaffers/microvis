# Microvis — conventions

Interactive visualizations for ECO401 Microeconomic theory (NHH), by Lukáš Lafférs.
Published with GitHub Pages; each tool gets a stable URL that is linked from the lecture notes (PDF).

## Layout

```
index.html              landing page: one card per tool, with the lecture it belongs to
shared/style.css        common look (colors, typography, layout, controls)
shared/vendor/          bundled third-party libraries (Plotly, KaTeX) with their licenses
<tool-name>/            one folder per tool, kebab-case, e.g. production-explorer/
  index.html            the page
  model.js              pure math, no DOM; UMD so Node tests can require it
  app.js                interface and plotting
  test-model.cjs        `node <tool-name>/test-model.cjs` must pass
  SPEC.md               what the tool must show and why (optional but recommended)
```

## Rules

- Plain HTML, CSS and JavaScript. No framework, no bundler, no npm install. Pages must work when served as static files.
- Plotting: Plotly.js 2.35.2, formulas: KaTeX 0.16.9, both bundled in `shared/vendor/` (MIT, licenses included) and loaded with relative paths, e.g. `../shared/vendor/plotly/plotly-2.35.2.min.js`. No CDN: pages must work offline and when opened as local files.
- Keep math in `model.js` and test it numerically against independent calculations (finite differences, brute-force search). Never change model math without updating the tests.
- Use the notation of the lecture notes: inputs $z_1, z_2$, production function $\phi$, output $q$, $MRTS_{21} = \phi_1/\phi_2$, elasticity of substitution $\sigma$, elasticity of scale $e$, returns-to-scale degree $\nu$.
- Every tool: works on a phone (controls collapse above the plots), has a short "How to read this" text, labels axes, and shows the key numbers live.
- Write all code ourselves. Do not copy code from other repositories without a compatible license (in particular not from qgallea/utility-explorer, which has no license).
- Add a card for each new tool to `index.html`.
- `.nojekyll` must stay in the root so GitHub Pages serves files as they are.
