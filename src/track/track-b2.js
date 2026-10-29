/* =========================================================
   Entrare e uscire dalla pista
   ========================================================= */
const trkHud=document.getElementById('trkHud');
const studio={};
function trkSetPlayers(v){TRK.players=v;TRK.duo=v!==1;TRK.split=v===2;TRK.ai=v==='ai';}
function trkStart(){
  trkEnsureData();
  if(state.aero){setAero(false);setPressed('tAero',false);document.getElementById('tAero').textContent='Accendi la galleria del vento';}
  if(G3.active)g3Stop();
  for(const [k,id] of [['doors','tDoors'],['explode','tExplode'],['hood','tHood']]){state[k]=false;setPressed(id,false);}
  if(state.cut){cutByCfd=false;setCut(false);}
  busy.hidden=false;trkLoadScreen(true);
  setTimeout(()=>{
    trkBuildWorld();trkCarDetails();
    trkWxPreset();TRK.on=true;trkCompute();
    if(!TRK.carLit){TRK.carLit=true;[paintBody,paint,paintDouble,roofPaint].forEach(trkCarLightPatch);}
    trkSetupField();
    Object.assign(studio,{bg:scene.background,fog:scene.fog,env:scene.environment,far:camera.far,near:camera.near,fov:camera.fov,keyI:key.intensity,rimI:rimLight.intensity,exp:renderer.toneMappingExposure,lights:state.lights});
    scene.fog=trkFog;camera.far=6000;rimLight.intensity=0.2;trkHemi.visible=true;
    trkShadowCfg(true);
    ground.visible=false;grid.visible=false;trkWorld.visible=true;
    TRK_DETAIL.forEach(o=>{if(o.isSprite)return;o.visible=true;});
    discMat.emissive.set(0xff3300);discMat.emissiveIntensity=0;
    trkLabDecalsP1();trkSpotPlace(trkSpot1,state.lab?LAB:null);trkGhostBuild();
    trkAtmo();trkPostOn();
    controls.enabled=false;controls.autoRotate=false;intro=false;camTween=null;
    const H=document.documentElement;H.classList.add('racing');H.classList.toggle('duo',TRK.split);H.classList.toggle('vsai',TRK.ai);H.classList.toggle('field',TRK.cars.length>2&&!TRK.split);trkHud.hidden=false;
    TRK.p[1].el.root.hidden=!TRK.split;TRK.paused=false;document.getElementById('thPause').hidden=true;document.documentElement.classList.remove('paused');
    skidN=0;skidHead=0;skidGeo.setDrawRange(0,0);smkA0.fill(0);smkA.fill(0);TRK.rec=[];TRK.recT=0;TRK.clock=0;
    for(const P of TRK.cars)Object.assign(P,{dirt:0,bT:30,yellow:false,Tf:45,Tr:45,Wf:0,Wr:0,wk:0,air:false,pit:null,pitReq:false,pitTire:-1,stops:0,lapsDone:0,finished:null});
    if(TRK.duo&&TRK.race.laps>0)trkRaceSetup();
    else{TRK.race.state='off';TRK.cars.forEach((P,k)=>trkReset(P,true,k));}
    trkWxPlan();
    document.getElementById('thLights').hidden=TRK.race.state!=='count';document.getElementById('thRace').hidden=true;
    const b=document.getElementById('trkGo');b.setAttribute('aria-pressed','true');b.textContent='Esci dalla pista';
    if(!engine.on)document.getElementById('tEngine').click();
    if(TRK.duo&&!trkVoice2)trkVoice2=trkMakeVoice(0.6);
    if(TRK.cars.length>2&&!trkVoice3)trkVoice3=trkMakeVoice(-0.3);
    if(trkVoice2&&trkVoice2.pn)trkVoice2.pn.pan.value=TRK.split?0.6:0;
    trkSfxInit();trkPitUI();
    busy.hidden=true;trkLoadScreen(false);resize();
  },30);
}
function trkStop(){
  if(!TRK.on)return;if(TRK.replay.on)trkReplayStop();TRK.paused=false;document.getElementById('thPause').hidden=true;TRK.on=false;TRK.race.state='off';trkHorn(false);
  scene.background=studio.bg;scene.fog=studio.fog;scene.environment=studio.env;camera.far=studio.far;camera.near=studio.near;camera.fov=studio.fov;camera.updateProjectionMatrix();
  key.intensity=studio.keyI;key.color.setHex(0xffffff);rimLight.intensity=studio.rimI;trkHemi.visible=false;renderer.toneMappingExposure=studio.exp;
  trkShadowCfg(false);TRK_NIGHT.value=0;
  Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20});key.shadow.camera.updateProjectionMatrix();key.position.set(4,8,3);key.target.position.set(0,0,0);
  ground.visible=true;grid.visible=true;trkWorld.visible=false;TRK.p.forEach(P=>{if(P.rig&&P.id>0)P.rig.visible=false;if(P.crew)P.crew.visible=false;});
  if(TRK.p[0].halo)TRK.p[0].halo.visible=false;
  trkP1Restore();
  TRK_DETAIL.forEach(o=>o.visible=false);discMat.emissiveIntensity=0;trkSpot1.intensity=0;trkSpot2.intensity=0;
  state.lights=studio.lights;setPressed('tLights',state.lights);TRK_NIGHT.value=0;
  if(TRK.labDecals)TRK.labDecals.forEach(o=>o.visible=false);
  if(TRK.wipers)trkWipe(TRK.wipers,0);
  rig.position.set(0,0,0);rig.rotation.set(0,0,0);labG.rotation.set(0,0,0);
  labG.children.filter(o=>o.isGroup).forEach(w=>w.rotation.set(0,0,0));
  state.steer=0;steerEl.value=0;steerOut.textContent='0°';resetDynamics();
  for(const v of [trkVoice2,trkVoice3])if(v)trkVoiceUpdate(v,0,0,false);
  trkSfxStop();trkPostOff();
  controls.enabled=true;document.documentElement.classList.remove('racing','panel-open','duo','duo-v','vsai','replaying','field','paused');trkHud.hidden=true;
  renderer.setScissorTest(false);
  camera.position.set(5.8,2.3,5.8);controls.target.set(0,0.55,0);goView('ext');
  const b=document.getElementById('trkGo');b.setAttribute('aria-pressed','false');b.textContent=trkGoLabel();
  resize();
}
function trkGoLabel(){return TRK.players===2?'Inizia la gara a due':TRK.ai?'Sfida il computer':'Scendi in pista';}
/* rimette un'auto in pista: in griglia (piazzola «slot»), dove era uscita, o lanciata sul traguardo per il giro ideale */
function trkReset(P,grid,slot){
  const T=TRK.T,N=T.N,c=P.car;if(P.pit&&!grid)return;P.pit=null;
  if(P.id===0&&!TRK.duo&&TRK.mode==='auto'){P.auto=0;const v=P.sim.v[0];Object.assign(c,{X:TRK.RL.X[0],Y:TRK.RL.Y[0],psi:Math.atan2(TRK.RL.ty[0],TRK.RL.tx[0]),vx:v,vy:0,r:0,delta:0,ax:0,ay:0,i:0});
    Object.assign(P.lap,{run:true,t0:TRK.clock,cp:0,valid:true,n:1,spd:new Float32Array(N)});}
  else{let i,off=-2;
    if(grid){if(TRK.duo){const k=slot==null?P.id:slot;i=(N-5-4*k)%N;off=k%2?-3:3;}else i=(N-25)%N;}
    else i=(trkLocateAll(c.X,c.Y)-8+N)%N;
    Object.assign(c,{X:T.X[i]+T.nx[i]*off,Y:T.Y[i]+T.ny[i]*off,psi:Math.atan2(T.ty[i],T.tx[i]),vx:0,vy:0,r:0,delta:0,ax:0,ay:0,i,d:off});
    P.thr=0;P.brk=0;P.steerIn=0;P.skid=[null,null];P.stuckT=0;P.aiOff=off-TRK.RL.e[i];trkWheelSync(P);P.rpm=1000;
    if(grid)Object.assign(P.lap,{run:false,n:0,valid:true,cp:0});else P.lap.valid=false;}
  P.zc=T.h[c.i];P.wz=0;P.air=false;P.ptc=0;
  P.camYaw=c.psi;P.camPos=null;if(P.id===0)resetDynamics();
  if(grid&&!TRK.duo)trkToast(P,TRK.mode==='auto'?'Giro ideale: guida il simulatore sulla traiettoria migliore':'Giro di lancio: il tempo parte quando passi il traguardo');
}
function trkToast(P,t,dur){if(P.isAI||!P.el)return;const el=P.el.toast;el.textContent=t;el.hidden=false;P.toastT=(dur||3.2);}

