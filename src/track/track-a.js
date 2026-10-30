/* =========================================================
   Pista: stato, giocatori, auto per il simulatore, dati del tracciato
   ========================================================= */
function trkNewPlayer(id){
  return {id,car:{X:0,Y:0,psi:0,vx:0,vy:0,r:0,delta:0,ax:0,ay:0,i:0,d:0},thr:0,brk:0,steerIn:0,revT:0,fyr:0,spin:false,af:0,ar:0,surf:'asfalto',
    lap:{n:0,t0:0,valid:true,last:null,best:null,run:false,cp:0,spd:null,lastSpd:null},offT:0,collT:0,roll:0,pitch:0,kmh:0,v:0,
    camYaw:0,camPos:null,cam:id?'chase':'chase',veh:null,sim:null,cornerV:[],auto:0,toastT:0,el:null,vis:null,heat:0,flame:0,lastThr:0,lastGear:'N',
    lapsDone:0,finished:null,cpT:{},lastKey:null,skid:[null,null],padY:false,padB:false,cfgKey:'',zc:0,wz:0,air:false,ptc:0,gm:1,landT:0,
    Tf:45,Tr:45,Wf:0,Wr:0,wk:0,vo:{mu:1,g:1,ad:1,al:1,mf:1,mr:1},grec:[],grecT:0,aiOff:0,stuckT:0,
    ch:null,errT:0,errKind:'',errCool:0,errs:0,defT:0,defOff:0,defCool:0,lookBack:false,lookYaw:0,pad:null,
    rig:null,M:null,visKey:'',tire:1,pace:1,simG:1,lastG:0,pit:null,pitReq:false,pitTire:-1,stops:0,num:String(id+1),color:'#16305a',key:'',label:'',pos:1,isAI:false,halo:null,crew:null,lastPos:0};
}
const TRK={on:false,data:false,built:false,T:null,RL:null,sim:null,veh:null,corners:[],mode:'drive',duo:false,p2key:'supercar',p2paint:1,collide:true,
  race:{laps:3,state:'off',t:0,go:4.6,clock:0,first:null},
  mass:1480,kw:460,mu:1.15,tire:1,assist:true,same:false,dirty:true,dirtyT:0,
  keys:[{},{}],touch:{},clock:0,hudT:0,myBest:{},rows:[],p:[0,1,2,3,4,5,6,7].map(trkNewPlayer),cars:[],vertical:false,
  players:1,split:false,ai:false,aiPace:0.93,oppAI:3,oppDuo:0,tod:'day',weather:0,wet:0,rain:0,dryLine:0,wxPlan:null,wxT:0,atmoT:0,fxPost:true,fxRefl:true,fxShadow:true,trackId:0,aiChar:true,padVib:true,padCurve:1,boardOn:true,paused:false,
  wearMode:1,ghostOn:true,ghost:null,rec:[],recT:0,replay:{on:false,t:0,speed:1,paused:false,focus:0,cam:'tv',tv:-1}};
TRK.car=TRK.p[0].car;
/* mescole: aderenza, temperatura ideale e finestra, perdita di aderenza sul bagnato (wl), sensibilità all'aquaplaning (aq), usura sull'asciutto (dry) */
const TRK_TIRES=[{n:'Stradali',mu:1.0,Tc:72,hw:30,wl:0.30,aq:0.30},{n:'Sportive',mu:1.15,Tc:85,hw:26,wl:0.38,aq:0.30},{n:'Semislick',mu:1.30,Tc:98,hw:22,wl:0.45,aq:0.32},{n:'Da pioggia',mu:1.02,Tc:58,hw:20,wl:0.05,aq:0.08,dry:4}];
/* meteo: acqua sulla pista (wet), intensità della pioggia (rain), traiettoria asciutta (dl); «Variabile» parte asciutto e poi arriva la pioggia */
const TRK_WX=[{n:'Asciutto',wet:0,rain:0,dl:0},{n:'Umido',wet:0.5,rain:0,dl:0.55},{n:'Pioggia',wet:1,rain:1,dl:0},{n:'Variabile',wet:0,rain:0,dl:0}];
/* aderenza che resta alla mescola con quel velo d'acqua */
const trkWxGrip=(ti,w)=>1-TRK_TIRES[ti].wl*w;
const TRK_PERF={sedan:[1830,325],supercar:[1520,530],suv:[2150,300],van:[1900,150],seventies:[1150,85],drop:[1100,120],vespera:[1480,460],vespera_full:[1480,460]};
/* cambio di circuito: si buttano dati e mondo 3D, si ricostruiscono alla prossima discesa in pista */
function trkSetTrack(id){
  id=Math.max(0,Math.min(TRK_DEFS.length-1,id|0));if(id===TRK.trackId&&TRKDEF===TRK_DEFS[id])return;
  TRK.trackId=id;TRKDEF=TRK_DEFS[id];trkSavePrefs();
  if(TRK.tw){TRK.tw.traverse(o=>{if(o.geometry)o.geometry.dispose();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{for(const k of ['map','alphaMap','roughnessMap'])if(m[k]&&m[k]!==TRK.puddleTex)m[k].dispose();m.dispose();});});trkWorld.remove(TRK.tw);TRK.tw=null;}
  Object.assign(TRK,{data:false,built:false,T:null,RL:null,sim:null,ghost:null,lake:null,pitZone:null,hash:null});
  thMapImg=null;RF.patched=false;
  TRK.dirty=true;
}
try{const p=JSON.parse(localStorage.getItem('vespera-track-prefs')||'{}');if(p.cam)TRK.p[0].cam=p.cam;if(p.assist===false)TRK.assist=false;if(p.tire>=0&&p.tire<4)TRK.tire=p.tire;TRK.mu=TRK_TIRES[TRK.tire].mu;
  if(p.p2key)TRK.p2key=p.p2key;if(p.p2paint>=0)TRK.p2paint=p.p2paint;if(p.laps>=0)TRK.race.laps=p.laps;if(p.collide===false)TRK.collide=false;if(p.aiPace)TRK.aiPace=p.aiPace;if(p.tod)TRK.tod=p.tod;if(p.weather>=0&&p.weather<4)TRK.weather=p.weather;if(p.wearMode>=0)TRK.wearMode=p.wearMode;if(p.ghostOn===false)TRK.ghostOn=false;
  if(p.trackId>0&&p.trackId<TRK_DEFS.length){TRK.trackId=p.trackId;TRKDEF=TRK_DEFS[p.trackId];}if(p.oppAI>=1)TRK.oppAI=p.oppAI;if(p.oppDuo>=0)TRK.oppDuo=p.oppDuo;if(p.fxPost===false)TRK.fxPost=false;if(p.fxRefl===false)TRK.fxRefl=false;if(p.fxShadow===false)TRK.fxShadow=false;if(p.aiChar===false)TRK.aiChar=false;if(p.padVib===false)TRK.padVib=false;if(p.padCurve>=0)TRK.padCurve=p.padCurve;if(p.boardOn===false)TRK.boardOn=false;}catch(e){}
if(![0.88,0.93,0.965,1].includes(TRK.aiPace))TRK.aiPace=0.93;
try{TRK.rows=JSON.parse(localStorage.getItem('vespera-track-rows')||'[]');}catch(e){TRK.rows=[];}
function trkSavePrefs(){try{localStorage.setItem('vespera-track-prefs',JSON.stringify({cam:TRK.p[0].cam,assist:TRK.assist,tire:TRK.tire,p2key:TRK.p2key,p2paint:TRK.p2paint,laps:TRK.race.laps,collide:TRK.collide,aiPace:TRK.aiPace,tod:TRK.tod,weather:TRK.weather,wearMode:TRK.wearMode,ghostOn:TRK.ghostOn,oppAI:TRK.oppAI,oppDuo:TRK.oppDuo,fxPost:TRK.fxPost,fxRefl:TRK.fxRefl,fxShadow:TRK.fxShadow,trackId:TRK.trackId,aiChar:TRK.aiChar,padVib:TRK.padVib,padCurve:TRK.padCurve,boardOn:TRK.boardOn}));}catch(e){}}
function trkSaveRows(){try{localStorage.setItem('vespera-track-rows',JSON.stringify(TRK.rows));}catch(e){}}
const fmtLap=s=>{if(s==null||!isFinite(s))return '—';const m=Math.floor(s/60),r=s-m*60;return `${m}:${r.toFixed(2).padStart(5,'0').replace('.',',')}`;};

/* portanza stimata per le forme del laboratorio (coefficienti sull'area frontale, positivi = portanza):
   muso alto e fondo ruvido sollevano davanti; coda fastback poco inclinata solleva dietro come il dorso di un'ala;
   diffusore e spoiler la riducono. Stima di massima, ordini di grandezza da Hucho. */
