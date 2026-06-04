// ─── Checkout Gateway — tradeinplus ───
// Single-source-of-truth checkout. White, Apple-inspired, 3-step flow.
// Recreated from design handoff (Checkout Gateway).
// Triggers on any "اشتري الآن" or [data-checkout] click.

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

  const STEPS = ['الشحن', 'الدفع', 'التأكيد'];
  const GOVS = [
    'القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية',
    'البحيرة','كفر الشيخ','الغربية','المنوفية','دمياط','بورسعيد',
    'الإسماعيلية','السويس','شمال سيناء','جنوب سيناء','البحر الأحمر',
    'مطروح','الفيوم','بني سويف','المنيا','أسيوط','سوهاج','قنا',
    'الأقصر','أسوان','الوادي الجديد'
  ];

  const METHODS = [
    { id:'wallet',   icon:'wallet',   t:'محفظة رقمية',           d:'فودافون كاش · أورنج · اتصالات', badge:'الأشهر' },
    { id:'instapay', icon:'instapay', t:'InstaPay',              d:'تحويل فوري من حسابك البنكي' },
    { id:'install',  icon:'card',     t:'تقسيط',                 d:'فالو · أمان · بنوك — حتى 24 شهر' },
    { id:'cod',      icon:'cash',     t:'الدفع عند الاستلام',     d:'كاش للمندوب (+ 25 ج رسوم خدمة)' }
  ];

  const ICON = {
    lock: '<path d="M3 11h18v10H3z"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    chevron: '<polyline points="15 18 9 12 15 6"/>',
    back: '<polyline points="9 18 15 12 9 6"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    wallet: '<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M16 13h.01"/>',
    instapay: '<path d="M22 11.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/><path d="M16 2l4 4-4 4"/><path d="M20 6H10"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
  };

  function svg(name, size, color, stroke) {
    return `<svg width="${size||20}" height="${size||20}" viewBox="0 0 24 24" fill="none" stroke="${color||'currentColor'}" stroke-width="${stroke||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]||''}</svg>`;
  }
  function fmt(n){ return new Intl.NumberFormat('en-US').format(Math.round(Number(n)||0)); }
  function digits(v){ return String(v||'').replace(/[^0-9]/g,''); }
  function genOrderNum(){ return 'TIP-' + Math.floor(100000 + Math.random()*900000); }

  // ─── State ───
  const state = {
    open: false,
    step: 0, // 0=ship, 1=pay, 2=confirm, 3=success
    method: 'wallet',
    plan: 12,
    prov: 'valu',
    promo: '',
    ship: { name:'', phone:'', gov:'القاهرة', city:'', landmark:'', addr:'', notes:'' },
    walletNumber: '',
    product: null,
    orderNumber: ''
  };

  function computeTotals() {
    const subtotal = (state.product?.price || 0) * 1;
    const shippingFee = state.method === 'cod' ? 60 : 0;
    const codFee      = state.method === 'cod' ? 25 : 0;
    const total = subtotal + shippingFee + codFee;
    const monthly = Math.round(total / state.plan);
    return { subtotal, shippingFee, codFee, total, monthly };
  }

  // ─── Firebase ───
  async function saveOrder(order) {
    try {
      const [{ initializeApp }, { getFirestore, collection, addDoc, serverTimestamp }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      await addDoc(collection(db, 'orders'), { ...order, createdAt: serverTimestamp() });
      return true;
    } catch (e) { console.warn('Firebase save failed:', e); return false; }
  }

  function sendWhatsApp(order) {
    const labels = { wallet:'محفظة رقمية', instapay:'InstaPay', install:`تقسيط ${state.plan} شهر`, cod:'الدفع عند الاستلام' };
    const lines = [
      `🛒 طلب جديد · tradeinplus`,
      `رقم الطلب: #${order.orderNumber}`,
      `المنتج: ${order.productName}`,
      order.variant ? `المواصفات: ${order.variant}` : null,
      `السعر: ${fmt(order.price)} EGP`,
      `الإجمالي: ${fmt(order.total)} EGP`,
      `─────────`,
      `الاسم: ${order.customerName}`,
      `الموبايل: ${order.customerPhone}`,
      `المحافظة: ${order.customerCity}`,
      order.customerArea ? `المدينة/الحي: ${order.customerArea}` : null,
      `العنوان: ${order.customerAddress}`,
      order.landmark ? `علامة مميزة: ${order.landmark}` : null,
      `طريقة الدفع: ${labels[order.paymentMethod] || order.paymentMethod}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, '_blank');
  }

  // ─── Styles (inline once) ───
  function injectStyles() {
    if (document.getElementById('ckt-styles')) return;
    const s = document.createElement('style');
    s.id = 'ckt-styles';
    s.textContent = `
      .ckt-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .25s;pointer-events:none;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif}
      .ckt-overlay.show{opacity:1;pointer-events:auto}
      .ckt{position:relative;background:#fff;color:#1d1d1f;min-height:100vh;line-height:1.5;-webkit-font-smoothing:antialiased;
        --ink:#1d1d1f;--gray:#6e6e73;--faint:#86868b;--line:#e5e5e8;--stage:#f5f5f7;--shot:#fdfdfd;--blue:#0071e3;--green:#1a8a4a;
        transform:translateY(20px);transition:transform .35s cubic-bezier(.22,1,.36,1)}
      .ckt-overlay.show .ckt{transform:none}
      .ckt *{box-sizing:border-box;margin:0;padding:0;font-family:inherit}
      .ckt button,.ckt input,.ckt select,.ckt textarea{font-family:inherit}
      .ckt input,.ckt textarea,.ckt select{font-size:15px;color:var(--ink)}

      .ck-top{display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 32px;border-bottom:1px solid var(--line);background:#fff;position:sticky;top:0;z-index:10}
      .ck-brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px;letter-spacing:-.02em}
      .ck-brand .mk{width:26px;height:26px;border-radius:7px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
      .ck-secure{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--faint);font-weight:500}
      .ck-close{background:#fff;border:1px solid var(--line);width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink);transition:background .15s}
      .ck-close:hover{background:var(--stage)}

      .ck-steps{display:flex;align-items:center;justify-content:center;gap:0;padding:26px 32px 6px;direction:ltr}
      .ck-step{display:flex;align-items:center;gap:11px}
      .ck-step .num{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--faint);background:#fff;transition:all .25s;flex:0 0 auto}
      .ck-step .lab{font-size:14px;font-weight:600;color:var(--faint);transition:color .25s}
      .ck-step.active .num{border-color:var(--ink);background:var(--ink);color:#fff}
      .ck-step.active .lab{color:var(--ink)}
      .ck-step.done .num{border-color:var(--green);background:var(--green);color:#fff}
      .ck-step.done .lab{color:var(--ink)}
      .ck-bar{width:64px;height:1.5px;background:var(--line);margin:0 16px;position:relative;overflow:hidden}
      .ck-bar i{position:absolute;inset:0;background:var(--green);transform:scaleX(0);transform-origin:right;transition:transform .35s}
      .ck-bar.fill i{transform:scaleX(1)}

      .ck-main{display:grid;grid-template-columns:1fr 400px;gap:40px;max-width:1140px;margin:0 auto;padding:30px 32px 64px;align-items:start}
      .ck-pane{min-width:0}
      .ck-h2{font-size:24px;font-weight:800;letter-spacing:-.02em;direction:rtl;text-align:right}
      .ck-hint{direction:rtl;text-align:right;color:var(--gray);font-size:14px;margin-top:4px}

      .ck-form{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .ck-field{display:flex;flex-direction:column;gap:7px;direction:rtl}
      .ck-field.full{grid-column:1/-1}
      .ck-field label{font-size:13px;font-weight:600;color:var(--gray)}
      .ck-field label .req{color:#d8412f}
      .ck-input{height:50px;border:1px solid var(--line);border-radius:13px;padding:0 15px;background:#fff;direction:rtl;transition:border-color .15s,box-shadow .15s;width:100%;color:var(--ink)}
      .ck-input.tel{direction:ltr;text-align:right}
      .ckt textarea.ck-input{height:86px;padding:13px 15px;resize:none;line-height:1.5}
      .ck-input::placeholder{color:#b8b8bd}
      .ck-input:focus{outline:none;border-color:var(--ink);box-shadow:0 0 0 3px rgba(0,0,0,.06)}
      .ckt select.ck-input{appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236e6e73' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 15px center;padding-left:38px}

      .ck-pays{margin-top:24px;display:flex;flex-direction:column;gap:12px}
      .ck-pay{border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:border-color .15s,box-shadow .15s}
      .ck-pay.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
      .ck-pay-hd{display:flex;align-items:center;gap:14px;padding:16px 18px;cursor:pointer;direction:rtl;background:none;border:0;width:100%;text-align:right}
      .ck-radio{width:20px;height:20px;border-radius:50%;border:1.5px solid #c5c5cb;flex:0 0 auto;position:relative;transition:border-color .15s}
      .ck-pay.on .ck-radio{border-color:var(--ink)}
      .ck-pay.on .ck-radio::after{content:"";position:absolute;inset:4px;border-radius:50%;background:var(--ink)}
      .ck-pay-ic{width:42px;height:42px;border-radius:11px;background:var(--stage);display:flex;align-items:center;justify-content:center;color:var(--ink);flex:0 0 auto}
      .ck-pay-tx{flex:1;min-width:0}
      .ck-pay-tx .t{font-weight:600;font-size:15.5px;display:block}
      .ck-pay-tx .d{font-size:12.5px;color:var(--gray);margin-top:2px;display:block}
      .ck-pay-badge{font-size:11px;font-weight:700;color:var(--green);background:rgba(26,138,74,.1);padding:4px 9px;border-radius:7px;letter-spacing:.02em}
      .ck-pay-body{max-height:0;overflow:hidden;transition:max-height .3s ease;direction:rtl}
      .ck-pay.on .ck-pay-body{max-height:360px}
      .ck-pay-inner{padding:16px 18px 18px 18px;border-top:1px solid var(--line)}
      .ck-walletfields{display:grid;grid-template-columns:1fr;gap:12px}
      .ck-note{display:flex;gap:10px;align-items:flex-start;background:var(--stage);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--gray);line-height:1.5}
      .ck-note .ic{color:var(--ink);flex:0 0 auto;margin-top:1px;display:flex}
      .ck-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .ck-plan{border:1px solid var(--line);border-radius:13px;padding:13px 12px;background:#fff;cursor:pointer;text-align:center;transition:border-color .15s,box-shadow .15s;color:var(--ink)}
      .ck-plan:hover{border-color:#bcbcc2}
      .ck-plan.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
      .ck-plan .mo{font-weight:800;font-size:18px}
      .ck-plan .mo span{font-size:12px;font-weight:600;color:var(--gray)}
      .ck-plan .per{font-size:12.5px;color:var(--blue);font-weight:700;margin-top:5px;direction:ltr}
      .ck-provs{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
      .ck-prov{font-size:12px;font-weight:700;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:6px 11px;cursor:pointer;transition:all .15s;background:#fff}
      .ck-prov.on{background:var(--ink);color:#fff;border-color:var(--ink)}

      .ck-nav{display:flex;gap:12px;margin-top:30px}
      .ck-btn{display:flex;align-items:center;justify-content:center;gap:9px;height:54px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;transition:transform .12s,background .15s,color .15s,opacity .15s;border:0}
      .ck-btn:active{transform:scale(.985)}
      .ck-btn.primary{flex:1;background:var(--ink);color:#fff;border:1px solid var(--ink)}
      .ck-btn.primary:hover{background:#000}
      .ck-btn.primary:disabled{opacity:.45;cursor:not-allowed;pointer-events:none}
      .ck-btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line);padding:0 22px}
      .ck-btn.ghost:hover{background:var(--stage)}

      .ck-rev{margin-top:24px;display:flex;flex-direction:column;gap:14px}
      .ck-revcard{border:1px solid var(--line);border-radius:16px;padding:18px;direction:rtl}
      .ck-revcard .rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
      .ck-revcard .rh .t{font-size:13px;font-weight:700;color:var(--faint);letter-spacing:.04em}
      .ck-revcard .rh .ed{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--blue);background:none;border:0;cursor:pointer}
      .ck-revcard .body{font-size:15px;color:var(--ink);line-height:1.7}
      .ck-revcard .body .mut{color:var(--gray);font-size:14px}

      .ck-success{max-width:560px;margin:0 auto;text-align:center;padding:60px 32px 80px}
      .ck-tick{width:84px;height:84px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 26px;animation:ckpop .5s cubic-bezier(.2,.8,.3,1.2)}
      @keyframes ckpop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
      .ck-success h2{font-size:30px;font-weight:800;letter-spacing:-.02em}
      .ck-success .sub{direction:rtl;color:var(--gray);font-size:16px;margin-top:10px}
      .ck-ordno{display:inline-flex;align-items:center;gap:8px;margin-top:22px;background:var(--stage);border-radius:12px;padding:12px 18px;font-size:14px;direction:rtl}
      .ck-ordno b{font-weight:800;direction:ltr}
      .ck-success-actions{display:flex;gap:10px;justify-content:center;margin-top:30px;flex-wrap:wrap}

      .ck-sum{position:sticky;top:84px;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:#fff}
      .ck-sum-hd{padding:18px 20px;border-bottom:1px solid var(--line);direction:rtl;font-weight:800;font-size:16px}
      .ck-line{display:flex;gap:14px;padding:18px 20px;direction:rtl;align-items:center}
      .ck-line .thumb{width:62px;height:62px;border-radius:13px;background:var(--shot);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto}
      .ck-line .thumb img{width:74%;height:auto;object-fit:contain}
      .ck-line .meta{flex:1;min-width:0}
      .ck-line .meta .nm{font-weight:600;font-size:15px}
      .ck-line .meta .op{font-size:13px;color:var(--gray);margin-top:2px}
      .ck-line .meta .qt{font-size:13px;color:var(--gray);margin-top:4px}
      .ck-line .pr{font-weight:700;font-size:15px;direction:ltr;white-space:nowrap}
      .ck-promo{display:flex;gap:8px;padding:0 20px 16px}
      .ck-promo input{flex:1;height:44px;border:1px solid var(--line);border-radius:11px;padding:0 14px;direction:rtl;font-family:inherit;font-size:14px;color:var(--ink)}
      .ck-promo input:focus{outline:none;border-color:var(--ink)}
      .ck-promo button{height:44px;padding:0 16px;border-radius:11px;border:1px solid var(--ink);background:#fff;font-weight:600;font-size:14px;cursor:pointer;color:var(--ink)}
      .ck-promo button:hover{background:var(--stage)}
      .ck-tot{padding:16px 20px;border-top:1px solid var(--line);direction:rtl;display:flex;flex-direction:column;gap:11px}
      .ck-tot .r{display:flex;justify-content:space-between;font-size:14.5px;color:var(--gray)}
      .ck-tot .r .v{color:var(--ink);font-weight:600;direction:ltr}
      .ck-tot .r.free .v{color:var(--green)}
      .ck-tot .grand{display:flex;justify-content:space-between;align-items:baseline;padding-top:13px;border-top:1px solid var(--line);margin-top:3px}
      .ck-tot .grand .k{font-size:16px;font-weight:800;color:var(--ink)}
      .ck-tot .grand .v{font-size:24px;font-weight:800;direction:ltr;color:var(--ink)}
      .ck-tot .morow{direction:rtl;font-size:12.5px;color:var(--gray);background:var(--stage);border-radius:10px;padding:9px 12px;text-align:center}
      .ck-tot .morow b{color:var(--ink);font-weight:700}
      .ck-trust{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;border-top:1px solid var(--line);font-size:12.5px;color:var(--faint)}

      body.ckt-locked{overflow:hidden}

      @media (max-width:900px){
        .ck-main{grid-template-columns:1fr;gap:26px;padding:24px 20px 56px}
        .ck-sum{position:static;order:-1;top:auto}
        .ck-step .lab{display:none}
        .ck-bar{width:36px;margin:0 8px}
        .ck-top{padding:0 20px}
      }
      @media (max-width:560px){
        .ck-form{grid-template-columns:1fr}
        .ck-plans{grid-template-columns:1fr 1fr}
        .ck-steps{padding:22px 16px 4px}
        .ck-h2{font-size:21px}
        .ck-nav{flex-direction:column-reverse}
        .ck-btn.ghost{width:100%}
      }
    `;
    document.head.appendChild(s);
  }

  // ─── Renderers ───
  function topBar() {
    return `
      <header class="ck-top">
        <button type="button" class="ck-close" id="ck-close-btn" aria-label="إغلاق">${svg('chevron',18,'var(--ink)',2)}</button>
        <div class="ck-brand"><span class="mk">T</span>Trade In Plus</div>
        <div class="ck-secure">${svg('lock',16,'var(--faint)',1.8)} دفع آمن ومشفّر</div>
      </header>
    `;
  }

  function stepper() {
    return `
      <div class="ck-steps">
        ${STEPS.map((s, i) => {
          const cls = i === state.step ? 'active' : (i < state.step ? 'done' : '');
          const num = i < state.step ? svg('check', 15, '#fff', 2.6) : (i + 1);
          const bar = i > 0 ? `<div class="ck-bar${state.step >= i ? ' fill' : ''}"><i></i></div>` : '';
          return bar + `<div class="ck-step ${cls}"><span class="num">${num}</span><span class="lab">${s}</span></div>`;
        }).join('')}
      </div>
    `;
  }

  function shippingStep() {
    const s = state.ship;
    return `
      <h2 class="ck-h2">بيانات الشحن</h2>
      <p class="ck-hint">هنوصّلك الطلب على العنوان ده.</p>
      <div class="ck-form">
        <div class="ck-field full">
          <label>الاسم بالكامل <span class="req">*</span></label>
          <input class="ck-input" id="ck-name" placeholder="مثال: أحمد محمد" value="${s.name}" autocomplete="name">
        </div>
        <div class="ck-field">
          <label>رقم الموبايل <span class="req">*</span></label>
          <input class="ck-input tel" id="ck-phone" placeholder="01XXXXXXXXX" inputmode="tel" maxlength="11" value="${s.phone}" autocomplete="tel" dir="ltr">
        </div>
        <div class="ck-field">
          <label>المحافظة</label>
          <select class="ck-input" id="ck-gov">
            ${GOVS.map(g => `<option value="${g}" ${s.gov === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="ck-field">
          <label>المدينة / الحي</label>
          <input class="ck-input" id="ck-city" placeholder="مثال: المعادي" value="${s.city}">
        </div>
        <div class="ck-field">
          <label>أقرب علامة مميزة</label>
          <input class="ck-input" id="ck-landmark" placeholder="اختياري" value="${s.landmark}">
        </div>
        <div class="ck-field full">
          <label>العنوان بالتفصيل <span class="req">*</span></label>
          <textarea class="ck-input" id="ck-addr" placeholder="اسم الشارع، رقم العمارة، الدور، الشقة">${s.addr}</textarea>
        </div>
      </div>
      <div class="ck-nav">
        <button class="ck-btn primary" id="ck-next" ${shipOk() ? '' : 'disabled'}>متابعة للدفع ${svg('back',20,'#fff',2)}</button>
      </div>
    `;
  }

  function shipOk() {
    const s = state.ship;
    return s.name.trim().length >= 3 && /^01[0125]\d{8}$/.test(digits(s.phone)) && s.addr.trim().length >= 8;
  }

  function paymentStep() {
    const t = computeTotals();
    const plans = [6, 12, 24];
    const provs = [{id:'valu',n:'فالو'}, {id:'aman',n:'أمان'}, {id:'bank',n:'بنوك'}];
    return `
      <h2 class="ck-h2">طريقة الدفع</h2>
      <p class="ck-hint">اختار الطريقة اللي تناسبك.</p>
      <div class="ck-pays">
        ${METHODS.map(m => `
          <div class="ck-pay ${state.method === m.id ? 'on' : ''}" data-method="${m.id}">
            <button type="button" class="ck-pay-hd" data-method-toggle="${m.id}">
              <span class="ck-radio"></span>
              <span class="ck-pay-ic">${svg(m.icon, 22, 'var(--ink)', 1.8)}</span>
              <span class="ck-pay-tx"><span class="t">${m.t}</span><span class="d">${m.d}</span></span>
              ${m.badge ? `<span class="ck-pay-badge">${m.badge}</span>` : ''}
            </button>
            <div class="ck-pay-body">
              <div class="ck-pay-inner">
                ${m.id === 'wallet' ? `
                  <div class="ck-walletfields">
                    <input class="ck-input tel" id="ck-wallet" placeholder="رقم المحفظة (01XXXXXXXXX)" inputmode="tel" maxlength="11" value="${state.walletNumber}" dir="ltr">
                    <div class="ck-note"><span class="ic">${svg('phone',18,'var(--ink)',1.8)}</span> هيوصلك طلب دفع على تطبيق المحفظة، أكّده خلال 5 دقائق.</div>
                  </div>
                ` : ''}
                ${m.id === 'instapay' ? `
                  <div class="ck-note"><span class="ic">${svg('instapay',18,'var(--ink)',1.8)}</span> هنحوّلك لتطبيق InstaPay لإتمام التحويل الفوري بأمان، وترجع تلقائيًا بعد الدفع.</div>
                ` : ''}
                ${m.id === 'install' ? `
                  <div class="ck-plans">
                    ${plans.map(p => `
                      <button type="button" class="ck-plan ${state.plan === p ? 'on' : ''}" data-plan="${p}">
                        <div class="mo">${p} <span>شهر</span></div>
                        <div class="per">EGP ${fmt(Math.round(t.total/p))}/شهر</div>
                      </button>
                    `).join('')}
                  </div>
                  <div class="ck-provs">
                    ${provs.map(p => `<button type="button" class="ck-prov ${state.prov === p.id ? 'on' : ''}" data-prov="${p.id}">${p.n}</button>`).join('')}
                  </div>
                ` : ''}
                ${m.id === 'cod' ? `
                  <div class="ck-note"><span class="ic">${svg('cash',18,'var(--ink)',1.8)}</span> تدفع كاش للمندوب عند الاستلام. تُضاف رسوم خدمة 25 ج وشحن 60 ج على الطلب.</div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="ck-nav">
        <button class="ck-btn ghost" id="ck-back">${svg('chevron',18,'var(--ink)',2)} رجوع</button>
        <button class="ck-btn primary" id="ck-next">مراجعة الطلب ${svg('back',20,'#fff',2)}</button>
      </div>
    `;
  }

  function confirmStep() {
    const s = state.ship;
    const methodLabel = ({
      wallet: 'محفظة رقمية',
      instapay: 'InstaPay',
      install: `تقسيط ${state.plan} شهر · ${({valu:'فالو',aman:'أمان',bank:'بنوك'})[state.prov]}`,
      cod: 'الدفع عند الاستلام'
    })[state.method];

    return `
      <h2 class="ck-h2">مراجعة وتأكيد</h2>
      <p class="ck-hint">اتأكد إن كل حاجة مظبوطة قبل ما تأكد الطلب.</p>
      <div class="ck-rev">
        <div class="ck-revcard">
          <div class="rh">
            <span class="t">الشحن إلى</span>
            <button class="ed" data-edit="0">${svg('edit',15,'var(--blue)',1.8)} تعديل</button>
          </div>
          <div class="body">
            <div>${s.name || '—'}</div>
            <div class="mut" dir="ltr" style="text-align:right">${s.phone || '—'}</div>
            <div class="mut">${[s.addr, s.city, s.gov].filter(Boolean).join('، ') || '—'}</div>
            ${s.landmark ? `<div class="mut">علامة: ${s.landmark}</div>` : ''}
          </div>
        </div>
        <div class="ck-revcard">
          <div class="rh">
            <span class="t">طريقة الدفع</span>
            <button class="ed" data-edit="1">${svg('edit',15,'var(--blue)',1.8)} تعديل</button>
          </div>
          <div class="body">${methodLabel}</div>
        </div>
      </div>
      <div class="ck-nav">
        <button class="ck-btn ghost" id="ck-back">${svg('chevron',18,'var(--ink)',2)} رجوع</button>
        <button class="ck-btn primary" id="ck-place">${svg('lock',19,'#fff',1.8)} تأكيد الطلب والدفع</button>
      </div>
    `;
  }

  function summary() {
    const t = computeTotals();
    const p = state.product;
    return `
      <aside class="ck-sum">
        <div class="ck-sum-hd">ملخص الطلب</div>
        <div class="ck-line">
          <div class="thumb">${p.image ? `<img src="${p.image}" alt="" onerror="this.style.display='none'">` : ''}</div>
          <div class="meta">
            <div class="nm">${p.name}</div>
            ${p.variant ? `<div class="op">${p.variant}</div>` : ''}
            <div class="qt">الكمية: 1</div>
          </div>
          <div class="pr">EGP ${fmt(p.price)}</div>
        </div>
        <div class="ck-promo">
          <input id="ck-promo" placeholder="كود الخصم" value="${state.promo}">
          <button type="button" id="ck-promo-btn">تطبيق</button>
        </div>
        <div class="ck-tot">
          <div class="r"><span>الإجمالي الفرعي</span><span class="v">EGP ${fmt(t.subtotal)}</span></div>
          <div class="r${t.shippingFee ? '' : ' free'}"><span>الشحن</span><span class="v">${t.shippingFee ? `EGP ${fmt(t.shippingFee)}` : 'مجاني'}</span></div>
          ${t.codFee > 0 ? `<div class="r"><span>رسوم الدفع عند الاستلام</span><span class="v">EGP ${fmt(t.codFee)}</span></div>` : ''}
          <div class="grand"><span class="k">الإجمالي</span><span class="v">EGP ${fmt(t.total)}</span></div>
          ${state.method === 'install' ? `<div class="morow">أو <b>EGP ${fmt(t.monthly)}</b> شهريًا على <b>${state.plan}</b> شهر</div>` : ''}
        </div>
        <div class="ck-trust">${svg('shield',15,'var(--faint)',1.8)} مشترياتك مضمونة وأصلية بضمان Apple</div>
      </aside>
    `;
  }

  function successView() {
    return `
      ${topBar()}
      <div class="ck-success">
        <div class="ck-tick">${svg('check',44,'#fff',2.6)}</div>
        <h2>تم تأكيد طلبك 🎉</h2>
        <p class="sub">هنبعتلك رسالة تأكيد على ${state.ship.phone || 'رقمك'}، وهتستلم خلال 2–3 أيام عمل.</p>
        <div class="ck-ordno">${svg('tag',18,'var(--ink)',1.8)}<span>رقم الطلب</span><b>#${state.orderNumber}</b></div>
        <div class="ck-success-actions">
          <button class="ck-btn ghost" id="ck-continue">متابعة التسوق</button>
          <button class="ck-btn primary" id="ck-wa" style="flex:0 0 auto;padding:0 20px">إرسال للواتساب</button>
        </div>
      </div>
    `;
  }

  // ─── Render ───
  function render() {
    const root = document.getElementById('ckt-root');
    if (!root) return;
    if (state.step === 3) {
      root.innerHTML = successView();
    } else {
      root.innerHTML = `
        ${topBar()}
        ${stepper()}
        <div class="ck-main">
          <div class="ck-pane">
            ${state.step === 0 ? shippingStep() : ''}
            ${state.step === 1 ? paymentStep() : ''}
            ${state.step === 2 ? confirmStep() : ''}
          </div>
          ${summary()}
        </div>
      `;
    }
    wireEvents();
  }

  // ─── Events ───
  function wireEvents() {
    document.getElementById('ck-close-btn')?.addEventListener('click', close);

    // Shipping
    const bindShipField = (id, key) => {
      const el = document.getElementById('ck-' + id);
      if (!el) return;
      el.addEventListener('input', () => {
        state.ship[key] = el.value;
        const nextBtn = document.getElementById('ck-next');
        if (nextBtn) nextBtn.disabled = !shipOk();
      });
      el.addEventListener('change', () => { state.ship[key] = el.value; });
    };
    bindShipField('name','name');
    bindShipField('phone','phone');
    bindShipField('gov','gov');
    bindShipField('city','city');
    bindShipField('landmark','landmark');
    bindShipField('addr','addr');

    // Payment
    document.querySelectorAll('[data-method-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        state.method = el.dataset.methodToggle;
        render();
      });
    });
    document.querySelectorAll('[data-plan]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        state.plan = Number(el.dataset.plan);
        render();
      });
    });
    document.querySelectorAll('[data-prov]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        state.prov = el.dataset.prov;
        render();
      });
    });
    const wallet = document.getElementById('ck-wallet');
    if (wallet) wallet.addEventListener('input', () => { state.walletNumber = wallet.value; });

    // Navigation
    const nextBtn = document.getElementById('ck-next');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (state.step === 0 && !shipOk()) return;
      state.step++;
      render();
    });
    document.getElementById('ck-back')?.addEventListener('click', () => {
      state.step = Math.max(0, state.step - 1);
      render();
    });
    document.querySelectorAll('[data-edit]').forEach(el => {
      el.addEventListener('click', () => {
        state.step = Number(el.dataset.edit);
        render();
      });
    });

    // Place order
    document.getElementById('ck-place')?.addEventListener('click', placeOrder);

    // Promo
    const promo = document.getElementById('ck-promo');
    if (promo) promo.addEventListener('input', () => { state.promo = promo.value; });

    // Success
    document.getElementById('ck-continue')?.addEventListener('click', close);
    document.getElementById('ck-wa')?.addEventListener('click', () => {
      const t = computeTotals();
      sendWhatsApp({
        orderNumber: state.orderNumber,
        productName: state.product.name,
        variant: state.product.variant,
        price: state.product.price,
        total: t.total,
        customerName: state.ship.name,
        customerPhone: state.ship.phone,
        customerCity: state.ship.gov,
        customerArea: state.ship.city,
        customerAddress: state.ship.addr,
        landmark: state.ship.landmark,
        paymentMethod: state.method
      });
    });
  }

  async function placeOrder() {
    const btn = document.getElementById('ck-place');
    if (!btn) return;

    // Rate limit
    try {
      const RATE_KEY = '__tip_order_attempts';
      const RATE_WINDOW = 10 * 60 * 1000;
      const RATE_LIMIT = 3;
      const now = Date.now();
      const stored = JSON.parse(localStorage.getItem(RATE_KEY) || '[]');
      const recent = stored.filter(t => now - t < RATE_WINDOW);
      if (recent.length >= RATE_LIMIT) {
        const waitMin = Math.ceil((RATE_WINDOW - (now - recent[0])) / 60000);
        btn.textContent = `محاولات كتير — استنى ${waitMin} دقايق`;
        return;
      }
      recent.push(now);
      localStorage.setItem(RATE_KEY, JSON.stringify(recent));
    } catch {}

    btn.disabled = true;
    btn.textContent = 'جارٍ تأكيد الطلب…';

    state.orderNumber = genOrderNum();
    const t = computeTotals();
    const order = {
      orderNumber: state.orderNumber,
      productName: state.product.name,
      productSlug: state.product.slug || '',
      variant: state.product.variant || '',
      price: state.product.price,
      image: state.product.image || '',
      customerName: state.ship.name.trim(),
      customerPhone: state.ship.phone.trim(),
      customerCity: state.ship.gov,
      customerArea: state.ship.city,
      customerAddress: state.ship.addr.trim(),
      landmark: state.ship.landmark.trim(),
      customerEmail: '',
      paymentMethod: state.method,
      walletNumber: state.walletNumber,
      installmentPlan: state.method === 'install' ? state.plan : null,
      installmentProvider: state.method === 'install' ? state.prov : null,
      promo: state.promo.trim(),
      subtotal: t.subtotal,
      shippingFee: t.shippingFee,
      codFee: t.codFee,
      total: t.total,
      notes: '',
      status: 'new'
    };

    await saveOrder(order);

    if (window.__tipEmail) window.__tipEmail.sendOrderConfirmation?.(order).catch(()=>{});

    state.step = 3;
    render();

    setTimeout(() => sendWhatsApp(order), 1500);
  }

  // ─── Open / Close ───
  function open(product) {
    injectStyles();
    state.open = true;
    state.step = 0;
    state.method = 'wallet';
    state.plan = 12;
    state.prov = 'valu';
    state.promo = '';
    state.ship = { name:'', phone:'', gov:'القاهرة', city:'', landmark:'', addr:'', notes:'' };
    state.walletNumber = '';
    state.product = product;
    state.orderNumber = '';

    const old = document.getElementById('ckt-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ckt-overlay';
    overlay.className = 'ckt-overlay';
    overlay.innerHTML = `<div class="ckt" id="ckt-root"></div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('ckt-locked');

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));

    render();
    document.addEventListener('keydown', escHandler);
  }

  function close() {
    const overlay = document.getElementById('ckt-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.classList.remove('ckt-locked');
    state.open = false;
    setTimeout(() => overlay.remove(), 300);
    document.removeEventListener('keydown', escHandler);
  }
  function escHandler(e) { if (e.key === 'Escape') close(); }

  // ─── Hook into "اشتري الآن" buttons ───
  function readProductFromPage() {
    const name = (document.getElementById('product-title')?.textContent
              || document.querySelector('.phero-product-name')?.textContent
              || document.querySelector('h1')?.textContent
              || document.title.split('|')[0] || 'منتج').trim();
    const priceEl = document.getElementById('priceMain');
    const priceMeta = document.querySelector('meta[property="product:price:amount"]')?.content;
    const price = Number(digits(priceEl?.textContent)) || Number(digits(priceMeta)) || 0;
    const imgEl = document.querySelector('.product-photo, img.product-photo, .phero-image img');
    const image = imgEl ? imgEl.src : '';
    const activeColor = document.querySelector('.color-swatch[aria-checked="true"]');
    const activeStorage = document.querySelector('.storage-opt[aria-checked="true"]');
    const variant = [
      activeColor ? (activeColor.getAttribute('aria-label') || activeColor.dataset.color || '') : '',
      activeStorage ? (activeStorage.dataset.storage || activeStorage.textContent.trim()) : ''
    ].filter(Boolean).join(' · ');
    const slug = location.pathname.split('/').pop()?.replace('.html', '') || '';
    return { name, price, image, variant, slug };
  }

  function isBuyButton(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches?.('[data-checkout]')) return true;
    const tag = el.tagName;
    if (tag !== 'BUTTON' && tag !== 'A') return false;
    const txt = (el.textContent || '').trim();
    return txt === 'اشتري الآن' || txt.includes('اشتري الآن')
        || txt === 'اشترِ الآن' || txt.includes('اشترِ الآن');
  }

  document.addEventListener('click', function(e) {
    let el = e.target;
    while (el && el !== document.body) {
      if (isBuyButton(el)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        open(readProductFromPage());
        return false;
      }
      el = el.parentNode;
    }
  }, true);

  // Public API
  window.__tipCheckout = { open, close };
})();
