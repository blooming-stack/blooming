/* Blooming compatibility helpers.
   This file is loaded by index.html. It deliberately does not rewrite avatar/cover
   elements globally, because profile media belongs to the individual profile.

   Deep post links:
     /@username/post/CODE
   A stable short code is stored on each post as postCode. Older posts get a
   deterministic fallback from their existing id without changing the post id.
*/
(function(){
  'use strict';

  function codeFor(post){
    if(!post) return '';
    if(post.postCode) return String(post.postCode);
    var raw=String(post.id||'');
    if(!raw) return '';
    var h=0;
    for(var i=0;i<raw.length;i++) h=((h<<5)-h+raw.charCodeAt(i))|0;
    h=Math.abs(h).toString(36).toUpperCase();
    return ('000000'+h).slice(-6);
  }

  function usernameFor(post){
    try{
      if(window.U){ var u=U(post.u); if(u&&u.user) return String(u.user); }
    }catch(_){ }
    return String(post&&post.username||'').replace(/^@/,'');
  }

  function postUrl(post){
    var user=usernameFor(post), code=codeFor(post);
    if(!user||!code) return '';
    var base=location.origin+location.pathname;
    return base.replace(/\/$/,'')+'/@'+encodeURIComponent(user)+'/post/'+encodeURIComponent(code);
  }

  function ensurePostCode(post){
    if(!post) return '';
    if(!post.postCode) post.postCode=codeFor(post);
    return post.postCode;
  }

  function findDeepPost(){
    var path=String(location.pathname||'');
    var m=path.match(/\/@([^/]+)\/post\/([^/?#]+)/);
    if(!m) return null;
    return {user:decodeURIComponent(m[1]),code:decodeURIComponent(m[2])};
  }

  function openDeepPost(){
    try{
      var q=findDeepPost();
      if(!q || !window.S || !Array.isArray(S.posts)) return false;
      var p=S.posts.find(function(x){
        var code=String(x.postCode||codeFor(x));
        return code===q.code && String(usernameFor(x)).toLowerCase()===q.user.toLowerCase();
      });
      if(!p) return false;
      if(typeof window.openPost==='function'){ window.openPost(p.id); return true; }
      if(typeof window.viewPost==='function'){ window.viewPost(p.id); return true; }
      location.hash='#/post/'+encodeURIComponent(p.id);
      return true;
    }catch(e){ console.warn('Blooming deep post link',e); return false; }
  }

  function patchShareLink(){
    try{
      if(!window.S || !Array.isArray(S.posts)) return;
      S.posts.forEach(ensurePostCode);
    }catch(_){ }
  }

  window.BloomingProfileMediaV2={
    restore:function(){},
    capture:function(){},
    saveVisible:function(){},
    postCode:codeFor,
    postUrl:postUrl,
    ensurePostCode:ensurePostCode
  };

  window.BloomingPostLinks={
    code:codeFor,
    url:postUrl,
    ensure:ensurePostCode
  };

  function boot(){
    patchShareLink();
    setTimeout(openDeepPost,0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
