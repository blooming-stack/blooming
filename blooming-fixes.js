/* Blooming — patches prepared for the existing index.html. */
(function(){
  'use strict';
  function closeProfileManager(){
    ['#manageProfilesModal','#profileManagerModal','#manageProfiles','#profilesManager','[data-modal="manage-profiles"]'].forEach(function(s){
      document.querySelectorAll(s).forEach(function(el){el.classList.remove('open','show','active','visible');el.setAttribute('aria-hidden','true');el.style.display='none';});
    });
    try{if(typeof closeModal==='function') closeModal('manageProfilesModal');}catch(e){}
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest && e.target.closest('#manageProfilesModal .close,#manageProfilesModal .modal-close,#manageProfilesModal [data-close-modal],#profileManagerModal .close');
    if(b){e.preventDefault();e.stopPropagation();closeProfileManager();}
  },true);
  function placeLotus(){
    document.querySelectorAll('.pin-lotus,[data-pinned-icon],.pinned-icon').forEach(function(icon){
      var post=icon.closest('.po,.post,.pinned-post,[data-pinned="true"],[data-pinned="1"]');
      if(!post)return;
      if(post.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))return;
      post.style.position='relative';
      icon.style.cssText+=';position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;width:26px!important;height:26px!important;z-index:20!important;';
    });
  }
  function hideInvalidShare(){
    document.querySelectorAll('.ac button,.ac .actionlink,button,a').forEach(function(el){
      var t=(el.textContent||'').trim().toLowerCase();
      if((t.indexOf('compart')>=0||t.indexOf('share')>=0) && el.closest('.community,.community-view,[data-community],.chat,.msgs,.messages'))el.style.display='none';
    });
  }
  window.BloomingDirectFixes={closeProfileManager:closeProfileManager,placeLotus:placeLotus};
  document.addEventListener('DOMContentLoaded',function(){placeLotus();hideInvalidShare();});
  new MutationObserver(function(){placeLotus();hideInvalidShare();}).observe(document.documentElement,{childList:true,subtree:true});
})();