/* ---------- gara: semaforo, giri, posizioni, arrivo ---------- */
/* in griglia le auto del computer sono in ordine di passo; tu (e il secondo giocatore) a metà schieramento */
function trkGridOrder(){
  const ai=TRK.cars.filter(P=>P.isAI).sort((a,b)=>b.pace-a.pace),hum=TRK.cars.filter(P=>!P.isAI);
  ai.splice(Math.floor(ai.length/2),0,...hum);return ai;
}
function trkRaceSetup(){
  const R=TRK.race;
  trkGridOrder().forEach((P,k)=>{trkReset(P,true,k);Object.assign(P.lap,{run:false,n:0,valid:true,cp:0,last:null,best:null,lastSpd:null});
    Object.assign(P,{lapsDone:0,finished:null,cpT:{},lastKey:null,heat:0,Tf:50,Tr:50,Wf:0,Wr:0,pit:null,pitReq:false,pitTire:-1,stops:0,pos:k+1,lastPos:k+1,posT:0});
    if(P.crew)P.crew.visible=false;});
  Object.assign(R,{state:'count',t:0,go:4.5+Math.random()*0.9,clock:0,first:null,humDone:null});
  document.getElementById('thRace').hidden=true;document.getElementById('thLights').hidden=false;TRK.rec=[];
  if(TRK.weather===3){trkWxPreset();trkWxPlan();trkAtmo();}
}
function trkLamps(lit){if(TRK.lamps)TRK.lamps.forEach((m,k)=>m.emissiveIntensity=k<lit?3.2:0);document.querySelectorAll('#thLights i').forEach((e,k)=>e.classList.toggle('on',k<lit));}
function trkRaceUpdate(dt){
  const R=TRK.race;
  if(R.state==='count'){R.t+=dt;trkLamps(R.t<4?Math.floor(R.t/0.8):5);
    if(R.t>=R.go){R.state='run';R.clock=0;trkLamps(0);document.getElementById('thLights').hidden=true;TRK.cars.forEach(P=>trkToast(P,'Via!',1.6));trkCheer(1);}}
  else if(R.state==='run'){R.clock+=dt;
    /* posizioni: chi ha percorso più strada (o è arrivato prima) */
    const ord=TRK.cars.slice().sort((a,b)=>trkProg(b)-trkProg(a));
    ord.forEach((P,k)=>{const np=k+1;if(np!==P.pos){P.pos=np;P.posT=0;}else P.posT+=dt;
      if(!P.isAI&&P.posT>0.6&&P.lastPos!==P.pos&&P.finished==null&&TRK.cars.length>2){if(P.pos<P.lastPos){trkToast(P,`Sorpasso! Sei ${P.pos}°`,1.8);trkCheer(0.6);}P.lastPos=P.pos;}});
    const hum=TRK.cars.filter(P=>!P.isAI),allDone=TRK.cars.every(P=>P.finished!=null);
    if(R.humDone==null&&hum.length&&hum.every(P=>P.finished!=null))R.humDone=R.clock;
    if(allDone||(R.humDone!=null&&R.clock-R.humDone>6)||(R.first!=null&&R.clock-R.first>60))trkRaceEnd();}
}
function trkProg(P){const N=TRK.T.N;if(P.finished!=null)return 1e6-P.finished;return P.lap.run?P.lapsDone+P.car.i/N:(P.car.i-N)/N;}
/* distacco in secondi tra chi sta dietro (B) e chi sta davanti (A): da quando A è passato dall'ultimo punto di controllo di B */
function trkGap(B,A){const R=TRK.race,t=B.lastKey!=null?A.cpT[B.lastKey]:null;return t!=null?R.clock-t:null;}
function trkRaceEnd(){
  const R=TRK.race;R.state='done';trkCheer(1);
  const ord=TRK.cars.slice().sort((a,b)=>{if(a.finished!=null&&b.finished!=null)return a.finished-b.finished;if(a.finished!=null)return -1;if(b.finished!=null)return 1;return trkProg(b)-trkProg(a);});
  const W=ord[0],me=TRK.p[0],myPos=ord.indexOf(me)+1,nm=P=>P.isAI?(TRK.cars.length===2?'Computer':P.label):P.label;
  const title=TRK.split?(W.isAI?`Vince ${W.label}`:`Vince il ${W.label}`):(W===me?'Hai vinto!':TRK.cars.length===2?'Vince il computer':`Arrivi ${myPos}°`);
  const res=P=>{if(P.finished!=null)return P===W?fmtLap(P.finished):`+${dec(P.finished-W.finished,2)} s`;const lp=W.lapsDone-P.lapsDone;return lp>=1?`+${lp} ${lp===1?'giro':'giri'}`:'in pista';};
  const fl=TRK.cars.filter(P=>P.lap.best!=null).sort((a,b)=>a.lap.best-b.lap.best)[0];
  const el=document.getElementById('thRace'),champ=TRK.champRace&&typeof CH!=='undefined'&&CH?trkChampResult(ord,fl):null;
  el.innerHTML=`<div class="tr-k">${champ!=null?`Coppa Vespera · gara ${CH.round} di ${CH_ROUNDS.length}`:`Arrivo · ${R.laps} ${R.laps===1?'giro':'giri'}`}</div><h3>${title}</h3>${!TRK.split&&W!==me&&TRK.cars.length>2?`<p class="tr-sub">Vince ${W.label}</p>`:''}
    <table class="tr-tab"><tbody>${ord.map((P,k)=>`<tr class="${P.isAI?'':'me'}"><td>${k+1}°</td><td><i style="background:${P.color}"></i>${nm(P)}${P.isAI&&P.ch&&TRK.aiChar?`<small> · ${P.ch.n}${P.errs?`, ${P.errs} ${P.errs===1?'errore':'errori'}`:''}</small>`:''}</td><td>${res(P)}</td><td>${P.stops?`${P.stops} ${P.stops===1?'sosta':'soste'}`:''}</td></tr>`).join('')}</tbody></table>
    <dl><dt>Giro più veloce</dt><dd>${fl?`${fmtLap(fl.lap.best)} · ${nm(fl)}`:'—'}</dd></dl>
    ${champ||''}
    <div class="tr-b">${champ!=null?'<button id="thChampBack">Campionato</button>':'<button id="thRematch">Rivincita</button>'}<button id="thRaceReplay">Rivedi la gara</button><button id="thRaceExit">Esci</button></div>`;
  el.hidden=false;
  if(champ!=null)document.getElementById('thChampBack').onclick=()=>{trkStop();chHub(true);};
  else document.getElementById('thRematch').onclick=()=>{el.hidden=true;trkRaceSetup();};
  document.getElementById('thRaceReplay').onclick=()=>{el.hidden=true;trkReplayStart();};
  document.getElementById('thRaceExit').onclick=()=>trkStop();
}

/* =========================================================
   Comandi: da solo o contro il computer WASD e frecce guidano la tua auto; in due G1 WASD, G2 frecce.
   B (G1) o punto (G2) chiedono il box; 1–4 scelgono la mescola
   ========================================================= */
const TRK_K1={KeyW:'gas',KeyS:'brake',KeyA:'left',KeyD:'right',KeyV:'back'},TRK_K2={ArrowUp:'gas',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right'};
window.addEventListener('keydown',e=>{
  if(!TRK.on)return;let k=TRK_K1[e.code],pi=0;if(!k){k=TRK_K2[e.code];pi=TRK.split?1:0;}
  const blur=()=>{if(document.activeElement&&document.activeElement.blur&&document.activeElement!==document.body)document.activeElement.blur();};
  if(k){TRK.keys[pi][k]=true;e.preventDefault();blur();return;}
  if(e.code==='Escape'&&!TRK.replay.on){trkPause(!TRK.paused);e.preventDefault();return;}
  if(TRK.paused)return;
  if(e.code==='KeyP'){TRK.replay.on?trkReplayStop():trkReplayStart();e.preventDefault();return;}
  if(TRK.replay.on){if(e.code==='Space'){TRK.replay.paused=!TRK.replay.paused;e.preventDefault();}else if(e.code==='Escape'){trkReplayStop();e.preventDefault();}return;}
  if(e.code==='KeyC'){trkCycleCam(TRK.p[0]);e.preventDefault();}
  else if(e.code==='KeyR'){trkReset(TRK.p[0],false);e.preventDefault();}
  else if(e.code==='KeyB'){trkPitToggle(TRK.p[0]);e.preventDefault();}
  else if(/^Digit[1-4]$/.test(e.code)&&(TRK.p[0].pitReq||TRK.p[0].pit)){trkPitChoose(TRK.p[0],+e.code.slice(5)-1);e.preventDefault();}
  else if(TRK.split&&(e.code==='Period'||e.code==='NumpadDecimal')){trkPitCycle(TRK.p[1]);e.preventDefault();}
  else if(TRK.split&&e.code==='ShiftRight'){trkCycleCam(TRK.p[1]);e.preventDefault();}
  else if(TRK.split&&(e.code==='Enter'||e.code==='NumpadEnter')){trkReset(TRK.p[1],false);e.preventDefault();blur();}
});
window.addEventListener('keyup',e=>{let k=TRK_K1[e.code];if(k){TRK.keys[0][k]=false;return;}k=TRK_K2[e.code];if(k){TRK.keys[0][k]=false;TRK.keys[1][k]=false;}});
window.addEventListener('blur',()=>{TRK.keys=[{},{}];TRK.touch={};});
document.querySelectorAll('#thTouch button').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();TRK.touch[k]=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{TRK.touch[k]=false;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);
  b.addEventListener('contextmenu',e=>e.preventDefault());});
