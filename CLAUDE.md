# Microvis — conventions

Interactive visualizations for ECO401 Microeconomic theory (NHH), by Lukáš Lafférs.
Published with GitHub Pages; each tool gets a stable URL that is linked from the lecture notes (PDF).

## Layout

```
index.html              landing page: one card per tool, with the lecture it belongs to
shared/style.css        common look (colors, typography, layout, controls)
shared/ui.js            small helpers every tool uses (controls, KaTeX, plot styling, error banner); no economics
shared/firm-model.js    firm model for the lecture 2+ tools: phi = F(g(z)), costs, supply, profit (UMD)
shared/test-firm-model.cjs  `node shared/test-firm-model.cjs` must pass
shared/consumer-model.js  consumer model for the lecture 6+ tools: D, V, C, H, Slutsky, elasticities (UMD)
shared/consumer-ui.js     KaTeX formulas for the consumer utility functions
shared/exchange-model.js  two-person exchange economy for the lecture 9 tools: equilibria, contract curve, core, replicas (UMD)
shared/technology-model.js  phi = F(g(z)) with variable e and sigma, h(phi) and phi(f(z1), g(z2)), for the lecture 1 tools on homogeneity and the two elasticities (UMD)
shared/test-consumer-model.cjs, shared/test-exchange-model.cjs, shared/test-technology-model.cjs  must pass
shared/vendor/          bundled third-party libraries (Plotly, KaTeX) with their licenses
plans/                  plans for groups of tools, e.g. plans/lecture-2.md
<tool-name>/            one folder per tool, kebab-case, e.g. production-explorer/
  index.html            the page
  model.js              pure math, no DOM; UMD so Node tests can require it
  app.js                interface and plotting
  test-model.cjs        `node <tool-name>/test-model.cjs` must pass
```

## Rules

- Plain HTML, CSS and JavaScript. No framework, no bundler, no npm install. Pages must work when served as static files.
- Plotting: Plotly.js 2.35.2, formulas: KaTeX 0.16.9, both bundled in `shared/vendor/` (MIT, licenses included) and loaded with relative paths, e.g. `../shared/vendor/plotly/plotly-2.35.2.min.js`. No CDN: pages must work offline and when opened as local files.
- Keep math in `model.js` and test it numerically against independent calculations (finite differences, brute-force search). Never change model math without updating the tests.
- Use the notation of the lecture notes: inputs $z_1, z_2$, production function $\phi$, output $q$, $MRTS_{21} = \phi_1/\phi_2$, elasticity of substitution $\sigma$, elasticity of scale $e$, degree of homogeneity $k$ (not $\nu$). Full table below.
- Tools for lecture 2 and later take all firm math from `shared/firm-model.js` (do not duplicate it); tool-specific math goes in the tool's own `model.js` with its own tests.
- Tools load `../shared/ui.js` for controls, formatting and the error banner; tool-specific CSS goes in `<tool>/style.css`.
- Every tool: works on a phone (controls collapse above the plots), has a short "How to read this" text, labels axes, and shows the key numbers live.
- Write all code ourselves. Do not copy code from other repositories without a compatible license (in particular not from qgallea/utility-explorer, which has no license).
- Add a card for each new tool to `index.html`.
- `.nojekyll` must stay in the root so GitHub Pages serves files as they are.
- Our own CSS and JS are linked with a version tag, e.g. `../shared/style.css?v=2`. Raise the number in all pages (a one-line script) whenever a shared CSS/JS file changes, so that browsers never combine a new page with an old cached stylesheet. Vendor files are not tagged.

## Notation (must match the lecture notes)

| Object | Symbol |
|---|---|
| inputs, input prices, output, output price | $z_1,z_2$; $w_1,w_2$; $q$; $p$ |
| production function, marginal products | $\phi(z)$, $\phi_1,\phi_2$ |
| marginal rate of technical substitution | $MRTS_{21}=\phi_1/\phi_2$; at an interior cost minimum $MRTS_{21}=w_1/w_2$ |
| one step profit maximisation | (PM): $\max_z p\phi(z)-w^t z$ |
| cost minimisation | (CM): $\min_z w^t z$ s.t. $\phi(z)\ge q$ |
| conditional input demand | $H(w,q)$, components $H^1, H^2$ |
| minimal cost function | $C(w,q)=w^t H(w,q)$ |
| Lagrange multiplier of (CM) | $\lambda^\ast=\partial C/\partial q$ |
| output optimisation | (PM'): $\max_{q\ge0} pq-C(w,q)$ |
| marginal and average cost | $MC=C_q$, $AC=C/q$ |
| shutdown price and output | $\hat p$ (= min AC), $\hat q$ |
| supply, unconditional demand, profit | $S(w,p)$; $D(w,p)$, $D^1, D^2$; $\Pi(w,p)$ |
| link between the two approaches | $D^i(w,p)=H^i(w,S(w,p))$ |
| unit cost, unit input requirement | $c(w)$, $\widetilde H^i(w)$ |
| degree of homogeneity | $k$ |
| elasticity of scale | $e(z)$; at the cost-minimising bundle $e=AC/MC$ |
| elasticity of substitution | $\sigma=1/(1-\rho)$ for CES |

Colours in the lecture 2 tools, as in the notes' figures: Step 1 / (CM) / substitution blue `#4a90e2`; Step 2 / (PM') / scale red `#d0021b`; supply orange `#f5a623`; isocost lines grey `#9b9b9b`. Page eyebrow "Lecture N · Theory of the firm" (lecture 5: "Lecture 5 · The firm and the market" and "Lecture 5 · Consumer preferences"; then "Lecture 6 · Demand theory", "Lecture 7 · Welfare measurement", "Lecture 8 · Decentralisation in a simple economy", "Lecture 9 · General equilibrium"); no course code or university name on pages. Consumer notation (goods $x$, prices $p$, income $y$, endowment $R$, (B1)–(B3), $B(x)$, $W(x)$, $I(x)$, $MRS_{21}=U_1/U_2$) is listed in `plans/lecture-5.md`.
