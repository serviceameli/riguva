/* A local Harstok refinement. Routing, lake-dream and the spoiler gate stay owned
   by their existing modules. Every enhancement has an immediate static fallback. */
(() => {
  'use strict';
  const library = document.getElementById('bonus');
  const contacts = document.getElementById('contacts');
  const dialog = document.getElementById('bonus-dialog');
  if (!library || !contacts || !dialog || library.dataset.refinementV84) return;
  library.dataset.refinementV84 = 'true';

  const shade = document.createElement('div');
  shade.className = 'library-end-shadow-v84';
  shade.setAttribute('aria-hidden', 'true');
  library.append(shade);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => document.body.dataset.world === 'shatserak'
    && !document.body.classList.contains('still') && !reduced.matches;
  const clamp = value => Math.max(0, Math.min(1, value));
  let pending = false;
  let near = true;
  let lastDrift = '';

  function update() {
    pending = false;
    if (!near || document.hidden || document.body.dataset.world !== 'shatserak') return;
    const r = library.getBoundingClientRect();
    const span = shade.getBoundingClientRect().height;
    const passage = clamp((innerHeight - r.bottom + span) / (innerHeight + span));
    const drift = motionAllowed() ? ((passage - .5) * 14).toFixed(2) + 'px' : '0px';
    if (drift === lastDrift) return;
    shade.style.setProperty('--library-end-drift-v84', drift);
    lastDrift = drift;
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      near = entries.some(entry => entry.isIntersecting);
      if (near) schedule();
    }, { rootMargin: '120px 0px' });
    observer.observe(shade);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('ri:atmosphere', schedule);
  addEventListener('ri:effects', schedule);
  reduced.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);

  schedule();
})();
