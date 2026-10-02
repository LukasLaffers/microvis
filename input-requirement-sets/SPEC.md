# Input Requirement Sets — specification

Lecture 1, section 3.1–3.2 (*Assumptions on the input requirement set*, Figures 3, 5, 6, 7) and Exercise 1.

**Teaching goal.** $Z(q)=\{z:\phi(z)\ge q\}$ and its boundary, the isoquant $I(q)$. Students move two bundles $z$ and $z'$ and see, at those points, whether **free disposal** ($z\in Z(q),\ z'\ge z\Rightarrow z'\in Z(q)$), **convexity** ($\lambda z+(1-\lambda)z'\in Z(q)$) and **constant returns to scale** ($\lambda z\in Z(\lambda q)$) hold.

## Files
`model.js` (UMD, `window.InputSetsModel`), `test-model.cjs`, `index.html`, `app.js`. Uses `../shared/ui.js`.

## Technologies (presets)
| key | $\phi$ | free disposal | convex | CRS | notes figure |
|---|---|---|---|---|---|
| `smooth` | $\sqrt{z_1z_2}$ | ✓ | ✓ | ✓ | Fig. 7.1 |
| `activities` | 4 activities, LP with mixing | ✓ | ✓ | ✓ | Fig. 7.2 |
| `nonconvex` | $\max\{z_1^{3/4}z_2^{1/4}, z_1^{1/4}z_2^{3/4}\}$ | ✓ | ✗ | ✓ | Fig. 7.3 |
| `leontief` | $\min\{z_1,z_2\}$ | ✓ | ✓ | ✓ | Fig. 7.4 |
| `congestion` | $4\sqrt{z_1z_2}\,e^{-(z_1+z_2)/4}$ | ✗ | ✓ | ✗ | — |
| `exercise` | activities $z^1,z^2,z^3$ of Exercise 1 | ✓ | with mixing | ✓ | Exercise 1 |

Activity analysis: $\phi(z)=\max\sum_j t_j$ s.t. $\sum_j t_j a_j\le z$, $t\ge0$ (with mixing), or $\max_j\min\{z_1/a_{j1},z_2/a_{j2}\}$ (without). The exact isoquant is drawn as a polyline (convex hull or staircase).

## Page
- Shaded $Z(q)$ with boundary $I(q)$; draggable $z$ (orange) and $z'$ (purple) as in the notes' figures; $z^\lambda$ on the segment; red ✕ where an assumption fails.
- Toggles: free disposal quadrant, convexity segment, returns to scale ($2\cdot I(q)$ dashed against $I(2q)$; they coincide exactly under CRS).
- Checks panel at the points, and the global properties of the technology.
- Exercise 1: mixing on/off, (ii) $I(2)$ under CRS, (iii) $\phi(z^4)=1.136>1$ with mixing (so $z^4$ is not on $I(1)$), $=1$ without (on the staircase boundary but wasteful).

## Tests
LP against brute force; Exercise 1 numbers; every point of the exact frontier produces $q$; the property table above verified on random samples; the page's checks at the default points.
