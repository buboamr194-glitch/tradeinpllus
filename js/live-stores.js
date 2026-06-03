// ─── Live stores sync from Firebase ───
// On index.html: reads current stores data and updates the branch cards

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

  async function fetchStores() {
    try {
      const [{ initializeApp }, { getFirestore, collection, getDocs }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'stores'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Stores fetch failed:', e);
      return null;
    }
  }

  function updateStoreCards(stores) {
    const cards = document.querySelectorAll('.store-card--featured');
    if (cards.length === 0) return;

    // Sort stores: main first, then others
    const sorted = [...stores].sort((a, b) => {
      if (a.id === 'store-main') return -1;
      if (b.id === 'store-main') return 1;
      return 0;
    });

    cards.forEach((card, i) => {
      const store = sorted[i];
      if (!store) {
        card.style.display = store?.active === false ? 'none' : '';
        return;
      }

      // Update iframe map
      const iframe = card.querySelector('iframe');
      if (iframe && store.lat && store.lng) {
        const newSrc = `https://maps.google.com/maps?q=${store.lat},${store.lng}&z=16&hl=ar&output=embed`;
        if (iframe.src !== newSrc) iframe.src = newSrc;
      }

      // Update badge
      const badge = card.querySelector('.store-badge');
      if (badge && store.badge) badge.textContent = store.badge;

      // Update name
      const name = card.querySelector('.store-name');
      if (name) name.textContent = store.name || store.nameAr || '';

      // Update address
      const address = card.querySelector('.store-address');
      if (address && store.address) address.textContent = store.address;

      // Update hours
      const hours = card.querySelector('.store-hours');
      if (hours && store.hours) hours.textContent = 'Open: ' + store.hours + ' Daily';

      // Update directions link
      const dir = card.querySelector('.store-directions');
      if (dir && store.lat && store.lng) {
        dir.href = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
      }

      // Hide if inactive
      card.style.display = store.active === false ? 'none' : '';
    });
  }

  async function init() {
    const stores = await fetchStores();
    if (!stores || stores.length === 0) return;
    updateStoreCards(stores);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
