var t;function e(){}function n(t){return t()}!function(t){t.System="system",t.Dark="dark",t.Light="light"}(t||(t={}));const r=[];function o(t,n=e){let o;const u=new Set;function i(e){if(i=e,((n=t)!=n?i==i:n!==i||n&&"object"==typeof n||"function"==typeof n)&&(t=e,o)){const e=!r.length;for(const e of u)e[1](),r.push(e,t);if(e){for(let t=0;t<r.length;t+=2)r[t][0](r[t+1]);r.length=0}}var n,i}function s(e){i(e(t))}return{set:i,update:s,subscribe:function(r,c=e){const f=[r,c];return u.add(f),1===u.size&&(o=n(i,s)||e),r(t),()=>{u.delete(f),0===u.size&&o&&(o(),o=null)}}}}function u(t,r,u){const i=!Array.isArray(t),s=i?[t]:t;if(!s.every(Boolean))throw new Error("derived() expects stores as input, got a falsy value");const c=r.length<2;return f=(t,o)=>{let u=!1;const f=[];let a=0,l=e;const p=()=>{if(a)return;l();const n=r(i?f[0]:f,t,o);c?t(n):l="function"==typeof n?n:e},y=s.map(((t,n)=>function(t,...n){if(null==t){for(const t of n)t(void 0);return e}const r=t.subscribe(...n);return r.unsubscribe?()=>r.unsubscribe():r}(t,(t=>{f[n]=t,a&=~(1<<n),u&&p()}),(()=>{a|=1<<n}))));return u=!0,p(),function(){y.forEach(n),l(),u=!1}},{subscribe:o(u,f).subscribe};var f}var i=Object.defineProperty;function s(t,e=!1){let n=window.crypto.getRandomValues(new Uint32Array(1))[0],r=`_${n}`;return Object.defineProperty(window,r,{value:n=>(e&&Reflect.deleteProperty(window,r),t?.(n)),writable:!1,configurable:!0}),n}async function c(t,e={}){return new Promise(((n,r)=>{let o=s((t=>{n(t),Reflect.deleteProperty(window,`_${u}`)}),!0),u=s((t=>{r(t),Reflect.deleteProperty(window,`_${o}`)}),!0);window.__TAURI_IPC__({cmd:t,callback:o,error:u,...e})}))}function f(t,e="asset"){return window.__TAURI__.convertFileSrc(t,e)}function a(t){return c("plugin:setting|get",{key:t})}function l(t,e){return c("plugin:setting|set",{key:t,value:e})}function p(){return c("plugin:setting|reset")}((t,e)=>{for(var n in e)i(t,n,{get:e[n],enumerable:!0})})({},{convertFileSrc:()=>f,invoke:()=>c,transformCallback:()=>s});var y=new(function(){function t(){this._resources=o({}),this._update=this._update.bind(this)}return t.prototype._update=function(t){return this._resources.set(t),t},t.prototype.resources=function(){return c("plugin:setting|resources").then(this._update)},t.prototype.get=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return a.apply(void 0,t)},t.prototype.set=function(){for(var t=this,e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];return l.apply(void 0,e).then((function(e){return t.resources().then((function(){return e}))}))},t.prototype.reset=function(){for(var t=this,e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];return p.apply(void 0,e).then((function(e){return t.resources().then((function(){return e}))}))},t.prototype.getTheme=function(){return this.get("theme")},t.prototype.getLanguage=function(){return this.get("language")},t.prototype.subscribe=function(){for(var t,e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];return(t=this._resources).subscribe.apply(t,e)},t.prototype.derived=function(t){return u(this._resources,(function(e){return"function"==typeof t?t(e):e}))},t}());export{t as Theme,y as settings};
