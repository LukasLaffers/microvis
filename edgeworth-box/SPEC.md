# The Edgeworth Box — specification

Lecture 9: the exchange economy with Alf and Bill. It covers:
- offer curves; the competitive equilibrium where they cross, which may not be unique;
- the contract curve, the lens and the core; competitive allocations are in the core;
- excess demand, homogeneity and Walras' law;
- the second welfare theorem with balancing lump-sum transfers.

**Teaching goal.** At a given relative price both people choose on the same budget line through $R$. Usually their wishes do not fit in the box, so one good is in excess demand. Equilibrium prices make them fit. Every equilibrium is Pareto efficient and in the core. Any efficient point can be reached by the market after a lump-sum transfer.

## Model
`shared/exchange-model.js` (`window.ExchangeModel`) with CES consumers from `shared/consumer-model.js`. It provides:
- `demands`, `excess` (with a transfer $T$);
- `equilibria`: a log grid, then bisection, with stability;
- `offerCurve`, `contractX2`, `contractCurve`, `coreRange`;
- `support`: the supporting price and transfer.

Tests are in `shared/test-exchange-model.cjs`.

## Page
- Examples:
  - one equilibrium: $\delta^a=0.6$, $\rho^a=-1$, $\delta^b=0.35$, $\rho^b=0.3$, $R^a=(8,2)$; the equilibrium is $p^\ast=0.681$;
  - three equilibria: see `plans/lecture-9.md`.
- Box $10\times10$. Alf is measured from the bottom left (blue axes), Bill from the top right (red axes).
- Market mode:
  - the price slider and "go to an equilibrium";
  - the price line through $R$, both choices, both offer curves and the indifference curves through $R$;
  - the lens and the core;
  - drag $R$ to move the endowments.
- Second-welfare-theorem mode:
  - a target on the contract curve, its two tangent indifference curves and the supporting price line;
  - the transfer $R\to R'$, in good 1 (in good 2 if good 1 would leave the box);
  - check: after the transfer the supporting price clears the markets at the target.
- Side figure: $E_1(p)$ and $E_2(p)$ on a log price axis, with the equilibria.
- Numbers, with checks:
  - Walras' law at the current price;
  - homogeneity;
  - whether the markets clear.
