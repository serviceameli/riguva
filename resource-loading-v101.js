/* Warm the selected world's original images before their scenes are reached.
   Visible images take priority; remaining bytes use two background requests. */
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
  const backgroundConcurrency = 2;
  let backgroundCount = 0;
  let frame = 0;
  let ready = document.readyState !== 'loading';
  let layoutSettled = false;
  let backgroundReady = false;
  let printing = false;
  let lastY = scrollY;
  let direction = 1;
  let rendered = new WeakMap();
  let releaseTimer;

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
    // A source-less image can have zero height. Use its first real layout box,
    // but only after checking its ancestors, so a hidden desktop/mobile variant
    // cannot accidentally borrow the visible section's bounds.
    for (let parent = node; parent && parent !== document.body; parent = parent.parentElement) {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    return null;
  }

  function sourceFor(image, force) {
    const deferred = image.dataset.riDeferred;
    const variant = imageSets[image.dataset.riImageSet];
    if (!variant) {
      return {src:deferred || image.currentSrc || image.getAttribute('src'),
        base:deferred ? assetBase : document.baseURI};
    }
    if (!image.dataset.riMaster) {
      const master = deferred || image.getAttribute('src') || image.currentSrc;
      if (!master) return null;
      // Keep the full-resolution URL/URI after data-ri-deferred is consumed.
      image.dataset.riMaster = new URL(master, deferred ? assetBase : document.baseURI).href;
    }
    // Sprite width includes both states. Compare that full rendered strip to
    // its raster width so each state retains enough pixels on Retina screens.
    const width = image.getBoundingClientRect().width;
    const requiredWidth = width * (globalThis.devicePixelRatio || 1);
    return !force && width > 0 && requiredWidth <= variant.width
      ? {src:variant.src,base:assetBase}
      : {src:image.dataset.riMaster,base:assetBase};
  }

  function rank(rect, force, early) {
    if (force || (rect.bottom >= 0 && rect.top <= innerHeight)) return {priority:0,distance:0};
    if (!backgroundReady) return null;
    if (early) return {priority:1,distance:-1};
    const ahead = innerHeight * 3;
    const behind = innerHeight;
    const top = direction > 0 ? -behind : -ahead;
    const bottom = innerHeight + (direction > 0 ? ahead : behind);
    const nearby = rect.bottom >= top && rect.top <= bottom;
    const distance = rect.top > innerHeight ? rect.top - innerHeight : -rect.bottom;
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
    const image = target.node;
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
    if (task.backgroundSlot) backgroundCount--;
    task.preloader.onload = task.preloader.onerror = null;
    task.preloader = null;
    // Rebuild eligibility before starting another task. A completed old-world
    // request must never release stale queued work after a world switch.
    schedule();
  }

  function start(task, urgent) {
    task.status = 'running';
    task.backgroundSlot = !urgent;
    if (task.backgroundSlot) backgroundCount++;
    const image = new Image();
    task.preloader = image;
    image.decoding = 'async';
    image.fetchPriority = urgent ? 'high' : 'low';
    image.onload = () => finish(task, true);
    image.onerror = () => finish(task, false);
    // Image requests work with connect-src 'none'; no fetch/XHR is used here.
    image.src = task.css ? backgroundURL(task.src) : task.src;
    applyTargets(task);
    if (image.complete && image.naturalWidth > 0) finish(task, true);
  }

  function register(src, target, rect, force, base = assetBase) {
    if (!src || !rect) return;
    // A small explicitly marked decoration may lead the background queue even
    // when its section is distant. It still waits for the first viewport.
    const early = !target.property && !!target.node.closest('[data-ri-preload="early"]');
    const order = rank(rect, force, early);
    if (!order) return;
    const url = new URL(src, base).href;
    let task = tasks.get(url);
    if (!task) {
      task = {src:url,status:'queued',priority:Infinity,distance:Infinity,targets:[],css:false,preloader:null};
      tasks.set(url, task);
    }
    task.priority = Math.min(task.priority, order.priority);
    task.distance = Math.min(task.distance, order.distance);
    task.targets.push(target);
    task.css ||= !!target.property;
    // Native product images may already be in the browser cache. Track that
    // completion rather than creating a second request for the same URL.
    const current = !target.property && target.node.currentSrc;
    const currentURL = current ? new URL(current, document.baseURI).href : null;
    if (task.status === 'queued' && !target.property && target.node.complete && target.node.naturalWidth > 0 && !target.deferred && currentURL === url) {
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
    // Every event rebuilds the queue's eligible targets. Completed resources
    // remain cached by URL, but hidden/other-world queued work loses its place.
    tasks.forEach(task => {
      task.priority = Infinity;
      task.distance = Infinity;
      task.targets = [];
    });

    groups.forEach(group => {
      if (group.world && group.world !== world) return;
      const bounds = document.querySelector(group.bounds);
      const rect = boundsFor(bounds);
      if (group.background) {
        const item = group.background;
        const node = item.selector ? document.querySelector(item.selector) : document.getElementById(item.id);
        if (isRendered(node)) register(item.src, {node,property:item.property}, rect, force);
      }
      if (group.portrait) {
        document.querySelectorAll('img[data-ri-portrait]').forEach(node => {
          if (isRendered(node)) register(node.dataset.riPortrait, {node}, rect, force);
        });
      }
    });

    document.querySelectorAll('img[data-ri-deferred],img[src]').forEach(node => {
      if (!belongsToWorld(node, world)) return;
      const source = sourceFor(node, force);
      if (source) register(source.src, {node,deferred:!!node.dataset.riDeferred}, boundsFor(node), force, source.base);
    });

    const eligible = [...tasks.values()].filter(task => task.targets.length)
      .sort((a,b) => a.priority - b.priority || a.distance - b.distance);
    eligible.forEach(task => {
      if (task.status === 'loaded' || task.status === 'error') applyTargets(task);
      else if (task.status === 'running') {
        if (task.priority === 0) task.preloader.fetchPriority = 'high';
        applyTargets(task);
      } else if (task.priority === 0) {
        // A sudden fast scroll must not wait for two off-screen downloads.
        start(task, true);
      }
    });
    if (backgroundReady || force) {
      for (const task of eligible) {
        if (backgroundCount >= backgroundConcurrency) break;
        if (task.status === 'queued') start(task, false);
      }
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
    schedule();
  }, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  addEventListener('hashchange', schedule);
  addEventListener('pageshow', schedule);
  addEventListener('beforeprint', () => {
    printing = true;
    update(true);
  });
  addEventListener('afterprint', () => {
    printing = false;
    schedule();
  });
  if (ready) initialize();
  else document.addEventListener('DOMContentLoaded', initialize, {once:true});
})();
