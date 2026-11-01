/* V89: release metadata and a request scope for future merch, not a catalog item.
   Catalog entries may use release:{status:'upcoming'|'announced'|'closed'}.
   No dates, stock or edition sizes are inferred here. */
(() => {
  'use strict';
  const scope=Object.freeze({id:'all-merch-drops',name:'Все будущие дропы мерча'});
  const states=Object.freeze({
    upcoming:Object.freeze({
      status:'upcoming',label:'Будущий дроп',title:'Узнать о выпуске',
      description:'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.',
      requestLabel:'Сообщить о дропе'
    }),
    announced:Object.freeze({
      status:'announced',label:'Дроп анонсирован',title:'Узнать об этом дропе',
      description:'Оставь контакт для информации о выпуске, цене и условиях заказа.',
      requestLabel:'Узнать о выпуске'
    }),
    closed:Object.freeze({
      status:'closed',label:'Дроп завершён',title:'Узнать о следующем выпуске',
      description:'Этот дроп завершён. Можно оставить контакт на случай нового выпуска этого артефакта.',
      requestLabel:'Узнать о следующем'
    })
  });
  function release(product){
    const offer=window.RiCommerce?.offer(product?.id);
    if(offer){
      const legacy=states[offer.state]||states.upcoming;
      const date=offer.releaseLabel&&!offer.statusText?.includes(offer.releaseLabel)?' '+offer.releaseLabel+'.':'';
      const description=offer.orderable?'Товар можно добавить в корзину.':offer.state==='upcoming'?'Оставь контакт, чтобы узнать об открытии предзаказа.':'Оставь контакт, чтобы получить уведомление об открытии дропа.';
      return {...legacy,status:offer.state,label:offer.statusText,title:offer.orderable?'Можно заказать':offer.requestLabel||legacy.title,description:offer.statusText+'.'+date+' '+description,requestLabel:offer.requestLabel||legacy.requestLabel,orderable:offer.orderable,releaseDate:offer.releaseDate};
    }
    const status=typeof product?.release==='string'?product.release:product?.release?.status;
    return Object.hasOwn(states,status)?states[status]:states.upcoming;
  }
  function priceNote(product){
    const offer=window.RiCommerce?.offer(product?.id);
    if(offer)return typeof offer.price==='number'&&Number.isFinite(offer.price)
      ?'Цена: '+window.RiCommerce.money(offer.price)+'.'
      :'Цена пока не объявлена.';
    const status=release(product).status;
    if(status==='closed')return 'Цена следующего выпуска появится при его анонсе.';
    return typeof product?.price==='number'&&Number.isFinite(product.price)&&product.price>=0
      ?'Ориентировочная цена: '+new Intl.NumberFormat('ru-RU').format(product.price)+' ₽.'
      :status==='announced'?'Цена пока не объявлена.':'Цена при анонсе дропа.';
  }
  window.RiMerchDrops=Object.freeze({scope,states,release,priceNote,isAllMerch:id=>id===scope.id});
})();
