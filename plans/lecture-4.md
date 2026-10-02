# Lecture 4 visualizations — plan

Lecture 4: *Comparative statics — "what if" questions.*
Content: how optimal output and input demand respond to prices ($\mathrm dq^\ast/\mathrm dp=1/C_{qq}$, $\mathrm dq^\ast/\mathrm dw_i=-\tfrac1{C_{qq}}\,\partial H^i/\partial q$, and the decomposition (**) $\partial D^i/\partial w_i=\partial H^i/\partial w_i+(-1/C_{qq})(\partial H^i/\partial q)^2$), the two Cowell figures in the $(z_1,w_1)$ plane, Marshall's law of derived demand, and the translog cost function with its share equations, elasticities, parameter restrictions and the Arnberg–Bjørner (2007) application.

Three tools. All firm math from `shared/firm-model.js` (unchanged); tool math in each tool's `model.js` with its own Node test (CLAUDE.md).

| Folder | Title | Lecture idea | Colours |
|---|---|---|---|
| `comparative-statics/` | What If? Comparative Statics | §1: supply response, (**), both Cowell figures | blue = substitution, red = scale |
| `derived-demand/` | Marshall's Law of Derived Demand | §2: $(-\varepsilon^u_{11})=\sigma(1-sh_1)+(-\varepsilon^D_p)\,sh_1$ | blue = substitution ($\sigma$), red = output demand ($\varepsilon^D_p$) |
| `translog/` | Translog Cost Shares | §3 and Appendix: translog as a second-order approximation, $sh_i=\alpha_i+\sum_j\beta_{ij}\log w_j$, (%), (#), ($), restrictions, results | as in the notes: green own-price, blue small substitution, red complements |

Detailed specs: `comparative-statics/SPEC.md`, `derived-demand/SPEC.md`, `translog/SPEC.md`.

## Notation (in addition to CLAUDE.md)

| Object | Symbol in the notes |
|---|---|
| second derivative of cost in output | $C_{qq}=\partial^2C(w,q^\ast)/\partial q^2$ (SOSC: $C_{qq}>0$) |
| conditional / unconditional own-price elasticity | $\varepsilon^c_{ii}$, $\varepsilon^u_{ii}$; cross: $\varepsilon^c_{ij}$ |
| price elasticity of the industry demand | $\varepsilon^D_p$ for the demand schedule $Dem(p)$ |
| cost share | $sh_i=w_i\widetilde H^i/c(w)=w_iz_i/C$ |
| elasticity of substitution from the cost function | $\sigma=C_{12}C/(C_1C_2)$ (Theorem 1); $\sigma_{ij}$ with more inputs |
| translog parameters | $\alpha_0,\alpha_i,\beta_{ij}$; log prices $\omega_i=\log w_i$ |
| Cowell figure points | $z_1^\ast$ (before), $z_1^o$ (substitution), $z_1^{\ast\ast}$ (after scale) |

Do not add anything that solves the exercises (e.g. showing that $\Pi(w,p)$ is convex in $p$, or the cross-price version of (**)).

## Order of work
1. The three tools (independent). 2. Cards in `index.html` under "Lecture 4 · Comparative statics". 3. All tests, page checks at desktop and 375 px, pull request.

## Review checklist
- Formulas and labels exactly as in the notes ((**), (†), (%), (#), ($)).
- Every identity shown on a page is also checked numerically on the page (✓) and in the Node tests.
- Default views reproduce the numbers in each SPEC; works on a phone.
