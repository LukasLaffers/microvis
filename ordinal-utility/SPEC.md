# Utility Is Ordinal — specification

Lecture 5, sections 2.4–2.6 (Cowell figure 4.6 and the figure for Theorem 1 in the notes).

**Teaching goal.** $V=f(U)$ with $f'>0$ represents the same preferences: same rankings, same indifference curves, different numbers; utility is ordinal. Quasi-concavity (convex $B(x)$) means that along the tangent of an indifference curve utility is highest at the point of tangency: $z^tU_{xx}z\le0$ for $z^t\nabla U=0$ (Theorem 1, (∗)). $MRS_{21}=U_1/U_2$ is minus the slope of the indifference curve.

## Model (`model.js`, tested)
Utility functions: Cobb-Douglas, CES ($\rho<1$, $\rho\ne0$), perfect substitutes, bowed out ($\alpha x_1^2+(1-\alpha)x_2^2$, not quasi-concave). Transformations: $\log U$, $\sqrt U$, $e^{U/3}$, $10+5U$, $U$, and the decreasing $-U$. Functions: `utility`, `TRANSFORMS`, `transformed`, `gradient`, `hessian`, `tangent`, `curvature` ($z^tU_{xx}z$ for the unit tangent), `alongTangent`, `mrs21`, `x2On`, `indifferenceCurve`.
Tests: every increasing $f$ keeps all rankings and $-U$ reverses them; level sets map to level sets; $z\perp\nabla U$; $z^tU_{xx}z<0$ for Cobb-Douglas and CES, $=0$ for perfect substitutes, $>0$ for the bowed-out function, with $U(x+tz)$ below, equal to or above $U(x)$ accordingly; $MRS_{21}$ equals minus the slope of the indifference curve; Cobb-Douglas Hessian and MRS by hand.
Not included (exercises 2, 5, 6, 7): $\mathrm dMRS_{21}/\mathrm dx_1$ and its link to (∗); the exercise transformations and utility functions; the MRS of transformed utilities.

## Page
- Controls: utility function (Cobb-Douglas, $\alpha=0.5$), $\rho$ for CES, transformation ($\log U$ default), bundles $x^\circ=(3,6)$ and $x'=(6,4)$.
- Main: two 3D surfaces side by side, $U$ and $V$, with the same six indifference curves drawn at their heights on each, the indifference curve through $x^\circ$ in black with its floor projection, and both bundles.
- Side: the ranking under $U$ and under $V$ (✓ same, ✗ reversed for $-U$; differences are not comparable); the indifference curve with $\nabla U(x^\circ)$ and the tangent; $U$ along the tangent; (∗) with its sign; $MRS_{21}=U_1/U_2$.

## Defaults
Cobb-Douglas $\alpha=0.5$, $x^\circ=(3,6)$: $U=4.243$, $V=\log U=1.445$; $x'=(6,4)$: $U=4.899$, so $x'\succ x^\circ$ under both. $MRS_{21}=2$, $z^tU_{xx}z=-0.0943$.
