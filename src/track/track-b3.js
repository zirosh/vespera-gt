/* =========================================================
   Replay: registrazione a 30 fotogrammi al secondo di tutte le auto, riproduzione con telecamere TV a bordo pista
   ========================================================= */
const TRK_RS=16;
function trkRecord(dt){
  TRK.recT+=dt;if(TRK.recT<1/30)return;TRK.recT=0;const ps=TRK.cars,s=new Float32Array(ps.length*TRK_RS);
  ps.forEach((P,k)=>{const c=P.car;s.set([c.X,c.Y,c.psi,P.zc,P.ptc,c.vx,c.vy,c.delta,c.ax,c.ay,P.thr,P.brk,c.r,P.flame>0?1:0,c.i,P.pit&&P.pit.ph==='stop'?1:0],k*TRK_RS);});
  TRK.rec.push({t:TRK.clock,s});
  if(TRK.rec.length>9000)TRK.rec.shift();
}
const thReplay=document.getElementById('thReplay'),thRpT=document.getElementById('thRpT');
function trkRpLabel(P){return P.id===0?(TRK.split?'G1':'Tu'):P.isAI?'#'+P.num:'G2';}
function trkReplayStart(){
  const R=TRK.replay;if(R.on)return;
  if(TRK.rec.length<60){trkToast(TRK.p[0],'Guida ancora qualche secondo: il replay non ha abbastanza immagini',2.5);return;}
  R.save=TRK.cars.map(P=>({car:Object.assign({},P.car),zc:P.zc,wz:P.wz,air:P.air,ptc:P.ptc,thr:P.thr,brk:P.brk,steerIn:P.steerIn,flame:P.flame}));
  if(R.focus>=TRK.cars.length)R.focus=0;
  Object.assign(R,{on:true,t:TRK.rec[0].t,paused:false,speed:1,tv:-1});
  const f=document.getElementById('thRpFocus');f.innerHTML=TRK.cars.map((P,k)=>`<button data-v="${k}">${trkRpLabel(P)}</button>`).join('');f.hidden=TRK.cars.length<2;
  f.querySelectorAll('button').forEach(b=>b.onclick=()=>{R.focus=+b.dataset.v;R.tv=-1;TRK.cars.forEach(P=>P.camPos=null);trkReplayUI();});
  document.documentElement.classList.add('replaying');thReplay.hidden=false;trkReplayUI();
}
function trkReplayStop(){
  const R=TRK.replay;if(!R.on)return;R.on=false;
  TRK.cars.forEach((P,k)=>{const s=R.save[k];if(!s)return;Object.assign(P.car,s.car);Object.assign(P,{zc:s.zc,wz:s.wz,air:s.air,ptc:s.ptc,thr:s.thr,brk:s.brk,steerIn:s.steerIn,flame:s.flame,camPos:null,skid:[null,null]});});
  document.documentElement.classList.remove('replaying');thReplay.hidden=true;TRK.keys=[{},{}];
}
function trkReplayStep(dt){
  const R=TRK.replay,rec=TRK.rec,t1=rec[rec.length-1].t;
  if(!R.paused){R.t+=dt*R.speed;if(R.t>=t1){R.t=t1;R.paused=true;trkReplayUI();}}
  let lo=0,hi=rec.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(rec[m].t<=R.t)lo=m;else hi=m;}
  const A=rec[lo],B=rec[hi],f=B.t>A.t?clamp((R.t-A.t)/(B.t-A.t),0,1):0,T=TRK.T;
  TRK.cars.forEach((P,k)=>{const o=k*TRK_RS;if(o>=A.s.length||o>=B.s.length)return;const a=A.s,b=B.s,L=j=>a[o+j]+(b[o+j]-a[o+j])*f,c=P.car;
    let dp=b[o+2]-a[o+2];while(dp>Math.PI)dp-=2*Math.PI;while(dp<-Math.PI)dp+=2*Math.PI;
    c.X=L(0);c.Y=L(1);c.psi=a[o+2]+dp*f;P.zc=L(3);P.ptc=L(4);c.vx=L(5);c.vy=L(6);c.delta=L(7);c.ax=L(8);c.ay=L(9);P.thr=L(10);P.brk=L(11);c.r=L(12);c.i=(f<0.5?a[o+14]:b[o+14])|0;
    P.flame=(f<0.5?a[o+13]:b[o+13])?0.05:0;P.rpCrew=(f<0.5?a[o+15]:b[o+15])>0.5;c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=trkSurface(c.i,c.d);P.air=false;});
  thRpT.value=Math.round((R.t-rec[0].t)/Math.max(1e-3,t1-rec[0].t)*1000);
}
function trkReplayCam(dt){
  const R=TRK.replay,P=TRK.cars[R.focus]||TRK.p[0],p=P.rig.position;
  if(R.cam==='tv'){const cams=TRK.tvcams,dist=k=>cams[k].pos.distanceTo(p);let bi=0,bd=1e18;for(let k=0;k<cams.length;k++){const d=dist(k);if(d<bd){bd=d;bi=k;}}
    if(R.tv<0||bd<0.7*dist(R.tv)||dist(R.tv)>230)R.tv=bi;
    camera.position.copy(cams[R.tv].pos);_tl.set(p.x,p.y+0.7,p.z);camera.lookAt(_tl);
    const fov=clamp(2*Math.atan(5.5/camera.position.distanceTo(_tl))*180/Math.PI,5,55);
    if(Math.abs(camera.fov-fov)>0.05||camera.near!==0.1){camera.fov=fov;camera.near=0.1;camera.updateProjectionMatrix();}}
  else{const sv=P.cam;P.cam=R.cam;trkCamera(P,camera,dt);P.cam=sv;}
}
function trkReplayUI(){
  const R=TRK.replay;document.getElementById('thRpPlay').textContent=R.paused?'▶':'❚❚';
  const mark=(id,v)=>document.querySelectorAll(`#${id} button`).forEach(b=>b.classList.toggle('on',b.dataset.v==String(v)));
  mark('thRpSpeed',R.speed);mark('thRpCam',R.cam);mark('thRpFocus',R.focus);
}
function trkReplayHud(){
  const R=TRK.replay,P=TRK.cars[R.focus]||TRK.p[0],rec=TRK.rec;
  document.getElementById('thRpInfo').textContent=`${TRK.duo?P.label+(P.isAI&&P.ch&&TRK.aiChar?` (${P.ch.n})`:'')+' · ':''}${Math.round(P.kmh)} km/h · ${fmtLap(R.t-rec[0].t)} di ${fmtLap(rec[rec.length-1].t-rec[0].t)}`;
}
thReplay.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{const R=TRK.replay,a=b.dataset.rp;
  if(a==='restart'){R.t=TRK.rec[0].t;R.paused=false;}else if(a==='play'){if(R.paused&&R.t>=TRK.rec[TRK.rec.length-1].t-0.05)R.t=TRK.rec[0].t;R.paused=!R.paused;}else if(a==='exit')trkReplayStop();trkReplayUI();});
