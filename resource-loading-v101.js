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
