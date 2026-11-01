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
        if(!interacted&&active&&location.hash===initialHash){initialTarget.scrollIntoView({behavior:'instant',block:'start'});schedule();}
        inputs.forEach(type=>removeEventListener(type,mark));
      });
    }
    if(document.readyState==='complete')settle();else addEventListener('load',settle,{once:true});
  }
})();
