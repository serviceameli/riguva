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
