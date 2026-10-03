/* Blooming compatibility / synchronization helpers. */
(function(){
  'use strict';

  /* Keep the left navigation fixed while the center/right content scrolls. */
  function installLayoutFix(){
    if(document.getElementById('blooming-layout-fix')) return;
    var s=document.createElement('style');
    s.id='blooming-layout-fix';
    s.textContent='html,body{min-height:100%;overflow-x:hidden}.sh{align-items:start}.nv{position:sticky!important;top:0!important;height:100vh!important;max-height:100vh!important;overflow:hidden!important;align-self:start}.nv>*{flex-shrink:0}.sh>main{min-height:100vh}.rc{position:sticky!important;top:0!important;align-self:start} @media(max-width:900px){.nv{position:sticky!important;top:0!important;height:100vh!important;overflow:hidden!important}}';
    document.head.appendChild(s);
  }

  function codeFor(post){
    if(!post) return '';
    if(post.postCode) return String(post.postCode);
    var raw=String(post.id||''); if(!raw) return '';
    var h=0; for(var i=0;i<raw.length;i++) h=((h<<5)-h+raw.charCodeAt(i))|0;
    return ('000000'+Math.abs(h).toString(36).toUpperCase()).slice(-6);
  }
  function usernameFor(post){
    try{ if(window.U){var u=U(post.u);if(u&&u.user)return String(u.user).replace(/^@/,'');} }catch(_){ }
    return String(post&&post.username||'').replace(/^@/,'');
  }
  function siteBase(){ return location.origin + '/blooming'; }
  function profileUrl(user){ user=String(user||'').replace(/^@/,''); return user?siteBase()+'/perfil/'+encodeURIComponent(user):''; }
  function postUrl(post){ var user=usernameFor(post),code=codeFor(post); return user&&code?siteBase()+'/perfil/'+encodeURIComponent(user)+'/post/'+encodeURIComponent(code):''; }
  function ensurePostCode(post){if(!post)return '';if(!post.postCode)post.postCode=codeFor(post);return post.postCode;}

  window.BloomingProfileMediaV2={restore:function(){},capture:function(){},saveVisible:function(){},postCode:codeFor,postUrl:postUrl,profileUrl:profileUrl,ensurePostCode:ensurePostCode};
  window.BloomingPostLinks={code:codeFor,url:postUrl,profile:profileUrl,ensure:ensurePostCode};

  function findDeep(){
    var p=String(location.pathname||'');
    var m=p.match(/\/blooming\/perfil\/([^/]+)(?:\/post\/([^/?#]+))?/i);
    if(!m)return null;
    return {user:decodeURIComponent(m[1]),code:m[2]?decodeURIComponent(m[2]):null};
  }
  function openDeep(){
    try{
      var q=findDeep();if(!q||!window.S)return false;
      if(!q.code){
        var target=Object.values(S.u||{}).find(function(u){return String(u&&u.user||'').toLowerCase()===q.user.toLowerCase();});
        if(target&&typeof window.openProfile==='function'){window.openProfile(target.id);return true;}
        if(target&&typeof window.profilePage==='function'){window.profilePage(target.id);return true;}
        return false;
      }
      var p=(Array.isArray(S.posts)?S.posts:[]).find(function(x){return String(x.postCode||codeFor(x))===q.code&&usernameFor(x).toLowerCase()===q.user.toLowerCase();});
      if(p&&typeof window.openPost==='function'){window.openPost(p.id);return true;}
    }catch(e){console.warn('Blooming deep link',e)}
    return false;
  }

  /* Supabase is authoritative for the profile picker. */
  async function syncPickerProfilesFromCloud(){
    if(typeof CLOUD_ON==='undefined'||!CLOUD_ON||!window.SB)return false;
    try{
      var a=typeof currentAccount==='function'?currentAccount():null;if(!a)return false;
      var remoteAccountId=typeof cloudAccountId==='function'?cloudAccountId(a.id):a.id;if(!remoteAccountId)return false;
      var res=await SB.from('blooming_profiles').select('*').eq('account_id',remoteAccountId).order('created_at',{ascending:true});
      if(res.error)throw res.error;
      var rows=Array.isArray(res.data)?res.data:[];
      S.accounts=S.accounts||{};S.u=S.u||{};
      var local=S.accounts[a.id]||a;
      local.profiles=rows.map(function(p){
        var id=String(p.id),old=S.u[id]||{};
        S.u[id]=Object.assign({},old,{id:id,nome:p.nome||old.nome||'Perfil',user:String(p.username||old.user||'').replace(/^@/,''),bio:p.bio!=null?p.bio:(old.bio||''),loc:p.loc!=null?p.loc:(old.loc||''),cor:p.cor||old.cor||'#E8336F',emo:p.emo||old.emo||'🌸',foto:p.foto!=null?p.foto:(old.foto||''),capa:p.capa!=null?p.capa:(old.capa||''),verificado:!!p.verificado,privada:!!p.privada,seg:+p.seg||0,sgd:+p.sgd||0,accountId:remoteAccountId});
        return id;
      });
      S.accounts[a.id]=local;
      if(typeof saveLocalOnly==='function')saveLocalOnly();
      return true;
    }catch(e){console.warn('Blooming picker Supabase refresh',e);return false;}
  }
  async function refreshPicker(){try{await syncPickerProfilesFromCloud();if(typeof R==='function')R();}catch(e){console.warn(e)}}
  window.BloomingRefreshProfilePicker=refreshPicker;

  function install(){
    installLayoutFix();
    if(window.__bloomingPickerCloudSourceInstalled)return;
    if(typeof window.unlockScreen==='function'){
      var original=window.unlockScreen;
      window.unlockScreen=async function(ok){
        if(ok&&typeof CLOUD_ON!=='undefined'&&CLOUD_ON&&window.SB)await refreshPicker();
        return original.apply(this,arguments);
      };
      window.__bloomingPickerCloudSourceInstalled=true;
    }
  }
  function boot(){
    install();setTimeout(install,500);setTimeout(install,1500);
    if(window.S&&Array.isArray(S.posts))S.posts.forEach(ensurePostCode);
    setTimeout(openDeep,50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