document.querySelectorAll('#thRpSpeed button').forEach(b=>b.onclick=()=>{TRK.replay.speed=+b.dataset.v;trkReplayUI();});
document.querySelectorAll('#thRpCam button').forEach(b=>b.onclick=()=>{TRK.replay.cam=b.dataset.v;TRK.cars.forEach(P=>P.camPos=null);trkReplayUI();});
thRpT.oninput=()=>{const r=TRK.rec;if(!r.length)return;TRK.replay.t=r[0].t+(+thRpT.value/1000)*(r[r.length-1].t-r[0].t);TRK.replay.paused=true;trkReplayUI();};

/* ---------- telecamere ---------- */
const _tv=new THREE.Vector3(),_tl=new THREE.Vector3();
function trkLabOf(P){return P.id===0?(state.lab&&LAB?{S:LAB,P:LABP}:null):(P.vis&&P.vis.kind==='lab'?{S:P.vis.S,P:P.vis.S.P}:null);}
function trkCamera(P,cam,dt){
  const c=P.car,vis=P.rig,p=vis.position;let fov=60,near=0.1;
  const lab=trkLabOf(P);
  const lb=!TRK.replay.on&&P.lookBack,ly=TRK.replay.on?0:P.lookYaw||0;
  /* le accelerazioni spostano la telecamera (indietro quando si accelera, avanti in frenata, verso l'esterno in curva) */
  const ek=1-Math.exp(-dt*4);P.cgx=(P.cgx||0)+(c.ax-(P.cgx||0))*ek;P.cgy=(P.cgy||0)+(c.ay-(P.cgy||0))*(1-Math.exp(-dt*3.2));
  /* scuotimento: velocità, cordoli ed erba sotto le ruote, cambiate, atterraggi */
  let rough=0;if(P.wsf&&!P.air)for(const s of P.wsf)rough+=s==='cordolo'?0.35:s==='asfalto'?0:0.6;
  const av=Math.abs(c.vx),amp=(0.0035*Math.pow(av/80,2)+0.018*rough*Math.min(1,av/18))*(TRK.replay.on?0.5:1),tc=TRK.clock;
  P.shiftKick=(P.shiftKick||0)*Math.exp(-dt*9);
  if(P.cam==='cockpit'){
    const ya=(lb?Math.PI:0)+ly,cx=Math.cos(ya)*30,cz=-Math.sin(ya)*30;
    if(lab){_tv.set(lab.S.xf-lab.P.hoodLen*0.9,lab.P.hoodH+0.3,0);_tl.set(_tv.x+cx,lab.P.hoodH-(lb?-0.6:0),cz);}
    else{_tv.set(-0.48,1.06,DZ);_tl.set(_tv.x+cx,lb?0.4:-2.0,DZ+cz);}
    /* la testa del pilota si sposta con le accelerazioni */
    const hx=clamp(-P.cgx*0.009,-0.09,0.12),hz=clamp(P.cgy*0.011,-0.09,0.09);_tv.x+=hx;_tv.z+=hz;_tl.z+=hz*0.5;
    vis.updateMatrixWorld(true);vis.localToWorld(_tv);vis.localToWorld(_tl);cam.position.copy(_tv);cam.lookAt(_tl);
    cam.rotateZ(clamp(-P.cgy*0.0035,-0.04,0.04));cam.rotateX(-P.shiftKick*0.012);
    cam.position.y+=amp*0.6*(Math.sin(tc*53)+0.6*Math.sin(tc*91+1.3));
    fov=70+clamp(av-30,0,60)*0.1;near=0.03;
  }else{
    const beta=Math.abs(c.vx)>3?Math.atan2(c.vy,Math.abs(c.vx)):0;
    let dy=(c.psi+beta*0.6)-P.camYaw;while(dy>Math.PI)dy-=2*Math.PI;while(dy<-Math.PI)dy+=2*Math.PI;
    P.camYaw+=dy*(1-Math.exp(-dt*(P.cam==='heli'?1.5:4.5)));
    const len=lab?lab.P.L:4.6,cfg={chase:[len*1.35+2.2,2.5,1.0,3],near:[len*0.95+1.0,1.45,0.85,2],heli:[30,32,0,5]}[P.cam];
    const yw=P.camYaw+(lb?Math.PI:0)+ly,fx=Math.cos(yw),fz=-Math.sin(yw);
    if(lb!==P.lbWas){P.lbWas=lb;P.camPos=null;}
    const back=P.cam==='heli'?0:clamp(P.cgx*0.055,-0.55,0.8),side=P.cam==='heli'?0:clamp(-P.cgy*0.04,-0.5,0.5);
    _tv.set(p.x-fx*(cfg[0]+back)+fz*side,p.y+cfg[1]+(P.lookPitch||0)*1.5-back*0.15,p.z-fz*(cfg[0]+back)-fx*side);
    if(!P.camPos)P.camPos=_tv.clone();else{P.camPos.x+=(_tv.x-P.camPos.x)*(1-Math.exp(-dt*12));P.camPos.z+=(_tv.z-P.camPos.z)*(1-Math.exp(-dt*12));P.camPos.y+=(_tv.y-P.camPos.y)*(1-Math.exp(-dt*6));}
    cam.position.copy(P.camPos);
    if(P.landT>0){cam.position.y+=Math.sin(TRK.clock*60)*0.08*P.landT;P.landT=Math.max(0,P.landT-dt);}
    _tl.set(p.x+fx*cfg[3],p.y+cfg[2],p.z+fz*cfg[3]);cam.lookAt(_tl);
    if(P.cam!=='heli'){cam.rotateZ(clamp(P.cgy*0.003,-0.035,0.035));cam.rotateX(-P.shiftKick*0.008);
      cam.position.y+=amp*(Math.sin(tc*47)+0.6*Math.sin(tc*83+1.0));cam.position.x+=amp*0.5*Math.sin(tc*61+2.1);}
    fov=P.cam==='heli'?45:(58+clamp(Math.abs(c.vx)-30,0,60)*0.12);
  }
  if(Math.abs(cam.fov-fov)>0.05||cam.near!==near){cam.fov=fov;cam.near=near;cam.updateProjectionMatrix();}
}

