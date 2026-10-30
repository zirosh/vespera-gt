/* =========================================================
   Scocca rigida in 3D con Rapier (motore fisico, rapier.rs): ogni auto è un corpo rigido con massa e inerzie vere, appoggiato
   su quattro sospensioni (molla, ammortizzatore, tampone di fine corsa, barra antirollio davanti). Il carico di ogni ruota è la
   forza della sua molla: beccheggio, rollio, trasferimenti di carico, dossi, cordoli e salti nascono dalla dinamica invece che
   da formule. Le gomme restano quelle di trkPhysics: le loro forze, l'aerodinamica e il controllo di stabilità sono applicati
   alla scocca nei punti giusti. Guard rail e altre auto sono corpi Rapier: gli urti li risolve il motore e le spinte
   d'urto (la parte di variazione di velocità che le forze applicate non spiegano) diventano danni.
   Se Rapier non si carica, o lo spegni nelle impostazioni, resta la fisica piana di prima
   ========================================================= */
const RB={R:null,on:true,busy:false,fail:false,world:null,key:'',cars:[],pend:new Set(),n:[0,1,0]};
try{const s=localStorage.getItem('vespera-rb');if(s!=null)RB.on=s==='1';}catch(e){}
/* nel browser dal modulo copiato in lib/; nelle prove senza grafica da globalThis.RAPIER */
function trkRbLoad(){
  if(RB.R||RB.busy)return;RB.busy=true;
  const go=R=>R.init().then(()=>{RB.R=R;}).catch(()=>{RB.fail=true;});
  if(typeof RAPIER!=='undefined')go(RAPIER);
  else import('./lib/rapier.es.js').then(m=>go(m.init?m:m.default)).catch(()=>{RB.fail=true;});
}
trkRbLoad();
/* rotazione di un vettore con un quaternione {x,y,z,w} */
function trkRbRot(q,x,y,z,o){const ix=q.w*x+q.y*z-q.z*y,iy=q.w*y+q.z*x-q.x*z,iz=q.w*z+q.x*y-q.y*x,iw=-q.x*x-q.y*y-q.z*z;
  o[0]=ix*q.w+iw*-q.x+iy*-q.z-iz*-q.y;o[1]=iy*q.w+iw*-q.y+iz*-q.x-ix*-q.z;o[2]=iz*q.w+iw*-q.z+ix*-q.y-iy*-q.x;return o;}
const _rv=[0,0,0],_rw=[0,0,0];
/* quota del suolo nel punto (X, Y) vicino al punto i del tracciato: la strada col suo pendio; sui cordoli una dentellatura di 2,5 cm */
function trkRbGround(X,Y,i){
  const T=TRK.T,al=(X-T.X[i])*T.tx[i]+(Y-T.Y[i])*T.ty[i];let h=T.h[i]+T.sl[i]*al;
  if(TRK.kerb){const d=(X-T.X[i])*T.nx[i]+(Y-T.Y[i])*T.ny[i],ad=Math.abs(d),hw=T.w/2;
    if((TRK.kerb[i]&(d>0?1:2))&&ad>hw-0.05&&ad<hw+1.3)h+=0.025*(0.5+0.5*Math.sin((i*T.ds+al)*4.83));}
  return h;
}
/* normale della strada nel punto i (in salita la molla spinge perpendicolare all'asfalto, così la gravità tira l'auto giù per la discesa) */
function trkRbNormal(i){const T=TRK.T,x=-T.sl[i]*T.tx[i],z=T.sl[i]*T.ty[i],l=Math.hypot(x,1,z);RB.n[0]=x/l;RB.n[1]=1/l;RB.n[2]=z/l;return RB.n;}
const trkRbYaw=psi=>({x:0,y:Math.sin(psi/2),z:0,w:Math.cos(psi/2)});

