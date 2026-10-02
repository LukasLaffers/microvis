# CV, EV and Consumer Surplus — specification

Lecture 7: compensating variation $CV=C(p^0,v^0)-C(p^1,v^0)$ and equivalent variation $EV=C(p^0,v^1)-C(p^1,v^1)$, both areas to the left of Hicksian demand curves; the change in consumer surplus as the area to the left of Marshallian demand. For a price fall, $CV\le\Delta CS\le EV$ when good 1 is normal, the order is reversed when it is inferior, and all three are equal without an income effect.

**Teaching goal.** Three ways to put a money value on a price change. All three are areas between the two prices to the left of a demand curve:
- CV uses $H^1(\cdot,v^0)$;
- EV uses $H^1(\cdot,v^1)$;
- ΔCS uses $D^1$.

The income effect decides their order. In the goods space, CV and EV are vertical distances on the $x_2$ axis between budget lines (with $p_2=1$).

## Model
Consumer math from `shared/consumer-model.js`. `model.js` (`window.WelfareModel`):
- `welfare(p10, p11, p2, y, u, n)` returns $v^0$, $v^1$, CV and EV, both from the expenditure function, the three areas (Simpson), and $x^0$, $x^1$;
- `bundles` returns the compensated bundles for the goods-space panel.

Tests (`node cv-ev/test-model.cjs`) check:
- CV and EV from the expenditure function equal the areas to the left of the Hicksian curves;
- $V(p^1,y-CV)=v^0$ and $V(p^0,y+EV)=v^1$;
- the ordering for normal and inferior goods;
- equality for quasilinear utility;
- the signs reverse for a price rise.

## Page
- Preferences:
  - CES, where good 1 is normal;
  - quasilinear, with no income effect;
  - the inferior-good example $U=-(s-x_2)^2/(x_1-c)$ at $y=3.96$ with $p_1$ from 1.18 to 0.9, where the price sliders are limited to the region with interior solutions.
- Area buttons: CV, ΔCS, EV, or all three as nested strips, smallest first.
- Default: CES with $\delta=0.5$ and $\rho=-1$, $p_1$ from 2 to 1, $y=10$. This gives $CV=3.137<\Delta CS=3.765<EV=4.571$.
- Main figure: $D^1$ green, $H^1(\cdot,v^0)$ red, $H^1(\cdot,v^1)$ blue, and the chosen areas.
- Second figure: budget lines, $v^0$, $v^1$, and the compensated budget lines, with CV and EV as arrows on the $x_2$ axis.
- Numbers, with checks:
  - CV and EV both from $C$ and as areas;
  - the ordering, and why it holds for this utility.
