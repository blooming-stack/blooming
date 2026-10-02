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

  /* Safe fallback persistence for profile editing.
     It supplements the existing Supabase/local persistence instead of replacing it. */
  var DB_NAME='blooming-profile-media-fallback', DB_STORE='media';
  function openMediaDB(){return new Promise(function(resolve,reject){
    if(!window.indexedDB)return reject(new Error('IndexedDB unavailable'));
    var r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains(DB_STORE))r.result.createObjectStore(DB_STORE);};
    r.onsuccess=function(){resolve(r.result)}; r.onerror=function(){reject(r.error||new Error('IndexedDB error'))};
  });}
  async function mediaPut(key,value){try{var db=await openMediaDB();await new Promise(function(res,rej){var tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=res;tx.onerror=function(){rej(tx.error)}});db.close()}catch(e){console.warn('Blooming media fallback save',e)}}
  async function mediaGet(key){try{var db=await openMediaDB();return await new Promise(function(res,rej){var tx=db.transaction(DB_STORE,'readonly'),q=tx.objectStore(DB_STORE).get(key);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}catch(e){return null}}
  function profileModal(){
    var list=[].slice.call(document.querySelectorAll('[role="dialog"],.modal,.modalbox,.overlay,.sheet,[id*="editProfile" i],[id*="profileEdit" i],[id*="editar" i]'));
    return list.reverse().find(function(el){var s=(el.innerText||el.textContent||'').toLowerCase();return /editar.*perfil|perfil.*editar|foto.*perfil|foto.*capa/.test(s) && getComputedStyle(el).display!=='none'})||null;
  }
  function profileKey(modal){
    var explicit=modal&&(modal.dataset.profileId||modal.dataset.userId||modal.getAttribute('data-profile-id')||modal.getAttribute('data-user-id'));
    if(explicit)return 'profile:'+explicit;
    var u=(modal&&modal.querySelector('input[name="username"],input[id*="username" i],input[name="user"],input[id*="user" i]'));
    if(u&&u.value)return 'profile:'+u.value.trim().toLowerCase();
    var h=modal&&modal.querySelector('h1,h2,h3,[data-profile-name]');
    return 'profile:'+(h?(h.textContent||'').trim().toLowerCase():'current');
  }
  function fieldKey(el,i){return el.id||el.name||el.getAttribute('data-field')||el.placeholder||('field-'+i)}
  function saveProfileFields(modal){
    if(!modal)return;
    var key=profileKey(modal), data={fields:{},savedAt:Date.now()};
    [].slice.call(modal.querySelectorAll('input:not([type="file"]),textarea,select')).forEach(function(el,i){
      if(el.type==='password')return;
      var k=fieldKey(el,i);data.fields[k]=el.type==='checkbox'?el.checked:el.value;
    });
    try{localStorage.setItem('blooming-profile-fallback:'+key,JSON.stringify(data))}catch(e){console.warn('Blooming profile text save',e)}
  }
  function restoreProfileFields(modal){
    if(!modal)return;
    var raw=null;try{raw=localStorage.getItem('blooming-profile-fallback:'+profileKey(modal))}catch(e){}
    if(!raw)return;
    try{var data=JSON.parse(raw);[].slice.call(modal.querySelectorAll('input:not([type="file"]),textarea,select')).forEach(function(el,i){var v=data.fields[fieldKey(el,i)];if(v===undefined)return;if(el.type==='checkbox')el.checked=!!v;else if(!el.value)el.value=v;});}catch(e){}
  }
  async function bindProfilePersistence(){
    var modal=profileModal();if(!modal)return;
    restoreProfileFields(modal);
    [].slice.call(modal.querySelectorAll('input[type="file"]')).forEach(function(input){
      if(input.dataset.bloomingMediaPersistence==='1')return;
      input.dataset.bloomingMediaPersistence='1';
      input.addEventListener('change',function(){
        var file=input.files&&input.files[0];if(!file)return;
        var reader=new FileReader();reader.onload=function(){
          var k=profileKey(modal)+':'+(input.name||input.id||input.getAttribute('accept')||'media');
          mediaPut(k,{data:reader.result,name:file.name,type:file.type,updatedAt:Date.now()});
        };reader.readAsDataURL(file);
      });
    });
    [].slice.call(modal.querySelectorAll('input,textarea,select')).forEach(function(el){
      if(el.dataset.bloomingProfileBound==='1')return;
      el.dataset.bloomingProfileBound='1';el.addEventListener('input',function(){saveProfileFields(modal)});el.addEventListener('change',function(){saveProfileFields(modal)});
    });
    [].slice.call(modal.querySelectorAll('button,[role="button"]')).forEach(function(btn){
      var t=(btn.textContent||'').trim().toLowerCase();
      if(!/(salvar|save|concluir|aplicar|atualizar)/.test(t)||btn.dataset.bloomingSaveBound==='1')return;
      btn.dataset.bloomingSaveBound='1';btn.addEventListener('click',function(){saveProfileFields(modal);setTimeout(repairProfileMedia,100);},true);
    });
  }
  function run(){bindForgotCode();placeLotus();hideInvalidShare();repairProfileMedia();bindProfilePersistence();}
  window.BloomingDirectFixes={closeProfileManager:closeProfileManager,placeLotus:placeLotus,bindForgotCode:bindForgotCode,repairProfileMedia:repairProfileMedia,bindProfilePersistence:bindProfilePersistence};
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#manageProfilesModal .close,#manageProfilesModal .modal-close,#manageProfilesModal [data-close-modal],#profileManagerModal .close');
    if(b){e.preventDefault();e.stopPropagation();closeProfileManager();}
  },true);
  document.addEventListener('DOMContentLoaded',function(){run();setTimeout(run,500);setTimeout(run,1500);setTimeout(run,3000);});
  new MutationObserver(function(){bindForgotCode();placeLotus();hideInvalidShare();bindProfilePersistence();}).observe(document.documentElement,{childList:true,subtree:true});
})();
