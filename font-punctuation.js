/* The original SP font maps these non-letter characters to its author's QR.
   Keep the font intact; use a normal fallback face for those characters only. */
(() => {
  'use strict';
  const brandingCharacters=/[\u0021-\u0022\u0027-\u002A\u002C-\u002E\u0030-\u003B\u003F-\u0040\u0060\u00A1\u00A5\u00A8\u00AB\u00AF\u00B4\u00B7-\u00B8\u00BB\u00BF\u02D8-\u02DD\u02ED\u02F5-\u02F7\u0375\u0385\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FEE-\u1FEF\u1FFD\u2010\u2012-\u2015\u2018-\u201E\u2021-\u2022\u2024-\u2026\u2032\u203C\u2048-\u2049\u204E\u20A1\u20A3-\u20A4\u20A6\u20A8-\u20A9\u20AB-\u20AE\u20B1\u20B8\u20BA\u20BD\u2122\u2160-\u217F\u218A-\u218B\u2212\u25CC\uA789]/gu;
  const skip='script,style,textarea,input,code,pre,[data-font-punctuation]';
  function repairText(node){
    const parent=node.parentElement;
    if(!parent||parent.closest(skip))return;
    const text=node.data;
    brandingCharacters.lastIndex=0;
    if(!brandingCharacters.test(text)||!getComputedStyle(parent).fontFamily.includes('Ri Medieval V9'))return;
    brandingCharacters.lastIndex=0;
    const fragment=document.createDocumentFragment();
    let cursor=0;
    for(const match of text.matchAll(brandingCharacters)){
      if(match.index>cursor)fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const span=document.createElement('span');
      span.dataset.fontPunctuation='';span.textContent=match[0];
      span.style.setProperty('font-family','Georgia, serif','important');
      span.style.setProperty('font-weight','400','important');
      span.style.setProperty('font-style','normal','important');
      span.style.setProperty('font-size','inherit','important');
      span.style.setProperty('display','inline','important');
      span.style.setProperty('vertical-align','baseline','important');
      span.style.setProperty('margin','0','important');
      span.style.setProperty('color','inherit','important');
      fragment.append(span);cursor=match.index+match[0].length;
    }
    if(cursor<text.length)fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function repair(root){
    if(root.nodeType===Node.TEXT_NODE){repairText(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||root.closest(skip))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(repairText);
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')repairText(record.target);
      else record.addedNodes.forEach(repair);
    }
  });
  repair(document.body);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  // A world switch also changes the inherited title face on existing text.
  addEventListener('ri:atmosphere',()=>repair(document.getElementById('experience')));
})();
