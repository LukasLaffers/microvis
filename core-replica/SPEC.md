# The Core Shrinks — specification

Lecture 9: the $N$-replica economy and the notes' blocking argument with Alf, Arthur, Bill and Ben. The core shrinks to the competitive allocations as $N\to\infty$.

**Teaching goal.** A core allocation $y$ that is not competitive lies on a line through $R$ that cuts one person's indifference curve at $y$. Moving back towards $R$ to $\theta y+(1-\theta)R$ makes that person better off, and $N$ such people with $M$ of the other type can afford it when $\theta=M/N$. The closer $y$ is to the competitive allocation, the closer $\theta$ must be to 1, so the more people are needed.

## Model
`shared/exchange-model.js`:
- `thetaMin`;
- `blockingN`: the smallest replica size that blocks;
- `coalition`: $N$, $M$, the bundles.

`model.js` (`window.ReplicaModel`):
- `profile`: the core on a grid plus the equilibrium, with each point's blocking $N$;
- `surviving(N)`.

Tests (`node core-replica/test-model.cjs`) check:
- the whole core survives $N=1$;
- the ends of the core are blocked at $N=2$, as in the notes;
- the surviving sets are nested, contain the equilibrium and shrink to it;
- every coalition is feasible and strictly improving for all members.

## Page
- Controls: $N$ (1–60, with quick buttons), the position of $y$ in the core, and the CES economy.
- Main figure, zoomed on the lens:
  - the core coloured by survival at $N$;
  - $y$ and the line $R$–$y$;
  - the blocking type's indifference curve through $y$;
  - the better part of the line and the coalition's point $\theta=M/N$.
- Side figure: the surviving band against $N$ (log scale), with the equilibrium and $y$.
- Numbers: $y^a$, $y^b$, the threshold $\theta$, the smallest blocking $N$; the coalition, its bundles, feasibility and the gain.
