# Handoff: Microvis (state on 7 October 2026)

Read this first, then `CLAUDE.md` (conventions, notation) and `style-kit/README.md` (the design and writing style).

## The project in two lines

Interactive figures for Lukáš Lafférs' lecture notes in microeconomic theory (lectures 1–9), 32 tools.
Repo `LukasLaffers/microvis`, live at https://lukaslaffers.github.io/microvis/ (GitHub Pages from `main`, about 1 minute after a merge).

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


### Not merged yet (on the branch, preview sent)
- **New tool: Excess Demand and Equilibrium** (`excess-demand/`, lecture 9, tile after the Edgeworth Box), built on the economy of the 2021 Assignment 2: three goods, two firms (CES of degree 1/2, making good 3 from goods 1 and 2), two Cobb-Douglas consumers who own the firms. Price plane with p3 = 1: curves where each market clears (all three meet: Walras' law), grey arrows of price adjustment, draggable prices, **▶ Run the auctioneer** and **One round** in the figure heading: Walras' tâtonnement in visible rounds (step 0.3 in log prices, ~0.6 s per round, about 16 rounds for the assignment), a sentence under the figure says what happens in each round, the last round settles on the exact equilibrium. The user asked what the arrows mean and found the first version too fast. The price plane uses `Plotly.react`, not `U.plot`: with `Plotly.animate(..., {redraw: false})` the contour traces (the three curves) disappear. Side: the three markets as demand/supply bars, the values p_i E_i that add up to zero, λ for homogeneity. Shows numbers only, not the excess demand formulas (part 7 of the assignment). `model.js` tested: Walras' law and homogeneity at random prices, budgets, firm and consumer optimality by brute force, the auctioneer converging from four corners, the assignment's equilibrium (0.794, 1.395, 1) and quantities.

### Next
Nothing requested. Open question to the user: does One Step vs Two Steps (3D) animate smoothly on their Mac? (Not measurable in the container: no GPU.)

### 3. Visitor counter (GoatCounter)
Counting works (dashboard https://microvis.goatcounter.com, 19 visits on 7 Oct). The footer total ("Lukáš Lafférs · N visits", start page only) appears only after the user ticks **Settings → "Allow adding visitor counts on your website"** in GoatCounter; told the user, not confirmed. The cloud environment's network policy blocks `microvis.goatcounter.com` and `lukaslaffers.github.io`, so it cannot be checked from the container unless those hosts are allowed.

## How the user works (important)

- Communicates by voice, briefly; wants short answers, no fluff. Uses Safari on Mac and iPhone, GitHub Desktop.
- Preview before merge: push to the branch, give **raw.githack links with the full commit SHA**, e.g. `https://raw.githack.com/LukasLaffers/microvis/<sha>/substitution-scale-effects/index.html`. Merge only after the user says "merge it" (or explicitly "if it works, merge").
- Merge: create a PR to `main`, squash-merge with `expectedHeadSha`. Then restart the branch from main: `git fetch origin main && git checkout -B claude/vigilant-carson-p2wfrl origin/main && git push --force-with-lease -u origin claude/vigilant-carson-p2wfrl`.
- Commit messages end with the co-author / session trailers of the current account; PR bodies end with the "Generated with Claude Code" line. No model names in commits, PRs or code.
- Never put the user's contact details (email etc.) on the site. No course code or university name on pages.
- Design taste: minimal, Helvetica/Arial, square corners, hairlines, black/white plus one blue; no "AI look" (no rounded boxes, coloured stripes, many colours). "Complexity is our enemy."
- Writing: academic, precise, short; no slogans, no rhetorical questions, no "watch …"/"meet …". Tile = one plain sentence; "How to read this" = idea in 2–3 sentences + a short list of things to try. Do not give closed-form answers to the notes' exercises (show numbers).
- Two tools are "advanced" and marked only with an asterisk on their tile (no explanation): Concavity and Returns to Scale, The Core Shrinks.
- An old local clone (GitHub Desktop) twice pushed merge commits with conflict markers ("tgf" commits). If that happens: do not force-push over the user's work; commit the correct tree on top.

## How the site is built

- Plain HTML/CSS/JS, no build step for pages; Plotly 2.35.2 and KaTeX 0.16.9 vendored in `shared/vendor/`; works offline and from `file://`.
- `tools/catalog.cjs` (tools in lecture order, tile sentence) + `tools/glyphs.cjs` (64 px tile drawings) → `node tools/build-site.cjs` writes `index.html` and, in every tool page: the "Microvis /" header link, previous/next links, the light/dark switch (button + `<head>` line + `shared/theme.js`), and the GoatCounter line. Run it after any catalog/glyph change; it is idempotent.
- Version tags: our CSS/JS are linked as `?v=N` (now **7**). Raise N in all pages whenever a shared CSS/JS file changes (`grep -l '?v=7"' index.html */index.html | xargs sed -i 's/?v=7"/?v=8"/g'`, then `node tools/build-site.cjs`). A tag that is not yet merged/deployed does not need another raise.
- Hover previews on tiles: `<tool>/preview.webp` and `preview-dark.webp`, made with `tools/previews.cjs` (Playwright).
- `style-kit/`: a copy of the look for a new project (README = style guide). Keep `style-kit/shared/{style.css,ui.js,theme.js}` in step with `shared/`.
- Dark mode: tokens on `:root`, `data-theme` set by the switch; figures redraw on the `microvis-theme` event via `Microvis.watchColorScheme`.

## Checks before every preview

```
for t in shared/test-*.cjs */test-model.cjs; do node $t >/dev/null || echo FAIL $t; done
node tools/check-pages.cjs        # errors, banner, phone horizontal scroll, header links (Playwright)
node tools/check-scrollbars.cjs   # unneeded scrollbars at 1440/1280/1024/768 (Safari shows them)
```
In Claude's cloud container Playwright is at `/opt/node22/lib/node_modules/playwright` (set `PLAYWRIGHT=` to that), Chromium at `/opt/pw-browsers`. Also look at screenshots (light/dark, desktop/phone) of what changed.

## Lessons learned (don't repeat)

- Safari: KaTeX overflows its box by a pixel → scrollbars. Boxes clip by default; `ui.js` adds `.scrolls` only for real overflow. Header formulas split at `\qquad`.
- Safari: Plotly keeps its first size → `ui.js` `fitPlots()` ResizeObserver.
- Plotly with `scaleanchor`: use `newPlot` when the range changes (`react` keeps the old domain).
- A line on the plot edge is drawn half-width (clipped): extend the axis range slightly (cost curves).
- Phones keep `:hover` after a tap: put hover colours inside `@media (hover: hover)`.
- Cache: a new page with an old cached stylesheet broke the start page once → version tags + inline width/height on tile SVGs + `style="display:none"` on previews.

## History (merged PRs)
#2 lectures 3–9 (21 tools) · #4 typo fixes · #5 Concavity and Returns to Scale · #6 asterisks · #7 Building the MRTS · #8 Homogeneous and Homothetic, Two Elasticities · #9 new design, Safari fixes, Engel D/E, tile drawings + previews · #10 cache fix · #11 redesign (one-line tiles, guides, prev/next, new drawings) · #12 style kit, plainer wording · #13 GoatCounter · #14 light/dark switch · #15 two animation buttons, two decimals, error-banner fix · #16 Slutsky and Engel animations, buttons in figure headings, smoother animations (U.plot).

## Ideas offered, not requested
Per-tool view counts on each tool page; tighter crops for some hover previews (Production Explorer); keep tile titles visible on hover.
