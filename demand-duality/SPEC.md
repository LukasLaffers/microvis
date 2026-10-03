# UMP and EMP: Two Sides of One Tangency — specification

Lecture 6: (UMP), (EMP), Kuhn-Tucker, duality (Cowell figure 4.9), (M1), (M2), (I2), (I5), (E2)–(E5).

**Teaching goal.** The tangency of a budget line and an indifference curve answers two problems: the highest utility for income $y$ (Marshallian demand $D(p,y)$, value $V(p,y)$) and the least expenditure for utility $v$ (Hicksian demand $H(p,v)$, value $C(p,v)$). With $v=V(p,y)$ they are the same point: the four identities $C(p,V(p,y))=y$, $V(p,C(p,v))=v$, $D(p,y)=H(p,V(p,y))$, $H(p,v)=D(p,C(p,v))$.

## Model
Consumer math from `shared/consumer-model.js`. `model.js`: `identities`, `envelope` (Roy, Shephard, $\lambda^\ast=\partial V/\partial y$, $U_j/p_j$), `curveV`, `curveC`. Tests (`node demand-duality/test-model.cjs`): the identities, Roy, Shephard, Kuhn-Tucker at interior optima, (I2), (E2), (E4) on grids, for CES, Stone–Geary and quasilinear utility.

## Page
- View UMP (given $y$) / EMP (given $v$); switching keeps the same tangency.
- Preferences: CES ($\delta=0.4$, $\rho=-1$, $|\rho|\ge0.1$), Stone–Geary, quasilinear $\kappa\log(1+x_1)+x_2$. Prices $p_1=p_2=1$, $y=10$.
- Main: UMP: budget set, the best indifference curve and two others; EMP: the indifference curve $U=v$ and three expenditure lines. The point $x^\ast$.
- Side: the four identities ✓; (M1), (M2)/(E3), Kuhn-Tucker with $\lambda^\ast$, (I5), (E5) ✓; $V$ against $p_1$ and $C$ against $p_1$ with Shephard's tangent.
- Not shown (exercises 2, 3): quasi-convexity of $V$ in $p$; $\mu^\ast$.

## Defaults (tested)
CES $\delta=0.4$, $\sigma=0.5$, $p=(1,1)$, $y=10$: $x_1/x_2=\sqrt{0.4/0.6}$, $D=(4.495,5.505)$, $V=5.051$, $\lambda^\ast=0.505$.
