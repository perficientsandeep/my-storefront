export default async function decorate(block) {
  const COVEO_TOKEN = COVEO_TOKEN;
  const endpoint = 'https://platform.cloud.coveo.com/rest/search/v2?mlParameters=%7B%22itemId%22%3A%22%22%7D';

  const payload = {
    searchHub: 'BarcoProducts_US - Recommendations',
    locale: 'en',
    pipeline: 'BarcoProductRecommendations',
    numberOfResults: 10,
    firstResult: 0,
    sortCriteria: 'relevancy', // REQUIRED – “mostPopular” is invalid
    enableDidYouMean: false,
    retrieveFirstSentences: true,
    enableQuerySyntax: false,
    enableDuplicateFiltering: false,
    allowQueriesWithoutKeywords: true, // REQUIRED for recommendations
    context: {
      context_type: 'user_recommender',
      base_url: window.location.href,
    },
    actionCause: 'recommendationInterfaceLoad',
    originContext: 'Search',
    debug: false,
  };

  // --- Fetch ---
  let data;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Authorization: `Bearer ${COVEO_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    data = await response.json();
    console.log('ACO → Coveo Popular Items Response:', data);
  } catch (error) {
    console.error('Coveo Popular Items request failed:', error);
    block.textContent = 'Unable to load products.';
    return;
  }

  if (!data.results || data.results.length === 0) {
    block.textContent = 'No products found.';
    return;
  }

  // --- Parse products ---
  const products = data.results.map((r) => ({
    title: r.title,
    url: r.raw?.cat_url_key,
    image: r.raw?.ec_images,
    price: r.raw?.ec_price,
    rating: r.raw?.cat_product_score,
    reviews: r.raw?.cat_total_reviews
  }));

  // --- Build DOM ---
  const wrapper = document.createElement('div');
  wrapper.className = 'popular-items-wrapper';

  const heading = document.createElement('h2');
  heading.className = 'popular-items-title';
  heading.textContent = 'Popular Items';
  wrapper.appendChild(heading);

  const scroller = document.createElement('div');
  scroller.className = 'popular-items-scroller';

  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'popular-item-card';

    card.innerHTML = `
      <div><img src="${p.image ?? ''}" width="200px" height="200px"/> </div>
      <div class="popular-item-rating">
        ${'★'.repeat(Math.round(p.rating || 0))}
        ${'☆'.repeat(5 - Math.round(p.rating || 0))}
        <span class="popular-item-reviews">(${p.reviews ?? 0})</span>
      </div>
      <div class="popular-item-price">As low as <strong>$${p.price}</strong></div>
      <div class="popular-item-title"><a href="${p.url}">${p.title}</a></div>
    `;

    scroller.appendChild(card);
  });

  wrapper.appendChild(scroller);
  block.innerHTML = '';
  block.appendChild(wrapper);
}
