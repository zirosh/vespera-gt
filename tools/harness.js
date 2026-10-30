/* banco di prova comune: carica fisica, piloti e dati del circuito in un contesto senza grafica,
   più le tabelle aerodinamiche vere della Vespera (aero-presets.json, esportate dal configuratore) */
const fs=require('fs'),vm=require('vm'),path=require('path');
const el=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='classList'?{toggle(){},add(){},remove(){}}:k==='querySelectorAll'?()=>[]:k==='style'?{}:typeof k==='string'&&/^(set|add|remove|get|focus|blur|appendChild|insertBefore)/.test(k)?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const ctx={console,Math,Date,JSON,Float64Array,Float32Array,Uint8Array,Map,Set,Array,Object,Number,String,performance:{now:()=>Date.now()},
  document:{getElementById:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:el(),createElement:()=>el()},
  window:{addEventListener(){},matchMedia:()=>({matches:false})},navigator:{},localStorage:{getItem:()=>null,setItem(){}},
  getComputedStyle:()=>({getPropertyValue:()=>''})};
vm.createContext(ctx);
/* scocca Rapier: RB=0 per la fisica piana; con Rapier chiamare prima await harness.ready */
const RAPIER=process.env.RB==='0'?null:require(path.join(__dirname,'../vendor/rapier/rapier.cjs.js'));if(RAPIER)ctx.RAPIER=RAPIER;
const rd=f=>fs.readFileSync(path.join(__dirname,'../src/track/',f),'utf8');
const core=rd('track-core.js').replace(/if\(typeof module[^\n]*\n/,'');
const A=rd('track-a.js'),Adata=A.slice(0,A.indexOf('/* ========================================================='+'\n   Mondo 3D'));
const B2=rd('track-b2.js')+rd('track-b13.js')+rd('track-b16.js'),B1=rd('track-b1.js');const CH=B1.slice(B1.indexOf("const TRK_CHARS="),B1.indexOf("\n",B1.indexOf("const TRK_CHAR_PLAIN="))+1);
const EXTRA=(process.env.EXTRA||'').split(',').filter(Boolean).map(rd).join('\n');
const pre=`const THREE={Vector3:class{set(){return this;}copy(){return this;}},Vector4:class{set(){return this;}}};const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);const smooth01=(x,a,b)=>{const t=Math.min(Math.max((x-a)/(b-a),0),1);return t*t*(3-2*t);};const dec=(n,d)=>n.toFixed(d);const fmt=n=>Math.round(n)+'';
const state={};const engine={on:false};function trkPanel(){}function trkCheer(){}function trkThump(){}function trkPitUI(){}function resetDynamics(){}function trkSavePrefs(){}function trkAtmo(){}
`;
vm.runInContext(pre+CH+core+Adata.replace("const fmtLap=","var fmtLap=")+B2+EXTRA+`;globalThis.TRK=TRK;globalThis.TRK_CHAR_PLAIN=TRK_CHAR_PLAIN;globalThis.H={trkEnsureData,lapSim,trkPhysics,trkVertical,trkLocate,trkSurface,trkCollide,trkAIDrive,trkWxGrip,TRK_TIRES,trkReset,trkWheelSync};`,ctx);
const {TRK,H}=ctx;const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const tables=JSON.parse(fs.readFileSync(process.env.AERO||path.join(__dirname,'aero-presets.json'),'utf8'));
function mkV(tb){const t=tb.t,n=t.length-1;return {m:1480,kw:460,mu:1.15,wf:tb.wf,h:tb.h,lwb:tb.lwb,track:tb.track,len:4.6,wid:1.95,name:'V',
  aero:v=>{const x=Math.min(Math.abs(v)*3.6/10,n-0.001),i=Math.floor(x),f=x-i,a=t[i],b=t[i+1];return {D:a[1]+(b[1]-a[1])*f,Ff:a[2]+(b[2]-a[2])*f,Fr:a[3]+(b[3]-a[3])*f};}};}
const ready=(RAPIER?RAPIER.init():Promise.resolve()).then(()=>vm.runInContext('RB.R=typeof RAPIER!=="undefined"?RAPIER:null',ctx));
module.exports={ctx,vm,TRK,H,tables,mkV,clamp,ready};
