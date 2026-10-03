# Lectures 7–9 visualizations — plan and cloud-session prompts

| Lecture | Folder | Title | Lecture idea |
|---|---|---|---|
| 7 Welfare measurement | `welfare-measures/` | CV, EV and Consumer Surplus | $CV$, $EV$, $\Delta CS$ as areas left of Hicksian / Marshallian demand; $CV\le\Delta CS\le EV$ for normal goods |
| 7 | `tax-deadweight-loss/` | Deadweight Loss of a Commodity Tax | $DWL=\int H^1-T$, the approximation $-\tfrac12\varepsilon^c_{11}\frac{p_1^1-p_1^0}{p_1^1}$, and the notes' table of 14 commodity groups |
| 8 Decentralisation | `robinson-crusoe/` | Robinson Crusoe | planner (MRS = MRT) vs decentralised firm + consumer at prices $w/p$; failure with non-convex technology; opening the economy |
| 9 General equilibrium | `edgeworth-box/` | Edgeworth Box | offer curves, competitive equilibrium, contract curve, core, excess demand and Walras' law, multiple equilibria, second welfare theorem with lump-sum transfers |
| 9 | `core-replica/` | The Core Shrinks | blocking coalitions in the $N$-replica economy; the core shrinks to the competitive allocation |

Specs: `<folder>/SPEC.md`. All five are independent: run them in parallel, then one session for the landing-page cards.

## 1. Notation

**Lecture 7:** prices before/after $p^0$, $p^1$ (good 2 is the numéraire, $p_2=1$; good 1's price $p_1^0\to p_1^1$); utilities $v^0=V(p^0,y)$, $v^1=V(p^1,y)$; $CV=C(p^0,v^0)-C(p^1,v^0)$, $EV=C(p^0,v^1)-C(p^1,v^1)$; $\Delta CS=\int_{p_1^1}^{p_1^0}D^1(p_1,1,y)\,\mathrm dp_1$; excise tax $t$, revenue $T=t\cdot D^1(p_1^1,1,y)$, $DWL$, ad valorem rate $\tau$ with $p_1^1=p_1^0(1+\tau)$.
**Lecture 8:** netput vector $q$ (outputs $+$, inputs $-$), feasible set $Q$, transformation function $\Phi(q)\le0$; MRS, MRT, TRS; planner multipliers $\mu_j$; decentralising prices $p^\ast$ with $p_i^\ast/p_k^\ast=\mu_i^\ast/\mu_k^\ast$; profit $\pi^\ast$; conditions (C1) $Q$ convex, (C2) preferences convex. Robinson: good 1 leisure ($x_1$, $q_1=-L$), good 2 coconuts ($x_2$, $q_2$), endowment $(T,0)$, technology $q_2\le\phi(L)$, wage $w$, coconut price $p$.
**Lecture 9:** households $h$ (Alf $a$, Bill $b$), endowments $R^h$, utilities $U^h$; offer curve; competitive equilibrium price $p^\ast$; excess demand $E_i(p)$; contract curve, core, lens; $N$-replica; competitive allocation labelled $z$ in the notes' figure; lump-sum transfers $T^h$ with $\sum_hT^h=0$ (added to the budget, so a tax is $T^h<0$).

Colours: Hicksian / substitution blue, Marshallian / income red, budget lines red, indifference curves blue (as in the lecture 6 tools); Alf blue, Bill orange in the Edgeworth box.

**Do not reproduce the exercises:** no utility $\alpha\sqrt{x_1}+x_2$ (lecture 7); no two-consumer two-firm planning problem (lecture 8); no quasilinear $\alpha\log x+y$ or $x+\beta\log y$ households, no endowments $(10,0)$ / $(0,10)$ with taxes $T_A$, $T_B$, no third household with indirect utility $\tfrac12m/\sqrt{pq}$ (lecture 9).

## 2. Prompts
First commit and push this file and the five `SPEC.md` files.

**Sessions 1–5** (one per tool, in parallel; replace `<folder>`):
> Read CLAUDE.md, plans/lectures-7-9.md and `<folder>`/SPEC.md. Build the tool in `<folder>`/ exactly as specified (use shared/firm-model.js for CES where the SPEC says so; do not modify shared/, index.html or other tools); other math in `<folder>`/model.js with its own Node test, including brute-force checks of every optimum and equilibrium. Run all tests, check the page at desktop and 375 px width with no console errors, then open a pull request.

**Session 6** (after 1–5 are merged)
> Read CLAUDE.md and plans/lectures-7-9.md. Add cards for the five tools to index.html ("Lecture 7: …", "Lecture 8: …", "Lecture 9: …"), matching the existing cards; check every link. Open a pull request.

## 3. Review checklist
Notation as above; no exercise presets; default numbers in each SPEC reproduced; phone layout; no console errors.
