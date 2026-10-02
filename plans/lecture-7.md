# Lecture 7 visualizations — plan

Lecture 7: *Welfare measurement.* Compensating and equivalent variation, $CV=C(p^0,v^0)-C(p^1,v^0)$ and $EV=C(p^0,v^1)-C(p^1,v^1)$, as areas to the left of Hicksian demand curves; the change in consumer surplus $\Delta CS$ to the left of the Marshallian curve; $CV\le\Delta CS\le EV$ for a normal good (reversed for an inferior good, equal without income effects); the deadweight loss of a commodity tax, $DWL\approx-\tfrac12\,\partial H^1/\partial p_1\,(p_1^1-p_1^0)^2$ and $DWL/T\approx-\tfrac12\varepsilon^c_{11}(p_1^1-p_1^0)/p_1^1$, with the table for 14 commodity groups.

| Folder | Title | Lecture idea | Notes' figures |
|---|---|---|---|
| `cv-ev/` | CV, EV and Consumer Surplus | CV and EV in $(x_1,x_2)$ and in $(x_1,p_1)$; $\Delta CS$; the ordering by income effect | Cowell 4.11–4.13 |
| `deadweight-loss/` | The Deadweight Loss of a Tax | tax revenue and DWL in the notes' figure; exact vs approximate DWL; DWL per krone; the 14 commodity groups (data, with the approximation recomputed) | the DWL figure, the table |

Math from `shared/consumer-model.js`; tool-specific integrals in each `model.js`. Colours as in the notes' figure: $D^1$ green, $H^1(\cdot,v^0)$ red, $H^1(\cdot,v^1)$ blue, tax yellow.

## Do not solve the exercise
No $\alpha x_1^{1/2}+x_2$ utility; the quasilinear case uses $\kappa\log(1+x_1)+x_2$.
