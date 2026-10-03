# Market Power — specification

Lecture 5, Part 1: "Market power" and "Product differentiation". Read CLAUDE.md and `plans/lecture-5.md`. Costs from `shared/firm-model.js`.

Two tabs.

## Tab 1 — "Monopoly"
**Goal:** the monopolist chooses $q$ where $MR=MC$; its price is a markup over marginal cost, $p(q)=\dfrac{MC(w,q)}{1+1/\eta(q)}$ with $\eta(q)=\dfrac{p(q)}{q\,p_q(q)}<0$; it produces less than a competitive industry with the same costs.
- Demand: select **linear** $p(q)=\alpha-\beta q$ (defaults $\alpha=20$, $\beta=1$) or **constant elasticity** $q=K\,p^{\eta}$ ($\eta\in[-5,-1.05]$, default $-2$, $K=100$).
- Costs: select **constant marginal cost** (`profile:'homog'`, $k=1$, $A=1$, Cobb-Douglas $\delta=0.5$, $w=(2,2)$ → $MC=AC=4$) or **U-shaped average cost** (`'ushape'`, $a=2$, $m=1$, $w=(1,1)$).
- Main plot (axes $q$, $p$), same style as the lecture figure: demand $AR=p(q)$ (black), $MR$ (dashed black), $MC$ (red), $AC$ (grey), optimum $q^\ast$ at $MR=MC$ with the price read off the demand curve; profit rectangle $(AR-AC)\,q^\ast$ shaded; competitive point $p=MC$ (open circle) and the deadweight-loss triangle (hatched).
- Readouts: $q^\ast$, $p^\ast$, $MC(q^\ast)$, $\eta(q^\ast)$, markup check $MC/(1+1/\eta)=p^\ast$ ✓, Lerner index $(p-MC)/p=-1/\eta$, profit, deadweight loss.
- Constant-elasticity demand with $|\eta|\le1$ is not allowed by the slider; explain in a note why ($MR<0$ everywhere).
- **Expected (linear, constant MC 4):** $q^\ast=8$, $p^\ast=12$, $\eta(8)=-1.5$, markup $4/(1-2/3)=12$ ✓, Lerner $2/3$, profit $64$, competitive $q=16$, deadweight loss $32$. **(Constant elasticity $\eta=-2$, MC 4):** $p^\ast=8$.

## Tab 2 — "Product differentiation"
**Goal:** a firm with a differentiated product faces a downward-sloping demand; as rivals enter with substitutes, its demand shifts down until, in the long run, demand ($AR$) is tangent to $AC$: zero profit, $MR=MC$ at the same $q$ (the notes' "local monopolist in the long run").
- Costs `'ushape'` as above. The firm's demand $p=A-q$; slider "demand intercept $A$" (3–14, default 12), with the caption "rivals' substitutes push this down".
- Button "Let rivals enter": animates $A$ down to the value $A^\ast$ where maximal profit is zero.
- Plot as in Tab 1 ($AR$, $MR$, $MC$, $AC$, profit rectangle).
- **Expected:** $A=12$: $q^\ast\approx3.303$, $p^\ast\approx8.697$, profit $\approx15.31$. Long run $A^\ast=6.625$: $q^\ast=2.25$, $p^\ast=4.375=AC(q^\ast)$, $MR=MC=2.125$, profit 0 (tangency).

## `model.js` and tests
Monopoly optimum (closed form for linear/constant elasticity with constant MC; numerical maximisation otherwise, checked against a grid search); markup identity; $A^\ast$ by bisection with tangency check ($AC=AR$ and $MR=MC$ at $q^\ast$). Tests reproduce every number above.

## Header
Eyebrow "Lecture 5 · The firm and the market", title "Market Power". "How to read this" per tab.

## Done when
Numbers reproduced; markup check always ✓; animation works; phone layout; no console errors.
