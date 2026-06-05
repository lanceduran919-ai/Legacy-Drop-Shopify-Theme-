/* ============================================
   Legacy Drops — Custom Theme JS
   ============================================ */

(function () {
  'use strict';

  /* ── Announcement Bar Rotation ── */
  const messages = [
    'Free shipping on orders over $50',
    'Printed & shipped in 3–5 business days',
    'New drops every week — follow us @legacydrops',
    'San Antonio proud. Fan merch built different.',
  ];

  function rotateAnnouncement() {
    const bar = document.querySelector('.announcement-bar__message');
    if (!bar) return;
    let index = 0;
    setInterval(() => {
      bar.style.opacity = '0';
      setTimeout(() => {
        index = (index + 1) % messages.length;
        bar.textContent = messages[index];
        bar.style.opacity = '1';
      }, 300);
    }, 4000);
  }

  /* ── Sticky Header Shadow on Scroll ── */
  function stickyHeaderShadow() {
    const header = document.querySelector('.site-header, header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 1px 12px rgba(0,0,0,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ── Product Card Quick Add ── */
  function initQuickAdd() {
    document.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('mouseenter', () => {
        const btn = card.querySelector('.quick-add');
        if (btn) btn.style.display = 'block';
      });
      card.addEventListener('mouseleave', () => {
        const btn = card.querySelector('.quick-add');
        if (btn) btn.style.display = 'none';
      });
    });
  }

  /* ── Lazy Load Images ── */
  function lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        observer.observe(img);
      });
    }
  }

  /* ── Smooth Scroll for Anchor Links ── */
  function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Cart Count Badge ── */
  function updateCartBadge(count) {
    const badge = document.querySelector('.cart-count-bubble, .cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /* ── TikTok Strip UTM Tracking ── */
  function addTikTokUTM() {
    const tiktokBtn = document.querySelector('.tiktok-btn');
    if (tiktokBtn) {
      const base = tiktokBtn.getAttribute('href') || 'https://www.tiktok.com/@legacydrops';
      tiktokBtn.setAttribute('href', `${base}?utm_source=store&utm_medium=footer-strip&utm_campaign=tiktok-follow`);
    }
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    rotateAnnouncement();
    stickyHeaderShadow();
    initQuickAdd();
    lazyLoadImages();
    smoothScroll();
    addTikTokUTM();
  });
})();
