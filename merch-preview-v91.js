/* Compact, native-surface artifact previews. One delegated listener set survives world changes. */
(() => {
  'use strict';
  if (window.RiMerchPreview) return;

  const cards = new Map();
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const frameLabel = state => `${state.product.name}. Изображение ${state.index + 1} из ${state.frames.length}: ${state.frames[state.index].alt || state.product.name}`;
  const isOverview = state => !!state.frames[state.index].overview;
  const renderFrame = state => isOverview(state)
    ? window.RiMerchMockups.renderProduct(state.product, 'card')
    : state.renderSurface(state.product, state.frames[state.index], 'card');
  const chevron = direction => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="${direction < 0 ? 'M14.5 6.5 9 12l5.5 5.5' : 'M9.5 6.5 15 12l-5.5 5.5'}" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const getCard = target => target?.closest?.('.merch-shelf-card-v91[data-merch-id]');
  const getState = card => card && cards.get(card.dataset.merchId);
  let gesture = null;
  let suppressedClick = null;

  function render(product, renderSurface) {
    const photos = product.gallery?.length ? product.gallery : [{src:product.image, alt:product.name}];
    const hasOverview = ['stickerpack','bookmarks'].includes(product.id);
    const frames = hasOverview ? [{overview:true, alt:product.id==='bookmarks'?'Две стороны закладки':'Общий вид всего комплекта'}, ...photos] : photos;
    const previous = cards.get(product.id);
    const state = {product, frames, hasOverview, renderSurface, index:Math.min(previous?.index || 0, frames.length - 1)};
    cards.set(product.id, state);
    const id = escape(product.id);
    const controls = frames.length > 1 ? `<div class="merch-preview-controls-v91" role="group" aria-label="Изображения: ${escape(product.name)}"><button type="button" data-merch-preview-step="-1" aria-label="Предыдущее изображение: ${escape(product.name)}">${chevron(-1)}</button><span class="merch-preview-count-v91 sr-only" role="status" aria-live="polite" aria-atomic="true">${escape(frameLabel(state))}</span><button type="button" data-merch-preview-step="1" aria-label="Следующее изображение: ${escape(product.name)}">${chevron(1)}</button></div>` : '';
    const offer=window.RiCommerce?.offer(product.id);
    const summary=window.RiBuyOptions?.offerSummary(product)||'';
    const action=offer?window.RiBuyOptions?.purchaseAction(product)||'':'';
    return `<article class="product-card merch-card merch-shelf-card-v91" data-series="${escape(product.series || '')}" data-merch-id="${id}"><div class="merch-preview-v91" data-merch-preview-index="${state.index}"><button type="button" class="product-visual" data-product="${id}" aria-label="Подробнее: ${escape(frameLabel(state))}"><span class="merch-preview-art-v91${isOverview(state) ? ' merch-preview-art-v91--overview' : ''}">${renderFrame(state)}</span></button>${controls}</div><a class="product-name" href="#${id}" data-product="${id}">${escape(product.name)}</a>${summary}<div class="product-buy${offer?' commerce-actions-v97':''}">${action}<button type="button" class="add-button${offer?' commerce-details-v97':''}" data-product="${id}" aria-label="Подробнее: ${escape(product.name)}">Подробнее <span aria-hidden="true">↗</span></button></div></article>`;
  }

  function select(card, index) {
    const state = getState(card);
    if (!state || state.frames.length < 2) return false;
    state.index = (index + state.frames.length) % state.frames.length;
    const preview = card.querySelector('.merch-preview-v91');
    preview.dataset.merchPreviewIndex = String(state.index);
    const art = preview.querySelector('.merch-preview-art-v91');
    art.classList.toggle('merch-preview-art-v91--overview', isOverview(state));
    art.innerHTML = renderFrame(state);
    preview.querySelector('.product-visual').setAttribute('aria-label', `Подробнее: ${frameLabel(state)}`);
    const counter = preview.querySelector('.merch-preview-count-v91');
    counter.textContent = frameLabel(state);
    return true;
  }

  function step(card, direction) {
    const state = getState(card);
    return state ? select(card, state.index + direction) : false;
  }

  function open(id, showProduct, selectGalleryImage) {
    showProduct(id);
    const state = cards.get(id);
    if (state && state.product.gallery?.length > 1) selectGalleryImage(id, state.hasOverview ? Math.max(0, state.index - 1) : state.index);
  }

  // A completed horizontal swipe must never also open the detail dialog.
  document.addEventListener('click', event => {
    if (!suppressedClick) return;
    if (Date.now() > suppressedClick.until) { suppressedClick = null; return; }
    const card = getCard(event.target);
    if (card?.dataset.merchId !== suppressedClick.id || !event.target.closest('.merch-preview-v91 .product-visual')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressedClick = null;
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-merch-preview-step]');
    if (!button) return;
    const card = getCard(button);
    if (!card) return;
    event.preventDefault();
    step(card, Number(button.dataset.merchPreviewStep));
  });

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const preview = event.target.closest?.('.merch-preview-v91');
    const card = getCard(preview);
    const state = getState(card);
    if (!state || state.frames.length < 2) return;
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    if (key === 'Home') select(card, 0);
    else if (key === 'End') select(card, state.frames.length - 1);
    else step(card, key === 'ArrowRight' ? 1 : -1);
  });

  document.addEventListener('pointerdown', event => {
    gesture = null;
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) return;
    const visual = event.target.closest?.('.merch-preview-v91 .product-visual');
    const card = getCard(visual);
    if (!visual || (getState(card)?.frames.length || 0) < 2) return;
    gesture = {pointerId:event.pointerId, card, visual, x:event.clientX, y:event.clientY, horizontal:false};
  }, {passive:true});

  document.addEventListener('pointermove', event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = Math.abs(event.clientX - gesture.x);
    const dy = Math.abs(event.clientY - gesture.y);
    if (!gesture.horizontal && dy > 14 && dy > dx) { gesture = null; return; }
    if (dx > 14 && dx > dy * 1.35) gesture.horizontal = true;
    if (gesture.horizontal && event.cancelable) event.preventDefault();
  }, {passive:false});

  document.addEventListener('pointerup', event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const current = gesture;
    gesture = null;
    const dx = event.clientX - current.x;
    const dy = Math.abs(event.clientY - current.y);
    if (!current.horizontal || Math.abs(dx) < 36 || Math.abs(dx) < dy * 1.35) return;
    event.preventDefault();
    step(current.card, dx < 0 ? 1 : -1);
    suppressedClick = {id:current.card.dataset.merchId, until:Date.now() + 700};
  });
  document.addEventListener('pointercancel', event => {
    if (gesture?.pointerId === event.pointerId) gesture = null;
  }, {passive:true});

  window.RiMerchPreview = Object.freeze({render, open});
})();
