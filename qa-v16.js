/* A spoiler-gated index of Ri's own Telegram answers. No video autoplay. */
(() => {
  'use strict';
  const section=document.getElementById('author-qa');
  const radio=document.getElementById('qa-radio');
  const reveal=document.getElementById('qa-reveal');
  const copy=document.getElementById('qa-toggle-copy');
  const catalog=document.getElementById('qa-catalog');
  const search=document.getElementById('qa-search');
  const filters=document.getElementById('qa-filters');
  const stats=document.getElementById('qa-stats');
  const results=document.getElementById('qa-results');
  const collapse=document.getElementById('qa-collapse');
  if(!section||!radio||!reveal||!copy||!catalog||!search||!filters||!stats||!results||!collapse)return;
  const data=window.RiQAData;
  if(!data||!Array.isArray(data.questions)||!Array.isArray(data.categories))return;
  const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalize=value=>String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[«»„“"']/g,'').replace(/\s+/g,' ').trim();
  const plural=(number,forms)=>{const tens=number%100,last=number%10;return forms[tens>10&&tens<20?2:last===1?0:last>=2&&last<=4?1:2];};
  const validURL=value=>{try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='t.me'?url.href:null;}catch{return null;}};
  const questions=data.questions.filter(q=>q&&typeof q.title==='string'&&q.title.trim());
  const counts=new Map(data.categories.map(c=>[c.id,questions.filter(q=>q.category===c.id).length]));
  let opened=false,rendered=false,category='all',query='';

  function answerLinks(question){
    const supplied=Array.isArray(question.links)&&question.links.length?question.links:[{url:question.url}];
    const links=supplied.map(link=>typeof link==='string'?{url:link}:link).filter(Boolean);
    return links.map((link,index)=>{
      const url=validURL(link.url||link.href);if(!url)return '';
      const label='Видео ответ в ТГ'+(links.length>1?' '+(index+1):'');
      return '<a class="qa-answer-link" href="'+safe(url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+safe('Видео ответ в ТГ: '+question.title)+'">'+safe(label)+' <span aria-hidden="true">↗</span></a>';
    }).join('');
  }
  function renderFilters(){
    const options=[{id:'all',label:'Все темы'},...data.categories.filter(c=>counts.get(c.id)>0)];
    filters.innerHTML=options.map(c=>'<button type="button" class="qa-filter" data-qa-category="'+safe(c.id)+'" aria-pressed="'+String(c.id===category)+'">'+safe(c.label)+'</button>').join('');
  }
  function render(){
    if(!opened)return;
    const terms=normalize(query).split(' ').filter(Boolean);
    const selected=questions.filter(q=>{
      if(category!=='all'&&q.category!==category)return false;
      const label=data.categories.find(c=>c.id===q.category)?.label||'';
      const haystack=normalize([q.title,q.question||'',label,q.searchText||''].join(' '));
      return terms.every(term=>haystack.includes(term));
    });
    stats.textContent=selected.length===questions.length
      ?questions.length+' '+plural(questions.length,['вопрос','вопроса','вопросов'])
      :'Найдено: '+selected.length+' '+plural(selected.length,['вопрос','вопроса','вопросов'])+' из '+questions.length;
    const groups=data.categories.map(c=>({category:c,items:selected.filter(q=>q.category===c.id)})).filter(group=>group.items.length);
    results.innerHTML=groups.length?groups.map(group=>{
      const c=group.category;
      const expanded=category!=='all'||terms.length>0;
      return '<details class="qa-topic"'+(expanded?' open':'')+'><summary><span class="qa-topic-title">'+safe(c.label)+'</span><span class="qa-topic-count">'+group.items.length+'</span><span class="qa-topic-symbol" aria-hidden="true">+</span></summary><ol class="qa-question-list">'+group.items.map((q,index)=>{
        const title='<h3><span class="qa-question-title">'+safe(q.title)+'</span></h3>';
        return '<li class="qa-question" id="qa-item-'+safe(q.id)+'"><span class="qa-question-number" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span><div class="qa-question-content">'+title+'</div><div class="qa-answer-links">'+answerLinks(q)+'</div></li>';
      }).join('')+'</ol></details>';
    }).join(''):'<div class="qa-empty"><p>Ничего не найдено.</p><button type="button" class="qa-reset">Сбросить поиск и темы</button></div>';
    rendered=true;
  }
  function setOpen(value){
    const next=!!value,changed=next!==opened;
    opened=next;
    if(!opened&&catalog.contains(document.activeElement))reveal.focus({preventScroll:true});
    radio.dataset.open=String(opened);
    reveal.setAttribute('aria-expanded',String(opened));
    copy.textContent=opened?'Нажми Stop,\nчтобы скрыть вопросы':'Нажми Play,\nчтобы открыть вопросы';
    catalog.hidden=!opened;catalog.inert=!opened;
    if(opened&&!rendered){renderFilters();render();}
    // A new scan is only needed when Play changes the stopped state to playing.
    if(changed){
      radio.classList.remove('qa-tuning');
      if(opened)requestAnimationFrame(()=>{if(opened)radio.classList.add('qa-tuning');});
    }
  }
  reveal.addEventListener('click',()=>setOpen(true));
  document.getElementById('qa-stop')?.addEventListener('click',()=>setOpen(false));
  collapse.addEventListener('click',()=>setOpen(false));
  search.addEventListener('input',()=>{query=search.value;render();});
  filters.addEventListener('click',event=>{
    const button=event.target.closest('[data-qa-category]');if(!button)return;
    category=button.dataset.qaCategory;
    filters.querySelectorAll('[data-qa-category]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
    render();
  });
  results.addEventListener('click',event=>{
    if(!event.target.closest('.qa-reset'))return;
    query='';category='all';search.value='';renderFilters();render();search.focus({preventScroll:true});
  });
  setOpen(false);
})();
