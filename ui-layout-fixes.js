/* Blooming UI fixes
   - Left navigation stays fixed in the viewport.
   - Center feed and right sidebar scroll with the page together.
   - No independent scrollbar is created for the right sidebar.
   - Restore the Settings -> Edit profile action without replacing the existing editor.
*/
(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='blooming-layout-fixes';
  style.textContent=`
    html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}
    .sh{min-height:100vh!important;height:auto!important;overflow:visible!important;}

    /* Left navigation: fixed and never participates in page scrolling. */
    .nv{position:fixed!important;left:0!important;top:0!important;width:250px!important;height:100vh!important;max-height:100vh!important;overflow:visible!important;z-index:20!important;}

    /* Keep the center and right columns in normal document flow. */
    main{overflow:visible!important;min-height:100vh!important;}
    .rc{position:static!important;height:auto!important;max-height:none!important;overflow:visible!important;}

    /* Remove accidental nested scrolling from common layout containers. */
    .layout,.shell,.content,.feed,.timeline,.side,.sidebar,.left,.right,
    .cols,.grid,.home,.homegrid,.feedcol,.sidecol{overflow-y:visible!important;overflow-x:visible!important;}

    /* The page, not the right-hand cards, owns vertical scrolling. */
    .bx,.tr,.us,.cd{overflow:visible!important;max-height:none!important;}

    /* Preserve a usable layout when the viewport becomes narrow. */
    @media(max-width:900px){
      .sh{grid-template-columns:minmax(0,1fr)!important;}
      .nv{position:sticky!important;top:0!important;width:auto!important;height:auto!important;max-height:none!important;}
      main{grid-column:1!important;}
      .rc{grid-column:1!important;}
    }

    @media(max-width:700px){
      html,body{overflow-y:auto!important;}
      .nv{position:sticky!important;top:0!important;z-index:20!important;}
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
      if(typeof window.editU==='function'){
        window.editU(id||undefined);
        return true;
      }
      var b=document.querySelector('#md [data-m="ed"]');
      if(b){b.click();return true;}
    }catch(e){console.warn('Blooming edit profile fix',e);}
    return false;
  }

  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest('#md [data-m="ed"]'):null;
    if(!b) return;
    setTimeout(function(){
      var md=document.getElementById('md');
      if(md && md.open){
        var title=md.querySelector('h2');
        var looksEditor=title && /editar perfil/i.test(title.textContent||'');
        if(!looksEditor) editActiveProfile();
      }
    },80);
  },false);

  window.__bloomingRefreshLayout=function(){
    try{
      document.documentElement.style.overflowY='auto';
      document.body.style.overflowY='auto';
    }catch(_){ }
  };
})();