/* ---------- aspetto delle auto: ruote, sterzo, rollio, beccheggio sulle pendenze, luci e aloni, dischi roventi, fiammate, tergicristalli, meccanici ai box ---------- */
const _hv=new THREE.Vector3();
function trkVisual(P,dt){
  const c=P.car,vis=P.rig,T=TRK.T,i=c.i,rp=TRK.replay.on;
  if(!rp){const al=Math.cos(c.psi-Math.atan2(T.ty[i],T.tx[i])),tgt=P.air?Math.atan2(P.wz,Math.max(c.vx,1)):Math.atan(T.sl[i]*al);P.ptc+=(tgt-P.ptc)*(1-Math.exp(-dt*(P.air?4:12)));}
  /* sospensioni: rollio, beccheggio e scuotimento sono molle smorzate (oscillano un poco e si assestano), eccitate da accelerazioni, cordoli, erba e atterraggi */
  const sd=Math.min(dt,0.04),av=Math.abs(c.vx);let rough=0;if(!P.air){if(P.wsf){for(const s of P.wsf)rough=Math.max(rough,s==='cordolo'?0.7:s==='asfalto'?0:1);}else rough=(P.surf==='erba'||P.surf==='ghiaia')?1:P.surf==='cordolo'?0.7:0;}
  if(P.rollV==null){P.rollV=P.pitchV=P.hv=P.hvV=0;P.wasAir=false;}
  if(!rp){if(P.wasAir&&!P.air){P.hvV-=Math.min(0.9,Math.abs(P.landV||0)*0.09+0.12);P.pitchV-=Math.min(0.5,Math.abs(P.landV||0)*0.04);}P.wasAir=P.air;
    if(rough&&av>3&&Math.random()<sd*(rough>0.8?14:24))P.hvV+=(Math.random()-0.5)*0.12*rough*Math.min(1,av/20);}
  const spr=(x,v,tg,w,z)=>v+((tg-x)*w*w-2*z*w*v)*sd;
  P.rollV=spr(P.roll,P.rollV,clamp(c.ay*0.0055,-0.075,0.075),10.5,0.4);P.roll+=P.rollV*sd;
  P.pitchV=spr(P.pitch,P.pitchV,clamp(c.ax*0.0042,-0.05,0.032),12,0.42);P.pitch+=P.pitchV*sd;
  P.hvV=spr(P.hv,P.hvV,P.air?0.03:-clamp(((P.gm||1)-1)*0.025,-0.03,0.04)-0.006*av*av/4000,14,0.38);P.hv=clamp(P.hv+P.hvV*sd,-0.07,0.08);
  if(rough&&Math.random()<sd*rough*8){let sd2=0;if(P.wsf)for(let k=0;k<4;k++)if(P.wsf[k]!=='asfalto')sd2+=k%2?-1:1;P.rollV+=((Math.random()-0.5)*0.25+sd2*0.05)*rough*Math.min(1,av/25);}
  vis.position.set(c.X,P.zc+P.hv,-c.Y);vis.rotation.order='YZX';vis.rotation.set(0,c.psi,P.ptc);trkContactUpdate(P);
  P.v=Math.hypot(c.vx,c.vy);P.kmh=Math.abs(c.vx)*3.6;
  const glow=trkBrakeHeat(P,dt,rp),night=TRK.tod==='night',lamp=TRK.lamp||0;trkDirtStep(P,dt,rp);
  /* fiammate: quando si stacca il gas ad alto regime o si cambia marcia in pieno */
  const gb=trkGb(P);
  if(!rp){if(P.lastThr>0.85&&P.thr<0.35&&gb.rpm>5200)P.flame=0.14+Math.random()*0.18;
    if(gb.g!==P.lastGear&&+gb.g>+P.lastGear&&P.thr>0.8)P.flame=Math.max(P.flame,0.08);P.flame=Math.max(0,P.flame-dt);}
  P.lastThr=P.thr;P.lastGear=gb.g;
  const fl=P.flame>0,fs=0.18+Math.random()*0.14;
  const lab=P.id===0?state.lab:(P.vis&&P.vis.kind==='lab');
  if(lab){const wl=P.id===0?labG.children.filter(o=>o.isGroup):P.vis.wheels,R=P.id===0?LAB.R:P.vis.S.R;
    wl.forEach((w,k)=>{w.rotation.order='YXZ';w.rotation.z-=(rp?c.vx:k<2?P.uf??c.vx:P.ur??c.vx)/R*dt;w.rotation.y=k<2?c.delta:0;});(P.id===0?labG:P.vis.root).rotation.set(P.roll,0,P.pitch);}
  const wipe=TRK.rain>0.12||TRK.wet>0.6;
  if(P.id===0){state.steer=c.delta*180/Math.PI;discMat.emissiveIntensity=glow;discMat.emissive.copy(P.bCol);
    if(TRK.flames)TRK.flames.forEach(f=>{f.visible=fl&&!state.lab;f.scale.set(fs*1.4,fs,1);});
    if(TRK.wipers&&!state.lab)trkWipe(TRK.wipers,wipe?TRK.clock:0);}
  else{P.M.tail.emissiveIntensity=1+(night||TRK.rain>0.35?1.6:0)+(P.brk>0.05?3.2:0);P.M.disc.emissiveIntensity=glow;P.M.disc.emissive.copy(P.bCol);}
  if(P.vis&&(P.id>0||!state.lab)){
    if(P.vis.kind==='vespera'){const Vv=P.vis;Vv.chassis.rotation.x=P.roll;Vv.chassis.rotation.z=P.pitch;
      Vv.wheels.forEach(w=>{w.spinner.rotation.z+=(w.s>0?-1:1)*(rp?c.vx:w.isFront?P.uf??c.vx:P.ur??c.vx)/WR*dt;w.root.rotation.order='ZYX';w.root.rotation.set(0,w.baseRot+(w.isFront?c.delta:0),0);});
      if(Vv.sw)Vv.sw.rotation.z=-c.delta*7;Vv.flames.forEach(f=>{f.visible=fl;f.scale.set(fs*1.4,fs,1);});if(Vv.wipers)trkWipe(Vv.wipers,wipe?TRK.clock+0.3*P.id:0);
      /* da lontano l'abitacolo non si vede: lo si nasconde per alleggerire la scena */
      {const d=Math.min(vis.position.distanceToSquared(camera.position),TRK.split?vis.position.distanceToSquared(camera2.position):1e9);if(Vv.interior)Vv.interior.visible=d<900;
        /* dettagli piccoli (stemmi, viti, prese d'aria) solo da vicino */const near=d<2500;if(Vv.near!==near){Vv.near=near;(Vv.details||[]).forEach(o=>o.visible=near);}}}}
  /* aloni: fari visibili da davanti, fanali da dietro; più forti in frenata */
  if(P.halo&&P.M){const on=lamp>0||P.brk>0.05;P.halo.visible=on;
    if(on){_hv.subVectors(camera.position,vis.position);_hv.y=0;_hv.normalize();const fwd=_hv.x*Math.cos(c.psi)-_hv.z*Math.sin(c.psi);
      P.M.haloF.opacity=lamp>0?Math.max(0,fwd)*(night?0.75:0.45):0;P.M.haloR.opacity=Math.max(0,-fwd*0.8+0.2)*((lamp>0?(night?0.5:0.35):0)+(P.brk>0.05?0.45:0));}}
  /* meccanici attorno all'auto ferma nella piazzola */
  const stop=rp?P.rpCrew:(P.pit&&P.pit.ph==='stop');
  if(stop){const cr=trkCrew(P);cr.visible=true;cr.position.copy(vis.position);cr.rotation.set(0,c.psi,0);}else if(P.crew)P.crew.visible=false;
}