function labLift(S){
  const P=S.P,round=smooth01(P.radius,0.02,0.16),fast=P.deck<0.3,phi=S.rearEff,und={smooth:-1,partial:0,rough:1}[P.under];
  const clf=0.05+0.25*clamp((P.noseH-0.45)/0.6,0,1)*(1-0.3*round)+0.02*und;
  const clr=0.10+(fast?0.10*smooth01(phi,10,30):-0.03)-0.008*P.diffuser*Math.sqrt(0.14/Math.max(P.ride,0.06))-(P.spoiler?0.05:0)+0.025*und-0.003*P.boat+(P.roof==='box'?0.02:0);
  return {clf,clr};
}
function labVehicle(S,R,m,kw,mu,name){
  const P=S.P,A=R.A,CdA=R.cd*A,lf=labLift(S);
  return {name,m,kw,mu,wf:0.5,h:0.04+0.32*P.H,lwb:S.xa[0]-S.xa[1],track:P.W-0.28,len:P.L,wid:P.W,CdA,ClA:(lf.clf+lf.clr)*A,clf:lf.clf,clr:lf.clr,
    aero:v=>{const q=0.6125*v*v;return {D:q*CdA,Ff:-q*lf.clf*A,Fr:-q*lf.clr*A};}};
}
const TRK_WNAME={front:'ala anteriore',high:'ala alta',side:'ali laterali',rear:'alettone'};
function trkWingLabel(){const w=WING_ORDER.filter(id=>WSTATE[id].on).map(id=>TRK_WNAME[id]+(id==='rear'&&WSTATE.rear.drs?' (DRS)':''));return w.length?' con '+w.join(', '):' senza ali';}
function vesperaVehicle(m,kw,mu){
  const tb=[];for(let k=0;k<=460;k+=5){const E=equilibrium(k);tb.push([E.q*E.m.CdA,-E.q*E.m.front,-E.q*E.m.rear]);}
  const n=tb.length-1;
  const aero=v=>{const x=Math.min(Math.abs(v)*3.6/5,n-0.001),i=Math.floor(x),f=x-i,a=tb[i],b=tb[i+1];return {D:a[0]+(b[0]-a[0])*f,Ff:a[1]+(b[1]-a[1])*f,Fr:a[2]+(b[2]-a[2])*f};};
  const E=equilibrium(200);
  return {name:'Vespera GT'+trkWingLabel(),m,kw,mu,wf:STATF,h:YCG,lwb:2*WX,track:2*WZ,len:4.6,wid:1.95,aero,CdA:E.m.CdA,ClA:E.m.ClA};
}
function trkLabName(){return labPresetKey&&LAB_PRESETS[labPresetKey]?LAB_PRESETS[labPresetKey].name:'Forma personalizzata';}
function trkVehicle(){
  if(state.lab&&LAB&&labResult)return labVehicle(LAB,labResult,TRK.mass,TRK.kw,TRK.mu,trkLabName());
  return vesperaVehicle(TRK.mass,TRK.kw,TRK.mu);
}
/* auto del giocatore 2: massa e potenza tipiche di quel tipo, o le stesse del giocatore 1 se sono bloccate */
function trkP2Key(){return TRK.p2key==='same'?(state.lab?'lab':'vespera'):TRK.p2key;}
function trkVehicleP2(){return trkVehicleFor(trkP2Key());}
function trkVehicleFor(k){
  if(k==='vespera'){const p=TRK.same?[TRK.mass,TRK.kw]:TRK_PERF.vespera_full;return vesperaVehicle(p[0],p[1],TRK.mu);}
  if(k==='lab'){return labVehicle(LAB,labResult,TRK.mass,TRK.kw,TRK.mu,trkLabName());}
  const pr=LAB_PRESETS[k],S=labShape(pr.p),R=labDrag(S,labFrontalArea(S)),p=TRK.same?[TRK.mass,TRK.kw]:(TRK_PERF[k]||[1600,250]);
  return labVehicle(S,R,p[0],p[1],TRK.mu,pr.name);
}
function trkTypical(){
  const k=state.lab?(labPresetKey||'sedan'):'vespera_full';
  const p=TRK_PERF[k]||[1600,250];
  TRK.mass=p[0];TRK.kw=p[1];trkSyncSliders();
}

/* ---------- dati del tracciato (senza grafica) ---------- */
function trkEnsureData(){
  if(TRK.data)return;
  TRK.T=trkBuild();TRK.RL=trkRacingLine(TRK.T,1.2);
  const T=TRK.T,N=T.N,hw=T.w/2;
  /* curve con nome: minimi di velocità di un'auto di riferimento */
  const ref={m:1480,kw:460,mu:1.15,wf:0.51,h:0.45,lwb:2.7,track:1.62,aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:-q*0.02,Fr:-q*0.05};}};
  const R0=lapSim(ref,TRK.RL),cs=findCorners(T,TRK.RL,R0.v);
  TRK.corners=cs.map((c,j)=>({i:c.i,n:TRKDEF.corners[j]||`Curva ${j+1}`,left:TRK.RL.k[c.i]>0}));
  TRK.cornerV0=cs.map(c=>R0.v[c.i]);
  /* cordoli (bit 1 sinistra, bit 2 destra) e vie di fuga in ghiaia all'esterno delle curve */
  const kerb=new Uint8Array(N),grav=new Uint8Array(N);
  for(let i=0;i<N;i++){const k=T.k[i],ak=Math.abs(k);
    if(ak>1/190)for(let o=-14;o<=14;o++)kerb[(i+o+N)%N]|=3;
    if(ak>1/150&&!TRKDEF.urban)for(let o=-28;o<=34;o++)grav[(i+o+N)%N]|=(k>0?2:1);}
  /* barriere: lontane 12 m dal bordo (19 dove c'è ghiaia), più vicine all'interno delle curve strette */
  const bar=[new Float64Array(N),new Float64Array(N)];
  for(let s=0;s<2;s++){const sg=s===0?1:-1,raw=new Float64Array(N);
    /* in città: muri a 2,4 m dal bordo, con una strada di scampo all'esterno delle curve lente */
    for(let i=0;i<N;i++){const k=T.k[i];let b=TRKDEF.urban?hw+(k*sg<-1/45?9:2.4):hw+((grav[i]&(s===0?1:2))?19:12);if(k*sg>0)b=Math.min(b,Math.max(hw+(TRKDEF.urban?2.4:3),0.72/Math.abs(k)));raw[i]=b;}
    const mn=new Float64Array(N);for(let i=0;i<N;i++){let m=1e9;for(let o=-12;o<=12;o++)m=Math.min(m,raw[(i+o+N)%N]);mn[i]=m;}
    for(let i=0;i<N;i++){let a=0;for(let o=-10;o<=10;o++)a+=mn[(i+o+N)%N];bar[s][i]=a/21;}}
  /* griglia per trovare in fretta il punto di pista più vicino */
  const cell=40,hash=new Map();for(let i=0;i<N;i+=2){const k=Math.floor(T.X[i]/cell)+','+Math.floor(T.Y[i]/cell);let a=hash.get(k);if(!a)hash.set(k,a=[]);a.push(i);}
  /* torri faro (luce notturna) e telecamere TV a bordo pista */
  const towers=[];for(let k=0,i=30;i<N;i+=55,k++){const s=k%2,sg=s?-1:1,off=sg*(bar[s][i]+3.5);towers.push({i,s,X:T.X[i]+off*T.nx[i],Y:T.Y[i]+off*T.ny[i]});}
  const tvcams=[];for(let k=0;k<16;k++){const i=(Math.round(k*N/16)+20)%N,s=T.k[i]>0?1:0,sg=s?-1:1,off=sg*(bar[s][i]+9);tvcams.push({i,X:T.X[i]+off*T.nx[i],Y:T.Y[i]+off*T.ny[i],H:7+(k*37)%4});}
  Object.assign(TRK,{kerb,grav,bar,hash,cell,towers,tvcams,data:true});
  TRK.pit=trkPitData();const pz=new Uint8Array(N);for(let q=TRK.pit.qIn-30;q<=TRK.pit.qOut+30;q++)pz[((q%N)+N)%N]=1;TRK.pitZone=pz;
  TRK.stands=[N-70,0,70].map(ci=>{const i=(ci+N)%N,off=-(bar[1][i]+12);return {X:T.X[i]+off*T.nx[i],Y:T.Y[i]+off*T.ny[i]};});
  /* lago nel punto dell'infield più lontano dalla pista, con il pelo dell'acqua alla quota del terreno */
  TRK.lake=null;if(!TRKDEF.urban){let best=0,bx=0,by=0;for(let X=-450;X<=650;X+=25)for(let Y=50;Y<=850;Y+=25){if(!trkInside(X,Y))continue;const d=trkDistTrack(X,Y,6);if(d>best){best=d;bx=X;by=Y;}}
   const R=Math.min(120,best*0.5);TRK.lake=[bx,by,R,trkTerrain(bx,by)];}
}
/* corsia dei box: entrata dopo l'ultima curva, corsia oltre il muretto lungo il rettilineo, piazzole davanti ai garage, uscita dopo il traguardo.
   Gli indici q possono superare N: la corsia scavalca la linea del traguardo */
function trkPitData(){
  const N=TRK.T.N,P={qIn:N-178,qA:N-122,qB:N+44,qOut:N+132,lane:2.8,boxOff:6.9,vLim:60/3.6,box:[]};
  for(let k=0;k<8;k++)P.box.push(N-84+k*11);
  return P;
}
function trkBarQ(q){const N=TRK.T.N,b=Math.floor(q),f=q-b,i=((b%N)+N)%N;return TRK.bar[0][i]*(1-f)+TRK.bar[0][(i+1)%N]*f;}
/* distanza laterale del percorso nei box: da d0 (dove si entra) alla corsia, alla piazzola se ci si ferma, poi di nuovo in pista */
function trkPitOff(q,d0,q0,boxQ){
  const Pd=TRK.pit,hw=TRK.T.w/2,lane=trkBarQ(q)+Pd.lane;
  if(q<Pd.qA)return d0+(lane-d0)*smooth01(q,q0,Pd.qA-4);
  if(q<=Pd.qB){if(boxQ==null)return lane;const bx=trkBarQ(q)+Pd.boxOff,f=q<boxQ?smooth01(q,boxQ-15,boxQ-2):1-smooth01(q,boxQ+2,boxQ+14);return lane+(bx-lane)*f;}
  return lane+(hw-2.2-lane)*smooth01(q,Pd.qB,Pd.qOut);
}
function trkLit(X,Y){let l=0;for(const t of TRK.towers){const d2=(X-t.X)*(X-t.X)+(Y-t.Y)*(Y-t.Y);if(d2<14400)l+=1.1/(1+d2/676);}return Math.min(1.35,l);}
/* di notte il suolo è illuminato pixel per pixel dalle torri faro più vicine alla telecamera (con il cono orientato verso la pista)
   e dai fari delle auto avversarie; più lontano vale la luce precalcolata per vertice. Sui materiali lucidi (asfalto, cordoli, guardrail)
   le torri e i fari passano dal modello di luce fisico di three.js, quindi fanno anche il riflesso speculare sul bagnato */
const TRK_NIGHT={value:0};
const TRK_LT={uNight:TRK_NIGHT,uTw:{value:Array.from({length:10},()=>new THREE.Vector4(0,-9999,0,0))},uTwA:{value:Array.from({length:10},()=>new THREE.Vector3(1,0,0))},uFarR:{value:300},
  uHl:{value:Array.from({length:8},()=>new THREE.Vector4(0,-9999,0,0))},uHd:{value:Array.from({length:8},()=>new THREE.Vector3(1,0,0))}};
