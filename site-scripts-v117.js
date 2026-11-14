/* source: typography-wrap-v115.js */
/* Russian short-word binding. Keep the author's words and inline markup intact. */
(() => {
  'use strict';
  const forward = new Set(('а в во и к ко о об обо с со у без для до за из изо из-за из-под на над не ни но от ото по под при про или что как ибо чтобы я').split(' '));
  const backward = new Set(['бы', 'б', 'же', 'ж', 'ли', 'ль']);
  const word = /[A-Za-zА-Яа-яЁё0-9]+(?:[-’'][A-Za-zА-Яа-яЁё0-9]+)*/gu;
  const space = /^[\t\n\r \u00a0]+$/u;
  // Opening quotes may sit between a preposition and its noun. Punctuation at
  // the end of a phrase is always a boundary, including the font's inline spans.
  const forwardGap = /^[\t\n\r \u00a0]+[«„“"(]*$/u;
  function gaps(text) {
    const tokens = [...text.matchAll(word)];
    const edits = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      const left = tokens[i], right = tokens[i + 1];
      const start = left.index + left[0].length;
      const gap = text.slice(start, right.index);
      if ((forward.has(left[0].toLowerCase()) && forwardGap.test(gap)) ||
          (backward.has(right[0].toLowerCase()) && space.test(gap))) {
        const whitespace = /^[\t\n\r \u00a0]+/u.exec(gap)[0];
        if (whitespace !== '\u00a0') edits.push({start, end: start + whitespace.length});
      }
    }
    return edits;
  }
  function bindText(text) {
    const edits = gaps(text);
    for (let i = edits.length - 1; i >= 0; i--) {
      const {start, end} = edits[i];
      text = text.slice(0, start) + '\u00a0' + text.slice(end);
    }
    return text;
  }
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined') module.exports = {bindText};
    return;
  }
  const skip = 'script,style,textarea,input,select,code,pre,svg,canvas,math,[contenteditable]:not([contenteditable="false"]),[data-ri-no-typography]';
  const blocks = new Set('ADDRESS ARTICLE ASIDE BLOCKQUOTE DD DETAILS DIALOG DIV DL DT FIELDSET FIGCAPTION FIGURE FOOTER FORM H1 H2 H3 H4 H5 H6 HEADER HR LI MAIN NAV OL P SECTION TABLE TBODY TD TH THEAD TR UL'.split(' '));
  const prose = 'p,li,dd,dt,figcaption,blockquote';
  function isBoundary(el) {
    return blocks.has(el.tagName) || el.tagName === 'BUTTON' ||
      el.tagName === 'SUMMARY' || (el.tagName === 'A' && !el.closest(prose));
  }
  function repairRun(nodes) {
    if (!nodes.length) return;
    let text = '';
    const offsets = nodes.map(node => {
      const start = text.length;
      text += node.data;
      return {node, start, end: text.length};
    });
    const edits = gaps(text);
    for (let i = edits.length - 1; i >= 0; i--) {
      const edit = edits[i];
      // Edit the existing text nodes. Never flatten links, emphasis or glyph
      // fallback spans, and never rewrite an attribute or a form value.
      for (const item of offsets) {
        if (item.end <= edit.start || item.start >= edit.end) continue;
        const from = Math.max(edit.start, item.start) - item.start;
        const to = Math.min(edit.end, item.end) - item.start;
        const replacement = item.start <= edit.start ? '\u00a0' : '';
        item.node.replaceData(from, to - from, replacement);
      }
    }
  }
  function refresh(root = document.body) {
    if (!root || (root.nodeType === 1 && root.closest(skip))) return;
    let run = [];
    const flush = () => {repairRun(run); run = [];};
    function visit(node) {
      if (node.nodeType === 3) {run.push(node); return;}
      if (node.nodeType !== 1) return;
      if (node.matches(skip) || node.tagName === 'BR' || node.tagName === 'WBR') {flush(); return;}
      const boundary = isBoundary(node);
      if (boundary) flush();
      for (const child of node.childNodes) visit(child);
      if (boundary) flush();
    }
    visit(root); flush();
  }
  const pending = new Set();
  let scheduled = false;
  const observer = new MutationObserver(records => {
    for (const record of records) {
      let el = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (!el || el.closest(skip)) continue;
      while (el.parentElement && !isBoundary(el)) el = el.parentElement;
      pending.add(el);
    }
    if (scheduled || !pending.size) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const roots = [...pending]; pending.clear();
      for (const root of roots) if (root.isConnected && !roots.some(other => other !== root && other.contains(root))) refresh(root);
    });
  });
  window.RiTypography = Object.freeze({refresh, bindText});
  refresh();
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
})();

;
/* source: resource-loading-v101.js */
/* One queue for original illustrations, product images and canvas consumers.
   Current viewport first, then 3 viewports ahead; distant art waits for idle. */
(() => {
  'use strict';

  const groups = [
    {world:'bw', bounds:'#bw-bonus-lamp',
      background:{id:'bw-bonus-lamp',property:'--ri-parking-image-v101',src:'assets/performance-v101/bw-v17/parking-night.webp'}},
    {world:'bw', bounds:'#story',
      background:{id:'story',property:'--ri-forest-image-v101',src:'assets/lossless-v113/bw-v88/grey-forest.jpg'}},
    {world:'bw', bounds:'#author-qa',
      background:{id:'author-qa',property:'--ri-radio-image-v101',src:'assets/performance-v101/bw-v31/jeep-radio.webp'}},
    {world:'shatserak', bounds:'#story', portrait:true},
    {bounds:'.author-next-worlds',
      background:{selector:'.author-next-world[href$="#world-black-white"]',property:'--ri-author-bw-v108',src:'assets/performance-v101/bw-v17/parking-night.webp'}},
    {bounds:'.author-next-worlds',
      background:{selector:'.author-next-world[href$="#world-shatserak"]',property:'--ri-author-shatserak-v108',src:'assets/lossless-v113/shatserak-v23/hood-portrait-cutout.png'}}
  ];
  const imageSets = {
    switch:{width:768,src:'assets/responsive-v111/switch-states-768.webp'},
    pineapple:{width:1024,src:'assets/responsive-v111/pineapple-pieces-1024.webp'}
  };

  // Capture this while the deferred external script is executing. The author
  // page is one directory deeper, while its deferred asset paths are unchanged.
  const assetBase = document.currentScript?.src || location.href;
  const tasks = new Map();
  const embeddedURLs = new Map();
  const external = new Map();
  const maximumActive = 4;
  const ordinaryActive = 3;
  let frame = 0;
  let ready = document.readyState !== 'loading';
  let layoutSettled = false;
  let backgroundReady = false;
  let printing = false;
  let lastY = scrollY;
  let direction = 1;
  let rendered = new WeakMap();
  let releaseTimer;
  let idleTimer;
  let idleReady = false;
  let openDialog = null;
  let initialRoute = true;
  let viewportTop = 0;

  function backgroundURL(src) {
    // The standalone HTML can embed >2 MB data URLs. A short blob URL avoids
    // Chromium's CSS custom-property limit without changing any image bytes.
    if (!src.startsWith('data:')) return src;
    if (embeddedURLs.has(src)) return embeddedURLs.get(src);
    const split = src.indexOf(',');
    const header = src.slice(0, split);
    const binary = header.includes(';base64')
      ? atob(src.slice(split + 1)) : decodeURIComponent(src.slice(split + 1));
    const bytes = new Uint8Array(binary.length);
    for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
    const url = URL.createObjectURL(new Blob([bytes], {type:header.slice(5).split(';')[0]}));
    embeddedURLs.set(src, url);
    return url;
  }

  function isRendered(node) {
    if (!node || !node.isConnected) return false;
    if (rendered.has(node)) return rendered.get(node);
    const visible = !node.hidden &&
      !(node.tagName === 'DIALOG' && !node.open) &&
      getComputedStyle(node).display !== 'none' &&
      (!node.parentElement || isRendered(node.parentElement));
    rendered.set(node, visible);
    return visible;
  }

  function belongsToWorld(node, world) {
    for (let parent = node; parent; parent = parent.parentElement) {
      const owner = parent.dataset.riWorld || parent.dataset.atmoWorld ||
        parent.dataset.bookWorld || parent.dataset.series;
      if ((owner === 'bw' || owner === 'shatserak') && owner !== world) return false;
    }
    return true;
  }

  function boundsFor(node) {
    if (!isRendered(node)) return null;
    // A perspective-corrected source photo may sit far outside its final
    // surface in DOM coordinates. Queue its visible frame, not that texture.
    let first=node;
    const context=node.dataset?.riContext;
    if(context==='zoom')first=node.closest('#photo-view')||node;
    else if(context==='detail')first=node.closest('.merch-photo-stage,.detail-image')||node;
    else if(context==='thumb')first=node.closest('.gallery-thumb')||node;
    else if(context==='card')first=node.closest('.merch-sheet,.book-mockup,.product-visual')||node;
    // A source-less image can have zero height. Use its first real layout box,
    // but only after checking its ancestors, so a hidden desktop/mobile variant
    // cannot accidentally borrow the visible section's bounds.
    for (let parent = first; parent && parent !== document.body; parent = parent.parentElement) {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
        for(let ancestor=parent.parentElement;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement){
          const style=getComputedStyle(ancestor);
          const x=/(hidden|clip|auto|scroll)/.test(style.overflowX||style.overflow);
          const y=/(hidden|clip|auto|scroll)/.test(style.overflowY||style.overflow);
          if(x||y){const r=ancestor.getBoundingClientRect();if(x){left=Math.max(left,r.left);right=Math.min(right,r.right);}if(y){top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}}
        }
        if(right<=left||bottom<=top||right<=0||left>=innerWidth)return null;
        return {left,right,top,bottom,width:right-left,height:bottom-top};
      }
    }
    return null;
  }

  function sourceFor(image, force) {
    const deferred = image.dataset.riDeferred;
    const sourceBase=image.dataset.riBase==='document'?document.baseURI:assetBase;
    const variant = imageSets[image.dataset.riImageSet];
    if (!variant) {
      return {src:deferred || image.currentSrc || image.getAttribute('src'),
        base:deferred ? sourceBase : document.baseURI};
    }
    if (!image.dataset.riMaster) {
      const master = deferred || image.getAttribute('src') || image.currentSrc;
      if (!master) return null;
      // Keep the full-resolution URL/URI after data-ri-deferred is consumed.
      image.dataset.riMaster = new URL(master, deferred ? sourceBase : document.baseURI).href;
    }
    // Sprite width includes both states. Compare that full rendered strip to
    // its raster width so each state retains enough pixels on Retina screens.
    const width = image.getBoundingClientRect().width;
    const requiredWidth = width * (globalThis.devicePixelRatio || 1);
    return !force && width > 0 && requiredWidth <= variant.width
      ? {src:variant.src,base:assetBase}
      : {src:image.dataset.riMaster,base:assetBase};
  }

  function rank(rect, force) {
    const visibleHeight=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,viewportTop));
    if (force || visibleHeight>=Math.min(64,rect.height*.25)) return {priority:0,distance:Math.max(0,rect.top-viewportTop)};
    if (!backgroundReady) return null;
    const ahead = innerHeight * 3;
    const behind = innerHeight;
    const top = direction > 0 ? -behind : -ahead;
    const bottom = innerHeight + (direction > 0 ? ahead : behind);
    const nearby = rect.bottom >= top && rect.top <= bottom;
    const distance = rect.top > innerHeight ? rect.top - innerHeight : -rect.bottom;
    if(!nearby&&!idleReady)return null;
    return {priority:nearby ? 1 : 2,distance:Math.max(0,distance)};
  }

  function applyTarget(task, target) {
    if (target.property) {
      const value = 'url("' + backgroundURL(task.src).replace(/"/g, '%22') + '")';
      if (target.node.style.getPropertyValue(target.property) !== value) {
        target.node.style.setProperty(target.property, value);
      }
      return;
    }
    const image = target.image || target.node;
    image.decoding = 'async';
    image.loading = 'eager';
    image.fetchPriority = task.priority === 0 ? 'high' : 'low';
    if (image.getAttribute('src') !== task.src && image.src !== task.src) image.src = task.src;
    if (target.deferred) delete image.dataset.riDeferred;
  }

  function applyTargets(task) {
    task.targets.forEach(target => applyTarget(task, target));
  }

  function finish(task, loaded) {
    if (task.status !== 'running') return;
    task.status = loaded ? 'loaded' : 'error';
    task.preloader.onload = task.preloader.onerror = null;
    task.preloader = null;
    if(loaded){
      // Keep already received pixels on their original element even after a
      // fast scroll. This does not start a new transfer and avoids a late
      // attachment when the reader returns to a section.
      task.receivers.forEach(target=>{
        if(target.property){if(target.node.isConnected)applyTarget(task,target);return;}
        if(target.image){const owner=external.get(target.node);if(owner?.image===target.image&&new URL(owner.src,owner.base).href===task.src)applyTarget(task,target);return;}
        if(!target.node.isConnected)return;
        const source=target.node.dataset.riPortrait?{src:target.node.dataset.riPortrait,base:assetBase}:sourceFor(target.node,printing);
        if(source?.src&&new URL(source.src,source.base).href===task.src)applyTarget(task,target);
      });
      task.receivers=[];
    }
    if(!loaded&&task.attempts<2){task.status='queued';task.retryAt=performance.now()+1000;setTimeout(schedule,1050);}
    // Rebuild eligibility before starting another task. A completed old-world
    // request must never release stale queued work after a world switch.
    schedule();
  }

  function start(task) {
    task.status = 'running';
    task.attempts++;
    task.startedAt=performance.now();
    const image = new Image();
    task.preloader = image;
    image.decoding = 'async';
    image.fetchPriority = task.priority === 0 ? 'high' : 'low';
    image.onload = () => finish(task, true);
    image.onerror = () => finish(task, false);
    // Image requests work with connect-src 'none'; no fetch/XHR is used here.
    image.src = task.css ? backgroundURL(task.src) : task.src;
    if (image.complete && image.naturalWidth > 0) finish(task, true);
  }

  function allowed(node,force){
    if(!isRendered(node))return false;
    if(force)return true;
    if(openDialog)return node===openDialog||openDialog.contains(node);
    // The first font/layout pass can briefly put a neighbouring section under
    // a deep-link viewport. Start that route's own art, not that transient box.
    if(initialRoute&&!layoutSettled){
      const hash=location.hash;
      const match=/^#(?:black-white|shatserak)\/([a-z-]+)$/.exec(hash);
      let id=match?.[1]||(/#world-/.test(hash)?'world-view':hash==='#contacts'||hash==='#author'?'contacts':!hash||hash==='#home'?'home':null);
      if(id==='field-notes'||id==='bw-finale'||id==='worlds')id='books';
      const section=id&&document.getElementById(id);
      if(section&&node!==section&&!section.contains(node))return false;
    }
    return true;
  }

  function register(src, target, rect, force, base = assetBase) {
    if (!src || !rect) return;
    const order = rank(rect, force);
    if (!order) return;
    const url = new URL(src, base).href;
    let task = tasks.get(url);
    if (!task) {
      task = {src:url,status:'queued',priority:Infinity,distance:Infinity,importance:Infinity,targets:[],receivers:[],css:false,preloader:null,attempts:0,retryAt:0};
      tasks.set(url, task);
    }
    const node=target.node;
    const interactive=!target.property&&(target.image||node.dataset?.riImageSet==='switch'||['detail','zoom'].includes(node.dataset?.riContext)||node.matches?.('.bw-worklamp-art,.qa-jeep-art')||node.closest?.('.book-shelf-card-v93,.mockup-fan-slot:first-child,.mockup-bookmark-slot'));
    const hiddenHorde=node.closest?.('.p35-parking-horde')&&document.querySelector('#bw-bonus-lamp')?.dataset.lit!=='true';
    const decoration=node.closest?.('.bw-five-seven,.merch-pineapple-v92');
    if(hiddenHorde&&!force&&order.priority===0)order.priority=1;
    // The visible control is prepared within the same 3-screen horizon; it
    // never pulls its whole distant scene ahead of the current viewport.
    if(order.priority===1&&node.dataset?.riImageSet==='switch')order.priority=.5;
    task.priority = Math.min(task.priority, order.priority);
    task.distance = Math.min(task.distance, order.distance);
    task.importance=Math.min(task.importance,interactive?0:hiddenHorde||decoration?2:1);
    task.targets.push(target);
    if(task.status!=='loaded'&&!task.receivers.some(t=>t.node===target.node&&t.image===target.image&&t.property===target.property))task.receivers.push(target);
    task.css ||= !!target.property;
    // Native product images may already be in the browser cache. Track that
    // completion rather than creating a second request for the same URL.
    const current = !target.property && (target.image||target.node).currentSrc;
    const currentURL = current ? new URL(current, document.baseURI).href : null;
    const image=target.image||target.node;
    if (task.status === 'queued' && !target.property && image.complete && image.naturalWidth > 0 && !target.deferred && currentURL === url) {
      task.status = 'loaded';
    }
  }

  function releaseBackground() {
    if (backgroundReady) return;
    backgroundReady = true;
    clearTimeout(releaseTimer);
    schedule();
  }

  function update(force = false) {
    frame = 0;
    if (!ready) return;
    force = force || printing;
    rendered = new WeakMap();
    const world = document.body.dataset.world;
    openDialog=force?null:[...document.querySelectorAll('dialog[open]')].at(-1);
    const header=document.querySelector('.header'),headerRect=header?.getBoundingClientRect();
    viewportTop=!force&&!openDialog&&headerRect&&headerRect.top<=0?Math.max(0,Math.min(innerHeight*.25,headerRect.bottom)):0;
    // Every event rebuilds the queue's eligible targets. Completed resources
    // remain cached by URL, but hidden/other-world queued work loses its place.
    tasks.forEach(task => {
      task.priority = Infinity;
      task.distance = Infinity;
      task.importance = Infinity;
      task.targets = [];
    });

    groups.forEach(group => {
      if (group.world && group.world !== world) return;
      const bounds = document.querySelector(group.bounds);
      const rect = boundsFor(bounds);
      if (group.background) {
        const item = group.background;
        const node = item.selector ? document.querySelector(item.selector) : document.getElementById(item.id);
        if (allowed(node,force)) register(item.src, {node,property:item.property}, rect, force);
      }
      if (group.portrait) {
        document.querySelectorAll('img[data-ri-portrait]').forEach(node => {
          if (allowed(node,force)) register(node.dataset.riPortrait, {node}, rect, force);
        });
      }
    });

    document.querySelectorAll('img[data-ri-deferred],img[src]').forEach(node => {
      if (!belongsToWorld(node, world)||!allowed(node,force)) return;
      const source = sourceFor(node, force);
      if (source) register(source.src, {node,deferred:!!node.dataset.riDeferred}, boundsFor(node), force, source.base);
    });

    external.forEach(item=>{
      if(item.world&&world&&item.world!==world)return;
      if(allowed(item.bounds,force))register(item.src,{node:item.owner,image:item.image},boundsFor(item.bounds),force,item.base);
    });

    const eligible = [...tasks.values()].filter(task => task.targets.length)
      .sort((a,b) => a.priority - b.priority || (a.priority===0?a.importance-b.importance||a.distance-b.distance:a.distance-b.distance||a.importance-b.importance));
    eligible.forEach(task => {
      if (task.status === 'loaded') applyTargets(task);
      else if (task.status === 'running') {
        task.preloader.fetchPriority=task.priority===0?'high':'low';
      }
    });
    // Keep partial downloads in flight: abandoning them wastes bandwidth when
    // the reader scrolls back. A fourth slot is reserved for newly visible art.
    tasks.forEach(task=>{if(task.status==='running'&&!task.targets.length)task.preloader.fetchPriority='low';});
    const running=()=>[...tasks.values()].filter(task=>task.status==='running');
    for(const task of eligible){
      if(task.status!=='queued'||task.retryAt>performance.now())continue;
      let active=running();
      if(!force&&active.length>=maximumActive)continue;
      if(!force&&active.length>=ordinaryActive&&!(task.priority===0&&active.some(t=>t.priority>0)))continue;
      if(!force&&task.priority>0&&(active.some(t=>t.priority>0&&t.targets.length)||eligible.some(t=>t.status==='queued'&&t.priority===0)))continue;
      if(!force&&task.priority===2&&eligible.some(t=>t.priority<2&&(t.status==='running'||t.status==='queued')))continue;
      start(task);
    }
    if (layoutSettled && !eligible.some(task => task.priority === 0 && task.status === 'running')) {
      releaseBackground();
    }
  }

  function schedule() {
    if (ready && !frame) frame = requestAnimationFrame(() => update());
  }

  function initialize() {
    ready = true;
    schedule();
    // Prioritize the real first viewport while the route and initial font
    // layout settle. No input is needed to unlock preloading, and slow fonts or
    // a stalled critical image cannot hold the rest of the world indefinitely.
    releaseTimer = setTimeout(releaseBackground, 1000);
    idleTimer=setTimeout(()=>{idleReady=true;schedule();},2500);
    setTimeout(()=>{initialRoute=false;schedule();},2500);
    Promise.resolve(document.fonts?.ready).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        layoutSettled = true;
        schedule();
      }));
    });
  }

  addEventListener('ri:atmosphere', schedule);
  addEventListener('scroll', () => {
    const y = scrollY;
    if (Math.abs(y - lastY) > 4) direction = y < lastY ? -1 : 1;
    lastY = y;
    idleReady=false;clearTimeout(idleTimer);idleTimer=setTimeout(()=>{idleReady=true;schedule();},2500);
    schedule();
  }, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  addEventListener('hashchange', schedule);
  addEventListener('pageshow', schedule);
  ['wheel','touchstart','pointerdown','keydown'].forEach(type=>addEventListener(type,()=>{initialRoute=false;schedule();},{passive:true}));
  addEventListener('online',()=>{tasks.forEach(t=>{if(t.status==='error'){t.status='queued';t.attempts=0;}});schedule();});
  addEventListener('beforeprint', () => {
    printing = true;
    update(true);
  });
  addEventListener('afterprint', () => {
    printing = false;
    schedule();
  });
  const mutations=new MutationObserver(records=>{
    if(records.some(r=>r.type==='childList'||['open','hidden','data-world','data-lit'].includes(r.attributeName)))schedule();
  });
  mutations.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','data-world','data-lit']});
  window.RiImageLoading=Object.freeze({
    refresh:schedule,
    request(image,src,{owner,bounds=owner,world}={}){
      if(!image||!src||!owner)return;
      const previous=external.get(owner);
      if(previous?.image===image&&previous.src===src&&previous.bounds===bounds&&previous.world===world)return;
      external.set(owner,{image,src,owner,bounds,world,base:assetBase});schedule();
    },
    snapshot:()=>({active:[...tasks.values()].filter(t=>t.status==='running').length,max:maximumActive,external:external.size,tasks:[...tasks.values()].map(t=>({src:t.src,status:t.status,priority:t.priority,distance:t.distance,attempts:t.attempts}))})
  });
  if (ready) initialize();
  else document.addEventListener('DOMContentLoaded', initialize, {once:true});
})();

;
/* source: focus-input-v110.js */
/* Keep focus movement for reading and dialogs; show control outlines for keyboard use. */
(() => {
  'use strict';
  if(window.RiFocusInput)return;
  const root=document.documentElement;
  function setMode(mode){
    if(root.dataset.riFocusInput!==mode)root.dataset.riFocusInput=mode;
  }
  let initial='pointer';
  try{
    const active=document.activeElement;
    if(active&&active!==document.body&&active.matches(':focus-visible')&&!active.matches('[tabindex="-1"]'))initial='keyboard';
  }catch{}
  setMode(initial);
  const pointer=()=>setMode('pointer');
  ['pointerdown','touchstart','mousedown'].forEach(type=>document.addEventListener(type,pointer,{capture:true,passive:true}));
  const navigation=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Enter',' ','Escape']);
  document.addEventListener('keydown',event=>{
    if(event.isComposing||event.metaKey||event.altKey||event.ctrlKey)return;
    const editable=event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
    if(event.key==='Tab'||(!editable&&navigation.has(event.key)))setMode('keyboard');
  },true);
  window.RiFocusInput=Object.freeze({get mode(){return root.dataset.riFocusInput;}});
})();

;
/* source: arrow-icons-v109.js */
/* Draw navigation arrows as vectors so mobile emoji fonts cannot replace them. */
(() => {
  'use strict';
  if (window.RiArrowIcons) return;
  const paths = {
    '↗':'M5 19 19 5M5 5h14v14',
    '↘':'M5 5 19 19M5 19h14V5',
    '↙':'M19 5 5 19M5 5v14h14',
    '↖':'M19 19 5 5M5 19V5h14',
    '↑':'M12 20V4M5 11l7-7 7 7',
    '↓':'M12 4v16M5 13l7 7 7-7',
    '←':'M20 12H4m7-7-7 7 7 7',
    '→':'M4 12h16m-7-7 7 7-7 7',
    '↔':'M4 12h16M9 7l-5 5 5 5m6-10 5 5-5 5',
    '↕':'M12 4v16M7 9l5-5 5 5M7 15l5 5 5-5',
    '⤢':'M14 4h6v6m0-6-6 6M10 20H4v-6m0 6 6-6'
  };
  const arrows = /([↗↘↙↖↑↓←→↔↕⤢])[\uFE0E\uFE0F]?/gu;
  const skip = 'script,style,textarea,input,select,option,code,pre,svg,math,[contenteditable],[data-ri-arrows-skip]';
  const ns = 'http://www.w3.org/2000/svg';
  function create(character) {
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('class','ri-arrow-icon-v109');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','1em');svg.setAttribute('height','1em');
    svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.5');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
    const path = document.createElementNS(ns,'path');
    path.setAttribute('d',paths[character]);svg.append(path);
    return svg;
  }
  function repairText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(skip)) return;
    const text = node.data;
    arrows.lastIndex = 0;
    if (!arrows.test(text)) return;
    arrows.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of text.matchAll(arrows)) {
      if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      fragment.append(create(match[1]));cursor = match.index + match[0].length;
    }
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function repair(root) {
    if (root.nodeType === Node.TEXT_NODE) {repairText(root);return;}
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(skip)) return;
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(repairText);
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') repairText(record.target);
      else record.addedNodes.forEach(repair);
    }
  });
  repair(document.body);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.RiArrowIcons = Object.freeze({refresh:repair});
})();

;
/* source: parking-v35.js */
/* Settle only an initial BW parking deep link after the visible world's assets load. */
(() => {
  'use strict';
  const initialHash=location.hash;
  if(initialHash!=='#black-white/bonus')return;
  let interacted=false;
  const markInteraction=()=>{interacted=true;};
  const inputs=['wheel','touchstart','pointerdown','keydown'];
  inputs.forEach(type=>window.addEventListener(type,markInteraction,{passive:true,once:true}));
  async function settle(){
    await document.fonts.ready;
    requestAnimationFrame(()=>{
      if(!interacted&&location.hash===initialHash&&document.body.dataset.world==='bw'){
        document.getElementById('bonus')?.scrollIntoView({behavior:'instant',block:'start'});
      }
      inputs.forEach(type=>window.removeEventListener(type,markInteraction));
    });
  }
  if(document.readyState==='complete')settle();
  else window.addEventListener('load',settle,{once:true});
})();

;
/* source: merch-mockups.js */
/* Clean code-native merch mockups. Source artwork is not redrawn or re-exported. */
(() => {
  'use strict';
  // Coordinates measured on the complete source photographs; TL, TR, BR, BL.
  const surfaces = [
    {"id":"stickers-alexia-v79","photoWidth":917,"photoHeight":1280,"corners":[[0,0],[916,5],[916,1279],[10,1277]],"kind":"sheet","label":"Алексия"},
    {"id":"stickers-black-v79","photoWidth":905,"photoHeight":1280,"corners":[[0,0],[894,0],[904,1273],[7,1278]],"kind":"sheet","label":"Мистер Блэк"},
    {"id":"stickers-jack-v79","photoWidth":917,"photoHeight":1280,"corners":[[0,0],[905,13],[916,1279],[8,1278]],"kind":"sheet","label":"Джек"},
    {"id":"stickers-troy-v79","photoWidth":937,"photoHeight":1280,"corners":[[0,0],[936,4],[936,1279],[10,1279]],"kind":"sheet","label":"Трой"},
    {"id":"stickers-dayton-v79","photoWidth":900,"photoHeight":1280,"corners":[[0,0],[899,14],[899,1279],[0,1277]],"kind":"sheet","label":"Дэйтон"},
    {"id":"stickers-pierce-v79","photoWidth":924,"photoHeight":1280,"corners":[[0,0],[923,4],[923,1279],[8,1279]],"kind":"sheet","label":"Пирс"},
    {"id":"stickers-theo-naita-v79","photoWidth":909,"photoHeight":1280,"corners":[[0,0],[901,4],[908,1279],[0,1279]],"kind":"sheet","label":"Тео и Наита"},
    {id:'stickers-02',photoWidth:600,photoHeight:800,corners:[[48,52],[552,64],[516,735],[54,743]],kind:'sheet',label:'Рич'},
    {id:'stickers-03',photoWidth:600,photoHeight:800,corners:[[57,62],[544,67],[520,717],[74,738]],kind:'sheet',label:'Джейс'},
    {id:'bookmark-front',photoWidth:450,photoHeight:800,corners:[[57,210],[198,208],[208,656],[56,659]],kind:'bookmark',label:'Закладка, сторона 1'},
    {id:'bookmark-back',photoWidth:450,photoHeight:800,corners:[[239,215],[374,212],[398,657],[245,662]],kind:'bookmark',label:'Закладка, сторона 2'}
  ];
  const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value.toFixed(11));
  function solve(rows) {
    const n=rows.length;
    for(let c=0;c<n;c++){
      let pivot=c;
      for(let r=c+1;r<n;r++)if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c]))pivot=r;
      if(Math.abs(rows[pivot][c])<1e-10)throw new Error('Degenerate merchandise surface');
      [rows[c],rows[pivot]]=[rows[pivot],rows[c]];
      const divisor=rows[c][c];
      for(let k=c;k<=n;k++)rows[c][k]/=divisor;
      for(let r=0;r<n;r++){
        if(r===c)continue;
        const factor=rows[r][c];
        for(let k=c;k<=n;k++)rows[r][k]-=factor*rows[c][k];
      }
    }
    return rows.map(row=>row[n]);
  }
  function homography(corners,width,height){
    const destination=[[0,0],[width,0],[width,height],[0,height]],rows=[];
    corners.forEach(([x,y],index)=>{
      const [u,v]=destination[index];
      rows.push([x,y,1,0,0,0,-u*x,-u*y,u]);
      rows.push([0,0,0,x,y,1,-v*x,-v*y,v]);
    });
    return [...solve(rows),1];
  }
  const geometry = new Map(surfaces.map(surface=>{
    const width=surface.kind==='bookmark'?110:320,height=surface.kind==='bookmark'?330:457;
    const h=homography(surface.corners,width,height);
    const matrix=[h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,1].map(number);
    return [surface.id,{...surface,width,height,h,matrix}];
  }));
  function renderSurface(id,src,context='detail',alt=''){
    const surface=geometry.get(id);
    if(!surface||!src)return '<span class="merch-mockup-unavailable">Изображение готовится</span>';
    const scope=['card','detail','zoom','thumb','cart'].includes(context)?context:'detail';
    const styles=`--surface-w:${surface.width};--surface-h:${surface.height};--photo-w:${surface.photoWidth};--photo-h:${surface.photoHeight};--texture-matrix:matrix3d(${surface.matrix.join(',')})`;
    return `<span class="merch-sheet merch-sheet--${surface.kind} merch-sheet--${scope}" data-surface="${escape(id)}" style="${styles}" role="img" aria-label="${escape(alt||surface.label)}"><span class="merch-sheet-body" aria-hidden="true"><span class="merch-surface"><img class="surface-photo" data-ri-deferred="${escape(src)}" data-ri-context="${scope}" width="${surface.photoWidth}" height="${surface.photoHeight}" alt="" loading="${scope==='detail'?'eager':'lazy'}" decoding="async" draggable="false"><span class="merch-print-light"></span></span></span></span>`;
  }
  function renderProduct(product,context='card'){
    const scope=context==='thumb'||context==='cart'?'thumb':'card';
    const photos=product.gallery||[];
    if(scope==='thumb'){
      const photo=photos[0];
      return `<span class="mockup-scene mockup-scene--thumb" role="img" aria-label="${escape(product.name)}">${photo?renderSurface(photo.surface,photo.src,'cart',photo.alt):''}</span>`;
    }
    if(product.id==='bookmarks'){
      const sides=photos.slice(0,2);
      return `<span class="mockup-scene mockup-scene--bookmarks" role="img" aria-label="${escape(product.name)}"><span class="mockup-floor-shadow" aria-hidden="true"></span><span class="mockup-duo" aria-hidden="true">${sides.map((photo,i)=>`<span class="mockup-bookmark-slot mockup-bookmark-slot--${i+1}">${renderSurface(photo.surface,photo.src,'card',photo.alt)}</span>`).join('')}</span></span>`;
    }
    const slots=[{a:0,x:0,y:5,z:20},{a:-5.5,x:-13,y:2,z:19},{a:5.5,x:13,y:2,z:18},{a:-11,x:-26,y:0,z:17},{a:11,x:26,y:0,z:16},{a:-16.5,x:-39,y:-1,z:15},{a:16.5,x:39,y:-1,z:14},{a:-22,x:-52,y:-1,z:13},{a:22,x:52,y:-1,z:12}];
    return `<span class="mockup-scene mockup-scene--pack" role="img" aria-label="${escape(product.name)}"><span class="mockup-floor-shadow" aria-hidden="true"></span><span class="mockup-fan" aria-hidden="true">${photos.slice(0,9).map((photo,i)=>{const slot=slots[i];return `<span class="mockup-fan-slot" style="--fan-angle:${slot.a}deg;--fan-x:${slot.x}px;--fan-y:${slot.y}px;z-index:${slot.z}">${renderSurface(photo.surface,photo.src,'card',photo.alt)}</span>`;}).join('')}</span></span>`;
  }
  function validateGeometry(){
    return [...geometry.values()].map(surface=>{
      const target=[[0,0],[surface.width,0],[surface.width,surface.height],[0,surface.height]];
      let error=0;
      surface.corners.forEach(([x,y],index)=>{
        const h=surface.h,denominator=h[6]*x+h[7]*y+1;
        const u=(h[0]*x+h[1]*y+h[2])/denominator,v=(h[3]*x+h[4]*y+h[5])/denominator;
        error=Math.max(error,Math.abs(u-target[index][0]),Math.abs(v-target[index][1]));
      });
      return {id:surface.id,maxCornerError:error};
    });
  }
  window.RiMerchMockups=Object.freeze({renderSurface,renderProduct,validateGeometry});
})();

