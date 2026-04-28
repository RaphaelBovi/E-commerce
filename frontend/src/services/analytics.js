const GA_ID      = import.meta.env.VITE_GA_ID      || '';
const PIXEL_ID   = import.meta.env.VITE_META_PIXEL_ID || '';
const CONSENT_KEY = 'cookie_consent';

let initialized = false;

// ── Init ──────────────────────────────────────────────────────────
// Carrega GA4 e Meta Pixel dinamicamente apenas se o usuário aceitou cookies.
// Safe para chamar múltiplas vezes — idempotente.
export function initAnalytics() {
  if (initialized) return;
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return;

  initialized = true;

  if (GA_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  if (PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

// ── Page view (SPA route changes) ────────────────────────────────
export function trackPageView(path) {
  if (!initialized) return;
  if (window.gtag && GA_ID) window.gtag('config', GA_ID, { page_path: path });
  if (window.fbq && PIXEL_ID) window.fbq('track', 'PageView');
}

// ── Ecommerce events ──────────────────────────────────────────────
export function trackViewItem(product) {
  if (!initialized) return;
  const price = product.isPromo ? product.promotionalPrice : product.price;
  if (window.gtag && GA_ID) {
    window.gtag('event', 'view_item', {
      currency: 'BRL',
      value: Number(price),
      items: [{ item_id: product.id, item_name: product.name, price: Number(price) }],
    });
  }
  if (window.fbq && PIXEL_ID) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      value: Number(price),
      currency: 'BRL',
    });
  }
}

export function trackAddToCart(product, quantity = 1) {
  if (!initialized) return;
  const price = product.isPromo ? product.promotionalPrice : product.price;
  if (window.gtag && GA_ID) {
    window.gtag('event', 'add_to_cart', {
      currency: 'BRL',
      value: Number(price) * quantity,
      items: [{ item_id: product.id, item_name: product.name, price: Number(price), quantity }],
    });
  }
  if (window.fbq && PIXEL_ID) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      value: Number(price) * quantity,
      currency: 'BRL',
    });
  }
}

export function trackBeginCheckout(cartItems, total) {
  if (!initialized) return;
  if (window.gtag && GA_ID) {
    window.gtag('event', 'begin_checkout', {
      currency: 'BRL',
      value: Number(total),
      items: cartItems.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
      })),
    });
  }
  if (window.fbq && PIXEL_ID) {
    window.fbq('track', 'InitiateCheckout', {
      value: Number(total),
      currency: 'BRL',
      num_items: cartItems.reduce((acc, i) => acc + i.quantity, 0),
    });
  }
}

export function trackPurchase(orderId, total, items = []) {
  if (!initialized) return;
  if (window.gtag && GA_ID) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'BRL',
      value: Number(total),
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
      })),
    });
  }
  if (window.fbq && PIXEL_ID) {
    window.fbq('track', 'Purchase', {
      value: Number(total),
      currency: 'BRL',
    });
  }
}
