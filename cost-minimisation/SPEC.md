# Cost Minimisation — specification

Lecture 2, Step 1 (CM). Read `plans/lecture-2.md` first: notation (section 2), colours, and the shared model `shared/firm-model.js` (section 3), which this tool must use for all math.

**Teaching goal.** For a given output $q$ and input prices $w$, the firm slides the isocost line $w_1z_1+w_2z_2=\text{const}$ down until it just touches the isoquant $\phi(z)=q$. The touching point is the conditional input demand $z^\ast=H(w,q)$, its cost is $C(w,q)$, and at an interior solution $MRTS_{21}(z^\ast)=w_1/w_2$. This is the **substitution** part of profit maximisation (blue in the notes). It reproduces and animates the lecture 2 figure "In the cost minimization, for any interior solution the MRTS needs to be equal to the ratio of input factor prices".

## Files
`cost-minimisation/index.html`, `app.js`, `style.css` (tool-specific only), `test-app-math.cjs` (only if the tool adds math of its own; otherwise rely on `shared/test-firm-model.cjs`). Load `../shared/firm-model.js`, `../shared/vendor/plotly/...`, `../shared/vendor/katex/...` with relative paths (see CLAUDE.md).

## Header
Eyebrow "Lecture 2 · Theory of the firm", title "Cost Minimisation", subtitle line with the problem rendered by KaTeX:
$\min_{z}\ w_1z_1+w_2z_2 \quad \text{s.t. } \phi(z_1,z_2)\ge q$ (CM). Back link "← All Microvis tools".

## Controls (left column; above the plots on a phone)
1. **How to read this** (collapsible, open by default): 3–4 sentences: the blue curve is the isoquant for output $q$; the grey lines are isocost lines, each one a set of input bundles with the same cost; moving the line towards the origin reduces cost; the cheapest bundle that still produces $q$ is where the line just touches the isoquant: $z^\ast=H(w,q)$; there the slopes are equal, $MRTS_{21}=w_1/w_2$.
2. **Technology**: select Cobb-Douglas / CES / Linear / Leontief; formula in KaTeX with current numbers (same style as the Production Explorer). Sliders $\delta$ (0.1–0.9, default 0.5), $\rho$ (CES only, −5 to 0.9, default −0.5). Under a collapsed "Scale (does not change the input mix)": $A$ (0.5–3, default 1) and $k$ (0.3–1.6, default 1), profile fixed to `'homog'`.
3. **Prices**: $w_1$, $w_2$ (0.2–5, step 0.05; defaults 1 and 2), slider + number box.
4. **Output**: $q$ (0.5–5, step 0.05, default 2).
5. **Isocost line** (mode toggle, default "Find it yourself"):
   - *Find it yourself*: slider "cost level" $\bar c$ from 0 to $2C(w,q)$ (default $1.6\,C(w,q)$). One isocost line $w_1z_1+w_2z_2=\bar c$ moves with it. Status text under the slider:
     - $\bar c < C(w,q)$ (by more than 0.5 %): "Too cheap: no bundle on this line produces $q$." (red text)
     - within 0.5 %: "Minimum cost reached: the line just touches the isoquant." (blue text) and snap to $C(w,q)$.
     - above: "Bundles on this line can produce $q$, but cost can still be reduced." (grey text)
   - *Show the solution*: the line is drawn at $C(w,q)$.
6. **Plot range**: $z_{\max}$ (default 6; checkbox "fit automatically" = $1.6\max(H^1,H^2)$, at least 2).

## Main plot: input space (Plotly 2D, square aspect)
- Axes $z_1$, $z_2$ on $[0,z_{\max}]$.
- Input requirement set $Z(q)$: light blue fill above the isoquant (as in lecture 1 Figure 3).
- Isoquant $\phi(z)=q$: blue `#4a90e2`, width 3, label "$q$".
- Grey isocost lines (`#9b9b9b`, thin): $w^tz=C(w,q)\cdot\{0.6, 0.8, 1.2, 1.4, 1.6\}$, with a small grey arrow and the text "reducing cost" pointing towards the origin (as in the lecture figure).
- Active isocost line (from the slider, or at $C(w,q)$): black, width 2.5; slope label "slope $=-w_1/w_2$".
- Optimum $z^\ast=H(w,q)$ (only when the active line is at the minimum, or always as a hollow marker in "Find it yourself" mode after the student has once reached the minimum): black dot, label "$z^\ast=H(w,q)$", dotted drop lines to both axes with tick labels $H^1(w,q)$, $H^2(w,q)$.
- Expansion path (toggle, default on): dotted blue ray from the origin through $z^\ast$ (because the technology is homothetic, all cost-minimising bundles for different $q$ lie on it). Label "expansion path".
- Special cases:
  - Linear: when `kind` is corner, $z^\ast$ is on an axis; when `multiple`, highlight the whole isoquant segment in black and write "Every bundle on this segment is cost minimising".
  - Leontief: $z^\ast$ at the kink; isocost line touches only the corner.

## Side panel 1: "Conditional demand for input 1"
Plot $H^1(w,q)$ against $w_1$ on $[0.2, 5]$, holding $w_2$ and $q$ fixed (blue line), current $w_1$ marked with a dot. Axis labels "$w_1$" and "$H^1(w,q)$". Caption: "Holding $q$ fixed, a higher price of input 1 makes the firm substitute away from it." For Leontief the line is flat (caption changes to "No substitution possible: the demand does not react to prices."); for linear it is a step.

## Side panel 2: readouts (live, KaTeX)
| Readout | Value |
|---|---|
| $H^1(w,q)$, $H^2(w,q)$ | 3 decimals |
| $C(w,q)=w_1H^1+w_2H^2$ | show the sum with numbers |
| $MRTS_{21}(z^\ast)$ | number / $\infty$ / $0$ / "undefined at the kink" |
| $w_1/w_2$ | number; when interior, a check mark "= $MRTS_{21}$" |
| $\lambda^\ast$ | $=\partial C/\partial q$ (`FirmModel.MC`), with small text "marginal cost of output" |
| solution type | Interior / Corner / Kink / Multiple |

## Defaults and expected numbers (Cobb-Douglas, $\delta=0.5$, $A=1$, $k=1$, $w=(1,2)$, $q=2$)
$c(w)=2\sqrt2\approx2.828$, $H(w,2)\approx(2.828,\ 1.414)$, $C(w,2)\approx5.657$, $MRTS_{21}=w_1/w_2=0.5$.

## Done when
- All four technologies and both isocost modes work; the student can find the minimum by hand.
- Changing $A$ or $k$ moves the isoquant but never changes the slope at $z^\ast$ or the expansion path direction.
- Page loads with no console errors; works at 375 px width; numbers above reproduced.
