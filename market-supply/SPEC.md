# From Firms to Market Supply — specification

Lecture 5, section 1.1 (Cowell figures 3.1–3.5 in the notes).

**Teaching goal.** Market supply is the horizontal sum of the firms' supply curves. With avoidable fixed costs a firm's supply jumps from 0 to $\hat q$ at $p'=\min AC$, so market supply can jump over the demand curve and the market has no equilibrium. With many identical firms, the average firm's supply at $p'$ can be any of $0,\hat q/N,\dots,\hat q$; in the limit the gap is filled.

## Model (`model.js`, tested)
The notes' firms: $C(q)=F+cq+q^2/(2\alpha)$ for $q>0$, $C(0)=0$; $\hat q=\sqrt{2\alpha F}$, $p'=c+\hat q/\alpha$; supply $0$ below $p'$, $\{0,\hat q\}$ at $p'$, $\hat q+\alpha(p-p')$ above (the notes' $16+\alpha(p-p')$ with $\alpha=4$, $F=32$, $c=2$: $\hat q=16$, $p'=6$). Demand $D(p)=Kp^{-1.5}$. Functions: `startPoint`, `supplySet`, `supplyAt`, `profit`, `marketSupplySet` (all sums of the firms' optimal outputs), `equilibrium` (a price with $D(p)$ in the supply set, or the gap price), `averageSupplySet`, `averageEquilibrium` ($N$ identical firms, demand per firm $d(p)=K_dp^{-1.5}$: the closest $k$ of $N$ producing, gap $\le\hat q/(2N)$).
Tests: the notes' numbers (16, $p'=6$, average sets $\{0,8,16\}$ and $\{0,4,\dots,16\}$); $p'$ = min AC and supply = argmax profit by brute force; the equilibrium against a scan of excess demand (300 random two-firm markets, including ones without equilibrium); zero fixed costs always give an equilibrium; the gap bound.

## Page
- Controls: examples "Zero fixed costs" ($\alpha_1=6$, $\alpha_2=2$, $F=0$, $c=0$) and "Fixed costs, same MC" (default: $\alpha_1=\alpha_2=4$, $F_1=8$, $F_2=32$, $c=2$); firm sliders $\alpha_i$, $F_i$; $c$; demand level $K$ (300).
- Main: three panels as in the notes (low-cost firm, high-cost firm, both firms), supply in orange with the "nothing produced" part thick on the price axis, dots at the jump prices, demand in black, the equilibrium or "no equilibrium" at the gap price.
- Side: $N$ identical copies of firm 2, demand per firm $K_d$ (100), a "limit $N\to\infty$" switch; the dots of possible average supply at $p'$, the closest one in red; numbers for each firm and the market.

## Defaults (tested)
Firm 1: $p'=4$, $\hat q=8$; firm 2: $p''=6$, $\hat q=16$. With $K=300$ demand passes through the gap at $p=6$ (supply jumps from 16 to 32, $D(6)=20.4$): no equilibrium. Average firm, $N=4$, $K_d=100$: $d(6)=6.80$, 2 of 4 firms produce, average supply 8, gap $1.20\le\hat q/(2N)=2$.
