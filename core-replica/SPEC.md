# The Core Shrinks — specification

Lecture 9, "A cooperative game to solve the exchange problem" and the $N$-replica argument. Read CLAUDE.md and `plans/lectures-7-9.md`.

**Teaching goal.** In the 2-person Edgeworth box the core is a whole segment of the contract curve. Replicate the economy $N$ times. A core allocation $y$ that is not competitive can be blocked by a coalition of $N$ Alfs and $M$ Bills (or vice versa) that gives each Alf $\theta y^a+(1-\theta)R^a$ with $\theta=M/N$ and each Bill $y^b$ — exactly the notes' construction (for $N=2$: Alf, Arthur and Bill, $\theta=\tfrac12$). As $N$ grows, more values of $\theta$ become available, and the surviving core shrinks to the competitive allocation.

## Economy
Cobb-Douglas default of the Edgeworth Box tool: $\alpha_a=\alpha_b=0.5$, $R^a=(8,2)$, $R^b=(2,8)$; the contract curve is the diagonal, core $=\{x^a=(t,t):t\in[4,6]\}$, competitive allocation $t=5$. Allow $\alpha_a$, $\alpha_b$ and the endowment to change (then compute contract curve and core numerically).

## Rule implemented (`model.js`)
A core point $y$ is **blocked in the $N$-replica** if for some integer $1\le M<N$, with $\theta=M/N$: $U^a(\theta y^a+(1-\theta)R^a)>U^a(y^a)$ (coalition of $N$ Alfs and $M$ Bills) or $U^b(\theta y^b+(1-\theta)R^b)>U^b(y^b)$ (the mirror coalition). This is the class of coalitions used in the notes (a sufficient condition for blocking); say so in the "How to read this" text.

## Layout
- Main: Edgeworth box with the core segment; for the current $N$, blocked points greyed out, surviving points thick; the competitive allocation $z$ marked.
- Slider $N$ (1–50) and a play button.
- Click a core point: show the best blocking coalition ($N$, $M$, $\theta$), the line from $R^a$ to $y^a$ with the point $\theta y^a+(1-\theta)R^a$ on it and Alf's higher indifference curve through it; feasibility check $N(\theta y^a+(1-\theta)R^a)+My^b\le NR^a+MR^b$ ✓.
- Side plot: length of the surviving core against $N$.

## Expected numbers (default)
Surviving core $t\in$: $N=1$: $[4,6]$; $N=2$: $[4.515,\ 5.485]$; $N=3$: $[4.684,\ 5.316]$; $N=5$: $[4.814,\ 5.186]$; $N=10$: $[4.909,\ 5.091]$; $N=20$: $[4.955,\ 5.045]$ (grid step 0.001).

## Tests
Reproduce the table above; the competitive allocation is never blocked; blocking coalitions are feasible.

## Header
Eyebrow "Lecture 9 · General equilibrium", title "The Core Shrinks".