if(window.matchMedia('(pointer: coarse)').matches)document.documentElement.classList.add('touchy');
window.addEventListener('touchstart',()=>document.documentElement.classList.add('touchy'),{once:true,passive:true});
const TRK_CAMS=[{n:'Dietro',v:'chase'},{n:'Vicina',v:'near'},{n:'Abitacolo',v:'cockpit'},{n:'Dall\'alto',v:'heli'}];
function trkCycleCam(P){const i=TRK_CAMS.findIndex(c=>c.v===P.cam);trkSetCam(P,TRK_CAMS[(i+1)%TRK_CAMS.length].v);}
function trkSetCam(P,v){P.cam=v;P.camPos=null;if(P.id===0){document.querySelectorAll('#trkCam button').forEach((b,i)=>b.setAttribute('aria-pressed',TRK_CAMS[i].v===v));trkSavePrefs();}}
function trkInputs(P,dt){
  const K=TRK.keys[P.id];let gas=K.gas?1:0,brk=K.brake?1:0,st=(K.left?1:0)-(K.right?1:0),analog=false;
  if(P.id===0){const Tc=TRK.touch;if(Tc.gas)gas=1;if(Tc.brake)brk=1;st=clamp(st+(Tc.left?1:0)-(Tc.right?1:0),-1,1);}
  const acc={gas,brk,st,analog};trkPadDrive(P,dt,acc);gas=acc.gas;brk=acc.brk;st=acc.st;analog=acc.analog;P.lookBack=P.lookBack||!!K.back;
  P.thr+=clamp(gas-P.thr,-6*dt,4*dt);P.brk+=clamp(brk-P.brk,-8*dt,6*dt);
  /* lo sterzo da tastiera arriva in modo graduale, come girando il volante */
  const rate=analog?7:(Math.sign(st)!==Math.sign(P.steerIn)&&P.steerIn!==0?5:2.4);
  P.steerIn+=clamp(st-P.steerIn,-rate*dt,rate*dt);
}

/* =========================================================
   Gomme: temperatura (finestra di lavoro) e usura per asse; acqua sulla pista
   ========================================================= */
function trkTireF(T,W,ti){const t=TRK_TIRES[ti==null?TRK.tire:ti],x=(T-t.Tc)/t.hw;return (0.9+0.1*Math.exp(-x*x))*(1-0.2*W);}
/* velo d'acqua in quel punto: sulla traiettoria che si asciuga ce n'è meno */
function trkWetAt(i,d){const w=TRK.wet;if(w<=0.001)return 0;const e=d-TRK.RL.e[i];return w*(1-TRK.dryLine*Math.exp(-e*e/2.6));}

/* =========================================================
   Dinamica di guida: modello a bicicletta con gomme non lineari, carichi aerodinamici, trasferimenti di carico,
   pendenze e dossi, scia, temperatura e usura delle gomme, aderenza del bagnato
   ========================================================= */
const MFf=a=>Math.sin(TIRE.C*Math.atan(TIRE.Bf*a)),MFr=a=>Math.sin(TIRE.C*Math.atan(TIRE.Br*a));
/* gomma in senso longitudinale: forza in funzione dello scorrimento (slip ratio), picco verso l'11 %; oltre cala fino a circa tre quarti (ruota che pattina o bloccata) */
const TIRE_X={B:17,C:1.45},MFx=k=>Math.sin(TIRE_X.C*Math.atan(TIRE_X.B*k)),KX_PEAK=Math.tan(Math.PI/(2*TIRE_X.C))/TIRE_X.B;
/* motore e cambio: curva di potenza con picco a 7000 giri e limitatore a 7800, sette marce scalate sulla velocità massima dell'auto */
function trkGearing(V){
  if(V._gear)return V._gear;const P=V.kw*1000*0.92,f=v=>P-(V.aero(v).D+0.012*V.m*9.81)*v;let lo=5,hi=160;
  for(let it=0;it<50;it++){const v=(lo+hi)/2;if(f(v)>0)lo=v;else hi=v;}
  const vtop=Math.min(lo*1.05,105),vr=[];for(let g=0;g<7;g++)vr.push(vtop*Math.pow(0.27,(6-g)/6)*1.02);
  return V._gear={vr,peak:7000,max:7800,idle:1000};
}
/* ruote, gomme e cambio allineati alla velocità quando l'auto si muove senza fisica (partenza, box, simulatore, reset) */
function trkWheelSync(P){const c=P.car,v=c.vx;P.ur=P.uf=v;P.afl=P.arl=null;P.w=[v,v,v,v];P.wa=[0,0,0,0];P.tcR=P.absR=1;P.shiftT=0;
  const GR=trkGearing(P.veh);let g=1;while(g<7&&Math.max(0,v)/GR.vr[g-1]*GR.max>GR.peak*0.98)g++;P.gear=g;P.rpm=Math.max(GR.idle,Math.max(0,v)/GR.vr[g-1]*GR.max);}
function trkGb(P){return P.rpm&&!TRK.replay.on?{g:P.gear<0?'R':P.kmh<1&&P.thr<0.05?'N':P.gear,rpm:P.rpm}:gearbox(P.kmh);}
function trkEngP(V,rpm){const x=rpm/7000,f=x<1?1-0.85*(1-x)*(1-x):Math.max(0,1-3*(x-1)*(x-1));return V.kw*1000*f;}
/* =========================================================
   Dinamica di guida a quattro ruote. Ogni ruota ha il suo carico (peso, deportanza, trasferimenti in frenata e in curva
   con la ripartizione del rollio), la sua superficie (una ruota sull'erba o sul cordolo tira l'auto da quella parte),
   la sua deriva con il ritardo della carcassa e la sua velocità di rotazione: pattina, si blocca, e la forza longitudinale e
   quella laterale si dividono l'aderenza (scorrimento combinato normalizzato). Le gomme perdono aderenza relativa quando sono
   più caricate. Dietro un differenziale autobloccante a frizioni ripartisce la coppia. Motore con curva di potenza e cambio automatico.
   Con le assistenze: controllo di trazione e ABS ruota per ruota sullo scorrimento, controllo di stabilità sull'imbardata
   ========================================================= */
const TN_B=Math.tan(Math.PI/(2*TIRE.C)),APK_F=TN_B/TIRE.Bf,APK_R=TN_B/TIRE.Br;
const _wF=new Float64Array(4),_wG=new Float64Array(4),_wD=new Float64Array(4),_wFx=new Float64Array(4),_wFy=new Float64Array(4),_wVl=new Float64Array(4),_wTa=new Float64Array(4),_wMu=new Float64Array(4),_wCr=new Float64Array(4);
/* forza della gomma con scorrimento longitudinale k e tangente della deriva ta: un'unica curva sul modulo dello scorrimento normalizzato */
function trkTireCS(G,k,ta,apk,out,j){const sx=k/KX_PEAK,sy=ta/apk,s=Math.hypot(sx,sy);if(s<1e-9){out[0]=0;out[1]=0;return;}
  const F=G*Math.sin(TIRE.C*Math.atan(TN_B*s));out[0]=F*sx/s;out[1]=-F*sy/s;}
