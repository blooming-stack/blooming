const URL_SUPABASE="https://jzetzelxstyfzrjfnill.supabase.co";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZXR6ZWx4c3R5ZnpyamZuaWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODQ3NjUsImV4cCI6MjEwODQ2MDc2NX0.x3ZmG-S1hluuLCqJHWHMo6oL8Iyjk2P_CQIsNFnggcA";
const db=supabase.createClient(URL_SUPABASE,KEY);

let S={user:null,profile:null};
const $=x=>document.querySelector(x);

async function boot(){
  const {data:{session}}=await db.auth.getSession();
  if(session){ 
    S.user=session.user; 
    await loadProfile(); 
  } else { 
    renderLogin(); 
  }
}

function renderLogin(){
  $("#app").innerHTML=`
    <div class="lo">
      <h1>🌸 Blooming</h1>
      <p style="color:var(--mut);margin-bottom:20px">Entre na sua conta</p>
      <input class="fi" id="email" type="email" placeholder="E-mail">
      <input class="fi" id="pass" type="password" placeholder="Senha">
      <button class="b" style="width:100%;padding:14px" onclick="doLogin()">Entrar</button>
      <p style="margin-top:20px"><a style="color:var(--acc);cursor:pointer" onclick="renderRegister()">Criar nova conta</a></p>
    </div>`;
}

function renderRegister(){
  $("#app").innerHTML=`
    <div class="lo">
      <h1>🌸 Criar Conta</h1>
      <input class="fi" id="name" placeholder="Nome">
      <input class="fi" id="user" placeholder="@ Usuário">
      <input class="fi" id="email" type="email" placeholder="E-mail">
      <input class="fi" id="pass" type="password" placeholder="Senha">
      <button class="b" style="width:100%;padding:14px" onclick="doRegister()">Criar Conta</button>
      <p style="margin-top:20px"><a style="color:var(--acc);cursor:pointer" onclick="renderLogin()">Já tenho conta</a></p>
    </div>`;
}

async function doLogin(){
  const {data,error}=await db.auth.signInWithPassword({email:$("#email").value, password:$("#pass").value});
  if(error) return alert(error.message);
  S.user=data.user; await loadProfile();
}

async function doRegister(){
  const {data,error}=await db.auth.signUp({email:$("#email").value, password:$("#pass").value});
  if(error) return alert(error.message);
  await db.from("blooming_profiles").insert([{
    id: data.user.id, nome: $("#name").value, username: $("#user").value.replace(/^@/,"")
  }]);
  S.user=data.user; await loadProfile();
}

async function loadProfile(){
  const {data}=await db.from("blooming_profiles").select("*").eq("id",S.user.id).single();
  S.profile=data;
  renderApp();
}

function renderApp(){
  $("#app").innerHTML=`
    <div class="sh">
      <nav class="nv">
        <div class="lg">🌸 <span>Blooming</span></div>
        <a href="#" onclick="loadFeed()">⌂ <span>Início</span></a>
        <a href="#" onclick="openEdit()">👤 <span>Perfil</span></a>
        <button style="margin-top:auto" onclick="logout()">↪ <span>Sair</span></button>
      </nav>
      <main>
        <div class="tp">Início</div>
        <div class="cp">
          <div class="av">${S.profile.avatar_url?`<img src="${S.profile.avatar_url}">`:S.profile.emoji}</div>
          <div style="flex:1">
            <textarea id="postText" placeholder="O que está florescendo?"></textarea>
            <div style="display:flex;justify-content:flex-end"><button class="b" onclick="publish()">Publicar</button></div>
          </div>
        </div>
        <div id="feed"></div>
      </main>
      <aside class="rc">
        <div style="background:var(--card);padding:16px;border-radius:16px">
          <b>${S.profile.nome}</b><br>
          <span style="color:var(--mut)">@${S.profile.username}</span>
        </div>
      </aside>
    </div>`;
  loadFeed();
}

async function loadFeed(){
  const {data}=await db.from("blooming_posts")
    .select("*, blooming_profiles(nome, username, avatar_url, emoji)")
    .order("created_at", {ascending:false});
    
  $("#feed").innerHTML=data.map(p=>`
    <div class="po">
      <div class="av">${p.blooming_profiles?.avatar_url?`<img src="${p.blooming_profiles.avatar_url}">`:p.blooming_profiles?.emoji||'🌸'}</div>
      <div class="bd">
        <b>${p.blooming_profiles?.nome}</b> <span style="color:var(--mut)">@${p.blooming_profiles?.username}</span>
        <div class="tx">${p.text}</div>
        <div class="ac">
          <button>💬 Comentar</button>
          <button>♡ Curtir</button>
          ${p.user_id===S.user.id?`<button onclick="deletePost('${p.id}')" style="margin-left:auto">🗑️</button>`:''}
        </div>
      </div>
    </div>
  `).join("") || '<p style="padding:20px;text-align:center;color:var(--mut)">Nenhum post.</p>';
}

async function publish(){
  const text=$("#postText").value;
  if(!text.trim()) return;
  await db.from("blooming_posts").insert([{user_id: S.user.id, text}]);
  loadFeed();
}

async function deletePost(id){
  if(!confirm("Excluir?")) return;
  await db.from("blooming_posts").delete().eq("id", id);
  loadFeed();
}

function logout(){ db.auth.signOut(); location.reload(); }

boot();
