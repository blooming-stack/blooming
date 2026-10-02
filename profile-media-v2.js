(function(){'use strict';
/* The previous frontend default pointed to a non-existent/incorrect Supabase ref (...hjs4).
   The connected Blooming project is ...hjsv. Repair both the in-memory and stored config before
   any profile save/sync happens. */
try{
  var CORRECT_URL='https://eulxkpxjwhwknegvhjsv.supabase.co';
  if(typeof CLOUD_CFG!=='undefined'){
    CLOUD_CFG.url=CORRECT_URL;
    try{localStorage.setItem('blooming-cloud-config-v1',JSON.stringify(CLOUD_CFG))}catch(e){}
    if(window.supabase&&CLOUD_CFG.key){
      try{SB=window.supabase.createClient(CORRECT_URL,CLOUD_CFG.key);CLOUD_ON=true;}catch(e){console.warn('Blooming Supabase reconnect',e)}
    }
  }
}catch(e){console.warn('Blooming Supabase URL repair',e)}

var DB='blooming-profile-media-fallback', STORE='media', KEY='__blooming_profile_media_v3__';
function openDB(){return new Promise(function(resolve,reject){if(!window.indexedDB)return reject();var r=indexedDB.open(DB,2);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE)};r.onsuccess=function(){resolve(r.result)};r.onerror=reject})}
function put(k,v){return openDB().then(function(d){return new Promise(function(resolve,reject){var q=d.transaction(STORE,'readwrite').objectStore(STORE).put(v,k);q.onsuccess=resolve;q.onerror=reject})}).catch(function(){})}
function all(){return openDB().then(function(d){return new Promise(function(resolve,reject){var q=d.transaction(STORE,'readonly').objectStore(STORE).getAll();q.onsuccess=function(){resolve(q.result||[])};q.onerror=reject})}).catch(function(){return[]})}
function keys(){return openDB().then(function(d){return new Promise(function(resolve,reject){var q=d.transaction(STORE,'readonly').objectStore(STORE).getAllKeys();q.onsuccess=function(){resolve(q.result||[])};q.onerror=reject})}).catch(function(){return[]})}
function profileKey(){
  try{
    var c=window.currentProfile||window.activeProfile||window.selectedProfile||window.currentUser||window.me;
    if(c){if(typeof c==='string')return c;if(c.id!=null)return String(c.id);if(c.username)return String(c.username);if(c.user)return String(c.user)}
    var ls=['bloomingCurrentProfile','currentProfile','activeProfile','selectedProfile','blooming_active_profile','active_profile'];
    for(var i=0;i<ls.length;i++){var x=localStorage.getItem(ls[i]);if(x){try{x=JSON.parse(x)}catch(e){};if(typeof x==='string')return x;if(x&&x.id!=null)return String(x.id);if(x&&x.username)return String(x.username)}}
  }catch(e){}
  return 'default';
}
function kindFor(input){
  var s=((input.id||'')+' '+(input.name||'')+' '+(input.getAttribute('aria-label')||'')+' '+(input.closest('label')?input.closest('label').textContent:'')).toLowerCase();
  return /(capa|cover|banner)/.test(s)?'cover':'avatar';
}
function remember(kind,data){return put(KEY+'::'+profileKey()+'::'+kind,{kind:kind,profile:profileKey(),data:data,ts:Date.now()})}
function readSaved(){return all().then(function(vs){var p=profileKey(),out={};vs.forEach(function(v){if(v&&v.data&&v.profile===p)out[v.kind]=v.data});return out})}
function applyOne(kind,data){if(!data)return;var sels=kind==='cover'?'.bn img,[data-profile-cover] img':' .av img,[data-profile-avatar] img';document.querySelectorAll(sels.trim()).forEach(function(im){im.src=data;im.removeAttribute('srcset');im.style.backgroundImage='none'});if(kind==='cover'){document.querySelectorAll('.bn,[data-profile-cover]').forEach(function(el){if(el.tagName!=='IMG')el.style.backgroundImage='url('+JSON.stringify(data)+')'})}}
async function restore(){var saved=await readSaved();applyOne('avatar',saved.avatar);applyOne('cover',saved.cover)}
function capture(input){if(!input.files||!input.files[0])return;var f=input.files[0];if(!/^image\//.test(f.type))return;var rd=new FileReader();rd.onload=function(){var data=String(rd.result||'');var k=kindFor(input);remember(k,data).then(function(){applyOne(k,data);});try{input.dataset.bloomingSaved='1'}catch(e){}};rd.readAsDataURL(f)}
function scan(){document.querySelectorAll('input[type=file]').forEach(function(i){if(!i.dataset.bloomingMediaBound){i.dataset.bloomingMediaBound='1';i.addEventListener('change',function(){capture(i)},true)}});restore()}
function saveVisible(){
  document.querySelectorAll('.av img,[data-profile-avatar] img').forEach(function(im){if(im.src&&/^data:image\//.test(im.src))remember('avatar',im.src)});
  document.querySelectorAll('.bn img,[data-profile-cover] img').forEach(function(im){if(im.src&&/^data:image\//.test(im.src))remember('cover',im.src)});
}
function buttonPatch(){document.querySelectorAll('button,[role="button"],input[type="submit"]').forEach(function(b){if(b.dataset.bloomingMediaSave)return;var t=(b.textContent||b.value||'').trim().toLowerCase();if(/^(salvar|save|concluir|atualizar)$/.test(t)||t.indexOf('salvar perfil')>=0){b.dataset.bloomingMediaSave='1';b.addEventListener('click',function(){setTimeout(function(){saveVisible();restore()},50);setTimeout(restore,700)},true)}})}
window.BloomingProfileMediaV2={restore:restore,capture:capture,saveVisible:saveVisible};
document.addEventListener('DOMContentLoaded',function(){scan();buttonPatch();setTimeout(scan,500);setTimeout(scan,1500);setTimeout(restore,3000)});
new MutationObserver(function(){scan();buttonPatch()}).observe(document.documentElement,{childList:true,subtree:true});
})();