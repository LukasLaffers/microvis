# Robinson Crusoe's Economy — specification

Lecture 8: the planner's problem and its decentralisation in Robinson Crusoe's economy, equations (R1)–(C2), when decentralisation fails (C1), and opening the economy.

**Teaching goal.** The efficient allocation sets MRS equal to MRT. The price $w/p=MRS(x^\ast)$ makes the firm's best isoprofit line coincide with Robinson's budget line, and that line touches both the frontier and the indifference curve at $x^\ast$. This works only if the production set is convex. Trade at world prices lets consumption leave the frontier and makes the technology effectively convex.

## Model
`model.js` (`window.RobinsonModel`):
- `phi`, `dphi`, `d2phi` for $AL^\beta$ and the S-shape $AL^\gamma/(K^\gamma+L^\gamma)$;
- `planner`: a grid search, then the first-order condition;
- `firm(omega)`: the global profit maximum, so shutting down is possible;
- `consumer(omega, profit)`: chooses with $x_1\le T$;
- `decentralise`: returns both choices and the excess demands;
- `ppf`, `indifference`.

Tests (`node robinson-crusoe/test-model.cjs`):
- $\phi'$ against finite differences;
- the planner against brute force;
- MRS = MRT;
- with concave $\phi$: $L^{\ast\ast}=L^\ast$, $x^{\ast\ast}=x^\ast$, (C2) and Walras' law;
- gains from trade at any price;
- the S-shaped examples, where the firm hires more (profit at $L^\ast$ is a local minimum) or shuts down (loss at $L^\ast$).

## Page
- Examples:
  - concave, $A=3$, $\beta=0.5$, CES $\delta=0.5$, $\rho=-1$;
  - increasing returns at $x^\ast$: S-shape $A=40$, $K=7$, $\gamma=3$, $\delta=0.9$, $\rho=-0.5$;
  - loss at $L^\ast$: S-shape $K=4$, $\delta=0.3$, $\rho=-1$.
- Closed economy:
  - the frontier and the attainable set;
  - the indifference curve through $x^\ast$;
  - the budget = isoprofit line;
  - the firm's plan and Robinson's choice when they differ.
- Open economy: a world price slider, the production point, the consumption point, the trade triangle, and the autarky optimum.
- Side figure: $\phi(L)$ with the best isoprofit line, and the one through $L^\ast$.
- Numbers, with checks:
  - MRS = MRT;
  - $L^{\ast\ast}=L^\ast$;
  - both markets clear;
  - why decentralisation does or does not work.
