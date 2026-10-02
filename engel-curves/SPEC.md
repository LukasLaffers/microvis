# Income Expansion Paths and Engel Curves — specification

Lecture 6: income expansion paths and Engel curves (the notes' figure, panels A–C), income elasticities, budget shares, the conditions of Engel and Cournot, homogeneity (M2) in elasticities.

**Teaching goal.** At fixed prices, more income moves the best bundle along the income expansion path; demand as a function of income is the Engel curve. A: homothetic preferences, a ray. B: good 2 a luxury ($\eta_2>1$). C: good 1 inferior ($\eta_1<0$). Adding up (M1) implies $\sum_jb_j\eta_j=1$ (Engel) and $b_i+\sum_jb_j\varepsilon^u_{ji}=0$ (Cournot); (M2) implies $\sum_j\varepsilon^u_{ij}+\eta_i=0$.

## Model
`model.js`: `expansionPath`, `engelCurves`, `kind` (inferior / necessity / luxury), `incomeRange` (the Giffen example is defined for $cp_1+p_2s/2\le y<cp_1+p_2s$), `conditions`. Tests (`node engel-curves/test-model.cjs`): A is a ray with $\eta=1$; B (Stone–Geary, $\gamma_1=3$, $\gamma_2=0$) has $\eta_2=y/(y-p_1\gamma_1)>1$; C has falling $D^1$; Engel, Cournot and homogeneity for five utility functions.

## Page
Panels A (CES $\delta=0.5$, $\rho=-1$), B (Stone–Geary $a=0.4$, $\gamma_1=3$), C (the Giffen example $c=1$, $s=4$); prices $p=(1,1)$; income slider over the example's range. Main: budget lines for five incomes, their indifference curves, the expansion path (orange), the current bundle. Side: Engel curves $D^1(y)$, $D^2(y)$; table of $D^j$, $b_j$, $\eta_j$ with the kind of good; Engel, Cournot, homogeneity ✓.
