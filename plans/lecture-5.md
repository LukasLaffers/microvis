# Lecture 5 visualizations — plan

Lecture 5 has two parts.
- **Part 1, the firm and the market:** more firms (adding supply curves, fixed costs and jumps, no equilibrium, the average firm); interaction between firms (externalities); industry size and free entry; market power (monopoly, $p=MC/(1+1/\eta)$); product differentiation (the local monopolist in the short and the long run).
- **Part 2, consumer preferences:** consumption opportunities ($X$, budget sets (B1), (B2), (B3), two-part tariff); the preference relation and its axioms (completeness, transitivity, continuity, monotonicity, convexity) with $B(x)$, $W(x)$, $I(x)$ and the lexicographic counterexample; utility representation, ordinal utility, quasi-concavity, Theorem 1 (∗) and the MRS.

Seven tools. Firm math comes from `shared/firm-model.js` (unchanged) where the lecture uses a cost function $C(w,q)$ (free entry, monopoly). The notes' own examples with avoidable fixed costs and linear marginal cost (more firms), and with output-dependent marginal costs (externalities), are not in the firm model; they live in the tools' own `model.js`. Every `model.js` has its own Node test (CLAUDE.md).

| Folder | Title | Lecture idea | Notes' figures |
|---|---|---|---|
| `market-supply/` | From Firms to Market Supply | §1.1: horizontal sum, fixed costs make supply jump, no equilibrium, average supply of $N$ identical firms fills the gap | Cowell 3.1–3.5 |
| `firm-externalities/` | Firms That Affect Each Other | §1.2: a negative externality makes market supply steeper than $MC_1+MC_2$, a positive one flatter | Cowell 3.6, 3.7 |
| `free-entry/` | Free Entry and Industry Size | §1.3: $\Pi(q_N)\ge0$ but $\Pi(q_{N+1})<0$; in the long run $p\to\min AC$ | Cowell 3.8, 3.9 |
| `monopoly/` | Monopoly and Product Differentiation | §1.4–1.5: $MR=MC$, $p=MC/(1+1/\eta)$, profit $=(AR-AC)q^\ast$; entry of substitutes until $AR$ is tangent to $AC$ | Cowell 3.10, 3.12, 3.13 |
| `budget-sets/` | Budget Sets | §2.1: $X$, (B1), (B2), (B3), two-part tariff; a price change pivots (B1) about the $x_2$-intercept and (B2) about $R$ | Cowell 4.1, 4.2 |
| `preference-axioms/` | Better, Worse, Indifferent | §2.2–2.3: $B(x)$, $W(x)$, $I(x)$ for several preferences; which axioms hold; lexicographic preferences are not continuous | Cowell 4.5 |
| `ordinal-utility/` | Utility Is Ordinal | §2.4–2.6: $V=f(U)$ with $f'>0$ represents the same preferences; quasi-concavity and (∗); $MRS_{21}=U_1/U_2$ as the slope of the indifference curve | Cowell 4.6, the figure for Theorem 1 |

## Notation (in addition to CLAUDE.md)

| Object | Symbol in the notes |
|---|---|
| firm $i$'s output, market output | $q^1,q^2$; $q^1+q^2$ |
| price at which a firm starts to produce (with a fixed cost) | $p'$, $p''$; output there $\hat q$ (16 in the notes' example) |
| slope of supply above $p'$ | $\alpha$, as in $16+\alpha(p-p')$ |
| average supply of $N$ firms | $q^\ast_{avg}=\frac1N\sum_i q^\ast_i$ |
| supply of firm 1 given firm 2's output | $S^1(q^2=5)$ |
| average and marginal revenue | $AR(p,q)$, $MR(p,q)$; for a monopolist $AR=p(q)$ |
| demand elasticity (negative) | $\eta(q)=\frac{\mathrm d\log q}{\mathrm d\log p}=\frac{p(q)}{q\,p_q(q)}$ |
| goods, prices, income, endowment | $x=(x_1,\dots,x_n)$, $p$, $y$, $R$ |
| feasible set | $X$, e.g. $\mathbf R^n_+$ |
| budget constraints | (B1) $p^tx\le y$, (B2) $p^tx\le p^tR$, (B3) $p^tx\le p^tR+y$; entrance fee $F$ |
| preference relations | $\succcurlyeq$, $\succ$, $\sim$; lexicographic $\succcurlyeq_L$ |
| better / worse / indifferent sets | $B(x)$, $W(x)$, $I(x)$ |
| utility, transformation | $U$, $V=f(U)$ with $f'>0$ |
| marginal rate of substitution | $MRS_{ij}=U_j/U_i=-\mathrm dx_i/\mathrm dx_j\vert_{\mathrm dU=0}$; with $x_1$ on the horizontal axis the slope of the indifference curve is $-MRS_{21}$ |

Eyebrows: "Lecture 5 · The firm and the market" (part 1) and "Lecture 5 · Consumer preferences" (part 2).

## Do not solve the exercises
- No price discrimination between two markets, and no preset with $C(q)=100+6q+\tfrac12q^2$ or the demand curves of exercise 1.
- No numbers for $\mathrm dMRS_{21}/\mathrm dx_1\vert_{\mathrm dU=0}$ and no link between (∗) and the sign of that derivative (exercise 2).
- No kiwi/mango or rose bundles (exercise 3); no $\sqrt{\min\{a_1x_1,a_2x_2\}}$ or other Leontief preferences (exercise 4).
- None of the transformations of exercise 5 ($u^3-7$, $-3e^{-2u}$, $2u^2-4u$, $1/u$, $u^2+2u-1$).
- None of the utility functions of exercise 6 ($\log x_1+x_2$, $ae^{-x_1}+be^{-x_2}$, $x_1\cdot\tfrac13\log x_2$).
- The transformation panel shows indifference curves and rankings, not the MRS (exercise 7).

## Order of work
1. The seven tools, one at a time: model and tests first, then the page.
2. Cards in `index.html` under "Lecture 5 · The firm and the market" and "Lecture 5 · Consumer preferences".
3. All tests, page checks at desktop and 375 px, pull request.

## Review checklist
- Formulas and labels as in the notes.
- Every identity shown on a page is checked numerically on the page (✓) and in the Node tests.
- Default views reproduce the numbers in each SPEC.
- Works on a phone.
