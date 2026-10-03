# Market Supply and Entry — specification

Lecture 5, Part 1: "More firms", "Interaction between the firms", "Industry size". Read CLAUDE.md and `plans/lecture-5.md`. Individual firms use `shared/firm-model.js` with `profile:'ushape'` (Cobb-Douglas $\delta=0.5$, $w=(1,1)$, $a=2$, $m=1$, so $c(w)=2$, $\hat p=4$, $\hat q=3$): each firm's supply jumps from $0$ to $\hat q$ at $\hat p$ (the notes' "$q^\ast\in\{0,16\}$ at $p=p'$" situation).

Three tabs (segmented control at the top).

## Tab 1 — "Adding up supply"
**Goal:** with a jump in individual supply, market supply can miss the demand curve (no equilibrium); with many firms the *average* supply fills the gap.
- Controls: number of identical firms $N$ (1–60, default 2); per-firm demand $dem(p)=10-2p$ (fixed; market demand $N\cdot dem(p)$, a replica economy as in the notes' "average supply").
- Main plot (axes: average supply per firm $q$, price $p$): average supply correspondence — 0 below $\hat p$; at $\hat p$ the $N+1$ dots $\{0,\hat q/N,\dots,\hat q\}$ (a dot for every number of active firms); above $\hat p$ the individual supply curve (orange). Per-firm demand $dem(p)$ (black).
- Equilibrium readout: exists iff $N\cdot dem(\hat p)/\hat q$ is an integer ($=$ number of active firms), else "No equilibrium: demand passes through the gap" with the nearest dots highlighted. Defaults: $dem(\hat p)=2$, so active share $2/3$: equilibrium exists for $N=3,6,9,\dots$ (e.g. $N=3$: 2 firms produce 3 each); none for $N=2$ (notes' "it is not clear what will happen at $p''$").
- Small plot: gap size $\hat q/N$ against $N$ (falls like $1/N$).

## Tab 2 — "Externalities between firms"
**Goal:** a negative externality makes industry supply steeper than the sum of marginal costs; a positive one flatter (Cowell figures in the notes).
- Two identical firms with $MC_i=2+q_i+\gamma\,q_j$ ($j\neq i$); $\gamma\in[-0.8,0.8]$ (default 0.5; $\gamma>0$ negative externality, $\gamma<0$ positive). Price slider $p$ (default 8).
- Symmetric equilibrium $q_i=(p-2)/(1+\gamma)$; industry supply $Q=2(p-2)/(1+\gamma)$; without externality $Q=2(p-2)$.
- Plots: left, firm 1's $MC$ shifting with $q_2$ (dashed: $q_2=0$; solid: at equilibrium $q_2$); right, industry supply with externality (solid) vs sum of $MC$ curves (dashed), as in the notes.
- Defaults at $p=8$: $\gamma=0$: $Q=12$; $\gamma=0.5$: $Q=8$; $\gamma=-0.5$: $Q=24$.

## Tab 3 — "Free entry"
**Goal:** firms enter one by one while the next one can still make a non-negative profit; in the long run profit ≈ 0 and $p\approx\min AC=\hat p$.
- Market demand $Dem(p)=60-5p$. Button "Next firm enters" (and "Reset", "Enter until it stops"). With $N$ identical active firms the price solves $N\cdot S(w,p)=Dem(p)$ for $p>\hat p$.
- Plots: left, market (supply of $N$ firms, demand, price); right, a single firm ($MC$, $AC$, price line, profit rectangle as in the lecture 2 Cost Curves tool).
- Readouts: $N$, price, output per firm, profit per firm; stopping message: "Firm $N+1$ would make a loss: entry stops at $N=13$."
- Expected: $N=1$: $p\approx11.17$, $q\approx4.14$, profit $\approx26.10$; $N=10$: $p\approx5.39$, profit $\approx4.40$; $N=13$: $p\approx4.122$, $q\approx3.030$, profit $\approx0.368$; $N=14$: $14\hat q=42>Dem(\hat p)=40$, so not all 14 can break even.

## `model.js` and tests
Equilibrium solvers for tabs 1–3 (bisection); tests reproduce every number above and check that profit with $N^\ast$ firms is $\ge0$ and with $N^\ast+1$ is $<0$.

## Header
Eyebrow "Lecture 5 · The firm and the market", title "Market Supply and Entry". "How to read this" per tab (3 sentences each).

## Done when
All numbers reproduced; tabs work on a phone; no console errors.
