# Lecture 5 visualizations — plan and cloud-session prompts

Lecture 5 has two parts. **Part 1, the firm and the market:** adding up supply when firms have fixed costs (jumps, no equilibrium, smoothing with many firms), externalities between firms, industry size with free entry, monopoly ($MR=MC$, $p=MC/(1+1/\eta)$), product differentiation (long-run tangency of $AR$ and $AC$). **Part 2, consumer preferences:** budget sets (B1)–(B3) and two-part tariffs, the preference axioms, better/worse/indifferent sets, lexicographic preferences, ordinal utility, convexity ⇔ quasi-concavity, and the MRS.

| Folder | Title | Lecture section |
|---|---|---|
| `market-supply/` | Market Supply and Entry | More firms · Interaction between the firms · Industry size |
| `market-power/` | Market Power | Market power · Product differentiation |
| `budget-sets/` | Budget Sets | Consumption opportunities |
| `preferences/` | Preferences and Utility | Consumer's motivation · axioms · representation · convexity · MRS |

Specs: `<folder>/SPEC.md`. All four are independent: run the four sessions in parallel, then one small session for the landing-page cards.

## 1. Notation (lecture 5; in addition to CLAUDE.md)

| Object | Symbol in the notes |
|---|---|
| inverse demand of a monopolist | $p(q)$, derivative $p_q(q)$ |
| demand elasticity (negative) | $\eta(q)=\dfrac{\mathrm d\log q}{\mathrm d\log p}=\dfrac{p(q)}{q\,p_q(q)}$ |
| monopoly price | $p(q)=\dfrac{MC(w,q)}{1+1/\eta(q)}$ |
| average and marginal revenue | $AR(p,q)=p$ (price taker), $MR$ |
| firms in order of entry | $1,2,\dots,N$; entry stops when the $(N+1)$-th firm would make a loss |
| goods, prices, income, endowment | $x_i$, $p_i$, $y$, $R=(R_1,\dots,R_n)$ |
| budget constraints | (B1) $p^tx\le y$, (B2) $p^tx\le p^tR$, (B3) $p^tx\le p^tR+y$; two-part tariff with entrance fee $F$ |
| feasible set | $X$ |
| preference relations | $\succcurlyeq$ (weak), $\succ$ (strict), $\sim$ (indifference); lexicographic $\succcurlyeq_L$ |
| better / worse / indifferent sets | $B(x)$, $W(x)$, $I(x)$ |
| utility, transformation | $U(x)$, $V=f(U)$ with $f'>0$ |
| marginal rate of substitution | $MRS_{ij}=-\dfrac{\mathrm dx_i}{\mathrm dx_j}\Big|_{\mathrm dU=0}=\dfrac{U_j}{U_i}$, so $MRS_{21}=U_1/U_2$ (same convention as $MRTS_{21}=\phi_1/\phi_2$ in lecture 1) |

Colours: keep blue = substitution / indifference curves, red = scale / budget lines, as in earlier tools; supply orange.

**Do not reproduce the lecture 5 exercises:** no preset with the cost function $100+6q+\tfrac12q^2$ or the demands $q=24-\tfrac14p$, $q=84-\tfrac34p$; no price discrimination tab; no presets with Arild's or Bente's bundles; not the utility functions $\sqrt{\min\{a_1x_1,a_2x_2\}}$, $\log x_1+x_2$, $ae^{-x_1}+be^{-x_2}$, $x_1(\tfrac13\log x_2)$; not the transformations $u^3-7$, $-3e^{-2u}$, $2u^2-4u$, $1/u$, $u^2+2u-1$. Where a readout would answer an exercise (axiom verdicts, MRS invariance), hide it behind a "Check your answer" button.

## 2. Prompts for cloud sessions
First commit and push `plans/lecture-5.md` and the four `SPEC.md` files.

**Sessions 1–4** (one per tool, in parallel; replace `<folder>`):
> Read CLAUDE.md, plans/lecture-5.md and `<folder>`/SPEC.md. Build the tool in `<folder>`/ exactly as specified. Use shared/firm-model.js where the SPEC says so (do not modify shared/, index.html or other tools); tool math goes in `<folder>`/model.js with its own Node test. Run all tests, check the page at desktop and 375 px width with no console errors, then open a pull request.

**Session 5** (after 1–4 are merged)
> Read CLAUDE.md and plans/lecture-5.md. Add cards for market-supply/, market-power/, budget-sets/ and preferences/ to index.html ("Lecture 5: …"), matching the existing cards; check every link. Open a pull request.

## 3. Review checklist
- Notation as in section 1 ($\eta(q)$ negative; $MRS_{21}=U_1/U_2$).
- No exercise presets; "Check your answer" readouts hidden by default.
- Default numbers in each SPEC reproduced; works on a phone.
