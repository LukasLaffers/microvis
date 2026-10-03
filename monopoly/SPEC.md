# Monopoly and Product Differentiation — specification

Lecture 5, sections 1.4 (market power) and 1.5 (product differentiation); Cowell figures 3.10, 3.12 and 3.13 in the notes.

**Teaching goal.** A monopolist chooses $q$ to maximise $p(q)q-C(w,q)$: $MR=MC$, i.e. $p(q)=MC(w,q)/(1+1/\eta(q))$ with $\eta=p/(q\,p_q)<0$, and earns $(AR-AC)q^\ast$. It produces less, at a higher price, than a price taker would. With differentiated products a local monopolist's profit attracts substitutes; its $AR$ shifts down until it is tangent to $AC$: zero profit at an output where $MR=MC$ and $AC$ is still falling.

## Model (`model.js`, tested)
Cost from `shared/firm-model.js` (Cobb-Douglas, $w=(1,1)$, $c(w)=2$, 'ushape' $a$, $m$). Demand linear $p=A-Bq$ or constant elasticity $p=Kq^{1/\eta}$. Functions: `price`, `priceSlope`, `MR`, `eta`, `optimum` (grid + bisection on $MR-MC$; `shutdown` if the best output makes a loss), `competitive` (price-taking benchmark $AR=MC$), `tangencyIntercept` ($A^\ast$ with maximal profit 0).
Tests: $MR$ and $\eta$ by finite differences; optimum vs brute force; $MR=MC$; the markup rule; profit $=(AR-AC)q$; $\eta<-1$ at the optimum; less output and higher price than the price taker; constant elasticity markup $\eta/(1+\eta)$; at $A^\ast$: zero profit, $AR=AC$, slopes equal, $MR=MC$, left of $\min AC$; the defaults.
Not included (exercise 1): price discrimination between markets, and the exercise's cost and demand functions.

## Page
- Situation: Monopoly | Differentiated products. Monopoly: demand Linear ($A=12$, $B=1$) | Constant elasticity ($K=14$, $\eta=-2$). Differentiated: $A$ (12, falls as substitutes enter), $B$, buttons "Substitutes enter" (animates $A$ to $A^\ast$) and "Short run". Cost $a$ (2), $m$ (1).
- Plot as in the notes: $AR$ blue, $MR$ blue dashed, $MC$ red, $AC$ black, profit rectangle grey, $p^\ast$, $q^\ast$, $MR=MC$ point, the price taker's point (open circle); in the differentiated case the short-run $AR$ stays as a faint dotted line.
- Readouts: $MR=MC$ ✓, $p=MC/(1+1/\eta)$ ✓, $\Pi=(AR-AC)q^\ast$ ✓, long-run tangency ✓; $q^\ast$, $p^\ast$, $\eta$, markup, the price-taking benchmark.

## Defaults (tested)
$AR=12-q$: $q^\ast=(3+\sqrt{13})/2=3.303$, $p^\ast=8.697$, $\Pi=15.311$; price taker $q=(7+\sqrt{65})/4=3.766$, $p=8.234$. Long run with $B=1$: $A^\ast=6.625$, tangency at $q^N=2.25$, $p=AC=4.375$, $MR=MC=2.125$.
