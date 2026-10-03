# Lecture 3 visualizations — plan and cloud-session prompts

Lecture 3: *Theory of the firm — properties of the firm's optimal behaviour.*
Content: properties (C1)–(C5) of the minimal cost function $C(w,q)$, properties (H1)–(H4) of the conditional demand $H(w,q)$, the decomposition of $\partial D^i/\partial w_i$ into a substitution and a scale effect, and homogeneous production functions ($C(w,q)=c(w)\,q^{1/k}$, $AC/MC=k$).

Two new tools plus one small extension of an existing tool. All firm math comes from `shared/firm-model.js` (already built for lecture 2; do not change it). Tool-specific math (price derivatives, decompositions) goes in the tool's own `model.js` with its own Node test, as CLAUDE.md requires.

| Folder | Title | Lecture idea | Colours |
|---|---|---|---|
| `cost-function/` | The Cost Function | (C2)–(C5), (H3), (H4): $C$ is increasing, homogeneous of degree one and concave in $w$; Shephard's lemma; the price-effects matrix | blue (as Step 1) |
| `substitution-scale-effects/` | Substitution and Scale Effects | $\dfrac{\partial D^i}{\partial w_i}=\color{blue}{\dfrac{\partial H^i}{\partial w_i}}+\color{red}{\dfrac{\partial H^i}{\partial q}\dfrac{\partial S}{\partial w_i}}$ | blue = substitution, red = scale (as in the notes) |
| `cost-curves/` (extension) | Cost Curves and Supply | homogeneous case: $C=c(w)q^{1/k}$, $AC/MC=k$ | unchanged |

Detailed specs: `cost-function/SPEC.md`, `substitution-scale-effects/SPEC.md`; the extension is specified in section 3 below.

## 1. Order of work
Sessions 1, 2 and 3 are independent and can run in parallel. Sessions 1 and 2 must not edit `index.html`, `shared/*` or other tools; session 3 edits only `cost-curves/`. Session 4 (small) adds the two cards to `index.html` afterwards.

## 2. Notation (in addition to the table in CLAUDE.md / plans/lecture-2.md)

| Object | Symbol in the notes | Use on the pages |
|---|---|---|
| properties of the cost function | (C1) continuous, (C2) monotone, (C3) homogeneous of degree one in $w$, (C4) concave in $w$, (C5) Shephard's lemma $\partial C/\partial w_j=H^j(w,q)$ | use these labels verbatim, e.g. "(C4) concave in $w$" |
| properties of conditional demand | (H1) meets the output requirement with equality, (H2) $H^j\ge0$, (H3) homogeneous of degree zero in $w$, (H4) $\partial H/\partial w^t$ symmetric and negative semi-definite | same |
| price scaling factor | $\alpha$, as in $C(\alpha w,q)=\alpha C(w,q)$ | $\alpha$ (not $\lambda$: $\lambda^\ast$ is the multiplier) |
| matrix of price effects | $\dfrac{\partial H(w,q)}{\partial w^t}=\dfrac{\partial^2 C(w,q)}{\partial w\,\partial w^t}$, entries $\dfrac{\partial H^j}{\partial w_k}$ | same |
| marginal cost | $\partial C/\partial q=\lambda^\ast$ | same |
| identity linking the approaches | $D(w,p)\equiv H(w,S(w,p))$ | same |
| substitution effect / scale effect | $\dfrac{\partial H^i(w,q^\ast)}{\partial w_i}$ (blue) / $\dfrac{\partial H^i(w,q^\ast)}{\partial q}\dfrac{\partial S(w,p)}{\partial w_i}$ (red) | same colours and words |
| unit cost, unit input requirement | $c(w)$, $\widetilde H^j(w)$ | same |

Do not add presets that solve the lecture 3 exercises (e.g. the cost function $2e^{q/2}(w_1w_2)^{1/2}$ of exercise 3).

## 3. Extension of `cost-curves/` (session 3)
In the "Homogeneous of degree k" profile only:
1. Show the formulas of the lecture 3 corollary in KaTeX under the plot, with current numbers: $C(w,q)=c(w)\,q^{1/k}$, $AC=c(w)\,q^{(1-k)/k}$, $MC=\tfrac1k c(w)\,q^{(1-k)/k}$ (with $A=1$; for $A\ne1$ write $C(w,q)=c(w)\,(q/A)^{1/k}$).
2. Add a readout "$AC/MC=k$" next to the existing elasticity of scale readout, and a one-line note: "With a homogeneous technology the ratio is the same at every $q$: $k<1$ means $AC<MC$, $k>1$ means $AC>MC$ (lecture 3)."
3. Add "Lecture 2 · Lecture 3" to the page eyebrow. Nothing else changes; existing behaviour and tests stay as they are.

## 4. Prompts to paste into cloud sessions
First commit and push `plans/lecture-3.md` and the two `SPEC.md` files.

**Session 1**
> Read CLAUDE.md, plans/lecture-3.md and cost-function/SPEC.md. Build The Cost Function tool in cost-function/ exactly as specified, using shared/firm-model.js for all firm math (do not modify shared/, index.html or other tools). Put the price-derivative math in cost-function/model.js with its own Node test. Run all tests, check the page loads without console errors at desktop and 375 px width, then open a pull request.

**Session 2**
> Read CLAUDE.md, plans/lecture-3.md and substitution-scale-effects/SPEC.md. Build the Substitution and Scale Effects tool in substitution-scale-effects/ exactly as specified, using shared/firm-model.js for all firm math (do not modify shared/, index.html or other tools). Put the decomposition math in substitution-scale-effects/model.js with its own Node test. Run all tests, check the page loads without console errors at desktop and 375 px width, then open a pull request.

**Session 3**
> Read CLAUDE.md and plans/lecture-3.md, section 3. Make exactly the extension described there in cost-curves/ and nothing else. Run all tests, check the page, then open a pull request.

**Session 4** (after 1–2 are merged)
> Read CLAUDE.md and plans/lecture-3.md. Add cards for cost-function/ and substitution-scale-effects/ to index.html ("Lecture 3: …"), matching the existing cards, and check every link works. Open a pull request.

## 5. Review checklist
- Labels (C1)–(C5), (H1)–(H4) used exactly as in the notes; $\alpha$ for price scaling.
- Blue = substitution, red = scale.
- Default views reproduce the numbers in each SPEC.
- The decomposition always adds up: substitution + scale = total (shown on the page).
- Works on a phone.
