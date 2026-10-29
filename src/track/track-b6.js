/* =========================================================
   Controller (Xbox e compatibili, mappatura standard): guida, menu di pausa, replay, fine gara, vibrazione.
   LS sterzo · RT gas · LT freno · A gas · B (tieni) guarda dietro · X box · Y telecamera · RS guarda intorno
   LB replay · RB clacson · View rimetti in pista · Menu pausa · croce: telecamera e mescola al box
   ========================================================= */
const PAD_B={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,MENU:9,LS:10,RS:11,UP:12,DOWN:13,LEFT:14,RIGHT:15};
const PADS={prev:[[],[]],names:['',''],rumbleT:[0,0],menuT:0,idlePrev:[]};
function trkPadList(){return (navigator.getGamepads?[...navigator.getGamepads()]:[]).filter(p=>p&&p.connected);}
/* il pad che comanda il giocatore k: in due il primo e il secondo, da soli il primo collegato */
function trkPadFor(k){const L=trkPadList();return TRK.split?L[k]||null:(k===0?L[0]||null:null);}
const padVal=(p,i)=>p&&p.buttons[i]?p.buttons[i].value||(p.buttons[i].pressed?1:0):0;
const padOn=(p,i)=>p&&p.buttons[i]?p.buttons[i].pressed:false;
/* pressione appena avvenuta (fronte di salita), un registro per giocatore */
function padHit(k,p,i){const pr=PADS.prev[k];return padOn(p,i)&&!pr[i];}
function padStore(k,p){const pr=PADS.prev[k];if(!p){pr.length=0;return;}for(let i=0;i<p.buttons.length;i++)pr[i]=padOn(p,i);}
/* levetta analogica con zona morta e curva di risposta scelta nel pannello */
function padAxis(v,dz){const a=Math.abs(v);if(a<dz)return 0;return Math.sign(v)*(a-dz)/(1-dz);}
function padCurve(x){const e=[1,1.6,2.3][TRK.padCurve]||1.6;return Math.sign(x)*Math.pow(Math.abs(x),e);}
/* vibrazione: due motori (forte = basse frequenze, debole = alte); brevi impulsi ripetuti per gli effetti continui */
function trkRumble(P,strong,weak,ms){
  if(!TRK.padVib||P.isAI||!TRK.on)return;const k=P.id,p=trkPadFor(k);if(!p||!p.vibrationActuator)return;
  const now=performance.now();if(now<PADS.rumbleT[k]&&ms<200)return;PADS.rumbleT[k]=now+Math.min(ms,120)*0.85;
  try{p.vibrationActuator.playEffect('dual-rumble',{startDelay:0,duration:ms,strongMagnitude:clamp(strong,0,1),weakMagnitude:clamp(weak,0,1)});}catch(e){}
}
/* comandi di guida dal pad: letti dentro trkInputs */
function trkPadDrive(P,dt,acc){
  const k=P.id,p=trkPadFor(k);P.pad=p;if(!p){P.lookBack=false;P.lookYaw*=Math.max(0,1-dt*6);return;}
  const sx=padAxis(p.axes[0]||0,0.08);if(sx){acc.st=-padCurve(sx);acc.analog=true;}
  const rt=padVal(p,PAD_B.RT),lt=padVal(p,PAD_B.LT);if(rt>0.02)acc.gas=Math.max(acc.gas,rt);if(lt>0.02)acc.brk=Math.max(acc.brk,lt);
  if(padOn(p,PAD_B.A))acc.gas=Math.max(acc.gas,1);
  if(padOn(p,PAD_B.LEFT)&&!(P.pitReq||P.pit))acc.st=Math.max(acc.st,1);if(padOn(p,PAD_B.RIGHT)&&!(P.pitReq||P.pit))acc.st=Math.min(acc.st,-1);
  P.lookBack=padOn(p,PAD_B.B);
  const rx=padAxis(p.axes[2]||0,0.18),ry=padAxis(p.axes[3]||0,0.25);P.lookYaw+=((-rx*Math.PI*0.75)-P.lookYaw)*Math.min(1,dt*(rx?8:5));P.lookPitch=ry;
  if(padHit(k,p,PAD_B.Y)||padHit(k,p,PAD_B.UP))trkCycleCam(P);
  if(padHit(k,p,PAD_B.DOWN)){const i=TRK_CAMS.findIndex(c=>c.v===P.cam);trkSetCam(P,TRK_CAMS[(i+TRK_CAMS.length-1)%TRK_CAMS.length].v);}
  if(padHit(k,p,PAD_B.X))trkPitCycle(P);
  if((P.pitReq||(P.pit&&(P.pit.ph==='in'||P.pit.ph==='lane')))&&(padHit(k,p,PAD_B.LEFT)||padHit(k,p,PAD_B.RIGHT))){const cur=P.pit?P.pit.tire:P.pitTire;trkPitChoose(P,(cur+(padHit(k,p,PAD_B.RIGHT)?1:3))%4);}
  if(padHit(k,p,PAD_B.VIEW))trkReset(P,false);
  trkHorn(padOn(p,PAD_B.RB)&&k===0);
}
/* ogni fotogramma in pista: pausa, replay, fine gara (la guida passa da trkInputs) */
function trkPadFrame(dt){
  const L=trkPadList();
  /* collegamento e scollegamento: avviso e suggerimenti dei tasti da pad */
  for(let k=0;k<2;k++){const p=L[k],nm=p?p.id:'';if(nm!==PADS.names[k]){if(nm&&TRK.on)trkToast(TRK.p[TRK.split?k:0],`Controller collegato${TRK.split?` (giocatore ${k+1})`:''}`,2.2);PADS.names[k]=nm;}}
  document.documentElement.classList.toggle('pad',L.length>0);trkPadPanel();
  const p=trkPadFor(0)||L[0]||null;
  if(p){
    if(padHit(0,p,PAD_B.MENU)){trkPause(!TRK.paused);padStore(0,p);return;}
    if(TRK.paused){trkMenuPad(0,p,document.getElementById('thPause'));}
    else if(!document.getElementById('thRace').hidden){trkMenuPad(0,p,document.getElementById('thRace'));}
    else if(TRK.replay.on){const R=TRK.replay;
      if(padHit(0,p,PAD_B.A)){R.paused=!R.paused;trkReplayUI();}
      if(padHit(0,p,PAD_B.B)||padHit(0,p,PAD_B.LB))trkReplayStop();
      const sp=[0.25,0.5,1,2];let si=sp.indexOf(R.speed);if(padHit(0,p,PAD_B.RB)&&si<3){R.speed=sp[si+1];trkReplayUI();}
      if(padHit(0,p,PAD_B.X)&&si>0){R.speed=sp[si-1];trkReplayUI();}
      const cams=['tv','chase','heli','cockpit'];if(padHit(0,p,PAD_B.UP)||padHit(0,p,PAD_B.DOWN)||padHit(0,p,PAD_B.Y)){R.cam=cams[(cams.indexOf(R.cam)+(padHit(0,p,PAD_B.DOWN)?3:1))%4];TRK.cars.forEach(Q=>Q.camPos=null);trkReplayUI();}
      if(padHit(0,p,PAD_B.LEFT)||padHit(0,p,PAD_B.RIGHT)){const n=TRK.cars.length;R.focus=(R.focus+(padHit(0,p,PAD_B.RIGHT)?1:n-1))%n;R.tv=-1;TRK.cars.forEach(Q=>Q.camPos=null);trkReplayUI();}
      const sc=padVal(p,PAD_B.RT)-padVal(p,PAD_B.LT);if(Math.abs(sc)>0.05){const r=TRK.rec;R.t=clamp(R.t+sc*dt*8,r[0].t,r[r.length-1].t);}}
    else if(padHit(0,p,PAD_B.LB))trkReplayStart();}
  /* i tasti del secondo pad (in due) e del primo si memorizzano dopo la guida, in trkInputs */
  if(TRK.paused||TRK.replay.on||!document.getElementById('thRace').hidden){padStore(0,p);if(TRK.split)padStore(1,trkPadFor(1));}
}
/* fuori dalla pista: Menu sul pad scende in pista */
function trkPadIdle(){const p=trkPadList()[0];if(!p)return;if(padOn(p,PAD_B.MENU)&&!PADS.idlePrev[PAD_B.MENU]&&busy.hidden)trkStart();for(let i=0;i<p.buttons.length;i++)PADS.idlePrev[i]=padOn(p,i);}
/* navigazione nei riquadri con bottoni: croce o levetta per spostarsi, A conferma, B torna indietro */
function trkMenuPad(k,p,box){
  const bs=[...box.querySelectorAll('button')].filter(b=>b.offsetParent!==null);if(!bs.length)return;
  let i=bs.indexOf(document.activeElement);if(i<0){i=0;bs[0].focus({preventScroll:true});}
  const y=p.axes[1]||0,x=p.axes[0]||0,now=performance.now();let mv=0;
  if(padHit(k,p,PAD_B.DOWN)||padHit(k,p,PAD_B.RIGHT))mv=1;else if(padHit(k,p,PAD_B.UP)||padHit(k,p,PAD_B.LEFT))mv=-1;
  else if(now>PADS.menuT&&(Math.abs(y)>0.6||Math.abs(x)>0.6)){mv=(y>0.6||x>0.6)?1:-1;PADS.menuT=now+260;}
  if(mv){i=(i+mv+bs.length)%bs.length;bs[i].focus({preventScroll:true});}
  if(padHit(k,p,PAD_B.A))bs[i].click();
  if(padHit(k,p,PAD_B.B)&&TRK.paused)trkPause(false);
}

