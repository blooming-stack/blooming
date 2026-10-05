/* Blooming session guard — prevents background sync/view calls from turning a live session into login. */
(function(){
  'use strict';
  if(window.__BLOOMING_SESSION_GUARD__) return;
  window.__BLOOMING_SESSION_GUARD__ = true;
  var KEY='blooming-session-lock-v1';
  function read(){ try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null} }
  function write(){ try{ if(typeof S==='undefined'||!S||!S.currentAccountId)return; localStorage.setItem(KEY,JSON.stringify({accountId:String(S.currentAccountId),accessMode:window.accessMode||'',ts:Date.now()})); }catch(_){} }
  function clear(){ try{localStorage.removeItem(KEY)}catch(_){} }
  function valid(){ try{var x=read();return !!(x&&typeof S!=='undefined'&&S&&S.accounts&&S.accounts[x.accountId]);}catch(_){return false} }
  function restore(){
    try{
      var x=read();
      if(!x||typeof S==='undefined'||!S||!S.accounts||!S.accounts[x.accountId])return false;
      if(typeof UNL!=='undefined' && UNL===false){
        UNL=true;
        window.accessMode=x.accessMode||'normal';
        S.currentAccountId=x.accountId;
        S.editMode=false;
        if(typeof saveLocalOnly==='function')saveLocalOnly();
        if(typeof unlockScreen==='function')unlockScreen(true);
      }
      return true;
    }catch(e){console.warn('Blooming session restore',e);return false}
  }
  document.addEventListener('click',function(e){
    var logout=e.target.closest&&e.target.closest('[data-m="o"]');
    if(logout) clear();
    var login=e.target.closest&&e.target.closest('[data-a="li"]');
    if(login) setTimeout(write,300);
  },true);
  var oldLogout=window.performLogout;
  if(typeof oldLogout==='function'){
    window.performLogout=function(){ clear(); return oldLogout.apply(this,arguments); };
  }
  var oldLogin=window.login;
  if(typeof oldLogin==='function'){
    window.login=function(){
      /* A valid session must never be replaced by an automatic login() call. */
      if(valid() && !document.getElementById('lu')){ restore(); return; }
      return oldLogin.apply(this,arguments);
    };
  }
  var oldCloud=window.cloudPull;
  if(typeof oldCloud==='function'){
    window.cloudPull=function(){
      /* External patches sometimes call cloudPull with UNL undefined. Never let that render login. */
      if(typeof UNL==='undefined' || (UNL!==true && !(typeof S!=='undefined'&&S&&S.me))){
        restore();
        if(typeof UNL==='undefined' || (UNL!==true && !(typeof S!=='undefined'&&S&&S.me))) return Promise.resolve();
      }
      return oldCloud.apply(this,arguments);
    };
  }
  write();
  setInterval(function(){
    try{
      if(typeof UNL!=='undefined' && UNL===true && typeof S!=='undefined' && S && S.currentAccountId) write();
      else if(valid()) restore();
    }catch(_){}
  },500);
})();
