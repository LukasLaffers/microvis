# Duality: UMP and EMP — specification

Lecture 6, sections "The indirect utility function", "The expenditure minimisation problem", "Duality and 4 important identities". Read CLAUDE.md and `plans/lecture-6.md`. CES utility via `shared/firm-model.js` ($C(p,v)=c(p)\,v$, $H=\widetilde H(p)\,v$, $V=y/c(p)$, $D=\widetilde H(p)\,y/c(p)$); Stone–Geary as a second option.

**Teaching goal.** One tangency, two problems. (UMP): with income $y$, raise the indifference curve until it just touches the budget line. (EMP): with target utility $v$, push the budget line in until it just touches the indifference curve. When $v=V(p,y)$ both stop at the same bundle — the four identities. Plus the two envelope results: Roy's identity and Shephard's lemma, each shown as a slope.

## Layout
Two goods-space plots side by side (stacked on a phone), linked:
- **Left, (UMP)**: budget line fixed (red), a slider "utility level" moves an indifference curve (blue) up; status text: "affordable, can do better" / "best affordable: $V(p,y)$" / "not affordable". Button "solve" snaps to $V(p,y)$.
- **Right, (EMP)**: indifference curve at target $v$ fixed (blue), a slider "expenditure" moves the budget line (red) in/out; status: "too little to reach $v$" / "cheapest way: $C(p,v)$" / "can spend less". Button "solve".
- Toggle **"Link the problems"** (default on): sets $v=V(p,y)$ on the right; then a live identity panel shows all four identities with numbers and ✓: $C(p,V(p,y))=y$, $V(p,C(p,v))=v$, $D(p,y)=H(p,V(p,y))$, $H(p,v)=D(p,C(p,v))$.

## Lower panels
- **Roy's identity**: plot $V(p_1;p_2,y)$ against $p_1$ (decreasing), tangent at the current $p_1$; readout $-\dfrac{\partial V/\partial p_1}{\partial V/\partial y}=D^1(p,y)$ with numbers and ✓.
- **Shephard's lemma and (E4)**: plot $C(p_1;p_2,v)$ against $p_1$ (concave) with the straight line "spending if the bundle stayed at $H(\bar p,v)$" touching it at $\bar p_1$ with slope $H^1(\bar p,v)$ (same picture as the lecture 3 Cost Function tool — say so in the caption).
- "Check your answer" (hidden): $\lambda^\ast=\partial V/\partial y$ and $\mu^\ast=\partial C/\partial v$ with numbers.

## Controls
Utility (CES default $\delta=0.5$, $\rho=-1$; Stone–Geary $\alpha=0.5$, $\gamma=(2,0)$); $p_1$, $p_2$ (0.25–4, default 1, 1); $y$ (default 10); $v$ (when unlinked).

## Expected numbers (CES, $\delta=0.5$, $\rho=-1$, $p=(1,1)$, $y=10$)
$c(p)=2$, $V(p,y)=5$, $D(p,y)=(5,5)$, $C(p,5)=10$, $H(p,5)=(5,5)$; hidden: $\lambda^\ast=0.5$, $\mu^\ast=2$.

## `model.js` and tests
All four identities over a grid of $(p,y)$; Roy's identity and Shephard's lemma by finite differences; concavity of $C$ in $p$; brute-force UMP/EMP checks; Stone–Geary closed forms checked the same way.

## Header
Eyebrow "Lecture 6 · Demand theory", title "Duality: UMP and EMP".
