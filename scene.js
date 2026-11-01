/* Detailed cover-inspired illustrations. Subtle movement, shared clock. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const images = {
    bw: {src:'assets/scenes/bw-detailed-v6.webp'},
    shatserak: {src:'assets/scenes/shatserak-detailed-v6.webp'}
  };
  const worlds = {
    'black-white': {image:'bw',focal:.76},
    'grey-forest': {image:'bw',focal:.79},
    shata: {image:'shatserak',focal:.69}
  };
  const instances = new Set();
  const dialogs = [...document.querySelectorAll('dialog')];
  const hasOpenDialog = () => dialogs.some(dialog=>dialog.open);
  let modalOpen = hasOpenDialog();
  let frame = 0, lastPaint = 0, domSettled=document.readyState==='complete';
  function schedule() {
    if(frame || document.hidden || hasOpenDialog() || ![...instances].some(s=>s.active()&&s.animated()))return;
    frame=requestAnimationFrame(tick);
  }
  function tick(time) {
    frame=0;
    if(document.hidden || hasOpenDialog())return;
    if(time-lastPaint>1000/30){instances.forEach(s=>{if(s.active()&&s.animated())s.paint(time);});lastPaint=time;}
    schedule();
  }
  const dialogObserver = new MutationObserver(() => {
    const next = hasOpenDialog();
    if(next === modalOpen)return;
    modalOpen = next;
    if(modalOpen){cancelAnimationFrame(frame);frame=0;return;}
    instances.forEach(instance=>instance.refresh());
    schedule();
  });
  dialogs.forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
  Object.values(images).forEach(entry=>{
    entry.image=new Image();entry.image.decoding='async';
    entry.image.onload=()=>{entry.ready=true;instances.forEach(s=>s.refresh());schedule();};
  });
  function requestImage(id,owner,bounds){
    if(!domSettled)return;
    const entry=images[worlds[id].image];
    if(window.RiImageLoading){window.RiImageLoading.request(entry.image,entry.src,{owner,bounds,world:worlds[id].image});return;}
    if(entry.requested)return;
    entry.requested=true;entry.image.fetchPriority='high';entry.image.src=entry.src;
  }
  function create(canvas, initial, main=false) {
    if(!canvas)return null;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
    const stage=canvas.closest(main?'.cinema-stage':'.portal-scene')||canvas.parentElement;
    const imageBounds=main?document.getElementById('world-view'):stage;
    const hoverStage=canvas.closest('.world-portal')||document.getElementById('experience')||stage;
    let world=initial, previous=null, changed=0, width=0,height=0,dpr=1,visible=false;
    let x=0,y=0,targetX=0,targetY=0,enabled=!document.body.classList.contains('still');
    const active=()=>visible&&width>0&&height>0&&!document.hidden&&!hasOpenDialog();
    const animated=()=>enabled&&!reduced.matches&&images[worlds[world].image].ready;
    function resize(){
      if(document.hidden || hasOpenDialog())return;
      const r=stage.getBoundingClientRect();width=r.width;height=r.height;
      if(!width||!height)return;
      dpr=Math.min(devicePixelRatio||1,main?1.5:1.2);
      const w=Math.round(width*dpr),h=Math.round(height*dpr);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      paint(performance.now());schedule();
    }
    function draw(id,alpha,time){
      const config=worlds[id],entry=images[config.image];if(!entry.ready||!alpha)return;
      const photo=entry.image;
      const motion=enabled&&!reduced.matches;
      const zoom=1.055+(motion?Math.sin(time/15000)*.012:0);
      const fit=Math.max(width/photo.naturalWidth,height/photo.naturalHeight)*zoom;
      const w=photo.naturalWidth*fit,h=photo.naturalHeight*fit;
      const focal=main&&width/height>1.2?.5:config.focal;
      const px=(width-w)*focal+(motion?x*7:0);
      const py=(height-h)*.5+(motion?y*5:0);
      ctx.globalAlpha=alpha;ctx.drawImage(photo,px,py,w,h);ctx.globalAlpha=1;
    }
    function paint(time=performance.now()){
      if(document.hidden || hasOpenDialog() || !width || !height)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080808';ctx.fillRect(0,0,width,height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      x+=(targetX-x)*.035;y+=(targetY-y)*.035;
      let mix=previous&&animated()&&active()?Math.min(1,(time-changed)/1000):1;
      if(previous&&mix<1)draw(previous,1,time);else previous=null;
      draw(world,mix,time);
    }
    const api={active,animated,paint,
      setWorld(id){if(!worlds[id]||id===world)return;previous=world;world=id;if(visible)requestImage(world,canvas,imageBounds);changed=performance.now();resize();schedule();},
      setEffects(value){enabled=!!value;if(!enabled){x=y=targetX=targetY=0;previous=null;}paint();schedule();},
      refresh(){if(visible)requestImage(world,canvas,imageBounds);resize();}
    };
    instances.add(api);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){requestImage(world,canvas,imageBounds);resize();schedule();}},{threshold:.01});observer.observe(stage);
    new ResizeObserver(resize).observe(stage);
    hoverStage.addEventListener('pointermove',event=>{if(!enabled||reduced.matches)return;const r=hoverStage.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;schedule();},{passive:true});
    hoverStage.addEventListener('pointerleave',()=>{targetX=targetY=0;},{passive:true});
    addEventListener('ri:effects',event=>api.setEffects(event.detail));
    if(main)addEventListener('ri:world',event=>api.setWorld(event.detail));
    resize();return api;
  }
  const main=create(document.getElementById('world-canvas'),'black-white',true);
  if(main)window.RiScene=main;
  document.querySelectorAll('.portal-canvas').forEach(canvas=>create(canvas,canvas.dataset.previewWorld||'black-white'));
  document.addEventListener('DOMContentLoaded',()=>{domSettled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>instances.forEach(s=>s.refresh())));},{once:true});
  reduced.addEventListener('change',()=>{instances.forEach(s=>s.refresh());schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{instances.forEach(s=>s.refresh());schedule();}});
})();
