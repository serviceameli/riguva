/* Digital editions checked 2026-10-30; retail links checked 2026-11-01.
   Shop pages and publisher posts are recorded in source/v98-art/retail-*.json.
   Prices and stock on external sites stay with the seller. */
(() => {
  'use strict';
  const editions={
  "black-white": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/chernyy-belyy-45102787/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/chernyy-belyy-67940762/",
    "publisher": "https://ast.ru/book/chernyy-belyy-893506/",
    "stores": [
      {"name":"Читай-город","url":"https://www.chitai-gorod.ru/product/cernyj-belyj-3152437"},
      {"name":"Ozon","url":"https://www.ozon.ru/product/chernyy-belyy-guva-ri-3672904110/"},
      {"name":"Book24","url":"https://book24.ru/product/cernyj-belyj-8796765/"}
    ]
  },
  "grey-forest": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/seryy-les-45874197/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/seryy-les-67640600/",
    "publisher": "https://ast.ru/book/seryy-les-897308/",
    "stores": [
      {"name":"Читай-город","url":"https://www.chitai-gorod.ru/product/seryj-les-3171237"},
      {"name":"Ozon","url":"https://www.ozon.ru/product/seryy-les-guva-ri-4988580383/"},
      {"name":"Wildberries","url":"https://www.wildberries.ru/catalog/1238382127/detail.aspx"}
    ]
  },
  "silence-1": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-chast-1-67693002/",
    "publisher": null
  },
  "silence-2": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-chast-2-67738907/",
    "publisher": null
  },
  "silence": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/cvet-tishiny-sbornik-67740728/",
    "publisher": null
  },
  "shata": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/shata-72267004/",
    "audio": "https://www.litres.ru/audiobook/ri-guva-19764391/shata-72272470/",
    "publisher": null,
    "authorInfo": "https://t.me/riguva/2078"
  },
  "sherka": {
    "text": "https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/",
    "audio": null,
    "publisher": null,
    "authorInfo": "https://t.me/riguva/4636"
  }
};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDateLabel=value=>escape(value).replace(/(\d{1,2}) (ноября|декабря)/g,'$1&nbsp;$2');
  const link=(url,label,title)=>`<a class="edition-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(title)}">${escape(label)} <span aria-hidden="true">↗</span></a>`;
  const isPaperBook=p=>['black-white','grey-forest','silence-1','silence-2'].includes(p.id);
  const commerceOffer=p=>window.RiCommerce?.offer(p.id);
  function offerSummary(p,{showRelease=true}={}){
    const offer=commerceOffer(p);if(!offer)return '';
    const price=typeof offer.price==='number'&&Number.isFinite(offer.price)?`<p class="commerce-price-v97">${escape(window.RiCommerce.money(offer.price))}</p>`:'';
    const status=offer.statusText?`<p class="commerce-status-v97">${formatDateLabel(offer.statusText)}</p>`:'';
    const release=showRelease&&offer.releaseLabel&&!offer.statusText?.includes(offer.releaseLabel)?`<p class="commerce-release-v97">${formatDateLabel(offer.releaseLabel)}</p>`:'';
    return `<div class="commerce-offer-v97" data-offer-state="${escape(offer.state)}">${price}${status}${release}</div>`;
  }
  function purchaseAction(p){
    const offer=commerceOffer(p);if(!offer)return '';
    return offer.orderable
      ?`<button type="button" class="commerce-cart-v97" data-cart-add="${escape(p.id)}" aria-label="Добавить в корзину: ${escape(p.name)}">В корзину <span aria-hidden="true">↗</span></button>`
      :`<button type="button" class="merch-drop-link commerce-notify-v97" data-drop-open="${escape(p.id)}">${escape(offer.requestLabel||'Сообщить о дропе')} <span aria-hidden="true">↗</span></button>`;
  }
  function listFormats(p){
    const e=editions[p.id];if(p.type!=='book'||!e)return [];
    const result=[];
    if(e.text)result.push({type:'ebook',label:'Электронная книга'});
    if(e.audio)result.push({type:'audio',label:'Аудиокнига'});
    if(isPaperBook(p)||e.authorInfo){
      const source=e.authorInfo?'author':e.publisher?'publisher':null;
      result.push({type:'paper',label:'Бумажная книга',source,orderable:source==='author'&&!!commerceOffer(p)?.orderable});
    }
    return result;
  }
  function previewFormats(p){
    const items=listFormats(p);if(!items.length)return '';
    return `<ul class="book-formats-v98" aria-label="Форматы книги: ${escape(p.name)}">${items.map(format=>{
      const offer=format.source==='author'?commerceOffer(p):null;
      const purchase=format.source==='author'?`<span class="book-format-source-v98">${escape(offer?.edition||'Авторский самиздат')}</span>${offerSummary(p)}${offer?`<div class="commerce-actions-v97">${purchaseAction(p)}</div>`:''}`:format.source==='publisher'?'<span class="book-format-source-v98">Издательство АСТ</span>':'';
      return `<li class="book-format-v98" data-format="${format.type}"><span class="book-format-name-v98">${format.label}</span>${purchase}</li>`;
    }).join('')}</ul>`;
  }
  function formats(p){
    const e=editions[p.id];
    if(!e)return p.type==='merch'?(window.RiMerchDrops?.release(p).label||'Дропы автора'):'';
    return [e.text?'Текст':null,e.audio?'Аудио':null,isPaperBook(p)||e.authorInfo?'Бумажная книга':null].filter(Boolean).join(' · ');
  }
  function render(p){
    if(p.type==='merch'){
      const offer=commerceOffer(p);
      if(offer)return `<section class="edition-choices merch-drop-choice commerce-detail-v97" data-release="${escape(offer.state)}" aria-label="Покупка и выпуск"><div class="edition-author">${offerSummary(p)}<div class="commerce-actions-v97">${purchaseAction(p)}</div><p class="merch-announcement-v91">Анонсы дропов будут в <a href="https://t.me/riguva" target="_blank" rel="noopener noreferrer">Telegram Ри <span aria-hidden="true">↗</span></a>.</p></div></section>`;
      const drops=window.RiMerchDrops;
      const release=drops?.release(p)||{status:'upcoming',label:'Дропы автора',title:'Узнать о выпуске',description:'Дата выхода, состав выпуска и условия заказа появятся в анонсе дропа.',requestLabel:'Сообщить о дропе'};
      const price=drops?.priceNote(p)||(typeof p.price==='number'&&Number.isFinite(p.price)?`Ориентировочная цена: ${new Intl.NumberFormat('ru-RU').format(p.price)} ₽.`:'Цена при анонсе дропа.');
      return `<section class="edition-choices merch-drop-choice" data-release="${escape(release.status)}" aria-label="Выпуск и заявка"><div class="edition-author"><p class="edition-label">${escape(release.label)}</p><h3>${escape(release.title)}</h3><p>${escape(release.description)}</p><p class="merch-announcement-v91">Анонсы дропов будут в <a href="https://t.me/riguva" target="_blank" rel="noopener noreferrer">Telegram Ри <span aria-hidden="true">↗</span></a>.</p><p class="edition-price-note">${escape(price)}</p><button type="button" class="edition-request" data-drop-open="${escape(p.id)}">${escape(release.requestLabel)} <span aria-hidden="true">↗</span></button><button type="button" class="edition-all-merch-v89" data-drop-open="${escape(drops?.scope.id||'all-merch-drops')}">Все будущие дропы мерча <span aria-hidden="true">↗</span></button></div></section>`;
    }
    const e=editions[p.id]||{};
    const stores=(e.stores||[]).map(store=>link(store.url,store.name,p.name+' / бумажная книга в '+store.name)).join('');
    const publisher=e.publisher?`<div class="edition-channel"><h4>Бумажная книга</h4><p>АСТ · NoSugar Books</p><div class="edition-store-links-v98" aria-label="Бумажная книга в магазинах">${stores}</div>${link(e.publisher,'Об издании на АСТ',p.name+' на сайте издательства АСТ')}</div>`:isPaperBook(p)?`<div class="edition-channel"><h4>Бумажная книга</h4>${link('https://t.me/riguva','Telegram Ри',p.name+' / Telegram Ри')}</div>`:'';
    const digital=`<div class="edition-channel"><h4>На Литрес</h4><div class="edition-digital-links">${e.text?link(e.text,'Читать',p.name+' / электронная книга на Литрес'):''}${e.audio?link(e.audio,'Слушать',p.name+' / аудиокнига на Литрес'):''}</div></div>`;
    const offer=commerceOffer(p);
    const author=e.authorInfo&&offer?`<div class="edition-author commerce-detail-v97"><h4>Бумажная книга</h4><p class="book-selfpub-v97">${escape(offer.edition||'Авторский самиздат')}</p>${offerSummary(p,{showRelease:false})}<p class="commerce-description-v97">Книги выпускаются тиражами.${offer.releaseLabel?' '+formatDateLabel(offer.releaseLabel)+'.':''}</p><div class="commerce-actions-v97">${purchaseAction(p)}</div></div>`:e.authorInfo?`<div class="edition-author"><h4>Бумажная книга</h4><p class="book-selfpub-v97">Авторский самиздат</p><p>Книги выпускаются тиражами.</p></div>`:'';
    return `<section class="edition-choices" aria-label="Где купить ${escape(p.name)}">
      <h3 class="edition-section-title">Выбрать издание</h3>
      <div class="edition-external">${digital}${publisher}</div>
      ${author}
    </section>`;
  }
  window.RiBuyOptions={get:id=>editions[id]||null,formats,render,offerSummary,purchaseAction,listFormats,previewFormats};
})();
