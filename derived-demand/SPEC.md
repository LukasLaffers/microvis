# Marshall's Law of Derived Demand — specification

Lecture 4, section 2, and the Appendix corollary $\varepsilon^c_{11}=-\sigma(1-sh_1)$.

**Teaching goal.** With constant returns ($C=c(w)q$) supply is flat at $p=c(w)$ and the industry output is set by demand, $q=Dem(c(w))$. The industry's demand for labour (input 1) then has elasticity (†) $\varepsilon^u_{11}=\varepsilon^c_{11}+\varepsilon^D_p\,sh_1$, i.e. $(-\varepsilon^u_{11})=\sigma(1-sh_1)+(-\varepsilon^D_p)\,sh_1$: a **weighted average** of the elasticity of substitution and the (absolute) price elasticity of product demand, with weights $1-sh_1$ and $sh_1$.

## Setup
Technology from `shared/firm-model.js` with profile 'homog', $k=1$ (constant returns), $A=1$: Cobb-Douglas, CES, Leontief. Industry demand $Dem(p)=B\,p^{\varepsilon^D_p}$ with constant elasticity $\varepsilon^D_p\in[-4,-0.1]$ (default $-1.5$), $B=100$.

## Controls
How to read this; technology, $\delta$ (0.5), $\rho$ (−0.5, range −5 to 0.8); $w_1$ "wage" (1), $w_2$ "price of capital" (1); $\varepsilon^D_p$ (−1.5); a what-if wage rise $\Delta w_1/w_1$ in % (10) showing the discrete change.

## Panels
1. **Main: "The weighted average"** — a number line for elasticities with $\sigma$ (blue) and $-\varepsilon^D_p$ (red) marked; a lever whose position is $sh_1$ puts $-\varepsilon^u_{11}$ between them; bar below splitting $-\varepsilon^u_{11}$ into $\sigma(1-sh_1)$ (blue) and $(-\varepsilon^D_p)sh_1$ (red).
2. **"The industry's demand for labour"** — log-log plot of $D^1(w_1)=\widetilde H^1(w)\,Dem(c(w))$ (black) and the conditional demand $H^1(w_1,w_2,q)$ at today's output (dashed), with tangent slopes $\varepsilon^u_{11}$ and $\varepsilon^c_{11}$ at the current $w_1$.
3. **"The product market"** — flat supply at $c(w)$ before and after the what-if wage rise, demand curve $Dem(p)$, the output falling.
4. **Readouts** — $\sigma$ (from $C_{12}C/(C_1C_2)$, Theorem 1, numerically) and its formula value; $sh_1$; $\varepsilon^c_{11}$ numerical vs $-\sigma(1-sh_1)$ ✓; $\varepsilon^u_{11}$ numerical vs (†) ✓; the what-if: percentage change in industry labour demand for a 10 % wage rise vs the elasticity approximation.

## model.js (tested)
`equilibrium(w,s,dem)`, `industryDemand1(w,s,dem)`, `elasticities(w,s,dem)` (numerical $\varepsilon^c_{11}$, $\varepsilon^u_{11}$, $\sigma$ via Theorem 1, $sh_1$), `marshall(w,s,dem)` (formula side).
Tests: Theorem 1 gives $\sigma=1$ (Cobb-Douglas), $1/(1-\rho)$ (CES); corollary; (†) and Marshall's law against numerical elasticities for many parameters; Leontief: $\varepsilon^u_{11}=\varepsilon^D_p sh_1$.

## Defaults (tested)
Cobb-Douglas $\delta=0.5$, $w=(1,1)$, $\varepsilon^D_p=-1.5$: $p=c(w)=2$, $q=100\cdot2^{-1.5}=35.355$, $sh_1=0.5$, $\sigma=1$, $\varepsilon^c_{11}=-0.5$, $\varepsilon^u_{11}=-0.5+(-1.5)(0.5)=-1.25$, so $(-\varepsilon^u_{11})=0.5+0.75$. A 10 % wage rise: $c(w')=2\sqrt{1.1}$ and industry labour demand changes by $1.1^{-1.25}-1=-11.23\,\%$ (first-order approximation $-12.5\,\%$).
