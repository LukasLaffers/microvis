# Substitution or Composition? — specification

Lecture 4, Empirical Application, "Variation over time and companies" (Arnberg and Bjørner 2007). Read CLAUDE.md and `plans/lecture-4.md` first. Self-contained math in `substitution-or-composition/model.js` (no shared firm model needed).

**Teaching goal.** Two firms that **cannot substitute at all** (Leontief) can still make the *aggregate* data look as if energy was substituted by capital when energy becomes more expensive — because output shifts from the energy-intensive firm to the capital-intensive firm. An econometrician using aggregate data would estimate a positive elasticity of substitution that does not exist inside any firm. This is why the study uses intra-firm (panel) variation.

## Model (`model.js`, tested)
Inputs: energy $E$ and capital $K$ (as in the notes). Prices $w_E$, $w_K$.
- Energy-intensive firm: $\phi^E(E,K)=\min\{E/2,\ K\}$, uses $(2q_E,\ q_E)$, unit cost $c^E=2w_E+w_K$.
- Capital-intensive firm: $\phi^K(E,K)=\min\{E,\ K/2\}$, uses $(q_K,\ 2q_K)$, unit cost $c^K=w_E+2w_K$.
- Competitive, constant returns: each firm's product sells at its unit cost. Consumers split a fixed total $Q=20$ between the two (close substitute) products: $q_E=Q\,\dfrac{(c^E)^{-\theta}}{(c^E)^{-\theta}+(c^K)^{-\theta}}$, $q_K=Q-q_E$, with $\theta>0$ the substitutability of the two products for consumers.
- Aggregates $E=2q_E+q_K$, $K=q_E+2q_K$.
- "Apparent" (aggregate) elasticity of substitution: $\hat\sigma=\dfrac{\mathrm{d}\log(K/E)}{\mathrm{d}\log(w_E/w_K)}$ by finite differences; within each firm $\sigma=0$.
- Tests: (i) the notes' numbers (below) exactly; (ii) each firm's input ratio never changes; (iii) $\hat\sigma>0$ for $\theta>0$ and $\hat\sigma=0$ for $\theta=0$; (iv) $\hat\sigma$ matches a log-log regression slope over a grid of price ratios (small range).

## Header
Eyebrow "Lecture 4 · Theory of the firm", title "Substitution or Composition?", subtitle "Why Arnberg and Bjørner (2007) use variation within firms". Back link.

## Controls
1. **How to read this** (open): 4 sentences matching the teaching goal.
2. Energy price $w_E$ (0.5–3, default 1) with capital price $w_K=1$ fixed; button **Notes example** sets $w_E$: 1 → 2 with $\theta=\ln3/\ln(5/4)\approx4.923$ and animates.
3. Consumers' substitutability $\theta$ (0–8, default 4.923).
4. Toggle "show what an econometrician sees" (panel 3).

## Panel 1 (main): input space $(E, K)$, axes "Energy $E$", "Capital $K$", range 0–40
- Each firm: its L-shaped isoquant through its current bundle (thin), its fixed ray (dotted: slope 1/2 for the energy-intensive firm, 2 for the capital-intensive firm), its bundle as a dot (energy-intensive orange, capital-intensive purple). Arrows show the bundles sliding **along their own rays** when $w_E$ changes — no substitution inside a firm.
- Aggregate bundle $(E,K)$ as a black dot, constructed as the vector sum (draw the parallelogram faintly). Its ray from the origin rotates: that rotation is the apparent substitution. Label "aggregate: looks like substitution".

## Panel 2: "Who produces?"
Stacked bar of $q_E$ and $q_K$ (total 20), updating live, plus the unit costs $c^E$, $c^K$.

## Panel 3: "What an econometrician sees" (toggle)
Scatter of $\log(K/E)$ against $\log(w_E/w_K)$ for a range of $w_E$ (aggregate data), with the fitted line and its slope $\hat\sigma$; next to it the same plot for each firm separately: two flat lines (slope 0 = true $\sigma$). Caption: "Aggregate data: $\hat\sigma>0$. Within each firm: $\sigma=0$."

## Defaults and expected numbers (the notes' example)
$w_E=w_K=1$: $c^E=c^K=3$, $q_E=q_K=10$; energy-intensive firm $(20,10)$, capital-intensive firm $(10,20)$; aggregate $E=30$, $K=30$.
$w_E=2$ (with $\theta\approx4.923$): $c^E=5$, $c^K=4$, $q_E=5$, $q_K=15$; firms $(10,5)$ and $(15,30)$; aggregate $E=25$, $K=35$ — exactly the numbers in the notes.

## Done when
The notes' numbers are reproduced exactly; firm bundles stay on their rays while the aggregate ray rotates; $\hat\sigma$ shown and tested; no console errors; works at 375 px.
