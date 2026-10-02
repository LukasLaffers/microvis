# Budget Sets — specification

Lecture 5, section 2.1 (Cowell figures 4.1 and 4.2 in the notes).

**Teaching goal.** The consumer chooses from bundles that are technically feasible ($x\in X$) and affordable. (B1) income $p^tx\le y$, (B2) endowment $p^tx\le p^tR$, (B3) both. (B1) and (B2) can describe the same set at given prices but differ when a price changes: the (B1) line turns about $(0,y/p_2)$, the (B2) line about $R$, which stays affordable. A two-part tariff or whole units make the set non-convex.

## Model (`model.js`, tested)
Two goods. $X$: $\mathbf R^2_+$, $x_2\le\bar x_2$, or whole units of good 2. Functions: `wealth`, `inX`, `affordable`, `feasible`, `pieces` (polygons and segments to draw, intercepts), `pivot` (the point the budget line turns about when $p_1$ changes: $(0,y/p_2)$, $R$, $(R_1,R_2+y/p_2)$), `convex`.
Tests: the drawn pieces contain exactly the feasible bundles (24,000 random points over all constraint types and sets $X$); the pivot lies on every budget line and does not depend on $p_1$; (B1) and (B2) equal at $p=(2,1)$, $y=12$, $R=(4,4)$ but different at $p_1'=3$; the tariff set is not convex (a midpoint test); `convex` for all cases.

## Page
- Controls: (B1) / (B2) / (B3) / two-part tariff with $y$ (12), $R$ ((4,4)), $F$ (4); prices $p_1$ (2), $p_2$ (1), $p_1'$ (3); $X$: any $x\ge0$ / at most $\bar x_2$ / whole units of good 2.
- Plot: the feasible set in grey with the budget line, intercepts labelled as in the notes ($y/p_1$, $y/p_2$; $p^tR/p_i$; $(y-F)/p_2$), the budget line at $p_1'$ in blue and its fixed point, $R$, the cap; click to test a bundle.
- Readouts: money, slope $-p_1/p_2$, intercepts, the test bundle (feasible or not, its cost); convexity; the fixed point stays on the new line ✓.