/* ---------- mondo: guard rail a segmenti lungo la pista (il suolo è quello analitico di trkRbGround) ---------- */
function trkRbWorld(){
  const R=RB.R,T=TRK.T,N=T.N,W=new R.World({x:0,y:-9.81,z:0}),st=4,Pd=TRK.pit;
  for(let s=0;s<2;s++){const sg=s===0?1:-1;
    for(let i=0;i<N;i+=st){const j=(i+st)%N,d0=TRK.bar[s][i],d1=TRK.bar[s][j];if(Math.max(d0,d1)>70)continue;
      /* sul lato dei box: varchi per l'entrata e l'uscita della corsia, resta solo il muretto davanti alle piazzole */
      if(s===0&&Pd){const q=i<Pd.qIn-N/2?i+N:i;if((q>=Pd.qIn&&q<Pd.qA)||(q>Pd.qB&&q<=Pd.qOut))continue;}
      const x0=T.X[i]+T.nx[i]*sg*(d0+0.25),y0=T.Y[i]+T.ny[i]*sg*(d0+0.25),x1=T.X[j]+T.nx[j]*sg*(d1+0.25),y1=T.Y[j]+T.ny[j]*sg*(d1+0.25);
      const L=Math.hypot(x1-x0,y1-y0),ang=Math.atan2(y1-y0,x1-x0);
      W.createCollider(R.ColliderDesc.cuboid(L/2+0.2,0.7,0.25).setTranslation((x0+x1)/2,(T.h[i]+T.h[j])/2+0.5,-(y0+y1)/2).setRotation(trkRbYaw(ang)).setFriction(0.35).setRestitution(0.15));}}
  return W;
}
/* ---------- auto: corpo rigido, sospensioni tarate sull'assetto della Vespera (56 e 66 kN/m per ruota) ---------- */
function trkRbCar(P){
  const R=RB.R,V=P.veh,m=V.m,c=P.car,h=V.h,a=V.lwb*(1-V.wf),b=V.lwb*V.wf,tw=V.track/2,ks=m/1480,i=c.i;
  const gH=trkRbGround(c.X,c.Y,i),Iy=m*a*b*1.05;
  const body=RB.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(c.X,gH+h,-c.Y).setRotation(trkRbYaw(c.psi)).setCanSleep(false).setAngularDamping(0.25));
  body.setLinvel({x:c.vx*Math.cos(c.psi)-c.vy*Math.sin(c.psi),y:0,z:-(c.vx*Math.sin(c.psi)+c.vy*Math.cos(c.psi))},true);body.setAngvel({x:0,y:c.r||0,z:0},true);
  const col=RB.world.createCollider(R.ColliderDesc.cuboid(V.len/2*0.96,0.36,V.wid/2*0.94).setTranslation(-0.05,-h+0.13+0.36,0).setFriction(0.3).setRestitution(0.2)
    .setMassProperties(m,{x:0,y:0,z:0},{x:m*0.32,y:Iy,z:Iy*0.92},{x:0,y:0,z:0,w:1}),body);
  const kF=56000*ks,kR=66000*ks,fF=m*9.81*V.wf/2,fR=m*9.81*(1-V.wf)/2,xs=[fF/kF,fF/kF,fR/kR,fR/kR];
  const B={body,col,ghost:false,V,h,a,b,tw,k:[kF,kF,kR,kR],c:[4300*Math.sqrt(ks),4300*Math.sqrt(ks),4600*Math.sqrt(ks),4600*Math.sqrt(ks)],arb:[12000*ks,0],xs,
    L0:xs.map(x=>h+x),fz:[fF,fF,fR,fR],x:[0,0,0,0],gh:[null,null,null,null],pc:[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],lw:[a,a,-b,-b],lz:[-tw,tw,-tw,tw],
    F:[0,0,0],v0:[0,0,0],hit:[0,0,0],hitT:0,air:false,wasAir:false,landV:0};
  P.rb=B;RB.cars.push(P);
}
function trkRbDrop(P){if(!P.rb)return;if(RB.world)RB.world.removeRigidBody(P.rb.body);RB.cars=RB.cars.filter(Q=>Q!==P);RB.pend.delete(P);P.rb=null;}
function trkRbClear(){for(const P of RB.cars)P.rb=null;RB.cars=[];RB.pend.clear();if(RB.world){RB.world.free();RB.world=null;}RB.key='';}
/* la scocca è in uso per questa auto? crea mondo e corpo quando servono */
function trkRbUse(P){
  if(!RB.on||!RB.R||RB.fail||!TRK.T||!P.veh)return false;
  const key=(TRKDEF.id||'')+'|'+TRK.T.N;if(RB.key!==key){trkRbClear();RB.world=trkRbWorld();RB.key=key;}
  if(P.rb&&P.rb.V!==P.veh){const c=P.car;trkRbDrop(P);}
  if(!P.rb)trkRbCar(P);
  return true;
}
/* auto ferma ai box, al via o rimessa in pista: la scocca la segue senza fisica */
function trkRbPlace(P){
  const B=P.rb,c=P.car,gH=trkRbGround(c.X,c.Y,c.i),cp=Math.cos(c.psi),sp=Math.sin(c.psi);
  B.body.setTranslation({x:c.X,y:gH+B.h,z:-c.Y},true);B.body.setRotation(trkRbYaw(c.psi),true);
  B.body.setLinvel({x:c.vx*cp,y:0,z:-c.vx*sp},true);B.body.setAngvel({x:0,y:0,z:0},true);B.body.resetForces(true);B.body.resetTorques(true);
  B.gh.fill(null);B.hit.fill(0);B.hitT=0;
}

