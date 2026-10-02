# Lecture 2 visualizations — plan and cloud-session prompts

Lecture 2: *Theory of the firm — firm optimisation, one step and two step approach.*
Three tools, one per idea of the lecture, built on one shared, tested model:

| Folder | Title | Lecture idea | Colour (as in the notes) |
|---|---|---|---|
| `cost-minimisation/` | Cost Minimisation | Step 1 (CM): $\min_z w^t z$ s.t. $\phi(z)\ge q$ — substitution | blue |
| `cost-curves/` | Cost Curves and Supply | Step 2 (PM'): $\max_q pq - C(w,q)$ — scale | red, supply orange |
| `profit-two-ways/` | One Step vs Two Steps | (PM) gives the same answer as (CM)+(PM') | black / blue / red |

Detailed specs: `cost-minimisation/SPEC.md`, `cost-curves/SPEC.md`, `profit-two-ways/SPEC.md`.
Shared math: `shared/firm-model.js` (spec in section 3 below).

## 1. Order of work

1. **Session 1 — shared model + notation fix.** Must be merged before sessions 2–4 start.
2. **Sessions 2, 3, 4 — the three tools.** Independent; can run in parallel.
3. **Session 5 (small) — landing page cards** for the three tools, after 2–4 are merged.

To avoid merge conflicts, sessions 2–4 must **not** edit `index.html`, `shared/style.css` or `shared/firm-model.js`. Tool-specific CSS goes in `<tool>/style.css`. If a session believes the shared model has a bug, it reports it in the pull request description instead of changing it.

## 2. Notation (must match the lecture notes exactly)

| Object | Symbol | Where in the notes |
|---|---|---|
| inputs, input prices, output, output price | $z_1,z_2$; $w_1,w_2$; $q$; $p$ | L2 §1 |
| production function, marginal products | $\phi(z)$, $\phi_1,\phi_2$ | L1, L2 |
| marginal rate of technical substitution | $MRTS_{21}=\phi_1/\phi_2$; at an interior optimum $MRTS_{21}=w_1/w_2$ | L1 §5, L2 §1 and §3 |
| one step profit maximisation | (PM): $\max_z p\phi(z)-w^t z$ | L2 §1 |
| cost minimisation | (CM): $\min_z w^t z$ s.t. $\phi(z)\ge q$ | L2 §2–3 |
| conditional input demand | $H(w,q)$, components $H^1(w,q), H^2(w,q)$ (superscript = input, subscript = derivative) | L2 §3 |
| minimal cost function | $C(w,q)=w^t H(w,q)$ | L2 §3 |
| Lagrange multiplier of (CM) | $\lambda^\ast$; $\lambda^\ast=\partial C/\partial q$ | L2 §3, L3 |
| output optimisation | (PM'): $\max_{q\ge0} pq-C(w,q)$ | L2 §4 |
| marginal and average cost | $MC=C_q$, $AC=C/q$ | L2 §4 figure |
| shutdown price and output | $\hat p$ (= min AC), $\hat q$ | L2 §4 figure |
| supply, unconditional demand, profit | $S(w,p)$; $D(w,p)$, $D^1, D^2$; $\Pi(w,p)$ | L2 §1, §4 |
| link between the two approaches | $D^i(w,p)=H^i(w,S(w,p))$ | L2 §4 |
| unit cost, unit input requirement | $c(w)$, $\widetilde H^i(w)$ | L3 §"Homogenous production functions" |
| degree of homogeneity | $k$ (not $\nu$) | L1 §6, L3 |
| elasticity of scale | $e(z)$; at the cost-minimising bundle $e(H(w,q))=AC/MC$ | L1 §7, L3 exercise |
| elasticity of substitution | $\sigma=1/(1-\rho)$ for CES | L1, L2 exercise 4 |

Colours, as in the lecture 2 figures: Step 1 / (CM) / substitution **blue `#4a90e2`**; Step 2 / (PM') / scale **red `#d0021b`**; supply curve **orange `#f5a623`**; isocost "reducing cost" lines grey `#9b9b9b`.
Page eyebrow: "Lecture 2 · Theory of the firm" (no course code or university name on pages, as in the Production Explorer).

## 3. Shared model `shared/firm-model.js` (session 1)

UMD module like `production-explorer/model.js`: `window.FirmModel` in the browser, `module.exports` in Node. Pure math, no DOM.

### 3.1 State object
`s = {tech, delta, rho, profile, A, k, a, m}`
- `tech`: `'cobb' | 'ces' | 'linear' | 'leontief'`; `delta` ∈ [0.1, 0.9]; `rho` ∈ [−5, 0.9] (CES only).
- `profile`: `'homog'` (homogeneous of degree `k`, productivity `A`) or `'ushape'` (U-shaped average cost, parameters `a`, `m`).

### 3.2 Technology: homothetic, $\phi(z)=F(g(z))$
$g$ is the degree-one aggregator, identical to the Production Explorer:
- Cobb-Douglas $g=z_1^{\delta}z_2^{1-\delta}$; CES $g=[\delta z_1^{\rho}+(1-\delta)z_2^{\rho}]^{1/\rho}$ ($|\rho|<10^{-6}$ → Cobb-Douglas); linear $g=\delta z_1+(1-\delta)z_2$; Leontief $g=\min\{z_1/\delta,\ z_2/(1-\delta)\}$.

$G(q)=F^{-1}(q)$ is the amount of $g$ needed to produce $q$ (strictly increasing, $G(0)=0$):
- `'homog'`: $G(q)=(q/A)^{1/k}$, i.e. $\phi=A\,g^k$, homogeneous of degree $k$. Ranges $A\in[0.5,3]$, $k\in[0.3,1.6]$.
- `'ushape'`: $G(q)=\tfrac13 q^3-a q^2+b q$ with $b=a^2+m$, so $G'(q)=(q-a)^2+m>0$. Ranges $a\in[0.5,3]$ (default 2), $m\in[0.2,3]$ (default 1). $F=G^{-1}$ by bisection (bracket by doubling). Increasing returns for small $q$, decreasing for large $q$.

Separating $g$ (shape of the isoquants) from $G$ (spacing of the isoquants) is the whole point: **(CM) only uses $g$ (substitution), (PM') only uses $G$ (scale).**

### 3.3 Cost side (closed forms; $\sigma=1/(1-\rho)$)
$C(w,q)=c(w)\,G(q)$, $H^i(w,q)=\widetilde H^i(w)\,G(q)$, $MC=c(w)G'(q)=\lambda^\ast$, $AC=c(w)G(q)/q$, $e(H(w,q))=G(q)/(qG'(q))=AC/MC$.

| tech | $c(w)$ | $\widetilde H^1(w)$, $\widetilde H^2(w)$ | solution type |
|---|---|---|---|
| cobb | $(w_1/\delta)^{\delta}\,(w_2/(1-\delta))^{1-\delta}$ | $\delta c/w_1$, $(1-\delta)c/w_2$ | interior |
| ces | $[\delta^{\sigma}w_1^{1-\sigma}+(1-\delta)^{\sigma}w_2^{1-\sigma}]^{1/(1-\sigma)}$ | $(\delta c/w_1)^{\sigma}$, $((1-\delta)c/w_2)^{\sigma}$ | interior |
| linear | $\min\{w_1/\delta,\ w_2/(1-\delta)\}$ | $(1/\delta,0)$ if $w_1/\delta<w_2/(1-\delta)$; $(0,1/(1-\delta))$ if $>$; tie: every point of the segment | corner / multiple |
| leontief | $\delta w_1+(1-\delta)w_2$ | $\delta$, $1-\delta$ | kink |

(These match lecture 2 exercise 1 with $a_1=\delta$, $a_2=1-\delta$, and exercise 4 up to the constant factor $2^{1/\rho}$ when $\delta=\tfrac12$.)

### 3.4 Output side: supply $S(w,p)$
- `'homog'`, $k<1$: from $MC(q)=\dfrac{c}{kA^{1/k}}q^{1/k-1}=p$ we get $S=\left(\dfrac{p\,k\,A^{1/k}}{c}\right)^{k/(1-k)}$; $AC=k\cdot MC<MC$, so $\hat p=0$; kind `'interior'`.
- `'homog'`, $k=1$ ($|k-1|<10^{-9}$): $MC=AC=c/A$. $p<c/A$: $S=0$ (kind `'zero'`); $p=c/A$: any $q\ge0$ (kind `'indeterminate'`); $p>c/A$: profit unbounded (kind `'unbounded'`).
- `'homog'`, $k>1$: $C_{qq}<0$, profit $\to\infty$ as $q\to\infty$ for every $p>0$ (kind `'unbounded'`). This is lecture 1's "not meaningful" case ($a>1$ with constant prices).
- `'ushape'`: $\hat q=3a/2$, $\hat p=c\,(b-3a^2/4)$ (= min AC = MC at $\hat q$). $p<\hat p$: $S=0$ (`'zero'`); $p=\hat p$: $0$ and $\hat q$ both optimal (`'indifferent'`); $p>\hat p$: $S=a+\sqrt{a^2-b+p/c}$ (`'interior'`).
- $\Pi(w,p)=pS-C(w,S)$; $D^i(w,p)=\widetilde H^i(w)\,G(S(w,p))$.

### 3.5 API (all prices passed as `w = [w1, w2]`)
`g(z1,z2,s)`, `phi(z1,z2,s)`, `G(q,s)`, `Gprime(q,s)`, `F(x,s)`, `mrts(z1,z2,s)` (number, `Infinity`, `0`, or `null` at a kink — same convention as the Production Explorer), `isoquant(q,s,zmax)` (points inside the box, exact edge crossings), `unitCost(w,s)`, `unitDemand(w,s)` → `{h:[h1,h2], kind}`, `condDemand(w,q,s)` → `{H:[H1,H2], kind}`, `cost(w,q,s)`, `MC(w,q,s)`, `AC(w,q,s)`, `scaleElasticity(q,s)`, `minAC(w,s)` → `{pHat,qHat}`, `supply(w,p,s)` → `{q, kind}`, `profit(w,p,s)`, `uncondDemand(w,p,s)` → `[D1,D2]`, `profitAt(z1,z2,w,p,s)` = $p\phi(z)-w^tz$.

### 3.6 Tests `shared/test-firm-model.cjs` (all must pass; check every tech × several δ, ρ, both profiles)
1. `unitCost` equals a brute-force minimum of $w^tz$ over ≥ 20 000 points of the unit isoquant $g(z)=1$ (rel. tol. 1e-4).
2. $g(\widetilde H(w))=1$ and $w^t\widetilde H(w)=c(w)$.
3. Shephard's lemma: finite-difference $\partial c/\partial w_i=\widetilde H^i$ (cobb, ces).
4. Interior solutions: $MRTS_{21}(H(w,q))=w_1/w_2$.
5. $C$ homogeneous of degree 1 in $w$; $H$ homogeneous of degree 0 in $w$; $c$ concave in $w$ (midpoint inequality).
6. $G(F(x))=x$; $\phi(H(w,q))=q$; $MC$ = finite difference of $C$ in $q$; `'homog'`: $AC/MC=k$.
7. Supply equals a brute-force maximiser of $pq-C(w,q)$ on a fine grid of $q$ (when bounded); kinds correct for $k=1$, $k>1$, $p<\hat p$, $p=\hat p$.
8. **One step = two steps:** brute-force maximisation of $p\phi(z)-w^tz$ over a grid in $(z_1,z_2)$, refined locally, matches $D(w,p)$ and $\Pi(w,p)$ (cobb, ces; `'homog'` with $k<1$ and `'ushape'`).
9. Lecture exercises: exercise 1 cost forms (Leontief, linear); exercise 4 formula $C=q[w_1^{1-\sigma}+w_2^{1-\sigma}]^{1/(1-\sigma)}$ equals our CES unit cost with $\delta=\tfrac12$ divided by $2^{1/\rho}$.

### 3.7 Also in session 1: rename ν → k
In `production-explorer/` (model, app, page, SPEC, tests) and in `CLAUDE.md`, rename the returns-to-scale parameter from $\nu$ to $k$ ("degree of homogeneity $k$"), to match lectures 1 and 3. Behaviour unchanged; tests still pass. In `CLAUDE.md`, add `shared/firm-model.js` to the layout, explain that tools for lectures 2+ use it, and add the notation table of section 2 above.

## 4. Prompts to paste into cloud sessions

Before starting, commit and push this `plans/` folder and the three `SPEC.md` files (GitHub Desktop → Commit → Push origin).

**Session 1**
> Read CLAUDE.md and plans/lecture-2.md. Do section 3 of the plan: create shared/firm-model.js and shared/test-firm-model.cjs exactly as specified (all tests must pass), and rename ν to k in production-explorer and CLAUDE.md (section 3.7) without changing behaviour; run `node production-explorer/test-model.cjs` too. Do not build any user interface. Open a pull request.

**Session 2** (after session 1 is merged)
> Read CLAUDE.md, plans/lecture-2.md and cost-minimisation/SPEC.md. Build the Cost Minimisation tool in cost-minimisation/ exactly as specified, using shared/firm-model.js (do not modify it, index.html or shared/style.css). Run all tests, check the page loads without console errors at desktop and 375 px width, then open a pull request.

**Session 3** (after session 1 is merged)
> Read CLAUDE.md, plans/lecture-2.md and cost-curves/SPEC.md. Build the Cost Curves and Supply tool in cost-curves/ exactly as specified, using shared/firm-model.js (do not modify it, index.html or shared/style.css). Run all tests, check the page loads without console errors at desktop and 375 px width, then open a pull request.

**Session 4** (after session 1 is merged)
> Read CLAUDE.md, plans/lecture-2.md and profit-two-ways/SPEC.md. Build the One Step vs Two Steps tool in profit-two-ways/ exactly as specified, using shared/firm-model.js (do not modify it, index.html or shared/style.css). Run all tests, check the page loads without console errors at desktop and 375 px width, then open a pull request.

**Session 5** (after 2–4 are merged)
> Read CLAUDE.md and plans/lecture-2.md. Add three cards to index.html for cost-minimisation/, cost-curves/ and profit-two-ways/ ("Lecture 2: …"), matching the existing Production Explorer card, and check every link works. Open a pull request.

## 5. Review checklist (for you, before merging each pull request)
- Symbols on the page match section 2 (in particular $H^i$, $D^i$, $C(w,q)$, $S(w,p)$, $MC=C_q$, $k$).
- Blue = Step 1 / substitution, red = Step 2 / scale, orange = supply.
- Default view reproduces the numbers listed under "Defaults" in the tool's SPEC.
- Works on a phone.
