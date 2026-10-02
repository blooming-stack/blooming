/* Blooming profile/UI fix v5
   - Keeps the working profile-media persistence from v4.
   - When the profile is changed from Settings, closing Settings now refreshes
     the currently active profile immediately.
   - Does not change the profile-switching/storage logic itself.
*/
(function(){
  'use strict';
  var editId = null;

  function getEditId(){
    if(editId) return editId;
    try{
      var h = String(location.hash||'');
      var m = h.match(/^#\/perfil\/([^/?#]+)/);
      if(m) return decodeURIComponent(m[1]);
    }catch(_){ }
    return null;
  }

  function persistCrop(kind, data){
    try{
      var id = getEditId();
      if(!id || typeof U !== 'function') return false;
      var u = U(id);
      if(!u) return false;
      if(kind === 'cover') u.capa = data;
      else u.foto = data;
      if(typeof saveLocalOnly === 'function') saveLocalOnly();
      if(typeof save === 'function') save();
      if(typeof CLOUD_ON !== 'undefined' && CLOUD_ON && typeof cloudSync === 'function') cloudSync();
      return true;
    }catch(e){ console.warn('Blooming v5 media persistence',e); return false; }
  }

  function scaledCrop(canvas, kind){
    var w = kind === 'cover' ? 1500 : 600;
    var h = kind === 'cover' ? 500 : 600;
    var out = document.createElement('canvas');
    out.width=w; out.height=h;
    var ctx=out.getContext('2d');
    ctx.drawImage(canvas,0,0,w,h);
    return out.toDataURL('image/jpeg',0.90);
  }

  function refreshActiveProfile(){
    try{
      // The app's own view() reads the current active profile from its state.
      // Calling it after Settings closes avoids changing the profile-switch logic.
      if(typeof view === 'function'){
        view();
        return;
      }
      // Fallback: re-dispatch the current route so the normal renderer runs.
      if(location.hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
    }catch(e){ console.warn('Blooming refresh active profile',e); }
  }

  document.addEventListener('click', function(ev){
    var target = ev.target && ev.target.closest ? ev.target.closest('[data-m="cropSave"]') : null;
    if(!target) return;
    var canvas=document.getElementById('cropCanvas');
    if(!canvas) return;
    var heading=document.querySelector('#md h2');
    var kind=heading && /capa/i.test(heading.textContent||'') ? 'cover' : 'avatar';
    var data;
    try{ data=scaledCrop(canvas,kind); }catch(e){ console.warn('Blooming v5 crop',e); return; }
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if(persistCrop(kind,data)){
      try{ if(typeof $('#md').close === 'function') $('#md').close(); }catch(_){ }
      setTimeout(function(){
        try{
          if(typeof editU === 'function' && getEditId()) editU(getEditId());
          else refreshActiveProfile();
        }catch(e){ console.warn('Blooming v5 reopen editor',e); }
      },40);
    }
  }, true);

  function hookEdit(){
    try{
      if(typeof window.editU === 'function' && !window.__bloomingEditV5){
        var old=window.editU;
        var wrapped=function(id){ editId=id; return old.apply(this,arguments); };
        window.editU=wrapped;
        window.__bloomingEditV5=true;
      }
    }catch(_){ }
  }

  document.addEventListener('click',function(ev){
    var b=ev.target && ev.target.closest ? ev.target.closest('#md [data-m="x"]') : null;
    if(!b) return;
    var d=document.getElementById('md');
    if(!d) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try{ if(d.open) d.close(); else d.removeAttribute('open'); }catch(_){ d.removeAttribute('open'); }
    // Give the profile-switch/save handlers one turn to finish, then render the
    // profile that is currently active in Settings.
    setTimeout(refreshActiveProfile, 0);
    setTimeout(refreshActiveProfile, 80);
  },true);

  hookEdit();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){hookEdit();setTimeout(hookEdit,300);setTimeout(hookEdit,1200);});
  else {setTimeout(hookEdit,300);setTimeout(hookEdit,1200);}
  new MutationObserver(hookEdit).observe(document.documentElement,{childList:true,subtree:true});
})();
