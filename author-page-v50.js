/* A separate author document keeps both fictional worlds independent. */
(() => {
 'use strict';
 const tabs=[...document.querySelectorAll('[data-author-chapter]')];
 const panels=[...document.querySelectorAll('[data-author-panel]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let activeChapter=tabs.find(tab=>tab.getAttribute('aria-selected')==='true')?.dataset.authorChapter;
 function turnPage(node,direction=1){
  if(!node||reduced.matches||typeof node.animate!=='function')return;
  node.getAnimations().forEach(animation=>animation.cancel());
  node.animate([
   {opacity:.72,transform:'translateX('+(direction*9)+'px) rotateY('+(direction*-1.2)+'deg)'},
   {opacity:1,transform:'translateX(0) rotateY(0)'}
  ],{duration:300,easing:'cubic-bezier(.2,.65,.3,1)'});
 }
 function selectChapter(id,focus=false,animate=true){
  const chosen=tabs.find(tab=>tab.dataset.authorChapter===id);if(!chosen)return;
  const direction=tabs.indexOf(chosen)>=tabs.findIndex(tab=>tab.dataset.authorChapter===activeChapter)?1:-1;
  const changed=activeChapter!==id;
  tabs.forEach(tab=>{const selected=tab===chosen;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  panels.forEach(panel=>{const selected=panel.dataset.authorPanel===id;panel.hidden=!selected;panel.inert=!selected;panel.setAttribute('aria-hidden',String(!selected));panel.tabIndex=selected?0:-1;});
  const folio=document.getElementById('author-folio-number-v84');
  if(folio)folio.textContent=chosen.dataset.authorFolio;
  if(changed&&animate){turnPage(panels.find(panel=>panel.dataset.authorPanel===id),direction);turnPage(folio,direction);}
  activeChapter=id;
  if(focus)chosen.focus({preventScroll:true});
 }
 if(tabs.length&&panels.length){selectChapter(activeChapter||tabs[0].dataset.authorChapter,false,false);document.body.classList.add('author-tabs-ready-v84');}
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectChapter(tab.dataset.authorChapter));
  tab.addEventListener('keydown',event=>{
   let next=index;
   if(event.key==='ArrowRight')next=(index+1)%tabs.length;
   else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=tabs.length-1;
   else return;
   event.preventDefault();selectChapter(tabs[next].dataset.authorChapter,true);
  });
 });
 const data=window.RiQAData,results=document.getElementById('author-question-results'),search=document.getElementById('author-question-search'),stats=document.getElementById('author-question-stats');
 if(!data||!Array.isArray(data.questions)||!Array.isArray(data.categories)||!results||!search||!stats)return;
 const permitted=['writing','books','author'];
 // Character deaths and their discussion remain in the BW archive.
 const plotOnly=new Set(['q201-021','q798-007','q798-017']);
 const questions=data.questions.filter(q=>permitted.includes(q.category)&&!plotOnly.has(q.id));
 const categories=permitted.map(id=>data.categories.find(c=>c.id===id)).filter(Boolean);
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=value=>String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const plural=n=>{const last=n%10,tens=n%100;return tens>10&&tens<20?'вопросов':last===1?'вопрос':last>=2&&last<=4?'вопроса':'вопросов';};
 function links(q){
  const all=Array.isArray(q.links)&&q.links.length?q.links:[{url:q.url}];
  return all.map((item,index)=>{
   const value=typeof item==='string'?item:item.url||item.href;let url;
   try{url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='t.me')return '';}catch{return '';}
   const label='Видео ответ в ТГ'+(all.length>1?' '+(index+1):'');
   return '<a class="author-video-link" href="'+safe(url.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+safe(label+': '+q.title)+'">'+safe(label)+' <span aria-hidden="true">↗</span></a>';
  }).join('');
 }
 function render(){
  const query=normalize(search.value),terms=query.split(' ').filter(Boolean);
  const selected=questions.filter(q=>terms.every(term=>normalize(q.title+' '+(q.question||'')).includes(term)));
  stats.textContent=selected.length+' '+plural(selected.length);
  const groups=categories.map(category=>({category,items:selected.filter(q=>q.category===category.id)})).filter(group=>group.items.length);
  results.innerHTML=groups.length?groups.map(({category,items})=>'<details class="author-question-topic"'+(query?' open':'')+'><summary><h3>'+safe(category.label)+'</h3><small>'+items.length+'</small><span class="author-question-symbol" aria-hidden="true">+</span></summary><ol class="author-question-list">'+items.map((q,index)=>'<li class="author-question"><span class="author-question-number" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span><h4>'+safe(q.title)+'</h4>'+links(q)+'</li>').join('')+'</ol></details>').join(''):'<div class="author-question-empty"><p>Ничего не найдено.</p><button type="button" data-author-reset>Сбросить поиск</button></div>';
 }
 search.addEventListener('input',render);
 results.addEventListener('click',event=>{if(event.target.closest('[data-author-reset]')){search.value='';render();search.focus();}});
 render();
})();