const _tf=[0,0],_tf2=[0,0];
/* aderenza di una gomma con carico Fz: cala in proporzione quando il carico cresce (come in axleGrip, così il simulatore e la fisica concordano) */
function trkWheelGrip(mu,Fz){if(Fz<=0)return 0;return mu*Math.max(Fz*(1-TIRE.ks*Fz/(2*TIRE.Fz0)*2),0.08*Fz);}
function trkPhysics(P,h){
  const spinning=P.errT>0&&P.errKind==='spin';
  const c=P.car,V=P.veh,m=V.m,g=9.81,a=V.lwb*(1-V.wf),b=V.lwb*V.wf,tw=V.track/2,Izz=m*a*b*1.05,T=TRK.T,i=c.i,assist=P.isAI?!spinning:TRK.assist;
  const al=Math.cos(c.psi-Math.atan2(T.ty[i],T.tx[i])),slope=T.sl[i]*al,tt=TRK_TIRES[P.tire],wl=trkWetAt(i,c.d);
  const aq=(1-tt.aq*smooth01(Math.abs(c.vx),50,78)*smooth01(wl,0.55,1)),wmu=(1-tt.wl*wl)*aq;
  const o=P.vo;o.mu=TRK_SURF[P.surf].mu*wmu;
  o.g=P.air?0.02:Math.max(0.02,Math.cos(Math.atan(slope))+c.vx*c.vx*T.kv[i]/g);
  /* aria: la scia toglie resistenza e carico; di traverso le ali stallano e la resistenza sale; in frenata il carico si sposta avanti */
  const beta0=Math.abs(c.vx)>3?Math.atan2(c.vy,Math.abs(c.vx)):0,yaw2=Math.min(0.25,beta0*beta0);
  o.ad=(1-0.42*P.wk)*(1+2.2*yaw2);o.al=(1-0.55*P.wk)*(1-1.6*yaw2);
  const pn=clamp(-c.ax/14,-0.4,1);o.bf=1+0.12*pn;o.br=1-0.08*pn;
  const mf=trkTireF(P.Tf,P.Wf,P.tire),mr=trkTireF(P.Tr,P.Wr,P.tire)*(spinning?0.5:1);o.mf=mf;o.mr=mr;
  const L=vehLoads(V,Math.abs(c.vx),c.ax,c.ay,o);
  if(P.air){L.Gf=0;L.Gr=0;}
  P.lastG=L.Gf+L.Gr;
  let thr=P.thr,brk=P.brk;
  let rev=false;if(brk>0.5&&thr<0.05&&c.vx<0.6){P.revT+=h;if(P.revT>0.45)rev=true;}else if(c.vx>0.5||thr>0.05)P.revT=0;
  const aLim=Math.max(1,(L.Gf+L.Gr)/m),dmax=assist?Math.min(0.52,V.lwb*aLim/Math.max(c.vx*c.vx,1)+TIRE_PEAK*1.35):0.52;
  c.delta+=clamp(P.steerIn*dmax-c.delta,-8.8*h,8.8*h);
  const d=c.delta;
  /* carichi sulle quattro ruote: assi da vehLoads, laterale ripartito con la rigidezza al rollio (un po' di più davanti) */
  const lamF=V.wf+0.03,dLat=m*c.ay*V.h/V.track,cp=Math.cos(c.psi),sp2=Math.sin(c.psi);
  P.wdist=(P.wdist||0)+Math.abs(c.vx)*h;if(!P.w)P.w=[c.vx,c.vx,c.vx,c.vx];if(!P.wa)P.wa=[0,0,0,0];if(!P.wsf)P.wsf=['asfalto','asfalto','asfalto','asfalto'];if(!P.absw)P.absw=[1,1,1,1];
  for(let k=0;k<4;k++){const fr=k<2,left=k%2===0,N=fr?L.Nf:L.Nr,dN=(fr?lamF:1-lamF)*dLat;
    let Fz=clamp(N/2+(left?-dN:dN),0,N);
    const xw=fr?a:-b,yw=left?tw:-tw,Xw=c.X+xw*cp-yw*sp2,Yw=c.Y+xw*sp2+yw*cp,dw=(Xw-T.X[i])*T.nx[i]+(Yw-T.Y[i])*T.ny[i];
    const sf=trkSurface(i,dw),S=TRK_SURF[sf];P.wsf[k]=sf;_wD[k]=dw;
    if(sf==='cordolo')Fz*=1+0.16*Math.sin(P.wdist*6.3+k*1.7);else if(sf!=='asfalto')Fz*=1+0.1*Math.sin(P.wdist*9.1+k*2.3)*Math.min(1,Math.abs(c.vx)/10);
    _wF[k]=P.air?0:Fz;_wMu[k]=V.mu*S.mu*wmu*(fr?mf:mr*TIRE.rear);_wCr[k]=S.crr;_wG[k]=trkWheelGrip(_wMu[k],_wF[k]);}
  /* velocità di ogni ruota nel suo piano (le anteriori sterzano, con un po' di Ackermann) */
  const vxs=Math.max(Math.abs(c.vx),0.5),sgn=c.vx>=0?1:-1,ack=0.07*Math.sign(d);
  for(let k=0;k<4;k++){const fr=k<2,left=k%2===0,xw=fr?a:-b,yw=left?tw:-tw,dk=fr?d*(1+(left?ack:-ack)):0;
    const vx=c.vx-c.r*yw,vy=c.vy+c.r*xw,cd=Math.cos(dk),sd=Math.sin(dk),vl=vx*cd+vy*sd,vt=-vx*sd+vy*cd;_wVl[k]=vl;
    const a0=Math.atan2(vt,Math.max(Math.abs(vl),0.5)),sig=fr?0.5:0.6;
    P.wa[k]+=(a0-P.wa[k])*Math.min(1,h*Math.max(Math.abs(vl),2)/sig);_wTa[k]=Math.tan(clamp(P.wa[k],-1.3,1.3));}
  /* motore, frizione e cambio */
  const GR=trkGearing(V);if(P.gear==null||P.gear===0)P.gear=1;if(P.shiftT==null){P.tcR=1;P.shiftT=0;P.rpm=1000;}
  const urA=(P.w[2]+P.w[3])/2;let Fd=0;
  if(rev){P.gear=-1;Fd=c.vx>-6?-m*g*0.35*brk:0;brk=0;P.rpm=1500+Math.abs(urA)*400;}
  else{if(P.gear<1)P.gear=1;
    const vr=GR.vr[P.gear-1],rw=Math.max(0,urA)/vr*GR.max;
    const rpm=Math.max(rw,thr>0.05?2500+1800*thr:GR.idle);P.rpm+=(Math.min(rpm,GR.max+150)-P.rpm)*Math.min(1,h*25);
    const rc=Math.max(0,c.vx)/vr*GR.max;P.upT=(P.upT||0)+h;
    if(P.shiftT>0){P.shiftT-=h;}
    else if(rw>GR.max*0.985&&rc>GR.max*0.84&&P.gear<7){P.gear++;P.shiftT=0.11;P.upT=0;P.shiftKick=1;if(thr>0.8)P.flame=Math.max(P.flame,0.08);}
    else if(P.gear>1&&P.upT>0.7&&rc<GR.peak*(brk>0.2?0.62:0.5)){P.gear--;P.shiftT=0.06;P.shiftKick=-0.6;if(brk>0.2)P.flame=Math.max(P.flame,0.05);}
    const ue=Math.max(urA,vr*Math.max(rpm,1)/GR.max,1);
    if(P.shiftT<=0)Fd=thr>0.02?thr*Math.min(trkEngP(V,Math.min(rpm,GR.max))*0.92/ue,m*g*1.4)*(rw>GR.max?0:1):-0.05*trkEngP(V,Math.max(rw,1500))/Math.max(ue,5)*(rw/GR.max);}
  const vref=k=>Math.max(Math.abs(_wVl[k]),3);
  /* controllo di trazione sulla ruota posteriore che scorre di più */
  const krMax=Math.max((P.w[2]-_wVl[2])/vref(2),(P.w[3]-_wVl[3])/vref(3));
  if(assist&&!rev){P.tcR=clamp(P.tcR+h*(krMax>KX_PEAK*1.05?-14:5),0.05,1);Fd*=P.tcR;}else P.tcR=1;
  /* freni ripartiti sull'aderenza degli assi, ABS ruota per ruota */
  const Breq=brk*(L.Gf+L.Gr)*1.1,sh=L.Gf/Math.max(L.Gf+L.Gr,1);
  const capF=P.air?0:1;
  /* ruote: integrazione implicita (le gomme sono rigide) con la massa equivalente all'inerzia di ruota, freno e trasmissione */
  for(let k=0;k<4;k++){const fr=k<2,vl=_wVl[k],vr0=vref(k),u=P.w[k],G=_wG[k]*capF,apk=fr?APK_F:APK_R;
    let Fb=Breq*(fr?sh:1-sh)/2;const kk0=(u-vl)/vr0;
    if(assist){P.absw[k]=clamp(P.absw[k]+h*(kk0<-KX_PEAK*1.1?-16:6),0.15,1);Fb*=P.absw[k];}else P.absw[k]=1;
    const Fdr=fr?0:Fd/2,mw=fr?9:12;
    trkTireCS(G,kk0,_wTa[k],apk,_tf);trkTireCS(G,kk0+0.004,_wTa[k],apk,_tf2);
    const kk=Math.max((_tf2[0]-_tf[0])/0.004/vr0,G*0.3/vr0);
    let un=u+h*(Fdr-_tf[0]-Fb*Math.sign(u||1))/(mw+h*kk);if(Fb>0&&Math.sign(un)!==Math.sign(u)&&Math.abs(Fdr)<Fb)un=0;P.w[k]=un;}
  /* differenziale autobloccante: la frizione trasferisce coppia dalla ruota più veloce alla più lenta, fino a un limite che cresce con la coppia */
  {const du=P.w[2]-P.w[3],cap=(380+0.45*Math.abs(Fd))*h,J=Math.min(Math.abs(du)*12/2,cap)*Math.sign(du);P.w[2]-=J/12;P.w[3]+=J/12;}
  if(Math.abs(c.vx)<0.3&&brk>0&&!rev){P.w.fill(0);c.vx*=Math.max(0,1-h*20);}
  /* forze delle gomme nel piano della ruota, poi nel telaio dell'auto */
  let Fx=0,Fy=0,Mz=0,Pf=0,Pr=0,spin=false,lock=false,afS=0,arS=0;
  for(let k=0;k<4;k++){const fr=k<2,left=k%2===0,xw=fr?a:-b,yw=left?tw:-tw,dk=fr?d*(1+(left?ack:-ack)):0,vl=_wVl[k],kk=(P.w[k]-vl)/vref(k);
    trkTireCS(_wG[k]*capF,kk,_wTa[k],fr?APK_F:APK_R,_tf);const fx=_tf[0],fy=_tf[1],cd=Math.cos(dk),sd=Math.sin(dk);
    if(!P.ws)P.ws=[0,0,0,0];P.ws[k]=P.air?0:Math.hypot(kk/KX_PEAK,_wTa[k]/(fr?APK_F:APK_R));
    const bx=fx*cd-fy*sd,by=fx*sd+fy*cd;Fx+=bx;Fy+=by;Mz+=xw*by-yw*bx;_wFx[k]=fx;_wFy[k]=fy;
    const slipP=Math.abs(fy*vl*Math.min(0.6,Math.abs(_wTa[k])))+Math.abs(fx*(P.w[k]-vl))*0.5;if(fr)Pf+=slipP;else Pr+=slipP;
    if(!fr&&kk>0.25&&c.vx>1)spin=true;if(kk<-0.35&&c.vx>4)lock=true;if(fr)afS+=P.wa[k];else arS+=P.wa[k];}
  P.uf=(P.w[0]+P.w[1])/2;P.ur=(P.w[2]+P.w[3])/2;P.af=afS/2;P.ar=arS/2;P.spin=spin;P.lock=lock;P.fyr=_wFy[2]+_wFy[3];
  let crr=0;for(let k=0;k<4;k++)crr+=_wCr[k]*_wF[k];
  const Fres=(L.A.D+(P.air?0:crr))*(Math.abs(c.vx)>0.05?sgn:0);
  /* controllo di stabilità: se il posteriore scappa, coppia correttiva e meno gas */
  let Mesp=0;
  if(assist&&c.vx>4&&!P.air){const rref=clamp(c.vx*Math.tan(d)/V.lwb,-aLim/c.vx,aLim/c.vx),ex=c.r-clamp(c.r,-Math.abs(rref)-0.06,Math.abs(rref)+0.06);
    const beta=Math.atan2(c.vy,c.vx),eb=beta-clamp(beta,-0.075,0.075);
    if(ex||eb){Mesp=-Izz*7*ex+Izz*30*eb;P.tcR=Math.min(P.tcR,Math.max(0.3,1-6*Math.abs(eb)-3*Math.abs(ex)));}}
  const dvx=(Fx-Fres)/m+c.r*c.vy-g*slope,dvy=Fy/m-c.r*c.vx,dr=(Mz+Mesp)/Izz;
  const vx0=c.vx;c.vx+=dvx*h;c.vy+=dvy*h;c.r+=dr*h;
  if(!rev&&vx0>0&&c.vx<0&&thr<0.05&&Math.abs(slope)<0.03){c.vx=0;P.w.fill(0);}
  if(rev&&c.vx>0&&vx0<=0)c.vx=0;
  const kb=c.vx>0?clamp((c.vx-1.5)/3,0,1):0;
  if(kb<1){const rk=c.vx*Math.tan(d)/V.lwb;c.r=kb*c.r+(1-kb)*rk;c.vy*=kb;}
  const axN=(Fx-Fres)/m,ayN=Fy/m;
  /* i trasferimenti di carico seguono le accelerazioni con il ritardo delle sospensioni */
  c.ax+=(axN-c.ax)*Math.min(1,h/0.1);c.ay+=(ayN-c.ay)*Math.min(1,h/0.13);
  c.X+=(c.vx*cp-c.vy*sp2)*h;c.Y+=(c.vx*sp2+c.vy*cp)*h;c.psi+=c.r*h;
  /* calore nelle gomme dalla potenza che si perde strisciando, raffreddamento dall'aria, usura */
  const av=Math.abs(c.vx);
  const amb=24-11*TRK.wet-(TRK.tod==='night'?5:0),kc=0.012*(1+0.9*TRK.wet)*(1+av/25);P.Tf+=h*(Pf/8700-kc*(P.Tf-amb));P.Tr+=h*(Pr/8700-kc*(P.Tr-amb));
  if(TRK.wearMode){const r=(TRK.wearMode===2?6:1)/2e8*(tt.dry?1+(tt.dry-1)*(1-smooth01(wl,0.15,0.45)):1);
    P.Wf=Math.min(1,P.Wf+h*r*Pf*(1+Math.max(0,P.Tf-tt.Tc-tt.hw)/20));P.Wr=Math.min(1,P.Wr+h*r*Pr*(1+Math.max(0,P.Tr-tt.Tc-tt.hw)/20));}
}
/* quota dell'auto: segue la strada, ma se il dosso è più curvo di quanto la gravità riesca a tenerla giù, l'auto si stacca */
function trkVertical(P,h){
  const c=P.car,T=TRK.T,i=c.i,hr=T.h[i]+T.sl[i]*((c.X-T.X[i])*T.tx[i]+(c.Y-T.Y[i])*T.ty[i]);
  const al=Math.cos(c.psi-Math.atan2(T.ty[i],T.tx[i])),slope=T.sl[i]*al;
  if(!P.air){P.gm=1+c.vx*c.vx*T.kv[i]/9.81;
    if(P.gm<0&&c.vx>12){P.air=true;P.wz=c.vx*slope;P.zc=hr;}else{P.zc=hr;P.wz=c.vx*slope;}}
  else{const A=P.veh.aero(Math.abs(c.vx));P.wz+=(-9.81-(A.Ff+A.Fr)/P.veh.m)*h;P.zc+=P.wz*h;P.gm=0;
    if(P.zc<=hr){const imp=P.wz-c.vx*slope;P.air=false;P.landV=imp;P.zc=hr;if(imp<-2.5&&P.collT<=0){trkToast(P,'Atterraggio!',1.2);P.landT=0.35;}}}
}
/* barriere: l'auto rimbalza e perde velocità */
function trkCollide(P){
  const c=P.car,T=TRK.T,i=c.i,d=c.d,s=d>0?0:1,lim=TRK.bar[s][i]-1.05;
  if(Math.abs(d)<=lim)return;
  const sg=Math.sign(d),nx=T.nx[i]*sg,ny=T.ny[i]*sg,pen=Math.abs(d)-lim;
  c.X-=nx*pen;c.Y-=ny*pen;c.d=sg*lim;
  const cp=Math.cos(c.psi),sp=Math.sin(c.psi);let vX=c.vx*cp-c.vy*sp,vY=c.vx*sp+c.vy*cp;
  const vn=vX*nx+vY*ny;if(vn<=0)return;
  const before=Math.hypot(vX,vY);vX-=1.35*vn*nx;vY-=1.35*vn*ny;vX*=0.8;vY*=0.8;
  c.vx=vX*cp+vY*sp;c.vy=-vX*sp+vY*cp;c.r*=0.4;
  if(before-Math.hypot(vX,vY)>2&&P.collT<=0){trkToast(P,'Contatto con il guard rail');trkThump(P,0.7);P.collT=1.5;P.lap.valid=false;}
}
/* contatto tra due auto: ognuna è tre cerchi lungo l'asse; urto con rimbalzo e rotazione */
function trkCarsCollide(A,B){
  if(A.air||B.air||A.pit||B.pit)return;
  const dx0=A.car.X-B.car.X,dy0=A.car.Y-B.car.Y;if(dx0*dx0+dy0*dy0>64)return;
  const circ=P=>{const c=P.car,V=P.veh,cp=Math.cos(c.psi),sp=Math.sin(c.psi),L=V.len/3;return [-1,0,1].map(k=>[c.X+cp*k*L,c.Y+sp*k*L]);};
  const ca=circ(A),cb=circ(B),ra=A.veh.wid*0.5,rb=B.veh.wid*0.5;
  let best=0,bn=null,bp=null;
  for(const p of ca)for(const q of cb){const dx=q[0]-p[0],dy=q[1]-p[1],d=Math.hypot(dx,dy),pen=ra+rb-d;if(pen>best&&d>1e-6){best=pen;bn=[dx/d,dy/d];bp=[(p[0]+q[0])/2,(p[1]+q[1])/2];}}
  if(!bn)return;
  const [nx,ny]=bn,a=A.car,b=B.car;
  a.X-=nx*best/2;a.Y-=ny*best/2;b.X+=nx*best/2;b.Y+=ny*best/2;
  const wv=c=>{const cp=Math.cos(c.psi),sp=Math.sin(c.psi);return [c.vx*cp-c.vy*sp,c.vx*sp+c.vy*cp];};
  const va=wv(a),vb=wv(b),rA=[bp[0]-a.X,bp[1]-a.Y],rB=[bp[0]-b.X,bp[1]-b.Y];
  const pa=[va[0]-a.r*rA[1],va[1]+a.r*rA[0]],pb=[vb[0]-b.r*rB[1],vb[1]+b.r*rB[0]];
  const rel=(pb[0]-pa[0])*nx+(pb[1]-pa[1])*ny;if(rel>=0)return;
  const mA=A.veh.m,mB=B.veh.m,IA=mA*A.veh.lwb*A.veh.lwb*0.27,IB=mB*B.veh.lwb*B.veh.lwb*0.27;
  const cA=rA[0]*ny-rA[1]*nx,cB=rB[0]*ny-rB[1]*nx;
  const j=-(1+0.3)*rel/(1/mA+1/mB+cA*cA/IA+cB*cB/IB);
  va[0]-=j*nx/mA;va[1]-=j*ny/mA;vb[0]+=j*nx/mB;vb[1]+=j*ny/mB;a.r-=cA*j/IA;b.r+=cB*j/IB;
  const back=(c,v)=>{const cp=Math.cos(c.psi),sp=Math.sin(c.psi);c.vx=v[0]*cp+v[1]*sp;c.vy=-v[0]*sp+v[1]*cp;};
  back(a,va);back(b,vb);
  if(j/Math.min(mA,mB)>1.5&&A.collT<=0){trkToast(A,'Contatto!',1.4);trkToast(B,'Contatto!',1.4);trkThump(A,0.5);trkThump(B,0.5);A.collT=B.collT=1.2;}
}
/* scia: chi segue a pochi metri, allineato, ha meno resistenza; nell'aria turbolenta però le ali e il fondo caricano meno.
   Conta l'auto che fa più scia tra quelle davanti */
