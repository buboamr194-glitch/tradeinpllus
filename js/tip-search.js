// ─── Lightweight Site-wide Search for tradeinplus ───
// Triggers: #searchBtn or [data-tip-search] or Cmd/Ctrl+K
// Routes: products/[slug].html

(function(){
  'use strict';

  // Skip if page already has its own search overlay (e.g. index.html)
  // We'll only enhance the URL routing there
  const hasOwnSearch = !!document.getElementById('searchOverlay');

  // ─── Products ───
  const PRODUCTS = [
    { n: 'iPhone 17 Pro Max', c: 'iPhone', s: 'iphone-17-pro-max', k: 'ايفون 17 برو ماكس' },
    { n: 'iPhone 17 Pro', c: 'iPhone', s: 'iphone-17-pro', k: 'ايفون 17 برو' },
    { n: 'iPhone 17', c: 'iPhone', s: 'iphone-17', k: 'ايفون 17' },
    { n: 'iPhone Air', c: 'iPhone', s: 'iphone-17-air', k: 'ايفون اير 17' },
    { n: 'iPhone 16 Pro Max', c: 'iPhone', s: 'iphone-16-pro-max', k: 'ايفون 16 برو ماكس' },
    { n: 'iPhone 16 Pro', c: 'iPhone', s: 'iphone-16-pro', k: 'ايفون 16 برو' },
    { n: 'iPhone 16 Plus', c: 'iPhone', s: 'iphone-16-plus', k: 'ايفون 16 بلس' },
    { n: 'iPhone 16', c: 'iPhone', s: 'iphone-16', k: 'ايفون 16' },
    { n: 'iPhone 16e', c: 'iPhone', s: 'iphone-16e', k: 'ايفون 16e' },
    { n: 'iPhone 15 Pro Max', c: 'iPhone', s: 'iphone-15-pro-max', k: 'ايفون 15 برو ماكس' },
    { n: 'iPhone 15 Pro', c: 'iPhone', s: 'iphone-15-pro', k: 'ايفون 15 برو' },
    { n: 'iPhone 15 Plus', c: 'iPhone', s: 'iphone-15-plus', k: 'ايفون 15 بلس' },
    { n: 'iPhone 15', c: 'iPhone', s: 'iphone-15', k: 'ايفون 15' },
    { n: 'iPhone 14 Pro Max', c: 'iPhone', s: 'iphone-14-pro-max', k: 'ايفون 14 برو ماكس' },
    { n: 'iPhone 14 Pro', c: 'iPhone', s: 'iphone-14-pro', k: 'ايفون 14 برو' },
    { n: 'iPhone 14 Plus', c: 'iPhone', s: 'iphone-14-plus', k: 'ايفون 14 بلس' },
    { n: 'iPhone 14', c: 'iPhone', s: 'iphone-14', k: 'ايفون 14' },
    { n: 'iPhone 13 Pro Max', c: 'iPhone', s: 'iphone-13-pro-max', k: 'ايفون 13 برو ماكس' },
    { n: 'iPhone 13 Pro', c: 'iPhone', s: 'iphone-13-pro', k: 'ايفون 13 برو' },
    { n: 'iPhone 13', c: 'iPhone', s: 'iphone-13', k: 'ايفون 13' },
    { n: 'iPhone 13 mini', c: 'iPhone', s: 'iphone-13-mini', k: 'ايفون 13 ميني' },
    { n: 'iPhone 12 Pro Max', c: 'iPhone', s: 'iphone-12-pro-max', k: 'ايفون 12 برو ماكس' },
    { n: 'iPhone 12 Pro', c: 'iPhone', s: 'iphone-12-pro', k: 'ايفون 12 برو' },
    { n: 'iPhone 12', c: 'iPhone', s: 'iphone-12', k: 'ايفون 12' },
    { n: 'iPhone 12 mini', c: 'iPhone', s: 'iphone-12-mini', k: 'ايفون 12 ميني' },
    { n: 'iPhone 11 Pro Max', c: 'iPhone', s: 'iphone-11-pro-max', k: 'ايفون 11 برو ماكس' },
    { n: 'iPhone 11 Pro', c: 'iPhone', s: 'iphone-11-pro', k: 'ايفون 11 برو' },
    { n: 'iPhone 11', c: 'iPhone', s: 'iphone-11', k: 'ايفون 11' },
    { n: 'iPhone SE 3', c: 'iPhone', s: 'iphone-se-3', k: 'ايفون اس اي se' },
    { n: 'iPhone SE 2', c: 'iPhone', s: 'iphone-se-2', k: 'ايفون اس اي se' },
    { n: 'iPhone XS Max', c: 'iPhone', s: 'iphone-xs-max', k: 'ايفون xs ماكس' },
    { n: 'iPhone XS', c: 'iPhone', s: 'iphone-xs', k: 'ايفون xs' },
    { n: 'iPhone XR', c: 'iPhone', s: 'iphone-xr', k: 'ايفون xr' },
    { n: 'iPhone X', c: 'iPhone', s: 'iphone-x', k: 'ايفون x' },
    { n: 'iPhone 8 Plus', c: 'iPhone', s: 'iphone-8-plus', k: 'ايفون 8 بلس' },
    { n: 'iPhone 8', c: 'iPhone', s: 'iphone-8', k: 'ايفون 8' },
    { n: 'iPhone 7 Plus', c: 'iPhone', s: 'iphone-7-plus', k: 'ايفون 7 بلس' },
    { n: 'iPhone 7', c: 'iPhone', s: 'iphone-7', k: 'ايفون 7' },
    { n: 'MacBook Pro', c: 'Mac', s: 'macbook-pro', k: 'ماك بوك برو لاب توب' },
    { n: 'MacBook Air', c: 'Mac', s: 'macbook-air', k: 'ماك بوك اير لاب توب' },
    { n: 'iMac', c: 'Mac', s: 'imac', k: 'اي ماك كمبيوتر' },
    { n: 'Mac mini', c: 'Mac', s: 'mac-mini', k: 'ماك ميني mini' },
    { n: 'Mac Pro', c: 'Mac', s: 'mac-pro', k: 'ماك برو' },
    { n: 'iPad Pro', c: 'iPad', s: 'ipad-pro', k: 'ايباد برو' },
    { n: 'iPad Air', c: 'iPad', s: 'ipad-air', k: 'ايباد اير' },
    { n: 'iPad mini', c: 'iPad', s: 'ipad-mini', k: 'ايباد ميني' },
    { n: 'iPad', c: 'iPad', s: 'ipad', k: 'ايباد' },
    { n: 'Apple Watch Ultra 2', c: 'Watch', s: 'apple-watch-ultra-2', k: 'ساعة الترا' },
    { n: 'Apple Watch Series 10', c: 'Watch', s: 'apple-watch-series-10', k: 'ساعة سيريز 10' },
    { n: 'Apple Watch SE', c: 'Watch', s: 'apple-watch-se', k: 'ساعة se' },
    { n: 'AirPods Pro 2', c: 'AirPods', s: 'airpods-pro-2', k: 'ايربودز برو سماعات' },
    { n: 'AirPods Max', c: 'AirPods', s: 'airpods-max', k: 'ايربودز ماكس سماعات' },
    { n: 'AirPods 4', c: 'AirPods', s: 'airpods-4', k: 'ايربودز 4 سماعات' },
    { n: 'Apple TV 4K', c: 'TV', s: 'apple-tv-4k', k: 'ابل تي في tv' },
    { n: 'AirTag', c: 'Accessories', s: 'airtag-1-pack', k: 'اير تاج' },
    { n: 'AirTag 4-pack', c: 'Accessories', s: 'airtag-4-pack', k: 'اير تاج 4' },
    { n: 'Anker 735 Charger 65W', c: 'Anker', s: 'anker-735-charger-65w', k: 'انكر شاحن سريع 65' },
    { n: 'Anker MagSafe Power Bank', c: 'Anker', s: 'anker-magsafe-powerbank', k: 'انكر ماج سيف باور' },
    { n: 'Anker PowerCore 10000', c: 'Anker', s: 'anker-powercore-10000', k: 'انكر باور بانك' },
    { n: 'Anker USB-C Cable', c: 'Anker', s: 'anker-usbc-cable', k: 'انكر كابل' },
    { n: 'Anker USB-C to Lightning', c: 'Anker', s: 'anker-usbc-lightning-cable', k: 'انكر كابل لايتننج' },
    { n: 'Chargers & Cables', c: 'Accessories', s: 'accessories-chargers', k: 'شواحن كابلات' },
    { n: 'Cases', c: 'Accessories', s: 'accessories-cases', k: 'كفرات حماية' },
    { n: 'Keyboards', c: 'Accessories', s: 'accessories-keyboards', k: 'كيبورد ماوس' },
    { n: 'Displays', c: 'Accessories', s: 'accessories-displays', k: 'شاشة شاشات' }
  ];

  function normalize(s) {
    return (s || '').toString().toLowerCase()
      .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/[ًٌٍَُِّْـ]/g, '').trim();
  }

  function getHref(slug) {
    return window.location.pathname.includes('/products/') ? slug + '.html' : 'products/' + slug + '.html';
  }

  function injectStyles() {
    if (document.getElementById('tip-search-styles')) return;
    const s = document.createElement('style');
    s.id = 'tip-search-styles';
    s.textContent = `
      #tip-search-overlay{position:fixed;inset:0;background:rgba(10,10,12,.85);z-index:2147483646;display:none;align-items:flex-start;justify-content:center;padding:80px 16px 16px;font-family:'Cairo',-apple-system,sans-serif;direction:rtl}
      @media(max-width:640px){#tip-search-overlay{padding:16px}}
      #tip-search-overlay.show{display:flex}
      #tip-search-modal{background:#161618;width:100%;max-width:640px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.5);max-height:80vh;display:flex;flex-direction:column}
      .tip-s-bar{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
      .tip-s-bar svg{width:18px;height:18px;color:#888;flex-shrink:0}
      .tip-s-input{flex:1;background:none;border:none;outline:none;color:#fff;font-size:16px;font-family:inherit;padding:2px 0;font-weight:500}
      .tip-s-input::placeholder{color:#666}
      .tip-s-esc{font-size:11px;color:#888;background:rgba(255,255,255,.06);padding:3px 8px;border-radius:5px;font-family:'Outfit',sans-serif;font-weight:600;flex-shrink:0;cursor:pointer;border:none}
      @media(max-width:640px){.tip-s-esc{display:none}}
      .tip-s-results{flex:1;overflow-y:auto;padding:6px}
      .tip-s-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:#fff;text-decoration:none}
      .tip-s-item:hover{background:rgba(255,255,255,.05)}
      .tip-s-item.active{background:rgba(86,227,154,.1)}
      .tip-s-icon{width:36px;height:36px;border-radius:9px;background:rgba(86,227,154,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#56e39a;font-size:18px;font-weight:700;font-family:'Outfit',sans-serif}
      .tip-s-info{flex:1;min-width:0}
      .tip-s-name{font-size:14.5px;font-weight:600;line-height:1.3;font-family:'Outfit',sans-serif}
      .tip-s-cat{font-size:11.5px;color:#888;margin-top:1px}
      .tip-s-arr{color:#666;flex-shrink:0}
      .tip-s-empty{padding:36px 16px;text-align:center;color:#666;font-size:13.5px}
      body.tip-s-open{overflow:hidden}
      #tip-search-fab{position:fixed;bottom:96px;left:24px;z-index:9997;width:48px;height:48px;border-radius:50%;background:#0a0a0a;color:#fff;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)}
      #tip-search-fab:hover{background:#1d7a4e}
      #tip-search-fab svg{width:20px;height:20px}
      @media(max-width:640px){#tip-search-fab{bottom:158px;left:16px}}
    `;
    document.head.appendChild(s);
  }

  function categoryShort(c) {
    return { iPhone: '📱', Mac: '💻', iPad: '📲', Watch: '⌚', AirPods: '🎧', Anker: '🔌', Accessories: '⚙️', TV: '📺' }[c] || '•';
  }

  let activeIdx = -1;
  let visible = [];

  function render(q) {
    const norm = normalize(q);
    visible = norm
      ? PRODUCTS.filter(p => normalize(p.n).includes(norm) || normalize(p.c).includes(norm) || normalize(p.k).includes(norm)).slice(0, 14)
      : PRODUCTS.slice(0, 8);

    const el = document.getElementById('tip-s-results');
    if (!el) return;
    if (visible.length === 0) {
      el.innerHTML = `<div class="tip-s-empty">مفيش نتائج لـ "${q}"</div>`;
      return;
    }
    el.innerHTML = visible.map((p, i) => `
      <a class="tip-s-item" href="${getHref(p.s)}" data-i="${i}">
        <div class="tip-s-icon">${categoryShort(p.c)}</div>
        <div class="tip-s-info">
          <div class="tip-s-name">${p.n}</div>
          <div class="tip-s-cat">${p.c}</div>
        </div>
        <svg class="tip-s-arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </a>
    `).join('');
    activeIdx = -1;
  }

  function setActive(i) {
    const items = document.querySelectorAll('.tip-s-item');
    items.forEach(it => it.classList.remove('active'));
    activeIdx = Math.max(-1, Math.min(i, items.length - 1));
    if (activeIdx >= 0 && items[activeIdx]) {
      items[activeIdx].classList.add('active');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  function open() {
    injectStyles();
    let overlay = document.getElementById('tip-search-overlay');
    if (!overlay) {
      const html = `
        <div id="tip-search-overlay" role="dialog" aria-modal="true">
          <div id="tip-search-modal">
            <div class="tip-s-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="search" class="tip-s-input" id="tip-s-input" placeholder="ابحث عن منتج..." autocomplete="off">
              <button type="button" class="tip-s-esc" id="tip-s-close">ESC</button>
            </div>
            <div class="tip-s-results" id="tip-s-results"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
      overlay = document.getElementById('tip-search-overlay');
      const input = document.getElementById('tip-s-input');

      input.addEventListener('input', e => render(e.target.value));
      input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
        else if (e.key === 'Enter') {
          const items = document.querySelectorAll('.tip-s-item');
          const target = activeIdx >= 0 ? items[activeIdx] : items[0];
          if (target) window.location.href = target.getAttribute('href');
        }
      });

      document.getElementById('tip-s-close').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }

    overlay.classList.add('show');
    document.body.classList.add('tip-s-open');
    render('');
    setTimeout(() => document.getElementById('tip-s-input')?.focus(), 50);
  }

  function close() {
    const overlay = document.getElementById('tip-search-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.classList.remove('tip-s-open');
  }

  function injectFab() {
    if (document.getElementById('tip-search-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'tip-search-fab';
    fab.setAttribute('aria-label', 'بحث');
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    fab.addEventListener('click', open);
    document.body.appendChild(fab);
  }

  function init() {
    // If page already has its own search overlay (index.html), don't override
    // — but DO upgrade its product links to navigate to product pages
    if (hasOwnSearch) {
      // Patch existing search result links if any to use correct product URLs
      const observer = new MutationObserver(() => {
        document.querySelectorAll('a.search-result-item').forEach(a => {
          const href = a.getAttribute('href') || '';
          if (href.startsWith('shop.html#')) {
            const slug = href.replace('shop.html#', '');
            a.setAttribute('href', 'products/' + slug + '.html');
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    // Else: wire up our search — detect ANY search button on the page
    const existingBtns = document.querySelectorAll(
      '#searchBtn, [data-tip-search], button[aria-label="بحث"], button[aria-label*="Search" i], a[aria-label="بحث"]'
    );
    if (existingBtns.length > 0) {
      existingBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          open();
        });
      });
    } else {
      injectFab();
    }

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const ov = document.getElementById('tip-search-overlay');
        ov?.classList.contains('show') ? close() : open();
      }
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__tipSearch = { open, close };
})();
