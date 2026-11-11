(() => {
  'use strict';
  const entries = window.HarstokMemo;
  const {paginate} = window.HarstokPagination;
  const host = document.querySelector('harstok-library');
  const dom = host?.shadowRoot || document;
  const $ = (selector) => dom.querySelector(selector);
  const book = $('#book');
  if (!book) return;
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
  const categories = {
    character: {name: 'Персонажи', chapter: 'I'},
    place: {name: 'Места', chapter: 'II'},
    term: {name: 'Понятия', chapter: 'III'}
  };
  const counts = Object.fromEntries(Object.keys(categories).map((kind) => [kind, entries.filter((entry) => entry.kind === kind).length]));
  const assetRoot = new URL('../', document.currentScript.src);
  const portrait = new URL('bonus/odi-author.jpg', assetRoot).href;
  const memoFile = new URL('bonus/pamyatka-sherka.docx', assetRoot).href;
  const portraitRoot = new URL('portraits/', document.currentScript.src);
  const odiId = 'entry-060';
  const profiles = new Map([
    ['entry-030', {image: 'gonnik.webp'}],
    ['entry-039', {image: 'kian.webp'}],
    ['entry-057', {image: 'mitra.webp'}],
    [odiId, {}],
    ['entry-073', {image: 'ruolan.webp'}],
    ['entry-096', {image: 'yunsu.webp'}]
  ]);
  const profileIdFor = (id) => id === 'entry-088' ? 'entry-057' : id;
  const normalize = (text) => text.toLocaleLowerCase('ru').normalize('NFD').replace(/\u0301/gu, '').normalize('NFC').replace(/ё/gu, 'е');
  const safe = (text) => String(text).replace(/[&<>"']/gu, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const sorted = [...entries].sort((a, b) => normalize(a.name).localeCompare(normalize(b.name), 'ru'));
  const groupLetters = (rows) => {
    const groups = new Map();
    for (const entry of rows) {
      const key = entry.name.normalize('NFC')[0].toLocaleUpperCase('ru');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    return [...groups];
  };
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  const ornament = '<span aria-hidden="true">◇</span>';
  const folio = (side, inner, extra = '') => `<div class="folio folio-${side} ${extra}"><div class="leaf-inner">${inner}</div></div>`;
  const frame = (left, right, leftClass) => folio('left', left, leftClass) + folio('right', right);
  const tag = (text) => `<p class="eyebrow ink-eyebrow">${text}</p>`;
  const heading = (text) => `<h1 tabindex="-1" id="view-title">${text}</h1>`;
  let view = 'contents';
  let activeView = 'contents';
  let page = 0;
  let total = 1;
  let openTimer;
  let searchTimer;
  let resizeTimer;
  let opened = false;
  let metrics;
  let cache;
  let turning;

  function contents() {
    const items = Object.entries(categories).map(([kind, {name, chapter}]) =>
      `<li><button class="chapter" data-view="${kind}"><span class="roman">${chapter}</span><span>${name}</span><span class="leader"></span><span class="count" aria-label="${counts[kind]} записей">${counts[kind]}</span><span aria-hidden="true">→</span></button></li>`
    ).join('');
    const portraits = sorted.filter(({id}) => profiles.has(id)).map(({id, name}) =>
      `<li><button type="button" class="portrait-index-link" data-profile="${id}">${safe(name)} ${arrow}</button></li>`
    ).join('');
    return frame(
      `${tag('Библиотека Харстока')}${heading('Оглавление')}<p class="contents-ornament">${ornament}</p><ol class="chapters">${items}</ol>`,
      `${tag('Раздел I · Персонажи')}<h2 class="display-title">Портреты</h2><ol class="portrait-index">${portraits}</ol><p class="page-note">После «Шерки» · ${entries.length} записей<br><a class="source-link" href="${memoFile}" download="Памятка по персонажам Шерки.docx">Скачать памятку <span aria-hidden="true">↓</span></a></p>`
    );
  }

  function groupsMarkup(groups) {
    return `<div class="letter-list">${groups.map(([letter, list]) =>
      `<section class="letter-group" aria-label="Буква ${safe(letter)}"><h2>${safe(letter)}</h2><dl>${list.map(({id, name, description}) =>
        `<div class="reference" data-entry="${safe(id)}"><dt>${profiles.has(profileIdFor(id)) ? `<button type="button" data-profile="${profileIdFor(id)}" class="entry-link">${safe(name)} <span aria-hidden="true">→</span></button>` : safe(name)}</dt><dd>${safe(description)}</dd></div>`
      ).join('')}</dl></section>`
    ).join('')}</div>`;
  }

  function readMetrics() {
    if (metrics) return metrics;
    probe.innerHTML = folio('right', `<div class="index-heading"></div>${groupsMarkup(groupLetters(sorted))}`);
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

  function characterSpreads(list, sizing) {
    const spreads = [];
    let names = [];
    for (const [, rows] of groupLetters(list)) {
      names.push(...rows);
      const illustrated = rows.filter(({id}) => profiles.has(id));
      if (!illustrated.length) continue;
      spreads.push(...paginate(names, sizing), ...illustrated.map(({id}) => ({profile: id})));
      names = [];
    }
    if (names.length) spreads.push(...paginate(names, sizing));
    return spreads;
  }

  function indexCache(kind, term) {
    const key = term ? `search:${term}` : kind;
    if (!cache || cache.key !== key) {
      const list = term
        ? sorted.filter(({name, description}) => normalize(name + ' ' + description).includes(term))
        : sorted.filter((entry) => entry.kind === kind);
      const sizing = readMetrics();
      const spreads = !term && kind === 'character' ? characterSpreads(list, sizing) : paginate(list, sizing);
      cache = {key, count: list.length, spreads};
    }
    return cache;
  }

  function drawIndex(kind, term, keepEntry, keepProfile) {
    const {spreads, count} = indexCache(kind, term);
    const title = term ? 'Поиск по книге' : categories[kind].name;
    total = cache.spreads.length;
    if (keepProfile || keepEntry) {
      const found = spreads.findIndex(({profile, left, right}) => profile
        ? profile === keepProfile
        : [...left, ...right].some(([, list]) => list.some((entry) => entry.id === keepEntry)));
      if (found >= 0) page = found;
    }
    page = Math.max(0, Math.min(page, total - 1));
    const current = spreads[page];
    if (current.profile) {
      drawProfile(current, spreads);
      return;
    }
    const {left, right} = current;
    const label = term ? `Найдено: ${count}` : `Раздел ${categories[kind].chapter}`;
    spread.innerHTML = frame(
      `<div class="index-heading">${tag(label)}${heading(title)}</div>${left.length ? groupsMarkup(left) : '<p class="empty">Попробуйте другое имя или название.</p>'}`,
      right.length
        ? `<div class="index-heading">${tag('Продолжение')}<p class="display-title running-title">${title}</p></div>${groupsMarkup(right)}`
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
  function odi(part = 'full') {
    return frame(
      `<figure class="portrait"><div class="portrait-window"><img src="${portrait}" width="533" height="800" alt="Оди, светловолосый воин, улыбается. Авторская иллюстрация Ри Гувы."></div><figcaption>Оди · авторская иллюстрация</figcaption></figure>`,
      `${tag(part === 'end' ? 'Продолжение' : 'Из материалов автора')}${heading('Оди')}
      <div class="biography">${part !== 'end' ? odiStart : ''}${part !== 'start' ? odiEnd : ''}</div>
      ${part !== 'start' ? `<a class="source-link" href="${portrait}" download="Оди · авторская карточка.jpg">Скачать карточку <span aria-hidden="true">↓</span></a>` : ''}`,
      'photo-leaf'
    );
  }
  function profileOverflows() {
    if (!desktop.matches) return false;
    const leaf = spread.querySelector('.folio-right');
    const style = getComputedStyle(leaf);
    return leaf.querySelector('.leaf-inner').getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) > leaf.clientHeight - 1;
  }

  function drawProfile({profile, part = 'full'}, spreads) {
    spread.dataset.view = 'profile';
    spread.dataset.profileId = profile;
    if (profile !== odiId) {
      const {name, description} = entries.find((entry) => entry.id === profile);
      const {image} = profiles.get(profile);
      const src = new URL(image, portraitRoot).href;
      spread.innerHTML = frame(
        `<figure class="portrait"><img class="portrait-art" src="${src}" decoding="async" alt="${name}. Иллюстрация для сайта."><figcaption>${name} · иллюстрация для сайта</figcaption></figure>`,
        `${tag('Из памятки автора')}${heading(safe(name))}<div class="biography character-bio"><p>${safe(description)}</p></div>`,
        'photo-leaf'
      );
      return;
    }
    spread.innerHTML = odi(part);
    if (part !== 'full' || profileOverflows()) {
      spread.dataset.compact = '';
      if (part === 'full' && profileOverflows()) {
        spreads.splice(page, 1, {profile, part: 'start'}, {profile, part: 'end'});
        total = spreads.length;
        spread.innerHTML = odi('start');
      }
    }
  }

  function syncPageStacks() {
    if (activeView === 'search') return;
    const sections = Object.keys(categories);
    const chapter = sections.indexOf(view);
    const preceding = sections.slice(0, Math.max(0, chapter)).reduce((sum, key) => sum + counts[key], 0);
    const progress = chapter < 0 ? 0 : (preceding + counts[view] * (page + 1) / total) / entries.length;
    book.style.setProperty('--stack-left', `${(2 + progress * 6).toFixed(2)}px`);
    book.style.setProperty('--stack-right', `${(8 - progress * 6).toFixed(2)}px`);
  }

  function draw({focus = false, keepEntry, keepProfile, holdStacks = false} = {}) {
    const term = normalize(query.value).trim();
    activeView = term ? 'search' : view;
    spread.dataset.view = activeView;
    delete spread.dataset.compact;
    delete spread.dataset.profileId;
    if (activeView === 'contents') {
      page = 0;
      total = 1;
      spread.innerHTML = contents();
    } else drawIndex(view, term, keepEntry, keepProfile);
    const wear = ['handled', 'crease', 'stained', ''];
    const firstLeaf = 3 * page + Object.keys(categories).indexOf(view) + 1;
    for (const [side, leaf] of Array.from(spread.children).entries()) {
      const marks = wear[(firstLeaf + side) % wear.length];
      if (marks) leaf.dataset.wear = marks;
    }
    status.textContent = activeView === 'contents' ? 'Оглавление' : `Разворот ${page + 1} из ${total}`;
    pager.querySelector('[data-turn="-1"]').setAttribute('aria-disabled', String(page === 0));
    pager.querySelector('[data-turn="1"]').setAttribute('aria-disabled', String(activeView !== 'contents' && page >= total - 1));
    if (!holdStacks) syncPageStacks();
    if (focus) spread.querySelector('h1')?.focus({preventScroll:true});
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
  function withTurn(direction, change, focus) {
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
    draw({focus, holdStacks: animate && Boolean(width)});
    if (!animate || !width) return;
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
      sheet, rest, width, direction,
      front: visualFace(front, oldView, oldCompact),
      back: visualFace(back, spread.dataset.view, spread.hasAttribute('data-compact')),
      onContact() {
        if (turning?.sheet === sheet) syncPageStacks();
      },
      onFinish() {
        if (turning?.sheet === sheet) stopTurn();
      }
    });
    turning = {sheet, rest, cancel};
    book.append(rest, sheet);
  }
  function turn(direction) {
    clearTimeout(searchTimer);
    if (!opened || book.dataset.state !== 'open') return;
    const leavingContents = activeView === 'contents' && direction === 1;
    if (!leavingContents && (page + direction < 0 || page + direction >= total)) return;
    withTurn(direction, () => {
      if (leavingContents) view = 'character';
      else page += direction;
    }, spread.contains(dom.activeElement));
  }

  function finishOpening() {
    if (book.dataset.state !== 'opening') return;
    clearTimeout(openTimer);
    book.dataset.state = 'open';
    spread.inert = false;
    spread.removeAttribute('aria-hidden');
    before.hidden = true;
    lid.hidden = true;
    workspace.hidden = false;
    pager.hidden = false;
    spread.querySelector('h1').focus({preventScroll:true});
  }
  function close() {
    clearTimeout(openTimer);
    clearTimeout(searchTimer);
    stopTurn();
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
    cover.focus({preventScroll:true});
  }

  cover.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    view = 'contents';
    page = 0;
    query.value = '';
    draw();
    under.hidden = true;
    const play = motion();
    book.dataset.motion = play ? 'on' : 'off';
    book.dataset.state = 'opening';
    if (play) openTimer = setTimeout(finishOpening, 800);
    else finishOpening();
  });
  lid.addEventListener('transitionend', (event) => {
    if (event.target === lid && event.propertyName === 'transform') finishOpening();
  });
  $('#shut').addEventListener('click', close);
  query.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { stopTurn(); page = 0; draw(); }, 75);
  });
  dom.addEventListener('click', (event) => {
    if (!opened || book.dataset.state !== 'open') return;
    const next = event.target.closest('button[data-view], button[data-turn], button[data-profile]');
    if (!next) return;
    if ('turn' in next.dataset) { turn(Number(next.dataset.turn)); return; }
    clearTimeout(searchTimer);
    if ('profile' in next.dataset) {
      const profile = next.dataset.profile;
      if (profile === spread.dataset.profileId) return;
      const index = indexCache('character', '').spreads.findIndex((item) => item.profile === profile);
      if (index < 0) return;
      withTurn(view === 'character' && index < page ? -1 : 1, () => {
        view = 'character';
        page = index;
        query.value = '';
      }, true);
      return;
    }
    const destination = next.dataset.view;
    if (destination === activeView && !query.value) return;
    withTurn(destination === 'contents' ? -1 : 1, () => {
      view = destination;
      page = 0;
      query.value = '';
    }, true);
  });
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
