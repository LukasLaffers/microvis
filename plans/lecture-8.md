# Lecture 8 visualizations — plan

Lecture 8: *Decentralisation in a simple economy.* Production plans are netput vectors $q$, and the production set $Q$ is $\{q:\Phi(q)\le0\}$. The planner maximises $U(x)$ subject to $\Phi(q)\le0$ and $x\le q+R$. At an interior optimum $U_i/U_k=\Phi_i/\Phi_k$ (MRS = MRT).

Decentralisation works with prices $p^\ast_i/p^\ast_k=\mu_i/\mu_k$ when $Q$ is convex (C1) and preferences are convex (C2). Opening the economy to trade raises utility and "convexifies" $Q$. The worked example is Robinson Crusoe: leisure $x_1$, coconuts $x_2$, endowment $(T,0)$ and $q_2\le\phi(L)$. It uses equations (R1), (R2), (PE), (MRSMRT), (DEC), (F1), (F2), (C1) and (C2).

| Folder | Title | Lecture idea | Notes' figures |
|---|---|---|---|
| `robinson-crusoe/` | Robinson Crusoe's Economy | planner's optimum MRS = $\phi'(L^\ast)$; the real wage $w/p$ that decentralises it; the firm's profit maximisation and Robinson's budget on the same line; failure with a non-convex technology, either increasing returns at $x^\ast$ or a loss at $L^\ast$; opening the economy at a world price | "decentralisation works / (C1) fails", "opening the economy" |

Math is in `robinson-crusoe/model.js`; the CES utility comes from `shared/consumer-model.js`. Colours:
- frontier and firm: red;
- Robinson's indifference curves and choices: blue;
- price / isoprofit / budget line: grey.

## Not built (possible later)
- A netput explorer: the potato–pig–sausage economy and the properties 1–6 of $Q$. Lecture 1's Input Requirement Sets tool already covers free disposal and convexity.

## Do not solve the exercise
Exercise 1 asks for the planning conditions with two consumers and two firms. The tool has one consumer and one firm.

## Status
Built: `robinson-crusoe/` (750 checks).