/* ---------- sospensioni: forza di ogni molla nel punto di attacco, lungo la normale della strada ---------- */
function trkRbSusp(P,h){
  const B=P.rb,body=B.body,c=P.car,t=body.translation(),q=body.rotation(),lv=body.linvel(),av=body.angvel(),n=trkRbNormal(c.i);
  body.resetForces(true);body.resetTorques(true);B.F[0]=B.F[1]=B.F[2]=0;
  const D=P.dmg&&TRK_DMG.on?P.dmg:null;let air=true;
  for(let k=0;k<4;k++){trkRbRot(q,B.lw[k],0,B.lz[k],_rv);const px=t.x+_rv[0],py=t.y+_rv[1],pz=t.z+_rv[2],gH=trkRbGround(px,-pz,c.i);
    const vy=lv.y+av.z*_rv[0]-av.x*_rv[2],gd=B.gh[k]==null?0:(gH-B.gh[k])/h;B.gh[k]=gH;
    /* una sospensione piegata dall'urto è più corta: quell'angolo dell'auto si abbassa davvero */
    const L0=B.L0[k]-(D?D.s[k]*0.035:0);
    B.x[k]=L0-(py-gH);B.xd=B.xd||[0,0,0,0];B.xd[k]=-(vy-gd);B.pc[k][0]=px;B.pc[k][1]=gH;B.pc[k][2]=pz;}
  for(let k=0;k<4;k++){const x=B.x[k];let F=0;
    if(x>0){F=B.k[k]*x+B.c[k]*B.xd[k];const e=x-B.xs[k]-0.07;if(e>0)F+=12*B.k[k]*e;
      const o=k^1,ar=B.arb[k<2?0:1];if(ar&&B.x[o]>0)F+=ar*(x-B.x[o]);}
    F=Math.max(0,F);B.fz[k]=F;if(F>0)air=false;
    const fx=n[0]*F,fy=n[1]*F,fz=n[2]*F;body.addForceAtPoint({x:fx,y:fy,z:fz},{x:B.pc[k][0],y:B.pc[k][1]+(t.y-B.pc[k][1])*0.6,z:B.pc[k][2]},true);
    B.F[0]+=fx;B.F[1]+=fy;B.F[2]+=fz;}
  P.air=air;
}
/* forze delle gomme (nel piano della strada, nel punto di contatto), resistenze, carico aerodinamico sugli assi, coppia dell'ESC.
   Chiamata da trkPhysics al posto dell'integrazione piana */
