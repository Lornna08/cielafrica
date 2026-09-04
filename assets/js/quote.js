/* ============================================================
   CIEL AFRICA — Quote form
   NOTE: This is a front-end form. To receive submissions, connect
   it to a backend or a form service (e.g. a Vercel serverless
   function, Formspree, or your own API) at the marked spot below.
   ============================================================ */
(function () {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const note = document.getElementById('prefill-note');

  // Prefill context from links (template / product / service)
  const ctx = params.get('template') || params.get('product') || params.get('service');
  if (ctx) {
    const kind = params.get('template') ? 'template' : params.get('product') ? 'product' : 'service';
    const label = decodeURIComponent(ctx).replace(/\+/g, ' ');
    note.innerHTML = `<div class="notice" style="margin-bottom:1.6rem;border-color:var(--blue)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <p style="margin:0">Requesting a quote for the <strong>${CIEL.esc(label)}</strong> ${kind}. Add your details below and we'll tailor an estimate.</p></div>`;
    const desc = document.getElementById('desc');
    if (desc && !desc.value) desc.value = `I'm interested in the "${label}" ${kind}. `;
    // Best-effort project type match
    const ptype = document.getElementById('ptype');
    if (kind === 'template') Array.from(ptype.options).some(o => { if (o.text === 'Website') { o.selected = true; return true; } });
  }

  // File list display
  const fileInput = document.getElementById('files');
  const fileList = document.getElementById('file-list');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const names = Array.from(fileInput.files).map(f => f.name);
      fileList.textContent = names.length ? names.join(', ') : '';
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // Basic validation
    let ok = true;
    form.querySelectorAll('[required]').forEach(el => {
      const invalid = !el.value || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
      el.style.borderColor = invalid ? '#ff6b6b' : '';
      if (invalid) ok = false;
    });
    if (!ok) { form.querySelector('[style*="ff6b6b"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    // -------------------------------------------------------
    // TODO: send `new FormData(form)` to your endpoint here.
    // Example with a serverless function on Vercel:
    //   fetch('/api/quote', { method:'POST', body: new FormData(form) })
    // -------------------------------------------------------

    // Show confirmation
    const email = document.getElementById('email').value;
    document.getElementById('confirm-email').textContent = email;
    form.style.display = 'none';
    const confirm = document.getElementById('quote-confirm');
    confirm.style.display = 'block';
    confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
