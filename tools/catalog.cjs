// The list of tools, in the order of the lecture notes. tools/build-site.cjs turns it into the tiles of
// index.html and the "previous / next" links at the bottom of every tool. A star marks an advanced tool.
module.exports = [
  { id: 'l1', lecture: 1, nav: 'Production', title: 'Production theory: substitution and scale properties', tools: [
    ['production-explorer', 'Production Explorer', 'A production function in 3D, seen along an isoquant, along a ray and along an axis.'],
    ['input-requirement-sets', 'Input Requirement Sets', 'Drag two input bundles and check free disposal, convexity and constant returns to scale.'],
    ['building-the-mrts', 'Building the MRTS', 'Why the slope of the isoquant is MRTS₂₁ = φ₁/φ₂, the ratio of the marginal products.'],
    ['homogeneous-homothetic', 'Homogeneous and Homothetic', 'Isoquants at equal output steps: what their shape and spacing say about returns to scale.'],
    ['two-elasticities', 'Two Elasticities: e(z) and σ(z)', 'The elasticity of scale along the ray, the elasticity of substitution along the isoquant, in one picture.'],
    ['frisch-chocolate', "Frisch's Chocolate Data", 'A real production function: Frisch’s 1935 measurements at the Freia chocolate factory.']
  ] },
  { id: 'l2', lecture: 2, nav: 'Firm optimisation', title: 'Firm optimisation: one step and two step approach', tools: [
    ['cost-minimisation', 'Cost Minimisation', 'Push the isocost line down until it just touches the isoquant.'],
    ['cost-curves', 'Cost Curves and Supply', 'From marginal and average cost to the supply curve, and why increasing returns and price taking do not mix.'],
    ['profit-two-ways', 'One Step vs Two Steps', 'Maximising profit directly, or minimising cost first: both give the same input bundle.'],
    ['two-technologies', 'Two Technologies and a Kink', 'A firm that needs two technologies: a kinked isoquant and a range of prices at which the input mix does not move.', true],
    ['concavity-and-scale', 'Concavity and Returns to Scale', 'A quasi-concave production function without increasing returns that is not concave.', true]
  ] },
  { id: 'l3', lecture: 3, nav: 'Optimal behaviour', title: 'Properties of the firm’s optimal behaviour', tools: [
    ['cost-function', 'The Cost Function', 'Why C(w,q) is concave in input prices, and Shephard’s lemma.'],
    ['substitution-scale-effects', 'Substitution and Scale Effects', 'A higher w₁ cuts the demand for input 1 twice: along the isoquant, then down the expansion path.']
  ] },
  { id: 'l4', lecture: 4, nav: 'Comparative statics', title: 'Comparative statics: “what if” questions', tools: [
    ['comparative-statics', 'What If? Comparative Statics', 'How output and input demand respond to prices, and why ordinary demand is flatter than conditional demand.'],
    ['marshall-law', "Marshall's Law of Derived Demand", 'The elasticity of labour demand as a weighted average of substitution and product demand.'],
    ['translog', 'Translog Cost Shares', 'Cost shares that are linear in log prices, and what Arnberg and Bjørner (2007) found.'],
    ['substitution-or-composition', 'Substitution or Composition?', 'Two firms that cannot substitute, whose aggregate data still look like substitution.']
  ] },
  { id: 'l5-firm', lecture: 5, nav: 'Firm and market', title: 'The firm and the market', tools: [
    ['market-supply', 'From Firms to Market Supply', 'Adding the firms’ supply curves: with fixed costs, market supply jumps and may miss demand.'],
    ['firm-externalities', 'Firms That Affect Each Other', 'When one firm’s output moves the other’s costs, market supply is no longer the sum of marginal costs.'],
    ['free-entry', 'Free Entry and Industry Size', 'Profits attract entrants until the next one would make a loss.'],
    ['monopoly', 'Monopoly and Product Differentiation', 'MR = MC: less output at a higher price, and how substitutes remove the profit in the long run.']
  ] },
  { id: 'l5-consumer', lecture: 5, nav: 'Preferences', title: 'Consumer preferences', tools: [
    ['budget-sets', 'Budget Sets', 'Income, endowment and a two-part tariff: the shapes a budget set can take.'],
    ['preference-axioms', 'Better, Worse, Indifferent', 'Better and worse sets for five preference relations, and the axioms each one satisfies.'],
    ['ordinal-utility', 'Utility Is Ordinal', 'An increasing transformation f(U) leaves the indifference curves and the ranking unchanged.']
  ] },
  { id: 'l6', lecture: 6, nav: 'Demand', title: 'Demand theory', tools: [
    ['demand-duality', 'UMP and EMP: Two Sides of One Tangency', 'Maximise utility on a budget, or minimise spending for a utility level: the same bundle.'],
    ['slutsky', 'Substitution and Income Effects', 'A price change split into a substitution and an income effect, including a Giffen good.'],
    ['engel-curves', 'Income Expansion Paths and Engel Curves', 'Necessities, luxuries and inferior goods: how demand moves with income.']
  ] },
  { id: 'l7', lecture: 7, nav: 'Welfare', title: 'Welfare measurement', tools: [
    ['cv-ev', 'CV, EV and Consumer Surplus', 'Three money measures of one price change, and what decides their order.'],
    ['deadweight-loss', 'The Deadweight Loss of a Tax', 'The consumer loses more than the tax raises, and the gap grows with the square of the tax.']
  ] },
  { id: 'l8', lecture: 8, nav: 'Decentralisation', title: 'Decentralisation in a simple economy', tools: [
    ['robinson-crusoe', "Robinson Crusoe's Economy", 'Prices that let a profit-maximising firm and a utility-maximising consumer reach the planner’s optimum.']
  ] },
  { id: 'l9', lecture: 9, nav: 'General equilibrium', title: 'General equilibrium', tools: [
    ['edgeworth-box', 'The Edgeworth Box', 'Offer curves, equilibria, the core and the welfare theorems in a two-person exchange economy.'],
    ['excess-demand', 'Excess Demand and Equilibrium', 'Three goods, two firms, two consumers: the prices at which excess demand is zero in every market.'],
    ['core-replica', 'The Core Shrinks', 'As the economy is replicated, the core shrinks towards the competitive equilibrium.', true]
  ] }
];