function trkRbForces(P,A,Fres,Mesp){
  const B=P.rb,body=B.body,c=P.car,n=RB.n,t=body.translation(),q=body.rotation(),cp=Math.cos(c.psi),sp=Math.sin(c.psi);
  let fx=cp,fz=-sp,dn=fx*n[0]+fz*n[2];const f=[fx-n[0]*dn,-n[1]*dn,fz-n[2]*dn],fl=Math.hypot(f[0],f[1],f[2]);f[0]/=fl;f[1]/=fl;f[2]/=fl;
  fx=-sp;fz=-cp;dn=fx*n[0]+fz*n[2];const l=[fx-n[0]*dn,-n[1]*dn,fz-n[2]*dn],ll=Math.hypot(l[0],l[1],l[2]);l[0]/=ll;l[1]/=ll;l[2]/=ll;
  const add=(x,y,z,px,py,pz)=>{body.addForceAtPoint({x,y,z},{x:px,y:py,z:pz},true);B.F[0]+=x;B.F[1]+=y;B.F[2]+=z;};
  if(!P.air)for(let k=0;k<4;k++){const bx=_wBx[k],by=_wBy[k],p=B.pc[k];add(bx*f[0]+by*l[0],bx*f[1]+by*l[1],bx*f[2]+by*l[2],p[0],p[1],p[2]);}
  add(-Fres*f[0],-Fres*f[1],-Fres*f[2],t.x,t.y,t.z);
  for(const [L,F] of [[B.a,A.Ff],[-B.b,A.Fr]]){trkRbRot(q,L,0,0,_rw);add(-n[0]*F,-n[1]*F,-n[2]*F,t.x+_rw[0],t.y+_rw[1],t.z+_rw[2]);}
  if(Mesp)body.addTorque({x:n[0]*Mesp,y:n[1]*Mesp,z:n[2]*Mesp},true);
  RB.pend.add(P);
}
/* un passo del mondo per tutte le auto che hanno ricevuto le forze; le altre (box, via, attesa) seguono la loro posizione */
function trkRbStep(h){
  const W=RB.world;W.timestep=h;
  /* chi segue la sua posizione (box, via) è un fantasma: non urta e non viene urtato */
  for(const P of RB.cars){const B=P.rb;if(RB.pend.has(P)){if(B.ghost){B.col.setSensor(false);B.ghost=false;}const v=B.body.linvel();B.v0[0]=v.x;B.v0[1]=v.y;B.v0[2]=v.z;}
    else{if(!B.ghost){B.col.setSensor(true);B.ghost=true;}trkRbPlace(P);}}
  W.step();
  for(const P of RB.pend)trkRbSync(P,h);
  RB.pend.clear();
}
/* dalla scocca allo stato dell'auto usato da tutto il resto (posizione, imbardata, velocità nel telaio, accelerazioni) */
function trkRbSync(P,h){
  const B=P.rb,body=B.body,c=P.car,V=P.veh,t=body.translation(),q=body.rotation(),lv=body.linvel(),av=body.angvel();
  if(!isFinite(t.x+t.y+t.z+q.w+lv.x+lv.y+lv.z+av.y)){trkRbRecover(P);return;}
  trkRbRot(q,1,0,0,_rv);let dp=Math.atan2(-_rv[2],_rv[0])-c.psi;dp-=Math.round(dp/(2*Math.PI))*2*Math.PI;c.psi+=dp;
  const cp=Math.cos(c.psi),sp=Math.sin(c.psi);c.X=t.x;c.Y=-t.z;
  let vx=lv.x*cp-lv.z*sp,vy=-lv.x*sp-lv.z*cp,r=av.y;
  /* sotto i 4,5 m/s si passa gradualmente a un moto cinematico (come nella fisica piana): niente tremolii da fermi */
  const kb=vx>0?clamp((vx-1.5)/3,0,1):0,rev=P.gear<0;
  if(kb<1&&!P.air){const rk=vx*Math.tan(c.delta)/V.lwb;r=kb*r+(1-kb)*rk;vy=kb*vy+(1-kb)*rk*B.b;}
  if(!rev&&c.vx>0&&vx<0&&P.thr<0.05&&Math.abs(TRK.T.sl[c.i])<0.03)vx=0;
  if(Math.abs(vx)<0.3&&P.brk>0&&!rev)vx*=Math.max(0,1-h*20);
  if(kb<1||vx!==(lv.x*cp-lv.z*sp)){body.setLinvel({x:vx*cp-vy*sp,y:lv.y,z:-(vx*sp+vy*cp)},true);body.setAngvel({x:av.x,y:r,z:av.z},true);}
  /* accelerazioni nel telaio (servono a freni, aerodinamica e telemetria) */
  const ax=((lv.x-B.v0[0])*cp-(lv.z-B.v0[2])*sp)/h,ay=(-(lv.x-B.v0[0])*sp-(lv.z-B.v0[2])*cp)/h;
  if(isFinite(ax)&&isFinite(ay)){c.ax+=(clamp(ax,-80,80)-c.ax)*Math.min(1,h/0.05);c.ay+=(clamp(ay,-80,80)-c.ay)*Math.min(1,h/0.05);}c.vx=vx;c.vy=vy;c.r=r;
  /* urti: la variazione di velocità che le forze applicate e la gravità non spiegano viene dagli impulsi di contatto */
  const m=V.m,ex=B.F[0]/m*h,ez=B.F[2]/m*h,rx=lv.x-B.v0[0]-ex,rz=lv.z-B.v0[2]-ez;
  /* un urto conta per i primi 80 ms (poi pausa di 0,3 s): strisciare lungo un muro non somma un danno enorme; solo il piano orizzontale */
  const rh=Math.hypot(rx,rz);
  if(B.hitT>0){B.hit[0]+=rx;B.hit[2]+=rz;B.hitT-=h;if(B.hitT<=0){trkRbHit(P);B.cool=0.3;}}
  else if(B.cool>0){B.cool-=h;if(rh>h*120){B.hit[0]=rx;B.hit[2]=rz;B.hitT=0.08;B.cool=0;}}
  else if(rh>h*25){B.hit[0]=rx;B.hit[2]=rz;B.hitT=0.08;}
  P.gm=(B.fz[0]+B.fz[1]+B.fz[2]+B.fz[3])/(m*9.81);
  if(isFinite(c.X+c.Y+c.psi))B.good={X:c.X,Y:c.Y,psi:c.psi,i:c.i,d:c.d};
  P.zc=t.y-B.h;if(P.air&&!B.wasAir)B.landV=0;if(P.air)B.landV=Math.min(B.landV,lv.y);
  /* ribaltata (tetto verso il basso) per più di due secondi, o finita sotto il suolo: i commissari la rimettono dritta */
  trkRbRot(q,0,1,0,_rw);const gH=trkRbGround(c.X,c.Y,c.i);
  if(_rw[1]<0.35)B.flipT=(B.flipT||0)+h;else B.flipT=0;
  if(B.flipT>2||t.y<gH-1){B.flipT=0;c.vx=0;c.vy=0;c.r=0;trkRbPlace(P);if(!P.isAI)trkToast(P,'Auto ribaltata: i commissari la rimettono in pista',2.4);}
}
/* il motore fisico ha restituito valori non numerici: l'auto torna ferma all'ultima posizione valida, con una scocca nuova */
function trkRbRecover(P){
  const c=P.car,G=P.rb&&P.rb.good;trkRbDrop(P);
  if(G)Object.assign(c,G);for(const k of ['vx','vy','r','ax','ay','delta'])c[k]=0;
  if(!isFinite(c.X+c.Y+c.psi)||c.i==null||!isFinite(c.i)){trkReset(P,false);}
  trkWheelSync(P);
}
/* fine di un urto: danni, avviso e giro non valido come con le barriere di prima */
function trkRbHit(P){
  const B=P.rb,c=P.car,hx=B.hit[0],hz=B.hit[2],dv=Math.hypot(hx,hz);B.hit.fill(0);if(dv<1.5)return;
  const cp=Math.cos(c.psi),sp=Math.sin(c.psi),bx=-(hx*cp-hz*sp),by=-(-hx*sp-hz*cp),l=Math.hypot(bx,by)||1;
  /* contro un'altra auto (carrozzerie che cedono) il danno è minore che contro un muro di cemento */
  const car=TRK.cars.some(Q=>Q!==P&&Math.hypot(Q.car.X-c.X,Q.car.Y-c.Y)<6);
  if(typeof trkDmgHit==='function')trkDmgHit(P,car?dv*0.7:dv,bx/l,by/l);
  if(dv>2&&P.collT<=0){trkToast(P,car?'Contatto!':'Contatto con il guard rail',1.4);trkThump(P,Math.min(1,dv/10));P.collT=1.2;if(!car&&P.lap)P.lap.valid=false;}
}

