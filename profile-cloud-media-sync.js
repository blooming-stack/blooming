/* Blooming: persist/refresh profile media across devices. */
(function(){
'use strict';
var started=false;
function boot(){
 if(started)return; started=true;
 if(!window.SB)return;
 var attempts=0;
 function authenticated(){
  try{return typeof UNL!=='undefined'&&UNL===true&&window.S&&S.currentAccountId&&S.me&&S.u&&S.u[S.me]}catch(_){return false}
 }
 function sync(){
  attempts++;
  try{
   /* Never run this background media refresh while the access screen/session is unstable. */
   if(!authenticated()){if(attempts<20)setTimeout(sync,700);return;}
   var active=window.S&&S.me?S.me:null;
   if(!active||!S.u||!S.u[active]){if(attempts<20)setTimeout(sync,500);return;}
   var u=S.u[active], username=String(u.user||'').replace(/^@/,'');
   var q=SB.from('blooming_profiles').select('*');
   if(u.id) q=q.eq('id',String(u.id));
   q.limit(1).then(function(res){
    if(res.error||!res.data||!res.data[0]){
      if(username) SB.from('blooming_profiles').select('*').eq('username',username).limit(1).then(apply);
      return;
    }
    apply(res);
   }).catch(function(){if(attempts<20)setTimeout(sync,800)});
  }catch(e){if(attempts<20)setTimeout(sync,800)}
 }
 function apply(res){
  var p=res&&res.data&&res.data[0];
  if(!p||!window.S||!S.u||!authenticated())return;
  var id=String(p.id||S.me), old=S.u[id]||S.u[S.me]||{};
  var next=Object.assign({},old);
  if(p.nome!=null)next.nome=p.nome;
  if(p.username!=null)next.user=String(p.username).replace(/^@/,'');
  if(p.bio!=null)next.bio=p.bio;
  if(p.loc!=null)next.loc=p.loc;
  /* Media is deliberately taken from Supabase, never from another profile/local cache. */
  if(p.foto!=null)next.foto=p.foto;
  if(p.capa!=null)next.capa=p.capa;
  if(p.profile_photo!=null)next.foto=p.profile_photo;
  if(p.cover_photo!=null)next.capa=p.cover_photo;
  if(p.avatar_url!=null)next.foto=p.avatar_url;
  if(p.cover_url!=null)next.capa=p.cover_url;
  S.u[id]=next;
  if(id!==S.me&&S.u[S.me])S.u[S.me]=next;
  try{if(typeof saveLocalOnly==='function')saveLocalOnly()}catch(e){}
  /* This was the direct source of the trace: external media sync called R() unconditionally.
     Never call R unless the authenticated session is still valid. */
  try{if(authenticated()&&typeof R==='function')R()}catch(e){}
 }
 sync();
 document.addEventListener('visibilitychange',function(){if(!document.hidden){attempts=0;sync()}});
 window.addEventListener('pageshow',function(){attempts=0;sync()});
 window.BloomingRefreshProfileMedia=sync;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,500);setTimeout(boot,1500);
})();
