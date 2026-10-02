/* Blooming profile media compatibility file.
   The old version applied the selected image to every .av/.bn element on the page,
   which caused one profile's avatar to appear on all profiles. The real profile
   editor in index.html now owns media persistence, so this file intentionally does
   not rewrite rendered avatars or covers. */
(function(){
  'use strict';
  window.BloomingProfileMediaV2={
    restore:function(){},
    capture:function(){},
    saveVisible:function(){}
  };
})();
