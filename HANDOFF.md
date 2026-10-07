# Handoff: Microvis (state on 7 October 2026)

Read this first, then `CLAUDE.md` (conventions, notation) and `style-kit/README.md` (the design and writing style).

## The project in two lines

Interactive figures for Lukáš Lafférs' lecture notes in microeconomic theory (lectures 1–9), 31 tools.
Repo `LukasLaffers/microvis`, live at https://lukaslaffers.github.io/microvis/ (GitHub Pages from `main`, about 1 minute after a merge).

## Start here: what is open

### 1. Not merged yet (branch `claude/vigilant-carson-p2wfrl`, head after the handoff commit)

Three changes, previewed but waiting for "merge it":
- **"Script error." fix** (`shared/ui.js`): the red error banner ignored nothing; it showed "Script error." from Safari extensions / content blockers at random. Now it shows only errors of our own scripts. Tested.
- **Cost Curves and Supply**: the orange supply curve is 9 px (was 5) under the red MC line, and the q axis starts at −1.2 % so the vertical part at q = 0 is not cut in half. The user liked it.
- **Substitution and Scale Effects: smooth animation** (`model.js` `path()`, new `app.js` main figure). w1 rises gradually, everything moves at once, blue/red arrows at the current point add up to the black direction of the path, slider `t`, checkbox "Compare with the two-step split". Tests in `test-model.cjs` (exact additivity, convergence, equals the integral of the derivative terms).

### 2. Requested by the user, NOT done yet (do this next, then preview, then merge)

User's words (Substitution and Scale Effects): "I like the animation mostly. But I would like the initial figure to look the same way as it was before. And I would like two buttons, one that would do the step-by-step thing, another one that would do raise w1 smoothly, next to each other. And the problem is that they are too low: if I click them, I then need to scroll up."

So:
- The figure on load = the old static picture: A, B, C, the blue arc A→B along the old isoquant, the red segment B→C, old/new isocost lines and rays, the bars (B−A) + (C−B) = C−A. The old code is in git: `git show 652ddcb:substitution-scale-effects/app.js` (functions `drawMain`, `animate` with `fSub`/`fScale`).
- Two buttons side by side, near the top of the controls (right under "How to read this", or in the panel head of the figure so they are next to the plot): **▶ Step by step** (the old two-phase animation A→B→C) and **▶ Raise w₁ smoothly** (the new one). After either animation, the figure can stay in that mode; a sensible default: after "smoothly" ends, keep the smooth picture with slider t; "Step by step" returns to the old picture.
- Then the "Compare with the two-step split" checkbox is probably not needed (the step-by-step view is the comparison). Keep the guide text short and rewrite it for the two buttons.
- Check on a phone that the buttons are visible without scrolling away from the figure (on phones the controls come first; consider putting the buttons in the figure's panel head).

### 3. Waiting on the user's answer
- **Two decimals instead of three** in the right-hand panels. The user suggested it; I agreed and proposed two rules before doing it: (a) where parts and their sum are shown together, round the parts and show the total as their rounded sum, so tables add up; (b) numbers below 0.1 in absolute value: two significant digits (0.0042), not 0.00. Not started; ask for the go-ahead, then do all tools in one pass (`fmt(x, 3)` calls in the `app.js` files; `shared/ui.js` `fmt`).

### 4. Visitor counter (GoatCounter)
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
- Version tags: our CSS/JS are linked as `?v=N` (now **6** on the branch, 5 on main). Raise N in all pages whenever a shared CSS/JS file changes (`grep -l '?v=6"' index.html */index.html | xargs sed -i 's/?v=6"/?v=7"/g'`, then `node tools/build-site.cjs`). A tag that is not yet merged/deployed does not need another raise.
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
#2 lectures 3–9 (21 tools) · #4 typo fixes · #5 Concavity and Returns to Scale · #6 asterisks · #7 Building the MRTS · #8 Homogeneous and Homothetic, Two Elasticities · #9 new design, Safari fixes, Engel D/E, tile drawings + previews · #10 cache fix · #11 redesign (one-line tiles, guides, prev/next, new drawings) · #12 style kit, plainer wording · #13 GoatCounter · #14 light/dark switch.

## Ideas offered, not requested
Per-tool view counts on each tool page; tighter crops for some hover previews (Production Explorer); keep tile titles visible on hover.
