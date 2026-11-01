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
