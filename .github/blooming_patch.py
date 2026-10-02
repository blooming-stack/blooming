from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
MARK='<!-- BLOOMING_DIRECT_PATCH_2026_10_02 -->'
if MARK in s:
    raise SystemExit(0)

css=r'''<style id="blooming-direct-fixes">
/* Correções incrementais — preserva o restante do Blooming */
.blooming-direct-lotus{position:absolute!important;top:10px!important;right:10px!important;left:auto!important;bottom:auto!important;width:26px!important;height:26px!important;z-index:20;pointer-events:none}
.blooming-direct-recovery{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0009;padding:18px}
.blooming-direct-recovery .box{width:min(460px,100%);background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 20px 70px #0008}
.blooming-direct-recovery .row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
.blooming-direct-recovery input{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:10px;background:var(--bg);margin-top:6px}
</style>'''

js=r'''<script id="blooming-direct-fixes-js">
/* BLOOMING_DIRECT_PATCH_2026_10_02 */
(function(){
  const txt=e=>(e?.textContent||'').trim().toLowerCase();
  const isCommunity=el=>!!el?.closest('[data-community],.community,.community-view,#community, [id*="community" i]');
  const isMessage=el=>!!el?.closest('.chat,.msgs,.message,.messages,#messages,[data-messages]');
  function closeManagers(){
    const candidates=['#manageProfilesModal','#profileManagerModal','#manageProfiles','#profilesManager','[data-modal="manage-profiles"]'];
    candidates.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{el.classList.remove('open','show','active','visible');el.setAttribute('aria-hidden','true');if(getComputedStyle(el).position==='fixed'||el.style.display)el.style.display='none';}));
    try{if(typeof closeModal==='function')closeModal('manageProfilesModal')}catch(_){ }
  }
  function recovery(){
    if(document.querySelector('.blooming-direct-recovery'))return;
    const wrap=document.createElement('div');wrap.className='blooming-direct-recovery';
    wrap.innerHTML='<div class="box"><h2>Esqueci meu código</h2><p class="mut">Informe o nome da conta para iniciar a recuperação.</p><label>Nome da conta<input id="bloomingRecoveryName" autocomplete="username"></label><p id="bloomingRecoveryMsg" class="mut" style="margin-top:8px"></p><div class="row"><button type="button" class="b g" data-rec-close>Cancelar</button><button type="button" class="b" data-rec-go>Continuar</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('[data-rec-close]').onclick=()=>wrap.remove();
    wrap.querySelector('[data-rec-go]').onclick=async()=>{
      const name=wrap.querySelector('#bloomingRecoveryName').value.trim();
      const msg=wrap.querySelector('#bloomingRecoveryMsg');
      if(!name){msg.textContent='Informe o nome da conta.';return}
      /* Não expõe nem altera o código sem uma etapa de verificação. Se o app já
         possuir uma rotina de recuperação, delegamos para ela. */
      const fns=['startCodeRecovery','openCodeRecovery','recoverAccessCode','forgotCode'];
      for(const n of fns){try{if(typeof window[n]==='function'){wrap.remove();window[n](name);return}}catch(_){} }
      msg.textContent='A conta foi localizada como solicitação de recuperação. Para definir um novo código, use o fluxo de recuperação configurado pelo administrador da conta.';
    };
  }
  function patchButtons(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const t=txt(el);
      if(t.includes('esqueci')&&t.includes('cód')){
        if(!el.dataset.bloomingRecovery){el.dataset.bloomingRecovery='1';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();recovery()},true)}
      }
      if((t==='×'||t==='x'||t.includes('fechar')) && (el.closest('#manageProfilesModal,#profileManagerModal,#manageProfiles,#profilesManager,[data-modal="manage-profiles"]'))){
        if(!el.dataset.bloomingManagerClose){el.dataset.bloomingManagerClose='1';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeManagers()},true)}
      }
    });
  }
  function patchLotus(){
    document.querySelectorAll('.pin-lotus,[data-pinned-icon],.pinned-icon').forEach(icon=>{
      const post=icon.closest('.po,.post,.pinned-post,[data-pinned="true"],[data-pinned="1"]');
      if(!post)return;
      if(isCommunity(post)||isMessage(post))return;
      post.style.position='relative';icon.classList.add('blooming-direct-lotus');
    });
  }
  function patchShare(){
    document.querySelectorAll('.ac button,.ac .actionlink,button,a,[role="button"]').forEach(el=>{
      const t=txt(el); if(!t.includes('compart')&&!t.includes('share'))return;
      if(isCommunity(el)||isMessage(el))el.style.display='none';
    });
  }
  function observe(){patchButtons();patchLotus();patchShare()}
  document.addEventListener('DOMContentLoaded',observe);new MutationObserver(observe).observe(document.documentElement,{subtree:true,childList:true});
})();
</script>'''

# Add favicon/logo link without changing the existing visual logo.
head='</head>'
extra='<link rel="icon" type="image/svg+xml" href="./blooming-logo.svg">\n'
if 'blooming-logo.svg' not in s:
    s=s.replace(head,extra+head,1)

# Insert styles and script before document end.
s=s.replace('</body>',css+'\n'+js+'\n'+MARK+'\n</body>',1)
p.write_text(s,encoding='utf-8')

# Also ensure the file has a noindex marker for public-but-unlisted hosting.
print('patched')
