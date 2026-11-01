/* Two author universes, independent journeys, with content scoped to the selected world. */
(() => {
  'use strict';
  const worlds={
    bw:{name:'Черный Белый',number:'01',hash:'#world-black-white',scene:'black-white',storyScene:'grey-forest',firstBook:'black-white',storyBook:'grey-forest',count:4,genre:'ПОСТАПОКАЛИПСИС',eyebrow:'ЗА СТЕНАМИ СФЕРЫ',title:'<span class="series-name-accessible">Черный Белый</span><img class="bw-series-wordmark" data-ri-deferred="assets/scenes/bw-title-v6.webp" data-ri-world="bw" alt="" aria-hidden="true">',description:'Нам говорили, что за стеной только смерть и голодные твари. Я верила. Но ради брата мне придётся шагнуть туда, куда я боялась даже смотреть.',storyEyebrow:'',storyTitle:'Я предпочитаю<br>черный цвет,<br><em>потому что считаю<br>его самым ярким</em>',storyDescription:''},
    shatserak:{name:'Шацерак',number:'02',hash:'#world-shatserak',scene:'shata',storyScene:'shata',firstBook:'shata',storyBook:'sherka',count:2,genre:'ТЁМНОЕ ФЭНТЕЗИ',eyebrow:'МИР «ШАТЫ» И «ШЕРКИ»',title:'Шацерак',description:'<span class="shatserak-legend-v39">Кто-то считает Бадзун-Гра могущественным колдуном. Кто-то убеждён, что он вероломный бог. Кто-то верит, что раньше он был человеком. Другие называют его отцом Мрака и злейшим существом на всём белом свете.</span><span class="shatserak-reveal-v39">А я его дочь,<br>и это вовсе не сказка.</span>',storyEyebrow:'',storyTitle:'Кто не спит<br>глубокой ночью,',storyDescription:'и не в ужасе от мрака, тот навеки обречен… того утащит Шата.'}
  };
  const el=id=>document.getElementById(id), gate=el('home'),experience=el('experience');
  const paths={bw:'black-white',shatserak:'shatserak'};
  const sections=['world-view','story','field-notes','night-lake','books','bonus','merch','bw-finale','author-qa','contacts'];
  const shared=['books','bonus'];
  const worldDialog=el('world-switch-dialog'),switchButton=el('world-switch-open');
  let active=null,currentScene=null,ticking=false,enabled=true;
  try{localStorage.removeItem('riguva-effects');}catch{}

  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    const section=a.getAttribute('href').slice(1);
    if(sections.includes(section))a.dataset.worldSection=section;
  });
  function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
  function setScene(id){if(currentScene===id)return;currentScene=id;window.dispatchEvent(new CustomEvent('ri:world',{detail:id}));}
  function top(){window.scrollTo({top:0,left:0,behavior:'instant'});}
  function sectionHash(section){return section==='world-view'?worlds[active].hash:'#'+paths[active]+'/'+section;}
  function syncNavigation(hasMerch){
    const destination=active?(active==='bw'?'shatserak':'bw'):null;
    el('world-switch-name').textContent=destination?worlds[destination].name:'Два мира';
    switchButton.title=destination?'Перейти в мир '+worlds[destination].name:'Выбрать мир';
    switchButton.setAttribute('aria-label',switchButton.title);
    switchButton.setAttribute('aria-haspopup','dialog');
    switchButton.setAttribute('aria-controls','world-switch-dialog');
    switchButton.setAttribute('aria-expanded',worldDialog.open?'true':'false');
    document.querySelectorAll('.header .desktop-nav,#search-open,#cart-open,#menu-open').forEach(node=>node.hidden=!active);
    document.querySelectorAll('[data-world-merch]').forEach(node=>node.hidden=!hasMerch);
    document.querySelectorAll('.world-switch-option').forEach(option=>{
      if(option.dataset.enterWorld===active)option.setAttribute('aria-current','page');else option.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-world-section]').forEach(a=>a.href=active?sectionHash(a.dataset.worldSection):'#home');
    const skip=document.querySelector('.skip');skip.href=active?worlds[active].hash:'#home';skip.textContent=active?'К началу мира':'К выбору мира';
  }
  function selectWorld(id,{push=true,scroll=true}={}){
    const w=worlds[id];if(!w)return;
    closeDialogs();active=id;
    try{sessionStorage.setItem('riguva-active-world',id);}catch{}
    document.body.dataset.world=id;document.body.classList.add('world-selected');
    gate.hidden=true;experience.hidden=false;
    shared.forEach(id=>el(id).hidden=false);document.querySelector('.footer').hidden=false;
    el('author-qa').hidden=id!=='bw';
    el('world-genre').textContent='МИР '+w.number+' / '+w.genre;
    el('world-eyebrow').textContent=w.eyebrow;el('hero-title').innerHTML=w.title;el('world-description').innerHTML=w.description;
    el('story-number').textContent=w.number;el('story-label').textContent=w.name.toLocaleUpperCase('ru');
    el('story-eyebrow').textContent='';el('story-title').innerHTML=w.storyTitle;el('story-description').innerHTML=w.storyDescription;
    el('story-next').dataset.worldSection=id==='bw'?'author-qa':'books';
    document.querySelectorAll('.hero .enter-story,.world-hero-footer a').forEach(a=>a.dataset.worldSection=id==='bw'?'books':'story');
    document.querySelector('#books .journey-next[data-atmo-world="bw"] a').dataset.worldSection='bonus';
    const merchNext=document.querySelector('#merch .journey-next a');merchNext.dataset.worldSection='story';merchNext.innerHTML='Дальше <span>↓</span>';
    const qaNext=document.querySelector('#author-qa>.journey-next a');qaNext.dataset.worldSection='contacts';qaNext.innerHTML='История продолжается <span>↓</span>';
    const counts=window.RiCatalog.setWorld(id);
    const order=id==='shatserak'?['world-view','story','books','night-lake','bonus','bw-finale','author-qa','merch']:['world-view','books','bonus','merch','story','author-qa','bw-finale','night-lake'];
    order.forEach(section=>experience.appendChild(el(section)));
    syncNavigation(!!counts.merch);
    currentScene=null;setScene(w.scene);window.RiScene?.refresh();
    if(push&&location.hash!==w.hash)history.pushState({world:id},'',w.hash);
    window.dispatchEvent(new CustomEvent('ri:atmosphere',{detail:id}));
    el('story').classList.add('is-visible');
    if(scroll){top();el('hero-title').setAttribute('tabindex','-1');el('hero-title').focus({preventScroll:true});}
    journey();
  }
  function home({push=true,scroll=true}={}){
    closeDialogs();active=null;
    try{sessionStorage.removeItem('riguva-active-world');}catch{}
    delete document.body.dataset.world;document.body.classList.remove('world-selected','shop-view','scrolled');
    experience.hidden=true;gate.hidden=false;
    shared.forEach(id=>el(id).hidden=true);el('merch').hidden=true;el('author-qa').hidden=true;document.querySelector('.footer').hidden=false;
    window.RiCatalog.setWorld(null);syncNavigation(false);
    window.dispatchEvent(new CustomEvent('ri:atmosphere',{detail:null}));
    if(push&&location.hash!=='#home')history.pushState({world:null},'','#home');
    if(scroll){top();el('gate-title').setAttribute('tabindex','-1');el('gate-title').focus({preventScroll:true});}
    window.RiScene?.refresh();
  }
  function navigate(section,{push=true,scroll=true,animate=push}={}){
    if(section==='author')section='contacts';
    if(section==='field-notes'&&active==='bw')section='books';
    if(!active&&section==='contacts'){
      el('contacts').hidden=false;
      if(push&&location.hash!=='#contacts')history.pushState({world:null},'','#contacts');
      if(scroll)el('contacts').scrollIntoView({behavior:animate&&enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant',block:'start'});
      return section;
    }
    if(!active){home({push,scroll});return;}
    if(section==='worlds'||(section==='bw-finale'&&active==='bw'))section='books';
    if(!sections.includes(section)||el(section)?.hidden||
      (['field-notes','bw-finale','author-qa'].includes(section)&&active!=='bw')||(section==='night-lake'&&active!=='shatserak'))section='world-view';
    const hash=sectionHash(section);
    if(push&&location.hash!==hash)history.pushState({world:active},'',hash);
    if(scroll){
      const behavior=animate&&enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant';
      if(section==='world-view')window.scrollTo({top:0,left:0,behavior});
      else el(section).scrollIntoView({behavior,block:'start'});
    }
    journey();return section;
  }
  function route(initial=false){
    const hash=location.hash;
    if(/^#(?:popup|order):/.test(hash))return;
    if(hash==='#contacts'||hash==='#author'){
      if(!active)home({push:false,scroll:false});
      navigate('contacts',{push:false,animate:false});
      if(hash==='#author')history.replaceState({world:active},'','#contacts');
      if(initial)document.fonts.ready.then(()=>{if(location.hash==='#contacts')navigate('contacts',{push:false});});
      return;
    }
    const world=Object.keys(worlds).find(id=>worlds[id].hash===hash);
    const nested=/^#(black-white|shatserak)\/([a-z-]+)$/.exec(hash);
    let id=world,section='world-view';
    if(nested){id=Object.keys(paths).find(key=>paths[key]===nested[1]);section=nested[2];}
    else if(!world&&[...sections,'worlds'].includes(hash.slice(1))){
      section=hash.slice(1);id=history.state?.world;
      if(!worlds[id])try{id=sessionStorage.getItem('riguva-active-world');}catch{}
    }
    if(!worlds[id]){home({push:false,scroll:!initial});if(hash&&hash!=='#home')history.replaceState({world:null},'','#home');return;}
    if(active!==id)selectWorld(id,{push:false,scroll:false});
    section=navigate(section,{push:false});
    const canonical=sectionHash(section);
    if(location.hash!==canonical)history.replaceState({world:id},'',canonical);
    if(initial)document.fonts.ready.then(()=>{if(location.hash===canonical)navigate(section,{push:false});});
  }
  document.querySelectorAll('[data-enter-world]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();selectWorld(a.dataset.enterWorld);}));
  document.querySelectorAll('[data-worlds-home],.header .wordmark,.footer .wordmark').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();home();}));
  document.addEventListener('click',event=>{
    if(event.defaultPrevented)return;
    const a=event.target.closest('a[data-world-section]');if(!a)return;
    event.preventDefault();closeDialogs();navigate(a.dataset.worldSection);
  });
  switchButton.addEventListener('click',()=>{
    showDialog(worldDialog);switchButton.setAttribute('aria-expanded','true');
  });
  worldDialog.addEventListener('close',()=>switchButton.setAttribute('aria-expanded','false'));
  window.RiWorlds={home,navigate,get active(){return active;}};
  const effects=el('effects-toggle');
  function applyEffects(){document.body.classList.toggle('still',!enabled);effects.setAttribute('aria-pressed',String(enabled));el('effects-state').textContent=enabled?'вкл':'выкл';window.dispatchEvent(new CustomEvent('ri:effects',{detail:enabled}));}
  effects.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('riguva-effects',enabled?'on':'off');}catch{}applyEffects();});applyEffects();
  addEventListener('popstate',()=>route());addEventListener('hashchange',()=>route());route(true);
  function journey(){
    ticking=false;document.body.classList.toggle('scrolled',scrollY>60);
    const shopping=!!active&&['books','bw-finale','merch'].some(id=>{const node=el(id),r=node.getBoundingClientRect();return !node.hidden&&r.top<innerHeight*.55&&r.bottom>innerHeight*.3;});
    document.body.classList.toggle('shop-view',shopping);
    if(active){const w=worlds[active];setScene(el('story').getBoundingClientRect().top<innerHeight*.55?w.storyScene:w.scene);}
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(journey);}},{passive:true});
  addEventListener('resize',journey,{passive:true});journey();
  if('IntersectionObserver' in window){document.body.classList.add('reveal-ready');const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');obs.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.narrative-panel,.section-heading').forEach(node=>obs.observe(node));}
})();
