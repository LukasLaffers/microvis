# Lecture 6 visualizations — plan

Lecture 6: *Demand theory.* (UMP) and (EMP), Kuhn-Tucker conditions, Marshallian demand $D(p,y)$ with (M1)–(M3), the conditions of Engel and Cournot, the indirect utility function $V(p,y)$ with (I1)–(I5) (Roy's identity), the expenditure function $C(p,v)$ with (E1)–(E5) (Shephard's lemma), Hicksian demand $H(p,v)$ with (H1)–(H4), the four duality identities, the Slutsky equation, inferior and Giffen goods, income expansion paths and Engel curves.

Consumer math for lectures 6+ lives in `shared/consumer-model.js` (tested by `node shared/test-consumer-model.cjs`): utility functions, $D$, $V$, $C$, $H$ (through duality), derivatives, elasticities. Tool-specific math goes in the tools' own `model.js`.

| Folder | Title | Lecture idea | Notes' figures |
|---|---|---|---|
| `demand-duality/` | UMP and EMP: Two Sides of One Tangency | (UMP) and (EMP), the four identities, Roy's identity, Shephard's lemma, (M1), (M2), (I2), (E4) | Cowell 4.9 |
| `slutsky/` | Substitution and Income Effects | (M3) $\partial D^j/\partial p_k=\partial H^j/\partial p_k-(\partial D^j/\partial y)D^k$; $E_1\to E_2\to E_3$; Marshallian vs Hicksian demand; Giffen goods | the Giffen figure |
| `engel-curves/` | Income Expansion Paths and Engel Curves | homothetic, luxury, inferior; $\eta_j$, $b_j$, Engel $\sum b_j\eta_j=1$, Cournot | the Engel figure (panels A–C) |

Utility functions (no exercise functions): CES with $\rho\ne0$, Stone–Geary $(x_1-\gamma_1)^a(x_2-\gamma_2)^{1-a}$, quasilinear $\kappa\log(1+x_1)+x_2$, and a Giffen example $U=-(s-x_2)^2/(x_1-c)$ (on $x_1>c$, $x_2<s$; interior demand $D^1=2c+(p_2s-y)/p_1$: good 1 is inferior, and a Giffen good when $y>p_2s$).

Colours: substitution blue, income red (as substitution/scale in lectures 3–4); budget sets grey; Marshallian demand green, Hicksian demand red/blue as in the lecture 7 figure.

## Do not solve the exercises
- No Cobb-Douglas utility (exercise 9: Hicksian and Marshallian demand, expenditure and indirect utility, substitution matrix, Slutsky), no $\alpha x_1^{1/2}+x_2$ (ex. 1), linear (ex. 4) or Leontief (ex. 5) utility, no $c(24-L)^3$ labour supply (ex. 6). The CES slider skips $|\rho|<0.1$.
- No proof that $V$ is quasi-convex in $p$ (ex. 2); $\mu^\ast$ is not shown next to $\lambda^\ast$ (ex. 3).
- No numbers for the substitution matrix of ex. 7; the Slutsky equation in elasticity form only for own prices, as in the notes (ex. 8 asks for the general form).

## Review checklist
- Labels (M1)–(M3), (I1)–(I5), (E1)–(E5), (H1)–(H4) as in the notes; $D$, $H$, $V$, $C$, $\lambda^\ast$.
- Every identity on a page is checked numerically (✓) and in the Node tests; works on a phone.