/* ---------- passo di ogni fotogramma ---------- */
function trkFrame(dt){
  trkPadFrame(dt);if(TRK.paused)return;
  if(TRK.dirty&&performance.now()-TRK.dirtyT>150&&!TRK.replay.on)trkCompute();
  rainMat.uniforms.uTime.value+=dt;
  const T=TRK.T,N=T.N,players=TRK.cars.length?TRK.cars:[TRK.p[0]],R=TRK.race,P1=TRK.p[0];
  if(TRK.replay.on){
    trkReplayStep(dt);players.forEach(P=>trkVisual(P,dt));trkSmokeStep(dt);trkReplayCam(dt);trkReplayHud();trkVoices(dt);trkSfxUpdate(dt);trkDrops(dt);
    if(ghostG)ghostG.visible=false;return;}
  TRK.clock+=dt;
  if(TRK.duo)trkRaceUpdate(dt);
  trkWxStep(dt);
  const prev=players.map(P=>P.car.i),hold=TRK.duo&&R.state==='count';
  for(const P of players){if(P.pit){if(!P.isAI)trkInputs(P,dt);continue;}if(P.isAI)trkAIDrive(P,dt);else trkInputs(P,dt);if(hold){P.thr=0;P.brk=0;}}
  for(const P of players)if(!P.isAI)padStore(P.id,trkPadFor(P.id));
  for(const P of players)trkWake(P,dt);
  const auto1=!TRK.duo&&TRK.mode==='auto';
  if(DYN.frozen){P1.car.vx*=Math.max(0,1-dt*3);P1.car.vy=0;P1.car.r=0;if(P1.toastT<=0)trkToast(P1,'Le ali sollevano l\'auto: rivedile nella scheda Ali o premi R');}
  if(auto1)trkAutoStep(P1,dt);
  for(const P of players)if(P.pit)trkPitStep(P,dt);
  const n=Math.max(1,Math.ceil(dt/(1/240))),h=dt/n;
  for(let k=0;k<n;k++){
    for(const P of players){if((P.id===0&&auto1)||P.pit)continue;const c=P.car;if(hold){c.vx=c.vy=c.r=0;continue;}
      trkPhysics(P,h);c.i=trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=trkSurface(c.i,c.d);trkCollide(P);trkVertical(P,h);}
    if(TRK.duo&&TRK.collide)for(let a=0;a<players.length;a++)for(let b=a+1;b<players.length;b++)trkCarsCollide(players[a],players[b]);
  }
  players.forEach((P,k)=>{const c=P.car;
    if(!P.pit){c.i=(P.id===0&&auto1)?Math.floor(P.auto)%N:trkLocate(c.X,c.Y,c.i,8);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=trkSurface(c.i,c.d);}
    /* fuori pista: tutte e quattro le ruote oltre la linea bianca (o il cordolo) */
    if(!(P.id===0&&auto1)&&!P.pit&&P.lap.run){const lim=T.w/2+((TRK.kerb[c.i]&(c.d>0?1:2))?1.3:0)+P.veh.track/2+0.2;
      if(Math.abs(c.d)>lim){P.offT+=dt;if(P.offT>0.25&&P.lap.valid){P.lap.valid=false;trkToast(P,'Fuori pista: giro non valido');}}else P.offT=0;}
    trkLap(P,prev[k],c.i);trkPitCheck(P,prev[k],c.i);P.collT-=dt;if(!P.isAI)trkRumbleTick(P);
    trkVisual(P,dt);trkWheelFx(P,dt);
    if(P.toastT>0){P.toastT-=dt;if(P.toastT<=0&&P.el)P.el.toast.hidden=true;}});
  trkGhostShow();trkSmokeStep(dt);trkRecord(dt);trkVoices(dt);trkSfxUpdate(dt);
  if(TRK.labDecals&&TRK.labDecalsVer!==labVer)trkLabDecalsP1();
  /* schermo diviso: affiancato su schermi larghi, uno sopra l'altro su schermi stretti */
  const sz=renderer.getSize(_trkSz),vert=TRK.split&&sz.x<sz.y*1.15;
  if(vert!==TRK.vertical){TRK.vertical=vert;document.documentElement.classList.toggle('duo-v',vert);}
  trkCamera(P1,camera,dt);if(TRK.split)trkCamera(TRK.p[1],camera2,dt);
  trkDrops(dt);
  TRK.hudT-=dt;if(TRK.hudT<=0){TRK.hudT=0.08;trkHudUpdate(P1);if(TRK.split)trkHudUpdate(TRK.p[1]);}
}
/* voci dei motori degli avversari: in due il secondo giocatore; poi le auto più vicine alla telecamera, più forti se vicine */
function trkVoices(dt){
  if(!trkVoice2&&!trkVoice3)return;
  const others=TRK.cars.filter(P=>P.id!==0),cp=camera.position;
  let a=null,b=null,da=1e18,db=1e18;
  if(TRK.split){a=TRK.p[1];da=0;}
  for(const P of others){if(P===a)continue;const d=P.rig.position.distanceToSquared(cp);if(d<da&&!TRK.split){b=a;db=da;a=P;da=d;}else if(d<db){b=P;db=d;}}
  const g=(P,d2)=>TRK.split&&P===TRK.p[1]?1:clamp(1.3/(1+Math.sqrt(d2)/18),0,1);
  if(trkVoice2)trkVoiceUpdate(trkVoice2,a?trkGb(a).rpm||950:0,a?0.15+0.85*a.thr:0,!!a&&TRK.duo,a?g(a,da)*(TRK.split?1:0.8):0);
  if(trkVoice3)trkVoiceUpdate(trkVoice3,b?trkGb(b).rpm||950:0,b?0.15+0.85*b.thr:0,!!b,b?g(b,db)*0.7:0);
}
const _trkSz=new THREE.Vector2();
/* viste da disegnare: una sola, o due affiancate / sovrapposte */
function trkViews(){
  const sz=renderer.getSize(_trkSz),w=sz.x,h=sz.y;
  if(!TRK.split||TRK.replay.on)return [{k:0,P:TRK.replay.on?(TRK.cars[TRK.replay.focus]||TRK.p[0]):TRK.p[0],cam:camera,x:0,y:0,w,h,W:w,H:h}];
  const out=[];for(const k of [0,1]){let x,y,ww,hh;
    if(TRK.vertical){ww=w;hh=Math.floor(h/2);x=0;y=k?0:h-hh;}else{ww=Math.floor(w/2);hh=h;x=k?w-ww:0;y=0;}
    out.push({k,P:TRK.p[k],cam:k?camera2:camera,x,y,w:ww,h:hh,W:w,H:h});}
  return out;
}
/* prima di disegnare una vista: sole e ombra sull'auto inquadrata, pioggia attorno alla telecamera, pilota nascosto se si guarda dall'abitacolo */
function trkPrepView(v){
  const P=v.P,c=P.car,cam=v.cam;
  trkShadowAim(v);trkLightsUpdate(v);
  const rp=TRK.replay.on,cockpit=rp?TRK.replay.cam==='cockpit':P.cam==='cockpit';
  if(TRK.driver)TRK.driver.visible=!state.lab&&!(cockpit&&P.id===0);
  const P1=TRK.p[0];if(P1.vis&&!state.lab){const own=cockpit&&P===P1;car.visible=own;P1.vis.root.visible=!own;}
  for(const Q of TRK.cars)if(Q.vis&&Q.vis.driver)Q.vis.driver.visible=!(cockpit&&Q===P);
  rainMesh.position.copy(cam.position);
  smkMat.uniforms.uScale.value=v.h/2/Math.tan(cam.fov*Math.PI/360);
  cam.clearViewOffset();cam.aspect=v.w/v.h;cam.updateProjectionMatrix();
}
function trkRender(){
  const views=trkViews();
  if(PP.on){trkPostRender(views);return;}
  if(views.length===1){const v=views[0];trkPrepView(v);trkReflect(v);renderer.setViewport(0,0,v.W,v.H);renderer.render(scene,v.cam);return;}
  for(const v of views){trkPrepView(v);trkReflect(v);renderer.setScissorTest(true);renderer.setViewport(v.x,v.y,v.w,v.h);renderer.setScissor(v.x,v.y,v.w,v.h);renderer.render(scene,v.cam);}
  renderer.setScissorTest(false);renderer.setViewport(0,0,views[0].W,views[0].H);
}

