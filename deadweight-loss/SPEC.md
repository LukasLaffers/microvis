# The Deadweight Loss of a Tax — specification

Lecture 7: the deadweight loss of a commodity tax, $DWL=|EV|-T$, its second-order approximation and the table of DWL per krone for 14 commodity groups.

**Teaching goal.** A tax on good 1 costs the consumer $|EV|$, the area to the left of the Hicksian demand curve at the new utility $v^1$ between the two prices. The government collects only the rectangle $T=(p_1^1-p_1^0)x_1^1$. The rest is lost to everybody. It is positive because the Hicksian curve slopes down (whatever the income effect), and it grows with the square of the tax.

## Model
Consumer math from `shared/consumer-model.js`. `model.js` (`window.DWLModel`):
- `tax(p10, p11, p2, y, u)` returns $x^0$, $x^1$, $v^0$, $v^1$, $T$, $|EV|$, $DWL$, the approximation $-\tfrac12\,\partial H^1/\partial p_1\,(p_1^1-p_1^0)^2$, $DWL/T$ and its approximation $-\tfrac12\varepsilon^c_{11}(p_1^1-p_1^0)/p_1^1$.
- `GROUPS`: the 14 rows of the notes' table ($b_i,\eta_i,\varepsilon^u_{ii},\varepsilon^c_{ii}$, tax rate, $DWL/T$).

Tests (`node deadweight-loss/test-model.cjs`) check:
- the area to the left of $H^1(\cdot,v^1)$ equals $|EV|$;
- $DWL>0$;
- both approximations converge at second order;
- a 14 % VAT gives $(p^1-p^0)/p^1=0.123$;
- each table row's $-\tfrac12\varepsilon^c\cdot$rate matches the reported $DWL/T$ to 0.006;
- $\sum b_i=1$ and $\sum b_i\eta_i\approx1$.

The table's estimated elasticities do not satisfy the Slutsky equation exactly, so that relation is not tested.

## Page
- Controls:
  - utility: CES, Stone–Geary or quasilinear;
  - $p_1^0$;
  - the VAT $\tau$, with $p_1^1=p_1^0(1+\tau)$;
  - income $y$, with $p_2=1$.
- Default: CES with $\delta=0.5$ and $\rho=0.5$, $p_1^0=1$, $\tau=40\%$, $y=12$.
- Main figure, drawn as in the notes:
  - $D^1$ in green and $H^1(\cdot,v^1)$ in blue; $H^1(\cdot,v^0)$ red dotted;
  - the tax rectangle in yellow;
  - the deadweight loss as a blue area between $x_1^1$ and $H^1(\cdot,v^1)$;
  - both prices as dotted lines.
- Numbers: $p_1^1$, the effective rate $\tau/(1+\tau)$, $T$, $|EV|$, $DWL$ and $\varepsilon^c_{11}$.
- Checks:
  - $|EV|>T$;
  - exact DWL against its approximation;
  - $DWL/T$ against its approximation.
- The 14-group table, with a recomputed column, and a bar chart sorted by $DWL/T$.
