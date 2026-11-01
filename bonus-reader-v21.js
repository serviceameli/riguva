/* The full chapters come from the author's supplied PDFs. No remote text fetch. */
(() => {
  'use strict';
  const chapters=window.RiBonusChapters||[];
  const byId=id=>document.getElementById(id);
  const dialog=byId('chapter-dialog'),body=byId('chapter-reader-body');
  if(!dialog||!body)return;
  const title=byId('chapter-reader-title'),print=byId('chapter-print-link');
  const next=byId('chapter-reader-next'),status=byId('chapter-reader-status');
  let opener=null,currentId=null;

  for(const chapter of chapters){
    document.querySelectorAll('[data-chapter-title="'+CSS.escape(chapter.id)+'"]').forEach(node=>{node.textContent=chapter.title;});
  }
  function render(chapter){
    title.textContent=chapter.title;
    print.href=chapter.printFile;
    print.download=chapter.title+' · для печати.pdf';
    print.setAttribute('aria-label',chapter.title+': скачать PDF для печати');
    body.replaceChildren();
    const fragment=document.createDocumentFragment();
    for(const [index,text] of chapter.paragraphs.entries()){
      const paragraph=document.createElement('p');
      const marks=(chapter.emphasis||[]).filter(mark=>mark.paragraph===index).sort((a,b)=>a.start-b.start);
      let offset=0;
      for(const mark of marks){
        if(!['strong','em'].includes(mark.tag)||mark.start<offset||mark.end>text.length)continue;
        paragraph.append(document.createTextNode(text.slice(offset,mark.start)));
        const emphasis=document.createElement(mark.tag);
        emphasis.textContent=text.slice(mark.start,mark.end);
        paragraph.append(emphasis);offset=mark.end;
      }
      paragraph.append(document.createTextNode(text.slice(offset)));
      if(/^[*•·\s]{3,}$/.test(text))paragraph.className='chapter-scene-break';
      fragment.append(paragraph);
    }
    body.append(fragment);
    const index=chapters.findIndex(item=>item.id===chapter.id);
    const following=chapters[index+1];
    next.hidden=!following;
    if(following)next.dataset.chapterNext=following.id;
    status.hidden=true;status.textContent='';
    currentId=chapter.id;
    dialog.dataset.chapter=currentId;
  }
  function open(id,source=null){
    if(document.body.dataset.world!=='bw')return false;
    const chapter=chapters.find(item=>item.id===id);
    if(!chapter||!Array.isArray(chapter.paragraphs)||!chapter.paragraphs.length)return false;
    const wasOpen=dialog.open;
    if(!wasOpen)opener=source||document.activeElement;
    render(chapter);
    if(!wasOpen){
      if(typeof window.showDialog==='function')window.showDialog(dialog);
      else{document.querySelectorAll('dialog[open]').forEach(node=>node.close());dialog.showModal();document.body.style.overflow='hidden';}
    }
    dialog.scrollTop=0;
    title.focus({preventScroll:true});
    return true;
  }
  document.addEventListener('click',event=>{
    const read=event.target.closest('[data-chapter-open]');
    if(read){event.preventDefault();open(read.dataset.chapterOpen,read);return;}
    const following=event.target.closest('[data-chapter-next]');
    if(following&&dialog.open){event.preventDefault();open(following.dataset.chapterNext);return;}
    if(event.target.closest('[data-chapter-close]')&&dialog.open){event.preventDefault();dialog.close();}
  });
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.body.style.overflow='';
    if(document.body.dataset.world==='bw'&&opener?.isConnected&&opener.getClientRects().length){opener.focus({preventScroll:true});}
  });
  window.RiBonusReader={open,get current(){return currentId;}};
})();
