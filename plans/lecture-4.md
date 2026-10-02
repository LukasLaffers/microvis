# Lecture 4 visualizations — plan and cloud-session prompts

Lecture 4: *Comparative statics.* Content: $\mathrm{d}q^\ast/\mathrm{d}p=1/C_{qq}$ and $\mathrm{d}q^\ast/\mathrm{d}w_i=-(1/C_{qq})\,\partial H^i/\partial q$ (∗); the decomposition (∗∗) of $\partial D^i/\partial w_i$ into a substitution effect and a scale effect $-(1/C_{qq})(\partial H^i/\partial q)^2$; the area to the left of the conditional demand curve as a change in cost; Marshall's law of derived demand; the translog cost function and the Arnberg–Bjørner (2007) application, including the two-firm Leontief example showing why intra-firm (panel) data matter.

| Folder | Title | Type | Lecture idea |
|---|---|---|---|
| `marshall-law/` | Marshall's Law of Derived Demand | new | $(-\varepsilon^u_{11})=\sigma(1-sh_1)+(-\varepsilon^D_p)\,sh_1$ as a weighted average |
| `substitution-or-composition/` | Substitution or Composition? | new | two Leontief firms: no substitution inside firms, apparent substitution in the aggregate |
| `substitution-scale-effects/` | (extension) | extend | lecture 4 formulas (∗), (∗∗): the scale effect $=-(1/C_{qq})(\partial H^1/\partial q)^2$; output response as "shift ÷ slope" |
| `cost-function/` | (extension) | extend | area left of $H^1(w,q)$ between two prices $=$ change in cost |
| `translog-lab/` | Translog Elasticities | optional, later | elasticities $\varepsilon^c_{ij}$, $\sigma_{ij}$ from the estimated $\beta_{ij}$ |

Specs: `marshall-law/SPEC.md`, `substitution-or-composition/SPEC.md`; extensions and the optional tool in sections 3–4 below.

## 1. Order of work
All sessions independent; run in parallel. New-tool sessions must not edit `index.html`, `shared/*` or other tools; extension sessions edit only their tool. One small final session adds the two cards to `index.html`.

## 2. Notation (in addition to CLAUDE.md)

| Object | Symbol in the notes | Note |
|---|---|---|
| second derivative of cost in $q$ | $C_{qq}$ | assumed $>0$ (SOSC) |
| output response | $\dfrac{\mathrm{d}q^\ast}{\mathrm{d}p}=\dfrac1{C_{qq}}$, $\dfrac{\mathrm{d}q^\ast}{\mathrm{d}w_i}=-\dfrac1{C_{qq}}\dfrac{\partial H^i}{\partial q}$ | (∗) |
| decomposition | $\dfrac{\partial D^i}{\partial w_i}=\color{blue}{\dfrac{\partial H^i}{\partial w_i}}+\color{red}{\left(-\dfrac1{C_{qq}}\right)\left(\dfrac{\partial H^i}{\partial q}\right)^2}$ | (∗∗), blue/red as in the notes |
| industry (market) demand for the product | $Dem(p)$ | not $D$: $D^i$ is unconditional input demand |
| price elasticity of $Dem$ | $\varepsilon^D_p=\dfrac{\partial Dem}{\partial p}\dfrac{p}{Dem}$ | |
| conditional / unconditional own-price elasticity of input demand | $\varepsilon^c_{ii}$, $\varepsilon^u_{ii}$ | |
| cost share of input $i$ | $sh_i=w_i\widetilde H^i/c(w)$ | |
| inputs and technologies in the Arnberg–Bjørner example | $E$ energy, $K$ capital; $\phi^E(E,K)=\min\{E/2,K\}$, $\phi^K(E,K)=\min\{E,K/2\}$ | as in the notes |
| translog | $\log c=\alpha_0+\sum_i\alpha_i\log w_i+\tfrac12\sum_i\sum_j\beta_{ij}\log w_i\log w_j$ | |

Do not build anything that solves the lecture 4 exercise (convexity of $\Pi$ in $p$).

## 3. Extensions

