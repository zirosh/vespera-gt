/* stabilità ad alta velocità con le ali vere (aero-presets.json): in campo aperto, sterzata a gradino a 280 km/h
   e staccata in curva (frenata con lo sterzo girato, la classica causa del testacoda). Deriva massima in gradi.
   uso: node tools/stab-t.js   — AERO=file.json per altre tabelle */
const {ctx,vm,TRK,H,tables,mkV,ready}=require('./harness.js');
ready.then(()=>{
vm.runInContext('trkSurface=()=>"asfalto";TRKDEF=TRK_DEFS[0];',ctx);H.trkEnsureData();const T=TRK.T;
const P=TRK.p[0],h=1/240;TRK.weather=0;TRK.wet=0;TRK.duo=false;TRK.wearMode=0;
function place(V,v){const c=P.car,i=200;P.veh=V;P.isAI=false;P.tire=1;P.vo={};Object.assign(c,{X:T.X[i],Y:T.Y[i],psi:Math.atan2(T.ty[i],T.tx[i]),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i,d:0});
  P.zc=T.h[i];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.wk=0;P.steerIn=0;P.errT=0;delete P.w;delete P.shiftT;H.trkWheelSync(P);}
function run(sec,f){let b=0,t=0;const c=P.car;while(t<sec){f(t);ctx.trkPhysics(P,h);t+=h;if(c.vx>8)b=Math.max(b,Math.abs(Math.atan2(c.vy,c.vx)));}return b*57.3;}
const rows=[];
for(const assist of [true,false]){TRK.assist=assist;
  for(const name in tables){const V=mkV(tables[name]);const r={aiuti:assist?'sì':'no',assetto:name};
    for(const st of [0.5,1]){place(V,280/3.6);r['sterzo '+st]=run(2.5,()=>{P.thr=0.7;P.brk=0;P.steerIn=st;}).toFixed(1);}
    place(V,280/3.6);r['staccata in curva']=run(3,t=>{P.steerIn=t<0.8?0.6:0.6;P.thr=t<0.8?0.7:0;P.brk=t<0.8?0:1;}).toFixed(1);
    place(V,230/3.6);r['sterza e rilascia']=run(3,t=>{P.steerIn=t<1?0.8:t<1.4?-0.8:0;P.thr=t<1?0.8:0;P.brk=0;}).toFixed(1);
    rows.push(r);}}
console.table(rows);
console.log('scocca',ctx.RAPIER&&process.env.RB!=='0'?'Rapier':'piana');
});
