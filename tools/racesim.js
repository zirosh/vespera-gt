const fs=require('fs'),vm=require('vm');
const el=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='classList'?{toggle(){},add(){},remove(){}}:k==='querySelectorAll'?()=>[]:k==='style'?{}:typeof k==='string'&&/^(set|add|remove|get|focus|blur|appendChild|insertBefore)/.test(k)?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const ctx={console,Math,Date,JSON,Float64Array,Float32Array,Uint8Array,Map,Set,Array,Object,Number,String,performance:{now:()=>Date.now()},
  document:{getElementById:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),documentElement:el(),createElement:()=>el()},
  window:{addEventListener(){},matchMedia:()=>({matches:false})},navigator:{},localStorage:{getItem:()=>null,setItem(){}},
  getComputedStyle:()=>({getPropertyValue:()=>''})};
vm.createContext(ctx);
const core=fs.readFileSync(require('path').join(__dirname,'../src/track/track-core.js'),'utf8').replace(/if\(typeof module[^\n]*\n/,'');
const A=fs.readFileSync(require('path').join(__dirname,'../src/track/track-a.js'),'utf8'),Adata=A.slice(0,A.indexOf('/* ========================================================='+'\n   Mondo 3D'));
const B13=fs.readFileSync(require('path').join(__dirname,'../src/track/track-b13.js'),'utf8');
const B2=fs.readFileSync(require('path').join(__dirname,'../src/track/track-b2.js'),'utf8'),B1=fs.readFileSync(require('path').join(__dirname,'../src/track/track-b1.js'),'utf8');const CH=B1.slice(B1.indexOf("const TRK_CHARS="),B1.indexOf("\n",B1.indexOf("const TRK_CHAR_PLAIN="))+1);
const pre=`const THREE={Vector3:class{set(){return this;}copy(){return this;}},Vector4:class{set(){return this;}}};const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);const smooth01=(x,a,b)=>{const t=Math.min(Math.max((x-a)/(b-a),0),1);return t*t*(3-2*t);};const dec=(n,d)=>n.toFixed(d);const fmt=n=>Math.round(n)+'';
const state={};const engine={on:false};function trkPanel(){}function trkCheer(){}function trkThump(){}function trkPitUI(){}function resetDynamics(){}function trkSavePrefs(){}function trkAtmo(){}
`;
vm.runInContext(pre+CH+core+Adata.replace("const fmtLap=","var fmtLap=")+B2+B13+`;globalThis.TRK=TRK;globalThis.TRK_CHARS=TRK_CHARS;globalThis.TRK_CHAR_PLAIN=TRK_CHAR_PLAIN;globalThis.H={trkDmgSev,TRK_DMG,trkEnsureData,lapSim,trkPhysics,trkVertical,trkLocate,trkSurface,trkCollide,trkCarsCollide,trkWake,trkAIDrive,trkPitStep,trkPitCheck,trkLap,trkRaceUpdate,trkRaceSetup,trkWxStep,trkWxPreset,trkWxPlan,trkWxGrip,trkProg,TRK_TIRES,trkReset};`,ctx);
const {TRK,H}=ctx;if(process.env.TRACK)vm.runInContext('TRKDEF=TRK_DEFS['+process.env.TRACK+']',ctx);H.trkEnsureData();const T=TRK.T,N=T.N;
const mk=(cda,clf,clr,m,kw,mu)=>({m,kw,mu,wf:0.51,h:0.45,lwb:2.7,track:1.62,len:4.6,wid:1.95,name:'AI',aero:v=>{const q=0.6125*v*v;return {D:q*cda,Ff:-q*clf,Fr:-q*clr};}});
const nCars=+(process.argv[2]||8),weather=+(process.argv[3]||3),laps=+(process.argv[4]||3),pace=+(process.argv[5]||0.965);
TRK.weather=weather;TRK.duo=true;TRK.ai=true;TRK.players='ai';TRK.race.laps=laps;TRK.collide=true;TRK.tire=1;TRK.mode='drive';TRK.wearMode=1;
H.trkWxPreset();
TRK.cars=TRK.p.slice(0,nCars);
TRK.cars.forEach((P,k)=>{P.isAI=true;P.el=null;P.tire=TRK.wet>0.45?3:1;P.veh=mk(0.72,-0.1,-0.25,1480,460,H.TRK_TIRES[P.tire].mu);P.simG=H.trkWxGrip(P.tire,TRK.wet);P.sim=H.lapSim(P.veh,TRK.RL,P.simG);P.pace=pace-0.009*k;P.ch=process.env.PLAIN?ctx.TRK_CHAR_PLAIN:ctx.TRK_CHARS[k%6];P.errCool=10;P.label='#'+(k+1);P.num=String(k+1);});
H.trkRaceSetup();H.trkWxPlan();
if(process.env.DMG==='0')H.TRK_DMG.on=false;
const dmgMax=new Map();
const dt=1/60,sub=4,h=dt/sub;let t=0,log=[],lastLog=-10,pits=[],collis=0,resets0=0,nan=false;
const R=TRK.race;
while(t<laps*170&&R.state!=='done'){t+=dt;TRK.clock+=dt;
  H.trkRaceUpdate(dt);H.trkWxStep(dt);
  const cars=TRK.cars,prev=cars.map(P=>P.car.i),hold=R.state==='count';
  for(const P of cars){if(P.pit)continue;H.trkAIDrive(P,dt);if(hold){P.thr=0;P.brk=0;}}
  for(const P of cars)H.trkWake(P,dt);
  for(const P of cars)if(P.pit){const was=P.pit.ph;H.trkPitStep(P,dt);}
  for(let k=0;k<sub;k++){for(const P of cars){if(P.pit)continue;const c=P.car;if(hold){c.vx=c.vy=c.r=0;continue;}
      H.trkPhysics(P,h);c.i=H.trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=H.trkSurface(c.i,c.d);H.trkCollide(P);H.trkVertical(P,h);}
    for(let a=0;a<cars.length;a++)for(let b=a+1;b<cars.length;b++)H.trkCarsCollide(cars[a],cars[b]);}
  cars.forEach((P,k)=>{const c=P.car;if(!P.pit){c.i=H.trkLocate(c.X,c.Y,c.i,8);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=H.trkSurface(c.i,c.d);}
    const hadPit=!!P.pit;H.trkLap(P,prev[k],c.i);H.trkPitCheck(P,prev[k],c.i);if(!hadPit&&P.pit)pits.push(`t=${t.toFixed(0)} ${P.label} box→${H.TRK_TIRES[P.pit.tire].n} (wet ${TRK.wet.toFixed(2)}, gomme ${H.TRK_TIRES[P.tire].n})`);
    P.collT-=dt;if(!isFinite(c.X+c.Y+c.vx))nan=true;dmgMax.set(P,Math.max(dmgMax.get(P)||0,H.trkDmgSev(P.dmg)));});
  if(t-lastLog>=30){lastLog=t;log.push(`t=${t.toFixed(0)} rain ${TRK.rain.toFixed(2)} wet ${TRK.wet.toFixed(2)} dry ${TRK.dryLine.toFixed(2)} | `+cars.slice().sort((a,b)=>H.trkProg(b)-H.trkProg(a)).map(P=>`${P.label}:${P.lapsDone}/${(P.car.vx*3.6).toFixed(0)}${P.pit?'P':''}`).join(' '));}
}
console.log(log.join('\n'));console.log(pits.join('\n'));
console.log('stato',R.state,'t',t.toFixed(1),'nan',nan);
TRK.cars.slice().sort((a,b)=>(a.finished??1e9)-(b.finished??1e9)).forEach(P=>console.log(P.label,P.ch.n,'errori',P.errs,'arrivo',P.finished?.toFixed(2),'giri',P.lapsDone,'best',P.lap.best?.toFixed(2),'soste',P.stops,'reset',P.resets||0,'gomme',H.TRK_TIRES[P.tire].n,'usura',(Math.max(P.Wf,P.Wr)*100).toFixed(0)+'%','danni max',((dmgMax.get(P)||0)*100).toFixed(0)+'%','fine',(H.trkDmgSev(P.dmg)*100).toFixed(0)+'%'));