;
/* source: commerce-v97.js */
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

;
/* source: merch-drops-v89.js */
/* V89: release metadata and a request scope for future merch, not a catalog item.
   Catalog entries may use release:{status:'upcoming'|'announced'|'closed'}.
   No dates, stock or edition sizes are inferred here. */
(() => {
  'use strict';
  const scope=Object.freeze({id:'all-merch-drops',name:'Все будущие дропы мерча'});
  const states=Object.freeze({
    upcoming:Object.freeze({
      status:'upcoming',label:'Будущий дроп',title:'Узнать о выпуске',
      description:'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.',
      requestLabel:'Сообщить о дропе'
    }),
    announced:Object.freeze({
      status:'announced',label:'Дроп анонсирован',title:'Узнать об этом дропе',
      description:'Оставь контакт для информации о выпуске, цене и условиях заказа.',
      requestLabel:'Узнать о выпуске'
    }),
    closed:Object.freeze({
      status:'closed',label:'Дроп завершён',title:'Узнать о следующем выпуске',
      description:'Этот дроп завершён. Можно оставить контакт на случай нового выпуска этого артефакта.',
      requestLabel:'Узнать о следующем'
    })
  });
  function release(product){
    const offer=window.RiCommerce?.offer(product?.id);
    if(offer){
      const legacy=states[offer.state]||states.upcoming;
      const date=offer.releaseLabel&&!offer.statusText?.includes(offer.releaseLabel)?' '+offer.releaseLabel+'.':'';
      const description=offer.orderable?'Товар можно добавить в корзину.':offer.state==='upcoming'?'Оставь контакт, чтобы узнать об открытии предзаказа.':'Оставь контакт, чтобы получить уведомление об открытии дропа.';
      return {...legacy,status:offer.state,label:offer.statusText,title:offer.orderable?'Можно заказать':offer.requestLabel||legacy.title,description:offer.statusText+'.'+date+' '+description,requestLabel:offer.requestLabel||legacy.requestLabel,orderable:offer.orderable,releaseDate:offer.releaseDate};
    }
    const status=typeof product?.release==='string'?product.release:product?.release?.status;
    return Object.hasOwn(states,status)?states[status]:states.upcoming;
  }
  function priceNote(product){
    const offer=window.RiCommerce?.offer(product?.id);
    if(offer)return typeof offer.price==='number'&&Number.isFinite(offer.price)
      ?'Цена: '+window.RiCommerce.money(offer.price)+'.'
      :'Цена пока не объявлена.';
    const status=release(product).status;
    if(status==='closed')return 'Цена следующего выпуска появится при его анонсе.';
    return typeof product?.price==='number'&&Number.isFinite(product.price)&&product.price>=0
      ?'Ориентировочная цена: '+new Intl.NumberFormat('ru-RU').format(product.price)+' ₽.'
      :status==='announced'?'Цена пока не объявлена.':'Цена при анонсе дропа.';
  }
  window.RiMerchDrops=Object.freeze({scope,states,release,priceNote,isAllMerch:id=>id===scope.id});
})();

;
/* source: buy-options-v20.js */
/* Digital editions checked 2026-10-30; retail links checked 2026-11-01.
   Shop pages and publisher posts are recorded in source/v98-art/retail-*.json.
   Prices and stock on external sites stay with the seller. */
(() => {
  'use strict';
  const editions={
  "black-white": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/chernyy-belyy-45102787/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/chernyy-belyy-67940762/",
    "publisher": "https://ast.ru/book/chernyy-belyy-893506/",
    "stores": [
      {"name":"Читай-город","url":"https://www.chitai-gorod.ru/product/cernyj-belyj-3152437"},
      {"name":"Ozon","url":"https://www.ozon.ru/product/chernyy-belyy-guva-ri-3672904110/"},
      {"name":"Book24","url":"https://book24.ru/product/cernyj-belyj-8796765/"}
    ]
  },
  "grey-forest": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/seryy-les-45874197/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/seryy-les-67640600/",
    "publisher": "https://ast.ru/book/seryy-les-897308/",
    "stores": [
      {"name":"Читай-город","url":"https://www.chitai-gorod.ru/product/seryj-les-3171237"},
      {"name":"Ozon","url":"https://www.ozon.ru/product/seryy-les-guva-ri-4988580383/"},
      {"name":"Wildberries","url":"https://www.wildberries.ru/catalog/1238382127/detail.aspx"}
    ]
  },
  "silence-1": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-chast-1-67693002/",
    "publisher": null
  },
  "silence-2": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-chast-2-67738907/",
    "publisher": null
  },
  "silence": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-sbornik-67740728/",
    "publisher": null
  },
  "shata": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/shata-72267004/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/shata-72272470/",
    "publisher": null,
    "authorInfo": "https://t.me/riguva/2078"
  },
  "sherka": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/",
    "audio": null,
    "publisher": null,
    "authorInfo": "https://t.me/riguva/4636"
  }
};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDateLabel=value=>escape(value).replace(/(\d{1,2}) (ноября|декабря)/g,'$1&nbsp;$2');
  const link=(url,label,title)=>`<a class="edition-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(title)}">${escape(label)} <span aria-hidden="true">↗</span></a>`;
  const isPaperBook=p=>['black-white','grey-forest','silence-1','silence-2'].includes(p.id);
  const commerceOffer=p=>window.RiCommerce?.offer(p.id);
  function offerSummary(p,{showRelease=true}={}){
    const offer=commerceOffer(p);if(!offer)return '';
    const price=typeof offer.price==='number'&&Number.isFinite(offer.price)?`<p class="commerce-price-v97">${escape(window.RiCommerce.money(offer.price))}</p>`:'';
    const status=offer.statusText?`<p class="commerce-status-v97">${formatDateLabel(offer.statusText)}</p>`:'';
    const release=showRelease&&offer.releaseLabel&&!offer.statusText?.includes(offer.releaseLabel)?`<p class="commerce-release-v97">${formatDateLabel(offer.releaseLabel)}</p>`:'';
    return `<div class="commerce-offer-v97" data-offer-state="${escape(offer.state)}">${price}${status}${release}</div>`;
  }
  function purchaseAction(p){
    const offer=commerceOffer(p);if(!offer)return '';
    return offer.orderable
      ?`<button type="button" class="commerce-cart-v97" data-cart-add="${escape(p.id)}" aria-label="Добавить в корзину: ${escape(p.name)}">В корзину <span aria-hidden="true">↗</span></button>`
      :`<button type="button" class="merch-drop-link commerce-notify-v97" data-drop-open="${escape(p.id)}">${escape(offer.requestLabel||'Сообщить о дропе')} <span aria-hidden="true">↗</span></button>`;
  }
  function listFormats(p){
    const e=editions[p.id];if(p.type!=='book'||!e)return [];
    const result=[];
    if(e.text)result.push({type:'ebook',label:'Электронная книга'});
    if(e.audio)result.push({type:'audio',label:'Аудиокнига'});
    if(isPaperBook(p)||e.authorInfo){
      const source=e.authorInfo?'author':e.publisher?'publisher':null;
      result.push({type:'paper',label:'Бумажная книга',source,orderable:source==='author'&&!!commerceOffer(p)?.orderable});
    }
    return result;
  }
  function previewFormats(p){
    const items=listFormats(p);if(!items.length)return '';
    return `<ul class="book-formats-v98" aria-label="Форматы книги: ${escape(p.name)}">${items.map(format=>{
      const offer=format.source==='author'?commerceOffer(p):null;
      const purchase=format.source==='author'?`<span class="book-format-source-v98">${escape(offer?.edition||'Авторский самиздат')}</span>${offerSummary(p)}${offer?`<div class="commerce-actions-v97">${purchaseAction(p)}</div>`:''}`:format.source==='publisher'?'<span class="book-format-source-v98">Издательство АСТ</span>':'';
      return `<li class="book-format-v98" data-format="${format.type}"><span class="book-format-name-v98">${format.label}</span>${purchase}</li>`;
    }).join('')}</ul>`;
  }
  function formats(p){
    const e=editions[p.id];
    if(!e)return p.type==='merch'?(window.RiMerchDrops?.release(p).label||'Дропы автора'):'';
    return [e.text?'Текст':null,e.audio?'Аудио':null,isPaperBook(p)||e.authorInfo?'Бумажная книга':null].filter(Boolean).join(' · ');
  }
  function render(p){
    if(p.type==='merch'){
      const offer=commerceOffer(p);
      if(offer)return `<section class="edition-choices merch-drop-choice commerce-detail-v97" data-release="${escape(offer.state)}" aria-label="Покупка и выпуск"><div class="edition-author">${offerSummary(p)}<div class="commerce-actions-v97">${purchaseAction(p)}</div><p class="merch-announcement-v91">Анонсы дропов будут в <a href="https://t.me/riguva" target="_blank" rel="noopener noreferrer">Telegram Ри <span aria-hidden="true">↗</span></a>.</p></div></section>`;
      const drops=window.RiMerchDrops;
      const release=drops?.release(p)||{status:'upcoming',label:'Дропы автора',title:'Узнать о выпуске',description:'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.',requestLabel:'Сообщить о дропе'};
      const price=drops?.priceNote(p)||(typeof p.price==='number'&&Number.isFinite(p.price)?`Ориентировочная цена: ${new Intl.NumberFormat('ru-RU').format(p.price)} ₽.`:'Цена при анонсе дропа.');
      return `<section class="edition-choices merch-drop-choice" data-release="${escape(release.status)}" aria-label="Выпуск и заявка"><div class="edition-author"><p class="edition-label">${escape(release.label)}</p><h3>${escape(release.title)}</h3><p>${escape(release.description)}</p><p class="merch-announcement-v91">Анонсы дропов будут в <a href="https://t.me/riguva" target="_blank" rel="noopener noreferrer">Telegram Ри <span aria-hidden="true">↗</span></a>.</p><p class="edition-price-note">${escape(price)}</p><button type="button" class="edition-request" data-drop-open="${escape(p.id)}">${escape(release.requestLabel)} <span aria-hidden="true">↗</span></button><button type="button" class="edition-all-merch-v89" data-drop-open="${escape(drops?.scope.id||'all-merch-drops')}">Все будущие дропы мерча <span aria-hidden="true">↗</span></button></div></section>`;
    }
    const e=editions[p.id]||{};
    const stores=(e.stores||[]).map(store=>link(store.url,store.name,p.name+' / бумажная книга в '+store.name)).join('');
    const publisher=e.publisher?`<div class="edition-channel"><h4>Бумажная книга</h4><p>АСТ · NoSugar Books</p><div class="edition-store-links-v98" aria-label="Бумажная книга в магазинах">${stores}</div>${link(e.publisher,'Об издании на АСТ',p.name+' на сайте издательства АСТ')}</div>`:isPaperBook(p)?`<div class="edition-channel"><h4>Бумажная книга</h4>${link('https://t.me/riguva','Telegram Ри',p.name+' / Telegram Ри')}</div>`:'';
    const digital=`<div class="edition-channel"><h4>На Литрес</h4><div class="edition-digital-links">${e.text?link(e.text,'Читать',p.name+' / электронная книга на Литрес'):''}${e.audio?link(e.audio,'Слушать',p.name+' / аудиокнига на Литрес'):''}</div></div>`;
    const offer=commerceOffer(p);
    const author=e.authorInfo&&offer?`<div class="edition-author commerce-detail-v97"><h4>Бумажная книга</h4><p class="book-selfpub-v97">${escape(offer.edition||'Авторский самиздат')}</p>${offerSummary(p,{showRelease:false})}<p class="commerce-description-v97">Книги выпускаются тиражами.${offer.releaseLabel?' '+formatDateLabel(offer.releaseLabel)+'.':''}</p><div class="commerce-actions-v97">${purchaseAction(p)}</div></div>`:e.authorInfo?`<div class="edition-author"><h4>Бумажная книга</h4><p class="book-selfpub-v97">Авторский самиздат</p><p>Книги выпускаются тиражами.</p></div>`:'';
    return `<section class="edition-choices" aria-label="Где купить ${escape(p.name)}">
      <h3 class="edition-section-title">Выбрать издание</h3>
      <div class="edition-external">${digital}${publisher}</div>
      ${author}
    </section>`;
  }
  window.RiBuyOptions={get:id=>editions[id]||null,formats,render,offerSummary,purchaseAction,listFormats,previewFormats};
})();

;
/* source: merch-preview-v91.js */
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