function trkWake(P,dt){
  let w=0;if(!P.air&&!P.pit)for(const O of TRK.cars){if(O===P||O.pit)continue;const oc=O.car,cp=Math.cos(oc.psi),sp=Math.sin(oc.psi),dx=P.car.X-oc.X,dy=P.car.Y-oc.Y,lon=dx*cp+dy*sp;
    if(lon<-1&&lon>-70){const lat=-dx*sp+dy*cp,d=-lon,wd=1.2+0.035*d;w=Math.max(w,Math.exp(-d/28)*Math.exp(-(lat/wd)*(lat/wd))*Math.min(1,Math.max(0,oc.vx)/25));}}
  P.wk+=(w-P.wk)*(1-Math.exp(-dt*3));
}
/* il simulatore guida da solo sulla traiettoria ideale con la velocità calcolata */
function trkAutoStep(P,dt){
  const RL=TRK.RL,S=P.sim,N=RL.k.length,c=P.car;
  let f=P.auto,i=Math.floor(f),fr=f-i;
  const v=S.v[i]+(S.v[(i+1)%N]-S.v[i])*fr;
  f+=v*dt/RL.seg[i];if(f>=N)f-=N;P.auto=f;i=Math.floor(f);fr=f-i;const j=(i+1)%N;
  const X=RL.X[i]+(RL.X[j]-RL.X[i])*fr,Y=RL.Y[i]+(RL.Y[j]-RL.Y[i])*fr,k=RL.k[i]+(RL.k[j]-RL.k[i])*fr;
  const vn=S.v[i]+(S.v[j]-S.v[i])*fr,ax=(vn-c.vx)/Math.max(dt,1e-3);
  c.ax+=(ax-c.ax)*Math.min(1,dt/0.15);c.ay=vn*vn*k;c.X=X;c.Y=Y;
  const psi=Math.atan2(RL.ty[i]+(RL.ty[j]-RL.ty[i])*fr,RL.tx[i]+(RL.tx[j]-RL.tx[i])*fr);
  let dp=psi-c.psi;while(dp>Math.PI)dp-=2*Math.PI;while(dp<-Math.PI)dp+=2*Math.PI;c.psi+=dp;
  c.vx=vn;c.vy=0;c.r=vn*k;c.delta=Math.atan(P.veh.lwb*k)+k*vn*vn*0.0009;
  P.thr=c.ax>0.3?1:c.ax>-1.2?0.25:0;P.brk=c.ax<-2?clamp(-c.ax/14,0,1):0;P.af=0;P.ar=0;
  P.zc=TRK.T.h[i];P.air=false;P.gm=1+vn*vn*TRK.T.kv[i]/9.81;trkWheelSync(P);
}
/* pilota del computer: segue la traiettoria ideale al passo del suo livello, frena e accelera seguendo il profilo di velocità
   (con un quarto di secondo d'anticipo), si adatta a gomme e pioggia, sorpassa di lato e rallenta se ha un'auto davanti */
