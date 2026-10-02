/* Blooming profile media fix v3
   Fixes the editor dialog lifecycle after selecting/cropping profile or cover images.
   The original editor used the same dialog for the cropper and closed it after "Usar imagem",
   which removed the Save button/handler before the edited profile was persisted.
*/
(function(){
  'use strict';
  function install(){
    try{
      if(typeof window.editU === 'function' && !window.__bloomingEditUWrapped){
        var originalEditU = window.editU;
        window.editU = function(id){
          window.__bloomingProfileEditId = id;
          return originalEditU.apply(this, arguments);
        };
        window.__bloomingEditUWrapped = true;
      }
      if(typeof window.cropProfileImage === 'function' && !window.__bloomingCropWrapped){
        var originalCrop = window.cropProfileImage;
        window.cropProfileImage = function(file, kind, done){
          return originalCrop.call(this, file, kind, function(data){
            try{ done(data); }catch(e){ console.warn('Blooming media callback', e); }
            var id = window.__bloomingProfileEditId;
            if(id && typeof window.editU === 'function'){
              setTimeout(function(){
                try{ if(typeof window.U === 'function' && window.U(id)) window.editU(id); }
                catch(e){ console.warn('Blooming editor reopen', e); }
              }, 0);
            }
          });
        };
        window.__bloomingCropWrapped = true;
      }
    }catch(e){ console.warn('Blooming profile media v3', e); }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ install(); setTimeout(install,500); setTimeout(install,1500); });
  }else{ install(); setTimeout(install,500); setTimeout(install,1500); }
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
