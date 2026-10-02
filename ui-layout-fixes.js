/* Blooming UI fixes
   - Page owns scrolling; side cards never create their own vertical scrollbar.
   - Restore the Settings -> Edit profile action without replacing the existing editor.
   - Keep changes scoped to the active profile.
*/
(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='blooming-layout-fixes';
  style.textContent=`
    html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}
    #app{min-height:100vh;overflow:visible!important;}
    main,.layout,.shell,.content,.feed,.timeline,.side,.sidebar,.left,.right,
    .cols,.grid,.home,.homegrid,.feedcol,.sidecol{overflow-y:visible!important;overflow-x:visible!important;}
    .side,.sidebar,.sidecol,.right{height:auto!important;max-height:none!important;position:sticky;top:76px;align-self:flex-start;}
    @media(max-width:800px){.side,.sidebar,.sidecol,.right{position:static!important;}}
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
      /* Existing handler normally owns data-m="ed". If it was intercepted by
         an earlier patch, trigger the same action again after the modal closes. */
      var b=document.querySelector('#md [data-m="ed"]');
      if(b){b.click();return true;}
    }catch(e){console.warn('Blooming edit profile fix',e);}
    return false;
  }

  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest('#md [data-m="ed"]'):null;
    if(!b) return;
    /* Let the native application handler run; this only repairs cases where
       a compatibility patch swallowed the action. */
    setTimeout(function(){
      var md=document.getElementById('md');
      if(md && md.open){
        var title=md.querySelector('h2');
        var looksEditor=title && /editar perfil/i.test(title.textContent||'');
        if(!looksEditor) editActiveProfile();
      }
    },80);
  },false);

  /* Expose a safe hook for the existing application without replacing it. */
  window.__bloomingRefreshLayout=function(){
    try{document.documentElement.style.overflowY='auto';document.body.style.overflowY='auto';}catch(_){ }
  };
})();
