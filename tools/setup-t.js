/* prova dell'assetto del Garage (track-b19) sulla scocca Rapier: stessa sterzata a 120 km/h e stessa sterzata a 200 km/h
   con assetti diversi; stampa accelerazione laterale, velocità di imbardata, rollio e carichi delle ruote.
   Barra davanti più dura → meno imbardata (sottosterzo), barra dietro → più imbardata. uso: node tools/setup-t.js */
process.env.EXTRA=[process.env.EXTRA,'track-b19.js'].filter(Boolean).join(',');
const {ctx,vm,TRK,H,ready}=require('./harness.js');
ready.then(()=>{
vm.runInContext('globalThis.RBX=RB;globalThis.Q={trkRbUse,trkRbPlace,trkRbDrop};globalThis.SU=SUSP;globalThis.SUD=SUSP_DEF',ctx);
vm.runInContext('TRKDEF=TRK_DEFS[0];',ctx);H.trkEnsureData();const T=TRK.T;
TRK.weather=0;TRK.wet=0;TRK.duo=false;TRK.wearMode=0;TRK.assist=process.env.ASSIST!=='0'?true:false;
const P=TRK.p[0];P.isAI=false;P.el=null;P.tire=1;P.collT=0;P.lap={valid:true};
P.veh={m:1480,kw:460,mu:1.15,wf:0.51,h:0.45,lwb:2.7,track:1.62,len:4.6,wid:1.95,name:'T',aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:-q*0.5,Fr:-q*0.6};}};
const h=1/240;
function place(i,v){const c=P.car;if(P.rb)ctx.Q.trkRbDrop(P);Object.assign(c,{X:T.X[i],Y:T.Y[i],psi:Math.atan2(T.ty[i],T.tx[i]),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i,d:0});
  P.zc=T.h[i];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.wk=0;P.steerIn=0;P.errT=0;P.vo={};P.thr=0;P.brk=0;delete P.w;delete P.shiftT;H.trkWheelSync(P);
  if(ctx.Q.trkRbUse(P))ctx.Q.trkRbPlace(P);}
function step(fn,sec){let t=0;const c=P.car;while(t<sec){fn(t);H.trkPhysics(P,h);c.i=H.trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=H.trkSurface(c.i,c.d);H.trkVertical(P,h);t+=h;}}
function run(kmh,st){place(200,kmh/3.6);let ay=0,r=0,n=0,fz=null,xs=0;
  step(t=>{P.thr=0.5;P.steerIn=st;if(t>0.8){ay+=Math.abs(P.car.ay);r+=Math.abs(P.car.r);n++;fz=P.rb.fz.map(x=>x/9.81);xs+=P.rb.x.reduce((a,b)=>a+b,0)/4;}},1.3);
  return {ay:ay/n/9.81,r:r/n*57.3,fz,x:xs/n};}
const cases=[['di serie',{}],['barra ant. 6',{af:6}],['barra post. 4',{ar:4}],['molle morbide',{kf:40,kr:46}],['molle dure',{kf:84,kr:96}]];
for(const [name,o] of cases){Object.assign(ctx.SU,ctx.SUD,o);
  const a=run(120,+(process.env.S1||0.3)),b=run(200,+(process.env.S2||0.18));const f=x=>x.fz.map(v=>v.toFixed(0)).join('/');
  console.log(name.padEnd(14),`120: ay ${a.ay.toFixed(2)} g imbardata ${a.r.toFixed(1)} °/s carichi ${f(a)}`,` | 200: ay ${b.ay.toFixed(2)} g imbardata ${b.r.toFixed(1)} °/s molla media ${(b.x*1000).toFixed(0)} mm`);
  if(![a.ay,a.r,b.ay,b.r].every(isFinite))console.log('  NaN!');}
});
