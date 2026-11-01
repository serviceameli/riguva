/* Keep focus movement for reading and dialogs; show control outlines for keyboard use. */
(() => {
  'use strict';
  if(window.RiFocusInput)return;
  const root=document.documentElement;
  function setMode(mode){
    if(root.dataset.riFocusInput!==mode)root.dataset.riFocusInput=mode;
  }
  let initial='pointer';
  try{
    const active=document.activeElement;
    if(active&&active!==document.body&&active.matches(':focus-visible')&&!active.matches('[tabindex="-1"]'))initial='keyboard';
  }catch{}
  setMode(initial);
  const pointer=()=>setMode('pointer');
  ['pointerdown','touchstart','mousedown'].forEach(type=>document.addEventListener(type,pointer,{capture:true,passive:true}));
  const navigation=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Enter',' ','Escape']);
  document.addEventListener('keydown',event=>{
    if(event.isComposing||event.metaKey||event.altKey||event.ctrlKey)return;
    const editable=event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
    if(event.key==='Tab'||(!editable&&navigation.has(event.key)))setMode('keyboard');
  },true);
  window.RiFocusInput=Object.freeze({get mode(){return root.dataset.riFocusInput;}});
})();