function trkAIDrive(P,dt){
  const c=P.car,V=P.veh,RL=TRK.RL,T=TRK.T,N=T.N,S=P.sim,hw=T.w/2;
  let bi=c.i,best=1e18;for(let q=-12;q<=12;q++){const k=(c.i+q+N)%N,dx=c.X-RL.X[k],dy=c.Y-RL.Y[k],d=dx*dx+dy*dy;if(d<best){best=d;bi=k;}}
  /* traffico: l'auto più vicina davanti o affiancata */
  let O=null,ods=1e9;
  for(const Q of TRK.cars){if(Q===P||Q.pit)continue;let ds=(Q.car.i-bi+N)%N;if(ds>N/2)ds-=N;ds*=T.ds;if(ds>-4&&ds<40&&ds<ods){ods=ds;O=Q;}}
  const ch=P.ch||TRK_CHAR_PLAIN;
  let vcap=1e9,offT=0,attack=false;
  if(O){const myLat=RL.e[bi]+P.aiOff,lat=O.car.d-myLat;attack=ods>0&&ods<25;
    if(ods>0){if(Math.abs(lat)<2.6){const tgt=O.car.d>RL.e[bi]?O.car.d-ch.gap:O.car.d+ch.gap;offT=clamp(tgt,-hw+1.4,hw-1.4)-RL.e[bi];
        if(ods<14&&Math.abs(O.car.d-c.d)<2.3)vcap=Math.max(5,O.car.vx-0.5);}
      else offT=P.aiOff;}
    else if(Math.abs(O.car.d-c.d)<2.5)offT=clamp(c.d>O.car.d?O.car.d+2.7:O.car.d-2.7,-hw+1.4,hw-1.4)-RL.e[bi];
    else offT=P.aiOff;}
  /* difesa: con un'auto che arriva da dietro, prima della curva si sposta una volta sola sul lato da cui attacca */
  P.defT-=dt;P.defCool-=dt;
  if(ch.defend>0.4&&P.defCool<=0&&!attack&&Math.abs(RL.k[bi])<1/250){let B=null,bds=-1e9;
    for(const Q of TRK.cars){if(Q===P||Q.pit)continue;let ds=(Q.car.i-bi+N)%N;if(ds>N/2)ds-=N;ds*=T.ds;if(ds<-3&&ds>-28&&ds>bds&&Q.car.vx>c.vx-0.5){bds=ds;B=Q;}}
    let cn=1e9;for(let q=30;q<100;q+=5)if(Math.abs(RL.k[(bi+q)%N])>1/120){cn=q;break;}
    if(B&&cn<100&&Math.random()<ch.defend*dt*3){const sg=B.car.d>c.d?1:-1;P.defOff=clamp(c.d+sg*2.4,-hw+1.6,hw-1.6)-RL.e[bi];P.defT=2.6;P.defCool=7;}}
  if(P.defT>0&&!(O&&ods>0&&ods<14))offT=P.defOff;
  P.aiOff+=clamp(offT-P.aiOff,-2.5*dt,2.5*dt);
  const ahead=(bi+Math.round(c.vx*0.12/T.ds)+1)%N;
  const e=(c.X-(RL.X[bi]+T.nx[bi]*P.aiOff))*(-RL.ty[bi])+(c.Y-(RL.Y[bi]+T.ny[bi]*P.aiOff))*RL.tx[bi];
  const he=Math.atan2(RL.ty[ahead],RL.tx[ahead])-c.psi,hn=Math.atan2(Math.sin(he),Math.cos(he)),beta=Math.atan2(c.vy,Math.max(c.vx,1));
  const dwant=Math.atan(V.lwb*RL.k[ahead])+hn+beta*0.5+Math.atan(-1.2*e/(c.vx+2));
  const gNow=trkWxGrip(P.tire,trkWetAt(bi,RL.e[bi])),aL=gNow*V.mu*9.81,dmax=Math.min(0.52,V.lwb*aL/Math.max(c.vx*c.vx,1)+TIRE_PEAK*1.35);
  P.steerIn=clamp(dwant/dmax,-1,1);
  /* passo: livello, aderenza delle gomme adesso (fredde, surriscaldate, consumate) e acqua rispetto a quando ha calcolato il profilo */
  /* errore in corso: staccata lunga (arriva troppo forte in curva) o testacoda (il retrotreno parte, specie sul bagnato) */
  P.errT-=dt;P.errCool-=dt;const errLong=P.errT>0&&P.errKind==='lungo';
  const gf=Math.sqrt(Math.min(trkTireF(P.Tf,P.Wf,P.tire),trkTireF(P.Tr,P.Wr,P.tire))),
    pk=P.pace*gf*Math.sqrt(gNow/Math.max(0.3,P.simG))*(1+(ch.wet-0.5)*0.06*TRK.wet)*(attack?1+ch.boost:1)*(errLong?1.13:1);
  const vNow=Math.min(S.v[bi]*pk,vcap);
  const look=Math.max(2,Math.round((Math.max(c.vx,0)*0.2+4)/T.ds)),kA=(bi+look)%N,vA=Math.min(S.v[kA]*pk,vcap);
  const aCmd=(vA*vA-c.vx*c.vx)/(2*look*T.ds)+1.5*(vNow-c.vx),aB=Math.max(4,(P.lastG||V.m*9.81)/V.m);
  if(aCmd<-0.4){P.thr=0;P.brk=clamp(-aCmd/aB,0,1);}else{P.brk=0;P.thr=clamp(0.35+aCmd*0.5,0,1);}
  if(P.errT>0&&P.errKind==='spin'){P.thr=0.15;P.brk=0;}
  /* all'inizio di una staccata decisa può sbagliare: più spesso se irruento, se attacca o sul bagnato */
  if(aCmd<-4&&P.errCool<=0&&P.errT<=0&&TRK.race.state!=='count'&&c.vx>22){const pr=ch.err*0.07*(1+2*TRK.wet*(1.4-ch.wet))*(attack?1.6:1);P.errCool=4;
    if(Math.random()<pr){const spin=TRK.wet>0.35?Math.random()<0.55:Math.random()<0.18;P.errKind=spin?'spin':'lungo';P.errT=spin?0.9:1.7;P.errCool=28+Math.random()*20;P.errs++;
      if(spin){c.r+=(Math.random()<0.5?-1:1)*(0.9+Math.random()*0.5);}
      trkRadio(P,spin?`#${P.num} in testacoda${trkCornerAhead(bi)}!`:`#${P.num} lungo in staccata${trkCornerAhead(bi)}`);}}
  /* incastrato o finito lontano dalla pista: si rimette in pista da solo */
  if(c.vx<2&&TRK.race.state!=='count')P.stuckT+=dt;else P.stuckT=0;
  if(P.stuckT>3||Math.abs(c.d)>T.w/2+12){trkReset(P,false);P.stuckT=0;}
}

