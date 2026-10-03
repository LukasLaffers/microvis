# Substitution and Scale Effects — specification

Lecture 3, section "One-step vs two-step approach". Read CLAUDE.md and `plans/lecture-3.md` first (notation, colours). All firm math from `shared/firm-model.js` (`supply`, `condDemand`, `uncondDemand`, `cost`, `MC`, `AC`, `isoquant`, `unitDemand`).

**Teaching goal.** From $D(w,p)\equiv H(w,S(w,p))$, a rise in $w_1$ changes the demand for input 1 in two ways (lecture 3, coloured exactly as in the notes):
$$\frac{\partial D^1(w,p)}{\partial w_1}=\color{blue}{\underbrace{\frac{\partial H^1(w,q^\ast)}{\partial w_1}}_{\text{substitution}}}+\color{red}{\underbrace{\frac{\partial H^1(w,q^\ast)}{\partial q}\,\frac{\partial S(w,p)}{\partial w_1}}_{\text{scale}}}$$
Substitution: at the old output $q^\ast$, the firm moves along its isoquant to the new cheapest bundle. Scale: the higher cost lowers optimal output, so the firm moves down its (new) expansion path. Both effects reduce the demand for input 1. (The notes say "we will explore this connection later" — this tool is the picture; lecture 4 does the algebra.)

## Files
`substitution-scale-effects/index.html`, `app.js`, `model.js`, `test-model.cjs`, `style.css` (tool-specific only).

## `model.js` (tool math, tested)
- `decompose(w, p, s, dw1)` for a **discrete** price change $w_1\to w_1'=w_1+dw_1$ returns the three bundles
  $A=D(w,p)=H(w,q^\ast)$, $B=H(w',q^\ast)$ (same output, new prices), $C=D(w',p)=H(w',S(w',p))$,
  and the split $C-A=(B-A)+(C-B)$ = substitution + scale (vectors).
- `decomposeDerivative(w, p, s)` for the **marginal** version: central finite differences
  total $\partial D^1/\partial w_1$; substitution $\partial H^1(w,q^\ast)/\partial w_1$ at fixed $q^\ast$; scale $\partial H^1/\partial q\cdot\partial S/\partial w_1$. Same for input 2 (cross effect $\partial D^2/\partial w_1$).
- Tests: (i) total = substitution + scale to 1e-6 relative, all technologies with interior supply; (ii) substitution term $\le0$, scale term $\le0$ for input 1 whenever $\partial H^1/\partial q>0$; (iii) closed-form check of $\partial S/\partial w_1=-\dfrac{\widetilde H^1(w)\,G'(q^\ast)}{c(w)\,G''(q^\ast)}$ for `'ushape'` and for `'homog'` with $k<1$; (iv) $B$ lies on the isoquant of $q^\ast$, $C$ produces $S(w',p)$.

## Header
Eyebrow "Lecture 3 · Theory of the firm", title "Substitution and Scale Effects", subtitle: the decomposition formula above in KaTeX with the blue/red colouring. Back link.

## Controls
1. **How to read this** (open): 4 sentences — the firm starts at $A$; when $w_1$ rises it first substitutes along the old isoquant to $B$ (blue); then, because producing has become more expensive, it produces less and moves down the new expansion path to $C$ (red); the total change in input 1 is the sum of the two.
2. **Technology**: Cobb-Douglas (default) / CES / Leontief / linear; $\delta$ (0.5), $\rho$ (−0.5).
3. **Returns to scale**: "U-shaped average cost" (default, $a=2$, $m=1$) / "Homogeneous of degree k" ($k\in[0.3,0.95]$, default 0.6; $A=1$). Note: "$k\ge1$ has no profit maximum — see Cost Curves and Supply."
4. **Prices**: $p$ (default 8), $w_2$ (default 1), $w_1$ before (default 1) and **$w_1$ after** (default 1.5; slider from $0.5w_1$ to $3w_1$).
5. **Show the effects** button: animates $A\to B$ (blue, 1.5 s) then $B\to C$ (red, 1.5 s); replayable.
6. Toggle "marginal (derivative) version" for the readout table.

## Panel 1 (main): input space $(z_1,z_2)$
- Old isoquant $\phi(z)=q^\ast$ (grey) and new isoquant $\phi(z)=S(w',p)$ (light grey).
- Old isocost line through $A$ (black dashed), new isocost line with slope $-w_1'/w_2$ through $B$ (black).
- Old expansion path (dotted grey ray through $A$) and new expansion path (dotted ray through $B$ and $C$).
- Points $A$, $B$, $C$ labelled; arrow $A\to B$ blue along the old isoquant, labelled "substitution"; arrow $B\to C$ red along the new expansion path, labelled "scale".
- Projection on the $z_1$ axis: a horizontal bracket showing $B_1-A_1$ (blue) and $C_1-B_1$ (red) adding to $C_1-A_1$.
- Leontief: $A$ and $B$ coincide (no substitution), only the red arrow remains; caption explains. Linear: $B$ may jump to the other axis; caption explains.

## Panel 2: "Why output falls" — axes $q$, $p$
$MC$ before (red, thin) and after (red, thick), $AC$ after (black), price line $p$; $q^\ast=S(w,p)$ and $S(w',p)$ marked with an arrow between them. Caption: "A higher input price shifts marginal cost up, so the profit-maximising output falls."

## Panel 3: readout table (KaTeX)
| | input 1 | input 2 |
|---|---|---|
| substitution $B-A$ (blue) | | |
| scale $C-B$ (red) | | |
| total $C-A$ | | |

With the toggle on, show the derivative version for input 1: $\partial D^1/\partial w_1$ = substitution + scale with numbers, and the check "sum = total ✓". Also show $q^\ast$ before/after and $\Pi(w,p)$ before/after.

## Defaults and expected numbers (Cobb-Douglas $\delta=0.5$, 'ushape' $a=2$, $m=1$, $p=8$, $w_2=1$, $w_1$: $1\to1.5$)
$q^\ast$: $3.732\to3.505$. $A\approx(8.131,8.131)$, $B\approx(6.639,9.958)$, $C\approx(5.968,8.952)$.
Input 1: substitution $\approx-1.492$, scale $\approx-0.671$, total $\approx-2.163$. $\Pi$: $13.59\to10.14$.
Marginal version at $w_1=1$: $\partial D^1/\partial w_1\approx-6.375=-4.065$ (substitution) $-2.309$ (scale).

## Done when
The decomposition adds up exactly in both versions for every parameter value; the animation replays; Leontief and linear cases explained; tests pass; no console errors; works at 375 px width; numbers above reproduced.
