# Better, Worse, Indifferent — specification

Lecture 5, sections 2.2–2.4 (Cowell figure 4.5 in the notes).

**Teaching goal.** A preference relation sorts all bundles relative to a bundle $x^\circ$ into $B(x^\circ)$, $W(x^\circ)$ and $I(x^\circ)$. The axioms are properties of these sets: continuity (closed $B$, $W$), monotonicity, convexity ($B$ convex). Lexicographic preferences are complete, transitive and monotone but not continuous, and no utility function represents them.

## Model (`model.js`, tested)
Preferences on $\mathbf R^2_+$: Cobb-Douglas, perfect substitutes, indifference curves bowed out ($\alpha x_1^2+(1-\alpha)x_2^2$), a bliss point, lexicographic. Functions: `utility` (none for lexicographic), `compare` ($1$, $0$, $-1$), `better`, `worse`, `indifferenceCurve`, `segmentInB` (does the segment between two bundles stay in $B(x)$), `AXIOMS` (the table on the page).
Tests: completeness and transitivity on random triples; every ✓ in `AXIOMS` survives a random search for counterexamples and every ✗ is found by it (monotonicity, strong monotonicity including the axes, convexity by segments, strict convexity by midpoints of indifferent bundles); the lexicographic sequence $(x_1^\circ+1/n,x_2^\circ-2)\in B(x^\circ)$ with its limit outside; closedness for the utility-based preferences; the indifference curves.
Not included (exercises 3 and 4): the kiwi/mango and rose bundles, and Leontief preferences.

## Page
- Controls: preference relation (Cobb-Douglas default), $\alpha$ (0.5), bliss point (6, 6), reference bundle $x^\circ$ (4, 4); clicking the plot moves the test bundle $x'$ (each preference relation has a demonstration bundle, e.g. one whose segment leaves $B(x^\circ)$ for bowed-out curves).
- Plot (square): $B(x^\circ)$ blue, $W(x^\circ)$ grey, $I(x^\circ)$ black; for lexicographic preferences the boundary line split into its better and worse halves, and the sequence with its limit; the segment from $x^\circ$ to $x'$ with the part outside $B(x^\circ)$ in red.
- Side: the seven axioms with ✓/✗ and a reason; whether a utility function represents the preferences; comparisons $x'$ vs $x^\circ$, utilities, the segment test, $x^\circ+(1,1)$, $x^\circ+(1,0)$, $x^\circ+(0,1)$.
