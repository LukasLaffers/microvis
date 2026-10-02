# Cost Curves and Supply — specification

Lecture 2, Step 2 (PM'). Read `plans/lecture-2.md` first: notation (section 2), colours, and the shared model `shared/firm-model.js` (section 3), which this tool must use for all math.

**Teaching goal.** Given the minimal cost function $C(w,q)$ from Step 1, the firm chooses output by $\max_{q\ge0}pq-C(w,q)$ (PM'). An interior optimum needs $p=MC(w,q^\ast)$ and $C_{qq}\ge0$, and producing must beat the outside option, $p\ge AC(w,q^\ast)$. So the supply curve $S(w,p)$ is the part of the $MC$ curve above minimum $AC$, plus zero output below $\hat p$. This is the **scale** part of profit maximisation (red in the notes). It reproduces and animates the lecture 2 figure "If the price is lower than $\hat p$, it is optimal to not produce anything…", and shows why increasing returns to scale are incompatible with price taking.

## Files
`cost-curves/index.html`, `app.js`, `style.css` (tool-specific only). Load `../shared/firm-model.js` and the vendored libraries with relative paths (see CLAUDE.md).

## Header
Eyebrow "Lecture 2 · Theory of the firm", title "Cost Curves and Supply", subtitle in KaTeX: $\max_{q\ge0}\ pq-C(w,q)$ (PM'). Back link.

## Controls
1. **How to read this** (open by default), 4 sentences: the red curve is marginal cost $MC=C_q$, the black curve average cost $AC=C/q$; for a price $p$ the firm produces where $p=MC$ on the rising part of $MC$; it produces only if $p\ge AC$, otherwise it shuts down; the orange curve is therefore the supply curve $S(w,p)$.
2. **Returns to scale** (segmented control, default "U-shaped average cost"):
   - *U-shaped average cost* (`profile:'ushape'`): sliders $a$ (0.5–3, default 2) "where returns to scale turn from increasing to decreasing", $m$ (0.2–3, default 1).
   - *Homogeneous of degree k* (`profile:'homog'`): sliders $k$ (0.3–1.6, step 0.05, default 0.6), $A$ (0.5–3, default 1). Badge: decreasing / constant / increasing returns to scale.
3. **Output price** $p$: slider + number (0 to $p_{\max}$, default 8; $p_{\max}$ = 20 for 'ushape', $3\,MC$ at $q_{\max}/2$ for 'homog').
4. **Input prices and technology** (collapsed by default, titled "Input prices and technology — only shift the curves up or down"): $w_1,w_2$ (0.2–5, default 1, 1), technology select and $\delta,\rho$ (defaults Cobb-Douglas, 0.5, −0.5). Show $c(w)$ = unit cost. Note under it: "These only change $c(w)$ in $C(w,q)=c(w)\,G(q)$: all cost curves are stretched vertically by the same factor. The shape of the curves comes from returns to scale."
5. **Plot range**: $q_{\max}$ (default 6).

## Main plot: "Marginal and average cost" (Plotly 2D) — axes $q$ (x), $p$ (y)
- $MC=C_q$: red `#d0021b`, width 2.5, label "$MC=C_q$".
- $AC=C/q$: black, width 2, label "$AC=C/q$".
- Supply curve $S(w,p)$: orange `#f5a623`, width 5, drawn under the other curves: vertical segment on the $p$-axis from 0 to $\hat p$, then $MC$ from $(\hat q,\hat p)$ upwards (for 'homog', $k<1$: the whole $MC$ curve from the origin). Orange dot at $(\hat q,\hat p)$; labels $\hat p$, $\hat q$ on the axes with dashed guides (as in the lecture figure).
- Price line: horizontal dashed line at $p$, label "$p$".
- Optimum $(q^\ast, p)$ with $q^\ast=S(w,p)$: dot; dotted drop line to the $q$ axis labelled $q^\ast=S(w,p)$.
- Profit rectangle: from $AC(q^\ast)$ to $p$, width $q^\ast$, translucent green when $\Pi>0$; legend "profit $\Pi(w,p)$".
- Grey annotation where $MC$ is rising but below $AC$: "this part of the MC curve is not observed" (as in the lecture figure).
- Special cases (show a boxed message in the plot):
  - $k=1$: $MC=AC=c(w)/A$ flat. $p<$: "Price below unit cost: produce nothing." $p=$: "Any output is optimal (zero profit)." $p>$: "Profit grows without limit: no optimal output."
  - $k>1$: "Increasing returns to scale: $MC$ is falling and lies below $AC$. Profit grows without limit for any price, so there is no optimal output under price taking (compare lecture 1: $a>1$ is not meaningful)." Do not draw an optimum or supply curve.
  - $p=\hat p$ ('ushape'): "Indifferent between $q=0$ and $q=\hat q$ (zero profit)."

## Side plot 1: "Revenue and cost" — axes $q$, value
Revenue $pq$ (dashed black line), total cost $C(w,q)$ (red), vertical double arrow at $q^\ast$ showing the largest gap = $\Pi(w,p)$. When $p<\hat p$ the cost curve lies above revenue everywhere (except at 0).

## Side plot 2: "Profit" — axes $q$, $pq-C(w,q)$
Red curve, maximum marked at $q^\ast$, horizontal line at 0 (outside option). For $k>1$ the curve keeps rising: annotate "unbounded".

## Readouts (live, KaTeX)
| Readout | Notes |
|---|---|
| $q^\ast=S(w,p)$ | or "0 (shut down)", "any", "none (unbounded)" |
| $MC(w,q^\ast)$, $AC(w,q^\ast)$ | |
| $\Pi(w,p)$ | |
| $\hat p$, $\hat q$ | 'ushape': exact values; 'homog' $k<1$: $\hat p=0$ |
| $C_{qq}(w,q^\ast)\ge0$? | check mark or cross (second order condition) |
| $e(H(w,q^\ast))=AC/MC$ | with label increasing / constant / decreasing returns to scale at $q^\ast$ |

Below the readouts one sentence that updates: e.g. "At $q^\ast$ the elasticity of scale is 0.79 < 1: decreasing returns to scale, as the second order condition and $p\ge AC$ require."

## Defaults and expected numbers ('ushape', $a=2$, $m=1$, Cobb-Douglas $\delta=0.5$, $w=(1,1)$, $p=8$)
$c(w)=2$, $\hat q=3$, $\hat p=4$, $q^\ast=2+\sqrt3\approx3.732$, $C(w,q^\ast)\approx16.26$, $\Pi\approx13.59$, $AC(q^\ast)\approx4.357$, $MC(q^\ast)=8$, $e\approx0.545$.
Check with 'homog', $k=0.6$, $A=1.5$, Cobb-Douglas $\delta=0.5$, $w=(1,1)$ (so $c(w)=2$), $p=5$: $q^\ast\approx5.0625$.

## Done when
- Moving $p$ traces the orange supply curve; below $\hat p$ the optimum jumps to 0.
- Changing $w$, technology, $\delta$, $\rho$ only stretches the curves vertically; changing the returns-to-scale profile changes their shape.
- All special cases show their message; no console errors; works at 375 px width; numbers above reproduced.