const TRK_LT_VS=['#include <common>\nvarying vec3 vTwW;','#include <project_vertex>\n{vec4 tw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\ntw=instanceMatrix*tw;\n#endif\nvTwW=(modelMatrix*tw).xyz;}'];
const TRK_LT_FS=`uniform float uNight;uniform vec4 uTw[10];uniform vec3 uTwA[10];uniform float uFarR;uniform vec4 uHl[8];uniform vec3 uHd[8];varying vec3 vTwW;
float trkTwK(int k,vec3 p,out vec3 L){vec3 v=uTw[k].xyz-p;float d2=dot(v,v);L=v*inversesqrt(d2);vec2 hz=-v.xz;float hl=length(hz);
  float aim=hl>0.5?0.3+0.7*smoothstep(-0.3,0.5,dot(hz/hl,uTwA[k].xz)):1.0;return uTw[k].w*aim/(1.0+d2/500.0);}
float trkHlK(int k,vec3 p,out vec3 L){vec3 v=p-uHl[k].xyz;float d=length(v)+1e-3;L=-v/d;float c=dot(v/d,uHd[k]);return uHl[k].w*smoothstep(0.80,0.95,c)*smoothstep(75.0,8.0,d)/(1.0+d*d/500.0);}
float trkNear(){return 1.0-smoothstep(uFarR-80.0,uFarR-30.0,distance(vTwW,cameraPosition));}`;
const TRK_LT_DIRECT=(tw,hl)=>`if(uNight>0.0){vec3 Lw;float nr=trkNear();
  for(int k=0;k<10;k++){float a=trkTwK(k,vTwW,Lw)*uNight*${tw}${hl?'*nr':''};if(a>0.002){IncidentLight tl;tl.direction=normalize((viewMatrix*vec4(Lw,0.0)).xyz);tl.color=vec3(1.0,0.96,0.88)*a;tl.visible=true;RE_Direct(tl,geometry,material,reflectedLight);}}
  ${hl?`for(int k=0;k<8;k++){float a=trkHlK(k,vTwW,Lw)*uNight*${hl};if(a>0.002){IncidentLight tl;tl.direction=normalize((viewMatrix*vec4(normalize(Lw+vec3(0.0,0.7,0.0)),0.0)).xyz);tl.color=vec3(1.0,0.97,0.9)*a;tl.visible=true;RE_Direct(tl,geometry,material,reflectedLight);}}`:''}}`;