;
/* source: app.js */
'use strict';
const products = [
  {"id":"black-white","coverRatio":0.636152,"name":"Черный Белый","image":"assets/current/Для сайта/black-white.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга I","price":1190,"tag":"Начать здесь","description":"Мир рухнул и ожил заново, позволяя закрытому городу Сфера властвовать над выжившими людьми. Они не знают, что есть другие новые города, а знают лишь то, что за стеной их ожидают голодные хищники, рожденные Мировой Катастрофой. Лекса Ройс тоже верит в это, но вынуждена бежать из Сферы, в которой прожила всю жизнь. Она хочет лишь спасти брата, но теперь за ней охотится целая армия. Она хочет жить вдалеке от опасности, но ее манит новый город… и охотник, которому нет равных. Лекса обещает, что полюбит новую жизнь, но в нее врывается ураган. И зовут его мистер Блэк.","specs":["Постапокалипсис","672 стр.","Книга I","18+"],"source":"https://ast.ru/book/chernyy-belyy-893506/","sourceLabel":"Об издании на сайте АСТ ↗","format":null,"volume":{"pages":672,"basis":"print","isbn":"978-5-17-179711-9","widthMm":132,"heightMm":208,"depthMm":45,"source":"https://ast.ru/book/chernyy-belyy-893506/","depthKind":"publisher_dimensions"},"mockupThickness":0.216346},
  {"id":"grey-forest","coverRatio":0.631255,"name":"Серый лес","image":"assets/current/Для сайта/grey-forest.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга II","price":1090,"tag":"Продолжение","description":"Продолжение книги «Черный Белый». Надежды на спасение нет. Все, что осталось, это тягучая боль, пустота и жажда мести. Как пережить потерю близкого человека?! Как выжить, если бежать некуда?! Рано или поздно, они найдут меня. ОН найдет.","specs":["Постапокалипсис","416 стр.","Книга II","18+"],"source":"https://ast.ru/book/seryy-les-897308/","sourceLabel":"Об издании на сайте АСТ ↗","format":null,"volume":{"pages":416,"basis":"print","isbn":"978-5-17-189271-5","widthMm":133,"heightMm":207,"depthMm":27.6,"source":"https://ast.ru/book/seryy-les-897308/","depthKind":"publisher_dimensions"},"mockupThickness":0.133333},
  {"id":"silence-1","coverRatio":0.699062,"name":"Цвет тишины. Часть 1","image":"assets/current/Для сайта/silence-1.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга III","price":null,"tag":"Книга 3 из 4","description":"Третья книга. Часть 1.\n\nКогда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nПродолжение трилогии «Черный Белый» и «Серый лес».\n\nВнимание!\n\nТолько для лиц старше 18 лет!\n\nТекст содержит натуралистичные описания наркотического опыта, который обусловлен исключительно сюжетом и является неотъемлемой частью художественного замысла. Автор категорически против употребления наркотических и психоактивных веществ и настоятельно рекомендует всем читателям вести здоровый и трезвый образ жизни.","specs":["Электронная книга","2020 год","460 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":460,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/","depthKind":"visual_estimate","estimateNote":"Пропорция мокапа рассчитана ориентировочно по объёму электронной книги. Печатная пагинация и размеры не подтверждены."},"mockupThickness":0.145},
  {"id":"silence-2","coverRatio":0.699062,"name":"Цвет тишины. Часть 2","image":"assets/current/Для сайта/silence-2.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга IV","price":null,"tag":"Финал цикла","description":"Когда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nПродолжение трилогии «Черный Белый» и «Серый лес».\n\nВ книге присутствует нецензурная брань!","specs":["Электронная книга","2020 год","490 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":490,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/","depthKind":"visual_estimate","estimateNote":"Пропорция мокапа рассчитана ориентировочно по объёму электронной книги. Печатная пагинация и размеры не подтверждены."},"mockupThickness":0.153214},
  {"id":"shata","coverRatio":0.699062,"name":"Шата","image":"assets/current/Для сайта/shata.jpg","type":"book","series":"shatserak","worldName":"Шацерак","catalog":true,"meta":"Тёмное фэнтези · Книга I","price":1290,"tag":"Первая книга","description":"В моём мире существует сказка. Она гласит об ужасном боге Бадзун-Гра и его слугах, сотканных из тени. Этой сказкой пугают непослушных детишек, чтоб в лес по ночам не ходили... хотя и у взрослых мурашки от имени Бадзун-Гра.\n\nКто-то считает, что он лишь могущественный колдун; кто-то убежден, что он - вероломный бог; кто-то верит, что раньше Бадзун-Гра был человеком; другие же называют его отцом Мрака и злейшим существом на всем белом свете...\n\nА я - его дочь, и это вовсе не сказка.","specs":["Тёмное фэнтези","Книга I","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/shata-72267004/","sourceLabel":"О книге на Литрес ↗","format":null,"volume":{"pages":430,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/shata-72267004/","announcedPrintPages":600,"printAnnouncementSource":"https://t.me/riguva/1958","depthKind":"visual_estimate","estimateNote":"Автор анонсировала бумажную версию на 600 страниц. Пагинация позднего исправленного тиража и физические размеры не подтверждены."},"mockupThickness":0.183333},
  {"id":"sherka","coverRatio":0.67125,"name":"Шерка","image":"assets/author/Для сайта/sherka.jpg","type":"book","series":"shatserak","worldName":"Шацерак","catalog":true,"meta":"Тёмное фэнтези · Книга II","price":null,"tag":"Новая книга","description":"Баю-бай, мой дружок,\n\nНе ходи ночью за порог.\n\nТам, где темный лес шумит,\n\nБродят тени, как голодные псы.\n\nСпи, дитя, закрывай глаза,\n\nУспей уснуть, пока не взошла луна.\n\nЕсли будешь плакать, малыш,\n\nПридет Мрак и заберет твой детский крик.\n\nВторая книга серии «Шата»!","specs":["Электронная книга","2026 год","510 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":510,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/","depthKind":"visual_estimate","estimateNote":"Бумажный выпуск подтверждён автором, число печатных страниц не найдено. Относительный объём визуализации примерно в 510/430 раза больше Шаты при условном одинаковом формате."},"mockupThickness":0.213899},
  {"id":"silence","coverRatio":0.699062,"name":"Цвет тишины. Сборник","image":"assets/current/Для сайта/silence.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":false,"meta":"Постапокалипсис · Части I + II","price":1490,"tag":"Сборник","description":"Заключительная книга, из объединенных двух частей, трилогии «Черный Белый» и «Серый Лес».\n\nКогда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nСодержит нецензурную брань.\n\nВнимание!\n\nТолько для лиц старше 18 лет!\n\nТекст содержит натуралистичные описания наркотического опыта, который обусловлен исключительно сюжетом и является неотъемлемой частью художественного замысла. Автор категорически против употребления наркотических и психоактивных веществ и настоятельно рекомендует всем читателям вести здоровый и трезвый образ жизни.","specs":["Постапокалипсис","Части I + II","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/","sourceLabel":"О книге на Литрес ↗","format":null,"volume":{"pages":940,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/","depthKind":"visual_estimate","estimateNote":"Скрытая в текущем каталоге объединённая электронная версия. Условная толщина для визуализации, не спецификация бумажного издания."},"mockupThickness":0.276429},
  {"id":"stickerpack","name":"Стикерпак «Черный Белый»","image":"assets/author/v79-originals/01-alexia.jpg","photosPending":false,"useOverview":false,"type":"merch","series":"bw","worldName":"Черный Белый","meta":"Стикерпак · Только комплектом","price":1000,"provisionalPrice":true,"packOnly":true,"tag":"Только комплектом","description":"Стикерпак с героями серии «Черный Белый». Продаётся только полным комплектом. Рассмотри все изображения в галерее.","specs":["Мир «Черный Белый»","Только полным комплектом","По отдельности не продаётся"],"gallery":[{"src":"assets/author/v79-originals/01-alexia.jpg","alt":"Дизайн: Алексия","surface":"stickers-alexia-v79"},{"src":"assets/author/v79-originals/02-black.jpg","alt":"Дизайн: Мистер Блэк","surface":"stickers-black-v79"},{"src":"assets/author/v79-originals/03-jack.jpg","alt":"Дизайн: Джек","surface":"stickers-jack-v79"},{"src":"assets/author/v79-originals/04-troy.jpg","alt":"Дизайн: Трой","surface":"stickers-troy-v79"},{"src":"assets/author/v79-originals/05-dayton.jpg","alt":"Дизайн: Дэйтон","surface":"stickers-dayton-v79"},{"src":"assets/author/v79-originals/06-pierce.jpg","alt":"Дизайн: Пирс","surface":"stickers-pierce-v79"},{"src":"assets/author/v79-originals/07-theo-naita.jpg","alt":"Дизайн: Тео и Наита","surface":"stickers-theo-naita-v79"},{"src":"assets/author/Для сайта/stickers-02.jpg","alt":"Дизайн: Рич","surface":"stickers-02"},{"src":"assets/author/Для сайта/stickers-03.jpg","alt":"Дизайн: Джейс","surface":"stickers-03"}],"mockup":true},
  {"id":"bookmarks","name":"Закладка «Черный Белый»","image":"assets/author/Для сайта/bookmarks.jpg","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","meta":"Двусторонняя закладка","price":1000,"provisionalPrice":true,"tag":"Двусторонняя","description":"Двусторонняя закладка с героями серии «Черный Белый».","specs":["Мир «Черный Белый»","Двусторонняя","1 закладка"],"mockup":true,"gallery":[{"src":"assets/author/Для сайта/bookmarks.jpg","surface":"bookmark-front","alt":"Закладка: сторона 1"},{"src":"assets/author/Для сайта/bookmarks.jpg","surface":"bookmark-back","alt":"Закладка: сторона 2"}]},
  {"id":"cerberus-figurine","name":"Фигурка «Цербер»","image":"assets/merch-v90/Для сайта/cerberus-front.webp","photosPending":false,"photoLabel":"Цербер","type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Фигурка · Мир «Черный Белый»","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Фигурка Цербера из мира «Черный Белый»: три головы, рельефный узор на груди и манжеты на передних лапах. Рельефное основание расположено на гладкой круглой подставке.","specs":["Мир «Черный Белый»","Фигурка","Следующий дроп"],"gallery":[{"src":"assets/merch-v90/Для сайта/cerberus-front.webp","alt":"Фигурка «Цербер»: вид спереди"},{"src":"assets/merch-v90/Для сайта/cerberus-side.webp","alt":"Фигурка «Цербер»: вид сбоку"}]},
  {"id":"ribbed-candle","name":"Ребристая свеча «Черный Белый»","image":"assets/merch-v89/Для сайта/ribbed-candle.webp","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Цилиндрическая свеча","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Чёрно-белая цилиндрическая свеча с ребристой поверхностью и изображением пары сверху.","specs":["Мир «Черный Белый»","Чёрно-белая","Ребристая поверхность"],"gallery":[{"src":"assets/merch-v89/Для сайта/ribbed-candle.webp","alt":"Ребристая свеча «Черный Белый»: вид с изображением пары сверху"}]},
  {"id":"book-candle","name":"Свеча-книга «Черный Белый»","image":"assets/merch-v89/Для сайта/book-candle-closed.webp","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Свеча в форме книги","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Свеча в форме книги «Черный Белый». На крышке находится обложка. Внутри белый воск и восковые фигурки пистолета, пули, черепа, ананаса и часов. В галерее можно рассмотреть закрытую и открытую свечу.","specs":["Мир «Черный Белый»","Крышка с обложкой","Белый воск и восковые фигурки"],"gallery":[{"src":"assets/merch-v89/Для сайта/book-candle-closed.webp","alt":"Свеча-книга «Черный Белый»: закрытая крышка с обложкой"},{"src":"assets/merch-v89/Для сайта/book-candle-open.webp","alt":"Свеча-книга «Черный Белый»: открытая свеча с белым воском и восковыми фигурками"}]}
];
window.RiCommerce?.registerCatalog(products);
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const getProduct = id => products.find(p=>p.id===id);
const safe = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const detailDescription = p => p.type==='book'
  ? '<div class="detail-description'+(p.id==='sherka'?' detail-description--verse':'')+'">'+String(p.description).split(/\n\s*\n/).map(part=>'<p>'+safe(part)+'</p>').join('')+'</div>'
  : '<p class="detail-description">'+safe(p.description)+'</p>';
let toastTimer, zoomProduct=null, zoomIndex=0;
const bookMockup = (p,lazy=true) => {
  return `<span class="book-mockup" data-book-id="${safe(p.id)}" data-book-world="${safe(p.series||'')}" data-volume-basis="${safe(p.volume?.basis||'unknown')}" style="--book-ratio:${p.coverRatio||0.6993};--book-thickness:${p.mockupThickness||0.17}"><span class="book-body"><span class="book-pages" aria-hidden="true"></span><span class="book-spine" aria-hidden="true"><span>РИ ГУВА</span><b>${safe(p.name)}</b></span><img class="book-front" data-ri-deferred="${p.image}" data-ri-context="${lazy?'card':'detail'}" alt="Обложка книги: ${safe(p.name)}" loading="${lazy?'lazy':'eager'}"><span class="book-front-board-edge" aria-hidden="true"></span><span class="book-cover-finish" aria-hidden="true"></span></span><span class="book-contact-shadow" aria-hidden="true"></span><span class="book-floor-shadow" aria-hidden="true"></span></span>`;
};
window.bookMockup=bookMockup;
const photoPlaceholder = (p,compact=false) => {
  const label=p.photoLabel||(p.packOnly?'Стикерпак':p.id==='bookmarks'?'Закладка':p.name);
  return compact?`<span class="product-thumb-placeholder" role="img" aria-label="Фото пока не добавлено">${safe(label)}</span>`:`<span class="photo-placeholder"><span class="photo-placeholder-title">${safe(label)}</span><span class="photo-placeholder-note">Фото пока не добавлено</span></span>`;
};
const hasDesignMockup = p => !!(p.mockup&&window.RiMerchMockups);
const productThumb = p => hasDesignMockup(p)?`<span class="product-thumb-mockup">${window.RiMerchMockups.renderProduct(p,'thumb')}</span>`:p.photosPending||!p.image?photoPlaceholder(p,true):`<img data-ri-deferred="${safe(p.image)}" data-ri-context="thumb" alt="${safe(p.name)}">`;
function renderMerchSurface(p,photo,context='detail'){
  if(hasDesignMockup(p)&&photo.surface)return window.RiMerchMockups.renderSurface(photo.surface,photo.src,context,photo.alt);
  return `<img class="merch-main-image${p.id==='cerberus-figurine'&&photo===p.gallery?.[1]?' cerberus-side-v95':''}" data-ri-deferred="${safe(photo.src)}" data-ri-context="${context}" alt="${safe(photo.alt)}" loading="${context==='detail'?'eager':'lazy'}" decoding="async">`;
}
const merchVisual = p => {
  if(hasDesignMockup(p))return window.RiMerchMockups.renderProduct(p,'card');
  if(p.photosPending||!p.image)return photoPlaceholder(p);
  return `<img data-ri-deferred="${safe(p.image)}" data-ri-context="card" alt="${safe(p.name)}" loading="lazy">`;
};
const bookShelfCard = p => {
  return `<article class="product-card book-shelf-card-v86 book-shelf-card-v93" data-series="${safe(p.series||'')}"><button class="product-visual" data-product="${safe(p.id)}" aria-label="Подробнее: ${safe(p.name)}">${bookMockup(p)}</button><div class="book-shelf-info-v93"><a class="product-name" href="#${safe(p.id)}" data-product="${safe(p.id)}">${safe(p.name)}</a>${window.RiBuyOptions?.previewFormats(p)||''}<div class="product-buy"><button type="button" class="add-button" data-product="${safe(p.id)}" aria-label="О книге: ${safe(p.name)}">О книге <span aria-hidden="true">↗</span></button></div></div></article>`;
};
const upcomingShatserakBooks = [
  {id:'shatserak-3', number:'3', name:'Шацерак', status:'В процессе написания', image:'assets/shatserak-upcoming/cover-iii.jpg'},
  {id:'shatserak-4', number:'4', image:'assets/shatserak-upcoming/cover-iv.jpg'},
  {id:'shatserak-5', number:'5', image:'assets/shatserak-upcoming/cover-v.jpg'},
];
function upcomingBookShelfCard(book){
  const series = 'shatserak';
  const volume = `Книга ${book.number}`;
  const name = book.name || volume;
  const heading = book.name ? safe(book.name) : `Книга <span class="upcoming-book-digit">${safe(book.number)}</span>`;
  const status = book.status || 'Будущая книга серии «Шацерак»';
  return `<article class="product-card book-shelf-card-v86 book-shelf-card-v93 book-shelf-card--upcoming" data-series="${series}">
    <div class="product-visual" aria-hidden="true">${bookMockup({...book, name, series, coverRatio:2/3})}</div>
    <div class="book-shelf-info-v93">
      <h3 class="product-name">${heading}</h3>
      ${book.name ? `<p class="upcoming-book-number">${safe(volume)}</p>` : ''}
      <p class="upcoming-book-status">${safe(status)}</p>
    </div>
  </article>`;
}
const productCard = (p,i,merch=false) => p.type==='book'&&!merch?bookShelfCard(p,i):`<article class="product-card ${merch?'merch-card':''}" data-series="${safe(p.series||'')}"${merch?` data-merch-group="${safe(p.merchGroup||'paper')}"`:''}><button class="product-visual" data-product="${safe(p.id)}" aria-label="Подробнее: ${safe(p.name)}"><span class="product-tag">${safe(p.tag)}</span>${p.type==='book'?bookMockup(p):merchVisual(p)}</button><p class="product-meta">${safe(p.meta)}</p><a class="product-name" href="#${safe(p.id)}" data-product="${safe(p.id)}">${safe(p.name)}</a><div class="product-buy"><span class="product-formats">${safe(window.RiBuyOptions?.formats(p)||'Дропы автора')}</span><button type="button" class="add-button" ${p.type==='merch'?`data-drop-open="${safe(p.id)}"`:`data-product="${safe(p.id)}"`} aria-label="${p.type==='merch'?'Оставить заявку:':'Где купить:'} ${safe(p.name)}">${p.type==='merch'?'Оставить заявку':'Где купить'} <span aria-hidden="true">↗</span></button></div></article>`;
function renderMerchShelfV91(merch){
  return merch.map(p=>window.RiMerchPreview.render(p,renderMerchSurface)).join('');
}
let catalogWorld=null;
function renderBooks(filter=catalogWorld){
  const books=products.filter(p=>p.type==='book'&&p.catalog!==false&&p.series===filter);
  const upcoming = filter === 'shatserak' ? upcomingShatserakBooks : [];
  const grid = $('#book-grid');
  grid.dataset.collection=filter;
  grid.innerHTML=books.map((p,i)=>productCard(p,i)).concat(upcoming.map(upcomingBookShelfCard)).join('');
  if(filter === 'shatserak'){
    grid.insertAdjacentHTML('beforeend', `<figure class="shatserak-shelf-illustration">
      <img data-ri-deferred="assets/shatserak-upcoming/beryl-glasses.webp" data-ri-world="shatserak" width="1152" height="540" alt="Лежащие очки с круглыми стёклами из тёмного берилла, платиновой перемычкой и кожаными лентами" decoding="async">
    </figure>`);
  }
  $('#book-grid-rest').innerHTML='';
  $('#bw-finale').hidden=true;
  return books.length + upcoming.length;
}
function setCatalogWorld(world){
  catalogWorld=['bw','shatserak'].includes(world)?world:null;
  $('#search-input').placeholder=catalogWorld==='shatserak'?'Название книги':'Название книги или артефакта';
  $('#search-input').setAttribute('aria-label','Поиск по миру');
  const bookCount = renderBooks(catalogWorld);
  const merch=products.filter(p=>p.type==='merch'&&p.series===catalogWorld);
  $('#merch-grid').innerHTML=renderMerchShelfV91(merch);
  $('#merch').hidden=!merch.length;
  return {books:bookCount,merch:merch.length};
}
window.RiCatalog={setWorld:setCatalogWorld,items:()=>products.map(({id,name,type,series,catalog,release,price,merchGroup})=>({id,name,type,series,catalog,release,price,merchGroup}))};
setCatalogWorld(null);

function showToast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function showDialog(dialog){$$('dialog[open]').forEach(d=>d.close());dialog.showModal();document.body.style.overflow='hidden';window.RiImageLoading?.refresh();}
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
});
document.addEventListener('click',e=>{
  const photoOpen=e.target.closest('[data-photo-open]');if(photoOpen){e.preventDefault();openPhoto(photoOpen.dataset.photoOpen);return;}
  const photoStep=e.target.closest('[data-photo-step]');if(photoStep){e.preventDefault();stepPhoto(Number(photoStep.dataset.photoStep));return;}
  const galleryStep=e.target.closest('[data-gallery-step]');if(galleryStep){e.preventDefault();const gallery=$('#product-detail .detail-gallery'),p=getProduct(galleryStep.dataset.galleryProduct);if(p?.gallery?.length){const current=Number($('.gallery-thumb.is-active',gallery)?.dataset.galleryIndex||0);selectGalleryImage(p.id,(current+Number(galleryStep.dataset.galleryStep)+p.gallery.length)%p.gallery.length);}return;}
  const galleryButton=e.target.closest('[data-gallery-index]');if(galleryButton){e.preventDefault();selectGalleryImage(galleryButton.dataset.galleryProduct,Number(galleryButton.dataset.galleryIndex));return;}
  const product=e.target.closest('[data-product]');if(product){e.preventDefault();window.RiMerchPreview.open(product.dataset.product,showProduct,selectGalleryImage);return;}
  const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
});
function merchGallery(p){
  if(p.photosPending||!p.image)return `<div class="merch-photo-stage merch-photo-stage--pending">${photoPlaceholder(p)}</div>`;
  const photos=p.gallery?.length?p.gallery:[{src:p.image,alt:p.name}];
  return `<div class="detail-gallery"><div class="merch-photo-stage"><button class="gallery-photo-button" data-photo-open="${safe(p.id)}" aria-label="${p.merchGroup==='objects'?'Рассмотреть фото крупно':'Рассмотреть макет крупно'}"><span class="merch-main-art">${renderMerchSurface(p,photos[0])}</span><span class="photo-zoom-hint">РАССМОТРЕТЬ КРУПНО ⤢</span></button></div>${photos.length>1?`<div class="gallery-controls"><button data-gallery-step="-1" data-gallery-product="${safe(p.id)}" aria-label="Предыдущее изображение">←</button><p class="gallery-caption" aria-live="polite">01 / ${String(photos.length).padStart(2,'0')} · ${safe(photos[0].alt)}</p><button data-gallery-step="1" data-gallery-product="${safe(p.id)}" aria-label="Следующее изображение">→</button></div><div class="gallery-thumbs" role="group" aria-label="Изображения товара">${photos.map((photo,i)=>`<button class="gallery-thumb${i===0?' is-active':''}" data-gallery-product="${safe(p.id)}" data-gallery-index="${i}" aria-label="${p.merchGroup==='objects'?'Изображение':'Дизайн'} ${i+1}: ${safe(photo.alt)}" aria-pressed="${i===0}">${renderMerchSurface(p,photo,'thumb')}</button>`).join('')}</div>`:''}</div>`;
}

function selectGalleryImage(id,index){
  const p=getProduct(id),photo=p?.gallery?.[index];
  if(!photo||!Number.isInteger(index))return;
  const gallery=$('#product-detail .detail-gallery');if(!gallery)return;
  const art=$('.merch-main-art',gallery);if(!art)return;
  art.innerHTML=renderMerchSurface(p,photo);
  $$('[data-gallery-index]',gallery).forEach(button=>{const active=Number(button.dataset.galleryIndex)===index;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
  const caption=$('.gallery-caption',gallery);
  if(caption)caption.textContent=String(index+1).padStart(2,'0')+' / '+String(p.gallery.length).padStart(2,'0')+' · '+photo.alt;
}

function openPhoto(id){
  const p=getProduct(id);if(!p||p.photosPending||!p.image)return;
  zoomProduct=p;zoomIndex=Number($('#product-detail .gallery-thumb.is-active')?.dataset.galleryIndex||0);
  renderPhoto();$('#photo-dialog').showModal();document.body.style.overflow='hidden';window.RiImageLoading?.refresh();
}
function renderPhoto(){
  const photos=zoomProduct.gallery?.length?zoomProduct.gallery:[{src:zoomProduct.image,alt:zoomProduct.name}];
  const photo=photos[zoomIndex];
  $('#photo-view').innerHTML=renderMerchSurface(zoomProduct,photo,'zoom');
  $('#photo-caption').textContent=photo.alt;$('#photo-counter').textContent=String(zoomIndex+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');
  $$('[data-photo-step]').forEach(button=>button.disabled=photos.length<2);
  if(zoomProduct.gallery?.length)selectGalleryImage(zoomProduct.id,zoomIndex);
}
function stepPhoto(step){
  if(!zoomProduct)return;const count=zoomProduct.gallery?.length||1;
  zoomIndex=(zoomIndex+step+count)%count;renderPhoto();
}
document.addEventListener('keydown',event=>{if(!$('#photo-dialog').open)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stepPhoto(event.key==='ArrowRight'?1:-1);}});
function showProduct(id){
  const p=getProduct(id);if(!p)return;
  $('#product-detail').innerHTML=`<div class="product-detail${p.type==='merch'?' merch-detail':''}${p.merchGroup==='objects'?' merch-object-detail-v89':''}" data-series="${safe(p.series||'')}"><div class="detail-image ${p.type==='merch'?'merch-image':''}">${p.type==='book'?bookMockup(p,false):merchGallery(p)}</div><div class="detail-copy"><p class="eyebrow">${safe(p.meta)}</p><h2 id="product-detail-title">${safe(p.name)}</h2>${detailDescription(p)}<div class="detail-specs">${p.specs.map(s=>`<span>${safe(s)}</span>`).join('')}</div>${window.RiBuyOptions?.render(p)||''}</div></div>`;
  $('#product-dialog').setAttribute('aria-label',p.name);showDialog($('#product-dialog'));
  $('#product-dialog').scrollTop=0;
}
$('#cart-open').onclick=()=>window.RiCommerce?.openCart();
$('#search-open').onclick=()=>{showDialog($('#search-dialog'));$('#search-input').value='';renderSearch('');$('#search-input').focus();};
function renderSearch(query){
  const q=query.toLocaleLowerCase('ru').trim();
  const matches=products.filter(p=>p.catalog!==false&&p.series===catalogWorld&&(p.name+' '+p.meta+' '+(p.worldName||'')).toLocaleLowerCase('ru').includes(q));
  $('#search-results').innerHTML=matches.length?matches.map(p=>`<button class="search-result" data-product="${safe(p.id)}">${productThumb(p)}<span>${safe(p.name)}<small>${safe(p.meta)}</small></span><b class="search-format">${p.type==='book'?'Где купить':'Дроп'}</b></button>`).join(''):`<p class="search-empty">По запросу «${safe(query)}» ничего не найдено.<br>Попробуй другое название.</p>`;
}

$('#search-input').addEventListener('input',e=>renderSearch(e.target.value));
$('#menu-open').onclick=()=>showDialog($('#menu-dialog'));
$$('#menu-dialog nav a').forEach(a=>a.onclick=()=>$('#menu-dialog').close());



;
/* source: drop-requests-v20.js */
/* Preview: same-origin local persistence only. Tilda mode uses configured native hooks.
   window.RiCommerceConfig = {mode:'local_preview', requestEndpoint:'/api/drop-requests',
     tilda:{defaultPopup:'#popup:drop-request', popupByProduct:{shata:'#popup:shata-request'}}}; */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const dialog=byId('drop-dialog'),form=byId('drop-form');
  if(!dialog||!form)return;
  const fields=byId('drop-fields'),view=byId('drop-form-view'),success=byId('drop-success');
  const productInput=byId('drop-product-id'),productSelect=byId('drop-product-select');
  const contact=byId('drop-contact'),name=byId('drop-name'),consent=byId('drop-consent');
  const submit=byId('drop-submit'),error=byId('drop-error'),previewNote=byId('drop-preview-note');
  const legalDialog=byId('legal-dialog');
  let fixedProduct=null,opener=null,returnProduct=null,returnTrigger=null,formWorld=null;
  let activeRun=null,controller=null,lastAttempt=null,suspendedForLegal=false,legalOpener=null;
  let nativeTrigger=null,productionUnavailable=false;
  const items=()=>window.RiCatalog?.items?.()||[];
  const config=()=>window.RiCommerceConfig||{};
  const currentType=()=>form.querySelector('[name="contactType"]:checked')?.value||'telegram';
  const merchScope=window.RiMerchDrops?.scope||{id:'all-merch-drops',name:'Все будущие дропы мерча'};
  const isAllMerch=id=>id===merchScope.id;
  const hasMerchScope=()=>document.body.dataset.world==='bw';
  const waitingForRelease=item=>item.type==='merch'&&!window.RiCommerce?.offer(item.id)?.orderable;
  const requestTarget=id=>isAllMerch(id)?(hasMerchScope()?merchScope:null):items().find(item=>item.id===id&&waitingForRelease(item));
  const selectedId=()=>fixedProduct?.id||productSelect.value;
  const contactHint=()=>currentType()==='email'?
    (isAllMerch(selectedId())?'Адрес для анонсов будущих дропов мерча.':'Адрес для сообщения о выбранном дропе.'):
    'Имя пользователя или ссылка t.me.';

  function setBusy(busy){
    fields.disabled=busy||productionUnavailable;submit.disabled=busy||productionUnavailable;
    form.setAttribute('aria-busy',String(busy));
    submit.querySelector('span').textContent=busy?'Сохраняем заявку…':'Уведомить меня';
    byId('drop-submit-status').textContent=busy?'Сохраняем заявку.':'';
  }
  function clearErrors(){
    error.hidden=true;error.textContent='';
    form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.drop-field-error').forEach(node=>{node.hidden=true;node.textContent='';});
  }
  function fieldError(field,message){
    const mapping={productId:[productSelect,byId('drop-product-error')],name:[name,byId('drop-name-error')],contact:[contact,byId('drop-contact-error')],contactType:[contact,byId('drop-contact-error')],consent:[consent,byId('drop-consent-error')]};
    const pair=mapping[field];
    if(!pair){generalError(message);return;}
    pair[0].setAttribute('aria-invalid','true');pair[1].textContent=message;pair[1].hidden=false;
    if(!pair[0].disabled)pair[0].focus();
  }
  function generalError(message){error.textContent=message;error.hidden=false;error.focus();}
  function updateContactType(){
    const email=currentType()==='email';
    contact.type=email?'email':'text';contact.inputMode=email?'email':'text';
    contact.autocomplete=email?'email':'username';contact.placeholder=email?'name@example.ru':'@username';
    byId('drop-contact-label').textContent=email?'Электронная почта':'Telegram';
    byId('drop-contact-hint').textContent=contactHint();
    contact.removeAttribute('aria-invalid');byId('drop-contact-error').hidden=true;
  }
  function updateIntro(){
    const id=selectedId(),p=requestTarget(id),allMerch=isAllMerch(id);
    const offer=window.RiCommerce?.offer(id);
    const announcements=byId('drop-merch-announcements-v91');
    if(announcements)announcements.hidden=!(allMerch||p?.type==='merch');
    byId('drop-title').textContent=allMerch?'Будущие дропы мерча':offer?.state==='upcoming'?'Узнать о предзаказе':'Напомнить о дропе';
    dialog.querySelector('.drop-kicker').textContent=allMerch?'Анонсы новых выпусков':offer?.releaseLabel||'Следующий дроп';
    byId('drop-intro').textContent=allMerch?
      'Выбор охватывает все будущие дропы мерча, включая выпуски, которых ещё нет в каталоге. Даты, состав и цены появятся в анонсах.':
      p?.type==='merch'?(window.RiMerchDrops?.release(p).description||'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.'):
      'Сообщим об открытии дропа или предзаказа.';
    consent.closest('label').querySelector('span').textContent=allMerch?
      'Даю согласие на обработку контактных данных для уведомлений о будущих дропах мерча.':
      'Даю согласие на обработку контактных данных для уведомления о выбранном дропе.';
    form.querySelector('.drop-form-note').textContent=allMerch?
      'Это интерес к будущим дропам мерча. Заявка не бронирует товар и не оформляет заказ.':
      offer?.price!=null?'Это уведомление о старте дропа. Заявка не бронирует товар и не оформляет заказ.':
      'Это уведомление об открытии предзаказа. Цена и условия покупки появятся в анонсе.';
    byId('drop-contact-hint').textContent=contactHint();
  }
  function populateProducts(){
    productSelect.replaceChildren(new Option('Выбери из списка',''));
    if(hasMerchScope()){
      const futureGroup=document.createElement('optgroup');futureGroup.label='Будущие выпуски';
      futureGroup.append(new Option(merchScope.name,merchScope.id));productSelect.append(futureGroup);
    }
    const available=items().filter(p=>p.catalog!==false&&p.series===document.body.dataset.world&&waitingForRelease(p));
    for(const type of ['book','merch']){
      const group=document.createElement('optgroup');group.label=type==='book'?'Книги':'Артефакты';
      available.filter(p=>p.type===type).forEach(p=>group.append(new Option(p.name,p.id)));
      if(group.children.length)productSelect.append(group);
    }
  }
  function nativeTildaPopup(productId){
    const tilda=config().tilda||{};
    const hook=tilda.popupByProduct?.[productId]||tilda.defaultPopup;
    if(typeof hook!=='string'||!/^#popup:[A-Za-z0-9_-]+$/.test(hook))return false;
    document.querySelectorAll('dialog[open]').forEach(node=>node.close());
    if(!nativeTrigger){
      nativeTrigger=document.createElement('a');nativeTrigger.className='drop-native-trigger';
      nativeTrigger.tabIndex=-1;nativeTrigger.setAttribute('aria-hidden','true');
      nativeTrigger.textContent='Открыть форму заявки';document.body.append(nativeTrigger);
    }
    nativeTrigger.href=hook;
    if(productId)nativeTrigger.dataset.productId=productId;else delete nativeTrigger.dataset.productId;
    nativeTrigger.click();
    return true;
  }
  function open(productId=null,source=null){
    const p=productId?requestTarget(productId):null;
    if(productId&&!p)return false;
    if(!isAllMerch(productId)&&config().mode==='tilda'&&nativeTildaPopup(productId))return true;
    controller?.abort();activeRun=null;controller=null;
    fixedProduct=p;opener=source||document.activeElement;
    const productDialog=byId('product-dialog');
    const previousProduct=productDialog?.querySelector('.edition-request[data-drop-open]')?.dataset.dropOpen;
    returnProduct=productDialog?.open?(items().some(item=>item.id===previousProduct)?previousProduct:(p&&!isAllMerch(p.id)?p.id:null)):null;
    returnTrigger=source?.dataset.dropOpen||returnProduct;
    formWorld=document.body.dataset.world||null;suspendedForLegal=false;
    form.reset();clearErrors();populateProducts();
    byId('drop-fixed-product').hidden=!p;byId('drop-product-choice').hidden=!!p;
    byId('drop-product-name').textContent=p?.name||'';productInput.value=p?.id||'';
    productInput.disabled=!p;productSelect.disabled=!!p;productSelect.required=!p;
    productionUnavailable=(config().mode||'local_preview')!=='local_preview';
    previewNote.textContent=productionUnavailable?
      'Тестовая версия сайта: заявки пока не принимаются. Анонсы появятся в Telegram Ри.':
      'Проверочная версия: заявка сохраняется локально и не отправляется Ри.';
    view.hidden=false;success.hidden=true;
    dialog.setAttribute('aria-labelledby','drop-title');dialog.setAttribute('aria-describedby','drop-intro');
    byId('drop-back').textContent=returnProduct?'Вернуться к карточке':'Вернуться';
    updateContactType();updateIntro();setBusy(false);
    if(typeof window.showDialog==='function')window.showDialog(dialog);
    else{document.querySelectorAll('dialog[open]').forEach(node=>node.close());dialog.showModal();document.body.style.overflow='hidden';}
    dialog.scrollTop=0;
    if(productionUnavailable){fields.disabled=true;generalError('Заявки в тестовой версии отключены.');}
    else(p?contact:productSelect).focus({preventScroll:true});
    return true;
  }
  function restoreContext(){
    if(returnProduct&&document.body.dataset.world===formWorld&&typeof window.showProduct==='function'){
      const id=returnProduct;returnProduct=null;window.showProduct(id);
      const target=byId('product-dialog')?.querySelector('[data-drop-open="'+CSS.escape(returnTrigger||id)+'"]');
      returnTrigger=null;
      target?.focus({preventScroll:true});return;
    }
    returnProduct=null;returnTrigger=null;
    if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
    else byId('cart-open')?.focus({preventScroll:true});
  }
  function close(){if(dialog.open)dialog.close();}
  dialog.addEventListener('close',()=>{
    if(suspendedForLegal)return;
    controller?.abort();controller=null;activeRun=null;setBusy(false);
    if(!document.querySelector('dialog[open]'))document.body.style.overflow='';
    restoreContext();
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
  });
  document.addEventListener('click',event=>{
    const legal=event.target.closest('[data-drop-legal]');
    if(!legalDialog||!legal||!dialog.open||!dialog.contains(legal)||!['privacy','consent'].includes(legal.dataset.legalOpen))return;
    suspendedForLegal=true;legalOpener=legal;
  },true);
  legalDialog?.addEventListener('close',()=>{
    if(!suspendedForLegal)return;
    suspendedForLegal=false;
    if(document.querySelector('dialog[open]')||(document.body.dataset.world||null)!==formWorld)return;
    dialog.showModal();document.body.style.overflow='hidden';legalOpener?.focus({preventScroll:true});
  });
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-drop-open]');
    if(trigger){event.preventDefault();open(trigger.dataset.dropOpen||null,trigger);return;}
    if(event.target.closest('[data-drop-close]')){event.preventDefault();close();}
  });
  form.addEventListener('change',event=>{
    if(event.target.name==='contactType')updateContactType();
    if(event.target===productSelect)updateIntro();
  });

  function normalizedPayload(){
    const productId=selectedId();
    if(!requestTarget(productId)){fieldError('productId',hasMerchScope()?'Выбери артефакт или все будущие дропы мерча.':'Выбери артефакт.');return null;}
    const contactType=currentType();
    let value=contact.value.normalize('NFC').trim();
    const displayName=name.value.normalize('NFC').trim();
    if(displayName.length>80||/[\u0000-\u001F\u007F]/.test(displayName)){fieldError('name','Проверь имя: не больше 80 символов.');return null;}
    if(contactType==='telegram'){
      value=value.replace(/^https?:\/\/(?:www\.)?t\.me\//i,'').replace(/^(?:www\.)?t\.me\//i,'').replace(/^@+/,'');
      if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)){fieldError('contact','Укажи Telegram в формате @username, от 5 до 32 символов.');return null;}
      value='@'+value.toLowerCase();
    }else{
      if(!/^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(value)||value.length>254){fieldError('contact','Укажи электронную почту, например name@example.ru.');return null;}
      const at=value.lastIndexOf('@');value=value.slice(0,at+1)+value.slice(at+1).toLowerCase();
    }
    if(!consent.checked){fieldError('consent','Для заявки нужно подтвердить согласие.');return null;}
    return {productId,contactType,contact:value,name:displayName,consent:true};
  }
  function uuid(){
    if(crypto.randomUUID)return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(activeRun)return;clearErrors();
    if((config().mode||'local_preview')!=='local_preview'){generalError('Тестовая версия сайта: заявки пока не принимаются. Данные не отправляются.');return;}
    const payload=normalizedPayload();if(!payload)return;
    let endpoint;
    try{
      endpoint=new URL(config().requestEndpoint||'/api/drop-requests',location.href);
      if(!/^https?:$/.test(location.protocol)||endpoint.origin!==location.origin)throw new Error('origin');
    }catch{generalError('Для сохранения заявки открой проверочную версию сайта через локальный сервер. Данные не отправлены.');return;}
    const fingerprint=JSON.stringify(payload);
    if(!lastAttempt||lastAttempt.fingerprint!==fingerprint)lastAttempt={fingerprint,key:uuid()};
    const run=Symbol('drop-request'),requestController=new AbortController();
    activeRun=run;controller=requestController;setBusy(true);
    const timeout=setTimeout(()=>requestController.abort(),15000);
    try{
      const response=await fetch(endpoint.href,{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},signal:requestController.signal,
        body:JSON.stringify({...payload,idempotencyKey:lastAttempt.key,website:byId('drop-website').value})});
      let result;try{result=await response.json();}catch{throw new Error('unreadable');}
      if(activeRun!==run||!dialog.open)return;
      if(!response.ok||result.ok!==true){
        setBusy(false);
        if(result.field&&typeof result.message==='string')fieldError(result.field,result.message);
        else generalError(typeof result.message==='string'?result.message:'Заявка не сохранена. Попробуй ещё раз.');
        return;
      }
      if(result.status!=='saved'||result.delivery!=='local_preview'||typeof result.requestId!=='string'||!result.requestId)throw new Error('unexpected');
      byId('drop-reference').textContent=result.requestId;
      byId('drop-success-product').textContent=requestTarget(payload.productId)?.name||'';
      view.hidden=true;success.hidden=false;
      dialog.setAttribute('aria-labelledby','drop-success-title');dialog.setAttribute('aria-describedby','drop-success-copy');
      dialog.scrollTop=0;byId('drop-success-title').focus({preventScroll:true});
    }catch(problem){
      if(activeRun!==run||!dialog.open)return;
      setBusy(false);generalError('Не удалось подтвердить сохранение. Данные Ри не отправлены. Проверь локальный сервер и попробуй ещё раз.');
    }finally{
      clearTimeout(timeout);
      if(activeRun===run){activeRun=null;controller=null;setBusy(false);}
    }
  });
  window.RiDrops={open,close};
})();

;
/* source: scene.js */
/* Detailed cover-inspired illustrations. Subtle movement, shared clock. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const images = {
    bw: {src:'assets/scenes/bw-detailed-v6.webp'},
    shatserak: {src:'assets/scenes/shatserak-detailed-v6.webp'}
  };
  const worlds = {
    'black-white': {image:'bw',focal:.76},
    'grey-forest': {image:'bw',focal:.79},
    shata: {image:'shatserak',focal:.69}
  };
  const instances = new Set();
  const dialogs = [...document.querySelectorAll('dialog')];
  const hasOpenDialog = () => dialogs.some(dialog=>dialog.open);
  let modalOpen = hasOpenDialog();
  let frame = 0, lastPaint = 0, domSettled=document.readyState==='complete';
  function schedule() {
    if(frame || document.hidden || hasOpenDialog() || ![...instances].some(s=>s.active()&&s.animated()))return;
    frame=requestAnimationFrame(tick);
  }
  function tick(time) {
    frame=0;
    if(document.hidden || hasOpenDialog())return;
    if(time-lastPaint>1000/30){instances.forEach(s=>{if(s.active()&&s.animated())s.paint(time);});lastPaint=time;}
    schedule();
  }
  const dialogObserver = new MutationObserver(() => {
    const next = hasOpenDialog();
    if(next === modalOpen)return;
    modalOpen = next;
    if(modalOpen){cancelAnimationFrame(frame);frame=0;return;}
    instances.forEach(instance=>instance.refresh());
    schedule();
  });
  dialogs.forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
  Object.values(images).forEach(entry=>{
    entry.image=new Image();entry.image.decoding='async';
    entry.image.onload=()=>{entry.ready=true;instances.forEach(s=>s.refresh());schedule();};
  });
  function requestImage(id,owner,bounds){
    if(!domSettled)return;
    const entry=images[worlds[id].image];
    if(window.RiImageLoading){window.RiImageLoading.request(entry.image,entry.src,{owner,bounds,world:worlds[id].image});return;}
    if(entry.requested)return;
    entry.requested=true;entry.image.fetchPriority='high';entry.image.src=entry.src;
  }
  function create(canvas, initial, main=false) {
    if(!canvas)return null;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
    const stage=canvas.closest(main?'.cinema-stage':'.portal-scene')||canvas.parentElement;
    const imageBounds=main?document.getElementById('world-view'):stage;
    const hoverStage=canvas.closest('.world-portal')||document.getElementById('experience')||stage;
    let world=initial, previous=null, changed=0, width=0,height=0,dpr=1,visible=false;
    let sceneWidth=0, leftOverlap=0;
    const portal=canvas.closest('.world-portal');
    let x=0,y=0,targetX=0,targetY=0,enabled=!document.body.classList.contains('still');
    const active=()=>visible&&width>0&&height>0&&!document.hidden&&!hasOpenDialog();
    const animated=()=>enabled&&!reduced.matches&&images[worlds[world].image].ready;
    function resize(){
      if(document.hidden || hasOpenDialog())return;
      const r=stage.getBoundingClientRect();width=r.width;height=r.height;
      if(!width||!height)return;
      const portalBounds=portal?.getBoundingClientRect();
      sceneWidth=portalBounds?.width??width;
      leftOverlap=portalBounds?Math.max(0,portalBounds.left-r.left):0;
      dpr=Math.min(devicePixelRatio||1,main?1.5:1.2);
      const w=Math.round(width*dpr),h=Math.round(height*dpr);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      paint(performance.now());schedule();
    }
    function draw(id,alpha,time){
      const config=worlds[id],entry=images[config.image];if(!entry.ready||!alpha)return;
      const photo=entry.image;
      const motion=enabled&&!reduced.matches;
      const zoom=1.055+(motion?Math.sin(time/15000)*.012:0);
      const fit=Math.max(sceneWidth/photo.naturalWidth,height/photo.naturalHeight)*zoom;
      const focal=main&&width/height>1.2?.5:config.focal;
      const drift=motion?x*7:0;
      const w=Math.max(photo.naturalWidth*fit,width);
      const h=w*photo.naturalHeight/photo.naturalWidth;
      const focalX=leftOverlap+(sceneWidth-w)*focal+drift;
      // Keep the original crop unless the wider transition would reveal a canvas edge.
      const px=portal&&width>sceneWidth?Math.min(0,Math.max(width-w,focalX)):focalX;
      const py=(height-h)*.5+(motion?y*5:0);
      ctx.globalAlpha=alpha;ctx.drawImage(photo,px,py,w,h);ctx.globalAlpha=1;
    }
    function paint(time=performance.now()){
      if(document.hidden || hasOpenDialog() || !width || !height)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080808';ctx.fillRect(0,0,width,height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      x+=(targetX-x)*.035;y+=(targetY-y)*.035;
      let mix=previous&&animated()&&active()?Math.min(1,(time-changed)/1000):1;
      if(previous&&mix<1)draw(previous,1,time);else previous=null;
      draw(world,mix,time);
    }
    const api={active,animated,paint,
      setWorld(id){if(!worlds[id]||id===world)return;previous=world;world=id;if(visible)requestImage(world,canvas,imageBounds);changed=performance.now();resize();schedule();},
      setEffects(value){enabled=!!value;if(!enabled){x=y=targetX=targetY=0;previous=null;}paint();schedule();},
      refresh(){if(visible)requestImage(world,canvas,imageBounds);resize();}
    };
    instances.add(api);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){requestImage(world,canvas,imageBounds);resize();schedule();}},{threshold:.01});observer.observe(stage);
    new ResizeObserver(resize).observe(stage);
    hoverStage.addEventListener('pointermove',event=>{if(!enabled||reduced.matches)return;const r=hoverStage.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;schedule();},{passive:true});
    hoverStage.addEventListener('pointerleave',()=>{targetX=targetY=0;},{passive:true});
    addEventListener('ri:effects',event=>api.setEffects(event.detail));
    if(main)addEventListener('ri:world',event=>api.setWorld(event.detail));
    resize();return api;
  }
  const main=create(document.getElementById('world-canvas'),'black-white',true);
  if(main)window.RiScene=main;
  document.querySelectorAll('.portal-canvas').forEach(canvas=>create(canvas,canvas.dataset.previewWorld||'black-white'));
  document.addEventListener('DOMContentLoaded',()=>{domSettled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>instances.forEach(s=>s.refresh())));},{once:true});
  reduced.addEventListener('change',()=>{instances.forEach(s=>s.refresh());schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{instances.forEach(s=>s.refresh());schedule();}});
})();

;
/* source: experience.js */
/* Two author universes, independent journeys, with content scoped to the selected world. */
(() => {
  'use strict';
  const worlds={
    bw:{name:'Черный Белый',number:'01',hash:'#world-black-white',scene:'black-white',storyScene:'grey-forest',firstBook:'black-white',storyBook:'grey-forest',count:4,genre:'ПОСТАПОКАЛИПСИС',eyebrow:'ЗА СТЕНАМИ СФЕРЫ',title:'<span class="series-name-accessible">Черный Белый</span><img class="bw-series-wordmark" data-ri-deferred="assets/scenes/bw-title-v6.webp" data-ri-world="bw" alt="" aria-hidden="true">',description:'Нам говорили, что за стеной только смерть и голодные твари. Я верила. Но ради брата мне придётся шагнуть туда, куда я боялась даже смотреть.',storyEyebrow:'',storyTitle:'Я предпочитаю<br>черный цвет,<br><em>потому что считаю<br>его самым ярким</em>',storyDescription:''},
    shatserak:{name:'Шацерак',number:'02',hash:'#world-shatserak',scene:'shata',storyScene:'shata',firstBook:'shata',storyBook:'sherka',count:2,genre:'ТЁМНОЕ ФЭНТЕЗИ',eyebrow:'МИР «ШАТЫ» И «ШЕРКИ»',title:'Шацерак',description:'<span class="shatserak-legend-v39">Кто-то считает Бадзун-Гра могущественным колдуном. Кто-то убеждён, что он вероломный бог. Кто-то верит, что раньше он был человеком. Другие называют его отцом Мрака и злейшим существом на всём белом свете.</span><span class="shatserak-reveal-v39">А я его дочь,<br>и это вовсе не сказка.</span>',storyEyebrow:'',storyTitle:'Кто не спит<br>глубокой ночью,',storyDescription:'<span class="shat-verse-line-v115">и не в ужасе от мрака,</span> <span class="shat-verse-line-v115">тот навеки обречен…</span> <span class="shat-verse-line-v115">того утащит Шата.</span>'}
  };
  const el=id=>document.getElementById(id), gate=el('home'),experience=el('experience');
  const paths={bw:'black-white',shatserak:'shatserak'};
  const sections=['world-view','story','field-notes','night-lake','books','bonus','merch','bw-finale','author-qa','questions','contacts'];
  const shared=['books','bonus'];
  const worldDialog=el('world-switch-dialog'),switchButton=el('world-switch-open');
  let active=null,currentScene=null,ticking=false,enabled=true;
  try{localStorage.removeItem('riguva-effects');}catch{}

  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    const section=a.getAttribute('href').slice(1);
    if(sections.includes(section))a.dataset.worldSection=section;
  });
  function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
  function setScene(id){if(currentScene===id)return;currentScene=id;window.dispatchEvent(new CustomEvent('ri:world',{detail:id}));}
  function top(){window.scrollTo({top:0,left:0,behavior:'instant'});}
  function sectionHash(section){return section==='world-view'?worlds[active].hash:'#'+paths[active]+'/'+section;}
  function syncNavigation(hasMerch){
    const destination=active?(active==='bw'?'shatserak':'bw'):null;
    el('world-switch-name').textContent=destination?worlds[destination].name:'Два мира';
    switchButton.title=destination?'Перейти в мир '+worlds[destination].name:'Выбрать мир';
    switchButton.setAttribute('aria-label',switchButton.title);
    switchButton.setAttribute('aria-haspopup','dialog');
    switchButton.setAttribute('aria-controls','world-switch-dialog');
    switchButton.setAttribute('aria-expanded',worldDialog.open?'true':'false');
    document.querySelectorAll('.header .desktop-nav,#search-open,#cart-open,#menu-open').forEach(node=>node.hidden=!active);
    document.querySelectorAll('[data-world-merch]').forEach(node=>node.hidden=!hasMerch);
    document.querySelectorAll('.world-switch-option').forEach(option=>{
      if(option.dataset.enterWorld===active)option.setAttribute('aria-current','page');else option.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-world-section]').forEach(a=>a.href=active?sectionHash(a.dataset.worldSection):'#home');
    const skip=document.querySelector('.skip');skip.href=active?worlds[active].hash:'#home';skip.textContent=active?'К началу мира':'К выбору мира';
  }
  function selectWorld(id,{push=true,scroll=true}={}){
    const w=worlds[id];if(!w)return;
    closeDialogs();active=id;
    try{sessionStorage.setItem('riguva-active-world',id);}catch{}
    document.body.dataset.world=id;document.body.classList.add('world-selected');
    gate.hidden=true;experience.hidden=false;
    shared.forEach(id=>el(id).hidden=false);document.querySelector('.footer').hidden=false;
    el('author-qa').hidden=id!=='bw';
    el('questions').hidden=id!=='shatserak';
    el('world-genre').textContent='МИР '+w.number+' / '+w.genre;
    el('world-eyebrow').textContent=w.eyebrow;el('hero-title').innerHTML=w.title;el('world-description').innerHTML=w.description;
    el('story-number').textContent=w.number;el('story-label').textContent=w.name.toLocaleUpperCase('ru');
    el('story-eyebrow').textContent='';el('story-title').innerHTML=w.storyTitle;el('story-description').innerHTML=w.storyDescription;
    el('story-next').dataset.worldSection=id==='bw'?'author-qa':'books';
    document.querySelectorAll('.hero .enter-story,.world-hero-footer a').forEach(a=>a.dataset.worldSection=id==='bw'?'books':'story');
    document.querySelector('#books .journey-next[data-atmo-world="bw"] a').dataset.worldSection='bonus';
    const merchNext=document.querySelector('#merch .journey-next a');merchNext.dataset.worldSection='story';merchNext.innerHTML='Дальше <span>↓</span>';
    const qaNext=document.querySelector('#author-qa>.journey-next a');qaNext.dataset.worldSection='contacts';qaNext.innerHTML='История продолжается <span>↓</span>';
    const counts=window.RiCatalog.setWorld(id);
    const order=id==='shatserak'?['world-view','story','books','night-lake','bonus','bw-finale','author-qa','merch','questions']:['world-view','books','bonus','merch','story','author-qa','bw-finale','night-lake'];
    order.forEach(section=>experience.appendChild(el(section)));
    syncNavigation(!!counts.merch);
    currentScene=null;setScene(w.scene);window.RiScene?.refresh();
    if(push&&location.hash!==w.hash)history.pushState({world:id},'',w.hash);
    window.dispatchEvent(new CustomEvent('ri:atmosphere',{detail:id}));
    el('story').classList.add('is-visible');
    if(scroll){top();el('hero-title').setAttribute('tabindex','-1');el('hero-title').focus({preventScroll:true});}
    journey();
  }
  function home({push=true,scroll=true}={}){
    closeDialogs();active=null;
    try{sessionStorage.removeItem('riguva-active-world');}catch{}
    delete document.body.dataset.world;document.body.classList.remove('world-selected','shop-view','scrolled');
    experience.hidden=true;gate.hidden=false;
    shared.forEach(id=>el(id).hidden=true);el('merch').hidden=true;el('author-qa').hidden=true;el('questions').hidden=true;document.querySelector('.footer').hidden=false;
    window.RiCatalog.setWorld(null);syncNavigation(false);
    window.dispatchEvent(new CustomEvent('ri:atmosphere',{detail:null}));
    if(push&&location.hash!=='#home')history.pushState({world:null},'','#home');
    if(scroll){top();el('gate-title').setAttribute('tabindex','-1');el('gate-title').focus({preventScroll:true});}
    window.RiScene?.refresh();
  }
  function navigate(section,{push=true,scroll=true,animate=push}={}){
    if(section==='author')section='contacts';
    if(section==='field-notes'&&active==='bw')section='books';
    if(!active&&section==='contacts'){
      el('contacts').hidden=false;
      if(push&&location.hash!=='#contacts')history.pushState({world:null},'','#contacts');
      if(scroll)el('contacts').scrollIntoView({behavior:animate&&enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant',block:'start'});
      return section;
    }
    if(!active){home({push,scroll});return;}
    if(section==='worlds'||(section==='bw-finale'&&active==='bw'))section='books';
    if(!sections.includes(section)||el(section)?.hidden||
      (['field-notes','bw-finale','author-qa'].includes(section)&&active!=='bw')||(section==='night-lake'&&active!=='shatserak'))section='world-view';
    const hash=sectionHash(section);
    if(push&&location.hash!==hash)history.pushState({world:active},'',hash);
    if(scroll){
      const behavior=animate&&enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant';
      if(section==='world-view')window.scrollTo({top:0,left:0,behavior});
      else if(active==='shatserak'&&section==='bonus'&&el('bonus').querySelector('harstok-library')) {const stage=el('bonus');const header=document.querySelector('.header').getBoundingClientRect().height;window.scrollTo({top:Math.round(scrollY+stage.getBoundingClientRect().top-header),left:0,behavior});}else el(section).scrollIntoView({behavior,block:'start'});
    }
    journey();return section;
  }
  function route(initial=false){
    const hash=location.hash;
    if(/^#(?:popup|order):/.test(hash))return;
    if(hash==='#contacts'||hash==='#author'){
      if(!active)home({push:false,scroll:false});
      navigate('contacts',{push:false,animate:false});
      if(hash==='#author')history.replaceState({world:active},'','#contacts');
      if(initial)document.fonts.ready.then(()=>{if(location.hash==='#contacts')navigate('contacts',{push:false});});
      return;
    }
    const world=Object.keys(worlds).find(id=>worlds[id].hash===hash);
    const nested=/^#(black-white|shatserak)\/([a-z-]+)$/.exec(hash);
    let id=world,section='world-view';
    if(nested){id=Object.keys(paths).find(key=>paths[key]===nested[1]);section=nested[2];}
    else if(!world&&[...sections,'worlds'].includes(hash.slice(1))){
      section=hash.slice(1);id=history.state?.world;
      if(!worlds[id])try{id=sessionStorage.getItem('riguva-active-world');}catch{}
    }
    if(!worlds[id]){home({push:false,scroll:!initial});if(hash&&hash!=='#home')history.replaceState({world:null},'','#home');return;}
    if(active!==id)selectWorld(id,{push:false,scroll:false});
    section=navigate(section,{push:false,scroll:!(initial&&id==='shatserak'&&section==='bonus'&&el('bonus').querySelector('harstok-library'))});
    const canonical=sectionHash(section);
    if(location.hash!==canonical)history.replaceState({world:id},'',canonical);
    if(initial&&canonical!=='#shatserak/bonus')document.fonts.ready.then(()=>{if(location.hash===canonical)navigate(section,{push:false});});
  }
  document.querySelectorAll('[data-enter-world]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();selectWorld(a.dataset.enterWorld);}));
  document.querySelectorAll('[data-worlds-home],.header .wordmark,.footer .wordmark').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();home();}));
  document.addEventListener('click',event=>{
    if(event.defaultPrevented)return;
    const a=event.target.closest('a[data-world-section]');if(!a)return;
    event.preventDefault();closeDialogs();navigate(a.dataset.worldSection);
  });
  switchButton.addEventListener('click',()=>{
    showDialog(worldDialog);switchButton.setAttribute('aria-expanded','true');
  });
  worldDialog.addEventListener('close',()=>switchButton.setAttribute('aria-expanded','false'));
  window.RiWorlds={home,navigate,get active(){return active;}};
  const effects=el('effects-toggle');
  function applyEffects(){document.body.classList.toggle('still',!enabled);effects.setAttribute('aria-pressed',String(enabled));el('effects-state').textContent=enabled?'вкл':'выкл';window.dispatchEvent(new CustomEvent('ri:effects',{detail:enabled}));}
  effects.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('riguva-effects',enabled?'on':'off');}catch{}applyEffects();});applyEffects();
  addEventListener('popstate',()=>route());addEventListener('hashchange',()=>route());route(true);
  function journey(){
    ticking=false;document.body.classList.toggle('scrolled',scrollY>60);
    const shopping=!!active&&['books','bw-finale','merch'].some(id=>{const node=el(id),r=node.getBoundingClientRect();return !node.hidden&&r.top<innerHeight*.55&&r.bottom>innerHeight*.3;});
    document.body.classList.toggle('shop-view',shopping);
    if(active){const w=worlds[active];setScene(el('story').getBoundingClientRect().top<innerHeight*.55?w.storyScene:w.scene);}
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(journey);}},{passive:true});
  addEventListener('resize',journey,{passive:true});journey();
  if('IntersectionObserver' in window){document.body.classList.add('reveal-ready');const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');obs.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.narrative-panel,.section-heading').forEach(node=>obs.observe(node));}
})();