/* ---------- agganci ---------- */
{const f=trkPhysics;trkPhysics=function(P,h){
  /* fotogrammi quasi sovrapposti danno passi nulli o di pochi decimillesimi di secondo: le accelerazioni (Δv/h) esploderebbero.
     Sotto 0,2 ms il passo si salta (il tempo perso è trascurabile) */
  if(!(h>2e-4))return;
  /* rete di sicurezza: un valore non numerico nello stato dell'auto non deve propagarsi (si azzera, e la scocca torna dov'è l'auto) */
  {const c=P.car;if(!isFinite(c.X+c.Y+c.psi+c.ax+c.ay+c.vx+c.vy+c.r+c.delta))trkRbRecover(P);}
  if(!trkRbUse(P)){if(P.rb)trkRbDrop(P);return f(P,h);}
  if(RB.pend.has(P))trkRbStep(h);
  trkRbSusp(P,h);f(P,h);};}
/* con la scocca: guard rail e contatti fra auto li risolve Rapier; la quota la danno le sospensioni */
{const f=trkCollide;trkCollide=function(P){if(!P.rb)f(P);};}
{const f=trkCarsCollide;trkCarsCollide=function(A,B){if(!(A.rb&&B.rb))f(A,B);};}
{const f=trkVertical;trkVertical=function(P,h){const B=P.rb;if(!B)return f(P,h);
  if(B.wasAir&&!P.air){P.landV=B.landV;if(typeof trkDmgLand==='function')trkDmgLand(P,-B.landV);}B.wasAir=P.air;};}
{const f=trkReset;trkReset=function(P,grid,slot){f(P,grid,slot);if(P.rb&&!P.pit)trkRbPlace(P);};}
{const f=trkStop;trkStop=function(){f();trkRbClear();};}
/* aspetto: l'auto in pista prende posizione e inclinazione direttamente dalla scocca (rollio e beccheggio veri) */
if(typeof trkVisual==='function'){const f=trkVisual;trkVisual=function(P,dt){f(P,dt);const B=P.rb;if(!B||TRK.replay.on||P.pit||!P.rig)return;
  const t=B.body.translation(),q=B.body.rotation();trkRbRot(q,0,-B.h,0,_rv);
  P.rig.position.set(t.x+_rv[0],t.y+_rv[1],t.z+_rv[2]);P.rig.quaternion.set(q.x,q.y,q.z,q.w);
  P.roll=P.pitch=P.hv=0;if(P.vis&&P.vis.kind==='vespera'&&P.vis.chassis){P.vis.chassis.rotation.x=0;P.vis.chassis.rotation.z=0;}};}
if(typeof toggle==='function'&&document.getElementById('trkRb')){toggle('trkRb',v=>{RB.on=v;try{localStorage.setItem('vespera-rb',v?'1':'0');}catch(e){}});setPressed('trkRb',RB.on);}
