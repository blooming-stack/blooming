/* Blooming UI fixes + canonical profile URLs
   - Desktop: left navigation fixed; center + right use the document scroll.
   - Mobile: navigation is fixed and never becomes a scroll container.
   - Canonical profile links use /perfil/username instead of #/perfil/id.
*/
(function(){
  'use strict';
  var style=document.createElement('style');
  style.id='blooming-layout-fixes';
  style.textContent=`
    html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}
    body{overscroll-behavior-x:none!important;}
    .sh{min-height:100vh!important;height:auto!important;overflow:visible!important;}
    .nv{position:fixed!important;left:0!important;top:0!important;width:250px!important;height:100vh!important;max-height:100vh!important;overflow:visible!important;z-index:100!important;}
    main{overflow:visible!important;min-height:100vh!important;}
    .rc{position:static!important;height:auto!important;max-height:none!important;overflow:visible!important;}
    .layout,.shell,.content,.feed,.timeline,.side,.sidebar,.left,.right,.cols,.grid,.home,.homegrid,.feedcol,.sidecol{overflow-y:visible!important;overflow-x:visible!important;max-height:none!important;}
    .bx,.tr,.us,.cd{overflow:visible!important;max-height:none!important;}
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
      .side,.sidebar,.right,.sidecol,.feed,.timeline,.content{overflow:visible!important;max-height:none!important;}
    }
  `;
  (document.head||document.documentElement).appendChild(style);

  function editActiveProfile(){
    try{
      var id=null;
      if(window.S && S.me) id=S.me;
      if(!id && window.location.hash){var m=String(location.hash).match(/^#\/perfil\/([^/?#]+)/);if(m)id=decodeURIComponent(m[1]);}
      if(typeof window.editU==='function'){window.editU(id||undefined);return true;}
      var b=document.querySelector('#md [data-m="ed"]');
      if(b){b.click();return true;}
    }catch(e){console.warn('Blooming edit profile fix',e);}
    return false;
  }
  function cleanUser(v){return String(v||'').replace(/^@/,'').trim();}
  function profileUserFromId(id){
    try{
      if(window.S&&S.u){var u=S.u[id];if(u&&u.user)return cleanUser(u.user);}
      if(window.S&&S.u){var vals=Object.values(S.u);var hit=vals.find(function(u){return String(u&&u.id||'')===String(id)});if(hit&&hit.user)return cleanUser(hit.user);}
    }catch(e){}
    return cleanUser(id);
  }
  function canonicalProfile(id){
    var u=profileUserFromId(id);
    return location.origin+'/blooming/perfil/'+encodeURIComponent(u);
  }
  function routeCanonical(id){
    try{
      if(!id)return false;
      var canonical=canonicalProfile(id);
      /* R() in the original app reads the hash. Use it only as an internal route,
         then immediately replace the visible URL with the canonical pathname. */
      var oldHash=location.hash;
      location.hash='#/perfil/'+encodeURIComponent(id);
      if(typeof window.R==='function')window.R();
      history.replaceState({bloomingProfile:profileUserFromId(id)},'',canonical);
      return true;
    }catch(e){console.warn('Blooming canonical profile route',e);return false;}
  }
  function canonicalizeCurrentPath(){
    try{
      var p=String(location.pathname||'');
      var m=p.match(/\/blooming\/perfil\/([^/?#]+)/i);
      if(m&&typeof window.R==='function'){
        var wanted=decodeURIComponent(m[1]);
        var id=null;
        if(window.S&&S.u){var vals=Object.values(S.u);var hit=vals.find(function(u){return cleanUser(u&&u.user).toLowerCase()===wanted.toLowerCase()||String(u&&u.id||'')===wanted});if(hit)id=hit.id;}
        if(id){location.hash='#/perfil/'+encodeURIComponent(id);window.R();history.replaceState({bloomingProfile:wanted},'',location.origin+'/blooming/perfil/'+encodeURIComponent(profileUserFromId(id)));}
      }
    }catch(e){console.warn('Blooming canonical initial route',e);}
  }
  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('a[href]'):null;
    if(target){
      var href=target.getAttribute('href')||'';
      var m=href.match(/^#\/perfil\/([^/?#]+)/i);
      if(m){
        ev.preventDefault();
        routeCanonical(decodeURIComponent(m[1]));
        return;
      }
    }
    var b=ev.target&&ev.target.closest?ev.target.closest('#md [data-m="ed"]'):null;
    if(!b)return;
    setTimeout(function(){var md=document.getElementById('md');if(md&&md.open){var title=md.querySelector('h2');if(!(title&&/editar perfil/i.test(title.textContent||'')))editActiveProfile();}},80);
  },false);
  function boot(){setTimeout(canonicalizeCurrentPath,80);setTimeout(canonicalizeCurrentPath,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
