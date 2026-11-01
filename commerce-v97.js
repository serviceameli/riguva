/* V97: approved demonstration offers and one local cart for both worlds.
   Payment and order submission are deliberately not connected. A future
   checkout service must validate its own prices, availability and quantities. */
(() => {
  'use strict';
  if (window.RiCommerce) return;

  const storageKey = 'riguva-cart-v97';
  const maxQuantity = 99;
  const moneyFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const money = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? moneyFormat.format(value) + '\u00a0₽' : '';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bookOffer = name => ({ name, kind:'book', price:1500, state:'preorder', statusText:'Предзаказ', orderable:true,
    edition:'Авторский самиздат', releaseDate:'2026-12-15', releaseLabel:'Ближайшая печать: 15 декабря', requestLabel:'' });
  const stockOffer = name => ({ name, kind:'merch', price:1000, state:'in_stock', statusText:'В наличии', orderable:true,
    edition:'', releaseDate:null, releaseLabel:'', requestLabel:'' });
  const candleOffer = name => ({ name, kind:'merch', price:1500, state:'announced', statusText:'Дроп 15 ноября', orderable:false,
    edition:'', releaseDate:'2026-11-15', releaseLabel:'15 ноября', requestLabel:'Сообщить о дропе' });
  const offers = Object.freeze(Object.fromEntries(Object.entries({
    shata:bookOffer('Шата'),
    sherka:bookOffer('Шерка'),
    stickerpack:stockOffer('Стикерпак «Черный Белый»'),
    bookmarks:stockOffer('Закладка «Черный Белый»'),
    'ribbed-candle':candleOffer('Ребристая свеча «Черный Белый»'),
    'book-candle':candleOffer('Свеча-книга «Черный Белый»'),
    'cerberus-figurine':{ name:'Фигурка «Цербер»', kind:'merch', price:null, state:'upcoming', statusText:'Предзаказ ожидается',
      orderable:false, edition:'', releaseDate:null, releaseLabel:'', requestLabel:'Сообщить о предзаказе' }
  }).map(([id, data]) => [id, Object.freeze({id, ...data})])));
  const offer = id => Object.hasOwn(offers, id) ? offers[id] : null;
  const orderable = id => {
    const item = offer(id);
    return !!item?.orderable && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0;
  };
  const catalog = new Map();
  const buttonFeedback = new WeakMap();
  let cart = new Map();
  let dialog = null, content = null, title = null, opener = null, initialized = false;
  let view = 'cart';
  let checkoutDraft = {};

  function sanitize(value) {
    const clean = new Map();
    if (!Array.isArray(value)) return clean;
    for (const line of value) {
      if (!line || typeof line.id !== 'string' || !orderable(line.id)
        || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
      clean.set(line.id, Math.min(maxQuantity, (clean.get(line.id) || 0) + line.quantity));
    }
    return clean;
  }
  function readSaved() {
    try { return sanitize(JSON.parse(window.localStorage.getItem(storageKey) || '[]')); }
    catch { return new Map(); }
  }
  cart = readSaved();

  function lines() {
    return Object.freeze([...cart].filter(([id]) => orderable(id)).map(([id, quantity]) => {
      const current = offer(id), product = catalog.get(id);
      return Object.freeze({ id, quantity, name:product?.name || current.name, image:product?.image || '',
        type:product?.type || current.kind, series:product?.series || '', unitPrice:current.price,
        lineTotal:current.price * quantity, state:current.state, statusText:current.statusText,
        releaseDate:current.releaseDate, releaseLabel:current.releaseLabel, edition:current.edition });
    }));
  }
  function getCart() {
    const items = lines();
    return Object.freeze({items, count:items.reduce((n, item) => n + item.quantity, 0), total:items.reduce((n, item) => n + item.lineTotal, 0)});
  }
  function save() {
    try { window.localStorage.setItem(storageKey, JSON.stringify([...cart].map(([id, quantity]) => ({id, quantity})))); }
    catch { /* The current tab still has a working cart if storage is unavailable. */ }
  }
  function hasDOM() { return typeof document !== 'undefined' && !!document.body; }
  function captureDraft() {
    if (!content || view !== 'checkout') return;
    for (const name of ['name', 'tel', 'email', 'address']) {
      const input = content.querySelector('[name="' + name + '"]');
      if (input) checkoutDraft[name] = input.value;
    }
  }
  function paintHeader() {
    if (!hasDOM()) return;
    const button = document.getElementById('cart-open');
    if (!button) return;
    const count = getCart().count;
    button.innerHTML = '<svg class="cart-icon-v97" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5h14l1 13H4l1-13Z"/><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/></svg><span class="cart-label-v97">Корзина</span><span class="cart-count-v97" data-cart-count aria-hidden="true">' + count + '</span>';
    button.setAttribute('aria-label', 'Корзина, товаров: ' + count);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'cart-dialog');
  }
  function announce(message) {
    if (!hasDOM()) return;
    const status = document.getElementById('cart-status-v97');
    if (status) status.textContent = message;
    if (typeof window.showToast === 'function') window.showToast(message);
  }
  function changed(message = '') {
    captureDraft();
    save();
    paintHeader();
    if (dialog?.open) render();
    if (message) announce(message);
    window.dispatchEvent?.(new CustomEvent('ri:cart-change', {detail:getCart()}));
  }
  function add(id, quantity = 1) {
    if (!orderable(id) || !Number.isInteger(quantity) || quantity < 1) return false;
    const previous = cart.get(id) || 0, next = Math.min(maxQuantity, previous + quantity);
    if (next === previous) return false;
    cart.set(id, next);
    changed('В корзине: «' + (catalog.get(id)?.name || offer(id).name) + '».');
    return true;
  }
  function setQuantity(id, quantity) {
    if (!cart.has(id) || !orderable(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return false;
    cart.set(id, quantity);
    changed();
    return true;
  }
  function remove(id) {
    if (!cart.delete(id)) return false;
    changed('Товар удалён из корзины.');
    return true;
  }
  function clear() { cart.clear(); changed(); }
  function registerCatalog(products) {
    if (!Array.isArray(products)) return;
    for (const product of products) {
      if (typeof product?.id !== 'string') continue;
      catalog.set(product.id, Object.freeze({id:product.id, name:String(product.name || ''), image:String(product.image || ''), type:product.type, series:product.series}));
    }
    paintHeader();
    if (dialog?.open) render();
  }
  const release = item => item.releaseLabel ? '<p class="cart-item-release-v97">' + escape(item.releaseLabel).replace(/(\d{1,2})\s+(декабря|ноября)/g, '$1&nbsp;$2') + '</p>' : '';
  const edition = item => item.edition ? '<p class="cart-item-edition-v97">' + escape(item.edition) + '</p>' : '';
  const totalMarkup = total => '<p class="cart-total-v97"><span>Итого за товары</span><strong>' + money(total) + '</strong></p>';

  function renderCart(state) {
    title.textContent = 'Корзина';
    if (!state.items.length) {
      content.innerHTML = '<div class="cart-empty-v97"><p>В корзине пока пусто.</p><p>Добавь бумажные книги или артефакты, доступные к покупке.</p><a class="cart-empty-link-v97" href="#shatserak/books" data-cart-browse>Книги Шацерака <span aria-hidden="true">↗</span></a><a class="cart-empty-link-v97" href="#black-white/merch" data-cart-browse>Артефакты <span aria-hidden="true">↗</span></a></div>';
      return;
    }
    content.innerHTML = '<div class="cart-lines-v97">' + state.items.map(item => {
      const name = escape(item.name), id = escape(item.id);
      const image = item.image ? '<img class="cart-image-v97" src="' + escape(item.image) + '" alt="' + name + '" width="92" height="120">' : '<span class="cart-image-v97" aria-hidden="true"></span>';
      return '<article class="cart-line-v97" data-cart-line="' + id + '">' + image + '<div class="cart-item-copy-v97"><h3>' + name + '</h3><p class="cart-item-status-v97">' + escape(item.statusText) + '</p>' + release(item) + edition(item) + '<p class="cart-unit-price-v97">' + money(item.unitPrice) + ' за шт.</p></div><div class="cart-quantity-v97" role="group" aria-label="Количество: ' + name + '"><button type="button" data-cart-step="-1" aria-label="Уменьшить количество: ' + name + '"' + (item.quantity === 1 ? ' disabled' : '') + '>−</button><output aria-label="Количество">' + item.quantity + '</output><button type="button" data-cart-step="1" aria-label="Увеличить количество: ' + name + '"' + (item.quantity === maxQuantity ? ' disabled' : '') + '>+</button></div><div class="cart-line-end-v97"><strong class="cart-line-price-v97">' + money(item.lineTotal) + '</strong><button type="button" class="cart-remove-v97" data-cart-remove="' + id + '" aria-label="Удалить: ' + name + '">Удалить</button></div></article>';
    }).join('') + '</div><footer class="cart-footer-v97">' + totalMarkup(state.total) + '<p class="cart-delivery-note-v97">Стоимость доставки будет рассчитана отдельно.</p><button type="button" class="cart-primary-v97" data-cart-checkout>Оформить заказ <span aria-hidden="true">↗</span></button></footer>';
  }
  function renderCheckout(state) {
    title.textContent = 'Оформление заказа';
    const value = name => escape(checkoutDraft[name] || '');
    content.innerHTML = '<button type="button" class="cart-back-v97" data-cart-back><span aria-hidden="true">←</span> Вернуться в корзину</button><div class="checkout-summary-v97" aria-label="Состав заказа">' + state.items.map(item => '<div class="checkout-line-v97"><div><strong>' + escape(item.name) + '</strong><p>' + item.quantity + ' шт. · ' + money(item.unitPrice) + '</p><p class="cart-item-status-v97">' + escape(item.statusText) + '</p>' + release(item) + '</div><strong>' + money(item.lineTotal) + '</strong></div>').join('') + '</div><form id="checkout-form-v97" class="checkout-form-v97" autocomplete="on"><fieldset disabled class="checkout-fields-v97"><legend>Контакты и доставка</legend><label for="checkout-name-v97">Имя<input id="checkout-name-v97" name="name" type="text" autocomplete="name" maxlength="160" value="' + value('name') + '"></label><label for="checkout-tel-v97">Телефон<input id="checkout-tel-v97" name="tel" type="tel" inputmode="tel" autocomplete="tel" maxlength="80" value="' + value('tel') + '"></label><label for="checkout-email-v97">Email<input id="checkout-email-v97" name="email" type="email" autocomplete="email" maxlength="254" value="' + value('email') + '"></label><label for="checkout-address-v97">Адрес доставки<textarea id="checkout-address-v97" name="address" autocomplete="shipping street-address" rows="3" maxlength="1000">' + value('address') + '</textarea></label></fieldset><footer class="cart-footer-v97">' + totalMarkup(state.total) + '<p class="cart-delivery-note-v97">Стоимость доставки будет рассчитана отдельно.</p><p class="cart-demo-note-v97" id="checkout-demo-note-v97">Это демонстрация оформления. Онлайн-оплата пока не подключена, заказ не отправляется.</p><button type="button" class="cart-primary-v97" data-cart-pay disabled aria-describedby="checkout-demo-note-v97">Оплатить ' + money(state.total) + '</button></footer></form>';
  }
  function render() {
    if (!content || !title) return;
    const state = getCart();
    if (!state.items.length) view = 'cart';
    dialog.dataset.cartView = view;
    if (view === 'checkout') renderCheckout(state);
    else renderCart(state);
  }
  function openCart(trigger) {
    init();
    if (!dialog) return false;
    opener = trigger?.isConnected ? trigger : document.activeElement;
    view = 'cart';
    render();
    if (!dialog.open) dialog.showModal();
    content.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
    title.focus({preventScroll:true});
    return true;
  }
  function closeCart() { if (dialog?.open) dialog.close(); }
  function init() {
    if (initialized || !hasDOM()) return;
    initialized = true;
    dialog = document.createElement('dialog');
    dialog.id = 'cart-dialog';
    dialog.className = 'cart-dialog-v97';
    dialog.setAttribute('aria-labelledby', 'cart-title-v97');
    dialog.innerHTML = '<header class="cart-header-v97"><div><p class="cart-kicker-v97">Магазин Ри Гува</p><h2 id="cart-title-v97" tabindex="-1">Корзина</h2></div><button type="button" class="cart-close-v97" data-cart-close aria-label="Закрыть корзину">×</button></header><div id="cart-content-v97"></div>';
    const status = document.createElement('div');
    status.id = 'cart-status-v97';
    status.className = 'cart-status-v97';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    document.body.append(dialog, status);
    content = document.getElementById('cart-content-v97');
    title = document.getElementById('cart-title-v97');
    dialog.addEventListener('close', () => {
      checkoutDraft = {};
      view = 'cart';
      render();
      if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
      if (opener?.isConnected) opener.focus({preventScroll:true});
      opener = null;
    });
    dialog.addEventListener('submit', event => event.preventDefault());
    document.addEventListener('click', event => {
      const addButton = event.target.closest?.('[data-cart-add]');
      if (addButton) {
        event.preventDefault();
        if (add(addButton.dataset.cartAdd)) {
          const previous = buttonFeedback.get(addButton);
          const label = previous ? previous.label : addButton.innerHTML;
          const ariaLabel = previous ? previous.ariaLabel : addButton.getAttribute('aria-label');
          if (previous) clearTimeout(previous.timer);
          addButton.innerHTML = 'Добавлено <span aria-hidden="true">✓</span>';
          addButton.setAttribute('aria-label', 'Добавлено в корзину');
          const timer = setTimeout(() => {
            buttonFeedback.delete(addButton);
            if (!addButton.isConnected) return;
            addButton.innerHTML = label;
            if (ariaLabel === null) addButton.removeAttribute('aria-label');
            else addButton.setAttribute('aria-label', ariaLabel);
          }, 1600);
          buttonFeedback.set(addButton, {label, ariaLabel, timer});
        }
        return;
      }
      const openButton = event.target.closest?.('[data-cart-open]');
      if (openButton) { event.preventDefault(); openCart(openButton); return; }
      if (!event.target.closest?.('#cart-dialog')) return;
      const closeButton = event.target.closest('[data-cart-close]');
      if (closeButton) { event.preventDefault(); closeCart(); return; }
      const removeButton = event.target.closest('[data-cart-remove]');
      if (removeButton) {
        event.preventDefault();
        remove(removeButton.dataset.cartRemove);
        title.focus({preventScroll:true});
        return;
      }
      const stepButton = event.target.closest('[data-cart-step]');
      if (stepButton) {
        event.preventDefault();
        const id = stepButton.closest('[data-cart-line]').dataset.cartLine, step = Number(stepButton.dataset.cartStep);
        if (setQuantity(id, (cart.get(id) || 0) + step)) {
          const replacement = [...content.querySelectorAll('[data-cart-line]')].find(n => n.dataset.cartLine === id)?.querySelector('[data-cart-step="' + step + '"]');
          (replacement?.disabled ? title : replacement)?.focus({preventScroll:true});
        }
        return;
      }
      if (event.target.closest('[data-cart-checkout]')) {
        event.preventDefault();
        if (!getCart().items.length) return;
        view = 'checkout'; render(); content.scrollTop = 0; dialog.scrollTop = 0; title.focus({preventScroll:true});
        return;
      }
      if (event.target.closest('[data-cart-back]')) {
        event.preventDefault(); captureDraft(); view = 'cart'; render(); content.scrollTop = 0; dialog.scrollTop = 0; title.focus({preventScroll:true});
        return;
      }
      if (event.target.closest('[data-cart-browse]')) closeCart();
    });
    paintHeader();
    render();
  }
  window.addEventListener?.('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    captureDraft();
    cart = readSaved();
    paintHeader();
    if (dialog?.open) render();
    window.dispatchEvent?.(new CustomEvent('ri:cart-change', {detail:getCart()}));
  });
  window.RiCommerce = Object.freeze({offer, money, registerCatalog, add, setQuantity, remove, clear, getCart, openCart, closeCart, storageKey, maxQuantity});
  init();
  if (typeof document !== 'undefined' && !document.body) document.addEventListener('DOMContentLoaded', init, {once:true});
})();
