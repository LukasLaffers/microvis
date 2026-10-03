# Edgeworth Box — specification

Lecture 9, exchange economy: offer curves, competitive equilibrium, contract curve and core, excess demand, Walras' law, multiple equilibria, second welfare theorem. Read CLAUDE.md and `plans/lectures-7-9.md`.

## Economy
Two households, Alf ($a$, origin bottom-left, blue) and Bill ($b$, origin top-right, orange), two goods; endowments $R^a$, $R^b$ (draggable point in the box). Price of good 2 normalised to 1, $p=p_1$.
Presets:
- **Cobb-Douglas** (default): $U^h=(x_1^h)^{\alpha_h}(x_2^h)^{1-\alpha_h}$, $\alpha_a=\alpha_b=0.5$, $R^a=(8,2)$, $R^b=(2,8)$: equilibrium $p^\ast=1$, $x^{\ast a}=x^{\ast b}=(5,5)$; contract curve = diagonal; core = diagonal points with $x_1^a\in[4,6]$.
- **Three equilibria** (Mas-Colell, Whinston and Green, Example 15.B.2): $U^a=x_1-\tfrac18x_2^{-8}$, $U^b=-\tfrac18x_1^{-8}+x_2$, $R^a=(2,r)$, $R^b=(r,2)$ with $r=2^{8/9}-2^{1/9}\approx0.7717$: equilibria at $p=\tfrac12,\ 1,\ 2$.

## Tabs
1. **"Trade at a price"**: price slider $p$; budget line through the endowment; each household's optimum; the gap between their demands shows excess demand. Offer curves of both households (traced for $p\in[0.1,10]$). Equilibrium = intersection of offer curves; button "find equilibria" marks all of them (bisection on $E_1(p)$).
2. **"Excess demand"**: plot $E_1(p)$ and $p\,E_1(p)+E_2(p)$ against $p$ (log axis). Walras' law: the second curve is identically 0 (✓ shown); equilibria are the zeros of $E_1$; with the three-equilibria preset the curve crosses zero three times.
3. **"Contract curve and core"**: contract curve (tangencies of indifference curves), the lens between the two indifference curves through the endowment, the core (contract curve inside the lens, thick), and the competitive allocation (labelled $z$ as in the notes' figure) inside it.
4. **"Second welfare theorem"**: click any point on the contract curve; the tool computes the supporting price and the lump-sum transfer (in units of good 1) that moves the endowment onto the budget line through that point; shows $T^a=-T^b$ and the new equilibrium = chosen point.

## Expected numbers
Cobb-Douglas default: $p^\ast=1$, $x^{\ast a}=(5,5)$, core $x_1^a\in[4,6]$. Three-equilibria preset: $E_1(p)=0$ at $p=0.5,1,2$.

## `model.js` and tests
Demands (closed form for Cobb-Douglas, numerical for the other preset with brute-force check), Walras' law for many $p$, equilibrium search, contract curve and lens, transfer computation (new equilibrium equals the chosen Pareto point).

## Header
Eyebrow "Lecture 9 · General equilibrium", title "Edgeworth Box".
