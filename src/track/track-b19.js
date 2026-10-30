/* =========================================================
   Assetto nel Garage, sospensioni che si vedono, vibrazione dai carichi veri.
   Molle anteriori e posteriori: cambiano quanto l'auto si abbassa col carico aerodinamico (SETUP.kf e SETUP.kr in equilibrium,
   quindi anche il profilo di lapSim) e la rigidezza della scocca Rapier. Barre antirollio: spostano il trasferimento di carico
   in curva fra gli assi (solo con la scocca 3D): più barra davanti = più sottosterzo, più barra dietro = più sovrasterzo.
   Valgono per le auto dei giocatori; i piloti del computer restano con l'assetto di serie.
   ========================================================= */
const SUSP_DEF={kf:56,kr:66,af:3,ar:0},SUSP=Object.assign({},SUSP_DEF);
try{const s=JSON.parse(localStorage.getItem('vespera-susp')||'null');if(s)for(const k in SUSP_DEF)if(isFinite(s[k]))SUSP[k]=+s[k];}catch(e){}
function trkSuspSync(){if(typeof SETUP==="undefined")return;SETUP.kf=SUSP.kf/SUSP_DEF.kf;SETUP.kr=SUSP.kr/SUSP_DEF.kr;}
trkSuspSync();
function trkSuspKey(){return SUSP.kf+'|'+SUSP.kr+'|'+SUSP.af+'|'+SUSP.ar;}

/* scocca Rapier dell'auto di un giocatore: molle, ammortizzatori (seguono la radice della rigidezza) e barre dall'assetto */
{const f=trkRbCar;trkRbCar=function(P){f(P);const B=P.rb;if(!B)return;B.sk=P.isAI?'':trkSuspKey();if(P.isAI)return;
  const ks=P.veh.m/1480,kF=SUSP.kf*1000*ks,kR=SUSP.kr*1000*ks;
  B.k=[kF,kF,kR,kR];B.c=B.c.map((c,k)=>c*Math.sqrt((k<2?SUSP.kf/SUSP_DEF.kf:SUSP.kr/SUSP_DEF.kr)));B.arb=[SUSP.af*4000*ks,SUSP.ar*4000*ks];
  B.xs=B.fz.map((F,k)=>F/B.k[k]);B.L0=B.xs.map(x=>B.h+x);};}
/* assetto cambiato nel Garage: la scocca dei giocatori si rifà alla prima occasione */
{const f=trkRbUse;trkRbUse=function(P){if(P.rb&&!P.isAI&&P.rb.sk!==trkSuspKey())trkRbDrop(P);return f(P);};}

/* ruote che salgono e scendono con la compressione delle molle (ruote 0-1 anteriori, pari a sinistra = z negativa del modello) */
if(typeof trkVisual==='function'){const f=trkVisual;trkVisual=function(P,dt){f(P,dt);const B=P.rb,Vv=P.vis;
  if(!B||!Vv||Vv.kind!=='vespera'||!Vv.wheels||TRK.replay.on)return;
  for(const w of Vv.wheels){const k=(w.isFront?0:2)+(w.s>0?1:0);if(w.y0==null)w.y0=w.root.position.y;
    const d=P.pit?0:clamp(B.x[k]-B.xs[k],-0.07,0.09);w.dy=(w.dy||0)+(d-(w.dy||0))*Math.min(1,dt*40);w.root.position.y=w.y0+w.dy;}};}

/* vibrazione: il motore forte segue la velocità delle sospensioni (buche, cordoli, atterraggi), quello leggero l'uso delle gomme
   vicino al limite (P.ws = scorrimento rispetto al picco), così il controller avverte prima che l'auto parta */
