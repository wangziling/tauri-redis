var e;!function(e){e.Auto="auto",e.Dark="dark",e.Light="light"}(e||(e={}));var t=Object.defineProperty;function n(e,t=!1){let n=window.crypto.getRandomValues(new Uint32Array(1))[0],r=`_${n}`;return Object.defineProperty(window,r,{value:n=>(t&&Reflect.deleteProperty(window,r),e?.(n)),writable:!1,configurable:!0}),n}async function r(e,t={}){return new Promise(((r,o)=>{let i=n((e=>{r(e),Reflect.deleteProperty(window,`_${u}`)}),!0),u=n((e=>{o(e),Reflect.deleteProperty(window,`_${i}`)}),!0);window.__TAURI_IPC__({cmd:e,callback:i,error:u,...t})}))}function o(e,t="asset"){return window.__TAURI__.convertFileSrc(e,t)}function i(){return r("plugin:setting|resources")}function u(e){return r("plugin:setting|get",{key:e})}function a(e,t){return r("plugin:setting|set",{key:e,value:t})}function c(){return r("plugin:setting|reset")}((e,n)=>{for(var r in n)t(e,r,{get:n[r],enumerable:!0})})({},{convertFileSrc:()=>o,invoke:()=>r,transformCallback:()=>n});var l=new(function(){function e(){}return e.prototype.resources=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return i.apply(void 0,e)},e.prototype.get=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return u.apply(void 0,e)},e.prototype.set=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return a.apply(void 0,e)},e.prototype.reset=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return c.apply(void 0,e)},e.prototype.getTheme=function(){return this.get("theme")},e.prototype.getLanguage=function(){return this.get("language")},e}());export{e as Themes,l as settings};