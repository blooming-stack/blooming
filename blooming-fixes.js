/* Blooming — patches prepared for the existing index.html. */
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
      post.classList.add('blooming-pinned-fixed');
      post.style.position='relative';
      icon.style.cssText+=';position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;width:26px!important;height:26px!important;transform:none!important;z-index:20!important;';
    });
  }
  function hideInvalidShare(){
    document.querySelectorAll('.ac button,.ac .actionlink,button,a').forEach(function(el){
      var t=(el.textContent||'').trim().toLowerCase();
      if((t.indexOf('compart')>=0||t.indexOf('share')>=0) && el.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))el.style.display='none';
    });
  }
  function bindForgotCode(){
    document.querySelectorAll('[data-a="forgot"]').forEach(function(btn){
      if(btn.dataset.bloomingForgotBound==='1')return;
      btn.dataset.bloomingForgotBound='1';
      btn.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        try{if(typeof forgotCode==='function')forgotCode();else if(window.forgotCode)window.forgotCode();}
        catch(err){console.error('Blooming forgot-code',err);}
      },true);
    });
  }
  async function repairProfileMedia(){
    try{
      if(typeof restoreProfileMediaDB==='function')await restoreProfileMediaDB();
      document.querySelectorAll('.av img,.bn img').forEach(function(img){
        if(img.dataset.bloomingMediaBound==='1')return;
        img.dataset.bloomingMediaBound='1';
        img.addEventListener('error',async function(){
          try{
            if(typeof restoreProfileMediaDB==='function')await restoreProfileMediaDB();
            if(typeof R==='function'&&!img.dataset.bloomingRetried){img.dataset.bloomingRetried='1';R();}
          }catch(e){}
        },{once:true});
      });
    }catch(e){console.warn('Blooming profile media repair',e)}
  }
  function run(){bindForgotCode();placeLotus();hideInvalidShare();repairProfileMedia();}
  window.BloomingDirectFixes={closeProfileManager:closeProfileManager,placeLotus:placeLotus,bindForgotCode:bindForgotCode,repairProfileMedia:repairProfileMedia};
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#manageProfilesModal .close,#manageProfilesModal .modal-close,#manageProfilesModal [data-close-modal],#profileManagerModal .close');
    if(b){e.preventDefault();e.stopPropagation();closeProfileManager();}
  },true);
  document.addEventListener('DOMContentLoaded',function(){run();setTimeout(run,500);setTimeout(run,1500);});
  new MutationObserver(function(){bindForgotCode();placeLotus();hideInvalidShare();}).observe(document.documentElement,{childList:true,subtree:true});
})();
