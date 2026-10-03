# Budget Sets — specification

Lecture 5, Part 2: "Consumption opportunities". Read CLAUDE.md and `plans/lecture-5.md`. Self-contained math in `budget-sets/model.js` (two goods).

**Goal:** the budget set depends on where income comes from. With exogenous income (B1) $p^tx\le y$, a price change pivots the budget line around the intercept of the other good. With endowments (B2) $p^tx\le p^tR$, it pivots around the endowment point $R$ — the endowment is always affordable. (B3) $p^tx\le p^tR+y$ combines both. A two-part tariff (entrance fee $F$ for good 2) makes the budget set non-convex. This is the notes' remark "the main difference between (B1) and (B2) is in terms of the implications of a price change", made visible.

## Controls
- Budget type: (B1) / (B2) / (B3) / two-part tariff.
- Prices $p_1$, $p_2$ (0.25–4; defaults 1, 2); income $y$ (0–20, default 10); endowment $R=(R_1,R_2)$ (draggable point, default $(4,3)$); entrance fee $F$ (0–8, default 2).
- Button "Raise $p_1$ by 50 %": shows old (dashed) and new (solid) budget lines with the pivot point highlighted.

## Main plot (axes $x_1$, $x_2$, range 0–15)
- Shaded budget set (red tint), budget line (red), intercepts labelled ($y/p_1$, $y/p_2$ or $p^tR/p_1$, $p^tR/p_2$).
- (B2), (B3): endowment $R$ as a black dot; the line always passes through it in (B2).
- Two-part tariff: the set $\{x_1\le y/p_1,\ x_2=0\}$ (segment on the $x_1$ axis) together with $\{p_1x_1+p_2x_2+F\le y,\ x_2>0\}$; the jump is drawn with an open circle; caption: "Paying the fee makes the budget set non-convex."
- Readouts: the active constraint written with numbers, slope $-p_1/p_2$, and for (B2) the value of the endowment $p^tR$.

## Expected numbers
(B1) $p=(1,2)$, $y=10$: intercepts $10$ and $5$. After $p_1\to1.5$: intercepts $6.67$ and $5$ (pivot at $(0,5)$).
(B2) $R=(4,3)$, $p=(1,2)$: $p^tR=10$, same line as (B1). After $p_1\to1.5$: $p^tR=12$, intercepts $8$ and $6$, line still through $R$.
Two-part tariff, $F=2$: with $x_2>0$ the line $x_1+2x_2=8$; plus the segment $x_1\in[0,10]$ at $x_2=0$.

## `model.js` and tests
Budget set membership functions and intercepts for each type; tests for the numbers above and for "$R$ always affordable in (B2) for any prices".

## Header
Eyebrow "Lecture 5 · Consumer preferences", title "Budget Sets". "How to read this": 3 sentences.

## Done when
Numbers reproduced; dragging $R$ works on touch screens; no console errors.
