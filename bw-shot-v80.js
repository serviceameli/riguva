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
