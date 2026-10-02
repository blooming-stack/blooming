/* Blooming profile/UI fix v4
   Root fix: the crop dialog replaces the profile editor dialog. The original
   cropSave handler closes #md before the editor's local ph/cp variables can
   reach the Save handler. This patch captures cropSave in the capture phase,
   persists the rendered crop directly to the active profile, then reopens the
   editor. It also provides a capture-phase close handler for settings/modals.
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
    }catch(e){ console.warn('Blooming v4 media persistence',e); return false; }
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

  document.addEventListener('click', function(ev){
    var target = ev.target && ev.target.closest ? ev.target.closest('[data-m="cropSave"]') : null;
    if(!target) return;
    var canvas=document.getElementById('cropCanvas');
    if(!canvas) return;
    var heading=document.querySelector('#md h2');
    var kind=heading && /capa/i.test(heading.textContent||'') ? 'cover' : 'avatar';
    var data;
    try{ data=scaledCrop(canvas,kind); }catch(e){ console.warn('Blooming v4 crop',e); return; }

    // Do not let the original handler close the dialog before persistence.
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if(persistCrop(kind,data)){
      try{ if(typeof $('#md').close === 'function') $('#md').close(); }catch(_){ }
      setTimeout(function(){
        try{
          if(typeof editU === 'function' && getEditId()) editU(getEditId());
          else if(typeof view === 'function') view();
        }catch(e){ console.warn('Blooming v4 reopen editor',e); }
      },40);
    }
  }, true);

  // Remember which profile is being edited. The wrapper is installed repeatedly
  // because the main app may replace globals during boot.
  function hookEdit(){
    try{
      if(typeof window.editU === 'function' && !window.__bloomingEditV4){
        var old=window.editU;
        var wrapped=function(id){ editId=id; return old.apply(this,arguments); };
        window.editU=wrapped;
        window.__bloomingEditV4=true;
      }
    }catch(_){ }
  }

  // Settings and modal close buttons: handle them in capture phase so a modal
  // whose local onclick handler was replaced still closes reliably.
  document.addEventListener('click',function(ev){
    var b=ev.target && ev.target.closest ? ev.target.closest('#md [data-m="x"]') : null;
    if(!b) return;
    var d=document.getElementById('md');
    if(!d) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try{ if(d.open) d.close(); }catch(_){ d.removeAttribute('open'); }
  },true);

  hookEdit();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){hookEdit();setTimeout(hookEdit,300);setTimeout(hookEdit,1200);});
  else {setTimeout(hookEdit,300);setTimeout(hookEdit,1200);}
  new MutationObserver(hookEdit).observe(document.documentElement,{childList:true,subtree:true});
})();
