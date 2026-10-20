/* Blooming session guard — keeps the custom access-code session stable across refresh, route changes and cloud sync. */
(function(){
  'use strict';
  if(window.__BLOOMING_SESSION_GUARD__) return;
  window.__BLOOMING_SESSION_GUARD__ = true;
  var KEY='blooming-session-lock-v2';
  var LEGACY='blooming-session-lock-v1';
  var loginPoll=0;

  function state(){try{return (typeof S!=='undefined'&&S)?S:null}catch(_){return null}}
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY)||'null')}catch(_){return null}}
  function accounts(){var s=state();return s&&s.accounts&&typeof s.accounts==='object'?s.accounts:null}
  function accountExists(id){var a=accounts();return !!(id&&a&&a[String(id)])}
  function write(force){
    try{
      var s=state(),id=s&&s.currentAccountId;
      if(!id && s&&s.accountId) id=s.accountId;
      if(!id && s&&s.me && s.u&&s.u[s.me]&&s.u[s.me].accountId) id=s.u[s.me].accountId;
      if(!id)return false;
      localStorage.setItem(KEY,JSON.stringify({accountId:String(id),accessMode:window.accessMode||'normal',ts:Date.now(),v:2}));
      if(force)localStorage.removeItem(LEGACY);
      return true;
    }catch(_){return false}
  }
  function clear(){try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY)}catch(_){}
  }
  function restore(){
    try{
      var x=read(),s=state();
      if(!x||!s||!accountExists(x.accountId))return false;
      s.currentAccountId=String(x.accountId);
      if(!s.accountId)s.accountId=String(x.accountId);
      if(typeof window.accessMode==='undefined'||!window.accessMode)window.accessMode=x.accessMode||'normal';
      if(typeof UNL!=='undefined')UNL=true;
      if(typeof s.editMode!=='undefined')s.editMode=false;
      if(typeof window.saveLocalOnly==='function')window.saveLocalOnly();
      if(typeof window.unlockScreen==='function')window.unlockScreen(true);
      return true;
    }catch(e){console.warn('Blooming session restore',e);return false}
  }
  function scheduleWrite(){
    clearTimeout(loginPoll);
    var started=Date.now();
    function tick(){
      if(write(true))return;
      if(Date.now()-started<6000)loginPoll=setTimeout(tick,200);
    }
    tick();
  }

  document.addEventListener('click',function(e){
    var logout=e.target.closest&&e.target.closest('[data-m="o"]');
    if(logout)clear();
    var login=e.target.closest&&e.target.closest('[data-a="li"]');
    if(login)scheduleWrite();
  },true);

  var oldLogout=window.performLogout;
  if(typeof oldLogout==='function'){
    window.performLogout=function(){clear();return oldLogout.apply(this,arguments)};
  }

  var oldLogin=window.login;
  if(typeof oldLogin==='function'){
    window.login=function(){
      /* Never replace an already authenticated session with a fresh login screen. */
      try{
        if(!document.getElementById('lu') && restore())return;
      }catch(_){}
      var result=oldLogin.apply(this,arguments);
      setTimeout(scheduleWrite,50);
      return result;
    };
  }

  /* Cloud sync must never decide that the user is logged out. */
  var oldCloud=window.cloudPull;
  if(typeof oldCloud==='function'){
    window.cloudPull=function(){
      try{restore()}catch(_){}
      return oldCloud.apply(this,arguments);
    };
  }

  /* Give the app a chance to finish booting before restoring a saved session. */
  var bootStarted=Date.now();
  var bootTimer=setInterval(function(){
    try{
      if(write(false)){clearInterval(bootTimer);return}
      if(Date.now()-bootStarted>8000){clearInterval(bootTimer);restore();}
    }catch(_){clearInterval(bootTimer)}
  },250);

  window.addEventListener('storage',function(e){
    if(e.key===KEY||e.key===LEGACY){if(read())restore();else if(e.key===KEY)clear()}
  });

  /* Do not clear the session merely because a background render temporarily has incomplete state. */
  setInterval(function(){try{if(!write(false))restore()}catch(_){}},1000);
})();
