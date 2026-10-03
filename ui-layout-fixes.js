/* Blooming layout + canonical profile URL fixes. */
(function(){
'use strict';
var s=document.createElement('style');s.id='blooming-layout-fixes';s.textContent=`
html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}
body{overscroll-behavior-x:none!important;}
.sh{min-height:100vh!important;height:auto!important;overflow:visible!important;}
.nv{position:fixed!important;left:0!important;top:0!important;width:250px!important;height:100vh!important;max-height:100vh!important;overflow:hidden!important;z-index:1000!important;}
.sh>main{min-height:100vh!important;overflow:visible!important;}
.rc{position:static!important;height:auto!important;max-height:none!important;overflow:visible!important;}
.side,.sidebar,.right,.sidecol,.feed,.timeline,.content,.layout,.shell,.cols,.grid,.home,.homegrid,.feedcol{overflow:visible!important;max-height:none!important;}
@media(max-width:900px){
 .sh{display:block!important;min-height:100vh!important;overflow:visible!important;}
 .nv{left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:68px!important;max-height:68px!important;padding:5px 6px!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-around!important;gap:2px!important;background:var(--card)!important;border-top:1px solid var(--line)!important;overflow:hidden!important;z-index:10000!important;}
 .nv .lg,.nv .me,.nv>.b{display:none!important;}
 .nv a,.nv button.l{flex:1 1 0!important;min-width:0!important;height:58px!important;padding:7px 3px!important;margin:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;font-size:0!important;border-radius:12px!important;}
 .nv a .ic,.nv button.l .ic{width:25px!important;height:25px!important;}
 .sh>main{width:100%!important;min-height:calc(100vh - 68px)!important;padding-bottom:76px!important;overflow:visible!important;}
 .rc{display:block!important;width:100%!important;position:static!important;height:auto!important;max-height:none!important;padding:14px 16px!important;}
}
@media(max-width:700px){
 html,body{overflow-x:hidden!important;overflow-y:auto!important;}
 .sh,main,.rc{overflow:visible!important;}
 .side,.sidebar,.right,.sidecol,.feed,.timeline,.content{overflow:visible!important;max-height:none!important;}
}
`;
(document.head||document.documentElement).appendChild(s);
function clean(v){return String(v||'').replace(/^@/,'').trim()}
function userFromId(id){try{if(window.S&&S.u){var u=S.u[id];if(u&&u.user)return clean(u.user);var x=Object.values(S.u).find(function(y){return String(y&&y.id||'')===String(id)});if(x&&x.user)return clean(x.user)}}catch(e){}return clean(id)}
function canonical(id){var u=userFromId(id);return location.origin+'/blooming/perfil/'+encodeURIComponent(u)}
function route(id){if(!id)return;try{var url=canonical(id);if(typeof window.R==='function'){location.hash='#/perfil/'+encodeURIComponent(id);window.R()}history.replaceState({bloomingProfile:userFromId(id)},'',url)}catch(e){console.warn('Blooming profile route',e)}}
document.addEventListener('click',function(ev){var a=ev.target&&ev.target.closest?ev.target.closest('a[href^="#/perfil/"]'):null;if(!a)return;var h=a.getAttribute('href')||'',m=h.match(/^#\/perfil\/([^/?#]+)/i);if(!m)return;var id=decodeURIComponent(m[1]);if(!window.S||!S.u||!S.u[id])return;ev.preventDefault();ev.stopPropagation();route(id)},true);
})();