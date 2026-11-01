/* Load off-screen illustration bytes before their scenes enter the viewport.
   Image resolution, decoded pixels and every existing animation stay unchanged. */
(() => {
  'use strict';
  const groups = [
    {world:'bw', section:'bonus', bounds:'#bw-bonus-lamp', images:['p35-horde-atlas','p33-switch-atlas'],
      background:{id:'bw-bonus-lamp',property:'--ri-parking-image-v101',src:'assets/performance-v101/bw-v17/parking-night.webp'}},
    {world:'bw', section:'story',
      background:{id:'story',property:'--ri-forest-image-v101',src:'assets/bw-v88/grey-forest.jpg'}},
    {world:'bw', section:'author-qa',
      background:{id:'author-qa',property:'--ri-radio-image-v101',src:'assets/performance-v101/bw-v31/jeep-radio.webp'}},
    {world:'shatserak', section:'story', portrait:true},
    {selector:'.author-next-worlds', background:{selector:'.author-next-world[href$="#world-black-white"]',property:'--ri-author-bw-v108',src:'assets/performance-v101/bw-v17/parking-night.webp'}},
    {selector:'.author-next-worlds', background:{selector:'.author-next-world[href$="#world-shatserak"]',property:'--ri-author-shatserak-v108',src:'assets/shatserak-v23/hood-portrait-cutout.png'}}
  ];
  let frame=0;
  let ready=document.readyState==='complete',lastY=scrollY,direction=1;
  const initialHash=location.hash;
  const anchor=/^#(?:black-white|shatserak)\/([a-z-]+)$/.exec(initialHash);
  const initialSection=anchor?anchor[1]:/^#world-(?:black-white|shatserak)$/.test(initialHash)?'world-view':!initialHash||initialHash==='#home'?'home':initialHash==='#contacts'?'contacts':null;
  let anchorLocked=document.body.classList.contains('two-worlds')&&!!initialSection;
  function allowed(section,force){
    if(location.hash!==initialHash)anchorLocked=false;
    return force||!anchorLocked||section?.id===initialSection;
  }
  const assetBase=document.currentScript?.src||location.href;
  const embeddedURLs=new Map();
  function backgroundURL(src){
    // Chromium limits the size of custom properties. The standalone file can
    // embed >2 MB data URLs, so keep those exact bytes behind a short blob URL.
    if(!src.startsWith('data:'))return new URL(src,assetBase).href;
    if(embeddedURLs.has(src))return embeddedURLs.get(src);
    const split=src.indexOf(','),header=src.slice(0,split),encoded=src.slice(split+1);
    const binary=atob(encoded),bytes=new Uint8Array(binary.length);
    for(let n=0;n<binary.length;n++)bytes[n]=binary.charCodeAt(n);
    const url=URL.createObjectURL(new Blob([bytes],{type:header.slice(5).split(';')[0]}));
    embeddedURLs.set(src,url);
    return url;
  }
  function near(node) {
    if(!node || node.hidden || !node.getClientRects().length)return false;
    const rect=node.getBoundingClientRect();
    const margin=Math.max(400,Math.min(800,innerHeight*.5));
    const header=document.querySelector('.header,.author-header')?.getBoundingClientRect().bottom||0;
    return rect.height>0 && rect.bottom>=(direction<0?-margin:header+32) && rect.top<=innerHeight+margin;
  }
  function hydrate(group) {
    if(group.loaded)return;
    group.loaded=true;
    if(group.background){
      const item=group.background,node=item.selector?document.querySelector(item.selector):document.getElementById(item.id);
      node?.style.setProperty(item.property,'url("'+backgroundURL(item.src)+'")');
    }
    (group.images||[]).forEach(id=>{
      const image=document.getElementById(id),src=image?.dataset.riImage;
      if(!src)return;
      image.setAttribute('href',src);
      image.setAttributeNS('http://www.w3.org/1999/xlink','href',src);
    });
    if(group.portrait){
      document.querySelectorAll('img[data-ri-portrait]').forEach(image=>{
        image.decoding='async';
        image.src=image.dataset.riPortrait;
      });
    }
  }
  function update(force=false) {
    frame=0;
    if(!ready)return;
    const world=document.body.dataset.world;
    groups.forEach(group=>{
      const section=group.bounds?document.querySelector(group.bounds):group.selector?document.querySelector(group.selector):document.getElementById(group.section);
      if((!group.world || group.world===world) && allowed(document.getElementById(group.section),force) && (force || near(section)))hydrate(group);
    });
    document.querySelectorAll('img[data-ri-deferred]').forEach(image=>{
      const bounds=image.getBoundingClientRect().height>0?image:image.closest('figure')||image.closest('section');
      if((image.dataset.riWorld && image.dataset.riWorld!==world) || !allowed(image.closest('section,footer'),force) || (!force && !near(bounds)))return;
      image.decoding='async';
      image.loading='eager';
      image.fetchPriority=bounds.getBoundingClientRect().top<innerHeight?'high':'low';
      image.src=image.dataset.riDeferred;
      delete image.dataset.riDeferred;
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>update());});}
  function unlock(){anchorLocked=false;schedule();}
  ['wheel','touchstart','pointerdown','keydown'].forEach(type=>addEventListener(type,unlock,{once:true,passive:true}));
  addEventListener('ri:atmosphere',schedule);
  addEventListener('scroll',()=>{const y=scrollY;if(Math.abs(y-lastY)>4)direction=y<lastY?-1:1;lastY=y;schedule();},{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  addEventListener('beforeprint',()=>update(true));
  document.fonts.ready.then(schedule);
  document.addEventListener('DOMContentLoaded',()=>{ready=true;schedule();},{once:true});
  schedule();
})();
