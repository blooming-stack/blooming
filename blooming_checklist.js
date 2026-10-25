(()=>{'use strict';
const KEY='blooming:v08:checklist';
const ITEMS=[
 ['Conta e acesso','Login, criação de conta, código, recuperação, logout e sessões.'],
 ['Perfis','Criar, editar, excluir, trocar perfil, username único, foto e capa.'],
 ['Persistência Supabase','Perfis e alterações permanecem após atualizar e em outros dispositivos.'],
 ['Feed','Publicar texto/foto/vídeo, editar, excluir, curtir, comentários e fixar.'],
 ['Seguindo / Para você','Abas funcionais e feed separado por relacionamento.'],
 ['Busca e descoberta','Usuários, usernames, hashtags e tendências.'],
 ['Seguir','Seguir, deixar de seguir, solicitações privadas e contagens.'],
 ['Notificações','Curtidas, comentários, novos seguidores e solicitações.'],
 ['Mensagens','Conversas, excluir mensagem, limpar chat e excluir conversa.'],
 ['Mídia no chat','Fotos, vídeos, áudios, stickers e GIFs.'],
 ['Comunidades','Criar, entrar, convidar e publicar em comunidades.'],
 ['Importação X','Links, imagens, vídeos, datas originais, deduplicação e sincronização.'],
 ['Links inteligentes','Spotify, livros, Wattpad, filmes e Letterboxd.'],
 ['Configurações','Tema, cor, conta, perfis, privacidade, recuperação e sessões.'],
 ['Mobile / desktop','Navegação, rolagem da página, menus e layout responsivo.'],
 ['Segurança','RLS, isolamento por conta e nenhuma chave secreta no frontend.'],
 ['Backup','Dados importantes persistem no Supabase e não dependem somente do localStorage.'],
 ['Limpeza','Sem contas, posts, chats ou conteúdos de teste ressuscitando após refresh.']
];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
function esc(s){return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
function open(){let d=document.querySelector('#blooming-checklist');if(d){d.showModal();render();return}d=document.createElement('dialog');d.id='blooming-checklist';d.innerHTML=`<style>#blooming-checklist{width:min(760px,94vw);max-height:88vh;border:0;border-radius:24px;padding:0;background:var(--card,#fff);color:var(--ink,#17131d);box-shadow:0 20px 70px #0008}#blooming-checklist::backdrop{background:#0009;backdrop-filter:blur(5px)}.bc-head{position:sticky;top:0;padding:22px 24px;border-bottom:1px solid var(--line,#ddd);background:var(--card,#fff);z-index:2}.bc-head h2{margin:0}.bc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.bc-list{padding:14px 24px 24px}.bc-item{display:flex;gap:12px;align-items:flex-start;padding:13px 4px;border-bottom:1px solid var(--line,#ddd)}.bc-item input{width:20px;height:20px;accent-color:var(--acc,#e8336f);margin-top:2px}.bc-item.done .bc-title{text-decoration:line-through;opacity:.55}.bc-title{font-weight:700}.bc-desc{font-size:.9rem;color:var(--mut,#71697e);margin-top:3px}.bc-close{float:right;border:0;background:none;font-size:26px;cursor:pointer;color:inherit}.bc-progress{height:8px;border-radius:99px;background:var(--line,#ddd);overflow:hidden;margin-top:12px}.bc-progress i{display:block;height:100%;width:0;background:var(--acc,#e8336f);transition:width .2s}</style><button class="bc-close" onclick="this.closest('dialog').close()">×</button><div class="bc-head"><h2>🌸 Checklist do Blooming</h2><div id="bc-count" class="mut">0/0 concluídas</div><div class="bc-progress"><i id="bc-bar"></i></div><div class="bc-actions"><button class="b sm" id="bc-all">Marcar tudo</button><button class="b g sm" id="bc-clear">Limpar</button></div></div><div class="bc-list" id="bc-list"></div>`;document.body.appendChild(d);d.showModal();d.querySelector('#bc-all').onclick=()=>{const x={};ITEMS.forEach((_,i)=>x[i]=true);write(x);render()};d.querySelector('#bc-clear').onclick=()=>{write({});render()};render()}
function render(){const d=document.querySelector('#blooming-checklist');if(!d)return;const x=read(),list=d.querySelector('#bc-list');list.innerHTML=ITEMS.map((it,i)=>`<label class="bc-item ${x[i]?'done':''}"><input type="checkbox" data-i="${i}" ${x[i]?'checked':''}><div><div class="bc-title">${esc(it[0])}</div><div class="bc-desc">${esc(it[1])}</div></div></label>`).join('');list.querySelectorAll('input').forEach(c=>c.onchange=()=>{const y=read();y[c.dataset.i]=c.checked;write(y);render()});const done=ITEMS.reduce((n,_,i)=>n+(x[i]?1:0),0);d.querySelector('#bc-count').textContent=`${done}/${ITEMS.length} concluídas`;d.querySelector('#bc-bar').style.width=`${Math.round(done/ITEMS.length*100)}%`}
function install(){if(document.querySelector('[data-blooming-checklist]'))return;const b=document.createElement('button');b.type='button';b.dataset.bloomingChecklist='1';b.className='b g sm';b.textContent='✓ Checklist Blooming';b.title='Abrir checklist de funções do Blooming';b.onclick=open;const nav=document.querySelector('.nv');if(nav)nav.appendChild(b);else{b.style.position='fixed';b.style.right='18px';b.style.bottom='18px';b.style.zIndex='9999';document.body.appendChild(b)}}
window.BloomingChecklist={open,render,items:ITEMS};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