**3.1 `substitution-scale-effects/` (lecture 3 tool) — add a "Lecture 4: comparative statics" panel**
- Under the existing "Why output falls" plot, show the marginal version of (∗): the $MC$ curve shifts up by $\dfrac{\partial MC}{\partial w_1}=\dfrac{\partial H^1}{\partial q}$ per unit of $w_1$ (Shephard's lemma), and output falls by *shift ÷ slope of MC*: $\dfrac{\mathrm{d}q^\ast}{\mathrm{d}w_1}=-\dfrac{\partial H^1/\partial q}{C_{qq}}$. Draw a small right triangle at $q^\ast$: vertical side = shift (red), slope = $C_{qq}$, horizontal side = $\mathrm{d}q^\ast$.
- In the readout table (marginal version) add the closed form (∗∗): scale effect $=-(1/C_{qq})(\partial H^1/\partial q)^2$, and check it equals the finite-difference scale effect already shown. Defaults (Cobb-Douglas $\delta=0.5$, 'ushape' $a=2,m=1$, $w=(1,1)$, $p=8$): $\partial H^1/\partial q=4$, $C_{qq}=c\,G''(q^\ast)=2\cdot2\sqrt3\approx6.928$, scale effect $=-16/6.928\approx-2.309$ ✓.
- Eyebrow becomes "Lecture 3 · Lecture 4 · Theory of the firm".

**3.2 `cost-function/` (lecture 3 tool) — add "Area = change in cost" panel** (lecture 4 figure, Cowell 2.14)
- Plot $H^1(w_1,\bar w_2,q)$ against $w_1$ (blue). Two price markers $w_1^\ast$ (= $\bar w_1$) and $w_1^o$ (draggable, default $0.5\,\bar w_1$). Shade the area to the left of the curve between them.
- Readouts: $\int_{w_1^{*}}^{w_1^{o}}H^1(w_1,\bar w_2,q)\,\mathrm{d}w_1$ (numerical integral) and $C(w_1^o,\bar w_2,q)-C(w_1^\ast,\bar w_2,q)$ — equal (✓). Caption from the notes: "Because $H^1(w,q)=\partial C(w,q)/\partial w_1$, the shaded area … reflects the change in cost that the price fall in $w_1$ induces."
- Test: integral equals the cost difference (all technologies; linear: integrate across the kink).
- Eyebrow "Lecture 3 · Lecture 4 · Theory of the firm".

## 4. Optional later: `translog-lab/`
Four inputs (1 electricity, 2 other energy, 3 labour, 4 machines) with the $\beta_{ij}$ from the notes' table. User sets the cost shares $sh_i$ (sliders, kept summing to 1) and sees the matrix of $\varepsilon^c_{ij}=(\beta_{ij}+sh_ish_j)/sh_i$ ($i\ne j$), $\varepsilon^c_{ii}=(\beta_{ii}-sh_i+sh_i^2)/sh_i$ and $\sigma_{ij}=(\beta_{ij}+sh_ish_j)/(sh_ish_j)$ as a heat map (red = complements, blue = substitutes, as in the notes' table), plus the restriction checks (rows of $\beta$ sum to 0, symmetry, own-price elasticities negative). **Caveat:** the notes' table of elasticities uses the paper's sample-mean cost shares, which are not in the notes (the $\alpha_i$ are means of firm fixed effects, not mean shares), so this tool cannot reproduce that table without the shares from the paper. Write its SPEC only once those shares are available.

## 5. Prompts for cloud sessions
First commit and push `plans/lecture-4.md` and the two `SPEC.md` files.

**Session 1**
> Read CLAUDE.md, plans/lecture-4.md and marshall-law/SPEC.md. Build the tool in marshall-law/ exactly as specified, using shared/firm-model.js for firm math (do not modify shared/, index.html or other tools); tool math in marshall-law/model.js with its own Node test. Run all tests, check the page at desktop and 375 px width with no console errors, then open a pull request.

**Session 2**
> Read CLAUDE.md, plans/lecture-4.md and substitution-or-composition/SPEC.md. Build the tool in substitution-or-composition/ exactly as specified (its math is self-contained in its own model.js with a Node test; do not modify shared/, index.html or other tools). Run all tests, check the page at desktop and 375 px width with no console errors, then open a pull request.

**Session 3**
> Read CLAUDE.md and plans/lecture-4.md, section 3.1. Make exactly that extension in substitution-scale-effects/ and nothing else; add tests for the new numbers. Run all tests, check the page, open a pull request.

**Session 4**
> Read CLAUDE.md and plans/lecture-4.md, section 3.2. Make exactly that extension in cost-function/ and nothing else; add the integral test. Run all tests, check the page, open a pull request.

**Session 5** (after 1–2 are merged)
> Read CLAUDE.md and plans/lecture-4.md. Add cards for marshall-law/ and substitution-or-composition/ to index.html ("Lecture 4: …"), matching the existing cards; check every link. Open a pull request.

## 6. Review checklist
- $Dem(p)$ for product demand, $D^i$ for input demand; $\varepsilon^u$, $\varepsilon^c$, $\varepsilon^D_p$, $sh_i$ as in the notes.
- Blue = substitution, red = scale/output.
- Every formula shown on a page is checked against a finite-difference number on the same page.
- Default numbers in each SPEC reproduced; works on a phone.
