/* Blooming shared persistence layer: profiles/posts are synchronized by updated_at. */
(function(){'use strict';
function clean(v){return String(v||'').replace(/^@/,'').trim()}
function base(){return location.origin+'/blooming'}
function profileUrl(user){user=clean(user);return user?base()+'/'+encodeURIComponent(user):''}
function postCode(p){if(!p)return '';if(p.postCode)return String(p.postCode);var raw=String(p.id||''),h=0;for(var i=0;i<raw.length;i++)h=((h<<5)-h+raw.charCodeAt(i))|0;return ('000000'+Math.abs(h).toString(36).toUpperCase()).slice(-6)}
function postUrl(p){var u=window.U?window.U(p&&p.u):null,user=clean(u&&u.user||p&&p.username),c=postCode(p);return user&&c?profileUrl(user)+'/post/'+encodeURIComponent(c):''}
function stampProfile(u){if(u){u.updatedAt=Date.now();u.__syncDirty=true}return u}
function stampPost(p){if(p){p.updatedAt=Date.now();p.__syncDirty=true}return p}
function profileSignature(u){if(!u)return '';return [u.nome,u.user,u.bio,u.loc,u.cor,u.emo,u.foto,u.capa,!!u.verificado,!!u.privada,+u.seg||0,+u.sgd||0].map(function(v){return String(v==null?'':v)}).join('\u001f')}
function profileData(u){return{id:String(u.id),account_id:u.accountId||S.currentAccountId||null,nome:u.nome||'Perfil',username:clean(u.user),bio:u.bio||'',loc:u.loc||'',cor:u.cor||'#E8336F',emo:u.emo||'🌸',foto:u.foto||'',capa:u.capa||'',verificado:!!u.verificado,privada:!!u.privada,seg:+u.seg||0,sgd:+u.sgd||0,updated_at:new Date(+u.updatedAt||Date.now()).toISOString()}}
function postData(p){return{id:String(p.id),user_id:p.u,text:p.t||'',emoji:p.e||'',media:Array.isArray(p.mediaItems)?p.mediaItems:(p.media?[p.media]:[]),poll:p.poll||null,repost_of:p.repostOf||null,likes_count:Array.isArray(p.by)?p.by.length:(+p.lk||0),created_at:new Date(+p.ts||Date.now()).toISOString(),updated_at:new Date(+p.updatedAt||Date.now()).toISOString()}}
function saveLocal(){try{if(typeof saveLocalOnly==='function')saveLocalOnly()}catch(e){console.warn('Blooming local save',e)}}
function disableAutomation(){if(!window.S||!S.u)return;Object.values(S.u).forEach(function(u){if(u&&u.themeBot)u.themeBot.enabled=false})}
function removeSeeds(){if(!window.S)return;var seedIds=/^p(?:[0-9]|1[01])$/;S.posts=(S.posts||[]).filter(function(p){if(!p)return false;if(seedIds.test(String(p.id)))return false;if(p.themeGenerated||p.generated||p.generic||p.demo||p.test||p.seed)return false;return true});disableAutomation()}
async function pushProfile(id){if(!window.SB||!window.CLOUD_ON||!window.S||!S.u[id]||!UNL)return;var u=S.u[id];if(!u.updatedAt)u.updatedAt=Date.now();var r=await SB.from('blooming_profiles').upsert(profileData(u),{onConflict:'id'});if(r.error)throw r.error;u.__syncDirty=false;window.__bloomingProfileSync=window.__bloomingProfileSync||{};window.__bloomingProfileSync[id]=profileSignature(u)}
async function pushPost(p){if(!window.SB||!window.CLOUD_ON||!p||!UNL)return;if(!p.updatedAt)p.updatedAt=Date.now();var r=await SB.from('blooming_posts').upsert(postData(p),{onConflict:'id'});if(r.error)throw r;p.__syncDirty=false}
async function flushDirtyProfiles(){if(!window.SB||!window.CLOUD_ON||!window.S||!UNL)return;window.__bloomingProfileSync=window.__bloomingProfileSync||{};var jobs=[];Object.keys(S.u||{}).forEach(function(id){var u=S.u[id];if(!u)return;var sig=profileSignature(u),prev=window.__bloomingProfileSync[id];if(u.__syncDirty||(!prev&&sig)||(prev&&sig!==prev)){stampProfile(u);jobs.push(pushProfile(id).catch(function(e){console.warn('Blooming profile push',e)}))}});if(jobs.length)await Promise.all(jobs);saveLocal()}
async function syncProfiles(){if(!window.SB||!window.CLOUD_ON||!window.S||!UNL)return false;try{await flushDirtyProfiles();var q=await SB.from('blooming_profiles').select('*');if(q.error)throw q.error;var rows=q.data||[];window.__bloomingProfileSync=window.__bloomingProfileSync||{};for(const r of rows){var local=S.u[r.id];if(!local)local=Object.values(S.u).find(function(x){return clean(x&&x.user).toLowerCase()===clean(r.username).toLowerCase()});var remoteMs=Date.parse(r.updated_at||r.created_at||0)||0,localMs=+(local&&local.updatedAt||0);if(local&&localMs>remoteMs){await pushProfile(local.id);continue}var id=local?local.id:String(r.id),o=S.u[id]||{};S.u[id]=Object.assign({},o,{id:id,nome:r.nome||o.nome||'Perfil',user:clean(r.username)||clean(o.user),bio:r.bio!=null?r.bio:(o.bio||''),loc:r.loc!=null?r.loc:(o.loc||''),cor:r.cor||o.cor||'#E8336F',emo:r.emo||o.emo||'🌸',foto:r.foto||o.foto||'',capa:r.capa||o.capa||'',verificado:typeof r.verificado==='boolean'?r.verificado:!!o.verificado,privada:typeof r.privada==='boolean'?r.privada:!!o.privada,seg:+r.seg||+o.seg||0,sgd:+r.sgd||+o.sgd||0,accountId:r.account_id||o.accountId||'',updatedAt:remoteMs,__syncDirty:false});window.__bloomingProfileSync[id]=profileSignature(S.u[id])}saveLocal();return true}catch(e){console.warn('Blooming profile sync',e);return false}}
async function syncPosts(){if(!window.SB||!window.CLOUD_ON||!window.S||!UNL)return false;try{var q=await SB.from('blooming_posts').select('*');if(q.error)throw q.error;var map=new Map((S.posts||[]).map(function(p){return[String(p.id),p]}));(q.data||[]).forEach(function(r){if((S.deletedPosts||[]).includes(String(r.id)))return;var local=map.get(String(r.id)),remoteMs=Date.parse(r.updated_at||r.created_at||0)||0,localMs=+(local&&local.updatedAt||0);if(local&&localMs>remoteMs){pushPost(local);return}var media=Array.isArray(r.media)?r.media:[],old=local||{};map.set(String(r.id),Object.assign({},old,{id:String(r.id),u:r.user_id,t:r.text||'',e:r.emoji||'',mediaItems:media,media:media.length===1?media[0]:media,poll:r.poll||null,repostOf:r.repost_of||null,lk:+r.likes_count||0,by:Array.isArray(old.by)?old.by:[],c:Array.isArray(old.c)?old.c:[],ts:Date.parse(r.created_at||0)||old.ts||Date.now(),updatedAt:remoteMs,__syncDirty:false}))});S.posts=Array.from(map.values()).filter(function(p){return p&&!((S.deletedPosts||[]).includes(String(p.id)))&&!(p.themeGenerated||p.generated||p.generic||p.demo||p.test||p.seed)}).sort(function(a,b){return(+b.ts||0)-(+a.ts||0)});saveLocal();return true}catch(e){console.warn('Blooming post sync',e);return false}}
function normalize(){if(!window.S)return;removeSeeds();(S.posts||[]).forEach(function(p){if(p.ts&&p.ts<1e11)p.ts*=1000});saveLocal()}
function links(root){try{(root||document).querySelectorAll('a[href]').forEach(function(a){var h=a.getAttribute('href')||'',m=h.match(/^#\/perfil\/([^/?#]+)/i);if(m){var u=Object.values(S.u||{}).find(function(x){return clean(x&&x.user).toLowerCase()===decodeURIComponent(m[1]).toLowerCase()});if(u)a.href=profileUrl(u.user)}})}catch(e){}}
function patchEditor(){if(window.__bloomingPersistenceEditor)return;window.__bloomingPersistenceEditor=true;var oldEdit=window.editU;if(typeof oldEdit==='function'){window.editU=function(id){window.__bloomingEditingProfile=id;var r=oldEdit.apply(this,arguments);setTimeout(function(){if(S.u&&S.u[id]&&UNL){stampProfile(S.u[id]);pushProfile(id).catch(function(e){console.warn('profile edit push',e)})}},250);return r}}var oldPost=window.publishPost;if(typeof oldPost==='function'){window.publishPost=async function(){var before=new Set((S.posts||[]).map(function(p){return String(p.id)}));var r=await oldPost.apply(this,arguments);setTimeout(function(){(S.posts||[]).forEach(function(p){if(!before.has(String(p.id))&&p.u===S.me&&UNL){stampPost(p);pushPost(p).catch(function(e){console.warn('post push',e)})}})},100);return r}}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-m="s"],button');if(!b)return;var id=window.__bloomingEditingProfile;if(!id||!S.u||!S.u[id]||!UNL)return;setTimeout(function(){stampProfile(S.u[id]);pushProfile(id).catch(function(err){console.warn('profile save push',err)});saveLocal()},120)},true)}

/* LOGIN HOTFIX: the original app starts a cloud pull during boot. A pull could call view()/R()
   while the access form was being typed, destroying #lp and making the login appear to clear itself. */
(function loginHotfix(){
  document.addEventListener('click',async function(e){
    var el=e.target.closest&&e.target.closest('[data-a="li"]');
    if(!el) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var nameEl=document.getElementById('lu'), passEl=document.getElementById('lp'), errEl=document.getElementById('le');
    var name=String(nameEl&&nameEl.value||'').trim(), pass=String(passEl&&passEl.value||''), norm=name.toLowerCase();
    if(!name||!pass){if(errEl)errEl.textContent='Informe o nome e o código de acesso.';return;}
    var hash;
    try{hash=pwh(pass)}catch(_){if(errEl)errEl.textContent='Não foi possível validar o código.';return;}
    if(norm==='ana laura'&&hash===ANA_ACCESS_HASH){accessMode='ana';UNL=true;S.currentAccountId='ana';S.me=null;S.editMode=false;saveLocalOnly();unlockScreen(true);return;}
    var ag=S.accessGroups&&S.accessGroups.alana;
    if(norm==='alana aquino'&&ag&&ag.h){if(hash===ag.h){accessMode='alana';UNL=true;S.currentAccountId='alana';S.me=null;S.editMode=false;saveLocalOnly();unlockScreen(true);return;}if(errEl)errEl.textContent='Nome ou código incorretos.';return;}
    var found=null;
    if(CLOUD_ON&&SB){
      try{
        var safeName=name.replace(/[\\%_]/g,'\\\\$&');
        var q=await SB.from('blooming_accounts').select('id,nome,pw_hash').ilike('nome',safeName).limit(20);
        if(q.error) throw q.error;
        var rows=Array.isArray(q.data)?q.data:[];
        found=rows.find(function(r){return String(r.pw_hash||'')===String(hash)})||null;
      }catch(ex){console.warn('Blooming login online',ex);}
    }
    if(!found){
      var accounts=Object.values(S.accounts||{});
      found=accounts.find(function(a){return String(a&&a.nome||'').trim().toLowerCase()===norm&&String(a&&a.pw||'')===String(hash)})||null;
    }
    if(!found){if(errEl)errEl.textContent='Nome ou código incorretos. Se ainda não tiver conta, use “Criar código”.';return;}
    var aid=String(found.id);
    S.accounts[aid]=Object.assign({},S.accounts[aid]||{},found,{id:aid,nome:found.nome||name,pw:hash,profiles:Array.isArray(S.accounts[aid]&&S.accounts[aid].profiles)?S.accounts[aid].profiles:[],legacy:false});
    S.currentAccountId=aid;S.me=null;S.editMode=false;accessMode='normal';UNL=true;
    saveLocalOnly();
    unlockScreen(true);
    setTimeout(function(){try{safeCloudPull('login')}catch(ex){console.warn('login pull',ex)}},250);
  },true);
})();

function boot(){normalize();patchEditor();window.__bloomingProfileSync=window.__bloomingProfileSync||{};Object.keys(S.u||{}).forEach(function(id){window.__bloomingProfileSync[id]=profileSignature(S.u[id])});setTimeout(function(){if(UNL){syncProfiles();syncPosts()}},1800);setTimeout(function(){if(UNL){syncProfiles();syncPosts()}},6000);setInterval(function(){if(document.visibilityState==='visible'&&UNL)flushDirtyProfiles()},1200);document.addEventListener('visibilitychange',function(){if(!document.hidden&&UNL){syncProfiles();syncPosts()}});window.addEventListener('pageshow',function(){if(UNL){syncProfiles();syncPosts()}});links(document)}
window.BloomingProfileMediaV2={profile:profileUrl,post:postUrl,code:postCode,sync:syncProfiles,syncPicker:function(){return syncProfiles()}};window.BloomingPostLinks={profile:profileUrl,post:postUrl,code:postCode};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
