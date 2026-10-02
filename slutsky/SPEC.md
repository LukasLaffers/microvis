# Substitution and Income Effects — specification

Lecture 6: (M3) the Slutsky equation, $\varepsilon^u_{jj}=\varepsilon^c_{jj}-\eta_jb_j$, inferior and Giffen goods (the notes' Giffen figure), the appendix of lecture 7 (Marshallian vs Hicksian slope).

**Teaching goal.** A price change splits into a substitution effect along the old indifference curve ($E_1\to E_2$, always towards the cheaper good) and an income effect along parallel budget lines ($E_2\to E_3$). For an inferior good with a large budget share the income effect can win: a Giffen good.

## Model
Consumer math from `shared/consumer-model.js` (Giffen example $U=-(s-x_2)^2/(x_1-c)$, $c=1$, $s=4$). `model.js`: `decompose` ($E_1$, $E_2=H(p',v^0)$ bought with $C(p',v^0)$, $E_3$), `classify`, `marshallCurve`, `hicksCurve`. Tests (`node slutsky/test-model.cjs`): the effects add up, $E_2$ on $v^0$ and (when interior) tangent to the new price ratio, $E_3$ on the new budget, the substitution effect's sign, marginal Slutsky and its elasticity form, the Giffen and inferior cases, the upward-sloping Marshallian curve.

## Page
- Examples: Normal good (CES $\delta=0.5$, $\rho=-1$, $p_1$: 2 → 1, $p_2=1$, $y=10$) and Giffen good ($p_1$: 2.5 → 2, $y=5$: $E_1=(1.6,1)$, $E_2=(1.9375,0.25)$, $E_3=(1.5,2)$).
- Main: budget lines before/after, the compensated budget line (dotted blue), $v^0$, $v^1$, $E_1,E_2,E_3$ with blue and red arrows.
- Side: Marshallian (green) and Hicksian (blue dashed) demand for good 1 through $E_1$ (clipped to the example's valid region); table of effects for both goods; marginal Slutsky ✓; $\varepsilon^u_{11}=\varepsilon^c_{11}-\eta_1b_1$ ✓ (own price only: exercise 8 asks for the general form); normal / inferior / Giffen.
