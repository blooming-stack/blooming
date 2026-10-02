/* Blooming — compatibility fixes for the existing index.html. */
(function(){
  'use strict';
  function closeProfileManager(){
    ['#manageProfilesModal','#profileManagerModal','#manageProfiles','#profilesManager','[data-modal="manage-profiles"]'].forEach(function(s){
      document.querySelectorAll(s).forEach(function(el){el.classList.remove('open','show','active','visible');el.setAttribute('aria-hidden','true');el.style.display='none';});
    });
    try{if(typeof closeModal==='function') closeModal('manageProfilesModal');}catch(e){}
  }
  function placeLotus(){
    document.querySelectorAll('.pin-lotus,[data-pinned-icon],.pinned-icon').forEach(function(icon){
      var post=icon.closest('.po,.post,.pinned-post,[data-pinned="true"],[data-pinned="1"]');
      if(!post)return;
      if(post.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))return;
      post.classList.add('blooming-pinned-fixed');post.style.position='relative';
      icon.style.cssText+=';position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;width:26px!important;height:26px!important;transform:none!important;z-index:20!important;';
    });
  }
  function hideInvalidShare(){
    document.querySelectorAll('.ac button,.ac .actionlink,button,a').forEach(function(el){
      var t=(el.textContent||'').trim().toLowerCase();
      if((t.indexOf('compart')>=0||t.indexOf('share')>=0)&&el.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))el.style.display='none';
    });
  }
  function bindForgotCode(){
    document.querySelectorAll('[data-a="forgot"]').forEach(function(btn){
      if(btn.dataset.bloomingForgotBound==='1')return;
      btn.dataset.bloomingForgotBound='1';
      btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();try{if(typeof forgotCode==='function')forgotCode();else if(window.forgotCode)window.forgotCode();}catch(err){console.error('Blooming forgot-code',err);}},true);
    });
  }

  /* Keep the old helper harmless. Profile media is now owned by editU() in index.html. */
  async function repairProfileMedia(){try{if(typeof restoreProfileMediaDB==='function')await restoreProfileMediaDB();}catch(e){console.warn('Blooming profile media repair',e)}}

  /*
   * Cross-device synchronization fixes.
   * The original publishPost() only changed S.posts and rendered the feed; it did
   * not write the new post to blooming_posts. The wrapper below preserves the
   * original UI and then persists that post to Supabase through cloudSync().
   */
  function installCloudPatches(){
    try{
      if(typeof window.publishPost==='function'&&!window.__bloomingPublishCloudPatch){
        var originalPublish=window.publishPost;
        window.publishPost=async function(){
          var before=new Set((S.posts||[]).map(function(p){return String(p.id)}));
          await originalPublish.apply(this,arguments);
          if(typeof saveLocalOnly==='function')saveLocalOnly();
          if(typeof CLOUD_ON!=='undefined'&&CLOUD_ON&&typeof SB!=='undefined'&&SB&&typeof cloudSync==='function'){
            try{await cloudSync();}
            catch(err){console.warn('Blooming publish cloud sync',err)}
          }
          return [...(S.posts||[])].find(function(p){return !before.has(String(p.id))})||null;
        };
        window.__bloomingPublishCloudPatch=true;
      }

      if(typeof window.cloudPull==='function'&&!window.__bloomingCloudPullPatch){
        var originalPull=window.cloudPull;
        window.cloudPull=async function(){
          var result=await originalPull.apply(this,arguments);
          try{
            /* Rebuild account → profile membership from each profile's canonical
               accountId. This is what makes the profile picker consistent on a
               second device instead of relying on that device's old local list. */
            if(S&&S.accounts&&S.u){
              Object.values(S.accounts).forEach(function(a){a.profiles=[]});
              Object.values(S.u).forEach(function(u){
                if(!u||!u.id||!u.accountId)return;
                if(!S.accounts[u.accountId])S.accounts[u.accountId]={id:u.accountId,nome:u.nome||'Conta',pw:'',profiles:[],legacy:String(u.accountId).indexOf('legacy:')===0};
                var a=S.accounts[u.accountId];a.profiles=Array.isArray(a.profiles)?a.profiles:[];
                if(!a.profiles.includes(u.id))a.profiles.push(u.id);
              });
              var a=typeof currentAccount==='function'?currentAccount():null;
              if(a&&S.me&&(!a.profiles||!a.profiles.includes(S.me)))S.me=null;
              if(typeof saveLocalOnly==='function')saveLocalOnly();
            }
          }catch(err){console.warn('Blooming account/profile reconciliation',err)}
          return result;
        };
        window.__bloomingCloudPullPatch=true;
      }
    }catch(err){console.warn('Blooming cloud patches',err)}
  }

  function refreshRemote(){
    try{if(navigator.onLine&&typeof CLOUD_ON!=='undefined'&&CLOUD_ON&&typeof cloudPull==='function')cloudPull()}catch(e){console.warn('Blooming remote refresh',e)}
  }

  function run(){bindForgotCode();placeLotus();hideInvalidShare();repairProfileMedia();installCloudPatches()}
  window.BloomingDirectFixes={closeProfileManager:closeProfileManager,placeLotus:placeLotus,bindForgotCode:bindForgotCode,repairProfileMedia:repairProfileMedia};
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#manageProfilesModal .close,#manageProfilesModal .modal-close,#manageProfilesModal [data-close-modal],#profileManagerModal .close');
    if(b){e.preventDefault();e.stopPropagation();closeProfileManager();}
  },true);
  window.addEventListener('online',refreshRemote);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(refreshRemote,250)});
  document.addEventListener('DOMContentLoaded',function(){run();setTimeout(run,500);setTimeout(run,1500);setTimeout(run,3000);setTimeout(installCloudPatches,5000);});
  new MutationObserver(function(){bindForgotCode();placeLotus();hideInvalidShare();installCloudPatches()}).observe(document.documentElement,{childList:true,subtree:true});
})();