;
/* source: bonus-materials.js */
/* Author bonus materials. Memo text comes from the supplied DOCX. */
(() => {
  'use strict';
  const memoEntries = [{"id":"entry-001","name":"Агу́ст Во́нта","description":"приемный отец Аркина и Анцеля, преступник с большой армией.","kind":"character"},{"id":"entry-002","name":"А́лика","description":"сестра Митры.","kind":"character"},{"id":"entry-003","name":"А́лин О́гу","description":"один из разбойников, напавших на Гонника и Юнсу.","kind":"character"},{"id":"entry-004","name":"А́нцель","description":"король воров из Таццена.","kind":"character"},{"id":"entry-005","name":"Аперна́ут","description":"барон из Юшена.","kind":"character"},{"id":"entry-006","name":"А́ркин","description":"король воров из Таццена.","kind":"character"},{"id":"entry-007","name":"А́смо","description":"друг Митры, солдат из Йоса.","kind":"character"},{"id":"entry-008","name":"Баа́т","description":"государство.","kind":"place"},{"id":"entry-009","name":"Ба́дзун-Гра́","description":"темный бог, Отец кнарков.","kind":"character"},{"id":"entry-010","name":"Ба́кервитт","description":"лорд из Тарты, отец Голии.","kind":"character"},{"id":"entry-011","name":"Баки","description":"лорд из Эбиса.","kind":"character"},{"id":"entry-012","name":"Баро́ми Юта́ши","description":"советник Киана. Бывший вор и советник Руолана Тинга. Одарен невероятной памятью и мышлением.","kind":"character"},{"id":"entry-013","name":"Ба́ттэн","description":"самая большая гора в Баате.","kind":"place"},{"id":"entry-014","name":"Бети́сса","description":"ведьма династии Ройлок.","kind":"character"},{"id":"entry-015","name":"Бо́а","description":"озеро на границе Тарты и Юшена.","kind":"place"},{"id":"entry-016","name":"Бон Буало́н","description":"главнокомандующий Йоса.","kind":"character"},{"id":"entry-017","name":"Бо́увэй","description":"один из двух лордов Перелея.","kind":"character"},{"id":"entry-018","name":"Бри́мул","description":"офицер из Йоса.","kind":"character"},{"id":"entry-019","name":"Бро́йлин Гро́у","description":"один из главных в шайке, напавшей на Гонника и Юнсу.","kind":"character"},{"id":"entry-020","name":"Ве́нсон","description":"лорд из Тарты.","kind":"character"},{"id":"entry-021","name":"Ви́рон","description":"друг Аркина и Анцеля.","kind":"character"},{"id":"entry-022","name":"Гарида́йя","description":"остров за иноземлями.","kind":"place"},{"id":"entry-023","name":"Га́ссо","description":"кнарк","kind":"character"},{"id":"entry-024","name":"Гарута","description":"лорд из Эбиса.","kind":"character"},{"id":"entry-025","name":"Ге́рика","description":"крестьянская дочка, враг Митры в детстве.","kind":"character"},{"id":"entry-026","name":"Ге́рни","description":"слуга и друг Гонника.","kind":"character"},{"id":"entry-027","name":"Го́дар","description":"лорд из Тарты.","kind":"character"},{"id":"entry-028","name":"Голд","description":"лорд из Эбиса.","kind":"character"},{"id":"entry-029","name":"Го́лия","description":"подруга Юнсу и Митры в детстве. Дочь лорда Бакервитта.","kind":"character"},{"id":"entry-030","name":"Го́нник","description":"первая любовь Митры, прошлый король Баата.","kind":"character"},{"id":"entry-031","name":"Да́гган","description":"династия правящих королей.","kind":"term"},{"id":"entry-032","name":"Дарнага́р","description":"столица Баата.","kind":"place"},{"id":"entry-033","name":"Ди́гон","description":"кнарк.","kind":"character"},{"id":"entry-034","name":"До́ла","description":"солдат из Йоса, выигравшая поединок у Митры.","kind":"character"},{"id":"entry-035","name":"Йос","description":"военная деревня в Северном Юшене.","kind":"place"},{"id":"entry-036","name":"Карро́","description":"кнарк.","kind":"character"},{"id":"entry-037","name":"Ке́йлин-Го́рда","description":"южный край Баата.","kind":"place"},{"id":"entry-038","name":"Ке́йра","description":"сестра Гонника.","kind":"character"},{"id":"entry-039","name":"Ки́ан","description":"сын Гонника и Юнсу.","kind":"character"},{"id":"entry-040","name":"Ки́лтен","description":"знакомый Митры из детства, лорд Рош из Тарты.","kind":"character"},{"id":"entry-041","name":"Кле́о","description":"близкий друг Аркина и Анцеля. Иноземец из Гаридайи.","kind":"character"},{"id":"entry-042","name":"Ко́рил","description":"друг и вторая любовь Митры.","kind":"character"},{"id":"entry-043","name":"Корса́ки","description":"один из двух лордов Перелея.","kind":"character"},{"id":"entry-044","name":"Кросс","description":"лорд из Юшена.","kind":"character"},{"id":"entry-045","name":"Ла́та","description":"деревня, в которой обитают ведьмы.","kind":"place"},{"id":"entry-046","name":"Латиста́ва","description":"главный город Эбиса.","kind":"place"},{"id":"entry-047","name":"Лену́йя","description":"деревня, у которой напали на Гонника и Юнсу.","kind":"place"},{"id":"entry-048","name":"Летни́ца","description":"небольшой город в Тарте.","kind":"place"},{"id":"entry-049","name":"Лие́на","description":"солдат из Йоса.","kind":"character"},{"id":"entry-050","name":"Ли́ррия","description":"младшая сестра Аркина и Анцеля.","kind":"character"},{"id":"entry-051","name":"Луи́ Вену́","description":"контрабандист из Ленуйи","kind":"character"},{"id":"entry-052","name":"Мака́рта","description":"аналог современных шахмат","kind":"term"},{"id":"entry-053","name":"Маритт","description":"супруг Лиррии и близкий друг братьев","kind":"character"},{"id":"entry-054","name":"Маррт","description":"лорд из Кейлин-Горда. Женат на Рамаре Рош.","kind":"character"},{"id":"entry-055","name":"Мати́льяс","description":"кузнец из столицы, давший Митре список преступников.","kind":"character"},{"id":"entry-056","name":"Ми́лон","description":"отец Гонника.","kind":"character"},{"id":"entry-057","name":"Ми́тра","description":"главная героиня, Шата.","kind":"character"},{"id":"entry-058","name":"Мо́ро","description":"кнарк.","kind":"character"},{"id":"entry-059","name":"Мэриэ́тта","description":"Хозяйка Митры, жена лорда Тинга, мать Руолана и Юнсу.","kind":"character"},{"id":"entry-060","name":"О́ди","description":"друг Митры, солдат из Йоса.","kind":"character"},{"id":"entry-061","name":"О́рисс","description":"капитан музыкального отряда из Йоса.","kind":"character"},{"id":"entry-062","name":"Париса́на","description":"рыжая ведьма, владелица колдовской лавки в Лате.","kind":"character"},{"id":"entry-063","name":"Переле́й","description":"большая территория в Кейлин-Горда.","kind":"place"},{"id":"entry-064","name":"По́урн","description":"барон из Тарты.","kind":"character"},{"id":"entry-065","name":"Пэ́йс Ла́сстер","description":"лорд из Эбиса, один из самых богатых, муж Кейры.","kind":"character"},{"id":"entry-066","name":"Ра́йзер","description":"лорд из Юшена.","kind":"character"},{"id":"entry-067","name":"Райо́лла","description":"деревня рядом с Дарнагаром, тайное место Аркина и Анцеля.","kind":"place"},{"id":"entry-068","name":"Рама́ра","description":"знакомая из детства Митры, сестра Килтена.","kind":"character"},{"id":"entry-069","name":"Роддэ́","description":"старый лорд из Кейлин-Горда.","kind":"character"},{"id":"entry-070","name":"Ро́кша","description":"деревня в Юшене.","kind":"place"},{"id":"entry-071","name":"Ро́ми","description":"личный слуга Руолана Тинга.","kind":"character"},{"id":"entry-072","name":"Роран","description":"один из советников короля.","kind":"character"},{"id":"entry-073","name":"Ру́олан","description":"близкий друг Митры, король Баата.","kind":"character"},{"id":"entry-074","name":"Руп-А-Чуа́н","description":"монах, учитель Митры.","kind":"character"},{"id":"entry-075","name":"Рэ́йл","description":"друг Аркина и Анцеля. Один из приближенных.","kind":"character"},{"id":"entry-076","name":"Сана́би","description":"кнарк.","kind":"character"},{"id":"entry-077","name":"Свэ́нна","description":"дочь Карро.","kind":"character"},{"id":"entry-078","name":"Се́нши","description":"средняя сестра Аркина и Анцеля","kind":"character"},{"id":"entry-079","name":"Со́йло","description":"любимый конь Корила.","kind":"character"},{"id":"entry-080","name":"Ториа́н","description":"старший сын Руолана.","kind":"character"},{"id":"entry-081","name":"Та́рта","description":"востоный край Баата.","kind":"place"},{"id":"entry-082","name":"Та́ццен","description":"главный город Тарты, город Мудрости.","kind":"place"},{"id":"entry-083","name":"Тири́да","description":"служанка и близкий друг Митры.","kind":"character"},{"id":"entry-084","name":"Токин","description":"сын Лиррии.","kind":"character"},{"id":"entry-085","name":"Ха́рсток","description":"храм в Таццене, в котором собраны знания и культура.","kind":"place"},{"id":"entry-086","name":"Хо́тик","description":"лорд из Эбиса. Один из самых влиятельных лордов Баата.","kind":"character"},{"id":"entry-087","name":"Це́тель","description":"лекарь.","kind":"character"},{"id":"entry-088","name":"Ша́та","description":"кнарк, Митра.","kind":"character"},{"id":"entry-089","name":"Шатро́нд","description":"кнарк.","kind":"character"},{"id":"entry-090","name":"Шерка","description":"детская игра, похожая на прятки-догонялки","kind":"term"},{"id":"entry-091","name":"Э́бис","description":"западный край Баата.","kind":"place"},{"id":"entry-092","name":"Э́йра","description":"брат лорда Тинга.","kind":"character"},{"id":"entry-093","name":"Э́ниэл","description":"лорд из Эбиса.","kind":"character"},{"id":"entry-094","name":"Юле́йла","description":"дочь Аркина.","kind":"character"},{"id":"entry-095","name":"Ю́нис","description":"младший сын Руолана.","kind":"character"},{"id":"entry-096","name":"Юнсу́","description":"сестра Руолана, жена Гонника.","kind":"character"},{"id":"entry-097","name":"Ю́шен","description":"северный край Баата.","kind":"place"},{"id":"entry-098","name":"Я́нни-по́м-по́м","description":"слабоумный, близкий друг Митры.","kind":"character"},{"id":"entry-099","name":"Яснали́я","description":"женщина, живущая недалеко от Рокши с мужем Вейжем и двумя детьми.","kind":"character"}];
  const memoFile = 'assets/bonus/pamyatka-sherka.docx';
  const authorImage = 'assets/bonus/odi-author.jpg';
  const libraryBook = 'assets/shatserak-v96/archive-book-idle.webp';
  const section = document.getElementById('bonus');
  const dialog = document.getElementById('bonus-dialog');
  const content = document.getElementById('bonus-dialog-content');
  const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/\u0301/g,'').normalize('NFC').toLocaleLowerCase('ru').replace(/ё/g,'е');
  let selectedWorld=null, memoQuery='', memoKind='all', opener=null;

  function selectWorld(world) {
    selectedWorld=['bw','shatserak'].includes(world)?world:null;
    section.dataset.bonusWorld=selectedWorld||'';
    document.getElementById('bonus-title').textContent=selectedWorld==='shatserak'?'Библиотека героев':'Бонусные материалы';
    section.querySelectorAll('.bonus-panel').forEach(panel=>{panel.hidden=panel.id!=='bonus-panel-'+selectedWorld;});
  }
  window.addEventListener('ri:atmosphere',event=>selectWorld(event.detail));

  // Profiles enrich the same memo entries. Add future author cards here.
  const heroProfiles = {
    'entry-060': {name:'Оди', image:authorImage, content:()=>`<div class="bonus-author-sheet"><img class="bonus-author-poster" src="${authorImage}" alt="Оди. Авторская пергаментная карточка с портретом и описанием героя." width="533" height="800"><details class="bonus-author-text"><summary>Прочитать текст карточки</summary><div><p><strong>Имя:</strong> Оди. <strong>Происхождение:</strong> Запасный эбис.</p><p>Невысокий, немного сухопарый, белые кудрявые волосы, которые чаще всего носит в хвосте. Много улыбается.</p><p>Несмотря на телосложение, является одним из лучших бойцов Йоса. Капитан отряда, превосходный наездник и лучник. Пользуется большой популярностью среди девушек.</p><p>Оди не хотели принимать в Йос из-за происхождения (эбисты славились невыносимым характером и отсутствием гуманности). Сам себя Оди называл неправильным эбистом и утверждал, что должен был родиться в Северном Юшене. Позже капитан его первого отряда стал говорить так же.</p><h3>Что он делает, когда никто не видит</h3><p>Пишет письма пожилым родителям, которых был вынужден оставить в Эбисе.</p><blockquote>Ты достаточно усердно тренируешься, но суть в том, какой бы сильной ты ни была, всегда найдется тот, кто сильнее.</blockquote></div></details><div class="bonus-author-links"><a class="bonus-text-link" href="${authorImage}" download="Оди · карточка автора.jpg">Скачать карточку <span>↓</span></a><a class="bonus-text-link" href="https://t.me/riguva/4199" target="_blank" rel="noopener noreferrer">Публикация автора <span>↗</span></a></div></div>`}
  };

  function openLibrary(button) {
    opener=button;dialog.dataset.view='warning';renderWarning();
    showDialog(dialog);dialog.scrollTop=0;
  }
  function renderWarning() {
    content.innerHTML=`<div class="bonus-warning archive-warning-v67"><img class="archive-warning-art-v67" src="${libraryBook}" width="156" height="156" alt="" aria-hidden="true"><div class="archive-warning-copy-v67"><p class="bonus-eyebrow">БИБЛИОТЕКА ШАЦЕРАКА</p><h2 id="bonus-dialog-title" tabindex="-1">После «Шерки»</h2><p>В памятке и материалах о героях есть спойлеры к «Шате» и «Шерке». Открывайте библиотеку после прочтения обеих книг.</p><div class="archive-warning-actions-v67"><button class="bonus-button" data-memo-confirm>«Шерка» прочитана, войти</button><button class="bonus-secondary" data-close>Вернуться</button></div></div></div>`;
  }
  function renderMemo() {
    memoQuery='';memoKind='all';dialog.dataset.view='memo';
    const featured=Object.entries(heroProfiles).map(([id,profile])=>`<button class="library-featured" data-profile-open="${escape(id)}" aria-label="${escape(profile.name)}: портрет и от автора"><img src="${profile.image}" alt="" width="74" height="88"><span><small>От автора</small><strong>${escape(profile.name)}</strong></span><span aria-hidden="true">Открыть</span></button>`).join('');
    content.innerHTML=`<header class="bonus-dialog-header"><h2 id="bonus-dialog-title" tabindex="-1">Библиотека героев</h2><p>Персонажи, места и понятия Шацерака.</p><p class="archive-reader-note-v67" role="note">После «Шерки» · Есть спойлеры к обеим книгам</p><div class="archive-header-actions-v67"><a class="bonus-text-link" href="${memoFile}" download="Памятка по персонажам Шерки.docx">Скачать памятку DOCX <span>↓</span></a><div class="library-featured-list">${featured}</div></div></header><div class="memo-toolbar" id="library-toolbar"><label class="memo-search"><span class="memo-search-label">Поиск</span><input id="memo-search" type="search" placeholder="Имя, место или понятие" aria-label="Найти в библиотеке" autocomplete="off"></label><div class="memo-filters" role="group" aria-label="Раздел библиотеки"><button class="memo-filter" data-memo-kind="all" aria-pressed="true">Все</button><button class="memo-filter" data-memo-kind="character" aria-pressed="false">Персонажи</button><button class="memo-filter" data-memo-kind="place" aria-pressed="false">Места</button><button class="memo-filter" data-memo-kind="term" aria-pressed="false">Понятия</button></div><p class="memo-stats" id="memo-stats" aria-live="polite"></p></div><div class="memo-results" id="memo-results"></div>`;
    renderMemoList();dialog.scrollTop=0;document.getElementById('bonus-dialog-title').focus({preventScroll:true});
  }
  function renderMemoList() {
    const query=normalize(memoQuery).trim();
    const matches=memoEntries.filter(entry=>(memoKind==='all'||entry.kind===memoKind)&&normalize(entry.name+' '+entry.description).includes(query));
    const groups=new Map();
    for(const entry of matches){const letter=normalize(entry.name)[0].toLocaleUpperCase('ru');if(!groups.has(letter))groups.set(letter,[]);groups.get(letter).push(entry);}
    const results=document.getElementById('memo-results');
    document.getElementById('memo-stats').textContent=`Найдено: ${matches.length} из ${memoEntries.length}`;
    results.innerHTML=matches.length?[...groups].map(([letter,entries])=>`<section class="memo-letter-group" aria-label="Буква ${escape(letter)}"><h3>${escape(letter)}</h3><dl class="memo-list">${entries.map(entry=>{
      const profile=heroProfiles[entry.id];
      return `<div class="memo-row${profile?' memo-row--profile':''}" data-memo-entry="${escape(entry.id)}"><dt>${escape(entry.name)}${profile?'<small class="hero-available">От автора</small>':''}</dt><dd><p class="memo-description">${escape(entry.description)}</p>${profile?`<details class="hero-profile" id="hero-${escape(entry.id)}"><summary>${escape(profile.name)} · от автора <span aria-hidden="true">+</span></summary>${profile.content()}<button class="bonus-text-link hero-back" data-profile-close="${escape(entry.id)}">Свернуть карточку, к списку ↑</button></details>`:''}</dd></div>`;
    }).join('')}</dl></section>`).join(''):'<p class="memo-empty">Ничего не найдено. Попробуйте другое имя или сбросьте фильтр.</p>';
    content.querySelectorAll('[data-memo-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.memoKind===memoKind)));
  }
  function revealProfile(id) {
    if(!heroProfiles[id])return;
    memoQuery='';memoKind='all';document.getElementById('memo-search').value='';renderMemoList();
    const profile=document.getElementById('hero-'+id);
    profile.open=true;profile.querySelector('summary').focus({preventScroll:true});profile.scrollIntoView({block:'start',behavior:'instant'});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-bonus-open]');
    if(button){openLibrary(button);return;}
    if(event.target.closest('[data-memo-confirm]')){const request=new CustomEvent('ri:archive-open',{cancelable:true,detail:{proceed:renderMemo}});if(dialog.dispatchEvent(request))renderMemo();return;}
    const filter=event.target.closest('[data-memo-kind]');
    if(filter){memoKind=filter.dataset.memoKind;renderMemoList();return;}
    const profile=event.target.closest('[data-profile-open]');
    if(profile){revealProfile(profile.dataset.profileOpen);return;}
    const back=event.target.closest('[data-profile-close]');
    if(back){const profile=document.getElementById('hero-'+back.dataset.profileClose);profile.open=false;profile.querySelector('summary').focus({preventScroll:true});profile.scrollIntoView({block:'center',behavior:'instant'});}
  });
  content.addEventListener('input',event=>{if(event.target.id==='memo-search'){memoQuery=event.target.value;renderMemoList();}});
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  selectWorld(document.body.dataset.world||null);
})();

