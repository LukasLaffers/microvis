# The Slutsky Equation — specification

Lecture 6, (M3) and the Giffen figure. Read CLAUDE.md and `plans/lecture-6.md` (notation, utilities, exercise restrictions).

**Teaching goal.** When $p_1$ changes, the consumer moves from $E_1$ to $E_2$ along the **old** indifference curve (substitution effect, blue: the Hicksian change at constant $v$) and then from $E_2$ to $E_3$ with a parallel budget line (income effect, red). In derivatives: $\dfrac{\partial D^1}{\partial p_1}=\color{blue}{\dfrac{\partial H^1}{\partial p_1}}\color{red}{-\dfrac{\partial D^1}{\partial y}D^1}$. For a normal good both push the same way; for an inferior good the income effect works against substitution; for a **Giffen** good it wins and demand rises with the price. Make the link to lecture 3/4 explicit in one line: "the consumer's income effect plays the role of the firm's scale effect".

## Controls
1. **How to read this** (open).
2. Utility: CES (default, $\delta=0.5$, $\rho=-1$) / Stone–Geary ($\alpha=0.5$, $\gamma=(2,0)$) / Giffen ($\alpha=1$, $\beta=2$, $a=1$, $b=10$).
3. Prices $p_1$ before → after (two sliders), $p_2$ (CES/Stone–Geary; fixed at 1 for Giffen), income $y$ (Giffen: fixed at 12).
4. **Show the effects** button: animates $E_1\to E_2$ (blue), then $E_2\to E_3$ (red); replayable.
5. Toggle "marginal version" (derivatives instead of the discrete change).

## Main plot: goods space $(x_1,x_2)$
Old budget line (red dashed), new budget line (red solid), compensating budget line through $E_2$ (parallel to the new one, thin red dotted, label "income $C(p',v)$"), old indifference curve through $E_1$ and $E_2$ (blue), new indifference curve through $E_3$ (light blue). Points $E_1$, $E_2$, $E_3$ labelled as in the notes' figure; blue arrow $E_1\to E_2$, red arrow $E_2\to E_3$; on the $x_1$ axis a bracket split into the blue and red parts.

## Side plot: demand curves for good 1 — axes $x_1$ (horizontal), $p_1$ (vertical)
Marshallian $D^1(p_1;p_2,y)$ (black) and Hicksian $H^1(p_1;p_2,v)$ through $E_1$ (blue); for a normal good the Marshallian curve is flatter (more elastic); for Giffen it slopes upward while the Hicksian one slopes down. Current prices marked.

## Readouts
Table: substitution, income, total change in $x_1$ (and $x_2$). Marginal version: $\partial D^1/\partial p_1=\partial H^1/\partial p_1-\partial D^1/\partial y\cdot D^1$ with numbers and "sum ✓"; elasticity form $\varepsilon^u_{11}=\varepsilon^c_{11}-\eta_1b_1$ with numbers. Classification badge: normal / inferior / Giffen.

## Expected numbers
- CES ($\delta=0.5$, $\rho=-1$), $p=(1,1)$, $y=10$, $p_1:1\to2$: $E_1=(5,5)$, $v=5$; $E_2=H(p',5)\approx(4.268,\ 6.036)$, compensating income $C(p',v)\approx14.571$; $E_3=D(p',10)\approx(2.929,\ 4.142)$. Change in $x_1$: substitution $\approx-0.732$, income $\approx-1.339$, total $\approx-2.071$.
- Giffen, $p_1:3\to4$: $E_1$: $x_1\approx1.333$, $E_2$: $x_1\approx1.1875$ (compensating income $13.25$), $E_3$: $x_1=1.5$. Substitution $\approx-0.146$, income $\approx+0.313$, total $\approx+0.167$ — demand rises with the price.

## `model.js` and tests
Marshallian, Hicksian (closed forms where given in the plan, otherwise numerical EMP), brute-force UMP/EMP checks for every number above; Slutsky identity to 1e-6 by finite differences for all three utilities; Giffen sign test over $p_1\in(2.1,6.9)$.

## Header
Eyebrow "Lecture 6 · Demand theory", title "The Slutsky Equation".
