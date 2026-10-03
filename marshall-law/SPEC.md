# Marshall's Law of Derived Demand — specification

Lecture 4, section "Marshall's law of derived demand". Read CLAUDE.md and `plans/lecture-4.md` first (notation, colours). Firm math from `shared/firm-model.js` (`unitCost`, `unitDemand`, `isoquant`) with `profile:'homog'`, `k=1`, `A=1` (constant returns to scale, as the lecture assumes).

**Teaching goal.** With constant returns, price equals unit cost, $p=c(w)$, and the industry sells $Dem(c(w))$. The industry's demand for labour (input 1) is $D^1=\widetilde H^1(w)\,Dem(c(w))$, and its own-price elasticity satisfies
$$(-\varepsilon^u_{11})=\color{blue}{\sigma\,(1-sh_1)}+\color{red}{(-\varepsilon^D_p)\,sh_1}.$$
So labour demand is a **weighted average** of two forces: firms substitute away from labour (weight $1-sh_1$), and consumers buy less of the now more expensive product (weight $sh_1$). The clever bit: draw it literally as a weighted average on a number line, so students *see* that raising labour's cost share pulls the answer towards $|\varepsilon^D_p|$ — which makes demand more elastic only if $|\varepsilon^D_p|>\sigma$ (Hicks' qualification of Marshall's third rule).

## Model (`marshall-law/model.js`, tested)
- Technology CES with $\rho\in[-5,0.9]$ (so $\sigma=1/(1-\rho)\in[0.17,10]$), $\delta\in[0.1,0.9]$; also Cobb-Douglas ($\sigma=1$) via $\rho=0$.
- Product demand $Dem(p)=B\,p^{\varepsilon^D_p}$ with constant elasticity $\varepsilon^D_p\in[-4,0]$ (default $-2$), $B=10$. (Do not call it $\eta$: lecture 5 uses $\eta(q)$ for the demand elasticity of a monopolist.)
- `industry(w, s, epsD)` → $p=c(w)$, $Q=Dem(p)$, $D=\widetilde H(w)\,Q$, $sh_1=w_1\widetilde H^1/c$.
- `elasticities(w, s, epsD)` → $\varepsilon^c_{11}=-\sigma(1-sh_1)$, $\varepsilon^u_{11}$ from the formula, and $\varepsilon^u_{11}$ from a central finite difference of $\log D^1$ in $\log w_1$.
- Tests: formula = finite difference (all $\rho$, $\delta$, $\varepsilon^D_p$, several $w$); $\varepsilon^c_{11}$ formula = finite difference of $\log\widetilde H^1$.

## Header
Eyebrow "Lecture 4 · Theory of the firm", title "Marshall's Law of Derived Demand", subtitle with the formula above (KaTeX, coloured). Back link.

## Controls
1. **How to read this** (open): 4 sentences on the two channels and the weighted average.
2. **Substitution**: $\sigma$ via $\rho$ slider (show $\sigma$ big next to it), $\delta$.
3. **Product demand**: $\varepsilon^D_p$ slider (shown as $|\varepsilon^D_p|$ in the picture).
4. **Prices**: $w_1$ (labour), $w_2$ (capital), 0.2–5, defaults 1, 1. Note: "$w_1$ changes labour's cost share $sh_1$ (unless $\sigma=1$)."
5. Button **Raise $w_1$ by 10 %** — animates the two channels in panels 2–3 and shows the discrete change next to the elasticity prediction.

## Panel 1 (main): "A weighted average"
A horizontal number line from 0 to $\max(\sigma,|\varepsilon^D_p|)+0.5$.
- Blue dot at $\sigma$ labelled "substitution $\sigma$"; red dot at $|\varepsilon^D_p|$ labelled "product demand $|\varepsilon^D_p|$".
- A black marker at $(1-sh_1)\sigma+sh_1|\varepsilon^D_p|$ on the segment between them, labelled "$|\varepsilon^u_{11}|$"; draw the segment as a lever with the weights $1-sh_1$ and $sh_1$ written on each side.
- Under it a stacked horizontal bar of length $|\varepsilon^u_{11}|$: blue part $\sigma(1-sh_1)$, red part $|\varepsilon^D_p|\,sh_1$.
- Check line: "finite-difference elasticity = formula ✓".

## Panel 2: "Inside the firm" — input space
Unit isoquant $g(z)=1$ (as in Cost Minimisation), isocost line, $\widetilde H(w)$; when $w_1$ is raised, the new tangency (blue arrow along the isoquant).

## Panel 3: "In the product market" — axes quantity $Q$, price $p$
Demand curve $Dem(p)$; horizontal supply at $p=c(w)$ (flat $MC=AC$, as the notes say); equilibrium $Q=Dem(c(w))$. When $w_1$ is raised, supply shifts up to $c(w')$ and $Q$ falls (red arrow). Caption: "Higher labour cost raises unit cost and price; consumers buy less, so firms need less of every input."

## Panel 4: "Marshall's rules" (small multiples)
Three mini line plots of $|\varepsilon^u_{11}|$ against (a) $\sigma$, (b) $|\varepsilon^D_p|$, (c) $sh_1$ (varying $w_1$), each with the current value marked. Caption for (c): "Increases with $sh_1$ only if $|\varepsilon^D_p|>\sigma$."

## Defaults and expected numbers ($\rho=-1$ so $\sigma=0.5$; $\delta=0.5$; $w=(1,1)$; $\varepsilon^D_p=-2$)
$sh_1=0.5$; $\varepsilon^c_{11}=-0.25$; $(-\varepsilon^u_{11})=0.5\cdot0.5+2\cdot0.5=1.25$.
At $w_1=2$: $sh_1\approx0.586$, $\varepsilon^u_{11}\approx-1.379$; at $w_1=0.5$: $sh_1\approx0.414$, $\varepsilon^u_{11}\approx-1.121$.

## Done when
Formula and finite difference agree everywhere; the lever picture moves correctly; the 10 % animation works; tests pass; no console errors; works at 375 px; numbers reproduced.

## As built (merged with the first version of the tool)
Everything above, plus the panels of the earlier `derived-demand/` version:
- Technology choice CES (default) / Cobb-Douglas / Leontief; $\sigma$ from Theorem 1 ($C_{12}C/(C_1C_2)$, finite differences) checked against the formula value.
- "The industry's demand for labour": log-log $D^1(w_1)=\widetilde H^1(w)\,Dem(c(w))$ and the conditional $H^1$ at today's output, tangent slopes $\varepsilon^u_{11}$ and $\varepsilon^c_{11}$.
- "The product market" (panel 3 above) with the discrete what-if: the wage rise is a slider $\Delta w_1/w_1$ (default 10 %); the button "Raise $w_1$ and watch both channels" animates panels 2 and 3.
- Readouts: corollary, (†) and Marshall's law each against a finite difference (✓); the exact change in $D^1$ against $\varepsilon^u_{11}\times\Delta w_1/w_1$.
- Marshall's rules: (c) is drawn by moving $w_1$; along it $(-\varepsilon^u_{11})=\sigma+(\eta-\sigma)\,sh_1$, tested.
Model: `equilibrium`, `industryDemand1`, `conditional1`, `sigmaTheorem1`, `elasticities`, `sigmaFormula`, `marshall`, `whatIf`, `withSigma`, `ruleSigma`, `ruleEta`, `ruleShare`. Test: `node marshall-law/test-model.cjs` (3,309 checks, including the defaults above: $sh_1=0.5$, $\varepsilon^c_{11}=-0.25$, $1.25$; $w_1=2$: $0.586$, $-1.379$; $w_1=0.5$: $0.414$, $-1.121$).
