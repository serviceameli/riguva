(() => {
  'use strict';
  const dialog = document.getElementById('bonus-dialog');
  const content = document.getElementById('bonus-dialog-content');
  if (!dialog || !content || dialog.dataset.lightSheetV87) return;
  dialog.dataset.lightSheetV87 = 'true';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => document.body.dataset.world === 'shatserak'
    && !document.body.classList.contains('still') && !reduced.matches && !document.hidden;
  let animations = [];
  let decoration = [];
  let active = false;

  function clear() {
    active = false;
    for (const animation of animations) animation.cancel();
    animations = [];
    for (const node of decoration) node.remove();
    decoration = [];
    dialog.classList.remove('light-sheet-forming-v87');
    dialog.style.removeProperty('--light-leaf-height-v87');
  }

  function animate(node, frames, options) {
    const animation = node.animate(frames, { ...options, fill: 'both' });
    animations.push(animation);
    return animation;
  }

  function formSheet() {
    if (active || !dialog.open || dialog.dataset.view !== 'memo' || !canMove() || !dialog.animate) return;
    clear();
    active = true;
    dialog.scrollTop = 0;
    dialog.style.setProperty('--light-leaf-height-v87', dialog.clientHeight + 'px');
    dialog.classList.add('light-sheet-forming-v87');
    const leaf = document.createElement('div');
    leaf.className = 'archive-light-leaf-v87';
    leaf.setAttribute('aria-hidden', 'true');
    const edge = document.createElement('div');
    edge.className = 'archive-light-edge-v87';
    edge.setAttribute('aria-hidden', 'true');
    decoration = [leaf, edge];
    dialog.append(leaf, edge);
    try {
    const timing = { duration: 760, easing: 'cubic-bezier(.4,0,.25,1)' };
    const main = animate(dialog, [
      { clipPath: 'polygon(48% 4%, 52% 3%, 55% 96%, 48% 94%)', transform: 'perspective(1400px) rotateY(-13deg) rotateX(5deg) scale(.94)', offset: 0 },
      { clipPath: 'polygon(2% 0%, 97% 0%, 100% 99%, 0% 100%)', transform: 'perspective(1400px) rotateY(-3deg) rotateX(1deg) scale(.99)', offset: .58 },
      { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', transform: 'perspective(1400px) rotateY(0deg) rotateX(0deg) scale(1)', offset: 1 }
    ], timing);
    animate(leaf, [
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: .32 },
      { clipPath: 'inset(0 0 0 100%)', opacity: .55, offset: .92 },
      { clipPath: 'inset(0 0 0 100%)', opacity: 0, offset: 1 }
    ], timing);
    animate(edge, [
      { left: '41%', opacity: .7, offset: 0 },
      { left: '4%', opacity: .9, offset: .30 },
      { left: '92%', opacity: .55, offset: .90 },
      { left: '106%', opacity: 0, offset: 1 }
    ], timing);
    main.finished.then(clear, () => {});
    } catch {
      // Reading must remain available even if the animation engine fails.
      clear();
    }
  }

  // renderMemo changes both attributes and content in one synchronous task.
  // Observe only the view, so search, filters and the Odi insert never replay it.
  new MutationObserver(records => {
    if (!records.some(record => record.attributeName === 'data-view')) return;
    if (dialog.dataset.view === 'memo') formSheet();
    else clear();
  }).observe(dialog, { attributes: true, attributeFilter: ['data-view'] });
  dialog.addEventListener('close', clear);
  dialog.addEventListener('cancel', clear);
  dialog.addEventListener('pointerdown', () => { if (active) clear(); }, { passive: true });
  dialog.addEventListener('keydown', () => { if (active) clear(); });
  dialog.addEventListener('wheel', () => { if (active) clear(); }, { passive: true });
  reduced.addEventListener('change', () => { if (!canMove()) clear(); });
  for (const event of ['ri:atmosphere', 'ri:effects', 'resize']) {
    addEventListener(event, () => { if (active) clear(); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
})();
