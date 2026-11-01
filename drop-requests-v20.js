/* Preview: same-origin local persistence only. Tilda mode uses configured native hooks.
   window.RiCommerceConfig = {mode:'local_preview', requestEndpoint:'/api/drop-requests',
     tilda:{defaultPopup:'#popup:drop-request', popupByProduct:{shata:'#popup:shata-request'}}}; */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const dialog=byId('drop-dialog'),form=byId('drop-form');
  if(!dialog||!form)return;
  const fields=byId('drop-fields'),view=byId('drop-form-view'),success=byId('drop-success');
  const productInput=byId('drop-product-id'),productSelect=byId('drop-product-select');
  const contact=byId('drop-contact'),name=byId('drop-name'),consent=byId('drop-consent');
  const submit=byId('drop-submit'),error=byId('drop-error'),previewNote=byId('drop-preview-note');
  const legalDialog=byId('legal-dialog');
  let fixedProduct=null,opener=null,returnProduct=null,returnTrigger=null,formWorld=null;
  let activeRun=null,controller=null,lastAttempt=null,suspendedForLegal=false,legalOpener=null;
  let nativeTrigger=null,productionUnavailable=false;
  const items=()=>window.RiCatalog?.items?.()||[];
  const config=()=>window.RiCommerceConfig||{};
  const currentType=()=>form.querySelector('[name="contactType"]:checked')?.value||'telegram';
  const merchScope=window.RiMerchDrops?.scope||{id:'all-merch-drops',name:'Все будущие дропы мерча'};
  const isAllMerch=id=>id===merchScope.id;
  const hasMerchScope=()=>document.body.dataset.world==='bw';
  const waitingForRelease=item=>item.type==='merch'&&!window.RiCommerce?.offer(item.id)?.orderable;
  const requestTarget=id=>isAllMerch(id)?(hasMerchScope()?merchScope:null):items().find(item=>item.id===id&&waitingForRelease(item));
  const selectedId=()=>fixedProduct?.id||productSelect.value;
  const contactHint=()=>currentType()==='email'?
    (isAllMerch(selectedId())?'Адрес для анонсов будущих дропов мерча.':'Адрес для сообщения о выбранном дропе.'):
    'Имя пользователя или ссылка t.me.';

  function setBusy(busy){
    fields.disabled=busy||productionUnavailable;submit.disabled=busy||productionUnavailable;
    form.setAttribute('aria-busy',String(busy));
    submit.querySelector('span').textContent=busy?'Сохраняем заявку…':'Уведомить меня';
    byId('drop-submit-status').textContent=busy?'Сохраняем заявку.':'';
  }
  function clearErrors(){
    error.hidden=true;error.textContent='';
    form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.drop-field-error').forEach(node=>{node.hidden=true;node.textContent='';});
  }
  function fieldError(field,message){
    const mapping={productId:[productSelect,byId('drop-product-error')],name:[name,byId('drop-name-error')],contact:[contact,byId('drop-contact-error')],contactType:[contact,byId('drop-contact-error')],consent:[consent,byId('drop-consent-error')]};
    const pair=mapping[field];
    if(!pair){generalError(message);return;}
    pair[0].setAttribute('aria-invalid','true');pair[1].textContent=message;pair[1].hidden=false;
    if(!pair[0].disabled)pair[0].focus();
  }
  function generalError(message){error.textContent=message;error.hidden=false;error.focus();}
  function updateContactType(){
    const email=currentType()==='email';
    contact.type=email?'email':'text';contact.inputMode=email?'email':'text';
    contact.autocomplete=email?'email':'username';contact.placeholder=email?'name@example.ru':'@username';
    byId('drop-contact-label').textContent=email?'Электронная почта':'Telegram';
    byId('drop-contact-hint').textContent=contactHint();
    contact.removeAttribute('aria-invalid');byId('drop-contact-error').hidden=true;
  }
  function updateIntro(){
    const id=selectedId(),p=requestTarget(id),allMerch=isAllMerch(id);
    const offer=window.RiCommerce?.offer(id);
    const announcements=byId('drop-merch-announcements-v91');
    if(announcements)announcements.hidden=!(allMerch||p?.type==='merch');
    byId('drop-title').textContent=allMerch?'Будущие дропы мерча':offer?.state==='upcoming'?'Узнать о предзаказе':'Напомнить о дропе';
    dialog.querySelector('.drop-kicker').textContent=allMerch?'Анонсы новых выпусков':offer?.releaseLabel||'Следующий дроп';
    byId('drop-intro').textContent=allMerch?
      'Выбор охватывает все будущие дропы мерча, включая выпуски, которых ещё нет в каталоге. Даты, состав и цены появятся в анонсах.':
      p?.type==='merch'?(window.RiMerchDrops?.release(p).description||'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.'):
      'Сообщим об открытии дропа или предзаказа.';
    consent.closest('label').querySelector('span').textContent=allMerch?
      'Даю согласие на обработку контактных данных для уведомлений о будущих дропах мерча.':
      'Даю согласие на обработку контактных данных для уведомления о выбранном дропе.';
    form.querySelector('.drop-form-note').textContent=allMerch?
      'Это интерес к будущим дропам мерча. Заявка не бронирует товар и не оформляет заказ.':
      offer?.price!=null?'Это уведомление о старте дропа. Заявка не бронирует товар и не оформляет заказ.':
      'Это уведомление об открытии предзаказа. Цена и условия покупки появятся в анонсе.';
    byId('drop-contact-hint').textContent=contactHint();
  }
  function populateProducts(){
    productSelect.replaceChildren(new Option('Выбери из списка',''));
    if(hasMerchScope()){
      const futureGroup=document.createElement('optgroup');futureGroup.label='Будущие выпуски';
      futureGroup.append(new Option(merchScope.name,merchScope.id));productSelect.append(futureGroup);
    }
    const available=items().filter(p=>p.catalog!==false&&p.series===document.body.dataset.world&&waitingForRelease(p));
    for(const type of ['book','merch']){
      const group=document.createElement('optgroup');group.label=type==='book'?'Книги':'Артефакты';
      available.filter(p=>p.type===type).forEach(p=>group.append(new Option(p.name,p.id)));
      if(group.children.length)productSelect.append(group);
    }
  }
  function nativeTildaPopup(productId){
    const tilda=config().tilda||{};
    const hook=tilda.popupByProduct?.[productId]||tilda.defaultPopup;
    if(typeof hook!=='string'||!/^#popup:[A-Za-z0-9_-]+$/.test(hook))return false;
    document.querySelectorAll('dialog[open]').forEach(node=>node.close());
    if(!nativeTrigger){
      nativeTrigger=document.createElement('a');nativeTrigger.className='drop-native-trigger';
      nativeTrigger.tabIndex=-1;nativeTrigger.setAttribute('aria-hidden','true');
      nativeTrigger.textContent='Открыть форму заявки';document.body.append(nativeTrigger);
    }
    nativeTrigger.href=hook;
    if(productId)nativeTrigger.dataset.productId=productId;else delete nativeTrigger.dataset.productId;
    nativeTrigger.click();
    return true;
  }
  function open(productId=null,source=null){
    const p=productId?requestTarget(productId):null;
    if(productId&&!p)return false;
    if(!isAllMerch(productId)&&config().mode==='tilda'&&nativeTildaPopup(productId))return true;
    controller?.abort();activeRun=null;controller=null;
    fixedProduct=p;opener=source||document.activeElement;
    const productDialog=byId('product-dialog');
    const previousProduct=productDialog?.querySelector('.edition-request[data-drop-open]')?.dataset.dropOpen;
    returnProduct=productDialog?.open?(items().some(item=>item.id===previousProduct)?previousProduct:(p&&!isAllMerch(p.id)?p.id:null)):null;
    returnTrigger=source?.dataset.dropOpen||returnProduct;
    formWorld=document.body.dataset.world||null;suspendedForLegal=false;
    form.reset();clearErrors();populateProducts();
    byId('drop-fixed-product').hidden=!p;byId('drop-product-choice').hidden=!!p;
    byId('drop-product-name').textContent=p?.name||'';productInput.value=p?.id||'';
    productInput.disabled=!p;productSelect.disabled=!!p;productSelect.required=!p;
    productionUnavailable=(config().mode||'local_preview')!=='local_preview';
    previewNote.textContent=productionUnavailable?
      'Тестовая версия сайта: заявки пока не принимаются. Анонсы появятся в Telegram Ри.':
      'Проверочная версия: заявка сохраняется локально и не отправляется Ри.';
    view.hidden=false;success.hidden=true;
    dialog.setAttribute('aria-labelledby','drop-title');dialog.setAttribute('aria-describedby','drop-intro');
    byId('drop-back').textContent=returnProduct?'Вернуться к карточке':'Вернуться';
    updateContactType();updateIntro();setBusy(false);
    if(typeof window.showDialog==='function')window.showDialog(dialog);
    else{document.querySelectorAll('dialog[open]').forEach(node=>node.close());dialog.showModal();document.body.style.overflow='hidden';}
    dialog.scrollTop=0;
    if(productionUnavailable){fields.disabled=true;generalError('Заявки в тестовой версии отключены.');}
    else(p?contact:productSelect).focus({preventScroll:true});
    return true;
  }
  function restoreContext(){
    if(returnProduct&&document.body.dataset.world===formWorld&&typeof window.showProduct==='function'){
      const id=returnProduct;returnProduct=null;window.showProduct(id);
      const target=byId('product-dialog')?.querySelector('[data-drop-open="'+CSS.escape(returnTrigger||id)+'"]');
      returnTrigger=null;
      target?.focus({preventScroll:true});return;
    }
    returnProduct=null;returnTrigger=null;
    if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
    else byId('cart-open')?.focus({preventScroll:true});
  }
  function close(){if(dialog.open)dialog.close();}
  dialog.addEventListener('close',()=>{
    if(suspendedForLegal)return;
    controller?.abort();controller=null;activeRun=null;setBusy(false);
    if(!document.querySelector('dialog[open]'))document.body.style.overflow='';
    restoreContext();
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
  });
  document.addEventListener('click',event=>{
    const legal=event.target.closest('[data-drop-legal]');
    if(!legalDialog||!legal||!dialog.open||!dialog.contains(legal)||!['privacy','consent'].includes(legal.dataset.legalOpen))return;
    suspendedForLegal=true;legalOpener=legal;
  },true);
  legalDialog?.addEventListener('close',()=>{
    if(!suspendedForLegal)return;
    suspendedForLegal=false;
    if(document.querySelector('dialog[open]')||(document.body.dataset.world||null)!==formWorld)return;
    dialog.showModal();document.body.style.overflow='hidden';legalOpener?.focus({preventScroll:true});
  });
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-drop-open]');
    if(trigger){event.preventDefault();open(trigger.dataset.dropOpen||null,trigger);return;}
    if(event.target.closest('[data-drop-close]')){event.preventDefault();close();}
  });
  form.addEventListener('change',event=>{
    if(event.target.name==='contactType')updateContactType();
    if(event.target===productSelect)updateIntro();
  });

  function normalizedPayload(){
    const productId=selectedId();
    if(!requestTarget(productId)){fieldError('productId',hasMerchScope()?'Выбери артефакт или все будущие дропы мерча.':'Выбери артефакт.');return null;}
    const contactType=currentType();
    let value=contact.value.normalize('NFC').trim();
    const displayName=name.value.normalize('NFC').trim();
    if(displayName.length>80||/[\u0000-\u001F\u007F]/.test(displayName)){fieldError('name','Проверь имя: не больше 80 символов.');return null;}
    if(contactType==='telegram'){
      value=value.replace(/^https?:\/\/(?:www\.)?t\.me\//i,'').replace(/^(?:www\.)?t\.me\//i,'').replace(/^@+/,'');
      if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)){fieldError('contact','Укажи Telegram в формате @username, от 5 до 32 символов.');return null;}
      value='@'+value.toLowerCase();
    }else{
      if(!/^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(value)||value.length>254){fieldError('contact','Укажи электронную почту, например name@example.ru.');return null;}
      const at=value.lastIndexOf('@');value=value.slice(0,at+1)+value.slice(at+1).toLowerCase();
    }
    if(!consent.checked){fieldError('consent','Для заявки нужно подтвердить согласие.');return null;}
    return {productId,contactType,contact:value,name:displayName,consent:true};
  }
  function uuid(){
    if(crypto.randomUUID)return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(activeRun)return;clearErrors();
    if((config().mode||'local_preview')!=='local_preview'){generalError('Тестовая версия сайта: заявки пока не принимаются. Данные не отправляются.');return;}
    const payload=normalizedPayload();if(!payload)return;
    let endpoint;
    try{
      endpoint=new URL(config().requestEndpoint||'/api/drop-requests',location.href);
      if(!/^https?:$/.test(location.protocol)||endpoint.origin!==location.origin)throw new Error('origin');
    }catch{generalError('Для сохранения заявки открой проверочную версию сайта через локальный сервер. Данные не отправлены.');return;}
    const fingerprint=JSON.stringify(payload);
    if(!lastAttempt||lastAttempt.fingerprint!==fingerprint)lastAttempt={fingerprint,key:uuid()};
    const run=Symbol('drop-request'),requestController=new AbortController();
    activeRun=run;controller=requestController;setBusy(true);
    const timeout=setTimeout(()=>requestController.abort(),15000);
    try{
      const response=await fetch(endpoint.href,{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},signal:requestController.signal,
        body:JSON.stringify({...payload,idempotencyKey:lastAttempt.key,website:byId('drop-website').value})});
      let result;try{result=await response.json();}catch{throw new Error('unreadable');}
      if(activeRun!==run||!dialog.open)return;
      if(!response.ok||result.ok!==true){
        setBusy(false);
        if(result.field&&typeof result.message==='string')fieldError(result.field,result.message);
        else generalError(typeof result.message==='string'?result.message:'Заявка не сохранена. Попробуй ещё раз.');
        return;
      }
      if(result.status!=='saved'||result.delivery!=='local_preview'||typeof result.requestId!=='string'||!result.requestId)throw new Error('unexpected');
      byId('drop-reference').textContent=result.requestId;
      byId('drop-success-product').textContent=requestTarget(payload.productId)?.name||'';
      view.hidden=true;success.hidden=false;
      dialog.setAttribute('aria-labelledby','drop-success-title');dialog.setAttribute('aria-describedby','drop-success-copy');
      dialog.scrollTop=0;byId('drop-success-title').focus({preventScroll:true});
    }catch(problem){
      if(activeRun!==run||!dialog.open)return;
      setBusy(false);generalError('Не удалось подтвердить сохранение. Данные Ри не отправлены. Проверь локальный сервер и попробуй ещё раз.');
    }finally{
      clearTimeout(timeout);
      if(activeRun===run){activeRun=null;controller=null;setBusy(false);}
    }
  });
  window.RiDrops={open,close};
})();
