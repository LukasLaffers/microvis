# Handoff: Microvis (state on 12 October 2026)

Read this first, then `CLAUDE.md` (conventions, notation) and `style-kit/README.md` (the design and writing style).

## The project in two lines

Interactive figures for Lukáš Lafférs' lecture notes in microeconomic theory (lectures 1–9), 34 tools.
Repo `LukasLaffers/microvis`, live at https://lukaslaffers.github.io/microvis/ (GitHub Pages from `main`, about 1 minute after a merge).

## Continuing in a new session (another account)

1. Read this file, `CLAUDE.md` and `style-kit/README.md`; `git log --oneline -15 origin/main` shows the latest merges.
2. Work on the branch the new session is given (this session used `claude/vigilant-carson-p2wfrl`; in the commands below, use your own branch name). Start it from `origin/main`.
3. Use the new account's commit and PR trailers; no model names anywhere.
4. Run the checks below before every preview; previews are raw.githack links with the full commit SHA; merge only on "merge it".
5. Main is at #30 (12 October); nothing is unmerged.

## Start here: what is open

### 1. Merged on 7 October (#15)
- Error banner ignores errors that are not from Microvis (Safari's "Script error." from extensions).
- Cost Curves and Supply: wider orange supply curve under MC; q axis starts slightly below 0.
- Substitution and Scale Effects: opens with the two-step picture A → B → C; two buttons in the figure's panel head, **▶ Step by step** and **▶ Raise w₁ smoothly** (smooth change, slider `t` under the plot). `state.mode` = `'steps'` / `'smooth'` switches figure, cost plot, table and captions (`data-show`). `model.js` `path()` with tests.
- Two decimals everywhere: `shared/ui.js` `fmt(x, d)`, any d >= 2 gives two decimals, three when two would show a non-zero number as 0.00 (0.004); below 0.001 the ×10^n form. `fmtSum(parts)` gives parts and total with the same decimals, the total being the sum of the rounded parts (decomposition tables of Substitution and Scale Effects, Slutsky, Marshall's Law). Hover labels `.2f`. The published tables (Translog, Deadweight Loss groups) keep three. Lines with products of rounded numbers (Marshall, Engel, Monopoly, Homogeneous) can be off by 0.01 in the last digit; Slutsky's elasticity line is computed from the shown numbers.

### 2. Merged on 7 October (#16)
- **Substitution and Income Effects (Slutsky)** now works like Substitution and Scale Effects: opens with the two-step picture E₁ → E₂ → E₃; in the figure's panel head **▶ Step by step** (blue along v⁰ to E₂, then red to E₃) and **▶ Lower/Raise p₁ smoothly** (label follows the direction; slider `t` under the plot; arrows substitution + income = direction of the path; bars on the x₁ axis; table "so far"; checks at the current p₁). `model.js` `path()` (same symmetric split as the firm tool: H at fixed utility vs. fixed prices) with tests (adds up, converges, equals the integrals of the two (M3) terms).
- **Income Expansion Paths and Engel Curves**: ▶ Raise y smoothly in the figure heading: income rises over the example's range (3 % to 97 %), the path is traced (strong so far, faint ahead) with the current indifference curve, and the Engel curves grow with it; the Engel plot's y axis is fixed to the income range.
- **Smoother animations** (user: "a little bit bumpy"). New `shared/ui.js` helpers: `U.plot(id, traces, layout, config)` = `Plotly.react`, but when only trace points changed it moves them with `Plotly.animate(..., {redraw: false})` (much faster; it waits for queued animation steps before a real rebuild, else Plotly throws "_module"); `U.arrow2` and `U.text2` draw arrows and labels as traces so they can move that way. Rule for animated figures: keep the layout (axes ranges, annotations, shapes) and trace names fixed during the animation; moving things are traces. Also: t-independent maths cached (Slutsky demand curves, indifference curves and arrow scale; Engel path and curves), captions/tables at most 10 per second and slow finite-difference checks at most 5 per second while playing. Script time per frame went from 15–117 ms to 2–7 ms (Chromium in the container). Not improved: One Step vs Two Steps, whose 3D scene is slow here only because the container renders WebGL in software.
- **Every animation button sits in the heading of its figure** (user: "the button at the same position like for these two cases"): Profit Two Ways (▶ Show the two steps, next to the camera buttons), Marshall's Law (▶ Raise w₁), Substitution or Composition (▶ Notes example). `.big-button` is gone; `.btn-row button:disabled` in `shared/style.css` → version tag 7.


### 3. Merged on 8 October (#17–#19, from another session)
- **Excess Demand and Equilibrium** (`excess-demand/`, lecture 9, after the Edgeworth Box), from the 2021 Assignment 2: three goods, two CES firms, two Cobb-Douglas consumers; price plane with p3 = 1 and the curves where each market clears; an **Equilibrium** button. No tâtonnement arrows: the user removed them (not in the lecture). The price plane uses `Plotly.react`, not `U.plot` (with `Plotly.animate` the contour traces disappear). Numbers only, not the excess demand formulas (part 7 of the assignment).
- **Two Technologies and a Kink** (`two-technologies/`, lecture 2 after One Step vs Two Steps on the start page, asterisk), from the 2022 Assignment 2: firm D = min{φ_A, φ_B} (kink, vertical H¹) and firm C = max (not quasi-concave, H¹ jumps). The 2022 solution has two typos: page 4 labels the counterexample φ_D (it is φ_C), page 14 writes 0.5 for q = 1.

### 4. Merged on 9 October (#20): the bug hunt, fixed
`BUGS.md` lists the bugs found on 8 October and, at the top, how each was fixed. New shared helpers: `Microvis.react3d` (3D figures: no WebGL leak on projection switches), `ConsumerUI.incomeBounds/fitIncome` (income slider inside the problem's domain, with a note), `ConsumerModel.indifferenceCurve` ends at the axis; `fmt` prints rounding noise as 0 and exponents as ×10⁻⁴; the banner clears a part's message when it draws again. Version tag **8**. Checks: all model tests, check-pages, check-scrollbars, and a fuzz run (every slider at min and max, every option and button, random moves) on all tools; `tools/check-fuzz.cjs` (see "Checks").

### 4b. Merged on 10 October (#22): review of the lecture 4–6 tools
The user asked for a critical student's review of the lecture 4, 5 and 6 tools (taught next week), then said "fix them all". Done:
- **"Check your answer"** (as the plans require; it did not exist before): axiom verdicts (Better, Worse, Indifferent), the MRS of V = f(U) (Utility Is Ordinal), λ* and μ* with λ*μ* = 1 (UMP and EMP; `envelope()` now returns `mu`, tested). A `.btn-row` button; the answer hides again when the example changes.
- Lecture 4: Comparative Statics names both dashed H¹ curves, says the checks are at the starting w₁, writes ∂S/∂w₁; Marshall's Law shows the constant-returns formula (`FirmUI.techFormula(s, { crs: true })`), zooms "Inside the firm", draws the tangent on top; Translog "inelastic" wording, current vs reference prices, firm colours as in Substitution or Composition; Substitution or Composition labels off the lines.
- Lecture 5 firm: Market Supply p″ for firm 2 everywhere, Dem(p) (also Free Entry); Externalities draws S¹ at the other firm's actual output (the dot lies on it); Free Entry explains the dashed supply, "AR = p" in the margin; Monopoly deadweight loss (shaded, value; `deadweightLoss()` tested against the hand integral), long-run Π line adds up, p*/AR/MR labels.
- Lecture 5 consumer: Budget Sets old/new prices in the caption, the test bundle at both prices, check line with ·, group "Budget constraint"; preference-axioms caption rewritten, completeness not circular; Utility Is Ordinal 3D titles apart, bigger points.
- Lecture 6: UMP/EMP tangency line instead of λ*, the dotted/dashed curves explained, the concavity gap shaded, "four identities, Roy and Shephard" wording; Slutsky labels away from the arrows, the Hicksian curve stops at the Giffen corner (x₂ = 0) with a note, derivatives "at the starting price"; Engel Curves good 1 black / good 2 purple (blue/red are substitution/income), log-scales switch, Engel/Cournot/homogeneity lines show their terms rounded to add up exactly, default δ = 0.65 (two different rays).
- Shared: number boxes show two decimals (whole numbers for whole steps); `renderStaticTex` glues a formula to the punctuation around it (`.tex-glue`, no lone "." at a line start); KaTeX `\color{#d0021b}`/`{#4a90e2}` follow the theme in dark mode (CSS on the inline style, both `#hex` and `rgb()` forms); `.key.dotted`. style-kit updated. Version tag **10**.
- Giffen good (user: "I'm not using any function … do not mention anything unless completely necessary, I don't want to overload the students"): no utility formula, no domain hint and no income note for the Giffen example in Slutsky and Engel curves (case C); the dropdown says "Giffen good". `ConsumerUI.formula` returns '' for it, the formula box is hidden.
- The quasilinear preset κ log(1+x₁)+x₂ (UMP and EMP) stays (user, 10 October), although it is close to the lecture 5 exercise log x₁ + x₂.

### 4c. Merged on 10 October (#23): smoother smooth animations
User: "animation is not smooth for subs and income effects". Measured in the container (5.5 s of ▶ … smoothly): Slutsky 214 → 315 frames, Substitution and Scale Effects 172 → 301. Causes and fixes: `Microvis.tex` re-rendered the same KaTeX formula in every frame (now skipped when unchanged); the moving indifference curve used 200-step bisection per point (`ConsumerModel.x2On` now tries a closed form for CES, Stone–Geary, quasilinear and the Giffen example first, checked against plain bisection in the tests); the moving labels are one text trace instead of five; SSE's triangle caption is written only with the other text. Version tag **11**.
User then: "Substitution and Scale Effects is not smooth". Fix: new `Microvis.overlay(id, traces)` (shared/ui.js) draws Plotly-like traces (lines, dots, arrow2 arrows, text) on a thin SVG layer over the figure, clipped to the axes, repainted on `plotly_afterplot` (resize, theme); in the smooth mode of both tools everything that moves (current isoquant/indifference curve, budget/isocost line, ray, path, arrows, labels, bars, current dots, MC/AC now) goes there and Plotly draws only the still parts once, so no Plotly call per frame. Now 331–333 of ~333 frames, no slow frames, in the container. The step-by-step mode still uses Plotly (it was already smooth).

### 4d. Merged on 10 October (#24): UX prototype on Production Explorer
After a UX review of all tools the user chose three directions: (1) less on screen at first, the rest folded away; (3) grab and move things directly in the figure; (6) on a phone the figure first. Not wanted: playful elements (missions, games); keep it professional and clear. Prototype on the first tile:
- Visible: guide, technology (two formula lines and the σ note), mode with its own sliders. Folded into `details.more` "More settings": exponents and the F(g(z)) form, returns to scale (law, A, k, …), "Go to a point", layers, plot range.
- The point in the map can be dragged (`Microvis.dragPoint(id, {target, move, start, end})`: mouse anywhere on the axes; finger only on the point, so the page still scrolls). In each mode it sets that mode's sliders. The map's moving parts are on `Microvis.overlay`, the hill via `U.plot` (no Plotly redraw while dragging); the 3D figure follows at most 15 times a second while dragging.
- Phone: `grid-template-areas: "main" "controls" "side"` in the tool's style.css.
- Version tag **12**.

### 4e. Merged on 11 October (#25): the pattern on all 33 tiles
Done in eight parallel batches (each in its own tool folders), then reviewed and checked together. On every tile: secondary settings in `details.more` "More settings" at the end of the controls (wording that pointed to folded controls now says "(under More settings)"); natural objects draggable with `Microvis.dragPoint` (bundles, prices, endowments, level lines, test bundles, the "now" point of the smooth animations; never in 3D; not while an animation plays); captions start with what can be dragged; on phones the figure comes first (`grid-template-areas` in each tool's style.css). Notes:
- Figures whose axes depend on the dragged value hold their axes still during the drag and rescale on release (Comparative Statics, Cost Curves, Monopoly, Budget Sets, UMP/EMP, CV/EV, Deadweight Loss, Slutsky's demand panel, Robinson Crusoe, Market Supply); one drag therefore reaches only the edge of the current frame.
- Several handles in one figure: a small local "nearest handle" capture listener before `U.dragPoint` (budget-sets, preference-axioms, comparative-statics, marshall-law, translog, cv-ev, input-requirement-sets, edgeworth-box). A shared multi-target `dragPoint` would remove the copies (not done).
- `dragPoint`'s move() gives axis coordinates: log10 values on log axes; the tools with log axes convert (two-technologies, translog, marshall-law).
- Market Supply and Externalities: the market panel moved onto the main axis (firms on x2/x3) so it can be dragged.
- No drag where nothing natural to grab: One Step vs Two Steps, Homogeneous and Homothetic, the 3D figures.
- Shared fixes in this round: `U.overlay` draws diamond and star markers and re-hooks its repaint after a rebuild; `U.plot` uses `Plotly.newPlot` when the ranges of an equal-scale figure change (Plotly.react kept the old domain: Production Explorer's plot range squeezed the map). Version tag **13**.
- Phones, not changed (were so before): some header formulas and long step equations scroll inside their box; the Plotly mode bar overlaps a 3D title in Utility Is Ordinal; crowded labels in the three-panel Market Supply / Externalities figures.

### 4f. Merged on 11 October (#26): Two Technologies
User: the grey point in the main figure "looks like a bug", the drag "wonky". It was a handle (added in #25) that turned the isocost line around H: removed; the main figure has no drag again, the two side figures keep theirs (they move w₁ smoothly). Also fixed there: the shaded kink band in the H¹ panel was drawn at w₁ 0.1–0.5 instead of 0.33–3 (shape coordinates on a log axis are data values, not log10), and the log price axes now label 0.2 and 0.5 in full. Lesson: a drag handle that is not an economic object of the figure confuses; only grab things the figure is about. Then the user asked to move H itself (mouse and finger): dragging H moves it along the isoquant (q stays fixed, user's wish) and sets w₁ as the price whose cheapest bundle is nearest the pointer (grid of 301 prices; at firm D's kink the one nearest the current w₁, so the line does not jump). Firm C's H jumps over the part of the isoquant it never chooses, as it should.

### 4g. Merged on 11 October (#27, #28): only economic objects can be dragged
User agreed to remove the handles added in #25 that are not economic objects: the dot at the end of the budget line on the x₁-axis (Budget Sets, UMP and EMP), the grey points on the price lines (Robinson Crusoe, Edgeworth Box), the dot on AR (Monopoly), the dots on demand (Market Supply, both panels). Robinson Crusoe, Monopoly and Market Supply have no drag now (their app.js is back to #24, their More settings and phone order stay). Still draggable: test bundle and R (Budget Sets), the "now" points on V and C (UMP/EMP), R and the target star (Edgeworth Box), and the other tiles' real objects. Then (#28) also the handle on Cost Minimisation's isocost line (where it crossed the expansion path): the main figure has no drag, the cost level is set with its slider again; the point on the H¹(w₁) figure stays draggable. Version tag **15**.

### 4h. Merged on 12 October (#29, #30): Cross-Price Effects; no "dearer"
- **New tool `cross-price-effects/`** (lecture 4, after What If? Comparative Statics; 34 tiles now), from the exercise at the top of page 4 of the lecture 4 notes (∂Dⁱ/∂wⱼ, j ≠ i; "can you predict ∂Dʲ/∂wᵢ?"). How it came about: the user first asked for a mock-up only ("before producing any tile, just plot it"), then for the math to be checked rigorously and for uncluttered cases, then for the tile.
- Three firms φ = g^{1/2} (CES g, δ = 0.5) that differ only in σ (3, 2, 0.5; the three σ under More settings). At w = (1, 1), p = 4 all three produce q = 1 with z = (1, 1) (c(1,1) = 2 for every σ when δ = 0.5). w₂′ (slider, or drag C in a lower figure; axes held during the drag) gives A → B (substitution, blue) → C (scale, red) per firm: input 1 rises (gross substitutes) / does not move (σ = 2 = 1/(1−k): the effects cancel exactly, D¹ is vertical) / falls (gross complements). The direction does not depend on w₂′: ∂ln D¹/∂ln w₂ = s₂(σ − 1/(1−k)).
- Top figures: isoquants of the old and new output, short isocost pieces at A and B, dotted drop lines from A and C. Bottom figures: z₁ against w₂, H¹ at the old output (dashed blue) and D¹ (black). All three firms share the axes.
- Table at w = (1, 1): substitution σ/2, scale −1, ∂D¹/∂w₂ (fmtSum); the ∂D²/∂w₁ column shows "?" until **Check your answer**.
- The decomposition formula is in the header (the user wanted it, although it is the exercise's answer): ∂D¹(w,p)/∂w₂ = ∂H¹/∂w₂ + (−1/C_qq)(∂H¹/∂q)(∂H²/∂q).
- Layout: the table goes under the three firms (`cross-price-effects/style.css` overrides the grid: "controls main" / "controls side"; ≤1250 px "main main" / "controls side"; phone: figures first).
- `model.js` uses `shared/firm-model.js`; `test-model.cjs` (298 checks) compares everything with an independent brute-force firm written in the test (cost minimisation along the isoquant, golden-section profit maximisation): A, B, C, the decomposition, dS/dw₂ = −(1/C_qq)∂H²/∂q, symmetry term by term, Hotelling (−Π₁₂), the elasticity formula, the default numbers.
- **"Dearer" removed from every page** (the user does not like the word): use "the price of … rises" or "more expensive".
- #30: header formulas write D with its arguments, ∂Dⁱ(w,p)/∂wᵢ (user), in Cross-Price Effects and What If? Comparative Statics; Comparative Statics' "+" was blue (see Lessons: `\textcolor`).

### Next
Nothing requested. Open, small:
- Lecture 4 is taught on 13 October (date on the notes); the user may come back with lecture 4 exercises (pattern: mock-up first, then the tile).
- Other formulas still use KaTeX `\color{…}{…}`, which also colours what follows it in the same group: `comparative-statics/app.js`, `marshall-law/app.js` and `index.html`, `slutsky/index.html`, `substitution-scale-effects/index.html`. Check each for a wrongly coloured operator; switch to `\textcolor` where needed.
- Touch drags tested on only some tiles.

### 5. Visitor counter (GoatCounter)
Counting works (dashboard https://microvis.goatcounter.com, 19 visits on 7 Oct). The footer total ("Lukáš Lafférs · N visits", start page only) appears only after the user ticks **Settings → "Allow adding visitor counts on your website"** in GoatCounter; told the user, not confirmed. The cloud environment's network policy blocks `microvis.goatcounter.com` and `lukaslaffers.github.io`, so it cannot be checked from the container unless those hosts are allowed.

## How the user works (important)

- Communicates by voice, briefly; wants short answers, no fluff. Uses Safari on Mac and iPhone, GitHub Desktop.
- Preview before merge: push to the branch, give **raw.githack links with the full commit SHA**, e.g. `https://raw.githack.com/LukasLaffers/microvis/<sha>/substitution-scale-effects/index.html`. Merge only after the user says "merge it" (or explicitly "if it works, merge").
- Merge: create a PR to `main`, squash-merge with `expectedHeadSha`. Then restart the branch from main: `git fetch origin main && git checkout -B claude/vigilant-carson-p2wfrl origin/main && git push --force-with-lease -u origin claude/vigilant-carson-p2wfrl`.
- Commit messages end with the co-author / session trailers of the current account; PR bodies end with the "Generated with Claude Code" line. No model names in commits, PRs or code.
- Never put the user's contact details (email etc.) on the site. No course code or university name on pages.
- Design taste: minimal, Helvetica/Arial, square corners, hairlines, black/white plus one blue; no "AI look" (no rounded boxes, coloured stripes, many colours). "Complexity is our enemy."
- Writing: academic, precise, short; no slogans, no rhetorical questions, no "watch …"/"meet …"; never the word "dearer". Tile = one plain sentence; "How to read this" = idea in 2–3 sentences + a short list of things to try. By default do not give closed-form answers to the notes' exercises (show numbers); the user may still want a formula shown (Cross-Price Effects header): ask or follow the user.
- Notation: as in the notes, with arguments where the notes write them (Dⁱ(w,p), Hⁱ(w,q)).
- New tiles from the notes or assignments: the user often wants to see a mock-up first. Make a static HTML page in the scratchpad (loading `shared/` by absolute file:// paths), screenshot it with Playwright and send the image; build the tile only when asked. Check the math independently (brute force) before showing numbers.
- Three tools are "advanced" and marked only with an asterisk on their tile (no explanation): Two Technologies and a Kink, Concavity and Returns to Scale, The Core Shrinks.
- An old local clone (GitHub Desktop) twice pushed merge commits with conflict markers ("tgf" commits). If that happens: do not force-push over the user's work; commit the correct tree on top.

## How the site is built

- Plain HTML/CSS/JS, no build step for pages; Plotly 2.35.2 and KaTeX 0.16.9 vendored in `shared/vendor/`; works offline and from `file://`.
- `tools/catalog.cjs` (tools in lecture order, tile sentence) + `tools/glyphs.cjs` (64 px tile drawings) → `node tools/build-site.cjs` writes `index.html` and, in every tool page: the "Microvis /" header link, previous/next links, the light/dark switch (button + `<head>` line + `shared/theme.js`), and the GoatCounter line. Run it after any catalog/glyph change; it is idempotent.
- Version tags: our CSS/JS are linked as `?v=N` (now **15**). Raise N in all pages whenever a shared CSS/JS file changes (`grep -l '?v=15"' index.html */index.html | xargs sed -i 's/?v=15"/?v=16"/g'`, then `node tools/build-site.cjs`). A tag that is not yet merged/deployed does not need another raise. When only a tool's own app.js/style.css changes in a way that breaks an old cached copy (new element ids), raise that page's own tags.
- Hover previews on tiles: `<tool>/preview.webp` and `preview-dark.webp`, made with `tools/previews.cjs` (Playwright).
- `style-kit/`: a copy of the look for a new project (README = style guide). Keep `style-kit/shared/{style.css,ui.js,theme.js}` in step with `shared/`.
- Dark mode: tokens on `:root`, `data-theme` set by the switch; figures redraw on the `microvis-theme` event via `Microvis.watchColorScheme`.

## Checks before every preview

```
for t in shared/test-*.cjs */test-model.cjs; do node $t >/dev/null || echo FAIL $t; done
node tools/check-pages.cjs        # errors, banner, phone horizontal scroll, header links (Playwright)
node tools/check-scrollbars.cjs   # unneeded scrollbars at 1440/1280/1024/768 (Safari shows them)
node tools/check-fuzz.cjs         # every slider at min and max, options, buttons, random moves: banner, page and KaTeX errors
```
In Claude's cloud container Playwright is at `/opt/node22/lib/node_modules/playwright` (set `PLAYWRIGHT=` to that), Chromium at `/opt/pw-browsers`. Also look at screenshots (light/dark, desktop/phone) of what changed.

## Lessons learned (don't repeat)

- Safari: KaTeX overflows its box by a pixel → scrollbars. Boxes clip by default; `ui.js` adds `.scrolls` only for real overflow. Header formulas split at `\qquad`.
- Safari: Plotly keeps its first size → `ui.js` `fitPlots()` ResizeObserver.
- Plotly with `scaleanchor`: use `newPlot` when the range changes (`react` keeps the old domain).
- A line on the plot edge is drawn half-width (clipped): extend the axis range slightly (cost curves).
- Phones keep `:hover` after a tap: put hover colours inside `@media (hover: hover)`.
- `requestAnimationFrame`'s first time stamp can be earlier than the click: clamp animation progress at 0 (red banners otherwise).
- Plotly 3D: switching the camera between perspective and orthographic creates a new WebGL context each time; use `U.react3d`.
- `U.plot` only moves points when the layout is unchanged: give axes explicit ranges if they must follow the data.
- KaTeX `\color{c}{x}` is a switch: it colours everything after it in the group, so `\color{blue}{a}+\color{red}{b}` paints the "+" blue. Use `\textcolor{c}{x}` (the dark-mode CSS handles both).
- Screenshots and scratch files: write them to the scratchpad with absolute paths; a script run from the repo once dropped two PNGs into a commit (`git add -A`).
- `pkill -f <name>` also matches the shell running it and kills your own command.
- Cache: a new page with an old cached stylesheet broke the start page once → version tags + inline width/height on tile SVGs + `style="display:none"` on previews.

## History (merged PRs)
#2 lectures 3–9 (21 tools) · #4 typo fixes · #5 Concavity and Returns to Scale · #6 asterisks · #7 Building the MRTS · #8 Homogeneous and Homothetic, Two Elasticities · #9 new design, Safari fixes, Engel D/E, tile drawings + previews · #10 cache fix · #11 redesign (one-line tiles, guides, prev/next, new drawings) · #12 style kit, plainer wording · #13 GoatCounter · #14 light/dark switch · #15 two animation buttons, two decimals, error-banner fix · #16 Slutsky and Engel animations, buttons in figure headings, smoother animations (U.plot) · #17 Excess Demand · #18 Two Technologies and a Kink · #19 its tile position · #20 bug hunt: all items of BUGS.md fixed, react3d, fitIncome, check-fuzz · #21 Homogeneous and Homothetic: same isoquants, different outputs (another session) · #22 lecture 4–6 review fixes, Check your answer, Giffen good without a function · #23 smooth animations on an SVG overlay (`Microvis.overlay`) · #24 Production Explorer prototype: More settings, drag the point, figures first on phones · #25 the same pattern on all tiles · #26 Two Technologies: drag H along the isoquant, kink band fixed · #27 non-economic drag handles removed · #28 also the isocost handle in Cost Minimisation · #29 Cross-Price Effects (lecture 4), no "dearer" on any page · #30 Dⁱ(w,p) in the header formulas.

## Ideas offered, not requested
Per-tool view counts on each tool page; tighter crops for some hover previews (Production Explorer); keep tile titles visible on hover.