;
/* source: bonus-chapters-v21-data.js */
/* Full text supplied by the author. */
window.RiBonusChapters = [{"id":"chapter-1","title":"Бонусная глава","printFile":"assets/bonus/chapter-1-print.pdf","paragraphs":["За день до званого вечера в Нью-Йорке.","— На новом складе проломило крышу. — сказал Пирс по рации.","Мистер Блэк раздраженно вздохнул и потер переносицу. Будто и так проблем было мало. Помимо того, что он плохо спал в последнее время, у него вообще не было желания приходить домой. Блэк даже подумывал переоборудовать одно офисное крыло в свою новую квартиру. А дом… пусть он остается ей, если так нравится. Блэк бы уже давно отдал ей свой особняк, если б тот не принадлежал Ричарду когда-то.","— На новом складе может ничего не случаться хотя бы неделю? — равнодушно уточнил Райан.","— Не уверен.","— Хофман?","— Еще восстанавливается.","Главный по строительству, Хофман, месяц назад упал с балки строящегося дома и сломал обе ноги. Ему все равно не было равных, и он продолжал работать — катался на коляске по объекту, — но залезть на крышу склада точно не смог бы.","— Съездить? — предложил Пирс, несмотря на то, что взял себе один день, чтобы провести время с Кайлой и сыном.","Блэк подумал с секунду и сказал:","— Нет. Сам поеду.","— Машина будет через десять минут. Один поедешь?","— Да. Трой занимается охраной и вертолетами на завтра. — сказал Блэк вслух, а про себя подумал «гребанный званый вечер». Сейчас он был Райану как кость в горле.","— Ты во сколько полетишь? — спросил Пирс.","— В шесть.","— Принял.","— Кайле привет.","— Передам.","Райан поднялся, снял пиджак со спинки кресла, задержал взгляд на столе из красного дерева, отогнал ненужные воспоминания и вышел из кабинета.","Через несколько часов он уже разбирался с крышей, которая лишь чудом не убила большинство рабочих, находящихся внутри. Блэк даже сам залез наверх, чтобы посмотреть образовавшийся урон. Спустившись, отдал нужные приказы, подписал наряды на ремонт и решил, раз уж он здесь, просмотреть последние отчеты и забрать в архив документы.","Когда он вышел со склада, уже был вечер. Райан снял пиджак, закинул его в машину и только собирался сесть за руль, как увидел подъезжающую машину.","Он знал, чью.","Подавив гнев, Блэк захлопнул дверь и прислонился к капоту в ожидании, пока человек, вышедший из машины, подойдет.","— Мистер Блэк. — приветственно кивнул он.","— Уайт. — сухо ответил Райан.","— Я к вам.","— Я догадался, что не на склад.","— Хочу перевестись в Нью-Йорк. — без прелюдий сообщил Джейс. — Одобрите?","Ледяной взгляд Блэка пронзил охотника сотнями игл.","— Позволь узнать причину? — подняв бровь, выдавил он.","Джейс поджал губы, перевел взгляд и устало направился к кромке леса. Трава доходила ему чуть ли не до пояса, и Уайт бережно потер листочки пальцами.","Блэквуд стоял у него за спиной и пристально наблюдал. Если бы взгляд мог причинять боль, то Уайт уже бы корчился в смертельной агонии.","— Не вижу ни единой причины, чтобы остаться. — наконец ответил Джейс. — Моих родных нет, команды тоже. Цели создавать новую здесь, начинать с нуля, я тоже не вижу. Лучше попробую в другом городе.","— Не услышал в списке причин миссис Блэквуд. — высокомерно сказал Райан и вытащил свой Файв-Севен из кобуры. — Предполагаю, что вы едете вместе…","Джейс в недоумении нахмурился, развернулся и встретился с дулом пистолета, таким же ледяным, как взгляд его владельца.","Уайт отшатнулся и замер. Он точно знал, что все, в кого Блэк наводил свою дорогущую пушку, умирали. Все, кроме одной.","Можно считать, что Уайт уже мертв. Но все же перед смертью он хотел узнать смысл последних слов Блэка.","— Почему вы решили, что Лекса едет со мной?","Райан мог бы убить Джейса лишь за то, что тот произнес ее имя. Но вместо этого он, как бы очевидно, кивнул и качнул пистолетом.","— Дай-ка подумать… Вы давно влюблены друг в друга, она даже с парнем рассталась из-за тебя. Ты ходил к ней в гости чай попить. Водил ее на свидание в бар. Целовал ее на дне рождения, хотя тогда она уже жила в моем доме.","Блэк опасно прищурился и снял пистолет с предохранителя.","— А потом вы тайно развлекались на моей свадьбе, — Райан не сказал «трахались», иначе бы рефлекторно всадил пулю в башку Уайта.","У Джейса округлились глаза, что весьма позабавило мистера Блэка. «Этот выродок действительно думал, что я не узнаю» — подумал он, а вслух сказал:","— Всего-то надо было подождать, пока за ней перестанут все охотиться, да? Чтобы жить долго и счастливо. — протянул Блэк. — И когда мы поженились, она перестала нуждаться в круглосуточной защите. Согласен, это очень удобно. Теперь моя жена вольна свободно идти куда вздумается. И почему бы ей, в таком случае, не отправиться в Нью-Йорк со своим любовником?!","Джейс опешил. С трудом взяв себя в руки, он понял, как все это выглядело для мистера Блэка, и понимал, что никак не сможет оправдаться. Он уже труп.","— Одного не пойму. — вдруг озадачился Райан. — Ты один из немногих, кто знает меня достаточно хорошо. У нас есть общий кусок истории, где ты вдоволь смог изучить меня. Как, Уайт? — нахмурился Блэк, еще крепче сжав пистолет. — Как ты решился на то, чтобы провести меня? После всего, что ты видел, как, сука, ты вдруг осмелился подумать, что выживешь после этого?","Из Файв-Севена на Джейса смотрела тьма. И она была гораздо шире металического дула. Эта тьма была бесконечна.","— Все не так. — смог выдавить Уайт, и у него даже получилось сделать это спокойно и уверенно.","— Серьезно? Попытаешься оправдаться? — Блэк сделал шаг вперед и упер Файв-Севен прямо Уайту в лоб.","Джейсу потребовалась огромная сила, чтобы не отпрянуть от обжигающе ледяного металла.","Блэк был в ярости. Джейс уже видел такое пару раз. Лишь вопрос времени, когда его черепушку расколет надвое. Счет пошел на секунды. А потому не было причин врать.","— Я заберу ее. — спокойно сказал Джейс, а Блэк увидел искреннюю злость в его глазах. — Я заберу Лексу, увезу далеко от тебя, хоть на другое полушарие. И все сделаю, чтобы ты никогда нас не нашел. И я заберу ее независимо от того, носит она твою поганую фамилию или нет.","Холодное дуло еще плотнее вжалось в лоб Уайта.","— Если есть последние слова, то момент настал. — процедил Блэк сквозь зубы и немного надавил на спусковой крючок.","— Но она со мной не поедет. — просто продолжил Уайт, который теперь выглядел невыносимо уставшим. — Ни со мной, ни с Джеком. — между бровей Джейса пролегла глубокая морщина. — Даже будь Дэйтон жив, она бы и с ним не уехала от тебя.","Райан выпрямился и расслабил палец на крючке. Не совсем это он ожидал услышать. Точнее такого он уже не ожидал услышать никогда. Он был уверен в лживости, лицемерности и алчности этой… девчонки, изувечившей всю его черную душу.","— Она боготворит тебя. — с горечью усмехнулся Джейс. — Я даже уверен, что Лекса жизнь за тебя отдаст, а это та мера, по которой лично я определяю любовь.","Джейс снова болезненно усмехнулся.","— Видел бы ты, как она шарахнулась от меня на вашей свадьбе, когда поняла, что я не ты…","Уайт и не заметил, что дуло уже не упиралось в лоб. Между ним и пистолетом образовалось пять сантиметров свободного пространства.","Эмоции Блэка было невозможно прочесть. Он просто безразлично смотрел на Джейса, но тот прекрасно знал, что за этим безразличием может скрываться буря разных эмоций.","Райан подумал, наклонил голову и снова крепче сжал пистолет.","— Ну, давай! — тихо сказал Уайт и опустил глаза в землю. — Закончим с этим. Если честно, я даже немного этого хочу. Я устал. Теперь отдохну.","— Что ты сказал ей последнее? — неожиданно спросил мистер Блэк.","— Что? — не понял Уайт.","— На свадьбе. Что. Ты. Сказал. Ей. Самое последнее.","Джейс сдвинул брови, вспоминая.","— Я сказал, что, даже если она будет умирать, чтоб ко мне не приходила.","Он поднял взгляд и столкнулся с черными глазами, которые — Уайт это понял — сканировали его поведение на обман.","Для Райана прошла минута, для Джейса — целый час. И все это время ствол непрестанно целился в голову охотника.","Потом лицо Блэка вдруг разгладилось, и он произнес своим деловым тоном:","— Спасибо за службу!","Он произносил эту фразу только в одном случае.","Джейс закрыл глаза. Внезапно подумал, что перед выстрелом надо было опуститься на колени, дабы не падать с высота своего роста со всем возможным драматизмом. Он терпеть не мог это в фильмах. Да, надо было опуститься…","— Где твои документы о переводе?","Джейс распахнул глаза, когда Блэк — похоже, с улыбкой — спросил это.","Файв-Севен уютно покоился в своей кобуре.","— В машине. — недоверчиво ответил охотник.","— Давай, я подпишу. — Блэк действительно улыбнулся уголком рта и направился к своей машине за ручкой.","А Уайт вдруг заметил, что небо и деревья стали другого цвета. Более яркого.","Сделав глубокий выдох, Джейс на трясущихся ногах дошел до машины, достал документы, передал их Блэку, подождал и принял обратно с многочисленными подписями.","Райан протянул руку. Джейс с секунду смотрел на нее, а затем пожал.","— Удачи, Уайт! И как я уже сказал… — Блэк снова не смог сдержать ухмылку. — Спасибо за службу!","Джейс теперь тоже улыбнулся. Да, на месте Блэка он бы тоже не упустил возможности чуток поиздеваться над соперником.","Оба направились к своим машинам.","— А, вот еще, что, Уайт! — Блэквуд развернулся, когда Джейс уже открыл дверь своей машины.","— Прикоснешься к ней еще раз, я отрежу тебе обе руки.","Уайт засмеялся и кивнул.","— Меньшего я бы и не ожидал. — сказал он и стал серьезным. — Я заберу с собой Рича, если вы не против.","— Не против.","Райан дождался, пока машина Джейса скроется из виду. Потом открыл бардачок, порылся в бумагах и достал скомканный клочок бумаги.","Распрямил его, насколько смог, и прочитал. Еще раз. Только теперь буквы выглядели по-другому. Теперь Блэк верил написанному.","Глаза Райана быстро бегали по чернильным строчкам, пока не дошли до последнего абзаца:","«Закончилось тем, что Уайт сказал Лексе, чтоб не приходила к нему, если будет умирать. После этого она сразу вышла из зала и наткнулась на меня. Лекс попросила не рассказывать тебе об этом, но если б я знал, что ты видел их, то я бы настоял, чтобы она сама тебе все сказала и сразу. Но она, как и я, решили, что для всех будет безобиднее, если ты не узнаешь».","И подпись: «Джек».","Райан вернулся в Гродж уже ночью. Закинул документы в офис, отдал распоряжения на следующий день, пока он и его заместители будут на званом вечере в Нью-Йорке, и поехал домой.","Света нигде не было. Лекса уже неделю как перестала выходить из своей комнаты, поэтому и свет некому было включать.","Райан прошел на кухню, открыл холодильник, взял один из сэндвичей, которые Мелисса заготовила своей любимой «доченьке» аж на неделю вперед — завтра они с Лорасом возвращались во Фрилленгтон, — и, жуя на ходу, поднялся на второй этаж.","Дойдя до своей спальни, остановился и посмотрел на противоположную дверь.","Тихо подошел к ней, взялся за ручку и приоткрыл.","В комнате было темно и душно, а на кровати, подмяв под себя все одеяло, свернулся крошечный спящий клубок.","Райан бесшумно прошел к дальнему окну, приоткрыл его, чтоб клубку было чем дышать, и сел на край кровати.","Она крепко спала. Ее длинные черные волосы аккуратной кучкой лежали на подушке, а руки — сложены ладошка к ладошке — ютились рядом с лицом.","Мистер Блэк нежно провел рукой по щеке девушки. В душе он хотел, чтоб она проснулась, но не мог позволить себе намеренно разбудить ее. Лекса и так плохо спала с того момента, как он перестал приходить к ней ночью. Иногда он просыпался от ее криков, даже вставал, но останавливался возле ее закрытой двери. Райан был уверен, что Лекса вскоре уйдет от него, а значит, ей нужно было научиться обходиться без него. Переступая через себя, он уходил обратно, одевался, ехал в офис и до рассвета спал на диване.","Лекса поморщила носом и шмыгнула. Райан улыбнулся. Слишком милая, непозволительно красивая.","Он наклонился, втянул запах ее волос, чуть не мурлыкнул, как сытый кот, поцеловал ее в горячий висок и ушел к себе собираться к поездке в Нью-Йорк.","«Цвет тишины» Ри Гува"],"pageCount":8,"emphasis":[{"tag":"strong","start":0,"end":38,"paragraph":0},{"tag":"em","start":284,"end":286,"paragraph":2}]},{"id":"chapter-2","title":"Бонусная глава 2","printFile":"assets/bonus/chapter-2-print.pdf","paragraphs":["— Приветствую, Райан!","— Тео. — сухо ответил Блэк и пожал протянутую руку новоиспеченного короля Глондара. Тот небрежным жестом пригласил гостя присаживаться в кожаное кресло.","— Сколько лет, сколько зим.","Блэк на это ничего не ответил. Лишь обвел взглядом королевскую приемную. Здесь было очень мало света и куча дорогущей мебели из мира До. Стол для совещаний, в отличие от приемной в Гроджтауне, позволял сидеть лишь двум людям, будто каждый пришедший сюда был на личной аудиенции короля. И еще запах… Блэк незаметно скривил нос — запах стоял отвратительный. Райан бы описал его как смесь наркотиков, девушек легкого поведения, электричества и страха миллиона людей.","— Поздравляю тебя, — сказал Реввера. — С назначением на пост главнокомандующего.","— И тебя.","— Кажется мне, есть какой-то знак свыше в том, что мы практически одновременно стали главами наших общин… — Реввера опустился в свое кресло. — Ты так не считаешь?","— Нет.","Реввера усмехнулся и вопросительно указал на поднос с алкоголем. Блэк кивнул и сказал: «виски».","Неожиданно из темного угла вынырнул смотритель, поставил стаканы, налил напитки и беззвучно удалился обратно в тот же угол. Блэк проследил за ним взглядом, прищурился, чтобы разглядеть того во тьме, но тщетно. Слуга превратился в часть интерьера.","— Не могу вспомнить, когда мы виделись в последний раз. — задумчиво произнес Реввера.","Блэк повернулся к нему. Король смотрел куда-то вдаль и делал вид, что усердно копается в прошлом. Хочет напугать, понял Блэквуд, ведь ни капли не сомневался, что Тео помнил их последнюю встречу ничуть не хуже своего гостя.","— В последнюю нашу встречу я избил тебя до полусмерти. — равнодушно напомнил Блэквуд.","— Ах, верно, верно! — заулыбался Реввера. — Из-за какой-то дырки.","Блэк никак это не прокомментировал.","— Ты оставил меня умирать. — Тео назидательно покачал головой.","— Если правильно понимаю, ты не умер. — сказал Блэк, потянулся за виски и сделал обжигающий глоток.","— Не умер. — улыбнулся король. — Но чертовски долго восстанавливался. Да и не где-нибудь, а в клинике этого долбанного Стивенса! Гори он в аду, старый ублюдок!","Блэквуд сжал зубы.","— Слышал, и ты лечился у этой гниды?! Как он тебе? А ведь мы теперь имеем достаточно возможностей, чтобы поквитаться с доктором Стивенсом. — игриво намекнул Реввера. — Я слышал о том, что ты делаешь с людьми. Не хочешь отомстить старому уроду, возомнившему себя квалифицированным врачом? Это могло бы стать новым началом нашей чудесной дружбы, а, Райан?","— Воздержусь. — Райан попытался произнести это безразлично, но все же услышал сбой в собственном голосе. В любом случае, король этого не заметил. Он скучающе пожал плечами, н е м н о г о р а с с т р о и л с я , ч т о н е н а ш е л единомышленника для своей мести, но тут же снова сверкнул маленькими глазками в сторону Райана.","— Знаешь, а ведь я так и не отдал должок за нашу последнюю встречу.","Блэк не отреагировал.","— Ты сам приехал ко мне. Без охраны. Без о р у ж и я . В ы м а л и в а т ь н о в ы й д о г о в о р электроснабжения. — Реввера мерзко ухмыльнулся. — Ты приехал один.","Райан не изменился в лице и сделал новый глоток.","— Я мог бы… предположим, — размышлял Тео. — Всего-то щелкнуть пальцами, и мои смотрители утащат тебя в одну из моих коммун. В какую-нибудь самую мерзкую, знаешь?! — Тео округлил глаза. — Что уж там, некоторые из них и меня в ужас ввергают.","Реввера немного подожда л, но не дождавшись реакции, продолжил:","— Твоих людей, ожидающих у ворот, быстро прикончат. Джип отгонят к какому-нибудь карьеру. Будем считать, что на тебя и твой отряд кто-то напал, и случилось непоправимое. — Тео злорадно улыбнулся. — Тебя никогда здесь не найдут… И все, что ты будешь видеть день ото дня, это лишь гнилые стены самой вонючей коммуны моего Глондара. — Реввера сделал паузу. — Ты что, Райан Нонэйм, действительно думал, что я забыл о том, что ты сделал, и оставлю это без последствий?","Блэк ничего не говорил. И как бы Реввера не старался, он не мог отыскать ни единой эмоции на скульптурном лице.","А Блэк с доасадой представлял, как Генерал Кронг теперь будет гневаться: «Я же говорил! Тебе нельзя было ехать в Глондар! Реввера-младший ничуть не отличается от старшего, а тот никогда не забывал обидчиков.»","Райан незаметно кивнул сам себе, но ничуть не усомнился в своем решении приехать в эту клоаку лично. Он был главнокомандующим. Он отвечал за жизни людей и безопасность целого города. Он не имел права испытывать страх. А если бы Блэк сам не приехал в Глондар, как это делали все остальные главы общин, чтобы заключить договор с новым королем Глондара, то это бы непременно сочли за проявление трусости. Поэтому, сказал себе Райан, попробовать все равно стоило.","Сомневался ли Райан, что Реввера может упечь его в рабство? Ничуть. Более того, полминуты назад он понял, что уже не выйдет из Глондара. По крайней мере, на протяжении нескольких лет. И Кронг ничего не сможет с этим с д е л а т ь . То л ь к о л и ш ь н а й т и н о в о г о главнокомандующего для самого молодого города.","Но в том, что он когда-нибудь сумеет выбраться, Блэквуд не сомневался. И первым делом, он завершит с Реввера то, что нужно было завершить еще тогда, в грязной спальне наркопритона с проститутками. И как при этом обойтись без взрыва реактора, он тоже придумает. Времени будет достаточно.","Из темного угла послышался робкий голос:","— Могу ли я подойти к вам, Ваше Высочество?","Тео негодующе скривился, но разрешил. Смотритель еле слышно прошел по ковру, наклонился к уху короля и что-то прошептал. Блэк не разобрал что, но успел рассмотреть смотрителя. Это был высокий, худой парень со светло-русыми волосами. В очках и с электрическим ошейником - отличительным символом раба Глондара.","— И что? Зачем ты мне это говоришь? — разозлился Реввера, выслушав своего помощника. В е р оя т н о , тот с о о б щ и л ч то - то к р а й н е незначительное.","Реввера уже поднял руку, чтобы отослать тупого слугу, как его лицо озарилось азартом.","— А нет, постой, у меня возникла идея! Тащи их сюда!","Смотритель кивнул и бесшумно исчез.","— Ты знаешь, что такое Джуэл Роял Сет? — с неуместной радостью Тео обратился к Блэку.","— Нет.","— Шахматы. — еще больше обрадовался Реввера. — Самые дорогие шахматы. В мире До они стоили почти десять миллионов долларов, и отыскать их было, я тебе скажу, крайне непросто, но… вот они.","Как только Реввера это произнес, рядом вырос смотритель в очках. В руках, словно священную драгоценность, он держал искусный кожаный кейс.","Через минуту между Райаном и королем уже лежала доска в клетку, заполненная шахматными фигурами такой красоты, что даже Райан — не любитель шахмат — почувствовал их высокую ценность.","— Этот набор сделан в канувшей в небытие Великобритании. Все фигуры изготовлены из платины, бриллиантов и жемчуга. — уведомил Реввера, с нежностью поглаживая спиралевидного ферзя, украшенного драгоценными камнями. — Королевская фигура весит 165 грамм и украшена 73 рубинами и 146 бриллиантами. Ты можешь представить это, Райан Нонэйм? Можешь представить что-то более прекрасное?","Блэк наблюдал за ним, но ничего не комментировал. Несмотря на то, что он знал правила игры, шахматы его никогда не увлекали. Мысленно он уже готовился к скорому заточению и гадал, что его может там ожидать. Даже самые изящные ювелирные изделия мало волновали его в данный момент.","Пока смотритель аккуратно расставлял фигурки, Блэк поправил галстук, который как будто стал душить.","— Сыграем на твою жизнь? — без прелюдий предложил Реввера, хотя на предложение это было не похоже.","— Выиграешь ты, уйдешь отсюда на своих двоих и с новым договором. Выиграю я… — Реввера многозначительно улыбнулся. — Ну ты понял.","Блэк спокойно кивнул.","На всю приемную зазвенела рация, и Реввера, не извинившись и не вставая с кресла, ответил на звонок. Звонили из главного управления Глондара согласовать какие-то планы.","— Освежить ваш напиток? — робко спросил смотритель, и Блэк не сразу понял, что тот обращается к нему.","Райан хмуро посмотрел на почти полный стакан, затем перевел взгляд на смотрителя, у которого, по всей видимости, были проблемы с интеллектом.","Чудик выглядел неспокойным и смотрел на Блэка… с надеждой?! Райан наклонил голову. Меж бровей залегла складка, и это была его первая эмоция за весь вечер. Блэк попытался прикинуть, что все это значит, но понял лишь то, что смотритель очень надеется на то, что Блэквуд согласиться освежить напиток.","— Давай. — кивнул он.","Чудик робко кивнул, взял стакан, отошел и тут же вернулся. Причем, Райан проследил, что никакого виски там не прибавилось. Ничего не изменилось. Разве что…","Чудик быстро кивнул и удалился в свой темный угол, как крыса.","Райан посмотрел на Тео. Он давал какие-то распоряжения по рации и лишь мельком следил за гостем.","Блэк выждал пару секунд и как бы невзначай приподнял стакан, под которым, как он и понял, лежала записка.","Блэк незаметно скинул ее себе на колени, открыл и прочитал.","«Когда он подставит слона, не трогайте его. Пожертвуйте своей королевой»","Блэк тут же смял записку и засунул под манжет рубашки. Затем посмотрел в темный угол. Хотел увидеть лицо дебила, который предлагал пожертвовать ферзем — второй по значимости и самой сильной фигурой на доске. Но чудика было не разглядеть.","— Ну, что скажешь? Идет? — Реввера вернулся к Блэку.","Как будто был выбор.","— Идет.","— Славно. — оскалился король Глондара.","Райан ничуть не сомневался в своем поражении. Да, он умел играть, но прекрасно знал, что на всем полушарии Тео нет равных в шахматах. Никто в здравом уме не решился бы тягаться с Реввера на спор в этой игре. Блэк был обречен.","— Белые или черные? — уточнил Тео.","— Черные.","— Я так и думал. Значит, я хожу первый.","Сначала шли пешки. Ход за ходом. Фигурок на клетчатой доске становилось все меньше.","Реввера ходил быстро, практически машинально. Блэку же требовалось гораздо больше времени. Он старался предугадать и вымереть каждый свой шаг и каждый будущий шаг оппонента. И какое-то время все шло по его прогнозам, но потом Реввера стал выигрывать. Это было очевидно даже ребенку. Тео без сомнений жертвовал менее значимыми фигурами и держал короля с королевой в абсолютной недосягаемости.","Блэк проиграл. Это уже точно, хотя игра еще не закончилась. Реввера вынуждал его ходить именно так, как ему было нужно. Любой же иной ход наносил Блэку в два раза больше урона.","Это все. Райан уже чувствовал вонь сотни людей, которые, как он слышал, жили в коммунах Глондара скучившись. Уже видел эти сточные канавы, куда рабы справляли свою нужду. Ощущал вкус этого дерьма, которое здесь называли едой.","Реввера подставил слона и неожиданно тем самым дал Райану возможность срубить его и поставить шах белому королю. Блэк опешил и даже успел обрадоваться, когда потянулся к своему коню, но остановился.","Слишком легко. Слишком мнительный шанс на победу. Реввера не мог не заметить угрозу для своего короля. А значит, он сделал это специально. Блэк попытался прикинуть, на что тот рассчитывал, но не разгадал. На его взгляд все выглядело действительно случайно. Будто Реввера просто расслабился и забылся.","Райан осторожно убрал от коня руку и косо посмотрел на свою королеву. Сейчас ей ничего не угрожало. Вся обстановка на доске вообще не предполагала ее участия. Райан не понимал, зачем ему жертвовать ферзем. А вот если не убрать слона Тео, то он сможет уничтожить половину оставшихся фигур Райана. Кроме того, как только он срубит слона, то поставит шах противнику. Но интуиция подсказывала Блэку, что он что-то упускал. Но это была только интуиция. Фигурки и знания Райана твердили обратное: убрать слона, поставить шах.","Блэк мельком глянул в темный угол приемной. Смотрителя не разглядел.","С чего бы ему помогать Райану?! Он — человек Реввера. Причем приближенный, а значит, неплохо живет. Зачем бы ему помогать незнакомцу обыграть своего босса?! Нет, это ловушка. Реввера специально сказал чудику подложить эту записку. Он любил играться с людьми и расставлять ловушки. Это все лишь очередная, чтобы поиздеваться над Блэком напоследок.","Райан снова потянул руку к коню, чтобы избавиться от слона Тео. Уже сжал голову фигурки между указательным и большим пальцами…","И тут же переключился к королеве и сделал ход, подставив под прямой удар противника.","Сердце забилось чаще, но тут же вернулось к привычному ритму. Все. Райан последовал интуиции и доверился чудику, обратного пути нет. Он сделал ход.","Реввера удивился и… помрачнел. Сделал свой ход. Убил королеву.","И тут Райан понял, что ему открылось. Реввера не мог не убить королеву. — через ход она бы поставила ему шах и мат. Но тем самым он дал Блэку сразу две возможности пролезть к своему королю.","Райан выпрямился. И мог ошибаться, но будто услышал легкий шорох в темной углу.","Он сделал ход. Еще ход. Еще один…","Реввера отбивался и нападал.","Еще раз Блэк чуть не упустил угрозу своему королю, но вовремя сообразил. Он будто чувствовал, как шевелятся собственные извилины мозга, как все его тело помогает ему искать правильные стратегические ходы, и…","— Шах и мат. — спокойно сказал Блэк, тихо поставив драгоценную фигурку рядом с королем Тео.","Реввера застыл. В недоумении и гневе. В разочаровании и бессилии. И когда Блэк посмотрел ему в глаза, понял, что Реввера ненавидит его. Ненавидит и боится до смерти.","— Теперь вернемся к договору. — равнодушно сказал Райан, не обращая внимание на ледяные мурашки, все еще бегающие по позвоночнику от только что завершившейся игры. — Предлагаю сохранить прежние условия. Я с ними ознакомлен. Если у тебя есть коррективы, то слушаю.","Блэк откинулся в кресло, нормально затянул галстук, поправил пиджак и взял стакан с виски.","Реввера какое-то время молчал — его глаза наливались кровью. Но вскоре он смог совладать с собой и как ни в чем не бывало вернулся к деловым переговорам и даже перестал называть Райана старой фамилией.","Когда Блэк выехал из Глондара с новым договором, тут же связался с Генералом Кронгом и попросил разрешение ввести в Нью-Йорк небольшой северный отряд из Гроджтауна, чтобы охранять доктора Стивенса и его семью. Генерал отказал. Сказал, что в этом нет никакой необходимости, ведь охранять Стивенса будут люди самого Кронга.","Через три месяца Блэк нашел «случайный» повод выкупить у Реввера смотрителя в очках.","Чудика звали Стюарт."],"pageCount":12,"emphasis":[]}];

;
/* source: bonus-reader-v21.js */
/* The full chapters come from the author's supplied PDFs. No remote text fetch. */
(() => {
  'use strict';
  const chapters=window.RiBonusChapters||[];
  const byId=id=>document.getElementById(id);
  const dialog=byId('chapter-dialog'),body=byId('chapter-reader-body');
  if(!dialog||!body)return;
  const title=byId('chapter-reader-title'),print=byId('chapter-print-link');
  const next=byId('chapter-reader-next'),status=byId('chapter-reader-status');
  let opener=null,currentId=null;

  for(const chapter of chapters){
    document.querySelectorAll('[data-chapter-title="'+CSS.escape(chapter.id)+'"]').forEach(node=>{node.textContent=chapter.title;});
  }
  function render(chapter){
    title.textContent=chapter.title;
    print.href=chapter.printFile;
    print.download=chapter.title+' · для печати.pdf';
    print.setAttribute('aria-label',chapter.title+': скачать PDF для печати');
    body.replaceChildren();
    const fragment=document.createDocumentFragment();
    for(const [index,text] of chapter.paragraphs.entries()){
      const paragraph=document.createElement('p');
      const marks=(chapter.emphasis||[]).filter(mark=>mark.paragraph===index).sort((a,b)=>a.start-b.start);
      let offset=0;
      for(const mark of marks){
        if(!['strong','em'].includes(mark.tag)||mark.start<offset||mark.end>text.length)continue;
        paragraph.append(document.createTextNode(text.slice(offset,mark.start)));
        const emphasis=document.createElement(mark.tag);
        emphasis.textContent=text.slice(mark.start,mark.end);
        paragraph.append(emphasis);offset=mark.end;
      }
      paragraph.append(document.createTextNode(text.slice(offset)));
      if(/^[*•·\s]{3,}$/.test(text))paragraph.className='chapter-scene-break';
      fragment.append(paragraph);
    }
    body.append(fragment);
    const index=chapters.findIndex(item=>item.id===chapter.id);
    const following=chapters[index+1];
    next.hidden=!following;
    if(following)next.dataset.chapterNext=following.id;
    status.hidden=true;status.textContent='';
    currentId=chapter.id;
    dialog.dataset.chapter=currentId;
  }
  function open(id,source=null){
    if(document.body.dataset.world!=='bw')return false;
    const chapter=chapters.find(item=>item.id===id);
    if(!chapter||!Array.isArray(chapter.paragraphs)||!chapter.paragraphs.length)return false;
    const wasOpen=dialog.open;
    if(!wasOpen)opener=source||document.activeElement;
    render(chapter);
    if(!wasOpen){
      if(typeof window.showDialog==='function')window.showDialog(dialog);
      else{document.querySelectorAll('dialog[open]').forEach(node=>node.close());dialog.showModal();document.body.style.overflow='hidden';}
    }
    dialog.scrollTop=0;
    title.focus({preventScroll:true});
    return true;
  }
  document.addEventListener('click',event=>{
    const read=event.target.closest('[data-chapter-open]');
    if(read){event.preventDefault();open(read.dataset.chapterOpen,read);return;}
    const following=event.target.closest('[data-chapter-next]');
    if(following&&dialog.open){event.preventDefault();open(following.dataset.chapterNext);return;}
    if(event.target.closest('[data-chapter-close]')&&dialog.open){event.preventDefault();dialog.close();}
  });
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.body.style.overflow='';
    if(document.body.dataset.world==='bw'&&opener?.isConnected&&opener.getClientRects().length){opener.focus({preventScroll:true});}
  });
  window.RiBonusReader={open,get current(){return currentId;}};
})();

