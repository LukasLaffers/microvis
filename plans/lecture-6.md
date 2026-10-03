# Lecture 6 visualizations — plan and cloud-session prompts

Lecture 6: *Demand theory.* (UMP) and Marshallian demand $D(p,y)$; (EMP), Hicksian demand $H(p,v)$ and the expenditure function $C(p,v)$; the indirect utility function $V(p,y)$ and Roy's identity; duality and the four identities; the Slutsky equation; Giffen goods; income expansion paths and Engel curves; the conditions of Engel and Cournot.

The consumer side mirrors the firm side of lectures 2–4, and the tools should make that visible: $H$ (Hicksian) ↔ $H$ (conditional input demand), $D$ (Marshallian) ↔ $D$ (unconditional input demand), $C(p,v)$ ↔ $C(w,q)$, substitution effect (blue) + **income** effect (red) ↔ substitution effect + scale effect.

| Folder | Title | Lecture section |
|---|---|---|
| `slutsky/` | The Slutsky Equation | (M3) Slutsky equation, Giffen goods |
| `duality/` | Duality: UMP and EMP | indirect utility, (EMP), duality and the 4 identities, Roy's identity, Shephard's lemma |
| `engel-curves/` | Income Expansion and Engel Curves | income expansion path, Engel curve, necessity/luxury/inferior, conditions of Engel and Cournot |

## 1. Notation (lecture 6)

| Object | Symbol in the notes |
|---|---|
| goods, prices, income, utility level | $x_j$, $p_j$, $y$, $v$ |
| problems | (UMP) $\max_x U(x)$ s.t. $p^tx\le y$; (EMP) $\min_x p^tx$ s.t. $U(x)\ge v$ |
| Marshallian demand | $D(p,y)$, $D^j(p,y)$ |
| Hicksian demand | $H(p,v)$, $H^j(p,v)$ |
| indirect utility, expenditure function | $V(p,y)$; $C(p,v)=p^tH(p,v)$ |
| multipliers | $\lambda^\ast=\partial V/\partial y$ (UMP), $\mu^\ast=\partial C/\partial v$ (EMP) |
| Roy's identity | $-\dfrac{\partial V/\partial p_j}{\partial V/\partial y}=D^j(p,y)$ |
| Shephard's lemma | $\partial C/\partial p_j=H^j(p,v)$ |
| four identities | $C(p,V(p,y))=y$, $V(p,C(p,v))=v$, $D(p,y)=H(p,V(p,y))$, $H(p,v)=D(p,C(p,v))$ |
| substitution matrix | $S=\partial H(p,v)/\partial p^t$ |
| Slutsky | $\dfrac{\partial D^j}{\partial p_k}=\dfrac{\partial H^j}{\partial p_k}-\dfrac{\partial D^j}{\partial y}D^k$; elasticity form $\varepsilon^u_{jj}=\varepsilon^c_{jj}-\eta_j b_j$ |
| budget share, income elasticity | $b_j=p_jD^j/y$, $\eta_j=\dfrac{\partial D^j}{\partial y}\dfrac{y}{D^j}$ |
| Engel, Cournot | $\sum_j b_j\eta_j=1$; $b_i+\sum_j b_j\varepsilon^u_{ji}=0$ |
| points in the Giffen figure | $E_1$ (start), $E_2$ (same indifference curve, new prices), $E_3$ (new optimum) |

Colours: substitution effect blue, income effect red; budget lines red, indifference curves blue, as in earlier tools.

**Utilities available in the lecture 6 tools** (none is an exercise function):
- CES $U=[\delta x_1^{\rho}+(1-\delta)x_2^{\rho}]^{1/\rho}$ (default $\delta=0.5$, $\rho=-1$, so $\sigma=0.5$). Its demands come from `shared/firm-model.js`: $C(p,v)=c(p)\,v$ with `unitCost`, $H(p,v)=\widetilde H(p)\,v$ with `unitDemand`, $V(p,y)=y/c(p)$, $D(p,y)=\widetilde H(p)\,y/c(p)$ (use `tech:'ces'`, `delta`, `rho`).
- Stone–Geary $U=(x_1-\gamma_1)^{\alpha}(x_2-\gamma_2)^{1-\alpha}$ (subsistence quantities $\gamma_j\ge0$): $D^1=\gamma_1+\alpha\,(y-p^t\gamma)/p_1$, $D^2=\gamma_2+(1-\alpha)(y-p^t\gamma)/p_2$.
- Giffen (Haagsma 2012): $U=\alpha\ln(x_1-a)-\beta\ln(b-x_2)$ with $\alpha<\beta$ (convex preferences), $p_2=1$, $y>b$: $D^1=\dfrac{\alpha(y-b)-p_1\beta a}{p_1(\alpha-\beta)}$, valid while $D^1>a$ and $0\le D^2<b$. Defaults $\alpha=1$, $\beta=2$, $a=1$, $b=10$, $y=12$: $D^1=2-2/p_1$ for $p_1\in(2,7)$ — rises with $p_1$.
- Cobb-Douglas is allowed **only** as a CES special case ($\rho\to0$) and must not show closed-form demand, expenditure or indirect utility formulas (exercise 10).

**Do not reproduce the lecture 6 exercises:** no linear or Leontief utility presets (exercises 4–5), no $\alpha\sqrt{x_1}+x_2$ (exercise 1), no labour-supply problem (exercise 6), no 3-good substitution matrix (exercise 7). Hide $\lambda^\ast$ and $\mu^\ast$ (exercise 3a: $\lambda^\ast=1/\mu^\ast$) behind "Check your answer".

## 2. Prompts
First commit and push `plans/lecture-6.md` and the three `SPEC.md` files.

**Sessions 1–3** (one per tool, in parallel; replace `<folder>`):
> Read CLAUDE.md, plans/lecture-6.md and `<folder>`/SPEC.md. Build the tool in `<folder>`/ exactly as specified, using shared/firm-model.js for CES where the plan says so (do not modify shared/, index.html or other tools); other math in `<folder>`/model.js with its own Node test (brute-force checks of every optimum). Run all tests, check the page at desktop and 375 px width with no console errors, then open a pull request.

**Session 4** (after 1–3 are merged)
> Read CLAUDE.md and plans/lecture-6.md. Add cards for slutsky/, duality/ and engel-curves/ to index.html ("Lecture 6: …"), matching the existing cards; check every link. Open a pull request.

## 3. Review checklist
- $D$ Marshallian, $H$ Hicksian, $C(p,v)$, $V(p,y)$, $\eta_j$, $b_j$ exactly as in the notes; blue = substitution, red = income effect.
- No exercise presets or closed forms; hidden readouts hidden.
- Default numbers in each SPEC reproduced; works on a phone.
