/* Load off-screen illustration bytes before their scenes enter the viewport.
   Image resolution, decoded pixels and every existing animation stay unchanged. */
(() => {
  'use strict';
  const groups = [
    {world:'bw', section:'bonus', images:['p35-horde-atlas','p33-switch-atlas'],
      background:{id:'bw-bonus-lamp',property:'--ri-parking-image-v101',src:'assets/performance-v101/bw-v17/parking-night.webp'}},
    {world:'bw', section:'story',
      background:{id:'story',property:'--ri-forest-image-v101',src:'assets/bw-v88/grey-forest.jpg'}},
    {world:'bw', section:'author-qa',
      background:{id:'author-qa',property:'--ri-radio-image-v101',src:'assets/performance-v101/bw-v31/jeep-radio.webp'}},
    {world:'shatserak', section:'story', portrait:true}
  ];
  let frame=0;
  const embeddedURLs=new Map();
  function backgroundURL(src){
    // Chromium limits the size of custom properties. The standalone file can
    // embed >2 MB data URLs, so keep those exact bytes behind a short blob URL.
    if(!src.startsWith('data:'))return src;
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
    return rect.height>0 && rect.bottom>=-margin && rect.top<=innerHeight+margin;
  }
  function hydrate(group) {
    if(group.loaded)return;
    group.loaded=true;
    if(group.background){
      const item=group.background,node=document.getElementById(item.id);
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
    const world=document.body.dataset.world;
    groups.forEach(group=>{
      if(group.world===world && (force || near(document.getElementById(group.section))))hydrate(group);
    });
    document.querySelectorAll('img[data-ri-deferred]').forEach(image=>{
      if(image.dataset.riWorld!==world || (!force && !near(image.closest('section'))))return;
      image.decoding='async';
      image.src=image.dataset.riDeferred;
      delete image.dataset.riDeferred;
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>update());}
  addEventListener('ri:atmosphere',schedule);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  addEventListener('beforeprint',()=>update(true));
  document.fonts.ready.then(schedule);
  schedule();
})();
