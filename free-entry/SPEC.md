# Free Entry and Industry Size — specification

Lecture 5, section 1.3 (Cowell figures 3.8 and 3.9 in the notes).

**Teaching goal.** A price-taking firm has $AR=MR=p$ and produces where $MC=p$; while $p>AC$ it earns a profit. Profit attracts entrants, each new firm pushes the price down, and the industry size $N$ is set by $\Pi(q_N)\ge0$ but $\Pi(q_{N+1})<0$. In the long run profit is (close to) zero and the price is (close to) $\min AC$.

## Model (`model.js`, tested)
Firm cost from `shared/firm-model.js` (Cobb-Douglas, $\delta=0.5$, $w=(1,1)$ so $c(w)=2$; 'ushape' profile with $a$, $m$). Demand $D(p)=M(10-p)$. With $N$ firms the market clears where $N\,q(p)=D(p)$, $q(p)$ on the rising branch of $MC$ (profit may be negative). Profit is non-negative exactly when $p_N\ge\hat p=\min AC$, i.e. $D(\hat p)\ge N\hat q$, so $N=\lfloor D(\hat p)/\hat q\rfloor$.
Functions: `demand`, `mcMin`, `outputOnMC`, `equilibrium(N,w,s,d)`, `industrySize`, `maxFirms`. Tests: output on MC equals $S(w,p)$ above $\hat p$; market clearing; price and profit fall with $N$; profit $\ge0\iff p\ge\hat p$; the industry size equals the largest $N$ with $\Pi\ge0$ (brute force); $p_N\to\min AC$ as $M$ grows; defaults.

## Page
- Controls: $N$ (3) with "One more firm", "Free entry" (animates to the industry size) and "Back to N = 3"; market size $M$ (6.6); cost parameters $a$ (2), $m$ (1) with the cost formula.
- Main: one firm — $MC$ (red), $AC$ (black), $AR=MR=p$ (blue), the profit rectangle $(p-AC)q$ (grey; red when negative), $\min AC$ marked.
- Side: the market — demand, supply of the $N$ firms (dashed below $\min AC$), the long-run line $p=\min AC$; readouts $\Pi(q_N)\ge0$ ✓ and $\Pi(q_{N+1})<0$ ✓, the industry size, $p_N$ vs $\min AC$.

## Defaults (tested)
$\min AC=4$ at $\hat q=3$. $N=3$: $p=8.285$, $q=3.773$, $\Pi=14.665$. Industry size 13: $p_{13}=4.061$, $\Pi(q_{13})=0.184\ge0$, $\Pi(q_{14})=-0.698<0$.