if(typeof trkRumbleTick==='function'){const f=trkRumbleTick;trkRumbleTick=function(P){const B=P.rb,sp=Math.abs(P.car.vx);
  if(!B||!B.xd||P.pit||sp<3||P.landT>0.3||P.air)return f(P);
  let bump=0,u=0;for(let k=0;k<4;k++){bump+=Math.abs(B.xd[k]);if(P.ws)u=Math.max(u,P.ws[k]);}
  const grass=P.surf==='erba'||P.surf==='ghiaia',kerb=P.surf==='cordolo';
  const S=Math.max(clamp((bump-0.3)*0.45,0,0.75),grass?0.5*Math.min(1,sp/25):0);
  const W=Math.max(clamp((u-0.8)*1.6,0,0.45),kerb?0.4*Math.min(1,sp/30):0,P.spin||(P.brk>0.9&&Math.abs(P.ar)>0.1)?0.35:0);
  if(S>0.03||W>0.03)trkRumble(P,S,W,110);};}

/* ---------- comandi nella scheda Assetto del Garage ---------- */
function trkSuspUI(){
  const box=document.getElementById('tSetup');if(!box||document.getElementById('suspGrp'))return;
  const g=document.createElement('div');g.className='group';g.id='suspGrp';
  const row=(id,lab,min,max,st)=>`<div style="margin-bottom:14px"><h2><label for="${id}">${lab}</label><output id="${id}Out"></output></h2><input type="range" id="${id}" min="${min}" max="${max}" step="${st}"></div>`;
  g.innerHTML=`${row('suspKf','Molle anteriori',36,90,2)}${row('suspKr','Molle posteriori',40,100,2)}${row('suspAf','Barra antirollio anteriore',0,6,1)}${row('suspAr','Barra antirollio posteriore',0,6,1)}
    <div class="toggles" style="margin-top:8px"><button class="tog" id="suspReset">Assetto di serie</button></div>
    <p class="note" id="suspNote"></p>
    <p class="note">Molle più rigide tengono l'auto più alta sotto il carico delle ali (meno effetto suolo ma più stabile) e la fanno saltare di più sui cordoli. Le barre antirollio funzionano con la scocca 3D: più barra davanti rende l'auto più sottosterzante, più barra dietro la fa girare di più.</p>`;
  const first=box.querySelector('.group');first.after(g);
  const map={suspKf:'kf',suspKr:'kr',suspAf:'af',suspAr:'ar'};
  const show=()=>{const m=TRK.mass||MASS,fq=(k,wf)=>Math.sqrt(k*1000/(m*wf/2))/(2*Math.PI);
    for(const id in map){const v=SUSP[map[id]],el=document.getElementById(id);el.value=v;
      document.getElementById(id+'Out').textContent=id==='suspKf'?`${v} kN/m · ${fq(v,STATF).toFixed(1).replace('.',',')} Hz`:id==='suspKr'?`${v} kN/m · ${fq(v,1-STATF).toFixed(1).replace('.',',')} Hz`:['staccata','1','2','3','4','5','6'][v]+(v===SUSP_DEF[map[id]]?' (serie)':'');}
    const bal=(SUSP.af*4000+SUSP.kf*1000*0.25)/(SUSP.af*4000+SUSP.ar*4000+(SUSP.kf+SUSP.kr)*1000*0.25);
    document.getElementById('suspNote').textContent=`Rigidezza al rollio davanti: ${Math.round(bal*100)} % (di serie ${Math.round((SUSP_DEF.af*4000+SUSP_DEF.kf*250)/(SUSP_DEF.af*4000+SUSP_DEF.ar*4000+(SUSP_DEF.kf+SUSP_DEF.kr)*250)*100)} %). `+
      (bal>0.62?'L\'auto tende ad allargare in curva.':bal<0.5?'Il retrotreno è vivace: attenzione in uscita dalle curve.':'Equilibrio neutro.');};
  const changed=()=>{trkSuspSync();try{localStorage.setItem('vespera-susp',JSON.stringify(SUSP));}catch(e){}show();updateReadout();trkDirty();};
  for(const id in map)document.getElementById(id).addEventListener('input',e=>{SUSP[map[id]]=+e.target.value;changed();});
  document.getElementById('suspReset').onclick=()=>{Object.assign(SUSP,SUSP_DEF);changed();};
  /* anche l'altezza da terra cambia il giro calcolato */
  const ride=document.getElementById('ride');if(ride)ride.addEventListener('input',()=>trkDirty());
  show();
}
if(typeof document!=='undefined')trkSuspUI();