;
/* source: world-atmosphere.js */
/* Scroll keeps the world and its cast shadows in one continuous space. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ids=['world-view','story','bonus','night-lake','books','field-notes','merch','bw-finale','author-qa'];
  const panels=ids.map(id=>document.getElementById(id)).filter(Boolean);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let frame=0;
  function paint(){
    frame=0;
    const enabled=!document.body.classList.contains('still')&&!reduced.matches;
    const shatserak=document.body.dataset.world==='shatserak';
    document.body.style.setProperty('--atmo-flow',enabled?(scrollY*.015).toFixed(2)+'px':'0px');
    document.body.style.setProperty('--shadow-travel-v19',enabled&&shatserak?(scrollY*.007%24).toFixed(2)+'px':'0px');
    panels.forEach(panel=>{
      if(panel.hidden||!panel.getClientRects().length)return;
      const r=panel.getBoundingClientRect();
      const progress=clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
      const entered=clamp((innerHeight-r.top)/(innerHeight*.8),0,1);
      panel.style.setProperty('--section-reveal',enabled?entered.toFixed(3):'1');
      panel.style.setProperty('--veil-progress',enabled?progress.toFixed(3):'.5');
      if(panel.id==='story'){
        panel.style.setProperty('--poem-drift',enabled&&shatserak?((progress-.5)*32).toFixed(2)+'px':'0px');
        panel.style.setProperty('--poem-mist',enabled?(.32+progress*.65).toFixed(3):'.7');
      }
      if(panel.id==='night-lake')panel.style.setProperty('--memory-drift',enabled&&shatserak?((progress-.5)*24).toFixed(2)+'px':'0px');
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle('atmo-near',entry.isIntersecting);
      if(entry.isIntersecting)entry.target.classList.add('atmo-shown');
    }),{rootMargin:'22% 0px',threshold:0});
    panels.forEach(panel=>observer.observe(panel));
  }
  window.addEventListener('ri:atmosphere',schedule);
  window.addEventListener('ri:effects',schedule);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',schedule);
  schedule();
})();

;
/* source: parking-v17.js */
/* V17. A physical switch lights the parking and reveals its bonus chapters. */
(() => {
  'use strict';
  const lamp=document.getElementById('bw-bonus-lamp');
  const control=document.getElementById('bw-light-switch');
  const chapters=document.getElementById('bw-bonus-chapters');
  const label=document.getElementById('bw-switch-copy');
  const section=lamp&&lamp.closest('#bonus');
  if(!lamp||!control||!chapters)return;
  let lit=false;

  function setLit(value){
    const next=!!value;
    const changed=lit!==next;
    if(!next&&chapters.contains(document.activeElement))control.focus({preventScroll:true});
    lit=next;
    lamp.dataset.lit=String(lit);
    if(section)section.dataset.bwLit=String(lit);
    chapters.hidden=!lit;
    chapters.inert=!lit;
    chapters.setAttribute('aria-hidden',String(!lit));
    control.setAttribute('aria-expanded',String(lit));
    control.setAttribute('aria-pressed',String(lit));
    control.setAttribute('aria-label',lit
      ?'Выключить строительный фонарь и скрыть бонусные главы'
      :'Включить строительный фонарь и открыть бонусные главы');
    if(label)label.textContent=lit?'Выключи свет':'Включи свет';
    if(changed)window.dispatchEvent(new CustomEvent('ri:bonus-light',{detail:{lit}}));
  }

  // A real button supplies native mouse, touch, Enter and Space activation.
  // Reader choice stays local to this document when its world is changed.
  control.addEventListener('click',()=>setLit(!lit));
  setLit(false);
})();

