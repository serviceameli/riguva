/* V84: collection folios and page graphics. No scene or scroll geometry changes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const folios = new Map([
    ['black-white', 'I'], ['grey-forest', 'II'],
    ['silence-1', 'III'], ['silence-2', 'IV']
  ]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new WeakMap();

  function ornament(parent, className) {
    if (!parent || parent.querySelector(':scope > .' + className)) return;
    const mark = document.createElement('span');
    mark.className = className;
    mark.setAttribute('aria-hidden', 'true');
    parent.append(mark);
  }
  function refresh() {
    const grid = byId('book-grid');
    grid?.querySelectorAll('.product-card[data-series="bw"]').forEach(card => {
      const id = card.querySelector('.product-visual[data-product]')?.dataset.product;
      const tag = card.querySelector('.product-tag');
      if (tag && folios.has(id)) tag.dataset.bwFolioV84 = folios.get(id);
    });
    ornament(byId('books'), 'bw-collector-edge-v84');
    ornament(byId('merch'), 'bw-collector-edge-v84');
    ornament(byId('books'), 'bw-collector-claws-v84');
    ornament(byId('chapter-reader-content'), 'bw-collector-claws-v84');
  }
  function cancel(node) {
    const previous = node && animations.get(node);
    if (previous) { previous.cancel(); animations.delete(node); }
  }
  function reveal(node, chapter = false) {
    if (!node) return;
    cancel(node);
    if (document.body.dataset.world !== 'bw' || reduced.matches ||
        document.body.classList.contains('still') || typeof node.animate !== 'function') return;
    /* Opacity and a few painted pixels only. The element keeps its full height. */
    const animation = node.animate([
      { opacity: chapter ? .8 : .55, transform: chapter ? 'translateX(4px)' : 'translateY(5px)' },
      { opacity: 1, transform: 'translate(0)' }
    ], { duration: chapter ? 280 : 380, easing: 'cubic-bezier(.2,.65,.3,1)' });
    animations.set(node, animation);
    animation.onfinish = () => { if (animations.get(node) === animation) animations.delete(node); };
  }

  refresh();
  const grid = byId('book-grid');
  if (grid) new MutationObserver(refresh).observe(grid, { childList: true });
  window.addEventListener('ri:atmosphere', refresh);
  window.addEventListener('ri:bonus-light', event => {
    const list = byId('bw-bonus-chapters')?.querySelector('.bonus-chapter-list');
    if (event.detail?.lit) reveal(list);
    else cancel(list);
  });
  const dialog = byId('chapter-dialog');
  if (dialog) new MutationObserver(() => {
    const page = byId('chapter-reader-content');
    if (dialog.open) reveal(page, true); else cancel(page);
  }).observe(dialog, { attributes: true, attributeFilter: ['open', 'data-chapter'] });
  window.RiBWCollectorV84 = { refresh };
})();
