# Robinson Crusoe — specification

Lecture 8, "Decentralisation in a simple economy" and "Example: Robinson Crusoe's economy". Read CLAUDE.md and `plans/lectures-7-9.md`.

**Teaching goal.** The planner (Robinson in the morning) picks the point on the production possibility frontier where his indifference curve is tangent: $U_1/U_2=\phi'(L^\ast)$ (MRS = MRT). Decentralisation: set the real wage $w/p$ equal to that slope; a profit-maximising firm and a utility-maximising Robinson (who receives the profit) then choose the same point — the isoprofit line and the budget line coincide. If the technology is not convex (C1 fails) the planner's optimum may not be a profit maximum, and decentralisation fails. Opening the economy to world prices lets Robinson produce at one point and consume at another, on a higher indifference curve, and "convexifies" the technology.

## Model (`model.js`)
Time endowment $T=10$; leisure $x_1=T-L$; coconuts $x_2=q_2=\phi(L)$.
- Technology presets: **convex** $\phi(L)=A\sqrt L$ ($A=4$, default); **non-convex** $\phi(L)$ S-shaped, e.g. $\phi(L)=\dfrac{K L^3}{c^3+L^3}$ ($K=12$, $c=4$) — increasing returns first.
- Utility: $U=\ln x_1+\ln x_2$ (default) or CES via `shared/firm-model.js` ($\rho$ slider).
- Planner: maximise $U(T-L,\phi(L))$ over $L\in[0,T]$ (brute force + refinement).
- Firm at real wage $\omega=w/p$: $\max_L \phi(L)-\omega L$ (global maximum, brute force — important for the non-convex case); profit in coconuts $\pi/p=\phi(L)-\omega L$.
- Robinson at $\omega$: $\max U(x_1,x_2)$ s.t. $x_2+\omega x_1\le\omega T+\pi/p$.
- Market clearing check: labour supplied $T-x_1$ vs demanded $L$; coconuts demanded $x_2$ vs produced $\phi(L)$.

## Tabs
1. **"The planner"**: PPF $x_2=\phi(T-x_1)$ in $(x_1,x_2)$ space, indifference curves, optimum $x^\ast$, tangent line with slope $-\phi'(L^\ast)$ labelled MRS = MRT.
2. **"Decentralised"**: slider for $w/p$ (default: not at the optimum). Firm's isoprofit line tangent to the PPF at its choice (red), Robinson's budget line (blue) and his choice; the gap between them shown as excess demand for coconuts and excess supply of labour. Button "set $w/p$ = MRS at the planner's optimum": both choices coincide with $x^\ast$ (✓). With the non-convex preset, show the case where the firm's global profit maximum is far from $x^\ast$ ("decentralisation fails: (C1) not satisfied"), as in the notes' right-hand figure.
3. **"Opening the economy"**: world relative price slider; production where the PPF is tangent to the world price line, consumption where the world budget line through the production point is tangent to an indifference curve; utility gain vs autarky; with the non-convex preset show the production point jumping to a corner and the convexified frontier.

## Expected numbers (convex preset, log utility, $T=10$, $A=4$)
$L^\ast=10/3\approx3.333$, $x^\ast=(6.667,\ 7.303)$, $w/p=\phi'(L^\ast)=2/\sqrt{L^\ast}\approx1.095$, profit $\pi/p\approx3.651$ coconuts.

## Tests
Planner = decentralised allocation at the planner's $w/p$ (convex preset); budget identity; non-convex preset exhibits a $w/p$ where the planner's point is not a profit maximum.

## Header
Eyebrow "Lecture 8 · Decentralisation", title "Robinson Crusoe".