/* curva più vicina davanti, per i messaggi */
function trkCornerAhead(i){const N=TRK.T.N;let best=null,bd=1e9;for(const C of TRK.corners){const d=(C.i-i+N)%N;if(d<bd){bd=d;best=C;}}return best&&bd<120?` ${/^[AEIOU]/i.test(best.n)?"all'":/^(Tornante|Curvone)/.test(best.n)?'al ':'alla '}${best.n}`:'';}
/* messaggi dagli altri: arrivano ai giocatori solo se succede vicino a loro */
function trkRadio(P,msg){const N=TRK.T.N;for(const H of TRK.cars){if(H.isAI||!H.el)continue;let ds=(P.car.i-H.car.i+N)%N;if(ds>N/2)ds-=N;if(Math.abs(ds*TRK.T.ds)<260&&!(H.toastT>1.2))trkToast(H,msg,2.4);}}

/* =========================================================
   Box: si entra dopo l'ultima curva (con B, o infilando la corsia), limitatore a 60 km/h, sosta nella propria piazzola,
   cambio gomme, uscita dopo il traguardo. Lungo la corsia l'auto va da sola
   ========================================================= */
function trkPitSuggest(P){return TRK.wet>0.4?3:(TRK.tire===3?1:TRK.tire);}
function trkPitAllowed(P){return TRK.on&&!P.isAI&&!(P.id===0&&!TRK.duo&&TRK.mode==='auto');}
function trkPitToggle(P){
  if(!trkPitAllowed(P))return;if(P.pit){return;}
  P.pitReq=!P.pitReq;if(P.pitReq&&P.pitTire<0)P.pitTire=trkPitSuggest(P);
  trkToast(P,P.pitReq?`Box alla prossima entrata · gomme ${TRK_TIRES[P.pitTire].n.toLowerCase()}`:'Box annullato',2.4);trkPitUI();
}
function trkPitChoose(P,t){if(!trkPitAllowed(P))return;if(P.pit&&P.pit.ph!=='in'&&P.pit.ph!=='lane')return;P.pitTire=t;if(P.pit)P.pit.tire=t;else if(!P.pitReq){P.pitReq=true;}
  trkToast(P,`Box · gomme ${TRK_TIRES[t].n.toLowerCase()}`,1.8);trkPitUI();}
/* secondo giocatore (o gamepad): ogni pressione passa alla mescola successiva, poi annulla */
function trkPitCycle(P){if(!trkPitAllowed(P)||P.pit)return;if(!P.pitReq){trkPitToggle(P);return;}
  const order=[trkPitSuggest(P)];for(let k=0;k<4;k++)if(!order.includes(k))order.push(k);const j=order.indexOf(P.pitTire);
  if(j>=order.length-1){P.pitReq=false;P.pitTire=-1;trkToast(P,'Box annullato',1.6);trkPitUI();}else trkPitChoose(P,order[j+1]);}
/* il computer decide all'entrata dei box: gomme sbagliate per l'acqua che c'è, o consumate */
function trkPitWanted(P){
  const R=TRK.race,racing=TRK.duo&&R.state==='run',left=racing?R.laps-P.lapsDone:99,w=TRK.wet;
  if(racing&&left<=1)return -1;
  if(P.tire!==3&&w>0.42)return 3;
  if(P.tire===3&&w<0.22&&TRK.rain<0.15)return TRK.tire===3?1:TRK.tire;
  if(Math.max(P.Wf,P.Wr)>0.55&&left>2)return P.tire;
  return -1;
}
function trkPitCheck(P,iPrev,i){
  if(P.pit||TRK.race.state==='count'||TRK.race.state==='done'||(P.id===0&&!TRK.duo&&TRK.mode==='auto'))return;
  const qi=TRK.pit.qIn,hw=TRK.T.w/2;
  if(iPrev<qi&&i>=qi&&i-iPrev<40){
    if(P.isAI){const t=trkPitWanted(P);if(t>=0){P.pitTire=t;trkPitStart(P);}}
    else if(P.pitReq)trkPitStart(P);}
  else if(!P.isAI&&i>qi&&i<qi+34&&P.car.d>hw+1.2&&P.car.vx>3){if(P.pitTire<0)P.pitTire=trkPitSuggest(P);trkPitStart(P);}
}
function trkPitStart(P){
  const Pd=TRK.pit,c=P.car,k=Math.max(0,TRK.cars.indexOf(P));
  P.pit={ph:'in',q:c.i,q0:c.i,d0:c.d,v:Math.max(6,c.vx),box:Pd.box[k%8],t:0,tire:P.pitTire<0?P.tire:P.pitTire};
  P.pitReq=false;trkToast(P,'Corsia dei box: limitatore a 60 km/h, l\'auto va da sola · 1–4 cambiano le gomme',2.8);trkPitUI();
}
function trkPitTime(P){const S=P.pit;return 2.2+((S.tire!==P.tire||P.Wf+P.Wr>0.04)?2.6:0)+Math.random()*0.6;}
function trkPitService(P){
  const t=P.pit.tire,tt=TRK_TIRES[t];P.stops++;P.tire=t;P.Wf=P.Wr=0;P.Tf=P.Tr=tt.Tc-12;
  if(P.id===0&&!P.isAI){TRK.tire=t;TRK.mu=tt.mu;document.querySelectorAll('#trkTires button').forEach((b,i)=>b.setAttribute('aria-pressed',i===t));trkSavePrefs();trkCompute();}
  else{P.veh.mu=tt.mu;P.simG=trkWxGrip(t,TRK.wet);P.sim=lapSim(P.veh,TRK.RL,P.simG);}
  P.pitTire=-1;trkToast(P,`Gomme ${tt.n.toLowerCase()} montate: via!`,1.8);trkPitUI();
}
const _pp=[0,0],_pq=[0,0];
function trkPitPos(q,o,out){const T=TRK.T,N=T.N,b=Math.floor(q),f=q-b,i=((b%N)+N)%N,j=(i+1)%N;
  out[0]=T.X[i]+(T.X[j]-T.X[i])*f+o*(T.nx[i]+(T.nx[j]-T.nx[i])*f);out[1]=T.Y[i]+(T.Y[j]-T.Y[i])*f+o*(T.ny[i]+(T.ny[j]-T.ny[i])*f);return out;}
