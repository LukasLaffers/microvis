# The Cost Function — specification

Lecture 3, sections "Properties of the minimum cost function $C(w,q)$" and "Properties of the conditional factor demand $H(w,q)$". Read CLAUDE.md and `plans/lecture-3.md` first (notation, colours). All firm math from `shared/firm-model.js` (`cost`, `condDemand`, `unitCost`, `unitDemand`, `MC`, `isoquant`); profile fixed to `'homog'`.

**Teaching goal.** Make the properties of $C(w,q)$ visible as properties of a *function of prices*:
- (C4) concavity and (C5) Shephard's lemma in one picture: if the firm kept its inputs fixed at $\bar z=H(\bar w,q)$ when $w_1$ changes, its cost would be the straight line $w_1\bar z_1+w_2\bar z_2$. Because it can substitute, the true cost $C(w,q)$ lies below that line and touches it at $\bar w_1$, with slope $H^1(\bar w,q)$. A function that lies below all its tangent lines is concave.
- (C3) and (H3): multiplying both prices by $\alpha$ multiplies cost by $\alpha$ and leaves the cost-minimising bundle unchanged.
- (H4): the matrix of price effects is symmetric with non-positive diagonal; by (H3) it multiplied by $w$ gives zero.

## Files
`cost-function/index.html`, `app.js`, `model.js` (tool math), `test-model.cjs`, `style.css` (tool-specific only). Use `shared/ui.js` and `shared/firm-ui.js` helpers like the lecture 2 tools.

## `model.js` (tool math, tested)
- `priceEffects(w, q, s)` → 2×2 matrix $\left[\partial H^j/\partial w_k\right]$ by central finite differences of `FirmModel.condDemand` (relative step 1e-6).
- `fixedInputCost(w, zbar)` = $w_1\bar z_1+w_2\bar z_2$.
- `costCurveInW1(w2, q, s, range)` → points $(w_1, C(w_1,w_2,q))$.
- Tests: (i) Cobb-Douglas closed form: $\partial H^1/\partial w_1=-\delta(1-\delta)\,c\,G(q)/w_1^2$, $\partial H^1/\partial w_2=\partial H^2/\partial w_1=\delta(1-\delta)\,c\,G(q)/(w_1w_2)$; (ii) symmetry for cobb and ces; (iii) $\left[\partial H/\partial w^t\right]w=0$; (iv) diagonal $\le0$; (v) Shephard: finite-difference $\partial C/\partial w_j=H^j$; (vi) concavity: $C(w,q)\le$ `fixedInputCost` for many $w$ around $\bar w$ (all four technologies); (vii) $C(\alpha w,q)=\alpha C(w,q)$ and $H(\alpha w,q)=H(w,q)$.

## Header
Eyebrow "Lecture 3 · Theory of the firm", title "The Cost Function", subtitle: "$C(w,q)=\min_z\{w^tz:\ \phi(z)\ge q\}$ as a function of input prices". Back link.

## Controls
1. **How to read this** (open): 4 sentences matching the teaching goal above.
2. **Technology**: select (Cobb-Douglas default, CES, linear, Leontief), $\delta$ (0.5), $\rho$ (−0.5); collapsed "Scale": $A$ (1), $k$ (1).
3. **Reference prices** $\bar w_1$ (default 1), $\bar w_2$ (default 2), slider + number (0.2–5).
4. **Output** $q$ (default 2).
5. **Price scaling** $\alpha$ (0.25–3, default 1) for panel 3.

## Panel 1 (main): "Cost as a function of $w_1$" — axes $w_1$ (0.2–5), cost
- $C(w_1,\bar w_2,q)$: blue curve, width 3, label "$C(w,q)$ — inputs adjust".
- Fixed-input cost $w_1\bar z_1+\bar w_2\bar z_2$ with $\bar z=H(\bar w,q)$: black straight line, label "cost if inputs stay at $H(\bar w,q)$".
- Shaded area between them (light blue), label "saving from substitution".
- Tangency point at $\bar w_1$ (black dot); a small slope triangle with "slope $=H^1(\bar w,q)$ (C5)".
- Caption under the plot: "(C4) concave in $w$: the cost curve lies below every such line." (C2) note: "and it never decreases when a price rises."
- Leontief: the two lines coincide; caption switches to "No substitution possible: cost is linear in $w_1$ and the saving is zero."
- Linear: the cost curve is kinked where the cheaper input switches; mark the switch.
- Clicking or dragging on the curve moves $\bar w_1$.

## Panel 2: "The firm adjusts its inputs" — input space $(z_1,z_2)$
Isoquant $\phi(z)=q$ (blue), isocost line at $\bar w$ through $\bar z=H(\bar w,q)$ (black), and — when the user hovers or drags in panel 1 to a price $w_1$ — the new tangency $H(w_1,\bar w_2,q)$ (blue dot) with a thin arrow from $\bar z$ along the isoquant. Readout: $H^1, H^2$ at both prices.

## Panel 3: "(C3) and (H3): scaling all prices by $\alpha$"
Input space again: isocost line at $\alpha\bar w$ through $H(\alpha\bar w,q)$; the line keeps its slope and the bundle does not move as $\alpha$ changes. Readouts update live: $C(\alpha\bar w,q)=\alpha\,C(\bar w,q)$ (show both numbers) and $H(\alpha\bar w,q)=H(\bar w,q)$.

## Panel 4: "(H4) the matrix of price effects"
KaTeX 2×2 matrix $\dfrac{\partial H(w,q)}{\partial w^t}$ at $\bar w$ with numbers (3 decimals) and three live checks:
- symmetric: $\partial H^1/\partial w_2=\partial H^2/\partial w_1$ ✓
- own-price effects $\le 0$ ✓
- $\dfrac{\partial H}{\partial w^t}\,w=0$ (H3, Euler) ✓ — show the product vector.
For linear and Leontief show "not differentiable here" / zero matrix with a short note.

## Defaults and expected numbers (Cobb-Douglas, $\delta=0.5$, $A=1$, $k=1$, $\bar w=(1,2)$, $q=2$)
$C=4\sqrt2\approx5.657$, $H=(2\sqrt2,\sqrt2)\approx(2.828,1.414)$, $\lambda^\ast=\partial C/\partial q\approx2.828$.
Price effects $\approx\begin{bmatrix}-1.414 & 0.707\\ 0.707 & -0.354\end{bmatrix}$; times $w$ gives $(0,0)$.
At $w_1=2$: $C=8$ while the fixed-input cost is $\approx8.485$ (saving $\approx0.485$).

## Done when
All checks green for Cobb-Douglas and CES at all slider values; Leontief and linear show their notes; tests pass; no console errors; works at 375 px width; numbers above reproduced.
