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
