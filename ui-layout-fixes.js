/* Blooming UI fixes
   - Desktop: left navigation fixed; center + right use the document scroll.
   - Mobile: navigation is fixed and never becomes a scroll container.
   - No nested vertical scrollbar in the right column/cards.
*/
(function(){
  'use strict';
  var style=document.createElement('style');
  style.id='blooming-layout-fixes';
  style.textContent=`
    html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}
    body{overscroll-behavior-x:none!important;}
    .sh{min-height:100vh!important;height:auto!important;overflow:visible!important;}

    /* Desktop: left navigation never moves. */
    .nv{position:fixed!important;left:0!important;top:0!important;width:250px!important;height:100vh!important;max-height:100vh!important;overflow:visible!important;z-index:100!important;}
    main{overflow:visible!important;min-height:100vh!important;}
    .rc{position:static!important;height:auto!important;max-height:none!important;overflow:visible!important;}
    .layout,.shell,.content,.feed,.timeline,.side,.sidebar,.left,.right,
    .cols,.grid,.home,.homegrid,.feedcol,.sidecol{overflow-y:visible!important;overflow-x:visible!important;max-height:none!important;}
    .bx,.tr,.us,.cd{overflow:visible!important;max-height:none!important;}

    /* Mobile: do not turn the navigation into a sticky scrolling block. */
    @media(max-width:900px){
      .sh{display:block!important;min-height:100vh!important;overflow:visible!important;}
      .nv{position:fixed!important;left:0!important;right:0!important;top:0!important;width:100%!important;height:auto!important;max-height:none!important;overflow:hidden!important;z-index:1000!important;}
      main{display:block!important;width:100%!important;margin:0!important;padding-top:0!important;overflow:visible!important;}
      .rc{display:block!important;width:100%!important;position:static!important;height:auto!important;max-height:none!important;overflow:visible!important;}
      .bx,.tr,.us,.cd{max-height:none!important;overflow:visible!important;}
    }

    @media(max-width:700px){
      html,body{overflow-x:hidden!important;overflow-y:auto!important;}
      .nv{overflow:hidden!important;}
      .sh,main,.rc{overflow:visible!important;}
      /* Only the document itself scrolls vertically. */
      .side,.sidebar,.right,.sidecol,.feed,.timeline,.content{overflow:visible!important;max-height:none!important;}
    }
  `;
  (document.head||document.documentElement).appendChild(style);

  function editActiveProfile(){
    try{
      var id=null;
      if(window.S && S.me) id=S.me;
      if(!id && window.location.hash){
        var m=String(location.hash).match(/^#\/perfil\/([^/?#]+)/);
        if(m) id=decodeURIComponent(m[1]);
      }
      if(typeof window.editU==='function'){ window.editU(id||undefined); return true; }
      var b=document.querySelector('#md [data-m="ed"]');
      if(b){b.click();return true;}
    }catch(e){console.warn('Blooming edit profile fix',e);}
    return false;
  }
  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest('#md [data-m="ed"]'):null;
    if(!b)return;
    setTimeout(function(){
      var md=document.getElementById('md');
      if(md&&md.open){
        var title=md.querySelector('h2');
        if(!(title&&/editar perfil/i.test(title.textContent||''))) editActiveProfile();
      }
    },80);
  },false);
})();