;
/* source: questions-data-v16.js */
/* Titles are editorial paraphrases; question retains the source text. No video answers reproduced. */
window.RiQAData = {
  "sources": [
    {
      "id": 201,
      "title": "Ваза 1",
      "url": "https://t.me/riguva/201",
      "publishedAt": "2023-11-19T17:21:30+00:00"
    },
    {
      "id": 798,
      "title": "Ваза 2",
      "url": "https://t.me/riguva/798",
      "publishedAt": "2024-05-18T14:45:17+00:00"
    },
    {
      "id": 1054,
      "title": "Ваза 3",
      "url": "https://t.me/riguva/1054",
      "publishedAt": "2024-09-28T09:08:04+00:00"
    }
  ],
  "categories": [
    {
      "id": "world",
      "label": "Мир после Катастрофы"
    },
    {
      "id": "characters",
      "label": "Герои и их прошлое"
    },
    {
      "id": "relationships",
      "label": "Чувства и отношения"
    },
    {
      "id": "plot",
      "label": "Сюжет и финал"
    },
    {
      "id": "writing",
      "label": "Как создавались книги"
    },
    {
      "id": "books",
      "label": "Книги и издания"
    },
    {
      "id": "author",
      "label": "Об авторе"
    }
  ],
  "questions": [
    {
      "id": "q201-001",
      "category": "author",
      "title": "Что такое «Ваза с вопросами»?",
      "question": "Что такое ваза с вопросами?",
      "url": "https://t.me/riguva/199",
      "source": 201,
      "sourceQuestionId": "q-201-1-1-s1",
      "publishedAt": "2023-11-19T17:16:11+00:00",
      "answerType": "video",
      "duration": "2:37"
    },
    {
      "id": "q201-002",
      "category": "books",
      "title": "Когда будет следующая книга?",
      "question": "Когда будет следующая книга?",
      "url": "https://t.me/riguva/199",
      "source": 201,
      "sourceQuestionId": "q-201-1-1-s2",
      "publishedAt": "2023-11-19T17:16:11+00:00",
      "answerType": "video",
      "duration": "2:37"
    },
    {
      "id": "q201-003",
      "category": "books",
      "title": "Будет ли продолжение «Черного Белого»?",
      "question": "Будет ли продолжение ЧБ?",
      "url": "https://t.me/riguva/200",
      "source": 201,
      "sourceQuestionId": "q-201-2-1",
      "publishedAt": "2023-11-19T17:16:56+00:00",
      "answerType": "video",
      "duration": "1:24"
    },
    {
      "id": "q201-004",
      "category": "characters",
      "title": "Что случилось с отцом Райана?",
      "question": "Что случилось с отцом Райана?",
      "url": "https://t.me/riguva/222",
      "source": 201,
      "sourceQuestionId": "q-201-3-1",
      "publishedAt": "2023-11-23T15:40:51+00:00",
      "answerType": "video",
      "duration": "2:20"
    },
    {
      "id": "q201-005",
      "category": "writing",
      "title": "Как долго Ри писала серию?",
      "question": "Как долго я писала серию? И смогу ли так ещё?",
      "url": "https://t.me/riguva/235",
      "source": 201,
      "sourceQuestionId": "q-201-4-1",
      "publishedAt": "2023-11-27T11:12:30+00:00",
      "answerType": "video",
      "duration": "2:07"
    },
    {
      "id": "q201-006",
      "category": "world",
      "title": "Откуда у Блэка столько машин?",
      "question": "Откуда у Блэка столько машин? И откуда появляются новые?",
      "url": "https://t.me/riguva/268",
      "source": 201,
      "sourceQuestionId": "q-201-5-1",
      "publishedAt": "2023-12-05T13:56:22+00:00",
      "answerType": "video",
      "duration": "2:27"
    },
    {
      "id": "q201-007",
      "category": "writing",
      "title": "Жалко ли автору героев и можно ли с ними договориться?",
      "question": "Не жалко ли мне героев? И удалось ли мне договориться с кем-то из персонажей?",
      "url": "https://t.me/riguva/273",
      "source": 201,
      "sourceQuestionId": "q-201-6-1",
      "publishedAt": "2023-12-06T07:13:23+00:00",
      "answerType": "video",
      "duration": "2:53"
    },
    {
      "id": "q201-008",
      "category": "writing",
      "title": "Был ли у Джека реальный прототип?",
      "question": "Джек — это реальный человек? Были ли у него прототипы?",
      "url": "https://t.me/riguva/309",
      "source": 201,
      "sourceQuestionId": "q-201-7-1",
      "publishedAt": "2023-12-10T16:02:09+00:00",
      "answerType": "video",
      "duration": "2:24"
    },
    {
      "id": "q201-009",
      "category": "writing",
      "title": "Кто первым прочитал книги?",
      "question": "Кто стал первым читателем? И какая была реакция?",
      "url": "https://t.me/riguva/322",
      "source": 201,
      "sourceQuestionId": "q-201-8-1",
      "publishedAt": "2023-12-13T19:40:10+00:00",
      "answerType": "video",
      "duration": "2:09"
    },
    {
      "id": "q201-010",
      "category": "world",
      "title": "Почему действие происходит в Америке?",
      "question": "Почему действие происходит в Америке?",
      "url": "https://t.me/riguva/339",
      "source": 201,
      "sourceQuestionId": "q-201-9-1",
      "publishedAt": "2023-12-17T17:06:15+00:00",
      "answerType": "video",
      "duration": "2:44"
    },
    {
      "id": "q201-011",
      "category": "relationships",
      "title": "Почему Райан не выслушал Лексу после свадьбы?",
      "question": "Почему Райан не дал Лексе объясниться после свадьбы? Ведь он говорил \"я все вижу, я все замечаю\", а тут поступил как мудак.",
      "url": "https://t.me/riguva/348",
      "source": 201,
      "sourceQuestionId": "q-201-10-1",
      "publishedAt": "2023-12-20T09:08:43+00:00",
      "answerType": "video",
      "duration": "11:16"
    },
    {
      "id": "q201-012",
      "category": "world",
      "title": "Откуда в мире ЧБ ананасы и как устроены общины?",
      "question": "Откуда там ананасы? И немножко про общины в целом.",
      "url": "https://t.me/riguva/387",
      "source": 201,
      "sourceQuestionId": "q-201-11-1",
      "publishedAt": "2023-12-24T15:02:14+00:00",
      "answerType": "video",
      "duration": "3:48"
    },
    {
      "id": "q201-013",
      "category": "relationships",
      "title": "Мог ли Блэк так долго воздерживаться?",
      "question": "Вы считаете, Блэк мог столько времени воздерживаться от секса?",
      "url": "https://t.me/riguva/399",
      "source": 201,
      "sourceQuestionId": "q-201-12-1-s1",
      "publishedAt": "2023-12-28T05:46:13+00:00",
      "answerType": "video",
      "duration": "3:57"
    },
    {
      "id": "q201-014",
      "category": "books",
      "title": "Будет ли история Пирса и Кайлы?",
      "question": "Будет ли история Пирса и Кайлы?",
      "url": "https://t.me/riguva/399",
      "source": 201,
      "sourceQuestionId": "q-201-12-1-s2",
      "publishedAt": "2023-12-28T05:46:13+00:00",
      "answerType": "video",
      "duration": "3:57"
    },
    {
      "id": "q201-015",
      "category": "relationships",
      "title": "Что Джейс сказал Райану об инциденте на свадьбе?",
      "question": "Что такого сказал Джейс про инцидент на свадьбе, что Райан все простил?",
      "url": "https://t.me/riguva/410",
      "source": 201,
      "sourceQuestionId": "q-201-13-1",
      "publishedAt": "2023-12-31T15:00:05+00:00",
      "answerType": "linked-text",
      "duration": null
    },
    {
      "id": "q201-016",
      "category": "plot",
      "title": "Какой была первоначальная концовка с гибелью Райана?",
      "question": "Как бы все закончилось, если бы Райан умер от взрыва? \n(Первоначальная концовка)",
      "url": "https://t.me/riguva/419",
      "source": 201,
      "sourceQuestionId": "q-201-14-1",
      "publishedAt": "2024-01-03T16:47:32+00:00",
      "answerType": "video",
      "duration": "8:10"
    },
    {
      "id": "q201-017",
      "category": "characters",
      "title": "Почему Лексе нравится Рианна?",
      "question": "Лексе нравилась Рианна, потому что она нравится мне? Почему именно Рианна?",
      "url": "https://t.me/riguva/432",
      "source": 201,
      "sourceQuestionId": "q-201-15-1",
      "publishedAt": "2024-01-13T11:44:07+00:00",
      "answerType": "video",
      "duration": "3:10"
    },
    {
      "id": "q201-018",
      "category": "writing",
      "title": "Ри писала ради денег или удовольствия?",
      "question": "Когда писала книги, думала о деньгах? Писала, чтобы заработать или ради удовольствия?",
      "url": "https://t.me/riguva/441",
      "source": 201,
      "sourceQuestionId": "q-201-16-1",
      "publishedAt": "2024-01-14T14:26:10+00:00",
      "answerType": "video",
      "duration": "3:51"
    },
    {
      "id": "q201-019",
      "category": "author",
      "title": "Какие книги любит Ри?",
      "question": "Ваши любимые книги?",
      "url": "https://t.me/riguva/444",
      "source": 201,
      "sourceQuestionId": "q-201-17-1",
      "publishedAt": "2024-01-15T14:20:02+00:00",
      "answerType": "video",
      "duration": "5:55"
    },
    {
      "id": "q201-020",
      "category": "relationships",
      "title": "Любил ли Блэк Клэр?",
      "question": "Блэк любил Клэр?",
      "url": "https://t.me/riguva/448",
      "source": 201,
      "sourceQuestionId": "q-201-18-1-s1",
      "publishedAt": "2024-01-17T15:20:42+00:00",
      "answerType": "video",
      "duration": "4:50"
    },
    {
      "id": "q201-021",
      "category": "writing",
      "title": "Планировала ли Ри убить Лексу?",
      "question": "Была ли мысль убить Лексу?",
      "url": "https://t.me/riguva/448",
      "source": 201,
      "sourceQuestionId": "q-201-18-1-s2",
      "publishedAt": "2024-01-17T15:20:42+00:00",
      "answerType": "video",
      "duration": "4:50"
    },
    {
      "id": "q201-022",
      "category": "plot",
      "title": "Что было в видеопослании Ричарда?",
      "question": "Что Ричард записал в видео-послании?",
      "url": "https://t.me/riguva/461",
      "source": 201,
      "sourceQuestionId": "q-201-19-1",
      "publishedAt": "2024-01-21T20:41:58+00:00",
      "answerType": "video",
      "duration": "10:00"
    },
    {
      "id": "q201-023",
      "category": "plot",
      "title": "Судьба Джека была задумана с самого начала?",
      "question": "У Джека сразу была такая судьба?",
      "url": "https://t.me/riguva/470",
      "source": 201,
      "sourceQuestionId": "q-201-20-1",
      "publishedAt": "2024-01-24T14:18:19+00:00",
      "answerType": "video",
      "duration": "5:31"
    },
    {
      "id": "q201-024",
      "category": "relationships",
      "title": "Почему Блэк приехал в «Аляску» с Бьянкой после болезни Лексы?",
      "question": "Почему после убийства Гаварданера и болезни Лексы, Блэк не прислал за ней машину, а появился в \"Аляске\" с Бьянкой?",
      "url": "https://t.me/riguva/483",
      "source": 201,
      "sourceQuestionId": "q-201-21-1",
      "publishedAt": "2024-01-28T14:16:56+00:00",
      "answerType": "video",
      "duration": "3:23"
    },
    {
      "id": "q201-025",
      "category": "writing",
      "title": "Что сложнее всего в написании книг?",
      "question": "Что самое сложное в написании книг?",
      "url": "https://t.me/riguva/507",
      "source": 201,
      "sourceQuestionId": "q-201-22-1",
      "publishedAt": "2024-01-31T16:11:39+00:00",
      "answerType": "video",
      "duration": "6:14"
    },
    {
      "id": "q201-026",
      "category": "books",
      "title": "Будет ли история от лица Райана?",
      "question": "Будет ли история от лица Райана?",
      "url": "https://t.me/riguva/519",
      "source": 201,
      "sourceQuestionId": "q-201-23-1",
      "publishedAt": "2024-02-04T11:24:24+00:00",
      "answerType": "video",
      "duration": "5:00"
    },
    {
      "id": "q201-027",
      "category": "writing",
      "title": "Как появилась тетрадь-шпаргалка и училась ли Ри писательству?",
      "question": "Вопрос по тетради-шпаргалке. Как ты это придумала? Какие-то курсы писательства были?",
      "url": "https://t.me/riguva/533",
      "source": 201,
      "sourceQuestionId": "q-201-24-1",
      "publishedAt": "2024-02-07T17:24:58+00:00",
      "answerType": "video",
      "duration": "13:13"
    },
    {
      "id": "q201-028",
      "category": "books",
      "title": "Сколько книг планировалось в продолжении?",
      "question": "Сколько книг планируется в продолжении?",
      "url": "https://t.me/riguva/542",
      "source": 201,
      "sourceQuestionId": "q-201-25-1-s1",
      "publishedAt": "2024-02-11T15:20:46+00:00",
      "answerType": "video",
      "duration": "12:39"
    },
    {
      "id": "q201-029",
      "category": "plot",
      "title": "Почему Лекса не уберегла Джека от укусов у пещеры?",
      "question": "Объясните тупость Лексы, когда Джека укусили у пещеры два раза?",
      "url": "https://t.me/riguva/542",
      "source": 201,
      "sourceQuestionId": "q-201-25-1-s2",
      "publishedAt": "2024-02-11T15:20:46+00:00",
      "answerType": "video",
      "duration": "12:39"
    },
    {
      "id": "q201-030",
      "category": "plot",
      "title": "О чём Блэк и Генерал говорили по рации после захвата Глондара?",
      "question": "О чем по рации говорили Блэк с Генералом, выйдя из переговорной после захвата Глондара?",
      "url": "https://t.me/riguva/549",
      "source": 201,
      "sourceQuestionId": "q-201-26-1",
      "publishedAt": "2024-02-13T17:45:10+00:00",
      "answerType": "video",
      "duration": "3:54"
    },
    {
      "id": "q201-031",
      "category": "plot",
      "title": "Подсказки после «Цвета тишины» и эпилог: спойлеры или новая история?",
      "question": "В своем тг-канале ты даешь много подсказок, рассказываешь о том, что происходит после ЦТ. Это подогрев интереса к книге, которая скоро выйдет? Или это спойлер? И является ли эпилог спойлером?",
      "url": "https://t.me/riguva/581",
      "source": 201,
      "sourceQuestionId": "q-201-27-1",
      "publishedAt": "2024-02-17T16:24:57+00:00",
      "answerType": "video",
      "duration": "7:43"
    },
    {
      "id": "q201-032",
      "category": "writing",
      "title": "Как Ри изучала Five-seveN, оружие и кевлар для ЧБ?",
      "question": "Расскажите, откуда вы узнали про оружие для ЧБ? Про Файв-Севен и про кевлар?",
      "url": "https://t.me/riguva/590",
      "source": 201,
      "sourceQuestionId": "q-201-28-1",
      "publishedAt": "2024-02-20T15:40:12+00:00",
      "answerType": "video",
      "duration": "5:47"
    },
    {
      "id": "q201-033",
      "category": "plot",
      "title": "Почему Президент поверил в смерть Блэка?",
      "question": "Почему Президент поверил в смерть Блэка? Ведь убийца должен был сгореть вместе с ним. Тел должно было быть два.",
      "url": "https://t.me/riguva/607",
      "source": 201,
      "sourceQuestionId": "q-201-29-1",
      "publishedAt": "2024-02-24T12:51:38+00:00",
      "answerType": "video",
      "duration": "4:24"
    },
    {
      "id": "q201-034",
      "category": "plot",
      "title": "Как погибли Пирс и Трой?",
      "question": "Как погибли Пирс и Трой?",
      "url": "https://t.me/riguva/607",
      "source": 201,
      "sourceQuestionId": "q-201-29-2",
      "publishedAt": "2024-02-24T12:51:38+00:00",
      "answerType": "video",
      "duration": "4:24"
    },
    {
      "id": "q201-035",
      "category": "characters",
      "title": "Кто родители Бьянки и как она подружилась с Наитой?",
      "question": "Кто родители Бьянки? Она же явно не из простых? Как она оказалась подругой Наиты?",
      "url": "https://t.me/riguva/616",
      "source": 201,
      "sourceQuestionId": "q-201-30-1",
      "publishedAt": "2024-02-27T15:41:38+00:00",
      "answerType": "video",
      "duration": "5:10"
    },
    {
      "id": "q201-036",
      "category": "writing",
      "title": "Как Ри относится к фанфикам и историям по мотивам ЧБ?",
      "question": "Интересно узнать, как вы относитесь к тому, что люди могут вдохновляться вашей историей и писать аналоги или даже фанфики?",
      "url": "https://t.me/riguva/636",
      "source": 201,
      "sourceQuestionId": "q-201-31-1",
      "publishedAt": "2024-03-03T13:19:02+00:00",
      "answerType": "video",
      "duration": "11:06"
    },
    {
      "id": "q201-037",
      "category": "writing",
      "title": "Что Ри думает о сходстве ЧБ с «Пеплом» Мери Ли?",
      "question": "Как вы относитесь к тому, что книги Мери Ли \"Пепел\" очень похожи на ваши? Вы знакомы с автором? Кто кого вдохновил первый?",
      "url": "https://t.me/riguva/642",
      "source": 201,
      "sourceQuestionId": "q-201-32-1",
      "publishedAt": "2024-03-05T14:13:47+00:00",
      "answerType": "video",
      "duration": "10:02"
    },
    {
      "id": "q201-038",
      "category": "characters",
      "title": "Какое прошлое связывает Блэка и Джейса?",
      "question": "Что за кусок общей истории у Блэка и Джейса?",
      "url": "https://t.me/riguva/650",
      "source": 201,
      "sourceQuestionId": "q-201-33-1",
      "publishedAt": "2024-03-09T15:34:20+00:00",
      "answerType": "video",
      "duration": "8:41"
    },
    {
      "id": "q201-039",
      "category": "characters",
      "title": "Как нормальный человек оказался среди людоедов?",
      "question": "Как среди людоедов оказался нормальный человек? Почему они его не съели?",
      "url": "https://t.me/riguva/655",
      "source": 201,
      "sourceQuestionId": "q-201-34-1",
      "publishedAt": "2024-03-12T17:08:58+00:00",
      "answerType": "video",
      "duration": "8:22"
    },
    {
      "id": "q201-040",
      "category": "relationships",
      "title": "Почему Блэк снова спас Лексу после свадьбы?",
      "question": "Что было с Блэком после того, как Лексу увезли в Сферу после свадьбы? Что побудило в очередной раз ее спасти? И как он скоординировал генерала Кронга?",
      "url": "https://t.me/riguva/655",
      "source": 201,
      "sourceQuestionId": "q-201-34-2",
      "publishedAt": "2024-03-12T17:08:58+00:00",
      "answerType": "video",
      "duration": "8:22"
    },
    {
      "id": "q201-041",
      "category": "relationships",
      "title": "Зачем Блэк предложил Лексе ананас?",
      "question": "Зачем Блэк предложил мисс Ройс ананас? Ведь в тот момент он к ней ничего не испытывал.",
      "url": "https://t.me/riguva/660",
      "source": 201,
      "sourceQuestionId": "q-201-35-1",
      "publishedAt": "2024-03-16T14:10:41+00:00",
      "answerType": "video",
      "duration": "2:36"
    },
    {
      "id": "q201-042",
      "category": "world",
      "title": "Куда исчезли домашние и фермерские животные?",
      "question": "Где домашние животные? Кошки, собаки? И фермерские: коровы, овцы и тд?",
      "url": "https://t.me/riguva/668",
      "source": 201,
      "sourceQuestionId": "q-201-36-1",
      "publishedAt": "2024-03-19T15:15:42+00:00",
      "answerType": "video",
      "duration": "5:56"
    },
    {
      "id": "q201-043",
      "category": "world",
      "title": "Что вызвало Катастрофу и появление мутантов?",
      "question": "Что было причиной Катастрофы? Из-за чего люди превратились в мутантов?",
      "url": "https://t.me/riguva/672",
      "source": 201,
      "sourceQuestionId": "q-201-37-1",
      "publishedAt": "2024-03-23T14:47:26+00:00",
      "answerType": "video",
      "duration": "4:12"
    },
    {
      "id": "q201-044",
      "category": "world",
      "title": "Откуда в Гродже небоскрёбы и кто обслуживает лифты?",
      "question": "Откуда небоскрёбы в Гродже? Кто обслуживает лифты?",
      "url": "https://t.me/riguva/672",
      "source": 201,
      "sourceQuestionId": "q-201-37-2",
      "publishedAt": "2024-03-23T14:47:26+00:00",
      "answerType": "video",
      "duration": "4:12"
    },
    {
      "id": "q201-045",
      "category": "writing",
      "title": "Есть ли у героев реальные прототипы?",
      "question": "Есть ли у героев реальные прототипы?",
      "url": "https://t.me/riguva/672",
      "source": 201,
      "sourceQuestionId": "q-201-37-3",
      "publishedAt": "2024-03-23T14:47:26+00:00",
      "answerType": "video",
      "duration": "4:12"
    },
    {
      "id": "q201-046",
      "category": "author",
      "title": "Кем Ри стала бы в мире ЧБ?",
      "question": "Вы попаданка в мире ЧБ. Кто вы? Что будете делать?",
      "url": "https://t.me/riguva/688",
      "source": 201,
      "sourceQuestionId": "q-201-38-1",
      "publishedAt": "2024-04-02T16:20:17+00:00",
      "answerType": "video",
      "duration": "2:48"
    },
    {
      "id": "q201-047",
      "category": "relationships",
      "title": "Почему Лекса доверилась Пирсу перед аукционом?",
      "question": "Почему Лекса так легко взяла таблетку от Пирса перед аукционом? Она ему настолько доверяла?",
      "url": "https://t.me/riguva/695",
      "source": 201,
      "sourceQuestionId": "q-201-39-1",
      "publishedAt": "2024-04-06T17:00:11+00:00",
      "answerType": "video",
      "duration": "3:58"
    },
    {
      "id": "q201-048",
      "category": "books",
      "title": "Почему после ЧБ долго не выходили новые книги?",
      "question": "Почему вы больше не выпустили ни одной книги?",
      "url": "https://t.me/riguva/698",
      "source": 201,
      "sourceQuestionId": "q-201-40-1",
      "publishedAt": "2024-04-09T14:27:06+00:00",
      "answerType": "video",
      "duration": "23:48"
    },
    {
      "id": "q201-049",
      "category": "writing",
      "title": "Ожидала ли Ри популярности серии?",
      "question": "Думали ли вы, что книги станут популярными?",
      "url": "https://t.me/riguva/705",
      "source": 201,
      "sourceQuestionId": "q-201-41-1",
      "publishedAt": "2024-04-16T14:07:38+00:00",
      "answerType": "video",
      "duration": "3:29"
    },
    {
      "id": "q201-050",
      "category": "characters",
      "title": "Как Блэк провёл свой день рождения?",
      "question": "Как мистер Блэк провел свой день рождения?",
      "url": "https://t.me/riguva/705",
      "source": 201,
      "sourceQuestionId": "q-201-41-2",
      "publishedAt": "2024-04-16T14:07:38+00:00",
      "answerType": "video",
      "duration": "3:29"
    },
    {
      "id": "q201-051",
      "category": "relationships",
      "title": "Почему Райан так странно рассказывал Лексе о суде и свадьбе?",
      "question": "Почему Райан был такой странный, когда рассказывал Лексе про суд и свадьбу? Почему решил, что ее должно от этого тошнить?",
      "url": "https://t.me/riguva/713",
      "source": 201,
      "sourceQuestionId": "q-201-42-1",
      "publishedAt": "2024-04-20T17:15:33+00:00",
      "answerType": "video",
      "duration": "3:38"
    },
    {
      "id": "q201-052",
      "category": "world",
      "title": "Откуда берутся контейнеры с едой?",
      "question": "Откуда контейнеры с едой?",
      "url": "https://t.me/riguva/720",
      "source": 201,
      "sourceQuestionId": "q-201-43-1",
      "publishedAt": "2024-04-23T16:27:35+00:00",
      "answerType": "video",
      "duration": "6:06"
    },
    {
      "id": "q201-053",
      "category": "relationships",
      "title": "Изменились бы отношения Лексы и Райана, если бы Гаварданер выжил?",
      "question": "Если бы Лекса не убила Гаварданера, это бы повлияло на их отношения с Райаном?",
      "url": "https://t.me/riguva/720",
      "source": 201,
      "sourceQuestionId": "q-201-43-2",
      "publishedAt": "2024-04-23T16:27:35+00:00",
      "answerType": "video",
      "duration": "6:06"
    },
    {
      "id": "q201-054",
      "category": "writing",
      "title": "Как появились мир, история и герои ЧБ?",
      "question": "Как зародилась история, мир и герои?",
      "url": "https://t.me/riguva/727",
      "source": 201,
      "sourceQuestionId": "q-201-44-1",
      "publishedAt": "2024-04-27T17:49:35+00:00",
      "answerType": "video",
      "duration": "11:12"
    },
    {
      "id": "q201-055",
      "category": "relationships",
      "title": "О чём Райан думал, увидев Лексу в Нью-Йорке после ссоры?",
      "question": "О чем думал Райан, когда увидел Лексу в Нью-Йорке после ссоры?",
      "url": "https://t.me/riguva/732",
      "source": 201,
      "sourceQuestionId": "q-201-45-1",
      "publishedAt": "2024-04-30T15:15:21+00:00",
      "answerType": "video",
      "duration": "2:36"
    },
    {
      "id": "q201-056",
      "category": "plot",
      "title": "Райан предвидел покушение или случайно спасся в сейфе?",
      "question": "Райан предполагал как будет совершенно покушение? Сейф — это удачное стечение обстоятельств, или Райан так рассчитывал на случай взрыва?",
      "url": "https://t.me/riguva/746",
      "source": 201,
      "sourceQuestionId": "q-201-46-1",
      "publishedAt": "2024-05-04T18:04:33+00:00",
      "answerType": "video",
      "duration": "5:53"
    },
    {
      "id": "q201-057",
      "category": "characters",
      "title": "Как Президент отреагировал, узнав, что глава Гроджтауна его пасынок?",
      "question": "Как отреагировал Президент, когда узнал, что главнокомандующий Гроджтауна — его пасынок?",
      "url": "https://t.me/riguva/759",
      "source": 201,
      "sourceQuestionId": "q-201-47-1",
      "publishedAt": "2024-05-07T12:56:25+00:00",
      "answerType": "video",
      "duration": "5:09"
    },
    {
      "id": "q201-058",
      "category": "characters",
      "title": "Почему Джек пропустил день рождения Лексы?",
      "question": "Почему Джек не пришел на день рождения Лексы? Где он был?",
      "url": "https://t.me/riguva/776",
      "source": 201,
      "sourceQuestionId": "q-201-48-1",
      "publishedAt": "2024-05-11T07:33:18+00:00",
      "answerType": "video",
      "duration": "3:03"
    },
    {
      "id": "q201-059",
      "category": "characters",
      "title": "Почему Лекса такая тупица?",
      "question": "Почему Лекса такая тупица?",
      "url": "https://t.me/riguva/787",
      "source": 201,
      "sourceQuestionId": "q-201-49-1",
      "publishedAt": "2024-05-14T12:06:14+00:00",
      "answerType": "video",
      "duration": "9:02"
    },
    {
      "id": "q798-001",
      "category": "author",
      "title": "Есть ли у Ри мужчина?",
      "question": "У вас есть мужчина?",
      "url": "https://t.me/riguva/797",
      "source": 798,
      "sourceQuestionId": "q-798-1-1",
      "publishedAt": "2024-05-18T14:43:07+00:00",
      "answerType": "video",
      "duration": "4:24"
    },
    {
      "id": "q798-002",
      "category": "relationships",
      "title": "Как Блэк реагировал на кошмары Лексы?",
      "question": "Как Блэк реагировал на кошмары Лексы?",
      "url": "https://t.me/riguva/797",
      "source": 798,
      "sourceQuestionId": "q-798-1-2",
      "publishedAt": "2024-05-18T14:43:07+00:00",
      "answerType": "video",
      "duration": "4:24"
    },
    {
      "id": "q798-003",
      "category": "relationships",
      "title": "Почему Пирс так трепетно относится к Лексе в «Цвете тишины»?",
      "question": "Что случилось с Пирсом, что в ЦТ он с трепетом относился к Лексе?",
      "url": "https://t.me/riguva/797",
      "source": 798,
      "sourceQuestionId": "q-798-1-3",
      "publishedAt": "2024-05-18T14:43:07+00:00",
      "answerType": "video",
      "duration": "4:24"
    },
    {
      "id": "q798-004",
      "category": "books",
      "title": "Планировались ли переводы книг на другие языки?",
      "question": "Планируется ли перевод книг на другие языки?",
      "url": "https://t.me/riguva/811",
      "source": 798,
      "sourceQuestionId": "q-798-2-1",
      "publishedAt": "2024-05-26T13:41:27+00:00",
      "answerType": "video",
      "duration": "10:20"
    },
    {
      "id": "q798-005",
      "category": "relationships",
      "title": "Когда Блэк расстался с Бьянкой?",
      "question": "В какой момент Блэк расстался с Бьянкой?",
      "url": "https://t.me/riguva/814",
      "source": 798,
      "sourceQuestionId": "q-798-3-1",
      "publishedAt": "2024-05-28T13:16:04+00:00",
      "answerType": "video",
      "duration": "3:23"
    },
    {
      "id": "q798-006",
      "category": "books",
      "title": "Почему Ри не печаталась в издательстве?",
      "question": "Почему не печатаетесь в издательстве?",
      "url": "https://t.me/riguva/838",
      "source": 798,
      "sourceQuestionId": "q-798-4-1",
      "publishedAt": "2024-06-17T15:19:00+00:00",
      "answerType": "video",
      "duration": "6:01"
    },
    {
      "id": "q798-007",
      "category": "writing",
      "title": "Тяжело ли было прощаться с Райаном и остальными героями?",
      "question": "Тяжело ли было расстаться с таким героем как Райан? Как прошло прощание с героями в целом?",
      "url": "https://t.me/riguva/838",
      "source": 798,
      "sourceQuestionId": "q-798-4-2",
      "publishedAt": "2024-06-17T15:19:00+00:00",
      "answerType": "video",
      "duration": "6:01"
    },
    {
      "id": "q798-008",
      "category": "relationships",
      "title": "Почему Лексу поселили именно в комнате Блэка?",
      "question": "Зачем Лексу положили в комнате Блэка? Ведь в его доме полно гостевых.",
      "url": "https://t.me/riguva/838",
      "source": 798,
      "sourceQuestionId": "q-798-4-3",
      "publishedAt": "2024-06-17T15:19:00+00:00",
      "answerType": "video",
      "duration": "6:01"
    },
    {
      "id": "q798-009",
      "category": "writing",
      "title": "Хотелось ли Ри переписать книги и какие ошибки она в них видит?",
      "question": "Было ли желание переписать книги? И что за косяки вы в них видите?",
      "url": "https://t.me/riguva/845",
      "source": 798,
      "sourceQuestionId": "q-798-5-1",
      "publishedAt": "2024-06-22T13:50:15+00:00",
      "answerType": "video",
      "duration": "14:22"
    },
    {
      "id": "q798-010",
      "category": "plot",
      "title": "Что Блэк сделал с Реввера в конце?",
      "question": "Что Блэк сделал с Реввера в конце?",
      "url": "https://t.me/riguva/852",
      "source": 798,
      "sourceQuestionId": "q-798-6-1",
      "publishedAt": "2024-06-26T14:36:56+00:00",
      "answerType": "video",
      "duration": "8:13"
    },
    {
      "id": "q798-011",
      "category": "characters",
      "title": "Что Наита хотела изменить в своей жизни?",
      "question": "Наита сказала, что она недовольна своей жизнью и хотела бы ее изменить. Чем недовольна, и что изменить?",
      "url": "https://t.me/riguva/852",
      "source": 798,
      "sourceQuestionId": "q-798-6-2",
      "publishedAt": "2024-06-26T14:36:56+00:00",
      "answerType": "video",
      "duration": "8:13"
    },
    {
      "id": "q798-012",
      "category": "world",
      "title": "Есть ли другие люди, похожие на Джека?",
      "question": "Есть ли ещё такие люди как Джек?",
      "url": "https://t.me/riguva/870",
      "source": 798,
      "sourceQuestionId": "q-798-7-1",
      "publishedAt": "2024-06-30T13:18:48+00:00",
      "answerType": "video",
      "duration": "11:54"
    },
    {
      "id": "q798-013",
      "category": "author",
      "title": "Кто любимый герой Ри?",
      "question": "Ваш любимый герой?",
      "url": "https://t.me/riguva/870",
      "source": 798,
      "sourceQuestionId": "q-798-7-2",
      "publishedAt": "2024-06-30T13:18:48+00:00",
      "answerType": "video",
      "duration": "11:54"
    },
    {
      "id": "q798-014",
      "category": "writing",
      "title": "Как Ри относится к сценам 18+?",
      "question": "Как вы относитесь к сценам 18+?",
      "url": "https://t.me/riguva/870",
      "source": 798,
      "sourceQuestionId": "q-798-7-3",
      "publishedAt": "2024-06-30T13:18:48+00:00",
      "answerType": "video",
      "duration": "11:54"
    },
    {
      "id": "q798-015",
      "category": "plot",
      "title": "Что происходило на Карибах: мутанты, провизия и взрыв машины?",
      "question": "Почему на Карибах не было мутантов? Кто им скидывал провизию, если все считали их погибшими? Кто взорвал машину? Сыновья? Может, они все же не погибли?",
      "url": "https://t.me/riguva/882",
      "source": 798,
      "sourceQuestionId": "q-798-8-1",
      "publishedAt": "2024-07-09T15:23:38+00:00",
      "answerType": "video",
      "duration": "18:23"
    },
    {
      "id": "q798-016",
      "category": "plot",
      "title": "Почему у Лексы и Райана такой эпилог?",
      "question": "Почему вы решили сделать именно такую концовку-эпилог, где Лекса и Райан умирают?",
      "url": "https://t.me/riguva/882",
      "source": 798,
      "sourceQuestionId": "q-798-8-2",
      "publishedAt": "2024-07-09T15:23:38+00:00",
      "answerType": "video",
      "duration": "18:23"
    },
    {
      "id": "q798-017",
      "category": "writing",
      "title": "Как писалась линия потери Дэйтона и переживаний Лексы?",
      "question": "Как вы описывали чувства Лексы после смерти Дэйтона? Откуда вдохновились психиатрической линией? Вы планировали убивать Дэя?",
      "url": "https://t.me/riguva/882",
      "source": 798,
      "sourceQuestionId": "q-798-8-3",
      "publishedAt": "2024-07-09T15:23:38+00:00",
      "answerType": "video",
      "duration": "18:23"
    },
    {
      "id": "q798-018",
      "category": "plot",
      "title": "Почему Райан не увидел видео Ричарда?",
      "question": "Почему Райану не показали видео Ричарда?",
      "url": "https://t.me/riguva/882",
      "source": 798,
      "sourceQuestionId": "q-798-8-4",
      "publishedAt": "2024-07-09T15:23:38+00:00",
      "answerType": "video",
      "duration": "18:23"
    },
    {
      "id": "q798-019",
      "category": "relationships",
      "title": "Почему Блэк оставил без последствий поцелуй Лексы и Джейса?",
      "question": "Почему мистер Блэк никак не отреагировал на поцелуй Лексы и Джейса после дня рождения, тем более, что уже был пьян? \n(Тут же ответы на то, как он об этом узнал, от кого, и почему оставил такой инцидент без последствий)",
      "url": "https://t.me/riguva/916",
      "source": 798,
      "sourceQuestionId": "q-798-9-1",
      "publishedAt": "2024-07-15T16:15:01+00:00",
      "answerType": "video",
      "duration": "8:31"
    },
    {
      "id": "q798-020",
      "category": "world",
      "title": "Почему мутанты не почуяли Лексу на парковке торгового центра?",
      "question": "Почему на парковке торгового центра мутанты не почуяли Лексу?",
      "url": "https://t.me/riguva/916",
      "source": 798,
      "sourceQuestionId": "q-798-9-2",
      "publishedAt": "2024-07-15T16:15:01+00:00",
      "answerType": "video",
      "duration": "8:31"
    },
    {
      "id": "q798-021",
      "category": "plot",
      "title": "Почему Райан убил Президента без пыток?",
      "question": "Почему Райан именно так убил Президента? Без пыток и мучений.",
      "url": "https://t.me/riguva/955",
      "source": 798,
      "sourceQuestionId": "q-798-10-1",
      "publishedAt": "2024-08-02T15:59:59+00:00",
      "answerType": "video",
      "duration": "10:24"
    },
    {
      "id": "q798-022",
      "category": "relationships",
      "title": "Когда Блэк понял, что любит Лексу?",
      "question": "В какой момент Блэк понял, что любит Лексу?",
      "url": "https://t.me/riguva/978",
      "source": 798,
      "sourceQuestionId": "q-798-11-1",
      "publishedAt": "2024-08-18T15:16:27+00:00",
      "answerType": "video",
      "duration": "9:32"
    },
    {
      "id": "q798-023",
      "category": "relationships",
      "title": "Когда Джейс понял, что любит Лексу?",
      "question": "В какой момент Джейс понял, что любит Лексу?",
      "url": "https://t.me/riguva/978",
      "source": 798,
      "sourceQuestionId": "q-798-11-2",
      "publishedAt": "2024-08-18T15:16:27+00:00",
      "answerType": "video",
      "duration": "9:32"
    },
    {
      "id": "q798-024",
      "category": "writing",
      "title": "Как Ри относится к фанфикам и историям по мотивам ЧБ?",
      "question": "Как вы относитесь к тому, что люди могут вдохновляться вашей историей и писать аналоги и фанфики?",
      "url": "https://t.me/riguva/987",
      "source": 798,
      "sourceQuestionId": "q-798-12-1",
      "publishedAt": "2024-08-27T17:49:25+00:00",
      "answerType": "video",
      "duration": "11:47"
    },
    {
      "id": "q798-025",
      "category": "relationships",
      "title": "Мог ли Блэк не влюбиться в Лексу?",
      "question": "У Блэка был шанс не влюбиться в Лексу?",
      "url": "https://t.me/riguva/987",
      "source": 798,
      "sourceQuestionId": "q-798-12-2",
      "publishedAt": "2024-08-27T17:49:25+00:00",
      "answerType": "video",
      "duration": "11:47"
    },
    {
      "id": "q798-026",
      "category": "relationships",
      "title": "Чьи чувства сильнее: Лексы или Блэка?",
      "question": "Чьи чувства сильнее, Лексы или Блэка?",
      "url": "https://t.me/riguva/987",
      "source": 798,
      "sourceQuestionId": "q-798-12-3",
      "publishedAt": "2024-08-27T17:49:25+00:00",
      "answerType": "video",
      "duration": "11:47"
    },
    {
      "id": "q798-027",
      "category": "writing",
      "title": "Что вдохновило Ри на «Черный Белый»?",
      "question": "Что меня вдохновило на написание ЧБ?",
      "url": "https://t.me/riguva/987",
      "source": 798,
      "sourceQuestionId": "q-798-12-4",
      "publishedAt": "2024-08-27T17:49:25+00:00",
      "answerType": "video",
      "duration": "11:47"
    },
    {
      "id": "q798-028",
      "category": "characters",
      "title": "Как Реввера пришёл к власти и почему стал жестоким?",
      "question": "Как Реввера пришел к власти? Как он справился с наркозависимостью? Почему он любил насилие? Будь то девушка или арена, откуда это в нем?",
      "url": "https://t.me/riguva/987",
      "source": 798,
      "sourceQuestionId": "q-798-12-5",
      "publishedAt": "2024-08-27T17:49:25+00:00",
      "answerType": "video",
      "duration": "11:47"
    },
    {
      "id": "q798-029",
      "category": "relationships",
      "title": "Почему после свадьбы Блэк сначала прогнал Лексу, а потом не отпустил?",
      "question": "После свадьбы Блэк велел Лексе уйти, но она не ушла. Почему когда потом Лекса спросила, уйти ли ей, он ответил \"нет\"?",
      "url": "https://t.me/riguva/998",
      "source": 798,
      "sourceQuestionId": "q-798-13-1",
      "publishedAt": "2024-08-31T11:19:30+00:00",
      "answerType": "video",
      "duration": "8:34"
    },
    {
      "id": "q798-030",
      "category": "writing",
      "title": "Автор заранее знает ответы на вопросы о мире и героях?",
      "question": "Вы знаете ответы на все вопросы? Вы все это прорабатывали в момент написания книг или приходится додумывать на ходу?",
      "url": "https://t.me/riguva/998",
      "source": 798,
      "sourceQuestionId": "q-798-13-2",
      "publishedAt": "2024-08-31T11:19:30+00:00",
      "answerType": "video",
      "duration": "8:34"
    },
    {
      "id": "q798-031",
      "category": "author",
      "title": "Каких писателей любит Ри?",
      "question": "Кто ваши любимые авторы?",
      "url": "https://t.me/riguva/1011",
      "source": 798,
      "sourceQuestionId": "q-798-14-1",
      "publishedAt": "2024-09-10T16:05:53+00:00",
      "answerType": "video",
      "duration": "8:52"
    },
    {
      "id": "q798-032",
      "category": "relationships",
      "title": "Что Блэк почувствовал, увидев поцелуй Лексы и Брэндана?",
      "question": "Что испытывал Блэк, когда увидел, как Лекса целуется с Брэнданом в Аляске? В моменте и потом.",
      "url": "https://t.me/riguva/1011",
      "source": 798,
      "sourceQuestionId": "q-798-14-2",
      "publishedAt": "2024-09-10T16:05:53+00:00",
      "answerType": "video",
      "duration": "8:52"
    },
    {
      "id": "q798-033",
      "category": "plot",
      "title": "Почему Райан не хотел умереть от старости?",
      "question": "Почему Райан просил уйти из жизни не от старости? Разве он не хотел как можно дольше пробыть с Лексой?",
      "url": "https://t.me/riguva/1011",
      "source": 798,
      "sourceQuestionId": "q-798-14-3",
      "publishedAt": "2024-09-10T16:05:53+00:00",
      "answerType": "video",
      "duration": "8:52"
    },
    {
      "id": "q798-034",
      "category": "relationships",
      "title": "Что Блэк чувствовал, когда Брайан напал на Лексу?",
      "question": "Что Блэк чувствовал, когда Брайан напал на Лексу в ее доме, и что думал о самой Лексе?",
      "url": "https://t.me/riguva/1024",
      "source": 798,
      "sourceQuestionId": "q-798-15-1",
      "publishedAt": "2024-09-15T10:09:32+00:00",
      "answerType": "video",
      "duration": "7:56"
    },
    {
      "id": "q798-035",
      "category": "characters",
      "title": "В какой общине врач издевался над Джеком?",
      "question": "В какой общине над Джеком издевался врач-психопат?",
      "url": "https://t.me/riguva/1024",
      "source": 798,
      "sourceQuestionId": "q-798-15-2",
      "publishedAt": "2024-09-15T10:09:32+00:00",
      "answerType": "video",
      "duration": "7:56"
    },
    {
      "id": "q798-036",
      "category": "plot",
      "title": "Сколько лет было Блэкам во время взрыва?",
      "question": "В каком возрасте взорвали Блэков? Раз он отошёл от дел, значит возраст уже был преклонный? Лет 70?",
      "url": "https://t.me/riguva/1024",
      "source": 798,
      "sourceQuestionId": "q-798-15-3",
      "publishedAt": "2024-09-15T10:09:32+00:00",
      "answerType": "video",
      "duration": "7:56"
    },
    {
      "id": "q798-037",
      "category": "world",
      "title": "Почему жители Нью-Йорка и Гроджа так по-разному одеваются?",
      "question": "Почему именно в Нью-Йорке жители ходят в необычных нарядах: балетных пачках, полуголые, цветные экстравагантные костюмы? Эта мода навеяна Капитолием из\n\"Голодных игр\"? Почему там жители не боятся носить яркую цветную одежду, в то время как в Гродже носят почти однотонную темную?",
      "url": "https://t.me/riguva/1024",
      "source": 798,
      "sourceQuestionId": "q-798-15-4",
      "publishedAt": "2024-09-15T10:09:32+00:00",
      "answerType": "video",
      "duration": "7:56"
    },
    {
      "id": "q798-038",
      "category": "author",
      "title": "Откуда появился псевдоним Гува?",
      "question": "Откуда фамилия Гува?",
      "url": "https://t.me/riguva/1032",
      "source": 798,
      "sourceQuestionId": "q-798-16-1",
      "publishedAt": "2024-09-20T15:27:51+00:00",
      "answerType": "video",
      "duration": "7:03"
    },
    {
      "id": "q798-039",
      "category": "relationships",
      "title": "Почему Райан заставил Лексу раздеться в офисе?",
      "question": "Зачем и почему Райан заставил Лексу раздеться в офисе?",
      "url": "https://t.me/riguva/1032",
      "source": 798,
      "sourceQuestionId": "q-798-16-2",
      "publishedAt": "2024-09-20T15:27:51+00:00",
      "answerType": "video",
      "duration": "7:03"
    },
    {
      "id": "q798-040",
      "category": "relationships",
      "title": "Знали ли Блэк, Пирс и Трой, как Лекса выживала в Глондаре?",
      "question": "Интересовались ли Блэк, Пирс и Трой, как Лекса жила в Глондаре, как пробилась на арену. Чувствовали ли они гордость за то, что имели отношение к ее физической подготовке и следовательно успешному выживанию? Вообще, разговаривали ли они с ней про то, как она жила за пределами Гроджа, пока ее все искали?",
      "url": "https://t.me/riguva/1032",
      "source": 798,
      "sourceQuestionId": "q-798-16-3",
      "publishedAt": "2024-09-20T15:27:51+00:00",
      "answerType": "video",
      "duration": "7:03"
    },
    {
      "id": "q798-041",
      "category": "relationships",
      "title": "Как Блэк отнёсся к тому, что команда Джейса укрывала Лексу?",
      "question": "Узнал ли Блэк о том, что команда Джейса скрывала Лексу в лесном доме? Если узнал, то как? Был ли он благодарен им, что помогли Лексе или наоборот был зол, что приказ проигнорировали?",
      "url": "https://t.me/riguva/1040",
      "source": 798,
      "sourceQuestionId": "q-798-17-1",
      "publishedAt": "2024-09-22T14:28:24+00:00",
      "answerType": "video",
      "duration": "2:50"
    },
    {
      "id": "q798-042",
      "category": "characters",
      "title": "Что Элейн знала о Лексе и смерти Ронни?",
      "question": "Элейн знала, что именно Лекса убила Ронни? И вообще историю Лексы? Почему при встрече ее волновала женитьба, а не смерть сына? Какие были их отношения с Президентом?",
      "url": "https://t.me/riguva/1041",
      "source": 798,
      "sourceQuestionId": "q-798-18-1",
      "publishedAt": "2024-09-22T14:30:26+00:00",
      "answerType": "video",
      "duration": "7:48"
    },
    {
      "id": "q798-043",
      "category": "relationships",
      "title": "Почему Лексу привлекают сложные мужчины, а не Шон?",
      "question": "Почему Лекса выбирает сложных мужчин? Тех, которые ее ранят, которые опасны, недоступны, доставляют проблемы, делают ей больно, качают на эмоциональных качелях? И почему у нее не вызывают ответные чувства такие стабильные парни, как Шон?",
      "url": "https://t.me/riguva/1042",
      "source": 798,
      "sourceQuestionId": "q-798-19-1",
      "publishedAt": "2024-09-22T14:32:11+00:00",
      "answerType": "video",
      "duration": "6:12"
    },
    {
      "id": "q1054-001",
      "category": "world",
      "title": "Почему Ник удивился ананасу, если тоже владеет Гроджтауном?",
      "question": "Когда Лекса привезла ананас, Ник был также удивлен вкусу. Но он ведь тоже владелец Гроджтауна. Почему ему недоступны фрукты и другие блага?",
      "url": "https://t.me/riguva/1053",
      "source": 1054,
      "sourceQuestionId": "q-1054-1-1",
      "publishedAt": "2024-09-28T09:06:09+00:00",
      "answerType": "video",
      "duration": "12:01"
    },
    {
      "id": "q1054-002",
      "category": "writing",
      "title": "Снились ли Ри герои и события ЧБ?",
      "question": "Снились ли вам во время написания или после герои или события? Может какой-то сон помнится?",
      "url": "https://t.me/riguva/1053",
      "source": 1054,
      "sourceQuestionId": "q-1054-1-2",
      "publishedAt": "2024-09-28T09:06:09+00:00",
      "answerType": "video",
      "duration": "12:01"
    },
    {
      "id": "q1054-003",
      "category": "characters",
      "title": "Где и как Джек пересекался с Блэком?",
      "question": "Где и как Джек пересекался с Блэком?",
      "url": "https://t.me/riguva/1053",
      "source": 1054,
      "sourceQuestionId": "q-1054-1-3",
      "publishedAt": "2024-09-28T09:06:09+00:00",
      "answerType": "video",
      "duration": "12:01"
    },
    {
      "id": "q1054-004",
      "category": "author",
      "title": "Как Ри справляется с негативом и хейтерами?",
      "question": "Сталкиваешься ли ты с негативом по поводу писательства? Бывают ли хейтеры? Если да, что помогает не обращать внимание?",
      "url": "https://t.me/riguva/1053",
      "source": 1054,
      "sourceQuestionId": "q-1054-1-4",
      "publishedAt": "2024-09-28T09:06:09+00:00",
      "answerType": "video",
      "duration": "12:01"
    },
    {
      "id": "q1054-005",
      "category": "relationships",
      "title": "Что сделал бы Блэк, сразу узнав от доктора о насилии над Лексой?",
      "question": "Что бы сделал мистер Блэк, если бы сразу узнал от доктора об изнасиловании?",
      "url": "https://t.me/riguva/1065",
      "source": 1054,
      "sourceQuestionId": "q-1054-2-1",
      "publishedAt": "2024-10-02T14:00:53+00:00",
      "answerType": "video",
      "duration": "5:53"
    },
    {
      "id": "q1054-006",
      "category": "books",
      "title": "Согласилась бы Ри на экранизацию в России?",
      "question": "Вы бы согласились на экранизацию в России?",
      "url": "https://t.me/riguva/1065",
      "source": 1054,
      "sourceQuestionId": "q-1054-2-2",
      "publishedAt": "2024-10-02T14:00:53+00:00",
      "answerType": "video",
      "duration": "5:53"
    },
    {
      "id": "q1054-007",
      "category": "writing",
      "title": "Похожа ли Лекса на саму Ри?",
      "question": "Лекса — это я?",
      "url": "https://t.me/riguva/1086",
      "source": 1054,
      "sourceQuestionId": "q-1054-3-1",
      "publishedAt": "2024-10-09T07:26:19+00:00",
      "answerType": "video",
      "duration": "5:37"
    },
    {
      "id": "q1054-008",
      "category": "books",
      "title": "Планировалась ли история по фэнтези-рисункам?",
      "question": "Будет ли история по фэнтези-картинкам?",
      "url": "https://t.me/riguva/1113",
      "source": 1054,
      "sourceQuestionId": "q-1054-4-1",
      "publishedAt": "2024-10-15T12:06:14+00:00",
      "answerType": "video",
      "duration": "12:05"
    },
    {
      "id": "q1054-009",
      "category": "plot",
      "title": "Почему Лексу не выдали Президенту в Глондаре?",
      "question": "Почему Лексу не выдали Президенту, когда она попала в Глондар? Было же ее фото/видео.",
      "url": "https://t.me/riguva/1113",
      "source": 1054,
      "sourceQuestionId": "q-1054-4-2",
      "publishedAt": "2024-10-15T12:06:14+00:00",
      "answerType": "video",
      "duration": "12:05"
    },
    {
      "id": "q1054-010",
      "category": "author",
      "title": "Читал ли мужчина Ри её книги и что о них думает?",
      "question": "Читал ли ваш мужчина ваши книги? Понравилось ли ему? И как бы вы отреагировали, если бы не понравилось?",
      "url": "https://t.me/riguva/1113",
      "source": 1054,
      "sourceQuestionId": "q-1054-4-3",
      "publishedAt": "2024-10-15T12:06:14+00:00",
      "answerType": "video",
      "duration": "12:05"
    },
    {
      "id": "q1054-011",
      "category": "characters",
      "title": "Повлиял ли каннибализм на Ронни?",
      "question": "Повлияло ли на Ронни поедание человечины?",
      "url": "https://t.me/riguva/1149",
      "source": 1054,
      "sourceQuestionId": "q-1054-5-1",
      "publishedAt": "2024-10-22T14:48:46+00:00",
      "answerType": "video",
      "duration": "1:46"
    },
    {
      "id": "q1054-012",
      "category": "characters",
      "title": "Как каннибализм родителей мог повлиять на Лексу и её семью?",
      "question": "Мог ли каннибализм родителей повлиять на Лексу? Как Ройсы сделали вывод, что это их ребенок? Может, они украли ее у кого-то? Почему одного ребенка съели, второго — нет, а третьего пытались украсть, чтобы съесть?",
      "url": "https://t.me/riguva/1181",
      "source": 1054,
      "sourceQuestionId": "q-1054-6-1",
      "publishedAt": "2024-10-30T15:24:54+00:00",
      "answerType": "video",
      "duration": "6:20"
    },
    {
      "id": "q1054-013",
      "category": "relationships",
      "title": "Что Блэк думал о следах на теле Лексы после слов доктора Лораса?",
      "question": "Что Блэк думал насчёт следов на теле Лексы после опровержения его теории доктором Лорасом?",
      "url": "https://t.me/riguva/1181",
      "source": 1054,
      "sourceQuestionId": "q-1054-6-2",
      "publishedAt": "2024-10-30T15:24:54+00:00",
      "answerType": "video",
      "duration": "6:20"
    },
    {
      "id": "q1054-014",
      "category": "world",
      "title": "Почему город разделили на северную и южную части?",
      "question": "Почему город решили разделить на северную и южную части? Почему жители этих частей не могли жить вместе?",
      "url": "https://t.me/riguva/1181",
      "source": 1054,
      "sourceQuestionId": "q-1054-6-3",
      "publishedAt": "2024-10-30T15:24:54+00:00",
      "answerType": "video",
      "duration": "6:20"
    },
    {
      "id": "q1054-015",
      "category": "plot",
      "title": "Оставил бы Блэк Лексу в Глондаре без Пирса и Троя?",
      "question": "Оставил ли Блэк Лексу в Глондаре, если бы не Пирс и Трой?",
      "url": "https://t.me/riguva/1203",
      "source": 1054,
      "sourceQuestionId": "q-1054-7-1",
      "publishedAt": "2024-11-06T14:36:51+00:00",
      "answerType": "video",
      "duration": "2:01"
    },
    {
      "id": "q1054-016",
      "category": "relationships",
      "title": "Кого выбрала бы Лекса, если бы у неё получилось с Джеком?",
      "question": "Если бы у Лексы получилось с Джеком на интимном уровне, кого бы она выбрала?",
      "url": "https://t.me/riguva/1542",
      "source": 1054,
      "sourceQuestionId": "q-1054-8-1",
      "publishedAt": "2025-02-25T16:37:54+00:00",
      "answerType": "video",
      "duration": "11:52"
    },
    {
      "id": "q1054-017",
      "category": "characters",
      "title": "Как Джек жил после последнего укуса и стали ли его глаза чёрными?",
      "question": "Как Джек участвовал в общественной жизни после последнего укуса? Его глаза были черными?",
      "url": "https://t.me/riguva/1542",
      "source": 1054,
      "sourceQuestionId": "q-1054-8-2",
      "publishedAt": "2025-02-25T16:37:54+00:00",
      "answerType": "video",
      "duration": "11:52"
    },
    {
      "id": "q1054-018",
      "category": "characters",
      "title": "Как Элейн сошлась с Президентом и почему так относилась к детям?",
      "question": "Как началась история Элейн с Президентом? Почему такое отношение к детям? Была ли она счастлива, пусть и по-своему? Ее психическое отклонение - это врожденное или приобретенное?",
      "url": "https://t.me/riguva/1542",
      "source": 1054,
      "sourceQuestionId": "q-1054-8-3",
      "publishedAt": "2025-02-25T16:37:54+00:00",
      "answerType": "video",
      "duration": "11:52"
    },
    {
      "id": "q1054-019",
      "category": "characters",
      "title": "Почему Генерал Кронг ненавидел Райана ещё до встречи?",
      "question": "Почему Генерал Кронг так ненавидел Райана еще до встречи с ним? И был готов легко застрелить, когда тот пришел после рехаба?",
      "url": "https://t.me/riguva/1542",
      "source": 1054,
      "sourceQuestionId": "q-1054-8-4",
      "publishedAt": "2025-02-25T16:37:54+00:00",
      "answerType": "video",
      "duration": "11:52"
    },
    {
      "id": "q1054-020",
      "category": "world",
      "title": "Как после апокалипсиса построили стены и приспособились к новой жизни?",
      "question": "Как во время апокалипсиса люди так быстро выстроили стены? Где люди брали материалы? Как люди адаптировались?",
      "url": "https://t.me/riguva/1557",
      "source": 1054,
      "sourceQuestionId": "q-1054-9-1",
      "publishedAt": "2025-02-28T16:11:52+00:00",
      "answerType": "video",
      "duration": "6:14"
    },
    {
      "id": "q1054-021",
      "category": "characters",
      "title": "Как Блэк эмоционально пережил взрыв дома и уцелели ли машины?",
      "question": "Как Блэк пережил взрыв дома в эмоциональном плане? Пережили ли взрыв машины в гараже?",
      "url": "https://t.me/riguva/1557",
      "source": 1054,
      "sourceQuestionId": "q-1054-9-2",
      "publishedAt": "2025-02-28T16:11:52+00:00",
      "answerType": "video",
      "duration": "6:14"
    },
    {
      "id": "q1054-022",
      "category": "characters",
      "title": "Почему Норин так себя вела и ненавидела ли Лексу?",
      "question": "Почему Норин была истеричкой? Она ненавидела Лексу? Или это посттравматический синдром?",
      "url": "https://t.me/riguva/1573",
      "source": 1054,
      "sourceQuestionId": "q-1054-10-1",
      "publishedAt": "2025-03-05T16:15:53+00:00",
      "answerType": "video",
      "duration": "7:04"
    },
    {
      "id": "q1054-023",
      "category": "characters",
      "title": "Что связывало отца Джека и Генерала Кронга?",
      "question": "Как отец Джека был связан с Генералом Кронгом?",
      "url": "https://t.me/riguva/1573",
      "source": 1054,
      "sourceQuestionId": "q-1054-10-2",
      "publishedAt": "2025-03-05T16:15:53+00:00",
      "answerType": "video",
      "duration": "7:04"
    },
    {
      "id": "q1054-024",
      "category": "plot",
      "title": "Почему у Джека именно такой финал?",
      "question": "Почему у Джека был такой финал?",
      "url": "https://t.me/riguva/1573",
      "source": 1054,
      "sourceQuestionId": "q-1054-10-3",
      "publishedAt": "2025-03-05T16:15:53+00:00",
      "answerType": "video",
      "duration": "7:04"
    },
    {
      "id": "q1054-025",
      "category": "writing",
      "title": "Как Ри общается со своими героями?",
      "question": "Как происходит общение с героями? Ты говоришь с ними как с реальными людьми?",
      "url": "https://t.me/riguva/1573",
      "source": 1054,
      "sourceQuestionId": "q-1054-10-4",
      "publishedAt": "2025-03-05T16:15:53+00:00",
      "answerType": "video",
      "duration": "7:04"
    },
    {
      "id": "q1054-026",
      "category": "relationships",
      "title": "Когда Пирс догадался о случившемся с Лексой и с кем поделился?",
      "question": "Когда Пирс догадался о том, что случилось с Лексой, поделился ли он своими догадками с Троем или Райаном? Догадывался ли сам Райан?",
      "url": "https://t.me/riguva/1592",
      "source": 1054,
      "sourceQuestionId": "q-1054-11-1",
      "publishedAt": "2025-03-15T11:35:25+00:00",
      "answerType": "video",
      "duration": "10:04"
    },
    {
      "id": "q1054-027",
      "category": "relationships",
      "title": "Когда Джек понял, что любит Лексу?",
      "question": "Когда Джек понял, что любит Лексу?",
      "url": "https://t.me/riguva/1592",
      "source": 1054,
      "sourceQuestionId": "q-1054-11-2",
      "publishedAt": "2025-03-15T11:35:25+00:00",
      "answerType": "video",
      "duration": "10:04"
    },
    {
      "id": "q1054-028",
      "category": "relationships",
      "title": "О какой «другой причине» спрашивал Райан после истории с Реввера?",
      "question": "Когда Райан узнал, что произошло между Лексой и Реввера, он задал ей вопрос «есть другая причина?» Что он имел в виду? И почему она молчала?",
      "url": "https://t.me/riguva/1592",
      "source": 1054,
      "sourceQuestionId": "q-1054-11-3",
      "publishedAt": "2025-03-15T11:35:25+00:00",
      "answerType": "video",
      "duration": "10:04"
    },
    {
      "id": "q1054-029",
      "category": "world",
      "title": "Почему кровь монстров в ранах не заражает героев?",
      "question": "Почему герои не заражаются вирусом, когда на их раны попадает кровь монстров?",
      "url": "https://t.me/riguva/1592",
      "source": 1054,
      "sourceQuestionId": "q-1054-11-4",
      "publishedAt": "2025-03-15T11:35:25+00:00",
      "answerType": "video",
      "duration": "10:04"
    },
    {
      "id": "q1054-030",
      "category": "world",
      "title": "Почему после Катастрофы человеческая жизнь так мало ценится?",
      "question": "Почему в новом мире после Катастрофы люди так не ценят человеческую жизнь? Например, Джейсу можно убивать всех встречных без разбора?",
      "url": "https://t.me/riguva/1649",
      "source": 1054,
      "sourceQuestionId": "q-1054-12-1",
      "publishedAt": "2025-04-01T12:19:46+00:00",
      "answerType": "video",
      "duration": "17:51"
    },
    {
      "id": "q1054-031",
      "category": "characters",
      "title": "Почему после аварии Блэк больше горевал о машине, чем об охране?",
      "question": "Почему после дтп с мутантами мистер Блэк больше грустил о разбитой тачке, а не о погибшей охране?",
      "url": "https://t.me/riguva/1649",
      "source": 1054,
      "sourceQuestionId": "q-1054-12-2",
      "publishedAt": "2025-04-01T12:19:46+00:00",
      "answerType": "video",
      "duration": "17:51"
    },
    {
      "id": "q1054-032",
      "category": "characters",
      "title": "Какие недостатки Ри дала Лексе и что ей в героине не нравится?",
      "question": "Какие отрицательные черты вы добавили Лексе? И чем лично вам она не нравится как человек?",
      "url": "https://t.me/riguva/1752",
      "source": 1054,
      "sourceQuestionId": "q-1054-13-1",
      "publishedAt": "2025-05-05T16:03:39+00:00",
      "answerType": "video",
      "duration": "5:10"
    }
  ]
};

