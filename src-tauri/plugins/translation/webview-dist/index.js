const t=/(?:{([a-zA-z]+[^{}|]*(?:\|[^{}]*)?)})/gi,e=/\s/g;var r="object"==typeof global&&global&&global.Object===Object&&global,n="object"==typeof self&&self&&self.Object===Object&&self,o=r||n||Function("return this")(),c=o.Symbol,i=Object.prototype,a=i.hasOwnProperty,u=i.toString,s=c?c.toStringTag:void 0;var l=Object.prototype.toString;var f="[object Null]",p="[object Undefined]",b=c?c.toStringTag:void 0;function y(t){return null==t?void 0===t?p:f:b&&b in Object(t)?function(t){var e=a.call(t,s),r=t[s];try{t[s]=void 0;var n=!0}catch(t){}var o=u.call(t);return n&&(e?t[s]=r:delete t[s]),o}(t):function(t){return l.call(t)}(t)}function j(t){return null!=t&&"object"==typeof t}var d=Array.isArray;function v(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}var g="[object AsyncFunction]",h="[object Function]",w="[object GeneratorFunction]",_="[object Proxy]";function m(t){if(!v(t))return!1;var e=y(t);return e==h||e==w||e==g||e==_}var O,A=o["__core-js_shared__"],x=(O=/[^.]+$/.exec(A&&A.keys&&A.keys.IE_PROTO||""))?"Symbol(src)_1."+O:"";var P=Function.prototype.toString;function S(t){if(null!=t){try{return P.call(t)}catch(t){}try{return t+""}catch(t){}}return""}var T=/^\[object .+?Constructor\]$/,F=Function.prototype,R=Object.prototype,$=F.toString,k=R.hasOwnProperty,E=RegExp("^"+$.call(k).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function U(t){return!(!v(t)||(e=t,x&&x in e))&&(m(t)?E:T).test(S(t));var e}function I(t,e){var r=function(t,e){return null==t?void 0:t[e]}(t,e);return U(r)?r:void 0}var M=I(o,"WeakMap");function B(){}var z=9007199254740991;function C(t){return"number"==typeof t&&t>-1&&t%1==0&&t<=z}var D=Object.prototype;function V(t){var e=t&&t.constructor;return t===("function"==typeof e&&e.prototype||D)}function W(t){return j(t)&&"[object Arguments]"==y(t)}var q=Object.prototype,N=q.hasOwnProperty,G=q.propertyIsEnumerable,L=W(function(){return arguments}())?W:function(t){return j(t)&&N.call(t,"callee")&&!G.call(t,"callee")};var H="object"==typeof exports&&exports&&!exports.nodeType&&exports,J=H&&"object"==typeof module&&module&&!module.nodeType&&module,K=J&&J.exports===H?o.Buffer:void 0,Q=(K?K.isBuffer:void 0)||function(){return!1},X={};X["[object Float32Array]"]=X["[object Float64Array]"]=X["[object Int8Array]"]=X["[object Int16Array]"]=X["[object Int32Array]"]=X["[object Uint8Array]"]=X["[object Uint8ClampedArray]"]=X["[object Uint16Array]"]=X["[object Uint32Array]"]=!0,X["[object Arguments]"]=X["[object Array]"]=X["[object ArrayBuffer]"]=X["[object Boolean]"]=X["[object DataView]"]=X["[object Date]"]=X["[object Error]"]=X["[object Function]"]=X["[object Map]"]=X["[object Number]"]=X["[object Object]"]=X["[object RegExp]"]=X["[object Set]"]=X["[object String]"]=X["[object WeakMap]"]=!1;var Y,Z="object"==typeof exports&&exports&&!exports.nodeType&&exports,tt=Z&&"object"==typeof module&&module&&!module.nodeType&&module,et=tt&&tt.exports===Z&&r.process,rt=function(){try{var t=tt&&tt.require&&tt.require("util").types;return t||et&&et.binding&&et.binding("util")}catch(t){}}(),nt=rt&&rt.isTypedArray,ot=nt?(Y=nt,function(t){return Y(t)}):function(t){return j(t)&&C(t.length)&&!!X[y(t)]};var ct=function(t,e){return function(r){return t(e(r))}}(Object.keys,Object),it=ct,at=Object.prototype.hasOwnProperty;var ut=I(o,"Map"),st=I(o,"DataView"),lt=I(o,"Promise"),ft=I(o,"Set"),pt="[object Map]",bt="[object Promise]",yt="[object Set]",jt="[object WeakMap]",dt="[object DataView]",vt=S(st),gt=S(ut),ht=S(lt),wt=S(ft),_t=S(M),mt=y;(st&&mt(new st(new ArrayBuffer(1)))!=dt||ut&&mt(new ut)!=pt||lt&&mt(lt.resolve())!=bt||ft&&mt(new ft)!=yt||M&&mt(new M)!=jt)&&(mt=function(t){var e=y(t),r="[object Object]"==e?t.constructor:void 0,n=r?S(r):"";if(n)switch(n){case vt:return dt;case gt:return pt;case ht:return bt;case wt:return yt;case _t:return jt}return e});var Ot=mt,At=Object.prototype.hasOwnProperty;function xt(t){if(null==t)return!0;if(function(t){return null!=t&&C(t.length)&&!m(t)}(t)&&(d(t)||"string"==typeof t||"function"==typeof t.splice||Q(t)||ot(t)||L(t)))return!t.length;var e=Ot(t);if("[object Map]"==e||"[object Set]"==e)return!t.size;if(V(t))return!function(t){if(!V(t))return it(t);var e=[];for(var r in Object(t))at.call(t,r)&&"constructor"!=r&&e.push(r);return e}(t).length;for(var r in t)if(At.call(t,r))return!1;return!0}var Pt=Object.defineProperty;function St(t,e=!1){let r=window.crypto.getRandomValues(new Uint32Array(1))[0],n=`_${r}`;return Object.defineProperty(window,n,{value:r=>(e&&Reflect.deleteProperty(window,n),t?.(r)),writable:!1,configurable:!0}),r}async function Tt(t,e={}){return new Promise(((r,n)=>{let o=St((t=>{r(t),Reflect.deleteProperty(window,`_${c}`)}),!0),c=St((t=>{n(t),Reflect.deleteProperty(window,`_${o}`)}),!0);window.__TAURI_IPC__({cmd:t,callback:o,error:c,...e})}))}function Ft(t,e="asset"){return window.__TAURI__.convertFileSrc(t,e)}function Rt(){return Tt("plugin:translation|resources")}function $t(){}function kt(t){return t()}function Et(t,...e){if(null==t){for(const t of e)t(void 0);return $t}const r=t.subscribe(...e);return r.unsubscribe?()=>r.unsubscribe():r}function Ut(t){let e;return Et(t,(t=>e=t))(),e}((t,e)=>{for(var r in e)Pt(t,r,{get:e[r],enumerable:!0})})({},{convertFileSrc:()=>Ft,invoke:()=>Tt,transformCallback:()=>St});const It=[];function Mt(t,e=$t){let r;const n=new Set;function o(e){if(c=e,((o=t)!=o?c==c:o!==c||o&&"object"==typeof o||"function"==typeof o)&&(t=e,r)){const e=!It.length;for(const e of n)e[1](),It.push(e,t);if(e){for(let t=0;t<It.length;t+=2)It[t][0](It[t+1]);It.length=0}}var o,c}function c(e){o(e(t))}return{set:o,update:c,subscribe:function(i,a=$t){const u=[i,a];return n.add(u),1===n.size&&(r=e(o,c)||$t),i(t),()=>{n.delete(u),0===n.size&&r&&(r(),r=null)}}}}function Bt(t,e,r){const n=!Array.isArray(t),o=n?[t]:t;if(!o.every(Boolean))throw new Error("derived() expects stores as input, got a falsy value");const c=e.length<2;return i=(t,r)=>{let i=!1;const a=[];let u=0,s=$t;const l=()=>{if(u)return;s();const o=e(n?a[0]:a,t,r);c?t(o):s="function"==typeof o?o:$t},f=o.map(((t,e)=>Et(t,(t=>{a[e]=t,u&=~(1<<e),i&&l()}),(()=>{u|=1<<e}))));return i=!0,l(),function(){f.forEach(kt),s(),i=!1}},{subscribe:Mt(r,i).subscribe};var i}class zt{translations=Mt({});language=Mt("en-US");constructor(){this._init().catch(B)}switchTo(t){return function(t){return Tt("plugin:translation|switch_to",{language:t})}(t).then((()=>Rt())).then((e=>this._update(e,t)))}_init(){return Promise.all([Tt("plugin:translation|language"),Rt()]).then((([t,e])=>{this._update(e,t)}))}_update(t,e){if(t&&"object"==typeof t)return this.translations.set(t),this.language.set(e),this}_baseTranslate(t,r){if("string"!=typeof r)return"";if(!r.replace(e,"").length)return"";const n=r.indexOf("|"),o=-1===n?r:r.slice(0,n),c=(-1===n?"":r.slice(n+1))||`#${o}`;if(xt(t))return c;const i=t[o.toLowerCase()];return"string"!=typeof i?c:i}_translate(e,r,...n){let o=this._baseTranslate(e,r);if(!o)return o;n.length&&(o=this.format.apply(this,[o,...n]));const c=t;return c.test(o)?o.replace(c,((t,r)=>this._baseTranslate(e,r))):o}translate(t,...e){return this._translate.apply(this,[Ut(this.translations),t,...e])}translateDerived(t,...e){const r=this;return Bt(this.translations,(function(n){return r._translate.apply(this,[n,t,...e])}))}format(t,...e){return e.forEach((function(e,r){"string"==typeof e&&(t=t.replace(new RegExp("\\{"+r+"\\}","gm"),e))})),t}subscribe(...t){return this.translations.subscribe(...t)}derived(t){return Bt(this.translations,(function(e){return t(e)}))}}const Ct=new zt;export{zt as Translator,Ct as translator};
