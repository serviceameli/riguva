/* V17. A physical switch lights the parking and reveals its bonus chapters. */
(() => {
  'use strict';
  const lamp=document.getElementById('bw-bonus-lamp');
  const control=document.getElementById('bw-light-switch');
  const chapters=document.getElementById('bw-bonus-chapters');
  const label=document.getElementById('bw-switch-copy');
  const section=lamp&&lamp.closest('#bonus');
  if(!lamp||!control||!chapters)return;
  let lit=false;

  function setLit(value){
    const next=!!value;
    const changed=lit!==next;
    if(!next&&chapters.contains(document.activeElement))control.focus({preventScroll:true});
    lit=next;
    lamp.dataset.lit=String(lit);
    if(section)section.dataset.bwLit=String(lit);
    chapters.hidden=!lit;
    chapters.inert=!lit;
    chapters.setAttribute('aria-hidden',String(!lit));
    control.setAttribute('aria-expanded',String(lit));
    control.setAttribute('aria-pressed',String(lit));
    control.setAttribute('aria-label',lit
      ?'Выключить строительный фонарь и скрыть бонусные главы'
      :'Включить строительный фонарь и открыть бонусные главы');
    if(label)label.textContent=lit?'Выключи свет':'Включи свет';
    if(changed)window.dispatchEvent(new CustomEvent('ri:bonus-light',{detail:{lit}}));
  }

  // A real button supplies native mouse, touch, Enter and Space activation.
  // Reader choice stays local to this document when its world is changed.
  control.addEventListener('click',()=>setLit(!lit));
  setLit(false);
})();
