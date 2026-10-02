# Frisch's Chocolate Data — specification

Lecture 1, section 8 (*Frisch's 1935 study of Freia chocolate production*).

**Teaching goal.** A real production function. Frisch's Table 5a.8 gives kilos of nut chocolate $q$ for $z_1$ = moulding and cooling work and $z_2$ = cocoa fat (both in kroner; Frisch writes $v_1,v_2,x$). Students read marginal products, the MRTS and returns to scale straight off the data and compare with a fitted Cobb-Douglas.

## Data (as reproduced in the notes)
| $z_1\backslash z_2$ | 5 | 10 | 15 | 20 |
|---|---|---|---|---|
| 100 | 352 | 396 | 402 | 403 |
| 150 | 500 | 562 | 577 | 589 |
| 200 | 625 | 725 | 760 | 783 |
| 250 | 738 | 858 | 930 | 957 |

## Files
`model.js` (UMD, `window.FrischModel`): bilinear interpolation, difference-quotient marginal products and MRTS, cells on a common ray with arc elasticity $\ln(q'/q)/\ln\lambda$, OLS Cobb-Douglas fit on logs. `test-model.cjs`, `index.html`, `app.js`. Uses `../shared/ui.js`.

## Page
- Clickable table (heat-coloured) selects a cell.
- 3D: the 16 cells, the surface through them, the fitted Cobb-Douglas (translucent, extended like Frisch's isoquants), the row and column through the selected cell.
- Isoquants in the factor diagram (Frisch's figure): data isoquants 400–900 kg inside the measured rectangle; fitted isoquants at 250, 500, 750, 1000 kg; rays joining cells with the same input mix.
- One input varies: rows (vary cocoa fat) or columns (vary work), with the output added by each step.
- Readouts: $q$, $\phi_1$, $\phi_2$ (before/after/central), $MRTS_{21}$, fitted values; table of the 4 same-ray pairs with arc $e\approx0.93$–$1.06$; fit $\alpha+\beta\approx1.03$, $R^2\approx0.994$.

## Tests
Table values; interpolation at nodes and along grid lines; marginal products by hand; diminishing marginal product of cocoa fat in every row; same-ray pairs by brute force; OLS exact on synthetic Cobb-Douglas data and normal equations on Frisch's data.
