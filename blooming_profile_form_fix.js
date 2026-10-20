(()=>{'use strict';
const CFG='blooming:v08:supabase',KEY='blooming:v08:session',BUCKET='blooming-media';
const $=s=>document.querySelector(s);
const session=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
const config=()=>{try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch{return null}};
const client=()=>{const c=config();return c?.url&&c?.key&&window.supabase?.createClient?window.supabase.createClient(c.url,c.key):null};
const msg=t=>{const m=$('#msg');if(m)m.textContent=t};
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
async function upload(db,file,accountId,pid,kind){
 if(!file)return null;
 if(file.size>10*1024*1024)throw new Error('A imagem deve ter no máximo 10 MB.');
 if(!file.type.startsWith('image/'))throw new Error('Escolha uma imagem válida.');
 const ext=(file.name.split('.').pop()||'bin').toLowerCase();
 const path=`${accountId}/${pid}/${kind}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
 const r=await db.storage.from(BUCKET).upload(path,file,{upsert:false,cacheControl:'31536000',contentType:file.type});
 if(r.error)throw r.error;
 return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
async function saveProfile(button){
 const db=client(),s=session();
 if(!db||!s?.accountId){msg('Sua sessão expirou. Entre novamente.');return false}
 const name=$('#name')?.value.trim(),username=$('#user')?.value.trim().replace(/^@/,'').toLowerCase();
 if(!name||!username){msg('Nome e username são obrigatórios.');return false}
 const editing=(document.querySelector('.brand')?.textContent||'').includes('Editar perfil');
 let existing=null,pid=editing?(s.profileId||null):null;
 if(editing&&pid){const q=await db.from('blooming_profiles').select('*').eq('id',pid).eq('account_id',s.accountId).maybeSingle();if(q.error)throw q.error;existing=q.data||null}
 if(!existing&&editing){
   const q=await db.from('blooming_profiles').select('*').eq('account_id',s.accountId).eq('username',username).maybeSingle();
   if(q.error)throw q.error;existing=q.data||null;pid=existing?.id||null;
 }
 if(!pid)pid=crypto.randomUUID();
 const body={
   id:pid,account_id:s.accountId,nome:name,display_name:name,username,
   bio:$('#bio')?.value.trim()||'',loc:existing?.loc||'',cor:$('#color')?.value||existing?.color||'#E83370',color:$('#color')?.value||existing?.color||'#E83370',
   emo:$('#emoji')?.value.trim()||existing?.emoji||'🌷',emoji:$('#emoji')?.value.trim()||existing?.emoji||'🌷',
   foto:existing?.foto||existing?.avatar_url||null,avatar_url:existing?.avatar_url||null,
   capa:existing?.capa||existing?.cover_url||null,cover_url:existing?.cover_url||null,
   verificado:existing?.verificado||false,privada:existing?.privada||false,seg:existing?.seg||0,sgd:existing?.sgd||0,
   updated_at:new Date().toISOString()
 };
 const af=$('#avatarFile')?.files?.[0],cf=$('#coverFile')?.files?.[0];
 if(af){body.avatar_url=body.foto=await upload(db,af,s.accountId,pid,'avatar')}
 if(cf){body.cover_url=body.capa=await upload(db,cf,s.accountId,pid,'cover')}
 const r=existing
   ?await db.from('blooming_profiles').update(body).eq('id',pid).eq('account_id',s.accountId)
   :await db.from('blooming_profiles').insert({...body,created_at:new Date().toISOString()});
 if(r.error)throw r.error;
 localStorage.setItem(KEY,JSON.stringify({...s,profileId:pid}));
 return true;
}
function bind(){
 const save=document.querySelector('#save');
 if(!save||save.dataset.persistenceFix)return;
 save.dataset.persistenceFix='1';
 save.addEventListener('click',async e=>{
   e.preventDefault();e.stopImmediatePropagation();
   if(save.disabled)return;
   save.disabled=true;const old=save.textContent;save.textContent='Salvando…';
   try{
     const ok=await saveProfile(save);
     if(!ok){save.disabled=false;save.textContent=old||'Salvar perfil';return}
     save.textContent='Salvo ✓';
     setTimeout(()=>location.reload(),180);
   }catch(err){console.error('Blooming profile persistence',err);msg(err?.code==='23505'?'Esse @username já está em uso.':err?.message||'Não foi possível salvar o perfil.');save.disabled=false;save.textContent=old||'Salvar perfil'}
 },true);
}
const obs=new MutationObserver(bind);
function boot(){bind();obs.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();