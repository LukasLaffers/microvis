# Production Explorer — specification

Lecture: ECO401 Lecture 1, *Production theory: substitution and scale properties*.
Goal: let students see the difference between **substitution** (walking along a contour line of the production "hill") and **scale** (walking straight up the hill along a ray from the origin).

## Status

- `model.js` — done and tested (`node production-explorer/test-model.cjs`, ~750k checks pass).
- `index.html`, `app.js`, `shared/style.css`, root `index.html` — **to build**.

## Model (already in `model.js`)

Every technology is $\phi(z) = A\, g(z)^{\nu}$ with $g$ homogeneous of degree one, so $\phi$ is homogeneous of degree $\nu$:

| Technology | $g(z_1,z_2)$ | $\sigma$ |
|---|---|---|
| Cobb-Douglas (`cobb`) | $z_1^{\delta} z_2^{1-\delta}$ | 1 |
| CES (`ces`) | $[\delta z_1^{\rho} + (1-\delta) z_2^{\rho}]^{1/\rho}$ | $1/(1-\rho)$ |
| Linear (`linear`) | $\delta z_1 + (1-\delta) z_2$ | $\infty$ |
| Leontief (`leontief`) | $\min\{z_1/\delta,\ z_2/(1-\delta)\}$ | 0 |

Parameters: `A` (0.5–3, default 1), `delta` (0.1–0.9, default 0.5), `rho` (CES only, −5 to 0.9, default −0.5), `nu` (0.4–1.6, step 0.05, default 1).
Key teaching facts the UI should make visible:
- $MRTS_{21} = g_1/g_2$ does **not** depend on $A$ or $\nu$: scale does not change substitution.
- $e(z) = \nu$ everywhere; $\nu<1,=1,>1$ ⇔ decreasing, constant, increasing returns to scale.
- For Cobb-Douglas show the exponents as $\alpha = \delta\nu$, $\beta = (1-\delta)\nu$ (the lecture writes $A z_1^\alpha z_2^\beta$, and $e = \alpha+\beta$).

API: `g, output, gLevel, pointOnIsoquant(q, r, s), kinkMix(s), isoquant(q, s, zmax), mrts(z1, z2, s)` (number, `Infinity`, `0`, or `null` at the Leontief kink), `sigma(s), scaleElasticity(s), returnsLabel(nu)`. State object `s = {tech, A, delta, rho, nu}`.

## Page layout

Header: eyebrow "ECO401 · Lecture 1 · Theory of the firm", title "Production Explorer", a link back to the Microvis index.

Three areas (desktop): controls on the left, 3D plot in the middle, two stacked 2D panels + readouts on the right. On a phone everything stacks.

### Controls
1. **Technology**: select + formula rendered with KaTeX, with current numbers substituted.
2. **Parameters**: sliders with numeric inputs for $A$, $\delta$, $\rho$ (CES only), $\nu$. Next to $\nu$ a badge: "decreasing / constant / increasing returns to scale".
3. **Mode** toggle: **Substitution** | **Scale**.
4. Mode controls:
   - Substitution: output level $\bar q$ (default 2); input mix $z_2/z_1$ on a log slider from 0.1 to 10 (default 1) that moves the point $\bar z$ along the isoquant.
   - Scale: input mix $z_2/z_1$ (the ray, log slider 0.1–10); scale factor $\lambda$ (0.25–3, default 1). Base bundle $\bar z$ = point on the ray with $\phi(\bar z)=1$; the moving point is $\lambda\bar z$.
5. Layers: surface on/off, surface opacity, contour lines on surface on/off.
6. Plot range: $z_{\max}$ (default 6).

### 3D plot (Plotly surface, ~60×60 grid)
- Surface $\phi(z_1,z_2)$ on $[0,z_{\max}]^2$ — "the hill".
- Substitution mode: translucent horizontal plane at $\bar q$; the isoquant drawn on the surface at height $\bar q$ and its dashed projection on the floor; marker at $\bar z$; short tangent segment at height $\bar q$.
- Scale mode: translucent vertical plane through the ray; the curve $\phi$ along the ray drawn on the surface; isoquants $q = 1,2,3,4,5$ drawn on the surface at their heights; marker at $\lambda \bar z$ and at $\bar z$.
- Camera buttons: 3D / Top / Front / Side, reset view. Keep the camera when parameters change (`uirevision`).

### 2D panel A: input space $(z_1, z_2)$
- Substitution: the isoquant $\bar q$, point $\bar z$, tangent line with slope $-MRTS_{21}$ (vertical at MRTS = ∞, horizontal at 0, none at the kink); faint ray through $\bar z$.
- Scale: isoquants $q = 1,\dots,5$ labelled; the ray; dots where the ray crosses each isoquant (at $\lambda_k = k^{1/\nu}$, so they are evenly spaced under CRS, spread out under DRS, bunched under IRS); current point $\lambda\bar z$.

### 2D panel B
- Substitution: "How the input mix responds to the MRTS" — log–log plot of $z_2/z_1$ (y) against $MRTS_{21}$ (x) for mixes 0.1–10 along the isoquant. Slope = $\sigma$. Linear: vertical line; Leontief: horizontal line at the kink mix. Mark the current point.
- Scale: output along the ray, $\phi(\lambda\bar z) = \lambda^{\nu}$ against $\lambda$, with the dashed CRS reference line $q=\lambda$. Mark the current $\lambda$.

### Readouts (live)
- Substitution: $\bar z = (z_1, z_2)$, $\bar q$, $MRTS_{21}$ (∞ / 0 / "undefined at the kink"), $\sigma$, $z_2/z_1$.
- Scale: $\lambda$, inputs ×$\lambda$, output ×$\lambda^\nu$, elasticity of scale $e = \nu$, returns-to-scale label. One sentence such as "Doubling all inputs multiplies output by 2^ν = 1.74."

### "How to read this" (collapsible)
Three or four sentences connecting to the lecture: contour lines = isoquants; substitution = moving along one; scale = moving along a ray; MRTS is the slope; σ measures curvature; ν is the elasticity of scale.

## Root `index.html`
Title "Microvis — Visualizations for Microeconomic theory", one card for Production Explorer ("Lecture 1: scale and substitution properties of production functions") linking to `production-explorer/`.

## Done when
- Tests pass; page loads with no console errors; all four technologies and both modes work; $\nu$ slider visibly changes isoquant spacing in Scale mode but not the MRTS in Substitution mode; works at 375 px width.
