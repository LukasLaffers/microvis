# Income Expansion and Engel Curves — specification

Lecture 6: income expansion path, Engel curve, necessity / luxury / inferior goods, the conditions of Engel and Cournot. Read CLAUDE.md and `plans/lecture-6.md`.

**Teaching goal.** Fix prices and raise income $y$: the optimal bundles trace the **income expansion path**; plotting $D^1$ against $y$ gives the **Engel curve**. The income elasticity $\eta_j$ classifies goods (the notes' panels A, B, C: ray / luxury / inferior). And because the budget is always spent, the elasticities are tied together: $\sum_j b_j\eta_j=1$ (Engel) and $b_i+\sum_j b_j\varepsilon^u_{ji}=0$ (Cournot).

## Controls
1. **How to read this** (open).
2. Utility: CES (homothetic → panel A, expansion path is a ray) / Stone–Geary (default; $\alpha=0.5$, $\gamma_1$ 0–4 default 2, $\gamma_2$ 0–4 default 0 → good 1 a necessity, good 2 a luxury) / Giffen ($\alpha=1$, $\beta=2$, $a=1$, $b=10$, $p_2=1$; good 1 inferior).
3. Prices $p_1$, $p_2$ (default 1, 1); income $y$ slider (default 10) with a play button that sweeps $y$.

## Main plot: goods space
Budget lines for several incomes (thin red), indifference curves through each optimum (thin blue), the income expansion path (thick black), current optimum highlighted.

## Side plot: Engel curves
$D^1(p,y)$ and $D^2(p,y)$ against $y$ (two colours), current $y$ marked; the slope at the current point drawn.

## Readouts
- $b_1$, $b_2$; $\eta_1$, $\eta_2$ with badges "necessity ($0<\eta<1$)", "luxury ($\eta>1$)", "inferior ($\eta<0$)".
- **Engel**: $b_1\eta_1+b_2\eta_2=1$ ✓ (numbers).
- **Cournot** for $i=1$: $b_1+b_1\varepsilon^u_{11}+b_2\varepsilon^u_{21}=0$ ✓ (numbers, elasticities by finite differences).

## Expected numbers (Stone–Geary $\alpha=0.5$, $\gamma=(2,0)$, $p=(1,1)$, $y=10$)
$D=(6,4)$, $b=(0.6,0.4)$, $\eta_1=0.5\cdot10/6\approx0.833$ (necessity), $\eta_2=0.5\cdot10/4=1.25$ (luxury), $0.6\cdot0.833+0.4\cdot1.25=1$ ✓.
Giffen preset at $p_1=4$, $y=12$: $D^1=1.5$; $\partial D^1/\partial y=\alpha/(p_1(\alpha-\beta))=-0.25$, so $\eta_1=-0.25\cdot12/1.5=-2$ (inferior).

## `model.js` and tests
Closed forms from the plan with brute-force UMP checks; Engel and Cournot conditions over a grid; classification thresholds.

## Header
Eyebrow "Lecture 6 · Demand theory", title "Income Expansion and Engel Curves".
