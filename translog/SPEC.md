# Translog Cost Shares — specification

Lecture 4, section 3 (translog cost function, estimation, elasticities, restrictions, results) and Appendix (translog as a second-order approximation, derivation of (%), (#), ($)).

**Teaching goal.** The translog unit cost $\log c=\alpha_0+\sum_i\alpha_i\log w_i+\tfrac12\sum_i\sum_j\beta_{ij}\log w_i\log w_j$ is a second-order approximation of any unit cost function. By Shephard's lemma its cost shares are linear in log prices, (&) $sh_i=\alpha_i+\sum_j\beta_{ij}\log w_j$, which can be estimated by OLS; the elasticities then follow from (%), (#), ($), and economic theory restricts the parameters.

## Panels
1. **"A second-order approximation"** (two inputs). A true CES unit cost (from `shared/firm-model.js`, choose $\delta$, $\rho$) and its translog approximation around reference prices $\bar w$: plot $\log c$ against $\log(w_1/w_2)$ — curves touch at the reference and separate away from it. The approximation's parameters $\alpha_i$, $\beta_{ij}$ are computed from the Appendix ($\bar f_i$, $\bar f_{ij}$).
2. **"Cost shares are linear in log prices"** — $sh_1$ against $\log(w_1/w_2)$: CES share curve vs translog straight line (&), tangent at the reference.
3. **"Elasticities"** at the current prices: (%) $\varepsilon^c_{11}$, (#) $\varepsilon^c_{12}$, ($) $\sigma_{12}$ from the translog vs the true CES values; at the reference they agree exactly ($\varepsilon^c_{11}=-\sigma sh_2$, $\sigma_{12}=\sigma$).
4. **"Restrictions"** — a mode "enter your own parameters" for two inputs ($\alpha_1,\alpha_2,\beta_{11},\beta_{12},\beta_{21},\beta_{22}$) with live checks of restrictions 1–4 (adding up, homogeneity, symmetry, negative own-price elasticity over a price range).
5. **"Results: Arnberg and Bjørner (2007)"** — their reported own- and cross-price elasticities (Table 5 in the notes) as a 4×4 matrix coloured as in the notes (green own-price, blue electricity–other energy, red energy–machine complements), with the parameter table (Table 3) beside it. Data only; no re-estimation.
6. **"Why firm-level panel data"** — the notes' two Leontief firms $\phi^E=\min\{E/2,K\}$, $\phi^K=\min\{E,K/2\}$: a slider for the energy-intensive firm's output (10 → 5 as energy gets dearer, the other firm 10 → 15) shows the aggregate $E$ falling and $K$ rising (30→25, 30→35) although neither firm substitutes.

## model.js (tested)
`translogFromUnitCost(f, wbar)` (numerical gradient/Hessian of $\log c$ in log prices → $\alpha_0,\alpha,\beta$), `logUnitCost(params, w)`, `shares(params, w)`, `elasticities(params, w)` with (%), (#), ($), `checkRestrictions(params)`, `aggregate(eOut, kOut)` for the two Leontief firms.
Tests: shares = $\partial\log c/\partial\log w_i$ (finite differences); for a CES the approximation has $\beta_{11}=(1-\sigma)sh_1sh_2$ and exact agreement at the reference ($\varepsilon^c_{11}=-\sigma sh_2$, $\sigma_{12}=\sigma$); approximation error is $O(|\Delta\omega|^3)$; restrictions detected when violated; the notes' Leontief numbers (30→25, 30→35).

## Defaults and layout (as built)
Mode "Approximate a CES": $\delta=0.5$, $\rho=0.5$ ($\sigma=2$), reference $\bar w=(1,1)$, current $w=(2,1)$. Panel 1 also shows the approximation error (translog − true) on a right axis. At $\bar w$: $\beta_{11}=(1-\sigma)sh_1sh_2=-0.25$, $\varepsilon^c_{11}=-\sigma sh_2=-1$, $\sigma_{12}=2$; at the current prices the translog gives $\varepsilon^c_{11}=-1.438$ vs the CES value $-1.333$ and $\sigma_{12}=2.137$ vs 2. Restriction 4 is checked for $w_i\in[e^{-0.8},e^{0.8}]$ (the plotted range of $\log(w_1/w_2)$, $\pm1.6$). Mode "Your own parameters": $\alpha=(0.4,0.6)$, $\beta_{11}=\beta_{22}=0.1$, $\beta_{12}=\beta_{21}=-0.1$ (all restrictions hold). The Arnberg–Bjørner tables and the two-firm example sit in a full-width row below; the example's slider is the energy-intensive firm's output $\phi^E\in[2,10]$ with the other firm producing $20-\phi^E$.