function trkNightPatch(mat){
  const std=!!(mat.isMeshStandardMaterial||mat.isMeshPhongMaterial);
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,TRK_LT);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float lit;\nvarying float vLit;'+'\nvarying vec3 vTwW;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLit=lit;').replace('#include <project_vertex>',TRK_LT_VS[1]);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLit;\n'+TRK_LT_FS);
    if(std){sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif(uNight>0.0)totalEmissiveRadiance+=diffuseColor.rgb*vLit*0.75*uNight*(1.0-trkNear());')
      .replace('#include <lights_fragment_begin>','#include <lights_fragment_begin>\n'+TRK_LT_DIRECT('2.4','2.4'));}
    else sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      if(uNight>0.0){vec3 L;float nr=trkNear(),acc=0.0,hl=0.0;for(int k=0;k<10;k++)acc+=trkTwK(k,vTwW,L)*max(L.y,0.0);for(int k=0;k<8;k++)hl+=trkHlK(k,vTwW,L);
        totalEmissiveRadiance+=diffuseColor.rgb*((acc*2.3*nr+vLit*0.75*(1.0-nr))+hl*1.5)*uNight;}`);
    if(mat.userData.wuv)trkWorldUV(sh,mat.userData.wuv,mat.userData.mac);};
  mat.customProgramCacheKey=()=>'trknight2-'+mat.type+'|'+(mat.userData.wuv||0)+'|'+(mat.userData.mac==null?'n':mat.userData.mac);return mat;
}
/* carrozzerie: anche le auto, passando sotto le torri faro, si illuminano e ne riflettono la luce;
   durante la gara si sporcano dal basso (polvere, gomma, spruzzi sul bagnato): la sporcizia toglie lucido alla vernice */
const TRK_PREV=new WeakMap();
const TRK_DIRT_GLSL=`uniform float uDirt,uWetD;varying vec3 vDirtP;varying float vDirtH;`+`float trkH2d(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float trkVNd(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(trkH2d(i),trkH2d(i+vec2(1.0,0.0)),f.x),mix(trkH2d(i+vec2(0.0,1.0)),trkH2d(i+vec2(1.0,1.0)),f.x),f.y);}`;
function trkCarLightPatch(mat){
  if(!mat||mat.userData.trkLit||!(mat.isMeshStandardMaterial||mat.isMeshPhongMaterial))return mat;mat.userData.trkLit=true;
  const own=Object.prototype.hasOwnProperty.call(mat,'onBeforeCompile'),prev=own?mat.onBeforeCompile:null,key0=Object.prototype.hasOwnProperty.call(mat,'customProgramCacheKey')?mat.customProgramCacheKey():(prev?prev.toString():'');
  if(prev)TRK_PREV.set(mat,prev);
  const du={uDirt:{value:0},uWetD:{value:0},uGround:{value:0}};mat.userData.du=du;Object.defineProperty(mat,'trkDirt',{value:du,configurable:true});
  mat.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);Object.assign(sh.uniforms,TRK_LT,du);
    sh.vertexShader=sh.vertexShader.replace('#include <common>',TRK_LT_VS[0]+'\nuniform float uGround;varying vec3 vDirtP;varying float vDirtH;').replace('#include <project_vertex>',TRK_LT_VS[1]+'\nvDirtP=position;vDirtH=(modelMatrix*vec4(transformed,1.0)).y-uGround;');
    let f=sh.fragmentShader.replace('#include <common>','#include <common>\n'+TRK_LT_FS+'\n'+TRK_DIRT_GLSL).replace('#include <lights_fragment_begin>','#include <lights_fragment_begin>\n'+TRK_LT_DIRECT('2.6',''));
    f=f.replace('#include <color_fragment>',`#include <color_fragment>
      float trkDirtM=0.0;if(uDirt>0.001){float n=trkVNd(vDirtP.xz*6.0+vec2(vDirtP.y*3.0))*0.6+trkVNd(vDirtP.xz*21.0+3.1)*0.4;
        trkDirtM=(1.0-smoothstep(0.08,0.7,vDirtH+(n-0.5)*0.25))*smoothstep(0.3,0.75,n+uDirt*0.55-0.2)*uDirt;
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(0.15,0.125,0.095),vec3(0.045,0.04,0.035),uWetD),clamp(trkDirtM*0.9,0.0,0.85));}`);
    if(f.includes('#include <roughnessmap_fragment>'))f=f.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,0.92,clamp(trkDirtM*0.9,0.0,0.9));');
    f=f.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\n#ifdef CLEARCOAT\nmaterial.clearcoat*=1.0-clamp(trkDirtM,0.0,0.9);\n#endif');
    sh.fragmentShader=f;};
  mat.customProgramCacheKey=()=>key0+'|trkcarlit2';mat.needsUpdate=true;return mat;
}
/* una copia di un materiale di base già modificato: si riparte dal suo onBeforeCompile originale e si rimette la patch con le sue uniform */
function trkCarLightClone(base){const m=base.clone();delete m.userData.trkLit;delete m.userData.du;const pv=base.userData.trkLit?TRK_PREV.get(base):(Object.prototype.hasOwnProperty.call(base,'onBeforeCompile')?base.onBeforeCompile:null);if(pv)m.onBeforeCompile=pv;return trkCarLightPatch(m);}
function trkDirtSet(mats,dirt,wet,ground){for(const m of mats){const d=m&&m.trkDirt;if(!d)continue;d.uDirt.value=dirt;d.uWetD.value=wet;d.uGround.value=ground;}}
function trkNearest(X,Y){const c=TRK.cell,cx=Math.floor(X/c),cy=Math.floor(Y/c),T=TRK.T;let best=1e18,bi=-1;
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const l=TRK.hash.get((cx+a)+','+(cy+b));if(!l)continue;for(const i of l){const dx=X-T.X[i],dy=Y-T.Y[i],d=dx*dx+dy*dy;if(d<best){best=d;bi=i;}}}
  return {i:bi,d:Math.sqrt(best)};}
/* quota del terreno: colline, piatto attorno al lago, raccordato alla strada (pianoro fino alle barriere, poi sale o scende dolcemente) */
function trkGroundH(X,Y){
  let h=trkTerrain(X,Y);
  if(TRK.lake){const [lx,ly,lr,lh]=TRK.lake,d=Math.hypot(X-lx,Y-ly);if(d<lr*1.7){const f=smooth01(d,lr*1.05,lr*1.7);h=lh+(h-lh)*f;}}
  const n=trkNearest(X,Y);if(n.i>=0&&n.d<90){const pz=TRK.pitZone&&TRK.pitZone[n.i],r0=pz?47:21,r1=pz?85:60;if(n.d<r1){const hr=TRK.T.h[n.i],f=smooth01(n.d,r0,r1);h=hr+(h-hr)*f-0.15*(1-f);}}
  return h;
}
function trkCornerSpeeds(sim){const v=sim.v,N=v.length;return TRK.corners.map(c=>{let m=1e9;for(let o=-70;o<=70;o++)m=Math.min(m,v[(c.i+o+N)%N]);return m;});}
function trkCompute(){
  trkEnsureData();
  const id=state.lab?'lab:'+(labPresetKey||'custom'):'vespera';if(id!==TRK.lastId){TRK.lastId=id;if(!TRK.same)trkTypical();}
  const P1=TRK.p[0];if(!TRK.on)trkWxPreset();P1.tire=TRK.tire;
  P1.veh=trkVehicle();P1.simG=trkWxGrip(P1.tire,TRK.wet);P1.sim=lapSim(P1.veh,TRK.RL,P1.simG);P1.cornerV=trkCornerSpeeds(P1.sim);
  TRK.veh=P1.veh;TRK.sim=P1.sim;TRK.cornerV=P1.cornerV;
  if(TRK.on&&!state.lab&&P1.vis&&P1.vis.kind==='vespera')trkCarVisual(P1,'vespera');
  if(TRK.split&&TRK.on){const P2=TRK.p[1];P2.veh=trkVehicleP2();P2.veh.mu=TRK_TIRES[P2.tire].mu;P2.simG=trkWxGrip(P2.tire,TRK.wet);P2.sim=lapSim(P2.veh,TRK.RL,P2.simG);P2.cornerV=trkCornerSpeeds(P2.sim);}
  TRK.dirty=false;
  trkPanel();
}
function trkDirty(){TRK.dirty=true;TRK.dirtyT=performance.now();if(!TRK.on){clearTimeout(TRK._dt);TRK._dt=setTimeout(()=>{if(TRK.dirty&&TRK.data&&!document.getElementById('tPista').hidden)trkCompute();},250);}}

/* ---------- superfici ---------- */
const TRK_SURF={asfalto:{mu:1,crr:0.012},cordolo:{mu:0.92,crr:0.02},ghiaia:{mu:0.45,crr:0.30},erba:{mu:0.55,crr:0.08}};
function trkSurface(i,d){
  const hw=TRK.T.w/2,ad=Math.abs(d),bit=d>0?1:2;
  if(ad<=hw)return 'asfalto';
  if(ad<=hw+1.3&&(TRK.kerb[i]&bit))return 'cordolo';
  if((TRK.grav[i]&bit)&&ad<=hw+19)return 'ghiaia';
  if(TRKDEF.urban)return 'asfalto';  // in città oltre il bordo c'è ancora asfalto, fino al muro
  return 'erba';
}
function trkLocate(X,Y,i0,win){
  const T=TRK.T,N=T.N;let best=1e18,bi=i0;
  for(let o=-win;o<=win;o++){const i=(i0+o+N)%N,dx=X-T.X[i],dy=Y-T.Y[i],d=dx*dx+dy*dy;if(d<best){best=d;bi=i;}}
  return bi;
}
function trkLocateAll(X,Y){const T=TRK.T;let best=1e18,bi=0;for(let i=0;i<T.N;i++){const dx=X-T.X[i],dy=Y-T.Y[i],d=dx*dx+dy*dy;if(d<best){best=d;bi=i;}}return bi;}
function trkInside(X,Y){const T=TRK.T;let c=false;for(let i=0,j=T.N-1;i<T.N;j=i++){if((T.Y[i]>Y)!==(T.Y[j]>Y)&&X<(T.X[j]-T.X[i])*(Y-T.Y[i])/(T.Y[j]-T.Y[i])+T.X[i])c=!c;}return c;}
function trkDistTrack(X,Y,step){const T=TRK.T;let md=1e18;for(let i=0;i<T.N;i+=step||4){const dx=X-T.X[i],dy=Y-T.Y[i];md=Math.min(md,dx*dx+dy*dy);}return Math.sqrt(md);}

/* =========================================================
   Mondo 3D (costruito la prima volta che si scende in pista)
   ========================================================= */
const rig=new THREE.Group();scene.add(rig);rig.add(car);rig.add(labG);
const rig2=new THREE.Group();rig2.visible=false;scene.add(rig2);
const camera2=new THREE.PerspectiveCamera(60,1,0.1,6000);
const trkWorld=new THREE.Group();trkWorld.visible=false;scene.add(trkWorld);
const trkHemi=new THREE.HemisphereLight(0xcfe3ff,0x5a6a3a,0.55);trkHemi.visible=false;scene.add(trkHemi);
scene.add(key.target);
let trkSky=null,trkEnv=null,trkFog=null;
const trkOff={polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2};
function trkNoiseTex(size,base,spread,rep,extra){
  return canvasTex(size,(g,s)=>{g.fillStyle=base;g.fillRect(0,0,s,s);const id=g.getImageData(0,0,s,s),d=id.data;
    for(let i=0;i<d.length;i+=4){const n=(Math.random()-0.5)*spread;d[i]=clamp(d[i]+n,0,255);d[i+1]=clamp(d[i+1]+n,0,255);d[i+2]=clamp(d[i+2]+n*0.9,0,255);}
    g.putImageData(id,0,0);if(extra)extra(g,s);},rep);
}
function trkRibbon(i0,i1,offA,offB,y,vLen,mat,y2){
  const T=TRK.T,N=T.N,pos=[],uv=[],idx=[];let n=0,s=0;if(i1<i0)i1+=N;
  const fa=typeof offA==='function'?offA:()=>offA,fb=typeof offB==='function'?offB:()=>offB;
  for(let k=i0;;k++){const i=((k%N)+N)%N,a=fa(i),b=fb(i);
    const hy=T.h[i];
    if(y2===undefined){pos.push(T.X[i]+a*T.nx[i],y+hy,-(T.Y[i]+a*T.ny[i]),T.X[i]+b*T.nx[i],y+hy,-(T.Y[i]+b*T.ny[i]));}
    else{pos.push(T.X[i]+a*T.nx[i],y+hy,-(T.Y[i]+a*T.ny[i]),T.X[i]+a*T.nx[i],y2+hy,-(T.Y[i]+a*T.ny[i]));}
    uv.push(0,s/vLen,1,s/vLen);if(n>0){const p=2*(n-1);idx.push(p,p+1,p+2,p+1,p+3,p+2);}n++;s+=T.ds;if(k===i1)break;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const lit=new Float32Array(pos.length/3);for(let q=0;q<lit.length;q++)lit[q]=trkLit(pos[q*3],-pos[q*3+2]);g.setAttribute('lit',new THREE.BufferAttribute(lit,1));
  /* le facce devono guardare in su (o verso la pista per le barriere): se no si invertono */
  const nrm=g.attributes.normal.array;if(y2===undefined&&nrm[1]<0){for(let q=0;q<idx.length;q+=3){const t=idx[q+1];idx[q+1]=idx[q+2];idx[q+2]=t;}g.setIndex(idx);g.computeVertexNormals();}
  const o=new THREE.Mesh(g,mat);o.receiveShadow=true;o.userData.flat=y2===undefined;TRK.tw.add(o);return o;
}
function trkRuns(flags,bit){const N=TRK.T.N,runs=[];let start=-1;
  let s0=0;while(s0<N&&(flags[s0]&bit))s0++;if(s0===N)return [[0,N]];
  for(let k=0;k<=N;k++){const i=(s0+k)%N,on=(flags[i]&bit)&&k<N;if(on&&start<0)start=s0+k;if(!on&&start>=0){runs.push([start,s0+k-1]);start=-1;}}
  return runs;}
function trkPlace(o,i,d,y,yaw){const T=TRK.T;i=((i%T.N)+T.N)%T.N;o.position.set(T.X[i]+d*T.nx[i],y+T.h[i],-(T.Y[i]+d*T.ny[i]));o.rotation.y=Math.atan2(T.ty[i],T.tx[i])+(yaw||0);TRK.tw.add(o);return o;}
function trkTextTex(w,h,draw){return canvasTex(w,(g,s,hh)=>draw(g,s,hh),null,h);}
const TRK_FONT='"Saira Condensed","Arial Narrow",sans-serif';
function trkBuildWorld(){
  if(TRK.built)return;trkEnsureData();
  /* tutto ciò che appartiene al circuito sta in un gruppo: cambiando pista lo si butta e lo si ricostruisce */
  TRK.tw=new THREE.Group();trkWorld.add(TRK.tw);
  const T=TRK.T,N=T.N,hw=T.w/2,off=trkOff,D=TRKDEF,km=(T.L/1000).toFixed(2).replace('.',',')+' KM';
  /* cielo, nebbia di lontananza e riflessi da esterno */
  trkSky=canvasTex(4,(g,s,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#4f86d0');gr.addColorStop(0.42,'#8fb8e6');gr.addColorStop(0.5,'#d9e6ee');gr.addColorStop(1,'#d9e6ee');g.fillStyle=gr;g.fillRect(0,0,s,h);},null,512);
  trkFog=new THREE.Fog(0xd9e6ee,260,2800);
  {const es=new THREE.Scene(),sg=new THREE.SphereGeometry(50,32,16),col=[];const p=sg.attributes.position;
   for(let i=0;i<p.count;i++){const y=p.getY(i)/50;const c=y>0?new THREE.Color(0x9cc3ee).lerp(new THREE.Color(0x3f74c2),Math.min(1,y*1.6)):new THREE.Color(0x56603a).lerp(new THREE.Color(0x30351f),Math.min(1,-y*2));col.push(c.r,c.g,c.b);}
   sg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));es.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
   const sun=new THREE.Mesh(new THREE.SphereGeometry(4,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(0xfff2d8).multiplyScalar(5)}));sun.position.set(-20,34,-15);es.add(sun);
   trkEnv=pmrem.fromScene(es,0.02).texture;}
  /* prato con le strisce del tosaerba */
  const grassTex=TRKDEF.urban?(trkPhotoTex('ph-pavement-color',true)||trkConcreteTex().map):trkGrassTex().map;
  /* prato a riquadri e spinto indietro nella profondità: così non litiga mai con l'asfalto che gli sta 5 cm sopra */
  const grassMat=trkNightPatch(new THREE.MeshLambertMaterial({map:grassTex,vertexColors:true,polygonOffset:true,polygonOffsetFactor:4,polygonOffsetUnits:8}));TRK.grassMat=grassMat;if(TRKDEF.urban)grassMat.color.setHex(TRK_PHOTO['ph-pavement-color']?0x9a9a9a:0x46494d);grassMat.userData.wuv=6;grassMat.userData.mac=0.12;
  /* terreno con le colline attorno alla pista (celle da 12 m) e una pianura piatta oltre */
  {const g=new THREE.PlaneGeometry(3400,3400,280,280);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;
   for(let k=0;k<p.count;k++){const X=p.getX(k)+110,Y=-(p.getZ(k)-430);p.setXYZ(k,X,trkGroundH(X,Y),-Y);uv.setXY(k,uv.getX(k)*3400/9000,uv.getY(k)*3400/9000);}
   const lit=new Float32Array(p.count);for(let k=0;k<p.count;k++)lit[k]=trkLit(p.getX(k),-p.getZ(k))*0.7;g.setAttribute('lit',new THREE.BufferAttribute(lit,1));
   g.computeVertexNormals();
   /* variazioni di colore su grande scala: chiazze più secche, più scure o più gialle, prato più verde vicino alla pista, pendii più scuri */
   const col=new Float32Array(p.count*3),nr=g.attributes.normal,vn=(x,y)=>Math.sin(x*0.011+Math.sin(y*0.007)*2.1)*0.5+Math.sin(y*0.013-x*0.004+1.7)*0.35+Math.sin((x+y)*0.031)*0.15;
   for(let k=0;k<p.count;k++){const X=p.getX(k),Y=-p.getZ(k),n1=vn(X,Y),n2=vn(Y*1.7+300,X*1.3-200),slope=1-nr.getY(k),dt=trkDistTrack(X,Y,12),near=1-smooth01(dt,30,110);
     const br=0.93+0.13*n1-0.35*slope+0.05*near,dry=clamp(0.5+0.5*n2-0.3*near,0,1)*(TRKDEF.autumn?0.55:0.35);
     col[k*3]=br*(1+0.22*dry);col[k*3+1]=br*(1+0.04*dry);col[k*3+2]=br*(1-0.25*dry);}
   g.setAttribute('color',new THREE.BufferAttribute(col,3));
   const terr=new THREE.Mesh(g,grassMat);terr.receiveShadow=true;terr.userData.flat=true;TRK.tw.add(terr);TRK.terrain=terr;
   const fg=new THREE.PlaneGeometry(9000,9000,30,30),fc=new Float32Array(fg.attributes.position.count*3).fill(0.82);fg.setAttribute('color',new THREE.BufferAttribute(fc,3));
   const far=new THREE.Mesh(fg,grassMat);far.rotation.x=-Math.PI/2;far.position.set(110,-0.4,-440);far.receiveShadow=true;far.userData.flat=true;TRK.tw.add(far);}
  /* asfalto, linee bianche, cordoli, ghiaia */
  const AT=trkAsphaltTex(),asphalt=new THREE.MeshStandardMaterial({map:AT.map,normalMap:AT.normal,normalScale:new THREE.Vector2(0.5,0.5),roughness:0.92,metalness:0,envMapIntensity:0.4});
  asphalt.userData.wuv=5;asphalt.userData.mac=0.1;
  TRK.asphalt=trkNightPatch(asphalt);TRK.asphaltColor=asphalt.color.clone();
  /* pozzanghere: chiazze lisce che sul bagnato riflettono il cielo */
  TRK.puddleTex=canvasTex(256,(g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);for(let k=0;k<26;k++){const x=Math.random()*s,y=Math.random()*s,r=8+Math.random()*30,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(40,40,40,1)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r*1.6,r,Math.random()*3,0,7);g.fill();}},[1.5,1]);
  TRK.puddleTex.encoding=THREE.LinearEncoding;
  trkRibbon(0,N,hw+0.35,-hw-0.35,0,10,asphalt);
  /* tracce di gomma sulla traiettoria ideale */
  const rubberMat=new THREE.MeshBasicMaterial(Object.assign({color:0x111214,transparent:true,opacity:0.22,depthWrite:false},off));
  trkRibbon(0,N,i=>TRK.RL.e[i]+1.1,i=>TRK.RL.e[i]-1.1,0.006,10,rubberMat);
  /* traiettoria asciutta: quando la pioggia smette, le auto asciugano per prime la linea ideale (sfumata ai bordi) */
  {const am=canvasTex(64,(g,s2,h)=>{const gr=g.createLinearGradient(0,0,s2,0);gr.addColorStop(0,'#000');gr.addColorStop(0.3,'#fff');gr.addColorStop(0.7,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,s2,h);},null,8);
   TRK.dryMat=trkNightPatch(new THREE.MeshStandardMaterial(Object.assign({color:TRK.asphaltColor.clone().multiplyScalar(0.24),roughness:0.9,envMapIntensity:0.4,alphaMap:am,transparent:true,opacity:0,depthWrite:false},off)));
   TRK.dryRib=trkRibbon(0,N,i=>TRK.RL.e[i]+1.9,i=>TRK.RL.e[i]-1.9,0.004,10,TRK.dryMat);TRK.dryRib.visible=false;}
  const white=trkNightPatch(new THREE.MeshStandardMaterial(Object.assign({color:0xf2f2ee,roughness:0.6,envMapIntensity:0.4},off)));TRK.white=white;
  trkRibbon(0,N,hw-0.05,hw-0.3,0.012,10,white);trkRibbon(0,N,-hw+0.3,-hw+0.05,0.012,10,white);
  const KT=trkKerbTex();
  const kerbMat=trkNightPatch(new THREE.MeshStandardMaterial(Object.assign({map:KT.map,normalMap:KT.normal,normalScale:new THREE.Vector2(0.6,0.6),roughness:0.55,envMapIntensity:0.4},off)));TRK.kerbMat=kerbMat;
  for(const [bit,sg] of [[1,1],[2,-1]])for(const [a,b] of trkRuns(TRK.kerb,bit)){trkRibbon(a,b,sg*(hw-0.02),sg*(hw+1.3),0.02,3,kerbMat);
    /* bordino verticale del cordolo */
    trkRibbon(a,b,sg*(hw+1.3),0,0,3,kerbMat,0.06);}
  const GV=trkGravelTex(),gravMat=new THREE.MeshStandardMaterial(Object.assign({map:GV.map,normalMap:GV.normal,normalScale:new THREE.Vector2(0.9,0.9),roughness:1,metalness:0,envMapIntensity:0.3},off));gravMat.userData.wuv=2.5;gravMat.userData.mac=0.15;trkNightPatch(gravMat);
  for(const [bit,sg] of [[1,1],[2,-1]])for(const [a,b] of trkRuns(TRK.grav,bit))trkRibbon(a,b,sg*(hw+1.3),i=>sg*(TRK.bar[bit-1][i]-0.6),0.008,8,gravMat);
  /* barriere: guard rail metallico con una fascia bianca e rossa */
  const RT=trkRailTex();
  const railMat=trkNightPatch(new THREE.MeshStandardMaterial({map:RT.map,normalMap:RT.normal,metalness:0.55,roughness:0.45,side:THREE.DoubleSide,envMapIntensity:0.6}));
  if(!TRKDEF.urban){const Pd=TRK.pit;trkRibbon(Pd.qB+32-N,Pd.qIn+28,i=>TRK.bar[0][i],0,0,4,railMat,0.95);trkRibbon(0,N,i=>-TRK.bar[1][i],0,0,4,railMat,0.95);}
  /* traguardo a scacchi e caselle della griglia di partenza */
  const chk=canvasTex(64,(g,s,h)=>{const n=8,c=s/n;for(let y=0;y<2;y++)for(let x=0;x<n;x++){g.fillStyle=(x+y)%2?'#111':'#f4f4f4';g.fillRect(x*c,y*h/2,c,h/2);}},null,16);
  const line=new THREE.Mesh(new THREE.PlaneGeometry(1.6,T.w),new THREE.MeshStandardMaterial(Object.assign({map:chk,roughness:0.6},off)));line.rotation.x=-Math.PI/2;
  const lg=new THREE.Group();lg.add(line);line.position.y=0.014;trkPlace(lg,0,0,0);
  for(let k=0;k<8;k++){const i=N-4-4*k,sd=(k%2?-1:1)*3.0,box=new THREE.Group();
    const front=new THREE.Mesh(new THREE.PlaneGeometry(0.22,2.4),white);front.rotation.x=-Math.PI/2;front.position.set(0,0.013,0);box.add(front);
    for(const z of [-1.2,1.2]){const sideL=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.18),white);sideL.rotation.x=-Math.PI/2;sideL.position.set(-0.7,0.013,z);box.add(sideL);}
    trkPlace(box,i,sd,0);}
  /* portale di partenza con semafori e striscione */
  const steel=new THREE.MeshStandardMaterial({color:0x2a2e33,metalness:0.7,roughness:0.4});TRK.steel=steel;
  const gantry=new THREE.Group();
  for(const z of [-(hw+1.6),hw+1.6]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.6,7.4,0.6),steel);p.position.set(0,3.7,z);gantry.add(p);}
  const beam=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.4,T.w+4),steel);beam.position.set(0,6.9,0);gantry.add(beam);
  const banner=trkTextTex(1024,128,(g,s,h)=>{g.fillStyle='#14171a';g.fillRect(0,0,s,h);g.fillStyle='#f1f1ee';g.font=`800 78px ${TRK_FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(D.banner,s/2,h/2+4);g.fillStyle='#c4261d';g.fillRect(0,h-10,s,10);});
  for(const sx of [-0.46,0.46]){const b=new THREE.Mesh(new THREE.PlaneGeometry(T.w+3.6,1.2),new THREE.MeshBasicMaterial({map:banner}));b.position.set(sx,6.9,0);b.rotation.y=sx<0?-Math.PI/2:Math.PI/2;gantry.add(b);}
  TRK.lamps=[];
  for(let k=0;k<5;k++){const lm=new THREE.MeshStandardMaterial({color:0x220000,emissive:0xff1a10,emissiveIntensity:0});TRK.lamps.push(lm);
    const l=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.12,16),lm);l.rotation.z=Math.PI/2;l.position.set(-0.5,5.75,(k-2)*0.8);gantry.add(l);
    const hood=new THREE.Mesh(new THREE.CylinderGeometry(0.27,0.27,0.18,16,1,true,0,Math.PI),steel);hood.rotation.set(0,0,Math.PI/2);hood.position.set(-0.6,5.75,(k-2)*0.8);gantry.add(hood);}
  trkPlace(gantry,0,0,0);
  /* tribune sul lato esterno del rettilineo, con rete di protezione */
  const crowdTex=canvasTex(256,(g,s,h)=>{g.fillStyle='#3a3f46';g.fillRect(0,0,s,h);const cols=['#d9d4c8','#2e4f8a','#b43a2c','#e3b23c','#1f2226','#6d8a3a','#efefef'];for(let y=2;y<h;y+=7)for(let x=1;x<s;x+=4){if(Math.random()<0.78){g.fillStyle=cols[Math.floor(Math.random()*cols.length)];g.fillRect(x,y,3,4);}}},null,64);
  crowdTex.wrapS=THREE.RepeatWrapping;
  const standMat=trkWorldMap(new THREE.MeshLambertMaterial({color:0x9da3aa,map:trkConcreteTex().map}),3,0.12),crowdMat=trkCrowdPatch(new THREE.MeshLambertMaterial({map:crowdTex})),roofMat=new THREE.MeshStandardMaterial({color:0xe9ebec,metalness:0.3,roughness:0.5});
  TRK.standMat=standMat;TRK.roofMat=roofMat;
  for(const ci of [N-70,-1,70]){const i=(ci+N)%N,st=new THREE.Group(),len=110;
    for(let r=0;r<9;r++){const step=new THREE.Mesh(new THREE.BoxGeometry(len,0.55,1.6),standMat);step.position.set(0,0.3+r*0.55,-(r*1.6));st.add(step);
      const c=new THREE.Mesh(new THREE.PlaneGeometry(len,0.5),crowdMat);c.position.set(0,0.85+r*0.55,-(r*1.6)+0.81);st.add(c);}
    const back=new THREE.Mesh(new THREE.BoxGeometry(len,6,0.4),standMat);back.position.set(0,3,-15);st.add(back);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(len,0.3,17),roofMat);roof.position.set(0,9.6,-7);roof.rotation.x=-0.06;st.add(roof);
    for(let x=-len/2+5;x<=len/2-5;x+=20){const col=new THREE.Mesh(new THREE.BoxGeometry(0.4,9.5,0.4),steel);col.position.set(x,4.8,-14.6);st.add(col);}
    for(let x=-len/2;x<=len/2;x+=27.5){const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,4,6),steel);pole.position.set(x,12,-7);st.add(pole);
      const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.9),new THREE.MeshLambertMaterial({color:[0xc4261d,0xf1f1ee,0x1f6b3a,0x2e4f8a][Math.floor(Math.random()*4)],side:THREE.DoubleSide}));flag.position.set(x+0.72,13.4,-7);st.add(flag);}
    trkPlace(st,i,-(TRK.bar[1][i]+5),0,Math.PI);}
  const fenceTex=canvasTex(64,(g,s,h)=>{g.clearRect(0,0,s,h);g.strokeStyle='rgba(60,64,68,.9)';g.lineWidth=1.4;for(let k=-s;k<s*2;k+=8){g.beginPath();g.moveTo(k,0);g.lineTo(k+h,h);g.stroke();g.beginPath();g.moveTo(k,h);g.lineTo(k+h,0);g.stroke();}g.fillStyle='rgba(50,54,58,1)';g.fillRect(0,0,3,h);},null,64);
  fenceTex.wrapS=fenceTex.wrapT=THREE.RepeatWrapping;
  const fenceMat=trkNightPatch(new THREE.MeshStandardMaterial({map:fenceTex,transparent:true,alphaTest:0.3,side:THREE.DoubleSide,metalness:0.4,roughness:0.6}));
  trkRibbon(N-130,N+135,i=>-TRK.bar[1][i]-0.05,0,0.95,3,fenceMat,4.2);
  /* striscioni sul guard rail davanti alle tribune */
  const advTex=trkTextTex(512,64,(g,s,h)=>{g.fillStyle='#1d2126';g.fillRect(0,0,s,h);g.fillStyle='#f1f1ee';g.font=`800 40px ${TRK_FONT}`;g.textBaseline='middle';g.fillText(D.short.toUpperCase(),14,h/2+2);const wS=g.measureText(D.short.toUpperCase()).width;g.fillStyle='#c4261d';g.fillText('·',wS+24,h/2+2);g.fillStyle='#e3b23c';g.fillText(km,wS+52,h/2+2);g.fillStyle='#f1f1ee';g.fillText('VESPERA',380,h/2+2);});
  const advMat=new THREE.MeshBasicMaterial({map:advTex});
  for(let i=-130;i<135;i+=8){const ii=(i+N)%N,b=new THREE.Mesh(new THREE.PlaneGeometry(16,0.78),advMat),g=new THREE.Group();b.position.y=0.5;g.add(b);trkPlace(g,ii,-(TRK.bar[1][ii]-0.08),0,Math.PI);}
  /* corsia dei box: entrata, corsia veloce e piazzole, uscita; muretto, linee del limitatore, cartello dei 60 */
  {const Pd=TRK.pit,i0=Pd.qA-4,i1=Pd.qB+2,c0=hw-1;
   trkRibbon(i0-N,i1-N,i=>TRK.bar[0][i]+0.6,i=>TRK.bar[0][i]+10,0.004,10,asphalt);
   trkRibbon(i0-N,i1-N,i=>TRK.bar[0][i]+5.1,i=>TRK.bar[0][i]+4.9,0.014,10,white);
   const qq=i=>{let q=i;while(q<Pd.qIn-50)q+=N;while(q>Pd.qOut+50)q-=N;return q;};
   const inC=q=>c0+(trkBarQ(q)+Pd.lane-c0)*smooth01(q,Pd.qIn,Pd.qA-4),outC=q=>trkBarQ(q)+Pd.lane+(hw-2.2-trkBarQ(q)-Pd.lane)*smooth01(q,Pd.qB,Pd.qOut);
   const edge=hw+0.36;
   trkRibbon(Pd.qIn-N,Pd.qA-3-N,i=>{const q=qq(i);return Math.max(edge,inC(q)-3.0*smooth01(q,Pd.qIn,Pd.qIn+18));},i=>{const q=qq(i);return edge+0.01+Math.max(0,inC(q)+3.0-edge)*smooth01(q,Pd.qIn,Pd.qIn+18);},0.003,10,asphalt);
   trkRibbon(Pd.qB+1-N,Pd.qOut-N,i=>{const q=qq(i);return Math.max(edge,outC(q)-3.0*(1-smooth01(q,Pd.qOut-18,Pd.qOut)));},i=>{const q=qq(i);return edge+0.01+Math.max(0,outC(q)+3.0-edge)*(1-smooth01(q,Pd.qOut-18,Pd.qOut));},0.003,10,asphalt);
   /* linea bianca sul lato interno delle strade di entrata e uscita */
   trkRibbon(Pd.qIn+10-N,Pd.qA-3-N,i=>{const q=qq(i);return Math.max(edge,inC(q)-3.0)+0.05;},i=>{const q=qq(i);return Math.max(edge,inC(q)-3.0)+0.3;},0.012,10,white);
   trkRibbon(Pd.qB+1-N,Pd.qOut-10-N,i=>{const q=qq(i);return Math.max(edge,outC(q)-3.0)+0.05;},i=>{const q=qq(i);return Math.max(edge,outC(q)-3.0)+0.3;},0.012,10,white);
   /* muretto dei box tra pista e corsia */
   const wallMat=new THREE.MeshStandardMaterial({color:0xe2e4e6,map:trkConcreteTex().map,roughness:0.85,side:THREE.DoubleSide});wallMat.userData.wuv=3;trkNightPatch(wallMat);TRK.pitWallMat=wallMat;
   trkRibbon(Pd.qA-6-N,Pd.qB+4-N,i=>TRK.bar[0][i],0,0,4,wallMat,1.05);
   /* linee del limitatore all'inizio e alla fine della corsia */
   const limM=new THREE.MeshStandardMaterial(Object.assign({color:0xf2f2ee,roughness:0.6},off));
   for(const q of [Pd.qA,Pd.qB]){const i=q%N,g=new THREE.Group(),m=new THREE.Mesh(new THREE.PlaneGeometry(0.5,9.4),limM);m.rotation.x=-Math.PI/2;m.position.y=0.016;g.add(m);trkPlace(g,i,TRK.bar[0][i]+5.3,0);}
   /* piazzole gialle davanti ai garage */
   const boxM=new THREE.MeshStandardMaterial(Object.assign({color:0xe8c21a,roughness:0.6},off));
   for(const q of Pd.box){const i=q%N,g=new THREE.Group(),L=5.6,W=2.8;
     for(const z of [-W/2,W/2]){const m=new THREE.Mesh(new THREE.PlaneGeometry(L,0.14),boxM);m.rotation.x=-Math.PI/2;m.position.set(0,0.016,z);g.add(m);}
     const fr=new THREE.Mesh(new THREE.PlaneGeometry(0.14,W),boxM);fr.rotation.x=-Math.PI/2;fr.position.set(L/2,0.016,0);g.add(fr);
     trkPlace(g,i,TRK.bar[0][i]+Pd.boxOff,0);}
   /* cartello del limite di velocità all'entrata */
   {const sign=trkTextTex(128,128,(g,s2,h)=>{g.fillStyle='#fff';g.beginPath();g.arc(s2/2,h/2,60,0,7);g.fill();g.lineWidth=14;g.strokeStyle='#c4261d';g.stroke();g.fillStyle='#14171a';g.font=`800 62px ${TRK_FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('60',s2/2,h/2+4);});
    const b=new THREE.Group(),p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:sign,transparent:true}));p.position.y=2.1;p.rotation.y=-Math.PI/2;b.add(p);
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.6,0.08),steel);post.position.y=0.8;b.add(post);const i=(Pd.qA-10)%N;trkPlace(b,i,TRK.bar[0][i]+11,0);}
   const i=(N-35)%N,pit=new THREE.Group(),len=210;
   const doors=canvasTex(512,(g,s,h)=>{g.fillStyle='#d9dcdf';g.fillRect(0,0,s,h);for(let k=0;k<16;k++){const x=k*s/16+4;g.fillStyle='#1d2126';g.fillRect(x,h*0.28,s/16-8,h*0.72);g.fillStyle='#c4261d';g.fillRect(x,h*0.18,s/16-8,h*0.06);g.fillStyle='#f1f1ee';g.font=`700 9px ${TRK_FONT}`;g.fillText(String(k+1),x+2,h*0.14);}},null,64);
   const body=new THREE.Mesh(new THREE.BoxGeometry(len,8,16),[standMat,standMat,roofMat,standMat,new THREE.MeshLambertMaterial({map:doors}),standMat]);body.position.set(0,4,0);pit.add(body);
   const glassM=new THREE.MeshStandardMaterial({color:0x1d2126,metalness:0.4,roughness:0.15});
   const tower=new THREE.Mesh(new THREE.BoxGeometry(14,10,10),glassM);tower.position.set(-60,13,0);pit.add(tower);
   const terrace=new THREE.Mesh(new THREE.BoxGeometry(len,0.4,4),roofMat);terrace.position.set(0,8.2,9.5);pit.add(terrace);
   trkPlace(pit,i,TRK.bar[0][i]+18,0,0);}
  /* cartelli di frenata prima delle curve lente */
  const boardTex=n=>trkTextTex(128,96,(g,s,h)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,s,h);g.strokeStyle='#14171a';g.lineWidth=6;g.strokeRect(3,3,s-6,h-6);g.fillStyle='#14171a';g.font=`800 62px ${TRK_FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(n,s/2,h/2+3);});
  const boards={};for(const n of ['200','150','100','50'])boards[n]=new THREE.MeshBasicMaterial({map:boardTex(n)});
  TRK.corners.forEach((c,j)=>{if(TRK.cornerV0&&TRK.cornerV0[j]>30)return;
    let ib=c.i;for(let o=0;o<120;o++){const i=(c.i-o+N)%N;if(Math.abs(T.k[i])<1/400){ib=i;break;}}
    const side=c.left?-1:1;
    [['200',100],['150',75],['100',50],['50',25]].forEach(([n,o])=>{const i=(ib-o+N)%N,b=new THREE.Group(),p=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.05),boards[n]);p.position.y=1.6;p.rotation.y=-Math.PI/2;b.add(p);
      const post=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.2,0.08),steel);post.position.y=0.6;b.add(post);trkPlace(b,i,side*(hw+4),0);});});
  trkWorldExtras();
  /* torri faro: pali con proiettori che di notte si accendono */
  {const nT=TRK.towers.length,pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18,0.28,18,8),steel,nT);
   TRK.floodMat=new THREE.MeshStandardMaterial({color:0x2a2d31,emissive:0xfff4e0,emissiveIntensity:0,roughness:0.4});
   const head=new THREE.InstancedMesh(new THREE.BoxGeometry(0.5,1.4,3.2),TRK.floodMat,nT),M=new THREE.Matrix4(),q=new THREE.Quaternion(),Sv=new THREE.Vector3(1,1,1),Pv=new THREE.Vector3();
   TRK.towers.forEach((t,k)=>{const h=T.h[t.i];M.makeTranslation(t.X,h+9,-t.Y);pole.setMatrixAt(k,M);
     const yaw=Math.atan2(T.ty[t.i],T.tx[t.i])+(t.s?Math.PI/2:-Math.PI/2);q.setFromEuler(new THREE.Euler(0,yaw+Math.PI/2,0.35));Pv.set(t.X,h+18.2,-t.Y);M.compose(Pv,q,Sv);head.setMatrixAt(k,M);});
   TRK.tw.add(pole);TRK.tw.add(head);head.layers.enable(2);
   /* alone dei proiettori di notte (si riflette anche sull'asfalto bagnato) */
   const hp=new Float32Array(nT*3);TRK.towers.forEach((t,k)=>{const dx=T.X[t.i]-t.X,dy=T.Y[t.i]-t.Y,l=Math.hypot(dx,dy)||1;hp.set([t.X+dx/l*1.2,T.h[t.i]+18.0,-(t.Y+dy/l*1.2)],k*3);});
   const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.BufferAttribute(hp,3));
   TRK.floodHalo=new THREE.Points(hg,new THREE.PointsMaterial({map:glowTex,color:0xfff0d8,size:16,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.9}));
   TRK.floodHalo.visible=false;TRK.floodHalo.layers.enable(2);TRK.tw.add(TRK.floodHalo);}
  /* telecamere TV a bordo pista */
  {const camM=new THREE.MeshStandardMaterial({color:0x1d2126,roughness:0.4});
   for(const c of TRK.tvcams){const g=new THREE.Group(),h=trkGroundH(c.X,c.Y);const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,c.H,6),steel);pole.position.y=c.H/2;g.add(pole);
     const plat=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.12,1.4),steel);plat.position.y=c.H;g.add(plat);const body=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.4,0.35),camM);body.position.y=c.H+0.35;g.add(body);
     g.position.set(c.X,h,-c.Y);TRK.tw.add(g);c.pos=new THREE.Vector3(c.X,h+c.H+0.5,-c.Y);}}
  /* stelle e luna (si vedono di notte) */
  {const n=1600,pos=new Float32Array(n*3);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,e=Math.asin(0.05+0.95*Math.random());pos.set([110+Math.cos(a)*Math.cos(e)*4500,Math.sin(e)*4500,-430-Math.sin(a)*Math.cos(e)*4500],k*3);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
   TRK.stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:0.9,depthWrite:false}));TRK.stars.visible=false;TRK.tw.add(TRK.stars);
   TRK.moon=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xe8eeff,fog:false,depthWrite:false,transparent:true}));TRK.moon.scale.set(260,260,1);TRK.moon.position.set(110+1800,1500,-430-2600);TRK.moon.visible=false;TRK.tw.add(TRK.moon);}
  /* Prealpi a nord, colline a sud (in città lo sfondo sono i palazzi, track-b17) */
  if(!TRKDEF.urban){const segs=360,R0=3600,pos=[],col=[],idx=[];const cx=110,cy=430;
   const hgt=a=>{const north=Math.max(0,Math.sin(a));let h=90+60*Math.sin(a*7+1)+40*Math.sin(a*17);h+=north*north*(520+260*Math.sin(a*5.3)+180*Math.sin(a*11.7+2)+90*Math.abs(Math.sin(a*29)));return h;};
   for(let k=0;k<=segs;k++){const a=k/segs*Math.PI*2,h=hgt(a),x=Math.cos(a),y=Math.sin(a);
     pos.push(cx+x*R0,-30,-(cy+y*R0),cx+x*(R0-200),h,-(cy+y*(R0-200)));
     /* montagne lontane: velate dalla foschia alla base, creste più scure, neve solo sulle cime più alte e attenuata dalla distanza */
     const sh=0.86+0.14*Math.sin(a*41)*Math.sin(a*13+0.7),snow=smooth01(h,650,900),base=new THREE.Color(0xa9b9c6),top=new THREE.Color(0x5f7586).multiplyScalar(sh).lerp(new THREE.Color(0xdfe7ee),snow*0.85);
     col.push(base.r,base.g,base.b,top.r,top.g,top.b);
     if(k<segs){const p=2*k;idx.push(p,p+2,p+1,p+1,p+2,p+3);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
   const mnt=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));TRK.tw.add(mnt);TRK.mnt=mnt;}
  trkWorldFinish();
  TRK.built=true;
}
/* dettagli: lago, alberi, casolari e campanile, ponte, postazioni dei commissari, muri di gomme, nuvole */
function trkWorldExtras(){
  const T=TRK.T,N=T.N,hw=T.w/2,steel=TRK.steel;
  const avoid=[];
  /* lago nel punto dell'infield più lontano dalla pista */
  if(TRK.lake){const [bx,by,R,lh]=TRK.lake,pts=[];for(let k=0;k<48;k++){const a=k/48*Math.PI*2,r=R*(1+0.18*Math.sin(a*3+1)+0.1*Math.sin(a*5));pts.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}
   const shp=new THREE.Shape(pts);
   const shore=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(p=>p.clone().multiplyScalar(1.12))),1),new THREE.MeshLambertMaterial(Object.assign({color:0xb7a77f},trkOff)));
   shore.rotation.x=-Math.PI/2;shore.position.set(bx,lh+0.01,-by);TRK.tw.add(shore);
   const water=new THREE.Mesh(new THREE.ShapeGeometry(shp,1),new THREE.MeshStandardMaterial({color:0x2f5d78,metalness:0.2,roughness:0.08,envMapIntensity:1.2,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
   water.rotation.x=-Math.PI/2;water.position.set(bx,lh+0.03,-by);TRK.tw.add(water);
   const dock=new THREE.Mesh(new THREE.BoxGeometry(14,0.3,2.2),new THREE.MeshLambertMaterial({color:0x7a5a3a}));dock.position.set(bx+R*0.95,lh+0.35,-by);TRK.tw.add(dock);
   avoid.push([bx,by,R*1.25]);}
  /* casolari veneti e un campanile, lontano dalla pista */
  if(!TRKDEF.urban){const wallC=[0xe7d3a8,0xd9b98a,0xefe3c8,0xcf9d6c],roofM=new THREE.MeshLambertMaterial({color:0x9a4a2a}),winM=new THREE.MeshLambertMaterial({color:0x3a2f28});
   const house=(X,Y,rot,w,d,h)=>{const g=new THREE.Group();const walls=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),trkWorldMap(new THREE.MeshLambertMaterial({color:wallC[Math.floor(Math.random()*wallC.length)],map:trkConcreteTex().map}),2.5,null));walls.position.y=h/2;g.add(walls);
     const roof=new THREE.Mesh(new THREE.CylinderGeometry(d*0.62,d*0.62,w+0.6,3,1),roofM);roof.rotation.order='YXZ';roof.rotation.set(-Math.PI/2,Math.PI/2,0);roof.position.y=h+d*0.155;roof.scale.set(1,1,0.5);g.add(roof);
     for(let k=0;k<Math.floor(w/3);k++)for(const s of [1,-1]){const wdw=new THREE.Mesh(new THREE.PlaneGeometry(0.9,1.2),winM);wdw.position.set(-w/2+1.6+k*3,h*0.62,s*(d/2+0.02));if(s<0)wdw.rotation.y=Math.PI;g.add(wdw);}
     g.position.set(X,trkGroundH(X,Y)-0.3,-Y);g.rotation.y=rot;TRK.tw.add(g);};
   let n=0,tries=0;while(n<16&&tries<4000){tries++;const a=Math.random()*Math.PI*2,r=700+Math.random()*900,X=110+Math.cos(a)*r,Y=430+Math.sin(a)*r;
     if(trkDistTrack(X,Y,8)<260)continue;house(X,Y,Math.random()*Math.PI,10+Math.random()*10,7+Math.random()*3,5+Math.random()*3);
     if(Math.random()<0.5)house(X+16,Y+6,Math.random()*Math.PI,7,6,4);avoid.push([X,Y,30]);n++;}
   /* campanile */
   {const X=TRKDEF.tower[0],Y=TRKDEF.tower[1],g=new THREE.Group(),brick=new THREE.MeshLambertMaterial({color:0xb5734f}),stone=new THREE.MeshLambertMaterial({color:0xe8dcc2});
    const shaft=new THREE.Mesh(new THREE.BoxGeometry(6,34,6),brick);shaft.position.y=17;g.add(shaft);
    const cell=new THREE.Mesh(new THREE.BoxGeometry(6.6,6,6.6),stone);cell.position.y=37;g.add(cell);
    for(let k=0;k<4;k++){const op=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.6),winM);const a=k*Math.PI/2;op.position.set(Math.sin(a)*3.32,37,Math.cos(a)*3.32);op.rotation.y=a;g.add(op);}
    const spire=new THREE.Mesh(new THREE.ConeGeometry(4.4,11,4),brick);spire.position.y=45.5;spire.rotation.y=Math.PI/4;g.add(spire);
    const church=new THREE.Mesh(new THREE.BoxGeometry(26,12,13),stone);church.position.set(-17,6,0);g.add(church);
    const croof=new THREE.Mesh(new THREE.CylinderGeometry(8,8,26.5,3,1),roofM);croof.rotation.order='YXZ';croof.rotation.set(-Math.PI/2,Math.PI/2,0);croof.position.set(-17,14.2,0);croof.scale.set(1,1,0.55);g.add(croof);
    g.position.set(X,trkGroundH(X,Y)-0.3,-Y);TRK.tw.add(g);avoid.push([X,Y,40]);}}
  /* alberi: conifere e latifoglie */
  if(!TRKDEF.urban){const NT=1500,NB=700;
   const fol=new THREE.InstancedMesh(trkConiferGeo(),new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true}),NT),trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25,0.35,2.2,6),new THREE.MeshLambertMaterial({color:0x5b4632}),NT+NB);
   const bfol=new THREE.InstancedMesh(trkShade(new THREE.IcosahedronGeometry(3.2,1),-3.2,3.2,0.55),new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,vertexColors:true}),NB);
   const M=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),c=new THREE.Color();let n=0,nb=0,nt=0,tries=0;
   while((n<NT||nb<NB)&&tries<30000){tries++;const X=-950+Math.random()*2100,Y=-420+Math.random()*1750;
     if(trkDistTrack(X,Y,4)<48)continue;if(Y<-10&&Y>-90&&X>-420&&X<240)continue;if(avoid.some(a=>Math.hypot(X-a[0],Y-a[1])<a[2]))continue;
     const s=0.7+Math.random()*0.9,round=Math.random()<(TRKDEF.mountain?0.12:0.35),gy=trkGroundH(X,Y)-0.1;
     if(round&&nb<NB){ps.set(X,gy+2.2*s+2.4*s,-Y);sc.set(s,s*(0.85+Math.random()*0.3),s);M.compose(ps,q,sc);bfol.setMatrixAt(nb,M);if(TRKDEF.autumn&&Math.random()<0.75)c.setHSL(0.02+Math.random()*0.11,0.55+Math.random()*0.25,0.26+Math.random()*0.12);else c.setHSL(0.2+Math.random()*0.1,0.35+Math.random()*0.2,0.2+Math.random()*0.1);bfol.setColorAt(nb,c);nb++;
       ps.set(X,gy+1.1*s,-Y);sc.set(s,s,s);M.compose(ps,q,sc);trunk.setMatrixAt(nt++,M);}
     else if(!round&&n<NT){ps.set(X,gy+1.1*s+4*s,-Y);sc.set(s,s*(0.9+Math.random()*0.4),s);M.compose(ps,q,sc);fol.setMatrixAt(n,M);
       c.setHSL(0.24+Math.random()*0.08,0.35+Math.random()*0.2,0.18+Math.random()*0.1);fol.setColorAt(n,c);n++;
       ps.set(X,gy+1.1*s,-Y);sc.set(s,s,s);M.compose(ps,q,sc);trunk.setMatrixAt(nt++,M);}}
   fol.count=n;bfol.count=nb;trunk.count=nt;TRK.tw.add(fol);TRK.tw.add(bfol);TRK.tw.add(trunk);}
  /* in montagna: massi di roccia sparsi sui pendii */
  if(TRKDEF.mountain){const NR=320,rock=new THREE.InstancedMesh(trkShade(new THREE.IcosahedronGeometry(1,0),-1,1,0.6),new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,vertexColors:true}),NR);
   const M=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),c=new THREE.Color(),e=new THREE.Euler();let n=0,tries=0;
   while(n<NR&&tries<8000){tries++;const X=-900+Math.random()*2000,Y=-300+Math.random()*1600;if(trkDistTrack(X,Y,4)<28)continue;if(avoid.some(a=>Math.hypot(X-a[0],Y-a[1])<a[2]))continue;
     const s=0.5+Math.pow(Math.random(),2.2)*3.2;e.set(Math.random()*3,Math.random()*3,Math.random()*3);q.setFromEuler(e);sc.set(s*(0.8+Math.random()*0.6),s*(0.5+Math.random()*0.4),s*(0.8+Math.random()*0.6));
     ps.set(X,trkGroundH(X,Y)+s*0.15,-Y);M.compose(ps,q,sc);rock.setMatrixAt(n,M);const g=0.5+Math.random()*0.18;c.setRGB(g,g*0.98,g*0.94);rock.setColorAt(n,c);n++;}
   rock.count=n;TRK.tw.add(rock);}
  /* ponte sul rettilineo opposto */
  {const B=TRKDEF.bridge;let bi=0;for(let i=0;i<N;i++)if(T.X[i]>B[0]&&T.X[i]<B[1]&&T.Y[i]>B[2]){bi=i;break;}
   if(bi){const g=new THREE.Group(),L0=TRK.bar[0][bi]+2,L1=TRK.bar[1][bi]+2,span=L0+L1;
     const conc=trkWorldMap(new THREE.MeshLambertMaterial({color:0xd5d7d2,map:trkConcreteTex().map}),3,null);
     for(const z of [-L0,L1]){const p=new THREE.Mesh(new THREE.BoxGeometry(2.2,7,2.2),conc);p.position.set(0,3.5,z);g.add(p);}
     const deck=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.2,span+2.2),conc);deck.position.set(0,7.6,(L1-L0)/2);g.add(deck);
     const bt=trkTextTex(1024,96,(gg,s,h)=>{gg.fillStyle='#c4261d';gg.fillRect(0,0,s,h);gg.fillStyle='#fff';gg.font=`800 64px ${TRK_FONT}`;gg.textAlign='center';gg.textBaseline='middle';gg.fillText(TRKDEF.banner+'  ·  VESPERA',s/2,h/2+3);});
     for(const sx of [-1.62,1.62]){const b=new THREE.Mesh(new THREE.PlaneGeometry(span,1.0),new THREE.MeshBasicMaterial({map:bt}));b.position.set(sx,7.6,(L1-L0)/2);b.rotation.y=sx<0?-Math.PI/2:Math.PI/2;g.add(b);}
     const rail=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.1,span+2.2),steel);for(const sx of [-1.5,1.5]){const r=rail.clone();r.position.set(sx,8.75,(L1-L0)/2);g.add(r);}
     trkPlace(g,bi,0,0);g.position.addScaledVector(new THREE.Vector3(T.nx[bi],0,-T.ny[bi]),0);}}
  /* postazioni dei commissari: casotto e un commissario in tuta arancione che sventola la bandiera gialla quando c'è un'auto ferma o fuori pista più avanti */
  {const hutM=new THREE.MeshLambertMaterial({color:0xe8742a}),hutR=new THREE.MeshLambertMaterial({color:0xf1f1ee}),suit=new THREE.MeshLambertMaterial({color:0xff7a1a}),skin=new THREE.MeshLambertMaterial({color:0xe0b08a});
   TRK.posts=[];
   for(let k=0,i=60;i<N;i+=165,k++){const s=k%2,sg=s?-1:1,g=new THREE.Group();
     const hut=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.2,1.8),hutM);hut.position.y=1.1;g.add(hut);const rf=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.18,2.2),hutR);rf.position.y=2.3;g.add(rf);
     /* il commissario guarda la pista */
     const man=new THREE.Group();man.position.set(0,0,sg*1.6);man.rotation.y=sg>0?Math.PI:0;g.add(man);
     const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.22,1.1,8),suit);body.position.y=1.05;man.add(body);
     for(const lx of [-0.1,0.1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.55,6),suit);leg.position.set(lx,0.28,0);man.add(leg);}
     const head=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),skin);head.position.y=1.74;man.add(head);
     const cap=new THREE.Mesh(new THREE.SphereGeometry(0.135,10,6,0,Math.PI*2,0,Math.PI/2),hutR);cap.position.y=1.76;man.add(cap);
     const arm=new THREE.Group();arm.position.set(0.24,1.5,0);man.add(arm);
     const fore=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.6,6),suit);fore.position.y=0.25;arm.add(fore);
     const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,1.2,5),steel);stick.position.y=0.95;arm.add(stick);
     const fg=new THREE.PlaneGeometry(0.9,0.6,8,2);fg.translate(0.45,0,0);const fm=new THREE.MeshLambertMaterial({color:0xf2d21b,side:THREE.DoubleSide});
     const flag=new THREE.Mesh(fg,fm);flag.position.y=1.25;arm.add(flag);arm.rotation.z=-0.25;flag.rotation.y=Math.PI/2;
     trkPlace(g,i,sg*(TRK.bar[s][i]+2.6),0);
     TRK.posts.push({i,arm,flag,base:Float32Array.from(fg.attributes.position.array),on:0,ph:Math.random()*6});}}
  /* muri di gomme all'esterno delle curve lente */
  {const list=[];TRK.corners.forEach((c,j)=>{if(TRK.cornerV0[j]>30)return;const side=c.left?1:0,sg=side?-1:1;
     for(let o=-24;o<=46;o++){const i=(c.i+o+N)%N,j2=(i+1)%N;for(const f of [0,0.5]){const b=TRK.bar[side][i]*(1-f)+TRK.bar[side][j2]*f-0.42;
       const X=T.X[i]*(1-f)+T.X[j2]*f+sg*b*T.nx[i],Y=T.Y[i]*(1-f)+T.Y[j2]*f+sg*b*T.ny[i];list.push([X,Y,list.length,T.h[i]]);}}});
   const tyre=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32,0.32,0.26,12),new THREE.MeshLambertMaterial({color:0xffffff}),list.length*3);
   const M=new THREE.Matrix4(),c=new THREE.Color();let n=0;
   for(const [X,Y,k,hy] of list)for(let h=0;h<3;h++){M.makeTranslation(X,hy+0.14+h*0.27,-Y);tyre.setMatrixAt(n,M);c.set(Math.floor(k/2)%2?0xe9e9e4:0x161718);tyre.setColorAt(n,c);n++;}
   tyre.count=n;TRK.tw.add(tyre);}
  /* nuvole */
  {const ct=canvasTex(256,(g,s)=>{g.clearRect(0,0,s,s);for(let k=0;k<14;k++){const x=s*0.2+Math.random()*s*0.6,y=s*0.45+Math.random()*s*0.18,r=s*(0.08+Math.random()*0.14);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}},null);
   for(let k=0;k<26;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ct,fog:false,depthWrite:false,transparent:true,opacity:0.85}));
     const a=Math.random()*Math.PI*2,r=900+Math.random()*2200,sz=500+Math.random()*700;sp.position.set(110+Math.cos(a)*r,650+Math.random()*500,-(430+Math.sin(a)*r));sp.scale.set(sz,sz*0.5,1);TRK.tw.add(sp);(TRK.clouds=TRK.clouds||[]).push(sp);}}
}
