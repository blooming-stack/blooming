/* Blooming — compatibility and persistence fixes for the existing index.html. */
(function(){
  'use strict';
  function closeProfileManager(){
    ['#manageProfilesModal','#profileManagerModal','#manageProfiles','#profilesManager','[data-modal="manage-profiles"]'].forEach(function(s){document.querySelectorAll(s).forEach(function(el){el.classList.remove('open','show','active','visible');el.setAttribute('aria-hidden','true');el.style.display='none';});});
    try{if(typeof closeModal==='function')closeModal('manageProfilesModal')}catch(e){}
  }
  function placeLotus(){document.querySelectorAll('.pin-lotus,[data-pinned-icon],.pinned-icon').forEach(function(icon){var post=icon.closest('.po,.post,.pinned-post,[data-pinned="true"],[data-pinned="1"]');if(!post||post.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))return;post.classList.add('blooming-pinned-fixed');post.style.position='relative';icon.style.cssText+=';position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;width:26px!important;height:26px!important;transform:none!important;z-index:20!important;';});}
  function hideInvalidShare(){document.querySelectorAll('.ac button,.ac .actionlink,button,a').forEach(function(el){var t=(el.textContent||'').trim().toLowerCase();if((t.indexOf('compart')>=0||t.indexOf('share')>=0)&&el.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))el.style.display='none';});}
  function bindForgotCode(){document.querySelectorAll('[data-a="forgot"]').forEach(function(btn){if(btn.dataset.bloomingForgotBound==='1')return;btn.dataset.bloomingForgotBound='1';btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();try{if(typeof forgotCode==='function')forgotCode();else if(window.forgotCode)window.forgotCode();}catch(err){console.error('Blooming forgot-code',err)}},true);});}
  async function repairProfileMedia(){try{if(typeof restoreProfileMediaDB==='function')await restoreProfileMediaDB()}catch(e){console.warn('Blooming profile media repair',e)}}

  function fixPageScroll(){
    if(document.getElementById('blooming-scroll-fix'))return;
    var style=document.createElement('style');style.id='blooming-scroll-fix';
    style.textContent='html,body{overflow-x:hidden!important;overflow-y:auto!important;height:auto!important;min-height:100%;}#app{min-height:100vh;overflow:visible!important}.sh{align-items:start!important}.nv{position:sticky!important;top:0!important;height:100vh!important;align-self:start!important;overflow:visible!important}.rc{position:static!important;top:auto!important;height:auto!important;max-height:none!important;overflow:visible!important;align-self:start!important}main{overflow:visible!important;height:auto!important;max-height:none!important}@media(max-width:900px){.nv{position:sticky!important;top:0!important}.rc{position:static!important}}';
    (document.head||document.documentElement).appendChild(style);
  }

  async function persistProfileToCloud(u){
    try{
      if(!u||typeof CLOUD_ON==='undefined'||!CLOUD_ON||typeof SB==='undefined'||!SB)return;
      var accountId=u.accountId||null;
      try{var a=typeof currentAccount==='function'?currentAccount():null;if(a&&a.id)accountId=typeof cloudAccountId==='function'?cloudAccountId(a.id):a.id}catch(_){ }
      if(!accountId)return;
      var row={id:u.id,account_id:accountId,nome:u.nome||'Perfil',username:u.user||'',bio:u.bio||'',loc:u.loc||'',cor:u.cor||'#E8336F',emo:u.emo||'🌸',foto:u.foto||'',capa:u.capa||'',verificado:!!u.verificado,privada:!!u.privada,seg:+u.seg||0,sgd:+u.sgd||0};
      var r=await SB.from('blooming_profiles').upsert(row,{onConflict:'id'});if(r&&r.error)throw r.error;
      u.accountId=accountId;if(typeof saveLocalOnly==='function')saveLocalOnly();
    }catch(err){console.warn('Blooming explicit profile sync',err)}
  }

  function installProfilePersistence(){
    try{
      if(typeof window.editU==='function'&&!window.__bloomingEditPersistencePatch){
        var originalEdit=window.editU;
        window.editU=function(id){
          var result=originalEdit.apply(this,arguments);
          setTimeout(function(){
            var modal=document.getElementById('md');if(!modal)return;
            if(modal.dataset.bloomingProfileSaveBound==='1')return;
            var originalClick=modal.onclick;
            if(typeof originalClick!=='function')return;
            modal.dataset.bloomingProfileSaveBound='1';
            modal.onclick=async function(e){
              var m=e.target.closest&&e.target.closest('[data-m]')?.dataset.m;
              if(m!=='s')return originalClick.call(this,e);
              try{
                /* Run the original editor first: it reads the form, updates S.u,
                   uploads media and closes the modal. Only then persist the final
                   profile object again, so name/bio/location cannot be overwritten
                   by a stale local copy after a reload. */
                var out=await originalClick.call(this,e);
                var pid=id||S.me,u=S&&S.u&&S.u[pid];
                if(u)await persistProfileToCloud(u);
                return out;
              }catch(err){console.warn('Blooming profile save hook',err);try{return await originalClick.call(this,e)}catch(_){return undefined}}
            };
          },0);
          return result;
        };
        window.__bloomingEditPersistencePatch=true;
      }
    }catch(err){console.warn('Blooming edit persistence patch',err)}
  }

  function installCloudPatches(){
    try{
      if(typeof window.publishPost==='function'&&!window.__bloomingPublishCloudPatch){
        var originalPublish=window.publishPost;
        window.publishPost=async function(){var before=new Set((S.posts||[]).map(function(p){return String(p.id)}));await originalPublish.apply(this,arguments);if(typeof saveLocalOnly==='function')saveLocalOnly();if(typeof CLOUD_ON!=='undefined'&&CLOUD_ON&&typeof SB!=='undefined'&&SB&&typeof cloudSync==='function'){try{await cloudSync()}catch(err){console.warn('Blooming publish cloud sync',err)}}return [...(S.posts||[])].find(function(p){return !before.has(String(p.id))})||null};
        window.__bloomingPublishCloudPatch=true;
      }
      if(typeof window.cloudPull==='function'&&!window.__bloomingCloudPullPatch){
        var originalPull=window.cloudPull;
        window.cloudPull=async function(){var result=await originalPull.apply(this,arguments);try{if(S&&S.accounts&&S.u){Object.values(S.accounts).forEach(function(a){a.profiles=[]});Object.values(S.u).forEach(function(u){if(!u||!u.id||!u.accountId)return;if(!S.accounts[u.accountId])S.accounts[u.accountId]={id:u.accountId,nome:u.nome||'Conta',pw:'',profiles:[],legacy:String(u.accountId).indexOf('legacy:')===0};var a=S.accounts[u.accountId];a.profiles=Array.isArray(a.profiles)?a.profiles:[];if(!a.profiles.includes(u.id))a.profiles.push(u.id)});if(typeof saveLocalOnly==='function')saveLocalOnly()}}catch(err){console.warn('Blooming account/profile reconciliation',err)}return result};
        window.__bloomingCloudPullPatch=true;
      }
    }catch(err){console.warn('Blooming cloud patches',err)}
  }
  function refreshRemote(){try{if(navigator.onLine&&typeof CLOUD_ON!=='undefined'&&CLOUD_ON&&typeof cloudPull==='function')cloudPull()}catch(e){console.warn('Blooming remote refresh',e)}}
  function run(){bindForgotCode();placeLotus();hideInvalidShare();repairProfileMedia();fixPageScroll();installProfilePersistence();installCloudPatches()}
  window.BloomingDirectFixes={closeProfileManager:closeProfileManager,placeLotus:placeLotus,bindForgotCode:bindForgotCode,repairProfileMedia:repairProfileMedia,fixPageScroll:fixPageScroll};
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#manageProfilesModal .close,#manageProfilesModal .modal-close,#manageProfilesModal [data-close-modal],#profileManagerModal .close');if(b){e.preventDefault();e.stopPropagation();closeProfileManager()}},true);
  window.addEventListener('online',refreshRemote);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(refreshRemote,250)});
  document.addEventListener('DOMContentLoaded',function(){run();setTimeout(run,500);setTimeout(run,1500);setTimeout(run,3000);setTimeout(installProfilePersistence,5000);setTimeout(installCloudPatches,5000)});
  new MutationObserver(function(){bindForgotCode();placeLotus();hideInvalidShare();fixPageScroll();installProfilePersistence();installCloudPatches()}).observe(document.documentElement,{childList:true,subtree:true});
})();
