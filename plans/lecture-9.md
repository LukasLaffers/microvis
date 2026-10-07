# Lecture 9 visualizations — plan

Lecture 9: *General equilibrium.* It covers:
- the competitive market equilibrium with firms and with exchange only;
- the Edgeworth box, offer curves, and multiple equilibria or none;
- coalitions, blocking, the core and the contract curve; a competitive allocation lies in the core;
- $N$-replica economies, where the core shrinks to the competitive allocations (Alf, Arthur, Bill and Ben; $\theta y^a+(1-\theta)R^a$ with $\theta=M/N$);
- the first welfare theorem;
- excess demand $E(p)$: homogeneity of degree zero, Walras' law $\sum p_iE_i=0$ at any price, desirability and existence;
- the second welfare theorem with balancing lump-sum transfers.

| Folder | Title | Lecture idea | Notes' figures |
|---|---|---|---|
| `edgeworth-box/` | The Edgeworth Box | offer curves, equilibria where they cross (one or three), contract curve, lens and core, excess demand with Walras' law and homogeneity, second welfare theorem with a lump-sum transfer of good 1 | Cowell 5.1, 7.2–7.5, 7.7 |
| `excess-demand/` | Excess Demand and Equilibrium | the economy of Assignment 2 (2021): three goods, two firms (CES of degree 1/2), two Cobb-Douglas consumers who own the firms; the price plane with p3 = 1, where each market clears (E1 = 0, E2 = 0, E3 = 0 meet at one point), arrows of price adjustment and the auctioneer's path, the three markets as demand/supply bars, Walras' law at every price, homogeneity of degree zero; equilibrium (0.794, 1.395, 1) | notes 9, excess demand functions |
| `core-replica/` | The Core Shrinks | the notes' blocking coalition in the $N$-replica, the surviving part of the core as $N$ grows | Cowell 7.6 |

The exchange economy math is in `shared/exchange-model.js` (tests: `node shared/test-exchange-model.cjs`). Consumers have CES utility from `shared/consumer-model.js`.

Colours: Alf (a) blue, Bill (b) red, core green, price lines grey, equilibria as black stars.

The "Three equilibria" example uses CES with $\rho=-6$, $\delta^a=0.95$, $\delta^b=0.05$ and $R^a=(9.5,0.5)$. Its equilibria are at $p=0.367$, $1$ and $2.727$; the middle one is unstable. Multiple equilibria need strong complements, so excess demand stays small and the excess-demand plot scales its axis to it.

## Honest limits
The replica tool tests only the notes' coalitions: $N$ of one type and $M<N$ of the other, with equal treatment. Other coalitions could block more, so the green set is an upper bound on the core of the $N$-replica. It still shrinks to the competitive allocation.

## Do not solve the exercise
- No $\alpha\log x+y$ or $x+\beta\log y$ utilities.
- No endowments (10, 0) and (0, 10).
- No Cobb-Douglas with weight ½ (Dilip).
- No taxes on endowments as in the exercise.

## Status
Built: `edgeworth-box/` and `core-replica/` (exchange model 4,253 checks, replica 4,205 checks).
