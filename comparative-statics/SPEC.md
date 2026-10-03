# What If? Comparative Statics — specification

Lecture 4, section 1. Firm math from `shared/firm-model.js`; tool math in `model.js`.

**Teaching goal.** Differentiating the first-order condition $p=C_q(w,q^\ast)$ answers "what if" questions: $\mathrm dq^\ast/\mathrm dp=1/C_{qq}>0$ (the supply curve slopes up) and $\mathrm dq^\ast/\mathrm dw_i=-\tfrac{1}{C_{qq}}\,\partial H^i/\partial q$. Plugging this into $D^i\equiv H^i(w,S(w,p))$ gives (**): the unconditional demand falls faster than the conditional demand. The two Cowell figures of the notes show this in the $(z_1,w_1)$ plane.

## Controls
How to read this; technology (Cobb-Douglas default, CES, Leontief) with $\delta$, $\rho$; returns to scale ('ushape' default $a=2$, $m=1$; 'homog' $k\in[0.3,0.95]$); prices $p$ (8), $w_2$ (1); **$w_1$ before** (2) and **$w_1$ after** (1, a price *fall* as in the figures; may also be a rise).

## Panel 1 (main): "Ordinary and conditional demand for input 1" — axes $z_1$ (x), $w_1$ (y), as in the notes
- Ordinary demand curve $D^1(w_1,w_2,p)$: black solid.
- Conditional demand curves $H^1(w_1,w_2,q^\ast)$ and $H^1(w_1,w_2,q^{\ast\ast})$ for the outputs before and after: black dashed.
- Horizontal dotted lines at the two prices ("price fall"), points $z_1^\ast$ (before), $z_1^o=H^1(w',q^\ast)$, $z_1^{\ast\ast}=D^1(w',p)$ with drop lines and labels; arrows on the $z_1$ axis: $z_1^\ast\to z_1^o$ blue "substitution", $z_1^o\to z_1^{\ast\ast}$ red "scale".
- Caption: "The ordinary demand curve is flatter than the conditional ones: when $w_1$ falls the firm also expands output."

## Panel 2: "Change in cost = area to the left of the conditional demand curve"
Conditional demand $H^1(w_1,w_2,q^\ast)$ (axes $z_1$, $w_1$); shaded area between the curve and the $w_1$ axis between the two prices; readouts $\int_{w_1'}^{w_1}H^1\,\mathrm dw_1$ (numerical) and $C(w,q^\ast)-C(w',q^\ast)$ with ✓ when equal.

## Panel 3: readouts — "what if" formulas, each with a numerical check
- $C_{qq}$ at $q^\ast$ and SOSC $C_{qq}>0$ ✓.
- $\mathrm dq^\ast/\mathrm dp=1/C_{qq}$ against the finite-difference slope of $S(w,p)$ ✓.
- $\mathrm dq^\ast/\mathrm dw_1=-\tfrac1{C_{qq}}\partial H^1/\partial q$ against the finite-difference slope ✓.
- (**): $\partial D^1/\partial w_1=$ blue $\partial H^1/\partial w_1$ + red $(-1/C_{qq})(\partial H^1/\partial q)^2$, with the total from a finite difference ✓ and the signs (−)(−)(+).
- Discrete version: $z_1^\ast$, $z_1^o$, $z_1^{\ast\ast}$; $q^\ast\to q^{\ast\ast}$.

## model.js (tested)
`Cqq(w,q,s)`, `supplySlopeP(w,p,s)`, `supplySlopeW(w,p,s,i)` (formula and finite-difference versions), `decomposeOwn(w,p,s,i)` returning substitution, scale (lecture 4 form) and total, `demandCurve(w2,p,s,lo,hi,n)`, `conditionalCurve(w2,q,s,lo,hi,n)`, `areaLeftOfH(w2,q,s,wa,wb)` (Simpson), `points(w,p,s,w1new)`.
Tests: the three formulas against finite differences (all technologies with interior supply, both profiles); (**) adds up; scale term $\le0$; area = cost change; at defaults the numbers below.

## Defaults (tested)
Cobb-Douglas $\delta=0.5$, profile 'ushape' $a=2$, $m=1$, $p=8$, $w_2=1$, $w_1$: 2 → 1. Output $q^\ast=3.3522\to q^{\ast\ast}=2+\sqrt3=3.7321$; $z_1^\ast=4.8387$, $z_1^o=6.8430$, $z_1^{\ast\ast}=8.1308$. At $w_1=2$: $C_{qq}=7.6492$, $\mathrm dq^\ast/\mathrm dp=0.1307$, $\mathrm dq^\ast/\mathrm dw_1=-0.2615$, and (**) $\partial D^1/\partial w_1=-1.2097+(-0.5229)=-1.7326$. Area to the left of $H^1$ between $w_1=1$ and 2: 5.6689 = change in cost.
