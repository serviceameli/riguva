/* Decorative shadow planes only. Content, routing and world data stay untouched. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ids=['world-view','story','books','night-lake','bonus','contacts'];
  const seams=new Set(['story','night-lake','bonus','contacts']);
  const nodes=ids.map(id=>document.getElementById(id)).filter(Boolean);
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
