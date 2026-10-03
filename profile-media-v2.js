/* Blooming compatibility helpers.
   This file is loaded by index.html. It deliberately does not rewrite avatar/cover
   elements globally, because profile media belongs to the individual profile.

   Deep post links:
     /@username/post/CODE
   A stable short code is stored on each post as postCode. Older posts get a
   deterministic fallback from their existing id without changing the post id.
*/
(function(){
  'use strict';

  function codeFor(post){
    if(!post) return '';
    if(post.postCode) return String(post.postCode);
    var raw=String(post.id||'');
    if(!raw) return '';
    var h=0;
    for(var i=0;i<raw.length;i++) h=((h<<5)-h+raw.charCodeAt(i))|0;
    h=Math.abs(h).toString(36).toUpperCase();
    return ('000000'+h).slice(-6);
  }

  function usernameFor(post){
    try{
      if(window.U){ var u=U(post.u); if(u&&u.user) return String(u.user); }
    }catch(_){ }
    return String(post&&post.username||'').replace(/^@/,'');
  }

  function postUrl(post){
    var user=usernameFor(post), code=codeFor(post);
    if(!user||!code) return '';
    var base=location.origin+location.pathname;
    return base.replace(/\/$/,'')+'/@'+encodeURIComponent(user)+'/post/'+encodeURIComponent(code);
  }

  function ensurePostCode(post){
    if(!post) return '';
    if(!post.postCode) post.postCode=codeFor(post);
    return post.postCode;
  }

  function findDeepPost(){
    var path=String(location.pathname||'');
    var m=path.match(/\/@([^/]+)\/post\/([^/?#]+)/);
    if(!m) return null;
    return {user:decodeURIComponent(m[1]),code:decodeURIComponent(m[2])};
  }

  function openDeepPost(){
    try{
      var q=findDeepPost();
      if(!q || !window.S || !Array.isArray(S.posts)) return false;
      var p=S.posts.find(function(x){
        var code=String(x.postCode||codeFor(x));
        return code===q.code && String(usernameFor(x)).toLowerCase()===q.user.toLowerCase();
      });
      if(!p) return false;
      if(typeof window.openPost==='function'){ window.openPost(p.id); return true; }
      if(typeof window.viewPost==='function'){ window.viewPost(p.id); return true; }
      location.hash='#/post/'+encodeURIComponent(p.id);
      return true;
    }catch(e){ console.warn('Blooming deep post link',e); return false; }
  }

  function patchShareLink(){
    try{
      if(!window.S || !Array.isArray(S.posts)) return;
      S.posts.forEach(ensurePostCode);
    }catch(_){ }
  }

  window.BloomingProfileMediaV2={
    restore:function(){},
    capture:function(){},
    saveVisible:function(){},
    postCode:codeFor,
    postUrl:postUrl,
    ensurePostCode:ensurePostCode
  };

  window.BloomingPostLinks={
    code:codeFor,
    url:postUrl,
    ensure:ensurePostCode
  };

  /* Profile picker: Supabase is authoritative whenever cloud is connected.
     Never build the picker from a stale local account.profiles array first. */
  async function syncPickerProfilesFromCloud(){
    if(typeof CLOUD_ON==='undefined'||!CLOUD_ON||!window.SB) return false;
    try{
      var a=typeof currentAccount==='function'?currentAccount():null;
      if(!a) return false;
      var remoteAccountId=typeof cloudAccountId==='function'?cloudAccountId(a.id):a.id;
      if(!remoteAccountId) return false;
      var res=await SB.from('blooming_profiles').select('*').eq('account_id',remoteAccountId).order('id',{ascending:true});
      if(res.error) throw res.error;
      var rows=Array.isArray(res.data)?res.data:[];
      S.accounts=S.accounts||{};
      var localAccount=S.accounts[a.id]||a;
      localAccount.profiles=[];
      S.accounts[a.id]=localAccount;
      rows.forEach(function(p){
        if(!p||!p.id) return;
        var id=String(p.id),old=S.u&&S.u[id]?S.u[id]:{};
        S.u=S.u||{};
        S.u[id]=Object.assign({},old,{
          id:id,
          nome:p.nome||old.nome||'Perfil',
          user:String(p.username||old.user||'').replace(/^@/,''),
          bio:p.bio!=null?p.bio:(old.bio||''),
          loc:p.loc!=null?p.loc:(old.loc||''),
          cor:p.cor||old.cor||'#E8336F',
          emo:p.emo||old.emo||'🌸',
          foto:p.foto!=null?p.foto:(old.foto||''),
          capa:p.capa!=null?p.capa:(old.capa||''),
          verificado:typeof p.verificado==='boolean'?p.verificado:!!old.verificado,
          privada:typeof p.privada==='boolean'?p.privada:!!old.privada,
          seg:Number.isFinite(+p.seg)?+p.seg:+old.seg||0,
          sgd:Number.isFinite(+p.sgd)?+p.sgd:+old.sgd||0,
          accountId:remoteAccountId
        });
        localAccount.profiles.push(id);
      });
      localAccount.profiles=[...new Set(localAccount.profiles)];
      if(typeof saveLocalOnly==='function') saveLocalOnly();
      return true;
    }catch(err){
      console.warn('Blooming picker Supabase refresh',err);
      return false;
    }
  }

  function installPickerCloudSource(){
    if(window.__bloomingPickerCloudSourceInstalled) return;
    if(typeof window.unlockScreen!=='function') return;
    var originalUnlock=window.unlockScreen;
    window.unlockScreen=async function(ok){
      if(ok && typeof CLOUD_ON!=='undefined' && CLOUD_ON && window.SB){
        try{
          var host=document.getElementById('app');
          if(host) host.innerHTML='<div class="lo"><h1>Quem está usando?</h1><p class="mut">Sincronizando perfis…</p></div>';
          await syncPickerProfilesFromCloud();
        }catch(err){console.warn('Blooming picker refresh',err)}
      }
      return originalUnlock.apply(this,arguments);
    };
    window.__bloomingPickerCloudSourceInstalled=true;
  }

  function pickerBoot(){
    installPickerCloudSource();
    setTimeout(installPickerCloudSource,500);
    setTimeout(installPickerCloudSource,1500);
  }

  function boot(){
    patchShareLink();
    pickerBoot();
    setTimeout(openDeepPost,0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