/* ---------- pausa ---------- */
function trkPause(on){
  if(!TRK.on)return;TRK.paused=on;const el=document.getElementById('thPause');el.hidden=!on;
  document.documentElement.classList.toggle('paused',on);
  if(on){TRK.keys=[{},{}];trkSfxStop();const b=el.querySelector('button');if(b)b.focus({preventScroll:true});document.getElementById('thPauseSub').textContent=`${TRKDEF.name} · ${TRK.race.state!=='off'?`gara, ${TRK.race.laps} ${TRK.race.laps===1?'giro':'giri'}`:'prova libera'}`;}
  else if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  trkHorn(false);
}
document.querySelectorAll('#thPause [data-pz]').forEach(b=>b.onclick=()=>{const a=b.dataset.pz;
  if(a==='resume')trkPause(false);
  else if(a==='restart'){trkPause(false);if(TRK.duo&&TRK.race.laps>0)trkRaceSetup();else TRK.cars.forEach((P,k)=>trkReset(P,true,k));}
  else if(a==='replay'){trkPause(false);trkReplayStart();}
  else if(a==='panel'){trkPause(false);document.documentElement.classList.add('panel-open');}
  else if(a==='exit'){trkPause(false);trkStop();}});

/* ---------- clacson ---------- */
const HORN={on:false,n:null};
function trkHorn(on){
  if(on===HORN.on)return;HORN.on=on;const ac=audio.ctx;if(!ac||!engine.on){HORN.on=false;return;}
  if(!HORN.n){const g=ac.createGain();g.gain.value=0;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=0.8;f.connect(g);g.connect(ac.destination);
    for(const fr of [415,520]){const o=ac.createOscillator();o.type='square';o.frequency.value=fr;o.connect(f);o.start();}HORN.n=g;}
  HORN.n.gain.setTargetAtTime(on?0.07:0,ac.currentTime,0.02);
}

