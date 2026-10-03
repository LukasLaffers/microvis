# CV, EV and Consumer Surplus — specification

Lecture 7, "Measuring consumer surplus". Read CLAUDE.md and `plans/lectures-7-9.md`.

**Teaching goal.** Utility is ordinal, so we measure a price change in money. $CV$: how much income could be taken away after the change to keep the consumer at $v^0$. $EV$: how much income she would need before the change to reach $v^1$. In the $(x_1,p_1)$ diagram they are areas to the left of the **Hicksian** demand curves at $v^0$ and $v^1$; the old consumer-surplus measure $\Delta CS$ is the area left of the **Marshallian** curve, which lies between them: $CV\le\Delta CS\le EV$ for a normal good (price fall), reversed for an inferior good, and all equal without income effects.

## Utilities (good 2 numéraire, $p_2=1$)
- CES via `shared/firm-model.js` (default $\delta=0.5$, $\rho=-1$): $C(p,v)=c(p)\,v$, $V=y/c(p)$, $H^1=\widetilde H^1(p)\,v$, $D^1=\widetilde H^1(p)\,y/c(p)$ — normal good.
- Quasilinear $U=\ln(1+x_1)+x_2$ (zero income effect while $x_2>0$): $CV=EV=\Delta CS$.
- Giffen/inferior utility from `plans/lecture-6.md` (Haagsma; $\alpha=1,\beta=2,a=1,b=10$, $y=12$) — inferior good 1: $EV\le\Delta CS\le CV$.

## Controls
Utility; $p_1^0$ and $p_1^1$ (two sliders, 0.25–4; defaults 2 and 1); income $y$ (default 10). Toggle "price rise / price fall" swaps them.

## Panel 1 (main): $(x_1,p_1)$ diagram — $p_1$ vertical, as in the notes
Hicksian $H^1(p_1,1,v^0)$ (blue, dashed), Hicksian $H^1(p_1,1,v^1)$ (blue, solid), Marshallian $D^1(p_1,1,y)$ (red). Horizontal lines at $p_1^0$, $p_1^1$. Three shaded areas selectable by tabs or checkboxes: $CV$ (left of $H^1(\cdot,v^0)$), $\Delta CS$ (left of $D^1$), $EV$ (left of $H^1(\cdot,v^1)$). Readouts: the three numbers, sorted, with the inequality and a ✓ against the lecture's statement for the current good type.

## Panel 2: goods space $(x_1,x_2)$
Old and new budget lines; indifference curves $v^0$, $v^1$; $CV$ shown as the vertical distance (in units of good 2 = money) between the new budget line and the parallel line tangent to $v^0$; $EV$ as the distance between the old budget line and the parallel line tangent to $v^1$.

## Expected numbers (CES default, $y=10$, $p_1:2\to1$)
$v^0\approx3.4315$, $v^1=5$; $CV\approx3.137$, $\Delta CS\approx3.765$, $EV\approx4.571$ ($CV<\Delta CS<EV$ ✓); $\int_1^2H^1(p_1,1,v^0)\,\mathrm dp_1=CV$ ✓.

## `model.js` and tests
Expenditure-function definitions vs integrals of Hicksian demand (agree to 1e-6); $\Delta CS$ by numerical integration; ordering checks for each utility; brute-force UMP/EMP checks.

## Header
Eyebrow "Lecture 7 · Welfare measurement", title "CV, EV and Consumer Surplus".
