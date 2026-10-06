// The site and its pages, in reading order. tools/build-site.cjs turns this into index.html (one tile per
// page) and the "previous / next" links at the bottom of every page. Replace the example with your own.
module.exports = {
  site: {
    title: 'Microvis',                         // big title on the start page
    pageTitle: 'Microvis — Interactive figures', // <title> of the start page
    lead: 'Interactive figures for microeconomic theory. Move a parameter, and watch the economics respond.',
    note: '<b>Work in progress.</b> The tools are still being developed and checked. Feedback of any kind is very welcome.',
    footer: 'Your Name'
  },
  // One section per chapter or lecture. Each page: [folder, title, one-sentence description, advanced?]
  sections: [
    { id: 'l1', label: 'Lecture 1', nav: 'Production', title: 'Production theory', pages: [
      ['example-tool', 'Example Tool', 'One slider, one curve, one live number: the smallest page in this style.']
    ] }
  ]
};
