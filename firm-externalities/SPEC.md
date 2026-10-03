# Firms That Affect Each Other — specification

Lecture 5, section 1.2 (Cowell figures 3.6 and 3.7 in the notes).

**Teaching goal.** If one firm's output shifts the other firm's marginal cost, market supply is not the sum of the marginal cost curves. A negative externality (pollution, congestion) makes market supply steeper, i.e. less responsive to the price; a positive one (training, networking, infrastructure) makes it flatter.

## Model (`model.js`, tested)
Two identical firms, $MC_i(q^i;q^j)=c+q^i/\alpha+e\,q^j$ ($e>0$ negative, $e<0$ positive externality; $|\alpha e|<1$). Supply given the other's output $S^i(p;q^j)=\max\{0,\alpha(p-c-eq^j)\}$. At price $p$ the outputs are a fixed point; when both produce, market supply is $2\alpha(p-c)/(1+\alpha e)$, against $2\alpha$ for $MC_1+MC_2$. $S$ meets the line $MC_1+MC_2$ for the other's output fixed at $\bar q$ where each firm produces $\bar q$, at $p=c+\bar q/\alpha+e\bar q$.
Functions: `supplyGiven`, `equilibrium` (iterated best replies), `marketSupply`, `marketSlope`, `sumOfMC`, `crossingPrice`, `priceFor`. Tests: fixed point, closed form, slope by finite differences, the ordering of slopes by the sign of $e$, the crossings, the defaults.

## Page
- Controls: Negative / None / Positive ($e=0.5,0,-0.5$), $e$, $\alpha$ (1), $c$ (1), the other firm's outputs $\bar q_a=1$, $\bar q_b=5$ (as in the notes), price $p$ (6).
- Plot: three panels as in the notes: firm 1 alone ($S^1(q^2=1)$ solid, $S^1(q^2=5)$ dotted), firm 2 alone, both firms ($S$ solid orange, $MC_1+MC_2$ dotted grey, crossings marked); the outputs at $p$.
- Readouts: consistency $q^1=S^1(p;q^2)$ ✓; slope $2\alpha/(1+\alpha e)$ vs finite difference ✓ and vs $2\alpha$.

## Defaults (tested)
$\alpha=1$, $c=1$, $e=0.5$, $p=6$: each firm $10/3$, market $20/3$, slope $4/3$ (vs 2). $S$ meets $MC_1+MC_2$ at $p=2.5$ ($\bar q=1$) and $p=8.5$ ($\bar q=5$).
