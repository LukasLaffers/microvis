# Preferences and Utility — specification

Lecture 5, Part 2: preference axioms, $B(x)$, $W(x)$, $I(x)$, lexicographic preferences, representation, ordinal utility, convexity and quasi-concavity, the MRS. Read CLAUDE.md and `plans/lecture-5.md` (especially the list of exercise items that must not be reproduced). Self-contained math in `preferences/model.js`.

Utility families available in every tab (two goods, $x\in\mathbf R^2_+$; none of them is an exercise function):
- Cobb-Douglas $U=x_1^{a}x_2^{1-a}$ ($a\in[0.1,0.9]$, default 0.5)
- perfect substitutes $U=a x_1+(1-a)x_2$
- perfect complements $U=\min\{x_1/a,\ x_2/(1-a)\}$
- quasilinear $U=\ln(1+x_1)+x_2$
- non-convex $U=x_1^2+x_2^2$
- bliss point $U=-(x_1-4)^2-(x_2-4)^2$ (violates desirability)
- lexicographic $\succcurlyeq_L$ (no utility function; tab 1 only)

## Tab 1 — "Better and worse"
**Goal:** pick a bundle $x$ (click/drag) and see $B(x)$ (blue shading), $W(x)$ (grey shading) and $I(x)$ (blue curve) for the chosen preferences.
- Lexicographic: $B(x)$ is the region $x_1'>x_1$ plus the vertical half-line above $x$; draw the boundary $x_1'=x_1$ dashed (not included) to show that $B(x)$ is not closed — the continuity axiom fails and no indifference curve exists ($I(x)=\{x\}$).
- "Check your answer" button (hidden by default) reveals badges: completeness, transitivity, continuity, monotonicity ($x\gg y\Rightarrow x\succ y$), strong monotonicity, convexity ($B(x)$ convex), each ✓/✗ for the chosen family, with one-line reasons.

## Tab 2 — "Same preferences, different utility"
**Goal (ordinal utility):** $V=f(U)$ with $f'>0$ represents the same preferences — the 3D surfaces look different, the indifference map is identical (the notes' figure "Two different utility functions representing the same preferences").
- Transformations $f$: $u^{\theta}$ ($\theta\in[0.2,3]$), $\log u$, $e^{u}$, and $-u$ (decreasing: reverses preferences — the map is the same but $B(x)$ and $W(x)$ swap; show this as a warning).
- Two 3D surfaces side by side ($U$ and $V$, Plotly), each with the same contour lines drawn on the floor; a bundle marker linked between them.
- "Check your answer" (hidden) reveals $MRS_{21}=U_1/U_2$ computed from $U$ and from $V$ (equal).

## Tab 3 — "Convexity and the MRS"
**Goal:** the lecture's argument for $z^t\,\dfrac{\partial^2U}{\partial x\partial x^t}\,z\le0$ for $z\perp\nabla U$: walk from $x^\ast$ along the tangent line of the indifference curve. With convex preferences you only reach *lower* indifference curves, so utility along the tangent line has a maximum at $x^\ast$ (the notes' proof figure).
- Left: indifference map, point $x^\ast$ (draggable along its indifference curve), gradient $\nabla U(x^\ast)$ arrow, tangent line in direction $z\perp\nabla U$.
- Right: $t\mapsto U(x^\ast+tz)$ for $t\in[-1.5,1.5]$, with the second-order value $z^t\,\frac{\partial^2U(x^\ast)}{\partial x\partial x^t}\,z$ shown and its sign (✓ $\le0$ / ✗ $>0$).
- Readout: $MRS_{21}(x^\ast)=U_1/U_2$, and — behind "Check your answer" — whether it falls as $x^\ast$ moves South-East.
- **Expected:** Cobb-Douglas $a=0.5$ at $x^\ast=(2,2)$, $z=(1,-1)$: $U(2+t,2-t)=\sqrt{4-t^2}$, maximum at $t=0$, $MRS_{21}=1$. Non-convex $x_1^2+x_2^2$ at $(2,2)$: $U=8+2t^2$, minimum at $t=0$ (✗).

## `model.js` and tests
Utility, gradient, Hessian (analytic, checked by finite differences), membership tests for $B$, $W$, lexicographic order; tests for the expected numbers and for $MRS$ invariance under each $f$.

## Header
Eyebrow "Lecture 5 · Consumer preferences", title "Preferences and Utility". "How to read this" per tab.

## Done when
All three tabs work for every family; hidden readouts stay hidden until clicked; numbers reproduced; phone layout; no console errors.
