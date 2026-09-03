/* ============================================================
   CIEL AFRICA — Site JS (vanilla, dependency-free)
   ============================================================ */
(function () {
  'use strict';

  /* ---- Nav shrink on scroll ---- */
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-menu a').forEach(a =>
      a.addEventListener('click', () => {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      })
    );
  }

  /* ---- Scroll reveals ---- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ---- Magnetic buttons (subtle) ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---- Current year ---- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---- Expose small helper for gallery filtering ---- */
  window.CIEL = window.CIEL || {};
  window.CIEL.escapeHtml = (s) => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})();
