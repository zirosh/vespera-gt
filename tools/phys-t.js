const fs=require('fs'),vm=require('vm');
const el=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='classList'?{toggle(){},add(){},remove(){}}:k==='querySelectorAll'?()=>[]:k==='style'?{}:typeof k==='string'&&/^(set|add|remove|get|focus|blur|appendChild|insertBefore)/.test(k)?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const ctx={console,Math,Date,JSON,Float64Array,Float32Array,Uint8Array,Map,Set,Array,Object,Number,String,performance:{now:()=>Date.now()},
  document:{getElementById:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:el(),createElement:()=>el()},
  window:{addEventListener(){},matchMedia:()=>({matches:false})},navigator:{},localStorage:{getItem:()=>null,setItem(){}},
  getComputedStyle:()=>({getPropertyValue:()=>''})};
vm.createContext(ctx);
const core=fs.readFileSync(require('path').join(__dirname,'../src/track/track-core.js'),'utf8').replace(/if\(typeof module[^\n]*\n/,'');
const A=fs.readFileSync(require('path').join(__dirname,'../src/track/track-a.js'),'utf8'),Adata=A.slice(0,A.indexOf('/* ========================================================='+'\n   Mondo 3D'));
const B2=fs.readFileSync(require('path').join(__dirname,'../src/track/track-b2.js'),'utf8'),B1=fs.readFileSync(require('path').join(__dirname,'../src/track/track-b1.js'),'utf8');const CH=B1.slice(B1.indexOf("const TRK_CHARS="),B1.indexOf("\n",B1.indexOf("const TRK_CHAR_PLAIN="))+1);
const pre=`const THREE={Vector3:class{set(){return this;}copy(){return this;}},Vector4:class{set(){return this;}}};const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);const smooth01=(x,a,b)=>{const t=Math.min(Math.max((x-a)/(b-a),0),1);return t*t*(3-2*t);};const dec=(n,d)=>n.toFixed(d);const fmt=n=>Math.round(n)+'';
const state={};const engine={on:false};function trkPanel(){}function trkCheer(){}function trkThump(){}function trkPitUI(){}function resetDynamics(){}function trkSavePrefs(){}function trkAtmo(){}
`;
vm.runInContext(pre+CH+core+Adata.replace("const fmtLap=","var fmtLap=")+B2+`;globalThis.TRK=TRK;globalThis.TRK_CHARS=TRK_CHARS;globalThis.TRK_CHAR_PLAIN=TRK_CHAR_PLAIN;globalThis.trkWheelSync=trkWheelSync;globalThis.trkPhysics=trkPhysics;globalThis.H={trkEnsureData,lapSim,trkPhysics,trkVertical,trkLocate,trkSurface,trkCollide,trkCarsCollide,trkWake,trkAIDrive,trkPitStep,trkPitCheck,trkLap,trkRaceUpdate,trkRaceSetup,trkWxStep,trkWxPreset,trkWxPlan,trkWxGrip,trkProg,TRK_TIRES,trkReset};`,ctx);
const {TRK,H}=ctx;if(process.env.TRACK)vm.runInContext('TRKDEF=TRK_DEFS['+process.env.TRACK+']',ctx);H.trkEnsureData();const T=TRK.T,N=T.N;
const mkV=()=>({m:1480,kw:460,mu:H.TRK_TIRES[1].mu,wf:0.51,h:0.45,lwb:2.7,track:1.62,len:4.6,wid:1.95,name:'T',aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:q*0.1,Fr:q*0.25};}});
TRK.weather=0;TRK.wet=0;TRK.duo=false;TRK.wearMode=0;vm.runInContext('trkSurface=()=>"asfalto"',ctx);
const P=TRK.p[0];P.isAI=false;P.veh=mkV();P.tire=1;P.vo={};
function place(v){const c=P.car,i=200;Object.assign(c,{X:T.X[i],Y:T.Y[i],psi:Math.atan2(T.ty[i],T.tx[i]),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i,d:0});P.zc=T.h[i];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.wk=0;P.steerIn=0;P.errT=0;P.vo={};ctx.trkWheelSync(P);}
const h=1/240;
for(const assist of [true,false]){TRK.assist=assist;place(0);P.thr=1;P.brk=0;let t=0,t100=0,t200=0,gears=[],spinT=0,lastG=0;
  while(t<20&&P.car.vx<250/3.6){ctx.trkPhysics(P,h);P.car.i=H.trkLocate(P.car.X,P.car.Y,P.car.i,6);t+=h;if(P.spin)spinT+=h;if(P.gear!==lastG){gears.push(P.gear+'@'+(P.car.vx*3.6).toFixed(0));lastG=P.gear;}
    if(!t100&&P.car.vx>=100/3.6)t100=t;if(!t200&&P.car.vx>=200/3.6)t200=t;}
  console.log('assist',assist,'0-100',t100.toFixed(2),'0-200',t200.toFixed(2),'0-250',t.toFixed(2),'pattina',spinT.toFixed(2),'s marce',gears.join(' '),'rpm',P.rpm|0);
  place(200/3.6);P.thr=0;P.brk=1;let d=0,lockT=0;t=0;while(P.car.vx>0.5&&t<10){ctx.trkPhysics(P,h);P.car.i=H.trkLocate(P.car.X,P.car.Y,P.car.i,6);d+=P.car.vx*h;t+=h;if(P.lock)lockT+=h;}
  console.log('   frenata 200-0',d.toFixed(1),'m',t.toFixed(2),'s bloccata',lockT.toFixed(2),'s gear',P.gear);
}
TRK.assist=true;place(0);P.thr=0;P.brk=1;for(let k=0;k<240*3;k++)ctx.trkPhysics(P,h);console.log('retro vx',P.car.vx.toFixed(2),'gear',P.gear);
P.brk=0;P.thr=1;for(let k=0;k<240*2;k++)ctx.trkPhysics(P,h);console.log('poi gas vx',P.car.vx.toFixed(2),'gear',P.gear,'rpm',P.rpm|0);
P.thr=0;for(let k=0;k<240*4;k++)ctx.trkPhysics(P,h);console.log('rilascio vx',P.car.vx.toFixed(2),'gear',P.gear,'rpm',P.rpm|0);
place(120/3.6);P.thr=0.6;P.steerIn=0.6;let mx=0;for(let k=0;k<240*4;k++){ctx.trkPhysics(P,h);mx=Math.max(mx,Math.abs(P.car.r));}console.log('sterzata 120 r',P.car.r.toFixed(3),'vy',P.car.vy.toFixed(2),'vx',(P.car.vx*3.6).toFixed(0));
TRK.assist=false;place(120/3.6);P.thr=1;P.steerIn=0.5;for(let k=0;k<240*3;k++){ctx.trkPhysics(P,h);}console.log('senza aiuti gas in curva r',P.car.r.toFixed(3),'vy',P.car.vy.toFixed(2),'vx',(P.car.vx*3.6).toFixed(0),'psi',P.car.psi.toFixed(2));
