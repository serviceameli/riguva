/* Clean code-native merch mockups. Source artwork is not redrawn or re-exported. */
(() => {
  'use strict';
  // Coordinates measured on the complete source photographs; TL, TR, BR, BL.
  const surfaces = [
    {"id":"stickers-alexia-v79","photoWidth":917,"photoHeight":1280,"corners":[[0,0],[916,5],[916,1279],[10,1277]],"kind":"sheet","label":"Алексия"},
    {"id":"stickers-black-v79","photoWidth":905,"photoHeight":1280,"corners":[[0,0],[894,0],[904,1273],[7,1278]],"kind":"sheet","label":"Мистер Блэк"},
    {"id":"stickers-jack-v79","photoWidth":917,"photoHeight":1280,"corners":[[0,0],[905,13],[916,1279],[8,1278]],"kind":"sheet","label":"Джек"},
    {"id":"stickers-troy-v79","photoWidth":937,"photoHeight":1280,"corners":[[0,0],[936,4],[936,1279],[10,1279]],"kind":"sheet","label":"Трой"},
    {"id":"stickers-dayton-v79","photoWidth":900,"photoHeight":1280,"corners":[[0,0],[899,14],[899,1279],[0,1277]],"kind":"sheet","label":"Дэйтон"},
    {"id":"stickers-pierce-v79","photoWidth":924,"photoHeight":1280,"corners":[[0,0],[923,4],[923,1279],[8,1279]],"kind":"sheet","label":"Пирс"},
    {"id":"stickers-theo-naita-v79","photoWidth":909,"photoHeight":1280,"corners":[[0,0],[901,4],[908,1279],[0,1279]],"kind":"sheet","label":"Тео и Наита"},
    {id:'stickers-02',photoWidth:600,photoHeight:800,corners:[[48,52],[552,64],[516,735],[54,743]],kind:'sheet',label:'Рич'},
    {id:'stickers-03',photoWidth:600,photoHeight:800,corners:[[57,62],[544,67],[520,717],[74,738]],kind:'sheet',label:'Джейс'},
    {id:'bookmark-front',photoWidth:450,photoHeight:800,corners:[[57,210],[198,208],[208,656],[56,659]],kind:'bookmark',label:'Закладка, сторона 1'},
    {id:'bookmark-back',photoWidth:450,photoHeight:800,corners:[[239,215],[374,212],[398,657],[245,662]],kind:'bookmark',label:'Закладка, сторона 2'}
  ];
  const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value.toFixed(11));
  function solve(rows) {
    const n=rows.length;
    for(let c=0;c<n;c++){
      let pivot=c;
      for(let r=c+1;r<n;r++)if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c]))pivot=r;
      if(Math.abs(rows[pivot][c])<1e-10)throw new Error('Degenerate merchandise surface');
      [rows[c],rows[pivot]]=[rows[pivot],rows[c]];
      const divisor=rows[c][c];
      for(let k=c;k<=n;k++)rows[c][k]/=divisor;
      for(let r=0;r<n;r++){
        if(r===c)continue;
        const factor=rows[r][c];
        for(let k=c;k<=n;k++)rows[r][k]-=factor*rows[c][k];
      }
    }
    return rows.map(row=>row[n]);
  }
  function homography(corners,width,height){
    const destination=[[0,0],[width,0],[width,height],[0,height]],rows=[];
    corners.forEach(([x,y],index)=>{
      const [u,v]=destination[index];
      rows.push([x,y,1,0,0,0,-u*x,-u*y,u]);
      rows.push([0,0,0,x,y,1,-v*x,-v*y,v]);
    });
    return [...solve(rows),1];
  }
  const geometry = new Map(surfaces.map(surface=>{
    const width=surface.kind==='bookmark'?110:320,height=surface.kind==='bookmark'?330:457;
    const h=homography(surface.corners,width,height);
    const matrix=[h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,1].map(number);
    return [surface.id,{...surface,width,height,h,matrix}];
  }));
  function renderSurface(id,src,context='detail',alt=''){
    const surface=geometry.get(id);
    if(!surface||!src)return '<span class="merch-mockup-unavailable">Изображение готовится</span>';
    const scope=['card','detail','zoom','thumb','cart'].includes(context)?context:'detail';
    const styles=`--surface-w:${surface.width};--surface-h:${surface.height};--photo-w:${surface.photoWidth};--photo-h:${surface.photoHeight};--texture-matrix:matrix3d(${surface.matrix.join(',')})`;
    return `<span class="merch-sheet merch-sheet--${surface.kind} merch-sheet--${scope}" data-surface="${escape(id)}" style="${styles}" role="img" aria-label="${escape(alt||surface.label)}"><span class="merch-sheet-body" aria-hidden="true"><span class="merch-surface"><img class="surface-photo" src="${escape(src)}" width="${surface.photoWidth}" height="${surface.photoHeight}" alt="" loading="${scope==='detail'?'eager':'lazy'}" decoding="async" draggable="false"><span class="merch-print-light"></span></span></span></span>`;
  }
  function renderProduct(product,context='card'){
    const scope=context==='thumb'||context==='cart'?'thumb':'card';
    const photos=product.gallery||[];
    if(scope==='thumb'){
      const photo=photos[0];
      return `<span class="mockup-scene mockup-scene--thumb" role="img" aria-label="${escape(product.name)}">${photo?renderSurface(photo.surface,photo.src,'cart',photo.alt):''}</span>`;
    }
    if(product.id==='bookmarks'){
      const sides=photos.slice(0,2);
      return `<span class="mockup-scene mockup-scene--bookmarks" role="img" aria-label="${escape(product.name)}"><span class="mockup-floor-shadow" aria-hidden="true"></span><span class="mockup-duo" aria-hidden="true">${sides.map((photo,i)=>`<span class="mockup-bookmark-slot mockup-bookmark-slot--${i+1}">${renderSurface(photo.surface,photo.src,'card',photo.alt)}</span>`).join('')}</span></span>`;
    }
    const slots=[{a:0,x:0,y:5,z:20},{a:-5.5,x:-13,y:2,z:19},{a:5.5,x:13,y:2,z:18},{a:-11,x:-26,y:0,z:17},{a:11,x:26,y:0,z:16},{a:-16.5,x:-39,y:-1,z:15},{a:16.5,x:39,y:-1,z:14},{a:-22,x:-52,y:-1,z:13},{a:22,x:52,y:-1,z:12}];
    return `<span class="mockup-scene mockup-scene--pack" role="img" aria-label="${escape(product.name)}"><span class="mockup-floor-shadow" aria-hidden="true"></span><span class="mockup-fan" aria-hidden="true">${photos.slice(0,9).map((photo,i)=>{const slot=slots[i];return `<span class="mockup-fan-slot" style="--fan-angle:${slot.a}deg;--fan-x:${slot.x}px;--fan-y:${slot.y}px;z-index:${slot.z}">${renderSurface(photo.surface,photo.src,'card',photo.alt)}</span>`;}).join('')}</span></span>`;
  }
  function validateGeometry(){
    return [...geometry.values()].map(surface=>{
      const target=[[0,0],[surface.width,0],[surface.width,surface.height],[0,surface.height]];
      let error=0;
      surface.corners.forEach(([x,y],index)=>{
        const h=surface.h,denominator=h[6]*x+h[7]*y+1;
        const u=(h[0]*x+h[1]*y+h[2])/denominator,v=(h[3]*x+h[4]*y+h[5])/denominator;
        error=Math.max(error,Math.abs(u-target[index][0]),Math.abs(v-target[index][1]));
      });
      return {id:surface.id,maxCornerError:error};
    });
  }
  window.RiMerchMockups=Object.freeze({renderSurface,renderProduct,validateGeometry});
})();
