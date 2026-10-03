# Deadweight Loss of a Commodity Tax — specification

Lecture 7, "Application: the deadweight loss of commodity taxation". Read CLAUDE.md and `plans/lectures-7-9.md`.

**Teaching goal.** An excise tax $t$ raises $p_1^0$ to $p_1^1=p_1^0+t$. The consumer's loss $|EV|=\int_{p_1^0}^{p_1^1}H^1(p_1,1,v^1)\,\mathrm dp_1$ is larger than the revenue $T=t\cdot D^1(p_1^1,1,y)$; the difference — the triangle-like area — is the deadweight loss, positive because the Hicksian curve slopes down. The notes' approximation $DWL/T\approx-\tfrac12\,\varepsilon^c_{11}\,\frac{p_1^1-p_1^0}{p_1^1}$ explains the table of 14 commodity groups.

Two tabs.

## Tab 1 — "One good"
- Utility: CES via `shared/firm-model.js` (default $\delta=0.5$, $\rho=-1$; $\rho$ slider changes the substitution elasticity); income $y=10$; $p_1^0=1$; tax $t$ slider 0–1.5 (default 0.5).
- Plot $(x_1,p_1)$, $p_1$ vertical: Hicksian $H^1(p_1,1,v^1)$ (blue), Marshallian $D^1$ (red, thin). Revenue rectangle $T$ (green) between $p_1^0$ and $p_1^1$ up to $D^1(p_1^1)$; $DWL$ = remaining area left of $H^1$ (hatched). Tangent line at $p_1^1$ and the approximating triangle $-\tfrac12\,\partial H^1/\partial p_1\cdot t^2$ (dashed outline).
- Readouts: $T$, $|EV|$, $DWL$ (exact), approximation, $DWL/T$ exact and approximate, $\varepsilon^c_{11}$ at $p_1^1$.
- **Expected (default):** $D^1(1.5,1,10)\approx3.670$, $T\approx1.835$, $|EV|\approx1.918$, $DWL\approx0.083$; approximation $\approx0.069$; $DWL/T\approx0.045$ exact vs $\approx0.0375$ from the formula with $\varepsilon^c_{11}\approx-0.225$ (the gap shrinks as $t\to0$ — show a small plot of exact vs approximate $DWL$ against $t$).

## Tab 2 — "The table in the notes"
Data: the 14 commodity groups from the lecture 7 table (budget share, income elasticity, $\varepsilon^u_{ii}$, $\varepsilon^c_{ii}$, effective tax rate, $DWL/T$; 1999 data), stored in `model.js` exactly as printed.
- Scatter: horizontal $|\varepsilon^c_{ii}|$, vertical effective tax rate, bubble size = budget share; background contour lines of $DWL/T=\tfrac12|\varepsilon^c|\cdot\text{rate}$ at 0.01, 0.05, 0.1, 0.2. Hover shows the row.
- Bar chart of $DWL/T$ by group, with the formula's prediction next to the printed value.
- Consistency panel: for each row, check $\varepsilon^u_{ii}\approx\varepsilon^c_{ii}-\eta_ib_i$ (Slutsky, lecture 6) and $DWL/T\approx-\tfrac12\varepsilon^c_{ii}\cdot\text{rate}$. All rows agree to rounding **except "Clothing and footwear"**, where $-0.49-1.16\cdot0.055=-0.554\ne-0.51$; flag this row in the panel ("possible typo in the source table") rather than changing the data.

## `model.js` and tests
Exact $EV$ via the expenditure function vs numerical integral of $H^1$; approximation formula; the table consistency checks (the clothing row is the only Slutsky mismatch > 0.02).

## Header
Eyebrow "Lecture 7 · Welfare measurement", title "Deadweight Loss of a Commodity Tax".
