/* The spoiler gate owns entry into the memo. This module only holds that
   explicit confirmation long enough to open the decorative archive volume. */
(() => {
  'use strict';
  const dialog = document.getElementById('bonus-dialog');
  const content = document.getElementById('bonus-dialog-content');
  if (!dialog || !content || dialog.dataset.archiveBookV87) return;
  dialog.dataset.archiveBookV87 = 'true';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let opening = null;
  let session = 0;

  const atGate = () => dialog.open && dialog.dataset.view === 'warning'
    && document.body.dataset.world === 'shatserak';
  const motionAllowed = () => !reduced.matches
    && !document.body.classList.contains('still') && !document.hidden;

  function makeStage() {
    if (!atGate()) return null;
    const existing = content.querySelector('.archive-book-stage-v87');
    if (existing) return existing;
    const original = content.querySelector('.archive-warning-art-v67');
    if (!original) return null;
    const stage = document.createElement('div');
    stage.className = 'archive-book-stage-v87';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `<div class="archive-book-shadow-v87"></div>
      <div class="archive-book-volume-v87">
        <div class="archive-book-board-v87"></div>
        <div class="archive-book-block-v87"></div>
        <div class="archive-book-paper-v87 archive-book-paper-base-v87"></div>
        <div class="archive-book-leaf-v87 archive-book-leaf-one-v87"><i class="archive-book-face-v87"></i><i class="archive-book-face-v87 archive-book-face-back-v87"></i></div>
        <div class="archive-book-leaf-v87 archive-book-leaf-two-v87"><i class="archive-book-face-v87"></i><i class="archive-book-face-v87 archive-book-face-back-v87"></i></div>
        <div class="archive-book-leaf-v87 archive-book-leaf-three-v87"><i class="archive-book-face-v87"></i><i class="archive-book-face-v87 archive-book-face-back-v87"></i></div>
        <div class="archive-book-cover-v87"><i class="archive-book-cover-front-v87"></i><i class="archive-book-cover-back-v87"></i></div>
        <div class="archive-book-binding-v87"></div>
      </div>`;
    stage.querySelectorAll('.archive-book-leaf-v87 > .archive-book-face-v87').forEach(face => {
      for (let index = 0; index < 3; index += 1) {
        const strip = document.createElement('span');
        strip.className = 'archive-page-strip-v99';
        strip.dataset.stripIndex = String(index);
        face.append(strip);
      }
    });
    const idle = document.createElement('img');
    idle.className = 'archive-book-idle-v96';
    idle.src = original.currentSrc || original.src;
    idle.alt = '';
    idle.width = 250;
    idle.height = 226;
    idle.decoding = 'async';
    stage.prepend(idle);
    original.before(stage);
    original.hidden = true;
    original.closest('.archive-warning-v67')?.classList.add('has-archive-book-v87');
    return stage;
  }

  function clearOpening() {
    const current = opening;
    if (!current) return;
    opening = null;
    clearTimeout(current.timer);
    cancelAnimationFrame(current.frame);
    current.stage.removeEventListener('animationend', current.onEnd);
    current.stage.classList.remove('is-opening');
    current.warning.removeAttribute('aria-busy');
    if (current.button) {
      if (current.ariaDisabled === null) current.button.removeAttribute('aria-disabled');
      else current.button.setAttribute('aria-disabled', current.ariaDisabled);
    }
  }

  function cancelOpening() {
    session += 1;
    clearOpening();
  }

  function finishOpening(token) {
    const current = opening;
    if (!current || current.token !== token) return;
    const proceed = current.proceed;
    const canProceed = session === token && atGate()
      && current.stage.isConnected && current.warning.isConnected;
    clearOpening();
    if (canProceed) proceed();
  }

  dialog.addEventListener('ri:archive-open', event => {
    if (typeof event.detail?.proceed !== 'function' || !atGate()) return;
    // The original gate continues synchronously whenever movement is off.
    if (!motionAllowed()) return;
    const stage = makeStage();
    if (!stage) return;
    event.preventDefault();
    if (opening) return;
    const warning = stage.closest('.archive-warning-v67');
    const button = warning.querySelector('[data-memo-confirm]');
    const token = ++session;
    const current = {
      token, stage, warning, button, proceed: event.detail.proceed,
      ariaDisabled: button?.getAttribute('aria-disabled') ?? null,
      timer: 0, frame: 0, onEnd: null
    };
    opening = current;
    warning.setAttribute('aria-busy', 'true');
    button?.setAttribute('aria-disabled', 'true');
    current.onEnd = end => {
      if (end.animationName === 'archive-leaf-three-v87') finishOpening(token);
    };
    stage.addEventListener('animationend', current.onEnd);
    current.frame = requestAnimationFrame(() => {
      if (opening !== current || !atGate()) { cancelOpening(); return; }
      stage.classList.add('is-opening');
      // Bounded fallback also covers a CSS or animation-event failure.
      current.timer = setTimeout(() => finishOpening(token), 820);
    });
  });

  function refresh() {
    if (opening && (!atGate() || !opening.stage.isConnected)) cancelOpening();
    else if (opening && !motionAllowed()) finishOpening(opening.token);
    if (atGate()) makeStage();
  }

  new MutationObserver(refresh).observe(content, { childList: true });
  new MutationObserver(refresh).observe(dialog, {
    attributes: true, attributeFilter: ['open', 'data-view']
  });
  new MutationObserver(refresh).observe(document.body, {
    attributes: true, attributeFilter: ['data-world', 'class']
  });
  dialog.addEventListener('cancel', cancelOpening);
  dialog.addEventListener('close', cancelOpening);
  reduced.addEventListener('change', refresh);
  addEventListener('ri:effects', refresh);
  document.addEventListener('visibilitychange', refresh);
  refresh();
})();
