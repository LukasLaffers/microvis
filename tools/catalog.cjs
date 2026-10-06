// The list of tools, in the order of the lecture notes. tools/build-site.cjs turns it into the tiles of
// index.html and the "previous / next" links at the bottom of every tool. A star marks an advanced tool.
module.exports = [
  { id: 'l1', lecture: 1, nav: 'Production', title: 'Production theory: substitution and scale properties', tools: [
    ['production-explorer', 'Production Explorer', 'Walk over a production function three ways: along an isoquant, up a ray, along an axis.'],
    ['input-requirement-sets', 'Input Requirement Sets', 'Drag two input bundles and put free disposal, convexity and constant returns to the test.'],
    ['building-the-mrts', 'Building the MRTS', 'Two marginal products make one slope: why MRTS₂₁ = φ₁/φ₂.'],
    ['homogeneous-homothetic', 'Homogeneous and Homothetic', 'Same isoquant shapes, different labels: what the spacing of the isoquants reveals.'],
    ['two-elasticities', 'Two Elasticities: e(z) and σ(z)', 'The elasticity of scale along the ray, the elasticity of substitution along the isoquant, in one picture.'],
    ['frisch-chocolate', "Frisch's Chocolate Data", 'A real production function: Frisch’s 1935 measurements at the Freia chocolate factory.']
  ] },
  { id: 'l2', lecture: 2, nav: 'Firm optimisation', title: 'Firm optimisation: one step and two step approach', tools: [
    ['cost-minimisation', 'Cost Minimisation', 'Push the isocost line down until it just touches the isoquant.'],
    ['cost-curves', 'Cost Curves and Supply', 'From marginal and average cost to the supply curve, and why increasing returns break it.'],
    ['profit-two-ways', 'One Step vs Two Steps', 'Climb the profit hill directly, or minimise cost first: the same summit.'],
    ['concavity-and-scale', 'Concavity and Returns to Scale', 'Quasi-concave, no increasing returns, and still not concave: the chord rises above the surface.', true]
  ] },
  { id: 'l3', lecture: 3, nav: 'Optimal behaviour', title: 'Properties of the firm’s optimal behaviour', tools: [
    ['cost-function', 'The Cost Function', 'Why C(w,q) is concave in input prices, and Shephard’s lemma at work.'],
    ['substitution-scale-effects', 'Substitution and Scale Effects', 'A higher w₁ cuts the demand for input 1 twice: along the isoquant, then down the expansion path.']
  ] },
  { id: 'l4', lecture: 4, nav: 'Comparative statics', title: 'Comparative statics: “what if” questions', tools: [
    ['comparative-statics', 'What If? Comparative Statics', 'Change a price and follow output and input demand. Why ordinary demand is flatter than conditional demand.'],
    ['marshall-law', "Marshall's Law of Derived Demand", 'How elastic is the demand for labour? Substitution and product demand, weighted by the cost share.'],
    ['translog', 'Translog Cost Shares', 'Cost shares that are linear in log prices, and what Arnberg and Bjørner (2007) found.'],
    ['substitution-or-composition', 'Substitution or Composition?', 'Two firms that cannot substitute at all, and aggregate data that say they do.']
  ] },
  { id: 'l5-firm', lecture: 5, nav: 'Firm and market', title: 'The firm and the market', tools: [
    ['market-supply', 'From Firms to Market Supply', 'Add up the firms’ supply curves, and see fixed costs open a gap where no equilibrium exists.'],
    ['firm-externalities', 'Firms That Affect Each Other', 'When one firm’s output moves the other’s costs, market supply is no longer the sum of marginal costs.'],
    ['free-entry', 'Free Entry and Industry Size', 'Profits attract entrants until the next one would make a loss.'],
    ['monopoly', 'Monopoly and Product Differentiation', 'MR = MC: less output at a higher price, until close substitutes squeeze the profit away.']
  ] },
  { id: 'l5-consumer', lecture: 5, nav: 'Preferences', title: 'Consumer preferences', tools: [
    ['budget-sets', 'Budget Sets', 'Income, endowment and a two-part tariff: the shapes a budget set can take.'],
    ['preference-axioms', 'Better, Worse, Indifferent', 'Five preference relations against the axioms, and one that breaks continuity.'],
    ['ordinal-utility', 'Utility Is Ordinal', 'Transform U by any increasing f: the indifference curves stay where they are.']
  ] },
  { id: 'l6', lecture: 6, nav: 'Demand', title: 'Demand theory', tools: [
    ['demand-duality', 'UMP and EMP: Two Sides of One Tangency', 'Maximise utility on a budget, or minimise spending for a utility level: the same bundle.'],
    ['slutsky', 'Substitution and Income Effects', 'Split a price change in two, and meet a Giffen good.'],
    ['engel-curves', 'Income Expansion Paths and Engel Curves', 'Necessities, luxuries and inferior goods: how demand moves with income.']
  ] },
  { id: 'l7', lecture: 7, nav: 'Welfare', title: 'Welfare measurement', tools: [
    ['cv-ev', 'CV, EV and Consumer Surplus', 'Three money measures of one price change, and what decides their order.'],
    ['deadweight-loss', 'The Deadweight Loss of a Tax', 'The consumer loses more than the tax raises, and the gap grows with the square of the tax.']
  ] },
  { id: 'l8', lecture: 8, nav: 'Decentralisation', title: 'Decentralisation in a simple economy', tools: [
    ['robinson-crusoe', "Robinson Crusoe's Economy", 'One person, two roles: the prices that let a firm and a consumer find the planner’s optimum.']
  ] },
  { id: 'l9', lecture: 9, nav: 'General equilibrium', title: 'General equilibrium', tools: [
    ['edgeworth-box', 'The Edgeworth Box', 'Two traders, one box: offer curves, equilibria, the core and the welfare theorems.'],
    ['core-replica', 'The Core Shrinks', 'Replicate the economy, and watch the core close in on the competitive equilibrium.', true]
  ] }
];
