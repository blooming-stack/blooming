/* Blooming login stabilization shim.
 * The canonical profile/media implementation remains pinned to the previous
 * immutable commit below, while this shim prevents the obsolete inline login
 * override in index.html from installing its capture-phase handler.
 */
(function(){
  'use strict';
  if(window.__BLOOMING_LOGIN_SHIM__)return;
  window.__BLOOMING_LOGIN_SHIM__=true;
  /* The legacy inline block checks this flag before installing itself. */
  window.__BLFIX=true;

  var legacy='https://raw.githubusercontent.com/blooming-stack/blooming/cffe20dc8015aa30f1db9290f30715c839784e49/profile-media-v2.js';
  var s=document.createElement('script');
  s.src=legacy;
  s.async=false;
  s.onload=function(){window.__BLOOMING_PROFILE_MEDIA_V2_LOADED__=true};
  s.onerror=function(){console.warn('Blooming: não foi possível carregar a camada de persistência de perfis.')};
  document.head.appendChild(s);
})();
