// ─── Shopping cart for tradeinplus ───
// Persistent cart in localStorage, floating cart button, cart drawer, checkout integration

(function(){
  'use strict';

  const STORAGE_KEY = 'tip_cart_v1';
  const WHATSAPP_NUMBER = '201112214212';
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAWfHruX62nXJwCi-sGWKgHW58w0sYvgMc",
    authDomain: "tradeinplus-ecc07.firebaseapp.com",
    projectId: "tradeinplus-ecc07",
    storageBucket: "tradeinplus-ecc07.firebasestorage.app",
    messagingSenderId: "396037571839",
    appId: "1:396037571839:web:20e5d4f5125636559d78ca"
  };

  // ─── Cart state ───
  function readCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateCartCount();
    window.dispatchEvent(new CustomEvent('cart-changed'));
  }
  function cartCount() {
    return readCart().reduce((s, i) => s + (i.qty || 1), 0);
  }
  function cartTotal() {
    return readCart().reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  }
  function addToCart(item) {
    const cart = readCart();
    // If same slug+variant exists, increment qty
    const idx = cart.findIndex(c => c.slug === item.slug && c.variant === item.variant);
    if (idx >= 0) {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    writeCart(cart);
  }
  function removeFromCart(idx) {
    const cart = readCart();
    cart.splice(idx, 1);
    writeCart(cart);
  }
  function updateQty(idx, qty) {
    const cart = readCart();
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = qty;
    writeCart(cart);
  }
  function clearCart() {
    writeCart([]);
  }
  function fmt(n) { return new Intl.NumberFormat('en-US').format(n); }

  // ─── Styles ───
  function injectStyles() {
    if (document.getElementById('cart-styles')) return;
    const style = document.createElement('style');
    style.id = 'cart-styles';
    style.textContent = `
      /* Floating cart button */
      #tip-cart-fab{position:fixed;bottom:28px;left:28px;z-index:9998;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#0a0a0a 0%,#1f1f24 100%);color:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.35);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
      #tip-cart-fab:hover{transform:scale(1.08)}
      #tip-cart-fab svg{width:24px;height:24px}
      #tip-cart-fab .badge{position:absolute;top:-4px;right:-4px;background:#dc2743;color:#fff;font-size:11px;font-weight:800;min-width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;padding:0 6px;font-family:'Outfit',sans-serif;border:2px solid #fff}
      #tip-cart-fab[data-count="0"] .badge{display:none}
      @media (max-width:640px){#tip-cart-fab{bottom:90px;left:18px;width:54px;height:54px}#tip-cart-fab svg{width:22px;height:22px}}

      /* Drawer */
      #tip-cart-drawer{position:fixed;inset:0;z-index:99996;display:flex;justify-content:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity .35s}
      #tip-cart-drawer.show{opacity:1;pointer-events:auto}
      #tip-cart-panel{background:linear-gradient(145deg,#1a1a1f,#0d0d10);width:min(420px,100%);height:100%;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .4s cubic-bezier(.16,1,.3,1);font-family:'Cairo','Outfit',sans-serif;direction:rtl}
      html[dir="ltr"] #tip-cart-panel{transform:translateX(100%)}
      #tip-cart-drawer.show #tip-cart-panel{transform:translateX(0)}
      .tip-cart-head{padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between}
      .tip-cart-head h2{color:#fff;font-size:18px;font-weight:700;margin:0}
      .tip-cart-close{background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.7);width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:background .2s}
      .tip-cart-close:hover{background:rgba(255,255,255,.16);color:#fff}
      .tip-cart-body{flex:1;overflow-y:auto;padding:16px 20px}
      .tip-cart-body::-webkit-scrollbar{width:5px}
      .tip-cart-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
      .tip-cart-item{display:flex;gap:12px;padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:12px}
      .tip-cart-item img{width:60px;height:60px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.06);flex-shrink:0}
      .tip-cart-item-info{flex:1;min-width:0}
      .tip-cart-item-name{color:#fff;font-size:13.5px;font-weight:600;line-height:1.3}
      .tip-cart-item-variant{color:rgba(255,255,255,.5);font-size:11.5px;margin-top:2px}
      .tip-cart-item-price{color:#56e39a;font-size:14px;font-weight:700;margin-top:6px;font-family:'Outfit',sans-serif;direction:ltr;text-align:right}
      .tip-cart-item-actions{display:flex;align-items:center;gap:6px;margin-top:8px}
      .tip-qty{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border-radius:8px;padding:2px}
      .tip-qty button{width:24px;height:24px;border-radius:6px;border:none;background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700}
      .tip-qty button:hover{background:rgba(255,255,255,.1)}
      .tip-qty span{color:#fff;font-size:13px;font-weight:600;min-width:18px;text-align:center;font-family:'Outfit',sans-serif}
      .tip-remove{background:none;border:none;color:rgba(255,107,107,.7);cursor:pointer;font-size:12px;font-weight:600;padding:4px 8px;border-radius:6px;margin-right:auto;transition:color .2s}
      .tip-remove:hover{color:#ff6b6b;background:rgba(255,107,107,.08)}
      .tip-cart-empty{text-align:center;padding:60px 20px;color:rgba(255,255,255,.4)}
      .tip-cart-empty svg{width:54px;height:54px;color:rgba(255,255,255,.2);margin-bottom:14px}
      .tip-cart-empty p{margin:0;font-size:14px}
      .tip-cart-foot{border-top:1px solid rgba(255,255,255,.08);padding:18px 24px 22px;background:rgba(0,0,0,.2)}
      .tip-cart-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
      .tip-cart-total .label{color:rgba(255,255,255,.6);font-size:13px}
      .tip-cart-total .value{color:#fff;font-size:22px;font-weight:800;font-family:'Outfit',sans-serif;direction:ltr}
      .tip-cart-checkout{width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#1d7a4e,#155c3a);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:transform .2s}
      .tip-cart-checkout:hover{transform:translateY(-2px)}
      .tip-cart-checkout:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .tip-cart-clear{display:block;margin:10px auto 0;background:none;border:none;color:rgba(255,107,107,.7);font-size:12px;cursor:pointer;padding:4px 10px;border-radius:6px}
      .tip-cart-clear:hover{color:#ff6b6b}

      /* Cart icon in header */
      a[href*="cart"] .header-cart-badge,
      .nav-icon .header-cart-badge{position:absolute;top:0;right:-2px;background:#dc2743;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid currentColor}

      /* "Added to cart" toast */
      #tip-cart-toast{position:fixed;top:24px;left:50%;transform:translate(-50%,-100px);background:linear-gradient(135deg,#1d7a4e,#155c3a);color:#fff;padding:14px 22px;border-radius:14px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,.4);z-index:99999;display:flex;align-items:center;gap:10px;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .3s;opacity:0;pointer-events:none}
      #tip-cart-toast.show{transform:translate(-50%,0);opacity:1}
      #tip-cart-toast svg{width:20px;height:20px;flex-shrink:0}
    `;
    document.head.appendChild(style);
  }

  // ─── UI ───
  function buildFab() {
    if (document.getElementById('tip-cart-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'tip-cart-fab';
    btn.setAttribute('aria-label', 'سلة المشتريات');
    btn.dataset.count = String(cartCount());
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
      </svg>
      <span class="badge">${cartCount()}</span>
    `;
    btn.addEventListener('click', openDrawer);
    document.body.appendChild(btn);
  }

  function updateCartCount() {
    const fab = document.getElementById('tip-cart-fab');
    if (fab) {
      const c = cartCount();
      fab.dataset.count = String(c);
      const badge = fab.querySelector('.badge');
      if (badge) badge.textContent = String(c);
    }
  }

  function buildDrawer() {
    if (document.getElementById('tip-cart-drawer')) return document.getElementById('tip-cart-drawer');
    const wrap = document.createElement('div');
    wrap.id = 'tip-cart-drawer';
    wrap.innerHTML = `
      <div id="tip-cart-panel">
        <div class="tip-cart-head">
          <h2>سلة المشتريات</h2>
          <button class="tip-cart-close" aria-label="إغلاق">&times;</button>
        </div>
        <div class="tip-cart-body" id="tip-cart-body"></div>
        <div class="tip-cart-foot" id="tip-cart-foot"></div>
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.querySelector('.tip-cart-close').addEventListener('click', closeDrawer);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) closeDrawer(); });
    return wrap;
  }

  function renderCart() {
    const body = document.getElementById('tip-cart-body');
    const foot = document.getElementById('tip-cart-foot');
    if (!body || !foot) return;
    const items = readCart();
    if (items.length === 0) {
      body.innerHTML = `
        <div class="tip-cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
          </svg>
          <p>السلة فاضية</p>
        </div>
      `;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map((item, i) => `
      <div class="tip-cart-item">
        ${item.image ? `<img src="${item.image}" alt="" onerror="this.style.display='none'">` : ''}
        <div class="tip-cart-item-info">
          <div class="tip-cart-item-name">${item.name}</div>
          ${item.variant ? `<div class="tip-cart-item-variant">${item.variant}</div>` : ''}
          <div class="tip-cart-item-price">${fmt(item.price)} EGP</div>
          <div class="tip-cart-item-actions">
            <div class="tip-qty">
              <button data-act="dec" data-idx="${i}">−</button>
              <span>${item.qty || 1}</span>
              <button data-act="inc" data-idx="${i}">+</button>
            </div>
            <button class="tip-remove" data-act="del" data-idx="${i}">حذف</button>
          </div>
        </div>
      </div>
    `).join('');
    const total = cartTotal();
    foot.innerHTML = `
      <div class="tip-cart-total">
        <span class="label">الإجمالي</span>
        <span class="value">${fmt(total)} EGP</span>
      </div>
      <button class="tip-cart-checkout" id="tip-cart-checkout-btn">تأكيد الطلب</button>
      <button class="tip-cart-clear" id="tip-cart-clear-btn">إفراغ السلة</button>
    `;

    body.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.idx);
        const act = b.dataset.act;
        if (act === 'inc') updateQty(idx, (items[idx].qty || 1) + 1);
        if (act === 'dec') updateQty(idx, (items[idx].qty || 1) - 1);
        if (act === 'del') removeFromCart(idx);
        renderCart();
      });
    });
    document.getElementById('tip-cart-checkout-btn').addEventListener('click', openCartCheckout);
    document.getElementById('tip-cart-clear-btn').addEventListener('click', () => {
      if (confirm('متأكد إنك عايز تفرّغ السلة؟')) { clearCart(); renderCart(); }
    });
  }

  function openDrawer() {
    injectStyles();
    const drawer = buildDrawer();
    renderCart();
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('show')));
  }
  function closeDrawer() {
    const drawer = document.getElementById('tip-cart-drawer');
    if (drawer) drawer.classList.remove('show');
  }

  function showToast(msg) {
    let toast = document.getElementById('tip-cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tip-cart-toast';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span></span>
      `;
      document.body.appendChild(toast);
    }
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ─── Wire "Add to cart" button on product pages ───
  function gatherCurrentProduct() {
    const name = (document.querySelector('.phero-product-name')?.textContent ||
                  document.querySelector('h1')?.textContent ||
                  document.title.split('|')[0] || 'منتج').trim();
    const priceEl = document.getElementById('priceMain');
    const price = priceEl ? Number(priceEl.textContent.replace(/[^0-9]/g, '')) : 0;
    const imgEl = document.querySelector('.product-photo, .phero-image img');
    const image = imgEl ? imgEl.src : '';
    const activeColor = document.querySelector('.color-swatch[aria-checked="true"]');
    const activeStorage = document.querySelector('.storage-opt[aria-checked="true"]');
    const variant = [
      activeColor ? (activeColor.getAttribute('aria-label') || activeColor.dataset.color || '') : '',
      activeStorage ? (activeStorage.dataset.storage || activeStorage.textContent.trim()) : ''
    ].filter(Boolean).join(' · ');
    const slug = window.location.pathname.split('/').pop()?.replace('.html', '') || '';
    return { slug, name, price, image, variant };
  }

  // Intercept "أضف إلى السلة" buttons (capture phase, prevents existing handlers)
  document.addEventListener('click', function(e) {
    let el = e.target;
    while (el && el !== document.body) {
      if ((el.tagName === 'BUTTON' || el.tagName === 'A') && (el.textContent || '').includes('أضف إلى السلة')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const product = gatherCurrentProduct();
        if (product.price > 0) {
          addToCart(product);
          showToast('تم إضافة المنتج للسلة');
        }
        return;
      }
      el = el.parentNode;
    }
  }, true);

  // ─── Cart checkout: collect customer info, save multi-item order to Firebase ───
  async function openCartCheckout() {
    const items = readCart();
    if (items.length === 0) return;
    const total = cartTotal();

    // Build a checkout overlay (same look as order-system)
    if (document.getElementById('cart-checkout-overlay')) {
      document.getElementById('cart-checkout-overlay').remove();
    }

    const html = `
      <div id="cart-checkout-overlay" role="dialog" aria-modal="true" style="position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:99997;display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Cairo',sans-serif;direction:rtl">
        <div id="cart-checkout-box" style="background:linear-gradient(145deg,#1a1a1f,#0d0d10);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:30px 26px 26px;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;position:relative">
          <button type="button" id="cart-checkout-close" aria-label="إغلاق" style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,.08);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;color:#fff;font-size:18px">&times;</button>
          <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;text-align:center">إتمام الطلب</h2>
          <p style="color:rgba(255,255,255,.55);font-size:13px;text-align:center;margin:0 0 18px">${items.length} منتج · ${fmt(total)} EGP</p>

          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;margin-bottom:18px;max-height:170px;overflow-y:auto">
            ${items.map(i => `
              <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12.5px">
                ${i.image ? `<img src="${i.image}" style="width:34px;height:34px;border-radius:8px;object-fit:contain;background:rgba(255,255,255,.05)" onerror="this.style.display='none'">` : ''}
                <div style="flex:1;color:#fff">${i.name}${i.variant ? ` <span style="color:rgba(255,255,255,.5);font-size:11px">(${i.variant})</span>` : ''} <span style="color:rgba(255,255,255,.5)">× ${i.qty || 1}</span></div>
                <div style="color:#56e39a;font-weight:700;font-family:'Outfit',sans-serif;direction:ltr">${fmt((i.price||0)*(i.qty||1))}</div>
              </div>
            `).join('')}
          </div>

          <form id="cart-checkout-form" style="display:flex;flex-direction:column;gap:12px">
            <input type="text" name="customerName" required placeholder="الاسم بالكامل *" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <input type="tel" name="customerPhone" required placeholder="01xxxxxxxxx *" dir="ltr" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
              <input type="text" name="customerCity" required placeholder="المدينة *" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
            </div>
            <input type="email" name="customerEmail" placeholder="البريد الإلكتروني (لإيميل التأكيد)" dir="ltr" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
            <input type="text" name="customerAddress" required placeholder="العنوان بالتفصيل *" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
            <select name="paymentMethod" required style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit">
              <option value="cash">كاش عند الاستلام</option>
              <option value="vodafone_cash">فودافون كاش</option>
              <option value="instapay">إنستاباي</option>
            </select>
            <textarea name="notes" placeholder="ملاحظات (اختياري)" style="padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;font-family:inherit;min-height:60px;resize:vertical"></textarea>
            <button type="submit" id="cart-checkout-submit" style="padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#1d7a4e,#155c3a);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:6px">تأكيد الطلب (${fmt(total)} EGP)</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('cart-checkout-overlay');
    document.getElementById('cart-checkout-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('cart-checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('cart-checkout-submit');
      btn.disabled = true;
      btn.textContent = 'جاري تسجيل الطلب...';
      const fd = new FormData(e.target);

      const orderNumber = 'TI-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
      const productNames = items.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty || 1}`).join(' · ');
      const orderData = {
        orderNumber,
        productName: productNames,
        productSlug: items.map(i => i.slug).join(','),
        variant: '',
        price: total,
        image: items[0]?.image || '',
        items: items,
        customerName: fd.get('customerName'),
        customerPhone: fd.get('customerPhone'),
        customerCity: fd.get('customerCity'),
        customerAddress: fd.get('customerAddress'),
        customerEmail: fd.get('customerEmail') || '',
        paymentMethod: fd.get('paymentMethod'),
        notes: fd.get('notes') || '',
        status: 'new'
      };

      try {
        const [{ initializeApp }, { getFirestore, collection, addDoc, serverTimestamp }] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
        ]);
        const app = initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app);
        await addDoc(collection(db, 'orders'), { ...orderData, createdAt: serverTimestamp() });
      } catch (err) {
        console.warn('Firebase save failed:', err);
      }

      // Send confirmation email (silently fails if EmailJS not configured)
      if (window.__tipEmail && orderData.customerEmail) {
        window.__tipEmail.sendOrderConfirmation(orderData).catch(()=>{});
      }

      // Success screen
      document.getElementById('cart-checkout-box').innerHTML = `
        <div style="text-align:center;padding:30px 10px">
          <svg viewBox="0 0 24 24" fill="none" stroke="#56e39a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:64px;height:64px;margin-bottom:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h3 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">تم تسجيل طلبك بنجاح!</h3>
          <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0 0 6px">رقم الطلب</p>
          <div style="color:#56e39a;font-size:18px;font-weight:700;font-family:'Outfit',sans-serif;direction:ltr;margin:12px 0">${orderNumber}</div>
          <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0">هنتواصل معاك قريب لتأكيد الطلب</p>
        </div>
      `;

      // Empty cart + open WhatsApp
      clearCart();
      setTimeout(() => {
        const msg = encodeURIComponent(
          `🛒 طلب سلة جديد!\n` +
          `رقم الطلب: ${orderNumber}\n` +
          `عدد المنتجات: ${items.length}\n` +
          `الإجمالي: ${fmt(total)} EGP\n\n` +
          `الأصناف:\n${productNames}\n\n` +
          `───────────\n` +
          `الاسم: ${orderData.customerName}\n` +
          `الرقم: ${orderData.customerPhone}\n` +
          `العنوان: ${orderData.customerAddress}\n` +
          `المدينة: ${orderData.customerCity}\n` +
          `الدفع: ${orderData.paymentMethod}\n` +
          `ملاحظات: ${orderData.notes || 'لا يوجد'}`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
      }, 1500);
    });
  }

  // ─── Init ───
  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFab);
  } else {
    buildFab();
  }

  // Expose
  window.__tipCart = { add: addToCart, count: cartCount, open: openDrawer };
})();
