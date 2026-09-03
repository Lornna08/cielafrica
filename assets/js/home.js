/* Home page: populate teasers from data files */
(function () {
  const $ = (s) => document.querySelector(s);

  const tpl = $('#tpl-teaser');
  if (tpl && CIEL.templates) tpl.innerHTML = CIEL.templates.slice(0, 6).map((t, i) => CIEL.templateCard(t, i)).join('');

  const prd = $('#prd-teaser');
  if (prd && CIEL.products) prd.innerHTML = CIEL.products.slice(0, 3).map((p, i) => CIEL.productCard(p, i)).join('');

  const work = $('#work-teaser');
  if (work && CIEL.work) work.innerHTML = CIEL.work.slice(0, 4).map((w, i) => CIEL.workCard(w, i)).join('');

  const posts = $('#insights-teaser');
  if (posts && CIEL.insights) posts.innerHTML = CIEL.insights.slice(0, 3).map((p, i) => CIEL.postCard(p, i)).join('');

  const tech = $('#tech-cloud');
  if (tech) tech.innerHTML = CIEL.techChips();

  CIEL.observeReveals(document);
})();
