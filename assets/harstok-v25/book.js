(() => {
  'use strict';
  const entries = window.HarstokMemo;
  const {groupLetters, paginate} = window.HarstokPagination;
  const host = document.querySelector('harstok-library');
  const dom = host?.shadowRoot || document;
  const $ = (selector) => dom.querySelector(selector);
  const book = $('#book');
  if (!book) return;
  const scene = book.closest('.harstok-scene');
  const hall = $('#library-hall');
  const shelf = $('#library-shelf');
  const hallEntry = $('#hall-entry');
  const hallReturn = $('#hall-return');
  const hallCamera = $('.hall-camera');
  const hallTimeout = 1220;
  const entry = $('#library-entry');
  const entryArt = entry.querySelector('.entry-book-object');
  const entryTimeout = 1150;
  const spread = $('#spread');
  const cover = $('#cover');
  const lid = $('#lid');
  const before = $('#before');
  const workspace = $('#workspace');
  const query = $('#query');
  const under = $('#under');
  const pager = $('#pager');
  const probe = $('#probe');
  const status = $('#page-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px)');
  const motion = () => !reduced.matches && !(host && document.body.classList.contains('still'));
  const categories = {contents: 'Герои и места', character: 'Персонажи', place: 'Места', term: 'Понятия'};
  const assetRoot = new URL('../', document.currentScript.src);
  const portrait = new URL('bonus/odi-author.jpg', assetRoot).href;
  const portraitRoot = new URL('portraits/', document.currentScript.src);
  const portraitSizes = '(max-width: 899px) 210px, min(512px, calc(50vw - 82px), max(1px, calc(66.67svh - 150px)))';
  const odiId = 'entry-060';
  const profiles = new Map([
    ['entry-030', {image: 'gonnik'}],
    ['entry-039', {image: 'kian'}],
    ['entry-057', {image: 'mitra'}],
    [odiId, {}],
    ['entry-073', {image: 'ruolan'}],
    ['entry-096', {image: 'yunsu'}]
  ]);
  const portraitEntries = entries.filter(({id}) => profiles.has(id));
  const profileIdFor = (id) => id === 'entry-088' ? 'entry-057' : id;
  const normalize = (text) => text.toLocaleLowerCase('ru').normalize('NFD').replace(/\u0301/gu, '').normalize('NFC').replace(/ё/gu, 'е');
  const safe = (text) => String(text).replace(/[&<>"']/gu, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const ornament = '<span aria-hidden="true">◇</span>';
  const folio = (side, inner, extra = '') => `<div class="folio folio-${side} ${extra}"><div class="leaf-inner">${inner}</div></div>`;
  const frame = (left, right, leftClass) => folio('left', left, leftClass) + folio('right', right);
  const tag = (text) => `<p class="eyebrow ink-eyebrow">${text}</p>`;
  const heading = (text) => `<h1 tabindex="-1" id="view-title">${text}</h1>`;
  let view = 'contents';
  let page = 0;
  let total = 1;
  let openTimer;
  let entryTimer;
  let hallTimer;
  let searchTimer;
  let resizeTimer;
  let opened = false;
  let metrics;
  let cache;
  let turning;

  function groupsMarkup(groups) {
    return `<div class="letter-list">${groups.map(([letter, list]) =>
      `<section class="letter-group" aria-label="Буква ${safe(letter)}"><h2>${safe(letter)}</h2><dl>${list.map(({id, name, description}) =>
        `<div class="reference" data-entry="${safe(id)}"><dt>${profiles.has(profileIdFor(id)) ? `<button type="button" data-profile="${profileIdFor(id)}" class="entry-link">${safe(name)} <span aria-hidden="true">→</span></button>` : safe(name)}</dt><dd>${safe(description)}</dd></div>`
      ).join('')}</dl></section>`
    ).join('')}</div>`;
  }

  function readMetrics() {
    if (metrics) return metrics;
    probe.innerHTML = folio('right', `<div class="index-heading"></div>${groupsMarkup(groupLetters(entries))}`);
    const leaf = probe.querySelector('.folio');
    const st = getComputedStyle(leaf);
    const headingHeight = leaf.querySelector('.index-heading').getBoundingClientRect().height;
    const height = Math.max(100, probe.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom) - headingHeight - 3);
    const rowGap = parseFloat(getComputedStyle(leaf.querySelector('dl')).rowGap);
    const letterGap = parseFloat(getComputedStyle(leaf.querySelector('.letter-list')).rowGap);
    const rows = new Map();
    const letters = new Map();
    for (const group of leaf.querySelectorAll('.letter-group')) {
      letters.set(group.querySelector('h2').textContent, group.getBoundingClientRect().height - group.querySelector('dl').getBoundingClientRect().height);
      for (const row of group.querySelectorAll('[data-entry]')) rows.set(row.dataset.entry, row.getBoundingClientRect().height);
    }
    metrics = {
      maxHeight: height,
      measure(groups) {
        return groups.reduce((sum, [letter, list]) => sum + letters.get(letter) + (list.length - 1) * rowGap +
          list.reduce((n, row) => n + rows.get(row.id), 0), Math.max(0, groups.length - 1) * letterGap);
      }
    };
    probe.replaceChildren();
    return metrics;
  }

  function indexCache(kind, term) {
    const key = `${kind}:${term}`;
    if (!cache || cache.key !== key) {
      const list = entries.filter(({kind: category, name, description}) =>
        (kind === 'contents' || category === kind) && (!term || normalize(name + ' ' + description).includes(term)));
      const spreads = paginate(list, readMetrics());
      if (kind === 'contents' && !term) {
        probe.innerHTML = folio('right', odiText('full'));
        probe.firstElementChild.dataset.faceView = 'profile';
        const splitOdi = profileOverflows(probe);
        probe.replaceChildren();
        for (const {id} of portraitEntries) {
          if (id === odiId && splitOdi) spreads.push({profile: id, part: 'start'}, {profile: id, part: 'end'});
          else spreads.push({profile: id});
        }
      }
      cache = {key, count: list.length, spreads};
    }
    return cache;
  }

  function drawIndex(kind, term, keepEntry, keepProfile) {
    const {spreads, count} = indexCache(kind, term);
    const title = term ? 'Поиск по книге' : categories[kind];
    total = spreads.length;
    if (keepProfile || keepEntry) {
      const found = spreads.findIndex(({profile, left, right}) => profile
        ? profile === keepProfile
        : [...left, ...right].some(([, list]) => list.some((entry) => entry.id === keepEntry)));
      if (found >= 0) page = found;
    }
    page = Math.max(0, Math.min(page, total - 1));
    const current = spreads[page];
    if (current.profile) {
      drawProfile(current);
      return;
    }
    const {left, right} = current;
    const searchCount = term ? tag(`Найдено: ${count}`) : '';
    spread.innerHTML = frame(
      `<div class="index-heading">${heading(title)}${searchCount}</div>${left.length ? groupsMarkup(left) : '<p class="empty">Попробуйте другое имя или название.</p>'}`,
      right.length
        ? `<div class="index-heading"><p class="display-title">${title}</p></div>${groupsMarkup(right)}`
        : `<div class="blank-page">${ornament}</div>`
    );
  }

  const odiStart = `<p><strong>Происхождение:</strong> Западный эбис</p>
    <p>Невысокий, немного сухопарый, белые кудрявые волосы, которые чаще всего носит в хвосте. Много улыбается.</p>
    <p>Несмотря на телосложение, является одним из лучших бойцов Йоса. Капитан отряда, превосходный наездник и лучник. Пользуется большой популярностью среди девушек.</p>
    <p>Оди не хотели принимать в Йос из-за происхождения (эбиситы славились невыносимым характером и отсутствием гуманности). Сам себя Оди называл неправильным эбиситом и утверждал, что должен был родиться в Северном Юшене. Позже капитан его первого отряда стал говорить так же.</p>`;
  const odiEnd = `<h2>Что он делает, когда никто не видит</h2>
    <p>Пишет письма пожилым родителям, которых был вынужден оставить в Эбисе.</p>
    <blockquote>«Ты достаточно усердно тренируешься, но суть в том, какой бы сильной ты ни была, всегда найдется тот, кто сильнее».</blockquote>`;
  function odiText(part) {
    return `${tag(part === 'end' ? 'Продолжение' : 'Из материалов автора')}${heading('Оди')}
      <div class="biography">${part !== 'end' ? odiStart : ''}${part !== 'start' ? odiEnd : ''}</div>
      ${part !== 'start' ? `<a class="source-link" href="${portrait}" download="Оди · авторская карточка.jpg">Скачать карточку <span aria-hidden="true">↓</span></a>` : ''}`;
  }
  function odi(part) {
    return frame(
      `<figure class="portrait"><div class="portrait-window"><img src="${portrait}" width="533" height="800" alt="Оди, светловолосый воин, улыбается. Авторская иллюстрация Ри Гувы."></div><figcaption>Оди · авторская иллюстрация</figcaption></figure>`,
      odiText(part),
      'photo-leaf'
    );
  }
  function profileOverflows(container) {
    if (!desktop.matches) return false;
    const leaf = container.querySelector('.folio-right');
    const style = getComputedStyle(leaf);
    return leaf.querySelector('.leaf-inner').getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) > leaf.clientHeight - 1;
  }

  function drawProfile({profile, part = 'full'}) {
    spread.dataset.view = 'profile';
    spread.dataset.profileId = profile;
    if (profile !== odiId) {
      const {name, description} = entries.find((entry) => entry.id === profile);
      const {image} = profiles.get(profile);
      const small = new URL(`${image}-640.webp`, portraitRoot).href;
      const large = new URL(`${image}-1024.webp`, portraitRoot).href;
      spread.innerHTML = frame(
        `<figure class="portrait"><img class="portrait-art" sizes="${portraitSizes}" srcset="${small} 640w, ${large} 1024w" src="${small}" width="1024" height="1536" decoding="async" alt="${safe(name)}. Иллюстрация для сайта."><figcaption>${safe(name)} · иллюстрация для сайта</figcaption></figure>`,
        `${tag('Из памятки автора')}${heading(safe(name))}<div class="biography character-bio"><p>${safe(description)}</p></div>`,
        'photo-leaf'
      );
      return;
    }
    spread.innerHTML = odi(part);
    if (part !== 'full') spread.dataset.compact = '';
  }

  function syncPageStacks() {
    if (view !== 'contents' || query.value.trim()) return;
    const progress = page / Math.max(1, total - 1);
    book.style.setProperty('--stack-left', `${(2 + progress * 6).toFixed(2)}px`);
    book.style.setProperty('--stack-right', `${(8 - progress * 6).toFixed(2)}px`);
  }

  function draw({focus = false, keepEntry, keepProfile, holdStacks = false} = {}) {
    const focusedTurn = pager.contains(dom.activeElement) ? dom.activeElement : null;
    const term = normalize(query.value).trim();
    spread.dataset.view = term ? 'search' : view;
    delete spread.dataset.compact;
    delete spread.dataset.profileId;
    drawIndex(view, term, keepEntry, keepProfile);
    const wear = ['handled', 'crease', 'stained', ''];
    for (const [side, leaf] of Array.from(spread.children).entries()) {
      const number = 2 * page + side;
      const marks = wear[(3 * page + side) % wear.length];
      if (marks) leaf.dataset.wear = marks;
      if (number && (view === 'contents' && !term)) {
        const folioNumber = document.createElement('span');
        folioNumber.className = 'folio-number';
        folioNumber.textContent = number;
        folioNumber.setAttribute('aria-hidden', 'true');
        leaf.append(folioNumber);
      }
    }
    status.textContent = `Разворот ${page + 1} из ${total}`;
    pager.querySelector('[data-turn="-1"]').setAttribute('aria-disabled', String(page === 0));
    pager.querySelector('[data-turn="1"]').setAttribute('aria-disabled', String(page >= total - 1));
    for (const filter of workspace.querySelectorAll('[data-view]')) {
      filter.setAttribute('aria-pressed', String(filter.dataset.view === view));
    }
    if (!holdStacks) syncPageStacks();
    if (focus || focusedTurn?.getAttribute('aria-disabled') === 'true') {
      spread.querySelector('h1')?.focus({preventScroll:true});
    }
  }

  function visualFace(leaf, view, compact) {
    leaf.dataset.faceView = view;
    leaf.toggleAttribute('data-face-compact', compact);
    leaf.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    return leaf;
  }
  function stopTurn() {
    if (!turning) return;
    turning.cancel();
    turning.sheet.remove();
    turning.rest.remove();
    turning = null;
    syncPageStacks();
  }
  function withTurn(direction, change, focus, {duration, onFinish, render = draw} = {}) {
    stopTurn();
    const animate = desktop.matches && motion();
    const from = direction > 0 ? 'right' : 'left';
    const to = direction > 0 ? 'left' : 'right';
    const oldView = spread.dataset.view;
    const oldCompact = spread.hasAttribute('data-compact');
    const front = animate ? spread.querySelector(`.folio-${from}`) : null;
    const stationary = animate ? spread.querySelector(`.folio-${to}`) : null;
    const width = front?.getBoundingClientRect().width;
    change();
    render({focus, holdStacks: animate && Boolean(width)});
    if (!desktop.matches && book.getBoundingClientRect().top < 0) {
      book.scrollIntoView({block:'start', behavior:'instant'});
    }
    if (!animate || !width) {
      onFinish?.();
      return;
    }
    const back = spread.querySelector(`.folio-${to}`).cloneNode(true);
    const rest = document.createElement('div');
    const sheet = document.createElement('div');
    sheet.className = `flip-sheet${direction < 0 ? ' backwards' : ''}`;
    rest.className = `turn-rest${direction < 0 ? ' backwards' : ''}`;
    for (const layer of [sheet, rest]) {
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
    }
    rest.append(visualFace(stationary, oldView, oldCompact));
    const cancel = window.HarstokCurl.play({
      sheet, rest, width, direction, duration,
      front: visualFace(front, oldView, oldCompact),
      back: visualFace(back, spread.dataset.view, spread.hasAttribute('data-compact')),
      onContact() {
        if (turning?.sheet === sheet) syncPageStacks();
      },
      onFinish() {
        if (turning?.sheet !== sheet) return;
        stopTurn();
        onFinish?.();
      }
    });
    turning = {sheet, rest, cancel};
    book.append(rest, sheet);
  }
  function turn(direction) {
    if (!opened || book.dataset.state !== 'open') return;
    if (page + direction < 0 || page + direction >= total) return;
    withTurn(direction, () => { page += direction; }, spread.contains(dom.activeElement));
  }

  function finishOpening() {
    if (book.dataset.state !== 'endpapers' && book.dataset.state !== 'opening') return;
    clearTimeout(openTimer);
    book.dataset.state = 'open';
    spread.inert = false;
    spread.removeAttribute('aria-hidden');
    before.hidden = true;
    lid.hidden = true;
    workspace.hidden = false;
    pager.hidden = false;
    spread.querySelector('h1')?.focus({preventScroll:true});
  }
  function showEndpapers() {
    if (book.dataset.state !== 'opening') return;
    clearTimeout(openTimer);
    book.dataset.state = 'endpapers';
    openTimer = setTimeout(() => {
      lid.hidden = true;
      withTurn(1, () => {}, false, {duration:620, onFinish:finishOpening});
    }, 360);
  }
  function drawEndpapers() {
    spread.dataset.view = 'endpapers';
    delete spread.dataset.compact;
    delete spread.dataset.profileId;
    spread.innerHTML = folio('left', '', 'pasted-endpaper') + folio('right', '', 'free-endpaper');
  }
  function finishClosing() {
    clearTimeout(openTimer);
    const returning = book.dataset.state === 'closing';
    opened = false;
    book.dataset.state = 'closed';
    before.hidden = false;
    under.hidden = false;
    workspace.hidden = true;
    pager.hidden = true;
    spread.inert = true;
    spread.setAttribute('aria-hidden', 'true');
    spread.replaceChildren();
    lid.hidden = false;
    if (returning) alignEntryCover();
    scene.dataset.mode = returning ? 'returning' : 'entrance';
    if (returning) entryTimer = setTimeout(finishReturn, entryTimeout);
    else finishReturn();
  }
  function finishReturn() {
    clearTimeout(entryTimer);
    scene.dataset.mode = 'entrance';
    shelf.inert = false;
    entry.setAttribute('aria-expanded', 'false');
    entry.focus({preventScroll:true});
  }
  function close() {
    if (book.dataset.state === 'closing-pages' || book.dataset.state === 'closing') return;
    clearTimeout(openTimer);
    clearTimeout(searchTimer);
    stopTurn();
    spread.inert = true;
    workspace.hidden = true;
    pager.hidden = true;
    if (!motion() || book.dataset.state !== 'open') {
      finishClosing();
      return;
    }
    book.dataset.state = 'closing-pages';
    withTurn(-1, () => {
      view = 'contents';
      page = 0;
      query.value = '';
    }, false, {
      duration: 420,
      render: drawEndpapers,
      onFinish() {
        lid.hidden = false;
        book.dataset.state = 'closing';
        openTimer = setTimeout(finishClosing, 580);
      }
    });
  }
  function openBook() {
    opened = true;
    view = 'contents';
    page = 0;
    total = 1;
    query.value = '';
    under.hidden = true;
    const play = motion();
    book.dataset.motion = play ? 'on' : 'off';
    if (play) {
      drawEndpapers();
      syncPageStacks();
      book.dataset.state = 'opening';
      openTimer = setTimeout(showEndpapers, 800);
    } else {
      book.dataset.state = 'opening';
      draw();
      finishOpening();
    }
  }
  function enterReader() {
    if (scene.dataset.mode !== 'entering') return;
    clearTimeout(entryTimer);
    scene.dataset.mode = 'reader';
    // Measure the visible, closed book before rotating its cover.
    book.getBoundingClientRect();
    openBook();
  }
  function alignEntryCover() {
    const source = entryArt.getBoundingClientRect();
    const target = lid.getBoundingClientRect();
    entryArt.style.setProperty('--approach-x', `${target.x + target.width / 2 - source.x - source.width / 2}px`);
    entryArt.style.setProperty('--approach-y', `${target.y + target.height / 2 - source.y - source.height / 2}px`);
    entryArt.style.setProperty('--entry-zoom-x', target.width / source.width);
    entryArt.style.setProperty('--entry-zoom-y', target.height / source.height);
  }
  function finishHallTravel() {
    const mode = scene.dataset.mode;
    if (mode !== 'approaching' && mode !== 'withdrawing') return;
    clearTimeout(hallTimer);
    const arrivedAtShelf = mode === 'approaching';
    scene.dataset.mode = arrivedAtShelf ? 'entrance' : 'hall';
    hall.inert = arrivedAtShelf;
    shelf.inert = !arrivedAtShelf;
    (arrivedAtShelf ? entry : hallEntry).focus({preventScroll:true});
  }
  function moveHallCamera(mode) {
    if (host && desktop.matches) {
      const header = document.querySelector('.header')?.getBoundingClientRect().height;
      if (Math.abs(scene.getBoundingClientRect().top - header) > 1) {
        window.RiWorlds?.navigate('bonus', {push:false,animate:false});
      }
    }
    hall.inert = true;
    shelf.inert = true;
    scene.dataset.mode = mode;
    if (motion()) hallTimer = setTimeout(finishHallTravel, hallTimeout);
    else finishHallTravel();
  }
  hallEntry.addEventListener('click', () => {
    if (scene.dataset.mode === 'hall') moveHallCamera('approaching');
  });
  hallReturn.addEventListener('click', () => {
    if (scene.dataset.mode === 'entrance') moveHallCamera('withdrawing');
  });
  hallCamera.addEventListener('animationend', (event) => {
    if (event.target === hallCamera && event.animationName === 'harstok-hall-camera') finishHallTravel();
  });
  entry.addEventListener('click', () => {
    if (scene.dataset.mode !== 'entrance') return;
    const play = motion();
    if (play) alignEntryCover();
    shelf.inert = true;
    entry.setAttribute('aria-expanded', 'true');
    scene.dataset.mode = 'entering';
    if (play) entryTimer = setTimeout(enterReader, entryTimeout);
    else enterReader();
  });
  entryArt.addEventListener('animationend', (event) => {
    if (event.target !== entryArt || event.animationName !== 'harstok-enter-book') return;
    if (scene.dataset.mode === 'returning') finishReturn();
    else enterReader();
  });
  cover.addEventListener('click', () => {
    if (!opened && scene.dataset.mode === 'reader') openBook();
  });
  lid.addEventListener('transitionend', (event) => {
    if (event.target === lid && event.propertyName === 'transform') showEndpapers();
  });
  $('#close').addEventListener('click', close);
  query.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { stopTurn(); page = 0; draw(); }, 75);
  });
  dom.addEventListener('click', (event) => {
    if (!opened || book.dataset.state !== 'open') return;
    const next = event.target.closest('button[data-view], button[data-turn], button[data-profile]');
    if (!next) return;
    if ('turn' in next.dataset) {
      next.focus({preventScroll:true});
      turn(Number(next.dataset.turn));
      return;
    }
    clearTimeout(searchTimer);
    if ('profile' in next.dataset) {
      const profile = next.dataset.profile;
      if (profile === spread.dataset.profileId) return;
      const index = indexCache('contents', '').spreads.findIndex((item) => item.profile === profile);
      if (index < 0) return;
      withTurn(1, () => {
        view = 'contents';
        page = index;
        query.value = '';
      }, true);
      return;
    }
    const destination = next.dataset.view;
    next.focus({preventScroll:true});
    if (destination === view && !page && !query.value) return;
    stopTurn();
    view = destination;
    page = 0;
    query.value = '';
    draw();
  });
  let touchStart;
  spread.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary || event.target.closest('button,a,input')) return;
    touchStart = {x: event.clientX, y: event.clientY, id: event.pointerId};
  }, {passive: true});
  spread.addEventListener('pointercancel', () => { touchStart = null; }, {passive: true});
  spread.addEventListener('pointerup', (event) => {
    if (touchStart?.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > 1.35 * Math.abs(dy)) turn(dx < 0 ? 1 : -1);
  }, {passive: true});
  document.addEventListener('keydown', (event) => {
    if (!opened || (host && !host.getClientRects().length) || document.querySelector('dialog[open]')) return;
    const focused = dom.activeElement;
    if (host && !focused) return;
    if (event.key === 'Escape') {
      if (focused === query && query.value) {
        clearTimeout(searchTimer);
        query.value = '';
        page = 0;
        draw();
      } else close();
      return;
    }
    if (!['ArrowLeft','ArrowRight'].includes(event.key) || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey ||
        focused?.closest('input,textarea,select,[contenteditable=true]')) return;
    if (!focused || (!book.contains(focused) && !pager.contains(focused) && !workspace.contains(focused))) return;
    event.preventDefault();
    turn(event.key === 'ArrowLeft' ? -1 : 1);
  });

  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      metrics = cache = null;
      if (!opened || book.dataset.state !== 'open' || !book.clientWidth) return;
      stopTurn();
      draw({keepEntry:spread.querySelector('[data-entry]')?.dataset.entry, keepProfile:spread.dataset.profileId});
    }, 90);
  }
  new ResizeObserver(resize).observe(desktop.matches ? book : probe);
  desktop.addEventListener('change', resize);
  document.fonts.addEventListener('loadingdone', resize);
  // The host site's deferred scene scripts have finished shaping the lake
  // above the book. Place this initial route after those layout changes.
  if (host && location.hash === '#shatserak/bonus') window.RiWorlds?.navigate('bonus', {push:false,animate:false});
})();