;
/* source: qa-v16.js */
/* A spoiler-gated index of Ri's own Telegram answers. No video autoplay. */
(() => {
  'use strict';
  const section=document.getElementById('author-qa');
  const radio=document.getElementById('qa-radio');
  const reveal=document.getElementById('qa-reveal');
  const copy=document.getElementById('qa-toggle-copy');
  const catalog=document.getElementById('qa-catalog');
  const search=document.getElementById('qa-search');
  const filters=document.getElementById('qa-filters');
  const stats=document.getElementById('qa-stats');
  const results=document.getElementById('qa-results');
  const collapse=document.getElementById('qa-collapse');
  if(!section||!radio||!reveal||!copy||!catalog||!search||!filters||!stats||!results||!collapse)return;
  const data=window.RiQAData;
  if(!data||!Array.isArray(data.questions)||!Array.isArray(data.categories))return;
  const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalize=value=>String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[«»„“"']/g,'').replace(/\s+/g,' ').trim();
  const plural=(number,forms)=>{const tens=number%100,last=number%10;return forms[tens>10&&tens<20?2:last===1?0:last>=2&&last<=4?1:2];};
  const validURL=value=>{try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='t.me'?url.href:null;}catch{return null;}};
  const questions=data.questions.filter(q=>q&&typeof q.title==='string'&&q.title.trim());
  const counts=new Map(data.categories.map(c=>[c.id,questions.filter(q=>q.category===c.id).length]));
  let opened=false,rendered=false,category='all',query='';

  function answerLinks(question){
    const supplied=Array.isArray(question.links)&&question.links.length?question.links:[{url:question.url}];
    const links=supplied.map(link=>typeof link==='string'?{url:link}:link).filter(Boolean);
    return links.map((link,index)=>{
      const url=validURL(link.url||link.href);if(!url)return '';
      const label='Видео ответ в ТГ'+(links.length>1?' '+(index+1):'');
      return '<a class="qa-answer-link" href="'+safe(url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+safe('Видео ответ в ТГ: '+question.title)+'">'+safe(label)+' <span aria-hidden="true">↗</span></a>';
    }).join('');
  }
  function renderFilters(){
    const options=[{id:'all',label:'Все темы'},...data.categories.filter(c=>counts.get(c.id)>0)];
    filters.innerHTML=options.map(c=>'<button type="button" class="qa-filter" data-qa-category="'+safe(c.id)+'" aria-pressed="'+String(c.id===category)+'">'+safe(c.label)+'</button>').join('');
  }
  function render(){
    if(!opened)return;
    const terms=normalize(query).split(' ').filter(Boolean);
    const selected=questions.filter(q=>{
      if(category!=='all'&&q.category!==category)return false;
      const label=data.categories.find(c=>c.id===q.category)?.label||'';
      const haystack=normalize([q.title,q.question||'',label,q.searchText||''].join(' '));
      return terms.every(term=>haystack.includes(term));
    });
    stats.textContent=selected.length===questions.length
      ?questions.length+' '+plural(questions.length,['вопрос','вопроса','вопросов'])
      :'Найдено: '+selected.length+' '+plural(selected.length,['вопрос','вопроса','вопросов'])+' из '+questions.length;
    const groups=data.categories.map(c=>({category:c,items:selected.filter(q=>q.category===c.id)})).filter(group=>group.items.length);
    results.innerHTML=groups.length?groups.map(group=>{
      const c=group.category;
      const expanded=category!=='all'||terms.length>0;
      return '<details class="qa-topic"'+(expanded?' open':'')+'><summary><span class="qa-topic-title">'+safe(c.label)+'</span><span class="qa-topic-count">'+group.items.length+'</span><span class="qa-topic-symbol" aria-hidden="true">+</span></summary><ol class="qa-question-list">'+group.items.map((q,index)=>{
        const title='<h3><span class="qa-question-title">'+safe(q.title)+'</span></h3>';
        return '<li class="qa-question" id="qa-item-'+safe(q.id)+'"><span class="qa-question-number" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span><div class="qa-question-content">'+title+'</div><div class="qa-answer-links">'+answerLinks(q)+'</div></li>';
      }).join('')+'</ol></details>';
    }).join(''):'<div class="qa-empty"><p>Ничего не найдено.</p><button type="button" class="qa-reset">Сбросить поиск и темы</button></div>';
    rendered=true;
  }
  function setOpen(value){
    const next=!!value,changed=next!==opened;
    opened=next;
    if(!opened&&catalog.contains(document.activeElement))reveal.focus({preventScroll:true});
    radio.dataset.open=String(opened);
    reveal.setAttribute('aria-expanded',String(opened));
    copy.textContent=opened?'Нажми Stop,\nчтобы скрыть вопросы':'Нажми Play,\nчтобы открыть вопросы';
    catalog.hidden=!opened;catalog.inert=!opened;
    if(opened&&!rendered){renderFilters();render();}
    // A new scan is only needed when Play changes the stopped state to playing.
    if(changed){
      radio.classList.remove('qa-tuning');
      if(opened)requestAnimationFrame(()=>{if(opened)radio.classList.add('qa-tuning');});
    }
  }
  reveal.addEventListener('click',()=>setOpen(true));
  document.getElementById('qa-stop')?.addEventListener('click',()=>setOpen(false));
  collapse.addEventListener('click',()=>setOpen(false));
  search.addEventListener('input',()=>{query=search.value;render();});
  filters.addEventListener('click',event=>{
    const button=event.target.closest('[data-qa-category]');if(!button)return;
    category=button.dataset.qaCategory;
    filters.querySelectorAll('[data-qa-category]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
    render();
  });
  results.addEventListener('click',event=>{
    if(!event.target.closest('.qa-reset'))return;
    query='';category='all';search.value='';renderFilters();render();search.focus({preventScroll:true});
  });
  setOpen(false);
})();

;
/* source: legal-v18.js */
/* Draft document screens. No acceptance, data collection or legal terms are implied. */
(() => {
  'use strict';
  const dialog=document.getElementById('legal-dialog');
  const title=document.getElementById('legal-dialog-title');
  const copy=document.getElementById('legal-document-copy');
  if(!dialog||!title||!copy)return;
  let opener=null;
  const documents={
    offer:{title:'Публичная оферта',text:'Здесь будут условия покупки бумажных книг и мерча: оформление заказа, оплата, доставка и возврат.'},
    privacy:{title:'Политика обработки персональных данных',text:'Здесь будет описано, какие данные нужны для заказов и обращений, как они используются, хранятся и защищаются, а также как связаться с оператором данных.'},
    consent:{title:'Согласие на обработку персональных данных',text:'Здесь появится отдельный текст согласия для будущих форм заказа и обратной связи с указанием оператора, целей и состава обрабатываемых данных.'},
    cookies:{title:'Cookie и локальное хранилище',text:'Здесь будет описано использование cookie и локального хранилища сайта. Сейчас корзина, настройка движения и выбранный мир сохраняются в браузере. Система аналитики не подключена.'},
    delivery:{title:'Доставка и возврат',text:'Здесь будут указаны способы доставки, сроки, стоимость и порядок возврата бумажных книг и мерча.'},
    seller:{title:'Реквизиты продавца',text:'Здесь появятся наименование продавца, ИНН/ОГРН, адрес и контакты для обращений.'}
  };
  document.addEventListener('click',event=>{
    const control=event.target.closest('[data-legal-open]');
    const entry=control&&documents[control.dataset.legalOpen];
    if(!entry)return;
    event.preventDefault();
    dialog.dataset.document=control.dataset.legalOpen;
    title.textContent=entry.title;
    copy.textContent=entry.text;
    opener=control;
    if(typeof window.showDialog==='function')window.showDialog(dialog);
    else dialog.showModal();
  });
  if(document.body.classList.contains('author-document')){
    dialog.addEventListener('click',event=>{
      if(event.target.closest('[data-close]')){dialog.close();return;}
      if(event.target===dialog){
        const rect=dialog.getBoundingClientRect();
        if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
      }
    });
    dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  }
})();

;
/* source: font-punctuation.js */
/* The original SP font maps these non-letter characters to its author's QR.
   Keep the font intact; use a normal fallback face for those characters only. */
(() => {
  'use strict';
  const brandingCharacters=/[\u0021-\u0022\u0027-\u002A\u002C-\u002E\u0030-\u003B\u003F-\u0040\u0060\u00A1\u00A5\u00A8\u00AB\u00AF\u00B4\u00B7-\u00B8\u00BB\u00BF\u02D8-\u02DD\u02ED\u02F5-\u02F7\u0375\u0385\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FEE-\u1FEF\u1FFD\u2010\u2012-\u2015\u2018-\u201E\u2021-\u2022\u2024-\u2026\u2032\u203C\u2048-\u2049\u204E\u20A1\u20A3-\u20A4\u20A6\u20A8-\u20A9\u20AB-\u20AE\u20B1\u20B8\u20BA\u20BD\u2122\u2160-\u217F\u218A-\u218B\u2212\u25CC\uA789]/gu;
  const skip='script,style,textarea,input,code,pre,[data-font-punctuation]';
  function repairText(node){
    const parent=node.parentElement;
    if(!parent||parent.closest(skip))return;
    const text=node.data;
    brandingCharacters.lastIndex=0;
    if(!brandingCharacters.test(text)||!getComputedStyle(parent).fontFamily.includes('Ri Medieval V9'))return;
    brandingCharacters.lastIndex=0;
    const fragment=document.createDocumentFragment();
    let cursor=0;
    for(const match of text.matchAll(brandingCharacters)){
      if(match.index>cursor)fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const span=document.createElement('span');
      span.dataset.fontPunctuation='';span.textContent=match[0];
      span.style.setProperty('font-family','Georgia, serif','important');
      span.style.setProperty('font-weight','400','important');
      span.style.setProperty('font-style','normal','important');
      span.style.setProperty('font-size','inherit','important');
      span.style.setProperty('display','inline','important');
      span.style.setProperty('vertical-align','baseline','important');
      span.style.setProperty('margin','0','important');
      span.style.setProperty('color','inherit','important');
      fragment.append(span);cursor=match.index+match[0].length;
    }
    if(cursor<text.length)fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function repair(root){
    if(root.nodeType===Node.TEXT_NODE){repairText(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||root.closest(skip))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(repairText);
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')repairText(record.target);
      else record.addedNodes.forEach(repair);
    }
  });
  repair(document.body);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  // A world switch also changes the inherited title face on existing text.
  addEventListener('ri:atmosphere',()=>repair(document.getElementById('experience')));
})();

;
/* source: shatserak-shadows-v25.js */
/* Decorative shadow planes only. Content, routing and world data stay untouched. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ids=['world-view','story','books','night-lake','bonus','contacts'];
  const seams=new Set(['story','night-lake','bonus','contacts']);
  const nodes=ids.map(id=>document.getElementById(id)).filter(node=>node&&!node.querySelector('harstok-library'));
  nodes.forEach(node=>{
    const layer=document.createElement('div');layer.className='s25-shadows';layer.setAttribute('aria-hidden','true');
    const penumbra=document.createElement('span');penumbra.className='s25-penumbra';layer.append(penumbra);
    if(seams.has(node.id)){const edge=document.createElement('span');edge.className='s25-transition';layer.append(edge);}
    node.append(layer);
  });
  let pending=false;
  const near=new Set();
  const enabled=()=>document.body.dataset.world==='shatserak'&&!document.body.classList.contains('still')&&!reduced.matches&&!document.hidden;
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)near.add(entry.target);else near.delete(entry.target);});schedule();
  },{rootMargin:'100px 0px'});
  nodes.forEach(node=>observer.observe(node));
  function update(){
    pending=false;
    if(!enabled())return;
    near.forEach(node=>{
      const r=node.getBoundingClientRect();const p=Math.max(-1,Math.min(1,(innerHeight*.5-r.top)/(r.height+innerHeight)));
      const direction=nodes.indexOf(node)%2?1:-1;
      node.style.setProperty('--s25-x',(p*10*direction).toFixed(2)+'px');
      node.style.setProperty('--s25-y',(p*15).toFixed(2)+'px');
      node.style.setProperty('--s25-edge-x',(p*16*direction).toFixed(2)+'px');
      node.style.setProperty('--s25-edge-y',(p*-20).toFixed(2)+'px');
    });
  }
  function schedule(){if(!pending&&enabled()){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  addEventListener('ri:atmosphere',schedule);addEventListener('ri:effects',schedule);
  reduced.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);schedule();
})();

;
/* source: lake-dream-v42.js */
/* A reversible scroll-bound passage from the lake into Harstok. */
(() => {
  'use strict';
  const lake=document.getElementById('night-lake');
  const library=document.getElementById('bonus');
  if(!lake||!library||lake.querySelector('.s42-lake-frame'))return;
  const frame=document.createElement('div');frame.className='s42-lake-frame';
  [...lake.children].filter(node=>!node.classList.contains('s25-shadows')).forEach(node=>frame.append(node));
  lake.prepend(frame);
  const shadows=document.createElement('div');shadows.className='s42-dream-shadows';shadows.setAttribute('aria-hidden','true');
  ['far','middle','near','night'].forEach(name=>{const plane=document.createElement('span');plane.className='s42-dream-'+name;shadows.append(plane);});
  frame.append(shadows);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=(from,to,value)=>{const p=clamp((value-from)/(to-from));return p*p*(3-2*p);};
  let pending=false,active=false,lastHeader=0,lastState='';
  const canAnimate=()=>document.body.dataset.world==='shatserak'&&!document.body.classList.contains('still')&&!reduced.matches;
  function update(){
    pending=false;
    const enabled=canAnimate();
    if(enabled!==active){active=enabled;lake.classList.toggle('s42-dream-active',active);}
    if(!active){lake.dataset.dreamProgress='0';lastState='';return;}
    const header=document.querySelector('.header').getBoundingClientRect().height;
    if(header!==lastHeader){lastHeader=header;lake.style.setProperty('--s42-header',header+'px');}
    const r=lake.getBoundingClientRect(),height=Math.max(1,innerHeight-header);
    const style=getComputedStyle(lake),run=parseFloat(style.getPropertyValue('--s42-run'))||height;
    const entry=parseFloat(style.getPropertyValue('--s42-entry'))||240;
    // Respond on the first short scroll, while keeping the complete passage length.
    const travel=header-r.top,start=height*.025,p=clamp((travel-start)/(run+entry*.45-start));
    const far=ease(0,.68,p);
    const middle=.25*clamp(p/.88)+.75*ease(0,.88,p),near=ease(.20,1,p);
    const arrival=clamp((r.top-header)/(innerHeight*.6))*Math.min(400,innerHeight*.5);
    const state=[p.toFixed(5),arrival.toFixed(1),innerWidth,innerHeight].join(':');
    if(state===lastState)return;
    lastState=state;
    lake.dataset.dreamProgress=p.toFixed(3);
    lake.style.setProperty('--s42-arrival',arrival.toFixed(1)+'px');
    lake.style.setProperty('--s42-far-opacity',(far*.82).toFixed(4));
    lake.style.setProperty('--s42-far-y',(28-far*60).toFixed(2)+'%');
    lake.style.setProperty('--s42-middle-opacity',(middle*.62).toFixed(4));
    lake.style.setProperty('--s42-middle-x',(-18+middle*20).toFixed(2)+'%');
    lake.style.setProperty('--s42-middle-y',(22-middle*92).toFixed(2)+'%');
    lake.style.setProperty('--s42-near-opacity',(near*.78).toFixed(4));
    lake.style.setProperty('--s42-near-x',(22-near*23).toFixed(2)+'%');
    lake.style.setProperty('--s42-near-y',(90-near*155).toFixed(2)+'%');
    lake.style.setProperty('--s42-night-opacity',(ease(.82,1,p)*.97).toFixed(4));
    lake.style.setProperty('--s42-copy-opacity',(1-ease(.33,.78,p)).toFixed(4));
    lake.style.setProperty('--s42-photo-scale',(1+ease(0,1,p)*.022).toFixed(5));
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('ri:atmosphere',schedule);addEventListener('ri:effects',schedule);
  reduced.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  document.fonts.ready.then(schedule);update();
  // Settle only the initial anchor, after offline fonts and book art have loaded.
  // Any reader input cancels this adjustment; ordinary scrolling is never moved.
  const initialHash=location.hash;
  const initialTarget=initialHash==='#shatserak/night-lake'?lake:initialHash==='#shatserak/bonus'?library:null;
  if(initialTarget){
    let interacted=false;
    const inputs=['wheel','touchstart','pointerdown','keydown'];
    const mark=()=>{interacted=true;};
    inputs.forEach(type=>addEventListener(type,mark,{passive:true,once:true}));
    async function settle(){
      await document.fonts.ready;
      requestAnimationFrame(()=>{
        const bookTarget=initialHash==='#shatserak/bonus'&&initialTarget.querySelector('harstok-library');if(!interacted&&(active||bookTarget)&&location.hash===initialHash){if(bookTarget)window.RiWorlds.navigate('bonus',{push:false,animate:false});else initialTarget.scrollIntoView({behavior:'instant',block:'start'});schedule();}
        inputs.forEach(type=>removeEventListener(type,mark));
      });
    }
    if(document.readyState==='complete')settle();else addEventListener('load',settle,{once:true});
  }
})();

;
/* source: bw-shot-v80.js */
/* V83: one shot per scroll visit, rearmed after the gun fully leaves the screen. */
(() => {
 'use strict';
 const stage=document.querySelector('#merch>.bw-shot-v80');
 if(!stage)return;
 const gun=stage.querySelector('.bw-five-seven'),image=gun.querySelector('img');
 const muzzle=stage.querySelector('.bw-shot-muzzle-v80');
 const projectile=stage.querySelector('.bw-shot-projectile-v80');
 const flash=stage.querySelector('.bw-shot-flash-v80');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let state='armed',scrollSeen=false,tracking=false,previousY=scrollY,earlyIntent=false,earlyScroll=false;
 let timer=0,frame=0,measureFrame=0,shots=0,visible=false,stopFlight=()=>{};
 stage.dataset.shots='0';
 const allowed=()=>document.body.dataset.world==='bw'&&!document.body.classList.contains('still')&&!reduced.matches&&!document.hidden&&!document.querySelector('dialog[open]');
 const clear=()=>{clearTimeout(timer);timer=0;};
 function view(){
  const rect=gun.getBoundingClientRect();
  const rendered=rect.width>0&&rect.height>0&&document.body.dataset.world==='bw';
  const top=Math.max(88,document.querySelector('.header')?.getBoundingClientRect().bottom||0)+8;
  const height=Math.max(0,Math.min(rect.bottom,innerHeight-32)-Math.max(rect.top,top));
  return {rendered,ratio:rendered?height/rect.height:0,outside:rendered&&(rect.bottom < -48 || rect.top > innerHeight+48)};
 }
 function cancelPending(){
  clear();if(state==='pending'){state='armed';stage.dataset.shot='waiting';}
 }
 function measure(){
  measureFrame=0;
  const current=view();visible=current.rendered&&current.ratio>=.35;
  if(current.outside){
   stopFlight();
   if(state!=='armed'){
    clear();state='armed';scrollSeen=false;stage.dataset.shot='waiting';
   }
   return;
  }
  if(!current.rendered||!allowed()){
   cancelPending();stopFlight();return;
  }
  if(state==='firing'){if(!visible)stopFlight();return;}
  if(current.ratio<.65){cancelPending();return;}
  if(state==='armed'&&tracking&&scrollSeen&&image.complete&&image.naturalWidth>0){
   state='pending';stage.dataset.shot='pending';
   // Continued scrolling does not postpone the shot indefinitely.
   timer=setTimeout(fire,400);
  }
 }
 function schedule(){if(!measureFrame)measureFrame=requestAnimationFrame(measure);}
 function fire(){
  timer=0;if(state!=='pending')return;
  const current=view();
  if(!tracking||!scrollSeen||!allowed()||!current.rendered||current.ratio<.65||!image.complete||!image.naturalWidth){
   state='armed';stage.dataset.shot='waiting';schedule();return;
  }
  const s=stage.getBoundingClientRect(),m=muzzle.getBoundingClientRect();
  const start={x:m.left-s.left+.5,y:m.top-s.top+.5};
  const end={x:-35,y:start.y+(start.x+35)*Math.tan(4*Math.PI/180)};
  state='firing';stage.dataset.shot='firing';stage.dataset.shots=String(++shots);
  stage.dataset.trajectory=JSON.stringify({start,end,stageWidth:s.width,stageHeight:s.height});
  const duration=760,t0=performance.now();
  flash.style.left=start.x+'px';flash.style.top=start.y+'px';
  const recoil=gun.animate([
   {transform:'rotate(-4deg)'},
   {transform:'translate(5px,-2px) rotate(-1.8deg)',offset:.16},
   {transform:'translate(1px,0) rotate(-4.3deg)',offset:.62},
   {transform:'rotate(-4deg)'}
  ],{duration:290,easing:'cubic-bezier(.2,.7,.3,1)'});
  function tick(now){
   const p=Math.min(1,(now-t0)/duration);
   if(!allowed()||!visible){recoil.cancel();finish();return;}
   const x=start.x+(end.x-start.x)*p,y=start.y+(end.y-start.y)*p;
   projectile.style.transform=`translate(${x}px,${y-6}px) rotate(-4deg)`;
   projectile.style.opacity=String(Math.min(1,p/.025,(1-p)/.13));
   flash.style.opacity=p<.14?String((1-p/.14)*.65):'0';
   if(p<1)frame=requestAnimationFrame(tick);else finish();
  }
  function finish(){
   cancelAnimationFrame(frame);recoil.cancel();projectile.style.opacity='0';flash.style.opacity='0';
   state='spent';stage.dataset.shot='complete';stopFlight=()=>{};
  }
  stopFlight=finish;
  frame=requestAnimationFrame(tick);
 }
 const observer=new IntersectionObserver(schedule,{threshold:[0,.35,.65,1],rootMargin:'-96px 0px -32px 0px'});
 observer.observe(gun);
 // Preserve real interaction during a slow first load without counting restoration.
 const earlyInput=event=>{if(event.isTrusted)earlyIntent=true;};
 const earlyKey=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))earlyInput(event);};
 ['wheel','touchmove','pointerdown'].forEach(type=>addEventListener(type,earlyInput,{passive:true}));
 addEventListener('keydown',earlyKey);
 addEventListener('scroll',()=>{
  if(tracking&&Math.abs(scrollY-previousY)>.5)scrollSeen=true;
  else if(earlyIntent&&Math.abs(scrollY-previousY)>.5)earlyScroll=true;
  previousY=scrollY;schedule();
 },{passive:true});
 addEventListener('resize',()=>{stopFlight();cancelPending();schedule();},{passive:true});
 addEventListener('ri:atmosphere',schedule);
 addEventListener('ri:effects',schedule);
 document.addEventListener('close',schedule,true);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',schedule);
 image.addEventListener('load',schedule,{once:true});
 // Initial route/font scroll restoration must not spend the first shot.
 const loaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>addEventListener('load',resolve,{once:true}));
 Promise.all([loaded,document.fonts.ready]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
  previousY=scrollY;scrollSeen=earlyScroll;tracking=true;
  ['wheel','touchmove','pointerdown'].forEach(type=>removeEventListener(type,earlyInput));
  removeEventListener('keydown',earlyKey);schedule();
 })));
})();

;
/* source: world-entry-v84.js */
/* V84: decorate an explicit world choice; never intercept or delay navigation. */
(() => {
 'use strict';
 let initialized=false;
 function initialize(){
  if(initialized||document.readyState==='loading')return;
  initialized=true;document.removeEventListener('readystatechange',initialize);
  if(!document.body.matches('.cinema.two-worlds')||!document.getElementById('home'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const overlay=document.createElement('div');
  overlay.className='world-entry-v84';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
  overlay.innerHTML='<span class="world-entry-v84__beam"></span><span class="world-entry-v84__shadow"></span>';
  document.body.append(overlay);
  let choice=null,cleanupTimer=0,startFrame=0;
  const allowed=()=>!reduced.matches&&!document.hidden&&!document.body.classList.contains('still');
  function finish(){
   clearTimeout(cleanupTimer);cancelAnimationFrame(startFrame);cleanupTimer=0;startFrame=0;
   delete overlay.dataset.active;delete overlay.dataset.world;
  }
  function play(world){
   finish();if(!allowed())return;
   // One fresh frame also restarts the accent if the visitor changes worlds quickly.
   startFrame=requestAnimationFrame(()=>{
    startFrame=0;
    if(!allowed()||document.body.dataset.world!==world)return;
    overlay.dataset.world=world;overlay.dataset.active='true';
    cleanupTimer=setTimeout(finish,760);
   });
  }
  document.addEventListener('click',event=>{
   if(!event.isTrusted||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const control=event.target instanceof Element?event.target.closest('[data-enter-world]'):null;
   if(!control||!control.closest('#home,#world-switch-dialog'))return;
   const world=control.dataset.enterWorld;
   if(world!=='bw'&&world!=='shatserak')return;
   choice={world,time:performance.now()};
  },true);
  addEventListener('ri:atmosphere',event=>{
   const selected=choice;choice=null;
   if(event.detail!=='bw'&&event.detail!=='shatserak'){finish();return;}
   if(!selected||selected.world!==event.detail||performance.now()-selected.time>1000){finish();return;}
   play(selected.world);
  });
  overlay.addEventListener('animationend',finish);
  addEventListener('ri:effects',()=>{if(!allowed())finish();});
  addEventListener('resize',finish,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){choice=null;finish();}});
  reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
 }
 if(document.readyState==='loading')document.addEventListener('readystatechange',initialize);
 else initialize();
})();

;
/* source: bw-collector-v84.js */
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

;
/* source: library-refinement-v84.js */
/* A local Harstok refinement. Routing, lake-dream and the spoiler gate stay owned
   by their existing modules. Every enhancement has an immediate static fallback. */
(() => {
  'use strict';
  const library = document.getElementById('bonus');
  const contacts = document.getElementById('contacts');
  const dialog = document.getElementById('bonus-dialog');
  if (!library || !contacts || !dialog || library.dataset.refinementV84 || library.querySelector('harstok-library')) return;
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

;
/* source: archive-book-v87.js */
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

;
/* source: light-sheet-v87.js */
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

;
/* source: shatserak-qa-table.js */
(() => {
  'use strict';
  const section = document.getElementById('questions');
  if (!section) return;

  const table = section.querySelector('.sqa-table');
  const bowl = table.querySelector('.sqa-bowl');
  const note = table.querySelector('#sqa-featured');
  const title = note.querySelector('.sqa-featured-title');
  const topic = note.querySelector('.sqa-featured-topic');
  const answer = note.querySelector('.sqa-answer');
  const search = section.querySelector('#sqa-search');
  const empty = section.querySelector('.sqa-empty');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = [...section.querySelectorAll('.sqa-group')].map(node => ({
    node,
    title: node.querySelector('h3').textContent,
    items: [...node.querySelectorAll('li')]
  }));
  const questions = groups.flatMap(group => group.items.map(item => ({
    title: item.querySelector('h4').textContent,
    topic: group.title,
    url: item.querySelector('a').href
  })));
  let index = Math.floor(Math.random() * questions.length);
  let animationTimer;

  function stopMotion() {
    clearTimeout(animationTimer);
    table.classList.remove('is-picking');
  }

  function showQuestion() {
    stopMotion();
    if (!reduce.matches && !document.body.classList.contains('still')) {
      // Restart the short physical gesture if another question is picked.
      void table.offsetWidth;
      table.classList.add('is-picking');
      animationTimer = setTimeout(stopMotion, 760);
    }
    const question = questions[index];
    topic.textContent = question.topic;
    title.textContent = question.title;
    answer.href = question.url;
    note.hidden = false;
    table.dataset.open = 'true';
    bowl.setAttribute('aria-expanded', 'true');
    index = (index + 1) % questions.length;
  }

  bowl.addEventListener('click', showQuestion);
  note.querySelector('.sqa-next').addEventListener('click', showQuestion);
  note.querySelector('.sqa-hide').addEventListener('click', () => {
    stopMotion();
    note.hidden = true;
    table.dataset.open = 'false';
    bowl.setAttribute('aria-expanded', 'false');
    bowl.focus({preventScroll: true});
  });

  const normalize = text => text.toLocaleLowerCase('ru').replace(/ё/g, 'е');
  search.addEventListener('input', () => {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let found = 0;
    for (const group of groups) {
      let matches = 0;
      for (const item of group.items) {
        const text = normalize(group.title + ' ' + item.querySelector('h4').textContent);
        item.hidden = !terms.every(term => text.includes(term));
        if (!item.hidden) matches++;
      }
      group.node.hidden = matches === 0;
      found += matches;
    }
    empty.hidden = found > 0;
  });
})();
