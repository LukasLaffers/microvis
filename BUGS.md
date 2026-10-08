# Bug list (bug hunt, 8 October 2026)

## Status: all fixed on the branch (night of 8–9 October), not merged yet

Every item below has been fixed, except the two that turned out not to be bugs (Robinson Crusoe's axis margin, which leaves room for the production point; Free Entry's "no equilibrium" path, which the slider cannot reach, now handled anyway). One item could not be reproduced (Building the MRTS "—"); the sentence now leaves out a missing number instead of printing "—". How each was fixed, briefly:

- **Animations**: progress clamped at 0 (the first frame's time stamp can precede the click). Reproduced by making the first time stamp 40 ms early: before, both red banners; after, none.
- **WebGL leak**: new `Microvis.react3d`: on a projection switch it releases the old context, rebuilds the figure and re-attaches its handlers. Frisch: 1 → 21 canvases before, 1 → 1 after.
- **Numbers**: `fmt` prints |x| < 10⁻⁹ as 0 and exponents as 4.00×10⁻⁴ (superscript digits, also inside KaTeX).
- **Error banner**: a message from `guard()` disappears when that part draws again; user messages (Production Explorer, Free Entry) are notes in the page.
- **Subsistence / Giffen domain**: new `ConsumerUI.fitIncome` keeps the income slider where the problem has its usual solution (Stone–Geary above p·γ; the Giffen example inside its domain at both prices), with a note (UMP and EMP, Slutsky, Deadweight Loss).
- **Indifference curves** (`ConsumerModel.indifferenceCurve`) end where they meet the axis (no flat piece along it); tested.
- **Shutdown**: profit panels scaled by the loss at q̂ / q_max/2 (Cost Curves, One Step vs Two Steps); One Step vs Two Steps marks D = 0 and gets a deeper 3D floor.
- **Axes and labels**: Two Technologies (explicit ranges), Market Supply, Firms That Affect Each Other, Comparative Statics, Cost Curves, Cost Minimisation, Deadweight Loss, Excess Demand, Two Elasticities, Homogeneous (Δq below the ceiling), Better/Worse, Substitution or Composition, Edgeworth (R/R′), Monopoly, Free Entry, Utility Is Ordinal (camera for V = −U).
- **Checks**: CV ≤ ΔCS ≤ EV for a rise (signed order), Deadweight Loss approximations ✓ only within 10 %, Firms That Affect Each Other below p = c, Concavity's Largest gap (tolerance), Frisch's "diminishing".

---

Checked on the current `main` / branch head `9ec35e3` (after #15–#19), 33 tools. Found by moving every slider to its minimum and maximum, choosing every option and pressing every button on every tile, then 120 random moves per tile. After that I read the code and looked at screenshots. (This was the state before the fixes.)

Severity: **[major]** wrong numbers, a broken figure or a red error banner. **[minor]** misleading text, or the figure loses its point. **[cosmetic]** labels, clipping, rounding.
**Confirmed** means it was reproduced in the browser with the steps given. Default settings apply unless stated otherwise.

Model tests (`node */test-model.cjs`, `node shared/test-*.cjs`) all pass, and so does `tools/check-pages.cjs` (no page errors, no horizontal scrolling on a phone). The bugs are in the interface and the plotting.

## Worst first

1. **Substitution and Scale Effects**: "▶ Raise w₁ smoothly" puts up a red error banner with default settings, every time. The same with **Slutsky**: "▶ Lower p₁ smoothly". Both come from the first animation frame getting a negative time (item 1).
2. **Homogeneous and Homothetic**: S-shaped F with Δq above s² gives a red banner and empty figures.
3. **Slutsky**: "Giffen example" chosen in the utility list (not the button) gives garbage: no indifference curves, effects of the wrong sign, red ✗ checks.
4. **Stone–Geary when income is below the cost of subsistence** (UMP and EMP, Slutsky, Deadweight Loss): utility −10³⁰⁰, failed identities, nonsense numbers.
5. **Deadweight Loss, quasilinear, nobody buys good 1**: an x-axis with negative quantities, an arrow pointing at nothing, "—" in formulas.
6. **Two Technologies and a Kink** (new): changing q empties the H¹ panel, because the axis does not rescale.
7. **From Firms to Market Supply**: the "Zero fixed costs" preset hides the demand curve and the equilibrium (price axis too short).
8. **CV, EV**: for every price rise the order check shows a red ✗, although the order holds.
9. **Cost Curves / One Step vs Two Steps**: when the firm shuts down the profit panels are squashed; at p = 0 the revenue panel is empty.
10. **Concavity**: "Largest gap" on a concave technology jumps to a meaningless pair (rounding noise counted as a gap).

---

## Across several tiles

1. **[major] Animations start with a negative time (confirmed, the most visible bug).** `start = performance.now()` is taken at the click, but the time stamp that `requestAnimationFrame` passes to the first frame is earlier, so on the first frame `f = (now − start)/DURATION < 0`.
   - **Substitution and Scale Effects**, default settings, press **▶ Raise w₁ smoothly**: red banner "Could not draw the table: Cannot read properties of undefined (reading 'toFixed')". It happens 3 times out of 3 in Chromium, and the banner stays after the animation ends. **▶ Step by step** gives KaTeX "—" warnings (a NaN inside a formula).
   - **Slutsky**, default settings, press **▶ Lower p₁ smoothly**: red banner "Could not draw the plot: x is not iterable / Could not draw the numbers: Cannot read properties of undefined (reading 'toFixed')", 2 times out of 2.
   - Proof that this is the cause: if every frame gets `max(timestamp, performance.now())`, both banners disappear.
   - The same pattern is in `play()` of `substitution-scale-effects/app.js:336` and `slutsky/app.js:246`, and in `engel-curves/app.js:131`, `marshall-law/app.js:215`, `profit-two-ways/app.js:202` and `substitution-or-composition/app.js:91`. These four show no banner, but Substitution or Composition briefly sets w_E just below 1, under the slider minimum.
2. **[minor] 3D views leak WebGL canvases (confirmed in Frisch).** Frisch's Chocolate Data has 1 canvas on load, 11 after 5 round trips between Top and 3D, and 41 after 20. Chrome then warns "Too many active WebGL contexts. Oldest context will be lost." Switching between perspective and orthographic cameras seems to create a new context each time. On an iPhone, with its lower limit, a 3D figure could go blank. The same buttons exist in Production Explorer, One Step vs Two Steps, Two Elasticities and Concavity and Returns to Scale.
3. **[cosmetic] Rounding noise shown as a number (confirmed).** `fmt()` prints tiny values in exponent form, e.g. "−3.55×10^-15" or "8.38 × 10^−15", where the value is really 0. Seen in Free Entry, The Core Shrinks and Deadweight Loss.
4. **[cosmetic] Exponent form.** In `fmt()`'s ×10^n form the exponent keeps an ASCII hyphen and a caret, e.g. "10^-4". (The "−0.00" of the old version is fixed by the new two-decimal rule.)
5. **[minor] User messages go to the red error banner, and the banner never clears.** `showError` remembers every message, and nothing hides the banner again. Production Explorer ("Go to z̄") and Free Entry ("market too small") use it for ordinary user input, so a red error stays on the page after the input is corrected.
6. **[minor] No guard when income does not cover the Stone–Geary subsistence bundle (p·γ > y).** Several tiles then show meaningless numbers. Details under Demand Duality, Slutsky and Deadweight Loss. Engel Curves is guarded: its income slider minimum moves up silently.
7. **[minor] When the firm shuts down, the profit panels go almost empty.** The y-axis floor is set to 1, so the range is about [−1.5, 1.2] and the (negative) profit curve leaves the plot at once. Seen in Cost Curves and One Step vs Two Steps.
8. **[cosmetic] Points and labels at the plot edge are cut off** when a slider maximum equals the axis maximum. Examples: Better, Worse, Indifferent with x₁ or x₂ = 10; Firms That Affect Each Other with p = 12; the conditional demand dot in Cost Minimisation.

---

## Lecture 1

### Production Explorer
- **[minor] Confirmed.** "Go to z̄" with z₁ = 0 puts up the red error banner. It stays after a valid "Go" (see 5).
- **[minor]** "One input" mode with z̄₂ > z_max: the 3D figure draws the path at z₂ = min(z̄₂, z_max), while the readouts and the 2D panel use z̄₂. The figures disagree; the warning only says the point is out of range.

### Input Requirement Sets
- Nothing wrong found. Small issue: the free-disposal check covers only the plotted box. If a point is typed outside the box, `freeDisposalAt` checks points below it instead of above it.

### Building the MRTS
- **[minor]** Leontief with z̄ on the vertical arm and a small Δz₁ that does not reach the corner. The text says the step "frees all the excess z₂ down to the corner (−Δz₂ = —)". The number shows "—", and no z₂ is freed by such a step.

### Homogeneous and Homothetic
- **[major] Confirmed.** Homothetic, F = S-shaped, s = 1, Δq = 1.5 (Δq is larger than the ceiling s² of F): red banner "Could not draw the checks: Cannot read properties of null (reading '0')". The isoquant map and both ray plots are empty, and the Checks panel keeps the text of the previous state. Cause: `TM.pointOnRay` returns null and `renderChecks` uses `z[0]`.

### Two Elasticities: e(z) and σ(z)
- **[minor]** The σ panel is empty when σ > 6 everywhere, e.g. ρ = 0.9 (σ = 10) or mix with m = 0.05 (σ ≈ 14). The y-axis is capped at 6 (`sTop`), so the curve and the dot are off the plot.
- **[cosmetic]** z_max = 2 with z̄ = (2, 2.5): the point is outside the plot and nothing says so. z̄ can go up to 8 while z_max can be 2.

### Frisch's Chocolate Data
- **[minor] Confirmed.** Canvas leak with the camera buttons (see 2).
- **[cosmetic]** "Vary cocoa fat" caption: the word "diminishing" is decided only by comparing the third step with the first (`steps[2] < steps[0]`).

---

## Lecture 2

### Cost Minimisation
- **[minor]** "Fit automatically" is off by default. With A = 0.5, k = 0.3, q = 5 or z_max = 2, the isoquant, the optimum and the black isocost line leave the figure, and no warning appears. Other tools warn in this case.
- **[cosmetic]** Conditional demand panel: at w₁ = 0.2 the dot is above the y-range; at w₁ = 5 it is cut in half at the right edge.
- **[cosmetic]** "Fit automatically" can set z_max above the slider maximum of 20.

### Cost Curves and Supply
- **[minor] Confirmed.** p = 0: the "Revenue and cost" y-range is p·q_max·1.1 = 0, so Plotly falls back to −1…1 and the cost curve is invisible.
- **[minor] Confirmed.** Shutdown (p below p̂, e.g. p = 0, w₁ = 5 or w₂ = 5): the Profit panel is squashed to about [−1.3, 1.2] (see 7).
- **[cosmetic]** q_max = 2: q* lies beyond the axis, the profit rectangle runs to the edge, and nothing says so.

### One Step vs Two Steps
- **[minor] Confirmed.** Shutdown (w₁ = 5, w₂ = 5 or p = 0.5): the Step 2 panel is squashed (see 7).
- **[minor]** Shutdown: Step 1 still shows a large black dot at H(w, q̂), the tangency for q̂. The label "H(w,S(w,p)) = D(w,p)" moves to the origin, so the dot looks like the optimum.
- **[minor]** Shutdown: the 3D profit surface is clipped to a flat floor, leaving only a short vertical red line. The figure shows almost nothing.

### Two Technologies and a Kink (new)
- **[major] Confirmed.** Change q: the H¹ panel goes empty or half empty. At q = 0.5 the x-axis stays at [0.74, 2.47] while H¹ = 0.52; at q = 2, H¹ = 2.95. The y-axis of the C(w₁, 1, q) panel also stays at [0.4, 10.4], so at q = 2 the curve leaves the top. Cause: `U.plot` sees the same layout (no axis range is given, nothing in the layout depends on q), so it only moves the points with `Plotly.animate` and never re-computes the autorange. Fix: give both axes explicit ranges, or put q into the layout key.
- **[cosmetic]** The "slope −6.00" label of the steep dotted line at the kink is cut off at the right edge (default α, β; firm D).

### Concavity and Returns to Scale
- **[minor] Confirmed.** "Make it homothetic" (k = 0.75, concave), then "Largest gap": z and z′ jump to (4, 7.5) and (5.5, 6) on one isoquant, and the caption says "The chord and the curve coincide". It should say "No pair … this technology is concave". Cause: `worstPair` accepts a rounding gap of 2.7×10⁻¹⁵ > 0 (`model.js:111` needs a tolerance).
- **[cosmetic]** k₁ and k₂ both > 1 and unequal: the text says "Increasing returns to scale near the z₁ axis", but returns are increasing everywhere.

---

## Lecture 3

### The Cost Function
- Nothing wrong found.

### Substitution and Scale Effects
- **[major] Confirmed.** Default settings, press **▶ Raise w₁ smoothly**: red banner "Could not draw the table: …" (see 1).
- **[cosmetic]** The bars that the caption places "on the z₁ axis" are drawn at the bottom of the zoomed view, not on the axis. In the default two-step picture with "Homogeneous of degree k" they sit at z₂ ≈ 4, and the "total" label overlaps its bar.
- **[cosmetic]** The colours in the "Marginal" box (and in the Slutsky check line) are hard-coded (`#4a90e2`, `#d0021b`) and do not follow the dark theme.
- **[cosmetic]** "Why output falls": the label "3.72 → 2.74" sits on top of the red triangle.

---

## Lecture 4

### What If? Comparative Statics
- **[minor]** p = 0.5 or w₂ = 5 (no production at either w₁): the main figure is empty, with axes 0…0.0014. The "change in cost" panel has an x-axis of 0…0.0015 whenever q* = 0 at one of the prices (also with a = 3, m = 3, w₁ = 5). Only the text on the right explains why.

### Marshall's Law of Derived Demand
- Nothing wrong found (the "−0.00 %" of the old version is gone).

### Translog Cost Shares
- Nothing wrong found.

### Substitution or Composition?
- **[cosmetic]** Labels cut off at the plot edge: at w_E = 0.5, "aggregate (35…" and "energy-intensive (30.0, 15.0" at the right edge. At w_E = 3 the aggregate label overlaps the capital-intensive label at the top.
- **[cosmetic]** At the start of the animation w_E dips just below 1 (see 1).
- **[cosmetic]** The button in the figure heading reads "▶ Notes example: w_E from 1 to 2", with a raw underscore instead of a subscript.

---

## Lecture 5: The firm and the market

### From Firms to Market Supply
- **[major] Confirmed.** "Zero fixed costs" preset: the price axis runs only to 2.5, but the equilibrium is p = 4.262, q = 34.10 (shown under Numbers). The demand curve and the equilibrium are invisible in all four panels. A stray "p′" label sits at the origin of the average-firm panel.

### Firms That Affect Each Other
- **[minor]** e = −0.8 (strong positive externality): q = 25 each and 50 in total, but the x-axes end at about 15 and 20. The equilibrium dots are off the plot and nothing says so.
- **[minor]** p = 0 (below the MC intercept c = 1, so nobody produces): the market supply slope is still given as "1.333, numerically 1.333" with a ✓, although supply is flat at 0 there.
- **[cosmetic]** p = 12 (slider maximum equals the y-axis maximum): the dots are cut in half at the top edge.

### Free Entry and Industry Size
- **[cosmetic] Confirmed.** Π(q_N) shows "−3.55×10^-15" or "4.44×10^-16" instead of 0.000 (M = 1, M = 40, a = 1).
- **[minor]** `render()`: if there is no equilibrium, it shows the sticky red banner and returns, so the old plots stay on screen (see 5).
- **[cosmetic]** a = 3: the "average cost" and "average revenue = p" labels overlap.
- Note: "Free entry" from N = 3 to N* = 80 (M = 40) takes about 20 s, at 260 ms per firm.

### Monopoly and Product Differentiation
- **[minor]** Constant-elasticity demand with η between −1.2 and −1.1: the optimum jumps to q* = 0.115, p* = 100. That is correct (MR = MC on the falling part of MC), but the figure shows a 1-pixel profit sliver on the axis, the "Π" label sits on the y-axis, and the y-axis up to 140 squashes everything else. The figure needs a sentence or a zoom.

---

## Lecture 5: Consumer preferences

### Budget Sets
- Nothing wrong found. With y = 0 the figure is empty, which is to be expected.

### Better, Worse, Indifferent
- **[cosmetic]** x° at x₁ = 10 or x₂ = 10: the x° label is cut off at the plot edge.

### Utility Is Ordinal
- **[minor]** V = −U: the right 3D surface falls away from the default camera, so it is almost entirely hidden behind its near edge and only a thin dark band shows. The camera is not adapted to a decreasing f.

---

## Lecture 6

### UMP and EMP: Two Sides of One Tangency
- **[major] Confirmed.** Stone–Geary with a = 0.28, γ₁ = 1.1, γ₂ = 4, p₁ = 0.3, p₂ = 1.25, y = 2. Here p·γ = 5.33 > y, so the consumer cannot afford subsistence. The page shows:
  - V(p,y) = −1.00×10³⁰⁰ and C(p,V) = 4.82×10⁻⁶¹ ≠ y, with a red ✗;
  - D = (2.41×10⁻¹⁵, 1.6), outside the domain of U;
  - the "indifference curve" as a flat line at x₂ = 4;
  - Roy's identity as "— = —", with a KaTeX warning;
  - a V plot with an axis of ±10³⁰⁰.

  The same can happen in EMP.

### Substitution and Income Effects (Slutsky)
- **[major] Confirmed.** Default settings, press **▶ Lower p₁ smoothly**: red banner "Could not draw the plot: x is not iterable / Could not draw the numbers: …" (see 1).
- **[major] Confirmed.** Choose "Giffen example" in the utility select, not the "Giffen good" button, keeping the default prices (p₁ 2 → 1, p₂ = 1, y = 10). The page shows:
  - no indifference curves;
  - E₂ to the left of E₁ after a price fall (substitution −1.767);
  - a Hicksian panel full of garbage, with an x-axis to 600 and broken dashed pieces;
  - red ✗ on both checks (−1.5 = −736.166 − 1.5, and −1 = −490.777 − …);
  - the heading "A normal good" and the line "Good 1 is normal, η₁ = 1.667".

  The "Giffen good" preset button works. With "Giffen example" and a larger income (e.g. y = 23), the table of effects shows NaN in every cell, because x₂ ≥ s = 4 lies outside the domain of U.
- **[major] Confirmed.** Stone–Geary with γ₁ = γ₂ = 3 and y = 5 (subsistence not affordable): substitution 0 / −5, income 0 / +5, a red ✗ on the elasticity identity, and "Good 1 is normal, η₁ = 1".

### Income Expansion Paths and Engel Curves
- Nothing wrong found. With a subsistence level, the income slider minimum moves up (e.g. to 18.50) without saying so.

---

## Lecture 7

### CV, EV and Consumer Surplus
- **[minor] Confirmed.** Price rise (p₁⁰ = 0.5 → p₁¹ = 1, or p₁¹ = 4): the last check shows a red ✗ for "CV ≤ ΔCS ≤ EV … (a price rise: the inequalities turn round)", although −3.726 ≤ −3.167 ≤ −2.714 holds. `app.js:94` reverses the signed inequality for a rise; only the absolute values turn round. The Giffen branch has the same logic.
- **[cosmetic]** Quasilinear: in the goods-space panel the red indifference curve v⁰ continues flat along the x₁ axis after it reaches x₂ = 0. That flat piece is not part of the indifference curve.

### The Deadweight Loss of a Tax
- **[major] Confirmed.** Quasilinear with κ = 1 and p₁⁰ = 2 (nobody buys good 1):
  - the x-axis runs from −1 to 1, showing negative x₁;
  - the "DWL" arrow points at nothing;
  - the yellow "T" label sits on the p-axis;
  - "DWL/T = —" and "ε = —" appear with "—" inside KaTeX;
  - the sentence says "|EV| = 0.000 > T = 0.000: the consumer loses more than the government collects".
- **[minor] Confirmed.** Quasilinear with κ = 3.5, p₁⁰ = 2.7, τ = 100 % (taxed demand is 0): T = 0, but the "T" label is still drawn on the axis. "Approximation 0.000 vs exact 0.108" gets a green ✓.
- **[minor]** The "Approximation" and "Per krone" rows always get a ✓ (`item(true, …)`), whatever the numbers.
- **[major] Confirmed.** Stone–Geary with γ₁ = 4, p₁⁰ = 3, y = 4 (subsistence not affordable): T = 4.13×10⁻¹⁶, |EV| = 3.73×10⁻⁶¹, DWL = −4.13×10⁻¹⁶, DWL/T = −1.000, and the approximations still get a ✓.

---

## Lecture 8

### Robinson Crusoe's Economy
- Nothing wrong found. The red ✗ in the non-convex examples are intended. With A = 1 the x-axis of the left figure starts at −2.

---

## Lecture 9

### The Edgeworth Box
- **[cosmetic]** "Second welfare theorem": the R and R′ labels overlap at the corner of the box.

### Excess Demand and Equilibrium (new)
- **[minor] Confirmed.** p₁/p₃ = 5 and p₂/p₃ = 5 (the slider maximum): the price plane only reaches about 2.1 × 3.1, so the orange point is off the plot and nothing says so. The sliders go to 5, but the view only to about 2.6·p*.
- Otherwise nothing wrong found: Walras' law and homogeneity hold at the extremes (ρ = −5, α = 0.95, β = 0.05), and "Go to an equilibrium" works.

### The Core Shrinks
- **[cosmetic] Confirmed.** s = 1: "θ must exceed 8.38 × 10⁻¹⁵". It should be 0 (see 3).
