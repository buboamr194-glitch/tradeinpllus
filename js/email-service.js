// ─── Email service for tradeinplus orders ───
// Uses EmailJS (free tier: 200 emails/month). To activate:
//   1. Sign up at https://www.emailjs.com
//   2. Create a service (Gmail, Outlook, etc.) and template
//   3. Fill in the 3 values below
//
// Until configured, sendOrderConfirmation() returns false silently
// and the order will still save normally to Firebase.

(function(){
  'use strict';

  const EMAILJS_PUBLIC_KEY  = 'OD8b2kgiVMilsswKm';
  const EMAILJS_SERVICE_ID  = 'service_milgtfi';
  const EMAILJS_TEMPLATE_ID = 'template_z75hjp8';

  let emailJsLoaded = false;
  let emailJsLoading = null;

  async function loadEmailJs() {
    if (emailJsLoaded) return true;
    if (emailJsLoading) return emailJsLoading;
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) return false;
    emailJsLoading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.async = true;
      s.onload = () => {
        try {
          window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
          emailJsLoaded = true;
          resolve(true);
        } catch { resolve(false); }
      };
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return emailJsLoading;
  }

  async function sendOrderConfirmation(order) {
    const ok = await loadEmailJs();
    if (!ok || !order.customerEmail) return false;
    try {
      const itemsText = order.items
        ? order.items.map(i => `• ${i.name}${i.variant ? ' ('+i.variant+')' : ''} × ${i.qty || 1} — ${i.price} EGP`).join('\n')
        : `• ${order.productName} — ${order.price} EGP`;

      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:       order.customerEmail,
        to_name:        order.customerName,
        order_number:   order.orderNumber,
        items:          itemsText,
        total:          new Intl.NumberFormat('en-US').format(order.price) + ' EGP',
        payment:        order.paymentMethod,
        address:        order.customerAddress + ', ' + order.customerCity,
        phone:          order.customerPhone,
        notes:          order.notes || '-'
      });
      return true;
    } catch (e) {
      console.warn('Email send failed:', e);
      return false;
    }
  }

  // Expose globally
  window.__tipEmail = { sendOrderConfirmation };
})();
