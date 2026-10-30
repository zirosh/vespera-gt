/* prova dei danni: urto contro il guard rail a varie velocità e angoli, poi su un rettilineo con lo sterzo dritto
   si misura da che parte tira l'auto; perdita di carico; sosta ai box con riparazione (durata e stato dopo).
   uso: node tools/dmg-t.js */
const {ctx,vm,TRK,H,tables,mkV}=require('./harness.js');
vm.runInContext('globalThis.D={trkDmgSev,trkDmgHit,trkDmgFixTime,trkPitStart,trkPitStep,trkPitTime,TRK_DMG};',ctx);const D=ctx.D;
vm.runInContext('TRKDEF=TRK_DEFS[0];',ctx);H.trkEnsureData();const T=TRK.T,N=T.N;
TRK.weather=0;TRK.wet=0;TRK.duo=false;TRK.wearMode=0;TRK.assist=true;TRK.race.state='off';
const P=TRK.p[0],h=1/240;P.isAI=false;P.el=null;P.tire=1;P.veh=mkV(tables['GT da pista']);P.simG=1;P.sim=H.lapSim(P.veh,TRK.RL,1);P.collT=0;P.lap={valid:true};
function place(i,v,yaw,off){const c=P.car;Object.assign(c,{X:T.X[i]+T.nx[i]*(off||0),Y:T.Y[i]+T.ny[i]*(off||0),psi:Math.atan2(T.ty[i],T.tx[i])+(yaw||0),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i,d:off||0});
  P.zc=T.h[i];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.wk=0;P.steerIn=0;P.errT=0;P.vo={};delete P.w;delete P.shiftT;H.trkWheelSync(P);}
function drive(sec,fn){const c=P.car;let t=0;while(t<sec){fn&&fn(t);H.trkPhysics(P,h);c.i=H.trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf='asfalto';H.trkCollide(P);H.trkVertical(P,h);t+=h;}}
const rows=[];
for(const [kmh,deg] of [[80,10],[150,15],[200,25],[250,35],[200,-25]]){
  P.dmg=null;vm.runInContext('trkDmgApply(TRK.p[0])',ctx);place(200,kmh/3.6,deg*Math.PI/180,0);
  drive(2.5,()=>{P.thr=0.3;P.brk=0;P.steerIn=0;});const Dm=P.dmg||{fw:0,rw:0,s:[0,0,0,0],toe:0,toeR:0};
  /* tiro: su un rettilineo lungo, 150 km/h, sterzo dritto per 2 s: spostamento laterale (+ = verso sinistra) */
  const sav=JSON.stringify(Dm);place(150,150/3.6,0,0);P.dmg=JSON.parse(sav);vm.runInContext('trkDmgApply(TRK.p[0])',ctx);
  const y0=P.car.d;drive(2,()=>{P.thr=0.5;P.steerIn=0;});
  const A0=tables['GT da pista'],v=200/3.6,a=P.veh.aero(v);
  rows.push({urto:`${kmh} km/h ${deg}°`,lato:deg>0?'sinistro':'destro',alaAnt:(Dm.fw*100).toFixed(0)+'%',alaPost:(Dm.rw*100).toFixed(0)+'%',sosp:Dm.s.map(x=>(x*100).toFixed(0)).join('/'),
    convergenza:(Dm.toe*57.3).toFixed(2)+'°',tiro:(P.car.d-y0).toFixed(2)+' m',carico200:((a.Ff+a.Fr)/9.81).toFixed(0)+' kg',box:'+'+D.trkDmgFixTime(P).toFixed(1)+' s'});
}
console.table(rows);
P.dmg=null;place(200,0,0,0);console.log('carico a 200 senza danni',((P.veh.aero(200/3.6).Ff+P.veh.aero(200/3.6).Fr)/9.81).toFixed(0),'kg');
/* sosta con riparazione: danno grosso, poi tutta la corsia dei box */
P.dmg={fw:0.8,rw:0.3,fwS:0.5,s:[0.7,0.1,0.2,0],toe:0,toeR:0};vm.runInContext('trkDmgApply(TRK.p[0])',ctx);
P.isAI=true;P.num='1';const qi=TRK.pit.qIn;place((qi+2)%N,20,0,T.w/2+2);P.pitTire=-1;P.stops=0;D.trkPitStart(P);let t=0,stopT=0;
while(P.pit&&t<120){const ph=P.pit.ph;D.trkPitStep(P,1/60);if(ph==='stop')stopT+=1/60;t+=1/60;}
console.log('sosta ferma',stopT.toFixed(1),'s · danni dopo',(D.trkDmgSev(P.dmg)*100).toFixed(0)+'% · convergenza',P.toe,'· box finito',!P.pit);
