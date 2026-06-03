// ─── Order System for tradeinplus ───
// Standalone form (no module imports at top to avoid breaking if Firebase CDN fails)

(function(){
  'use strict';

  const WHATSAPP_NUMBER = '201112214212';
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAWfHruX62nXJwCi-sGWKgHW58w0sYvgMc",
    authDomain: "tradeinplus-ecc07.firebaseapp.com",
    projectId: "tradeinplus-ecc07",
    storageBucket: "tradeinplus-ecc07.firebasestorage.app",
    messagingSenderId: "396037571839",
    appId: "1:396037571839:web:20e5d4f5125636559d78ca"
  };

  // ─── Generate order number ───
  function genOrderNum() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return 'TI-' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
  }

  // ─── Lazy-load Firebase and save order ───
  async function saveOrderToFirebase(order) {
    try {
      const [{ initializeApp }, { getFirestore, collection, addDoc, serverTimestamp }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn('Firebase save failed:', e);
      return false;
    }
  }

  // ─── Send WhatsApp ───
  function sendWhatsApp(order) {
    const msg = encodeURIComponent(
      `🛒 طلب جديد!\n` +
      `رقم الطلب: ${order.orderNumber}\n` +
      `المنتج: ${order.productName}\n` +
      `المواصفات: ${order.variant || '-'}\n` +
      `السعر: ${order.price} EGP\n` +
      `───────────\n` +
      `الاسم: ${order.customerName}\n` +
      `الرقم: ${order.customerPhone}\n` +
      `العنوان: ${order.customerAddress}\n` +
      `المدينة: ${order.customerCity}\n` +
      `الدفع: ${order.paymentMethod}\n` +
      `ملاحظات: ${order.notes || 'لا يوجد'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  }

  // ─── CSS ───
  function injectStyles() {
    if (document.getElementById('checkout-styles')) return;
    const style = document.createElement('style');
    style.id = 'checkout-styles';
    style.textContent = `
      #checkout-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:2147483647;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .35s;padding:16px;font-family:'Cairo',-apple-system,sans-serif;direction:rtl}
      #checkout-overlay.show{opacity:1;pointer-events:auto}
      #checkout-box{background:linear-gradient(145deg,#1a1a1f,#0d0d10);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:32px 28px 28px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;position:relative;transform:translateY(20px) scale(.97);transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
      #checkout-overlay.show #checkout-box{transform:none}
      #checkout-close{position:absolute;top:14px;left:14px;background:rgba(255,255,255,.08);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;color:rgba(255,255,255,.7);font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:1}
      #checkout-close:hover{background:rgba(255,255,255,.16);color:#fff}
      .checkout-title{color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;text-align:center}
      .checkout-subtitle{color:rgba(255,255,255,.5);font-size:13px;text-align:center;margin:0 0 24px}
      .checkout-product{display:flex;align-items:center;gap:14px;padding:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;margin-bottom:20px}
      .checkout-product img{width:56px;height:56px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.05)}
      .checkout-product-info{flex:1;min-width:0}
      .checkout-product-name{color:#fff;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .checkout-product-variant{color:rgba(255,255,255,.5);font-size:12px;margin-top:2px}
      .checkout-product-price{color:#56e39a;font-size:16px;font-weight:700;white-space:nowrap}
      .checkout-field{margin-bottom:14px}
      .checkout-field label{display:block;color:rgba(255,255,255,.65);font-size:12.5px;font-weight:600;margin-bottom:6px}
      .checkout-field input,.checkout-field select,.checkout-field textarea{width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box}
      .checkout-field input:focus,.checkout-field select:focus,.checkout-field textarea:focus{border-color:rgba(86,227,154,.7)}
      .checkout-field input::placeholder,.checkout-field textarea::placeholder{color:rgba(255,255,255,.3)}
      .checkout-field select{cursor:pointer;-webkit-appearance:none;appearance:none}
      .checkout-field select option{background:#1a1a1f;color:#fff}
      .checkout-field textarea{resize:vertical;min-height:60px}
      .checkout-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .checkout-submit{width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#1d7a4e,#155c3a);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;margin-top:8px;transition:transform .2s}
      .checkout-submit:hover{transform:translateY(-2px)}
      .checkout-submit:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .checkout-success{text-align:center;padding:30px 10px}
      .checkout-success svg{width:64px;height:64px;color:#56e39a;margin-bottom:16px}
      .checkout-success h3{color:#fff;font-size:20px;font-weight:700;margin:0 0 8px}
      .checkout-success p{color:rgba(255,255,255,.6);font-size:14px;margin:0 0 6px}
      .checkout-success .order-num{color:#56e39a;font-size:18px;font-weight:700;direction:ltr;margin:12px 0}
    `;
    document.head.appendChild(style);
  }

  // ─── Build modal ───
  function buildModal(product) {
    return `
      <div id="checkout-overlay" role="dialog" aria-modal="true">
        <div id="checkout-box">
          <button type="button" id="checkout-close" aria-label="إغلاق">&times;</button>
          <h2 class="checkout-title">إتمام الطلب</h2>
          <p class="checkout-subtitle">هنتواصل معاك لتأكيد الطلب</p>
          <div class="checkout-product">
            ${product.image ? `<img src="${product.image}" alt="" onerror="this.style.display='none'">` : ''}
            <div class="checkout-product-info">
              <div class="checkout-product-name">${product.name}</div>
              <div class="checkout-product-variant">${product.variant || ''}</div>
            </div>
            <div class="checkout-product-price">${product.price} EGP</div>
          </div>
          <form id="checkout-form">
            <div class="checkout-field">
              <label>الاسم بالكامل *</label>
              <input type="text" name="customerName" required placeholder="محمد أحمد">
            </div>
            <div class="checkout-row">
              <div class="checkout-field">
                <label>رقم الموبايل *</label>
                <input type="tel" name="customerPhone" required placeholder="01xxxxxxxxx" dir="ltr">
              </div>
              <div class="checkout-field">
                <label>المدينة *</label>
                <input type="text" name="customerCity" required placeholder="الإسكندرية">
              </div>
            </div>
            <div class="checkout-field">
              <label>البريد الإلكتروني (لإيميل التأكيد)</label>
              <input type="email" name="customerEmail" placeholder="you@example.com" dir="ltr">
            </div>
            <div class="checkout-field">
              <label>العنوان بالتفصيل *</label>
              <input type="text" name="customerAddress" required placeholder="الحي، الشارع، العمارة">
            </div>
            <div class="checkout-field">
              <label>طريقة الدفع *</label>
              <select name="paymentMethod" required>
                <option value="cash">كاش عند الاستلام</option>
                <option value="vodafone_cash">فودافون كاش</option>
                <option value="instapay">إنستاباي</option>
              </select>
            </div>
            <div class="checkout-field">
              <label>ملاحظات (اختياري)</label>
              <textarea name="notes" placeholder="أي تفاصيل إضافية..."></textarea>
            </div>
            <button type="submit" class="checkout-submit" id="checkout-submit-btn">تأكيد الطلب</button>
          </form>
        </div>
      </div>
    `;
  }

  // ─── Open / Close ───
  function openCheckout(product) {
    injectStyles();
    const old = document.getElementById('checkout-overlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', buildModal(product));
    const overlay = document.getElementById('checkout-overlay');
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));
    document.getElementById('checkout-close').addEventListener('click', closeCheckout);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCheckout(); });
    document.addEventListener('keydown', escHandler);

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('checkout-submit-btn');
      btn.disabled = true;
      btn.textContent = 'جاري تسجيل الطلب...';
      const fd = new FormData(e.target);
      const orderNumber = genOrderNum();
      const orderData = {
        orderNumber,
        productName: product.name,
        productSlug: product.slug || '',
        variant: product.variant || '',
        price: product.price,
        image: product.image,
        customerName: fd.get('customerName'),
        customerPhone: fd.get('customerPhone'),
        customerCity: fd.get('customerCity'),
        customerAddress: fd.get('customerAddress'),
        customerEmail: fd.get('customerEmail') || '',
        paymentMethod: fd.get('paymentMethod'),
        notes: fd.get('notes') || '',
        status: 'new'
      };
      await saveOrderToFirebase(orderData);
      // Send confirmation email (silently fails if EmailJS not configured)
      if (window.__tipEmail && orderData.customerEmail) {
        window.__tipEmail.sendOrderConfirmation(orderData).catch(()=>{});
      }
      showSuccess(orderNumber);
      setTimeout(() => sendWhatsApp(orderData), 1500);
    });
  }

  function showSuccess(orderNumber) {
    const box = document.getElementById('checkout-box');
    box.innerHTML = `
      <button type="button" id="checkout-close" aria-label="إغلاق">&times;</button>
      <div class="checkout-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <h3>تم تسجيل طلبك بنجاح!</h3>
        <p>رقم الطلب</p>
        <div class="order-num">${orderNumber}</div>
        <p>هنتواصل معاك قريب لتأكيد الطلب</p>
      </div>
    `;
    document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  }

  function closeCheckout() {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 400);
    }
    document.removeEventListener('keydown', escHandler);
  }
  function escHandler(e) { if (e.key === 'Escape') closeCheckout(); }

  // ─── Intercept all buy buttons (use capture phase + stopImmediatePropagation) ───
  function isBuyButton(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    if (tag !== 'BUTTON' && tag !== 'A') return false;
    const txt = (el.textContent || '').trim();
    return txt === 'اشتري الآن' || txt.includes('اشتري الآن');
  }

  // Global capture-phase click handler — runs BEFORE inline page handlers
  document.addEventListener('click', function(e) {
    let el = e.target;
    while (el && el !== document.body) {
      if (isBuyButton(el)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        // Gather product info
        const name = (document.querySelector('.phero-product-name')?.textContent ||
                      document.querySelector('h1')?.textContent ||
                      document.title.split('|')[0] || 'منتج').trim();
        const priceEl = document.getElementById('priceMain');
        const price = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0';
        const imgEl = document.querySelector('.product-photo, img.product-photo, .phero-image img');
        const image = imgEl ? imgEl.src : '';
        const activeColor = document.querySelector('.color-swatch[aria-checked="true"]');
        const activeStorage = document.querySelector('.storage-opt[aria-checked="true"]');
        const variant = [
          activeColor ? (activeColor.getAttribute('aria-label') || activeColor.dataset.color || '') : '',
          activeStorage ? (activeStorage.dataset.storage || activeStorage.textContent.trim()) : ''
        ].filter(Boolean).join(' · ');
        const slug = window.location.pathname.split('/').pop()?.replace('.html', '') || '';

        openCheckout({ name, price, image, variant, slug });
        return false;
      }
      el = el.parentNode;
    }
  }, true); // capture = true → runs before bubbling handlers

  // Also hide the old InstaPay gateway permanently if it shows up
  const observer = new MutationObserver(() => {
    document.querySelectorAll('[data-instapay-gateway]').forEach(g => {
      if (!g.hidden) g.hidden = true;
    });
  });
  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['hidden'] });

  // Expose for debugging
  window.__tipOrder = { openCheckout, closeCheckout };
})();