/* ---------- HUD di ciascun giocatore ---------- */
function trkHudBuild(P){
  const r=document.createElement('div');r.className='th-player';r.id='thP'+(P.id+1);if(P.id)r.hidden=true;
  r.innerHTML=`<div class="th-card th-time"><div class="th-tag">Giocatore ${P.id+1}</div><div class="th-lapn">Pronti</div><div class="th-big">0:00,00</div>
    <dl><dt>Ultimo</dt><dd class="v-last">—</dd><dt>Migliore</dt><dd class="v-best">—</dd><dt>Ideale</dt><dd class="v-ideal">—</dd><dt class="v-wetk">Pista</dt><dd class="v-wet">—</dd></dl><div class="th-delta"></div></div>
    <canvas class="th-card th-map" width="380" height="380" aria-label="Mappa del circuito"></canvas>
    ${P.id===0?'<div class="th-card th-stand" hidden></div>':''}
    <div class="th-card th-pos" hidden><b class="v-pos">1°</b><small class="v-of"></small><span class="v-gap"></span></div>
    <div class="th-card th-speed"><div class="g-tyres" title="Aderenza delle quattro gomme"><i></i><i></i><i></i><i></i></div><div class="g-led">${'<i></i>'.repeat(10)}</div><div class="g-dial"><svg class="g-svg" viewBox="0 0 210 210" aria-hidden="true"><defs><linearGradient id="gG${P.id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#36d1ff"/><stop offset=".7" stop-color="#ffffff"/><stop offset="1" stop-color="#ff4b2b"/></linearGradient></defs><circle class="g-disc" cx="105" cy="105" r="100"/><path class="g-track" d="M42.8 167.2 A88 88 0 1 1 167.2 167.2"/><path class="g-red" d="M191.3 122.2 A88 88 0 0 1 167.2 167.2"/><path class="g-fill" d="M42.8 167.2 A88 88 0 1 1 167.2 167.2" pathLength="100" stroke="url(#gG${P.id})"/><g class="g-tick"><line x1="52.7" y1="157.3" x2="45.6" y2="164.4"/><text x="61.9" y="152.1">0</text><line class="mn" x1="35.3" y1="142.2" x2="30.9" y2="144.6"/><line x1="32.4" y1="119.4" x2="22.6" y2="121.4"/><text x="45.2" y="120.9">1</text><line class="mn" x1="26.4" y1="97.3" x2="21.4" y2="96.8"/><line x1="36.6" y1="76.7" x2="27.4" y2="72.9"/><text x="48.6" y="85.7">2</text><line class="mn" x1="43.9" y1="54.9" x2="40.1" y2="51.7"/><line x1="63.9" y1="43.5" x2="58.3" y2="35.2"/><text x="71.1" y="58.3">3</text><line class="mn" x1="82.1" y1="29.4" x2="80.6" y2="24.6"/><line x1="105.0" y1="31.0" x2="105.0" y2="21.0"/><text x="105.0" y="48.0">4</text><line class="mn" x1="127.9" y1="29.4" x2="129.4" y2="24.6"/><line x1="146.1" y1="43.5" x2="151.7" y2="35.2"/><text x="138.9" y="58.3">5</text><line class="mn" x1="166.1" y1="54.9" x2="169.9" y2="51.7"/><line x1="173.4" y1="76.7" x2="182.6" y2="72.9"/><text x="161.4" y="85.7">6</text><line class="mn" x1="183.6" y1="97.3" x2="188.6" y2="96.8"/><line x1="177.6" y1="119.4" x2="187.4" y2="121.4"/><text x="164.8" y="120.9">7</text><line class="mn" x1="174.7" y1="142.2" x2="179.1" y2="144.6"/><line x1="157.3" y1="157.3" x2="164.4" y2="164.4"/><text x="148.1" y="152.1">8</text></g><text class="g-x" x="105" y="160">×1000 giri</text></svg><div class="g-mid"><span class="v-gear">N</span><span class="v-kmh">0</span><small>km/h</small></div>
      <div class="th-bars"><span><i class="v-thr"></i></span><span><i class="v-brk"></i></span></div></div><div class="v-surf"></div><div class="g-info"><div class="v-tire"></div><div class="v-aero"></div></div></div>
    <div class="th-wake" hidden></div>
    <div class="th-card th-pit" hidden><div class="pt-h"></div><div class="pt-b">${TRK_TIRES.map((t,k)=>`<button data-t="${k}"><b>${k+1}</b> ${t.n}</button>`).join('')}</div></div>
    <div class="th-card th-toast" hidden></div>`;
  trkHud.insertBefore(r,trkHud.firstChild);
  const q=s=>r.querySelector(s);
  P.el={root:r,lapN:q('.th-lapn'),cur:q('.th-big'),last:q('.v-last'),best:q('.v-best'),ideal:q('.v-ideal'),wet:q('.v-wet'),wetk:q('.v-wetk'),delta:q('.th-delta'),map:q('.th-map'),stand:q('.th-stand'),pos:q('.th-pos'),posN:q('.v-pos'),posOf:q('.v-of'),gap:q('.v-gap'),
    kmh:q('.v-kmh'),gear:q('.v-gear'),fill:q('.g-fill'),tyres:[...r.querySelectorAll('.g-tyres i')],leds:[...r.querySelectorAll('.g-led i')],ledBox:q('.g-led'),thr:q('.v-thr'),brk:q('.v-brk'),aero:q('.v-aero'),tire:q('.v-tire'),surf:q('.v-surf'),wake:q('.th-wake'),pit:q('.th-pit'),pitH:q('.pt-h'),toast:q('.th-toast')};
  P.el.ctx=P.el.map.getContext('2d');
  r.querySelectorAll('.pt-b button').forEach(b=>b.onclick=()=>{trkPitChoose(P,+b.dataset.t);});
}
trkHudBuild(TRK.p[1]);trkHudBuild(TRK.p[0]);
/* riquadro del box: mescola scelta, fase della sosta */
function trkPitUI(){
  for(const P of [TRK.p[0],TRK.p[1]]){const E=P.el;if(!E)continue;const show=TRK.on&&(P.pitReq||!!P.pit);E.pit.hidden=!show;if(!show)continue;
    const sel=P.pit?P.pit.tire:P.pitTire;E.pit.querySelectorAll('.pt-b button').forEach((b,k)=>b.classList.toggle('on',k===sel));
    E.pit.classList.toggle('locked',!!P.pit&&P.pit.ph!=='in'&&P.pit.ph!=='lane');}
}
function trkPitHud(P){
  const E=P.el,S=P.pit;if(E.pit.hidden)return;
  const hasPad=!!trkPadFor(P.id);E.pitH.textContent=!S?`Box alla prossima entrata · ${hasPad?'X: cambia gomme o annulla, croce ← → per sceglierle':P.id===0?(document.documentElement.classList.contains('touchy')?'tocca Box per annullare':'B annulla, 1–4 gomme'):'punto: cambia gomme o annulla'}`:S.ph==='in'?'Entrata box: rallenta fino a 60 km/h':S.ph==='lane'?'Corsia box · limitatore 60 km/h':S.ph==='stop'?`Sosta · ${dec(Math.max(0,S.t),1)} s`:'Uscita box';
}
let thMapImg=null,thMapTf=null;
function trkMapPrep(W,H){
  const T=TRK.T;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let i=0;i<T.N;i++){x0=Math.min(x0,T.X[i]);x1=Math.max(x1,T.X[i]);y0=Math.min(y0,T.Y[i]);y1=Math.max(y1,T.Y[i]);}
  const s=Math.min((W-30)/(x1-x0),(H-30)/(y1-y0)),ox=W/2-s*(x0+x1)/2,oy=H/2+s*(y0+y1)/2;thMapTf=(X,Y)=>[ox+s*X,oy-s*Y];
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.lineJoin='round';
  const path=()=>{g.beginPath();for(let i=0;i<=T.N;i+=3){const [x,y]=thMapTf(T.X[i%T.N],T.Y[i%T.N]);i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();};
  path();g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=10;g.stroke();path();g.strokeStyle='rgba(240,242,244,.92)';g.lineWidth=5;g.stroke();
  /* corsia dei box */
  const Pd=TRK.pit;if(Pd){g.beginPath();for(let q=Pd.qIn;q<=Pd.qOut;q+=3){const boxQ=null,o=trkPitOff(q,TRK.T.w/2-1,Pd.qIn,boxQ),b=Math.floor(q),i=((b%T.N)+T.N)%T.N;const [x,y]=thMapTf(T.X[i]+o*T.nx[i],T.Y[i]+o*T.ny[i]);q===Pd.qIn?g.moveTo(x,y):g.lineTo(x,y);}g.strokeStyle='rgba(240,242,244,.5)';g.lineWidth=2.5;g.stroke();}
  const [sx,sy]=thMapTf(T.X[0],T.Y[0]);g.fillStyle='#c4261d';g.fillRect(sx-2,sy-8,4,16);
  thMapImg=c;
}
function trkTireCls(T,ti){const t=TRK_TIRES[ti==null?TRK.tire:ti];return T<t.Tc-t.hw*0.75?'cold':T>t.Tc+t.hw*0.75?'hot':'ok';}
function trkWetText(){const w=TRK.wet,r=TRK.rain;return (w<0.05?'asciutta':w<0.4?`umida ${Math.round(w*100)} %`:`bagnata ${Math.round(w*100)} %`)+(r>0.3?' · piove':TRK.dryLine>0.25&&w>0.1?' · linea asciutta':'');}
function trkHudUpdate(P){
  const c=P.car,L=P.lap,S=P.sim,E=P.el,R=TRK.race,racing=TRK.duo&&R.state!=='off';
  E.kmh.textContent=Math.round(P.kmh);
  const gb=trkGb(P);E.gear.textContent=c.vx<-0.3?'R':gb.g;
  E.thr.style.transform=`scaleY(${P.thr.toFixed(2)})`;E.brk.style.transform=`scaleY(${P.brk.toFixed(2)})`;
  trkDial(P,gb.rpm||0);
  const A=P.veh.aero(Math.abs(c.vx)),down=(A.Ff+A.Fr)*(1-0.55*P.wk)/9.81;
  E.aero.innerHTML=`<span>${down>=0?'Deportanza':'Portanza'} <b>${fmt(Math.abs(down))} kg</b></span><span>Resistenza <b>${fmt(A.D*(1-0.42*P.wk)/9.81)} kg</b></span><span>Laterale <b>${dec(Math.abs(c.ay)/9.81,2)} g</b></span>`;
  E.tire.innerHTML=`<span class="tw-c">${TRK_TIRES[P.tire].n}</span><span class="tw ${trkTireCls(P.Tf,P.tire)}">ant. <b>${Math.round(P.Tf)}°</b>${TRK.wearMode?` · ${Math.round(100-P.Wf*100)}%`:''}</span><span class="tw ${trkTireCls(P.Tr,P.tire)}">post. <b>${Math.round(P.Tr)}°</b>${TRK.wearMode?` · ${Math.round(100-P.Wr*100)}%`:''}</span><span class="tw ${(P.bT||0)>900?'hot':(P.bT||0)>300?'ok':'cold'}">freni <b>${Math.round(P.bT||0)}°</b></span>`;
  const cur=L.run?TRK.clock-L.t0:null;
  if(racing){E.cur.textContent=R.state==='count'?'Semaforo':fmtLap(P.finished!=null?P.finished:R.clock);
    E.lapN.textContent=R.state==='count'?`Gara · ${R.laps} ${R.laps===1?'giro':'giri'}`:P.finished!=null?'Arrivato':`Giro ${Math.min(R.laps,P.lapsDone+1)} di ${R.laps}`;}
  else{E.cur.textContent=L.run?fmtLap(cur):'Giro di lancio';
    E.lapN.textContent=L.run?`Giro ${L.n}${L.valid?'':' · non valido'}`:(P.id===0&&TRK.mode==='auto'&&!TRK.duo?'Simulatore':'Pronti');}
  E.last.textContent=fmtLap(L.last);E.best.textContent=fmtLap(L.best);E.ideal.textContent=fmtLap(S.lap);
  const showWet=TRK.weather!==0;E.wet.hidden=E.wetk.hidden=!showWet;if(showWet)E.wet.textContent=trkWetText();
  if(L.run&&cur>1.5&&!racing){const dlt=cur-S.t[c.i];E.delta.textContent=`${dlt>=0?'+':'−'}${dec(Math.abs(dlt),2)} s sul giro ideale`;E.delta.className='th-delta '+(dlt>0.05?'slow':'fast');}else E.delta.textContent='';
  /* dossi, salti, superficie */
  E.surf.textContent=P.yellow&&!P.pit?'⚑ Bandiera gialla: rallenta, non sorpassare':P.pit?'Corsia box':P.air?'In volo!':P.gm<0.8?`Dosso: carico sulle gomme ${Math.round(P.gm*100)} %`:P.gm>1.25?`Compressione: carico ${Math.round(P.gm*100)} %`:P.surf==='asfalto'?(P.spin?'Ruote che pattinano':''):P.surf[0].toUpperCase()+P.surf.slice(1);
  /* scia */
  const wk=P.wk>0.12;E.wake.hidden=!wk;if(wk)E.wake.textContent=`In scia: resistenza −${Math.round(42*P.wk)} %${Math.abs(A.Ff+A.Fr)>300?` · deportanza −${Math.round(55*P.wk)} %`:''}`;
  trkPitHud(P);
  /* posizione e distacco in gara */
  const live=racing&&R.state!=='count',n=TRK.cars.length;E.pos.hidden=!live;
  if(live){const ord=TRK.cars.slice().sort((a,b)=>trkProg(b)-trkProg(a)),k=ord.indexOf(P),solo=n===2&&TRK.ai;
    E.posN.textContent=`${k+1}°`;E.posOf.textContent=n>2?`/${n}`:'';
    let txt='';if(P.finished==null){if(k===0&&ord[1]&&ord[1].finished==null){const g=trkGap(ord[1],P);if(g!=null&&g>0.05)txt=`+${dec(g,2)} s ${solo?'sul computer':'sul 2°'}`;}
      else if(k>0&&ord[k-1].finished==null){const g=trkGap(P,ord[k-1]);if(g!=null&&g>0.05)txt=`−${dec(g,2)} s ${solo?'dal computer':`dal ${k}°`}`;}}
    E.gap.textContent=txt;
    /* classifica a torre */
    if(E.stand){const sh=n>2&&!TRK.split;E.stand.hidden=!sh;if(sh){const L0=ord[0];
      E.stand.innerHTML=ord.map((Q,j)=>{let g='';if(j>0){if(Q.finished!=null&&L0.finished!=null)g=`+${dec(Q.finished-L0.finished,1)}`;else{const lp=L0.lapsDone-Q.lapsDone-(Q.car.i>L0.car.i&&L0.lapsDone>Q.lapsDone?1:0);const t=lp>=1?null:trkGap(Q,L0);g=lp>=1?`+${lp}G`:t!=null?`+${dec(t,1)}`:'';}}else g=R.state==='run'?'Leader':'';
        return `<div class="${Q.isAI?'':'me'}${Q.pit?' inpit':''}"><b>${j+1}</b><i style="background:${Q.color}"></i><span>${Q.isAI?(Q.dname||'#'+Q.num+' '+trkCarName(Q.key).split(' ')[0]):Q.label}</span><em>${Q.pit?'BOX':g}</em></div>`;}).join('');}}}
  else if(E.stand)E.stand.hidden=true;
  /* minimappa con tutte le auto e il giro ideale */
  const cv=E.map,g=E.ctx;if(!thMapImg)trkMapPrep(cv.width,cv.height);
  g.clearRect(0,0,cv.width,cv.height);g.drawImage(thMapImg,0,0);
  if(L.run&&!racing){const tt=TRK.clock-L.t0;let lo=0,hi=S.t.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(S.t[m]<=tt)lo=m;else hi=m;}
    if(tt<S.lap){const [gx,gy]=thMapTf(TRK.RL.X[lo%TRK.T.N],TRK.RL.Y[lo%TRK.T.N]);g.fillStyle='rgba(120,200,255,.95)';g.beginPath();g.arc(gx,gy,6,0,7);g.fill();}}
  const dot=(Q,r,lw)=>{const [x,y]=thMapTf(Q.car.X,Q.car.Y);g.fillStyle=Q.color;g.strokeStyle='#fff';g.lineWidth=lw;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();};
  for(const Q of TRK.cars)if(Q!==P)dot(Q,Q.isAI?5:6,1.5);dot(P,8,2.5);
}
