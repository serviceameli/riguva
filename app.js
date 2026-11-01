'use strict';
const products = [
  {"id":"black-white","coverRatio":0.636152,"name":"Черный Белый","image":"assets/current/Для сайта/black-white.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга I","price":1190,"tag":"Начать здесь","description":"Мир рухнул и ожил заново, позволяя закрытому городу Сфера властвовать над выжившими людьми. Они не знают, что есть другие новые города, а знают лишь то, что за стеной их ожидают голодные хищники, рожденные Мировой Катастрофой. Лекса Ройс тоже верит в это, но вынуждена бежать из Сферы, в которой прожила всю жизнь. Она хочет лишь спасти брата, но теперь за ней охотится целая армия. Она хочет жить вдалеке от опасности, но ее манит новый город… и охотник, которому нет равных. Лекса обещает, что полюбит новую жизнь, но в нее врывается ураган. И зовут его мистер Блэк.","specs":["Постапокалипсис","672 стр.","Книга I","18+"],"source":"https://ast.ru/book/chernyy-belyy-893506/","sourceLabel":"Об издании на сайте АСТ ↗","format":null,"volume":{"pages":672,"basis":"print","isbn":"978-5-17-179711-9","widthMm":132,"heightMm":208,"depthMm":45,"source":"https://ast.ru/book/chernyy-belyy-893506/","depthKind":"publisher_dimensions"},"mockupThickness":0.216346},
  {"id":"grey-forest","coverRatio":0.631255,"name":"Серый лес","image":"assets/current/Для сайта/grey-forest.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга II","price":1090,"tag":"Продолжение","description":"Продолжение книги «Черный Белый». Надежды на спасение нет. Все, что осталось, это тягучая боль, пустота и жажда мести. Как пережить потерю близкого человека?! Как выжить, если бежать некуда?! Рано или поздно, они найдут меня. ОН найдет.","specs":["Постапокалипсис","416 стр.","Книга II","18+"],"source":"https://ast.ru/book/seryy-les-897308/","sourceLabel":"Об издании на сайте АСТ ↗","format":null,"volume":{"pages":416,"basis":"print","isbn":"978-5-17-189271-5","widthMm":133,"heightMm":207,"depthMm":27.6,"source":"https://ast.ru/book/seryy-les-897308/","depthKind":"publisher_dimensions"},"mockupThickness":0.133333},
  {"id":"silence-1","coverRatio":0.699062,"name":"Цвет тишины. Часть 1","image":"assets/current/Для сайта/silence-1.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга III","price":null,"tag":"Книга 3 из 4","description":"Третья книга. Часть 1.\n\nКогда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nПродолжение трилогии «Черный Белый» и «Серый лес».\n\nВнимание!\n\nТолько для лиц старше 18 лет!\n\nТекст содержит натуралистичные описания наркотического опыта, который обусловлен исключительно сюжетом и является неотъемлемой частью художественного замысла. Автор категорически против употребления наркотических и психоактивных веществ и настоятельно рекомендует всем читателям вести здоровый и трезвый образ жизни.","specs":["Электронная книга","2020 год","460 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":460,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-1-63176117/","depthKind":"visual_estimate","estimateNote":"Пропорция мокапа рассчитана ориентировочно по объёму электронной книги. Печатная пагинация и размеры не подтверждены."},"mockupThickness":0.145},
  {"id":"silence-2","coverRatio":0.699062,"name":"Цвет тишины. Часть 2","image":"assets/current/Для сайта/silence-2.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":true,"meta":"Постапокалипсис · Книга IV","price":null,"tag":"Финал цикла","description":"Когда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nПродолжение трилогии «Черный Белый» и «Серый лес».\n\nВ книге присутствует нецензурная брань!","specs":["Электронная книга","2020 год","490 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":490,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-chast-2-63176118/","depthKind":"visual_estimate","estimateNote":"Пропорция мокапа рассчитана ориентировочно по объёму электронной книги. Печатная пагинация и размеры не подтверждены."},"mockupThickness":0.153214},
  {"id":"shata","coverRatio":0.699062,"name":"Шата","image":"assets/current/Для сайта/shata.jpg","type":"book","series":"shatserak","worldName":"Шацерак","catalog":true,"meta":"Тёмное фэнтези · Книга I","price":1290,"tag":"Первая книга","description":"В моём мире существует сказка. Она гласит об ужасном боге Бадзун-Гра и его слугах, сотканных из тени. Этой сказкой пугают непослушных детишек, чтоб в лес по ночам не ходили... хотя и у взрослых мурашки от имени Бадзун-Гра.\n\nКто-то считает, что он лишь могущественный колдун; кто-то убежден, что он - вероломный бог; кто-то верит, что раньше Бадзун-Гра был человеком; другие же называют его отцом Мрака и злейшим существом на всем белом свете...\n\nА я - его дочь, и это вовсе не сказка.","specs":["Тёмное фэнтези","Книга I","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/shata-72267004/","sourceLabel":"О книге на Литрес ↗","format":null,"volume":{"pages":430,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/shata-72267004/","announcedPrintPages":600,"printAnnouncementSource":"https://t.me/riguva/1958","depthKind":"visual_estimate","estimateNote":"Автор анонсировала бумажную версию на 600 страниц. Пагинация позднего исправленного тиража и физические размеры не подтверждены."},"mockupThickness":0.183333},
  {"id":"sherka","coverRatio":0.67125,"name":"Шерка","image":"assets/author/Для сайта/sherka.jpg","type":"book","series":"shatserak","worldName":"Шацерак","catalog":true,"meta":"Тёмное фэнтези · Книга II","price":null,"tag":"Новая книга","description":"Баю-бай, мой дружок,\n\nНе ходи ночью за порог.\n\nТам, где темный лес шумит,\n\nБродят тени, как голодные псы.\n\nСпи, дитя, закрывай глаза,\n\nУспей уснуть, пока не взошла луна.\n\nЕсли будешь плакать, малыш,\n\nПридет Мрак и заберет твой детский крик.\n\nВторая книга серии «Шата»!","specs":["Электронная книга","2026 год","510 стр.","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/","sourceLabel":"О книге на Литрес ↗","format":"Электронная книга","volume":{"pages":510,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/sherka-74661452/","depthKind":"visual_estimate","estimateNote":"Бумажный выпуск подтверждён автором, число печатных страниц не найдено. Относительный объём визуализации примерно в 510/430 раза больше Шаты при условном одинаковом формате."},"mockupThickness":0.213899},
  {"id":"silence","coverRatio":0.699062,"name":"Цвет тишины. Сборник","image":"assets/current/Для сайта/silence.jpg","type":"book","series":"bw","worldName":"Черный Белый","catalog":false,"meta":"Постапокалипсис · Части I + II","price":1490,"tag":"Сборник","description":"Заключительная книга, из объединенных двух частей, трилогии «Черный Белый» и «Серый Лес».\n\nКогда я была на Арене, точно знала, что нужно делать. Там были свои законы, свои правила. Но бывают иные ловушки: без правил, без надежды… Они самые страшные. Особенно, когда они лишь в твоей голове. Куда идти, если света в конце туннеля нет?\n\nСодержит нецензурную брань.\n\nВнимание!\n\nТолько для лиц старше 18 лет!\n\nТекст содержит натуралистичные описания наркотического опыта, который обусловлен исключительно сюжетом и является неотъемлемой частью художественного замысла. Автор категорически против употребления наркотических и психоактивных веществ и настоятельно рекомендует всем читателям вести здоровый и трезвый образ жизни.","specs":["Постапокалипсис","Части I + II","18+"],"source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/","sourceLabel":"О книге на Литрес ↗","format":null,"volume":{"pages":940,"basis":"ebook","source":"https://www.litres.ru/book/ri-guva-19764391/cvet-tishiny-sbornik-51609572/","depthKind":"visual_estimate","estimateNote":"Скрытая в текущем каталоге объединённая электронная версия. Условная толщина для визуализации, не спецификация бумажного издания."},"mockupThickness":0.276429},
  {"id":"stickerpack","name":"Стикерпак «Черный Белый»","image":"assets/author/v79-originals/01-alexia.jpg","photosPending":false,"useOverview":false,"type":"merch","series":"bw","worldName":"Черный Белый","meta":"Стикерпак · Только комплектом","price":1000,"provisionalPrice":true,"packOnly":true,"tag":"Только комплектом","description":"Стикерпак с героями серии «Черный Белый». Продаётся только полным комплектом. Рассмотри все изображения в галерее.","specs":["Мир «Черный Белый»","Только полным комплектом","По отдельности не продаётся"],"gallery":[{"src":"assets/author/v79-originals/01-alexia.jpg","alt":"Дизайн: Алексия","surface":"stickers-alexia-v79"},{"src":"assets/author/v79-originals/02-black.jpg","alt":"Дизайн: Мистер Блэк","surface":"stickers-black-v79"},{"src":"assets/author/v79-originals/03-jack.jpg","alt":"Дизайн: Джек","surface":"stickers-jack-v79"},{"src":"assets/author/v79-originals/04-troy.jpg","alt":"Дизайн: Трой","surface":"stickers-troy-v79"},{"src":"assets/author/v79-originals/05-dayton.jpg","alt":"Дизайн: Дэйтон","surface":"stickers-dayton-v79"},{"src":"assets/author/v79-originals/06-pierce.jpg","alt":"Дизайн: Пирс","surface":"stickers-pierce-v79"},{"src":"assets/author/v79-originals/07-theo-naita.jpg","alt":"Дизайн: Тео и Наита","surface":"stickers-theo-naita-v79"},{"src":"assets/author/Для сайта/stickers-02.jpg","alt":"Дизайн: Рич","surface":"stickers-02"},{"src":"assets/author/Для сайта/stickers-03.jpg","alt":"Дизайн: Джейс","surface":"stickers-03"}],"mockup":true},
  {"id":"bookmarks","name":"Закладка «Черный Белый»","image":"assets/author/Для сайта/bookmarks.jpg","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","meta":"Двусторонняя закладка","price":1000,"provisionalPrice":true,"tag":"Двусторонняя","description":"Двусторонняя закладка с героями серии «Черный Белый».","specs":["Мир «Черный Белый»","Двусторонняя","1 закладка"],"mockup":true,"gallery":[{"src":"assets/author/Для сайта/bookmarks.jpg","surface":"bookmark-front","alt":"Закладка: сторона 1"},{"src":"assets/author/Для сайта/bookmarks.jpg","surface":"bookmark-back","alt":"Закладка: сторона 2"}]},
  {"id":"cerberus-figurine","name":"Фигурка «Цербер»","image":"assets/merch-v90/Для сайта/cerberus-front.webp","photosPending":false,"photoLabel":"Цербер","type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Фигурка · Мир «Черный Белый»","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Фигурка Цербера из мира «Черный Белый»: три головы, рельефный узор на груди и манжеты на передних лапах. Рельефное основание расположено на гладкой круглой подставке.","specs":["Мир «Черный Белый»","Фигурка","Следующий дроп"],"gallery":[{"src":"assets/merch-v90/Для сайта/cerberus-front.webp","alt":"Фигурка «Цербер»: вид спереди"},{"src":"assets/merch-v90/Для сайта/cerberus-side.webp","alt":"Фигурка «Цербер»: вид сбоку"}]},
  {"id":"ribbed-candle","name":"Ребристая свеча «Черный Белый»","image":"assets/merch-v89/Для сайта/ribbed-candle.webp","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Цилиндрическая свеча","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Чёрно-белая цилиндрическая свеча с ребристой поверхностью и изображением пары сверху.","specs":["Мир «Черный Белый»","Чёрно-белая","Ребристая поверхность"],"gallery":[{"src":"assets/merch-v89/Для сайта/ribbed-candle.webp","alt":"Ребристая свеча «Черный Белый»: вид с изображением пары сверху"}]},
  {"id":"book-candle","name":"Свеча-книга «Черный Белый»","image":"assets/merch-v89/Для сайта/book-candle-closed.webp","photosPending":false,"type":"merch","series":"bw","worldName":"Черный Белый","merchGroup":"objects","meta":"Свеча в форме книги","price":null,"dropOnly":true,"release":{"status":"upcoming"},"tag":"Следующий дроп","description":"Свеча в форме книги «Черный Белый». На крышке находится обложка. Внутри белый воск и восковые фигурки пистолета, пули, черепа, ананаса и часов. В галерее можно рассмотреть закрытую и открытую свечу.","specs":["Мир «Черный Белый»","Крышка с обложкой","Белый воск и восковые фигурки"],"gallery":[{"src":"assets/merch-v89/Для сайта/book-candle-closed.webp","alt":"Свеча-книга «Черный Белый»: закрытая крышка с обложкой"},{"src":"assets/merch-v89/Для сайта/book-candle-open.webp","alt":"Свеча-книга «Черный Белый»: открытая свеча с белым воском и восковыми фигурками"}]}
];
window.RiCommerce?.registerCatalog(products);
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const getProduct = id => products.find(p=>p.id===id);
const safe = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const detailDescription = p => p.type==='book'
  ? '<div class="detail-description'+(p.id==='sherka'?' detail-description--verse':'')+'">'+String(p.description).split(/\n\s*\n/).map(part=>'<p>'+safe(part)+'</p>').join('')+'</div>'
  : '<p class="detail-description">'+safe(p.description)+'</p>';
let toastTimer, zoomProduct=null, zoomIndex=0;
const bookMockup = (p,lazy=true) => {
  return `<span class="book-mockup" data-book-id="${safe(p.id)}" data-book-world="${safe(p.series||'')}" data-volume-basis="${safe(p.volume?.basis||'unknown')}" style="--book-ratio:${p.coverRatio||0.6993};--book-thickness:${p.mockupThickness||0.17}"><span class="book-body"><span class="book-pages" aria-hidden="true"></span><span class="book-spine" aria-hidden="true"><span>РИ ГУВА</span><b>${safe(p.name)}</b></span><img class="book-front" src="${p.image}" alt="Обложка книги: ${safe(p.name)}" loading="${lazy?'lazy':'eager'}"><span class="book-front-board-edge" aria-hidden="true"></span><span class="book-cover-finish" aria-hidden="true"></span></span><span class="book-contact-shadow" aria-hidden="true"></span><span class="book-floor-shadow" aria-hidden="true"></span></span>`;
};
window.bookMockup=bookMockup;
const photoPlaceholder = (p,compact=false) => {
  const label=p.photoLabel||(p.packOnly?'Стикерпак':p.id==='bookmarks'?'Закладка':p.name);
  return compact?`<span class="product-thumb-placeholder" role="img" aria-label="Фото пока не добавлено">${safe(label)}</span>`:`<span class="photo-placeholder"><span class="photo-placeholder-title">${safe(label)}</span><span class="photo-placeholder-note">Фото пока не добавлено</span></span>`;
};
const hasDesignMockup = p => !!(p.mockup&&window.RiMerchMockups);
const productThumb = p => hasDesignMockup(p)?`<span class="product-thumb-mockup">${window.RiMerchMockups.renderProduct(p,'thumb')}</span>`:p.photosPending||!p.image?photoPlaceholder(p,true):`<img src="${safe(p.image)}" alt="${safe(p.name)}">`;
function renderMerchSurface(p,photo,context='detail'){
  if(hasDesignMockup(p)&&photo.surface)return window.RiMerchMockups.renderSurface(photo.surface,photo.src,context,photo.alt);
  return `<img class="merch-main-image${p.id==='cerberus-figurine'&&photo===p.gallery?.[1]?' cerberus-side-v95':''}" src="${safe(photo.src)}" alt="${safe(photo.alt)}">`;
}
const merchVisual = p => {
  if(hasDesignMockup(p))return window.RiMerchMockups.renderProduct(p,'card');
  if(p.photosPending||!p.image)return photoPlaceholder(p);
  return `<img src="${safe(p.image)}" alt="${safe(p.name)}" loading="lazy">`;
};
const bookShelfCard = p => {
  return `<article class="product-card book-shelf-card-v86 book-shelf-card-v93" data-series="${safe(p.series||'')}"><button class="product-visual" data-product="${safe(p.id)}" aria-label="Подробнее: ${safe(p.name)}">${bookMockup(p)}</button><div class="book-shelf-info-v93"><a class="product-name" href="#${safe(p.id)}" data-product="${safe(p.id)}">${safe(p.name)}</a>${window.RiBuyOptions?.previewFormats(p)||''}<div class="product-buy"><button type="button" class="add-button" data-product="${safe(p.id)}" aria-label="О книге: ${safe(p.name)}">О книге <span aria-hidden="true">↗</span></button></div></div></article>`;
};
const productCard = (p,i,merch=false) => p.type==='book'&&!merch?bookShelfCard(p,i):`<article class="product-card ${merch?'merch-card':''}" data-series="${safe(p.series||'')}"${merch?` data-merch-group="${safe(p.merchGroup||'paper')}"`:''}><button class="product-visual" data-product="${safe(p.id)}" aria-label="Подробнее: ${safe(p.name)}"><span class="product-tag">${safe(p.tag)}</span>${p.type==='book'?bookMockup(p):merchVisual(p)}</button><p class="product-meta">${safe(p.meta)}</p><a class="product-name" href="#${safe(p.id)}" data-product="${safe(p.id)}">${safe(p.name)}</a><div class="product-buy"><span class="product-formats">${safe(window.RiBuyOptions?.formats(p)||'Дропы автора')}</span><button type="button" class="add-button" ${p.type==='merch'?`data-drop-open="${safe(p.id)}"`:`data-product="${safe(p.id)}"`} aria-label="${p.type==='merch'?'Оставить заявку:':'Где купить:'} ${safe(p.name)}">${p.type==='merch'?'Оставить заявку':'Где купить'} <span aria-hidden="true">↗</span></button></div></article>`;
function renderMerchShelfV91(merch){
  return merch.map(p=>window.RiMerchPreview.render(p,renderMerchSurface)).join('');
}
let catalogWorld=null;
function renderBooks(filter=catalogWorld){
  const books=products.filter(p=>p.type==='book'&&p.catalog!==false&&p.series===filter);
  $('#book-grid').dataset.collection=filter;
  $('#book-grid').innerHTML=books.map((p,i)=>productCard(p,i)).join('');
  $('#book-grid-rest').innerHTML='';
  $('#bw-finale').hidden=true;
  return books.length;
}
function setCatalogWorld(world){
  catalogWorld=['bw','shatserak'].includes(world)?world:null;
  $('#search-input').placeholder=catalogWorld==='shatserak'?'Название книги':'Название книги или артефакта';
  $('#search-input').setAttribute('aria-label','Поиск по миру');
  renderBooks(catalogWorld);
  const merch=products.filter(p=>p.type==='merch'&&p.series===catalogWorld);
  $('#merch-grid').innerHTML=renderMerchShelfV91(merch);
  $('#merch').hidden=!merch.length;
  return {books:products.filter(p=>p.type==='book'&&p.catalog!==false&&p.series===catalogWorld).length,merch:merch.length};
}
window.RiCatalog={setWorld:setCatalogWorld,items:()=>products.map(({id,name,type,series,catalog,release,price,merchGroup})=>({id,name,type,series,catalog,release,price,merchGroup}))};
setCatalogWorld(null);

function showToast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function showDialog(dialog){$$('dialog[open]').forEach(d=>d.close());dialog.showModal();document.body.style.overflow='hidden';}
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
});
document.addEventListener('click',e=>{
  const photoOpen=e.target.closest('[data-photo-open]');if(photoOpen){e.preventDefault();openPhoto(photoOpen.dataset.photoOpen);return;}
  const photoStep=e.target.closest('[data-photo-step]');if(photoStep){e.preventDefault();stepPhoto(Number(photoStep.dataset.photoStep));return;}
  const galleryStep=e.target.closest('[data-gallery-step]');if(galleryStep){e.preventDefault();const gallery=$('#product-detail .detail-gallery'),p=getProduct(galleryStep.dataset.galleryProduct);if(p?.gallery?.length){const current=Number($('.gallery-thumb.is-active',gallery)?.dataset.galleryIndex||0);selectGalleryImage(p.id,(current+Number(galleryStep.dataset.galleryStep)+p.gallery.length)%p.gallery.length);}return;}
  const galleryButton=e.target.closest('[data-gallery-index]');if(galleryButton){e.preventDefault();selectGalleryImage(galleryButton.dataset.galleryProduct,Number(galleryButton.dataset.galleryIndex));return;}
  const product=e.target.closest('[data-product]');if(product){e.preventDefault();window.RiMerchPreview.open(product.dataset.product,showProduct,selectGalleryImage);return;}
  const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
});
function merchGallery(p){
  if(p.photosPending||!p.image)return `<div class="merch-photo-stage merch-photo-stage--pending">${photoPlaceholder(p)}</div>`;
  const photos=p.gallery?.length?p.gallery:[{src:p.image,alt:p.name}];
  return `<div class="detail-gallery"><div class="merch-photo-stage"><button class="gallery-photo-button" data-photo-open="${safe(p.id)}" aria-label="${p.merchGroup==='objects'?'Рассмотреть фото крупно':'Рассмотреть макет крупно'}"><span class="merch-main-art">${renderMerchSurface(p,photos[0])}</span><span class="photo-zoom-hint">РАССМОТРЕТЬ КРУПНО ⤢</span></button></div>${photos.length>1?`<div class="gallery-controls"><button data-gallery-step="-1" data-gallery-product="${safe(p.id)}" aria-label="Предыдущее изображение">←</button><p class="gallery-caption" aria-live="polite">01 / ${String(photos.length).padStart(2,'0')} · ${safe(photos[0].alt)}</p><button data-gallery-step="1" data-gallery-product="${safe(p.id)}" aria-label="Следующее изображение">→</button></div><div class="gallery-thumbs" role="group" aria-label="Изображения товара">${photos.map((photo,i)=>`<button class="gallery-thumb${i===0?' is-active':''}" data-gallery-product="${safe(p.id)}" data-gallery-index="${i}" aria-label="${p.merchGroup==='objects'?'Изображение':'Дизайн'} ${i+1}: ${safe(photo.alt)}" aria-pressed="${i===0}">${renderMerchSurface(p,photo,'thumb')}</button>`).join('')}</div>`:''}</div>`;
}

function selectGalleryImage(id,index){
  const p=getProduct(id),photo=p?.gallery?.[index];
  if(!photo||!Number.isInteger(index))return;
  const gallery=$('#product-detail .detail-gallery');if(!gallery)return;
  const art=$('.merch-main-art',gallery);if(!art)return;
  art.innerHTML=renderMerchSurface(p,photo);
  $$('[data-gallery-index]',gallery).forEach(button=>{const active=Number(button.dataset.galleryIndex)===index;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
  const caption=$('.gallery-caption',gallery);
  if(caption)caption.textContent=String(index+1).padStart(2,'0')+' / '+String(p.gallery.length).padStart(2,'0')+' · '+photo.alt;
}

function openPhoto(id){
  const p=getProduct(id);if(!p||p.photosPending||!p.image)return;
  zoomProduct=p;zoomIndex=Number($('#product-detail .gallery-thumb.is-active')?.dataset.galleryIndex||0);
  renderPhoto();$('#photo-dialog').showModal();document.body.style.overflow='hidden';
}
function renderPhoto(){
  const photos=zoomProduct.gallery?.length?zoomProduct.gallery:[{src:zoomProduct.image,alt:zoomProduct.name}];
  const photo=photos[zoomIndex];
  $('#photo-view').innerHTML=renderMerchSurface(zoomProduct,photo,'zoom');
  $('#photo-caption').textContent=photo.alt;$('#photo-counter').textContent=String(zoomIndex+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');
  $$('[data-photo-step]').forEach(button=>button.disabled=photos.length<2);
  if(zoomProduct.gallery?.length)selectGalleryImage(zoomProduct.id,zoomIndex);
}
function stepPhoto(step){
  if(!zoomProduct)return;const count=zoomProduct.gallery?.length||1;
  zoomIndex=(zoomIndex+step+count)%count;renderPhoto();
}
document.addEventListener('keydown',event=>{if(!$('#photo-dialog').open)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stepPhoto(event.key==='ArrowRight'?1:-1);}});
function showProduct(id){
  const p=getProduct(id);if(!p)return;
  $('#product-detail').innerHTML=`<div class="product-detail${p.type==='merch'?' merch-detail':''}${p.merchGroup==='objects'?' merch-object-detail-v89':''}" data-series="${safe(p.series||'')}"><div class="detail-image ${p.type==='merch'?'merch-image':''}">${p.type==='book'?bookMockup(p,false):merchGallery(p)}</div><div class="detail-copy"><p class="eyebrow">${safe(p.meta)}</p><h2 id="product-detail-title">${safe(p.name)}</h2>${detailDescription(p)}<div class="detail-specs">${p.specs.map(s=>`<span>${safe(s)}</span>`).join('')}</div>${window.RiBuyOptions?.render(p)||''}</div></div>`;
  $('#product-dialog').setAttribute('aria-label',p.name);showDialog($('#product-dialog'));
  $('#product-dialog').scrollTop=0;
}
$('#cart-open').onclick=()=>window.RiCommerce?.openCart();
$('#search-open').onclick=()=>{showDialog($('#search-dialog'));$('#search-input').value='';renderSearch('');$('#search-input').focus();};
function renderSearch(query){
  const q=query.toLocaleLowerCase('ru').trim();
  const matches=products.filter(p=>p.catalog!==false&&p.series===catalogWorld&&(p.name+' '+p.meta+' '+(p.worldName||'')).toLocaleLowerCase('ru').includes(q));
  $('#search-results').innerHTML=matches.length?matches.map(p=>`<button class="search-result" data-product="${safe(p.id)}">${productThumb(p)}<span>${safe(p.name)}<small>${safe(p.meta)}</small></span><b class="search-format">${p.type==='book'?'Где купить':'Дроп'}</b></button>`).join(''):`<p class="search-empty">По запросу «${safe(query)}» ничего не найдено.<br>Попробуй другое название.</p>`;
}

$('#search-input').addEventListener('input',e=>renderSearch(e.target.value));
$('#menu-open').onclick=()=>showDialog($('#menu-dialog'));
$$('#menu-dialog nav a').forEach(a=>a.onclick=()=>$('#menu-dialog').close());