function trkPitStep(P,dt){
  const S=P.pit,Pd=TRK.pit,T=TRK.T,N=T.N,c=P.car,ds=T.ds,v0=S.v;
  if(S.ph==='stop'){S.t-=dt;S.v=0;if(S.t<=0){trkPitService(P);S.ph='out';}}
  else{let vT=70;
    if(S.ph==='in'){vT=Math.sqrt(Pd.vLim*Pd.vLim+2*8*Math.max(0,(Pd.qA-S.q)*ds));if(S.q>=Pd.qA)S.ph='lane';}
    if(S.ph==='lane'){vT=Math.min(Pd.vLim,Math.sqrt(2*5*Math.max(0,(S.box-S.q)*ds))+0.4);
      if(S.q>=S.box-0.08){S.q=S.box;S.ph='stop';S.v=0;S.t=trkPitTime(P);trkToast(P,`Sosta: gomme ${TRK_TIRES[S.tire].n.toLowerCase()}`,S.t+0.4);}}
    if(S.ph==='out')vT=S.q<Pd.qB?Pd.vLim:70;
    if(S.ph!=='stop'){const acc=S.ph==='out'&&S.q>=Pd.qB?7:4.5;S.v=S.v<vT?Math.min(vT,S.v+acc*dt):Math.max(vT,S.v-11*dt);S.q+=S.v*dt/ds;}}
  const boxQ=(S.ph==='lane'||S.ph==='stop'||(S.ph==='out'&&S.q<S.box+16))?S.box:null;
  const off=trkPitOff(S.q,S.d0,S.q0,boxQ);trkPitPos(S.q,off,_pp);trkPitPos(S.q+0.7,trkPitOff(S.q+0.7,S.d0,S.q0,boxQ),_pq);
  const psi=Math.atan2(_pq[1]-_pp[1],_pq[0]-_pp[0]);let dp=psi-c.psi;while(dp>Math.PI)dp-=2*Math.PI;while(dp<-Math.PI)dp+=2*Math.PI;
  c.X=_pp[0];c.Y=_pp[1];c.psi+=dp;c.ax+=((S.v-v0)/Math.max(dt,1e-3)-c.ax)*Math.min(1,dt/0.2);c.vx=S.v;c.vy=0;c.r=0;c.ay=0;c.delta+=(clamp(dp*6,-0.35,0.35)-c.delta)*Math.min(1,dt*6);
  c.i=((Math.floor(S.q)%N)+N)%N;c.d=off;P.surf='asfalto';P.zc=T.h[c.i];P.air=false;P.gm=1;P.wz=0;P.af=P.ar=0;P.spin=false;P.wk=0;
  P.thr=c.ax>0.4?0.6:0.1;P.brk=c.ax<-1?0.7:0;trkWheelSync(P);
  if(S.ph==='out'&&S.q>=Pd.qOut){c.psi=psi;P.pit=null;c.i=trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.stuckT=0;P.aiOff=c.d-TRK.RL.e[c.i];P.offT=0;P.thr=1;trkPitUI();}
}

/* =========================================================
   Meteo: velo d'acqua, pioggia e traiettoria asciutta. Con «Variabile» la pioggia arriva durante la gara e poi smette
   ========================================================= */
function trkWxPreset(){const W=TRK_WX[TRK.weather];TRK.wet=W.wet;TRK.rain=W.rain;TRK.dryLine=W.dl;}
function trkWxPlan(){
  TRK.wxT=0;if(TRK.weather!==3){TRK.wxPlan=null;return;}
  const R=TRK.race,racing=TRK.duo&&R.laps>0,lap=(TRK.p[0].sim?TRK.p[0].sim.lap:105)*1.1;
  if(racing){const dur=R.laps*lap,st=Math.max(30,dur*(0.22+Math.random()*0.18));TRK.wxPlan={start:st,end:st+dur*(0.55+Math.random()*0.6),race:true};}
  else{const st=45+Math.random()*45;TRK.wxPlan={start:st,end:st+120+Math.random()*90,race:false};}
}
function trkWxStep(dt){
  const W=TRK.wxPlan;if(TRK.weather!==3||!W)return;
  if(W.race&&TRK.race.state!=='run')return;
  TRK.wxT+=dt;const t=TRK.wxT;
  if(!W.warned&&t>W.start-18){W.warned=true;TRK.cars.forEach(P=>trkToast(P,'Dal box: pioggia in arrivo tra pochi secondi',3.5));}
  const rt=t<W.start?0:t<W.end?smooth01(t,W.start,W.start+40):1-smooth01(t,W.end,W.end+30);
  TRK.rain+=(rt-TRK.rain)*Math.min(1,dt/6);
  if(!W.saidRain&&TRK.rain>0.3){W.saidRain=true;TRK.cars.forEach(P=>trkToast(P,'Piove: con le gomme da asciutto l\'aderenza cala, valuta il box (B)',4.5));}
  if(W.saidRain&&!W.saidStop&&t>W.end+25){W.saidStop=true;TRK.cars.forEach(P=>trkToast(P,'Ha smesso di piovere: la traiettoria si asciuga per prima',4));}
  if(TRK.rain>TRK.wet)TRK.wet+=(TRK.rain-TRK.wet)*Math.min(1,dt/30);else TRK.wet-=(TRK.wet-TRK.rain)*Math.min(1,dt/110);
  if(TRK.rain<0.25&&TRK.wet>0.05)TRK.dryLine=Math.min(0.85,TRK.dryLine+dt*(0.004+0.0025*TRK.cars.length)*(1-TRK.dryLine));else TRK.dryLine=Math.max(0,TRK.dryLine-dt*0.08*TRK.rain);
  /* in prova libera, una volta asciutto, tornerà a piovere più tardi */
  if(!W.race&&W.saidStop&&TRK.wet<0.04){const st=t+150+Math.random()*120;Object.assign(W,{start:st,end:st+120+Math.random()*90,warned:false,saidRain:false,saidStop:false});}
  TRK.atmoT-=dt;if(TRK.atmoT<=0){TRK.atmoT=0.4;trkAtmo();}
}

/* cronometro e conteggio dei giri */
function trkCfgKey(P){const v=P.veh;return `${TRK.trackId}|${v.name}|${v.m}|${v.kw}|${v.mu}|${TRK.assist?1:0}|${TRK.weather}`;}
function trkLap(P,iPrev,i){
  const N=TRK.T.N,L=P.lap,c=P.car,R=TRK.race,racing=TRK.duo&&R.state!=='off';
  if(L.run){if(L.cp===0&&i>N*0.3&&i<N*0.55)L.cp=1;if(L.cp===1&&i>N*0.62&&i<N*0.9)L.cp=2;}
  if(iPrev>N-80&&i<80&&c.vx>0){
    const now=TRK.clock;
    if(L.run&&L.cp===2){const lt=now-L.t0;L.last=lt;L.lastSpd=L.spd;L.lastValid=L.valid;
      let msg=`Giro ${L.n}: ${fmtLap(lt)}`;
      if(!L.valid)msg+=' · non valido';
      else if(!(P.id===0&&TRK.mode==='auto'&&!TRK.duo)){const key=trkCfgKey(P);
        if(!P.isAI){const pb=TRK.myBest[key];if(!pb||lt<pb.t){TRK.myBest[key]={t:lt,name:P.veh.name};msg+=pb?' · nuovo record':'';}}
        if(L.best==null||lt<L.best)L.best=lt;
        const gap=lt-P.sim.lap;msg+=` (${gap>=0?'+':'−'}${dec(Math.abs(gap),2)} s dal giro ideale)`;
        /* fantasma: se è il giro migliore con questa configurazione, diventa il fantasma da inseguire */
        if(P.id===0&&!TRK.duo&&P.grec.length>20&&(!TRK.ghost||TRK.ghost.foreign||TRK.ghost.key!==key||lt<TRK.ghost.lap)){if(!(TRK.ghost&&TRK.ghost.foreign&&TRK.ghost.lap<lt)){TRK.ghost={pts:P.grec,lap:lt,key,track:TRK.trackId};msg+=' · fantasma aggiornato';}}
        if(P.id===0&&!P.isAI)trkBoardSubmit(P,lt,TRK.duo?null:P.grec);}
      if(racing&&R.state==='run'){P.lapsDone++;
        if(P.lapsDone>=R.laps&&P.finished==null){P.finished=R.clock;const first=R.first==null;if(first)R.first=R.clock;msg=first?`Traguardo! Primo in ${fmtLap(R.clock)}`:`Traguardo · ${P.pos}° · ${fmtLap(R.clock)}`;if(!P.isAI)trkCheer(0.8);}
        else if(P.finished==null)msg=`Giro ${P.lapsDone} di ${R.laps} · ${fmtLap(lt)}${L.valid?'':' · non valido'}`;}
      trkToast(P,msg,4.5);if(P.id===0)trkPanel();}
    else if(!L.run&&!racing)trkToast(P,'Via! Il cronometro è partito');
    L.run=true;L.t0=now;L.cp=0;L.valid=true;L.n++;L.spd=new Float32Array(N);P.grec=[];P.grecT=-1;
  }
  if(L.run&&L.spd){L.spd[i]=Math.max(L.spd[i],Math.hypot(c.vx,c.vy));}
  if(L.run&&P.id===0){const tt=TRK.clock-L.t0;if(tt-P.grecT>=0.05){P.grecT=tt;P.grec.push([tt,c.X,c.Y,c.psi,P.zc,P.ptc]);}}
  if(racing&&R.state==='run'){const key=(L.run?P.lapsDone+1:0)*1000+Math.floor(i/20);if(key!==P.lastKey){P.lastKey=key;if(P.cpT[key]==null)P.cpT[key]=R.clock;}}
}
