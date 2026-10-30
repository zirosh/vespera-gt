/* prova della scocca Rapier: carichi da fermo, 0-100 e 0-200, frenata 200-0 con beccheggio, curva a 120 km/h con rollio e
   trasferimento di carico, passaggio sui cordoli, salto su un dosso; con RB=0 gli stessi numeri con la fisica piana
   uso: node tools/rb-t.js */
const {ctx,vm,TRK,H,ready}=require('./harness.js');
ready.then(()=>{
vm.runInContext('globalThis.RBX=RB;globalThis.Q={trkRbUse,trkRbPlace};globalThis.trkRbGround=trkRbGround',ctx);const RB=ctx.RBX;
vm.runInContext('TRKDEF=TRK_DEFS[0];',ctx);H.trkEnsureData();const T=TRK.T,N=T.N;
TRK.weather=0;TRK.wet=0;TRK.duo=false;TRK.wearMode=0;TRK.assist=true;
const P=TRK.p[0];P.isAI=false;P.el=null;P.tire=1;P.collT=0;P.lap={valid:true};
P.veh={m:1480,kw:460,mu:1.15,wf:0.51,h:0.45,lwb:2.7,track:1.62,len:4.6,wid:1.95,name:'T',aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:q*0.12,Fr:q*0.25};}};
const h=1/240,deg=x=>(x*57.3).toFixed(2);
function place(i,v,d){const c=P.car;Object.assign(c,{X:T.X[i]+T.nx[i]*(d||0),Y:T.Y[i]+T.ny[i]*(d||0),psi:Math.atan2(T.ty[i],T.tx[i]),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i,d:d||0});
  P.zc=T.h[i];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.wk=0;P.steerIn=0;P.errT=0;P.vo={};P.thr=0;P.brk=0;delete P.w;delete P.shiftT;H.trkWheelSync(P);
  if(ctx.Q.trkRbUse(P))ctx.Q.trkRbPlace(P);}
function step(fn,sec){let t=0;const c=P.car;while(t<sec){fn&&fn(t);H.trkPhysics(P,h);c.i=H.trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=H.trkSurface(c.i,c.d);H.trkCollide(P);H.trkVertical(P,h);t+=h;}}
const ang=()=>{if(!P.rb)return {roll:0,pitch:0};const q=P.rb.body.rotation(),o=[0,0,0];vm.runInContext('',ctx);
  const rot=(x,y,z)=>{const ix=q.w*x+q.y*z-q.z*y,iy=q.w*y+q.z*x-q.x*z,iz=q.w*z+q.x*y-q.y*x,iw=-q.x*x-q.y*y-q.z*z;return [ix*q.w+iw*-q.x+iy*-q.z-iz*-q.y,iy*q.w+iw*-q.y+iz*-q.x-ix*-q.z,iz*q.w+iw*-q.z+ix*-q.y-iy*-q.x];};
  const f=rot(1,0,0),l=rot(0,0,-1);return {pitch:Math.asin(f[1]),roll:Math.asin(l[1])};};
const fz=()=>P.rb?P.rb.fz.map(x=>(x/9.81).toFixed(0)).join('/'):'—';
console.log('scocca',RB.R&&RB.on?'Rapier':'piana');
place(200,0);step(null,1.5);console.log('da fermo: carichi ruote kg',fz(),'beccheggio',deg(ang().pitch),'°');
place(200,0);let t=0,t100=0,t200=0;step(tt=>{P.thr=1;t=tt;if(!t100&&P.car.vx>=100/3.6)t100=tt;if(!t200&&P.car.vx>=200/3.6)t200=tt;},14);
console.log('0-100',t100.toFixed(2),'s  0-200',t200.toFixed(2),'s');
place(200,200/3.6);let dist=0,pmax=0,fmax='';step(tt=>{P.thr=0;P.brk=P.car.vx>0.5?1:0;dist+=Math.max(0,P.car.vx)*h;const a=ang();if(-a.pitch>pmax){pmax=-a.pitch;fmax=fz();}},6);
console.log('frenata 200-0',dist.toFixed(1),'m  beccheggio max',deg(pmax),'° carichi',fmax);
place(200,120/3.6);let rS=0,aS=0,nS=0,fr='';step(tt=>{P.thr=0.45;P.steerIn=0.3;if(tt>0.7&&tt<1.1){const a=ang();rS+=Math.abs(a.roll);aS+=Math.abs(P.car.ay);nS++;fr=fz();}},1.1);
console.log('curva 120 km/h (0,7–1,1 s): ay',(aS/nS/9.81).toFixed(2),'g  rollio medio',deg(rS/nS),'° carichi',fr);
let ki=-1;for(let i=0;i<N;i++)if(TRK.kerb[i]&1){ki=i;break;}
if(ki>=0){place((ki-30+N)%N,90/3.6,T.w/2+0.4);let dmin=9,dmax=-9;step(tt=>{P.thr=0.3;P.steerIn=0;if(P.rb&&tt>0.3){const c=P.car,y=P.rb.body.translation().y-ctx.trkRbGround(c.X,c.Y,c.i);dmin=Math.min(dmin,y);dmax=Math.max(dmax,y);}},1.2);
  console.log('sul cordolo: escursione della scocca sopra il suolo',((dmax-dmin)*100).toFixed(1),'cm');}
let km=0,kv=0;for(let i=0;i<N;i++)if(T.kv[i]<kv){kv=T.kv[i];km=i;}
place((km-60+N)%N,230/3.6);let air=0;step(tt=>{P.thr=1;if(P.air)air+=h;},2.5);console.log('dosso più marcato a 230 km/h: in aria',air.toFixed(2),'s');
});
