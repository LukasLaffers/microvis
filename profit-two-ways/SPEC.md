# One Step vs Two Steps — specification

Lecture 2, overview section "Step 1 (CM) and Step 2 (PM')". Read `plans/lecture-2.md` first: notation (section 2), colours, and the shared model `shared/firm-model.js` (section 3), which this tool must use for all math.

**Teaching goal.** One step profit maximisation (PM), $\max_z p\phi(z)-w^tz$, picks the best input bundle directly. Two step profit maximisation first finds the cheapest way to produce every $q$ (CM: substitution, blue), which traces the expansion path $\{H(w,q):q\ge0\}$, and then picks the best point on that path (PM': scale, red). Both arrive at the same bundle: $D^i(w,p)=H^i(w,S(w,p))$, the same output $S(w,p)$ and the same profit $\Pi(w,p)$. This is the lecture 2 "One Step Profit Maximisation / Two Step Profit Maximisation" diagram made interactive.

## Files
`profit-two-ways/index.html`, `app.js`, `style.css` (tool-specific only). Load `../shared/firm-model.js` and the vendored libraries with relative paths.

## Header
Eyebrow "Lecture 2 · Theory of the firm", title "One Step vs Two Steps". Under it, two KaTeX lines side by side:
left (black) "One step (PM): $\max_z\ p\phi(z)-w^tz$"; right "Two steps: (CM) $\min_z w^tz$ s.t. $\phi(z)\ge q$ (blue), then (PM') $\max_q pq-C(w,q)$ (red)". Back link.

## Controls
1. **How to read this** (open by default), 4 sentences: the 3D surface is profit $p\phi(z)-w^tz$ for every input bundle, and its peak is the one step answer; the blue ray is the expansion path, the cheapest bundles for every output level (Step 1); the red curve is profit along that ray (Step 2), and its peak is the two step answer; the two peaks coincide.
2. **Technology**: select Cobb-Douglas / CES (default Cobb-Douglas; linear and Leontief also allowed, see special cases); $\delta$ (default 0.5), $\rho$ (CES, default −0.5).
3. **Returns to scale**: segmented "U-shaped average cost" (default; $a=2$, $m=1$) / "Homogeneous of degree k" ($k\in[0.3,0.95]$ only, default 0.6; $A$ default 1). Explain in a note: "$k\ge1$ has no profit maximum under price taking — see the Cost Curves and Supply tool."
4. **Prices**: $p$ (default 8), $w_1$, $w_2$ (defaults 1, 1).
5. **Show the two steps** button: animates (1) the blue expansion path appearing, with the isocost tangency drawn at three output levels in the 2D plot; then (2) a red marker sliding along the path to the profit maximum. About 4 seconds; can be replayed.
6. Layers: profit surface on/off, surface opacity, "zero-profit plane" on/off.

## Main plot: 3D profit surface (Plotly surface, about 70×70 grid)
- Domain $z\in[0,z_{\max}]^2$, $z_{\max}=1.4\max(D^1,D^2)$ (at least 2); clip the vertical axis below at $-0.5\,\Pi$ so the peak is visible.
- Surface $\pi(z)=p\phi(z)-w_1z_1-w_2z_2$ (`FirmModel.profitAt`), neutral colour scale.
- One step optimum $z^\ast=D(w,p)$ at height $\Pi(w,p)$: black marker, label "one step: $D(w,p)$".
- Expansion path on the floor (blue ray, dotted) and lifted onto the surface (red curve: profit $pq-C(w,q)$ along the path, parameterised by $q$), so the student sees that the red curve passes through the peak of the surface.
- Translucent plane at profit 0 (the outside option).
- Camera buttons 3D / Top / Front / Side and reset; keep the camera when parameters change.

## Side plot 1: input space (2D)
- Isoquants $\phi(z)=q$ for $q\in\{0.5S, S, 1.5S\}$ (thin grey), with $q=S(w,p)$ in blue.
- Expansion path: blue ray from the origin in direction $\widetilde H(w)$.
- Isocost lines tangent at the three isoquants (thin grey), the one at $q=S(w,p)$ black.
- Point $z^\ast=H(w,S(w,p))=D(w,p)$: black dot labelled "$H(w,S(w,p))=D(w,p)$".

## Side plot 2: profit along the expansion path (2D)
$q\mapsto pq-C(w,q)$, red; maximum at $S(w,p)$ marked; horizontal line at 0.

## Readouts: comparison table (live, KaTeX)
| | One step (PM) | Two steps (CM)+(PM') |
|---|---|---|
| inputs | $z^\ast$ from a **direct numerical** maximisation of $p\phi(z)-w^tz$ (grid 120×120 over the plot domain, then local refinement) | $H(w,S(w,p))$ from the closed forms |
| output | $\phi(z^\ast)$ | $S(w,p)$ |
| profit | $p\phi(z^\ast)-w^tz^\ast$ | $\Pi(w,p)=pS-C(w,S)$ |

Under the table: a green "✓ same answer" when the two agree to 3 significant digits (they always should — if not, show the difference; it means a bug). The numerical one-step search must be done in `app.js` or a small `profit-two-ways/search.js` with its own Node test against the shared model.

## Special cases
- Linear technology: the expansion path is an axis (only the cheaper input is used); if $w_1/\delta=w_2/(1-\delta)$ say "Many bundles are optimal" and draw the isoquant segment.
- Leontief: the expansion path is the kink ray; the surface has a ridge along it.
- $p<\hat p$ ('ushape'): optimum is $z^\ast=0$, $\Pi=0$; both columns show 0; message "Price below minimum average cost: the firm does not produce."

## Defaults and expected numbers (Cobb-Douglas, $\delta=0.5$, 'ushape' $a=2$, $m=1$, $w=(1,1)$, $p=8$)
$S(w,p)=2+\sqrt3\approx3.732$, $D(w,p)=H(w,S)\approx(8.131,\ 8.131)$, $\Pi(w,p)\approx13.59$.

## Done when
- One step and two steps agree for all technologies and parameter values allowed by the controls.
- The animation works and can be replayed; no console errors; works at 375 px width (3D plot above the 2D plots); numbers above reproduced.
