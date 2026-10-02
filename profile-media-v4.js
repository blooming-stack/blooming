/* Blooming profile/UI fix v6
   - Keeps working profile-media persistence.
   - When Settings closes after switching profiles, explicitly re-renders the
     profile identified by the app's active profile state before falling back
     to the current route.
*/
(function(){
  'use strict';
  var editId = null;

  function getEditId(){
    if(editId) return editId;
    try{
      var h=String(location.hash||'');
      var m=h.match(/^#\/perfil\/([^/?#]+)/);
      if(m) return decodeURIComponent(m[1]);
    }catch(_){ }
    return null;
  }

  function persistCrop(kind,data){
    try{
      var id=getEditId();
      if(!id || typeof U!=='function') return false;
      var u=U(id);
      if(!u) return false;
      if(kind==='cover') u.capa=data; else u.foto=data;
      if(typeof saveLocalOnly==='function') saveLocalOnly();
      if(typeof save==='function') save();
      if(typeof CLOUD_ON!=='undefined' && CLOUD_ON && typeof cloudSync==='function') cloudSync();
      return true;
    }catch(e){ console.warn('Blooming v6 media persistence',e); return false; }
  }

  function scaledCrop(canvas,kind){
    var w=kind==='cover'?1500:600, h=kind==='cover'?500:600;
    var out=document.createElement('canvas'); out.width=w; out.height=h;
    out.getContext('2d').drawImage(canvas,0,0,w,h);
    return out.toDataURL('image/jpeg',0.90);
  }

  function activeProfileId(){
    try{
      if(typeof currentProfileId==='string' && currentProfileId) return currentProfileId;
      if(typeof activeProfileId==='string' && activeProfileId) return activeProfileId;
      if(typeof ACTIVE_PROFILE==='string' && ACTIVE_PROFILE) return ACTIVE_PROFILE;
      if(typeof currentProfile==='string' && currentProfile) return currentProfile;
      if(typeof profileId==='string' && profileId) return profileId;
      if(typeof window.getActiveProfileId==='function') return window.getActiveProfileId();
      if(typeof window.getCurrentProfileId==='function') return window.getCurrentProfileId();
    }catch(_){ }
    return null;
  }

  function refreshActiveProfile(){
    try{
      var id=activeProfileId();
      if(id && typeof viewProfile==='function'){ viewProfile(id); return; }
      if(id && typeof openProfile==='function'){ openProfile(id); return; }
      if(id && typeof profile==='function'){ profile(id); return; }
      if(typeof view==='function'){ view(); return; }
      if(location.hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
    }catch(e){ console.warn('Blooming refresh active profile',e); }
  }

  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('[data-m="cropSave"]'):null;
    if(!target) return;
    var canvas=document.getElementById('cropCanvas'); if(!canvas) return;
    var heading=document.querySelector('#md h2');
    var kind=heading&&/capa/i.test(heading.textContent||'')?'cover':'avatar';
    var data;
    try{ data=scaledCrop(canvas,kind); }catch(e){ console.warn('Blooming v6 crop',e); return; }
    ev.preventDefault(); ev.stopImmediatePropagation();
    if(persistCrop(kind,data)){
      try{ if(typeof $('#md').close==='function') $('#md').close(); }catch(_){ }
      setTimeout(function(){
        try{ if(typeof editU==='function'&&getEditId()) editU(getEditId()); else refreshActiveProfile(); }
        catch(e){ console.warn('Blooming v6 reopen editor',e); }
      },40);
    }
  },true);

  function hookEdit(){
    try{
      if(typeof window.editU==='function'&&!window.__bloomingEditV6){
        var old=window.editU;
        window.editU=function(id){ editId=id; return old.apply(this,arguments); };
        window.__bloomingEditV6=true;
      }
    }catch(_){ }
  }

  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest('#md [data-m="x"]'):null;
    if(!b) return;
    var d=document.getElementById('md'); if(!d) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    try{ if(d.open) d.close(); else d.removeAttribute('open'); }catch(_){ d.removeAttribute('open'); }
    setTimeout(refreshActiveProfile,0);
    setTimeout(refreshActiveProfile,100);
  },true);

  hookEdit();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){hookEdit();setTimeout(hookEdit,300);setTimeout(hookEdit,1200);});
  else {setTimeout(hookEdit,300);setTimeout(hookEdit,1200);}
  new MutationObserver(hookEdit).observe(document.documentElement,{childList:true,subtree:true});
})();