/* ---------- pannello: stato del controller ---------- */
let padPanelT=0;
function trkPadPanel(){const now=performance.now();if(now<padPanelT)return;padPanelT=now+1000;const el=document.getElementById('trkPadState');if(!el)return;
  const L=trkPadList();el.textContent=L.length?L.map((p,i)=>`${TRK.split?`Giocatore ${i+1}: `:''}${p.id.replace(/\(.*?\)/g,'').trim()||'controller'}${p.vibrationActuator?'':' (senza vibrazione)'}`).join(' · '):'Nessun controller collegato: collegalo e premi un tasto.';}
window.addEventListener('gamepadconnected',()=>{padPanelT=0;trkPadPanel();});
window.addEventListener('gamepaddisconnected',()=>{padPanelT=0;trkPadPanel();});

/* =========================================================
   Classifica condivisa: i migliori giri di chi apre questa pagina, per circuito e auto, con il fantasma da inseguire.
   Ognuno scrive solo il proprio documento (board/<id>) e i propri fantasmi (board/<id>/ghosts/<giro>)
   ========================================================= */
const BOARD={db:null,user:null,uid:null,docs:new Map(),mine:null,queue:null,busy:false,state:'wait',filter:'all',names:{}};
function trkHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function trkBoardKey(P){return `${TRK.trackId}-${trkHash(trkCfgKey(P))}`;}
async function trkBoardInit(){
  try{
    if(!window.claude||typeof window.claude.use!=='function'){BOARD.state='off';trkBoardRender();return;}
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db){BOARD.state='off';trkBoardRender();return;}
    BOARD.db=db;BOARD.user=user;BOARD.uid=user?await user.id():null;BOARD.state='live';
    db.collection('board').onSnapshot(snap=>{BOARD.docs=new Map(snap.docs.filter(d=>d.exists).map(d=>[d.id,d.data()]));BOARD.mine=BOARD.uid?BOARD.docs.get(BOARD.uid)||null:null;trkBoardRender();},
      e=>{BOARD.state=e&&e.code==='revoked'?'off':'error';trkBoardRender();});
    trkBoardRender();
  }catch(e){BOARD.state='off';trkBoardRender();}
}
/* fantasma compatto: un punto ogni 0,1 s, interi (centesimi di secondo, decimetri, millesimi di radiante, centimetri) */
function trkGhostPack(pts){const out=[];let last=-1;for(const p of pts){if(p[0]-last<0.099)continue;last=p[0];out.push(Math.round(p[0]*100),Math.round(p[1]*10),Math.round(p[2]*10),Math.round(p[3]*1000),Math.round(p[4]*100),Math.round(p[5]*1000));}return out;}
function trkGhostUnpack(a){const pts=[];for(let i=0;i+5<a.length;i+=6)pts.push([a[i]/100,a[i+1]/10,a[i+2]/10,a[i+3]/1000,a[i+4]/100,a[i+5]/1000]);return pts;}
/* un nuovo record personale: entra in classifica se è il tuo migliore con quell'auto su questo circuito */
function trkBoardSubmit(P,lt,pts){
  if(!BOARD.db||!BOARD.uid||!TRK.boardOn||P.isAI||P.id!==0||TRK.champRace)return;
  const key=trkBoardKey(P),old=BOARD.mine&&BOARD.mine.laps&&BOARD.mine.laps[key];if(old&&old.t<=lt)return;
  const V=P.veh,e={t:+lt.toFixed(3),track:TRK.trackId,car:V.name.slice(0,60),kg:Math.round(V.m),kw:Math.round(V.kw),tire:P.tire,wx:TRK.weather,assist:TRK.assist?1:0,at:Date.now(),gh:pts&&pts.length>20?1:0};
  BOARD.queue={key,e,gh:e.gh?trkGhostPack(pts):null};trkBoardFlush();
}
async function trkBoardFlush(){
  if(BOARD.busy||!BOARD.queue)return;BOARD.busy=true;const {key,e,gh}=BOARD.queue;BOARD.queue=null;
  try{
    const laps=Object.assign({},(BOARD.mine&&BOARD.mine.laps)||{});laps[key]=e;
    /* al massimo 24 giri a testa: si tengono i più recenti */
    const ks=Object.keys(laps);if(ks.length>24)ks.sort((a,b)=>laps[a].at-laps[b].at).slice(0,ks.length-24).forEach(k=>delete laps[k]);
    const ref=BOARD.db.doc('board/'+BOARD.uid);await ref.set({v:1,laps});BOARD.mine={v:1,laps};BOARD.docs.set(BOARD.uid,BOARD.mine);
    if(gh)await ref.collection('ghosts').doc(key).set({v:1,track:e.track,lap:e.t,pts:gh});
    const rk=trkBoardRows().findIndex(r=>r.uid===BOARD.uid&&r.key===key);
    trkToast(TRK.p[0],`Classifica condivisa: ${fmtLap(e.t)}${rk>=0?` · ${rk+1}° su ${trkBoardRows().length}`:''}`,3);
  }catch(err){if(err&&err.code==='invalid_argument'){BOARD.state='readonly';trkBoardRender();}}
  BOARD.busy=false;if(BOARD.queue)trkBoardFlush();
}
/* righe del circuito attuale, dalla più veloce; con «stessa auto» solo chi ha usato la tua configurazione */
function trkBoardRows(){
  const rows=[],mine=TRK.p[0].veh?trkBoardKey(TRK.p[0]):'';
  for(const [uid,d] of BOARD.docs){const laps=d&&d.laps;if(!laps||typeof laps!=='object')continue;
    for(const k in laps){const e=laps[k];if(!e||e.track!==TRK.trackId||typeof e.t!=='number'||!(e.t>20))continue;if(BOARD.filter==='same'&&k!==mine)continue;rows.push(Object.assign({uid,key:k},e));}}
  return rows.sort((a,b)=>a.t-b.t);
}
async function trkBoardRender(){
  const el=document.getElementById('trkBoard'),st=document.getElementById('trkBoardState');if(!el||!st)return;
  if(BOARD.state==='off'){st.textContent='La classifica condivisa funziona quando la pagina è aperta su claude.ai, con l\'accesso fatto.';el.innerHTML='';return;}
  if(BOARD.state==='wait'){st.textContent='Collegamento alla classifica…';return;}
  if(BOARD.state==='error'){st.textContent='Classifica non raggiungibile in questo momento.';return;}
  const rows=trkBoardRows().slice(0,15);
  st.textContent=`${TRKDEF.name} · ${BOARD.uid?(BOARD.state==='readonly'?'puoi leggere la classifica, ma con questo accesso non puoi aggiungere i tuoi giri':TRK.boardOn?'i tuoi record personali entrano da soli':'i tuoi giri non vengono pubblicati'):'accedi per aggiungere i tuoi giri'}`;
  if(!rows.length){el.innerHTML='<p class="note">Ancora nessun giro su questo circuito: il primo record personale che fai finisce qui.</p>';return;}
  let ps={};if(BOARD.user){try{ps=await BOARD.user.profiles([...new Set(rows.map(r=>r.uid))]);}catch(e){ps={};}}
  const t0=rows[0].t;
  el.innerHTML=`<table class="ttable bt"><colgroup><col style="width:18px"><col style="width:27%"><col><col style="width:60px"><col style="width:62px"></colgroup><thead><tr><th>#</th><th>Pilota</th><th>Auto</th><th>Giro</th><th></th></tr></thead><tbody></tbody></table>`;
  const tb=el.querySelector('tbody');
  rows.forEach((r,i)=>{const tr=document.createElement('tr');if(r.uid===BOARD.uid)tr.className='me';
    const td=(t,c)=>{const x=document.createElement('td');x.textContent=t;if(c)x.className=c;tr.appendChild(x);return x;};
    td(String(i+1));td((ps[r.uid]&&ps[r.uid].name)||(r.uid===BOARD.uid?'Tu':'Pilota'));
    const car=td(`${String(r.car||'').replace(/^Vespera GT con /,'Vespera, ')}`);car.title=`${r.kg} kg · ${r.kw} kW · gomme ${(TRK_TIRES[r.tire]||TRK_TIRES[1]).n.toLowerCase()} · ${(TRK_WX[r.wx]||TRK_WX[0]).n.toLowerCase()}${r.assist?'':' · senza assistenze'}`;car.className='bcar';
    const tt=td(fmtLap(r.t));if(i){const s=document.createElement('small');s.className='dl';s.textContent=`+${dec(r.t-t0,2)}`;tt.appendChild(document.createElement('br'));tt.appendChild(s);}
    const b=document.createElement('td');if(r.gh){const bt=document.createElement('button');bt.className='x gh';bt.textContent='Insegui';bt.title='Insegui il fantasma di questo giro in pista';bt.onclick=()=>trkBoardGhost(r,(ps[r.uid]&&ps[r.uid].name)||'');b.appendChild(bt);}tr.appendChild(b);
    tb.appendChild(tr);});
}
async function trkBoardGhost(r,who){
  try{const d=await BOARD.db.doc(`board/${r.uid}/ghosts/${r.key}`).get();if(!d.exists)return;const g=d.data();if(!Array.isArray(g.pts)||g.track!==TRK.trackId)return;
    TRK.ghost={pts:trkGhostUnpack(g.pts),lap:g.lap,key:'*',foreign:true,track:g.track,who:who||'un altro pilota'};TRK.ghostOn=true;setPressed('trkGhost',true);
    const msg=`Fantasma di ${TRK.ghost.who} (${fmtLap(g.lap)}): parte quando passi il traguardo`;if(TRK.on)trkToast(TRK.p[0],msg,3.5);document.getElementById('trkBoardState').textContent=msg;}catch(e){}
}
setTimeout(trkBoardInit,0);
