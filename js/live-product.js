// ─── Live product sync from Firebase ───
// On product pages: reads current price/stock/visibility and updates the display
// If product is hidden, shows an "out of stock" notice

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

  // Get product slug from URL
  function getSlug() {
    const path = window.location.pathname;
    const file = path.split('/').pop() || '';
    return file.replace('.html', '');
  }

  async function fetchProduct(slug) {
    try {
      const [{ initializeApp }, { getFirestore, doc, getDoc }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      const snap = await getDoc(doc(db, 'products', slug));
      if (!snap.exists()) return null;
      return snap.data();
    } catch (e) {
      console.warn('Product fetch failed:', e);
      return null;
    }
  }

  function fmt(n) {
    return new Intl.NumberFormat('en-US').format(n);
  }

  function updatePrice(price) {
    const priceMain = document.getElementById('priceMain');
    if (priceMain) priceMain.textContent = fmt(price);
    const priceMonthly = document.getElementById('priceMonthly');
    if (priceMonthly) priceMonthly.textContent = fmt(Math.round(price / 24)) + ' EGP';
    const priceMeta = document.querySelector('meta[property="product:price:amount"]');
    if (priceMeta) priceMeta.content = String(price);
  }

  function showOutOfStock() {
    // Add a banner near the buy buttons
    const actions = document.querySelector('.actions');
    if (!actions) return;
    if (document.getElementById('oos-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'oos-banner';
    banner.style.cssText = 'background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.35);color:#c0392b;padding:14px 18px;border-radius:12px;font-size:14px;font-weight:600;text-align:center;margin-bottom:14px';
    banner.textContent = '⚠️ المنتج ده غير متاح حاليًا';
    actions.parentNode.insertBefore(banner, actions);

    // Disable buy buttons
    document.querySelectorAll('.actions .btn, [data-buy]').forEach(b => {
      b.disabled = true;
      b.style.opacity = '.4';
      b.style.cursor = 'not-allowed';
      b.style.pointerEvents = 'none';
    });
  }

  function showLowStock(stock) {
    const actions = document.querySelector('.actions');
    if (!actions) return;
    if (document.getElementById('stock-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'stock-banner';
    banner.style.cssText = 'background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.35);color:#b87b15;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;text-align:center;margin-bottom:14px';
    banner.textContent = `⚡ متبقي ${stock} قطعة فقط — اطلب دلوقتي`;
    actions.parentNode.insertBefore(banner, actions);
  }

  async function init() {
    const slug = getSlug();
    if (!slug) return;
    const product = await fetchProduct(slug);
    if (!product) return;

    // Hidden product? Show OOS
    if (product.isVisible === false || product.stock === 0) {
      showOutOfStock();
      return;
    }

    // Update price if different
    if (typeof product.price === 'number' && product.price > 0) {
      updatePrice(product.price);
    }

    // Show low stock warning
    if (typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5) {
      showLowStock(product.stock);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
