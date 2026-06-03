// ─── Live everywhere — sync ALL product cards on ANY page from Firebase ───
// Finds every link to products/SLUG.html, fetches that product, and:
//   • Updates the price displayed in the card
//   • Hides the card if the product is hidden (isVisible: false)
// Runs on: index.html, shop.html, and all product pages (for "related products")

(function(){
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAWfHruX62nXJwCi-sGWKgHW58w0sYvgMc",
    authDomain: "tradeinplus-ecc07.firebaseapp.com",
    projectId: "tradeinplus-ecc07",
    storageBucket: "tradeinplus-ecc07.firebasestorage.app",
    messagingSenderId: "396037571839",
    appId: "1:396037571839:web:20e5d4f5125636559d78ca"
  };

  function fmt(n) {
    return new Intl.NumberFormat('en-US').format(n);
  }

  async function fetchAllProducts() {
    try {
      const [{ initializeApp }, { getFirestore, collection, getDocs }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'products'));
      const map = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      return map;
    } catch (e) {
      console.warn('Products fetch failed:', e);
      return null;
    }
  }

  // Extract slug from href like "products/iphone-16-pro.html" or "../products/iphone-16-pro.html"
  function extractSlug(href) {
    if (!href) return null;
    const m = href.match(/products\/([^/?#]+)\.html/);
    return m ? m[1] : null;
  }

  // Try to find the best price element inside a card-like container
  function findPriceElement(container) {
    return (
      container.querySelector('.prod-price') ||
      container.querySelector('.related-price') ||
      container.querySelector('.card-price') ||
      container.querySelector('.price') ||
      container.querySelector('[data-price-display]') ||
      container.querySelector('.product-price') ||
      container.querySelector('.shop-card-price') ||
      container.querySelector('[class*="price"]')
    );
  }

  // Update the price text while keeping "EGP" span if present
  function setPrice(el, price) {
    if (!el) return;
    const egpSpan = el.querySelector('span[lang="en"]');
    if (egpSpan) {
      // Keep the EGP span; replace only the leading number text
      const newText = document.createTextNode(fmt(price) + ' ');
      // remove existing text nodes
      [...el.childNodes].forEach(n => { if (n.nodeType === 3) el.removeChild(n); });
      el.insertBefore(newText, egpSpan);
    } else {
      el.textContent = fmt(price) + ' EGP';
    }
  }

  // Find the "card" container that wraps an anchor — usually the <li> or the anchor itself
  function findCardContainer(anchor) {
    // Walk up: anchor → maybe a wrapper li/article/div
    let el = anchor;
    for (let i = 0; i < 4; i++) {
      if (!el) break;
      const tag = (el.tagName || '').toUpperCase();
      if (tag === 'LI' || tag === 'ARTICLE') return el;
      el = el.parentElement;
    }
    return anchor; // fallback
  }

  async function init() {
    const products = await fetchAllProducts();
    if (!products) return;

    // Find every link to a product page
    const links = document.querySelectorAll('a[href*="products/"]');

    links.forEach(a => {
      const slug = extractSlug(a.getAttribute('href') || '');
      if (!slug) return;
      const p = products[slug];
      if (!p) return;

      const card = findCardContainer(a);

      // Hide if invisible or out of stock
      if (p.isVisible === false || p.stock === 0) {
        // Hide only "shop card" / "related card" / list items. Skip nav links.
        const tag = (card.tagName || '').toUpperCase();
        if (tag === 'LI' || tag === 'ARTICLE' || card.classList?.contains('card')) {
          card.style.display = 'none';
        }
        return;
      }

      // Update price inside this card
      if (typeof p.price === 'number' && p.price > 0) {
        const priceEl = findPriceElement(card);
        if (priceEl) setPrice(priceEl, p.price);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
