/* Draft document screens. No acceptance, data collection or legal terms are implied. */
(() => {
  'use strict';
  const dialog=document.getElementById('legal-dialog');
  const title=document.getElementById('legal-dialog-title');
  const copy=document.getElementById('legal-document-copy');
  if(!dialog||!title||!copy)return;
  let opener=null;
  const documents={
    offer:{title:'Публичная оферта',text:'Здесь будут условия покупки бумажных книг и мерча: оформление заказа, оплата, доставка и возврат.'},
    privacy:{title:'Политика обработки персональных данных',text:'Здесь будет описано, какие данные нужны для заказов и обращений, как они используются, хранятся и защищаются, а также как связаться с оператором данных.'},
    consent:{title:'Согласие на обработку персональных данных',text:'Здесь появится отдельный текст согласия для будущих форм заказа и обратной связи с указанием оператора, целей и состава обрабатываемых данных.'},
    cookies:{title:'Cookie и локальное хранилище',text:'Здесь будет описано использование cookie и локального хранилища сайта. Сейчас корзина, настройка движения и выбранный мир сохраняются в браузере. Система аналитики не подключена.'},
    delivery:{title:'Доставка и возврат',text:'Здесь будут указаны способы доставки, сроки, стоимость и порядок возврата бумажных книг и мерча.'},
    seller:{title:'Реквизиты продавца',text:'Здесь появятся наименование продавца, ИНН/ОГРН, адрес и контакты для обращений.'}
  };
  document.addEventListener('click',event=>{
    const control=event.target.closest('[data-legal-open]');
    const entry=control&&documents[control.dataset.legalOpen];
    if(!entry)return;
    event.preventDefault();
    dialog.dataset.document=control.dataset.legalOpen;
    title.textContent=entry.title;
    copy.textContent=entry.text;
    opener=control;
    if(typeof window.showDialog==='function')window.showDialog(dialog);
    else dialog.showModal();
  });
  if(document.body.classList.contains('author-document')){
    dialog.addEventListener('click',event=>{
      if(event.target.closest('[data-close]')){dialog.close();return;}
      if(event.target===dialog){
        const rect=dialog.getBoundingClientRect();
        if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
      }
    });
    dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  }
})();
